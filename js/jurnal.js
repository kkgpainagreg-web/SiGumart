// ============================================
// JURNAL PEMBELAJARAN MODULE
// Admin PAI Super App
// Terintegrasi dengan Absensi
// ============================================

// === STATE ===
let classes = [];
let jurnalList = [];
let currentJurnalId = null;
let linkedAbsensi = null;
let viewMode = 'list';

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeJurnalPage();
});

// === INITIALIZE PAGE ===
async function initializeJurnalPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Set default month
            const today = new Date();
            const thisMonth = today.toISOString().substring(0, 7);
            document.getElementById('filterBulan').value = thisMonth;
            document.getElementById('jurnalTanggal').value = today.toISOString().split('T')[0];
            
            await loadClasses();
            populateClassDropdowns();
            await loadJurnalList();
            loadStatistics();
            updateSidebarInfo();
            
            // Check URL params (from absensi)
            handleUrlParams();
        }
    });
}

// === HANDLE URL PARAMS ===
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const absensiId = urlParams.get('absensiId');
    const classId = urlParams.get('classId');
    const date = urlParams.get('date');
    
    if (action === 'new') {
        openJurnalModal();
        
        if (classId) {
            document.getElementById('jurnalKelas').value = classId;
        }
        if (date) {
            document.getElementById('jurnalTanggal').value = date;
        }
        if (absensiId) {
            document.getElementById('jurnalAbsensiId').value = absensiId;
            loadAbsensiData(absensiId);
        }
        
        updateJurnalInfo();
    }
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
    const jurnalKelas = document.getElementById('jurnalKelas');
    
    if (filterKelas) {
        filterKelas.innerHTML = '<option value="">Semua Kelas</option>' + options;
    }
    if (jurnalKelas) {
        jurnalKelas.innerHTML = '<option value="">Pilih Kelas</option>' + options;
    }
}

// === LOAD JURNAL LIST ===
async function loadJurnalList() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const classId = document.getElementById('filterKelas').value;
        const bulan = document.getElementById('filterBulan').value;
        const elemen = document.getElementById('filterElemen').value;
        
        let query = collections.journals.where('teacherId', '==', userId);
        
        if (classId) {
            query = query.where('classId', '==', classId);
        }
        
        if (bulan) {
            const [year, month] = bulan.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-31`;
            query = query.where('date', '>=', startDate).where('date', '<=', endDate);
        }
        
        query = query.orderBy('date', 'desc');
        
        const snapshot = await query.limit(50).get();
        
        jurnalList = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter by elemen if specified
            if (!elemen || data.elemen === elemen) {
                jurnalList.push({ id: doc.id, ...data });
            }
        });
        
        renderJurnalList();
        
    } catch (error) {
        console.error('Error loading journals:', error);
        showToast('Gagal memuat data jurnal', 'error');
    }
}

// === RENDER JURNAL LIST ===
function renderJurnalList() {
    const container = document.getElementById('jurnalList');
    
    if (jurnalList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <span class="text-5xl block mb-3">📖</span>
                <p class="font-medium">Belum ada jurnal pembelajaran</p>
                <button onclick="openJurnalModal()" class="text-pai-green hover:underline mt-2">
                    + Buat Jurnal Baru
                </button>
            </div>
        `;
        return;
    }
    
    if (viewMode === 'grid') {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        container.innerHTML = jurnalList.map(jurnal => renderJurnalCard(jurnal)).join('');
    } else {
        container.className = 'space-y-4';
        container.innerHTML = jurnalList.map(jurnal => renderJurnalRow(jurnal)).join('');
    }
}

// === RENDER JURNAL CARD ===
function renderJurnalCard(jurnal) {
    const dateObj = new Date(jurnal.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
    });
    
    const elemenLabel = getElemenLabel(jurnal.elemen);
    
    return `
        <div onclick="viewJurnal('${jurnal.id}')" 
             class="bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
            <div class="flex items-start justify-between mb-3">
                <span class="badge badge-info">${jurnal.className}</span>
                <span class="text-xs text-gray-500">${formattedDate}</span>
            </div>
            <h4 class="font-bold text-gray-800 mb-2 line-clamp-2">${jurnal.topik}</h4>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">${jurnal.kegiatan || '-'}</p>
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">${elemenLabel}</span>
                <div class="flex gap-2 text-xs">
                    <span class="text-green-600">H:${jurnal.attendance?.hadir || 0}</span>
                    <span class="text-red-600">A:${jurnal.attendance?.alpha || 0}</span>
                </div>
            </div>
        </div>
    `;
}

