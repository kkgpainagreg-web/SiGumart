// js/jurnal.js
import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const inputTanggal = document.getElementById('jurnal-tanggal');
const jadwalList = document.getElementById('jurnal-jadwal-list');
const formJurnal = document.getElementById('form-jurnal');
const selectTp = document.getElementById('jurnal-tp');
const tabelJurnalBody = document.getElementById('tabel-jurnal-body');
const btnPrintJurnal = document.getElementById('btn-print-jurnal');

// Konversi Hari JS ke Format Indonesia
const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Set default tanggal hari ini saat diload
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    inputTanggal.value = today;
    
    // Delay sedikit agar auth Firebase siap
    setTimeout(() => {
        loadJadwalHarian(today);
        loadRekapJurnal();
    }, 1500);
});

// Event Listener saat tanggal diubah
inputTanggal.addEventListener('change', (e) => {
    loadJadwalHarian(e.target.value);
});

// --- FITUR 1: Tarik Jadwal Mengajar Sesuai Tanggal ---
async function loadJadwalHarian(dateString) {
    if (!auth.currentUser) return;
    
    jadwalList.innerHTML = '<p class="text-sm text-gray-500"><i class="fas fa-spinner fa-spin"></i> Mengecek jadwal...</p>';
    formJurnal.classList.add('hidden');
    
    const dateObj = new Date(dateString);
    const namaHari = daysIndo[dateObj.getDay()]; // cth: "Senin"

    try {
        const q = query(
            collection(db, "schedules"),
            where("teacherId", "==", auth.currentUser.uid),
            where("day", "==", namaHari)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            jadwalList.innerHTML = `<p class="text-sm text-red-500 font-medium">Tidak ada jadwal mengajar pada hari ${namaHari}.</p>`;
            return;
        }

        jadwalList.innerHTML = ''; // Bersihkan
        let schedules = [];
        snapshot.forEach(doc => schedules.push({ id: doc.id, ...doc.data() }));
        
        // Urutkan berdasarkan jam mulai
        schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));

        schedules.forEach(sched => {
            const div = document.createElement('div');
            div.className = "p-3 border rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition flex justify-between items-center";
            div.innerHTML = `
                <div>
                    <p class="font-bold text-blue-700">${sched.rombel} <span class="text-xs text-gray-500 font-normal">(${sched.subject})</span></p>
                    <p class="text-xs text-gray-600"><i class="far fa-clock"></i> ${sched.startTime} - ${sched.endTime}</p>
                </div>
                <button class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Isi Jurnal</button>
            `;
            // Saat diklik, buka form dan siapkan dropdown TP
            div.addEventListener('click', () => bukaFormJurnal(sched, dateString, namaHari));
            jadwalList.appendChild(div);
        });

    } catch (error) {
        console.error("Error load jadwal:", error);
        jadwalList.innerHTML = `<p class="text-sm text-red-500">Gagal memuat jadwal.</p>`;
    }
}

// --- FITUR 2: Buka Form & Tarik TP Sesuai Kelas ---
async function bukaFormJurnal(sched, dateString, namaHari) {
    formJurnal.classList.remove('hidden');
    document.getElementById('jurnal-kelas-aktif').innerText = `Mengisi Jurnal: Kelas ${sched.rombel} (${sched.startTime})`;
    document.getElementById('jurnal-rombel-hidden').value = sched.rombel;
    document.getElementById('jurnal-hari-hidden').value = `${namaHari}, ${dateString}`;
    
    // Kosongkan isian
    document.getElementById('jurnal-materi').value = '';
    document.getElementById('jurnal-kehadiran').value = '';
    document.getElementById('jurnal-hasil').value = '';
    selectTp.innerHTML = '<option value="">Memuat TP...</option>';

    // Ekstrak angka kelas dari rombel (Contoh "7A" -> 7, "10 IPA" -> 10)
    const tingkatMatch = sched.rombel.match(/\d+/);
    const tingkat = tingkatMatch ? parseInt(tingkatMatch[0]) : null;

    if (!tingkat) {
        selectTp.innerHTML = '<option value="">Gagal deteksi tingkat kelas.</option>';
        return;
    }

    try {
        // Tarik TP dari database untuk kelas ini (Asumsi V1: load semua semester Ganjil & Genap)
        const q = query(
            collection(db, "cp_data"),
            where("kelas", "==", tingkat),
            where("mapel", "==", "PAI")
        );
        const snap = await getDocs(q);
        
        selectTp.innerHTML = '<option value="">-- Pilih TP yang diajarkan --</option>';
        
        snap.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            // Simpan TP utuh di value agar mudah disalin ke textarea
            option.value = data.tujuanPembelajaran;
            option.setAttribute('data-elemen', data.elemen);
            option.textContent = `[${data.semester}] ${data.tujuanPembelajaran.substring(0, 50)}...`;
            selectTp.appendChild(option);
        });

        // Event: Saat TP dipilih, otomatis isi Materi dan Hasil (TIDAK PERLU NGETIK LAGI)
        selectTp.addEventListener('change', function() {
            if(this.value) {
                const selectedOption = this.options[this.selectedIndex];
                document.getElementById('jurnal-materi').value = selectedOption.getAttribute('data-elemen');
                document.getElementById('jurnal-hasil').value = "Tercapai: " + this.value;
            }
        });

    } catch (error) {
        console.error(error);
        selectTp.innerHTML = '<option value="">Error memuat TP.</option>';
    }
}

