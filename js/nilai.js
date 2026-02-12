// ============================================
// NILAI/PENILAIAN MODULE
// Admin PAI Super App
// ============================================

// === STATE ===
let classes = [];
let students = [];
let penilaianList = [];
let currentNilai = [];
let currentPenilaianId = null;
let currentKKTP = 75;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeNilaiPage();
});

// === INITIALIZE PAGE ===
async function initializeNilaiPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Set default date
            document.getElementById('penilaianTanggal').value = new Date().toISOString().split('T')[0];
            
            await loadClasses();
            populateClassDropdowns();
            await loadPenilaianList();
            updateSidebarInfo();
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

// === POPULATE CLASS DROPDOWNS ===
function populateClassDropdowns() {
    const options = classes.map(cls => 
        `<option value="${cls.id}">${cls.name}</option>`
    ).join('');
    
    const selects = ['inputKelas', 'rekapKelas', 'penilaianKelas'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">-- Pilih Kelas --</option>' + options;
        }
    });
}

// === LOAD PENILAIAN LIST ===
async function loadPenilaianList() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const snapshot = await collections.grades
            .where('teacherId', '==', userId)
            .where('type', '==', 'penilaian')
            .orderBy('createdAt', 'desc')
            .get();
        
        penilaianList = [];
        snapshot.forEach(doc => {
            penilaianList.push({ id: doc.id, ...doc.data() });
        });
        
        renderPenilaianList();
        
    } catch (error) {
        console.error('Error loading penilaian:', error);
    }
}

