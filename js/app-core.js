// js/app-core.js
// Main Application Logic for Admin Guru Super App

// Global State
let currentUser = null;
let userData = null;
let cpData = {};

// Month Names
const BULAN_GANJIL = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_GENAP = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Libur Nasional Baku
const LIBUR_BAKU = [
    { tanggal: "01-01", nama: "Tahun Baru Masehi" },
    { tanggal: "02-01", nama: "Tahun Baru Imlek" },
    { tanggal: "03-12", nama: "Hari Raya Nyepi" },
    { tanggal: "03-29", nama: "Wafat Isa Almasih" },
    { tanggal: "04-10", nama: "Idul Fitri" },
    { tanggal: "04-11", nama: "Idul Fitri" },
    { tanggal: "05-01", nama: "Hari Buruh" },
    { tanggal: "05-12", nama: "Hari Raya Waisak" },
    { tanggal: "05-29", nama: "Kenaikan Isa Almasih" },
    { tanggal: "06-01", nama: "Hari Lahir Pancasila" },
    { tanggal: "06-17", nama: "Idul Adha" },
    { tanggal: "07-07", nama: "Tahun Baru Hijriyah" },
    { tanggal: "08-17", nama: "Hari Kemerdekaan RI" },
    { tanggal: "09-15", nama: "Maulid Nabi Muhammad SAW" },
    { tanggal: "12-25", nama: "Hari Natal" }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Check Auth State
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            initializeUI();
            setupEventListeners();
            updateTahunAjarSelect();
        } else {
            window.location.href = 'index.html';
        }
    });
}

async function loadUserData() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            userData = doc.data();
            updateUserDisplay();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateUserDisplay() {
    document.getElementById('userName').textContent = userData?.nama || currentUser.displayName || 'Pengguna';
    
    const badge = document.getElementById('userBadge');
    if (userData?.subscription === 'premium') {
        badge.textContent = 'PREMIUM';
        badge.className = 'badge badge-premium';
        document.getElementById('btnUpgrade').classList.add('hidden');
    } else {
        badge.textContent = 'FREE';
        badge.className = 'badge badge-free';
    }
}

function initializeUI() {
    // Populate profil form
    if (userData) {
        document.getElementById('profilNama').value = userData.nama || '';
        document.getElementById('profilNip').value = userData.nip || '';
        document.getElementById('profilEmail').value = currentUser.email;
        document.getElementById('profilPhone').value = userData.phone || '';
        document.getElementById('profilSekolah').value = userData.sekolah || '';
        document.getElementById('profilJenjang').value = userData.jenjang || '';
        document.getElementById('profilKota').value = userData.kota || '';
        document.getElementById('profilAlamat').value = userData.alamat || '';
        document.getElementById('profilKepsek').value = userData.kepsek || '';
        document.getElementById('profilNipKepsek').value = userData.nipKepsek || '';
    }

    // Load mapel diampu
    loadMapelDiampu();
    
    // Load kalender
    loadKalender();
    
    // Load libur baku
    loadLiburBaku();
    
    // Load CP data
    loadCPData();
    
    // Update getting started
    updateGettingStarted();
    
    // Populate class selects
    populateKelasSelect();
}

function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            const isPremium = item.dataset.premium === 'true';
            
            if (isPremium && userData?.subscription !== 'premium') {
                navigateTo(section); // Will show locked content
            } else {
                navigateTo(section);
            }
        });
    });
    
    // Profile form
    document.getElementById('formProfil').addEventListener('submit', saveProfile);
    
    // Kalender form
    document.getElementById('formKalender').addEventListener('submit', saveKalender);
    
    // Add Mapel form
    document.getElementById('formAddMapel').addEventListener('submit', addMapel);
    
    // CP File Upload
    document.getElementById('inputFileCP').addEventListener('change', handleCPFileUpload);
    
    // Drag and drop for CP
    setupDragAndDrop();
}

