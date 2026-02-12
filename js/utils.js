/**
 * =====================================================
 * ADMIN PAI SUPER APP - Utility Functions
 * =====================================================
 * Helper functions yang digunakan di seluruh aplikasi
 * =====================================================
 */

// ==================== DATA CONSTANTS ====================

/**
 * Data Provinsi Indonesia
 */
const dataProvinsi = [
    "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
    "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
    "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
    "DI Yogyakarta", "Jawa Timur", "Banten", "Bali", "Nusa Tenggara Barat",
    "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
    "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
    "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
    "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara", "Papua",
    "Papua Barat", "Papua Selatan", "Papua Tengah", "Papua Pegunungan"
];

/**
 * Data Jenjang Pendidikan
 */
const dataJenjang = [
    { value: "SD", label: "SD (Sekolah Dasar)" },
    { value: "MI", label: "MI (Madrasah Ibtidaiyah)" },
    { value: "SMP", label: "SMP (Sekolah Menengah Pertama)" },
    { value: "MTs", label: "MTs (Madrasah Tsanawiyah)" },
    { value: "SMA", label: "SMA (Sekolah Menengah Atas)" },
    { value: "MA", label: "MA (Madrasah Aliyah)" },
    { value: "SMK", label: "SMK (Sekolah Menengah Kejuruan)" }
];

/**
 * Data Kelas berdasarkan Fase (Kurikulum Merdeka)
 */
const dataKelas = {
    SD: [
        { kelas: 1, fase: "A", label: "Kelas 1" },
        { kelas: 2, fase: "A", label: "Kelas 2" },
        { kelas: 3, fase: "B", label: "Kelas 3" },
        { kelas: 4, fase: "B", label: "Kelas 4" },
        { kelas: 5, fase: "C", label: "Kelas 5" },
        { kelas: 6, fase: "C", label: "Kelas 6" }
    ],
    MI: [
        { kelas: 1, fase: "A", label: "Kelas 1" },
        { kelas: 2, fase: "A", label: "Kelas 2" },
        { kelas: 3, fase: "B", label: "Kelas 3" },
        { kelas: 4, fase: "B", label: "Kelas 4" },
        { kelas: 5, fase: "C", label: "Kelas 5" },
        { kelas: 6, fase: "C", label: "Kelas 6" }
    ],
    SMP: [
        { kelas: 7, fase: "D", label: "Kelas 7" },
        { kelas: 8, fase: "D", label: "Kelas 8" },
        { kelas: 9, fase: "D", label: "Kelas 9" }
    ],
    MTs: [
        { kelas: 7, fase: "D", label: "Kelas 7" },
        { kelas: 8, fase: "D", label: "Kelas 8" },
        { kelas: 9, fase: "D", label: "Kelas 9" }
    ],
    SMA: [
        { kelas: 10, fase: "E", label: "Kelas 10" },
        { kelas: 11, fase: "F", label: "Kelas 11" },
        { kelas: 12, fase: "F", label: "Kelas 12" }
    ],
    MA: [
        { kelas: 10, fase: "E", label: "Kelas 10" },
        { kelas: 11, fase: "F", label: "Kelas 11" },
        { kelas: 12, fase: "F", label: "Kelas 12" }
    ],
    SMK: [
        { kelas: 10, fase: "E", label: "Kelas 10" },
        { kelas: 11, fase: "F", label: "Kelas 11" },
        { kelas: 12, fase: "F", label: "Kelas 12" }
    ]
};

/**
 * Data Tahun Ajaran
 */
function generateTahunAjaran() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -1; i <= 2; i++) {
        const year = currentYear + i;
        years.push(`${year}/${year + 1}`);
    }
    return years;
}

/**
 * Data Golongan PNS
 */
const dataGolongan = [
    { value: "", label: "Pilih Golongan" },
    { value: "II/a", label: "II/a - Pengatur Muda" },
    { value: "II/b", label: "II/b - Pengatur Muda Tk. I" },
    { value: "II/c", label: "II/c - Pengatur" },
    { value: "II/d", label: "II/d - Pengatur Tk. I" },
    { value: "III/a", label: "III/a - Penata Muda" },
    { value: "III/b", label: "III/b - Penata Muda Tk. I" },
    { value: "III/c", label: "III/c - Penata" },
    { value: "III/d", label: "III/d - Penata Tk. I" },
    { value: "IV/a", label: "IV/a - Pembina" },
    { value: "IV/b", label: "IV/b - Pembina Tk. I" },
    { value: "IV/c", label: "IV/c - Pembina Utama Muda" },
    { value: "IV/d", label: "IV/d - Pembina Utama Madya" },
    { value: "IV/e", label: "IV/e - Pembina Utama" },
    { value: "NON-PNS", label: "Non PNS / Honorer" }
];

/**
 * Data Pendidikan Terakhir
 */
const dataPendidikan = [
    { value: "", label: "Pilih Pendidikan" },
    { value: "SMA", label: "SMA/SMK/MA Sederajat" },
    { value: "D1", label: "D1 (Diploma 1)" },
    { value: "D2", label: "D2 (Diploma 2)" },
    { value: "D3", label: "D3 (Diploma 3)" },
    { value: "D4", label: "D4 (Diploma 4)" },
    { value: "S1", label: "S1 (Sarjana)" },
    { value: "S2", label: "S2 (Magister)" },
    { value: "S3", label: "S3 (Doktor)" }
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Format tanggal ke format Indonesia
 */
function formatTanggal(dateString, format = 'long') {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const options = {
        long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        medium: { day: 'numeric', month: 'long', year: 'numeric' },
        short: { day: '2-digit', month: '2-digit', year: 'numeric' }
    };
    
    return date.toLocaleDateString('id-ID', options[format] || options.medium);
}

/**
 * Capitalize first letter of each word
 */
function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Generate unique ID
 */
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate phone number (Indonesia)
 */
function isValidPhone(phone) {
    const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    return regex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Format phone number
 */
function formatPhone(phone) {
    if (!phone) return '';
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    // Convert 62 prefix to 0
    if (cleaned.startsWith('62')) {
        cleaned = '0' + cleaned.substr(2);
    }
    return cleaned;
}

/**
 * Compress image before upload
 */
function compressImage(file, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = reject;
        };
        
        reader.onerror = reject;
    });
}

/**
 * Convert blob to base64
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get fase from kelas
 */
function getFaseFromKelas(kelas, jenjang = 'SD') {
    const kelasData = dataKelas[jenjang] || dataKelas.SD;
    const found = kelasData.find(k => k.kelas === parseInt(kelas));
    return found ? found.fase : 'A';
}

/**
 * Get semester label
 */
function getSemesterLabel(semester) {
    return semester === '1' || semester === 1 
        ? 'Ganjil' 
        : 'Genap';
}

console.log('🔧 Utility functions loaded');