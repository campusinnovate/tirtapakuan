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
  const SETTINGS_KEY = "tirtapakuan_admin_settings_v1";
  const defaultSettings = { ticketAlert: true, prioritySort: true, socialDemo: true, keywords: "Tirta Pakuan, layanan air, gangguan", threshold: "30", retention: "7" };
  function settingsGet() { try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch (e) { return { ...defaultSettings }; } }
  function settingsSave(value) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); }

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
    if (name === "settings") loadSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  document.querySelectorAll(".admin-nav").forEach((b) => b.addEventListener("click", () => openView(b.dataset.view)));
  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => openView(b.dataset.open)));

  function showModal(title, body) {
    $("admin-modal-title").textContent = title;
    $("admin-modal-body").innerHTML = body;
    $("admin-modal").classList.add("open");
    $("admin-modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() { $("admin-modal").classList.remove("open"); $("admin-modal").setAttribute("aria-hidden", "true"); }
  $("admin-modal-close").addEventListener("click", closeModal);
  $("admin-modal").addEventListener("click", (e) => { if (e.target === $("admin-modal")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function showUser(name) {
    const db = dbGet(), user = usersFrom(db).find((u) => u.name === name);
    if (!user) return;
    const userTickets = db.tickets.filter((t) => (t.nama || "").toLowerCase() === name.toLowerCase() || (user.no !== "—" && t.noPelanggan === user.no));
    showModal("Profil pelanggan", `<div class="profile-modal-head"><span class="profile-avatar">${escapeHtml(name.split(/\s+/).map((x) => x[0]).slice(0, 2).join(""))}</span><div><h3>${escapeHtml(user.name)}</h3><span class="chip teal">${user.status}</span></div></div><div class="detail-grid"><div><small>No. pelanggan</small><b>${escapeHtml(user.no)}</b></div><div><small>Zona layanan</small><b>${escapeHtml(user.zone)}</b></div><div><small>Total tiket</small><b>${userTickets.length} permohonan</b></div><div><small>Status akun</small><b>${user.status} · data demo</b></div><div><small>Kontak</small><b>${escapeHtml(userTickets[0]?.noHP || "Belum tersedia")}</b></div><div><small>Alamat terakhir</small><b>${escapeHtml(userTickets[0]?.alamat || "Data dummy pelanggan")}</b></div></div><h3 class="modal-subhead">Riwayat tiket pelanggan</h3>${userTickets.length ? userTickets.map((t) => `<button class="modal-ticket-link" data-ticket-detail="${escapeHtml(t.id)}"><span><b>${escapeHtml(t.id)} · ${escapeHtml(t.nmLayanan || "Layanan")}</b><small>${escapeHtml(t.created || "—")} · ${escapeHtml(t.zona || "—")}</small></span>${chip(t.status)} →</button>`).join("") : '<div class="empty-admin">Belum ada tiket yang terhubung ke akun ini.</div>'}<p class="small muted modal-disclaimer">Profil ini merupakan data demonstrasi. Detail akun resmi memerlukan akses backend berotorisasi.</p>`);
    $("admin-modal-body").querySelectorAll("[data-ticket-detail]").forEach((b) => b.addEventListener("click", () => showTicket(b.dataset.ticketDetail)));
  }
  function showTicket(id) {
    const t = dbGet().tickets.find((x) => x.id === id); if (!t) return;
    const fields = Object.entries(t.formData || {}).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `<div><small>${escapeHtml(k.replace(/_/g, " "))}</small><b>${escapeHtml(v)}</b></div>`).join("");
    const timeline = (t.timeline || []).map((item) => `<div class="timeline-item"><i></i><div><b>${escapeHtml(item.text)}</b><small>${escapeHtml(item.date || "")}</small></div></div>`).join("");
    showModal(`Tiket ${t.id}`, `<div class="ticket-detail-banner"><div><span class="eyebrow">${escapeHtml(t.type === "keluhan" ? "LAPORAN KELUHAN" : "PERMOHONAN LAYANAN")}</span><h3>${escapeHtml(t.nmLayanan || "Layanan pelanggan")}</h3></div>${chip(t.status)}</div><div class="detail-grid"><div><small>Pengaju</small><button class="inline-detail" data-user-detail="${escapeHtml(t.nama || "")}">${escapeHtml(t.nama || "—")} ↗</button></div><div><small>No. pelanggan</small><b>${escapeHtml(t.noPelanggan || "—")}</b></div><div><small>Nomor kontak</small><b>${escapeHtml(t.noHP || "—")}</b></div><div><small>Wilayah</small><b>${escapeHtml(t.zona || "—")}</b></div><div><small>Prioritas</small><b>${escapeHtml(t.prioritas || "Normal")}</b></div><div><small>Diajukan</small><b>${escapeHtml(t.created || "—")}</b></div></div><div class="detail-description"><small>Ringkasan laporan</small><p>${escapeHtml(t.ringkasan || t.keluhan || t.catatan || "Tidak ada keterangan tambahan.")}</p></div>${fields ? `<h3 class="modal-subhead">Data formulir</h3><div class="detail-grid">${fields}</div>` : ""}<h3 class="modal-subhead">Riwayat penanganan</h3><div class="ticket-timeline">${timeline || '<div class="empty-admin">Belum ada riwayat.</div>'}</div><div class="modal-actions"><label class="small">Perbarui status <select id="modal-ticket-status" class="select">${statuses.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></label><button class="btn small" id="modal-save-status">Simpan status</button></div>`);
    $("admin-modal-body").querySelector("[data-user-detail]").addEventListener("click", (e) => showUser(e.currentTarget.dataset.userDetail));
    $("modal-save-status").addEventListener("click", () => { updateTicket(id, $("modal-ticket-status").value); showTicket(id); });
  }

  function renderStats() {
    const db = dbGet(), users = usersFrom(db), open = db.tickets.filter((t) => !["Selesai", "Ditolak", "Dibatalkan"].includes(t.status)).length;
    const kpis = [["Pengguna terdaftar", users.length, "Data dummy pelanggan"], ["Total tiket", db.tickets.length, "Tersimpan di browser ini"], ["Tiket perlu ditangani", open, "Belum selesai"], ["Kanal sosial dipantau", platforms.length, "Sumber simulasi"]];
    $("admin-stats").innerHTML = kpis.map((k) => `<button class="admin-stat admin-stat-button" data-stat-view="${k[0] === "Pengguna terdaftar" ? "users" : k[0] === "Kanal sosial dipantau" ? "perception" : "tickets"}"><span class="label">${k[0]}</span><span class="value">${k[1]}</span><span class="hint">${k[2]} · klik untuk detail ↗</span></button>`).join("");
    document.querySelectorAll("[data-stat-view]").forEach((b) => b.addEventListener("click", () => openView(b.dataset.statView)));
    $("nav-open-tickets").textContent = open;
    $("hero-open-count").textContent = open;
    const recent = db.tickets.slice(0, 4);
    $("overview-tickets").innerHTML = recent.length ? recent.map((t) => `<button class="admin-mini-ticket clickable-ticket" data-ticket-detail="${escapeHtml(t.id)}"><span><b>${escapeHtml(t.id)} · ${escapeHtml(t.nmLayanan || t.type || "Layanan")}</b><small>Pengaju: ${escapeHtml(t.nama)} · ${escapeHtml(t.zona || "—")}</small></span>${chip(t.status)}<span class="mini-arrow">↗</span></button>`).join("") : '<div class="empty-admin">Belum ada tiket.</div>';
    document.querySelectorAll("#overview-tickets [data-ticket-detail]").forEach((b) => b.addEventListener("click", () => showTicket(b.dataset.ticketDetail)));
    const dataEnabled = settingsGet().socialDemo, counts = dataEnabled ? sentimentCounts() : { positif: 0, netral: 0, negatif: 0 }, mentionTotal = dataEnabled ? mentions.length : 0;
    $("overview-sentiment").innerHTML = `<button class="sentiment-summary sentiment-summary-button" data-open="perception">${["positif", "netral", "negatif"].map((s) => `<span class="sentiment-line ${s}"><b>${capitalize(s)}</b><span class="track"><i style="width:${mentionTotal ? Math.round(counts[s] / mentionTotal * 100) : 0}%"></i></span><span>${counts[s]}</span></span>`).join("")}<small class="muted">${mentionTotal} mention contoh · buka analisis ↗</small></button>`;
    $("overview-sentiment").querySelector("[data-open]").addEventListener("click", () => openView("perception"));
    $("activity-feed").innerHTML = activities.slice(0, 5).map((a) => `<div class="activity-item"><span class="activity-dot">●</span>${escapeHtml(a)}</div>`).join("");
    const groups = {}; db.tickets.forEach((t) => groups[t.status || "Baru"] = (groups[t.status || "Baru"] || 0) + 1);
    $("status-breakdown").innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([s, n]) => `<div class="breakdown-row"><span>${chip(s)}</span><b>${n}</b></div>`).join("") : '<div class="empty-admin">Belum ada tiket.</div>';
  }
  function renderUsers() {
    const query = ($("user-search").value || "").toLowerCase(), users = usersFrom(dbGet()).filter((u) => `${u.name} ${u.no} ${u.zone}`.toLowerCase().includes(query));
    $("user-count").textContent = `${usersFrom(dbGet()).length} pengguna`;
    $("users-table").innerHTML = users.length ? users.map((u) => `<tr class="user-row"><td><button class="user-open" data-user-detail="${escapeHtml(u.name)}"><span class="table-avatar">${escapeHtml(u.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join(""))}</span><span class="user-cell"><b>${escapeHtml(u.name)}</b><small>Buka profil pelanggan ↗</small></span></button></td><td>${escapeHtml(u.no)}</td><td>${escapeHtml(u.zone)}</td><td><button class="text-action user-tickets" data-user="${escapeHtml(u.name)}">${u.tickets} tiket</button></td><td><span class="chip teal">${u.status}</span></td><td><button class="icon-action" data-user-detail="${escapeHtml(u.name)}" aria-label="Detail ${escapeHtml(u.name)}">→</button></td></tr>`).join("") : '<tr><td colspan="6" class="empty-admin">Tidak ada pengguna yang cocok.</td></tr>';
    document.querySelectorAll("[data-user-detail]").forEach((b) => b.addEventListener("click", () => showUser(b.dataset.userDetail)));
    document.querySelectorAll(".user-tickets").forEach((b) => b.addEventListener("click", () => { $("ticket-search").value = b.dataset.user; openView("tickets"); }));
  }
  function renderTickets() {
    const db = dbGet(), query = ($("ticket-search").value || "").toLowerCase(), filter = $("ticket-filter").value;
    const prefs = settingsGet();
    const tickets = db.tickets.filter((t) => (filter === "all" || t.status === filter) && `${t.id} ${t.nama} ${t.nmLayanan} ${t.zona} ${t.noPelanggan}`.toLowerCase().includes(query)).sort((a, b) => prefs.prioritySort ? (priorityRank(b.prioritas) - priorityRank(a.prioritas)) : 0);
    $("ticket-count").textContent = `${db.tickets.length} tiket`;
    $("ticket-admin-list").innerHTML = tickets.length ? tickets.map((t) => `<article class="ticket-admin-card"><div class="ticket-admin-top"><button class="ticket-open" data-ticket-detail="${escapeHtml(t.id)}"><span class="ticket-id">${escapeHtml(t.id)} ↗</span><h3>${escapeHtml(t.nmLayanan || "Layanan pelanggan")}</h3><small>Dibuat ${escapeHtml(t.created || "—")} · ${escapeHtml(t.type || "layanan")}</small></button>${chip(t.status)}</div><div class="ticket-admin-meta"><div><span>Pengaju</span><button class="inline-detail" data-user-detail="${escapeHtml(t.nama || "")}">${escapeHtml(t.nama || "—")} ↗</button></div><div><span>No. pelanggan</span><b>${escapeHtml(t.noPelanggan || "—")}</b></div><div><span>Kontak</span><b>${escapeHtml(t.noHP || "—")}</b></div><div><span>Wilayah</span><b>${escapeHtml(t.zona || "—")}</b></div><div><span>Prioritas</span><b>${escapeHtml(t.prioritas || "Normal")}</b></div><div><span>Jenis</span><b>${escapeHtml(t.type === "keluhan" ? "Keluhan" : "Permohonan jasa")}</b></div></div><div class="ticket-admin-bottom"><p>${escapeHtml(t.ringkasan || t.keluhan || t.catatan || "Tidak ada ringkasan tambahan.")}</p><div class="ticket-card-actions"><button class="btn ghost small" data-ticket-detail="${escapeHtml(t.id)}">Detail tiket →</button><label class="small">Status <select class="select ticket-status-select" data-ticket="${escapeHtml(t.id)}">${statuses.map((s) => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></label></div></div></article>`).join("") : '<div class="empty-admin">Tidak ada tiket yang sesuai filter.</div>';
    document.querySelectorAll("#ticket-admin-list [data-ticket-detail]").forEach((b) => b.addEventListener("click", () => showTicket(b.dataset.ticketDetail)));
    document.querySelectorAll("#ticket-admin-list [data-user-detail]").forEach((b) => b.addEventListener("click", () => showUser(b.dataset.userDetail)));
    document.querySelectorAll(".ticket-status-select").forEach((select) => select.addEventListener("change", () => updateTicket(select.dataset.ticket, select.value)));
  }
  function updateTicket(id, status) {
    const db = dbGet(), t = db.tickets.find((x) => x.id === id); if (!t) return;
    t.status = status; t.timeline = Array.isArray(t.timeline) ? t.timeline : [];
    t.timeline.push({ date: TP.todays(), text: `Status tiket diperbarui menjadi ${status} oleh Administrator (demo)` });
    TP.DB.set(db); activities.unshift(`${id} diperbarui ke status ${status}`); if (settingsGet().ticketAlert) TP.toast(`Status ${id} diperbarui.`, "success"); renderAll(); renderTickets();
  }
  function priorityRank(value) { return ({ "Sangat Tinggi": 4, Tinggi: 3, Normal: 2, Rendah: 1 })[value] || 0; }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function sentimentCounts() { return mentions.reduce((a, m) => (a[m.sentiment]++, a), { positif: 0, netral: 0, negatif: 0 }); }
  function renderPerception() {
    const prefs = settingsGet(), visibleMentions = prefs.socialDemo ? mentions : [];
    $("source-grid").innerHTML = platforms.map((p) => `<button class="source-card source-card-button" data-platform="${p}"><b>${p}</b><small>Jalur integrasi demo · klik untuk filter</small><span class="source-state ${prefs.socialDemo ? "" : "paused"}"><i></i>${prefs.socialDemo ? "Simulasi aktif" : "Simulasi dijeda"}</span></button>`).join("");
    document.querySelectorAll(".source-card-button").forEach((b) => b.addEventListener("click", () => { $("platform-filter").value = $("platform-filter").value === b.dataset.platform ? "all" : b.dataset.platform; renderMentions(); document.querySelector(".mention-card").scrollIntoView({ behavior: "smooth", block: "start" }); }));
    const c = prefs.socialDemo ? sentimentCounts() : { positif: 0, netral: 0, negatif: 0 }, total = visibleMentions.length, pct = (n) => total ? Math.round(n / total * 100) : 0;
    $("chart-range").textContent = `${prefs.retention} hari · indeks simulasi`;
    const negativeRate = pct(c.negatif), keywordList = prefs.keywords.split(",").map((x) => x.trim()).filter(Boolean);
    $("perception-alert").innerHTML = !prefs.socialDemo
      ? '<div class="perception-insight paused-insight">Simulasi percakapan dijeda. Aktifkan kembali melalui <button class="inline-detail" data-settings-link>Pengaturan</button> untuk melihat data contoh.</div>'
      : `<div class="perception-insight ${negativeRate >= Number(prefs.threshold) ? "attention-insight" : ""}"><span class="insight-icon">${negativeRate >= Number(prefs.threshold) ? "!" : "✓"}</span><span><b>${negativeRate >= Number(prefs.threshold) ? "Perlu perhatian" : "Pantauan stabil"}</b><small>${negativeRate >= Number(prefs.threshold) ? `Sentimen negatif ${negativeRate}% melewati ambang ${prefs.threshold}%.` : `Sentimen negatif ${negativeRate}% masih di bawah ambang ${prefs.threshold}%.`} Data ini adalah simulasi.</small><small class="keyword-line">Kata kunci: ${escapeHtml(keywordList.join(" · ") || "Belum ditentukan")}</small></span></div>`;
    $("perception-alert").querySelector("[data-settings-link]")?.addEventListener("click", () => openView("settings"));
    $("perception-stats").innerHTML = [["Mention contoh", total, `Rentang ${prefs.retention} hari`], ["Positif", `${pct(c.positif)}%`, `${c.positif} contoh percakapan`], ["Netral", `${pct(c.netral)}%`, `${c.netral} contoh percakapan`], ["Negatif", `${pct(c.negatif)}%`, `${c.negatif} contoh percakapan`]].map((k) => `<div class="admin-stat"><div class="label">${k[0]}</div><div class="value">${k[1]}</div><div class="hint">${k[2]}</div></div>`).join("");
    const daily = [{p:6,n:3,x:2},{p:7,n:4,x:3},{p:5,n:5,x:2},{p:8,n:3,x:3},{p:6,n:4,x:4},{p:9,n:3,x:2},{p:7,n:4,x:3}], days = ["1 Okt", "2 Okt", "3 Okt", "4 Okt", "5 Okt", "6 Okt", "7 Okt"];
    $("sentiment-chart").innerHTML = daily.map((d, i) => `<div class="sentiment-day"><div class="sentiment-stack"><i class="positive" style="height:${d.p / 16 * 100}%"></i><i class="neutral" style="height:${d.n / 16 * 100}%"></i><i class="negative" style="height:${d.x / 16 * 100}%"></i></div><small>${days[i]}</small></div>`).join("");
    $("sentiment-chart").classList.toggle("chart-paused", !prefs.socialDemo);
    renderMentions();
  }
  function renderMentions() {
    const q = ($("mention-search").value || "").toLowerCase(), p = $("platform-filter").value, s = $("sentiment-filter").value;
    const filtered = (settingsGet().socialDemo ? mentions : []).filter((m) => (p === "all" || p === m.platform) && (s === "all" || s === m.sentiment) && `${m.text} ${m.handle} ${m.topic}`.toLowerCase().includes(q));
    $("mention-list").innerHTML = filtered.length ? filtered.map((m) => `<article class="mention-item"><div class="mention-head"><span class="mention-source">${escapeHtml(m.platform)} · ${escapeHtml(m.handle)}</span><span class="mention-date">${escapeHtml(m.date)}</span></div><p>${escapeHtml(m.text)}</p><div class="mention-tags"><span class="chip ${m.sentiment === "positif" ? "teal" : m.sentiment === "negatif" ? "danger" : "gray"}">${capitalize(m.sentiment)}</span><small>Topik: ${escapeHtml(m.topic)} · keyakinan simulasi ${m.sentiment === "netral" ? "71" : "86"}%</small></div></article>`).join("") : '<div class="empty-admin">Tidak ada percakapan yang cocok.</div>';
  }
  function loadSettings() {
    const s = settingsGet();
    $("setting-ticket-alert").checked = s.ticketAlert; $("setting-priority-sort").checked = s.prioritySort; $("setting-social-demo").checked = s.socialDemo;
    $("setting-keywords").value = s.keywords; $("setting-threshold").value = s.threshold; $("setting-retention").value = s.retention;
  }
  function saveSettings() {
    const value = { ticketAlert: $("setting-ticket-alert").checked, prioritySort: $("setting-priority-sort").checked, socialDemo: $("setting-social-demo").checked, keywords: $("setting-keywords").value.trim(), threshold: $("setting-threshold").value, retention: $("setting-retention").value };
    settingsSave(value); $("settings-saved").textContent = `Tersimpan ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} di browser ini.`;
    activities.unshift("Preferensi panel admin disimpan"); TP.toast("Pengaturan admin tersimpan di browser ini.", "success"); renderAll(); renderPerception();
  }
  function exportCsv(filename, rows) {
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); TP.toast("File CSV berhasil disiapkan.", "success");
  }
  function renderAll() { renderStats(); renderUsers(); renderTickets(); }
  $("user-search").addEventListener("input", renderUsers);
  $("ticket-search").addEventListener("input", renderTickets);
  $("ticket-filter").addEventListener("change", renderTickets);
  ["mention-search", "platform-filter", "sentiment-filter"].forEach((id) => $(id).addEventListener(id === "mention-search" ? "input" : "change", renderMentions));
  $("collect-btn").addEventListener("click", () => {
    if (!settingsGet().socialDemo) { TP.toast("Aktifkan simulasi data sosial di Pengaturan terlebih dahulu.", "error"); return; }
    const newSamples = [
      { platform: "X", handle: "@info_bogor", date: "Baru saja", sentiment: "netral", topic: "Informasi", text: "Simulasi pengambilan: warga menanyakan jadwal layanan Tirta Pakuan." },
      { platform: "Instagram", handle: "@warga_bogor", date: "Baru saja", sentiment: "positif", topic: "Layanan", text: "Simulasi pengambilan: apresiasi untuk kanal pengaduan pelanggan." }
    ];
    mentions = [...newSamples, ...mentions]; activities.unshift("Pengambilan percakapan simulasi dijalankan (2 mention contoh)");
    TP.toast("Dataset simulasi diperbarui dengan 2 mention contoh.", "success"); renderPerception(); renderStats();
  });
  $("save-settings").addEventListener("click", saveSettings);
  $("reset-settings").addEventListener("click", () => { settingsSave({ ...defaultSettings }); loadSettings(); saveSettings(); });
  $("export-users").addEventListener("click", () => exportCsv("pengguna-tirta-pakuan-demo.csv", [["Nama", "No. Pelanggan", "Zona", "Jumlah Tiket", "Status"], ...usersFrom(dbGet()).map((u) => [u.name, u.no, u.zone, u.tickets, u.status])]));
  $("export-tickets").addEventListener("click", () => exportCsv("tiket-tirta-pakuan-demo.csv", [["ID", "Pengaju", "No. Pelanggan", "Kontak", "Layanan", "Zona", "Prioritas", "Status", "Tanggal"], ...dbGet().tickets.map((t) => [t.id, t.nama, t.noPelanggan, t.noHP, t.nmLayanan, t.zona, t.prioritas, t.status, t.created])]));
  $("admin-date").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  loadSettings();
  renderAll(); renderPerception();
})();
