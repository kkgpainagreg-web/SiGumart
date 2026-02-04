// =====================================================
// FIREBASE CONFIG - firebase-config.js
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    getDoc,
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyRKvngA1EqlQmgxgxU4465qgRw8TdT08",
    authDomain: "si-gumart.firebaseapp.com",
    projectId: "si-gumart",
    storageBucket: "si-gumart.firebasestorage.app",
    messagingSenderId: "544375918988",
    appId: "1:544375918988:web:3375b3025b7d51ea2546a9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export semua yang diperlukan
export { 
    db, 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    getDoc,
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch
};

// =====================================================
// COLLECTION REFERENCES
// =====================================================
export const COLLECTIONS = {
    USERS: 'users',
    SCHOOLS: 'schools',
    MASTER_DATA: 'master_data',
    SUBJECTS: 'subjects',
    CP_ELEMENTS: 'cp_elements',
    ATP: 'atp',
    KKTP: 'kktp',
    CALENDAR: 'calendar_events',
    SCHEDULES: 'schedules',
    PROTA: 'prota',
    PROMES: 'promes',
    MODUL_AJAR: 'modul_ajar',
    LKPD: 'lkpd',
    BANK_SOAL: 'bank_soal'
};

// =====================================================
// 8 DIMENSI PROFIL LULUSAN
// =====================================================
export const DIMENSI_PROFIL_LULUSAN = [
    {
        id: 'keimanan',
        nama: 'Keimanan dan Ketakwaan',
        deskripsi: 'Keyakinan teguh pada Tuhan YME',
        indikator: [
            'Menjalankan ibadah sesuai agama',
            'Bersyukur atas nikmat Tuhan',
            'Toleransi antar umat beragama'
        ]
    },
    {
        id: 'kewargaan',
        nama: 'Kewargaan',
        deskripsi: 'Cinta tanah air, sadar aturan, dan peduli sosial',
        indikator: [
            'Menghargai keberagaman budaya',
            'Mematuhi peraturan',
            'Berpartisipasi dalam kegiatan sosial'
        ]
    },
    {
        id: 'penalaran',
        nama: 'Penalaran Kritis',
        deskripsi: 'Berpikir logis dan analitis',
        indikator: [
            'Menganalisis informasi secara objektif',
            'Membuat keputusan berdasarkan data',
            'Memecahkan masalah secara sistematis'
        ]
    },
    {
        id: 'kreativitas',
        nama: 'Kreativitas',
        deskripsi: 'Inovatif dan fleksibel',
        indikator: [
            'Menghasilkan ide-ide baru',
            'Adaptif terhadap perubahan',
            'Berani mencoba hal baru'
        ]
    },
    {
        id: 'kolaborasi',
        nama: 'Kolaborasi',
        deskripsi: 'Bekerja sama mencapai tujuan',
        indikator: [
            'Menghargai pendapat orang lain',
            'Berkontribusi dalam tim',
            'Menyelesaikan konflik secara konstruktif'
        ]
    },
    {
        id: 'kemandirian',
        nama: 'Kemandirian',
        deskripsi: 'Mampu mengelola diri sendiri',
        indikator: [
            'Mengatur waktu dengan baik',
            'Bertanggung jawab atas tindakan',
            'Berinisiatif dalam belajar'
        ]
    },
    {
        id: 'kesehatan',
        nama: 'Kesehatan',
        deskripsi: 'Fisik prima dan mental sehat',
        indikator: [
            'Menjaga kebersihan diri',
            'Berolahraga teratur',
            'Mengelola stress dengan baik'
        ]
    },
    {
        id: 'komunikasi',
        nama: 'Komunikasi',
        deskripsi: 'Efektif menyampaikan ide',
        indikator: [
            'Menyampaikan pendapat dengan jelas',
            'Mendengarkan secara aktif',
            'Menggunakan bahasa yang santun'
        ]
    }
];

// =====================================================
// JENJANG PENDIDIKAN
// =====================================================
export const JENJANG = {
    SD: {
        nama: 'Sekolah Dasar',
        kelas: ['I', 'II', 'III', 'IV', 'V', 'VI'],
        fase: ['A', 'B', 'C']
    },
    SMP: {
        nama: 'Sekolah Menengah Pertama',
        kelas: ['VII', 'VIII', 'IX'],
        fase: ['D']
    },
    SMA: {
        nama: 'Sekolah Menengah Atas',
        kelas: ['X', 'XI', 'XII'],
        fase: ['E', 'F']
    },
    SMK: {
        nama: 'Sekolah Menengah Kejuruan',
        kelas: ['X', 'XI', 'XII', 'XIII'],
        fase: ['E', 'F']
    }
};

