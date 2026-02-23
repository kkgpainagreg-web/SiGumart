// ============================================
// FIREBASE CONFIGURATION - AGSA
// ============================================

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

// App Constants
const APP_CONFIG = {
    superAdminEmail: 'afifaro@gmail.com',
    whatsappNumber: '6281234567890',
    appVersion: '1.0.0',
    freeFeatures: ['calendar', 'schedule', 'atp', 'prota', 'students', 'ai-assistant', 'help'],
    premiumFeatures: ['promes', 'modul', 'lkpd', 'kktp', 'attendance', 'journal', 'grades']
};

// Get Current Academic Year
function getCurrentAcademicYear() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (month >= 5) { // June onwards
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

// UI Helper Functions
function showLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.classList.remove('hidden');
}

function hideLoading() {
    const el = document.getElementById('loadingOverlay');
    if (el) el.classList.add('hidden');
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const box = document.getElementById('alertBox');
    
    if (!container || !box) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
        return;
    }
    
    const styles = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    
    box.className = `p-4 rounded-xl shadow-xl flex items-center gap-3 ${styles[type] || styles.info}`;
    box.innerHTML = `<span class="text-xl">${icons[type] || icons.info}</span><span>${message}</span>`;
    container.classList.remove('hidden');
    
    setTimeout(() => container.classList.add('hidden'), 4000);
}

// Date Formatter
function formatDate(date, format = 'long') {
    const d = new Date(date);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    if (format === 'long') {
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    return d.toLocaleDateString('id-ID');
}

console.log('Firebase Config Loaded');
console.log('Current Academic Year:', getCurrentAcademicYear());
