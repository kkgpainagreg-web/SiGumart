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

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Auth provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Firestore settings
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.log('Persistence not supported');
        }
    });

// Super Admin email
const SUPER_ADMIN_EMAIL = 'afifaro@gmail.com';

// App Settings (dapat diubah oleh Super Admin)
let APP_SETTINGS = {
    whatsappNumber: '6281234567890',
    premiumPrice: 99000,
    schoolPackagePrice: 'Custom',
    appVersion: '1.0.0',
    maintenanceMode: false
};

// Load app settings from Firestore
async function loadAppSettings() {
    try {
        const doc = await db.collection('settings').doc('app').get();
        if (doc.exists) {
            APP_SETTINGS = { ...APP_SETTINGS, ...doc.data() };
        }
    } catch (error) {
        console.error('Error loading app settings:', error);
    }
}

// Get current academic year
function getCurrentAcademicYear() {
    const now = new Date();
    const month = now.getMonth() + 1; // January is 0
    const year = now.getFullYear();
    
    // If month is June or later, next academic year starts
    if (month >= 6) {
        return {
            current: `${year}/${year + 1}`,
            previous: `${year - 1}/${year}`,
            next: `${year + 1}/${year + 2}`
        };
    } else {
        return {
            current: `${year - 1}/${year}`,
            previous: `${year - 2}/${year - 1}`,
            next: `${year}/${year + 1}`
        };
    }
}

// Get available academic years
function getAvailableAcademicYears() {
    const years = getCurrentAcademicYear();
    return [years.previous, years.current, years.next];
}

console.log('Firebase initialized successfully');