// =====================================================
// DEFAULT SUBJECTS PER JENJANG
// =====================================================
export const DEFAULT_SUBJECTS = {
    SD: [
        { kode: 'PAI', nama: 'Pendidikan Agama Islam dan Budi Pekerti', elemen: ['Al-Quran dan Hadis', 'Aqidah', 'Akhlak', 'Fikih', 'Sejarah Peradaban Islam'] },
        { kode: 'PKN', nama: 'Pendidikan Pancasila', elemen: ['Pancasila', 'UUD 1945', 'Bhinneka Tunggal Ika', 'NKRI'] },
        { kode: 'BIN', nama: 'Bahasa Indonesia', elemen: ['Menyimak', 'Membaca', 'Menulis', 'Berbicara'] },
        { kode: 'MTK', nama: 'Matematika', elemen: ['Bilangan', 'Geometri', 'Pengukuran', 'Statistika'] },
        { kode: 'IPAS', nama: 'IPAS', elemen: ['Makhluk Hidup', 'Zat dan Energi', 'Bumi dan Antariksa', 'Teknologi'] },
        { kode: 'PJOK', nama: 'PJOK', elemen: ['Gerak Dasar', 'Kebugaran', 'Olahraga', 'Kesehatan'] },
        { kode: 'SBK', nama: 'Seni Budaya', elemen: ['Seni Rupa', 'Seni Musik', 'Seni Tari', 'Seni Teater'] },
        { kode: 'BING', nama: 'Bahasa Inggris', elemen: ['Listening', 'Speaking', 'Reading', 'Writing'] }
    ],
    SMP: [
        { kode: 'PAI', nama: 'Pendidikan Agama Islam dan Budi Pekerti', elemen: ['Al-Quran dan Hadis', 'Aqidah', 'Akhlak', 'Fikih', 'Sejarah Peradaban Islam'] },
        { kode: 'PKN', nama: 'Pendidikan Pancasila', elemen: ['Pancasila', 'UUD 1945', 'Bhinneka Tunggal Ika', 'NKRI'] },
        { kode: 'BIN', nama: 'Bahasa Indonesia', elemen: ['Menyimak', 'Membaca', 'Menulis', 'Berbicara'] },
        { kode: 'MTK', nama: 'Matematika', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Statistika dan Peluang'] },
        { kode: 'IPA', nama: 'Ilmu Pengetahuan Alam', elemen: ['Fisika', 'Kimia', 'Biologi'] },
        { kode: 'IPS', nama: 'Ilmu Pengetahuan Sosial', elemen: ['Geografi', 'Sejarah', 'Ekonomi', 'Sosiologi'] },
        { kode: 'BING', nama: 'Bahasa Inggris', elemen: ['Listening', 'Speaking', 'Reading', 'Writing'] },
        { kode: 'PJOK', nama: 'PJOK', elemen: ['Gerak Dasar', 'Kebugaran', 'Olahraga', 'Kesehatan'] },
        { kode: 'SBK', nama: 'Seni Budaya', elemen: ['Seni Rupa', 'Seni Musik', 'Seni Tari', 'Seni Teater'] },
        { kode: 'PKWU', nama: 'Prakarya', elemen: ['Kerajinan', 'Rekayasa', 'Budidaya', 'Pengolahan'] },
        { kode: 'INFO', nama: 'Informatika', elemen: ['Berpikir Komputasional', 'TIK', 'Sistem Komputer', 'Jaringan'] }
    ],
    SMA: [
        { kode: 'PAI', nama: 'Pendidikan Agama Islam dan Budi Pekerti', elemen: ['Al-Quran dan Hadis', 'Aqidah', 'Akhlak', 'Fikih', 'Sejarah Peradaban Islam'] },
        { kode: 'PKN', nama: 'Pendidikan Pancasila', elemen: ['Pancasila', 'UUD 1945', 'Bhinneka Tunggal Ika', 'NKRI'] },
        { kode: 'BIN', nama: 'Bahasa Indonesia', elemen: ['Menyimak', 'Membaca', 'Menulis', 'Berbicara'] },
        { kode: 'MTK', nama: 'Matematika', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Kalkulus', 'Statistika'] },
        { kode: 'BING', nama: 'Bahasa Inggris', elemen: ['Listening', 'Speaking', 'Reading', 'Writing'] },
        { kode: 'SEJ', nama: 'Sejarah', elemen: ['Sejarah Indonesia', 'Sejarah Dunia'] },
        { kode: 'FIS', nama: 'Fisika', elemen: ['Mekanika', 'Termodinamika', 'Gelombang', 'Listrik Magnet', 'Fisika Modern'] },
        { kode: 'KIM', nama: 'Kimia', elemen: ['Struktur Atom', 'Ikatan Kimia', 'Termokimia', 'Kesetimbangan', 'Kimia Organik'] },
        { kode: 'BIO', nama: 'Biologi', elemen: ['Sel', 'Genetika', 'Evolusi', 'Ekologi', 'Bioteknologi'] },
        { kode: 'EKO', nama: 'Ekonomi', elemen: ['Mikro', 'Makro', 'Akuntansi'] },
        { kode: 'GEO', nama: 'Geografi', elemen: ['Fisik', 'Sosial', 'Teknik'] },
        { kode: 'SOS', nama: 'Sosiologi', elemen: ['Individu', 'Kelompok', 'Masyarakat'] },
        { kode: 'INFO', nama: 'Informatika', elemen: ['Berpikir Komputasional', 'TIK', 'Sistem Komputer', 'Pemrograman'] }
    ]
};