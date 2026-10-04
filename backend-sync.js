/* Đồng bộ GitHub Pages với Supabase Database, Auth và Storage. */
(() => {
  const config = window.LAURA_SUPABASE || {};
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "")
    && config.publishableKey
    && !String(config.publishableKey).includes("YOUR_")
    && window.supabase?.createClient;

  if (!ready) {
    console.info("Chưa cấu hình Supabase trong supabase-config.js; bản xem trước đang dùng dữ liệu cục bộ.");
    document.documentElement.dataset.supabase = "unconfigured";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const bucket = config.storageBucket || "concept-images";
  window.lauraSupabase = client;
  document.documentElement.dataset.supabase = "connected";

  const message = error => error?.message || "Không thể kết nối Supabase.";
  const postCache = "ddStudioPosts";
  const portfolioCache = "lauraStudioPortfolio";
  const uuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "");

  async function uploadImage(file, folder) {
    if (!file) return "";
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 12 * 1024 * 1024) {
      throw new Error('Chỉ nhận ảnh JPG, PNG, WebP, AVIF tối đa 12 MB.');
    }
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[file.type];
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from('site-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return client.storage.from('site-images').getPublicUrl(path).data.publicUrl;
  }

  async function refreshPosts() {
    const { data, error } = await client.from('posts').select('id,title,category,excerpt,content,image_url,created_at').eq('published', true).order('created_at', { ascending: false });
    if (error) throw error;
    localStorage.setItem(postCache, JSON.stringify((data || []).map(row => ({
      id: row.id, title: row.title, category: row.category || '', excerpt: row.excerpt || '',
      content: row.content || '', image: row.image_url || '', date: new Date(row.created_at).toLocaleDateString('vi-VN')
    }))));
    window.lauraPostsLoaded = true;
    if (typeof renderBlog === 'function') renderBlog(document.querySelector('.filter-btn.active')?.dataset.category || 'all');
    if (typeof renderAdminPosts === 'function') renderAdminPosts();
  }

  async function refreshPortfolio() {
    const { data, error } = await client.from('portfolio_items').select('id,title,category,page,layout,image_url').eq('published', true).order('position').order('created_at', { ascending: false });
    if (error) throw error;
    localStorage.setItem(portfolioCache, JSON.stringify((data || []).map(row => ({
      id: row.id, title: row.title, category: row.category || '', page: row.page || 'portfolio',
      layout: row.layout || 'normal', image: row.image_url
    }))));
    window.lauraPortfolioLoaded = true;
    if (typeof renderDynamicPortfolio === 'function') renderDynamicPortfolio();
    if (typeof renderAdminPortfolio === 'function') renderAdminPortfolio();
  }

  window.lauraCloud = {
    async savePost(payload, editId, file) {
      if (!(await requireAdmin())) throw new Error('Vui lòng đăng nhập Admin.');
      const image = await uploadImage(file, 'posts') || payload.image;
      const row = { title: payload.title, category: payload.category, excerpt: payload.excerpt,
        content: payload.content, image_url: image, published: true, updated_at: new Date().toISOString() };
      if (uuid(editId)) {
        const { error } = await client.from('posts').update(row).eq('id', editId);
        if (error) throw error;
      } else {
        row.slug = `post-${crypto.randomUUID()}`;
        const { error } = await client.from('posts').insert(row);
        if (error) throw error;
      }
      await refreshPosts();
    },
    async deletePost(id) {
      if (!(await requireAdmin())) throw new Error('Vui lòng đăng nhập Admin.');
      if (!uuid(id)) throw new Error('Bài viết này chỉ có trên máy hiện tại. Hãy tải lại trang để xem dữ liệu chung.');
      const { error } = await client.from('posts').delete().eq('id', id);
      if (error) throw error;
      await refreshPosts();
    },
    async savePortfolio(item, file) {
      if (!(await requireAdmin())) throw new Error('Vui lòng đăng nhập Admin.');
      const image = await uploadImage(file, 'portfolio') || item.image;
      if (!image) throw new Error('Hãy chọn ảnh từ máy hoặc nhập URL ảnh.');
      const row = { title: item.title, category: item.category, page: item.page,
        layout: item.layout, image_url: image, published: true };
      if (uuid(item.id)) {
        const { error } = await client.from('portfolio_items').update(row).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await client.from('portfolio_items').insert(row);
        if (error) throw error;
      }
      await refreshPortfolio();
    },
    async deletePortfolio(id) {
      if (!(await requireAdmin())) throw new Error('Vui lòng đăng nhập Admin.');
      if (!uuid(id)) throw new Error('Ảnh này chỉ có trên máy hiện tại. Hãy tải lại trang để xem dữ liệu chung.');
      const { error } = await client.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;
      await refreshPortfolio();
    }
  };

  async function requireAdmin() {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return false;
    const { data, error } = await client.rpc("is_admin");
    if (error) throw error;
    return data === true;
  }

  async function refreshConcepts() {
    const { data, error } = await client
      .from("concept_images")
      .select("id,concept_slug,image_url,storage_path,position")
      .order("concept_slug")
      .order("position");
    if (error) throw error;

    const cache = {};
    for (const row of data || []) {
      if (!cache[row.concept_slug]) cache[row.concept_slug] = { images: [], updatedAt: new Date().toISOString() };
      cache[row.concept_slug].images.push(row.image_url);
    }
    localStorage.setItem("lauraStudioConceptImages", JSON.stringify(cache));
    if (typeof renderConceptImages === "function") renderConceptImages();
    if (typeof renderConceptDetailImage === "function") renderConceptDetailImage();
    if (typeof renderAdminConcepts === "function") renderAdminConcepts();
  }

  async function refreshBookings() {
    const { data, error } = await client.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const contacts = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      service: row.service || "",
      date: row.preferred_date || "",
      message: row.message || "",
      createdAt: new Date(row.created_at).toLocaleString("vi-VN"),
      status: row.status === "new" ? "new" : "read"
    }));
    localStorage.setItem("ddStudioContacts", JSON.stringify(contacts));
    if (typeof renderAdminContacts === "function") renderAdminContacts();
  }

  async function bootstrap() {
    try {
      const results = await Promise.allSettled([refreshConcepts(), refreshPosts(), refreshPortfolio()]);
      for (const result of results) if (result.status === 'rejected') console.error('Lỗi tải nội dung Supabase:', result.reason);
      if (await requireAdmin()) {
        if (typeof setAdminAuthenticated === "function") setAdminAuthenticated();
        await refreshBookings();
      } else if (typeof clearAdminAuthenticated === "function") {
        clearAdminAuthenticated();
      }
    } catch (error) {
      console.error("Lỗi khởi tạo Supabase:", error);
    }
  }

  // Cập nhật nội dung khi khách quay lại tab sau khi Admin đăng hoặc xóa.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      Promise.allSettled([refreshPosts(), refreshPortfolio()]).then(results => {
        for (const result of results) if (result.status === 'rejected') console.error('Lỗi cập nhật nội dung:', result.reason);
      });
    }
  });

  document.getElementById("adminLoginForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const errorBox = document.getElementById("adminError");
    const button = event.currentTarget.querySelector('button[type="submit"]');
    try {
      if (button) button.disabled = true;
      if (errorBox) errorBox.textContent = "Đang đăng nhập...";
      const email = document.getElementById("adminEmail").value.trim();
      const password = document.getElementById("adminPassword").value;
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!(await requireAdmin())) {
        await client.auth.signOut();
        throw new Error("Tài khoản này chưa được cấp quyền Admin.");
      }
      if (typeof setAdminAuthenticated === "function") setAdminAuthenticated();
      if (errorBox) errorBox.textContent = "";
      if (typeof showDashboard === "function") showDashboard();
      await Promise.all([refreshBookings(), refreshPosts(), refreshPortfolio()]);
    } catch (error) {
      if (typeof clearAdminAuthenticated === "function") clearAdminAuthenticated();
      if (errorBox) errorBox.textContent = message(error);
    } finally {
      if (button) button.disabled = false;
    }
  }, true);

  document.getElementById("adminLogout")?.addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    await client.auth.signOut();
    if (typeof clearAdminAuthenticated === "function") clearAdminAuthenticated();
    if (typeof showAdminLogin === "function") showAdminLogin();
  }, true);

  function dataUrlToBlob(source) {
    const parts = source.split(",");
    const mime = parts[0].match(/data:([^;]+)/)?.[1] || "image/jpeg";
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  async function saveConceptAlbum(conceptId, sources) {
    const { data: oldRows, error: oldError } = await client
      .from("concept_images")
      .select("image_url,storage_path")
      .eq("concept_slug", conceptId);
    if (oldError) throw oldError;

    const oldByUrl = new Map((oldRows || []).map(row => [row.image_url, row.storage_path]));
    const nextRows = [];
    const newPaths = [];

    try {
      for (let position = 0; position < sources.length; position += 1) {
        const source = sources[position];
        let imageUrl = source;
        let storagePath = oldByUrl.get(source) || null;

        if (source.startsWith("data:image/")) {
          const blob = dataUrlToBlob(source);
          const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
          storagePath = `${conceptId}/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, blob, {
            contentType: blob.type,
            cacheControl: "31536000",
            upsert: false
          });
          if (uploadError) throw uploadError;
          newPaths.push(storagePath);
          imageUrl = client.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
        }

        nextRows.push({ concept_slug: conceptId, image_url: imageUrl, storage_path: storagePath, position });
      }

      const { error: deleteError } = await client.from("concept_images").delete().eq("concept_slug", conceptId);
      if (deleteError) throw deleteError;
      const { error: insertError } = await client.from("concept_images").insert(nextRows);
      if (insertError) throw insertError;

      const retained = new Set(nextRows.map(row => row.storage_path).filter(Boolean));
      const removed = (oldRows || []).map(row => row.storage_path).filter(path => path && !retained.has(path));
      if (removed.length) await client.storage.from(bucket).remove(removed);
    } catch (error) {
      if (newPaths.length) await client.storage.from(bucket).remove(newPaths);
      throw error;
    }
  }

  document.getElementById("conceptAdminForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const note = document.getElementById("conceptAdminNote");
    const conceptId = document.getElementById("conceptEditId").value;
    const urls = document.getElementById("conceptImageUrls").value.split(/\n+/).map(value => value.trim()).filter(Boolean);
    const album = [...new Set([...(typeof pendingConceptImages === "undefined" ? [] : pendingConceptImages), ...urls])];
    if (!album.length) {
      if (note) note.textContent = "Vui lòng chọn ít nhất một ảnh.";
      return;
    }
    try {
      if (!(await requireAdmin())) throw new Error("Phiên Admin đã hết hạn. Vui lòng đăng nhập lại.");
      if (note) note.textContent = `Đang tải ${album.length} ảnh lên Supabase...`;
      await saveConceptAlbum(conceptId, album);
      await refreshConcepts();
      if (typeof closeConceptEditor === "function") closeConceptEditor();
    } catch (error) {
      if (note) note.textContent = message(error);
    }
  }, true);

  document.getElementById("conceptAdminList")?.addEventListener("click", async event => {
    const remove = event.target.closest("[data-concept-remove]");
    if (!remove) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!confirm("Xóa toàn bộ album ảnh của concept này?")) return;
    try {
      if (!(await requireAdmin())) throw new Error("Phiên Admin đã hết hạn.");
      const slug = remove.dataset.conceptRemove;
      const { data: rows, error: readError } = await client.from("concept_images").select("storage_path").eq("concept_slug", slug);
      if (readError) throw readError;
      const { error } = await client.from("concept_images").delete().eq("concept_slug", slug);
      if (error) throw error;
      const paths = (rows || []).map(row => row.storage_path).filter(Boolean);
      if (paths.length) await client.storage.from(bucket).remove(paths);
      await refreshConcepts();
      if (typeof closeConceptEditor === "function") closeConceptEditor();
    } catch (error) {
      alert(message(error));
    }
  }, true);

  document.getElementById("bookingForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.currentTarget;
    const note = document.getElementById("formNote");
    const values = Object.fromEntries(new FormData(form));
    try {
      if (note) note.textContent = "Đang gửi yêu cầu...";
      const { error } = await client.from("bookings").insert({
        name: String(values.name || "").trim(),
        phone: String(values.phone || "").trim(),
        service: String(values.service || "").trim(),
        preferred_date: values.date || null,
        message: String(values.message || "").trim()
      });
      if (error) throw error;
      if (note) note.textContent = `Cảm ơn ${values.name}! L’AURA đã nhận yêu cầu và sẽ liên hệ lại sớm.`;
      form.reset();
    } catch (error) {
      if (note) note.textContent = message(error);
    }
  }, true);

  document.getElementById("adminContactList")?.addEventListener("click", async event => {
    const read = event.target.closest("[data-read]");
    const remove = event.target.closest("[data-delete-contact]");
    if (!read && !remove) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (!(await requireAdmin())) throw new Error("Phiên Admin đã hết hạn.");
      if (read) {
        const current = getContacts().find(item => String(item.id) === String(read.dataset.read));
        const status = current?.status === "new" ? "read" : "new";
        const { error } = await client.from("bookings").update({ status }).eq("id", read.dataset.read);
        if (error) throw error;
      }
      if (remove && confirm("Xóa yêu cầu liên hệ này?")) {
        const { error } = await client.from("bookings").delete().eq("id", remove.dataset.deleteContact);
        if (error) throw error;
      }
      await refreshBookings();
    } catch (error) {
      alert(message(error));
    }
  }, true);

  bootstrap();
})();
