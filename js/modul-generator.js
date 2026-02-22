// js/modul-generator.js
import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const formModul = document.getElementById('form-modul-ajar');
const btnLoadTp = document.getElementById('btn-load-tp');
const selectKelas = document.getElementById('modul-kelas');
const selectSemester = document.getElementById('modul-semester');
const selectTp = document.getElementById('modul-tp');
const printContainer = document.getElementById('print-modul-container');

// State sementara untuk menyimpan data TP lengkap
let currentTpData = [];

// --- FITUR 1: Tarik Data Tujuan Pembelajaran Otomatis ---
btnLoadTp.addEventListener('click', async () => {
    const kelas = selectKelas.value;
    const semester = selectSemester.value;

    if (!kelas) {
        alert("Pilih Kelas terlebih dahulu!");
        return;
    }

    try {
        btnLoadTp.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memuat...`;
        btnLoadTp.disabled = true;

        const q = query(
            collection(db, "cp_data"),
            where("kelas", "==", parseInt(kelas)),
            where("semester", "==", semester),
            where("mapel", "==", "PAI")
        );

        const snapshot = await getDocs(q);
        
        selectTp.innerHTML = '<option value="">-- Pilih Tujuan Pembelajaran --</option>';
        currentTpData = [];

        if (snapshot.empty) {
            selectTp.innerHTML = '<option value="">Data TP kosong. Sinkronisasi pai.csv dulu.</option>';
            selectTp.disabled = true;
            selectTp.classList.add('bg-gray-100');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            currentTpData.push({ id: doc.id, ...data });
            
            // Tambahkan ke dropdown (Potong teks jika terlalu panjang untuk UI)
            const optionText = `[${data.elemen}] - ${data.tujuanPembelajaran.substring(0, 70)}...`;
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = optionText;
            selectTp.appendChild(option);
        });

        selectTp.disabled = false;
        selectTp.classList.remove('bg-gray-100');

    } catch (error) {
        console.error("Error loading TP:", error);
        alert("Gagal memuat Tujuan Pembelajaran.");
    } finally {
        btnLoadTp.innerHTML = `<i class="fas fa-search mr-2"></i> Tarik Data TP`;
        btnLoadTp.disabled = false;
    }
});

// --- FITUR 2: Generate Dokumen Print Modul Ajar ---
formModul.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("Sesi habis. Silakan login kembali.");
        return;
    }

    // Ambil data dari form
    const idTpTerpilih = selectTp.value;
    const dataTpUtuh = currentTpData.find(tp => tp.id === idTpTerpilih);
    
    if (!dataTpUtuh) {
        alert("Silakan pilih Tujuan Pembelajaran yang valid.");
        return;
    }

    const alokasiWaktu = document.getElementById('modul-waktu').value;
    const modelBelajar = document.getElementById('modul-model').value;
    const kegiatan = document.getElementById('modul-kegiatan').value.replace(/\n/g, '<br>');
    const lkpd = document.getElementById('modul-lkpd').value.replace(/\n/g, '<br>');
    
    // Ambil nama guru (Bisa ditarik dari profil, sementara pakai displayName)
    const namaGuru = auth.currentUser.displayName || "Nama Guru";

    // Susun Template HTML Modul Ajar
    const htmlDokumen = `
        <div class="p-8 max-w-4xl mx-auto bg-white font-serif text-gray-900 leading-relaxed">
            
            <div class="text-center mb-6 border-b-4 border-black pb-4">
                <h1 class="text-2xl font-bold uppercase">Modul Ajar Kurikulum Merdeka</h1>
                <h2 class="text-xl font-bold">Mata Pelajaran: PAI & Budi Pekerti</h2>
            </div>

            <h3 class="font-bold text-lg mb-2 bg-gray-200 p-1">A. INFORMASI UMUM</h3>
            <table class="w-full text-sm mb-4 border-collapse border border-gray-400">
                <tr>
                    <td class="border border-gray-400 p-2 font-bold w-1/3">Nama Penyusun</td>
                    <td class="border border-gray-400 p-2">${namaGuru}</td>
                </tr>
                <tr>
                    <td class="border border-gray-400 p-2 font-bold">Kelas / Semester</td>
                    <td class="border border-gray-400 p-2">Kelas ${dataTpUtuh.kelas} / ${dataTpUtuh.semester}</td>
                </tr>
                <tr>
                    <td class="border border-gray-400 p-2 font-bold">Alokasi Waktu</td>
                    <td class="border border-gray-400 p-2">${alokasiWaktu}</td>
                </tr>
                <tr>
                    <td class="border border-gray-400 p-2 font-bold">Model Pembelajaran</td>
                    <td class="border border-gray-400 p-2">${modelBelajar}</td>
                </tr>
            </table>

            <h3 class="font-bold text-lg mb-2 bg-gray-200 p-1 mt-6">B. KOMPONEN INTI</h3>
            <div class="mb-4">
                <p class="font-bold">1. Elemen & Capaian:</p>
                <p class="ml-4 mb-2">Elemen: ${dataTpUtuh.elemen}</p>
                <p class="font-bold">2. Tujuan Pembelajaran (TP):</p>
                <p class="ml-4 mb-2 bg-blue-50 p-2 border-l-4 border-blue-600">${dataTpUtuh.tujuanPembelajaran}</p>
            </div>

            <div class="mb-6">
                <p class="font-bold mb-2">3. Kegiatan Pembelajaran (Inti):</p>
                <div class="ml-4 p-3 border border-gray-300 rounded min-h-[100px]">
                    ${kegiatan}
                </div>
            </div>

            <div class="page-break" style="page-break-before: always; margin-top: 40px;"></div>

            <h3 class="font-bold text-lg mb-2 bg-gray-200 p-1 text-center uppercase">Lampiran: Lembar Kerja Peserta Didik (LKPD)</h3>
            
            <div class="border-2 border-black p-6 mt-4 rounded-lg">
                <div class="flex justify-between mb-4 border-b border-dashed border-gray-400 pb-2">
                    <p><strong>Nama:</strong> ......................................................</p>
                    <p><strong>Kelas:</strong> ......................................................</p>
                    <p><strong>Nilai:</strong> ................</p>
                </div>
                <div class="mb-4 text-center">
                    <p class="font-bold">Materi Pokok: ${dataTpUtuh.elemen}</p>
                </div>
                <div class="mt-6 text-base">
                    <p class="font-bold mb-2">Instruksi / Soal:</p>
                    ${lkpd}
                </div>
                
                <div class="mt-16 pt-8 border-t border-gray-300 flex justify-end">
                    <div class="text-center">
                        <p class="mb-12">Guru Mata Pelajaran,</p>
                        <p class="font-bold underline">${namaGuru}</p>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Render ke Container
    printContainer.innerHTML = htmlDokumen;

    // Proses Print
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContainer.innerHTML;
    
    window.print();
    
    // Kembalikan UI
    document.body.innerHTML = originalContents;
    window.location.reload(); 
});