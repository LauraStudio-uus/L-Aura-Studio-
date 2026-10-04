import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { Pool } from "pg";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const uploadDir = join(root, "uploads");
await mkdir(uploadDir, { recursive: true });

const required = ["DATABASE_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "SESSION_SECRET"];
for (const name of required) if (!process.env[name]) throw new Error(`Thiếu biến môi trường ${name}`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});
const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());
app.use(express.json({ limit: "40mb" }));
app.use("/uploads", express.static(uploadDir, { maxAge: "30d", immutable: true }));

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token = "") {
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  const expected = createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  if (!safeEqual(signature, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return payload.role === "admin" && payload.exp > Date.now();
  } catch { return false; }
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  if (!verifyToken(token)) return res.status(401).json({ error: "Phiên quản trị không hợp lệ." });
  next();
}

app.get("/api/health", async (_req, res, next) => {
  try { await pool.query("select 1"); res.json({ ok: true }); } catch (error) { next(error); }
});

app.post("/api/admin/login", (req, res) => {
  const valid = safeEqual(req.body.email, process.env.ADMIN_EMAIL) && safeEqual(req.body.password, process.env.ADMIN_PASSWORD);
  if (!valid) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
  res.json({ token: signToken({ role: "admin", exp: Date.now() + 8 * 60 * 60 * 1000 }) });
});

app.get("/api/concepts", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      select c.slug, c.title, c.label,
        coalesce(json_agg(json_build_object('id', i.id, 'url', i.image_url, 'position', i.position)
          order by i.position) filter (where i.id is not null), '[]') as images
      from concepts c left join concept_images i on i.concept_slug = c.slug
      group by c.slug order by c.slug`);
    res.json(rows);
  } catch (error) { next(error); }
});

function decodeDataImage(source) {
  const match = String(source).match(/^data:(image\/(?:jpeg|png|webp|avif));base64,([a-z0-9+/=]+)$/i);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 12 * 1024 * 1024) throw new Error("Ảnh vượt quá 12 MB.");
  const extension = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" }[match[1].toLowerCase()];
  return { buffer, extension };
}

app.put("/api/concepts/:slug/album", requireAdmin, async (req, res, next) => {
  const images = Array.isArray(req.body.images) ? [...new Set(req.body.images.map(String))] : [];
  if (!images.length || images.length > 20) return res.status(400).json({ error: "Album cần từ 1 đến 20 ảnh." });
  const client = await pool.connect();
  const newFiles = [];
  try {
    await client.query("begin");
    const concept = await client.query("select slug from concepts where slug = $1", [req.params.slug]);
    if (!concept.rowCount) { await client.query("rollback"); return res.status(404).json({ error: "Concept không tồn tại." }); }
    const previous = await client.query("select storage_path from concept_images where concept_slug = $1", [req.params.slug]);
    await client.query("delete from concept_images where concept_slug = $1", [req.params.slug]);
    for (let position = 0; position < images.length; position += 1) {
      const source = images[position];
      const decoded = decodeDataImage(source);
      let imageUrl = source;
      let storagePath = null;
      if (decoded) {
        const filename = `${randomUUID()}${decoded.extension}`;
        storagePath = join(uploadDir, filename);
        await writeFile(storagePath, decoded.buffer);
        newFiles.push(storagePath);
        imageUrl = `/uploads/${filename}`;
      } else {
        const url = new URL(source);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL ảnh không hợp lệ.");
      }
      await client.query("insert into concept_images (concept_slug, image_url, storage_path, position) values ($1,$2,$3,$4)", [req.params.slug, imageUrl, storagePath, position]);
    }
    await client.query("update concepts set updated_at = now() where slug = $1", [req.params.slug]);
    await client.query("commit");
    for (const row of previous.rows) if (row.storage_path) await unlink(row.storage_path).catch(() => {});
    res.json({ ok: true });
  } catch (error) {
    await client.query("rollback").catch(() => {});
    for (const path of newFiles) await unlink(path).catch(() => {});
    next(error);
  } finally { client.release(); }
});

app.delete("/api/concepts/:slug/album", requireAdmin, async (req, res, next) => {
  try {
    const previous = await pool.query("delete from concept_images where concept_slug = $1 returning storage_path", [req.params.slug]);
    for (const row of previous.rows) if (row.storage_path) await unlink(row.storage_path).catch(() => {});
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post("/api/bookings", async (req, res, next) => {
  const { name, phone, service = "", date = null, message = "" } = req.body;
  if (!String(name || "").trim() || !String(phone || "").trim()) return res.status(400).json({ error: "Vui lòng nhập họ tên và số điện thoại." });
  try {
    const { rows } = await pool.query("insert into bookings (name, phone, service, preferred_date, message) values ($1,$2,$3,$4,$5) returning id, created_at", [String(name).trim(), String(phone).trim(), service, date || null, message]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

app.get("/api/bookings", requireAdmin, async (_req, res, next) => {
  try { const { rows } = await pool.query("select * from bookings order by created_at desc"); res.json(rows); } catch (error) { next(error); }
});
app.patch("/api/bookings/:id", requireAdmin, async (req, res, next) => {
  try { await pool.query("update bookings set status = $1 where id = $2", [req.body.status === "new" ? "new" : "read", req.params.id]); res.json({ ok: true }); } catch (error) { next(error); }
});
app.delete("/api/bookings/:id", requireAdmin, async (req, res, next) => {
  try { await pool.query("delete from bookings where id = $1", [req.params.id]); res.json({ ok: true }); } catch (error) { next(error); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API không tồn tại." }));
app.use(express.static(join(root, "public"), { extensions: ["html"], maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Máy chủ gặp lỗi." : error.message });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`L’AURA STUDIO đang chạy tại http://localhost:${port}`));
