import { Program, AccessToken, FeedbackResponse, AIAnalysisResult } from './types.ts';

export const DEMO_PROGRAM_ID = 'demo-program-2026';

export const INITIAL_DEMO_PROGRAM: Program = {
  id: DEMO_PROGRAM_ID,
  name: 'Post-Mortem Program Contoh 2026',
  date: '16 September 2026',
  location: 'Pusat Konvensyen Antarabangsa Putrajaya (PICC)',
  description: 'Konvensyen Belia & Hari Sukarelawan Kebangsaan 2026 — Menghimpunkan 1,500 urusetia & sukarelawan pelbagai agensi kerajaan dan NGO.',
  status: 'Active',
  createdAt: new Date('2026-09-15T08:00:00Z').toISOString(),
  isDemo: true,
};

// 100 Demo access tokens (first 25 marked USED, remaining 75 UNUSED)
export function generateInitialDemoTokens(): AccessToken[] {
  const seedCodes = [
    '3847', '1842', '7351', '4096', '8217', '5630', '9204', '3118', '6472', '8021',
    '1590', '4832', '7205', '9341', '2618', '5749', '3890', '6124', '8407', '1953',
    '4276', '7519', '8302', '9645', '2038', '5184', '7392', '8941', '1265', '4580',
    '6731', '9042', '2317', '5489', '7620', '8913', '1456', '3789', '6024', '8247',
    '9571', '2803', '4136', '6379', '8502', '9745', '1982', '3215', '5468', '7701',
    '8934', '1167', '3490', '5623', '7856', '9089', '2312', '4545', '6778', '8011',
    '9244', '1477', '3600', '5833', '8066', '9399', '2632', '4865', '7098', '8331',
    '9564', '1797', '3920', '6153', '8386', '9619', '2852', '5085', '7318', '8551',
    '9784', '1017', '3240', '5473', '7706', '8939', '1172', '3405', '5638', '7871',
    '9104', '1337', '3560', '5793', '8026', '9259', '1482', '3715', '5948', '8181'
  ];

  return seedCodes.map((code, index) => ({
    id: `token-demo-${index + 1}`,
    programId: DEMO_PROGRAM_ID,
    code,
    status: index < 25 ? 'USED' : 'UNUSED',
    createdAt: new Date('2026-09-15T09:00:00Z').toISOString(),
    usedAt: index < 25 ? new Date(Date.now() - (25 - index) * 3600000).toISOString() : undefined,
  }));
}

