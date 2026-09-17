/* Tirta Pakuan — shared data store, service catalog & helpers */
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

  /* ---------------- Jenis Pelanggan (golongan tarif) ---------------- */
  const JENIS_PELANGGAN = [
    {
      id: "RT-1", nama: "Rumah Tangga Sederhana", golongan: "Rumah Tangga Gol. I",
      blok: "Blok I: 0–10 m³ · Blok II: 11–20 m³ · Blok III: >20 m³",
      deskripsi: "Tarif untuk rumah tinggal golongan menengah-bawah. Pemakaian dihitung per blok progresif sesuai volume pemakaian bulanan.",
      cth: "Rumah tinggal standar, kompleks perumahan sederhana."
    },
    {
      id: "RT-2", nama: "Rumah Tangga Menengah", golongan: "Rumah Tangga Gol. II",
      blok: "Blok I: 0–10 m³ · Blok II: 11–20 m³ · Blok III: >20 m³",
      deskripsi: "Tarif untuk rumah tinggal golongan menengah. Berlaku biaya pemakaian minimum per bulan.",
      cth: "Rumah tinggal menengah, rumah susun, kost-kostan skala sedang."
    },
    {
      id: "RT-3", nama: "Rumah Tangga Mewah", golongan: "Rumah Tangga Gol. III",
      blok: "Blok I: 0–10 m³ · Blok II: 11–20 m³ · Blok III: >20 m³",
      deskripsi: "Tarif untuk rumah tinggal golongan besar/mewah dengan pemakaian dan fasilitas tinggi.",
      cth: "Villa, rumah mewah, kawasan residensial premium."
    },
    {
      id: "NIAGA-1", nama: "Niaga Kecil", golongan: "Niaga Gol. I",
      blok: "Tunggal sesuai volume · minimum pemakaian",
      deskripsi: "Tarif untuk usaha skala kecil yang menggunakan air untuk kegiatan komersial sederhana.",
      cth: "Kios, warung, bengkel kecil, usaha mikro."
    },
    {
      id: "NIAGA-2", nama: "Niaga Besar", golongan: "Niaga Gol. II",
      blok: "Tunggal sesuai volume · minimum pemakaian",
      deskripsi: "Tarif untuk usaha menengah-besar dengan kebutuhan air komersial tinggi.",
      cth: "Restoran, hotel, pertokoan (mall/ruko besar), tempat hiburan."
    },
    {
      id: "SOSIAL", nama: "Sosial", golongan: "Sosial Umum & Khusus",
      blok: "Tunggal sesuai volume",
      deskripsi: "Tarif khusus untuk fasilitas sosial dan pelayanan umum; umumnya tarif terendah.",
      cth: "Tempat ibadah, panti, sekolah, panti asuhan, fasilitas umum lainnya."
    },
    {
      id: "INSTANSI", nama: "Instansi", golongan: "Instansi Pemerintah",
      blok: "Tunggal sesuai volume",
      deskripsi: "Tarif untuk kantor pemerintahan dan lembaga negara.",
      cth: "Kantor kelurahan/kecamatan, SKPD, lembaga pendidikan negeri."
    },
    {
      id: "INDUSTRI", nama: "Industri", golongan: "Industri",
      blok: "Tunggal sesuai volume",
      deskripsi: "Tarif untuk kegiatan produksi/manufaktur dengan kebutuhan air tinggi.",
      cth: "Pabrik, industri pengolahan, pabrik minuman."
    }
  ];

  /* ---------------- Kontrak Pelanggan (hak & kewajiban) ---------------- */
  const KONTRAK_PELANGGAN = [
    { id: "k1", teks: "Kewajiban pelanggan: membayar rekening air setiap bulan paling lambat pada tanggal jatuh tempo yang tertera pada rekening." },
    { id: "k2", teks: "Kewajiban pelanggan: memelihara instalasi pipa dalam, menjaga kebersihan dan keamanan kotak meter air, serta tidak merusak segel meter." },
    { id: "k3", teks: "Kewajiban pelanggan: memberikan akses kepada petugas untuk pembacaan meter, pemeriksaan, dan pemeliharaan jaringan." },
    { id: "k4", teks: "Kewajiban pelanggan: segera melaporkan kebocoran, pemindahan/penambahan sambungan, atau perubahan data pelanggan." },
    { id: "k5", teks: "Larangan: menyambung air secara ilegal, memindahtangankan sambungan tanpa izin tertulis, atau memperjualbelikan air." },
    { id: "k6", teks: "Hak pelanggan: memperoleh air bersih sesuai standar kualitas mutu dan kesinambungan pelayanan 24 jam." },
    { id: "k7", teks: "Hak pelanggan: memperoleh penanganan keluhan, informasi tarif, dan transparansi biaya layanan." },
    { id: "k8", teks: "Hak perusahaan: menghentikan sementara aliran apabila terjadi tunggakan rekening sesuai ketentuan yang berlaku." }
  ];

  const jelPel = () => JENIS_PELANGGAN.map((j) => j.id + " — " + j.nama);

  /* ---------------- Katalog layanan jasa (form khusus + checklist) ---------------- */
  const JASA_DETAILS = [
    {
      id: "jasa-pasang",
      nama: "Pemasangan Baru",
      icon: "⌂",
      deskripsi: "Pengajuan sambungan air bersih baru untuk rumah tinggal, ruko, tempat ibadah, atau instansi. Proses diawali dengan verifikasi data, survei lapangan, penetapan biaya, dan diakhiri dengan pemasangan sambungan aktif.",
      ringkasanIntro: "Permohonan sambungan air bersih baru yang akan diproses melalui verifikasi data, survei lapangan, dan pemasangan.",
      estimasi: "Biaya sambungan baru ±Rp 650.000 – 2.500.000 tergantung golongan pelanggan, diameter pipa, dan jarak titik sambungan (hasil survei). Termasuk meter & aksesoris.",
      formSchema: [
        { key: "jenis_bangunan", label: "Jenis Bangunan", type: "select", required: true, options: ["Rumah Tinggal", "Ruko", "Tempat Ibadah", "Instansi / Perkantoran", "Lainnya"] },
        { key: "jumlah_lantai", label: "Jumlah Lantai", type: "number", required: true, placeholder: "cth. 2" },
        { key: "luas_tanah", label: "Luas Tanah (m²)", type: "number", required: true, placeholder: "cth. 72" },
        { key: "jarak_pipa", label: "Perkiraan Jarak ke Pipa Utama (meter)", type: "number", required: true, hint: "Diukur dari batas tanah ke titik pipa distribusi terdekat. Nilai ini menjadi dasar estimasi biaya." },
        { key: "sumber_saat_ini", label: "Sumber Air Saat Ini", type: "select", required: true, options: ["Sumur / Jetpump", "PDAM Lain", "PAM Swasta", "Air Kemasan / Isi Ulang", "Lainnya"] },
        { key: "pemakaian_rencana", label: "Perkiraan Pemakaian Bulanan", type: "select", required: true, options: ["< 10 m³", "10 – 20 m³", "20 – 30 m³", "> 30 m³"] },
        { key: "titik_sambungan", label: "Deskripsi Titik Sambungan / Patokan Lokasi", type: "textarea", required: true, placeholder: "Sebutkan gapura/patokan dan posisi titik sambungan yang diinginkan." },
        { key: "tanggal_survey", label: "Tanggal Survey Diinginkan", type: "date", required: false, hint: "Opsional — jadwal final dikonfirmasi petugas." }
      ],
      syarat: [
        { id: "s1", teks: "Pemohon berdomisili dalam wilayah pelayanan Perumda Tirta Pakuan Kota Bogor.", wajib: true },
        { id: "s2", teks: "Lokasi sambungan berada dalam jangkauan jaringan pipa distribusi yang tersedia.", wajib: true },
        { id: "s3", teks: "Data yang disampaikan adalah benar dan dapat diverifikasi petugas.", wajib: true },
        { id: "s4", teks: "Tidak sedang dalam sengketa kepemilikan lahan/bangunan pada lokasi sambungan.", wajib: true },
        { id: "s5", teks: "Satu bangunan berlaku untuk satu sambungan; sambungan tambahan mengikuti ketentuan.", wajib: true },
        { id: "s6", teks: "Pelunasan biaya sambungan dilakukan setelah estimasi dikeluarkan petugas survei.", wajib: true },
        { id: "s7", teks: "Petugas berhak menolak permohonan bila lokasi tidak terjangkau jaringan atau secara teknis tidak memungkinkan.", wajib: false }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI"]
    },
    {
      id: "jasa-meter",
      nama: "Uji / Penggantian Meter",
      icon: "▤",
      deskripsi: "Pelayanan pengujian akurasi meter air, penggantian meter yang rusak/tidak akurat, serta relokasi posisi meter. Petugas melakukan pemeriksaan teknis di lapangan terlebih dahulu.",
      ringkasanIntro: "Permohonan pengujian atau penggantian meter air yang diproses melalui pemeriksaan teknis meter di lapangan.",
      estimasi: "Uji akurasi meter: ±Rp 55.000 – 120.000. Penggantian meter rusak mengikuti harga meter + jasa (gratis bila termasuk masa garansi). Biaya dibayarkan sebelum pengerjaan.",
      formSchema: [
        { key: "jenis_permohonan", label: "Jenis Permohonan", type: "select", required: true, options: ["Uji Akurasi Meter", "Penggantian Meter Rusak", "Relokasi Posisi Meter"] },
        { key: "merk_meter", label: "Merk Meter Saat Ini", type: "text", required: true, placeholder: "cth. Arad / Zenner" },
        { key: "no_meter", label: "Nomor Serial Meter", type: "text", required: false, placeholder: "cth. 88471290 (tertera di papan meter)" },
        { key: "umur_pemasangan", label: "Umur Pemasangan (tahun)", type: "number", required: true, placeholder: "cth. 8" },
        { key: "posisi_meter", label: "Posisi Meter", type: "select", required: true, options: ["Di luar rumah", "Di dalam rumah"] },
        { key: "gejala", label: "Gejala yang Dirasakan", type: "textarea", required: true, placeholder: "Misal: meter berputar saat semua kran ditutup, angka tidak naik, atau kaca/box meter pecah." }
      ],
      syarat: [
        { id: "s1", teks: "Pelanggan berstatus aktif dan tidak dalam proses pembongkaran/penutupan tetap.", wajib: true },
        { id: "s2", teks: "Meter yang diuji adalah meter milik perusahaan yang tercatat atas nama pelanggan.", wajib: true },
        { id: "s3", teks: "Biaya pengujian/penggantian mengikuti tarif yang berlaku dan dibayarkan sebelum pengerjaan.", wajib: true },
        { id: "s4", teks: "Selama penggantian meter, pemakaian dicatat berdasarkan pembacaan meter sebelum penggantian.", wajib: true }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI", "INDUSTRI"]
    },
    {
      id: "jasa-sambung",
      nama: "Penggeseran / Sambung Ulang",
      icon: "▥",
      deskripsi: "Layanan penggeseran titik meter, penyambungan ulang (buka kembali), atau relokasi titik sambungan karena renovasi, perpindahan titik, atau pemutusan sementara.",
      ringkasanIntro: "Permohonan pergeseran titik sambungan atau penyambungan ulang yang diproses melalui survei lokasi dan penghitungan biaya.",
      estimasi: "Penggeseran/relokasi: ±Rp 250.000 – 750.000 berdasarkan jarak & kondisi lapangan. Sambung ulang: komponen biaya pemasangan baru dikurangi nilai meter bila meter lama tetap dipakai.",
      formSchema: [
        { key: "jenis_permohonan", label: "Jenis Permohonan", type: "select", required: true, options: ["Penggeseran Titik Meter", "Sambung Ulang / Buka Kembali", "Relokasi Sambungan"] },
        { key: "alasan", label: "Alasan Permohonan", type: "textarea", required: true, placeholder: "Misal: renovasi pagar depan, pindah titik sambungan, atau kondisi teknis lainnya." },
        { key: "jarak_pergeseran", label: "Perkiraan Jarak Pergeseran (meter)", type: "number", required: true, placeholder: "cth. 6" },
        { key: "titik_baru", label: "Deskripsi Titik Baru / Patokan", type: "textarea", required: false, placeholder: "Gambarkan posisi meter/titik sambungan baru." },
        { key: "lewat_jalan", label: "Apakah Melewati / Menyeberang Jalan Umum?", type: "select", required: true, options: ["Tidak", "Ya — melewati jalan umum"] }
      ],
      syarat: [
        { id: "s1", teks: "Pelanggan berstatus aktif dan tidak memiliki tunggakan rekening.", wajib: true },
        { id: "s2", teks: "Titik sambungan baru berada dalam jangkauan jaringan dan secara teknis memungkinkan.", wajib: true },
        { id: "s3", teks: "Pergeseran melewati jalan umum memerlukan nomor izin dari instansi terkait.", wajib: true },
        { id: "s4", teks: "Biaya ditetapkan berdasarkan survei jarak, diameter pipa, dan kondisi lapangan.", wajib: true }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI", "INDUSTRI"]
    },
    {
      id: "jasa-tutup",
      nama: "Tutup / Buka Temporer",
      icon: "⊘",
      deskripsi: "Pengajuan penutupan sementara sambungan air (misal karena rumah kosong, renovasi, atau merantau) serta pembukaan kembali pemakaian. Nomor pelanggan tetap dipertahankan.",
      ringkasanIntro: "Permohonan penutupan sementara atau pembukaan kembali sambungan air dalam jangka waktu tertentu.",
      estimasi: "Administrasi tutup sementara: ±Rp 20.000 – 50.000. Pembukaan kembali: pelunasan tunggakan (bila ada) + biaya buka sambungan sesuai ketentuan.",
      formSchema: [
        { key: "jenis_permohonan", label: "Jenis Permohonan", type: "select", required: true, options: ["Tutup Sementara", "Buka Kembali"] },
        { key: "durasi", label: "Perkiraan Durasi (bulan)", type: "number", required: true, placeholder: "cth. 6" },
        { key: "alasan", label: "Alasan", type: "select", required: true, options: ["Rumah Kosong / Tidak Dihuni", "Renovasi Bangunan", "Merantau / Pindah Sementara", "Lainnya"] },
        { key: "keterangan", label: "Keterangan Tambahan", type: "textarea", required: false, placeholder: "Kondisi meter terakhir atau hal lain yang perlu diketahui petugas." }
      ],
      syarat: [
        { id: "s1", teks: "Pelanggan berstatus aktif; penutupan sementara tidak menghapus nomor pelanggan.", wajib: true },
        { id: "s2", teks: "Untuk pembukaan kembali, seluruh tunggakan rekening wajib dilunasi terlebih dahulu.", wajib: true },
        { id: "s3", teks: "Masa penutupan sementara mengikuti ketentuan yang berlaku dan dapat diperpanjang satu kali.", wajib: true },
        { id: "s4", teks: "Selama masa tutup, pelanggan tetap dikenakan biaya administrasi layanan minimum sesuai ketentuan.", wajib: true }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI", "INDUSTRI"]
    },
    {
      id: "jasa-golongan",
      nama: "Perubahan Golongan / Mutasi Data",
      icon: "⇄",
      deskripsi: "Permohonan perubahan golongan tarif (kelas pelanggan), perubahan nama, alamat, atau data kontak pelanggan aktif. Penyesuaian tarif berlaku sejak pembacaan meter berikutnya.",
      ringkasanIntro: "Permohonan perubahan golongan tarif atau mutasi data pelanggan yang diproses melalui verifikasi data pendukung.",
      estimasi: "Biaya administrasi perubahan golongan/data: ±Rp 25.000 – 50.000. Penyesuaian tarif berlaku sejak pembacaan meter berikutnya.",
      formSchema: [
        { key: "jenis_perubahan", label: "Jenis Perubahan", type: "select", required: true, options: ["Golongan / Tarif", "Nama Pelanggan", "Alamat", "Data Kontak / Pemilik"] },
        { key: "golongan_saat_ini", label: "Golongan Saat Ini", type: "select", required: true, options: jelPel() },
        { key: "golongan_tujuan", label: "Golongan Tujuan (untuk perubahan tarif)", type: "select", required: false, options: jelPel() },
        { key: "alasan", label: "Alasan Perubahan", type: "textarea", required: true, placeholder: "Misal: fungsi bangunan berubah dari rumah menjadi tempat usaha, atau peralihan kepemilikan." }
      ],
      syarat: [
        { id: "s1", teks: "Pelanggan berstatus aktif; perubahan berlaku sejak pembacaan meter berikutnya.", wajib: true },
        { id: "s2", teks: "Perubahan golongan disesuaikan dengan kondisi aktual bangunan/jenis pemakaian.", wajib: true },
        { id: "s3", teks: "Bila ditemukan ketidaksesuaian golongan, dikenakan penyesuaian sesuai ketentuan tarif.", wajib: true },
        { id: "s4", teks: "Perubahan nama/alamat memerlukan data identitas dan informasi pendukung yang benar.", wajib: true }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI", "INDUSTRI"]
    },
    {
      id: "jasa-sertifikat",
      nama: "Sertifikat / Surat Keterangan",
      icon: "▣",
      deskripsi: "Penerbitan sertifikat pelanggan aktif, surat bebas tunggakan, surat keterangan penggunaan air, atau legitimasi data pelanggan untuk keperluan bank, asuransi, instansi, dan lainnya.",
      ringkasanIntro: "Penerbitan sertifikat atau surat keterangan pelanggan dengan verifikasi data dan pelunasan tunggakan (untuk surat bebas tunggakan).",
      estimasi: "Biaya administrasi per rangkap: ±Rp 15.000 – 35.000 (belum termasuk materai). Dihitung sesuai jumlah rangkap yang diminta.",
      formSchema: [
        { key: "jenis_surat", label: "Jenis Surat / Sertifikat", type: "select", required: true, options: ["Sertifikat Pelanggan Aktif", "Surat Bebas Tunggakan", "Surat Keterangan Penggunaan Air", "Legitimasi / Perubahan Data"] },
        { key: "keperluan", label: "Keperluan Surat", type: "select", required: true, options: ["Bank / Kredit", "Asuransi", "Instansi / Kelurahan", "Kebutuhan Dinas", "Lainnya"] },
        { key: "tujuan_surat", label: "Instansi / Pihak Tujuan Surat", type: "text", required: true, placeholder: "cth. Bank BTN Cabang Bogor" },
        { key: "jumlah_rangkap", label: "Jumlah Rangkap", type: "number", required: true, placeholder: "1 – 5", hint: "Biaya administrasi dihitung per rangkap." }
      ],
      syarat: [
        { id: "s1", teks: "Pelanggan berstatus aktif dan data identitas sudah sesuai dengan database perusahaan.", wajib: true },
        { id: "s2", teks: "Untuk surat bebas tunggakan, seluruh rekening wajib lunas terlebih dahulu.", wajib: true },
        { id: "s3", teks: "Sertifikat/surat keterangan disahkan oleh pejabat berwenang sesuai prosedur.", wajib: true },
        { id: "s4", teks: "Biaya administrasi per rangkap mengikuti tarif yang berlaku.", wajib: true }
      ],
      jenisPelanggan: ["RT-1", "RT-2", "RT-3", "NIAGA-1", "NIAGA-2", "SOSIAL", "INSTANSI", "INDUSTRI"]
    }
  ];

  /* Data yang diisi langsung pada formulir, sesuai jenis layanan. */
  const DATA_LAYANAN = {
    "jasa-pasang": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}", hint: "Masukkan 16 digit NIK." },
      { key: "nomor_kk", label: "Nomor Kartu Keluarga", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "status_kepemilikan", label: "Status Kepemilikan Bangunan", type: "select", required: true, options: ["Milik sendiri", "Sewa / kontrak", "Lainnya"] },
      { key: "nomor_bukti_tanah", label: "Nomor Bukti Kepemilikan / Persetujuan Pemilik", type: "text", required: true },
      { key: "nomor_pbb", label: "Nomor Objek Pajak PBB", type: "text", required: false },
      { key: "patokan_lokasi", label: "Patokan Lokasi Bangunan", type: "textarea", required: true }
    ],
    "jasa-meter": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "angka_meter", label: "Angka Meter Saat Ini (m³)", type: "number", required: false }
    ],
    "jasa-sambung": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "nomor_pbb", label: "Nomor Objek Pajak PBB", type: "text", required: false },
      { key: "patokan_lokasi", label: "Patokan Titik Baru", type: "textarea", required: true },
      { key: "nomor_izin_jalan", label: "Nomor Izin Jalan (jika diperlukan)", type: "text", required: false }
    ],
    "jasa-tutup": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "tanggal_diminta", label: "Tanggal Pelaksanaan Diinginkan", type: "date", required: false }
    ],
    "jasa-golongan": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "nomor_kk", label: "Nomor Kartu Keluarga", type: "text", required: false, pattern: "[0-9]{16}" },
      { key: "data_saat_ini", label: "Data Saat Ini", type: "text", required: true },
      { key: "data_baru", label: "Data Baru yang Diajukan", type: "text", required: true }
    ],
    "jasa-sertifikat": [
      { key: "nik", label: "NIK Pemohon", type: "text", required: true, pattern: "[0-9]{16}" },
      { key: "nama_pada_rekening", label: "Nama pada Rekening Air", type: "text", required: true }
    ]
  };
  JASA_DETAILS.forEach((s) => { s.dataSchema = DATA_LAYANAN[s.id] || []; });

  /* ---------------- Katalog keluhan ---------------- */
  const KELUHAN_DETAILS = [
    { id: "keluhan-nol", nama: "Air Tidak Mengalir", icon: "☓", deskripsi: "Tidak ada air sama sekali yang mengalir dari kran (debit 0 / no water). Bail ke prioritas tinggi." },
    { id: "keluhan-lemak", nama: "Air Kurang Lancar", icon: "≋", deskripsi: "Aliran air lemah atau debit menurun dan tidak sekuat biasanya, terutama jam-jam tertentu." },
    { id: "keluhan-bocor", nama: "Bocor Pipa", icon: "〰", deskripsi: "Adanya kebocoran pipa, baik di lingkungan umum (jalan) maupun area pelanggan." },
    { id: "keluhan-keruh", nama: "Air Keruh / Berbau", icon: "〜", deskripsi: "Air yang keluar keruh, berwarna, berbau, atau mengandung pasir/endapan." },
    { id: "keluhan-meter", nama: "Meter Bermasalah", icon: "▤", deskripsi: "Meter berputar tanpa pemakaian, tidak berfungsi, atau angka tagihan tidak sesuai." },
    { id: "keluhan-tagihan", nama: "Tagihan Tidak Sesuai", icon: "▧", deskripsi: "Rekening dirasa terlalu tinggi atau tidak sesuai dengan volume pemakaian." }
  ];

  const JASA_OPTIONS = JASA_DETAILS.map((s) => ({ id: s.id, nama: s.nama, desc: s.deskripsi }));
  const KELUHAN_OPTIONS = KELUHAN_DETAILS.map((s) => ({ id: s.id, nama: s.nama, desc: s.deskripsi }));

  const SOURCE_TYPES = { jasa: "Jasa", keluhan: "Keluhan" };
  const PRIORITY_META = {
    Rendah: { chip: "gray" },
    Normal: { chip: "blue" },
    Tinggi: { chip: "amber" },
    "Sangat Tinggi": { chip: "danger" }
  };
  const STATUS_META = {
    Baru: { chip: "blue" },
    "Verifikasi Data": { chip: "blue" },
    "Verifikasi": { chip: "blue" },
    "Survey Lapangan": { chip: "amber" },
    "Penanganan": { chip: "amber" },
    "Menunggu Pembayaran": { chip: "amber" },
    "Selesai": { chip: "teal" },
    "Ditolak": { chip: "danger" },
    "Dibatalkan": { chip: "gray" }
  };
  const STATUS_FLOW = ["Baru", "Verifikasi Data", "Survey Lapangan", "Menunggu Pembayaran", "Selesai"];
  const STATUS_FLOW_KELUHAN = ["Baru", "Verifikasi", "Penanganan", "Selesai"];

  /* ---------------- Seed data ---------------- */
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
          jenisPelanggan: "RT-2",
          formData: {},
          syaratCheck: { jenisPelanggan: "RT-2", syarat: [], kontrak: [] },
          dokumen: [],
          ringkasan: "Keluhan: Air Kurang Lancar — aliran air di lantai dua sangat lemah. Diprioritaskan penanganan petugas lapangan.",
          biaya: { nominal: null, catatan: "—" },
          status: "Baru",
          created: d(0),
          timeline: [{ date: d(0), text: "Tiket dibuat oleh pelanggan" }],
          reaction: null
        },
        {
          id: "TPK-2026-0411",
          type: "jasa",
          idLayanan: "jasa-pasang",
          nmLayanan: "Pemasangan Baru",
          nama: "Dewi Lestari",
          noHP: "0813 9988 7766",
          alamat: "Perum Griya Bukit Jaya Blok C2 No.8, Bogor Timur",
          zona: "Zona 2 – Bogor Timur",
          noPelanggan: "—",
          keluhan: "",
          jasa: "",
          catatan: "",
          prioritas: "Normal",
          jenisPelanggan: "RT-2",
          formData: { jenis_bangunan: "Rumah Tinggal", jumlah_lantai: "2", luas_tanah: "72", jarak_pipa: "8", sumber_saat_ini: "Sumur / Jetpump", pemakaian_rencana: "10 – 20 m³", titik_sambungan: "Titik di depan pagar, sisi kiri dari gapura utama." },
          syaratCheck: { jenisPelanggan: "RT-2", syarat: ["s1", "s2", "s3", "s4", "s5", "s6"], kontrak: ["k1", "k2", "k3", "k4", "k6", "k7"] },
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
      if (typeof t.reaction !== "number" && t.reaction !== null) { t.reaction = null; changed = true; }
      if (!Array.isArray(t.timeline)) { t.timeline = []; changed = true; }
      if (!t.formData || typeof t.formData !== "object") { t.formData = {}; changed = true; }
      if (t.status === "Verifikasi Berkas") { t.status = "Verifikasi Data"; changed = true; }
      if (!t.syaratCheck || typeof t.syaratCheck !== "object") { t.syaratCheck = { jenisPelanggan: null, syarat: [], kontrak: [] }; changed = true; }
      if (!Array.isArray(t.dokumen)) { t.dokumen = []; changed = true; }
      if (typeof t.ringkasan !== "string") { t.ringkasan = ""; changed = true; }
      if (!t.biaya || typeof t.biaya !== "object") { t.biaya = { nominal: null, catatan: "—" }; changed = true; }
      if (!t.jenisPelanggan) { t.jenisPelanggan = t.syaratCheck.jenisPelanggan || "—"; changed = true; }
      t.dokumen.forEach((doc) => {
        doc.status = doc.status || "belum";
      });
    });
    if (changed) DB.set(db);
    return db;
  }

  function svc(id) {
    const jasa = JASA_DETAILS.find((s) => s.id === id);
    if (jasa) return jasa;
    return KELUHAN_DETAILS.find((s) => s.id === id) || null;
  }

  function jpById(id) {
    return JENIS_PELANGGAN.find((j) => j.id === id) || null;
  }

  function fmtRupiah(n) {
    if (n === null || n === undefined || n === "") return "—";
    return "Rp " + Number(n).toLocaleString("id-ID");
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

  function todays() {
    return new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  /* ---------------- Toast ---------------- */
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

  /* ---------------- Ringkasan kebutuhan builder ---------------- */
  function fieldLabel(jasa, key) {
    const f = [...(jasa.formSchema || []), ...(jasa.dataSchema || [])].find((x) => x.key === key);
    return f ? f.label : key;
  }

  function buildRingkasan(jasa, formData, jenisId, docDone, docTotal) {
    const lines = [];
    lines.push(jasa.ringkasanIntro || jasa.deskripsi);
    const used = (jasa.formSchema || []).filter((f) => formData[f.key]);
    if (used.length) {
      const items = used.map((f) => "<li><b>" + f.label + ":</b> " + formData[f.key] + "</li>").join("");
      lines.push("<ul class='sum-list'>" + items + "</ul>");
    }
    if (jenisId) {
      const jp = jpById(jenisId);
      lines.push("<div><b>Jenis Pelanggan:</b> " + (jp ? jp.nama + " (" + jp.id + ")" : jenisId) + "</div>");
    }
    lines.push("<div class='muted'><b>Estimasi biaya indikatif:</b> " + jasa.estimasi + "</div>");
    return lines.join("<br>");
  }

  /* ---------------- Role helper ---------------- */
  function getRole() {
    try {
      const s = JSON.parse(localStorage.getItem("tirtapakuan_session") || "null");
      if (s && s.role) return s.role;
    } catch (e) {}
    return "pelanggan";
  }
  window.TP_CURRENT_ROLE = null;
  function currentRole() {
    const local = window.TP_CURRENT_ROLE;
    if (local) return local;
    return getRole();
  }

  /* ---------------- Push notification ---------------- */
  function pushNotif(text, ico) {
    const db = DB.get();
    db.notifications.unshift({ id: Date.now(), ico: ico || "☏", text: text, time: "Baru saja", unread: true });
    db.notifications = db.notifications.slice(0, 30);
    DB.set(db);
  }

  /* =========================================================
     SHARED TICKET MODAL (digunakan ticketing.html & dashboard.html)
     ========================================================= */
  function flowOf(type) {
    return type === "keluhan" ? STATUS_FLOW_KELUHAN : STATUS_FLOW;
  }

  function statusLineHtml(type, status) {
    const flow = flowOf(type);
    const curIdx = flow.indexOf(status);
    if (curIdx < 0) return "";
    return flow.map((s, i) => {
      let cls = "step";
      if (i < curIdx) cls += " done";
      if (i === curIdx) cls += " active";
      return `<div class="${cls}"><span class="n">${i + 1}</span>${s}</div>`;
    }).join("");
  }

  function docStatusMeta(doc) {
    if (doc.status === "unggah") return { label: "Diupload", chip: "teal", ico: "✓" };
    if (doc.status === "siap") return { label: "Siap", chip: "blue", ico: "☐" };
    return { label: "Belum", chip: "gray", ico: "○" };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function formDataHtml(t) {
    const jasa = svc(t.idLayanan);
    if (!jasa || !jasa.formSchema || !t.formData) return "";
    const rows = [...jasa.formSchema, ...(jasa.dataSchema || [])]
      .filter((f) => t.formData[f.key])
      .map((f) => `<tr><td>${escapeHtml(f.label)}</td><td class="right">${escapeHtml(t.formData[f.key])}</td></tr>`)
      .join("");
    return rows ? `<table class="table"><tbody>${rows}</tbody></table>` : "";
  }

  function buildTicketHtml(t, role) {
    const isJasa = t.type === "jasa";
    const isStaff = role === "petugas" || role === "admin";
    const flow = flowOf(t.type);
    const curIdx = flow.indexOf(t.status);
    const nxt = flow[curIdx + 1] || "";
    const endStatus = t.status === "Selesai" || t.status === "Dibatalkan" || t.status === "Ditolak";
    const sm = STATUS_META[t.status] || { chip: "gray" };
    const pm = PRIORITY_META[t.prioritas] || { chip: "gray" };
    const jp = jpById(t.jenisPelanggan);
    const biaya = t.biaya || {};
    const canSetBiaya = isStaff && isJasa && !endStatus && (["Verifikasi Data", "Survey Lapangan", "Menunggu Pembayaran"].indexOf(t.status) >= 0);
    const canReject = isStaff && !endStatus && (t.status === "Verifikasi Data" || t.status === "Verifikasi");

    const biayaBlock = `<div class="card tcard">
      <div class="card-header"><h3>Biaya Layanan</h3></div>
      <div class="biaya-line"><span>Nominal ditetapkan</span><b>${fmtRupiah(biaya.nominal)}</b></div>
      ${biaya.catatan && biaya.catatan !== "—" ? `<div class="small muted">${biaya.catatan}</div>` : ""}
      ${canSetBiaya ? `<div class="biaya-edit">
          <input class="input" id="biaya-input" type="number" min="0" placeholder="Nominal biaya (Rp)" value="${biaya.nominal || ""}">
          <button class="btn teal small" onclick="TP.setBiaya('${t.id}')">Simpan Biaya</button>
        </div>` : ""}
    </div>`;

    const sct = { jenis: t.syaratCheck?.jenisPelanggan || t.jenisPelanggan || "—", syarat: (t.syaratCheck?.syarat || []).length, kontrak: (t.syaratCheck?.kontrak || []).length };
    const kelengkapan = `Jenis: <b>${jp ? jp.nama : (sct.jenis || "—")}</b> · Syarat disetujui: <b>${sct.syarat}</b> · Kontrak disetujui: <b>${sct.kontrak}</b>`;

    return `<div class="modal-backdrop open" id="ticketModalShell" onclick="if(event.target===this)TP.closeTicketModal()">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3>${t.id} — ${t.nmLayanan}</h3>
          <button class="modal-close" onclick="TP.closeTicketModal()" aria-label="Tutup">×</button>
        </div>
        <div id="ttm-body">
          <div class="pills">
            <span class="pill ${isJasa ? "teal" : "blue"}">${SOURCE_TYPES[t.type]}</span>
            <span class="pill ${pm.chip}">Prioritas: ${t.prioritas}</span>
            <span class="pill ${sm.chip}">${t.status}</span>
          </div>
          <div class="stepper sm mt-2">${statusLineHtml(t.type, t.status)}</div>
          <div class="form-grid-2 mt-2">
            <div class="small"><b>Nama:</b> ${t.nama}</div>
            <div class="small"><b>No. HP:</b> ${t.noHP}</div>
            <div class="small"><b>Alamat:</b> ${t.alamat}</div>
            <div class="small"><b>Zona:</b> ${t.zona}</div>
            <div class="small"><b>No. Pelanggan:</b> ${t.noPelanggan}</div>
            <div class="small"><b>Dibuat:</b> ${t.created}</div>
          </div>

          ${biayaBlock}

          <div class="card tcard">
            <div class="card-header"><h3>Ringkasan Kebutuhan</h3></div>
            <div class="sum-body">${t.ringkasan || "<span class='muted'>Tidak ada ringkasan.</span>"}</div>
          </div>

          ${t.formData && Object.keys(t.formData).length ? `<div class="card tcard">
            <div class="card-header"><h3>Detail Formulir Layanan</h3></div>
            <div class="table-wrap">${formDataHtml(t)}</div>
          </div>` : ""}

          ${isJasa ? `<div class="card tcard">
            <div class="card-header"><h3>Syarat & Kontrak (Kelengkapan)</h3></div>
            <div class="small">${kelengkapan}</div>
          </div>` : ""}


          <div class="card tcard">
            <div class="card-header"><h3>Detail ${isJasa ? "Permintaan Jasa" : "Keluhan"}</h3></div>
            <div class="small">${isJasa ? (t.jasa || "—") : t.keluhan}</div>
            ${t.catatan ? `<div class="small muted mt-2"><b>Catatan:</b> ${t.catatan}</div>` : ""}
          </div>

          <div class="card tcard">
            <div class="card-header"><h3>Riwayat / Timeline</h3></div>
            <ul class="timeline">${(t.timeline || []).map((tl, i) => {
              const last = i === t.timeline.length - 1;
              const cls = last ? (endStatus ? "done" : "active") : "done";
              return `<li class="${cls}"><span class="dot"></span><div class="tl-body"><time>${tl.date}</time><p>${tl.text}</p></div></li>`;
            }).join("")}</ul>
          </div>

          <div class="ticket-actions">
            <button class="btn small wa-ticket-btn" onclick="TP.waTicket('${t.id}')">Cek progress tiket via WhatsApp ↗</button>
            ${canReject ? `<button class="btn small danger ghost" onclick="TP.rejectTicket('${t.id}')">✕ Tolak / Perlu Perbaikan Data</button>` : ""}
            ${!endStatus && nxt ? `<button class="btn small" onclick="TP.advanceTicket('${t.id}')">→ Proses ke: ${nxt}</button>` : ""}
            ${!endStatus && !isStaff ? `<button class="btn small danger" onclick="TP.cancelTicket('${t.id}')">✕ Batalkan Tiket</button>` : ""}
            <button class="btn small ghost" onclick="TP.printTicket('${t.id}')">⎙ Cetak / Unduh</button>
          </div>

          <hr style="border:none;border-top:1px solid var(--gray-200);margin:14px 0">
          <div class="small"><b>Seberapa membantu layanan ini?</b></div>
          <div class="rate-stars" style="margin-top:4px">
            ${[1, 2, 3, 4, 5].map((n) =>
              `<button class="${t.reaction && t.reaction >= n ? "on" : ""}" onclick="TP.rateTicket('${t.id}',${n})">★</button>`
            ).join("")}
          </div>
        </div>
      </div>
    </div>`;
  }

  function openTicketModal(id) {
    const db = DB.get();
    const t = db.tickets.find((x) => x.id === id);
    if (!t) { toast("Tiket tidak ditemukan.", "error"); return; }
    closeTicketModal();
    const role = currentRole();
    const div = document.createElement("div");
    div.innerHTML = buildTicketHtml(t, role).trim();
    document.body.appendChild(div.firstChild);
  }

  function closeTicketModal() {
    const el = document.getElementById("ticketModalShell");
    if (el) el.remove();
  }

  function advanceTicket(id) {
    const db = DB.get();
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return;
    const flow = flowOf(t.type);
    const nxt = flow[flow.indexOf(t.status) + 1];
    if (!nxt) return;
    if (nxt === "Menunggu Pembayaran" && !(t.biaya && t.biaya.nominal)) {
      toast("Setel nominal biaya layanan terlebih dahulu.", "error");
      return;
    }
    t.status = nxt;
    if (!Array.isArray(t.timeline)) t.timeline = [];
    t.timeline.push({ date: todays(), text: "Status diperbarui: " + nxt });
    pushNotif("Tiket " + id + " Anda sekarang berstatus: " + nxt, "☏");
    DB.set(db);
    toast("Tiket " + id + " sekarang: " + nxt, "success");
    openTicketModal(id);
  }

  function setBiaya(id) {
    const db = DB.get();
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return;
    const inp = document.getElementById("biaya-input");
    const val = inp ? Number(inp.value) : NaN;
    if (!val || val < 1) { toast("Masukkan nominal biaya yang valid.", "error"); return; }
    t.biaya = { nominal: val, catatan: t.biaya?.catatan && t.biaya.catatan !== "—" ? t.biaya.catatan : "Biaya ditetapkan petugas" };
    if (!Array.isArray(t.timeline)) t.timeline = [];
    t.timeline.push({ date: todays(), text: "Biaya layanan ditetapkan: " + fmtRupiah(val) });
    DB.set(db);
    toast("Biaya layanan disimpan.", "success");
    openTicketModal(id);
  }

  function rejectTicket(id) {
    const t = DB.get().tickets.find((x) => x.id === id);
    if (!t) return;
    if (t.status !== "Verifikasi Data" && t.status !== "Verifikasi") { toast("Tiket hanya dapat ditolak pada tahap verifikasi.", "error"); return; }
    const reason = prompt("Alasan penolakan / data kurang:", "Data tidak lengkap atau tidak sesuai.");
    if (reason === null) return;
    const db = DB.get();
    const tt = db.tickets.find((x) => x.id === id);
    tt.status = "Ditolak";
    tt.timeline.push({ date: todays(), text: "Tiket ditolak oleh petugas. Alasan: " + (reason.trim() || "—") });
    pushNotif("Tiket " + id + " ditolak. Silakan perbaiki data permohonan.", "⚠");
    DB.set(db);
    toast("Tiket " + id + " ditolak.", "success");
    openTicketModal(id);
  }

  function cancelTicket(id) {
    const db = DB.get();
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "Dibatalkan") { toast("Tiket sudah dibatalkan.", "error"); return; }
    if (t.status === "Selesai") { toast("Tiket sudah selesai.", "error"); return; }
    if (!confirm("Batalkan tiket " + id + "?")) return;
    t.status = "Dibatalkan";
    t.timeline.push({ date: todays(), text: "Tiket dibatalkan oleh pelanggan" });
    DB.set(db);
    toast("Tiket " + id + " dibatalkan.", "success");
    openTicketModal(id);
  }

  function rateTicket(id, n) {
    const db = DB.get();
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return;
    t.reaction = t.reaction === n ? null : n;
    DB.set(db);
    toast(t.reaction ? "Terima kasih atas penilaian Anda! ⭐" : "Penilaian dibatalkan.", "success");
    openTicketModal(id);
  }

  function printTicket(id) {
    const t = DB.get().tickets.find((x) => x.id === id);
    if (!t) return;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) { toast("Popup diblokir. Izinkan popup untuk mencetak.", "error"); return; }
    const isJasa = t.type === "jasa";
    const jp = jpById(t.jenisPelanggan);
    w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${t.id}</title>
      <style>body{font-family:Arial,sans-serif;color:#152238;padding:28px;line-height:1.6}
      h1{font-size:20px;margin:0 0 4px}.muted{color:#8494a8;font-size:12px}
      h2{font-size:15px;border-bottom:2px solid #0f3b77;padding-bottom:4px;margin:18px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:13px}td,th{border:1px solid #d9e0ea;padding:6px 8px;text-align:left}
      .b{float:right}.chip{border:1px solid #d9e0ea;border-radius:999px;padding:2px 10px;font-size:12px}
      @media print{.b{display:none}}</style></head><body>
        <h1>${t.id} — ${t.nmLayanan}</h1>
        <div class="muted">${SOURCE_TYPES[t.type]} · Prioritas: ${t.prioritas} · Status: ${t.status} · Dibuat: ${t.created}</div>
        <br><button class="b" onclick="window.print()">Cetak / Simpan PDF</button>
        <h2>Data Pemohon</h2>
        <table><tr><td>Nama</td><td>${t.nama}</td><td>No. HP</td><td>${t.noHP}</td></tr>
        <tr><td>Alamat</td><td colspan="3">${t.alamat}</td></tr>
        <tr><td>Zona</td><td>${t.zona}</td><td>No. Pelanggan</td><td>${t.noPelanggan}</td></tr>
        ${jp ? `<tr><td>Jenis Pelanggan</td><td colspan="3">${jp.nama} (${jp.id})</td></tr>` : ""}</table>
        <h2>Ringkasan Kebutuhan</h2>
        <div>${t.ringkasan || "—"}</div>
        <h2>Data Formulir</h2>
        ${formDataHtml(t) || "<div>—</div>"}
        <h2>Biaya Layanan</h2>
        <div>${fmtRupiah(t.biaya && t.biaya.nominal)}${t.biaya && t.biaya.catatan !== "—" ? " — " + t.biaya.catatan : ""}</div>
        <h2>Timeline</h2>
        <table><tbody>${(t.timeline || []).map((tl) => `<tr><td>${tl.date}</td><td>${tl.text}</td></tr>`).join("")}</tbody></table>
        <br><div class="muted">Dokumen hasil cetakan sistem layanan Perumda Tirta Pakuan Kota Bogor.</div>
      </body></html>`);
    w.document.close();
  }

  /* ---------------- Layanan detail modal (tabs) ---------------- */
  function openServiceModal(id) {
    const s = svc(id);
    if (!s) return;
    closeServiceModal();
    const isJasa = s.formSchema ? true : false;
    const jps = s.jenisPelanggan || [];
    const dataList = isJasa ? [...(s.dataSchema || []), ...(s.formSchema || [])] : [{ label: "Nama dan nomor WhatsApp" }, { label: "Alamat dan detail keluhan" }];
    const syaratList = isJasa ? s.syarat : [];

    const jenisContent = isJasa ? jps.map((jid) => {
      const j = jpById(jid);
      if (!j) return "";
      return `<div class="jp-card"><div><b>${j.nama}</b> <span class="chip blue">${j.id}</span></div>
        <div class="small muted">${j.golongan} · ${j.blok}</div>
        <div class="small">${j.deskripsi}</div>
        <div class="small muted"><b>Contoh:</b> ${j.cth}</div></div>`;
    }).join("") : "<div class='small muted'>Tidak berlaku untuk kategori keluhan.</div>";

    const syaratContent = syaratList.length ? syaratList.map((sy) =>
      `<div class="rincian-item"><span class="chip ${sy.wajib ? "amber" : "gray"}">${sy.wajib ? "Wajib" : "Opsional"}</span><span>${sy.teks}</span></div>`
    ).join("") : "<div class='small muted'>Tidak ada syarat khusus.";

    const kontrakContent = KONTRAK_PELANGGAN.map((k) =>
      `<div class="rincian-item"><span class="chip blue">Kontrak</span><span>${k.teks}</span></div>`
    ).join("");

    const dataContent = dataList.map((d) =>
      `<div class="rincian-item"><span class="chip ${d.required === false ? "gray" : "amber"}">${d.required === false ? "Opsional" : "Diisi"}</span><span>${d.label}</span></div>`
    ).join("");

    const estimasiContent = isJasa ? s.estimasi : "<div class='small muted'>Keluhan ditangani langsung oleh petugas tanpa biaya di muka. Bila penanganan melibatkan penggantian komponen, biaya menyesuaikan ketentuan.</div>";

    const div = document.createElement("div");
    div.className = "modal-backdrop open";
    div.id = "serviceModalShell";
    div.setAttribute("onclick", "if(event.target===this)TP.closeServiceModal()");
    div.innerHTML = `<div class="modal modal-xl" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3><span class="svc-ico">${s.icon || "▦"}</span> ${s.nama}</h3>
        <button class="modal-close" onclick="TP.closeServiceModal()" aria-label="Tutup">×</button>
      </div>
      <p class="svc-desc">${s.deskripsi}</p>
      <div class="tabs" role="tablist">
        <button class="tabs-btn active" data-tab="syarat" onclick="TP.tab('sv',0)">Syarat & Ketentuan</button>
        <button class="tabs-btn" data-tab="kontrak" onclick="TP.tab('sv',1)">Kontrak Pelanggan</button>
        <button class="tabs-btn" data-tab="jenis" onclick="TP.tab('sv',2)">Jenis Pelanggan</button>
        <button class="tabs-btn" data-tab="data" onclick="TP.tab('sv',3)">Data Formulir</button>
        <button class="tabs-btn" data-tab="estimasi" onclick="TP.tab('sv',4)">Estimasi Biaya</button>
      </div>
      <div class="tabs-panes">
        <div class="tabs-pane active" data-pane="0">${syaratContent}</div>
        <div class="tabs-pane" data-pane="1">${kontrakContent}</div>
        <div class="tabs-pane" data-pane="2">${jenisContent}</div>
        <div class="tabs-pane" data-pane="3">${dataContent}</div>
        <div class="tabs-pane" data-pane="4"><div class="est-badge">${estimasiContent}</div></div>
      </div>
    </div>`;
    document.body.appendChild(div);
  }

  function closeServiceModal() {
    const el = document.getElementById("serviceModalShell");
    if (el) el.remove();
  }

  function tabCtrl(scope, idx) {
    const shell = scope === "sv" ? document.getElementById("serviceModalShell") : null;
    if (!shell) return;
    const btns = shell.querySelectorAll(".tabs-btn");
    const panes = shell.querySelectorAll(".tabs-pane");
    btns.forEach((b, i) => b.classList.toggle("active", i === idx));
    panes.forEach((p, i) => p.classList.toggle("active", i === idx));
  }

  const WA_NUMBER = "6285810818437";
  function waUrl(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }
  function waChat() {
    window.open(waUrl("Halo CS Tirta Pakuan, saya ingin bertanya tentang layanan pelanggan."), "_blank", "noopener,noreferrer");
  }
  function waTicket(id) {
    const t = DB.get().tickets.find((item) => item.id === id);
    if (!t) { toast("Tiket tidak ditemukan.", "error"); return; }
    const message = `Halo CS Tirta Pakuan, saya ${t.nama} (No. Pelanggan: ${t.noPelanggan || "—"}). Mohon informasi progress tiket ${t.id} untuk ${t.nmLayanan}. Terima kasih.`;
    window.open(waUrl(message), "_blank", "noopener,noreferrer");
  }
  function initWaWidget() {
    const widget = document.createElement("div");
    widget.className = "wa-widget";
    widget.innerHTML = `<div class="wa-menu" id="wa-menu" hidden>
      <div class="wa-menu-head"><strong>Bantuan Tirta Pakuan</strong><span>Hubungi CS melalui WhatsApp</span></div>
      <button type="button" data-wa-chat><span>✆</span><span><b>Chat dengan CS</b><small>Tanya layanan atau sampaikan keluhan</small></span></button>
      <a href="ticketing.html#daftar-tiket"><span>▤</span><span><b>Cek progress tiket</b><small>Pilih tiket, lalu kirim pertanyaan via WA</small></span></a>
    </div><button type="button" class="wa-fab" aria-label="Buka bantuan WhatsApp" aria-expanded="false" aria-controls="wa-menu"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 .8A15.1 15.1 0 0 0 3 23.6L.9 31l7.6-2A15.2 15.2 0 1 0 16 .8Zm0 27.7a12.4 12.4 0 0 1-6.3-1.7l-.5-.3-4.5 1.2 1.2-4.4-.3-.5A12.4 12.4 0 1 1 16 28.5Zm6.8-9.3c-.4-.2-2.3-1.1-2.7-1.2-.4-.1-.6-.2-.9.2-.3.4-1 1.2-1.2 1.4-.2.2-.5.3-.9.1a10.2 10.2 0 0 1-3-1.9 11.4 11.4 0 0 1-2.1-2.6c-.2-.4 0-.6.2-.8l.7-.8c.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.4 3.9 1.6 4.2c.2.3 2.8 4.3 6.8 6 1 .4 1.8.7 2.4.9 1 .3 1.9.2 2.6.1.8-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.8-.5Z"/></svg></button>`;
    document.body.appendChild(widget);
    const fab = widget.querySelector(".wa-fab");
    const menu = widget.querySelector(".wa-menu");
    fab.addEventListener("click", () => { menu.hidden = !menu.hidden; fab.setAttribute("aria-expanded", String(!menu.hidden)); });
    widget.querySelector("[data-wa-chat]").addEventListener("click", waChat);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { menu.hidden = true; fab.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("click", (e) => { if (!widget.contains(e.target)) { menu.hidden = true; fab.setAttribute("aria-expanded", "false"); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWaWidget);
  else initWaWidget();

  /* ---------------- Compatibility wrappers (used by old onclick) ---------------- */
  window.selectTicket = openTicketModal;
  window.advanceTicket = advanceTicket;
  window.cancelTicket = cancelTicket;
  window.rateTicket = rateTicket;
  window.openTicket = function (id) { openTicketModal(id); };

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
    JENIS_PELANGGAN,
    SERVICE_CATALOG: [...JASA_DETAILS, ...KELUHAN_DETAILS],
    JASA_DETAILS,
    KELUHAN_DETAILS,
    JASA_OPTIONS,
    KELUHAN_OPTIONS,
    SOURCE_TYPES,
    PRIORITY_META,
    STATUS_META,
    STATUS_FLOW,
    STATUS_FLOW_KELUHAN,
    KONTRAK_PELANGGAN,
    svc,
    jpById,
    fmtRupiah,
    uid,
    todays,
    toast,
    buildRingkasan,
    fieldLabel,
    currentRole,
    getRole,
    openTicketModal,
    closeTicketModal,
    openServiceModal,
    closeServiceModal,
    advanceTicket,
    setBiaya,
    rejectTicket,
    cancelTicket,
    rateTicket,
    printTicket,
    waChat,
    waTicket,
    tab: tabCtrl,
    LS_KEY,
    PAKET_JASA
  };
})();
