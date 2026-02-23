// Firebase Configuration
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

// App Configuration
const APP_CONFIG = {
    superAdminEmail: 'afifaro@gmail.com',
    whatsappNumber: '6281234567890', // Editable by super admin
    appVersion: '1.0.0',
    freeFeatures: ['calendar', 'schedule', 'atp', 'prota'],
    premiumFeatures: ['promes', 'modul_ajar', 'lkpd', 'bank_soal', 'kktp', 'jurnal', 'absensi', 'nilai']
};

// Get Current Academic Year
function getCurrentAcademicYear() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    
    // If June or later, new academic year starts
    if (month >= 5) { // June = 5
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

// Helper Functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const box = document.getElementById('alertBox');
    
    const colors = {
        success: 'bg-green-100 text-green-800 border border-green-200',
        error: 'bg-red-100 text-red-800 border border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    box.className = `p-4 rounded-lg ${colors[type]}`;
    box.innerHTML = message;
    container.classList.remove('hidden');
    
    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
}

// Date Helpers
function formatDate(date, format = 'long') {
    const d = new Date(date);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    if (format === 'long') {
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } else if (format === 'short') {
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } else if (format === 'iso') {
        return d.toISOString().split('T')[0];
    }
    return d.toLocaleDateString('id-ID');
}

// Console log for debugging
console.log('Firebase Config Loaded');
console.log('Current Academic Year:', getCurrentAcademicYear());