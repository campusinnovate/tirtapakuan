/* Tirta Pakuan — shared data store & helpers */
(function () {
  const LS_KEY = "tirtapakuan_db_v1";

  const DEFAULT_CUSTOMER = {
    noPelanggan: "3124508221",
    nama: "Budi Santoso",
    alamat: "Jl. Pajajaran No. 45, Bogor Tengah, Kota Bogor",
    zona: "Zona 3 – Baranangsiang",
    tarif: "Rumah Tangga / RT-2",
    status: "Aktif",
    golongan: "Rumah Tangga Gol. III"
  };

  const WATER_USAGE = [
    { bulan: "Apr", m3: 21, tagihan: 119000, bayar: true },
    { bulan: "Mei", m3: 24, tagihan: 132000, bayar: true },
    { bulan: "Jun", m3: 19, tagihan: 108500, bayar: true },
    { bulan: "Jul", m3: 26, tagihan: 141000, bayar: true },
    { bulan: "Agu", m3: 30, tagihan: 158000, bayar: false },
    { bulan: "Sep", m3: 28, tagihan: 151500, bayar: false }
  ];

  const SERVICE_CATALOG = [
    { id: "jasa", nama: "Layanan Jasa Tirta Pakuan", desc: "Lorem ipsum placeholder" },
    { id: "jasa-pasang", nama: "Pemasangan Baru", desc: "Pengajuan sambungan air baru untuk rumah, ruko, atau instansi setelah diverifikasi calon pelanggan." },
    { id: "jasa-meter", nama: "Uji / Penggantian Meter", desc: "Permohonan pengujian akurasi meter air atau penggantian meter yang rusak/tidak akurat." },
    { id: "jasa-sambung", nama: "Penggeseran / Sambung Ulang", desc: "Layanan penggeseran sambungan, penyambungan ulang, atau relokasi titik meter." },
    { id: "jasa-tutup", nama: "Tutup / Buka Temporer", desc: "Pengajuan penutupan sementara atau pembukaan kembali sambungan air." },
    { id: "keluhan", nama: "Lapor Keluhan", desc: "Lorem ipsum placeholder" },
    { id: "keluhan-nol", nama: "Air Tidak Mengalir", desc: "Tidak ada air sama sekali yang mengalir dari kran (debit 0 / no water)." },
    { id: "keluhan-lemak", nama: "Air Kurang Lancar", desc: "Aliran air lemah atau debit menurun dan tidak sekuat biasanya." },
    { id: "keluhan-bocor", nama: "Bocor Pipa", desc: "Adanya kebocoran pipa baik di lingkungan umum (jalan) maupun area pelanggan." },
    { id: "keluhan-keruh", nama: "Air Keruh / Bau", desc: "Air yang keluar keruh, berwarna, berbau, atau mengandung pasir/endapan." },
    { id: "keluhan-meter", nama: "Meter Tidak Tepat", desc: "Meter air berputar tanpa pemakaian, tidak berfungsi, atau angka tagihan tidak sesuai." },
    { id: "keluhan-tagihan", nama: "Tagihan Tidak Sesuai", desc: "Rekening dirasa terlalu tinggi atau tidak sesuai volume pemakaian." }
  ];

  const JASA_OPTIONS = SERVICE_CATALOG.filter((s) => s.id.startsWith("jasa-"));
  const KELUHAN_OPTIONS = SERVICE_CATALOG.filter((s) => s.id.startsWith("keluhan-"));

  const SOURCE_TYPES = { jasa: "Jasa", keluhan: "Keluhan" };
  const PRIORITY_META = {
    Rendah: { chip: "gray" },
    Normal: { chip: "blue" },
    Tinggi: { chip: "amber" },
    "Sangat Tinggi": { chip: "danger" }
  };
  const STATUS_META = {
    Baru: { chip: "blue" },
    "Proses": { chip: "amber" },
    "Menunggu Bayar": { chip: "amber" },
    "Selesai": { chip: "teal" },
    "Dibatalkan": { chip: "gray" }
  };
  const STATUS_FLOW = ["Baru", "Proses", "Menunggu Bayar", "Selesai"];
  const STATUS_FLOW_KELUHAN = ["Baru", "Proses", "Selesai"];

  function buildSeed() {
    const now = Date.now();
    const d = (offsetDays) => {
      const t = new Date(now - offsetDays * 86400000);
      return `${t.getDate().toString().padStart(2, "0")}/${(t.getMonth() + 1).toString().padStart(2, "0")}/${t.getFullYear()}`;
    };
    return {
      tickets: [
        {
          id: "TPK-2026-0412",
          type: "keluhan",
          idLayanan: "keluhan-lemak",
          nmLayanan: "Air Kurang Lancar",
          nama: "Budi Santoso",
          noHP: "0812 3456 7890",
          alamat: "Jl. Pajajaran No. 45, Bogor Tengah",
          zona: "Zona 3 – Baranangsiang",
          noPelanggan: "3124508221",
          keluhan: "Sejak 2 hari terakhir debit air di lantai dua rumah sangat lemah, terutama pagi dan sore hari.",
          jasa: "",
          catatan: "",
          prioritas: "Normal",
          status: "Proses",
          created: d(2),
          timeline: [
            { date: d(2), text: "Tiket dibuat oleh pelanggan" },
            { date: d(1), text: "Tiket diverifikasi petugas & dijadwalkan pengecekan lapangan" }
          ],
          reaction: null
        },
        {
          id: "TPK-2026-0410",
          type: "jasa",
          idLayanan: "jasa-sambung",
          nmLayanan: "Penggeseran / Sambung Ulang",
          nama: "Budi Santoso",
          noHP: "0812 3456 7890",
          alamat: "Jl. Pajajaran No. 45, Bogor Tengah",
          zona: "Zona 3 – Baranangsiang",
          noPelanggan: "3124508221",
          keluhan: "",
          jasa: "Perlu penggeseran titik meter karena renovasi pagar depan. Sudah mendapat izin dari pihak kecamatan.",
          catatan: "Estimasi biaya pergeseran: Rp 250.000",
          prioritas: "Normal",
          status: "Menunggu Bayar",
          created: d(4),
          timeline: [
            { date: d(4), text: "Permohonan jasa dikirim" },
            { date: d(3), text: "Survey lokasi oleh teknisi" },
            { date: d(1), text: "Berkas disetujui, menunggu pembayaran biaya layanan" }
          ],
          reaction: null
        },
        {
          id: "TPK-2026-0405",
          type: "keluhan",
          idLayanan: "keluhan-meter",
          nmLayanan: "Meter Tidak Tepat",
          nama: "Siti Rahayu",
          noHP: "0857 1122 3344",
          alamat: "Jl. Siliwangi No. 12, Bogor Selatan",
          zona: "Zona 1 – Tanah Sareal",
          noPelanggan: "3113098776",
          keluhan: "Meter tetap berputar meski semua kran sudah ditutup berjam-jam.",
          jasa: "",
          catatan: "",
          prioritas: "Tinggi",
          status: "Baru",
          created: d(0),
          timeline: [{ date: d(0), text: "Tiket dibuat oleh pelanggan" }],
          reaction: null
        },
        {
          id: "TPK-2026-0398",
          type: "jasa",
          idLayanan: "jasa-pasang",
          nmLayanan: "Pemasangan Baru",
          nama: "Dewi Lestari",
          noHP: "0813 9988 7766",
          alamat: "Perum Griya Bukit Jaya Blok C2 No.8, Bogor Timur",
          zona: "Zona 2 – Bogor Timur",
          noPelanggan: "—",
          keluhan: "",
          jasa: "Pemasangan sambungan air baru untuk rumah tinggal. Siap membayar biaya sambungan awal.",
          catatan: "Berkas KTP, KK, dan PBB sudah dilampirkan.",
          prioritas: "Normal",
          status: "Selesai",
          created: d(10),
          timeline: [
            { date: d(10), text: "Permohonan jasa dikirim" },
            { date: d(8), text: "Survey lokasi oleh teknisi" },
            { date: d(6), text: "Persetujuan & pembayaran selesai" },
            { date: d(3), text: "Sambungan terpasang — selesai" }
          ],
          reaction: null
        }
      ],
      notifications: [
        { id: 1, ico: "⚠", text: "Gangguan perbaikan pipa di Kp. Dekeng, aliran menurun untuk sementara.", time: "2 jam lalu", unread: true },
        { id: 2, ico: "☑", text: "Pembayaran periode Juni 2026 tercatat dan terverifikasi.", time: "5 hari lalu", unread: false },
        { id: 3, ico: "☏", text: "Petugas teknologi akan menghubungi Anda terkait tiket TPK-2026-0412.", time: "Kemarin", unread: true },
        { id: 4, ico: "☆", text: "Bapak Budi, silakan isi survei kepuasan untuk layanan terakhir Anda.", time: "Minggu lalu", unread: false }
      ]
    };
  }

  const DB = {
    get() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) throw new Error("empty");
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.tickets)) throw new Error("bad");
        return parsed;
      } catch (e) {
        const seed = buildSeed();
        this.set(seed);
        return seed;
      }
    },
    set(db) {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    }
  };

  function ensureSpace() {
    const db = DB.get();
    let changed = false;
    if (!Array.isArray(db.notifications)) { db.notifications = []; changed = true; }
    db.tickets.forEach((t) => {
      if (typeof t.reaction !== "number" || t.reaction === null) { t.reaction = null; changed = true; }
      if (!Array.isArray(t.timeline)) { t.timeline = []; changed = true; }
    });
    if (changed) DB.set(db);
    return db;
  }

  function svc(id) {
    return SERVICE_CATALOG.find((s) => s.id === id) || null;
  }

  function fmtRupiah(n) {
    return "Rp " + Number(n || 0).toLocaleString("id-ID");
  }

  function uid(prefix) {
    const db = DB.get();
    let max = 0;
    let width = 4;
    db.tickets.forEach((t) => {
      const g = /(\d+)$/.exec(t.id);
      if (g) {
        max = Math.max(max, Number(g[1]));
        width = Math.max(width, g[1].length);
      }
    });
    return prefix + "-" + String(max + 1).padStart(width, "0");
  }

  function toast(msg, type) {
    let wrap = document.getElementById("toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  const PAKET_JASA = [
    { price: 350000 },
    { price: 250000 },
    { price: 475000 }
  ];

  window.TP = {
    DB,
    ensureSpace,
    DEFAULT_CUSTOMER,
    WATER_USAGE,
    SERVICE_CATALOG,
    JASA_OPTIONS,
    KELUHAN_OPTIONS,
    SOURCE_TYPES,
    PRIORITY_META,
    STATUS_META,
    STATUS_FLOW,
    STATUS_FLOW_KELUHAN,
    svc,
    fmtRupiah,
    uid,
    toast,
    LS_KEY,
    PAKET_JASA
  };
})();