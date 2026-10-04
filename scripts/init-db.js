import "dotenv/config";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL trong .env");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
});
const sql = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
await pool.query(sql);
await pool.end();
console.log("Database L’AURA đã được khởi tạo.");
