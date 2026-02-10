/**
 * =====================================================
 * FILE: firebase-config.js
 * FUNGSI: Menghubungkan aplikasi dengan Firebase Console
 * 
 * CARA MENDAPATKAN CONFIG:
 * 1. Buka https://console.firebase.google.com
 * 2. Klik Project Anda
 * 3. Klik ikon roda gigi (⚙️) > Project Settings
 * 4. Scroll ke bawah, di bagian "Your apps", 
 *    klik ikon </> (Web)
 * 5. Copy konfigurasi yang muncul
 * =====================================================
 */

// =====================================================
// KONFIGURASI FIREBASE - GANTI DENGAN MILIK ANDA
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyCyRKvngA1EqlQmgxgxU4465qgRw8TdT08",
  authDomain: "si-gumart.firebaseapp.com",
  projectId: "si-gumart",
  storageBucket: "si-gumart.firebasestorage.app",
  messagingSenderId: "544375918988",
  appId: "1:544375918988:web:3375b3025b7d51ea2546a9",
  measurementId: "G-40ZGJFEWD1"
};

// =====================================================
// INISIALISASI FIREBASE
// Jangan ubah kode di bawah ini!
// =====================================================

// Inisialisasi Firebase App
const app = firebase.initializeApp(firebaseConfig);

// Inisialisasi layanan Authentication (untuk login)
const auth = firebase.auth();

// Inisialisasi layanan Firestore (untuk database)
const db = firebase.firestore();

// =====================================================
// KONFIGURASI TAMBAHAN FIRESTORE
// =====================================================

// Aktifkan offline persistence (data tersimpan offline)
db.enablePersistence()
    .then(() => {
        console.log("✅ Mode offline aktif - data tersimpan lokal");
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // Mungkin banyak tab terbuka
            console.log("⚠️ Mode offline tidak bisa diaktifkan (banyak tab terbuka)");
        } else if (err.code === 'unimplemented') {
            // Browser tidak support
            console.log("⚠️ Browser tidak mendukung mode offline");
        }
    });

// =====================================================
// LOG UNTUK DEBUGGING (hapus di production)
// =====================================================
console.log("🔥 Firebase berhasil diinisialisasi!");

console.log("📊 Project ID:", firebaseConfig.projectId);