// ===== NAVIGATION =====
function navigateTo(section) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(sec => sec.classList.add('hidden'));
    
    // Show selected section
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': ['Dashboard', 'Selamat datang di Admin Guru Super App'],
        'profil': ['Profil Saya', 'Kelola data diri dan satuan pendidikan'],
        'kalender': ['Kalender Pendidikan', 'Atur tanggal semester dan hari libur'],
        'jadwal': ['Jadwal Pelajaran', 'Kelola jadwal mengajar'],
        'siswa': ['Data Siswa', 'Kelola data siswa'],
        'cp': ['Data CP/TP', 'Upload dan kelola Capaian Pembelajaran'],
        'atp': ['Alur Tujuan Pembelajaran', 'Generate dokumen ATP'],
        'prota': ['Program Tahunan', 'Generate dokumen Prota'],
        'promes': ['Program Semester', 'Generate dokumen Promes'],
        'modul-ajar': ['Modul Ajar', 'Buat modul ajar'],
        'lkpd': ['LKPD', 'Lembar Kerja Peserta Didik'],
        'kktp': ['KKTP', 'Kriteria Ketercapaian Tujuan Pembelajaran'],
        'jurnal': ['Jurnal Pembelajaran', 'Kelola jurnal mengajar'],
        'absensi': ['Absensi', 'Kelola kehadiran siswa'],
        'nilai': ['Daftar Nilai', 'Kelola nilai siswa'],
        'ai-assistant': ['AI Assistant', 'Bantuan membuat data dengan AI'],
        'panduan': ['Panduan', 'Panduan penggunaan aplikasi']
    };
    
    const title = titles[section] || ['', ''];
    document.getElementById('pageTitle').textContent = title[0];
    document.getElementById('pageSubtitle').textContent = title[1];
    
    // Close mobile menu
    closeMobileMenu();
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full');
    if (window.innerWidth >= 1024) {
        sidebar.classList.remove('-translate-x-full');
    }
}

// ===== TAHUN AJAR =====
function updateTahunAjarSelect() {
    const select = document.getElementById('selectTahunAjar');
    const academicYear = getCurrentAcademicYear();
    
    select.innerHTML = '';
    academicYear.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === academicYear.current) option.selected = true;
        select.appendChild(option);
    });
    
    document.getElementById('kalenderTahunAjar').textContent = academicYear.current;
}

// ===== PROFILE =====
async function saveProfile(e) {
    e.preventDefault();
    showLoading('Menyimpan profil...');
    
    try {
        const data = {
            nama: document.getElementById('profilNama').value,
            nip: document.getElementById('profilNip').value,
            phone: document.getElementById('profilPhone').value,
            sekolah: document.getElementById('profilSekolah').value,
            jenjang: document.getElementById('profilJenjang').value,
            kota: document.getElementById('profilKota').value,
            alamat: document.getElementById('profilAlamat').value,
            kepsek: document.getElementById('profilKepsek').value,
            nipKepsek: document.getElementById('profilNipKepsek').value,
            profileComplete: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).update(data);
        userData = { ...userData, ...data };
        
        hideLoading();
        showToast('Profil berhasil disimpan!', 'success');
        updateGettingStarted();
    } catch (error) {
        hideLoading();
        showToast('Gagal menyimpan profil: ' + error.message, 'error');
    }
}

// ===== MAPEL DIAMPU =====
async function loadMapelDiampu() {
    const container = document.getElementById('listMapelDiampu');
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Belum ada mata pelajaran</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const mapel = doc.data();
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-800">${mapel.nama}</p>
                        <p class="text-xs text-gray-500">${mapel.jp} JP × ${mapel.pertemuan}x/minggu</p>
                    </div>
                    <button onclick="deleteMapel('${doc.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        updateMapelSelects();
        document.getElementById('statMapel').textContent = snapshot.size;
    } catch (error) {
        console.error('Error loading mapel:', error);
    }
}

function showAddMapelModal() {
    document.getElementById('modalAddMapel').classList.remove('hidden');
}

