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
    console.log('DOM loaded, initializing app...');
    initApp();
});

function initApp() {
    // Check Auth State
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
            currentUser = user;
            
            try {
                await loadUserData();
                initializeUI();
                setupEventListeners();
                updateTahunAjarSelect();
                console.log('App initialized successfully');
            } catch (error) {
                console.error('Error initializing app:', error);
                
                // If permission error, might be new user - create their document
                if (error.code === 'permission-denied') {
                    console.log('Creating new user document...');
                    await createNewUserDocument();
                    location.reload();
                }
            }
        } else {
            window.location.href = 'index.html';
        }
    });
}

async function createNewUserDocument() {
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            await userRef.set({
                nama: currentUser.displayName || 'Pengguna Baru',
                email: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                subscription: 'free',
                subscriptionExpiry: null,
                profileComplete: false
            });
            console.log('New user document created');
        }
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

async function loadUserData() {
    try {
        console.log('Loading user data for:', currentUser.uid);
        const doc = await db.collection('users').doc(currentUser.uid).get();
        
        if (doc.exists) {
            userData = doc.data();
            console.log('User data loaded:', userData);
            updateUserDisplay();
        } else {
            console.log('User document does not exist, creating...');
            await createNewUserDocument();
            userData = {
                nama: currentUser.displayName || 'Pengguna Baru',
                email: currentUser.email,
                subscription: 'free',
                profileComplete: false
            };
            updateUserDisplay();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('userName');
    const badgeEl = document.getElementById('userBadge');
    const btnUpgrade = document.getElementById('btnUpgrade');
    
    if (userNameEl) {
        userNameEl.textContent = userData?.nama || currentUser?.displayName || 'Pengguna';
    }
    
    if (badgeEl) {
        if (userData?.subscription === 'premium') {
            badgeEl.textContent = 'PREMIUM';
            badgeEl.className = 'badge badge-premium';
            if (btnUpgrade) btnUpgrade.classList.add('hidden');
        } else {
            badgeEl.textContent = 'FREE';
            badgeEl.className = 'badge badge-free';
            if (btnUpgrade) btnUpgrade.classList.remove('hidden');
        }
    }
}

function initializeUI() {
    console.log('Initializing UI...');
    
    // Populate profil form
    if (userData) {
        const fields = {
            'profilNama': userData.nama || '',
            'profilNip': userData.nip || '',
            'profilEmail': currentUser?.email || '',
            'profilPhone': userData.phone || '',
            'profilSekolah': userData.sekolah || '',
            'profilJenjang': userData.jenjang || '',
            'profilKota': userData.kota || '',
            'profilAlamat': userData.alamat || '',
            'profilKepsek': userData.kepsek || '',
            'profilNipKepsek': userData.nipKepsek || ''
        };
        
        Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = fields[id];
        });
    }

    // Load data with error handling
    loadMapelDiampu().catch(e => console.log('Mapel load skipped:', e.message));
    loadKalender().catch(e => console.log('Kalender load skipped:', e.message));
    loadLiburBaku();
    loadCPData().catch(e => console.log('CP data load skipped:', e.message));
    updateGettingStarted().catch(e => console.log('Getting started update skipped:', e.message));
    populateKelasSelect();
    
    // Initialize premium features if available
    if (typeof initPremiumFeatures === 'function') {
        setTimeout(initPremiumFeatures, 500);
    }
    
    console.log('UI initialized');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Sidebar navigation
    document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            const isPremium = item.dataset.premium === 'true';
            navigateTo(section);
        });
    });
    
    // Profile form
    const formProfil = document.getElementById('formProfil');
    if (formProfil) {
        formProfil.addEventListener('submit', saveProfile);
    }
    
    // Kalender form
    const formKalender = document.getElementById('formKalender');
    if (formKalender) {
        formKalender.addEventListener('submit', saveKalender);
    }
    
    // Add Mapel form
    const formAddMapel = document.getElementById('formAddMapel');
    if (formAddMapel) {
        formAddMapel.addEventListener('submit', addMapel);
    }
    
    // CP File Upload
    const inputFileCP = document.getElementById('inputFileCP');
    if (inputFileCP) {
        inputFileCP.addEventListener('change', handleCPFileUpload);
    }
    
    // Drag and drop for CP
    setupDragAndDrop();
    
    console.log('Event listeners set up');
}

// ===== NAVIGATION =====
function navigateTo(section) {
    console.log('Navigating to:', section);
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(sec => sec.classList.add('hidden'));
    
    // Show selected section
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    } else {
        console.warn('Section not found:', section);
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
    const pageTitleEl = document.getElementById('pageTitle');
    const pageSubtitleEl = document.getElementById('pageSubtitle');
    
    if (pageTitleEl) pageTitleEl.textContent = title[0];
    if (pageSubtitleEl) pageSubtitleEl.textContent = title[1];
    
    // Close mobile menu
    closeMobileMenu();
}

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
    }
}

// ===== TAHUN AJAR =====
function updateTahunAjarSelect() {
    const select = document.getElementById('selectTahunAjar');
    if (!select) return;
    
    const academicYear = getCurrentAcademicYear();
    
    select.innerHTML = '';
    academicYear.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === academicYear.current) option.selected = true;
        select.appendChild(option);
    });
    
    const kalenderTahunAjar = document.getElementById('kalenderTahunAjar');
    if (kalenderTahunAjar) {
        kalenderTahunAjar.textContent = academicYear.current;
    }
}

// ===== PROFILE =====
async function saveProfile(e) {
    e.preventDefault();
    showLoading('Menyimpan profil...');
    
    try {
        const data = {
            nama: document.getElementById('profilNama')?.value || '',
            nip: document.getElementById('profilNip')?.value || '',
            phone: document.getElementById('profilPhone')?.value || '',
            sekolah: document.getElementById('profilSekolah')?.value || '',
            jenjang: document.getElementById('profilJenjang')?.value || '',
            kota: document.getElementById('profilKota')?.value || '',
            alamat: document.getElementById('profilAlamat')?.value || '',
            kepsek: document.getElementById('profilKepsek')?.value || '',
            nipKepsek: document.getElementById('profilNipKepsek')?.value || '',
            profileComplete: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).set(data, { merge: true });
        userData = { ...userData, ...data };
        
        hideLoading();
        showToast('Profil berhasil disimpan!', 'success');
        updateGettingStarted().catch(e => console.log(e));
    } catch (error) {
        hideLoading();
        console.error('Save profile error:', error);
        showToast('Gagal menyimpan profil: ' + error.message, 'error');
    }
}

// ===== MAPEL DIAMPU =====
async function loadMapelDiampu() {
    const container = document.getElementById('listMapelDiampu');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Belum ada mata pelajaran</p>';
            document.getElementById('statMapel').textContent = '0';
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
        
        const statMapel = document.getElementById('statMapel');
        if (statMapel) statMapel.textContent = snapshot.size;
        
    } catch (error) {
        console.error('Error loading mapel:', error);
        container.innerHTML = '<p class="text-red-500 text-sm text-center">Gagal memuat data</p>';
    }
}

function showAddMapelModal() {
    const modal = document.getElementById('modalAddMapel');
    if (modal) modal.classList.remove('hidden');
}

async function addMapel(e) {
    e.preventDefault();
    showLoading('Menambah mapel...');
    
    try {
        const data = {
            nama: document.getElementById('mapelNama')?.value || '',
            jp: parseInt(document.getElementById('mapelJp')?.value) || 2,
            pertemuan: parseInt(document.getElementById('mapelPertemuan')?.value) || 1,
            needArabic: document.getElementById('mapelArabic')?.checked || false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').add(data);
        
        hideLoading();
        closeModal('modalAddMapel');
        showToast('Mata pelajaran berhasil ditambahkan!', 'success');
        loadMapelDiampu();
        
        const form = document.getElementById('formAddMapel');
        if (form) form.reset();
        
    } catch (error) {
        hideLoading();
        console.error('Add mapel error:', error);
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
        console.error('Delete mapel error:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

function updateMapelSelects() {
    const selects = ['cpMapel', 'atpMapel', 'protaMapel', 'promesMapel', 
                     'modulMapel', 'lkpdMapel', 'kktpMapel', 'jurnalMapel', 
                     'absensiMapel', 'nilaiMapel'];
    
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
                        option.dataset.jp = mapel.jp;
                        option.dataset.needArabic = mapel.needArabic;
                        select.appendChild(option);
                    });
                    select.value = currentValue;
                }
            });
        })
        .catch(err => console.log('Update mapel selects error:', err));
}

// ===== KALENDER =====
async function loadKalender() {
    const tahunAjarSelect = document.getElementById('selectTahunAjar');
    const tahunAjar = tahunAjarSelect?.value || getCurrentAcademicYear().current;
    
    try {
        const doc = await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc(tahunAjar.replace('/', '-')).get();
        
        if (doc.exists) {
            const data = doc.data();
            setElementValue('ganjilMulai', data.ganjilMulai || '');
            setElementValue('ganjilSelesai', data.ganjilSelesai || '');
            setElementValue('genapMulai', data.genapMulai || '');
            setElementValue('genapSelesai', data.genapSelesai || '');
            setElementValue('genapSelesaiKelasAkhir', data.genapSelesaiKelasAkhir || '');
        } else {
            // Set defaults
            const years = tahunAjar.split('/');
            setElementValue('ganjilMulai', `${years[0]}-07-15`);
            setElementValue('ganjilSelesai', `${years[0]}-12-20`);
            setElementValue('genapMulai', `${years[1]}-01-06`);
            setElementValue('genapSelesai', `${years[1]}-06-20`);
            setElementValue('genapSelesaiKelasAkhir', `${years[1]}-05-30`);
        }
    } catch (error) {
        console.error('Error loading kalender:', error);
    }
}

function setElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

async function saveKalender(e) {
    e.preventDefault();
    showLoading('Menyimpan kalender...');
    
    const tahunAjarSelect = document.getElementById('selectTahunAjar');
    const tahunAjar = tahunAjarSelect?.value || getCurrentAcademicYear().current;
    
    try {
        const data = {
            ganjilMulai: document.getElementById('ganjilMulai')?.value || '',
            ganjilSelesai: document.getElementById('ganjilSelesai')?.value || '',
            genapMulai: document.getElementById('genapMulai')?.value || '',
            genapSelesai: document.getElementById('genapSelesai')?.value || '',
            genapSelesaiKelasAkhir: document.getElementById('genapSelesaiKelasAkhir')?.value || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc(tahunAjar.replace('/', '-')).set(data, { merge: true });
        
        hideLoading();
        showToast('Kalender berhasil disimpan!', 'success');
        updateGettingStarted().catch(e => console.log(e));
    } catch (error) {
        hideLoading();
        console.error('Save kalender error:', error);
        showToast('Gagal menyimpan kalender: ' + error.message, 'error');
    }
}

function loadLiburBaku() {
    const container = document.getElementById('liburBaku');
    if (!container) return;
    
    let html = '';
    LIBUR_BAKU.forEach(libur => {
        html += `<li><strong>${libur.tanggal.replace('-', '/')}</strong> - ${libur.nama}</li>`;
    });
    
    container.innerHTML = html;
}

// ===== CP DATA =====
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZoneCP');
    if (!dropZone) return;
    
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
            const inputFileCP = document.getElementById('inputFileCP');
            if (inputFileCP) {
                inputFileCP.files = files;
            }
            handleCPFileUpload({ target: { files } });
        }
    });
}

