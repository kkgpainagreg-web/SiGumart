// ============================================
// FIREBASE CONFIGURATION
// Admin PAI Super App
// ============================================

// Konfigurasi Firebase Anda
// PENTING: Ganti dengan konfigurasi dari Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyCyRKvngA1EqlQmgxgxU4465qgRw8TdT08",
  authDomain: "si-gumart.firebaseapp.com",
  projectId: "si-gumart",
  storageBucket: "si-gumart.firebasestorage.app",
  messagingSenderId: "544375918988",
  appId: "1:544375918988:web:3375b3025b7d51ea2546a9",
 };

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi Services
const auth = firebase.auth();
const db = firebase.firestore();

// Pengaturan Firestore untuk offline persistence (cara baru)
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable persistence dengan cara yang lebih modern
try {
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open
                console.log('Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                // Browser tidak support
                console.log('Persistence not supported');
            }
        });
} catch (e) {
    console.log('Persistence setup skipped');
}

// Timestamp helper
const timestamp = firebase.firestore.FieldValue.serverTimestamp();

// Collection references
const collections = {
    users: db.collection('users'),
    schools: db.collection('schools'),
    classes: db.collection('classes'),
    students: db.collection('students'),
    schedules: db.collection('schedules'),
    attendance: db.collection('attendance'),
    grades: db.collection('grades'),
    journals: db.collection('journals'),
    questions: db.collection('questions'),
    curriculum: db.collection('curriculum'),
    atp: db.collection('atp'),
    prota: db.collection('prota'),
    promes: db.collection('promes'),
    modules: db.collection('modules'),
    calendar: db.collection('calendar'),
    documents: db.collection('documents')
};

console.log('✅ Firebase initialized successfully');
