(function () {
  const TP = window.TP;
  TP.ensureSpace();
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sampleMentions = [
    { platform: "Instagram", handle: "@wargabogor.id", date: "07 Okt 2026 · 09.42", sentiment: "positif", topic: "Layanan", text: "Terima kasih petugas Tirta Pakuan, laporan gangguan di kawasan Baranangsiang cepat ditindaklanjuti." },
    { platform: "X", handle: "@bogor_update", date: "07 Okt 2026 · 08.16", sentiment: "negatif", topic: "Gangguan air", text: "Sudah dua hari aliran air kecil di sekitar Tanah Sareal. Mohon ada info jadwal perbaikan dari Tirta Pakuan." },
    { platform: "Facebook", handle: "Warga Bogor Tengah", date: "06 Okt 2026 · 19.30", sentiment: "netral", topic: "Informasi", text: "Ada yang tahu cara cek status pengaduan dan nomor tiket Tirta Pakuan?" },
    { platform: "TikTok", handle: "@bogorcerita", date: "06 Okt 2026 · 16.08", sentiment: "positif", topic: "Kualitas layanan", text: "Petugas datang sesuai jadwal untuk mengecek meter air. Prosesnya jelas dan ramah." },
    { platform: "YouTube", handle: "Komentar kanal lokal", date: "06 Okt 2026 · 13.51", sentiment: "negatif", topic: "Tagihan", text: "Mohon penjelasan rincian tagihan bulan ini, nominalnya naik cukup banyak." },
    { platform: "Instagram", handle: "@bogor_hari_ini", date: "05 Okt 2026 · 20.15", sentiment: "netral", topic: "Gangguan air", text: "Info pemeliharaan jaringan air di wilayah Bogor Timur malam ini." },
    { platform: "X", handle: "@suarabogor", date: "05 Okt 2026 · 11.20", sentiment: "positif", topic: "Informasi", text: "Pengumuman distribusi air tangki membantu warga yang terdampak pekerjaan pipa." },
    { platform: "Facebook", handle: "Forum Warga Bogor", date: "04 Okt 2026 · 17.44", sentiment: "negatif", topic: "Gangguan air", text: "Semoga penanganan kebocoran pipa bisa lebih cepat karena jalan ikut terdampak." },
    { platform: "TikTok", handle: "@kotabogor", date: "04 Okt 2026 · 10.05", sentiment: "netral", topic: "Layanan", text: "Video edukasi cara membaca meter pelanggan Tirta Pakuan." }
  ];
  const platforms = ["Instagram", "X", "Facebook", "TikTok", "YouTube"];
  let mentions = sampleMentions.slice();
  let activities = ["Dashboard admin demo dibuka", "Data pengguna dan tiket disinkronkan dari penyimpanan lokal"];
  const statuses = ["Baru", "Verifikasi Data", "Verifikasi", "Survey Lapangan", "Penanganan", "Menunggu Pembayaran", "Selesai", "Ditolak", "Dibatalkan"];

  function dbGet() { return TP.DB.get(); }
  function usersFrom(db) {
    const seeded = [
      { name: "Budi Santoso", no: "3124508221", zone: "Zona 3 – Baranangsiang", status: "Aktif" },
      { name: "Siti Rahmawati", no: "3124508174", zone: "Zona 1 – Tanah Sareal", status: "Aktif" },
      { name: "Andi Pratama", no: "3124509062", zone: "Zona 2 – Bogor Timur", status: "Aktif" },
      { name: "Dewi Lestari", no: "3124507355", zone: "Zona 4 – Bogor Utara", status: "Aktif" },
      { name: "Rizky Firmansyah", no: "3124506428", zone: "Zona 1 – Tanah Sareal", status: "Aktif" }
    ];
    db.tickets.forEach((t) => {
      if (!seeded.some((u) => u.name.toLowerCase() === (t.nama || "").toLowerCase())) seeded.push({ name: t.nama || "Pengguna demo", no: t.noPelanggan || "—", zone: t.zona || "—", status: "Aktif" });
    });
    return seeded.map((u) => ({ ...u, tickets: db.tickets.filter((t) => (t.nama || "").toLowerCase() === u.name.toLowerCase() || (u.no !== "—" && t.noPelanggan === u.no)).length }));
  }
  function chip(status) {
    const cls = ({ Baru: "blue", "Verifikasi Data": "blue", Verifikasi: "blue", "Survey Lapangan": "amber", Penanganan: "amber", "Menunggu Pembayaran": "amber", Selesai: "teal", Ditolak: "danger", Dibatalkan: "gray" })[status] || "gray";
    return `<span class="chip ${cls}">${escapeHtml(status || "Baru")}</span>`;
  }
  function openView(name) {
    document.querySelectorAll(".admin-view").forEach((el) => el.classList.toggle("active", el.id === `view-${name}`));
    document.querySelectorAll(".admin-nav").forEach((el) => el.classList.toggle("active", el.dataset.view === name));
    if (name === "tickets") renderTickets();
    if (name === "users") renderUsers();
    if (name === "perception") renderPerception();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll(".admin-nav").forEach((b) => b.addEventListener("click", () => openView(b.dataset.view)));
  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openView(b.dataset.open)));

  function renderStats() {
    const db = dbGet(), users = usersFrom(db), open = db.tickets.filter((t) => !["Selesai", "Ditolak", "Dibatalkan"].includes(t.status)).length;
    const kpis = [["Pengguna terdaftar", users.length, "Data dummy pelanggan"], ["Total tiket", db.tickets.length, "Tersimpan di browser ini"], ["Tiket perlu ditangani", open, "Belum selesai"], ["Kanal sosial dipantau", platforms.length, "Sumber simulasi"]];
    $("admin-stats").innerHTML = kpis.map((k) => `<div class="admin-stat"><div class="label">${k[0]}</div><div class="value">${k[1]}</div><div class="hint">${k[2]}</div></div>`).join("");
    $("nav-open-tickets").textContent = open;
    const recent = db.tickets.slice(0, 4);
    $("overview-tickets").innerHTML = recent.length ? recent.map((t) => `<div class="admin-mini-ticket"><div><b>${escapeHtml(t.id)} · ${escapeHtml(t.nmLayanan || t.type || "Layanan")}</b><small>Pengaju: ${escapeHtml(t.nama)} · ${escapeHtml(t.zona || "—")}</small></div>${chip(t.status)}</div>`).join("") : '<div class="empty-admin">Belum ada tiket.</div>';
    const counts = sentimentCounts();
    $("overview-sentiment").innerHTML = `<div class="sentiment-summary">${["positif", "netral", "negatif"].map((s) => `<div class="sentiment-line ${s}"><b>${capitalize(s)}</b><div class="track"><i style="width:${counts[s] ? Math.round(counts[s] / mentions.length * 100) : 0}%"></i></div><span>${counts[s]}</span></div>`).join("")}<small class="muted">${mentions.length} mention contoh · bukan data aktual</small></div>`;
    $("activity-feed").innerHTML = activities.slice(0, 5).map((a) => `<div class="activity-item"><span class="activity-dot">●</span>${escapeHtml(a)}</div>`).join("");
    const groups = {}; db.tickets.forEach((t) => groups[t.status || "Baru"] = (groups[t.status || "Baru"] || 0) + 1);
    $("status-breakdown").innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([s, n]) => `<div class="breakdown-row"><span>${chip(s)}</span><b>${n}</b></div>`).join("") : '<div class="empty-admin">Belum ada tiket.</div>';
  }
  function renderUsers() {
    const query = ($("user-search").value || "").toLowerCase(), users = usersFrom(dbGet()).filter((u) => `${u.name} ${u.no} ${u.zone}`.toLowerCase().includes(query));
    $("user-count").textContent = `${usersFrom(dbGet()).length} pengguna`;
    $("users-table").innerHTML = users.length ? users.map((u) => `<tr><td><div class="user-cell"><b>${escapeHtml(u.name)}</b><small>Pelanggan demo</small></div></td><td>${escapeHtml(u.no)}</td><td>${escapeHtml(u.zone)}</td><td><button class="text-action user-tickets" data-user="${escapeHtml(u.name)}">${u.tickets} tiket</button></td><td><span class="chip teal">${u.status}</span></td></tr>`).join("") : '<tr><td colspan="5" class="empty-admin">Tidak ada pengguna yang cocok.</td></tr>';
    document.querySelectorAll(".user-tickets").forEach((b) => b.addEventListener("click", () => { $("ticket-search").value = b.dataset.user; openView("tickets"); }));
  }
  function renderTickets() {
    const db = dbGet(), query = ($("ticket-search").value || "").toLowerCase(), filter = $("ticket-filter").value;
    const tickets = db.tickets.filter((t) => (filter === "all" || t.status === filter) && `${t.id} ${t.nama} ${t.nmLayanan} ${t.zona} ${t.noPelanggan}`.toLowerCase().includes(query));
    $("ticket-count").textContent = `${db.tickets.length} tiket`;
    $("ticket-admin-list").innerHTML = tickets.length ? tickets.map((t) => `<article class="ticket-admin-card"><div class="ticket-admin-top"><div><h3>${escapeHtml(t.id)} · ${escapeHtml(t.nmLayanan || "Layanan pelanggan")}</h3><small>Dibuat ${escapeHtml(t.created || "—")} · ${escapeHtml(t.type || "layanan")}</small></div>${chip(t.status)}</div><div class="ticket-admin-meta"><div><span>Pengaju</span><b>${escapeHtml(t.nama || "—")}</b></div><div><span>No. pelanggan</span><b>${escapeHtml(t.noPelanggan || "—")}</b></div><div><span>Kontak</span><b>${escapeHtml(t.noHP || "—")}</b></div><div><span>Wilayah</span><b>${escapeHtml(t.zona || "—")}</b></div><div><span>Prioritas</span><b>${escapeHtml(t.prioritas || "Normal")}</b></div><div><span>Jenis</span><b>${escapeHtml(t.type === "keluhan" ? "Keluhan" : "Permohonan jasa")}</b></div></div><div class="ticket-admin-bottom"><p>${escapeHtml(t.ringkasan || t.keluhan || t.catatan || "Tidak ada ringkasan tambahan.")}</p><label class="small">Perbarui status <select class="select ticket-status-select" data-ticket="${escapeHtml(t.id)}">${statuses.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></label></div></article>`).join("") : '<div class="empty-admin">Tidak ada tiket yang sesuai filter.</div>';
    document.querySelectorAll(".ticket-status-select").forEach((select) => select.addEventListener("change", () => updateTicket(select.dataset.ticket, select.value)));
  }
  function updateTicket(id, status) {
    const db = dbGet(), t = db.tickets.find((x) => x.id === id); if (!t) return;
    t.status = status; t.timeline = Array.isArray(t.timeline) ? t.timeline : [];
    t.timeline.push({ date: TP.todays(), text: `Status tiket diperbarui menjadi ${status} oleh Administrator (demo)` });
    TP.DB.set(db); activities.unshift(`${id} diperbarui ke status ${status}`); TP.toast(`Status ${id} diperbarui.`, "success"); renderAll(); renderTickets();
  }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function sentimentCounts() { return mentions.reduce((a, m) => (a[m.sentiment]++, a), { positif: 0, netral: 0, negatif: 0 }); }
  function renderPerception() {
    $("source-grid").innerHTML = platforms.map((p) => `<div class="source-card"><b>${p}</b><small>Jalur integrasi demo</small><div class="source-state"><i></i>Simulasi aktif</div></div>`).join("");
    const c = sentimentCounts(), total = mentions.length, pct = (n) => total ? Math.round(n / total * 100) : 0;
    $("perception-stats").innerHTML = [["Mention contoh", total, "Dalam dataset simulasi"], ["Positif", `${pct(c.positif)}%`, `${c.positif} contoh percakapan`], ["Netral", `${pct(c.netral)}%`, `${c.netral} contoh percakapan`], ["Negatif", `${pct(c.negatif)}%`, `${c.negatif} contoh percakapan`]].map((k) => `<div class="admin-stat"><div class="label">${k[0]}</div><div class="value">${k[1]}</div><div class="hint">${k[2]}</div></div>`).join("");
    const daily = [{p:6,n:3,x:2},{p:7,n:4,x:3},{p:5,n:5,x:2},{p:8,n:3,x:3},{p:6,n:4,x:4},{p:9,n:3,x:2},{p:7,n:4,x:3}], days = ["1 Okt", "2 Okt", "3 Okt", "4 Okt", "5 Okt", "6 Okt", "7 Okt"];
    $("sentiment-chart").innerHTML = daily.map((d, i) => `<div class="sentiment-day"><div class="sentiment-stack"><i class="positive" style="height:${d.p / 16 * 100}%"></i><i class="neutral" style="height:${d.n / 16 * 100}%"></i><i class="negative" style="height:${d.x / 16 * 100}%"></i></div><small>${days[i]}</small></div>`).join("");
    renderMentions();
  }
  function renderMentions() {
    const q = ($("mention-search").value || "").toLowerCase(), p = $("platform-filter").value, s = $("sentiment-filter").value;
    const filtered = mentions.filter((m) => (p === "all" || p === m.platform) && (s === "all" || s === m.sentiment) && `${m.text} ${m.handle} ${m.topic}`.toLowerCase().includes(q));
    $("mention-list").innerHTML = filtered.length ? filtered.map((m) => `<article class="mention-item"><div class="mention-head"><span class="mention-source">${escapeHtml(m.platform)} · ${escapeHtml(m.handle)}</span><span class="mention-date">${escapeHtml(m.date)}</span></div><p>${escapeHtml(m.text)}</p><div class="mention-tags"><span class="chip ${m.sentiment === "positif" ? "teal" : m.sentiment === "negatif" ? "danger" : "gray"}">${capitalize(m.sentiment)}</span><small>Topik: ${escapeHtml(m.topic)} · keyakinan simulasi ${m.sentiment === "netral" ? "71" : "86"}%</small></div></article>`).join("") : '<div class="empty-admin">Tidak ada percakapan yang cocok.</div>';
  }
  function renderAll() { renderStats(); renderUsers(); renderTickets(); }
  $("user-search").addEventListener("input", renderUsers);
  $("ticket-search").addEventListener("input", renderTickets);
  $("ticket-filter").addEventListener("change", renderTickets);
  ["mention-search", "platform-filter", "sentiment-filter"].forEach((id) => $(id).addEventListener(id === "mention-search" ? "input" : "change", renderMentions));
  $("collect-btn").addEventListener("click", () => {
    const newSamples = [
      { platform: "X", handle: "@info_bogor", date: "Baru saja", sentiment: "netral", topic: "Informasi", text: "Simulasi pengambilan: warga menanyakan jadwal layanan Tirta Pakuan." },
      { platform: "Instagram", handle: "@warga_bogor", date: "Baru saja", sentiment: "positif", topic: "Layanan", text: "Simulasi pengambilan: apresiasi untuk kanal pengaduan pelanggan." }
    ];
    mentions = [...newSamples, ...mentions]; activities.unshift("Pengambilan percakapan simulasi dijalankan (2 mention contoh)");
    TP.toast("Dataset simulasi diperbarui dengan 2 mention contoh.", "success"); renderPerception(); renderStats();
  });
  renderAll(); renderPerception();
})();
