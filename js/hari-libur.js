// Database Hari Libur Nasional Indonesia
// Libur yang tanggalnya tetap dan libur yang bergerak (estimasi)

const HARI_LIBUR_TETAP = [
    { tanggal: "01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
    { tanggal: "05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
    { tanggal: "06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
    { tanggal: "08-17", nama: "Hari Kemerdekaan Republik Indonesia", jenis: "Libur" },
    { tanggal: "12-25", nama: "Hari Raya Natal", jenis: "Libur" }
];

// Hari libur yang tanggalnya berubah setiap tahun (berdasarkan kalender hijriah/lunar)
const HARI_LIBUR_BERGERAK = {
    2024: [
        { tanggal: "2024-01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
        { tanggal: "2024-02-08", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2024-02-10", nama: "Tahun Baru Imlek 2575", jenis: "Libur" },
        { tanggal: "2024-03-11", nama: "Hari Raya Nyepi Tahun Saka 1946", jenis: "Libur" },
        { tanggal: "2024-03-29", nama: "Wafat Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2024-04-10", nama: "Hari Raya Idul Fitri 1445 H (Hari 1)", jenis: "Libur" },
        { tanggal: "2024-04-11", nama: "Hari Raya Idul Fitri 1445 H (Hari 2)", jenis: "Libur" },
        { tanggal: "2024-05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
        { tanggal: "2024-05-09", nama: "Kenaikan Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2024-05-23", nama: "Hari Raya Waisak 2568 BE", jenis: "Libur" },
        { tanggal: "2024-06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
        { tanggal: "2024-06-17", nama: "Hari Raya Idul Adha 1445 H", jenis: "Libur" },
        { tanggal: "2024-07-07", nama: "Tahun Baru Islam 1446 H", jenis: "Libur" },
        { tanggal: "2024-08-17", nama: "Hari Kemerdekaan RI", jenis: "Libur" },
        { tanggal: "2024-09-16", nama: "Maulid Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2024-12-25", nama: "Hari Raya Natal", jenis: "Libur" }
    ],
    2025: [
        { tanggal: "2025-01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
        { tanggal: "2025-01-27", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2025-01-29", nama: "Tahun Baru Imlek 2576", jenis: "Libur" },
        { tanggal: "2025-03-29", nama: "Hari Raya Nyepi Tahun Saka 1947", jenis: "Libur" },
        { tanggal: "2025-03-31", nama: "Hari Raya Idul Fitri 1446 H (Hari 1)", jenis: "Libur" },
        { tanggal: "2025-04-01", nama: "Hari Raya Idul Fitri 1446 H (Hari 2)", jenis: "Libur" },
        { tanggal: "2025-04-18", nama: "Wafat Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2025-05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
        { tanggal: "2025-05-12", nama: "Hari Raya Waisak 2569 BE", jenis: "Libur" },
        { tanggal: "2025-05-29", nama: "Kenaikan Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2025-06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
        { tanggal: "2025-06-06", nama: "Hari Raya Idul Adha 1446 H", jenis: "Libur" },
        { tanggal: "2025-06-27", nama: "Tahun Baru Islam 1447 H", jenis: "Libur" },
        { tanggal: "2025-08-17", nama: "Hari Kemerdekaan RI", jenis: "Libur" },
        { tanggal: "2025-09-05", nama: "Maulid Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2025-12-25", nama: "Hari Raya Natal", jenis: "Libur" }
    ],
    2026: [
        { tanggal: "2026-01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
        { tanggal: "2026-01-17", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2026-02-17", nama: "Tahun Baru Imlek 2577", jenis: "Libur" },
        { tanggal: "2026-03-19", nama: "Hari Raya Nyepi Tahun Saka 1948", jenis: "Libur" },
        { tanggal: "2026-03-20", nama: "Hari Raya Idul Fitri 1447 H (Hari 1)", jenis: "Libur" },
        { tanggal: "2026-03-21", nama: "Hari Raya Idul Fitri 1447 H (Hari 2)", jenis: "Libur" },
        { tanggal: "2026-04-03", nama: "Wafat Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2026-05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
        { tanggal: "2026-05-14", nama: "Kenaikan Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2026-05-27", nama: "Hari Raya Idul Adha 1447 H", jenis: "Libur" },
        { tanggal: "2026-05-31", nama: "Hari Raya Waisak 2570 BE", jenis: "Libur" },
        { tanggal: "2026-06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
        { tanggal: "2026-06-17", nama: "Tahun Baru Islam 1448 H", jenis: "Libur" },
        { tanggal: "2026-08-17", nama: "Hari Kemerdekaan RI", jenis: "Libur" },
        { tanggal: "2026-08-26", nama: "Maulid Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2026-12-25", nama: "Hari Raya Natal", jenis: "Libur" }
    ],
    2027: [
        { tanggal: "2027-01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
        { tanggal: "2027-01-06", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2027-02-06", nama: "Tahun Baru Imlek 2578", jenis: "Libur" },
        { tanggal: "2027-03-09", nama: "Hari Raya Idul Fitri 1448 H (Hari 1)", jenis: "Libur" },
        { tanggal: "2027-03-10", nama: "Hari Raya Idul Fitri 1448 H (Hari 2)", jenis: "Libur" },
        { tanggal: "2027-03-19", nama: "Hari Raya Nyepi Tahun Saka 1949", jenis: "Libur" },
        { tanggal: "2027-03-26", nama: "Wafat Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2027-05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
        { tanggal: "2027-05-06", nama: "Kenaikan Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2027-05-16", nama: "Hari Raya Idul Adha 1448 H", jenis: "Libur" },
        { tanggal: "2027-05-20", nama: "Hari Raya Waisak 2571 BE", jenis: "Libur" },
        { tanggal: "2027-06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
        { tanggal: "2027-06-06", nama: "Tahun Baru Islam 1449 H", jenis: "Libur" },
        { tanggal: "2027-08-15", nama: "Maulid Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2027-08-17", nama: "Hari Kemerdekaan RI", jenis: "Libur" },
        { tanggal: "2027-12-25", nama: "Hari Raya Natal", jenis: "Libur" },
        { tanggal: "2027-12-27", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" }
    ],
    2028: [
        { tanggal: "2028-01-01", nama: "Tahun Baru Masehi", jenis: "Libur" },
        { tanggal: "2028-01-26", nama: "Tahun Baru Imlek 2579", jenis: "Libur" },
        { tanggal: "2028-02-26", nama: "Hari Raya Idul Fitri 1449 H (Hari 1)", jenis: "Libur" },
        { tanggal: "2028-02-27", nama: "Hari Raya Idul Fitri 1449 H (Hari 2)", jenis: "Libur" },
        { tanggal: "2028-03-19", nama: "Hari Raya Nyepi Tahun Saka 1950", jenis: "Libur" },
        { tanggal: "2028-04-14", nama: "Wafat Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2028-05-01", nama: "Hari Buruh Internasional", jenis: "Libur" },
        { tanggal: "2028-05-04", nama: "Hari Raya Idul Adha 1449 H", jenis: "Libur" },
        { tanggal: "2028-05-09", nama: "Hari Raya Waisak 2572 BE", jenis: "Libur" },
        { tanggal: "2028-05-25", nama: "Kenaikan Isa Al-Masih", jenis: "Libur" },
        { tanggal: "2028-05-25", nama: "Tahun Baru Islam 1450 H", jenis: "Libur" },
        { tanggal: "2028-06-01", nama: "Hari Lahir Pancasila", jenis: "Libur" },
        { tanggal: "2028-08-03", nama: "Maulid Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2028-08-17", nama: "Hari Kemerdekaan RI", jenis: "Libur" },
        { tanggal: "2028-12-14", nama: "Isra Mi'raj Nabi Muhammad SAW", jenis: "Libur" },
        { tanggal: "2028-12-25", nama: "Hari Raya Natal", jenis: "Libur" }
    ]
};

// Cuti Bersama (dapat diupdate setiap tahun)
const CUTI_BERSAMA = {
    2024: [
        { tanggal: "2024-04-08", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2024-04-09", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2024-04-12", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2024-04-15", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2024-12-26", nama: "Cuti Bersama Natal", jenis: "Libur" }
    ],
    2025: [
        { tanggal: "2025-03-28", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2025-04-02", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2025-04-03", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2025-04-04", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2025-04-07", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2025-12-26", nama: "Cuti Bersama Natal", jenis: "Libur" }
    ],
    2026: [
        { tanggal: "2026-03-18", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2026-03-23", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2026-03-24", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2026-12-24", nama: "Cuti Bersama Natal", jenis: "Libur" }
    ],
    2027: [
        { tanggal: "2027-03-08", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2027-03-11", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2027-03-12", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" }
    ],
    2028: [
        { tanggal: "2028-02-25", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2028-02-28", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" },
        { tanggal: "2028-02-29", nama: "Cuti Bersama Idul Fitri", jenis: "Libur" }
    ]
};

// Get All Holidays for a Year
function getHariLiburNasional(year) {
    let holidays = [];
    
    // Add moveable holidays
    if (HARI_LIBUR_BERGERAK[year]) {
        holidays = holidays.concat(HARI_LIBUR_BERGERAK[year]);
    }
    
    // Add cuti bersama
    if (CUTI_BERSAMA[year]) {
        holidays = holidays.concat(CUTI_BERSAMA[year]);
    }
    
    return holidays;
}

// Check if a date is a holiday
function isHariLibur(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    
    // Check weekend (Sunday = 0, Saturday = 6)
    if (date.getDay() === 0) return { isLibur: true, nama: "Hari Minggu" };
    
    // Get holidays for the year
    const holidays = getHariLiburNasional(year);
    
    // Check against holiday list
    const found = holidays.find(h => h.tanggal === dateStr);
    if (found) {
        return { isLibur: true, nama: found.nama };
    }
    
    return { isLibur: false, nama: null };
}

// Get holidays for a date range
function getHolidaysInRange(startDate, endDate) {
    const holidays = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all years in range
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    for (let year = startYear; year <= endYear; year++) {
        const yearHolidays = getHariLiburNasional(year);
        yearHolidays.forEach(h => {
            const hDate = new Date(h.tanggal);
            if (hDate >= start && hDate <= end) {
                holidays.push(h);
            }
        });
    }
    
    return holidays;
}

// Get teaching dates (excluding holidays and weekends)
function getTeachingDates(startDate, endDate, targetDay) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find first occurrence of target day
    let current = new Date(start);
    while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
    }
    
    // Get holidays for the range
    const holidays = getHolidaysInRange(startDate, endDate);
    const holidayDates = new Set(holidays.map(h => h.tanggal));
    
    // Collect all dates
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        
        if (!holidayDates.has(dateStr)) {
            dates.push(new Date(current));
        }
        
        current.setDate(current.getDate() + 7);
    }
    
    return dates;
}

// Auto-load holidays to kalender when semester settings are saved
async function loadHariLiburOtomatis(userId, tahunAjaran) {
    try {
        const tahunAwal = parseInt(tahunAjaran.split('/')[0]);
        const tahunAkhir = tahunAwal + 1;
        
        // Get existing holidays in user's kalender
        const existingSnap = await db.collection('users').doc(userId)
            .collection('kalender')
            .where('type', '==', 'kegiatan')
            .where('isNasional', '==', true)
            .get();
        
        // If already loaded, skip
        if (!existingSnap.empty) {
            return;
        }
        
        const batch = db.batch();
        
        // Load holidays for both years
        [tahunAwal, tahunAkhir].forEach(year => {
            const holidays = getHariLiburNasional(year);
            
            holidays.forEach(holiday => {
                const docRef = db.collection('users').doc(userId)
                    .collection('kalender').doc();
                
                batch.set(docRef, {
                    type: 'kegiatan',
                    nama: holiday.nama,
                    jenis: 'Libur',
                    mulai: holiday.tanggal,
                    selesai: holiday.tanggal,
                    isNasional: true, // Mark as national holiday
                    tahunAjaran: tahunAjaran,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        });
        
        await batch.commit();
        console.log('Hari libur nasional berhasil dimuat');
        
    } catch (error) {
        console.error('Error loading hari libur:', error);
    }
}