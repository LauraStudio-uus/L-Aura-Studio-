/* Nhạc nền chung: phát sau thao tác người dùng nếu trình duyệt chặn tự phát. */
(() => {
  "use strict";
  const config = window.LAURA_SUPABASE || {};
  const defaultTrack = { title: "L’AURA Ambient", url: "assets/laura-ambient.wav", storage_path: null };
  const audio = new Audio();
  audio.loop = true;
  audio.preload = "none";
  let track = defaultTrack;
  let enabled = true;
  let volume = 50;
  try {
    enabled = localStorage.getItem("lauraMusicEnabled") !== "off";
    const savedVolume = Number(localStorage.getItem("lauraMusicVolume"));
    if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100 &&
        localStorage.getItem("lauraMusicVolume") !== null) volume = savedVolume;
  } catch (_) {}
  audio.volume = volume / 100;
  let expanded = false;

  const controls = document.createElement("div");
  controls.className = "music-controls";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "music-toggle";
  button.setAttribute("aria-label", "Bật nhạc nền");
  button.setAttribute("aria-controls", "musicVolumePanel");
  const volumePanel = document.createElement("div");
  volumePanel.id = "musicVolumePanel";
  volumePanel.className = "music-volume-panel";
  volumePanel.hidden = true;
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.className = "music-volume";
  volumeSlider.min = "0";
  volumeSlider.max = "100";
  volumeSlider.step = "1";
  volumeSlider.value = String(volume);
  volumeSlider.setAttribute("aria-label", "Âm lượng nhạc nền");
  const volumeValue = document.createElement("output");
  volumeValue.className = "music-volume-value";
  volumeValue.textContent = `${volume}%`;
  volumePanel.append(volumeSlider, volumeValue);
  controls.append(button, volumePanel);
  document.body.append(controls);
  const feedback = document.createElement("p");
  feedback.className = "music-feedback";
  feedback.setAttribute("role", "status");
  feedback.hidden = true;
  document.body.append(feedback);

  function showPlaybackError(message) {
    feedback.textContent = message;
    feedback.hidden = false;
    const adminStatus = document.getElementById("musicAdminStatus");
    if (adminStatus) {
      adminStatus.textContent = message;
      adminStatus.dataset.error = "true";
    }
  }

  function renderButton() {
    const playing = !audio.paused;
    volumePanel.hidden = !expanded;
    button.textContent = expanded && playing ? "♫  Tắt nhạc" : playing ? "♫  Nhạc nền" : "♫  Bật nhạc";
    button.setAttribute("aria-label", expanded && playing ? "Tắt nhạc nền" :
      playing ? "Mở điều chỉnh âm lượng nhạc nền" : "Bật nhạc nền và mở âm lượng");
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute("aria-expanded", String(expanded));
    button.title = `${track.title} · ${expanded && playing ? "Nhấn để tắt" : playing ? "Nhấn để chỉnh âm lượng" : "Nhấn để phát"}`;
  }

  function savePreference() {
    try { localStorage.setItem("lauraMusicEnabled", enabled ? "on" : "off"); } catch (_) {}
  }
  volumeSlider.addEventListener("input", () => {
    volume = Math.max(0, Math.min(100, Number(volumeSlider.value) || 0));
    audio.volume = volume / 100;
    volumeValue.textContent = `${volume}%`;
    volumeValue.value = String(volume);
    try { localStorage.setItem("lauraMusicVolume", String(volume)); } catch (_) {}
  });

  async function play() {
    if (!enabled || !audio.src) return;
    try {
      await audio.play();
    } catch (error) {
      if (error?.name !== "NotAllowedError" && error?.name !== "AbortError") {
        showPlaybackError("Không phát được nhạc. URL có thể không trỏ trực tiếp tới tệp âm thanh hoặc nguồn đã chặn phát.");
      }
    }
    renderButton();
  }

  function setTrack(next) {
    if (!next?.url || next.url === track.url && audio.src) return;
    const wasPlaying = !audio.paused;
    track = next;
    feedback.hidden = true;
    audio.src = next.url;
    audio.load();
    if (enabled && wasPlaying) void play();
    renderButton();
    const current = document.getElementById("musicAdminCurrent");
    if (current) current.textContent = track.url === defaultTrack.url
      ? "Đang dùng bản nhạc mặc định."
      : track.storage_path
        ? `Bài đang chọn: ${track.title} (tệp Admin đã tải lên).`
        : `Bài đang chọn: ${track.title} (URL nhạc trực tiếp).`;
  }

  button.addEventListener("click", () => {
    if (expanded) {
      enabled = false;
      if (!audio.paused) audio.pause();
      expanded = false;
    } else {
      enabled = true;
      expanded = true;
      if (audio.paused) void play();
    }
    savePreference();
    renderButton();
  });
  document.addEventListener("pointerdown", event => {
    if (expanded && !controls.contains(event.target)) {
      expanded = false;
      renderButton();
    }
  }, { passive: true });
  audio.addEventListener("play", renderButton);
  audio.addEventListener("playing", () => { feedback.hidden = true; renderButton(); });
  audio.addEventListener("pause", renderButton);
  audio.addEventListener("ended", renderButton);
  audio.addEventListener("error", () => {
    showPlaybackError(track.url === defaultTrack.url
      ? "Không tải được nhạc mặc định. Hãy tải lại trang."
      : "Không phát được URL nhạc này. Admin hãy dùng link trực tiếp tới tệp .mp3 hoặc tải MP3 từ máy.");
    renderButton();
  });
  audio.addEventListener("loadedmetadata", () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("lauraMusicPosition") || "null");
      if (saved?.url === track.url && Number.isFinite(saved.time) && saved.time < audio.duration) {
        audio.currentTime = saved.time;
      }
    } catch (_) {}
  });
  window.addEventListener("pagehide", () => {
    try { sessionStorage.setItem("lauraMusicPosition", JSON.stringify({ url: track.url, time: audio.currentTime || 0 })); } catch (_) {}
  });

  function onGesture(event) {
    if (!enabled || !audio.paused || button.contains(event.target)) return;
    void play();
  }
  document.addEventListener("pointerdown", onGesture, { passive: true });
  document.addEventListener("keydown", onGesture);

  function validConfig() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "") &&
      config.publishableKey && !String(config.publishableKey).includes("YOUR_");
  }
  function validAudioUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !!url.hostname && !url.username && !url.password &&
        /\.(mp3|ogg|wav|m4a|aac|opus)$/i.test(url.pathname);
    } catch (_) {
      return false;
    }
  }
  async function readRemoteTrack() {
    if (!validConfig()) return null;
    const response = await fetch(
      `${config.url}/rest/v1/site_settings?key=eq.background_music&select=title,audio_url,storage_path,updated_at&limit=1`,
      { headers: { apikey: config.publishableKey }, cache: "no-store" }
    );
    if (!response.ok) throw new Error("Không đọc được cấu hình nhạc nền.");
    const [row] = await response.json();
    if (!row?.audio_url) return null;
    if (!validAudioUrl(row.audio_url)) {
      throw new Error("URL nhạc đã lưu không phải link trực tiếp tới tệp âm thanh.");
    }
    return { title: row.title || "Nhạc nền L’AURA", url: row.audio_url, storage_path: row.storage_path || null };
  }
  async function refreshTrack() {
    try {
      setTrack(await readRemoteTrack() || defaultTrack);
    } catch (error) {
      setTrack(defaultTrack);
      if (error.message.includes("không phải link trực tiếp")) showPlaybackError(
        "URL nhạc đã lưu là trang web, không phải tệp âm thanh. Admin hãy thay bằng link .mp3 trực tiếp hoặc tải MP3 từ máy."
      );
    }
  }

  setTrack(defaultTrack);
  if (enabled) void play();
  void refreshTrack();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshTrack();
  });

  const form = document.getElementById("musicAdminForm");
  if (!form) return;
  const fileInput = document.getElementById("musicFile");
  const urlInput = document.getElementById("musicUrl");
  const titleInput = document.getElementById("musicTitle");
  const saveButton = document.getElementById("musicSave");
  const resetButton = document.getElementById("musicReset");
  const adminStatus = document.getElementById("musicAdminStatus");
  const say = (message, error = false) => {
    adminStatus.textContent = message;
    adminStatus.dataset.error = String(error);
  };
  async function adminClient() {
    const client = window.lauraSupabase;
    if (!client) throw new Error("Chưa kết nối Supabase. Kiểm tra supabase-config.js.");
    const { data, error } = await client.rpc("is_admin");
    if (error || data !== true) throw new Error("Hãy đăng nhập bằng tài khoản Admin.");
    return client;
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const file = fileInput.files?.[0];
    const externalUrl = urlInput.value.trim();
    if (!file && !externalUrl) {
      say("Hãy chọn tệp MP3 hoặc dán URL nhạc trực tiếp.", true);
      return;
    }
    if (file) {
      if (!/\.mp3$/i.test(file.name) || !["audio/mpeg", "audio/mp3", ""].includes(file.type)) {
        say("Hãy chọn một tệp MP3.", true);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        say("Tệp MP3 cần nhỏ hơn 15 MB.", true);
        return;
      }
    } else if (!validAudioUrl(externalUrl)) {
      say("URL phải trỏ trực tiếp tới tệp .mp3, .ogg, .wav, .m4a, .aac hoặc .opus qua HTTPS. Link trang Zing MP3/YouTube không phát được.", true);
      return;
    }
    saveButton.disabled = true;
    resetButton.disabled = true;
    let newPath = "";
    try {
      const client = await adminClient();
      say(file ? "Đang tải nhạc lên..." : "Đang lưu URL nhạc...");
      const { data: oldRows, error: readError } = await client.from("site_settings")
        .select("storage_path").eq("key", "background_music").limit(1);
      if (readError) throw readError;
      const oldPath = oldRows?.[0]?.storage_path;
      let url = externalUrl;
      if (file) {
        newPath = `background/${crypto.randomUUID()}.mp3`;
        const { error: uploadError } = await client.storage.from("site-audio")
          .upload(newPath, file, { contentType: "audio/mpeg", upsert: false });
        if (uploadError) throw uploadError;
        url = client.storage.from("site-audio").getPublicUrl(newPath).data.publicUrl;
      }
      const title = titleInput.value.trim().slice(0, 100) ||
        (file ? file.name.replace(/\.mp3$/i, "") : "Nhạc nền L’AURA");
      const { error: saveError } = await client.from("site_settings").upsert({
        key: "background_music", title, audio_url: url, storage_path: newPath || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });
      if (saveError) throw saveError;
      if (oldPath && oldPath !== newPath) {
        const { error: removeError } = await client.storage.from("site-audio").remove([oldPath]);
        if (removeError) console.warn("Không thể xóa tệp nhạc cũ:", removeError);
      }
      setTrack({ title, url, storage_path: newPath || null });
      fileInput.value = "";
      urlInput.value = "";
      say(file ? "Đã lưu nhạc mới. Khách sẽ nghe bài này khi mở website." :
        "Đã lưu URL nhạc. Hãy thử phát để kiểm tra liên kết cho phép nghe trực tiếp.");
    } catch (error) {
      if (newPath && window.lauraSupabase) await window.lauraSupabase.storage.from("site-audio").remove([newPath]);
      say(`${error.message || "Không thể lưu nhạc."} Nếu chưa tạo bảng và bucket, chạy database/background-music.sql trong Supabase.`, true);
    } finally {
      saveButton.disabled = false;
      resetButton.disabled = false;
    }
  });
  resetButton.addEventListener("click", async () => {
    resetButton.disabled = true;
    saveButton.disabled = true;
    try {
      const client = await adminClient();
      const { data: oldRows, error: readError } = await client.from("site_settings")
        .select("storage_path").eq("key", "background_music").limit(1);
      if (readError) throw readError;
      const { error } = await client.from("site_settings").delete().eq("key", "background_music");
      if (error) throw error;
      const oldPath = oldRows?.[0]?.storage_path;
      if (oldPath) await client.storage.from("site-audio").remove([oldPath]);
      setTrack(defaultTrack);
      say("Đã chuyển về nhạc mặc định.");
    } catch (error) {
      say(error.message || "Không thể khôi phục nhạc mặc định.", true);
    } finally {
      resetButton.disabled = false;
      saveButton.disabled = false;
    }
  });
})();
