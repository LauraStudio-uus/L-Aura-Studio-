/* Đồng bộ dữ liệu công khai với Node/PostgreSQL. Website vẫn dùng localStorage khi API chưa được cài đặt. */
(() => {
  const TOKEN_KEY = "lauraAdminApiToken";
  let apiOnline = false;

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Không thể kết nối máy chủ.");
    return data;
  }

  async function refreshConcepts() {
    const concepts = await request("/api/concepts");
    const cache = Object.fromEntries(concepts.map(concept => [concept.slug, {
      images: (concept.images || []).map(image => image.url),
      updatedAt: new Date().toISOString()
    }]));
    localStorage.setItem("lauraStudioConceptImages", JSON.stringify(cache));
    if (typeof renderConceptImages === "function") renderConceptImages();
    if (typeof renderConceptDetailImage === "function") renderConceptDetailImage();
    if (typeof renderAdminConcepts === "function") renderAdminConcepts();
  }

  async function refreshBookings() {
    const rows = await request("/api/bookings");
    const contacts = rows.map(row => ({
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
      await request("/api/health");
      apiOnline = true;
      await refreshConcepts();
    } catch (_) {
      apiOnline = false;
      console.info("L’AURA API chưa được cấu hình; website đang dùng dữ liệu cục bộ.");
    }
  }

  document.getElementById("adminLoginForm")?.addEventListener("submit", async event => {
    if (!apiOnline) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = document.getElementById("adminError");
    try {
      const result = await request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("adminEmail").value.trim(),
          password: document.getElementById("adminPassword").value
        })
      });
      sessionStorage.setItem(TOKEN_KEY, result.token);
      if (typeof setAdminAuthenticated === "function") setAdminAuthenticated();
      if (error) error.textContent = "";
      if (typeof showDashboard === "function") showDashboard();
      await refreshBookings();
    } catch (loginError) {
      if (error) error.textContent = loginError.message;
    }
  }, true);

  document.getElementById("adminLogout")?.addEventListener("click", () => sessionStorage.removeItem(TOKEN_KEY));

  document.getElementById("conceptAdminForm")?.addEventListener("submit", async event => {
    if (!apiOnline) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const note = document.getElementById("conceptAdminNote");
    const conceptId = document.getElementById("conceptEditId").value;
    const urls = document.getElementById("conceptImageUrls").value.split(/\n+/).map(value => value.trim()).filter(Boolean);
    const album = [...new Set([...(typeof pendingConceptImages === "undefined" ? [] : pendingConceptImages), ...urls])];
    if (!album.length) { if (note) note.textContent = "Vui lòng chọn ít nhất một ảnh."; return; }
    try {
      if (note) note.textContent = "Đang tải album lên máy chủ...";
      await request(`/api/concepts/${encodeURIComponent(conceptId)}/album`, { method: "PUT", body: JSON.stringify({ images: album }) });
      await refreshConcepts();
      if (typeof closeConceptEditor === "function") closeConceptEditor();
    } catch (saveError) {
      if (note) note.textContent = saveError.message;
    }
  }, true);

  document.getElementById("conceptAdminList")?.addEventListener("click", async event => {
    if (!apiOnline) return;
    const remove = event.target.closest("[data-concept-remove]");
    if (!remove) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!confirm("Xóa toàn bộ album ảnh của concept này?")) return;
    try {
      await request(`/api/concepts/${encodeURIComponent(remove.dataset.conceptRemove)}/album`, { method: "DELETE" });
      await refreshConcepts();
      if (typeof closeConceptEditor === "function") closeConceptEditor();
    } catch (error) { alert(error.message); }
  }, true);

  document.getElementById("bookingForm")?.addEventListener("submit", async event => {
    if (!apiOnline) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.currentTarget;
    const note = document.getElementById("formNote");
    const values = Object.fromEntries(new FormData(form));
    try {
      await request("/api/bookings", { method: "POST", body: JSON.stringify(values) });
      if (note) note.textContent = `Cảm ơn ${values.name}! L’AURA đã nhận yêu cầu và sẽ liên hệ lại sớm.`;
      form.reset();
    } catch (error) {
      if (note) note.textContent = error.message;
    }
  }, true);

  document.getElementById("adminContactList")?.addEventListener("click", async event => {
    if (!apiOnline) return;
    const read = event.target.closest("[data-read]");
    const remove = event.target.closest("[data-delete-contact]");
    if (!read && !remove) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (read) await request(`/api/bookings/${encodeURIComponent(read.dataset.read)}`, { method: "PATCH", body: JSON.stringify({ status: read.classList.contains("active") ? "new" : "read" }) });
      if (remove && confirm("Xóa yêu cầu liên hệ này?")) await request(`/api/bookings/${encodeURIComponent(remove.dataset.deleteContact)}`, { method: "DELETE" });
      await refreshBookings();
    } catch (error) { alert(error.message); }
  }, true);

  bootstrap();
})();