async function handleCPFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const mapelId = document.getElementById('cpMapel')?.value;
    const jenjang = document.getElementById('cpJenjang')?.value;
    
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
        const mapelNama = mapelOption?.dataset?.nama || 'Unknown';
        
        // Save to Firestore
        await saveCPData(mapelId, jenjang, mapelNama, parsed);
        
        hideLoading();
        showToast(`${parsed.length} data CP berhasil diupload!`, 'success');
        loadCPData();
        updateGettingStarted().catch(e => console.log(e));
    } catch (error) {
        hideLoading();
        console.error('CP upload error:', error);
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
    if (!tbody) return;
    
    let html = '';
    
    data.slice(0, 20).forEach(row => {
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
    if (!container) return;
    
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
                        <p class="font-medium text-gray-800">${data.mapelNama || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">${data.jenjang || '-'} • ${kelasCount} kelas</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewCPData('${doc.id}')" class="text-primary hover:text-secondary" title="Lihat">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="deleteCPData('${doc.id}')" class="text-red-500 hover:text-red-700" title="Hapus">
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
        container.innerHTML = '<p class="text-red-500 text-sm text-center py-4">Gagal memuat data</p>';
    }
}

async function loadCPFromUrl() {
    const url = document.getElementById('cpCsvUrl')?.value?.trim();
    if (!url) {
        showToast('Masukkan URL terlebih dahulu!', 'error');
        return;
    }
    
    const mapelId = document.getElementById('cpMapel')?.value;
    const jenjang = document.getElementById('cpJenjang')?.value;
    
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
        const mapelNama = mapelOption?.dataset?.nama || 'Unknown';
        
        await saveCPData(mapelId, jenjang, mapelNama, parsed);
        
        hideLoading();
        showToast(`${parsed.length} data CP berhasil diimport!`, 'success');
        loadCPData();
        updateGettingStarted().catch(e => console.log(e));
    } catch (error) {
        hideLoading();
        console.error('Load CP from URL error:', error);
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
        console.error('Delete CP error:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

function viewCPData(id) {
    // TODO: Implement view CP data modal
    showToast('Fitur lihat data akan segera hadir', 'warning');
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
    
    const selects = ['jadwalKelas', 'siswaKelas', 'atpKelas', 'protaKelas', 'promesKelas',
                     'modulKelas', 'lkpdKelas', 'kktpKelas', 'jurnalKelas', 'absensiKelas', 'nilaiKelas'];
    
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
    
    try {
        // Check kalender
        const tahunAjarSelect = document.getElementById('selectTahunAjar');
        const tahunAjar = tahunAjarSelect?.value || getCurrentAcademicYear().current;
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
    } catch (error) {
        console.log('Update getting started error:', error);
    }
    
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

// ===== UTILITY FUNCTIONS =====
function showLoading(text = 'Memproses...') {
    const loadingText = document.getElementById('loadingText');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (loadingText) loadingText.textContent = text;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    
    if (!toast || !icon || !msg) {
        console.log(`Toast: ${type} - ${message}`);
        return;
    }
    
    msg.textContent = message;
    
    const toastDiv = toast.querySelector('div');
    if (toastDiv) {
        toastDiv.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500');
        
        if (type === 'success') {
            toastDiv.classList.add('border-green-500');
            icon.className = 'fas fa-check-circle text-xl text-green-500';
        } else if (type === 'error') {
            toastDiv.classList.add('border-red-500');
            icon.className = 'fas fa-exclamation-circle text-xl text-red-500';
        } else {
            toastDiv.classList.add('border-yellow-500');
            icon.className = 'fas fa-exclamation-triangle text-xl text-yellow-500';
        }
    }
    
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 4000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

async function showUpgradeModal() {
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
    
    const linkWa = document.getElementById('linkWhatsappUpgrade');
    if (linkWa) {
        linkWa.href = `https://wa.me/${waNumber}?text=${message}`;
    }
    
    const modal = document.getElementById('modalUpgrade');
    if (modal) modal.classList.remove('hidden');
}

function copyPrompt(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const text = el.textContent;
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
        console.error('Logout error:', error);
        showToast('Gagal logout: ' + error.message, 'error');
    }
}

// ===== DOCUMENT GENERATION (Placeholder - will be in separate section) =====
function formatTanggalIndonesia(date) {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function updateDocumentValues(values) {
    Object.keys(values).forEach(key => {
        document.querySelectorAll(`.val-${key}`).forEach(el => {
            el.textContent = values[key];
        });
    });
}

// Make functions global
window.navigateTo = navigateTo;
window.showAddMapelModal = showAddMapelModal;
window.deleteMapel = deleteMapel;
window.showUpgradeModal = showUpgradeModal;
window.closeModal = closeModal;
window.loadCPFromUrl = loadCPFromUrl;
window.deleteCPData = deleteCPData;
window.viewCPData = viewCPData;
window.copyPrompt = copyPrompt;
window.handleLogout = handleLogout;

console.log('app-core.js loaded');
// ============================================
// DOCUMENT GENERATION FUNCTIONS
// ============================================

// ===== ATP (Alur Tujuan Pembelajaran) =====
async function generateATP() {
    const mapelId = document.getElementById('atpMapel')?.value;
    const kelas = document.getElementById('atpKelas')?.value;
    const semester = document.getElementById('atpSemester')?.value;
    
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
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama, jp: 2 };
        const jpPerTp = mapelData?.jp || 2;
        
        // Get kalender info
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            semester: semester.toUpperCase(),
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
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
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-left text-xs"><b>${babName}</b><br><br><span style="color:#374151;">${bab.cp}</span></td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-left text-xs">Peserta didik memahami materi terkait ${babName} dengan baik dan dapat mengimplementasikannya.</td>`;
                }
                
                html += `<td class="border border-black p-2 text-left text-xs"><b>${no}.${iTp + 1}</b> ${tpObj.tp}</td>`;
                html += `<td class="border border-black p-2 text-center text-xs" style="color:#1e40af; font-weight:600;">${tpObj.profil || '-'}</td>`;
                html += `<td class="border border-black p-2 text-center text-xs" style="color:#ca8a04; font-weight:600;">${kompetensi}</td>`;
                
                if (iTp === 0) {
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center text-xs">${babName}</td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center text-xs"><b>${minggu} Minggu<br>${totalJp} JP</b></td>`;
                    html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center"></td>`;
                }
                
                html += `</tr>`;
            });
        });
        
        const bodyATP = document.getElementById('bodyATP');
        if (bodyATP) bodyATP.innerHTML = html;
        
        hideLoading();
        showToast('ATP berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate ATP error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== PROTA (Program Tahunan) =====
async function generateProta() {
    const mapelId = document.getElementById('protaMapel')?.value;
    const kelas = document.getElementById('protaKelas')?.value;
    
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
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama, jp: 2 };
        const jpPerTp = mapelData?.jp || 2;
        
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
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
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 10px;">${babName}</div>
                        </td>`;
                    }
                    
                    html += `<td class="border border-black p-2 text-left text-sm">${tpObj.tp}</td>`;
                    
                    if (iTp === 0) {
                        html += `<td rowspan="${tps.length}" class="border border-black p-2 text-center font-bold">${totalJp} JP</td>`;
                    }
                    
                    html += `</tr>`;
                });
            });
        });
        
        const bodyProta = document.getElementById('bodyProta');
        if (bodyProta) bodyProta.innerHTML = html || '<tr><td colspan="4" class="text-center p-4 text-gray-500">Tidak ada data</td></tr>';
        
        hideLoading();
        showToast('Prota berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate Prota error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== PROMES (Program Semester) =====
async function generatePromes() {
    const mapelId = document.getElementById('promesMapel')?.value;
    const kelas = document.getElementById('promesKelas')?.value;
    const semester = document.getElementById('promesSemester')?.value;
    
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
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama, jp: 2 };
        const jpPerTp = mapelData?.jp || 2;
        
        // Get kalender info
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            semester: semester.toUpperCase(),
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
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
        
        const headPromes = document.getElementById('headPromes');
        if (headPromes) headPromes.innerHTML = headHtml;
        
        // Calculate teaching dates
        const tahunParts = tahunAjar.split('/');
        const tahunOperasional = semester === 'Ganjil' ? parseInt(tahunParts[0]) : parseInt(tahunParts[1]);
        const bulanAwal = semester === 'Ganjil' ? 6 : 0; // Juli (6) atau Januari (0)
        
        // Calculate all teaching dates (default Monday = 1)
        const tanggalMengajar = calculateTanggalMengajar(tahunOperasional, bulanAwal, 1, semester);
        
        // Collect all TPs
        const allTps = [];
        Object.keys(dataKelas.babs).forEach(babName => {
            const bab = dataKelas.babs[babName];
            const tps = bab.tps || [];
            tps.forEach((tpObj, iTp) => {
                allTps.push({
                    babName,
                    tpObj,
                    isFirst: iTp === 0,
                    rowspan: tps.length
                });
            });
        });
        
        // Generate body
        let bodyHtml = '';
        let tglIndex = 0;
        
        allTps.forEach((tp, idx) => {
            bodyHtml += `<tr>`;
            
            if (tp.isFirst) {
                bodyHtml += `<td rowspan="${tp.rowspan}" class="border border-black p-2 text-center bg-gray-50">
                    <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px;">${tp.babName}</div>
                </td>`;
            }
            
            bodyHtml += `<td class="border border-black p-2 text-left text-xs">${tp.tpObj.tp}</td>`;
            bodyHtml += `<td class="border border-black p-2 text-center font-bold">${jpPerTp}</td>`;
            
            // 30 columns for weeks (6 months x 5 weeks)
            for (let col = 0; col < 30; col++) {
                const bulanIdx = Math.floor(col / 5);
                const mingguIdx = col % 5;
                
                // Check if this cell has a teaching date for this TP
                if (tglIndex < tanggalMengajar.length && idx === tglIndex) {
                    const tgl = tanggalMengajar[tglIndex];
                    if (tgl && tgl.bulanIdx === bulanIdx && tgl.minggu === mingguIdx + 1) {
                        bodyHtml += `<td class="border border-black p-1 text-center bg-blue-100">
                            <span class="font-bold text-xs">${jpPerTp}</span>
                            <span class="block text-xs text-red-600">${tgl.tanggal}</span>
                        </td>`;
                        tglIndex++;
                    } else {
                        bodyHtml += `<td class="border border-black p-1"></td>`;
                    }
                } else {
                    bodyHtml += `<td class="border border-black p-1"></td>`;
                }
            }
            
            bodyHtml += `</tr>`;
        });
        
        const bodyPromes = document.getElementById('bodyPromes');
        if (bodyPromes) bodyPromes.innerHTML = bodyHtml || '<tr><td colspan="33" class="text-center p-4 text-gray-500">Tidak ada data</td></tr>';
        
        hideLoading();
        showToast('Promes berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate Promes error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== Helper: Calculate Teaching Dates =====
function calculateTanggalMengajar(tahun, bulanAwal, hariTarget, semester) {
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
                let minggu = Math.ceil(tgl / 7);
                if (minggu > 5) minggu = 5;
                
                // Check if not a holiday
                const dateStr = `${String(bulan + 1).padStart(2, '0')}-${String(tgl).padStart(2, '0')}`;
                const isLibur = LIBUR_BAKU.some(l => l.tanggal === dateStr);
                
                if (!isLibur) {
                    hasil.push({
                        bulanIdx: i,
                        minggu: minggu,
                        tanggal: tgl,
                        dateObj: tanggal
                    });
                }
            }
        }
    }
    
    return hasil;
}

// ===== Helper: Extract Kompetensi =====
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
            'menghitung': 'Menerapkan',
            'memahami': 'Memahami',
            'mengenal': 'Mengingat',
            'menceritakan': 'Memahami'
        };
        return kompetensiMap[kata] || 'Memahami';
    }
    return 'Memahami';
}

// ===== PRINT Document =====
function printDocument(type) {
    const documentId = `document${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const printContents = document.getElementById(documentId);
    
    if (!printContents) {
        showToast('Dokumen tidak ditemukan!', 'error');
        return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Dokumen</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 6px; }
                th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                .bg-gray-50, .bg-gray-100 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
                .bg-blue-100 { background-color: #dbeafe !important; -webkit-print-color-adjust: exact; }
                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .font-bold { font-weight: bold; }
                @page { size: A4; margin: 15mm; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${printContents.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// ===== Save Jam Pelajaran =====
async function saveJamPelajaran() {
    showLoading('Menyimpan...');
    
    try {
        const data = {
            durasiJp: parseInt(document.getElementById('durasiJp')?.value) || 35,
            jamMulai: document.getElementById('jamMulai')?.value || '07:00',
            durasiIstirahat: parseInt(document.getElementById('durasiIstirahat')?.value) || 15,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('settings').doc('jadwal').set(data, { merge: true });
        
        hideLoading();
        showToast('Pengaturan jam pelajaran disimpan!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Save jam pelajaran error:', error);
        showToast('Gagal menyimpan: ' + error.message, 'error');
    }
}


// ============================================
// PREMIUM FEATURE FUNCTIONS
// ============================================

// Check and unlock premium features
function checkPremiumAccess() {
    const isPremium = userData?.subscription === 'premium';
    
    // List of premium section IDs
    const premiumIds = {
        'modulAjar': ['modulAjarLocked', 'modulAjarContent'],
        'lkpd': ['lkpdLocked', 'lkpdContent'],
        'kktp': ['kktpLocked', 'kktpContent'],
        'jurnal': ['jurnalLocked', 'jurnalContent'],
        'absensi': ['absensiLocked', 'absensiContent'],
        'nilai': ['nilaiLocked', 'nilaiContent']
    };
    
    Object.keys(premiumIds).forEach(key => {
        const [lockedId, contentId] = premiumIds[key];
        const locked = document.getElementById(lockedId);
        const content = document.getElementById(contentId);
        
        if (isPremium) {
            if (locked) locked.classList.add('hidden');
            if (content) content.classList.remove('hidden');
        } else {
            if (locked) locked.classList.remove('hidden');
            if (content) content.classList.add('hidden');
        }
    });
    
    // Update premium selects if premium
    if (isPremium) {
        updatePremiumSelects();
    }
}

function updatePremiumSelects() {
    // This will be called after mapel selects are populated
    setTimeout(() => {
        const sourceSelect = document.getElementById('atpMapel');
        const sourceKelas = document.getElementById('atpKelas');
        
        if (!sourceSelect) return;
        
        const premiumMapelSelects = ['modulMapel', 'lkpdMapel', 'kktpMapel', 'jurnalMapel', 'absensiMapel', 'nilaiMapel'];
        const premiumKelasSelects = ['modulKelas', 'lkpdKelas', 'kktpKelas', 'jurnalKelas', 'absensiKelas', 'nilaiKelas'];
        
        premiumMapelSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select && sourceSelect) {
                select.innerHTML = sourceSelect.innerHTML;
            }
        });
        
        premiumKelasSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select && sourceKelas) {
                select.innerHTML = sourceKelas.innerHTML;
            }
        });
    }, 1000);
}

// Initialize premium features
function initPremiumFeatures() {
    checkPremiumAccess();
    
    // Set today's date for absensi
    const today = new Date().toISOString().split('T')[0];
    const absensiTanggal = document.getElementById('absensiTanggal');
    if (absensiTanggal) {
        absensiTanggal.value = today;
    }
}

// ===== MODUL AJAR =====
async function generateModulAjar() {
    const mapelId = document.getElementById('modulMapel')?.value;
    const kelas = document.getElementById('modulKelas')?.value;
    const semester = document.getElementById('modulSemester')?.value;
    const bab = document.getElementById('modulBab')?.value;
    
    if (!mapelId || !kelas || !bab) {
        showToast('Lengkapi semua pilihan terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Modul Ajar...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas || !dataKelas.babs[bab]) {
            hideLoading();
            showToast('Data bab tidak ditemukan!', 'error');
            return;
        }
        
        const babData = dataKelas.babs[bab];
        const tps = babData.tps || [];
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama, jp: 2 };
        const jpPerTp = mapelData?.jp || 2;
        const needArabic = mapelData?.needArabic || false;
        
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        // Update document values
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            semester: semester,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        // Set topik dan JP
        const modulTopik = document.getElementById('modulTopik');
        const modulJp = document.getElementById('modulJp');
        if (modulTopik) modulTopik.textContent = bab;
        if (modulJp) modulJp.textContent = tps.length * jpPerTp;
        
        // Dimensi Profil
        const profilSet = new Set();
        tps.forEach(tp => {
            if (tp.profil) {
                tp.profil.split(',').forEach(p => profilSet.add(p.trim()));
            }
        });
        
        const modulProfil = document.getElementById('modulProfil');
        if (modulProfil) {
            modulProfil.innerHTML = `<ul class="list-disc ml-4">${Array.from(profilSet).map(p => `<li><strong>${p}</strong></li>`).join('')}</ul>`;
        }
        
        // Tujuan Pembelajaran
        const modulTP = document.getElementById('modulTP');
        if (modulTP) {
            let tpHtml = '<ol class="list-decimal ml-4 space-y-2">';
            tps.forEach((tp, i) => {
                tpHtml += `<li><strong>Pertemuan ${i + 1}:</strong> ${tp.tp}</li>`;
            });
            tpHtml += '</ol>';
            modulTP.innerHTML = tpHtml;
        }
        
        // Pemahaman Bermakna
        const modulPemahaman = document.getElementById('modulPemahaman');
        if (modulPemahaman) {
            modulPemahaman.innerHTML = `
                <p>Melalui pembelajaran materi <strong>${bab}</strong>, peserta didik diharapkan dapat:</p>
                <ul class="list-disc ml-4 mt-2">
                    <li>Memahami konsep dasar dan penerapannya dalam kehidupan sehari-hari.</li>
                    <li>Mengembangkan sikap positif sesuai dengan nilai-nilai yang terkandung dalam materi.</li>
                    <li>Menerapkan pemahaman untuk menyelesaikan permasalahan yang relevan.</li>
                </ul>
            `;
        }
        
        // Pertanyaan Pemantik
        const modulPertanyaan = document.getElementById('modulPertanyaan');
        if (modulPertanyaan) {
            modulPertanyaan.innerHTML = `
                <ol class="list-decimal ml-4 space-y-1">
                    <li>Apa yang kalian ketahui tentang ${bab}?</li>
                    <li>Pernahkah kalian mengalami atau melihat contoh terkait materi ini?</li>
                    <li>Mengapa materi ini penting untuk dipelajari?</li>
                </ol>
            `;
        }
        
        // Kegiatan Pembelajaran
        const modulKegiatan = document.getElementById('modulKegiatan');
        if (modulKegiatan) {
            let kegiatanHtml = '';
            tps.forEach((tp, i) => {
                kegiatanHtml += `
                    <div class="mb-4 p-3 bg-gray-50 rounded">
                        <h5 class="font-bold text-blue-600 mb-2">Pertemuan ${i + 1} (${jpPerTp} JP)</h5>
                        <p class="text-xs text-gray-600 mb-2 italic">TP: ${tp.tp}</p>
                        <ul class="list-disc ml-4 space-y-1 text-sm">
                            <li><strong>Pendahuluan (10 menit):</strong> Salam, doa, presensi, apersepsi.</li>
                            <li><strong>Kegiatan Inti (${(jpPerTp * 35) - 20} menit):</strong>
                                <ul class="list-circle ml-4 mt-1">
                                    <li>Eksplorasi: Siswa mengamati/membaca materi.</li>
                                    <li>Elaborasi: Diskusi kelompok dan pengerjaan LKPD.</li>
                                    <li>Konfirmasi: Presentasi dan penguatan dari guru.</li>
                                </ul>
                            </li>
                            <li><strong>Penutup (10 menit):</strong> Refleksi, kesimpulan, doa penutup.</li>
                        </ul>
                    </div>
                `;
            });
            modulKegiatan.innerHTML = kegiatanHtml;
        }
        
        // Show/hide Arabic section
        const modulArabSection = document.getElementById('modulArabSection');
        if (modulArabSection) {
            if (needArabic) {
                modulArabSection.classList.remove('hidden');
            } else {
                modulArabSection.classList.add('hidden');
            }
        }
        
        hideLoading();
        showToast('Modul Ajar berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate Modul Ajar error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== LKPD =====
async function generateLKPD() {
    const mapelId = document.getElementById('lkpdMapel')?.value;
    const kelas = document.getElementById('lkpdKelas')?.value;
    const semester = document.getElementById('lkpdSemester')?.value;
    const bab = document.getElementById('lkpdBab')?.value;
    const pertemuan = parseInt(document.getElementById('lkpdPertemuan')?.value) || 1;
    
    if (!mapelId || !kelas || !bab) {
        showToast('Lengkapi semua pilihan terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating LKPD...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        const babData = dataKelas?.babs[bab];
        
        if (!babData) {
            hideLoading();
            showToast('Data bab tidak ditemukan!', 'error');
            return;
        }
        
        const tps = babData.tps || [];
        const selectedTP = tps[pertemuan - 1] || tps[0];
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama };
        const needArabic = mapelData?.needArabic || false;
        
        // Update values
        updateDocumentValues({
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas
        });
        
        // Set TP
        const lkpdTP = document.getElementById('lkpdTP');
        if (lkpdTP) {
            lkpdTP.innerHTML = `<strong>Pertemuan ${pertemuan}:</strong> ${selectedTP.tp}`;
        }
        
        // Set Materi
        const lkpdMateri = document.getElementById('lkpdMateri');
        if (lkpdMateri) lkpdMateri.textContent = bab;
        
        // Show/hide Arabic section
        const lkpdArabSection = document.getElementById('lkpdArabSection');
        if (lkpdArabSection) {
            if (needArabic) {
                lkpdArabSection.classList.remove('hidden');
            } else {
                lkpdArabSection.classList.add('hidden');
            }
        }
        
        hideLoading();
        showToast('LKPD berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate LKPD error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== KKTP =====
async function generateKKTP() {
    const mapelId = document.getElementById('kktpMapel')?.value;
    const kelas = document.getElementById('kktpKelas')?.value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating KKTP...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama };
        
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas,
            fase: getFaseByKelas(kelas),
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        let html = '';
        let no = 0;
        
        ['Ganjil', 'Genap'].forEach(semester => {
            const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
            if (!dataKelas) return;
            
            Object.keys(dataKelas.babs).forEach(babName => {
                const bab = dataKelas.babs[babName];
                const tps = bab.tps || [];
                
                tps.forEach((tp, iTp) => {
                    no++;
                    html += `
                        <tr>
                            ${iTp === 0 ? `
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center">${Math.ceil(no / tps.length)}</td>
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center">${semester}</td>
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center bg-gray-50">
                                    <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px;">${babName}</div>
                                </td>
                            ` : ''}
                            <td class="border border-black p-2 text-left text-xs">${tp.tp}</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-blue-100 font-bold kktp-result">75</td>
                        </tr>
                    `;
                    no = iTp === 0 ? no : no - 1;
                });
                no++;
            });
        });
        
        const bodyKktp = document.getElementById('bodyKktp');
        if (bodyKktp) bodyKktp.innerHTML = html || '<tr><td colspan="8" class="text-center p-4 text-gray-500">Tidak ada data</td></tr>';
        
        hideLoading();
        showToast('KKTP berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate KKTP error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function hitungKKTP(element) {
    const row = element.closest('tr');
    const inputs = row.querySelectorAll('[contenteditable="true"]');
    const result = row.querySelector('.kktp-result');
    
    if (inputs.length >= 3 && result) {
        let total = 0;
        let count = 0;
        inputs.forEach(input => {
            const val = parseInt(input.textContent);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        });
        if (count > 0) {
            result.textContent = Math.round(total / count);
        }
    }
}

// ===== JURNAL =====
async function generateJurnal() {
    const mapelId = document.getElementById('jurnalMapel')?.value;
    const kelas = document.getElementById('jurnalKelas')?.value;
    const semester = document.getElementById('jurnalSemester')?.value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Jurnal...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas) {
            hideLoading();
            showToast(`Data untuk kelas ${kelas} semester ${semester} tidak ditemukan!`, 'error');
            return;
        }
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: cpDataDoc.mapelNama };
        
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        
        updateDocumentValues({
            tahun: tahunAjar,
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            semester: semester,
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        let html = '';
        let no = 0;
        
        Object.keys(dataKelas.babs).forEach(babName => {
            const bab = dataKelas.babs[babName];
            const tps = bab.tps || [];
            
            tps.forEach((tp) => {
                no++;
                html += `
                    <tr>
                        <td class="border border-black p-2 text-center">${no}</td>
                        <td class="border border-black p-2 text-center">${kelas} / ${getFaseByKelas(kelas)}</td>
                        <td class="border border-black p-2 text-left text-xs">${babName}</td>
                        <td class="border border-black p-2 text-left text-xs">${tp.tp}</td>
                        <td class="border border-black p-2 text-center" contenteditable="true">... / ...</td>
                        <td class="border border-black p-2 text-center" contenteditable="true">.../.../...</td>
                        <td class="border border-black p-2 text-xs" contenteditable="true">Tersampaikan dengan baik</td>
                        <td class="border border-black p-2 text-xs" contenteditable="true">Terlaksana sesuai jadwal</td>
                    </tr>
                `;
            });
        });
        
        const bodyJurnal = document.getElementById('bodyJurnal');
        if (bodyJurnal) bodyJurnal.innerHTML = html || '<tr><td colspan="8" class="text-center p-4 text-gray-500">Tidak ada data</td></tr>';
        
        hideLoading();
        showToast('Jurnal berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Generate Jurnal error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== ABSENSI =====
async function loadAbsensi() {
    const kelas = document.getElementById('absensiKelas')?.value;
    const tanggal = document.getElementById('absensiTanggal')?.value;
    
    if (!kelas || !tanggal) {
        showToast('Pilih kelas dan tanggal terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Memuat data siswa...');
    
    try {
        const siswaSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .orderBy('nama', 'asc')
            .get();
        
        let html = '';
        let no = 0;
        
        if (siswaSnapshot.empty) {
            html = '<tr><td colspan="5" class="text-center text-gray-500 py-8">Tidak ada data siswa untuk kelas ini. Tambahkan data siswa terlebih dahulu.</td></tr>';
        } else {
            siswaSnapshot.forEach(doc => {
                no++;
                const siswa = doc.data();
                
                html += `
                    <tr>
                        <td class="text-center">${no}</td>
                        <td>${siswa.nisn || '-'}</td>
                        <td>${siswa.nama}</td>
                        <td class="text-center">${siswa.jenisKelamin || '-'}</td>
                        <td>
                            <div class="flex gap-2 justify-center" data-siswa-id="${doc.id}">
                                <label class="flex items-center gap-1 px-3 py-1 rounded bg-green-500 text-white cursor-pointer">
                                    <input type="radio" name="absen_${doc.id}" value="H" checked class="hidden" onchange="updateAbsensiUI(this)">
                                    <span>H</span>
                                </label>
                                <label class="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 cursor-pointer">
                                    <input type="radio" name="absen_${doc.id}" value="I" class="hidden" onchange="updateAbsensiUI(this)">
                                    <span>I</span>
                                </label>
                                <label class="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 cursor-pointer">
                                    <input type="radio" name="absen_${doc.id}" value="S" class="hidden" onchange="updateAbsensiUI(this)">
                                    <span>S</span>
                                </label>
                                <label class="flex items-center gap-1 px-3 py-1 rounded bg-gray-100 cursor-pointer">
                                    <input type="radio" name="absen_${doc.id}" value="A" class="hidden" onchange="updateAbsensiUI(this)">
                                    <span>A</span>
                                </label>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        const bodyAbsensi = document.getElementById('bodyAbsensi');
        if (bodyAbsensi) bodyAbsensi.innerHTML = html;
        
        updateAbsensiStats();
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load absensi error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function updateAbsensiUI(input) {
    const label = input.closest('label');
    const container = input.closest('[data-siswa-id]');
    
    // Reset all labels
    container.querySelectorAll('label').forEach(l => {
        l.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-red-500', 'text-white');
        l.classList.add('bg-gray-100');
    });
    
    // Highlight selected
    const colorMap = { 'H': 'bg-green-500', 'I': 'bg-yellow-500', 'S': 'bg-blue-500', 'A': 'bg-red-500' };
    label.classList.remove('bg-gray-100');
    label.classList.add(colorMap[input.value], 'text-white');
    
    updateAbsensiStats();
}

function updateAbsensiStats() {
    let h = 0, i = 0, s = 0, a = 0;
    
    document.querySelectorAll('#bodyAbsensi input[type="radio"]:checked').forEach(input => {
        if (input.value === 'H') h++;
        else if (input.value === 'I') i++;
        else if (input.value === 'S') s++;
        else if (input.value === 'A') a++;
    });
    
    const absensiHadir = document.getElementById('absensiHadir');
    const absensiIzin = document.getElementById('absensiIzin');
    const absensiSakit = document.getElementById('absensiSakit');
    const absensiAlpha = document.getElementById('absensiAlpha');
    
    if (absensiHadir) absensiHadir.textContent = h;
    if (absensiIzin) absensiIzin.textContent = i;
    if (absensiSakit) absensiSakit.textContent = s;
    if (absensiAlpha) absensiAlpha.textContent = a;
}

async function saveAbsensi() {
    const mapelId = document.getElementById('absensiMapel')?.value;
    const kelas = document.getElementById('absensiKelas')?.value;
    const tanggal = document.getElementById('absensiTanggal')?.value;
    
    if (!kelas || !tanggal) {
        showToast('Pilih kelas dan tanggal terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Menyimpan absensi...');
    
    try {
        const detail = {};
        let hadir = 0, total = 0;
        
        document.querySelectorAll('#bodyAbsensi [data-siswa-id]').forEach(container => {
            const siswaId = container.dataset.siswaId;
            const checked = container.querySelector('input:checked');
            if (checked) {
                detail[siswaId] = checked.value;
                if (checked.value === 'H') hadir++;
                total++;
            }
        });
        
        await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .doc(`${kelas}-${mapelId || 'all'}-${tanggal}`)
            .set({
                kelas,
                mapelId: mapelId || null,
                tanggal,
                detail,
                hadir,
                total,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        hideLoading();
        showToast('Absensi berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Save absensi error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== DAFTAR NILAI =====
async function loadNilai() {
    const mapelId = document.getElementById('nilaiMapel')?.value;
    const kelas = document.getElementById('nilaiKelas')?.value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Memuat data nilai...');
    
    try {
        const siswaSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .orderBy('nama', 'asc')
            .get();
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.exists ? mapelDoc.data() : { nama: 'Mata Pelajaran' };
        
        const tahunAjar = document.getElementById('selectTahunAjar')?.value || getCurrentAcademicYear().current;
        const semester = document.getElementById('nilaiSemester')?.value || 'Ganjil';
        
        updateDocumentValues({
            tahun: tahunAjar,
            mapel: mapelData?.nama || '',
            kelas: kelas,
            semester: semester,
            kepsek: userData?.kepsek || '',
            'nip-kepsek': userData?.nipKepsek || '',
            guru: userData?.nama || '',
            'nip-guru': userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        let html = '';
        let no = 0;
        
        if (siswaSnapshot.empty) {
            html = '<tr><td colspan="11" class="border border-black p-4 text-center text-gray-500">Tidak ada data siswa</td></tr>';
        } else {
            siswaSnapshot.forEach(doc => {
                no++;
                const siswa = doc.data();
                
                html += `
                    <tr data-siswa-id="${doc.id}">
                        <td class="border border-black p-2 text-center">${no}</td>
                        <td class="border border-black p-2">${siswa.nisn || '-'}</td>
                        <td class="border border-black p-2">${siswa.nama}</td>
                        <td class="border border-black p-2 text-center">${siswa.jenisKelamin || '-'}</td>
                        <td class="border border-black p-2 text-center bg-blue-50" contenteditable="true" data-field="sum1" oninput="hitungNA(this)"></td>
                        <td class="border border-black p-2 text-center bg-blue-50" contenteditable="true" data-field="sum2" oninput="hitungNA(this)"></td>
                        <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" data-field="ats" oninput="hitungNA(this)"></td>
                        <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" data-field="asas" oninput="hitungNA(this)"></td>
                        <td class="border border-black p-2 text-center bg-green-100 font-bold nilai-na"></td>
                        <td class="border border-black p-2 text-center bg-green-100 font-bold nilai-predikat"></td>
                        <td class="border border-black p-2 text-center" contenteditable="true"></td>
                    </tr>
                `;
            });
        }
        
        const bodyNilai = document.getElementById('bodyNilai');
        if (bodyNilai) bodyNilai.innerHTML = html;
        
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Load nilai error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function hitungNA(element) {
    const row = element.closest('tr');
    const fields = row.querySelectorAll('[data-field]');
    const naCell = row.querySelector('.nilai-na');
    const predikatCell = row.querySelector('.nilai-predikat');
    
    let total = 0;
    let count = 0;
    
    fields.forEach(field => {
        const val = parseInt(field.textContent);
        if (!isNaN(val) && val > 0) {
            total += val;
            count++;
        }
    });
    
    if (count > 0 && naCell && predikatCell) {
        const na = Math.round(total / count);
        naCell.textContent = na;
        
        let predikat = '';
        if (na >= 90) predikat = 'A';
        else if (na >= 80) predikat = 'B';
        else if (na >= 70) predikat = 'C';
        else predikat = 'D';
        predikatCell.textContent = predikat;
    } else if (naCell && predikatCell) {
        naCell.textContent = '';
        predikatCell.textContent = '';
    }
}

async function saveNilai() {
    const mapelId = document.getElementById('nilaiMapel')?.value;
    const kelas = document.getElementById('nilaiKelas')?.value;
    const semester = document.getElementById('nilaiSemester')?.value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Menyimpan nilai...');
    
    try {
        const detail = {};
        
        document.querySelectorAll('#bodyNilai tr[data-siswa-id]').forEach(row => {
            const siswaId = row.dataset.siswaId;
            detail[siswaId] = {
                sum1: parseInt(row.querySelector('[data-field="sum1"]')?.textContent) || 0,
                sum2: parseInt(row.querySelector('[data-field="sum2"]')?.textContent) || 0,
                ats: parseInt(row.querySelector('[data-field="ats"]')?.textContent) || 0,
                asas: parseInt(row.querySelector('[data-field="asas"]')?.textContent) || 0
            };
        });
        
        await db.collection('users').doc(currentUser.uid)
            .collection('nilai')
            .doc(`${kelas}-${mapelId}-${semester}`)
            .set({
                kelas,
                mapelId,
                semester,
                detail,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        hideLoading();
        showToast('Nilai berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Save nilai error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function updateNilaiTable() {
    // Placeholder - will update table based on selected components
    console.log('Update nilai table');
}


// ============================================
// MAKE ALL FUNCTIONS GLOBAL
// ============================================
window.generateATP = generateATP;
window.generateProta = generateProta;
window.generatePromes = generatePromes;
window.printDocument = printDocument;
window.saveJamPelajaran = saveJamPelajaran;

// Premium functions
window.generateModulAjar = generateModulAjar;
window.generateLKPD = generateLKPD;
window.generateKKTP = generateKKTP;
window.generateJurnal = generateJurnal;
window.loadAbsensi = loadAbsensi;
window.saveAbsensi = saveAbsensi;
window.loadNilai = loadNilai;
window.saveNilai = saveNilai;
window.hitungKKTP = hitungKKTP;
window.hitungNA = hitungNA;
window.updateAbsensiUI = updateAbsensiUI;
window.updateAbsensiStats = updateAbsensiStats;
window.checkPremiumAccess = checkPremiumAccess;
window.initPremiumFeatures = initPremiumFeatures;
window.updateNilaiTable = updateNilaiTable;
// ============================================
// JADWAL PELAJARAN FUNCTIONS
// ============================================

// Show Add Jadwal Modal
function showAddJadwalModal() {
    // Create modal if not exists
    let modal = document.getElementById('modalAddJadwal');
    if (!modal) {
        modal = createAddJadwalModal();
        document.body.appendChild(modal);
    }
    
    // Populate mapel select
    const mapelSelect = document.getElementById('jadwalMapelInput');
    const sourceMapel = document.getElementById('cpMapel');
    if (mapelSelect && sourceMapel) {
        mapelSelect.innerHTML = sourceMapel.innerHTML;
    }
    
    modal.classList.remove('hidden');
}

function createAddJadwalModal() {
    const modal = document.createElement('div');
    modal.id = 'modalAddJadwal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-md p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-clock mr-2 text-primary"></i>Tambah Jadwal Pelajaran
            </h3>
            <form id="formAddJadwal" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                    <select id="jadwalKelasInput" class="w-full px-4 py-2 border rounded-lg" required>
                        <option value="">Pilih Kelas</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                    <input type="text" id="jadwalRombelInput" class="w-full px-4 py-2 border rounded-lg" placeholder="A, B, C, dll" value="A">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                    <select id="jadwalMapelInput" class="w-full px-4 py-2 border rounded-lg" required>
                        <option value="">Pilih Mapel</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                    <select id="jadwalHariInput" class="w-full px-4 py-2 border rounded-lg" required>
                        <option value="1">Senin</option>
                        <option value="2">Selasa</option>
                        <option value="3">Rabu</option>
                        <option value="4">Kamis</option>
                        <option value="5">Jumat</option>
                        <option value="6">Sabtu</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jam Ke</label>
                        <input type="number" id="jadwalJamKeInput" class="w-full px-4 py-2 border rounded-lg" min="1" max="12" value="1" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah JP</label>
                        <input type="number" id="jadwalJumlahJpInput" class="w-full px-4 py-2 border rounded-lg" min="1" max="8" value="2" required>
                    </div>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="closeModal('modalAddJadwal')" class="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                        <i class="fas fa-plus mr-2"></i>Tambah
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Populate kelas select
    setTimeout(() => {
        const kelasSelect = document.getElementById('jadwalKelasInput');
        const sourceKelas = document.getElementById('jadwalKelas');
        if (kelasSelect && sourceKelas) {
            kelasSelect.innerHTML = sourceKelas.innerHTML;
        }
        
        // Add form submit handler
        const form = document.getElementById('formAddJadwal');
        if (form) {
            form.addEventListener('submit', addJadwal);
        }
    }, 100);
    
    return modal;
}

async function addJadwal(e) {
    e.preventDefault();
    showLoading('Menyimpan jadwal...');
    
    try {
        const kelas = document.getElementById('jadwalKelasInput')?.value;
        const rombel = document.getElementById('jadwalRombelInput')?.value || 'A';
        const mapelId = document.getElementById('jadwalMapelInput')?.value;
        const hari = parseInt(document.getElementById('jadwalHariInput')?.value);
        const jamKe = parseInt(document.getElementById('jadwalJamKeInput')?.value);
        const jumlahJp = parseInt(document.getElementById('jadwalJumlahJpInput')?.value);
        
        if (!kelas || !mapelId) {
            hideLoading();
            showToast('Lengkapi semua field!', 'error');
            return;
        }
        
        // Get mapel name
        const mapelOption = document.querySelector(`#jadwalMapelInput option[value="${mapelId}"]`);
        const mapelNama = mapelOption?.textContent || 'Unknown';
        
        // Check for conflicts
        const conflict = await checkJadwalConflict(kelas, rombel, hari, jamKe, jumlahJp);
        if (conflict) {
            hideLoading();
            showToast(conflict, 'error');
            return;
        }
        
        const data = {
            kelas,
            rombel,
            mapelId,
            mapelNama,
            hari,
            jamKe,
            jumlahJp,
            guruId: currentUser.uid,
            guruNama: userData?.nama || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').add(data);
        
        hideLoading();
        closeModal('modalAddJadwal');
        showToast('Jadwal berhasil ditambahkan!', 'success');
        
        // Reload jadwal table
        loadJadwalTable(kelas);
        updateGettingStarted().catch(e => console.log(e));
        
    } catch (error) {
        hideLoading();
        console.error('Add jadwal error:', error);
        showToast('Gagal menambah jadwal: ' + error.message, 'error');
    }
}

async function checkJadwalConflict(kelas, rombel, hari, jamKe, jumlahJp) {
    try {
        // Check if same guru already teaching at this time (any class)
        const guruJadwal = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('hari', '==', hari)
            .get();
        
        for (const doc of guruJadwal.docs) {
            const jadwal = doc.data();
            const jadwalStart = jadwal.jamKe;
            const jadwalEnd = jadwal.jamKe + jadwal.jumlahJp - 1;
            const newStart = jamKe;
            const newEnd = jamKe + jumlahJp - 1;
            
            // Check overlap
            if (newStart <= jadwalEnd && newEnd >= jadwalStart) {
                if (jadwal.kelas !== kelas || jadwal.rombel !== rombel) {
                    return `Anda sudah mengajar di kelas ${jadwal.kelas}${jadwal.rombel} pada jam tersebut!`;
                }
            }
        }
        
        return null; // No conflict
    } catch (error) {
        console.error('Check conflict error:', error);
        return null;
    }
}

async function loadJadwalTable(kelas) {
    const tbody = document.getElementById('bodyJadwal');
    if (!tbody || !kelas) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-gray-500 py-8">Pilih kelas untuk melihat jadwal</td></tr>';
        }
        return;
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('kelas', '==', kelas)
            .orderBy('hari', 'asc')
            .orderBy('jamKe', 'asc')
            .get();
        
        // Get jam settings
        const settingsDoc = await db.collection('users').doc(currentUser.uid)
            .collection('settings').doc('jadwal').get();
        const settings = settingsDoc.exists ? settingsDoc.data() : { durasiJp: 35, jamMulai: '07:00' };
        
        // Create schedule grid
        const schedule = {};
        for (let jam = 1; jam <= 10; jam++) {
            schedule[jam] = { 1: '-', 2: '-', 3: '-', 4: '-', 5: '-', 6: '-' };
        }
        
        snapshot.forEach(doc => {
            const jadwal = doc.data();
            for (let i = 0; i < jadwal.jumlahJp; i++) {
                const jamKe = jadwal.jamKe + i;
                if (schedule[jamKe]) {
                    schedule[jamKe][jadwal.hari] = `
                        <div class="bg-blue-100 p-1 rounded text-xs">
                            <strong>${jadwal.mapelNama}</strong>
                            <br><span class="text-gray-500">${jadwal.rombel}</span>
                            <button onclick="deleteJadwal('${doc.id}', '${kelas}')" class="ml-1 text-red-500 hover:text-red-700">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }
            }
        });
        
        // Calculate times
        const startTime = settings.jamMulai.split(':');
        let startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        
        let html = '';
        for (let jam = 1; jam <= 10; jam++) {
            const endMinutes = startMinutes + settings.durasiJp;
            const startStr = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`;
            const endStr = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
            
            html += `
                <tr>
                    <td class="text-center font-bold">${jam}</td>
                    <td class="text-center text-xs text-gray-500">${startStr} - ${endStr}</td>
                    <td class="text-center">${schedule[jam][1]}</td>
                    <td class="text-center">${schedule[jam][2]}</td>
                    <td class="text-center">${schedule[jam][3]}</td>
                    <td class="text-center">${schedule[jam][4]}</td>
                    <td class="text-center">${schedule[jam][5]}</td>
                    <td class="text-center">${schedule[jam][6]}</td>
                </tr>
            `;
            
            startMinutes = endMinutes;
            
            // Add break after jam ke 4
            if (jam === 4) {
                startMinutes += settings.durasiIstirahat || 15;
            }
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Load jadwal error:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-red-500 py-8">Gagal memuat jadwal</td></tr>';
    }
}

async function deleteJadwal(jadwalId, kelas) {
    if (!confirm('Hapus jadwal ini?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').doc(jadwalId).delete();
        
        showToast('Jadwal dihapus', 'success');
        loadJadwalTable(kelas);
    } catch (error) {
        console.error('Delete jadwal error:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

// Event listener for kelas select change
document.getElementById('jadwalKelas')?.addEventListener('change', function() {
    loadJadwalTable(this.value);
});


// ============================================
// DATA SISWA FUNCTIONS
// ============================================

function showAddSiswaModal() {
    let modal = document.getElementById('modalAddSiswa');
    if (!modal) {
        modal = createAddSiswaModal();
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}

function createAddSiswaModal() {
    const modal = document.createElement('div');
    modal.id = 'modalAddSiswa';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-md p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-user-plus mr-2 text-primary"></i>Tambah Siswa
            </h3>
            <form id="formAddSiswa" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                    <input type="text" id="siswaNisn" class="w-full px-4 py-2 border rounded-lg" placeholder="10 digit NISN">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <input type="text" id="siswaNama" class="w-full px-4 py-2 border rounded-lg" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                        <select id="siswaJk" class="w-full px-4 py-2 border rounded-lg" required>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="siswaKelasInput" class="w-full px-4 py-2 border rounded-lg" required>
                            <option value="">Pilih</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                    <input type="text" id="siswaRombel" class="w-full px-4 py-2 border rounded-lg" placeholder="A, B, C, dll" value="A">
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="closeModal('modalAddSiswa')" class="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                        <i class="fas fa-plus mr-2"></i>Tambah
                    </button>
                </div>
            </form>
        </div>
    `;
    
    setTimeout(() => {
        const kelasSelect = document.getElementById('siswaKelasInput');
        const sourceKelas = document.getElementById('siswaKelas');
        if (kelasSelect && sourceKelas) {
            kelasSelect.innerHTML = sourceKelas.innerHTML;
        }
        
        const form = document.getElementById('formAddSiswa');
        if (form) {
            form.addEventListener('submit', addSiswa);
        }
    }, 100);
    
    return modal;
}

async function addSiswa(e) {
    e.preventDefault();
    showLoading('Menambah siswa...');
    
    try {
        const data = {
            nisn: document.getElementById('siswaNisn')?.value || '',
            nama: document.getElementById('siswaNama')?.value || '',
            jenisKelamin: document.getElementById('siswaJk')?.value || 'L',
            kelas: document.getElementById('siswaKelasInput')?.value || '',
            rombel: document.getElementById('siswaRombel')?.value || 'A',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!data.nama || !data.kelas) {
            hideLoading();
            showToast('Nama dan kelas wajib diisi!', 'error');
            return;
        }
        
        await db.collection('users').doc(currentUser.uid)
            .collection('siswa').add(data);
        
        hideLoading();
        closeModal('modalAddSiswa');
        showToast('Siswa berhasil ditambahkan!', 'success');
        loadSiswaTable();
        
        // Reset form
        document.getElementById('formAddSiswa')?.reset();
        
    } catch (error) {
        hideLoading();
        console.error('Add siswa error:', error);
        showToast('Gagal menambah siswa: ' + error.message, 'error');
    }
}

function showImportSiswaModal() {
    let modal = document.getElementById('modalImportSiswa');
    if (!modal) {
        modal = createImportSiswaModal();
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}

function createImportSiswaModal() {
    const modal = document.createElement('div');
    modal.id = 'modalImportSiswa';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-file-import mr-2 text-green-500"></i>Import Data Siswa
            </h3>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p class="text-yellow-800 text-sm">
                    <strong>Format CSV (delimiter koma):</strong><br>
                    nisn,nama,jenis_kelamin,kelas,rombel<br><br>
                    <strong>Contoh:</strong><br>
                    0012345678,Ahmad Fauzi,L,7,A<br>
                    0012345679,Siti Aisyah,P,7,A
                </p>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Upload File CSV</label>
                    <input type="file" id="importSiswaFile" accept=".csv" class="w-full px-4 py-2 border rounded-lg">
                </div>
                
                <p class="text-center text-gray-500 text-sm">atau</p>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">URL Google Spreadsheet (CSV)</label>
                    <input type="url" id="importSiswaUrl" class="w-full px-4 py-2 border rounded-lg" placeholder="https://docs.google.com/spreadsheets/.../export?format=csv">
                </div>
            </div>
            
            <div class="flex gap-3 pt-6">
                <button type="button" onclick="closeModal('modalImportSiswa')" class="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                    Batal
                </button>
                <button type="button" onclick="importSiswa()" class="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600">
                    <i class="fas fa-upload mr-2"></i>Import
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

async function importSiswa() {
    const fileInput = document.getElementById('importSiswaFile');
    const urlInput = document.getElementById('importSiswaUrl');
    
    let csvText = '';
    
    showLoading('Mengimport data siswa...');
    
    try {
        if (fileInput?.files?.length > 0) {
            csvText = await fileInput.files[0].text();
        } else if (urlInput?.value) {
            const response = await fetch(urlInput.value);
            csvText = await response.text();
        } else {
            hideLoading();
            showToast('Pilih file atau masukkan URL!', 'error');
            return;
        }
        
        const lines = csvText.split('\n');
        let imported = 0;
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',');
            if (cols.length < 4) continue;
            
            const data = {
                nisn: cols[0]?.trim() || '',
                nama: cols[1]?.trim() || '',
                jenisKelamin: cols[2]?.trim()?.toUpperCase() || 'L',
                kelas: cols[3]?.trim() || '',
                rombel: cols[4]?.trim() || 'A',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (data.nama && data.kelas) {
                await db.collection('users').doc(currentUser.uid)
                    .collection('siswa').add(data);
                imported++;
            }
        }
        
        hideLoading();
        closeModal('modalImportSiswa');
        showToast(`${imported} siswa berhasil diimport!`, 'success');
        loadSiswaTable();
        
    } catch (error) {
        hideLoading();
        console.error('Import siswa error:', error);
        showToast('Gagal import: ' + error.message, 'error');
    }
}

async function loadSiswaTable(filterKelas = '') {
    const tbody = document.getElementById('bodySiswa');
    if (!tbody) return;
    
    try {
        let query = db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .orderBy('kelas', 'asc')
            .orderBy('nama', 'asc');
        
        if (filterKelas) {
            query = db.collection('users').doc(currentUser.uid)
                .collection('siswa')
                .where('kelas', '==', filterKelas)
                .orderBy('nama', 'asc');
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-500 py-8">Belum ada data siswa</td></tr>';
            document.getElementById('statSiswa').textContent = '0';
            return;
        }
        
        let html = '';
        let no = 0;
        
        snapshot.forEach(doc => {
            no++;
            const siswa = doc.data();
            html += `
                <tr>
                    <td class="text-center">${no}</td>
                    <td>${siswa.nisn || '-'}</td>
                    <td>${siswa.nama}</td>
                    <td class="text-center">${siswa.jenisKelamin || '-'}</td>
                    <td class="text-center">${siswa.kelas}</td>
                    <td class="text-center">${siswa.rombel || '-'}</td>
                    <td class="text-center">
                        <button onclick="deleteSiswa('${doc.id}')" class="text-red-500 hover:text-red-700" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Update stats
        const statSiswa = document.getElementById('statSiswa');
        if (statSiswa) statSiswa.textContent = no;
        
    } catch (error) {
        console.error('Load siswa error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-500 py-8">Gagal memuat data</td></tr>';
    }
}

async function deleteSiswa(siswaId) {
    if (!confirm('Hapus data siswa ini?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('siswa').doc(siswaId).delete();
        
        showToast('Siswa dihapus', 'success');
        loadSiswaTable();
    } catch (error) {
        console.error('Delete siswa error:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}

// Event listener for siswa kelas filter
document.getElementById('siswaKelas')?.addEventListener('change', function() {
    loadSiswaTable(this.value);
});


// ============================================
// HARI LIBUR TAMBAHAN FUNCTIONS
// ============================================

function showAddLiburModal() {
    let modal = document.getElementById('modalAddLibur');
    if (!modal) {
        modal = createAddLiburModal();
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}

function createAddLiburModal() {
    const modal = document.createElement('div');
    modal.id = 'modalAddLibur';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl w-full max-w-md p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-calendar-times mr-2 text-red-500"></i>Tambah Hari Libur
            </h3>
            <form id="formAddLibur" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input type="date" id="liburTanggal" class="w-full px-4 py-2 border rounded-lg" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <input type="text" id="liburKeterangan" class="w-full px-4 py-2 border rounded-lg" placeholder="Contoh: Libur Hari Raya" required>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="closeModal('modalAddLibur')" class="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
                        <i class="fas fa-plus mr-2"></i>Tambah
                    </button>
                </div>
            </form>
        </div>
    `;
    
    setTimeout(() => {
        const form = document.getElementById('formAddLibur');
        if (form) {
            form.addEventListener('submit', addLibur);
        }
    }, 100);
    
    return modal;
}

async function addLibur(e) {
    e.preventDefault();
    showLoading('Menambah hari libur...');
    
    try {
        const tanggal = document.getElementById('liburTanggal')?.value;
        const keterangan = document.getElementById('liburKeterangan')?.value;
        
        if (!tanggal || !keterangan) {
            hideLoading();
            showToast('Lengkapi semua field!', 'error');
            return;
        }
        
        await db.collection('users').doc(currentUser.uid)
            .collection('liburTambahan').add({
                tanggal,
                keterangan,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        hideLoading();
        closeModal('modalAddLibur');
        showToast('Hari libur ditambahkan!', 'success');
        loadLiburTambahan();
        
        // Reset form
        document.getElementById('formAddLibur')?.reset();
        
    } catch (error) {
        hideLoading();
        console.error('Add libur error:', error);
        showToast('Gagal menambah: ' + error.message, 'error');
    }
}

async function loadLiburTambahan() {
    const container = document.getElementById('liburTambahan');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('liburTambahan')
            .orderBy('tanggal', 'asc')
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">Belum ada libur tambahan</p>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const libur = doc.data();
            const date = new Date(libur.tanggal);
            const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            
            html += `
                <div class="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div>
                        <span class="font-medium text-red-800">${dateStr}</span>
                        <span class="text-sm text-red-600 ml-2">${libur.keterangan}</span>
                    </div>
                    <button onclick="deleteLibur('${doc.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load libur error:', error);
        container.innerHTML = '<p class="text-red-500 text-sm">Gagal memuat data</p>';
    }
}

async function deleteLibur(liburId) {
    if (!confirm('Hapus hari libur ini?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('liburTambahan').doc(liburId).delete();
        
        showToast('Hari libur dihapus', 'success');
        loadLiburTambahan();
    } catch (error) {
        console.error('Delete libur error:', error);
        showToast('Gagal menghapus: ' + error.message, 'error');
    }
}


// ============================================
// UPDATE initializeUI to load additional data
// ============================================

// Override initializeUI to include new data loading
const _originalInitializeUI = initializeUI;
initializeUI = function() {
    _originalInitializeUI();
    
    // Load additional data
    setTimeout(() => {
        loadSiswaTable().catch(e => console.log('Siswa load skipped:', e.message));
        loadLiburTambahan().catch(e => console.log('Libur load skipped:', e.message));
        
        // Setup jadwal kelas change listener
        const jadwalKelas = document.getElementById('jadwalKelas');
        if (jadwalKelas) {
            jadwalKelas.addEventListener('change', function() {
                loadJadwalTable(this.value);
            });
        }
        
        // Setup siswa kelas change listener
        const siswaKelas = document.getElementById('siswaKelas');
        if (siswaKelas) {
            siswaKelas.addEventListener('change', function() {
                loadSiswaTable(this.value);
            });
        }
    }, 500);
};


// ============================================
// MAKE JADWAL, SISWA, LIBUR FUNCTIONS GLOBAL
// ============================================

// Jadwal functions
window.showAddJadwalModal = showAddJadwalModal;
window.addJadwal = addJadwal;
window.deleteJadwal = deleteJadwal;
window.loadJadwalTable = loadJadwalTable;

// Siswa functions
window.showAddSiswaModal = showAddSiswaModal;
window.showImportSiswaModal = showImportSiswaModal;
window.addSiswa = addSiswa;
window.importSiswa = importSiswa;
window.deleteSiswa = deleteSiswa;
window.loadSiswaTable = loadSiswaTable;

// Libur functions
window.showAddLiburModal = showAddLiburModal;
window.addLibur = addLibur;
window.deleteLibur = deleteLibur;
window.loadLiburTambahan = loadLiburTambahan;

console.log('Jadwal, Siswa, Libur functions loaded');
console.log('Document generation functions loaded');
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
// ===== PREMIUM FEATURE FUNCTIONS =====

// Check and unlock premium features
function checkPremiumAccess() {
    const isPremium = userData?.subscription === 'premium';
    
    const premiumSections = ['modul-ajar', 'lkpd', 'kktp', 'jurnal', 'absensi', 'nilai'];
    
    premiumSections.forEach(section => {
        const locked = document.getElementById(`${section.replace('-', '')}Locked`) || 
                       document.getElementById(`${section}Locked`);
        const content = document.getElementById(`${section.replace('-', '')}Content`) ||
                       document.getElementById(`${section}Content`);
        
        // Handle different ID formats
        const lockedEl = document.getElementById(`modulAjarLocked`) ||
                        document.getElementById(`lkpdLocked`) ||
                        document.getElementById(`kktpLocked`) ||
                        document.getElementById(`jurnalLocked`) ||
                        document.getElementById(`absensiLocked`) ||
                        document.getElementById(`nilaiLocked`);
        
        if (isPremium) {
            // Hide locked, show content
            document.querySelectorAll('[id$="Locked"]').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('[id$="Content"]').forEach(el => el.classList.remove('hidden'));
        } else {
            // Show locked, hide content
            document.querySelectorAll('[id$="Locked"]').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('[id$="Content"]').forEach(el => el.classList.add('hidden'));
        }
    });
    
    // Update premium selects
    if (isPremium) {
        updatePremiumSelects();
    }
}

function updatePremiumSelects() {
    const selects = [
        'modulMapel', 'modulKelas', 
        'lkpdMapel', 'lkpdKelas',
        'kktpMapel', 'kktpKelas',
        'jurnalMapel', 'jurnalKelas',
        'absensiMapel', 'absensiKelas',
        'nilaiMapel', 'nilaiKelas'
    ];
    
    // Copy options from existing selects
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        if (selectId.includes('Mapel')) {
            // Copy from cpMapel or atpMapel
            const source = document.getElementById('atpMapel');
            if (source) {
                select.innerHTML = source.innerHTML;
            }
        } else if (selectId.includes('Kelas')) {
            // Copy from atpKelas
            const source = document.getElementById('atpKelas');
            if (source) {
                select.innerHTML = source.innerHTML;
            }
        }
    });
}

// ===== MODUL AJAR =====
async function generateModulAjar() {
    const mapelId = document.getElementById('modulMapel').value;
    const kelas = document.getElementById('modulKelas').value;
    const semester = document.getElementById('modulSemester').value;
    const bab = document.getElementById('modulBab').value;
    
    if (!mapelId || !kelas || !bab) {
        showToast('Lengkapi semua pilihan terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Modul Ajar...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas || !dataKelas.babs[bab]) {
            hideLoading();
            showToast('Data bab tidak ditemukan!', 'error');
            return;
        }
        
        const babData = dataKelas.babs[bab];
        const tps = babData.tps || [];
        
        // Get mapel info
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const jpPerTp = mapelData?.jp || 2;
        const needArabic = mapelData?.needArabic || false;
        
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
        
        // Set topik dan JP
        document.getElementById('modulTopik').textContent = bab;
        document.getElementById('modulJp').textContent = tps.length * jpPerTp;
        
        // Dimensi Profil
        const profilSet = new Set();
        tps.forEach(tp => {
            if (tp.profil) {
                tp.profil.split(',').forEach(p => profilSet.add(p.trim()));
            }
        });
        document.getElementById('modulProfil').innerHTML = `
            <ul class="list-disc ml-4">
                ${Array.from(profilSet).map(p => `<li><strong>${p}</strong></li>`).join('')}
            </ul>
        `;
        
        // Tujuan Pembelajaran
        let tpHtml = '<ol class="list-decimal ml-4 space-y-2">';
        tps.forEach((tp, i) => {
            tpHtml += `<li><strong>Pertemuan ${i + 1}:</strong> ${tp.tp}</li>`;
        });
        tpHtml += '</ol>';
        document.getElementById('modulTP').innerHTML = tpHtml;
        
        // Pemahaman Bermakna
        document.getElementById('modulPemahaman').innerHTML = `
            <p>Melalui pembelajaran materi <strong>${bab}</strong>, peserta didik diharapkan dapat:</p>
            <ul class="list-disc ml-4 mt-2">
                <li>Memahami konsep dasar dan penerapannya dalam kehidupan sehari-hari.</li>
                <li>Mengembangkan sikap positif sesuai dengan nilai-nilai yang terkandung dalam materi.</li>
                <li>Menerapkan pemahaman untuk menyelesaikan permasalahan yang relevan.</li>
            </ul>
        `;
        
        // Pertanyaan Pemantik
        document.getElementById('modulPertanyaan').innerHTML = `
            <ol class="list-decimal ml-4 space-y-1">
                <li>Apa yang kalian ketahui tentang ${bab}?</li>
                <li>Pernahkah kalian mengalami atau melihat contoh terkait materi ini?</li>
                <li>Mengapa materi ini penting untuk dipelajari?</li>
            </ol>
        `;
        
        // Kegiatan Pembelajaran
        let kegiatanHtml = '';
        tps.forEach((tp, i) => {
            kegiatanHtml += `
                <div class="mb-4 p-3 bg-gray-50 rounded">
                    <h5 class="font-bold text-primary mb-2">Pertemuan ${i + 1} (${jpPerTp} JP)</h5>
                    <p class="text-xs text-gray-600 mb-2"><em>TP: ${tp.tp}</em></p>
                    <ul class="list-disc ml-4 space-y-1">
                        <li><strong>Pendahuluan (10 menit):</strong> Salam, doa, presensi, apersepsi dengan pertanyaan pemantik.</li>
                        <li><strong>Kegiatan Inti (${(jpPerTp * 35) - 20} menit):</strong>
                            <ul class="list-circle ml-4 mt-1">
                                <li>Eksplorasi: Siswa mengamati/membaca materi secara mandiri.</li>
                                <li>Elaborasi: Diskusi kelompok dan pengerjaan LKPD.</li>
                                <li>Konfirmasi: Presentasi hasil dan penguatan dari guru.</li>
                            </ul>
                        </li>
                        <li><strong>Penutup (10 menit):</strong> Refleksi, kesimpulan bersama, informasi pertemuan selanjutnya, doa penutup.</li>
                    </ul>
                </div>
            `;
        });
        document.getElementById('modulKegiatan').innerHTML = kegiatanHtml;
        
        // Show/hide Arabic section
        if (needArabic) {
            document.getElementById('modulArabSection').classList.remove('hidden');
        } else {
            document.getElementById('modulArabSection').classList.add('hidden');
        }
        
        hideLoading();
        showToast('Modul Ajar berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

// Event listener untuk update bab options
document.getElementById('modulMapel')?.addEventListener('change', updateModulBabOptions);
document.getElementById('modulKelas')?.addEventListener('change', updateModulBabOptions);
document.getElementById('modulSemester')?.addEventListener('change', updateModulBabOptions);

async function updateModulBabOptions() {
    const mapelId = document.getElementById('modulMapel').value;
    const kelas = document.getElementById('modulKelas').value;
    const semester = document.getElementById('modulSemester').value;
    const babSelect = document.getElementById('modulBab');
    
    babSelect.innerHTML = '<option value="">Pilih Bab</option>';
    
    if (!mapelId || !kelas) return;
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (cpDoc.exists) {
            const data = cpDoc.data().data[`${kelas}-${semester}`];
            if (data && data.babs) {
                Object.keys(data.babs).forEach(bab => {
                    const option = document.createElement('option');
                    option.value = bab;
                    option.textContent = bab;
                    babSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading bab options:', error);
    }
}

// ===== LKPD =====
async function generateLKPD() {
    const mapelId = document.getElementById('lkpdMapel').value;
    const kelas = document.getElementById('lkpdKelas').value;
    const semester = document.getElementById('lkpdSemester').value;
    const bab = document.getElementById('lkpdBab').value;
    const pertemuan = parseInt(document.getElementById('lkpdPertemuan').value) || 1;
    
    if (!mapelId || !kelas || !bab) {
        showToast('Lengkapi semua pilihan terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating LKPD...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        const babData = dataKelas?.babs[bab];
        
        if (!babData) {
            hideLoading();
            showToast('Data bab tidak ditemukan!', 'error');
            return;
        }
        
        const tps = babData.tps || [];
        const selectedTP = tps[pertemuan - 1] || tps[0];
        
        // Get mapel info
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const needArabic = mapelData?.needArabic || false;
        
        // Update values
        updateDocumentValues({
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            kelas: kelas
        });
        
        // Set TP
        document.getElementById('lkpdTP').innerHTML = `
            <strong>Pertemuan ${pertemuan}:</strong> ${selectedTP.tp}
        `;
        
        // Set Materi
        document.getElementById('lkpdMateri').textContent = bab;
        
        // Show/hide Arabic section
        if (needArabic) {
            document.getElementById('lkpdArabSection').classList.remove('hidden');
        } else {
            document.getElementById('lkpdArabSection').classList.add('hidden');
        }
        
        hideLoading();
        showToast('LKPD berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== KKTP =====
async function generateKKTP() {
    const mapelId = document.getElementById('kktpMapel').value;
    const kelas = document.getElementById('kktpKelas').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating KKTP...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        
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
        
        let html = '';
        let no = 0;
        
        ['Ganjil', 'Genap'].forEach(semester => {
            const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
            if (!dataKelas) return;
            
            Object.keys(dataKelas.babs).forEach(babName => {
                const bab = dataKelas.babs[babName];
                const tps = bab.tps || [];
                
                tps.forEach((tp, iTp) => {
                    no++;
                    html += `
                        <tr>
                            ${iTp === 0 ? `
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center">${Math.ceil(no / tps.length)}</td>
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center">${semester}</td>
                                <td rowspan="${tps.length}" class="border border-black p-2 text-center bg-gray-50">
                                    <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px;">${babName}</div>
                                </td>
                            ` : ''}
                            <td class="border border-black p-2 text-left">${tp.tp}</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" oninput="hitungKKTP(this)">75</td>
                            <td class="border border-black p-2 text-center bg-blue-100 font-bold kktp-result">75</td>
                        </tr>
                    `;
                    no = iTp === 0 ? no : no - 1;
                });
                no++;
            });
        });
        
        document.getElementById('bodyKktp').innerHTML = html;
        
        hideLoading();
        showToast('KKTP berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

function hitungKKTP(element) {
    const row = element.closest('tr');
    const inputs = row.querySelectorAll('[contenteditable="true"]');
    const result = row.querySelector('.kktp-result');
    
    if (inputs.length === 3 && result) {
        let total = 0;
        inputs.forEach(input => {
            total += parseInt(input.textContent) || 0;
        });
        result.textContent = Math.round(total / 3);
    }
}

// ===== JURNAL =====
async function generateJurnal() {
    const mapelId = document.getElementById('jurnalMapel').value;
    const kelas = document.getElementById('jurnalKelas').value;
    const semester = document.getElementById('jurnalSemester').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Generating Jurnal...');
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (!cpDoc.exists) {
            hideLoading();
            showToast('Data CP tidak ditemukan!', 'error');
            return;
        }
        
        const cpDataDoc = cpDoc.data();
        const dataKelas = cpDataDoc.data[`${kelas}-${semester}`];
        
        if (!dataKelas) {
            hideLoading();
            showToast(`Data untuk kelas ${kelas} semester ${semester} tidak ditemukan!`, 'error');
            return;
        }
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        const jpPerTp = mapelData?.jp || 2;
        
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        
        updateDocumentValues({
            tahun: tahunAjar,
            sekolah: userData?.sekolah || '',
            mapel: mapelData?.nama || cpDataDoc.mapelNama,
            semester: semester,
            kepsek: userData?.kepsek || '',
            nipKepsek: userData?.nipKepsek || '',
            guru: userData?.nama || '',
            nipGuru: userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        // Get absensi data for this class
        const absensiSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .where('kelas', '==', kelas)
            .where('mapelId', '==', mapelId)
            .orderBy('tanggal', 'asc')
            .get();
        
        const absensiData = {};
        absensiSnapshot.forEach(doc => {
            const data = doc.data();
            absensiData[data.tanggal] = data;
        });
        
        // Calculate teaching dates
        const tahunParts = tahunAjar.split('/');
        const tahunOperasional = semester === 'Ganjil' ? parseInt(tahunParts[0]) : parseInt(tahunParts[1]);
        const bulanAwal = semester === 'Ganjil' ? 6 : 0;
        
        const tanggalMengajar = calculateTanggalMengajar(tahunOperasional, bulanAwal, 1, semester, {});
        
        let html = '';
        let no = 0;
        let dateIndex = 0;
        
        Object.keys(dataKelas.babs).forEach(babName => {
            const bab = dataKelas.babs[babName];
            const tps = bab.tps || [];
            
            tps.forEach((tp, iTp) => {
                no++;
                const tglObj = tanggalMengajar[dateIndex];
                const tanggalStr = tglObj ? formatTanggalIndonesia(tglObj.dateObj) : '...';
                const hariStr = tglObj ? HARI[tglObj.dateObj.getDay()] : '...';
                
                // Get absensi for this date
                let kehadiranStr = '... / ...';
                if (tglObj) {
                    const dateKey = tglObj.dateObj.toISOString().split('T')[0];
                    const absensi = absensiData[dateKey];
                    if (absensi) {
                        kehadiranStr = `${absensi.hadir || 0} / ${absensi.total || 0}`;
                    }
                }
                
                html += `
                    <tr>
                        <td class="border border-black p-2 text-center">${no}</td>
                        <td class="border border-black p-2 text-center">${kelas} / ${getFaseByKelas(kelas)}</td>
                        <td class="border border-black p-2 text-left">${babName}</td>
                        <td class="border border-black p-2 text-left">${tp.tp}</td>
                        <td class="border border-black p-2 text-center">${kehadiranStr}</td>
                        <td class="border border-black p-2 text-center" contenteditable="true">${hariStr}, ${tanggalStr}</td>
                        <td class="border border-black p-2" contenteditable="true">
                            <select class="w-full border-0 bg-transparent text-xs">
                                <option>Tersampaikan dengan baik</option>
                                <option>Perlu diulang</option>
                                <option>Sebagian tersampaikan</option>
                            </select>
                        </td>
                        <td class="border border-black p-2" contenteditable="true">
                            <select class="w-full border-0 bg-transparent text-xs">
                                <option>Terlaksana sesuai jadwal</option>
                                <option>Terlaksana di hari berikutnya</option>
                                <option>Tidak terlaksana</option>
                            </select>
                        </td>
                    </tr>
                `;
                
                dateIndex++;
            });
        });
        
        document.getElementById('bodyJurnal').innerHTML = html;
        
        hideLoading();
        showToast('Jurnal berhasil di-generate!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

// ===== ABSENSI =====
async function loadAbsensi() {
    const mapelId = document.getElementById('absensiMapel').value;
    const kelas = document.getElementById('absensiKelas').value;
    const tanggal = document.getElementById('absensiTanggal').value;
    
    if (!kelas || !tanggal) {
        showToast('Pilih kelas dan tanggal terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Memuat data siswa...');
    
    try {
        // Get students
        const siswaSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .orderBy('nama', 'asc')
            .get();
        
        // Get existing absensi
        const absensiDoc = await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .doc(`${kelas}-${mapelId}-${tanggal}`)
            .get();
        
        const existingAbsensi = absensiDoc.exists ? absensiDoc.data().detail || {} : {};
        
        let html = '';
        let no = 0;
        
        siswaSnapshot.forEach(doc => {
            no++;
            const siswa = doc.data();
            const status = existingAbsensi[doc.id] || 'H';
            
            html += `
                <tr>
                    <td class="text-center">${no}</td>
                    <td>${siswa.nisn || '-'}</td>
                    <td>${siswa.nama}</td>
                    <td class="text-center">${siswa.jenisKelamin || '-'}</td>
                    <td>
                        <div class="flex gap-2 justify-center" data-siswa-id="${doc.id}">
                            <label class="flex items-center gap-1 px-3 py-1 rounded ${status === 'H' ? 'bg-green-500 text-white' : 'bg-gray-100'} cursor-pointer">
                                <input type="radio" name="absen_${doc.id}" value="H" ${status === 'H' ? 'checked' : ''} class="hidden" onchange="updateAbsensiUI(this)">
                                <span>H</span>
                            </label>
                            <label class="flex items-center gap-1 px-3 py-1 rounded ${status === 'I' ? 'bg-yellow-500 text-white' : 'bg-gray-100'} cursor-pointer">
                                <input type="radio" name="absen_${doc.id}" value="I" ${status === 'I' ? 'checked' : ''} class="hidden" onchange="updateAbsensiUI(this)">
                                <span>I</span>
                            </label>
                            <label class="flex items-center gap-1 px-3 py-1 rounded ${status === 'S' ? 'bg-blue-500 text-white' : 'bg-gray-100'} cursor-pointer">
                                <input type="radio" name="absen_${doc.id}" value="S" ${status === 'S' ? 'checked' : ''} class="hidden" onchange="updateAbsensiUI(this)">
                                <span>S</span>
                            </label>
                            <label class="flex items-center gap-1 px-3 py-1 rounded ${status === 'A' ? 'bg-red-500 text-white' : 'bg-gray-100'} cursor-pointer">
                                <input type="radio" name="absen_${doc.id}" value="A" ${status === 'A' ? 'checked' : ''} class="hidden" onchange="updateAbsensiUI(this)">
                                <span>A</span>
                            </label>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        if (no === 0) {
            html = '<tr><td colspan="5" class="text-center text-gray-500 py-8">Tidak ada data siswa untuk kelas ini</td></tr>';
        }
        
        document.getElementById('bodyAbsensi').innerHTML = html;
        updateAbsensiStats();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

function updateAbsensiUI(input) {
    const label = input.closest('label');
    const container = input.closest('[data-siswa-id]');
    
    // Reset all labels in this container
    container.querySelectorAll('label').forEach(l => {
        l.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-red-500', 'text-white');
        l.classList.add('bg-gray-100');
    });
    
    // Highlight selected
    const colorMap = { 'H': 'bg-green-500', 'I': 'bg-yellow-500', 'S': 'bg-blue-500', 'A': 'bg-red-500' };
    label.classList.remove('bg-gray-100');
    label.classList.add(colorMap[input.value], 'text-white');
    
    updateAbsensiStats();
}

function updateAbsensiStats() {
    let h = 0, i = 0, s = 0, a = 0;
    
    document.querySelectorAll('#bodyAbsensi input[type="radio"]:checked').forEach(input => {
        if (input.value === 'H') h++;
        else if (input.value === 'I') i++;
        else if (input.value === 'S') s++;
        else if (input.value === 'A') a++;
    });
    
    document.getElementById('absensiHadir').textContent = h;
    document.getElementById('absensiIzin').textContent = i;
    document.getElementById('absensiSakit').textContent = s;
    document.getElementById('absensiAlpha').textContent = a;
}

async function saveAbsensi() {
    const mapelId = document.getElementById('absensiMapel').value;
    const kelas = document.getElementById('absensiKelas').value;
    const tanggal = document.getElementById('absensiTanggal').value;
    
    if (!kelas || !tanggal) {
        showToast('Pilih kelas dan tanggal terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Menyimpan absensi...');
    
    try {
        const detail = {};
        let hadir = 0, total = 0;
        
        document.querySelectorAll('#bodyAbsensi [data-siswa-id]').forEach(container => {
            const siswaId = container.dataset.siswaId;
            const checked = container.querySelector('input:checked');
            if (checked) {
                detail[siswaId] = checked.value;
                if (checked.value === 'H') hadir++;
                total++;
            }
        });
        
        await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .doc(`${kelas}-${mapelId}-${tanggal}`)
            .set({
                kelas,
                mapelId,
                tanggal,
                detail,
                hadir,
                total,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        hideLoading();
        showToast('Absensi berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== DAFTAR NILAI =====
async function loadNilai() {
    const mapelId = document.getElementById('nilaiMapel').value;
    const kelas = document.getElementById('nilaiKelas').value;
    const semester = document.getElementById('nilaiSemester').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Memuat data nilai...');
    
    try {
        // Get students
        const siswaSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .orderBy('nama', 'asc')
            .get();
        
        // Get existing nilai
        const nilaiDoc = await db.collection('users').doc(currentUser.uid)
            .collection('nilai')
            .doc(`${kelas}-${mapelId}-${semester}`)
            .get();
        
        const existingNilai = nilaiDoc.exists ? nilaiDoc.data().detail || {} : {};
        
        const mapelDoc = await db.collection('users').doc(currentUser.uid)
            .collection('mapelDiampu').doc(mapelId).get();
        const mapelData = mapelDoc.data();
        
        const tahunAjar = document.getElementById('selectTahunAjar').value;
        
        updateDocumentValues({
            tahun: tahunAjar,
            mapel: mapelData?.nama || '',
            kelas: kelas,
            semester: semester,
            kepsek: userData?.kepsek || '',
            nipKepsek: userData?.nipKepsek || '',
            guru: userData?.nama || '',
            nipGuru: userData?.nip || '',
            kota: userData?.kota || '',
            tanggal: formatTanggalIndonesia(new Date())
        });
        
        let html = '';
        let no = 0;
        
        siswaSnapshot.forEach(doc => {
            no++;
            const siswa = doc.data();
            const nilai = existingNilai[doc.id] || {};
            
            const sum1 = nilai.sum1 || '';
            const sum2 = nilai.sum2 || '';
            const ats = nilai.ats || '';
            const asas = nilai.asas || '';
            
            // Calculate NA
            let na = '';
            let predikat = '';
            const nilaiArr = [sum1, sum2, ats, asas].filter(n => n !== '');
            if (nilaiArr.length > 0) {
                na = Math.round(nilaiArr.reduce((a, b) => a + parseInt(b), 0) / nilaiArr.length);
                if (na >= 90) predikat = 'A';
                else if (na >= 80) predikat = 'B';
                else if (na >= 70) predikat = 'C';
                else predikat = 'D';
            }
            
            html += `
                <tr data-siswa-id="${doc.id}">
                    <td class="border border-black p-2 text-center">${no}</td>
                    <td class="border border-black p-2">${siswa.nisn || '-'}</td>
                    <td class="border border-black p-2">${siswa.nama}</td>
                    <td class="border border-black p-2 text-center">${siswa.jenisKelamin || '-'}</td>
                    <td class="border border-black p-2 text-center bg-blue-50" contenteditable="true" data-field="sum1" oninput="hitungNA(this)">${sum1}</td>
                    <td class="border border-black p-2 text-center bg-blue-50" contenteditable="true" data-field="sum2" oninput="hitungNA(this)">${sum2}</td>
                    <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" data-field="ats" oninput="hitungNA(this)">${ats}</td>
                    <td class="border border-black p-2 text-center bg-yellow-50" contenteditable="true" data-field="asas" oninput="hitungNA(this)">${asas}</td>
                    <td class="border border-black p-2 text-center bg-green-100 font-bold nilai-na">${na}</td>
                    <td class="border border-black p-2 text-center bg-green-100 font-bold nilai-predikat">${predikat}</td>
                    <td class="border border-black p-2 text-center" contenteditable="true">${predikat === 'D' ? 'Perlu bimbingan' : ''}</td>
                </tr>
            `;
        });
        
        if (no === 0) {
            html = '<tr><td colspan="11" class="border border-black p-4 text-center text-gray-500">Tidak ada data siswa</td></tr>';
        }
        
        document.getElementById('bodyNilai').innerHTML = html;
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

function hitungNA(element) {
    const row = element.closest('tr');
    const fields = row.querySelectorAll('[data-field]');
    const naCell = row.querySelector('.nilai-na');
    const predikatCell = row.querySelector('.nilai-predikat');
    
    let total = 0;
    let count = 0;
    
    fields.forEach(field => {
        const val = parseInt(field.textContent);
        if (!isNaN(val) && val > 0) {
            total += val;
            count++;
        }
    });
    
    if (count > 0) {
        const na = Math.round(total / count);
        naCell.textContent = na;
        
        let predikat = '';
        if (na >= 90) predikat = 'A';
        else if (na >= 80) predikat = 'B';
        else if (na >= 70) predikat = 'C';
        else predikat = 'D';
        predikatCell.textContent = predikat;
    } else {
        naCell.textContent = '';
        predikatCell.textContent = '';
    }
}

async function saveNilai() {
    const mapelId = document.getElementById('nilaiMapel').value;
    const kelas = document.getElementById('nilaiKelas').value;
    const semester = document.getElementById('nilaiSemester').value;
    
    if (!mapelId || !kelas) {
        showToast('Pilih mapel dan kelas terlebih dahulu!', 'error');
        return;
    }
    
    showLoading('Menyimpan nilai...');
    
    try {
        const detail = {};
        
        document.querySelectorAll('#bodyNilai tr[data-siswa-id]').forEach(row => {
            const siswaId = row.dataset.siswaId;
            detail[siswaId] = {
                sum1: parseInt(row.querySelector('[data-field="sum1"]').textContent) || 0,
                sum2: parseInt(row.querySelector('[data-field="sum2"]').textContent) || 0,
                ats: parseInt(row.querySelector('[data-field="ats"]').textContent) || 0,
                asas: parseInt(row.querySelector('[data-field="asas"]').textContent) || 0
            };
        });
        
        await db.collection('users').doc(currentUser.uid)
            .collection('nilai')
            .doc(`${kelas}-${mapelId}-${semester}`)
            .set({
                kelas,
                mapelId,
                semester,
                detail,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        hideLoading();
        showToast('Nilai berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

// ===== INITIALIZATION FOR PREMIUM =====
// Call this after user data is loaded
function initPremiumFeatures() {
    checkPremiumAccess();
    
    // Set today's date for absensi
    const today = new Date().toISOString().split('T')[0];
    const absensiTanggal = document.getElementById('absensiTanggal');
    if (absensiTanggal) {
        absensiTanggal.value = today;
    }
    
    // Setup event listeners for LKPD bab selection
    ['lkpdMapel', 'lkpdKelas', 'lkpdSemester'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateLkpdBabOptions);
        }
    });
    
    document.getElementById('lkpdBab')?.addEventListener('change', updateLkpdPertemuanOptions);
}

async function updateLkpdBabOptions() {
    const mapelId = document.getElementById('lkpdMapel').value;
    const kelas = document.getElementById('lkpdKelas').value;
    const semester = document.getElementById('lkpdSemester').value;
    const babSelect = document.getElementById('lkpdBab');
    const pertemuanSelect = document.getElementById('lkpdPertemuan');
    
    babSelect.innerHTML = '<option value="">Pilih Bab</option>';
    pertemuanSelect.innerHTML = '<option value="">Pilih Pertemuan</option>';
    
    if (!mapelId || !kelas) return;
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (cpDoc.exists) {
            const data = cpDoc.data().data[`${kelas}-${semester}`];
            if (data && data.babs) {
                Object.keys(data.babs).forEach(bab => {
                    const option = document.createElement('option');
                    option.value = bab;
                    option.textContent = bab;
                    babSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading bab options:', error);
    }
}

async function updateLkpdPertemuanOptions() {
    const mapelId = document.getElementById('lkpdMapel').value;
    const kelas = document.getElementById('lkpdKelas').value;
    const semester = document.getElementById('lkpdSemester').value;
    const bab = document.getElementById('lkpdBab').value;
    const pertemuanSelect = document.getElementById('lkpdPertemuan');
    
    pertemuanSelect.innerHTML = '<option value="">Pilih Pertemuan</option>';
    
    if (!mapelId || !kelas || !bab) return;
    
    try {
        const jenjang = userData?.jenjang?.toLowerCase() || 'sd';
        const cpDoc = await db.collection('users').doc(currentUser.uid)
            .collection('cpData').doc(`${mapelId}-${jenjang}`).get();
        
        if (cpDoc.exists) {
            const data = cpDoc.data().data[`${kelas}-${semester}`];
            if (data && data.babs && data.babs[bab]) {
                const tps = data.babs[bab].tps || [];
                tps.forEach((tp, i) => {
                    const option = document.createElement('option');
                    option.value = i + 1;
                    option.textContent = `Pertemuan ${i + 1}`;
                    pertemuanSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading pertemuan options:', error);
    }
}

// Update initializeUI to include premium features
const originalInitializeUI = initializeUI;
initializeUI = function() {
    originalInitializeUI();
    setTimeout(initPremiumFeatures, 500);
};

// Make functions global
window.generateModulAjar = generateModulAjar;
window.generateLKPD = generateLKPD;
window.generateKKTP = generateKKTP;
window.generateJurnal = generateJurnal;
window.loadAbsensi = loadAbsensi;
window.saveAbsensi = saveAbsensi;
window.loadNilai = loadNilai;
window.saveNilai = saveNilai;
window.hitungKKTP = hitungKKTP;
window.hitungNA = hitungNA;
window.updateAbsensiUI = updateAbsensiUI;
window.checkPremiumAccess = checkPremiumAccess;