// === RENDER PENILAIAN LIST ===
function renderPenilaianList() {
    const container = document.getElementById('penilaianList');
    
    if (penilaianList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <span class="text-5xl block mb-3">📋</span>
                <p class="font-medium">Belum ada penilaian</p>
                <button onclick="openPenilaianModal()" class="text-pai-green hover:underline mt-2">
                    + Buat Penilaian Baru
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = penilaianList.map(p => {
        const dateStr = p.tanggal ? new Date(p.tanggal).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }) : '-';
        
        const nilaiCount = p.nilaiCount || 0;
        
        return `
            <div class="bg-white border rounded-xl p-4 hover:shadow-md transition-all">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-pai-light rounded-xl flex items-center justify-center">
                            <span class="text-2xl">${getJenisIcon(p.jenis)}</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800">${p.nama}</h4>
                            <div class="flex flex-wrap gap-2 mt-1">
                                <span class="badge badge-info">${p.className}</span>
                                <span class="badge badge-success">${p.jenis}</span>
                                <span class="text-xs text-gray-500">${dateStr}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-center">
                            <div class="text-lg font-bold text-pai-green">${nilaiCount}</div>
                            <div class="text-xs text-gray-500">Nilai</div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="inputNilaiForPenilaian('${p.id}')" class="btn btn-primary text-sm py-1">
                                📝 Input
                            </button>
                            <button onclick="editPenilaian('${p.id}')" class="btn btn-outline text-sm py-1">
                                ✏️
                            </button>
                            <button onclick="deletePenilaian('${p.id}')" class="btn btn-outline text-sm py-1 text-red-500 border-red-500">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === GET JENIS ICON ===
function getJenisIcon(jenis) {
    const icons = {
        'Tugas': '📄',
        'Ulangan Harian': '📝',
        'PTS': '📊',
        'PAS': '📈',
        'Praktik': '🏃',
        'Hafalan': '📖',
        'Proyek': '🎨',
        'Portofolio': '📁'
    };
    return icons[jenis] || '📋';
}

// === TAB SWITCHING ===
function switchNilaiTab(tab) {
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(`tab${capitalize(tab)}`).classList.add('active');
    document.getElementById(`content${capitalize(tab)}`).classList.add('active');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// === PENILAIAN MODAL ===
function openPenilaianModal() {
    document.getElementById('penilaianModalTitle').textContent = 'Buat Penilaian Baru';
    document.getElementById('formPenilaian').reset();
    document.getElementById('penilaianId').value = '';
    document.getElementById('penilaianTanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('penilaianKKTP').value = 75;
    document.getElementById('penilaianModal').classList.add('active');
}

function closePenilaianModal() {
    document.getElementById('penilaianModal').classList.remove('active');
}

async function savePenilaian() {
    const penilaianId = document.getElementById('penilaianId').value;
    const nama = document.getElementById('penilaianNama').value.trim();
    const jenis = document.getElementById('penilaianJenis').value;
    const classId = document.getElementById('penilaianKelas').value;
    const tanggal = document.getElementById('penilaianTanggal').value;
    const KKTP = parseInt(document.getElementById('penilaianKKTP').value) || 75;
    const elemen = document.getElementById('penilaianElemen').value;
    const deskripsi = document.getElementById('penilaianDeskripsi').value.trim();
    
    if (!nama || !jenis || !classId) {
        showToast('Lengkapi data yang wajib!', 'error');
        return;
    }
    
    const selectedClass = classes.find(c => c.id === classId);
    
    const data = {
        type: 'penilaian',
        nama,
        jenis,
        classId,
        className: selectedClass?.name || '',
        tanggal,
        KKTP,
        elemen,
        deskripsi,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (penilaianId) {
            await collections.grades.doc(penilaianId).update(data);
            showToast('Penilaian berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            data.nilaiCount = 0;
            await collections.grades.add(data);
            showToast('Penilaian berhasil dibuat!', 'success');
        }
        
        closePenilaianModal();
        await loadPenilaianList();
        
    } catch (error) {
        console.error('Error saving penilaian:', error);
        showToast('Gagal menyimpan penilaian', 'error');
    }
}

function editPenilaian(id) {
    const penilaian = penilaianList.find(p => p.id === id);
    if (!penilaian) return;
    
    document.getElementById('penilaianModalTitle').textContent = 'Edit Penilaian';
    document.getElementById('penilaianId').value = penilaian.id;
    document.getElementById('penilaianNama').value = penilaian.nama;
    document.getElementById('penilaianJenis').value = penilaian.jenis;
    document.getElementById('penilaianKelas').value = penilaian.classId;
    document.getElementById('penilaianTanggal').value = penilaian.tanggal || '';
    document.getElementById('penilaianKKTP').value = penilaian.KKTP || 75;
    document.getElementById('penilaianElemen').value = penilaian.elemen || '';
    document.getElementById('penilaianDeskripsi').value = penilaian.deskripsi || '';
    
    document.getElementById('penilaianModal').classList.add('active');
}

async function deletePenilaian(id) {
    if (!confirm('Yakin ingin menghapus penilaian ini? Semua nilai terkait juga akan dihapus.')) return;
    
    try {
        await collections.grades.doc(id).delete();
        showToast('Penilaian berhasil dihapus!', 'success');
        await loadPenilaianList();
    } catch (error) {
        console.error('Error deleting penilaian:', error);
        showToast('Gagal menghapus penilaian', 'error');
    }
}

// === INPUT NILAI FOR SPECIFIC PENILAIAN ===
function inputNilaiForPenilaian(id) {
    const penilaian = penilaianList.find(p => p.id === id);
    if (!penilaian) return;
    
    // Switch to input tab
    switchNilaiTab('input');
    
    // Set dropdown values
    document.getElementById('inputKelas').value = penilaian.classId;
    
    // Load penilaian for this class
    loadPenilaianForKelas().then(() => {
        document.getElementById('inputPenilaian').value = id;
        loadNilaiInput();
    });
}

// === LOAD PENILAIAN FOR KELAS ===
async function loadPenilaianForKelas() {
    const classId = document.getElementById('inputKelas').value;
    const select = document.getElementById('inputPenilaian');
    
    if (!classId) {
        select.innerHTML = '<option value="">-- Pilih Penilaian --</option>';
        return;
    }
    
    const filtered = penilaianList.filter(p => p.classId === classId);
    
    select.innerHTML = '<option value="">-- Pilih Penilaian --</option>' + 
        filtered.map(p => `<option value="${p.id}">${p.nama} (${p.jenis})</option>`).join('');
}

// === LOAD NILAI INPUT ===
async function loadNilaiInput() {
    const classId = document.getElementById('inputKelas').value;
    const penilaianId = document.getElementById('inputPenilaian').value;
    
    if (!classId || !penilaianId) {
        document.getElementById('nilaiInputBody').innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-gray-500">
                    <span class="text-5xl block mb-3">📝</span>
                    <p class="font-medium">Pilih kelas dan penilaian untuk input nilai</p>
                </td>
            </tr>
        `;
        document.getElementById('nilaiActions').classList.add('hidden');
        return;
    }
    
    // Get penilaian info
    const penilaian = penilaianList.find(p => p.id === penilaianId);
    if (penilaian) {
        document.getElementById('inputJenis').value = penilaian.jenis;
        currentKKTP = penilaian.KKTP || 75;
        document.getElementById('KKTP').textContent = currentKKTP;
        document.getElementById('inputNilaiTitle').textContent = `📝 ${penilaian.nama}`;
    }
    
    currentPenilaianId = penilaianId;
    
    try {
        const userId = auth.currentUser?.uid;
        
        // Load students
        const studentsSnapshot = await collections.students
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .orderBy('name')
            .get();
        
        students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        
        // Load existing nilai
        const nilaiSnapshot = await collections.grades
            .where('teacherId', '==', userId)
            .where('penilaianId', '==', penilaianId)
            .where('type', '==', 'nilai')
            .get();
        
        const existingNilai = {};
        nilaiSnapshot.forEach(doc => {
            const data = doc.data();
            existingNilai[data.studentId] = { id: doc.id, ...data };
        });
        
        // Prepare current nilai
        currentNilai = students.map(student => ({
            docId: existingNilai[student.id]?.id || null,
            studentId: student.id,
            studentName: student.name,
            nis: student.nis,
            gender: student.gender,
            nilai: existingNilai[student.id]?.nilai ?? '',
            catatan: existingNilai[student.id]?.catatan || ''
        }));
        
        renderNilaiInput();
        document.getElementById('nilaiActions').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading nilai input:', error);
        showToast('Gagal memuat data', 'error');
    }
}