async function addMapel(e) {
    e.preventDefault();
    showLoading('Menambah mapel...');
    
    try {
        const data = {
            nama: document.getElementById('mapelNama').value,
            jp: parseInt(document.getElementById('mapelJp').value),
            pertemuan: parseInt(document.getElementById('mapelPertemuan').value),
            needArabic: document.getElementById('mapelArabic').checked,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').add(data);
        
        hideLoading();
        closeModal('modalAddMapel');
        showToast('Mata pelajaran berhasil ditambahkan!', 'success');
        loadMapelDiampu();
        document.getElementById('formAddMapel').reset();
    } catch (error) {
        hideLoading();
        showToast('Gagal menambah mapel: ' + error.message, 'error');
    }
}

async function deleteMapel(id) {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(id).delete();
        showToast('Mata pelajaran dihapus', 'success');
        loadMapelDiampu();
    } catch (error) {
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

function updateMapelSelects() {
    const selects = ['cpMapel', 'atpMapel', 'protaMapel', 'promesMapel'];
    
    db.collection('users').doc(currentUser.uid)
        .collection('mapelDiampu').get()
        .then(snapshot => {
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">Pilih Mapel</option>';
                    snapshot.forEach(doc => {
                        const mapel = doc.data();
                        const option = document.createElement('option');
                        option.value = doc.id;
                        option.textContent = mapel.nama;
                        option.dataset.nama = mapel.nama;
                        select.appendChild(option);
                    });
                    select.value = currentValue;
                }
            });
        });
}

// ===== KALENDER =====
async function loadKalender() {
    const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc(tahunAjar.replace('/', '-')).get();
        
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('ganjilMulai').value = data.ganjilMulai || '';
            document.getElementById('ganjilSelesai').value = data.ganjilSelesai || '';
            document.getElementById('genapMulai').value = data.genapMulai || '';
            document.getElementById('genapSelesai').value = data.genapSelesai || '';
            document.getElementById('genapSelesaiKelasAkhir').value = data.genapSelesaiKelasAkhir || '';
        } else {
            // Set defaults
            const years = tahunAjar.split('/');
            document.getElementById('ganjilMulai').value = `${years[0]}-07-15`;
            document.getElementById('ganjilSelesai').value = `${years[0]}-12-20`;
            document.getElementById('genapMulai').value = `${years[1]}-01-06`;
            document.getElementById('genapSelesai').value = `${years[1]}-06-20`;
            document.getElementById('genapSelesaiKelasAkhir').value = `${years[1]}-05-30`;
        }
    } catch (error) {
        console.error('Error loading kalender:', error);
    }
}

async function saveKalender(e) {
    e.preventDefault();
    showLoading('Menyimpan kalender...');
    
    const tahunAjar = document.getElementById('selectTahunAjar').value;
    
    try {
        const data = {
            ganjilMulai: document.getElementById('ganjilMulai').value,
            ganjilSelesai: document.getElementById('ganjilSelesai').value,
            genapMulai: document.getElementById('genapMulai').value,
            genapSelesai: document.getElementById('genapSelesai').value,
            genapSelesaiKelasAkhir: document.getElementById('genapSelesaiKelasAkhir').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc(tahunAjar.replace('/', '-')).set(data, { merge: true });
        
        hideLoading();
        showToast('Kalender berhasil disimpan!', 'success');
        updateGettingStarted();
    } catch (error) {
        hideLoading();
        showToast('Gagal menyimpan kalender: ' + error.message, 'error');
    }
}

function loadLiburBaku() {
    const container = document.getElementById('liburBaku');
    let html = '';
    
    LIBUR_BAKU.forEach(libur => {
        html += `<li><strong>${libur.tanggal.replace('-', '/')}</strong> - ${libur.nama}</li>`;
    });
    
    container.innerHTML = html;
}

// ===== CP DATA =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZoneCP');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-blue-50');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-blue-50');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-blue-50');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('inputFileCP').files = files;
            handleCPFileUpload({ target: { files } });
        }
    });
}

async function handleCPFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const mapelId = document.getElementById('cpMapel').value;
    const jenjang = document.getElementById('cpJenjang').value;
    
    if (!mapelId || !jenjang) {
        showToast('Pilih mata pelajaran dan jenjang terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Memproses file CSV...');
    
    try {
        const text = await file.text();
        const parsed = parseCSV(text);
        
        if (parsed.length === 0) {
            hideLoading();
            showToast('File CSV kosong atau format tidak valid!', 'error');
            return;
        }
        
        // Show preview
        displayCPPreview(parsed);
        
        // Get mapel name
        const mapelOption = document.querySelector(`#cpMapel option[value="${mapelId}"]`);
        const mapelNama = mapelOption?.dataset.nama || 'Unknown';
        
        // Save to Firestore
        await saveCPData(mapelId, jenjang, mapelNama, parsed);
        
        hideLoading();
        showToast(`${parsed.length} data CP berhasil diupload!`, 'success');
        loadCPData();
        updateGettingStarted();
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(';');
        if (cols.length < 6) continue;
        
        result.push({
            fase: cols[0]?.trim() || '',
            kelas: cols[1]?.trim() || '',
            semester: cols[2]?.trim() || '',
            elemen: cols[3]?.trim() || '',
            cp: cols[4]?.trim() || '',
            tp: cols[5]?.trim() || '',
            profil: cols[6]?.trim() || ''
        });
    }
    
    return result;
}