// 25 realistic, genuine Bahasa Melayu responses
export const INITIAL_DEMO_RESPONSES: FeedbackResponse[] = [
  {
    id: 'resp-001',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Kerjasama antara urusetia muda sangat bertenaga. Sambutan pengunjung dan peserta melebihi sasaran.',
      weaknesses: 'Komunikasi perubahan tentatif daripada pihak protokol lambat disalurkan kepada urusetia pintu dewan.',
      areasToImprove: ['Komunikasi', 'Masa / jadual'],
      unresolvedIssues: 'Kekurangan walkie-talkie dan saluran radio bercelaru dengan unit keselamatan venue.',
      blockingIssues: 'Tak tahu nak rujuk siapa bila flow VIP tiba-tiba berubah 10 minit sebelum perasmian.',
      doDifferently: 'Wujudkan satu PIC utama sahaja untuk hebahan perubahan tentatif melalui Telegram/Radio.',
      changeOneThing: 'Penyelarasan arahan supaya tidak berubah-ubah di saat akhir.',
      mustRetain: 'Sistem briefing pagi dan semangat sukarelawan.',
      additionalComments: 'Perlu sediakan air mineral secukupnya di setiap checkpoint urusetia.'
    },
    createdAt: new Date('2026-09-16T08:15:00Z').toISOString()
  },
  {
    id: 'resp-002',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Dewan berhawa dingin selesa, peralatan multimedia dan LED screen berfungsi baik.',
      weaknesses: 'Pendaftaran sesak teruk di awal pagi. Kaunter QR code tidak cukup scanner.',
      areasToImprove: ['Pendaftaran', 'Teknikal / PA System'],
      unresolvedIssues: 'Kelewatan mencetak lencana nama bagi peserta walk-in.',
      blockingIssues: 'Peserta mula bising dan menolak di pintu masuk kerana sistem tergendala 15 minit.',
      doDifferently: 'Gunakan pre-registration badge dan asingkan lorong peserta VIP, peserta biasa dan walk-in.',
      changeOneThing: 'Kelancaran kaunter pendaftaran.',
      mustRetain: 'Booth pameran interaktif.',
      additionalComments: 'Tolong jangan letak urusetia baharu tanpa bimbingan senior di kaunter pendaftaran.'
    },
    createdAt: new Date('2026-09-16T08:32:00Z').toISOString()
  },
  {
    id: 'resp-003',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Makanan tengah hari sedap dan porsi cukup. Pengurusan kebajikan urusetia agak memuaskan.',
      weaknesses: 'Jadual slot forum berlarutan 40 minit melebihi waktu asal, menyebabkan rehat tengah hari tergesa-gesa.',
      areasToImprove: ['Masa / jadual', 'Pengurusan urusetia'],
      unresolvedIssues: 'Masa solat Zohor terlampau singkat untuk urusetia bertugas ganti syif.',
      blockingIssues: 'Tiada sistem syif makan yang jelas, sesetengah urusetia terpaksa berlapar jaga floor.',
      doDifferently: 'Tetapkan timer loceng amaran kepada moderator forum dan jadual syif rehat yang tegas.',
      changeOneThing: 'Disiplin masa penceramah dan moderator.',
      mustRetain: 'Menu makan tengah hari dan pek makanan urusetia.',
      additionalComments: 'Terima kasih pihak pengurusan atas cenderahati yang bermakna.'
    },
    createdAt: new Date('2026-09-16T08:50:00Z').toISOString()
  },
  {
    id: 'resp-004',
    programId: DEMO_PROGRAM_ID,
    rating: 2,
    answers: {
      strengths: 'Kehadiran peserta amat memberangsangkan, dewan penuh.',
      weaknesses: 'Komunikasi sesama ketua unit gagal. Arahan sentiasa bercanggah antara Pengarah Program dan Timbalan.',
      areasToImprove: ['Komunikasi', 'Pengurusan urusetia'],
      unresolvedIssues: 'Info lambat sampai. Kami di ground floor dapat arahan bertentangan dengan pihak di bilik kawalan.',
      blockingIssues: 'Arahan selalu berubah di saat akhir membuatkan urusetia nampak tidak profesional depan tetamu.',
      doDifferently: 'Hanya SATU chain of command. Jangan semua ketua nak bagi arahan terus ke floor.',
      changeOneThing: 'Struktur arahan pengurusan atasan.',
      mustRetain: 'Komitmen barisan urusetia bawahan yang bertungkus lumus.',
      additionalComments: 'Hargai masa urusetia yang datang dari subuh tapi tak diberi taklimat terperinci.'
    },
    createdAt: new Date('2026-09-16T09:10:00Z').toISOString()
  },
  {
    id: 'resp-005',
    programId: DEMO_PROGRAM_ID,
    rating: 5,
    answers: {
      strengths: 'Pengurusan pentas dan teknikal muzik/gimik perasmian berjalan dengan sangat memukau dan lancar.',
      weaknesses: 'Sedikit kesesakan di tempat letak kereta untuk kenderaan urusetia.',
      areasToImprove: ['Logistik'],
      unresolvedIssues: 'Pas khas parkir urusetia tidak diiktiraf oleh pengawal keselamatan PICC di fasa awal.',
      blockingIssues: 'Tiada masalah besar bagi pasukan kami.',
      doDifferently: 'Briefing bersama pihak sekuriti venue seminggu lebih awal.',
      changeOneThing: 'Penyelarasan pas parkir.',
      mustRetain: 'Pasukan produksi pentas dan juruvideo.',
      additionalComments: 'Syabas dan tahniah kepada seluruh jawatankuasa penganjur!'
    },
    createdAt: new Date('2026-09-16T09:25:00Z').toISOString()
  },
  {
    id: 'resp-006',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Bahan cetakan dan montaj video sangat berkualiti tinggi.',
      weaknesses: 'Sistem PA dewan kecil bergema teruk dan mikrofon tanpa wayar kerap terputus sambungan.',
      areasToImprove: ['Teknikal / PA System'],
      unresolvedIssues: 'Bateri mic habis sewaktu sesi soal jawab terbuka.',
      blockingIssues: 'Audio feedback yang menyakitkan telinga tetamu pada awal pagi.',
      doDifferently: 'Wajibkan sound-check penuh sekurang-kurangnya 2 jam sebelum majlis bermula.',
      changeOneThing: 'Penyelenggaraan audio visual dan bateri sandaran.',
      mustRetain: 'Penyedia grafik dan montaj multimedia.',
      additionalComments: 'Sewa sistem audio yang lebih terbukti kualitinya.'
    },
    createdAt: new Date('2026-09-16T09:40:00Z').toISOString()
  },
  {
    id: 'resp-007',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Penyambut tetamu mesra dan mematuhi etika pakaian dengan kemas.',
      weaknesses: 'Pengurusan tempat duduk VIP kelam-kabut bila ada tetamu kehormat bawa pengiring tambahan.',
      areasToImprove: ['Pengurusan peserta', 'Protokol'],
      unresolvedIssues: 'Kekurangan kerusi reserved di barisan hadapan.',
      blockingIssues: 'Terpaksa heret kerusi tambahan semasa tetamu sedang melangkah masuk.',
      doDifferently: 'Sediakan sekurang-kurangnya 10 kerusi buffer berlabel simpanan di barisan kedua VIP.',
      changeOneThing: 'Kira bilangan pengiring VIP dengan teliti semasa RSVP.',
      mustRetain: 'Pakaian seragam urusetia yang kemas.',
      additionalComments: 'Pastikan penunjuk arah diletakkan di setiap persimpangan koridor.'
    },
    createdAt: new Date('2026-09-16T09:55:00Z').toISOString()
  },
  {
    id: 'resp-008',
    programId: DEMO_PROGRAM_ID,
    rating: 2,
    answers: {
      strengths: 'Objektif program tercapai dengan baik di mata luar.',
      weaknesses: 'Urusetia di belakang tabir terlalu penat dan stres kerana kekurangan tenaga kerja di bahagian logistik.',
      areasToImprove: ['Pengurusan urusetia', 'Logistik'],
      unresolvedIssues: 'Barang cenderahati lewat sampai dari lori pembekal.',
      blockingIssues: 'Urusetia terpaksa angkat kotak berat tanpa troli yang mencukupi.',
      doDifferently: 'Sewa troli kargo dan tambah bilangan sukarelawan lelaki untuk fasa loading.',
      changeOneThing: 'Kebajikan dan agihan beban kerja urusetia.',
      mustRetain: 'Semangat setiakawan urusetia.',
      additionalComments: 'Jangan anggap sukarelawan sebagai buruh percuma, sediakan rehat yang wajar.'
    },
    createdAt: new Date('2026-09-16T10:15:00Z').toISOString()
  },
  {
    id: 'resp-009',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Aktiviti interaktif menarik minat peserta generasi muda.',
      weaknesses: 'Penunjuk arah ke surau dan tandas tidak jelas, ramai peserta asyik tanya urusetia bertugas.',
      areasToImprove: ['Logistik', 'Dokumentasi'],
      unresolvedIssues: 'Bunting penunjuk arah terlekat di bilik stor dan tidak dipasang.',
      blockingIssues: 'Urusetia pintu terpaksa tinggalkan pos untuk bawa peserta ke surau.',
      doDifferently: 'Pasang signage fizikal yang besar dan jelas di semua laluan utama.',
      changeOneThing: 'Pemasangan penunjuk arah (signage).',
      mustRetain: 'Pengisian modul program.',
      additionalComments: 'Sediakan peta ringkas program di belakang pas peserta.'
    },
    createdAt: new Date('2026-09-16T10:30:00Z').toISOString()
  },
  {
    id: 'resp-010',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Kandungan ceramah bermutu tinggi dan perkongsian panel sangat bernas.',
      weaknesses: 'Komunikasi info lambat sampai. Krew teknikal tidak menerima slaid terkini penceramah.',
      areasToImprove: ['Komunikasi', 'Teknikal / PA System'],
      unresolvedIssues: 'Slaid pembentang format PowerPoint berterabur font kerana tiada laptop seragam.',
      blockingIssues: 'Penceramah terhenti sebentar kerana slaid video tidak keluar audio.',
      doDifferently: 'Tetapkan format PDF sahaja dan kumpul slaid 3 hari sebelum program.',
      changeOneThing: 'Pengurusan fail pembentangan teknikal.',
      mustRetain: 'Pemilihan penceramah jemputan.',
      additionalComments: 'Perlu ada rehearsal teknikal dengan semua bahan pembentang.'
    },
    createdAt: new Date('2026-09-16T10:45:00Z').toISOString()
  },
  {
    id: 'resp-011',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Pengurusan masa sesi pagi agak tepat pada masanya.',
      weaknesses: 'Waktu petang meleset hampir 1 jam kerana sesi bergambar terlalu panjang.',
      areasToImprove: ['Masa / jadual', 'Pengurusan peserta'],
      unresolvedIssues: 'Peserta berebut-rebut naik pentas untuk swafoto bersama tetamu jemputan.',
      blockingIssues: 'Kawalan pentas longgar selepas gimik penutup.',
      doDifferently: 'Bina laluan tali (barrier) dan tetapkan jurugambar rasmi sahaja di atas pentas.',
      changeOneThing: 'Kawalan protokol sesi fotografi pentas.',
      mustRetain: 'Gimik penutupan program.',
      additionalComments: 'Sediakan slot photo booth khas di luar dewan untuk kurangkan kesesakan pentas.'
    },
    createdAt: new Date('2026-09-16T11:00:00Z').toISOString()
  },
  {
    id: 'resp-012',
    programId: DEMO_PROGRAM_ID,
    rating: 5,
    answers: {
      strengths: 'Keselamatan terkawal rapi. Kerjasama polis bantuan dan pasukan perubatan amat cemerlang.',
      weaknesses: 'Kawasan drop-off tetamu sedikit sesak bila bas serentak tiba.',
      areasToImprove: ['Keselamatan', 'Logistik'],
      unresolvedIssues: 'Pemandu bas meletak kenderaan di laluan kecemasan.',
      blockingIssues: 'Tiada walkie talkie khas untuk marshal trafik luar.',
      doDifferently: 'Asingkan zon ketibaan bas persiaran dan kereta persendirian.',
      changeOneThing: 'Pelan aliran trafik luar bangunan.',
      mustRetain: 'Kesiapsiagaan pasukan medik dan first aider.',
      additionalComments: 'Bagus ada pasukan first aid standby, mereka sempat rawat seorang peserta pengsan.'
    },
    createdAt: new Date('2026-09-16T11:15:00Z').toISOString()
  },
  {
    id: 'resp-013',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Makanan minum mencukupi, tiada aduan keracunan atau makanan basi.',
      weaknesses: 'Makanan lewat sampai 45 minit untuk sesi minum petang.',
      areasToImprove: ['Makanan', 'Masa / jadual'],
      unresolvedIssues: 'Katering hadapi masalah lori rosak.',
      blockingIssues: 'Peserta mula berkumpul di meja kosong menunggu kuih-muih tiba.',
      doDifferently: 'Pilih katering yang ada cawangan berdekatan atau minta mereka siap sedia 1 jam awal.',
      changeOneThing: 'Ketepatan masa pihak katering.',
      mustRetain: 'Pilihan hidangan vegetarian untuk peserta tertentu.',
      additionalComments: 'Air kopi dan teh perlu sentiasa panas.'
    },
    createdAt: new Date('2026-09-16T11:30:00Z').toISOString()
  },
  {
    id: 'resp-014',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Dokumentasi foto dan video sangat pantas dimuat naik ke media sosial rasmi.',
      weaknesses: 'Laporan bertulis minit post-mortem harian tidak dibuat secara berstruktur.',
      areasToImprove: ['Dokumentasi', 'Komunikasi'],
      unresolvedIssues: 'Isu yang dibangkitkan hari pertama berulang semula pada hari kedua.',
      blockingIssues: 'Tiada saluran maklum balas segera antara urusetia dan ketua komiti.',
      doDifferently: 'Adakan debriefing 15 minit setiap petang selepas tamat program harian.',
      changeOneThing: 'Sesi debrief ringkas harian.',
      mustRetain: 'Liputan live update media sosial.',
      additionalComments: 'Aplikasi Suara Urusetia ini sangat bagus untuk beri komen jujur tanpa takut.'
    },
    createdAt: new Date('2026-09-16T11:45:00Z').toISOString()
  },
  {
    id: 'resp-015',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Lokasi program strategik dan berprestij tinggi.',
      weaknesses: 'Suhu pendingin hawa di sesetengah sudut dewan terlalu sejuk dan tidak dapat dilaraskan segera.',
      areasToImprove: ['Logistik', 'Teknikal / PA System'],
      unresolvedIssues: 'PIC teknikal venue lambat memberi respon kepada panggilan urusetia.',
      blockingIssues: 'Peserta warga emas mengadu sakit sendi kerana kedinginan.',
      doDifferently: 'Pastikan PIC fasiliti venue berada bersama di bilik kawalan operasi.',
      changeOneThing: 'Akses terus kepada juruteknik bangunan venue.',
      mustRetain: 'Pemilihan venue di PICC.',
      additionalComments: 'Sediakan selimut kecemasan atau nasihatkan peserta bawa jaket awal.'
    },
    createdAt: new Date('2026-09-16T12:00:00Z').toISOString()
  },
  {
    id: 'resp-016',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Penyusunan kerusi dan susun atur meja banquet kemas dan profesional.',
      weaknesses: 'Tong sampah tidak mencukupi di sekitar dewan pameran.',
      areasToImprove: ['Logistik', 'Pengurusan urusetia'],
      unresolvedIssues: 'Cawan kertas dan botol air terbiar di atas kerusi dan lantai.',
      blockingIssues: 'Urusetia terpaksa kutip sampah sebelum majlis penutup bermula.',
      doDifferently: 'Letakkan tong sampah kitar semula di setiap pintu keluar dan sudut dewan.',
      changeOneThing: 'Penyediaan kemudahan pelupusan sisa.',
      mustRetain: 'Susun atur dekorasi dewan.',
      additionalComments: 'Kempen "Kembalikan Kebersihan Dewan" boleh diumumkan di skrin utama.'
    },
    createdAt: new Date('2026-09-16T12:15:00Z').toISOString()
  },
  {
    id: 'resp-017',
    programId: DEMO_PROGRAM_ID,
    rating: 2,
    answers: {
      strengths: 'Impak program kepada peserta amat tinggi.',
      weaknesses: 'Ketua unit hilang dari radar bila berlaku krisis. Tak tahu nak rujuk siapa!',
      areasToImprove: ['Komunikasi', 'Pengurusan urusetia'],
      unresolvedIssues: 'Peserta VIP merungut tentang bilik menunggu yang tiada bekalan air.',
      blockingIssues: 'PIC tidak jelas, urusetia bawahan dipersalahkan padahal arahan tak diberi.',
      doDifferently: 'Senaraikan nama dan nombor telefon PIC setiap seksyen di belakang tag urusetia.',
      changeOneThing: 'Kebertanggungjawaban dan ketelusan ketua komiti.',
      mustRetain: 'Kreativiti pasukan grafik.',
      additionalComments: 'Perlu ada penghargaan khusus kepada sukarelawan yang kerja lebih masa.'
    },
    createdAt: new Date('2026-09-16T12:30:00Z').toISOString()
  },
  {
    id: 'resp-018',
    programId: DEMO_PROGRAM_ID,
    rating: 5,
    answers: {
      strengths: 'Modul latihan sukarelawan sebelum acara sangat membantu meningkatkan keyakinan.',
      weaknesses: 'Hanya sedikit kelewatan pada giliran makan urusetia fasa dua.',
      areasToImprove: ['Pengurusan urusetia'],
      unresolvedIssues: 'Semua isu kecil berjaya diselesaikan dengan pantas.',
      blockingIssues: 'Tiada halangan kritikal.',
      doDifferently: 'Teruskan format yang sama, hanya tambah masa latihan 1 hari.',
      changeOneThing: 'Masa rehat syif kedua.',
      mustRetain: 'Modul induksi dan taklimat sebelum program.',
      additionalComments: 'Saya berbangga dapat berkhidmat untuk program berskala besar ini.'
    },
    createdAt: new Date('2026-09-16T12:45:00Z').toISOString()
  },
  {
    id: 'resp-019',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Sistem pendaftaran online sebelum majlis memudahkan semakan data awal.',
      weaknesses: 'Masih ada isu teknikal sambungan Wi-Fi awam dewan yang kerap terputus.',
      areasToImprove: ['Teknikal / PA System', 'Pendaftaran'],
      unresolvedIssues: 'Sistem kehadiran berasaskan web tergendala seketika akibat tiada talian.',
      blockingIssues: 'Urusetia terpaksa guna hotspot telefon bimbit sendiri.',
      doDifferently: 'Sediakan router 5G dedicated khusus untuk unit pendaftaran.',
      changeOneThing: 'Talian internet khas untuk urusetia.',
      mustRetain: 'Pangkalan data peserta berkomputer.',
      additionalComments: 'Kredit telco data perlu diganti jika guna hotspot peribadi.'
    },
    createdAt: new Date('2026-09-16T13:00:00Z').toISOString()
  },
  {
    id: 'resp-020',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Hadiah cabutan bertuah amat lumayan dan menarik minat ramai untuk tunggu sampai habis.',
      weaknesses: 'Masa cabutan bertuah mengambil masa terlalu lama sehingga melangkau waktu bas peserta bertolak.',
      areasToImprove: ['Masa / jadual'],
      unresolvedIssues: 'Pemenang hadiah utama sudah pulang kerana mengejar tren ERL.',
      blockingIssues: 'Perjalanan program tergendala mencari pemenang yang tiada di dewan.',
      doDifferently: 'Lakukan cabutan awal secara digital dan umumkan pemenang serentak.',
      changeOneThing: 'Kaedah pelaksanaan cabutan bertuah.',
      mustRetain: 'Kualiti hadiah dan penajaan yang menarik.',
      additionalComments: 'Perlu adil kepada peserta yang bergantung kepada pengangkutan awam.'
    },
    createdAt: new Date('2026-09-16T13:15:00Z').toISOString()
  },
  {
    id: 'resp-021',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Urusan penginapan hotel urusetia luar kawasan diuruskan dengan teratur.',
      weaknesses: 'Pengangkutan van ulang-alik dari hotel ke venue tidak mematuhi jadual asal.',
      areasToImprove: ['Logistik', 'Masa / jadual'],
      unresolvedIssues: 'Pemandu van terlajak tidur pada sesi awal pagi.',
      blockingIssues: 'Satu batch urusetia lewat tiba 30 minit sebelum pintu dibuka.',
      doDifferently: 'Lantik koordinator khas untuk memantau jadual pergerakan kenderaan logistik.',
      changeOneThing: 'Ketepatan masa shuttle van urusetia.',
      mustRetain: 'Pakej kebajikan penginapan urusetia.',
      additionalComments: 'Terima kasih kerana prihatin tentang kebajikan tempat tinggal kami.'
    },
    createdAt: new Date('2026-09-16T13:30:00Z').toISOString()
  },
  {
    id: 'resp-022',
    programId: DEMO_PROGRAM_ID,
    rating: 3,
    answers: {
      strengths: 'Pengacara majlis (emcee) sangat profesional dan pandai mengawal suasana majlis.',
      weaknesses: 'Teks skrip emcee tidak dikemas kini dengan nama penuh gelaran VIP terkini.',
      areasToImprove: ['Komunikasi', 'Protokol'],
      unresolvedIssues: 'Emcee hampir tersilap sebut nama penaung majlis.',
      blockingIssues: 'Skrip baharu diserahkan sewaktu emcee sudah berada di rostrum pentas.',
      doDifferently: 'Semakan protokol perlu ditutup dan disahkan 2 jam sebelum majlis bermula.',
      changeOneThing: 'Penyelarasan teks ucapan dan senarai kehormat VIP.',
      mustRetain: 'Gandingan emcee yang bertenaga.',
      additionalComments: 'Elakkan perubahan last-minute pada skrip rasmi.'
    },
    createdAt: new Date('2026-09-16T13:45:00Z').toISOString()
  },
  {
    id: 'resp-023',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Bahan pameran dan booth agensi sangat padat dengan maklumat bermanfaat.',
      weaknesses: 'Laluan lorong antara booth terlalu sempit dan menyukarkan pergerakan kerusi roda.',
      areasToImprove: ['Logistik', 'Pengurusan peserta'],
      unresolvedIssues: 'Peserta berkerusi roda tersangkut di laluan tengah.',
      blockingIssues: 'Kesesakan pengunjung di hadapan booth popular menghalang laluan kecemasan.',
      doDifferently: 'Rancang floor plan mesra OKU dengan kelebaran laluan sekurang-kurangnya 2.5 meter.',
      changeOneThing: 'Pelan susun atur ruang pameran mesra OKU.',
      mustRetain: 'Kepelbagaian agensi yang menyertai pameran.',
      additionalComments: 'Keutamaan aksesibiliti kepada semua golongan mestilah sentiasa diutamakan.'
    },
    createdAt: new Date('2026-09-16T14:00:00Z').toISOString()
  },
  {
    id: 'resp-024',
    programId: DEMO_PROGRAM_ID,
    rating: 5,
    answers: {
      strengths: 'Sinergi dan ukhuwah antara ahli jawatankuasa amat membanggakan.',
      weaknesses: 'Hanya sedikit keletihan fizikal kerana jadual persediaan malam sebelumnya berlarutan hingga 2 pagi.',
      areasToImprove: ['Masa / jadual', 'Pengurusan urusetia'],
      unresolvedIssues: 'Tiada masalah besar yang tidak dapat diselesaikan.',
      blockingIssues: 'Kurang tidur sebelum hari sebenar.',
      doDifferently: 'Selesaikan raptai penuh dan set up dewan sebelum jam 10 malam.',
      changeOneThing: 'Waktu tamat persediaan raptai malam.',
      mustRetain: 'Budaya tolong-menolong tanpa mengira unit.',
      additionalComments: 'Pengalaman berharga yang membina jati diri kepimpinan urusetia.'
    },
    createdAt: new Date('2026-09-16T14:15:00Z').toISOString()
  },
  {
    id: 'resp-025',
    programId: DEMO_PROGRAM_ID,
    rating: 4,
    answers: {
      strengths: 'Liputan fotografi dan sudut rakaman video sangat estetik dan kemas.',
      weaknesses: 'Kad memori kamera habis di tengah-tengah sesi utama kerana tiada sandaran pantas.',
      areasToImprove: ['Dokumentasi', 'Teknikal / PA System'],
      unresolvedIssues: 'Juruvideo terlepas rakaman saat gimik pelancaran berlangsung 10 saat pertama.',
      blockingIssues: 'Penyimpanan data penuh dan bateri kamera lemah.',
      doDifferently: 'Sediakan sekurang-kurangnya 2 jurukamera dengan memori dan bateri sandaran berasingan.',
      changeOneThing: 'Peralatan sandaran pasukan media.',
      mustRetain: 'Hasil editing video montaj yang pantas.',
      additionalComments: 'Peruntukkan bajet storan cloud untuk arkib fail media berkualiti tinggi.'
    },
    createdAt: new Date('2026-09-16T14:30:00Z').toISOString()
  }
];

