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
    // API Key - kunci untuk mengakses Firebase
    apiKey: "MASUKKAN_API_KEY_ANDA_DISINI",
    
    // Auth Domain - domain untuk autentikasi
    authDomain: "nama-project-anda.firebaseapp.com",
    
    // Project ID - ID unik project Anda
    projectId: "nama-project-anda",
    
    // Storage Bucket - untuk menyimpan file (opsional)
    storageBucket: "nama-project-anda.appspot.com",
    
    // Messaging Sender ID - untuk notifikasi (opsional)
    messagingSenderId: "123456789012",
    
    // App ID - ID aplikasi Anda
    appId: "1:123456789012:web:abcdef123456"
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