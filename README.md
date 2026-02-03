# 🎓 Guru Smart - Aplikasi Administrasi Guru

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
</p>

<p align="center">
  <strong>Aplikasi administrasi guru modern berbasis web untuk mengelola perangkat pembelajaran Kurikulum Merdeka</strong>
</p>

<p align="center">
  <a href="#fitur">Fitur</a> •
  <a href="#demo">Demo</a> •
  <a href="#instalasi">Instalasi</a> •
  <a href="#konfigurasi">Konfigurasi</a> •
  <a href="#penggunaan">Penggunaan</a> •
  <a href="#lisensi">Lisensi</a>
</p>

---

## 📖 Tentang Proyek

**Guru Smart** adalah aplikasi web yang dirancang untuk membantu guru dalam mengelola administrasi pembelajaran sesuai dengan Kurikulum Merdeka. Aplikasi ini mendukung berbagai jenjang pendidikan (SD, SMP, SMA, SMK) dan memungkinkan kolaborasi antar guru dalam satu sekolah berdasarkan NPSN.

### ✨ Highlight

- 🏫 **Multi-Sekolah** - Mendukung berbagai jenjang pendidikan (SD-SMA/SMK)
- 👥 **Kolaboratif** - Guru dalam satu sekolah (NPSN sama) dapat berbagi kalender dan melihat jadwal
- 🔄 **Auto-Generate** - Generate ATP, KKTP, Prota, Promes, dan Modul Ajar otomatis dari CP
- ⚠️ **Anti-Bentrok** - Validasi jadwal otomatis untuk mencegah konflik
- 📱 **Responsive** - Tampilan optimal di desktop dan mobile
- 🖨️ **Print-Ready** - Export dokumen dalam format A4 siap cetak

---

## 🚀 Fitur

### 📝 Master Data & Capaian Pembelajaran
- Input Capaian Pembelajaran (CP) berdasarkan elemen
- Template mata pelajaran standar (PAI, PKN, Bahasa Indonesia, Matematika, IPA, IPS, dll)
- **Custom mata pelajaran** dengan elemen yang dapat dikustomisasi
- Manajemen rombongan belajar (rombel)
- Integrasi 8 Dimensi Profil Lulusan

### 🎯 Alur Tujuan Pembelajaran (ATP)
- Input ATP manual
- Generate otomatis dari CP
- Filter berdasarkan mapel dan rombel
- Tujuan pembelajaran multiple per ATP

### ✅ Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
- 4 level kriteria (Belum Berkembang, Mulai Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang)
- Generate otomatis dari ATP
- Kriteria multiple per tujuan pembelajaran

### 📅 Kalender Pendidikan
- Kalender kolaboratif per sekolah (berdasarkan NPSN)
- Jenis kegiatan: Libur, Kegiatan Sekolah, Ujian, Pembagian Rapor
- Tampilan kalender bulanan
- Event dapat dilihat oleh semua guru di sekolah yang sama

### 🕐 Jadwal Pelajaran
- **Validasi anti-bentrok otomatis**
- Mencegah guru mengajar di 2 kelas pada waktu yang sama
- Mencegah rombel memiliki 2 mapel pada waktu yang sama
- Tampilan grid jadwal mingguan
- Kolaboratif - melihat jadwal guru lain di sekolah yang sama

### 📋 Program Tahunan (Prota)
- Input manual per semester
- Generate otomatis dari ATP
- Perhitungan total JP otomatis
- Filter berdasarkan mapel dan rombel

### 📆 Program Semester (Promes)
- Distribusi materi ke 24 minggu (6 bulan x 4 minggu)
- Auto-distribusi berdasarkan alokasi waktu
- Checkbox interaktif untuk menandai minggu pelaksanaan

### 📚 Modul Ajar
- Format lengkap Kurikulum Merdeka
- Komponen: Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran, Asesmen
- Generate otomatis dari ATP
- Tampilan card yang menarik

### ❓ Bank Soal
- Tipe soal: Pilihan Ganda, Essay, Benar/Salah
- Level kognitif: C1-C6 (Taksonomi Bloom)
- Filter berdasarkan mapel dan tipe
- Fitur duplikat soal
- Statistik jumlah soal

---

## 🖥️ Demo

> **Live Demo**: [Coming Soon]

### Screenshot

<details>
<summary>📸 Lihat Screenshot</summary>

#### Dashboard
![Dashboard](screenshots/dashboard.png)

#### Master Data
![Master Data](screenshots/master-data.png)

#### Jadwal Pelajaran
![Jadwal](screenshots/jadwal.png)

#### Bank Soal
![Bank Soal](screenshots/bank-soal.png)

</details>

---

## 📦 Instalasi

### Prasyarat

- Web browser modern (Chrome, Firefox, Edge, Safari)
- Akun [Firebase](https://firebase.google.com/) (gratis)
- Text editor (VS Code, Sublime Text, dll)

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/username/guru-smart.git
   cd guru-smart