// Pre-computed AI Analysis result for immediate display / preview demonstration
export const INITIAL_DEMO_AI_ANALYSIS: AIAnalysisResult = {
  programId: DEMO_PROGRAM_ID,
  analyzedAt: new Date().toISOString(),
  totalResponsesAnalyzed: 25,
  overallSummary: 'Secara keseluruhannya, Post-Mortem Program Contoh 2026 merekodkan penilaian positif dengan purata skor kepuasan 3.72 daripada 5.0. Program berjaya mencapai objektif utama dengan kehadiran peserta yang amat memberangsangkan, sambutan bertenaga daripada sukarelawan, dan produksi pentas yang memukau. Walau bagaimanapun, analisis mengenalpasti titik kelemahan berulang dalam aspek komunikasi arahan di saat akhir, ketepatan masa tentatif, dan kesesakan kaunter pendaftaran yang memerlukan penambahbaikan struktur untuk penganjuran akan datang.',
  strengths: [
    'Komitmen, tenaga, dan sinergi sukarelawan urusetia muda yang sangat tinggi dan saling membantu.',
    'Pentas, gimik perasmian multimedia, kualiti pencahayaan dan montaj video bertaraf profesional.',
    'Sambutan dan kehadiran peserta melangkaui sasaran serta kandungan forum yang bermanfaat.',
    'Kesiapsiagaan pasukan keselamatan, polis bantuan dan respon segera medik/first aid.',
    'Pengurusan kebajikan asas seperti kualiti makanan dan penginapan urusetia yang baik.'
  ],
  mainWeaknesses: [
    'Komunikasi pengurusan atasan: Arahan selalu berubah di saat akhir dan maklumat lambat sampai ke urusetia ground floor.',
    'Pengurusan masa dan tentatif: Sesi forum berlarutan 40 minit menyebabkan jadual rehat dan solat terhimpit.',
    'Kesesakan pendaftaran awal pagi: Talian internet dan jumlah pengimbas kod QR tidak mencukupi.',
    'Kekurangan peralatan komunikasi radio/walkie-talkie dan saluran bercampur dengan fasiliti venue.',
    'Papan tanda (signage) penunjuk arah ke surau, tandas dan laluan pameran kurang jelas.'
  ],
  recurringIssues: [
    {
      category: 'KOMUNIKASI & PENYELARASAN ARAHAN',
      frequency: 14,
      summary: 'Responden menyatakan maklumat perubahan tentatif lambat disalurkan dan arahan bertentangan antara barisan ketua unit menimbulkan kekeliruan.',
      sampleQuotes: [
        'Tak tahu nak rujuk siapa bila flow VIP tiba-tiba berubah 10 minit sebelum perasmian.',
        'Arahan selalu berubah di saat akhir membuatkan urusetia nampak tidak profesional depan tetamu.',
        'Info lambat sampai. Kami di ground floor dapat arahan bertentangan dengan pihak di bilik kawalan.'
      ]
    },
    {
      category: 'PENGURUSAN MASA & DISIPLIN TENTATIF',
      frequency: 11,
      summary: 'Slot forum dan sesi bergambar melebihi masa yang ditetapkan sehingga menjejaskan syif makan, waktu solat, dan perjalanan balik peserta.',
      sampleQuotes: [
        'Jadual slot forum berlarutan 40 minit melebihi waktu asal, menyebabkan rehat tengah hari tergesa-gesa.',
        'Waktu petang meleset hampir 1 jam kerana sesi bergambar terlalu panjang.',
        'Tiada sistem syif makan yang jelas, sesetengah urusetia terpaksa berlapar jaga floor.'
      ]
    },
    {
      category: 'KAUNTER PENDAFTARAN & KESELAMATAN TALIAN',
      frequency: 8,
      summary: 'Kesesakan pada waktu puncak pendaftaran akibat kebergantungan kepada Wi-Fi awam yang tidak stabil serta scanner terhad.',
      sampleQuotes: [
        'Pendaftaran sesak teruk di awal pagi. Kaunter QR code tidak cukup scanner.',
        'Sistem kehadiran berasaskan web tergendala seketika akibat tiada talian internet khusus.'
      ]
    },
    {
      category: 'LOGISTIK, SIGNAGE & ALATAN TEKNIKAL',
      frequency: 7,
      summary: 'Kekurangan troli angkat barang, papan tanda penunjuk arah yang tidak dipasang tepat pada masanya, serta mikrofon audio yang terputus sambungan.',
      sampleQuotes: [
        'Penunjuk arah ke surau dan tandas tidak jelas, ramai peserta asyik tanya urusetia bertugas.',
        'Sistem PA dewan kecil bergema teruk dan bateri mic habis sewaktu sesi soal jawab terbuka.'
      ]
    }
  ],
  criticalIssues: [
    'Rantaian Arahan (Chain of Command) Terbelah: Arahan berbeza dikeluarkan serentak oleh beberapa pihak pengurusan, menyebabkan urusetia pelaksana hilang arah tindakan.',
    'Kegagalan Talian Sandaran Sistem Pendaftaran: Kaunter pendaftaran sesak dan hampir mencetuskan ketegangan dengan pengunjung kerana tiada pelan kontingensi offline.'
  ],
  recommendations: [
    'Wujudkan Single Point of Contact (SPOC) atau satu saluran rasmi (cth: Saluran Radio 1 / Telegram Rasmi) untuk semua hebahan perubahan tentatif.',
    'Laksanakan dasar "Loceng Amaran Waktu" kepada penceramah dan hadkan masa sesi fotografi VIP dengan tali barisan khas.',
    'Asingkan lorong pendaftaran: Pra-daftar QR, Peserta VIP, dan Walk-in, lengkap dengan router 5G dedicated.',
    'Sediakan sekurang-kurangnya 10 kerusi buffer berlabel simpanan di barisan kedua tetamu kehormat.',
    'Adakan sesi "Daily Debrief" selama 15 minit setiap petang untuk menyelesaikan isu hari pertama sebelum hari berikutnya.'
  ],
  actionPlan: [
    {
      issue: 'Komunikasi & Rantaian Arahan',
      causeOrObservation: 'Arahan perubahan lambat sampai dan bercanggah antara ketua komiti',
      proposedAction: 'Tetapkan SATU PIC komunikasi utama dan rantaian arahan berpusat sebelum program',
      priority: 'Tinggi'
    },
    {
      issue: 'Kesesakan Kaunter Pendaftaran',
      causeOrObservation: 'Scanner tidak mencukupi dan sambungan internet awam terputus',
      proposedAction: 'Gunakan router 5G dedicated dan sediakan lorong ekspres imbasan QR berasingan',
      priority: 'Tinggi'
    },
    {
      issue: 'Disiplin Masa & Tentatif Acara',
      causeOrObservation: 'Moderator dan penceramah melebihi had masa perbincangan',
      proposedAction: 'Kuatkuasakan timer visual di hadapan pentas dengan amaran masa 5 minit terakhir',
      priority: 'Sederhana'
    },
    {
      issue: 'Kekurangan Papan Tanda (Signage)',
      causeOrObservation: 'Bunting penunjuk arah ke surau dan tandas lewat dipasang',
      proposedAction: 'Wajibkan pemeriksaan signage selesai sekurang-kurangnya 12 jam sebelum pintu dibuka',
      priority: 'Sederhana'
    },
    {
      issue: 'Kualiti Mikrofon & Audio Dewan',
      causeOrObservation: 'Bateri mic habis sewaktu sesi soal jawab berlangsung',
      proposedAction: 'Gunakan bateri boleh cas semula berkualiti tinggi dan tukar bateri baharu pada setiap jeda rehat',
      priority: 'Rendah'
    }
  ],
  sentiment: {
    positive: 64,
    neutral: 24,
    negative: 12
  },
  anonymousQuotes: [
    'Tak tahu nak rujuk siapa bila flow VIP tiba-tiba berubah 10 minit sebelum perasmian.',
    'Semangat sukarelawan muda sangat membanggakan, tetapi kebajikan dan masa rehat mereka perlu dijaga.',
    'Pendaftaran sesak teruk di awal pagi. Mujur urusetia cepat bertindak guna kaunter manual.',
    'Terima kasih atas peluang berkhidmat. Sistem Suara Urusetia ini sangat bagus kerana kami boleh komen dengan jujur tanpa rasa takut.'
  ]
};
