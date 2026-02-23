// js/firebase-config.js
// Firebase Configuration - JANGAN DIUBAH

const firebaseConfig = {
    apiKey: "AIzaSyDe4ie2wSPEpNbAgWP-q03vTuHyxc9Jj3E",
    authDomain: "agsa-e5b08.firebaseapp.com",
    projectId: "agsa-e5b08",
    storageBucket: "agsa-e5b08.firebasestorage.app",
    messagingSenderId: "916052746331",
    appId: "1:916052746331:web:357cbadbfd8658f1689f7e",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Super Admin Email
const SUPER_ADMIN_EMAIL = "afifaro@gmail.com";

// Fungsi helper untuk mendapatkan tahun ajaran otomatis
function getTahunAjaran() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    
    // Jika bulan Juni ke atas (>=5), maka tahun ajaran adalah tahun ini/tahun depan
    // Jika bulan sebelum Juni, tahun ajaran adalah tahun kemarin/tahun ini
    if (month >= 5) { // Juni atau setelahnya
        return {
            current: `${year}/${year + 1}`,
            options: [`${year}/${year + 1}`, `${year + 1}/${year + 2}`]
        };
    } else {
        return {
            current: `${year - 1}/${year}`,
            options: [`${year - 1}/${year}`, `${year}/${year + 1}`]
        };
    }
}

// Helper untuk format tanggal Indonesia
function formatTanggalIndo(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Helper untuk mendapatkan nama hari
function getNamaHari(dayIndex) {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return hari[dayIndex];
}

// Helper untuk mendapatkan nama bulan
function getNamaBulan(monthIndex) {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return bulan[monthIndex];
}

// Helper untuk menghitung fase berdasarkan kelas
function getFase(kelas) {
    const kelasInt = parseInt(kelas);
    if (kelasInt <= 2) return { huruf: 'A', nama: 'Fase A' };
    if (kelasInt <= 4) return { huruf: 'B', nama: 'Fase B' };
    if (kelasInt <= 6) return { huruf: 'C', nama: 'Fase C' };
    if (kelasInt <= 9) return { huruf: 'D', nama: 'Fase D' };
    if (kelasInt === 10) return { huruf: 'E', nama: 'Fase E' };
    return { huruf: 'F', nama: 'Fase F' };
}

// Helper untuk mendapatkan jenjang berdasarkan kelas
function getJenjang(kelas) {
    const kelasInt = parseInt(kelas);
    if (kelasInt <= 6) return 'SD';
    if (kelasInt <= 9) return 'SMP';
    return 'SMA';
}

// 8 Dimensi Profil Lulusan
const DIMENSI_PROFIL_LULUSAN = [
    'Keimanan',
    'Kewargaan', 
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Kesehatan',
    'Komunikasi'
];

// Durasi default per jenjang (menit)
const DURASI_JP_DEFAULT = {
    'SD': 35,
    'SMP': 40,
    'SMA': 45
};

// Hari libur nasional baku (yang tidak perlu disetting user)
const LIBUR_NASIONAL_BAKU = [
    { tanggal: '08-17', nama: 'Hari Kemerdekaan RI' },
    { tanggal: '12-25', nama: 'Hari Natal' },
    { tanggal: '01-01', nama: 'Tahun Baru' },
    { tanggal: '05-01', nama: 'Hari Buruh' },
    { tanggal: '06-01', nama: 'Hari Lahir Pancasila' },
    { tanggal: '10-28', nama: 'Hari Sumpah Pemuda' },
    { tanggal: '11-10', nama: 'Hari Pahlawan' }
];

// Export untuk digunakan di file lain
window.FirebaseConfig = {
    auth,
    db,
    storage,
    SUPER_ADMIN_EMAIL,
    getTahunAjaran,
    formatTanggalIndo,
    getNamaHari,
    getNamaBulan,
    getFase,
    getJenjang,
    DIMENSI_PROFIL_LULUSAN,
    DURASI_JP_DEFAULT,
    LIBUR_NASIONAL_BAKU
};