// === RENDER NILAI INPUT ===
function renderNilaiInput() {
    const tbody = document.getElementById('nilaiInputBody');
    
    if (currentNilai.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-gray-500">
                    <span class="text-5xl block mb-3">👨‍🎓</span>
                    <p class="font-medium">Tidak ada siswa di kelas ini</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = currentNilai.map((item, index) => {
        const nilaiNum = parseFloat(item.nilai);
        const isTuntas = !isNaN(nilaiNum) && nilaiNum >= currentKKTP;
        const statusBadge = item.nilai !== '' 
            ? (isTuntas 
                ? '<span class="badge badge-success">Tuntas</span>' 
                : '<span class="badge badge-danger">Belum Tuntas</span>')
            : '<span class="badge bg-gray-100 text-gray-500">-</span>';
        
        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.nis || '-'}</td>
                <td class="font-medium">${item.studentName}</td>
                <td class="text-center">
                    <span class="badge ${item.gender === 'L' ? 'badge-info' : 'badge-warning'}">${item.gender}</span>
                </td>
                <td class="text-center">
                    <input type="number" 
                        value="${item.nilai}"
                        onchange="updateNilai(${index}, this.value)"
                        oninput="updateNilai(${index}, this.value)"
                        min="0" max="100"
                        class="form-input text-center w-20 py-1 ${item.nilai !== '' ? (isTuntas ? 'border-green-500' : 'border-red-500') : ''}">
                </td>
                <td class="text-center">${statusBadge}</td>
                <td>
                                        <input type="text" 
                        value="${item.catatan || ''}"
                        onchange="updateCatatan(${index}, this.value)"
                        placeholder="Catatan..."
                        class="form-input text-sm py-1">
                </td>
            </tr>
        `;
    }).join('');
    
    updateNilaiStats();
}

// === UPDATE NILAI ===
function updateNilai(index, value) {
    const numValue = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value) || 0));
    currentNilai[index].nilai = numValue;
    renderNilaiInput();
}

// === UPDATE CATATAN ===
function updateCatatan(index, value) {
    currentNilai[index].catatan = value;
}

// === UPDATE NILAI STATS ===
function updateNilaiStats() {
    const nilaiValid = currentNilai.filter(n => n.nilai !== '' && !isNaN(parseFloat(n.nilai)));
    
    if (nilaiValid.length === 0) {
        document.getElementById('avgNilai').textContent = '-';
        document.getElementById('countTuntas').textContent = '-';
        document.getElementById('countBelum').textContent = '-';
        return;
    }
    
    const sum = nilaiValid.reduce((acc, n) => acc + parseFloat(n.nilai), 0);
    const avg = (sum / nilaiValid.length).toFixed(1);
    const tuntas = nilaiValid.filter(n => parseFloat(n.nilai) >= currentKKTP).length;
    const belum = nilaiValid.length - tuntas;
    
    document.getElementById('avgNilai').textContent = avg;
    document.getElementById('countTuntas').textContent = `${tuntas} siswa`;
    document.getElementById('countBelum').textContent = `${belum} siswa`;
}

// === SAVE NILAI ===
async function saveNilai() {
    if (!currentPenilaianId) {
        showToast('Pilih penilaian terlebih dahulu!', 'error');
        return;
    }
    
    const nilaiToSave = currentNilai.filter(n => n.nilai !== '');
    
    if (nilaiToSave.length === 0) {
        showToast('Tidak ada nilai untuk disimpan!', 'warning');
        return;
    }
    
    try {
        const userId = auth.currentUser.uid;
        const batch = db.batch();
        
        for (const item of nilaiToSave) {
            const data = {
                type: 'nilai',
                penilaianId: currentPenilaianId,
                studentId: item.studentId,
                studentName: item.studentName,
                nilai: parseFloat(item.nilai),
                catatan: item.catatan || '',
                teacherId: userId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (item.docId) {
                // Update existing
                const docRef = collections.grades.doc(item.docId);
                batch.update(docRef, data);
            } else {
                // Create new
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                const docRef = collections.grades.doc();
                batch.set(docRef, data);
            }
        }
        
        // Update nilai count in penilaian
        const penilaianRef = collections.grades.doc(currentPenilaianId);
        batch.update(penilaianRef, { 
            nilaiCount: nilaiToSave.length,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        
        showToast(`${nilaiToSave.length} nilai berhasil disimpan!`, 'success');
        
        // Reload data
        await loadPenilaianList();
        await loadNilaiInput();
        
    } catch (error) {
        console.error('Error saving nilai:', error);
        showToast('Gagal menyimpan nilai', 'error');
    }
}

// === LOAD REKAP NILAI ===
async function loadRekapNilai() {
    const classId = document.getElementById('rekapKelas').value;
    const semester = document.getElementById('rekapSemester').value;
    
    if (!classId) {
        document.getElementById('rekapNilaiContent').innerHTML = 
            '<p class="text-gray-500 text-center py-8">Pilih kelas untuk melihat rekap nilai</p>';
        return;
    }
    
    try {
        const userId = auth.currentUser?.uid;
        
        // Load students
        const studentsSnapshot = await collections.students
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .orderBy('name')
            .get();
        
        const studentsList = [];
        studentsSnapshot.forEach(doc => {
            studentsList.push({ id: doc.id, ...doc.data() });
        });
        
        if (studentsList.length === 0) {
            document.getElementById('rekapNilaiContent').innerHTML = 
                '<p class="text-gray-500 text-center py-8">Tidak ada siswa di kelas ini</p>';
            return;
        }
        
        // Load penilaian for this class
        const penilaianSnapshot = await collections.grades
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .where('type', '==', 'penilaian')
            .get();
        
        const penilaianItems = [];
        penilaianSnapshot.forEach(doc => {
            penilaianItems.push({ id: doc.id, ...doc.data() });
        });
        
        if (penilaianItems.length === 0) {
            document.getElementById('rekapNilaiContent').innerHTML = 
                '<p class="text-gray-500 text-center py-8">Belum ada penilaian untuk kelas ini</p>';
            return;
        }
        
        // Load all nilai
        const nilaiSnapshot = await collections.grades
            .where('teacherId', '==', userId)
            .where('type', '==', 'nilai')
            .get();
        
        const nilaiMap = {};
        nilaiSnapshot.forEach(doc => {
            const data = doc.data();
            if (!nilaiMap[data.studentId]) {
                nilaiMap[data.studentId] = {};
            }
            nilaiMap[data.studentId][data.penilaianId] = data.nilai;
        });
        
        // Generate table
        let html = `
            <table class="data-table text-sm">
                <thead>
                    <tr>
                        <th class="sticky left-0 bg-pai-green z-10">No</th>
                        <th class="sticky left-10 bg-pai-green z-10 min-w-[150px]">Nama Siswa</th>
                        ${penilaianItems.map(p => `
                            <th class="text-center min-w-[80px]" title="${p.nama}">
                                ${p.jenis.substring(0, 3)}<br>
                                <span class="text-xs font-normal">${p.nama.substring(0, 10)}...</span>
                            </th>
                        `).join('')}
                        <th class="text-center bg-green-700 min-w-[60px]">Rata-rata</th>
                        <th class="text-center bg-blue-700 min-w-[60px]">Predikat</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        studentsList.forEach((student, index) => {
            const studentNilai = nilaiMap[student.id] || {};
            const nilaiArray = [];
            
            let nilaiCells = penilaianItems.map(p => {
                const nilai = studentNilai[p.id];
                if (nilai !== undefined) {
                    nilaiArray.push(nilai);
                    const KKTP = p.KKTP || 75;
                    const colorClass = nilai >= KKTP ? 'text-green-600' : 'text-red-600';
                    return `<td class="text-center ${colorClass} font-medium">${nilai}</td>`;
                }
                return '<td class="text-center text-gray-400">-</td>';
            }).join('');
            
            // Calculate average
            let rata = '-';
            let predikat = '-';
            if (nilaiArray.length > 0) {
                const avg = nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length;
                rata = avg.toFixed(1);
                predikat = getPredikat(avg);
            }
            
            html += `
                <tr>
                    <td class="sticky left-0 bg-white text-center">${index + 1}</td>
                    <td class="sticky left-10 bg-white font-medium">${student.name}</td>
                    ${nilaiCells}
                    <td class="text-center font-bold">${rata}</td>
                    <td class="text-center">
                        <span class="badge ${getPredikatBadge(predikat)}">${predikat}</span>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        
        document.getElementById('rekapNilaiContent').innerHTML = html;
        
    } catch (error) {
        console.error('Error loading rekap:', error);
        showToast('Gagal memuat rekap nilai', 'error');
    }
}

// === GET PREDIKAT ===
function getPredikat(nilai) {
    if (nilai >= 90) return 'A';
    if (nilai >= 80) return 'B';
    if (nilai >= 70) return 'C';
    if (nilai >= 60) return 'D';
    return 'E';
}

function getPredikatBadge(predikat) {
    const badges = {
        'A': 'badge-success',
        'B': 'badge-info',
        'C': 'badge-warning',
        'D': 'bg-orange-100 text-orange-700',
        'E': 'badge-danger'
    };
    return badges[predikat] || 'bg-gray-100 text-gray-600';
}

// === PRINT REKAP ===
function printRekap() {
    window.print();
}

// === EXPORT NILAI ===
function exportNilai() {
    const classId = document.getElementById('rekapKelas')?.value || document.getElementById('inputKelas')?.value;
    
    if (!classId) {
        showToast('Pilih kelas terlebih dahulu!', 'warning');
        return;
    }
    
    // Try to export from visible table
    const table = document.querySelector('#rekapNilaiContent table') || document.getElementById('nilaiInputTable');
    
    if (!table) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach(col => {
            let text = col.innerText.replace(/"/g, '""').replace(/\n/g, ' ');
            rowData.push('"' + text + '"');
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `nilai_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('File berhasil diunduh!', 'success');
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}


console.log('✅ Nilai module initialized');
