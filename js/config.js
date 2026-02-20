// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDe4ie2wSPEpNbAgWP-q03vTuHyxc9Jj3E",
    authDomain: "agsa-e5b08.firebaseapp.com",
    projectId: "agsa-e5b08",
    storageBucket: "agsa-e5b08.firebasestorage.app",
    messagingSenderId: "916052746331",
    appId: "1:916052746331:web:357cbadbfd8658f1689f7e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// App Configuration
const APP_CONFIG = {
    superAdminEmail: 'afifaro@gmail.com',
    defaultWANumber: '6281234567890',
    freeFeatures: ['dashboard', 'profil', 'kalender', 'jadwal', 'siswa', 'atp', 'prota', 'panduan', 'aiassistant'],
    premiumFeatures: ['promes', 'modul', 'absensi', 'jurnal', 'nilai', 'lkpd', 'banksoal'],
    jenjangDurasi: {
        'SD': 35,
        'SMP': 45,
        'SMA': 45
    }
};

// Global State
let currentUser = null;
let userProfile = null;
let currentSection = 'dashboard';
let currentTahunAjaran = '';
let currentSemester = 'Gasal';