// js/firebase-config.js
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
const storage = firebase.storage();

// Enable offline persistence (optional but recommended)
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.log('Persistence not supported');
        }
    });

// Super Admin Email
const SUPER_ADMIN_EMAIL = "afifaro@gmail.com";

// Auto detect academic year
function getCurrentAcademicYear() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    
    if (month >= 7) {
        return {
            current: `${year}/${year + 1}`,
            options: [`${year}/${year + 1}`, `${year - 1}/${year}`]
        };
    } else if (month >= 1 && month <= 5) {
        return {
            current: `${year - 1}/${year}`,
            options: [`${year - 1}/${year}`, `${year}/${year + 1}`]
        };
    } else { // June - transition month
        return {
            current: `${year - 1}/${year}`,
            options: [`${year}/${year + 1}`, `${year - 1}/${year}`]
        };
    }
}

// Default settings
const DEFAULT_SETTINGS = {
    jenjangDurasi: {
        'SD': 35,
        'SMP': 40,
        'SMA': 45,
        'SMK': 45
    },
    whatsappUpgrade: '6281234567890'
};

// 8 Dimensi Profil Lulusan
const DIMENSI_PROFIL = [
    'Keimanan',
    'Kewargaan', 
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Kesehatan',
    'Komunikasi'
];

// Export for use in other modules
window.FirebaseConfig = {
    auth,
    db,
    storage,
    SUPER_ADMIN_EMAIL,
    getCurrentAcademicYear,
    DEFAULT_SETTINGS,
    DIMENSI_PROFIL
};

console.log('Firebase initialized successfully');
