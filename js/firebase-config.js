// ============================================
// FIREBASE CONFIGURATION
// Admin PAI Super App
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyCyRKvngA1EqlQmgxgxU4465qgRw8TdT08",
  authDomain: "si-gumart.firebaseapp.com",
  projectId: "si-gumart",
  storageBucket: "si-gumart.firebasestorage.app",
  messagingSenderId: "544375918988",
  appId: "1:544375918988:web:3375b3025b7d51ea2546a9",
  measurementId: "G-40ZGJFEWD1"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi Services
const auth = firebase.auth();
const db = firebase.firestore();

// Pengaturan Firestore untuk offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.log('The current browser does not support offline persistence.');
        }
    });

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
    calendar: db.collection('calendar')
};

console.log('✅ Firebase initialized successfully');