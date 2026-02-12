// ============================================
// ABSENSI MODULE
// Admin PAI Super App
// Terintegrasi dengan Jurnal Pembelajaran
// ============================================

// === STATE ===
let classes = [];
let students = [];
let currentAbsensi = [];
let savedAbsensiId = null;
let lastSavedAbsensi = null;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeAbsensiPage();
});

// === INITIALIZE PAGE ===
async function initializeAbsensiPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Set tanggal hari ini
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('filterTanggal').value = today;
            
            // Set bulan ini untuk rekap
            const thisMonth = today.substring(0, 7);
            document.getElementById('rekapBulan').value = thisMonth;
            
            await loadClasses();
            populateClassDropdowns();
            loadAbsensiHistory();
            updateSidebarInfo();
            
            // Check if coming from schedule with class parameter
            const urlParams = new URLSearchParams(window.location.search);
            const classId = urlParams.get('class');
            if (classId) {
                document.getElementById('filterKelas').value = classId;
                loadStudentsForAbsensi();
            }
        }
    });
}

// === UPDATE SIDEBAR INFO ===
async function updateSidebarInfo() {
    const userData = await getCurrentUserData();
    if (userData) {
        const name = userData.displayName || 'Guru PAI';
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = userData.email;
        document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
    }
}

// === LOAD CLASSES ===
async function loadClasses() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const snapshot = await collections.classes
            .where('teacherId', '==', userId)
            .orderBy('level')
            .get();
        
        classes = [];
        snapshot.forEach(doc => {
            classes.push({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// === POPULATE DROPDOWNS ===
function populateClassDropdowns() {
    const options = classes.map(cls => 
        `<option value="${cls.id}">${cls.name}</option>`
    ).join('');
    
    const filterKelas = document.getElementById('filterKelas');
    const rekapKelas = document.getElementById('rekapKelas');
    
    if (filterKelas) {
        filterKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>' + options;
    }
    if (rekapKelas) {
        rekapKelas.innerHTML = '<option value="">Semua Kelas</option>' + options;
    }
}

// === LOAD STUDENTS FOR ABSENSI ===
async function loadStudentsForAbsensi() {
    const classId = document.getElementById('filterKelas').value;
    
    if (!classId) {
        document.getElementById('absensiBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12 text-gray-500">
                    <span class="text-5xl block mb-3">📋</span>
                    <p class="font-medium">Pilih kelas dan tanggal untuk memulai absensi</p>
                </td>
            </tr>
        `;
        document.getElementById('classInfo').classList.add('hidden');
        document.getElementById('absensiActions').classList.add('hidden');
        return;
    }
    
    try {
        const userId = auth.currentUser?.uid;
        
        const snapshot = await collections.students
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .orderBy('name')
            .get();
        
        students = [];
        snapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        
        // Initialize current absensi data
        currentAbsensi = students.map(student => ({
            studentId: student.id,
            studentName: student.name,
            nis: student.nis,
            gender: student.gender,
            status: 'H', // Default hadir
            keterangan: ''
        }));
        
        // Load existing absensi if any
        await loadAbsensiData();
        
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Gagal memuat data siswa', 'error');
    }
}

// === LOAD ABSENSI DATA ===
async function loadAbsensiData() {
    const classId = document.getElementById('filterKelas').value;
    const tanggal = document.getElementById('filterTanggal').value;
    const jam = document.getElementById('filterJam').value;
    
    if (!classId || !tanggal) return;
    
    try {
        const userId = auth.currentUser?.uid;
        
        // Check if absensi already exists for this date/class/jam
        const snapshot = await collections.attendance
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .where('date', '==', tanggal)
            .where('jam', '==', jam)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            // Load existing data
            const doc = snapshot.docs[0];
            savedAbsensiId = doc.id;
            const data = doc.data();
            
            // Update current absensi with saved data
            if (data.records) {
                currentAbsensi = currentAbsensi.map(item => {
                    const saved = data.records.find(r => r.studentId === item.studentId);
                    return saved ? { ...item, ...saved } : item;
                });
            }
            
            showToast('Data absensi sebelumnya ditemukan', 'info');
        } else {
            savedAbsensiId = null;
            // Reset to default (Hadir)
            currentAbsensi = currentAbsensi.map(item => ({
                ...item,
                status: 'H',
                keterangan: ''
            }));
        }
        
        renderAbsensiTable();
        updateCounters();
        
        document.getElementById('classInfo').classList.remove('hidden');
        document.getElementById('absensiActions').classList.remove('hidden');
        
        // Update title
        const selectedClass = classes.find(c => c.id === classId);
        const dateObj = new Date(tanggal);
        const formattedDate = dateObj.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        document.getElementById('absensiTitle').textContent = 
            `✅ Absensi ${selectedClass?.name || ''} - ${formattedDate}`;
        
    } catch (error) {
        console.error('Error loading absensi:', error);
    }
}

// === RENDER ABSENSI TABLE ===
function renderAbsensiTable() {
    const tbody = document.getElementById('absensiBody');
    
    if (currentAbsensi.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-12 text-gray-500">
                    <span class="text-5xl block mb-3">👨‍🎓</span>
                    <p class="font-medium">Tidak ada siswa di kelas ini</p>
                    <a href="jadwal.html" class="text-pai-green hover:underline">Tambah siswa terlebih dahulu</a>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = currentAbsensi.map((item, index) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.nis || '-'}</td>
            <td class="font-medium">${item.studentName}</td>
            <td class="text-center">
                <span class="badge ${item.gender === 'L' ? 'badge-info' : 'badge-warning'}">${item.gender}</span>
            </td>
            <td>
                <div class="flex justify-center gap-2">
                    <button onclick="setStatus(${index}, 'H')" 
                        class="attendance-status ${item.status === 'H' ? 'hadir' : 'bg-gray-100'}" title="Hadir">
                        H
                    </button>
                    <button onclick="setStatus(${index}, 'I')" 
                        class="attendance-status ${item.status === 'I' ? 'izin' : 'bg-gray-100'}" title="Izin">
                        I
                    </button>
                    <button onclick="setStatus(${index}, 'S')" 
                        class="attendance-status ${item.status === 'S' ? 'sakit' : 'bg-gray-100'}" title="Sakit">
                        S
                    </button>
                    <button onclick="setStatus(${index}, 'A')" 
                        class="attendance-status ${item.status === 'A' ? 'alpha' : 'bg-gray-100'}" title="Alpha">
                        A
                    </button>
                </div>
            </td>
            <td>
                <input type="text" 
                    value="${item.keterangan || ''}"
                    onchange="setKeterangan(${index}, this.value)"
                    placeholder="Keterangan..."
                    class="form-input text-sm py-1">
            </td>
        </tr>
    `).join('');
}

// === SET STATUS ===
function setStatus(index, status) {
    currentAbsensi[index].status = status;
    renderAbsensiTable();
    updateCounters();
}

// === SET KETERANGAN ===
function setKeterangan(index, value) {
    currentAbsensi[index].keterangan = value;
}

// === SET ALL STATUS ===
function setAllStatus(status) {
    currentAbsensi = currentAbsensi.map(item => ({
        ...item,
        status: status
    }));
    renderAbsensiTable();
    updateCounters();
    showToast(`Semua siswa ditandai ${getStatusLabel(status)}`, 'success');
}

// === GET STATUS LABEL ===
function getStatusLabel(status) {
    const labels = { H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpha' };
    return labels[status] || status;
}

// === UPDATE COUNTERS ===
function updateCounters() {
    const counts = { H: 0, I: 0, S: 0, A: 0 };
    
    currentAbsensi.forEach(item => {
        if (counts.hasOwnProperty(item.status)) {
            counts[item.status]++;
        }
    });
    
    document.getElementById('countHadir').textContent = counts.H;
    document.getElementById('countIzin').textContent = counts.I;
    document.getElementById('countSakit').textContent = counts.S;
    document.getElementById('countAlpha').textContent = counts.A;
}

// === RESET ABSENSI ===
function resetAbsensi() {
    if (!confirm('Reset semua status ke Hadir?')) return;
    
    currentAbsensi = currentAbsensi.map(item => ({
        ...item,
        status: 'H',
        keterangan: ''
    }));
    
    renderAbsensiTable();
    updateCounters();
    showToast('Absensi direset', 'info');
}

// === SAVE ABSENSI ===
async function saveAbsensi() {
    const classId = document.getElementById('filterKelas').value;
    const tanggal = document.getElementById('filterTanggal').value;
    const jam = document.getElementById('filterJam').value;
    
    if (!classId || !tanggal) {
        showToast('Pilih kelas dan tanggal!', 'error');
        return;
    }
    
    if (currentAbsensi.length === 0) {
        showToast('Tidak ada data siswa!', 'error');
        return;
    }
    
    const selectedClass = classes.find(c => c.id === classId);
    
    const data = {
        classId,
        className: selectedClass?.name || '',
        date: tanggal,
        jam,
        records: currentAbsensi,
        summary: {
            total: currentAbsensi.length,
            hadir: currentAbsensi.filter(r => r.status === 'H').length,
            izin: currentAbsensi.filter(r => r.status === 'I').length,
            sakit: currentAbsensi.filter(r => r.status === 'S').length,
            alpha: currentAbsensi.filter(r => r.status === 'A').length
        },
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (savedAbsensiId) {
            await collections.attendance.doc(savedAbsensiId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await collections.attendance.add(data);
            savedAbsensiId = docRef.id;
        }
        
        lastSavedAbsensi = {
            id: savedAbsensiId,
            ...data
        };
        
        showToast('Absensi berhasil disimpan!', 'success');
        loadAbsensiHistory();
        
        // Check if should create journal
        const createJurnal = document.getElementById('createJurnal').checked;
        if (createJurnal) {
            showJurnalPrompt();
        }
        
    } catch (error) {
        console.error('Error saving absensi:', error);
        showToast('Gagal menyimpan absensi', 'error');
    }
}

// === SHOW JURNAL PROMPT ===
function showJurnalPrompt() {
    if (!lastSavedAbsensi) return;
    
    const dateObj = new Date(lastSavedAbsensi.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    
    document.getElementById('promptKelas').textContent = lastSavedAbsensi.className;
    document.getElementById('promptTanggal').textContent = formattedDate;
    document.getElementById('promptKehadiran').textContent = 
        `${lastSavedAbsensi.summary.hadir}/${lastSavedAbsensi.summary.total} hadir`;
    
    document.getElementById('jurnalPromptModal').classList.add('active');
}

function closeJurnalPromptModal() {
    document.getElementById('jurnalPromptModal').classList.remove('active');
}

function goToJurnal() {
    if (!lastSavedAbsensi) return;
    
    // Redirect to jurnal with pre-filled data
    const params = new URLSearchParams({
        absensiId: lastSavedAbsensi.id,
        classId: lastSavedAbsensi.classId,
        date: lastSavedAbsensi.date,
        action: 'new'
    });
    
    window.location.href = `jurnal.html?${params.toString()}`;
}

// === LOAD ABSENSI HISTORY ===
async function loadAbsensiHistory() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const snapshot = await collections.attendance
            .where('teacherId', '==', userId)
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        const container = document.getElementById('absensiHistory');
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada riwayat absensi</p>';
            return;
        }
        
        container.innerHTML = snapshot.docs.map(doc => {
            const data = doc.data();
            const dateObj = new Date(data.date);
            const formattedDate = dateObj.toLocaleDateString('id-ID', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
            });
            
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-pai-light rounded-lg flex items-center justify-center text-pai-green font-bold text-sm">
                            ${dateObj.getDate()}
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${data.className}</div>
                            <div class="text-sm text-gray-500">${formattedDate} • Jam ke-${data.jam}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex gap-2 text-sm">
                            <span class="text-green-600">H:${data.summary?.hadir || 0}</span>
                            <span class="text-blue-600">I:${data.summary?.izin || 0}</span>
                            <span class="text-yellow-600">S:${data.summary?.sakit || 0}</span>
                            <span class="text-red-600">A:${data.summary?.alpha || 0}</span>
                        </div>
                        <button onclick="viewAbsensi('${doc.id}')" class="text-pai-green hover:underline text-sm">
                            Lihat
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// === VIEW ABSENSI ===
async function viewAbsensi(id) {
    try {
        const doc = await collections.attendance.doc(id).get();
        if (!doc.exists) {
            showToast('Data tidak ditemukan', 'error');
            return;
        }
        
        const data = doc.data();
        
        // Set form values
        document.getElementById('filterKelas').value = data.classId;
        document.getElementById('filterTanggal').value = data.date;
        document.getElementById('filterJam').value = data.jam;
        
        // Load students first
        await loadStudentsForAbsensi();
        
    } catch (error) {
        console.error('Error viewing absensi:', error);
        showToast('Gagal memuat data', 'error');
    }
}

// === REKAP MODAL ===
function openRekapModal() {
    document.getElementById('rekapModal').classList.add('active');
    generateRekap();
}

function closeRekapModal() {
    document.getElementById('rekapModal').classList.remove('active');
}

async function generateRekap() {
    const classId = document.getElementById('rekapKelas').value;
    const bulan = document.getElementById('rekapBulan').value;
    
    if (!bulan) {
        document.getElementById('rekapContent').innerHTML = 
            '<p class="text-gray-500 text-center py-8">Pilih bulan untuk melihat rekap</p>';
        return;
    }
    
    try {
        const userId = auth.currentUser?.uid;
        
        // Parse month
        const [year, month] = bulan.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        
        let query = collections.attendance
            .where('teacherId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate);
        
        if (classId) {
            query = query.where('classId', '==', classId);
        }
        
        const snapshot = await query.orderBy('date').get();
        
        if (snapshot.empty) {
            document.getElementById('rekapContent').innerHTML = 
                '<p class="text-gray-500 text-center py-8">Tidak ada data absensi untuk periode ini</p>';
            return;
        }
        
        // Process data for recap
        const rekapData = {};
        const dates = new Set();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            dates.add(data.date);
            
            data.records.forEach(record => {
                if (!rekapData[record.studentId]) {
                    rekapData[record.studentId] = {
                        name: record.studentName,
                        nis: record.nis,
                        attendance: {},
                        total: { H: 0, I: 0, S: 0, A: 0 }
                    };
                }
                
                rekapData[record.studentId].attendance[data.date] = record.status;
                rekapData[record.studentId].total[record.status]++;
            });
        });
        
        const sortedDates = Array.from(dates).sort();
        
        // Generate table
        let html = `
            <table class="data-table text-sm">
                <thead>
                    <tr>
                        <th class="sticky left-0 bg-pai-green">No</th>
                        <th class="sticky left-10 bg-pai-green">Nama</th>
                        ${sortedDates.map(d => {
                            const dateObj = new Date(d);
                            return `<th class="text-center">${dateObj.getDate()}</th>`;
                        }).join('')}
                        <th class="text-center bg-green-700">H</th>
                        <th class="text-center bg-blue-700">I</th>
                        <th class="text-center bg-yellow-600">S</th>
                        <th class="text-center bg-red-700">A</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let index = 1;
        for (const studentId in rekapData) {
            const student = rekapData[studentId];
            html += `
                <tr>
                    <td class="sticky left-0 bg-white">${index++}</td>
                    <td class="sticky left-10 bg-white font-medium">${student.name}</td>
                    ${sortedDates.map(d => {
                        const status = student.attendance[d] || '-';
                        const colorClass = {
                            'H': 'text-green-600',
                            'I': 'text-blue-600',
                            'S': 'text-yellow-600',
                            'A': 'text-red-600'
                        }[status] || 'text-gray-400';
                        return `<td class="text-center ${colorClass}">${status}</td>`;
                    }).join('')}
                    <td class="text-center font-bold text-green-600">${student.total.H}</td>
                    <td class="text-center font-bold text-blue-600">${student.total.I}</td>
                    <td class="text-center font-bold text-yellow-600">${student.total.S}</td>
                    <td class="text-center font-bold text-red-600">${student.total.A}</td>
                </tr>
            `;
        }
        
        html += '</tbody></table>';
        
        document.getElementById('rekapContent').innerHTML = html;
        
    } catch (error) {
        console.error('Error generating rekap:', error);
        showToast('Gagal membuat rekap', 'error');
    }
}

function printRekap() {
    window.print();
}

function exportRekap() {
    showToast('Fitur export akan segera tersedia', 'info');
}

// === EXPORT ABSENSI ===
function exportAbsensi() {
    const table = document.getElementById('absensiTable');
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach((col, index) => {
            // Skip action columns
            if (index < 5) {
                let text = col.innerText.replace(/"/g, '""');
                // For status column, get the active button
                if (index === 4) {
                    const activeBtn = col.querySelector('.hadir, .izin, .sakit, .alpha');
                    text = activeBtn ? activeBtn.innerText : '-';
                }
                rowData.push('"' + text + '"');
            }
        });
        if (rowData.length > 0) {
            csv.push(rowData.join(','));
        }
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const tanggal = document.getElementById('filterTanggal').value;
    
    link.href = URL.createObjectURL(blob);
    link.download = `absensi_${tanggal}.csv`;
    link.click();
    
    showToast('File berhasil diunduh!', 'success');
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

console.log('✅ Absensi module initialized');