function displayCPPreview(data) {
    const tbody = document.getElementById('bodyCPPreview');
    let html = '';
    
    data.slice(0, 20).forEach(row => { // Show first 20 rows
        html += `
            <tr>
                <td class="border border-gray-200 p-2">${row.fase}</td>
                <td class="border border-gray-200 p-2">${row.kelas}</td>
                <td class="border border-gray-200 p-2">${row.semester}</td>
                <td class="border border-gray-200 p-2">${row.elemen}</td>
                <td class="border border-gray-200 p-2" style="max-width:150px; overflow:hidden; text-overflow:ellipsis;">${row.cp}</td>
                <td class="border border-gray-200 p-2" style="max-width:150px; overflow:hidden; text-overflow:ellipsis;">${row.tp}</td>
                <td class="border border-gray-200 p-2">${row.profil}</td>
            </tr>
        `;
    });
    
    if (data.length > 20) {
        html += `<tr><td colspan="7" class="text-center text-gray-500 p-4">... dan ${data.length - 20} baris lainnya</td></tr>`;
    }
    
    tbody.innerHTML = html;
}

async function saveCPData(mapelId, jenjang, mapelNama, data) {
    // Group data by class and semester
    const grouped = {};
    
    data.forEach(row => {
        const key = `${row.kelas}-${row.semester}`;
        if (!grouped[key]) {
            grouped[key] = {
                fase: row.fase,
                kelas: row.kelas,
                semester: row.semester,
                babs: {}
            };
        }
        
        if (!grouped[key].babs[row.elemen]) {
            grouped[key].babs[row.elemen] = {
                cp: row.cp,
                tps: []
            };
        }
        
        grouped[key].babs[row.elemen].tps.push({
            tp: row.tp,
            profil: row.profil
        });
    });
    
    // Save to Firestore
    const docRef = db.collection('users').doc(currentUser.uid)
        .collection('cpData').doc(`${mapelId}-${jenjang.toLowerCase()}`);
    
    await docRef.set({
        mapelId,
        mapelNama,
        jenjang,
        data: grouped,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
        // Update local cache
    cpData[`${mapelId}-${jenjang.toLowerCase()}`] = grouped;
}

async function loadCPData() {
    const container = document.getElementById('listCPTersimpan');
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Belum ada data tersimpan</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const kelasCount = Object.keys(data.data || {}).length;
            
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-800">${data.mapelNama}</p>
                        <p class="text-xs text-gray-500">${data.jenjang} • ${kelasCount} kelas</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewCPData('${doc.id}')" class="text-primary hover:text-secondary">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteCPData('${doc.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Cache data
            cpData[doc.id] = data.data;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading CP data:', error);
    }
}

async function loadCPFromUrl() {
    const url = document.getElementById('cpCsvUrl').value.trim();
    if (!url) {
        showToast('Masukkan URL terlebih dahulu!', 'error');
        return;
    }
    
    const mapelId = document.getElementById('cpMapel').value;
    const jenjang = document.getElementById('cpJenjang').value;
    
    if (!mapelId || !jenjang) {
        showToast('Pilih mata pelajaran dan jenjang terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Mengambil data dari URL...');
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parsed = parseCSV(text);
        
        if (parsed.length === 0) {
            hideLoading();
            showToast('Data kosong atau format tidak valid!', 'error');
            return;
        }
        
        displayCPPreview(parsed);
        
        const mapelOption = document.querySelector(`#cpMapel option[value="${mapelId}"]`);
        const mapelNama = mapelOption?.dataset.nama || 'Unknown';
        
        await saveCPData(mapelId, jenjang, mapelNama, parsed);
        
        hideLoading();
        showToast(`${parsed.length} data CP berhasil diimport!`, 'success');
        loadCPData();
        updateGettingStarted();
    } catch (error) {
        hideLoading();
        showToast('Gagal mengambil data: ' + error.message, 'error');
    }
}

async function deleteCPData(id) {
    if (!confirm('Hapus data CP ini?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(id).delete();
        
        delete cpData[id];
        showToast('Data CP dihapus', 'success');
        loadCPData();
    } catch (error) {
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

// ===== KELAS SELECT =====
function populateKelasSelect() {
    const jenjang = userData?.jenjang || 'SD';
    let kelasOptions = [];
    
    switch (jenjang) {
        case 'SD':
            kelasOptions = ['1', '2', '3', '4', '5', '6'];
            break;
        case 'SMP':
            kelasOptions = ['7', '8', '9'];
            break;
        case 'SMA':
        case 'SMK':
            kelasOptions = ['10', '11', '12'];
            break;
        default:
            kelasOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    }
    
    const selects = ['jadwalKelas', 'siswaKelas', 'atpKelas', 'protaKelas', 'promesKelas'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Pilih Kelas</option>';
            kelasOptions.forEach(kelas => {
                const fase = getFaseByKelas(kelas);
                const option = document.createElement('option');
                option.value = kelas;
                option.textContent = `Kelas ${kelas} (${fase})`;
                select.appendChild(option);
            });
        }
    });
}

function getFaseByKelas(kelas) {
    const k = parseInt(kelas);
    if (k <= 2) return 'Fase A';
    if (k <= 4) return 'Fase B';
    if (k <= 6) return 'Fase C';
    if (k <= 9) return 'Fase D';
    if (k === 10) return 'Fase E';
    return 'Fase F';
}

function getFaseHuruf(kelas) {
    const k = parseInt(kelas);
    if (k <= 2) return 'A';
    if (k <= 4) return 'B';
    if (k <= 6) return 'C';
    if (k <= 9) return 'D';
    if (k === 10) return 'E';
    return 'F';
}

// ===== GETTING STARTED =====
async function updateGettingStarted() {
    const steps = {
        step1: userData?.profileComplete || false,
        step2: false,
        step3: false,
        step4: false
    };
    
    // Check kalender
    const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
    const kalenderDoc = await db.collection('users').doc(currentUser.uid)
        .collection('kalender').doc(tahunAjar.replace('/', '-')).get();
    steps.step2 = kalenderDoc.exists;
    
    // Check CP data
    const cpSnapshot = await db.collection('users').doc(currentUser.uid)
        .collection('cpData').limit(1).get();
    steps.step3 = !cpSnapshot.empty;
    
    // Check jadwal
    const jadwalSnapshot = await db.collection('users').doc(currentUser.uid)
        .collection('jadwal').limit(1).get();
    steps.step4 = !jadwalSnapshot.empty;
    
    // Update badges
    Object.keys(steps).forEach(step => {
        const badge = document.getElementById(`${step}Badge`);
        if (badge) {
            if (steps[step]) {
                badge.textContent = 'Selesai';
                badge.className = 'badge bg-green-100 text-green-700';
            } else {
                badge.textContent = 'Belum';
                badge.className = 'badge bg-gray-100 text-gray-600';
            }
        }
    });
}

// ===== DOCUMENT GENERATION =====
async function generateATP() {
    const mapelId = document.getElementById('atpMapel').value;
    const kelas = document.getElementById('atpKelas').value;
    const semester = document.getElementById('atpSemester').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating ATP...');
    
    try {
        // Get CP data
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP belum diupload untuk mapel ini!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas) {
            hideLoading();
            showToast(`Data CP untuk kelas ${kelas} semester ${semester} tidak ditemukan!`, 'error');
            return;
        }
        
        // Get mapel info
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const jpPerTp = mapelData?.jp || 2;
        
        // Get kalender info
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            semester: semester,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            nipKepsek: userData?.nipKepsek || '',
            guru: userData?.nama || '',
            nipGuru: userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        // Generate table content
        let html = '';
        let no = 0;
        
        Object.keys(dataKelas.babs).forEach(babName => {
            const bab = dataKelas.babs[babName];
            const tps = bab.tps || [];
            const totalJp = tps.length * jpPerTp;
            const minggu = Math.ceil(totalJp / jpPerTp);
            
            tps.forEach((tpObj, iTp) => {
                const kompetensi = extractKompetensi(tpObj.tp);
                
                html += `<tr>`;
                
                if (iTp === 0) {
                    no++;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center">${no}</td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-left"><b>${babName}</b><br><br>${bab.cp}</td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-left">Peserta didik memahami materi terkait ${babName} dengan baik.</td>`;
                }
                
                html += `<td class="border border-black p-2 text-left"><b>${no}.${iTp + 1}</b> ${tpObj.tp}</td>`;
                html += `<td class="border border-black p-2 text-center text-blue-600 font-semibold" style="font-size:9px;">${tpObj.profil || '-'}</td>`;
                html += `<td class="border border-black p-2 text-center text-yellow-600 font-semibold">${kompetensi}</td>`;
                
                if (iTp === 0) {
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center">${babName}</td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center"><b>${minggu} Minggu<br>${totalJp} JP</b></td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2"></td>`;
                }
                
                html += `</tr>`;
            });
        });
        
        document.getElementById('bodyATP').innerHTML = html;
        
        hideLoading();
        showToast('ATP berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

async function generateProta() {
    const mapelId = document.getElementById('protaMapel').value;
    const kelas = document.getElementById('protaKelas').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Prota...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP belum diupload untuk mapel ini!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        
        // Get mapel info
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const jpPerTp = mapelData?.jp || 2;
        
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            nipKepsek: userData?.nipKepsek || '',
            guru: userData?.nama || '',
            nipGuru: userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        // Generate table for both semesters
        let html = '';
        
        ['Ganjil', 'Genap'].forEach(semester => {
            const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
            if (!dataKelas) return;
            
            Object.keys(dataKelas.babs).forEach(babName => {
                const bab = dataKelas.babs[babName];
                const tps = bab.tps || [];
                const totalJp = tps.length * jpPerTp;
                
                tps.forEach((tpObj, iTp) => {
                    html += `<tr>`;
                    
                    if (iTp === 0) {
                        html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center">${semester}</td>`;
                        html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center bg-gray-50">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold;">${babName}</div>
                        </td>`;
                    }
                    
                    html += `<td class="border border-black p-2 text-left">${tpObj.tp}</td>`;
                    
                    if (iTp === 0) {
                        html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center font-bold">${totalJp} JP</td>`;
                    }
                    
                    html += `</tr>`;
                });
            });
        });
        
        document.getElementById('bodyProta').innerHTML = html;
        
        hideLoading();
        showToast('Prota berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

async function generatePromes() {
    const mapelId = document.getElementById('promesMapel').value;
    const kelas = document.getElementById('promesKelas').value;
    const semester = document.getElementById('promesSemester').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Promes...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP belum diupload untuk mapel ini!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas) {
            hideLoading();
            showToast(`Data CP untuk kelas ${kelas} semester ${semester} tidak ditemukan!`, 'error');
            return;
        }
        
        // Get mapel info
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const jpPerTp = mapelData?.jp || 2;
        
        // Get kalender info
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        const kalenderDoc = await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc(tahunAjar.replace('/', '-')).get();
        
        const kalender = kalenderDoc.exists ? kalenderDoc.data() : {};
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            semester: semester,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            nipKepsek: userData?.nipKepsek || '',
            guru: userData?.nama || '',
            nipGuru: userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        // Generate header
        const namaBulan = semester === 'Ganjil' ? BULAN_GANJIL : BULAN_GENAP;
        
        let headHtml = `
            <tr>
                <th rowspan="2" class="border border-black p-2 bg-gray-100" width="12%">Bab / Elemen</th>
                <th rowspan="2" class="border border-black p-2 bg-gray-100" width="28%">Tujuan Pembelajaran (TP)</th>
                <th rowspan="2" class="border border-black p-2 bg-gray-100" width="5%">JP</th>
        `;
        
        namaBulan.forEach(bulan => {
            headHtml += `<th colspan="5" class="border border-black p-2 bg-gray-100">${bulan}</th>`;
        });
        
        headHtml += `</tr><tr>`;
        
        for (let i = 0; i < 6; i++) {
            for (let w = 1; w <= 5; w++) {
                headHtml += `<th class="border border-black p-1 bg-gray-50 text-xs">${w}</th>`;
            }
        }
        
        headHtml += `</tr>`;
        document.getElementById('headPromes').innerHTML = headHtml;
        
        // Calculate teaching dates
        const tahunParts = tahunAjar.split('/');
        const tahunOperasional = semester === 'Ganjil' ? parseInt(tahunParts[0]) : parseInt(tahunParts[1]);
        const bulanAwal = semester === 'Ganjil' ? 6 : 0; // Juli (6) atau Januari (0)
        
        // Get jadwal hari mengajar
        const jadwalSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('kelas', '==', kelas)
            .where('mapelId', '==', mapelId)
            .limit(1)
            .get();
        
        let hariMengajar = 1; // Default Senin
        if (!jadwalSnapshot.empty) {
            const jadwalData = jadwalSnapshot.docs[0].data();
            hariMengajar = jadwalData.hari || 1;
        }
        
        // Calculate all teaching dates
        const tanggalMengajar = calculateTanggalMengajar(
            tahunOperasional, 
            bulanAwal, 
            hariMengajar, 
            semester,
            kalender
        );
        
        // Generate body
        let bodyHtml = '';
        let tglIndex = 0;
        const allTps = [];
        
        // Collect all TPs
        Object.keys(dataKelas.babs).forEach(babName => {
            const bab = dataKelas.babs[babName];
            bab.tps.forEach((tpObj, iTp) => {
                allTps.push({
                    babName,
                    bab,
                    tpObj,
                    iTp,
                    isFirst: iTp === 0,
                    rowspan: bab.tps.length
                });
            });
        });
        
        // Generate rows
        let currentBab = '';
        allTps.forEach((tp, idx) => {
            bodyHtml += `<tr>`;
            
            if (tp.isFirst) {
                currentBab = tp.babName;
                bodyHtml += `<td rowspan="${tp.rowspan}" class="border border-black p-2 text-center bg-gray-50">
                    <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px;">${tp.babName}</div>
                </td>`;
            }
            
            bodyHtml += `<td class="border border-black p-2 text-left text-xs">${tp.tpObj.tp}</td>`;
            bodyHtml += `<td class="border border-black p-2 text-center font-bold">${jpPerTp}</td>`;
            
            // 30 columns for weeks
            for (let col = 0; col < 30; col++) {
                const bulanIdx = Math.floor(col / 5);
                const mingguIdx = col % 5;
                
                // Check if this cell has a teaching date
                const cellDate = tanggalMengajar.find(t => {
                    return t.bulanIdx === bulanIdx && t.minggu === mingguIdx + 1;
                });
                
                if (cellDate && tglIndex < tanggalMengajar.length && idx === tglIndex) {
                    bodyHtml += `<td class="border border-black p-1 text-center bg-blue-100">
                        <span class="font-bold">${jpPerTp}</span>
                        <span class="block text-xs text-red-600">${cellDate.tanggal}</span>
                    </td>`;
                    tglIndex++;
                } else {
                    bodyHtml += `<td class="border border-black p-1"></td>`;
                }
            }
            
            bodyHtml += `</tr>`;
        });
        
        document.getElementById('bodyPromes').innerHTML = bodyHtml;
        
        hideLoading();
        showToast('Promes berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

function calculateTanggalMengajar(tahun, bulanAwal, hariTarget, semester, kalender) {
    const hasil = [];
    
    for (let i = 0; i < 6; i++) {
        let bulan = bulanAwal + i;
        let tahunBulan = tahun;
        
        if (semester === 'Ganjil' && bulan > 11) {
            bulan -= 12;
            tahunBulan++;
        }
        
        const jumlahHari = new Date(tahunBulan, bulan + 1, 0).getDate();
        
        for (let tgl = 1; tgl <= jumlahHari; tgl++) {
            const tanggal = new Date(tahunBulan, bulan, tgl);
            
            if (tanggal.getDay() === hariTarget) {
                const minggu = Math.ceil(tgl / 7);
                
                // Check if not a holiday
                const dateStr = `${tahunBulan}-${String(bulan + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`;
                const isLibur = LIBUR_BAKU.some(l => {
                    const [mm, dd] = l.tanggal.split('-');
                    return `${tahunBulan}-${mm}-${dd}` === dateStr;
                });
                
                if (!isLibur) {
                    hasil.push({
                        bulanIdx: i,
                        minggu: minggu > 5 ? 5 : minggu,
                        tanggal: tgl,
                        dateObj: tanggal
                    });
                }
            }
        }
    }
    
    return hasil;
}

function updateDocumentValues(values) {
    Object.keys(values).forEach(key => {
        document.querySelectorAll(`.val-${key}`).forEach(el => {
            el.textContent = values[key];
        });
    });
}

function extractKompetensi(tpText) {
    const match = tpText.match(/mampu\s+(\w+)/i);
    if (match) {
        const kata = match[1].toLowerCase();
        const kompetensiMap = {
            'menjelaskan': 'Memahami',
            'mengidentifikasi': 'Menganalisis',
            'menyebutkan': 'Mengingat',
            'menganalisis': 'Menganalisis',
            'menerapkan': 'Menerapkan',
            'membuat': 'Mencipta',
            'mempraktikkan': 'Menerapkan',
            'menghafal': 'Mengingat',
            'melafalkan': 'Menerapkan',
            'membaca': 'Memahami',
            'menulis': 'Menerapkan',
            'menghitung': 'Menerapkan'
        };
        return kompetensiMap[kata] || 'Memahami';
    }
    return 'Memahami';
}

function formatTanggalIndonesia(date) {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

// ===== PRINT =====
function printDocument(type) {
    const printContents = document.getElementById(`document${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (!printContents) return;
    
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents.outerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Reinitialize
    location.reload();
}

// ===== UTILITY FUNCTIONS =====
function showLoading(text = 'Memproses...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    
    msg.textContent = message;
    toast.querySelector('div').classList.remove('border-green-500', 'border-red-500', 'border-yellow-500');
    
    if (type === 'success') {
        toast.querySelector('div').classList.add('border-green-500');
        icon.className = 'fas fa-check-circle text-xl text-green-500';
    } else if (type === 'error') {
        toast.querySelector('div').classList.add('border-red-500');
        icon.className = 'fas fa-exclamation-circle text-xl text-red-500';
    } else {
        toast.querySelector('div').classList.add('border-yellow-500');
        icon.className = 'fas fa-exclamation-triangle text-xl text-yellow-500';
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

async function showUpgradeModal() {
    // Get WhatsApp number from settings
    let waNumber = '6281234567890'; // Default
    
    try {
        const settingsDoc = await db.collection('settings').doc('general').get();
        if (settingsDoc.exists && settingsDoc.data().whatsappUpgrade) {
            waNumber = settingsDoc.data().whatsappUpgrade;
        }
    } catch (error) {
        console.log('Using default WhatsApp number');
    }
    
    const message = encodeURIComponent(`Halo Admin, saya ingin upgrade ke Premium.\n\nNama: ${userData?.nama || '-'}\nEmail: ${currentUser?.email || '-'}\nSekolah: ${userData?.sekolah || '-'}`);
    
    document.getElementById('linkWhatsappUpgrade').href = `https://wa.me/${waNumber}?text=${message}`;
    document.getElementById('modalUpgrade').classList.remove('hidden');
}

function copyPrompt(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Prompt berhasil disalin!', 'success');
    }).catch(() => {
        showToast('Gagal menyalin prompt', 'error');
    });
}

async function handleLogout() {
    if (!confirm('Yakin ingin keluar?')) return;
    
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        showToast('Gagal logout: ' + error.message, 'error');
    }
}

// Make functions global
window.navigateTo = navigateTo;
window.showAddMapelModal = showAddMapelModal;
window.deleteMapel = deleteMapel;
window.showUpgradeModal = showUpgradeModal;
window.closeModal = closeModal;
window.generateATP = generateATP;
window.generateProta = generateProta;
window.generatePromes = generatePromes;
window.printDocument = printDocument;
window.loadCPFromUrl = loadCPFromUrl;
window.deleteCPData = deleteCPData;
window.copyPrompt = copyPrompt;
window.handleLogout = handleLogout;
window.saveJamPelajaran = saveJamPelajaran;

// Additional stub functions
async function saveJamPelajaran() {
    showLoading('Menyimpan...');
    
    try {
        const data = {
            durasiJp: parseInt(document.getElementById('durasiJp').value) || 35,
            jamMulai: document.getElementById('jamMulai').value || '07:00',
            durasiIstirahat: parseInt(document.getElementById('durasiIstirahat').value) || 15,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('settings').doc('jadwal').set(data, { merge: true });
        
        hideLoading();
        showToast('Pengaturan jam pelajaran disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Gagal menyimpan: ' + error.message, 'error');
    }
}