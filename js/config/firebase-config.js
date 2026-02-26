// ============================================
// FIREBASE CONFIGURATION - AGSA
// Separated config file for clean architecture
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDpiK4F4ilnDDNEwO0djGY-ClwgwBl1eFk",
    authDomain: "asap-1d653.firebaseapp.com",
    projectId: "asap-1d653",
    storageBucket: "asap-1d653.firebasestorage.app",
    messagingSenderId: "143263188364",
    appId: "1:143263188364:web:47b4c003972b3503e882a9",
};

// Super Admin Configuration
const SUPER_ADMIN_EMAIL = 'afifaro@gmail.com';

// CSV Links for CP Database
const CSV_LINKS = {
    SD: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMR0Vbb2xSEbDOQ708qzRPyGG9I0Vp7RijYHp0NTpjUL7w08EMrVwYy9euEyvyq1Y_XaJBcB668dVi/pub?gid=1925091593&single=true&output=csv',
    SMP: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMR0Vbb2xSEbDOQ708qzRPyGG9I0Vp7RijYHp0NTpjUL7w08EMrVwYy9euEyvyq1Y_XaJBcB668dVi/pub?gid=1962203786&single=true&output=csv',
    SMA: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMR0Vbb2xSEbDOQ708qzRPyGG9I0Vp7RijYHp0NTpjUL7w08EMrVwYy9euEyvyq1Y_XaJBcB668dVi/pub?gid=260922290&single=true&output=csv',
    SMK: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMR0Vbb2xSEbDOQ708qzRPyGG9I0Vp7RijYHp0NTpjUL7w08EMrVwYy9euEyvyq1Y_XaJBcB668dVi/pub?gid=260922290&single=true&output=csv'
};

// 8 Dimensi Profil Lulusan
const DIMENSI_PROFIL = [
    'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    'Berkebinekaan Global',
    'Bergotong-royong',
    'Mandiri',
    'Bernalar Kritis',
    'Kreatif'
];

// Jenjang Configuration
const JENJANG_CONFIG = {
    SD: {
        name: 'Sekolah Dasar',
        kelas: ['1', '2', '3', '4', '5', '6'],
        fase: {
            'A': ['1', '2'],
            'B': ['3', '4'],
            'C': ['5', '6']
        },
        durasiJP: 35,
        kelasAkhir: '6'
    },
    SMP: {
        name: 'Sekolah Menengah Pertama',
        kelas: ['7', '8', '9'],
        fase: {
            'D': ['7', '8', '9']
        },
        durasiJP: 40,
        kelasAkhir: '9'
    },
    SMA: {
        name: 'Sekolah Menengah Atas',
        kelas: ['10', '11', '12'],
        fase: {
            'E': ['10'],
            'F': ['11', '12']
        },
        durasiJP: 45,
        kelasAkhir: '12'
    },
    SMK: {
        name: 'Sekolah Menengah Kejuruan',
        kelas: ['10', '11', '12'],
        fase: {
            'E': ['10'],
            'F': ['11', '12']
        },
        durasiJP: 45,
        kelasAkhir: '12'
    }
};

// Subscription Plans
const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free',
        features: ['kalender', 'jadwal', 'atp', 'prota'],
        price: 0
    },
    premium_personal: {
        name: 'Premium Personal',
        features: ['all'],
        price: 50000,
        priceYearly: 500000
    },
    premium_school: {
        name: 'Premium Sekolah',
        features: ['all', 'multi_user', 'admin_panel'],
        price: 500000,
        priceYearly: 5000000,
        maxUsers: 50
    }
};

// Default National Holidays 2024/2025
const DEFAULT_HOLIDAYS_2024_2025 = [
    { tanggal: '2024-07-17', nama: 'Tahun Baru Islam 1446 H', isDefault: true },
    { tanggal: '2024-08-17', nama: 'Hari Kemerdekaan RI', isDefault: true },
    { tanggal: '2024-09-16', nama: 'Maulid Nabi Muhammad SAW', isDefault: true },
    { tanggal: '2024-12-25', nama: 'Hari Raya Natal', isDefault: true },
    { tanggal: '2025-01-01', nama: 'Tahun Baru 2025', isDefault: true },
    { tanggal: '2025-01-29', nama: 'Tahun Baru Imlek 2576', isDefault: true },
    { tanggal: '2025-03-29', nama: 'Hari Raya Nyepi', isDefault: true },
    { tanggal: '2025-03-31', nama: 'Idul Fitri 1446 H', isDefault: true },
    { tanggal: '2025-04-01', nama: 'Idul Fitri 1446 H', isDefault: true },
    { tanggal: '2025-04-18', nama: 'Jumat Agung', isDefault: true },
    { tanggal: '2025-05-01', nama: 'Hari Buruh Internasional', isDefault: true },
    { tanggal: '2025-05-12', nama: 'Hari Raya Waisak 2569', isDefault: true },
    { tanggal: '2025-05-29', nama: 'Kenaikan Isa Almasih', isDefault: true },
    { tanggal: '2025-06-01', nama: 'Hari Lahir Pancasila', isDefault: true },
    { tanggal: '2025-06-07', nama: 'Idul Adha 1446 H', isDefault: true },
    { tanggal: '2025-06-27', nama: 'Tahun Baru Islam 1447 H', isDefault: true }
];

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        SUPER_ADMIN_EMAIL,
        CSV_LINKS,
        DIMENSI_PROFIL,
        JENJANG_CONFIG,
        SUBSCRIPTION_PLANS,
        DEFAULT_HOLIDAYS_2024_2025
    };
}