// === RENDER JURNAL ROW ===
function renderJurnalRow(jurnal) {
    const dateObj = new Date(jurnal.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    const elemenLabel = getElemenLabel(jurnal.elemen);
    
    return `
        <div onclick="viewJurnal('${jurnal.id}')" 
             class="bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
                <div class="flex-shrink-0">
                    <div class="w-16 h-16 bg-pai-light rounded-xl flex flex-col items-center justify-center">
                        <span class="text-2xl font-bold text-pai-green">${dateObj.getDate()}</span>
                        <span class="text-xs text-gray-600">${dateObj.toLocaleDateString('id-ID', { month: 'short' })}</span>
                    </div>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="badge badge-info">${jurnal.className}</span>
                        <span class="badge badge-success">${elemenLabel}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 mb-1">${jurnal.topik}</h4>
                    <p class="text-sm text-gray-600 line-clamp-1">${jurnal.kegiatan || '-'}</p>
                </div>
                <div class="flex items-center gap-4 text-sm">
                    <div class="text-center">
                        <div class="font-bold text-green-600">${jurnal.attendance?.hadir || 0}</div>
                        <div class="text-xs text-gray-500">Hadir</div>
                    </div>
                    <div class="text-center">
                        <div class="font-bold text-red-600">${jurnal.attendance?.alpha || 0}</div>
                        <div class="text-xs text-gray-500">Alpha</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// === GET ELEMEN LABEL ===
function getElemenLabel(elemen) {
    const labels = {
        'alquranHadis': "Al-Qur'an & Hadis",
        'akidah': 'Akidah',
        'akhlak': 'Akhlak',
        'fikih': 'Fikih',
        'sejarah': 'Sejarah Islam'
    };
    return labels[elemen] || elemen || '-';
}

// === TOGGLE VIEW ===
function toggleView(mode) {
    viewMode = mode;
    
    document.getElementById('btnGrid').classList.toggle('bg-gray-200', mode === 'grid');
    document.getElementById('btnList').classList.toggle('bg-gray-200', mode === 'list');
    
    renderJurnalList();
}

// === LOAD STATISTICS ===
async function loadStatistics() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const today = new Date();
        const thisMonth = today.toISOString().substring(0, 7);
        const [year, month] = thisMonth.split('-');
        const startOfMonth = `${year}-${month}-01`;
        
        // Get start of week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
        
        // Total jurnal
        const totalSnapshot = await collections.journals
            .where('teacherId', '==', userId)
            .get();
        document.getElementById('statTotal').textContent = totalSnapshot.size;
        
        // Bulan ini
        const monthSnapshot = await collections.journals
            .where('teacherId', '==', userId)
            .where('date', '>=', startOfMonth)
            .get();
        document.getElementById('statBulanIni').textContent = monthSnapshot.size;
        
        // Minggu ini
        const weekSnapshot = await collections.journals
            .where('teacherId', '==', userId)
            .where('date', '>=', startOfWeekStr)
            .get();
        document.getElementById('statMingguIni').textContent = weekSnapshot.size;
        
        // Kelas aktif
        document.getElementById('statKelas').textContent = classes.length;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// === MODAL FUNCTIONS ===
function openJurnalModal() {
    document.getElementById('jurnalModalTitle').textContent = 'Buat Jurnal Pembelajaran';
    document.getElementById('formJurnal').reset();
    document.getElementById('jurnalId').value = '';
    document.getElementById('jurnalAbsensiId').value = '';
    
    // Reset attendance display
    document.getElementById('jurnalHadir').textContent = '-';
    document.getElementById('jurnalIzin').textContent = '-';
    document.getElementById('jurnalSakit').textContent = '-';
    document.getElementById('jurnalAlpha').textContent = '-';
    
    // Set default date
    document.getElementById('jurnalTanggal').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('jurnalModal').classList.add('active');
}

function closeJurnalModal() {
    document.getElementById('jurnalModal').classList.remove('active');
}

// === UPDATE JURNAL INFO ===
async function updateJurnalInfo() {
    const classId = document.getElementById('jurnalKelas').value;
    const tanggal = document.getElementById('jurnalTanggal').value;
    
    if (!classId || !tanggal) return;
    
    // Try to find matching absensi
    try {
        const userId = auth.currentUser?.uid;
        
        const snapshot = await collections.attendance
            .where('teacherId', '==', userId)
            .where('classId', '==', classId)
            .where('date', '==', tanggal)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const absensiData = snapshot.docs[0].data();
            linkedAbsensi = { id: snapshot.docs[0].id, ...absensiData };
            
            document.getElementById('jurnalAbsensiId').value = snapshot.docs[0].id;
            document.getElementById('jurnalHadir').textContent = absensiData.summary?.hadir || 0;
            document.getElementById('jurnalIzin').textContent = absensiData.summary?.izin || 0;
            document.getElementById('jurnalSakit').textContent = absensiData.summary?.sakit || 0;
            document.getElementById('jurnalAlpha').textContent = absensiData.summary?.alpha || 0;
        } else {
            linkedAbsensi = null;
            document.getElementById('jurnalAbsensiId').value = '';
            document.getElementById('jurnalHadir').textContent = '-';
            document.getElementById('jurnalIzin').textContent = '-';
            document.getElementById('jurnalSakit').textContent = '-';
            document.getElementById('jurnalAlpha').textContent = '-';
        }
    } catch (error) {
        console.error('Error finding absensi:', error);
    }
}

// === LOAD ABSENSI DATA ===
async function loadAbsensiData(absensiId) {
    try {
        const doc = await collections.attendance.doc(absensiId).get();
        if (doc.exists) {
            const data = doc.data();
            linkedAbsensi = { id: doc.id, ...data };
            
            document.getElementById('jurnalHadir').textContent = data.summary?.hadir || 0;
            document.getElementById('jurnalIzin').textContent = data.summary?.izin || 0;
            document.getElementById('jurnalSakit').textContent = data.summary?.sakit || 0;
            document.getElementById('jurnalAlpha').textContent = data.summary?.alpha || 0;
        }
    } catch (error) {
        console.error('Error loading absensi:', error);
    }
}

// === LOAD CAPAIAN BASED ON ELEMEN ===
function loadCapaian() {
    const kelasId = document.getElementById('jurnalKelas').value;
    const elemen = document.getElementById('jurnalElemen').value;
    const capaianSelect = document.getElementById('jurnalCapaian');
    
    if (!kelasId || !elemen) {
        capaianSelect.innerHTML = '<option value="">Pilih capaian</option>';
        return;
    }
    
    // Get kelas level
    const selectedClass = classes.find(c => c.id === kelasId);
    if (!selectedClass) return;
    
    const fase = selectedClass.fase || getFaseByKelas(selectedClass.level);
    
    // Get CP from curriculum data
    const cpData = getElemenCP(fase, elemen);
    
    if (cpData && cpData.capaian) {
        const options = cpData.capaian.map(cp => 
            `<option value="${cp.kode}">${cp.kode}: ${cp.teks.substring(0, 60)}...</option>`
        ).join('');
        
        capaianSelect.innerHTML = '<option value="">Pilih capaian</option>' + options;
    }
}

// === SAVE JURNAL ===
async function saveJurnal() {
    const jurnalId = document.getElementById('jurnalId').value;
    const classId = document.getElementById('jurnalKelas').value;
    const tanggal = document.getElementById('jurnalTanggal').value;
    const jam = document.getElementById('jurnalJam').value;
    const elemen = document.getElementById('jurnalElemen').value;
    const capaian = document.getElementById('jurnalCapaian').value;
    const topik = document.getElementById('jurnalTopik').value.trim();
    const tujuan = document.getElementById('jurnalTujuan').value.trim();
    const kegiatan = document.getElementById('jurnalKegiatan').value.trim();
    const media = document.getElementById('jurnalMedia').value.trim();
    const refleksi = document.getElementById('jurnalRefleksi').value.trim();
    const tindakLanjut = document.getElementById('jurnalTindakLanjut').value.trim();
    const absensiId = document.getElementById('jurnalAbsensiId').value;
    
    // Get selected methods
    const metodeSelect = document.getElementById('jurnalMetode');
    const metode = Array.from(metodeSelect.selectedOptions).map(opt => opt.value);
    
    if (!classId || !tanggal || !elemen || !topik || !kegiatan) {
        showToast('Lengkapi data yang wajib diisi!', 'error');
        return;
    }
    
    const selectedClass = classes.find(c => c.id === classId);
    
    const data = {
        classId,
        className: selectedClass?.name || '',
        fase: selectedClass?.fase || '',
        date: tanggal,
        jam,
        elemen,
        capaian,
        topik,
        tujuan,
        kegiatan,
        metode,
        media,
        refleksi,
        tindakLanjut,
        absensiId,
        attendance: linkedAbsensi?.summary || null,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (jurnalId) {
            await collections.journals.doc(jurnalId).update(data);
            showToast('Jurnal berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.journals.add(data);
            showToast('Jurnal berhasil disimpan!', 'success');
        }
        
        closeJurnalModal();
        await loadJurnalList();
        loadStatistics();
        
        // Clear URL params
        window.history.replaceState({}, document.title, 'jurnal.html');
        
    } catch (error) {
        console.error('Error saving jurnal:', error);
        showToast('Gagal menyimpan jurnal', 'error');
    }
}

// === VIEW JURNAL ===
async function viewJurnal(id) {
    const jurnal = jurnalList.find(j => j.id === id);
    if (!jurnal) return;
    
    currentJurnalId = id;
    
    const dateObj = new Date(jurnal.date);
    const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    const elemenLabel = getElemenLabel(jurnal.elemen);
    const metodeStr = jurnal.metode?.join(', ') || '-';
    
    document.getElementById('jurnalDetailContent').innerHTML = `
        <div class="space-y-6" id="jurnalPrintArea">
            <!-- Header -->
            <div class="text-center border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800">JURNAL PEMBELAJARAN</h2>
                <p class="text-gray-600">Pendidikan Agama Islam dan Budi Pekerti</p>
            </div>
            
            <!-- Info Dasar -->
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-500">Kelas:</span>
                    <span class="font-medium ml-2">${jurnal.className}</span>
                </div>
                <div>
                    <span class="text-gray-500">Tanggal:</span>
                    <span class="font-medium ml-2">${formattedDate}</span>
                </div>
                <div>
                    <span class="text-gray-500">Jam Pelajaran:</span>
                    <span class="font-medium ml-2">${jurnal.jam || '-'}</span>
                </div>
                <div>
                    <span class="text-gray-500">Fase:</span>
                    <span class="font-medium ml-2">Fase ${jurnal.fase || '-'}</span>
                </div>
            </div>
            
            <!-- Materi -->
            <div class="bg-blue-50 rounded-lg p-4">
                <h4 class="font-semibold text-blue-800 mb-2">📚 Materi Pembelajaran</h4>
                <div class="space-y-2 text-sm">
                    <div>
                        <span class="text-gray-600">Elemen:</span>
                        <span class="font-medium ml-2">${elemenLabel}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Capaian Pembelajaran:</span>
                        <span class="font-medium ml-2">${jurnal.capaian || '-'}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Topik:</span>
                        <span class="font-medium ml-2">${jurnal.topik}</span>
                    </div>
                </div>
            </div>
            
            <!-- Tujuan -->
            ${jurnal.tujuan ? `
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">🎯 Tujuan Pembelajaran</h4>
                    <p class="text-gray-700">${jurnal.tujuan}</p>
                </div>
            ` : ''}
            
            <!-- Kegiatan -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-2">📝 Kegiatan Pembelajaran</h4>
                <p class="text-gray-700 whitespace-pre-line">${jurnal.kegiatan}</p>
            </div>
            
            <!-- Metode & Media -->
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">🔧 Metode</h4>
                    <p class="text-gray-700">${metodeStr}</p>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">📺 Media/Sumber</h4>
                    <p class="text-gray-700">${jurnal.media || '-'}</p>
                </div>
            </div>
            
            <!-- Kehadiran -->
            <div class="bg-yellow-50 rounded-lg p-4">
                <h4 class="font-semibold text-yellow-800 mb-3">✅ Data Kehadiran</h4>
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-green-600">${jurnal.attendance?.hadir || 0}</div>
                        <div class="text-sm text-gray-600">Hadir</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-600">${jurnal.attendance?.izin || 0}</div>
                        <div class="text-sm text-gray-600">Izin</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-yellow-600">${jurnal.attendance?.sakit || 0}</div>
                        <div class="text-sm text-gray-600">Sakit</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-red-600">${jurnal.attendance?.alpha || 0}</div>
                        <div class="text-sm text-gray-600">Alpha</div>
                    </div>
                </div>
            </div>
            
            <!-- Refleksi -->
            ${jurnal.refleksi ? `
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">💭 Refleksi</h4>
                    <p class="text-gray-700">${jurnal.refleksi}</p>
                </div>
            ` : ''}
            
            <!-- Tindak Lanjut -->
            ${jurnal.tindakLanjut ? `
                <div>
                    <h4 class="font-semibold text-gray-800 mb-2">📌 Rencana Tindak Lanjut</h4>
                    <p class="text-gray-700">${jurnal.tindakLanjut}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('jurnalDetailModal').classList.add('active');
}

function closeJurnalDetailModal() {
    document.getElementById('jurnalDetailModal').classList.remove('active');
    currentJurnalId = null;
}

// === EDIT JURNAL ===
function editJurnal() {
    const jurnal = jurnalList.find(j => j.id === currentJurnalId);
    if (!jurnal) return;
    
    closeJurnalDetailModal();
    
    document.getElementById('jurnalModalTitle').textContent = 'Edit Jurnal Pembelajaran';
    document.getElementById('jurnalId').value = jurnal.id;
    document.getElementById('jurnalKelas').value = jurnal.classId;
    document.getElementById('jurnalTanggal').value = jurnal.date;
    document.getElementById('jurnalJam').value = jurnal.jam || '1-2';
    document.getElementById('jurnalElemen').value = jurnal.elemen;
    document.getElementById('jurnalTopik').value = jurnal.topik;
    document.getElementById('jurnalTujuan').value = jurnal.tujuan || '';
    document.getElementById('jurnalKegiatan').value = jurnal.kegiatan;
    document.getElementById('jurnalMedia').value = jurnal.media || '';
    document.getElementById('jurnalRefleksi').value = jurnal.refleksi || '';
    document.getElementById('jurnalTindakLanjut').value = jurnal.tindakLanjut || '';
    document.getElementById('jurnalAbsensiId').value = jurnal.absensiId || '';
    
    // Set attendance data
    if (jurnal.attendance) {
        document.getElementById('jurnalHadir').textContent = jurnal.attendance.hadir || 0;
        document.getElementById('jurnalIzin').textContent = jurnal.attendance.izin || 0;
        document.getElementById('jurnalSakit').textContent = jurnal.attendance.sakit || 0;
        document.getElementById('jurnalAlpha').textContent = jurnal.attendance.alpha || 0;
    }
    
    // Load capaian options
    loadCapaian();
    setTimeout(() => {
        document.getElementById('jurnalCapaian').value = jurnal.capaian || '';
    }, 100);
    
    // Set selected methods
    const metodeSelect = document.getElementById('jurnalMetode');
    if (jurnal.metode) {
        Array.from(metodeSelect.options).forEach(opt => {
            opt.selected = jurnal.metode.includes(opt.value);
        });
    }
    
    document.getElementById('jurnalModal').classList.add('active');
}

// === DELETE JURNAL ===
async function deleteJurnal() {
    if (!currentJurnalId) return;
    if (!confirm('Yakin ingin menghapus jurnal ini?')) return;
    
    try {
        await collections.journals.doc(currentJurnalId).delete();
        showToast('Jurnal berhasil dihapus!', 'success');
        
        closeJurnalDetailModal();
        await loadJurnalList();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting jurnal:', error);
        showToast('Gagal menghapus jurnal', 'error');
    }
}

// === PRINT JURNAL ===
function printJurnal() {
    window.print();
}

// === EXPORT JURNAL ===
function exportJurnal() {
    if (jurnalList.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    let csv = ['Tanggal,Kelas,Elemen,Topik,Kegiatan,Hadir,Izin,Sakit,Alpha'];
    
    jurnalList.forEach(j => {
        csv.push([
            j.date,
            `"${j.className}"`,
            `"${getElemenLabel(j.elemen)}"`,
            `"${j.topik}"`,
            `"${(j.kegiatan || '').replace(/"/g, '""')}"`,
            j.attendance?.hadir || 0,
            j.attendance?.izin || 0,
            j.attendance?.sakit || 0,
            j.attendance?.alpha || 0
        ].join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `jurnal_pembelajaran_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('File berhasil diunduh!', 'success');
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

console.log('✅ Jurnal module initialized');