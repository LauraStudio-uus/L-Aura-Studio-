(() => {
  "use strict";
  const form = document.getElementById("advisorForm");
  if (!form) return;
  const photo = document.getElementById("advisorPhoto");
  const preview = document.getElementById("advisorPreview");
  const mood = document.getElementById("advisorMood");
  const preference = document.getElementById("advisorPreference");
  const submit = document.getElementById("advisorSubmit");
  const status = document.getElementById("advisorStatus");
  const results = document.getElementById("advisorResults");
  const summary = document.getElementById("advisorSummary");
  const recommendations = document.getElementById("advisorRecommendations");
  const concepts = [
    { id: "angelic", name: "Angelic / Ethereal", href: "concept-angelic.html", styling: "Chất liệu bay nhẹ, makeup trong trẻo và ánh sáng mềm.", reason: "Một tạo hình thanh thoát, nhẹ nhàng với sắc độ sáng.", keywords: ["thiên thần", "trong trẻo", "thanh thoát", "tinh khôi", "ethereal", "angelic", "nhẹ nhàng"] },
    { id: "dark-gothic", name: "Dark / Gothic", href: "concept-dark-gothic.html", styling: "Trang phục tông trầm, makeup sắc nét và ánh sáng tương phản.", reason: "Khám phá chiều sâu, nét bí ẩn và cá tính trong khung hình.", keywords: ["bí ẩn", "cá tính", "bóng tối", "gothic", "dark", "mạnh mẽ", "màu trầm"] },
    { id: "floral-muse", name: "Floral / Muse", href: "concept-floral-muse.html", styling: "Hoa, chất liệu mềm, makeup tự nhiên và ánh sáng dịu.", reason: "Một câu chuyện lãng mạn, nữ tính và giàu cảm xúc.", keywords: ["nàng thơ", "hoa", "lãng mạn", "nữ tính", "muse", "floral", "dịu dàng"] },
    { id: "fairy-pastoral", name: "Fairy / Pastoral", href: "concept-fairy-pastoral.html", styling: "Đạo cụ thiên nhiên, trang phục bay nhẹ và tông màu tươi.", reason: "Không khí cổ tích, tự do và mộng mơ.", keywords: ["cổ tích", "dã ngoại", "thiên nhiên", "tự do", "mộng mơ", "fairy", "pastoral"] },
    { id: "high-fashion", name: "High Fashion / Glamour", href: "concept-high-fashion.html", styling: "Styling nổi bật, makeup có điểm nhấn và pose editorial.", reason: "Tập trung vào thần thái thời trang và hình ảnh nổi bật.", keywords: ["thời trang", "sang trọng", "glamour", "high fashion", "editorial", "quyền lực", "nổi bật"] },
    { id: "oriental-period", name: "Oriental / Period", href: "concept-oriental-period.html", styling: "Cổ phục, phụ kiện tinh tế và tạo dáng thanh lịch.", reason: "Vẻ đẹp cổ điển với dấu ấn phương Đông.", keywords: ["cổ trang", "cổ phục", "phương đông", "oriental", "period", "truyền thống", "thanh lịch"] }
  ];
  let previewUrl = "";

  function setStatus(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }
  function releasePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
  }
  function validatePhoto(file) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Hãy chọn ảnh JPG, PNG hoặc WebP.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Ảnh cần nhỏ hơn 8 MB.");
  }
  photo.addEventListener("change", () => {
    releasePreview();
    results.hidden = true;
    const file = photo.files?.[0];
    preview.hidden = !file;
    if (!file) {
      preview.removeAttribute("src");
      setStatus("");
      return;
    }
    try {
      validatePhoto(file);
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
      setStatus("Ảnh chỉ được xem trên thiết bị này.");
    } catch (error) {
      photo.value = "";
      preview.hidden = true;
      setStatus(error.message, true);
    }
  });
  window.addEventListener("pagehide", releasePreview, { once: true });

  async function readPalette(file) {
    validatePhoto(file);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Trình duyệt không thể đọc ảnh này.");
      context.drawImage(image, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let brightness = 0, saturation = 0, warmth = 0, green = 0, contrast = 0, count = 0;
      const levels = [];
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        brightness += light;
        saturation += (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
        warmth += (r - b) / 255;
        green += Math.max(0, g - (r + b) / 2) / 255;
        levels.push(light);
        count++;
      }
      if (!count) throw new Error("Không đọc được màu ảnh. Hãy chọn ảnh khác.");
      brightness /= count;
      saturation /= count;
      warmth /= count;
      green /= count;
      for (const level of levels) contrast += Math.abs(level - brightness);
      return { brightness, saturation, warmth, green, contrast: contrast / count };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function rankConcepts(selectedMood, words, palette) {
    const normalize = value => value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    const normalized = normalize(words);
    const scores = Object.fromEntries(concepts.map(concept => [concept.id, 0]));
    if (selectedMood && Object.prototype.hasOwnProperty.call(scores, selectedMood)) scores[selectedMood] += 8;
    concepts.forEach(concept => concept.keywords.forEach(keyword => {
      if (normalized.includes(normalize(keyword))) scores[concept.id] += 3;
    }));
    if (palette) {
      const { brightness, saturation, warmth, green, contrast } = palette;
      scores.angelic += brightness * 3 + (1 - saturation) * 1.5;
      scores["dark-gothic"] += (1 - brightness) * 3 + contrast * 3;
      scores["floral-muse"] += warmth * 2 + (1 - saturation) + brightness;
      scores["fairy-pastoral"] += green * 4 + brightness * 1.5;
      scores["high-fashion"] += saturation * 2 + contrast * 3;
      scores["oriental-period"] += warmth * 2 + (1 - saturation) * 1.5;
    }
    return concepts.map((concept, index) => ({ ...concept, score: scores[concept.id], index }))
      .sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3);
  }

  function showRecommendations(items, selectedMood, palette) {
    const signals = [];
    if (selectedMood) signals.push("phong cách bạn chọn");
    if (preference.value.trim()) signals.push("mô tả của bạn");
    if (palette) signals.push("bảng màu và độ sáng tổng thể của ảnh");
    summary.textContent = `Dựa trên ${signals.join(", ")}, đây là 3 hướng tạo hình để bạn bắt đầu. Ekip L’AURA có thể điều chỉnh theo ý tưởng thực tế của bạn.`;
    recommendations.replaceChildren();
    items.forEach((item, index) => {
      const card = document.createElement("article");
      const number = document.createElement("small");
      number.textContent = `GỢI Ý ${String(index + 1).padStart(2, "0")}`;
      const title = document.createElement("h3");
      title.textContent = item.name;
      const reason = document.createElement("p");
      reason.textContent = item.reason;
      const styling = document.createElement("p");
      styling.textContent = `Gợi ý tạo hình: ${item.styling}`;
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = "Xem album concept ↗";
      card.append(number, title, reason, styling, link);
      recommendations.append(card);
    });
    results.hidden = false;
    results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const file = photo.files?.[0];
    const selectedMood = mood.value;
    const words = preference.value.trim().slice(0, 400);
    if (!file && !selectedMood && !words) {
      setStatus("Hãy thêm ảnh, chọn phong cách hoặc mô tả ý tưởng của bạn.", true);
      mood.focus();
      return;
    }
    submit.disabled = true;
    results.hidden = true;
    try {
      setStatus(file ? "Đang xem bảng màu của ảnh trên thiết bị…" : "Đang ghép ý tưởng của bạn với 6 concept…");
      const palette = file ? await readPalette(file) : null;
      showRecommendations(rankConcepts(selectedMood, words, palette), selectedMood, palette);
      setStatus("Đã có gợi ý! Đây là công cụ theo quy tắc; ekip sẽ tư vấn tạo hình riêng cho bạn.");
    } catch (error) {
      setStatus(error.message || "Chưa thể đọc ảnh. Hãy thử ảnh khác hoặc chỉ chọn phong cách.", true);
    } finally {
      submit.disabled = false;
    }
  });
})();
