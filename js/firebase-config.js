// js/firebase-config.js
// =====================================================
// KONFIGURASI FIREBASE - PISAHKAN FILE INI
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Collections Reference
const COLLECTIONS = {
    USERS: 'users',
    SCHOOLS: 'schools',
    MASTER_DATA: 'master_data',
    SUBJECTS: 'subjects',
    CP_DATA: 'cp_data',
    ATP: 'atp',
    KKTP: 'kktp',
    CALENDAR: 'calendar',
    SCHEDULE: 'schedule',
    PROTA: 'prota',
    PROMES: 'promes',
    MODUL_AJAR: 'modul_ajar',
    BANK_SOAL: 'bank_soal',
    ROMBEL: 'rombel'
};

// 8 Dimensi Profil Lulusan
const PROFIL_LULUSAN = [
    {
        id: 'keimanan',
        nama: 'Keimanan dan Ketakwaan',
        deskripsi: 'Keyakinan teguh pada Tuhan YME'
    },
    {
        id: 'kewargaan',
        nama: 'Kewargaan',
        deskripsi: 'Cinta tanah air, sadar aturan, dan peduli sosial'
    },
    {
        id: 'penalaran',
        nama: 'Penalaran Kritis',
        deskripsi: 'Berpikir logis dan analitis'
    },
    {
        id: 'kreativitas',
        nama: 'Kreativitas',
        deskripsi: 'Inovatif dan fleksibel'
    },
    {
        id: 'kolaborasi',
        nama: 'Kolaborasi',
        deskripsi: 'Bekerja sama mencapai tujuan'
    },
    {
        id: 'kemandirian',
        nama: 'Kemandirian',
        deskripsi: 'Mampu mengelola diri sendiri'
    },
    {
        id: 'kesehatan',
        nama: 'Kesehatan',
        deskripsi: 'Fisik prima dan mental sehat'
    },
    {
        id: 'komunikasi',
        nama: 'Komunikasi',
        deskripsi: 'Efektif menyampaikan ide'
    }
];

// Jenjang Pendidikan
const JENJANG = {
    SD: { nama: 'SD', kelas: [1, 2, 3, 4, 5, 6] },
    SMP: { nama: 'SMP', kelas: [7, 8, 9] },
    SMA: { nama: 'SMA', kelas: [10, 11, 12] },
    SMK: { nama: 'SMK', kelas: [10, 11, 12] }
};

// Template Mata Pelajaran dengan Elemen CP
const SUBJECT_TEMPLATES = {
    'PAI': {
        nama: 'Pendidikan Agama Islam dan Budi Pekerti',
        elemen: ['Al-Quran dan Hadis', 'Aqidah', 'Akhlak', 'Fikih', 'Sejarah Peradaban Islam']
    },
    'PKN': {
        nama: 'Pendidikan Pancasila dan Kewarganegaraan',
        elemen: ['Pancasila', 'UUD 1945', 'NKRI', 'Bhinneka Tunggal Ika']
    },
    'INDONESIA': {
        nama: 'Bahasa Indonesia',
        elemen: ['Menyimak', 'Membaca', 'Memirsa', 'Berbicara', 'Menulis']
    },
    'MATEMATIKA': {
        nama: 'Matematika',
        elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Pengukuran', 'Analisis Data']
    },
    'IPA': {
        nama: 'Ilmu Pengetahuan Alam',
        elemen: ['Makhluk Hidup', 'Zat dan Perubahannya', 'Energi', 'Bumi dan Antariksa']
    },
    'IPS': {
        nama: 'Ilmu Pengetahuan Sosial',
        elemen: ['Geografi', 'Ekonomi', 'Sosiologi', 'Sejarah']
    },
    'INGGRIS': {
        nama: 'Bahasa Inggris',
        elemen: ['Listening', 'Speaking', 'Reading', 'Writing']
    },
    'SENI': {
        nama: 'Seni Budaya',
        elemen: ['Seni Rupa', 'Seni Musik', 'Seni Tari', 'Seni Teater']
    },
    'PJOK': {
        nama: 'Pendidikan Jasmani, Olahraga dan Kesehatan',
        elemen: ['Gerak Dasar', 'Aktivitas Fisik', 'Kesehatan', 'Kebugaran']
    },
    'PRAKARYA': {
        nama: 'Prakarya dan Kewirausahaan',
        elemen: ['Kerajinan', 'Rekayasa', 'Budidaya', 'Pengolahan']
    },
    'INFORMATIKA': {
        nama: 'Informatika',
        elemen: ['Berpikir Komputasional', 'Teknologi Informasi', 'Praktik Lintas Bidang', 'Dampak Sosial Informatika']
    }
};

console.log('Firebase Config Loaded');