// --- FITUR 3: Simpan Jurnal ke Firestore ---
formJurnal.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const dataJurnal = {
        teacherId: auth.currentUser.uid,
        tanggalInput: inputTanggal.value,
        hariTanggal: document.getElementById('jurnal-hari-hidden').value,
        rombel: document.getElementById('jurnal-rombel-hidden').value,
        materi: document.getElementById('jurnal-materi').value,
        tp: selectTp.value,
        kehadiran: document.getElementById('jurnal-kehadiran').value,
        hasil: document.getElementById('jurnal-hasil').value,
        timestamp: new Date()
    };

    try {
        const btn = formJurnal.querySelector('button[type="submit"]');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Menyimpan...`;
        
        await addDoc(collection(db, "journals"), dataJurnal);
        
        alert("Jurnal berhasil disimpan!");
        formJurnal.reset();
        formJurnal.classList.add('hidden');
        loadRekapJurnal(); // Refresh tabel

        btn.innerHTML = `<i class="fas fa-save mr-2"></i> Simpan Jurnal`;
    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan jurnal.");
    }
});

// --- FITUR 4: Tampilkan Rekap Jurnal ---
async function loadRekapJurnal() {
    if (!auth.currentUser) return;
    
    tabelJurnalBody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Memuat data...</td></tr>';
    
    try {
        const q = query(
            collection(db, "journals"),
            where("teacherId", "==", auth.currentUser.uid),
            orderBy("tanggalInput", "desc")
        );
        const snap = await getDocs(q);
        
        tabelJurnalBody.innerHTML = '';
        if (snap.empty) {
            tabelJurnalBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">Belum ada catatan jurnal.</td></tr>';
            return;
        }

        let no = 1;
        snap.forEach(doc => {
            const d = doc.data();
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b hover:bg-gray-50";
            tr.innerHTML = `
                <td class="px-3 py-2 text-center">${no++}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs">${d.hariTanggal}</td>
                <td class="px-3 py-2 font-bold">${d.rombel}</td>
                <td class="px-3 py-2 text-xs">${d.materi}</td>
                <td class="px-3 py-2 text-xs truncate max-w-xs" title="${d.tp}">${d.tp}</td>
                <td class="px-3 py-2 text-xs">${d.kehadiran}</td>
                <td class="px-3 py-2 text-xs truncate max-w-xs" title="${d.hasil}">${d.hasil}</td>
            `;
            tabelJurnalBody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tabelJurnalBody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-red-500">Gagal memuat rekap. Pastikan index Firestore dibuat jika error (Cek Console).</td></tr>';
    }
}

// --- FITUR 5: Cetak Jurnal Format Resmi ---
btnPrintJurnal.addEventListener('click', async () => {
    // Tarik semua data jurnal untuk di render ulang ke template Print
    const q = query(
        collection(db, "journals"),
        where("teacherId", "==", auth.currentUser.uid),
        orderBy("tanggalInput", "asc")
    );
    const snap = await getDocs(q);
    
    let tableRows = '';
    let no = 1;
    snap.forEach(doc => {
        const d = doc.data();
        tableRows += `
            <tr>
                <td style="border: 1px solid black; padding: 6px; text-align: center;">${no++}</td>
                <td style="border: 1px solid black; padding: 6px; text-align: center;">${d.rombel}</td>
                <td style="border: 1px solid black; padding: 6px;">${d.materi}</td>
                <td style="border: 1px solid black; padding: 6px;">${d.tp}</td>
                <td style="border: 1px solid black; padding: 6px;">${d.kehadiran}</td>
                <td style="border: 1px solid black; padding: 6px; white-space: nowrap;">${d.hariTanggal}</td>
                <td style="border: 1px solid black; padding: 6px;">${d.hasil}</td>
            </tr>
        `;
    });

    const namaGuru = auth.currentUser.displayName || "Nama Guru";
    // Untuk V1, kita pakai placeholder jika Kepala Sekolah belum disetting
    const namaKepsek = document.getElementById('input-kepsek')?.value || "_________________________";
    const namaKota = document.getElementById('input-kota')?.value || "Tasikmalaya";
    
    // Tentukan Tahun Pelajaran (Bisa ditarik dari fungsi getAutoSchoolYear di app.js)
    const year = new Date().getFullYear();

    const printHTML = `
        <div style="font-family: 'Times New Roman', Times, serif; color: black; line-height: 1.5; padding: 20px;">
            <h2 style="text-align: center; margin-bottom: 20px; text-transform: uppercase;">JURNAL PEMBELAJARAN</h2>
            
            <table style="width: 100%; border: none; margin-bottom: 15px; font-weight: bold;">
                <tr><td style="width: 200px;">Mata Pelajaran</td><td>: Pendidikan Agama Islam dan Budi Pekerti</td></tr>
                <tr><td>Semester</td><td>: Ganjil / Genap</td></tr>
                <tr><td>Tahun Pelajaran</td><td>: ${year}/${year+1}</td></tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 8px;">No</th>
                        <th style="border: 1px solid black; padding: 8px;">Kelas</th>
                        <th style="border: 1px solid black; padding: 8px;">Materi</th>
                        <th style="border: 1px solid black; padding: 8px;">Tujuan Pembelajaran</th>
                        <th style="border: 1px solid black; padding: 8px;">Kehadiran</th>
                        <th style="border: 1px solid black; padding: 8px;">Hari/Tanggal</th>
                        <th style="border: 1px solid black; padding: 8px;">Hasil Pembelajaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <div style="margin-top: 50px; display: flex; justify-content: space-between; text-align: center;">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline;">${namaKepsek}</p>
                </div>
                <div>
                    <p>${namaKota}, ${new Date().toLocaleDateString('id-ID')}</p>
                    <p>Guru Mata Pelajaran</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline;">${namaGuru}</p>
                </div>
            </div>
        </div>
    `;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
});