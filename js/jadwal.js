// js/jadwal.js
import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// State Management: Simpan data jadwal di memory untuk validasi real-time cepat
let schedulesState = [];

// DOM Elements
const formJadwal = document.getElementById('form-jadwal');
const alertBox = document.getElementById('jadwal-alert');
const tabelBody = document.getElementById('tabel-jadwal-body');

// --- UTILITY: Konversi Waktu & Cek Overlap ---
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

function isTimeOverlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    // Rumus pasti irisan waktu
    return s1 < e2 && s2 < e1;
}

// --- CORE LOGIC: Validasi Anti-Bentrok ---
function validateSchedule(newSched) {
    for (const existing of schedulesState) {
        // Hanya cek bentrok jika harinya sama
        if (existing.day === newSched.day) {
            
            if (isTimeOverlap(newSched.startTime, newSched.endTime, existing.startTime, existing.endTime)) {
                
                // Aturan 1 & 3: Guru yang sama tidak bisa mengajar >1 Rombel atau >1 Mapel di jam yang sama
                if (existing.teacherId === newSched.teacherId) {
                    return { 
                        valid: false, 
                        message: `Bentrok: Anda sudah memiliki jadwal mengajar di kelas ${existing.rombel} (${existing.subject}) pada waktu tersebut.` 
                    };
                }
                
                // Aturan 2: Satu rombel tidak bisa diisi guru lain / mapel lain di jam yang sama
                if (existing.rombel.toLowerCase() === newSched.rombel.toLowerCase()) {
                    return { 
                        valid: false, 
                        message: `Bentrok: Kelas ${existing.rombel} sudah memiliki jadwal mapel ${existing.subject} pada waktu tersebut.` 
                    };
                }
            }
        }
    }
    return { valid: true, message: "Validasi sukses. Tidak ada bentrok." };
}

// --- UI HELPERS ---
function showAlert(message, type = 'error') {
    alertBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    if (type === 'error') {
        alertBox.classList.add('bg-red-100', 'text-red-700');
    } else {
        alertBox.classList.add('bg-green-100', 'text-green-700');
    }
    alertBox.innerHTML = message;
    
    // Auto hide setelah 5 detik
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}

function renderTable() {
    tabelBody.innerHTML = '';
    
    if (schedulesState.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-400">Belum ada data jadwal.</td></tr>`;
        return;
    }

    // Sort by Hari lalu Jam Mulai
    const daysOrder = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6 };
    schedulesState.sort((a, b) => {
        if (daysOrder[a.day] !== daysOrder[b.day]) return daysOrder[a.day] - daysOrder[b.day];
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    schedulesState.forEach(sched => {
        // Cek apakah jadwal ini milik user yang sedang login
        const isOwner = auth.currentUser && auth.currentUser.uid === sched.teacherId;
        const deleteBtn = isOwner 
            ? `<button onclick="deleteSchedule('${sched.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>`
            : `<span class="text-gray-300 text-xs">Milik Guru Lain</span>`;

        const tr = document.createElement('tr');
        tr.className = "bg-white border-b hover:bg-gray-50";
        tr.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-900">${sched.day}</td>
            <td class="px-4 py-3">${sched.startTime} - ${sched.endTime}</td>
            <td class="px-4 py-3 font-bold text-blue-600">${sched.rombel}</td>
            <td class="px-4 py-3">${sched.subject}</td>
            <td class="px-4 py-3 text-center">${deleteBtn}</td>
        `;
        tabelBody.appendChild(tr);
    });
}

// --- DATABASE OPERATIONS ---
async function fetchSchedules() {
    try {
        // Menarik semua jadwal (Di skenario nyata, tarik per-ID Sekolah)
        const q = query(collection(db, "schedules"));
        const querySnapshot = await getDocs(q);
        schedulesState = [];
        querySnapshot.forEach((doc) => {
            schedulesState.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
    } catch (error) {
        console.error("Error fetching schedules:", error);
    }
}

// Global function untuk tombol hapus di tabel HTML
window.deleteSchedule = async (id) => {
    if(confirm('Hapus jadwal ini? Sinkronisasi ke Prota & Promes juga akan diperbarui.')){
        try {
            await deleteDoc(doc(db, "schedules", id));
            // Update state lokal
            schedulesState = schedulesState.filter(s => s.id !== id);
            renderTable();
            showAlert('Jadwal berhasil dihapus.', 'success');
        } catch (error) {
            console.error("Gagal menghapus:", error);
            showAlert('Gagal menghapus jadwal dari database.', 'error');
        }
    }
};

// --- EVENT LISTENERS ---
formJadwal.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
        showAlert('Sesi habis. Silakan muat ulang halaman dan login kembali.', 'error');
        return;
    }

    const newSchedule = {
        teacherId: auth.currentUser.uid,
        teacherName: auth.currentUser.displayName,
        day: document.getElementById('input-hari').value,
        startTime: document.getElementById('input-mulai').value,
        endTime: document.getElementById('input-selesai').value,
        rombel: document.getElementById('input-rombel').value.trim(),
        subject: document.getElementById('input-mapel').value.trim(),
        createdAt: new Date()
    };

    // Validasi Durasi Waktu Logis (Mulai tidak boleh > Selesai)
    if (timeToMinutes(newSchedule.startTime) >= timeToMinutes(newSchedule.endTime)) {
        showAlert('Gagal: Jam mulai harus lebih awal dari jam selesai.', 'error');
        return;
    }

    // Jalankan Validasi Anti-Bentrok
    const validation = validateSchedule(newSchedule);
    
    if (!validation.valid) {
        showAlert(validation.message, 'error');
        return;
    }

    // Jika aman, push ke Firebase Firestore
    try {
        const docRef = await addDoc(collection(db, "schedules"), newSchedule);
        
        // Push ke state lokal & render ualng tanpa reload halaman
        newSchedule.id = docRef.id;
        schedulesState.push(newSchedule);
        renderTable();
        
        showAlert('Jadwal berhasil disimpan! Sinkronisasi ke Modul Akademik aktif.', 'success');
        formJadwal.reset();
    } catch (error) {
        console.error("Error adding document: ", error);
        showAlert('Terjadi kesalahan jaringan saat menyimpan jadwal.', 'error');
    }
});

// Load awal
auth.onAuthStateChanged((user) => {
    if (user) fetchSchedules();
});