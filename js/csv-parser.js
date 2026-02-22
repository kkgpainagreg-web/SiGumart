// js/csv-parser.js
import { db } from './firebase-config.js';
import { collection, writeBatch, doc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const btnSync = document.getElementById('btn-sync-csv');
const statusText = document.getElementById('cp-status');
const alertBox = document.getElementById('csv-alert');

function showAlert(message, type = 'error') {
    alertBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    if (type === 'error') {
        alertBox.classList.add('bg-red-100', 'text-red-700');
    } else {
        alertBox.classList.add('bg-green-100', 'text-green-700');
    }
    alertBox.innerHTML = message;
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

// Cek apakah data sudah ada di database
async function checkDataStatus() {
    try {
        const q = query(collection(db, "cp_data"), where("mapel", "==", "PAI"));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            statusText.innerText = `Data tersedia: ${snapshot.size} baris Tujuan Pembelajaran.`;
            btnSync.innerHTML = `<i class="fas fa-sync"></i> Update Ulang pai.csv`;
            btnSync.classList.replace('bg-green-600', 'bg-yellow-500');
            btnSync.classList.replace('hover:bg-green-700', 'hover:bg-yellow-600');
        } else {
            statusText.innerText = "Data kosong. Silakan lakukan sinkronisasi.";
        }
    } catch (error) {
        statusText.innerText = "Gagal memuat status database.";
        console.error(error);
    }
}

// Fungsi Parsing dan Upload
async function parseAndUpload() {
    btnSync.disabled = true;
    btnSync.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memproses...`;

    try {
        // 1. Fetch file CSV dari folder lokal (Pastikan jalan di Live Server)
        const response = await fetch('./data/pai.csv');
        if (!response.ok) throw new Error("File pai.csv tidak ditemukan di folder /data/");
        
        const csvText = await response.text();
        
        // 2. Pecah baris dan bersihkan karakter carriage return (\r)
        const rows = csvText.split('\n').map(row => row.trim()).filter(row => row !== '');
        
        if (rows.length < 2) throw new Error("File CSV kosong atau format salah.");

        // 3. Ambil header (baris pertama) untuk validasi format
        const headers = rows[0].split(';');
        if(headers[0].toLowerCase() !== 'fase') throw new Error("Format CSV tidak sesuai. Gunakan delimiter titik koma (;).");

        // 4. Siapkan Firebase Batch
        let batch = writeBatch(db);
        let batchCount = 0;
        let totalUploaded = 0;

        // Mulai dari index 1 untuk melewati header
        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(';');
            
            // Validasi kolom (Fase;Kelas;Semester;Elemen;Tujuan Pembelajaran)
            if (columns.length >= 5) {
                const docRef = doc(collection(db, "cp_data")); // Auto ID
                
                batch.set(docRef, {
                    mapel: "PAI", // Label paten untuk data default
                    fase: columns[0].trim(),
                    kelas: parseInt(columns[1].trim()),
                    semester: columns[2].trim(),
                    elemen: columns[3].trim(),
                    tujuanPembelajaran: columns[4].trim(),
                    createdAt: new Date()
                });

                batchCount++;
                totalUploaded++;

                // Firestore batch limit adalah 500. Jika mendekati, commit dan buat batch baru.
                if (batchCount === 490) {
                    await batch.commit();
                    batch = writeBatch(db);
                    batchCount = 0;
                }
            }
        }

        // Commit sisa batch terakhir
        if (batchCount > 0) {
            await batch.commit();
        }

        showAlert(`Berhasil! ${totalUploaded} data CP/TP PAI telah dimasukkan ke database.`, 'success');
        checkDataStatus();

    } catch (error) {
        console.error("CSV Parse Error:", error);
        showAlert(`Gagal: ${error.message}`, 'error');
    } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = `<i class="fas fa-database"></i> Sinkronisasi pai.csv Sekarang`;
    }
}

// Event Listeners
btnSync.addEventListener('click', parseAndUpload);

// Jalankan cek status saat halaman dimuat
document.addEventListener('DOMContentLoaded', checkDataStatus);