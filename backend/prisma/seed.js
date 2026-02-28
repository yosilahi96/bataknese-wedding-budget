const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
    },
  });

  console.log("Created demo user:", user.email);

  const existingProject = await prisma.weddingProject.findFirst({
    where: { userId: user.id },
  });

  if (!existingProject) {
    const project = await prisma.weddingProject.create({
      data: {
        groomName: "Parlindungan Sihotang",
        brideName: "Rina Simbolon",
        groomDomicile: "Jakarta Selatan",
        brideDomicile: "Jakarta Timur",
        weddingDate: new Date("2026-06-15"),
        totalBudget: 150000000,
        userId: user.id,
        events: {
          create: [
            {
              name: "Pesta Adat",
              type: "PESTA_ADAT",
              categories: {
                create: [
                  { name: "Sinamot (Bride Price)", plannedBudget: 30000000, actualCost: 30000000, notes: "Sesuai kesepakatan keluarga", sortOrder: 1 },
                  { name: "Ulos (Traditional Cloth)", plannedBudget: 10000000, actualCost: 8500000, notes: "7 ulos untuk acara adat", sortOrder: 2 },
                  { name: "Jambar (Ceremonial Gifts)", plannedBudget: 5000000, actualCost: 5000000, notes: "Jambar tulang, hata, dan juhut", sortOrder: 3 },
                  { name: "Gondang (Traditional Music)", plannedBudget: 15000000, actualCost: 12000000, notes: "Gondang sabangunan", sortOrder: 4 },
                  { name: "Gedung (Venue)", plannedBudget: 25000000, actualCost: 27000000, notes: "Gedung di Jakarta Selatan, termasuk dekorasi", sortOrder: 5 },
                  { name: "Catering", plannedBudget: 30000000, actualCost: 28000000, notes: "500 porsi, termasuk nasi arsik dan saksang", sortOrder: 6 },
                  { name: "Dokumentasi (Photo & Video)", plannedBudget: 10000000, actualCost: 10000000, notes: "Foto + video cinematic", sortOrder: 7 },
                  { name: "Wedding Organizer", plannedBudget: 8000000, actualCost: 8000000, notes: "Full WO service", sortOrder: 8 },
                  { name: "Transport", plannedBudget: 5000000, actualCost: 4000000, notes: "Shuttle bus 2 unit", sortOrder: 9 },
                  { name: "Souvenir", plannedBudget: 7000000, actualCost: 6500000, notes: "500 pcs souvenir", sortOrder: 10 },
                  { name: "Others", plannedBudget: 5000000, actualCost: 3000000, notes: "Biaya tak terduga", sortOrder: 11 },
                ],
              },
            },
            {
              name: "3M Ceremony",
              type: "THREE_M",
              categories: {
                create: [
                  { name: "Marhusip venue", plannedBudget: 3000000, actualCost: 2500000, notes: "Ruang pertemuan keluarga", sortOrder: 1 },
                  { name: "Martumpol church", plannedBudget: 2000000, actualCost: 2000000, notes: "Gereja HKBP", sortOrder: 2 },
                  { name: "Pasu-pasu church", plannedBudget: 2000000, actualCost: 2000000, notes: "Pemberkatan nikah", sortOrder: 3 },
                  { name: "Konsumsi kecil", plannedBudget: 3000000, actualCost: 2800000, notes: "Snack dan minuman", sortOrder: 4 },
                  { name: "Dokumentasi sederhana", plannedBudget: 1500000, actualCost: 1500000, notes: "Foto saja", sortOrder: 5 },
                  { name: "Transport keluarga", plannedBudget: 2000000, actualCost: 1800000, notes: "Transport keluarga inti", sortOrder: 6 },
                  { name: "Others", plannedBudget: 1500000, actualCost: 1000000, notes: "Biaya lainnya", sortOrder: 7 },
                ],
              },
            },
          ],
        },
      },
    });

    console.log("Created sample project:", project.groomName, "&", project.brideName);
  }

  // --- Admin user ---
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { isAdmin: true },
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      isAdmin: true,
    },
  });
  console.log("Admin user:", admin.email);

  // --- Vendor seed data (70 vendors, 10 per type) ---
  const vendorCount = await prisma.vendor.count();
  if (vendorCount === 0) {
    const vendors = [
      // === VENUE (10) ===
      { name: "Gedung Serbaguna HKBP Rawamangun", type: "VENUE", location: "Jakarta Timur", minPriceEstimate: 25000000, maxPriceEstimate: 40000000, capacity: 500, description: "Gedung serbaguna gereja HKBP, cocok untuk pesta adat Batak", contactInfo: "021-4890xxxx", isBatakSpecialist: true },
      { name: "Balai Kartini", type: "VENUE", location: "Jakarta Selatan", minPriceEstimate: 50000000, maxPriceEstimate: 100000000, capacity: 1000, description: "Venue premium untuk acara besar di Jakarta Selatan", contactInfo: "021-5200xxxx", isBatakSpecialist: false },
      { name: "Gedung Juang 45", type: "VENUE", location: "Jakarta Pusat", minPriceEstimate: 20000000, maxPriceEstimate: 35000000, capacity: 400, description: "Venue strategis di pusat Jakarta, harga terjangkau", contactInfo: "021-3900xxxx", isBatakSpecialist: false },
      { name: "Aula Gereja HKBP Menteng", type: "VENUE", location: "Jakarta Pusat", minPriceEstimate: 30000000, maxPriceEstimate: 50000000, capacity: 600, description: "Aula besar di gereja HKBP Menteng, sering dipakai untuk pesta adat", contactInfo: "021-3140xxxx", isBatakSpecialist: true },
      { name: "Grand Sahid Jaya Convention", type: "VENUE", location: "Jakarta Pusat", minPriceEstimate: 80000000, maxPriceEstimate: 150000000, capacity: 1500, description: "Convention hall premium kapasitas besar", contactInfo: "021-5700xxxx", isBatakSpecialist: false },
      { name: "Gedung Serba Guna Pulo Gadung", type: "VENUE", location: "Jakarta Timur", minPriceEstimate: 15000000, maxPriceEstimate: 25000000, capacity: 350, description: "Venue ekonomis untuk acara menengah", contactInfo: "021-4610xxxx", isBatakSpecialist: false },
      { name: "Wisma GKPS Cikini", type: "VENUE", location: "Jakarta Pusat", minPriceEstimate: 22000000, maxPriceEstimate: 38000000, capacity: 450, description: "Gedung GKPS dengan suasana Batak, dekat stasiun", contactInfo: "021-3100xxxx", isBatakSpecialist: true },
      { name: "Hotel Bidakara", type: "VENUE", location: "Jakarta Selatan", minPriceEstimate: 60000000, maxPriceEstimate: 120000000, capacity: 800, description: "Hotel dengan ballroom besar, cocok untuk 800+ tamu", contactInfo: "021-8350xxxx", isBatakSpecialist: false },
      { name: "Gedung Wanita Batak Jakarta", type: "VENUE", location: "Jakarta Timur", minPriceEstimate: 18000000, maxPriceEstimate: 30000000, capacity: 400, description: "Gedung komunitas Batak, paham kebutuhan pesta adat", contactInfo: "0812-xxxx-1010", isBatakSpecialist: true },
      { name: "Sasana Kriya TMII", type: "VENUE", location: "Jakarta Timur", minPriceEstimate: 35000000, maxPriceEstimate: 65000000, capacity: 700, description: "Venue luas di area TMII, parkir memadai", contactInfo: "021-8400xxxx", isBatakSpecialist: false },

      // === CATERING (10) ===
      { name: "Sari Rasa Catering Batak", type: "CATERING", location: "Jakarta Timur", minPriceEstimate: 55000, maxPriceEstimate: 85000, capacity: 1000, description: "Spesialis masakan Batak: arsik, saksang, naniura. Harga per porsi.", contactInfo: "0812-xxxx-2001", isBatakSpecialist: true },
      { name: "Lapo Ni Tondongta Catering", type: "CATERING", location: "Jakarta Selatan", minPriceEstimate: 60000, maxPriceEstimate: 95000, capacity: 1500, description: "Catering Batak Toba autentik, menu lengkap adat. Harga per porsi.", contactInfo: "0813-xxxx-2002", isBatakSpecialist: true },
      { name: "Dapoer Batak Bu Tigor", type: "CATERING", location: "Jakarta Pusat", minPriceEstimate: 50000, maxPriceEstimate: 75000, capacity: 800, description: "Masakan Batak rumahan, arsik ikan mas spesial. Harga per porsi.", contactInfo: "0815-xxxx-2003", isBatakSpecialist: true },
      { name: "Sinar Catering Jakarta", type: "CATERING", location: "Jakarta Barat", minPriceEstimate: 65000, maxPriceEstimate: 100000, capacity: 2000, description: "Catering besar, bisa menu Batak & International. Harga per porsi.", contactInfo: "021-5600xxxx", isBatakSpecialist: false },
      { name: "Horas Catering", type: "CATERING", location: "Jakarta Timur", minPriceEstimate: 45000, maxPriceEstimate: 70000, capacity: 600, description: "Catering ekonomis menu Batak. Harga per porsi.", contactInfo: "0856-xxxx-2005", isBatakSpecialist: true },
      { name: "Nauli Catering Batak", type: "CATERING", location: "Jakarta Selatan", minPriceEstimate: 70000, maxPriceEstimate: 110000, capacity: 1200, description: "Menu premium Batak dengan presentasi modern. Harga per porsi.", contactInfo: "0811-xxxx-2006", isBatakSpecialist: true },
      { name: "Rasa Sejati Catering", type: "CATERING", location: "Tangerang", minPriceEstimate: 40000, maxPriceEstimate: 65000, capacity: 500, description: "Catering terjangkau area Tangerang, tersedia menu Batak. Harga per porsi.", contactInfo: "021-5500xxxx", isBatakSpecialist: false },
      { name: "Tabo Catering & Event", type: "CATERING", location: "Bekasi", minPriceEstimate: 50000, maxPriceEstimate: 80000, capacity: 800, description: "Spesialis catering Batak di Bekasi, paket lengkap. Harga per porsi.", contactInfo: "0858-xxxx-2008", isBatakSpecialist: true },
      { name: "Dapur Nusantara Catering", type: "CATERING", location: "Jakarta Utara", minPriceEstimate: 55000, maxPriceEstimate: 90000, capacity: 1000, description: "Catering multi-menu termasuk Batak, Padang, Jawa. Harga per porsi.", contactInfo: "021-4400xxxx", isBatakSpecialist: false },
      { name: "Arga Makmur Catering", type: "CATERING", location: "Depok", minPriceEstimate: 45000, maxPriceEstimate: 70000, capacity: 700, description: "Catering area Depok-Jakarta, menu Batak tersedia. Harga per porsi.", contactInfo: "0812-xxxx-2010", isBatakSpecialist: false },

      // === ATTIRE (10) ===
      { name: "Ulos Sianipar Collection", type: "ATTIRE", location: "Jakarta Pusat", minPriceEstimate: 5000000, maxPriceEstimate: 15000000, capacity: null, description: "Paket ulos lengkap: ulos hela, ulos saput, ulos panggabei", contactInfo: "0813-xxxx-3001", isBatakSpecialist: true },
      { name: "Rumah Ulos Jakarta", type: "ATTIRE", location: "Jakarta Timur", minPriceEstimate: 3000000, maxPriceEstimate: 10000000, capacity: null, description: "Ulos tenun asli Tarutung, harga pabrik", contactInfo: "0815-xxxx-3002", isBatakSpecialist: true },
      { name: "Naga Ulos & Songket", type: "ATTIRE", location: "Jakarta Selatan", minPriceEstimate: 8000000, maxPriceEstimate: 25000000, capacity: null, description: "Ulos premium dan songket Batak, ada custom design", contactInfo: "0812-xxxx-3003", isBatakSpecialist: true },
      { name: "Tiarma Batak Bridal", type: "ATTIRE", location: "Jakarta Barat", minPriceEstimate: 10000000, maxPriceEstimate: 30000000, capacity: null, description: "Paket bridal Batak lengkap: baju adat, ulos, aksesoris, MUA", contactInfo: "0811-xxxx-3004", isBatakSpecialist: true },
      { name: "Jakarta Kebaya House", type: "ATTIRE", location: "Jakarta Pusat", minPriceEstimate: 7000000, maxPriceEstimate: 20000000, capacity: null, description: "Kebaya modern dan traditional, termasuk paket Batak", contactInfo: "021-3200xxxx", isBatakSpecialist: false },
      { name: "Butik Adat Sigalingging", type: "ATTIRE", location: "Jakarta Timur", minPriceEstimate: 4000000, maxPriceEstimate: 12000000, capacity: null, description: "Sewa baju adat Batak lengkap pria dan wanita", contactInfo: "0856-xxxx-3006", isBatakSpecialist: true },
      { name: "Ulos Raya", type: "ATTIRE", location: "Tangerang Selatan", minPriceEstimate: 2500000, maxPriceEstimate: 8000000, capacity: null, description: "Ulos harian dan ulos adat, harga terjangkau", contactInfo: "0858-xxxx-3007", isBatakSpecialist: true },
      { name: "Modern Batak Wedding Attire", type: "ATTIRE", location: "Jakarta Selatan", minPriceEstimate: 15000000, maxPriceEstimate: 40000000, capacity: null, description: "Fusion traditional Batak + modern design, custom tailoring", contactInfo: "0821-xxxx-3008", isBatakSpecialist: true },
      { name: "Galeri Ulos Nusantara", type: "ATTIRE", location: "Jakarta Pusat", minPriceEstimate: 6000000, maxPriceEstimate: 18000000, capacity: null, description: "Galeri ulos dari berbagai daerah Batak: Toba, Karo, Simalungun", contactInfo: "0813-xxxx-3009", isBatakSpecialist: true },
      { name: "Ratna Wedding Boutique", type: "ATTIRE", location: "Bekasi", minPriceEstimate: 5000000, maxPriceEstimate: 15000000, capacity: null, description: "Butik wedding multi-adat, ada paket Batak", contactInfo: "0812-xxxx-3010", isBatakSpecialist: false },

      // === GONDANG (10) ===
      { name: "Gondang Sabangunan Pak Tobing", type: "GONDANG", location: "Jakarta Timur", minPriceEstimate: 12000000, maxPriceEstimate: 20000000, capacity: null, description: "Gondang sabangunan lengkap 7 ogung, taganing, sarune", contactInfo: "0821-xxxx-4001", isBatakSpecialist: true },
      { name: "Parsadaan Gondang Jakarta", type: "GONDANG", location: "Jakarta Pusat", minPriceEstimate: 10000000, maxPriceEstimate: 18000000, capacity: null, description: "Grup gondang profesional, sering tampil di acara adat besar", contactInfo: "0813-xxxx-4002", isBatakSpecialist: true },
      { name: "Gondang Batak Maranatha", type: "GONDANG", location: "Jakarta Selatan", minPriceEstimate: 8000000, maxPriceEstimate: 15000000, capacity: null, description: "Gondang bernuansa Kristen, cocok untuk pesta adat + gereja", contactInfo: "0856-xxxx-4003", isBatakSpecialist: true },
      { name: "Naposo Gondang Group", type: "GONDANG", location: "Bekasi", minPriceEstimate: 7000000, maxPriceEstimate: 12000000, capacity: null, description: "Gondang anak muda, energik dan modern", contactInfo: "0812-xxxx-4004", isBatakSpecialist: true },
      { name: "Siantar Gondang Ensemble", type: "GONDANG", location: "Jakarta Barat", minPriceEstimate: 9000000, maxPriceEstimate: 16000000, capacity: null, description: "Gondang Simalungun & Toba, bisa request lagu adat", contactInfo: "0815-xxxx-4005", isBatakSpecialist: true },
      { name: "Horas Music Entertainment", type: "GONDANG", location: "Jakarta Selatan", minPriceEstimate: 15000000, maxPriceEstimate: 30000000, capacity: null, description: "Paket lengkap gondang + band modern + MC", contactInfo: "0811-xxxx-4006", isBatakSpecialist: true },
      { name: "Omega Gondang", type: "GONDANG", location: "Tangerang", minPriceEstimate: 6000000, maxPriceEstimate: 10000000, capacity: null, description: "Gondang ekonomis untuk acara sederhana", contactInfo: "0858-xxxx-4007", isBatakSpecialist: true },
      { name: "Toba Strings & Gondang", type: "GONDANG", location: "Jakarta Timur", minPriceEstimate: 11000000, maxPriceEstimate: 22000000, capacity: null, description: "Kombinasi gondang tradisional + string ensemble", contactInfo: "0821-xxxx-4008", isBatakSpecialist: true },
      { name: "Gondang Sahata Jakarta", type: "GONDANG", location: "Depok", minPriceEstimate: 7500000, maxPriceEstimate: 13000000, capacity: null, description: "Grup gondang area Depok-Jakarta Selatan", contactInfo: "0812-xxxx-4009", isBatakSpecialist: true },
      { name: "Raja Gondang", type: "GONDANG", location: "Jakarta Utara", minPriceEstimate: 8500000, maxPriceEstimate: 14000000, capacity: null, description: "Gondang dengan penari tortor profesional", contactInfo: "0813-xxxx-4010", isBatakSpecialist: true },

      // === WO (10) ===
      { name: "Batak Wedding Planner by Sari", type: "WO", location: "Jakarta Selatan", minPriceEstimate: 8000000, maxPriceEstimate: 25000000, capacity: null, description: "WO spesialis adat Batak Toba, paham urutan acara dan protokol adat", contactInfo: "0811-xxxx-5001", isBatakSpecialist: true },
      { name: "Pesta Adat Organizer", type: "WO", location: "Jakarta Timur", minPriceEstimate: 6000000, maxPriceEstimate: 18000000, capacity: null, description: "WO khusus pesta adat Batak, termasuk koordinasi gondang & ulos", contactInfo: "0812-xxxx-5002", isBatakSpecialist: true },
      { name: "Tiarma Wedding Organizer", type: "WO", location: "Jakarta Pusat", minPriceEstimate: 10000000, maxPriceEstimate: 35000000, capacity: null, description: "Full service WO untuk Batak wedding, dari marhusip sampai pesta", contactInfo: "0813-xxxx-5003", isBatakSpecialist: true },
      { name: "Elegant Events Jakarta", type: "WO", location: "Jakarta Selatan", minPriceEstimate: 15000000, maxPriceEstimate: 50000000, capacity: null, description: "WO premium multi-culture, termasuk Batak", contactInfo: "021-7200xxxx", isBatakSpecialist: false },
      { name: "Horas Wedding Solution", type: "WO", location: "Jakarta Barat", minPriceEstimate: 5000000, maxPriceEstimate: 15000000, capacity: null, description: "WO ekonomis untuk acara Batak sederhana", contactInfo: "0856-xxxx-5005", isBatakSpecialist: true },
      { name: "Nusantara Wedding Planner", type: "WO", location: "Tangerang Selatan", minPriceEstimate: 12000000, maxPriceEstimate: 40000000, capacity: null, description: "WO besar, pengalaman handle Batak, Jawa, Sunda", contactInfo: "0815-xxxx-5006", isBatakSpecialist: false },
      { name: "Ito & Iboto Wedding", type: "WO", location: "Jakarta Timur", minPriceEstimate: 7000000, maxPriceEstimate: 20000000, capacity: null, description: "WO Batak husband-wife team, personal touch", contactInfo: "0821-xxxx-5007", isBatakSpecialist: true },
      { name: "Sahabat Pesta WO", type: "WO", location: "Bekasi", minPriceEstimate: 4000000, maxPriceEstimate: 12000000, capacity: null, description: "WO area Bekasi-Jakarta Timur, paket hemat Batak", contactInfo: "0858-xxxx-5008", isBatakSpecialist: true },
      { name: "Premium Batak Event", type: "WO", location: "Jakarta Pusat", minPriceEstimate: 20000000, maxPriceEstimate: 60000000, capacity: null, description: "WO premium Batak: dekorasi, koordinasi adat, entertainment", contactInfo: "0811-xxxx-5009", isBatakSpecialist: true },
      { name: "Blessing WO", type: "WO", location: "Depok", minPriceEstimate: 5000000, maxPriceEstimate: 15000000, capacity: null, description: "WO Kristen dengan pemahaman adat Batak", contactInfo: "0812-xxxx-5010", isBatakSpecialist: true },

      // === DOCUMENTATION (10) ===
      { name: "Batak Moment Studio", type: "DOCUMENTATION", location: "Jakarta Selatan", minPriceEstimate: 8000000, maxPriceEstimate: 20000000, capacity: null, description: "Foto dan video cinematic, paham momen-momen penting adat Batak", contactInfo: "0856-xxxx-6001", isBatakSpecialist: true },
      { name: "Toba Visual", type: "DOCUMENTATION", location: "Jakarta Timur", minPriceEstimate: 6000000, maxPriceEstimate: 15000000, capacity: null, description: "Dokumentasi spesialis acara Batak, drone + cinematic", contactInfo: "0812-xxxx-6002", isBatakSpecialist: true },
      { name: "Jakarta Wedding Films", type: "DOCUMENTATION", location: "Jakarta Pusat", minPriceEstimate: 12000000, maxPriceEstimate: 30000000, capacity: null, description: "Studio premium, video cinematic 4K, multi-camera", contactInfo: "021-3800xxxx", isBatakSpecialist: false },
      { name: "Snap & Story Photography", type: "DOCUMENTATION", location: "Jakarta Selatan", minPriceEstimate: 5000000, maxPriceEstimate: 12000000, capacity: null, description: "Paket foto only, gaya candid + traditional", contactInfo: "0813-xxxx-6004", isBatakSpecialist: false },
      { name: "Horas Studio", type: "DOCUMENTATION", location: "Jakarta Barat", minPriceEstimate: 7000000, maxPriceEstimate: 18000000, capacity: null, description: "Foto & video Batak wedding, album + highlight video", contactInfo: "0815-xxxx-6005", isBatakSpecialist: true },
      { name: "Pixel Batak Creative", type: "DOCUMENTATION", location: "Tangerang", minPriceEstimate: 4000000, maxPriceEstimate: 10000000, capacity: null, description: "Dokumentasi hemat untuk acara Batak", contactInfo: "0858-xxxx-6006", isBatakSpecialist: true },
      { name: "Momento Wedding Documentation", type: "DOCUMENTATION", location: "Jakarta Selatan", minPriceEstimate: 15000000, maxPriceEstimate: 40000000, capacity: null, description: "Paket premium: prewedding + wedding day + same day edit", contactInfo: "0821-xxxx-6007", isBatakSpecialist: false },
      { name: "Lens of Toba", type: "DOCUMENTATION", location: "Jakarta Timur", minPriceEstimate: 5500000, maxPriceEstimate: 14000000, capacity: null, description: "Fotografer Batak, paham moment ulos & gondang", contactInfo: "0812-xxxx-6008", isBatakSpecialist: true },
      { name: "Candid Jakarta", type: "DOCUMENTATION", location: "Bekasi", minPriceEstimate: 3500000, maxPriceEstimate: 8000000, capacity: null, description: "Fotografer candid area Bekasi-Jakarta", contactInfo: "0811-xxxx-6009", isBatakSpecialist: false },
      { name: "Adat & Love Studio", type: "DOCUMENTATION", location: "Depok", minPriceEstimate: 6000000, maxPriceEstimate: 16000000, capacity: null, description: "Spesialis dokumentasi pernikahan adat Nusantara", contactInfo: "0813-xxxx-6010", isBatakSpecialist: true },

      // === CHURCH (10) ===
      { name: "HKBP Rawamangun", type: "CHURCH", location: "Jakarta Timur", minPriceEstimate: 1500000, maxPriceEstimate: 3000000, capacity: 300, description: "Gereja HKBP untuk pemberkatan nikah dan martumpol", contactInfo: "021-4891xxxx", isBatakSpecialist: true },
      { name: "HKBP Menteng", type: "CHURCH", location: "Jakarta Pusat", minPriceEstimate: 2000000, maxPriceEstimate: 4000000, capacity: 500, description: "Gereja HKBP bersejarah di Menteng, gedung besar", contactInfo: "021-3141xxxx", isBatakSpecialist: true },
      { name: "HKBP Cikini", type: "CHURCH", location: "Jakarta Pusat", minPriceEstimate: 1500000, maxPriceEstimate: 3000000, capacity: 350, description: "Gereja HKBP di area Cikini, dekat transportasi umum", contactInfo: "021-3909xxxx", isBatakSpecialist: true },
      { name: "GKPS Gambir", type: "CHURCH", location: "Jakarta Pusat", minPriceEstimate: 1500000, maxPriceEstimate: 3500000, capacity: 400, description: "Gereja GKPS Simalungun, bisa untuk pemberkatan Batak Toba juga", contactInfo: "021-3455xxxx", isBatakSpecialist: true },
      { name: "GKI Menteng", type: "CHURCH", location: "Jakarta Pusat", minPriceEstimate: 2500000, maxPriceEstimate: 5000000, capacity: 600, description: "Gereja GKI besar di Menteng, gedung megah", contactInfo: "021-3100xxxx", isBatakSpecialist: false },
      { name: "HKBP Tangerang", type: "CHURCH", location: "Tangerang", minPriceEstimate: 1000000, maxPriceEstimate: 2500000, capacity: 250, description: "Gereja HKBP di Tangerang, cocok untuk acara sedang", contactInfo: "021-5520xxxx", isBatakSpecialist: true },
      { name: "HKBP Bekasi", type: "CHURCH", location: "Bekasi", minPriceEstimate: 1000000, maxPriceEstimate: 2500000, capacity: 300, description: "Gereja HKBP Bekasi, area luas untuk tamu", contactInfo: "021-8800xxxx", isBatakSpecialist: true },
      { name: "HKBP Depok", type: "CHURCH", location: "Depok", minPriceEstimate: 1000000, maxPriceEstimate: 2000000, capacity: 200, description: "Gereja HKBP Depok, suasana hangat", contactInfo: "021-7700xxxx", isBatakSpecialist: true },
      { name: "Gereja Immanuel Jakarta", type: "CHURCH", location: "Jakarta Pusat", minPriceEstimate: 3000000, maxPriceEstimate: 6000000, capacity: 700, description: "Gereja bersejarah di Gambir, arsitektur klasik", contactInfo: "021-3810xxxx", isBatakSpecialist: false },
      { name: "HKBP Kelapa Gading", type: "CHURCH", location: "Jakarta Utara", minPriceEstimate: 1500000, maxPriceEstimate: 3000000, capacity: 350, description: "Gereja HKBP di Kelapa Gading, komunitas Batak besar", contactInfo: "021-4500xxxx", isBatakSpecialist: true },
    ];

    await prisma.vendor.createMany({ data: vendors });
    console.log("Created", vendors.length, "vendors");
  } else {
    console.log("Vendors already seeded:", vendorCount, "exist");
  }

  // --- Vendor Type Masters ---
  const vendorTypeCount = await prisma.vendorTypeMaster.count();
  if (vendorTypeCount === 0) {
    const vendorTypes = [
      { code: "VENUE", label: "Venue", defaultCategoryName: "Gedung (Venue)", isPricePerPax: false, sortOrder: 1 },
      { code: "CATERING", label: "Catering", defaultCategoryName: "Catering", isPricePerPax: true, sortOrder: 2 },
      { code: "ATTIRE", label: "Attire & Ulos", defaultCategoryName: "Ulos (Traditional Cloth)", isPricePerPax: false, sortOrder: 3 },
      { code: "GONDANG", label: "Gondang", defaultCategoryName: "Gondang (Traditional Music)", isPricePerPax: false, sortOrder: 4 },
      { code: "WO", label: "Wedding Organizer", defaultCategoryName: "Wedding Organizer", isPricePerPax: false, sortOrder: 5 },
      { code: "DOCUMENTATION", label: "Documentation", defaultCategoryName: "Dokumentasi (Photo & Video)", isPricePerPax: false, sortOrder: 6 },
      { code: "CHURCH", label: "Church", defaultCategoryName: "Church", isPricePerPax: false, sortOrder: 7 },
    ];
    await prisma.vendorTypeMaster.createMany({ data: vendorTypes });
    console.log("Created", vendorTypes.length, "vendor type masters");
  } else {
    console.log("Vendor type masters already seeded:", vendorTypeCount, "exist");
  }

  // --- Master Categories ---
  const masterCatCount = await prisma.masterCategory.count();
  if (masterCatCount === 0) {
    const masterCategories = [
      { name: "Sinamot (Bride Price)", eventType: "PESTA_ADAT", sortOrder: 1 },
      { name: "Ulos (Traditional Cloth)", eventType: "PESTA_ADAT", sortOrder: 2 },
      { name: "Jambar (Ceremonial Gifts)", eventType: "PESTA_ADAT", sortOrder: 3 },
      { name: "Gondang (Traditional Music)", eventType: "PESTA_ADAT", sortOrder: 4 },
      { name: "Gedung (Venue)", eventType: "PESTA_ADAT", sortOrder: 5 },
      { name: "Catering", eventType: "PESTA_ADAT", sortOrder: 6 },
      { name: "Dokumentasi (Photo & Video)", eventType: "PESTA_ADAT", sortOrder: 7 },
      { name: "Wedding Organizer", eventType: "PESTA_ADAT", sortOrder: 8 },
      { name: "Transport", eventType: "PESTA_ADAT", sortOrder: 9 },
      { name: "Souvenir", eventType: "PESTA_ADAT", sortOrder: 10 },
      { name: "Others", eventType: "PESTA_ADAT", sortOrder: 11 },
      { name: "Marhusip venue", eventType: "THREE_M", sortOrder: 1 },
      { name: "Martumpol church", eventType: "THREE_M", sortOrder: 2 },
      { name: "Pasu-pasu church", eventType: "THREE_M", sortOrder: 3 },
      { name: "Konsumsi kecil", eventType: "THREE_M", sortOrder: 4 },
      { name: "Dokumentasi sederhana", eventType: "THREE_M", sortOrder: 5 },
      { name: "Transport keluarga", eventType: "THREE_M", sortOrder: 6 },
      { name: "Others", eventType: "THREE_M", sortOrder: 7 },
    ];
    await prisma.masterCategory.createMany({ data: masterCategories });
    console.log("Created", masterCategories.length, "master categories");
  } else {
    console.log("Master categories already seeded:", masterCatCount, "exist");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
