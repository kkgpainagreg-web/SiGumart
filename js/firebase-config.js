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
    whatsappNumber: '6281234567890',
    appVersion: '1.0.0',
    freeFeatures: ['calendar', 'schedule', 'atp', 'prota'],
    premiumFeatures: ['promes', 'modul_ajar', 'lkpd', 'bank_soal', 'kktp', 'jurnal', 'absensi', 'nilai']
};

// Get Current Academic Year
function getCurrentAcademicYear() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    if (month >= 5) {
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
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const box = document.getElementById('alertBox');
    
    if (!container || !box) {
        console.log(`Alert (${type}): ${message}`);
        return;
    }
    
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

// Default User Data Structure
function getDefaultUserData(user) {
    const isSuperAdmin = user.email === APP_CONFIG.superAdminEmail;
    return {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Pengguna',
        photoURL: user.photoURL || null,
        role: isSuperAdmin ? 'super_admin' : 'user',
        subscription: isSuperAdmin ? 'premium' : 'free',
        subscriptionExpiry: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        profile: {
            nip: '',
            phone: '',
            subjects: [],
            school: {
                name: '',
                npsn: '',
                address: '',
                city: '',
                province: '',
                level: 'SD',
                headmaster: '',
                headmasterNip: ''
            }
        },
        settings: {
            academicYear: getCurrentAcademicYear().current,
            lessonDuration: 35,
            theme: 'light'
        }
    };
}

console.log('Firebase Config Loaded');
console.log('Current Academic Year:', getCurrentAcademicYear());
