// =====================================================
// GURU SMART - MAIN APPLICATION (app.js)
// =====================================================

import { 
    db, 
    collection, 
    doc, 
    addDoc, 
    setDoc,
    getDoc,
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    COLLECTIONS,
    DIMENSI_PROFIL_LULUSAN,
    JENJANG,
    DEFAULT_SUBJECTS
} from './firebase-config.js';

// =====================================================
// GLOBAL STATE
// =====================================================
const APP_STATE = {
    currentUser: null,
    currentSchool: null,
    currentTab: 'dashboard',
    masterData: [],
    subjects: [],
    schedules: [],
    calendarEvents: [],
    isLoading: false
};

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        // Check for saved user data
        const savedUser = localStorage.getItem('guruSmartUser');
        if (savedUser) {
            APP_STATE.currentUser = JSON.parse(savedUser);
            APP_STATE.currentSchool = APP_STATE.currentUser.school;
            updateUserDisplay();
        }
        
        // Load initial data
        await loadAllData();
        
        // Render dashboard
        renderTabContent('dashboard');
        
        // Hide loading screen
        document.getElementById('loadingScreen').style.display = 'none';
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Gagal memuat aplikasi', 'error');
        document.getElementById('loadingScreen').style.display = 'none';
    }
}

// =====================================================
// DATA LOADING
// =====================================================
async function loadAllData() {
    try {
        if (!APP_STATE.currentUser?.npsn) {
            return;
        }
        
        const npsn = APP_STATE.currentUser.npsn;
        
        // Load master data (CP)
        const masterQuery = query(
            collection(db, COLLECTIONS.MASTER_DATA),
            where('npsn', '==', npsn)
        );
        const masterSnapshot = await getDocs(masterQuery);
        APP_STATE.masterData = masterSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load subjects
        const subjectsQuery = query(
            collection(db, COLLECTIONS.SUBJECTS),
            where('npsn', '==', npsn)
        );
        const subjectsSnapshot = await getDocs(subjectsQuery);
        APP_STATE.subjects = subjectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load schedules
        const schedulesQuery = query(
            collection(db, COLLECTIONS.SCHEDULES),
            where('npsn', '==', npsn)
        );
        const schedulesSnapshot = await getDocs(schedulesQuery);
        APP_STATE.schedules = schedulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load calendar events
        const calendarQuery = query(
            collection(db, COLLECTIONS.CALENDAR),
            where('npsn', '==', npsn)
        );
        const calendarSnapshot = await getDocs(calendarQuery);
        APP_STATE.calendarEvents = calendarSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// =====================================================
// NAVIGATION
// =====================================================
window.switchTab = function(tabId) {
    APP_STATE.currentTab = tabId;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'profil': 'Profil & Sekolah',
        'master-cp': 'Input CP (Master Data)',
        'mata-pelajaran': 'Mata Pelajaran',
        'atp': 'Alur Tujuan Pembelajaran',
        'kktp': 'Kriteria Ketercapaian Tujuan Pembelajaran',
        'prota': 'Program Tahunan',
        'promes': 'Program Semester',
        'kalender': 'Kalender Pendidikan',
        'jadwal': 'Jadwal Pelajaran',
        'modul-ajar': 'Modul Ajar',
        'lkpd': 'Lembar Kerja Peserta Didik',
        'bank-soal': 'Bank Soal'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || 'Dashboard';
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        toggleSidebar();
    }
    
    // Render content
    renderTabContent(tabId);
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
};

// =====================================================
// TAB CONTENT RENDERER
// =====================================================
function renderTabContent(tabId) {
    const container = document.getElementById('contentContainer');
    
    switch(tabId) {
        case 'dashboard':
            container.innerHTML = renderDashboard();
            break;
        case 'profil':
            container.innerHTML = renderProfilPage();
            initProfilPage();
            break;
        case 'master-cp':
            container.innerHTML = renderMasterCPPage();
            initMasterCPPage();
            break;
        case 'mata-pelajaran':
            container.innerHTML = renderSubjectsPage();
            initSubjectsPage();
            break;
        case 'atp':
            container.innerHTML = renderATPPage();
            initATPPage();
            break;
        case 'kktp':
            container.innerHTML = renderKKTPPage();
            initKKTPPage();
            break;
        case 'prota':
            container.innerHTML = renderProtaPage();
            initProtaPage();
            break;
        case 'promes':
            container.innerHTML = renderPromesPage();
            initPromesPage();
            break;
        case 'kalender':
            container.innerHTML = renderKalenderPage();
            initKalenderPage();
            break;
        case 'jadwal':
            container.innerHTML = renderJadwalPage();
            initJadwalPage();
            break;
        case 'modul-ajar':
            container.innerHTML = renderModulAjarPage();
            initModulAjarPage();
            break;
        case 'lkpd':
            container.innerHTML = renderLKPDPage();
            initLKPDPage();
            break;
        case 'bank-soal':
            container.innerHTML = renderBankSoalPage();
            initBankSoalPage();
            break;
        default:
            container.innerHTML = renderDashboard();
    }
}

// =====================================================
// DASHBOARD
// =====================================================
function renderDashboard() {
    const user = APP_STATE.currentUser;
    const isLoggedIn = !!user?.npsn;
    
    if (!isLoggedIn) {
        return `
            <div class="max-w-2xl mx-auto">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="text-center mb-8">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-chalkboard-teacher text-blue-600 text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800">Selamat Datang di Guru Smart</h2>
                        <p class="text-gray-600 mt-2">Sistem Administrasi Guru Terpadu</p>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-yellow-500 mt-0.5 mr-3"></i>
                            <p class="text-sm text-yellow-700">
                                Silakan lengkapi profil dan data sekolah Anda terlebih dahulu untuk mengakses semua fitur.
                            </p>
                        </div>
                    </div>
                    
                    <button onclick="switchTab('profil')" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <i class="fas fa-user-edit mr-2"></i>
                        Lengkapi Profil Sekarang
                    </button>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="space-y-6">
            <!-- Welcome Card -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 class="text-2xl font-bold">Selamat Datang, ${user.nama}!</h2>
                        <p class="text-blue-100 mt-1">${user.schoolName || 'Sekolah'} - NPSN: ${user.npsn}</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <span class="px-4 py-2 bg-white/20 rounded-lg text-sm">
                            ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white rounded-xl p-6 shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Capaian Pembelajaran</p>
                            <p class="text-2xl font-bold text-gray-800 mt-1">${APP_STATE.masterData.length}</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-database text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Mata Pelajaran</p>
                            <p class="text-2xl font-bold text-gray-800 mt-1">${APP_STATE.subjects.length}</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-book text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Jadwal Pelajaran</p>
                            <p class="text-2xl font-bold text-gray-800 mt-1">${APP_STATE.schedules.length}</p>
                        </div>
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-clock text-purple-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-sm card-hover">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Event Kalender</p>
                            <p class="text-2xl font-bold text-gray-800 mt-1">${APP_STATE.calendarEvents.length}</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-calendar text-orange-600"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <button onclick="switchTab('master-cp')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-plus-circle text-2xl text-blue-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">Input CP</span>
                    </button>
                    <button onclick="switchTab('atp')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-sitemap text-2xl text-green-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">Buat ATP</span>
                    </button>
                    <button onclick="switchTab('modul-ajar')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-file-alt text-2xl text-purple-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">Modul Ajar</span>
                    </button>
                    <button onclick="switchTab('jadwal')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-clock text-2xl text-orange-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">Jadwal</span>
                    </button>
                    <button onclick="switchTab('lkpd')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-file-signature text-2xl text-red-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">LKPD</span>
                    </button>
                    <button onclick="switchTab('bank-soal')" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                        <i class="fas fa-question-circle text-2xl text-indigo-600 mb-2"></i>
                        <span class="text-sm text-gray-700 text-center">Bank Soal</span>
                    </button>
                </div>
            </div>
            
            <!-- 8 Dimensi Profil Lulusan -->
            <div class="bg-white rounded-xl p-6 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    <i class="fas fa-star text-yellow-500 mr-2"></i>
                    8 Dimensi Profil Lulusan
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${DIMENSI_PROFIL_LULUSAN.map((dim, index) => `
                        <div class="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                            <div class="flex items-center mb-2">
                                <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                                    ${index + 1}
                                </div>
                                <h4 class="font-semibold text-gray-800 text-sm">${dim.nama}</h4>
                            </div>
                            <p class="text-xs text-gray-600">${dim.deskripsi}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// =====================================================
// PROFIL PAGE
// =====================================================
function renderProfilPage() {
    const user = APP_STATE.currentUser || {};
    const jenjangOptions = Object.entries(JENJANG).map(([key, val]) => 
        `<option value="${key}" ${user.jenjang === key ? 'selected' : ''}>${val.nama}</option>`
    ).join('');
    
    return `
        <div class="max-w-4xl mx-auto space-y-6">
            <!-- Profile Form -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-user-circle text-blue-600 mr-2"></i>
                    Data Profil Guru
                </h3>
                
                <form id="profilForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                            <input type="text" name="nama" value="${user.nama || ''}" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Masukkan nama lengkap">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">NIP</label>
                            <input type="text" name="nip" value="${user.nip || ''}"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Masukkan NIP">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input type="email" name="email" value="${user.email || ''}" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="email@example.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
                            <input type="tel" name="phone" value="${user.phone || ''}"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="08xxxxxxxxxx">
                        </div>
                    </div>
                    
                    <hr class="my-6">
                    
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-school text-green-600 mr-2"></i>
                        Data Sekolah
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">NPSN Sekolah *</label>
                            <input type="text" name="npsn" value="${user.npsn || ''}" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="8 digit NPSN" maxlength="8" pattern="[0-9]{8}">
                            <p class="text-xs text-gray-500 mt-1">NPSN digunakan untuk kolaborasi dengan guru sekolah yang sama</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nama Sekolah *</label>
                            <input type="text" name="schoolName" value="${user.schoolName || ''}" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nama sekolah">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Jenjang Pendidikan *</label>
                            <select name="jenjang" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Pilih Jenjang</option>
                                ${jenjangOptions}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Alamat Sekolah</label>
                            <input type="text" name="schoolAddress" value="${user.schoolAddress || ''}"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Alamat lengkap sekolah">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tahun Ajaran *</label>
                            <input type="text" name="tahunAjaran" value="${user.tahunAjaran || ''}" required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="2024/2025">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                            <select name="semester"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="1" ${user.semester === '1' ? 'selected' : ''}>Semester 1 (Ganjil)</option>
                                <option value="2" ${user.semester === '2' ? 'selected' : ''}>Semester 2 (Genap)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex justify-end pt-4">
                        <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-save mr-2"></i>
                            Simpan Profil
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Guru di Sekolah yang Sama -->
            <div id="sameSchoolTeachers" class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-users text-purple-600 mr-2"></i>
                    Guru di Sekolah yang Sama
                </h3>
                <div id="teachersList" class="space-y-2">
                    <p class="text-gray-500 text-sm">Lengkapi NPSN untuk melihat guru lain di sekolah yang sama</p>
                </div>
            </div>
        </div>
    `;
}

function initProfilPage() {
    const form = document.getElementById('profilForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        userData.updatedAt = new Date().toISOString();
        
        try {
            // Save to localStorage
            localStorage.setItem('guruSmartUser', JSON.stringify(userData));
            APP_STATE.currentUser = userData;
            
            // Save to Firestore
            await setDoc(doc(db, COLLECTIONS.USERS, userData.npsn + '_' + userData.email.replace(/[^a-zA-Z0-9]/g, '_')), {
                ...userData,
                createdAt: serverTimestamp()
            });
            
            // Initialize default subjects if first time
            if (userData.jenjang && APP_STATE.subjects.length === 0) {
                await initializeDefaultSubjects(userData.npsn, userData.jenjang);
            }
            
            updateUserDisplay();
            await loadAllData();
            showToast('Profil berhasil disimpan!', 'success');
            
            // Load teachers from same school
            await loadSameSchoolTeachers(userData.npsn);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Gagal menyimpan profil', 'error');
        }
    });
    
    // Load same school teachers if NPSN exists
    if (APP_STATE.currentUser?.npsn) {
        loadSameSchoolTeachers(APP_STATE.currentUser.npsn);
    }
}

async function loadSameSchoolTeachers(npsn) {
    try {
        const teachersQuery = query(
            collection(db, COLLECTIONS.USERS),
            where('npsn', '==', npsn)
        );
        const snapshot = await getDocs(teachersQuery);
        
        const container = document.getElementById('teachersList');
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada guru lain terdaftar di sekolah ini</p>';
            return;
        }
        
        const teachers = snapshot.docs.map(doc => doc.data());
        container.innerHTML = teachers.map(t => `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    ${t.nama?.charAt(0) || 'G'}
                </div>
                <div>
                    <p class="font-medium text-gray-800">${t.nama || 'Guru'}</p>
                    <p class="text-sm text-gray-500">${t.email || '-'}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

async function initializeDefaultSubjects(npsn, jenjang) {
    const subjects = DEFAULT_SUBJECTS[jenjang] || [];
    const batch = writeBatch(db);
    
    for (const subject of subjects) {
        const docRef = doc(collection(db, COLLECTIONS.SUBJECTS));
        batch.set(docRef, {
            ...subject,
            npsn,
            createdAt: serverTimestamp()
        });
    }
    
    await batch.commit();
}

function updateUserDisplay() {
    const user = APP_STATE.currentUser;
    if (user) {
        document.getElementById('userInitial').textContent = user.nama?.charAt(0) || 'G';
        document.getElementById('userName').textContent = user.nama || 'Guru';
        document.getElementById('userSchool').textContent = user.schoolName || 'Sekolah';
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
        ${message}
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

window.refreshData = async function() {
    showToast('Memuat ulang data...', 'info');
    await loadAllData();
    renderTabContent(APP_STATE.currentTab);
    showToast('Data berhasil dimuat ulang', 'success');
};

// =====================================================
// CONTINUE TO NEXT PART...
// =====================================================
// =====================================================
// MASTER CP (CAPAIAN PEMBELAJARAN) PAGE
// =====================================================
function renderMasterCPPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const faseList = JENJANG[jenjang]?.fase || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-database text-blue-600 mr-2"></i>
                            Input Capaian Pembelajaran (CP)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Master data CP akan otomatis tersinkron ke ATP, KKTP, Modul Ajar, dan dokumen lainnya</p>
                    </div>
                    <button onclick="showAddCPModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Tambah CP
                    </button>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="filterSubject" onchange="filterMasterData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Semua Mapel</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                        <select id="filterFase" onchange="filterMasterData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Semua Fase</option>
                            ${faseList.map(f => `<option value="${f}">Fase ${f}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="filterKelas" onchange="filterMasterData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Elemen</label>
                        <select id="filterElemen" onchange="filterMasterData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Semua Elemen</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- CP List -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="table-responsive">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mata Pelajaran</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fase/Kelas</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Elemen</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capaian Pembelajaran</th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="cpTableBody" class="divide-y divide-gray-200">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div id="cpEmptyState" class="hidden p-8 text-center">
                    <i class="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Belum ada data Capaian Pembelajaran</p>
                    <button onclick="showAddCPModal()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Tambah CP Pertama
                    </button>
                </div>
            </div>
            
            <!-- Auto-Generate Info -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div class="flex items-start">
                    <i class="fas fa-magic text-blue-500 mt-1 mr-3"></i>
                    <div>
                        <h4 class="font-semibold text-blue-800">Auto-Generation</h4>
                        <p class="text-sm text-blue-700 mt-1">
                            Data CP yang Anda input akan otomatis digunakan untuk mengisi:
                        </p>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">ATP</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">KKTP</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Prota</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Promes</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Modul Ajar</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">LKPD</span>
                            <span class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">Bank Soal</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initMasterCPPage() {
    loadCPTable();
    
    // Update elemen dropdown when subject changes
    document.getElementById('filterSubject').addEventListener('change', function() {
        updateElemenDropdown(this.value);
    });
}

async function loadCPTable() {
    const tbody = document.getElementById('cpTableBody');
    const emptyState = document.getElementById('cpEmptyState');
    
    const data = APP_STATE.masterData;
    
    if (data.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tbody.innerHTML = data.map((cp, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-600">${index + 1}</td>
            <td class="px-4 py-3">
                <span class="font-medium text-gray-800">${cp.subjectName || cp.subjectCode}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Fase ${cp.fase}</span>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs ml-1">Kelas ${cp.kelas}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${cp.elemen}</td>
            <td class="px-4 py-3 text-sm text-gray-700 max-w-md">
                <div class="line-clamp-2">${cp.capaianPembelajaran}</div>
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="viewCP('${cp.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCP('${cp.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCP('${cp.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.showAddCPModal = function(editData = null) {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const faseList = JENJANG[jenjang]?.fase || [];
    
    const isEdit = editData !== null;
    const title = isEdit ? 'Edit Capaian Pembelajaran' : 'Tambah Capaian Pembelajaran';
    
    const modal = document.createElement('div');
    modal.id = 'cpModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} text-blue-600 mr-2"></i>
                    ${title}
                </h3>
                <button onclick="closeModal('cpModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="cpForm" class="p-6 space-y-4">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                        <select name="subjectCode" required onchange="updateElemenOptions(this.value)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `
                                <option value="${s.kode}" data-name="${s.nama}" ${editData?.subjectCode === s.kode ? 'selected' : ''}>
                                    ${s.nama}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Elemen CP *</label>
                        <select name="elemen" id="cpElemenSelect" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih Elemen</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fase *</label>
                        <select name="fase" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih Fase</option>
                            ${faseList.map(f => `<option value="${f}" ${editData?.fase === f ? 'selected' : ''}>Fase ${f}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
                        <select name="kelas" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}" ${editData?.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran *</label>
                    <textarea name="capaianPembelajaran" rows="4" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Tuliskan capaian pembelajaran...">${editData?.capaianPembelajaran || ''}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Dimensi Profil Lulusan</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        ${DIMENSI_PROFIL_LULUSAN.map(dim => `
                            <label class="flex items-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                <input type="checkbox" name="dimensiProfil" value="${dim.id}" 
                                    ${editData?.dimensiProfil?.includes(dim.id) ? 'checked' : ''}
                                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                                <span class="ml-2 text-xs text-gray-700">${dim.nama}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('cpModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Initialize elemen options if editing
    if (editData?.subjectCode) {
        updateElemenOptions(editData.subjectCode, editData.elemen);
    }
    
    // Form submit handler
    document.getElementById('cpForm').addEventListener('submit', handleCPSubmit);
};

window.updateElemenOptions = function(subjectCode, selectedElemen = '') {
    const subject = APP_STATE.subjects.find(s => s.kode === subjectCode);
    const elemenSelect = document.getElementById('cpElemenSelect');
    
    if (!subject || !subject.elemen) {
        elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>';
        return;
    }
    
    elemenSelect.innerHTML = `
        <option value="">Pilih Elemen</option>
        ${subject.elemen.map(e => `<option value="${e}" ${selectedElemen === e ? 'selected' : ''}>${e}</option>`).join('')}
    `;
};

async function handleCPSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    
    // Get selected dimensi profil
    const dimensiProfil = [];
    form.querySelectorAll('input[name="dimensiProfil"]:checked').forEach(cb => {
        dimensiProfil.push(cb.value);
    });
    
    // Get subject name
    const subjectSelect = form.querySelector('select[name="subjectCode"]');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].dataset.name;
    
    const cpData = {
        subjectCode: formData.get('subjectCode'),
        subjectName: subjectName,
        elemen: formData.get('elemen'),
        fase: formData.get('fase'),
        kelas: formData.get('kelas'),
        capaianPembelajaran: formData.get('capaianPembelajaran'),
        dimensiProfil: dimensiProfil,
        npsn: APP_STATE.currentUser.npsn,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            // Update existing
            await updateDoc(doc(db, COLLECTIONS.MASTER_DATA, id), cpData);
            showToast('CP berhasil diperbarui!', 'success');
        } else {
            // Add new
            cpData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.MASTER_DATA), cpData);
            showToast('CP berhasil ditambahkan!', 'success');
        }
        
        closeModal('cpModal');
        await loadAllData();
        loadCPTable();
        
    } catch (error) {
        console.error('Error saving CP:', error);
        showToast('Gagal menyimpan CP', 'error');
    }
}

window.editCP = async function(id) {
    const cp = APP_STATE.masterData.find(c => c.id === id);
    if (cp) {
        showAddCPModal(cp);
    }
};

window.viewCP = function(id) {
    const cp = APP_STATE.masterData.find(c => c.id === id);
    if (!cp) return;
    
    const modal = document.createElement('div');
    modal.id = 'viewCPModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-eye text-blue-600 mr-2"></i>
                    Detail Capaian Pembelajaran
                </h3>
                <button onclick="closeModal('viewCPModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm text-gray-500">Mata Pelajaran</label>
                        <p class="font-medium text-gray-800">${cp.subjectName || cp.subjectCode}</p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Elemen</label>
                        <p class="font-medium text-gray-800">${cp.elemen}</p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Fase</label>
                        <p class="font-medium text-gray-800">Fase ${cp.fase}</p>
                    </div>
                    <div>
                        <label class="text-sm text-gray-500">Kelas</label>
                        <p class="font-medium text-gray-800">Kelas ${cp.kelas}</p>
                    </div>
                </div>
                
                <div>
                    <label class="text-sm text-gray-500">Capaian Pembelajaran</label>
                    <p class="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">${cp.capaianPembelajaran}</p>
                </div>
                
                <div>
                    <label class="text-sm text-gray-500">Dimensi Profil Lulusan</label>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${(cp.dimensiProfil || []).map(id => {
                            const dim = DIMENSI_PROFIL_LULUSAN.find(d => d.id === id);
                            return dim ? `<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">${dim.nama}</span>` : '';
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.deleteCP = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus CP ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.MASTER_DATA, id));
        showToast('CP berhasil dihapus!', 'success');
        await loadAllData();
        loadCPTable();
    } catch (error) {
        console.error('Error deleting CP:', error);
        showToast('Gagal menghapus CP', 'error');
    }
};

window.filterMasterData = function() {
    const subject = document.getElementById('filterSubject').value;
    const fase = document.getElementById('filterFase').value;
    const kelas = document.getElementById('filterKelas').value;
    const elemen = document.getElementById('filterElemen').value;
    
    let filtered = [...APP_STATE.masterData];
    
    if (subject) filtered = filtered.filter(cp => cp.subjectCode === subject);
    if (fase) filtered = filtered.filter(cp => cp.fase === fase);
    if (kelas) filtered = filtered.filter(cp => cp.kelas === kelas);
    if (elemen) filtered = filtered.filter(cp => cp.elemen === elemen);
    
    // Re-render table with filtered data
    const tbody = document.getElementById('cpTableBody');
    const emptyState = document.getElementById('cpEmptyState');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    tbody.innerHTML = filtered.map((cp, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-600">${index + 1}</td>
            <td class="px-4 py-3">
                <span class="font-medium text-gray-800">${cp.subjectName || cp.subjectCode}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Fase ${cp.fase}</span>
                <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs ml-1">Kelas ${cp.kelas}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${cp.elemen}</td>
            <td class="px-4 py-3 text-sm text-gray-700 max-w-md">
                <div class="line-clamp-2">${cp.capaianPembelajaran}</div>
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button onclick="viewCP('${cp.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCP('${cp.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCP('${cp.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};

function updateElemenDropdown(subjectCode) {
    const subject = APP_STATE.subjects.find(s => s.kode === subjectCode);
    const elemenSelect = document.getElementById('filterElemen');
    
    if (!subject || !subject.elemen) {
        elemenSelect.innerHTML = '<option value="">Semua Elemen</option>';
        return;
    }
    
    elemenSelect.innerHTML = `
        <option value="">Semua Elemen</option>
        ${subject.elemen.map(e => `<option value="${e}">${e}</option>`).join('')}
    `;
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.remove();
};

// =====================================================
// MATA PELAJARAN PAGE
// =====================================================
function renderSubjectsPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-book text-green-600 mr-2"></i>
                            Mata Pelajaran & Elemen
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Kelola mata pelajaran beserta elemen-elemennya</p>
                    </div>
                    <button onclick="showAddSubjectModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Tambah Mapel
                    </button>
                </div>
            </div>
            
            <!-- Subjects Grid -->
            <div id="subjectsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Subjects will be loaded here -->
            </div>
            
            <div id="subjectsEmptyState" class="hidden bg-white rounded-xl shadow-sm p-8 text-center">
                <i class="fas fa-book-open text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Belum ada mata pelajaran</p>
                <button onclick="showAddSubjectModal()" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Tambah Mata Pelajaran
                </button>
            </div>
        </div>
    `;
}

function initSubjectsPage() {
    loadSubjectsGrid();
}

function loadSubjectsGrid() {
    const grid = document.getElementById('subjectsGrid');
    const emptyState = document.getElementById('subjectsEmptyState');
    
    const subjects = APP_STATE.subjects;
    
    if (subjects.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    grid.innerHTML = subjects.map(subject => `
        <div class="bg-white rounded-xl shadow-sm p-6 card-hover">
            <div class="flex items-start justify-between mb-4">
                <div>
                    <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">${subject.kode}</span>
                    <h4 class="font-semibold text-gray-800 mt-2">${subject.nama}</h4>
                </div>
                <div class="flex space-x-1">
                    <button onclick="editSubject('${subject.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteSubject('${subject.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div>
                <p class="text-sm text-gray-500 mb-2">Elemen:</p>
                <div class="flex flex-wrap gap-1">
                    ${(subject.elemen || []).map(e => `
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">${e}</span>
                    `).join('')}
                </div>
            </div>
            
            <div class="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                <span class="text-gray-500">
                    <i class="fas fa-database mr-1"></i>
                    ${APP_STATE.masterData.filter(cp => cp.subjectCode === subject.kode).length} CP
                </span>
            </div>
        </div>
    `).join('');
}

window.showAddSubjectModal = function(editData = null) {
    const isEdit = editData !== null;
    const title = isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran';
    
    const modal = document.createElement('div');
    modal.id = 'subjectModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} text-green-600 mr-2"></i>
                    ${title}
                </h3>
                <button onclick="closeModal('subjectModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="subjectForm" class="p-6 space-y-4">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kode Mata Pelajaran *</label>
                    <input type="text" name="kode" value="${editData?.kode || ''}" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Contoh: PAI, MTK, BIN">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran *</label>
                    <input type="text" name="nama" value="${editData?.nama || ''}" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Nama lengkap mata pelajaran">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Elemen-elemen *</label>
                    <div id="elemenContainer" class="space-y-2">
                        ${(editData?.elemen || ['']).map((e, i) => `
                            <div class="flex items-center space-x-2">
                                <input type="text" name="elemen[]" value="${e}" required
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="Nama elemen">
                                <button type="button" onclick="removeElemenInput(this)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" onclick="addElemenInput()" class="mt-2 text-sm text-green-600 hover:text-green-700">
                        <i class="fas fa-plus mr-1"></i>
                        Tambah Elemen
                    </button>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('subjectModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    document.getElementById('subjectForm').addEventListener('submit', handleSubjectSubmit);
};

window.addElemenInput = function() {
    const container = document.getElementById('elemenContainer');
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2';
    div.innerHTML = `
        <input type="text" name="elemen[]" required
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Nama elemen">
        <button type="button" onclick="removeElemenInput(this)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
};

window.removeElemenInput = function(btn) {
    const container = document.getElementById('elemenContainer');
    if (container.children.length > 1) {
        btn.closest('div').remove();
    }
};

async function handleSubjectSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    
    // Get all elemen values
    const elemenInputs = form.querySelectorAll('input[name="elemen[]"]');
    const elemen = Array.from(elemenInputs).map(input => input.value.trim()).filter(v => v);
    
    const subjectData = {
        kode: formData.get('kode').toUpperCase(),
        nama: formData.get('nama'),
        elemen: elemen,
        npsn: APP_STATE.currentUser.npsn,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.SUBJECTS, id), subjectData);
            showToast('Mata pelajaran berhasil diperbarui!', 'success');
        } else {
            subjectData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.SUBJECTS), subjectData);
            showToast('Mata pelajaran berhasil ditambahkan!', 'success');
        }
        
        closeModal('subjectModal');
        await loadAllData();
        loadSubjectsGrid();
        
    } catch (error) {
        console.error('Error saving subject:', error);
        showToast('Gagal menyimpan mata pelajaran', 'error');
    }
}

window.editSubject = function(id) {
    const subject = APP_STATE.subjects.find(s => s.id === id);
    if (subject) {
        showAddSubjectModal(subject);
    }
};

window.deleteSubject = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.SUBJECTS, id));
        showToast('Mata pelajaran berhasil dihapus!', 'success');
        await loadAllData();
        loadSubjectsGrid();
    } catch (error) {
        console.error('Error deleting subject:', error);
        showToast('Gagal menghapus mata pelajaran', 'error');
    }
};

// =====================================================
// ATP (ALUR TUJUAN PEMBELAJARAN) PAGE
// =====================================================
function renderATPPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-sitemap text-purple-600 mr-2"></i>
                            Alur Tujuan Pembelajaran (ATP)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">ATP dihasilkan otomatis dari Master Data CP</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="generateATP()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>
                            Generate ATP
                        </button>
                        <button onclick="exportATPToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportATPToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="atpFilterSubject" onchange="loadATPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Pilih Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="atpFilterKelas" onchange="loadATPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select id="atpFilterSemester" onchange="loadATPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="">Semua Semester</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- ATP Document Preview -->
            <div id="atpPreview" class="bg-white rounded-xl shadow-sm p-6 print-area">
                <div class="text-center mb-6">
                    <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat ATP</p>
                </div>
            </div>
        </div>
    `;
}

function initATPPage() {
    // Initialize ATP page
}

window.generateATP = async function() {
    const subject = document.getElementById('atpFilterSubject').value;
    const kelas = document.getElementById('atpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    showToast('Generating ATP...', 'info');
    await loadATPData();
    showToast('ATP berhasil di-generate!', 'success');
};

window.loadATPData = function() {
    const subject = document.getElementById('atpFilterSubject').value;
    const kelas = document.getElementById('atpFilterKelas').value;
    const semester = document.getElementById('atpFilterSemester').value;
    
    const preview = document.getElementById('atpPreview');
    
    if (!subject || !kelas) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-sitemap text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat ATP</p>
            </div>
        `;
        return;
    }
    
    // Filter CP data
    let cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    if (cpData.length === 0) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-5xl mb-4"></i>
                <p class="text-gray-500">Tidak ada data CP untuk mata pelajaran dan kelas yang dipilih</p>
                <button onclick="switchTab('master-cp')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>
                    Tambah CP
                </button>
            </div>
        `;
        return;
    }
    
    // Group by elemen
    const groupedByElemen = {};
    cpData.forEach(cp => {
        if (!groupedByElemen[cp.elemen]) {
            groupedByElemen[cp.elemen] = [];
        }
        groupedByElemen[cp.elemen].push(cp);
    });
    
    preview.innerHTML = `
        <!-- Header Dokumen -->
        <div class="border-b-2 border-black pb-4 mb-6">
            <div class="text-center">
                <h2 class="text-xl font-bold uppercase">ALUR TUJUAN PEMBELAJARAN (ATP)</h2>
                <h3 class="text-lg font-semibold mt-2">${subjectInfo?.nama || subject}</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <p><strong>Satuan Pendidikan:</strong> ${user.schoolName}</p>
                    <p><strong>Kelas/Fase:</strong> ${kelas} / ${cpData[0]?.fase || '-'}</p>
                </div>
                <div>
                    <p><strong>Tahun Pelajaran:</strong> ${user.tahunAjaran}</p>
                    <p><strong>Guru Pengampu:</strong> ${user.nama}</p>
                </div>
            </div>
        </div>
        
        <!-- Tabel ATP -->
        ${Object.entries(groupedByElemen).map(([elemen, cps], elemenIndex) => `
            <div class="mb-6 ${elemenIndex > 0 ? 'page-break' : ''}">
                <h4 class="font-bold text-gray-800 mb-3 bg-gray-100 p-2 rounded">
                    Elemen: ${elemen}
                </h4>
                
                <table class="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                        <tr class="bg-gray-200">
                            <th class="border border-gray-400 p-2 w-12">No</th>
                            <th class="border border-gray-400 p-2">Capaian Pembelajaran</th>
                            <th class="border border-gray-400 p-2">Tujuan Pembelajaran</th>
                            <th class="border border-gray-400 p-2 w-24">Minggu ke-</th>
                            <th class="border border-gray-400 p-2 w-20">JP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cps.map((cp, index) => `
                            <tr>
                                <td class="border border-gray-400 p-2 text-center">${index + 1}</td>
                                <td class="border border-gray-400 p-2">${cp.capaianPembelajaran}</td>
                                <td class="border border-gray-400 p-2">
                                    <ul class="list-disc list-inside text-sm">
                                        <li>Memahami konsep ${elemen.toLowerCase()}</li>
                                        <li>Menganalisis ${elemen.toLowerCase()} dalam konteks kehidupan</li>
                                        <li>Menerapkan ${elemen.toLowerCase()} dalam kehidupan sehari-hari</li>
                                    </ul>
                                </td>
                                <td class="border border-gray-400 p-2 text-center">${(index * 2) + 1}-${(index * 2) + 2}</td>
                                <td class="border border-gray-400 p-2 text-center">4</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}
        
        <!-- Dimensi Profil Lulusan -->
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 class="font-bold text-gray-800 mb-3">Dimensi Profil Lulusan yang Dikembangkan:</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                ${DIMENSI_PROFIL_LULUSAN.map(dim => `
                    <div class="flex items-center text-sm">
                        <i class="fas fa-check-circle text-green-500 mr-2"></i>
                        ${dim.nama}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">(...........................)</p>
                <p>NIP. ................................</p>
            </div>
            <div>
                <p>..................., ..................... 20....</p>
                <p>Guru Mata Pelajaran</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">${user.nama}</p>
                <p>NIP. ${user.nip || '................................'}</p>
            </div>
        </div>
    `;
};

// =====================================================
// KKTP (KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN) PAGE
// =====================================================
function renderKKTPPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-clipboard-check text-indigo-600 mr-2"></i>
                            Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">KKTP dihasilkan otomatis dari Master Data CP</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="generateKKTP()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>
                            Generate KKTP
                        </button>
                        <button onclick="exportKKTPToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportKKTPToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="kktpFilterSubject" onchange="loadKKTPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="">Pilih Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="kktpFilterKelas" onchange="loadKKTPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Elemen</label>
                        <select id="kktpFilterElemen" onchange="loadKKTPData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                            <option value="">Semua Elemen</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- KKTP Document Preview -->
            <div id="kktpPreview" class="bg-white rounded-xl shadow-sm p-6 print-area">
                <div class="text-center mb-6">
                    <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat KKTP</p>
                </div>
            </div>
        </div>
    `;
}

function initKKTPPage() {
    document.getElementById('kktpFilterSubject').addEventListener('change', function() {
        updateKKTPElemenDropdown(this.value);
    });
}

function updateKKTPElemenDropdown(subjectCode) {
    const subject = APP_STATE.subjects.find(s => s.kode === subjectCode);
    const elemenSelect = document.getElementById('kktpFilterElemen');
    
    if (!subject || !subject.elemen) {
        elemenSelect.innerHTML = '<option value="">Semua Elemen</option>';
        return;
    }
    
    elemenSelect.innerHTML = `
        <option value="">Semua Elemen</option>
        ${subject.elemen.map(e => `<option value="${e}">${e}</option>`).join('')}
    `;
}

window.generateKKTP = async function() {
    const subject = document.getElementById('kktpFilterSubject').value;
    const kelas = document.getElementById('kktpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    showToast('Generating KKTP...', 'info');
    await loadKKTPData();
    showToast('KKTP berhasil di-generate!', 'success');
};

window.loadKKTPData = function() {
    const subject = document.getElementById('kktpFilterSubject').value;
    const kelas = document.getElementById('kktpFilterKelas').value;
    const elemen = document.getElementById('kktpFilterElemen').value;
    
    const preview = document.getElementById('kktpPreview');
    
    if (!subject || !kelas) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-clipboard-check text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat KKTP</p>
            </div>
        `;
        return;
    }
    
    // Filter CP data
    let cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    if (elemen) {
        cpData = cpData.filter(cp => cp.elemen === elemen);
    }
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    if (cpData.length === 0) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-5xl mb-4"></i>
                <p class="text-gray-500">Tidak ada data CP untuk mata pelajaran dan kelas yang dipilih</p>
            </div>
        `;
        return;
    }
    
    preview.innerHTML = `
        <!-- Header Dokumen -->
        <div class="border-b-2 border-black pb-4 mb-6">
            <div class="text-center">
                <h2 class="text-xl font-bold uppercase">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h2>
                <h3 class="text-lg font-semibold mt-2">${subjectInfo?.nama || subject}</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <p><strong>Satuan Pendidikan:</strong> ${user.schoolName}</p>
                    <p><strong>Kelas/Fase:</strong> ${kelas} / ${cpData[0]?.fase || '-'}</p>
                </div>
                <div>
                    <p><strong>Tahun Pelajaran:</strong> ${user.tahunAjaran}</p>
                    <p><strong>Guru Pengampu:</strong> ${user.nama}</p>
                </div>
            </div>
        </div>
        
        <!-- Tabel KKTP -->
        <table class="w-full border-collapse border border-gray-400 text-sm mb-6">
            <thead>
                <tr class="bg-gray-200">
                    <th class="border border-gray-400 p-2 w-12" rowspan="2">No</th>
                    <th class="border border-gray-400 p-2" rowspan="2">Tujuan Pembelajaran</th>
                    <th class="border border-gray-400 p-2" colspan="4">Kriteria Ketercapaian</th>
                    <th class="border border-gray-400 p-2" rowspan="2">Teknik Penilaian</th>
                </tr>
                <tr class="bg-gray-100">
                    <th class="border border-gray-400 p-2 w-16">Belum Berkembang</th>
                    <th class="border border-gray-400 p-2 w-16">Mulai Berkembang</th>
                    <th class="border border-gray-400 p-2 w-16">Berkembang Sesuai Harapan</th>
                    <th class="border border-gray-400 p-2 w-16">Sangat Berkembang</th>
                </tr>
            </thead>
            <tbody>
                ${cpData.map((cp, index) => `
                    <tr>
                        <td class="border border-gray-400 p-2 text-center">${index + 1}</td>
                        <td class="border border-gray-400 p-2">
                            <p class="font-medium mb-1">${cp.elemen}</p>
                            <p class="text-gray-600">${cp.capaianPembelajaran}</p>
                        </td>
                        <td class="border border-gray-400 p-2 text-xs text-center">
                            Belum mampu memahami konsep dasar
                        </td>
                        <td class="border border-gray-400 p-2 text-xs text-center">
                            Mampu memahami konsep dengan bimbingan
                        </td>
                        <td class="border border-gray-400 p-2 text-xs text-center">
                            Mampu memahami dan menerapkan konsep secara mandiri
                        </td>
                        <td class="border border-gray-400 p-2 text-xs text-center">
                            Mampu menganalisis dan mengembangkan konsep
                        </td>
                        <td class="border border-gray-400 p-2 text-xs">
                            <ul class="list-disc list-inside">
                                <li>Observasi</li>
                                <li>Tes Tertulis</li>
                                <li>Praktik</li>
                            </ul>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Rubrik Penilaian -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 class="font-bold text-gray-800 mb-3">Keterangan Kriteria:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <p><strong>BB (Belum Berkembang):</strong> 0-25% ketercapaian</p>
                    <p><strong>MB (Mulai Berkembang):</strong> 26-50% ketercapaian</p>
                </div>
                <div>
                    <p><strong>BSH (Berkembang Sesuai Harapan):</strong> 51-75% ketercapaian</p>
                    <p><strong>SB (Sangat Berkembang):</strong> 76-100% ketercapaian</p>
                </div>
            </div>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">(...........................)</p>
                <p>NIP. ................................</p>
            </div>
            <div>
                <p>..................., ..................... 20....</p>
                <p>Guru Mata Pelajaran</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">${user.nama}</p>
                <p>NIP. ${user.nip || '................................'}</p>
            </div>
        </div>
    `;
};

// =====================================================
// UTILITY: Need Login Message
// =====================================================
function renderNeedLoginMessage() {
    return `
        <div class="bg-white rounded-xl shadow-sm p-8 text-center">
            <i class="fas fa-lock text-gray-300 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Lengkapi Profil Terlebih Dahulu</h3>
            <p class="text-gray-500 mb-4">Silakan lengkapi data profil dan sekolah Anda untuk mengakses fitur ini</p>
            <button onclick="switchTab('profil')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-user-edit mr-2"></i>
                Lengkapi Profil
            </button>
        </div>
    `;
}

// =====================================================
// EXPORT FUNCTIONS FOR ATP & KKTP
// =====================================================
window.exportATPToExcel = function() {
    const subject = document.getElementById('atpFilterSubject').value;
    const kelas = document.getElementById('atpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    // Prepare data for Excel
    const excelData = [
        ['ALUR TUJUAN PEMBELAJARAN (ATP)'],
        [`Mata Pelajaran: ${subjectInfo?.nama || subject}`],
        [`Satuan Pendidikan: ${user.schoolName}`],
        [`Kelas: ${kelas}`],
        [`Tahun Pelajaran: ${user.tahunAjaran}`],
        [],
        ['No', 'Elemen', 'Capaian Pembelajaran', 'Tujuan Pembelajaran', 'Minggu', 'JP']
    ];
    
    cpData.forEach((cp, index) => {
        excelData.push([
            index + 1,
            cp.elemen,
            cp.capaianPembelajaran,
            `Memahami, menganalisis, dan menerapkan ${cp.elemen.toLowerCase()}`,
            `${(index * 2) + 1}-${(index * 2) + 2}`,
            4
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ATP');
    XLSX.writeFile(wb, `ATP_${subject}_Kelas${kelas}.xlsx`);
    
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportATPToPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const subject = document.getElementById('atpFilterSubject').value;
    const kelas = document.getElementById('atpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    // Title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('ALUR TUJUAN PEMBELAJARAN (ATP)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(subjectInfo?.nama || subject, 105, 28, { align: 'center' });
    
    // Info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Satuan Pendidikan: ${user.schoolName}`, 20, 40);
    doc.text(`Kelas: ${kelas}`, 20, 46);
    doc.text(`Tahun Pelajaran: ${user.tahunAjaran}`, 120, 40);
    doc.text(`Guru: ${user.nama}`, 120, 46);
    
    // Table
    const tableData = cpData.map((cp, index) => [
        index + 1,
        cp.elemen,
        cp.capaianPembelajaran.substring(0, 100) + '...',
        `${(index * 2) + 1}-${(index * 2) + 2}`,
        4
    ]);
    
    doc.autoTable({
        startY: 55,
        head: [['No', 'Elemen', 'Capaian Pembelajaran', 'Minggu', 'JP']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 }
    });
    
    doc.save(`ATP_${subject}_Kelas${kelas}.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

window.exportKKTPToExcel = function() {
    const subject = document.getElementById('kktpFilterSubject').value;
    const kelas = document.getElementById('kktpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    const excelData = [
        ['KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)'],
        [`Mata Pelajaran: ${subjectInfo?.nama || subject}`],
        [`Satuan Pendidikan: ${user.schoolName}`],
        [`Kelas: ${kelas}`],
        [],
        ['No', 'Elemen', 'Tujuan Pembelajaran', 'BB', 'MB', 'BSH', 'SB', 'Teknik Penilaian']
    ];
    
    cpData.forEach((cp, index) => {
        excelData.push([
            index + 1,
            cp.elemen,
            cp.capaianPembelajaran,
            'Belum mampu',
            'Dengan bimbingan',
            'Mandiri',
            'Mengembangkan',
            'Observasi, Tes, Praktik'
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KKTP');
    XLSX.writeFile(wb, `KKTP_${subject}_Kelas${kelas}.xlsx`);
    
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportKKTPToPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    
    const subject = document.getElementById('kktpFilterSubject').value;
    const kelas = document.getElementById('kktpFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)', 148, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Mata Pelajaran: ${subjectInfo?.nama || subject}`, 20, 25);
    doc.text(`Kelas: ${kelas}`, 20, 31);
    
    const tableData = cpData.map((cp, index) => [
        index + 1,
        cp.elemen,
        cp.capaianPembelajaran.substring(0, 60),
        'Belum mampu',
        'Dengan bimbingan',
        'Mandiri',
        'Mengembangkan'
    ]);
    
    doc.autoTable({
        startY: 38,
        head: [['No', 'Elemen', 'Tujuan Pembelajaran', 'BB', 'MB', 'BSH', 'SB']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [75, 0, 130] },
        styles: { fontSize: 7 }
    });
    
    doc.save(`KKTP_${subject}_Kelas${kelas}.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

// =====================================================
// CONTINUE TO PART 4...
// =====================================================
// =====================================================
// KALENDER PENDIDIKAN PAGE
// =====================================================
function renderKalenderPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-calendar text-red-600 mr-2"></i>
                            Kalender Pendidikan
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                            <i class="fas fa-users text-blue-500 mr-1"></i>
                            Kolaborasi dengan guru lain di ${user.schoolName} (NPSN: ${user.npsn})
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showAddEventModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Tambah Event
                        </button>
                        <button onclick="exportKalenderToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportKalenderToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Calendar Navigation -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="flex items-center justify-between mb-4">
                    <button onclick="changeMonth(-1)" class="p-2 hover:bg-gray-100 rounded-lg">
                        <i class="fas fa-chevron-left text-gray-600"></i>
                    </button>
                    <div class="text-center">
                        <h4 id="calendarTitle" class="text-lg font-semibold text-gray-800"></h4>
                        <p class="text-sm text-gray-500">Tahun Ajaran ${user.tahunAjaran}</p>
                    </div>
                    <button onclick="changeMonth(1)" class="p-2 hover:bg-gray-100 rounded-lg">
                        <i class="fas fa-chevron-right text-gray-600"></i>
                    </button>
                </div>
                
                <!-- Calendar Grid -->
                <div id="calendarGrid" class="grid grid-cols-7 gap-1">
                    <!-- Calendar will be rendered here -->
                </div>
            </div>
            
            <!-- Event Legend -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <h4 class="font-semibold text-gray-800 mb-3">Keterangan Warna:</h4>
                <div class="flex flex-wrap gap-4 text-sm">
                    <div class="flex items-center">
                        <span class="w-4 h-4 bg-red-500 rounded mr-2"></span>
                        <span>Libur</span>
                    </div>
                    <div class="flex items-center">
                        <span class="w-4 h-4 bg-blue-500 rounded mr-2"></span>
                        <span>Ujian/Penilaian</span>
                    </div>
                    <div class="flex items-center">
                        <span class="w-4 h-4 bg-green-500 rounded mr-2"></span>
                        <span>Kegiatan Sekolah</span>
                    </div>
                    <div class="flex items-center">
                        <span class="w-4 h-4 bg-yellow-500 rounded mr-2"></span>
                        <span>Hari Khusus</span>
                    </div>
                    <div class="flex items-center">
                        <span class="w-4 h-4 bg-purple-500 rounded mr-2"></span>
                        <span>Rapat/Pertemuan</span>
                    </div>
                </div>
            </div>
            
            <!-- Event List -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h4 class="font-semibold text-gray-800 mb-4">Daftar Kegiatan Bulan Ini</h4>
                <div id="eventList" class="space-y-2">
                    <!-- Events will be loaded here -->
                </div>
            </div>
            
            <!-- Effective Days Summary -->
            <div class="bg-white rounded-xl shadow-sm p-6 print-area">
                <h4 class="font-semibold text-gray-800 mb-4">Ringkasan Hari Efektif</h4>
                <div id="effectiveDaysSummary" class="overflow-x-auto">
                    <!-- Summary table will be loaded here -->
                </div>
            </div>
        </div>
    `;
}

// Calendar state
let calendarState = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

function initKalenderPage() {
    renderCalendar();
    loadCalendarEvents();
    loadEffectiveDaysSummary();
    
    // Set up real-time listener for collaborative updates
    setupCalendarListener();
}

function setupCalendarListener() {
    const npsn = APP_STATE.currentUser.npsn;
    const calendarQuery = query(
        collection(db, COLLECTIONS.CALENDAR),
        where('npsn', '==', npsn)
    );
    
    onSnapshot(calendarQuery, (snapshot) => {
        APP_STATE.calendarEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderCalendar();
        loadEventList();
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    title.textContent = `${months[calendarState.currentMonth]} ${calendarState.currentYear}`;
    
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    // Header row
    let html = days.map(day => `
        <div class="text-center py-2 font-semibold text-gray-600 text-sm">${day}</div>
    `).join('');
    
    // Get first day of month and number of days
    const firstDay = new Date(calendarState.currentYear, calendarState.currentMonth, 1).getDay();
    const daysInMonth = new Date(calendarState.currentYear, calendarState.currentMonth + 1, 0).getDate();
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="p-2"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendarState.currentYear}-${String(calendarState.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = APP_STATE.calendarEvents.filter(e => e.date === dateStr);
        const isToday = new Date().toDateString() === new Date(calendarState.currentYear, calendarState.currentMonth, day).toDateString();
        const isSunday = new Date(calendarState.currentYear, calendarState.currentMonth, day).getDay() === 0;
        
        let bgClass = 'bg-white hover:bg-gray-50';
        let textClass = 'text-gray-700';
        
        if (isToday) {
            bgClass = 'bg-blue-100';
            textClass = 'text-blue-700 font-bold';
        }
        
        if (isSunday) {
            textClass = 'text-red-500';
        }
        
        // Check for holiday events
        const hasHoliday = dayEvents.some(e => e.type === 'libur');
        if (hasHoliday) {
            bgClass = 'bg-red-100';
        }
        
        html += `
            <div class="min-h-[80px] p-1 border border-gray-100 ${bgClass} cursor-pointer rounded-lg transition-colors"
                 onclick="showDayEvents('${dateStr}')">
                <div class="text-right ${textClass} text-sm">${day}</div>
                <div class="space-y-1 mt-1">
                    ${dayEvents.slice(0, 2).map(event => `
                        <div class="text-xs px-1 py-0.5 rounded truncate ${getEventColorClass(event.type)}">
                            ${event.title}
                        </div>
                    `).join('')}
                    ${dayEvents.length > 2 ? `
                        <div class="text-xs text-gray-500 px-1">+${dayEvents.length - 2} lainnya</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

function getEventColorClass(type) {
    const colors = {
        'libur': 'bg-red-500 text-white',
        'ujian': 'bg-blue-500 text-white',
        'kegiatan': 'bg-green-500 text-white',
        'khusus': 'bg-yellow-500 text-white',
        'rapat': 'bg-purple-500 text-white'
    };
    return colors[type] || 'bg-gray-500 text-white';
}

window.changeMonth = function(delta) {
    calendarState.currentMonth += delta;
    
    if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.currentYear++;
    } else if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.currentYear--;
    }
    
    renderCalendar();
    loadEventList();
};

function loadCalendarEvents() {
    loadEventList();
}

function loadEventList() {
    const container = document.getElementById('eventList');
    
    // Filter events for current month
    const monthEvents = APP_STATE.calendarEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.getMonth() === calendarState.currentMonth && 
               eventDate.getFullYear() === calendarState.currentYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (monthEvents.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Tidak ada kegiatan bulan ini</p>';
        return;
    }
    
    container.innerHTML = monthEvents.map(event => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full ${getEventColorClass(event.type).split(' ')[0]}"></div>
                <div>
                    <p class="font-medium text-gray-800">${event.title}</p>
                    <p class="text-sm text-gray-500">
                        ${formatDate(event.date)}
                        ${event.endDate && event.endDate !== event.date ? ` - ${formatDate(event.endDate)}` : ''}
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-400">oleh ${event.createdByName || 'Guru'}</span>
                <button onclick="editEvent('${event.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEvent('${event.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

window.showDayEvents = function(dateStr) {
    const dayEvents = APP_STATE.calendarEvents.filter(e => e.date === dateStr);
    
    const modal = document.createElement('div');
    modal.id = 'dayEventsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-calendar-day text-blue-600 mr-2"></i>
                    ${formatDate(dateStr)}
                </h3>
                <button onclick="closeModal('dayEventsModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6">
                ${dayEvents.length === 0 ? `
                    <p class="text-gray-500 text-center">Tidak ada kegiatan di hari ini</p>
                ` : `
                    <div class="space-y-3">
                        ${dayEvents.map(event => `
                            <div class="p-3 rounded-lg ${getEventColorClass(event.type).replace('text-white', 'text-white/90')}">
                                <p class="font-medium">${event.title}</p>
                                ${event.description ? `<p class="text-sm opacity-80 mt-1">${event.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
                
                <button onclick="closeModal('dayEventsModal'); showAddEventModal('${dateStr}')" 
                    class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>
                    Tambah Kegiatan
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.showAddEventModal = function(defaultDate = null, editData = null) {
    const isEdit = editData !== null;
    const title = isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan';
    
    const today = defaultDate || new Date().toISOString().split('T')[0];
    
    const modal = document.createElement('div');
    modal.id = 'eventModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-calendar-plus text-green-600 mr-2"></i>
                    ${title}
                </h3>
                <button onclick="closeModal('eventModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="eventForm" class="p-6 space-y-4">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Judul Kegiatan *</label>
                    <input type="text" name="title" value="${editData?.title || ''}" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama kegiatan">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai *</label>
                        <input type="date" name="date" value="${editData?.date || today}" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                        <input type="date" name="endDate" value="${editData?.endDate || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Kegiatan *</label>
                    <select name="type" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Pilih Jenis</option>
                        <option value="libur" ${editData?.type === 'libur' ? 'selected' : ''}>Libur</option>
                        <option value="ujian" ${editData?.type === 'ujian' ? 'selected' : ''}>Ujian/Penilaian</option>
                        <option value="kegiatan" ${editData?.type === 'kegiatan' ? 'selected' : ''}>Kegiatan Sekolah</option>
                        <option value="khusus" ${editData?.type === 'khusus' ? 'selected' : ''}>Hari Khusus</option>
                        <option value="rapat" ${editData?.type === 'rapat' ? 'selected' : ''}>Rapat/Pertemuan</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea name="description" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Keterangan tambahan">${editData?.description || ''}</textarea>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('eventModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);
};

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const user = APP_STATE.currentUser;
    
    const eventData = {
        title: formData.get('title'),
        date: formData.get('date'),
        endDate: formData.get('endDate') || formData.get('date'),
        type: formData.get('type'),
        description: formData.get('description'),
        npsn: user.npsn,
        createdBy: user.email,
        createdByName: user.nama,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.CALENDAR, id), eventData);
            showToast('Kegiatan berhasil diperbarui!', 'success');
        } else {
            eventData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.CALENDAR), eventData);
            showToast('Kegiatan berhasil ditambahkan!', 'success');
        }
        
        closeModal('eventModal');
        // Real-time listener will update the UI
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Gagal menyimpan kegiatan', 'error');
    }
}

window.editEvent = function(id) {
    const event = APP_STATE.calendarEvents.find(e => e.id === id);
    if (event) {
        showAddEventModal(null, event);
    }
};

window.deleteEvent = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.CALENDAR, id));
        showToast('Kegiatan berhasil dihapus!', 'success');
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Gagal menghapus kegiatan', 'error');
    }
};

function loadEffectiveDaysSummary() {
    const container = document.getElementById('effectiveDaysSummary');
    const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
                    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    // Calculate effective days per month
    const summary = months.map((month, index) => {
        const monthNum = index < 6 ? index + 6 : index - 6; // Adjust for academic year
        const year = index < 6 ? calendarState.currentYear : calendarState.currentYear + 1;
        
        const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
        
        // Count Sundays
        let sundays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            if (new Date(year, monthNum, day).getDay() === 0) sundays++;
        }
        
        // Count holidays from events
        const holidays = APP_STATE.calendarEvents.filter(e => {
            const eventDate = new Date(e.date);
            return e.type === 'libur' && 
                   eventDate.getMonth() === monthNum && 
                   eventDate.getFullYear() === year;
        }).length;
        
        const effectiveDays = daysInMonth - sundays - holidays;
        
        return { month, daysInMonth, sundays, holidays, effectiveDays };
    });
    
    const semester1 = summary.slice(0, 6);
    const semester2 = summary.slice(6);
    
    container.innerHTML = `
        <table class="w-full border-collapse text-sm mb-4">
            <thead>
                <tr class="bg-blue-100">
                    <th class="border border-gray-300 p-2" colspan="7">SEMESTER 1 (GANJIL)</th>
                </tr>
                <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2">Bulan</th>
                    <th class="border border-gray-300 p-2">Jumlah Hari</th>
                    <th class="border border-gray-300 p-2">Hari Minggu</th>
                    <th class="border border-gray-300 p-2">Libur</th>
                    <th class="border border-gray-300 p-2">Hari Efektif</th>
                    <th class="border border-gray-300 p-2">Minggu Efektif</th>
                </tr>
            </thead>
            <tbody>
                ${semester1.map(s => `
                    <tr>
                        <td class="border border-gray-300 p-2">${s.month}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.daysInMonth}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.sundays}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.holidays}</td>
                        <td class="border border-gray-300 p-2 text-center font-bold">${s.effectiveDays}</td>
                        <td class="border border-gray-300 p-2 text-center">${Math.floor(s.effectiveDays / 6)}</td>
                    </tr>
                `).join('')}
                <tr class="bg-blue-50 font-bold">
                    <td class="border border-gray-300 p-2">JUMLAH</td>
                    <td class="border border-gray-300 p-2 text-center">${semester1.reduce((a, b) => a + b.daysInMonth, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester1.reduce((a, b) => a + b.sundays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester1.reduce((a, b) => a + b.holidays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester1.reduce((a, b) => a + b.effectiveDays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester1.reduce((a, b) => a + Math.floor(b.effectiveDays / 6), 0)}</td>
                </tr>
            </tbody>
        </table>
        
        <table class="w-full border-collapse text-sm">
            <thead>
                <tr class="bg-green-100">
                    <th class="border border-gray-300 p-2" colspan="7">SEMESTER 2 (GENAP)</th>
                </tr>
                <tr class="bg-gray-100">
                    <th class="border border-gray-300 p-2">Bulan</th>
                    <th class="border border-gray-300 p-2">Jumlah Hari</th>
                    <th class="border border-gray-300 p-2">Hari Minggu</th>
                    <th class="border border-gray-300 p-2">Libur</th>
                    <th class="border border-gray-300 p-2">Hari Efektif</th>
                    <th class="border border-gray-300 p-2">Minggu Efektif</th>
                </tr>
            </thead>
            <tbody>
                ${semester2.map(s => `
                    <tr>
                        <td class="border border-gray-300 p-2">${s.month}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.daysInMonth}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.sundays}</td>
                        <td class="border border-gray-300 p-2 text-center">${s.holidays}</td>
                        <td class="border border-gray-300 p-2 text-center font-bold">${s.effectiveDays}</td>
                        <td class="border border-gray-300 p-2 text-center">${Math.floor(s.effectiveDays / 6)}</td>
                    </tr>
                `).join('')}
                <tr class="bg-green-50 font-bold">
                    <td class="border border-gray-300 p-2">JUMLAH</td>
                    <td class="border border-gray-300 p-2 text-center">${semester2.reduce((a, b) => a + b.daysInMonth, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester2.reduce((a, b) => a + b.sundays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester2.reduce((a, b) => a + b.holidays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester2.reduce((a, b) => a + b.effectiveDays, 0)}</td>
                    <td class="border border-gray-300 p-2 text-center">${semester2.reduce((a, b) => a + Math.floor(b.effectiveDays / 6), 0)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// =====================================================
// JADWAL PELAJARAN PAGE
// =====================================================
function renderJadwalPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-clock text-orange-600 mr-2"></i>
                            Jadwal Pelajaran
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">
                            <i class="fas fa-shield-alt text-green-500 mr-1"></i>
                            Sistem validasi otomatis untuk mencegah jadwal bentrok
                        </p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showAddScheduleModal()" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Tambah Jadwal
                        </button>
                        <button onclick="exportJadwalToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportJadwalToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="jadwalFilterKelas" onchange="loadJadwalData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                        <select id="jadwalFilterRombel" onchange="loadJadwalData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Semua Rombel</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                        <select id="jadwalFilterHari" onchange="loadJadwalData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Semua Hari</option>
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                            <option value="Sabtu">Sabtu</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tampilan</label>
                        <select id="jadwalView" onchange="loadJadwalData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="table">Tabel</option>
                            <option value="grid">Grid Mingguan</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Conflict Warning -->
            <div id="conflictWarning" class="hidden bg-red-50 border border-red-200 rounded-xl p-4">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-red-500 mt-1 mr-3"></i>
                    <div>
                        <h4 class="font-semibold text-red-800">Peringatan Jadwal Bentrok!</h4>
                        <div id="conflictDetails" class="text-sm text-red-700 mt-1"></div>
                    </div>
                </div>
            </div>
            
            <!-- Schedule Display -->
            <div id="jadwalContainer" class="bg-white rounded-xl shadow-sm overflow-hidden print-area">
                <!-- Schedule will be loaded here -->
            </div>
            
            <!-- Time Slots Reference -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h4 class="font-semibold text-gray-800 mb-4">Referensi Jam Pelajaran</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-sm">
                    ${generateTimeSlots().map((slot, i) => `
                        <div class="p-2 bg-gray-50 rounded text-center">
                            <span class="font-bold text-orange-600">JP ${i + 1}</span>
                            <p class="text-gray-600 text-xs">${slot}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateTimeSlots() {
    return [
        '07:00-07:35', '07:35-08:10', '08:10-08:45', '08:45-09:20',
        '09:35-10:10', '10:10-10:45', '10:45-11:20', '11:20-11:55',
        '12:30-13:05', '13:05-13:40'
    ];
}

function initJadwalPage() {
    loadJadwalData();
    setupScheduleListener();
}

function setupScheduleListener() {
    const npsn = APP_STATE.currentUser.npsn;
    const scheduleQuery = query(
        collection(db, COLLECTIONS.SCHEDULES),
        where('npsn', '==', npsn)
    );
    
    onSnapshot(scheduleQuery, (snapshot) => {
        APP_STATE.schedules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        loadJadwalData();
        checkConflicts();
    });
}

function loadJadwalData() {
    const container = document.getElementById('jadwalContainer');
    const view = document.getElementById('jadwalView').value;
    const filterKelas = document.getElementById('jadwalFilterKelas').value;
    const filterRombel = document.getElementById('jadwalFilterRombel').value;
    const filterHari = document.getElementById('jadwalFilterHari').value;
    
    let schedules = [...APP_STATE.schedules];
    
    // Apply filters
    if (filterKelas) schedules = schedules.filter(s => s.kelas === filterKelas);
    if (filterRombel) schedules = schedules.filter(s => s.rombel === filterRombel);
    if (filterHari) schedules = schedules.filter(s => s.hari === filterHari);
    
    if (view === 'grid') {
        renderScheduleGrid(container, schedules);
    } else {
        renderScheduleTable(container, schedules);
    }
}

function renderScheduleTable(container, schedules) {
    if (schedules.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <i class="fas fa-calendar-times text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Belum ada jadwal pelajaran</p>
                <button onclick="showAddScheduleModal()" class="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    <i class="fas fa-plus mr-2"></i>
                    Tambah Jadwal
                </button>
            </div>
        `;
        return;
    }
    
    // Sort by day and time
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    schedules.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari);
        if (dayDiff !== 0) return dayDiff;
        return a.jamKe - b.jamKe;
    });
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="w-full">
                <thead class="bg-orange-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hari</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jam Ke</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kelas/Rombel</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mata Pelajaran</th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Guru</th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${schedules.map(s => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">${s.hari}</span>
                            </td>
                            <td class="px-4 py-3 font-medium">JP ${s.jamKe}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">${generateTimeSlots()[s.jamKe - 1] || '-'}</td>
                            <td class="px-4 py-3">
                                <span class="font-medium">${s.kelas}</span>
                                <span class="text-gray-500">-${s.rombel}</span>
                            </td>
                            <td class="px-4 py-3 font-medium text-gray-800">${s.subjectName || s.subjectCode}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">${s.teacherName || '-'}</td>
                            <td class="px-4 py-3 text-center">
                                <button onclick="editSchedule('${s.id}')" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteSchedule('${s.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderScheduleGrid(container, schedules) {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const timeSlots = generateTimeSlots();
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full border-collapse min-w-[800px]">
                <thead>
                    <tr class="bg-orange-100">
                        <th class="border border-gray-300 p-2 w-20">Jam</th>
                        ${days.map(day => `<th class="border border-gray-300 p-2">${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${timeSlots.map((slot, i) => `
                        <tr>
                            <td class="border border-gray-300 p-2 text-center bg-gray-50">
                                <div class="font-bold text-sm">JP ${i + 1}</div>
                                <div class="text-xs text-gray-500">${slot}</div>
                            </td>
                            ${days.map(day => {
                                const daySchedules = schedules.filter(s => s.hari === day && s.jamKe === i + 1);
                                return `
                                    <td class="border border-gray-300 p-1 h-16 align-top">
                                        ${daySchedules.map(s => `
                                            <div class="text-xs p-1 rounded mb-1 ${getSubjectColor(s.subjectCode)}">
                                                <div class="font-medium truncate">${s.subjectCode}</div>
                                                <div class="text-[10px] opacity-80">${s.kelas}-${s.rombel}</div>
                                            </div>
                                        `).join('')}
                                    </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getSubjectColor(code) {
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-purple-100 text-purple-700',
        'bg-orange-100 text-orange-700',
        'bg-pink-100 text-pink-700',
        'bg-indigo-100 text-indigo-700',
        'bg-teal-100 text-teal-700',
        'bg-red-100 text-red-700'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

window.showAddScheduleModal = function(editData = null) {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const isEdit = editData !== null;
    
    const modal = document.createElement('div');
    modal.id = 'scheduleModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-${isEdit ? 'edit' : 'plus-circle'} text-orange-600 mr-2"></i>
                    ${isEdit ? 'Edit' : 'Tambah'} Jadwal Pelajaran
                </h3>
                <button onclick="closeModal('scheduleModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="scheduleForm" class="p-6 space-y-4">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Hari *</label>
                        <select name="hari" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Pilih Hari</option>
                            ${['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => 
                                `<option value="${h}" ${editData?.hari === h ? 'selected' : ''}>${h}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Jam Ke *</label>
                        <select name="jamKe" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Pilih Jam</option>
                            ${generateTimeSlots().map((slot, i) => 
                                `<option value="${i + 1}" ${editData?.jamKe === i + 1 ? 'selected' : ''}>JP ${i + 1} (${slot})</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
                        <select name="kelas" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => 
                                `<option value="${k}" ${editData?.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Rombel *</label>
                        <select name="rombel" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            <option value="">Pilih Rombel</option>
                            ${['A', 'B', 'C', 'D'].map(r => 
                                `<option value="${r}" ${editData?.rombel === r ? 'selected' : ''}>${r}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                    <select name="subjectCode" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        <option value="">Pilih Mata Pelajaran</option>
                        ${APP_STATE.subjects.map(s => 
                            `<option value="${s.kode}" data-name="${s.nama}" ${editData?.subjectCode === s.kode ? 'selected' : ''}>${s.nama}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Guru *</label>
                    <input type="text" name="teacherName" value="${editData?.teacherName || user.nama}" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="Nama guru pengampu">
                </div>
                
                <!-- Conflict Check Display -->
                <div id="scheduleConflictCheck" class="hidden p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-center text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <span id="conflictMessage"></span>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('scheduleModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" id="scheduleSubmitBtn" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    const form = document.getElementById('scheduleForm');
    
    // Real-time conflict check
    const checkFields = ['hari', 'jamKe', 'kelas', 'rombel', 'teacherName'];
    checkFields.forEach(field => {
        form.querySelector(`[name="${field}"]`).addEventListener('change', () => {
            checkScheduleConflict(form, editData?.id);
        });
    });
    
    form.addEventListener('submit', handleScheduleSubmit);
};

function checkScheduleConflict(form, editId = null) {
    const hari = form.querySelector('[name="hari"]').value;
    const jamKe = parseInt(form.querySelector('[name="jamKe"]').value);
    const kelas = form.querySelector('[name="kelas"]').value;
    const rombel = form.querySelector('[name="rombel"]').value;
    const teacherName = form.querySelector('[name="teacherName"]').value;
    
    if (!hari || !jamKe || !kelas || !rombel) return;
    
    const conflictDiv = document.getElementById('scheduleConflictCheck');
    const conflictMsg = document.getElementById('conflictMessage');
    const submitBtn = document.getElementById('scheduleSubmitBtn');
    
    // Check for conflicts
    const conflicts = [];
    
    // Check 1: Same day, same class, same rombel, same time slot
    const classConflict = APP_STATE.schedules.find(s => 
        s.id !== editId &&
        s.hari === hari &&
        s.jamKe === jamKe &&
        s.kelas === kelas &&
        s.rombel === rombel
    );
    
    if (classConflict) {
        conflicts.push(`Kelas ${kelas}-${rombel} sudah ada jadwal ${classConflict.subjectName || classConflict.subjectCode} oleh ${classConflict.teacherName} pada waktu tersebut`);
    }
    
    // Check 2: Same teacher, same day, same time slot (teacher can't be in two places)
    const teacherConflict = APP_STATE.schedules.find(s => 
        s.id !== editId &&
        s.hari === hari &&
        s.jamKe === jamKe &&
        s.teacherName.toLowerCase() === teacherName.toLowerCase() &&
        (s.kelas !== kelas || s.rombel !== rombel)
    );
    
    if (teacherConflict) {
        conflicts.push(`Guru ${teacherName} sudah mengajar di kelas ${teacherConflict.kelas}-${teacherConflict.rombel} pada waktu tersebut`);
    }
    
    if (conflicts.length > 0) {
        conflictDiv.classList.remove('hidden');
        conflictMsg.innerHTML = conflicts.join('<br>');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        conflictDiv.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const user = APP_STATE.currentUser;
    
    // Get subject name
    const subjectSelect = form.querySelector('select[name="subjectCode"]');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex].dataset.name;
    
    const scheduleData = {
        hari: formData.get('hari'),
        jamKe: parseInt(formData.get('jamKe')),
        kelas: formData.get('kelas'),
        rombel: formData.get('rombel'),
        subjectCode: formData.get('subjectCode'),
        subjectName: subjectName,
        teacherName: formData.get('teacherName'),
        teacherEmail: user.email,
        npsn: user.npsn,
        updatedAt: serverTimestamp()
    };
    
    // Final conflict check before saving
    const conflicts = checkForConflicts(scheduleData, id);
    if (conflicts.length > 0) {
        showToast('Jadwal bentrok! Silakan cek kembali.', 'error');
        return;
    }
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.SCHEDULES, id), scheduleData);
            showToast('Jadwal berhasil diperbarui!', 'success');
        } else {
            scheduleData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.SCHEDULES), scheduleData);
            showToast('Jadwal berhasil ditambahkan!', 'success');
        }
        
        closeModal('scheduleModal');
        
    } catch (error) {
        console.error('Error saving schedule:', error);
        showToast('Gagal menyimpan jadwal', 'error');
    }
}

function checkForConflicts(newSchedule, editId = null) {
    const conflicts = [];
    
    // Check class conflict
    const classConflict = APP_STATE.schedules.find(s => 
        s.id !== editId &&
        s.hari === newSchedule.hari &&
        s.jamKe === newSchedule.jamKe &&
        s.kelas === newSchedule.kelas &&
        s.rombel === newSchedule.rombel
    );
    
    if (classConflict) {
        conflicts.push({
            type: 'class',
            message: `Kelas ${newSchedule.kelas}-${newSchedule.rombel} sudah ada jadwal`,
            conflictWith: classConflict
        });
    }
    
    // Check teacher conflict
    const teacherConflict = APP_STATE.schedules.find(s => 
        s.id !== editId &&
        s.hari === newSchedule.hari &&
        s.jamKe === newSchedule.jamKe &&
        s.teacherName.toLowerCase() === newSchedule.teacherName.toLowerCase() &&
        (s.kelas !== newSchedule.kelas || s.rombel !== newSchedule.rombel)
    );
    
    if (teacherConflict) {
        conflicts.push({
            type: 'teacher',
            message: `Guru ${newSchedule.teacherName} sudah mengajar di tempat lain`,
            conflictWith: teacherConflict
        });
    }
    
    return conflicts;
}

function checkConflicts() {
    const conflictWarning = document.getElementById('conflictWarning');
    const conflictDetails = document.getElementById('conflictDetails');
    
    if (!conflictWarning) return;
    
    const allConflicts = [];
    
    APP_STATE.schedules.forEach((schedule, index) => {
        // Check for duplicate schedules
        const duplicates = APP_STATE.schedules.filter((s, i) => 
            i !== index &&
            s.hari === schedule.hari &&
            s.jamKe === schedule.jamKe &&
            s.kelas === schedule.kelas &&
            s.rombel === schedule.rombel
        );
        
        duplicates.forEach(dup => {
            if (!allConflicts.some(c => 
                (c.schedule1 === schedule.id && c.schedule2 === dup.id) ||
                (c.schedule1 === dup.id && c.schedule2 === schedule.id)
            )) {
                allConflicts.push({
                    type: 'class',
                    schedule1: schedule.id,
                    schedule2: dup.id,
                    message: `${schedule.hari} JP${schedule.jamKe}: Kelas ${schedule.kelas}-${schedule.rombel} bentrok antara ${schedule.subjectName} dan ${dup.subjectName}`
                });
            }
        });
    });
    
    if (allConflicts.length > 0) {
        conflictWarning.classList.remove('hidden');
        conflictDetails.innerHTML = allConflicts.map(c => `<p>• ${c.message}</p>`).join('');
    } else {
        conflictWarning.classList.add('hidden');
    }
}

window.editSchedule = function(id) {
    const schedule = APP_STATE.schedules.find(s => s.id === id);
    if (schedule) {
        showAddScheduleModal(schedule);
    }
};

window.deleteSchedule = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, id));
        showToast('Jadwal berhasil dihapus!', 'success');
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Gagal menghapus jadwal', 'error');
    }
};

// =====================================================
// PROTA (PROGRAM TAHUNAN) PAGE
// =====================================================
function renderProtaPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-calendar-alt text-teal-600 mr-2"></i>
                            Program Tahunan (Prota)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Program pembelajaran dalam satu tahun ajaran</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="generateProta()" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>
                            Generate Prota
                        </button>
                        <button onclick="exportProtaToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportProtaToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="protaFilterSubject" onchange="loadProtaData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">Pilih Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="protaFilterKelas" onchange="loadProtaData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Prota Preview -->
            <div id="protaPreview" class="bg-white rounded-xl shadow-sm p-6 print-area">
                <div class="text-center py-8">
                    <i class="fas fa-calendar-alt text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat Program Tahunan</p>
                </div>
            </div>
        </div>
    `;
}

function initProtaPage() {
    // Initialize
}

window.generateProta = function() {
    const subject = document.getElementById('protaFilterSubject').value;
    const kelas = document.getElementById('protaFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    loadProtaData();
    showToast('Prota berhasil di-generate!', 'success');
};

window.loadProtaData = function() {
    const subject = document.getElementById('protaFilterSubject').value;
    const kelas = document.getElementById('protaFilterKelas').value;
    const preview = document.getElementById('protaPreview');
    const user = APP_STATE.currentUser;
    
    if (!subject || !kelas) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-calendar-alt text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat Program Tahunan</p>
            </div>
        `;
        return;
    }
    
    // Get CP data for this subject and class
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    
    if (cpData.length === 0) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-5xl mb-4"></i>
                <p class="text-gray-500">Tidak ada data CP. Silakan tambah CP terlebih dahulu.</p>
                <button onclick="switchTab('master-cp')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Tambah CP
                </button>
            </div>
        `;
        return;
    }
    
    // Calculate weeks per semester (roughly 18 weeks each)
    const weeksPerSemester = 18;
    const cpPerSemester = Math.ceil(cpData.length / 2);
    
    const semester1CPs = cpData.slice(0, cpPerSemester);
    const semester2CPs = cpData.slice(cpPerSemester);
    
    preview.innerHTML = `
        <!-- Kop Dokumen -->
        <div class="border-b-2 border-black pb-4 mb-6">
            <div class="text-center">
                <h2 class="text-xl font-bold uppercase">PROGRAM TAHUNAN (PROTA)</h2>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <table class="w-full">
                        <tr><td class="w-36">Satuan Pendidikan</td><td>: ${user.schoolName}</td></tr>
                        <tr><td>Mata Pelajaran</td><td>: ${subjectInfo?.nama || subject}</td></tr>
                        <tr><td>Kelas / Semester</td><td>: ${kelas} / Ganjil & Genap</td></tr>
                    </table>
                </div>
                <div>
                    <table class="w-full">
                        <tr><td class="w-36">Tahun Pelajaran</td><td>: ${user.tahunAjaran}</td></tr>
                        <tr><td>Fase</td><td>: ${cpData[0]?.fase || '-'}</td></tr>
                        <tr><td>Guru Pengampu</td><td>: ${user.nama}</td></tr>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Semester 1 -->
        <div class="mb-8">
            <h3 class="font-bold text-lg mb-4 bg-teal-100 p-2 rounded">SEMESTER 1 (GANJIL)</h3>
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-400 p-2 w-12">No</th>
                        <th class="border border-gray-400 p-2">Elemen</th>
                        <th class="border border-gray-400 p-2">Capaian Pembelajaran</th>
                        <th class="border border-gray-400 p-2 w-28">Alokasi Waktu</th>
                        <th class="border border-gray-400 p-2 w-20">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${semester1CPs.map((cp, i) => `
                        <tr>
                            <td class="border border-gray-400 p-2 text-center">${i + 1}</td>
                            <td class="border border-gray-400 p-2">${cp.elemen}</td>
                            <td class="border border-gray-400 p-2">${cp.capaianPembelajaran}</td>
                            <td class="border border-gray-400 p-2 text-center">${Math.floor(weeksPerSemester / semester1CPs.length) * 2} JP</td>
                            <td class="border border-gray-400 p-2 text-center">-</td>
                        </tr>
                    `).join('')}
                    <tr class="bg-gray-50 font-bold">
                        <td class="border border-gray-400 p-2 text-center" colspan="3">Jumlah JP Semester 1</td>
                        <td class="border border-gray-400 p-2 text-center">${semester1CPs.length * Math.floor(weeksPerSemester / semester1CPs.length) * 2} JP</td>
                        <td class="border border-gray-400 p-2"></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Semester 2 -->
        <div class="mb-8 page-break">
            <h3 class="font-bold text-lg mb-4 bg-green-100 p-2 rounded">SEMESTER 2 (GENAP)</h3>
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-400 p-2 w-12">No</th>
                        <th class="border border-gray-400 p-2">Elemen</th>
                        <th class="border border-gray-400 p-2">Capaian Pembelajaran</th>
                        <th class="border border-gray-400 p-2 w-28">Alokasi Waktu</th>
                        <th class="border border-gray-400 p-2 w-20">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${semester2CPs.length > 0 ? semester2CPs.map((cp, i) => `
                        <tr>
                            <td class="border border-gray-400 p-2 text-center">${i + 1}</td>
                            <td class="border border-gray-400 p-2">${cp.elemen}</td>
                            <td class="border border-gray-400 p-2">${cp.capaianPembelajaran}</td>
                            <td class="border border-gray-400 p-2 text-center">${Math.floor(weeksPerSemester / semester2CPs.length) * 2} JP</td>
                            <td class="border border-gray-400 p-2 text-center">-</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td class="border border-gray-400 p-2 text-center" colspan="5">Tidak ada data CP untuk semester 2</td>
                        </tr>
                    `}
                    ${semester2CPs.length > 0 ? `
                        <tr class="bg-gray-50 font-bold">
                            <td class="border border-gray-400 p-2 text-center" colspan="3">Jumlah JP Semester 2</td>
                            <td class="border border-gray-400 p-2 text-center">${semester2CPs.length * Math.floor(weeksPerSemester / semester2CPs.length) * 2} JP</td>
                            <td class="border border-gray-400 p-2"></td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">(...........................)</p>
                <p>NIP. ................................</p>
            </div>
            <div>
                <p>..................., ..................... 20....</p>
                <p>Guru Mata Pelajaran</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">${user.nama}</p>
                <p>NIP. ${user.nip || '................................'}</p>
            </div>
        </div>
    `;
};

// =====================================================
// PROMES (PROGRAM SEMESTER) PAGE
// =====================================================
function renderPromesPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-calendar-week text-pink-600 mr-2"></i>
                            Program Semester (Promes)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Program pembelajaran dalam satu semester</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="generatePromes()" class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>
                            Generate Promes
                        </button>
                        <button onclick="exportPromesToExcel()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel
                        </button>
                        <button onclick="exportPromesToPDF()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="promesFilterSubject" onchange="loadPromesData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            <option value="">Pilih Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="promesFilterKelas" onchange="loadPromesData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select id="promesFilterSemester" onchange="loadPromesData()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                            <option value="1">Semester 1 (Ganjil)</option>
                            <option value="2">Semester 2 (Genap)</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Promes Preview -->
            <div id="promesPreview" class="bg-white rounded-xl shadow-sm p-6 print-area overflow-x-auto">
                <div class="text-center py-8">
                    <i class="fas fa-calendar-week text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat Program Semester</p>
                </div>
            </div>
        </div>
    `;
}

function initPromesPage() {
    // Initialize
}

window.generatePromes = function() {
    const subject = document.getElementById('promesFilterSubject').value;
    const kelas = document.getElementById('promesFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    loadPromesData();
    showToast('Promes berhasil di-generate!', 'success');
};

window.loadPromesData = function() {
    const subject = document.getElementById('promesFilterSubject').value;
    const kelas = document.getElementById('promesFilterKelas').value;
    const semester = document.getElementById('promesFilterSemester').value;
    const preview = document.getElementById('promesPreview');
    const user = APP_STATE.currentUser;
    
    if (!subject || !kelas) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-calendar-week text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500">Pilih mata pelajaran dan kelas untuk melihat Program Semester</p>
            </div>
        `;
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => 
        cp.subjectCode === subject && cp.kelas === kelas
    );
    
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    
    if (cpData.length === 0) {
        preview.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-5xl mb-4"></i>
                <p class="text-gray-500">Tidak ada data CP untuk ditampilkan</p>
            </div>
        `;
        return;
    }
    
    // Generate months for the semester
    const semester1Months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const semester2Months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    const months = semester === '1' ? semester1Months : semester2Months;
    
    // Calculate which CPs go in which semester
    const cpPerSemester = Math.ceil(cpData.length / 2);
    const semesterCPs = semester === '1' ? cpData.slice(0, cpPerSemester) : cpData.slice(cpPerSemester);
    
    preview.innerHTML = `
        <!-- Kop Dokumen -->
        <div class="border-b-2 border-black pb-4 mb-6">
            <div class="text-center">
                <h2 class="text-xl font-bold uppercase">PROGRAM SEMESTER (PROMES)</h2>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                    <table class="w-full">
                        <tr><td class="w-36">Satuan Pendidikan</td><td>: ${user.schoolName}</td></tr>
                        <tr><td>Mata Pelajaran</td><td>: ${subjectInfo?.nama || subject}</td></tr>
                        <tr><td>Kelas / Semester</td><td>: ${kelas} / ${semester === '1' ? 'Ganjil' : 'Genap'}</td></tr>
                    </table>
                </div>
                <div>
                    <table class="w-full">
                        <tr><td class="w-36">Tahun Pelajaran</td><td>: ${user.tahunAjaran}</td></tr>
                        <tr><td>Fase</td><td>: ${cpData[0]?.fase || '-'}</td></tr>
                        <tr><td>Guru Pengampu</td><td>: ${user.nama}</td></tr>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Tabel Promes -->
        <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs min-w-[1000px]">
                <thead>
                    <tr class="bg-pink-100">
                        <th class="border border-gray-400 p-2 w-8" rowspan="2">No</th>
                        <th class="border border-gray-400 p-2" rowspan="2">Elemen / Capaian Pembelajaran</th>
                        <th class="border border-gray-400 p-2 w-12" rowspan="2">JP</th>
                        ${months.map(m => `<th class="border border-gray-400 p-1" colspan="4">${m}</th>`).join('')}
                        <th class="border border-gray-400 p-2 w-16" rowspan="2">Ket</th>
                    </tr>
                    <tr class="bg-pink-50">
                        ${months.map(() => `
                            <th class="border border-gray-400 p-1 w-6">1</th>
                            <th class="border border-gray-400 p-1 w-6">2</th>
                            <th class="border border-gray-400 p-1 w-6">3</th>
                            <th class="border border-gray-400 p-1 w-6">4</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${(semesterCPs.length > 0 ? semesterCPs : cpData.slice(0, 5)).map((cp, index) => {
                        // Calculate which weeks this CP should be marked
                        const weeksPerCP = Math.ceil(24 / (semesterCPs.length || 5));
                        const startWeek = index * weeksPerCP;
                        const endWeek = Math.min(startWeek + weeksPerCP, 24);
                        
                        return `
                            <tr>
                                <td class="border border-gray-400 p-2 text-center">${index + 1}</td>
                                <td class="border border-gray-400 p-2">
                                    <span class="font-medium">${cp.elemen}</span><br>
                                    <span class="text-gray-600">${cp.capaianPembelajaran.substring(0, 100)}...</span>
                                </td>
                                <td class="border border-gray-400 p-2 text-center">${weeksPerCP * 2}</td>
                                ${Array(24).fill(0).map((_, weekIndex) => {
                                    const isActive = weekIndex >= startWeek && weekIndex < endWeek;
                                    return `<td class="border border-gray-400 p-1 text-center ${isActive ? 'bg-pink-300' : ''}">${isActive ? '✓' : ''}</td>`;
                                }).join('')}
                                <td class="border border-gray-400 p-2 text-center">-</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Keterangan -->
        <div class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
            <h4 class="font-bold mb-2">Keterangan:</h4>
            <ul class="list-disc list-inside text-gray-600">
                <li>Angka 1-4 pada setiap bulan menunjukkan minggu ke-1 sampai minggu ke-4</li>
                <li>Tanda ✓ menunjukkan pelaksanaan pembelajaran</li>
                <li>JP = Jam Pelajaran</li>
            </ul>
        </div>
        
        <!-- Tanda Tangan -->
        <div class="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
                <p>Mengetahui,</p>
                <p>Kepala Sekolah</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">(...........................)</p>
                <p>NIP. ................................</p>
            </div>
            <div>
                <p>..................., ..................... 20....</p>
                <p>Guru Mata Pelajaran</p>
                <div class="h-20"></div>
                <p class="font-bold border-t border-black pt-1 inline-block">${user.nama}</p>
                <p>NIP. ${user.nip || '................................'}</p>
            </div>
        </div>
    `;
};

// =====================================================
// EXPORT FUNCTIONS FOR KALENDER, JADWAL, PROTA, PROMES
// =====================================================

window.exportKalenderToExcel = function() {
    const events = APP_STATE.calendarEvents;
    const user = APP_STATE.currentUser;
    
    const data = [
        ['KALENDER PENDIDIKAN'],
        [`${user.schoolName} - NPSN: ${user.npsn}`],
        [`Tahun Ajaran: ${user.tahunAjaran}`],
        [],
        ['No', 'Tanggal', 'Tanggal Selesai', 'Kegiatan', 'Jenis', 'Keterangan', 'Dibuat Oleh']
    ];
    
    events.forEach((e, i) => {
        data.push([
            i + 1,
            e.date,
            e.endDate || e.date,
            e.title,
            e.type,
            e.description || '-',
            e.createdByName || '-'
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kalender');
    XLSX.writeFile(wb, `Kalender_Pendidikan_${user.npsn}.xlsx`);
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportKalenderToPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = APP_STATE.currentUser;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('KALENDER PENDIDIKAN', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${user.schoolName}`, 105, 22, { align: 'center' });
    doc.text(`Tahun Ajaran: ${user.tahunAjaran}`, 105, 28, { align: 'center' });
    
    const tableData = APP_STATE.calendarEvents.map((e, i) => [
        i + 1,
        e.date,
        e.title,
        e.type,
        e.createdByName || '-'
    ]);
    
    doc.autoTable({
        startY: 35,
        head: [['No', 'Tanggal', 'Kegiatan', 'Jenis', 'Dibuat Oleh']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] }
    });
    
    doc.save(`Kalender_Pendidikan_${user.npsn}.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

window.exportJadwalToExcel = function() {
    const schedules = APP_STATE.schedules;
    const user = APP_STATE.currentUser;
    
    const data = [
        ['JADWAL PELAJARAN'],
        [`${user.schoolName}`],
        [],
        ['No', 'Hari', 'Jam Ke', 'Waktu', 'Kelas', 'Rombel', 'Mata Pelajaran', 'Guru']
    ];
    
    const timeSlots = generateTimeSlots();
    schedules.forEach((s, i) => {
        data.push([
            i + 1,
            s.hari,
            `JP ${s.jamKe}`,
            timeSlots[s.jamKe - 1] || '-',
            s.kelas,
            s.rombel,
            s.subjectName || s.subjectCode,
            s.teacherName
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
    XLSX.writeFile(wb, `Jadwal_Pelajaran_${user.schoolName}.xlsx`);
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportJadwalToPDF = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const user = APP_STATE.currentUser;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('JADWAL PELAJARAN', 148, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(user.schoolName, 148, 22, { align: 'center' });
    
    const timeSlots = generateTimeSlots();
    const tableData = APP_STATE.schedules.map((s, i) => [
        i + 1,
        s.hari,
        `JP ${s.jamKe}`,
        timeSlots[s.jamKe - 1] || '-',
        `${s.kelas}-${s.rombel}`,
        s.subjectName || s.subjectCode,
        s.teacherName
    ]);
    
    doc.autoTable({
        startY: 28,
        head: [['No', 'Hari', 'Jam', 'Waktu', 'Kelas', 'Mapel', 'Guru']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [255, 152, 0] }
    });
    
    doc.save(`Jadwal_Pelajaran.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

window.exportProtaToExcel = function() {
    const subject = document.getElementById('protaFilterSubject').value;
    const kelas = document.getElementById('protaFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => cp.subjectCode === subject && cp.kelas === kelas);
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    const data = [
        ['PROGRAM TAHUNAN (PROTA)'],
        [`Mata Pelajaran: ${subjectInfo?.nama || subject}`],
        [`Kelas: ${kelas}`],
        [`Tahun Ajaran: ${user.tahunAjaran}`],
        [],
        ['No', 'Semester', 'Elemen', 'Capaian Pembelajaran', 'Alokasi Waktu']
    ];
    
    cpData.forEach((cp, i) => {
        data.push([
            i + 1,
            i < Math.ceil(cpData.length / 2) ? 'Ganjil' : 'Genap',
            cp.elemen,
            cp.capaianPembelajaran,
            '8 JP'
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prota');
    XLSX.writeFile(wb, `Prota_${subject}_Kelas${kelas}.xlsx`);
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportProtaToPDF = function() {
    const subject = document.getElementById('protaFilterSubject').value;
    const kelas = document.getElementById('protaFilterKelas').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const cpData = APP_STATE.masterData.filter(cp => cp.subjectCode === subject && cp.kelas === kelas);
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PROGRAM TAHUNAN (PROTA)', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${subjectInfo?.nama || subject} - Kelas ${kelas}`, 105, 22, { align: 'center' });
    
    const tableData = cpData.map((cp, i) => [
        i + 1,
        i < Math.ceil(cpData.length / 2) ? 'Ganjil' : 'Genap',
        cp.elemen,
        cp.capaianPembelajaran.substring(0, 60) + '...',
        '8 JP'
    ]);
    
    doc.autoTable({
        startY: 30,
        head: [['No', 'Semester', 'Elemen', 'Capaian Pembelajaran', 'JP']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }
    });
    
    doc.save(`Prota_${subject}_Kelas${kelas}.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

window.exportPromesToExcel = function() {
    const subject = document.getElementById('promesFilterSubject').value;
    const kelas = document.getElementById('promesFilterKelas').value;
    const semester = document.getElementById('promesFilterSemester').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const cpData = APP_STATE.masterData.filter(cp => cp.subjectCode === subject && cp.kelas === kelas);
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    const user = APP_STATE.currentUser;
    
    const months = semester === '1' ? 
        ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'] :
        ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    const header = ['No', 'Elemen', 'CP', 'JP'];
    months.forEach(m => {
        header.push(`${m} Mg1`, `${m} Mg2`, `${m} Mg3`, `${m} Mg4`);
    });
    
    const data = [
        ['PROGRAM SEMESTER (PROMES)'],
        [`Mata Pelajaran: ${subjectInfo?.nama || subject}`],
        [`Kelas: ${kelas} - Semester ${semester === '1' ? 'Ganjil' : 'Genap'}`],
        [],
        header
    ];
    
    cpData.forEach((cp, i) => {
        const row = [i + 1, cp.elemen, cp.capaianPembelajaran.substring(0, 50), 8];
        // Add week markers
        for (let w = 0; w < 24; w++) {
            row.push(w >= i * 4 && w < (i + 1) * 4 ? '✓' : '');
        }
        data.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Promes');
    XLSX.writeFile(wb, `Promes_${subject}_Kelas${kelas}_Semester${semester}.xlsx`);
    showToast('File Excel berhasil diunduh!', 'success');
};

window.exportPromesToPDF = function() {
    const subject = document.getElementById('promesFilterSubject').value;
    const kelas = document.getElementById('promesFilterKelas').value;
    const semester = document.getElementById('promesFilterSemester').value;
    
    if (!subject || !kelas) {
        showToast('Pilih mata pelajaran dan kelas terlebih dahulu', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const cpData = APP_STATE.masterData.filter(cp => cp.subjectCode === subject && cp.kelas === kelas);
    const subjectInfo = APP_STATE.subjects.find(s => s.kode === subject);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PROGRAM SEMESTER (PROMES)', 148, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${subjectInfo?.nama || subject} - Kelas ${kelas} - Semester ${semester === '1' ? 'Ganjil' : 'Genap'}`, 148, 22, { align: 'center' });
    
    const tableData = cpData.map((cp, i) => [
        i + 1,
        cp.elemen,
        cp.capaianPembelajaran.substring(0, 40),
        '8 JP'
    ]);
    
    doc.autoTable({
        startY: 28,
        head: [['No', 'Elemen', 'Capaian Pembelajaran', 'JP']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [236, 72, 153] }
    });
    
    doc.save(`Promes_${subject}_Kelas${kelas}_Semester${semester}.pdf`);
    showToast('File PDF berhasil diunduh!', 'success');
};

// =====================================================
// CONTINUE TO PART 5...
// =====================================================
// =====================================================
// MODUL AJAR PAGE
// =====================================================
function renderModulAjarPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-file-alt text-cyan-600 mr-2"></i>
                            Modul Ajar
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Perencanaan pembelajaran berbasis Capaian Pembelajaran</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showAddModulAjarModal()" class="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Buat Modul Ajar
                        </button>
                        <button onclick="generateModulAjarFromCP()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-magic mr-2"></i>
                            Generate dari CP
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="modulFilterSubject" onchange="loadModulAjarList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                            <option value="">Semua Mata Pelajaran</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="modulFilterKelas" onchange="loadModulAjarList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <input type="text" id="modulSearch" onkeyup="loadModulAjarList()" placeholder="Cari modul ajar..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    </div>
                </div>
            </div>
            
            <!-- Modul List -->
            <div id="modulAjarList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Modul cards will be loaded here -->
            </div>
            
            <div id="modulEmptyState" class="hidden bg-white rounded-xl shadow-sm p-8 text-center">
                <i class="fas fa-file-alt text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 mb-4">Belum ada modul ajar</p>
                <div class="flex justify-center space-x-3">
                    <button onclick="showAddModulAjarModal()" class="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                        <i class="fas fa-plus mr-2"></i>
                        Buat Manual
                    </button>
                    <button onclick="generateModulAjarFromCP()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-magic mr-2"></i>
                        Generate dari CP
                    </button>
                </div>
            </div>
        </div>
    `;
}

// State for modul ajar
let modulAjarData = [];

async function initModulAjarPage() {
    await loadModulAjarFromDB();
    loadModulAjarList();
}

async function loadModulAjarFromDB() {
    try {
        const npsn = APP_STATE.currentUser.npsn;
        const modulQuery = query(
            collection(db, COLLECTIONS.MODUL_AJAR),
            where('npsn', '==', npsn)
        );
        const snapshot = await getDocs(modulQuery);
        modulAjarData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading modul ajar:', error);
    }
}

function loadModulAjarList() {
    const container = document.getElementById('modulAjarList');
    const emptyState = document.getElementById('modulEmptyState');
    
    const filterSubject = document.getElementById('modulFilterSubject')?.value || '';
    const filterKelas = document.getElementById('modulFilterKelas')?.value || '';
    const search = document.getElementById('modulSearch')?.value?.toLowerCase() || '';
    
    let filtered = [...modulAjarData];
    
    if (filterSubject) filtered = filtered.filter(m => m.subjectCode === filterSubject);
    if (filterKelas) filtered = filtered.filter(m => m.kelas === filterKelas);
    if (search) filtered = filtered.filter(m => 
        m.judul?.toLowerCase().includes(search) || 
        m.topik?.toLowerCase().includes(search)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    container.innerHTML = filtered.map(modul => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <div class="h-2 ${getSubjectColor(modul.subjectCode).split(' ')[0]}"></div>
            <div class="p-5">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <span class="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">${modul.subjectCode}</span>
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs ml-1">Kelas ${modul.kelas}</span>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="viewModulAjar('${modul.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Lihat">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                        <button onclick="editModulAjar('${modul.id}')" class="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="deleteModulAjar('${modul.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <h4 class="font-semibold text-gray-800 mb-2 line-clamp-2">${modul.judul || 'Modul Ajar'}</h4>
                <p class="text-sm text-gray-500 mb-3">${modul.topik || '-'}</p>
                
                <div class="flex items-center justify-between text-xs text-gray-400">
                    <span><i class="fas fa-clock mr-1"></i>${modul.aloksiWaktu || '-'} JP</span>
                    <span><i class="fas fa-calendar mr-1"></i>Pertemuan ${modul.pertemuan || '-'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

window.showAddModulAjarModal = function(editData = null, cpData = null) {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const isEdit = editData !== null;
    
    // Pre-fill from CP if provided
    const prefill = cpData || editData || {};
    
    const modal = document.createElement('div');
    modal.id = 'modulAjarModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-file-alt text-cyan-600 mr-2"></i>
                    ${isEdit ? 'Edit' : 'Buat'} Modul Ajar
                </h3>
                <button onclick="closeModal('modulAjarModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="modulAjarForm" class="p-6">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <!-- Informasi Umum -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                        Informasi Umum
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                            <select name="subjectCode" required onchange="updateModulElemenOptions(this.value)"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                                <option value="">Pilih Mapel</option>
                                ${APP_STATE.subjects.map(s => `
                                    <option value="${s.kode}" data-name="${s.nama}" ${prefill.subjectCode === s.kode ? 'selected' : ''}>${s.nama}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
                            <select name="kelas" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                                <option value="">Pilih Kelas</option>
                                ${kelasList.map(k => `<option value="${k}" ${prefill.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                            <input type="text" name="fase" value="${prefill.fase || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Contoh: A, B, C">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Judul Modul *</label>
                            <input type="text" name="judul" value="${prefill.judul || ''}" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Judul modul ajar">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Topik/Tema</label>
                            <input type="text" name="topik" value="${prefill.topik || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Topik atau tema pembelajaran">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu (JP)</label>
                            <input type="number" name="alokasiWaktu" value="${prefill.alokasiWaktu || 2}" min="1"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pertemuan ke-</label>
                            <input type="number" name="pertemuan" value="${prefill.pertemuan || 1}" min="1"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Moda Pembelajaran</label>
                            <select name="moda" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                                <option value="tatap_muka" ${prefill.moda === 'tatap_muka' ? 'selected' : ''}>Tatap Muka</option>
                                <option value="daring" ${prefill.moda === 'daring' ? 'selected' : ''}>Daring</option>
                                <option value="blended" ${prefill.moda === 'blended' ? 'selected' : ''}>Blended</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Capaian Pembelajaran -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-bullseye text-green-500 mr-2"></i>
                        Capaian & Tujuan Pembelajaran
                    </h4>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Elemen CP</label>
                        <select name="elemen" id="modulElemenSelect"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                            <option value="">Pilih Elemen</option>
                        </select>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran</label>
                        <textarea name="capaianPembelajaran" rows="2"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                            placeholder="Capaian pembelajaran yang akan dicapai">${prefill.capaianPembelajaran || ''}</textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran *</label>
                        <div id="tujuanPembelajaranContainer">
                            ${(prefill.tujuanPembelajaran || ['']).map((tp, i) => `
                                <div class="flex items-center space-x-2 mb-2">
                                    <span class="text-sm text-gray-500 w-8">${i + 1}.</span>
                                    <input type="text" name="tujuanPembelajaran[]" value="${tp}" required
                                        class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Tujuan pembelajaran">
                                    <button type="button" onclick="removeTujuanInput(this)" class="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" onclick="addTujuanInput()" class="text-sm text-cyan-600 hover:text-cyan-700">
                            <i class="fas fa-plus mr-1"></i>Tambah Tujuan Pembelajaran
                        </button>
                    </div>
                </div>
                
                <!-- Dimensi Profil Lulusan -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-star text-yellow-500 mr-2"></i>
                        Dimensi Profil Lulusan
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${DIMENSI_PROFIL_LULUSAN.map(dim => `
                            <label class="flex items-center p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                <input type="checkbox" name="dimensiProfil" value="${dim.id}"
                                    ${(prefill.dimensiProfil || []).includes(dim.id) ? 'checked' : ''}
                                    class="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500">
                                <span class="ml-2 text-xs text-gray-700">${dim.nama}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Pemahaman Bermakna & Pertanyaan Pemantik -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-lightbulb text-orange-500 mr-2"></i>
                        Pemahaman Bermakna & Pertanyaan Pemantik
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pemahaman Bermakna</label>
                            <textarea name="pemahamanBermakna" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Pemahaman bermakna yang diharapkan...">${prefill.pemahamanBermakna || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pertanyaan Pemantik</label>
                            <textarea name="pertanyaanPemantik" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Pertanyaan pemantik untuk memulai pembelajaran...">${prefill.pertanyaanPemantik || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Kegiatan Pembelajaran -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-tasks text-purple-500 mr-2"></i>
                        Kegiatan Pembelajaran
                    </h4>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-2">Pendahuluan</span>
                            </label>
                            <textarea name="kegiatanPendahuluan" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Kegiatan pendahuluan: salam, doa, apersepsi, motivasi...">${prefill.kegiatanPendahuluan || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs mr-2">Inti</span>
                            </label>
                            <textarea name="kegiatanInti" rows="5"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Kegiatan inti pembelajaran: eksplorasi, diskusi, praktik...">${prefill.kegiatanInti || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                <span class="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs mr-2">Penutup</span>
                            </label>
                            <textarea name="kegiatanPenutup" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Kegiatan penutup: refleksi, kesimpulan, tugas, doa...">${prefill.kegiatanPenutup || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Asesmen & Sumber Belajar -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-clipboard-check text-red-500 mr-2"></i>
                        Asesmen & Sumber Belajar
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Asesmen Formatif</label>
                            <textarea name="asesmenFormatif" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Asesmen selama proses pembelajaran...">${prefill.asesmenFormatif || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Asesmen Sumatif</label>
                            <textarea name="asesmenSumatif" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Asesmen di akhir pembelajaran...">${prefill.asesmenSumatif || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sumber Belajar</label>
                            <textarea name="sumberBelajar" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Buku, video, website, dll...">${prefill.sumberBelajar || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Media & Alat</label>
                            <textarea name="mediaAlat" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Media dan alat yang digunakan...">${prefill.mediaAlat || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Diferensiasi -->
                <div class="mb-6">
                    <h4 class="text-md font-semibold text-gray-700 mb-4 pb-2 border-b">
                        <i class="fas fa-users text-indigo-500 mr-2"></i>
                        Pembelajaran Berdiferensiasi
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Diferensiasi Konten</label>
                            <textarea name="diferensiasiKonten" rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Penyesuaian materi...">${prefill.diferensiasiKonten || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Diferensiasi Proses</label>
                            <textarea name="diferensiasiProses" rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Penyesuaian cara belajar...">${prefill.diferensiasiProses || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Diferensiasi Produk</label>
                            <textarea name="diferensiasiProduk" rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Penyesuaian hasil belajar...">${prefill.diferensiasiProduk || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('modulAjarModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'} Modul
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Initialize elemen options
    if (prefill.subjectCode) {
        updateModulElemenOptions(prefill.subjectCode, prefill.elemen);
    }
    
    document.getElementById('modulAjarForm').addEventListener('submit', handleModulAjarSubmit);
};

window.updateModulElemenOptions = function(subjectCode, selectedElemen = '') {
    const subject = APP_STATE.subjects.find(s => s.kode === subjectCode);
    const elemenSelect = document.getElementById('modulElemenSelect');
    
    if (!subject || !subject.elemen) {
        elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>';
        return;
    }
    
    elemenSelect.innerHTML = `
        <option value="">Pilih Elemen</option>
        ${subject.elemen.map(e => `<option value="${e}" ${selectedElemen === e ? 'selected' : ''}>${e}</option>`).join('')}
    `;
};

window.addTujuanInput = function() {
    const container = document.getElementById('tujuanPembelajaranContainer');
    const count = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 mb-2';
    div.innerHTML = `
        <span class="text-sm text-gray-500 w-8">${count}.</span>
        <input type="text" name="tujuanPembelajaran[]" required
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            placeholder="Tujuan pembelajaran">
        <button type="button" onclick="removeTujuanInput(this)" class="p-2 text-red-500 hover:bg-red-50 rounded">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
};

window.removeTujuanInput = function(btn) {
    const container = document.getElementById('tujuanPembelajaranContainer');
    if (container.children.length > 1) {
        btn.closest('div').remove();
        // Renumber
        Array.from(container.children).forEach((child, i) => {
            child.querySelector('span').textContent = `${i + 1}.`;
        });
    }
};

async function handleModulAjarSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const user = APP_STATE.currentUser;
    
    // Get arrays
    const tujuanPembelajaran = formData.getAll('tujuanPembelajaran[]').filter(t => t.trim());
    const dimensiProfil = [];
    form.querySelectorAll('input[name="dimensiProfil"]:checked').forEach(cb => {
        dimensiProfil.push(cb.value);
    });
    
    // Get subject name
    const subjectSelect = form.querySelector('select[name="subjectCode"]');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.dataset.name || '';
    
    const modulData = {
        subjectCode: formData.get('subjectCode'),
        subjectName: subjectName,
        kelas: formData.get('kelas'),
        fase: formData.get('fase'),
        judul: formData.get('judul'),
        topik: formData.get('topik'),
        alokasiWaktu: parseInt(formData.get('alokasiWaktu')) || 2,
        pertemuan: parseInt(formData.get('pertemuan')) || 1,
        moda: formData.get('moda'),
        elemen: formData.get('elemen'),
        capaianPembelajaran: formData.get('capaianPembelajaran'),
        tujuanPembelajaran: tujuanPembelajaran,
        dimensiProfil: dimensiProfil,
        pemahamanBermakna: formData.get('pemahamanBermakna'),
        pertanyaanPemantik: formData.get('pertanyaanPemantik'),
        kegiatanPendahuluan: formData.get('kegiatanPendahuluan'),
        kegiatanInti: formData.get('kegiatanInti'),
        kegiatanPenutup: formData.get('kegiatanPenutup'),
        asesmenFormatif: formData.get('asesmenFormatif'),
        asesmenSumatif: formData.get('asesmenSumatif'),
        sumberBelajar: formData.get('sumberBelajar'),
        mediaAlat: formData.get('mediaAlat'),
        diferensiasiKonten: formData.get('diferensiasiKonten'),
        diferensiasiProses: formData.get('diferensiasiProses'),
        diferensiasiProduk: formData.get('diferensiasiProduk'),
        npsn: user.npsn,
        createdBy: user.email,
        createdByName: user.nama,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.MODUL_AJAR, id), modulData);
            showToast('Modul ajar berhasil diperbarui!', 'success');
        } else {
            modulData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.MODUL_AJAR), modulData);
            showToast('Modul ajar berhasil disimpan!', 'success');
        }
        
        closeModal('modulAjarModal');
        await loadModulAjarFromDB();
        loadModulAjarList();
        
    } catch (error) {
        console.error('Error saving modul ajar:', error);
        showToast('Gagal menyimpan modul ajar', 'error');
    }
}

window.generateModulAjarFromCP = function() {
    // Show CP selection modal
    const modal = document.createElement('div');
    modal.id = 'selectCPModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-magic text-purple-600 mr-2"></i>
                    Pilih CP untuk Generate Modul Ajar
                </h3>
                <button onclick="closeModal('selectCPModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6">
                ${APP_STATE.masterData.length === 0 ? `
                    <div class="text-center py-8">
                        <i class="fas fa-database text-gray-300 text-5xl mb-4"></i>
                        <p class="text-gray-500">Belum ada data CP. Tambahkan CP terlebih dahulu.</p>
                        <button onclick="closeModal('selectCPModal'); switchTab('master-cp')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                            Tambah CP
                        </button>
                    </div>
                ` : `
                    <div class="space-y-3">
                        ${APP_STATE.masterData.map(cp => `
                            <div onclick="generateModulFromSelectedCP('${cp.id}')" 
                                class="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2 mb-2">
                                            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${cp.subjectCode}</span>
                                            <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Kelas ${cp.kelas}</span>
                                            <span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">${cp.elemen}</span>
                                        </div>
                                        <p class="text-sm text-gray-700 line-clamp-2">${cp.capaianPembelajaran}</p>
                                    </div>
                                    <i class="fas fa-chevron-right text-gray-400 ml-3"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.generateModulFromSelectedCP = function(cpId) {
    const cp = APP_STATE.masterData.find(c => c.id === cpId);
    if (!cp) return;
    
    closeModal('selectCPModal');
    
    // Pre-fill modul ajar with CP data
    const prefillData = {
        subjectCode: cp.subjectCode,
        subjectName: cp.subjectName,
        kelas: cp.kelas,
        fase: cp.fase,
        elemen: cp.elemen,
        capaianPembelajaran: cp.capaianPembelajaran,
        dimensiProfil: cp.dimensiProfil || [],
        judul: `Modul Ajar: ${cp.elemen}`,
        topik: cp.elemen,
        tujuanPembelajaran: [
            `Peserta didik dapat memahami konsep ${cp.elemen.toLowerCase()}`,
            `Peserta didik dapat menganalisis ${cp.elemen.toLowerCase()} dalam konteks kehidupan`,
            `Peserta didik dapat menerapkan ${cp.elemen.toLowerCase()} dalam kehidupan sehari-hari`
        ],
        pemahamanBermakna: `Melalui pembelajaran ini, peserta didik diharapkan dapat memahami secara mendalam tentang ${cp.elemen.toLowerCase()} dan bagaimana penerapannya dalam kehidupan nyata.`,
        pertanyaanPemantik: `Apa yang kalian ketahui tentang ${cp.elemen.toLowerCase()}? Bagaimana ${cp.elemen.toLowerCase()} berkaitan dengan kehidupan sehari-hari?`
    };
    
    showAddModulAjarModal(null, prefillData);
    showToast('Data CP berhasil dimuat ke form Modul Ajar', 'success');
};

window.viewModulAjar = function(id) {
    const modul = modulAjarData.find(m => m.id === id);
    if (!modul) return;
    
    const user = APP_STATE.currentUser;
    
    const modal = document.createElement('div');
    modal.id = 'viewModulModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 no-print">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-file-alt text-cyan-600 mr-2"></i>
                    Preview Modul Ajar
                </h3>
                <div class="flex items-center space-x-2">
                    <button onclick="exportModulToPDF('${id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        <i class="fas fa-file-pdf mr-1"></i> PDF
                    </button>
                    <button onclick="printModul('${id}')" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        <i class="fas fa-print mr-1"></i> Cetak
                    </button>
                    <button onclick="closeModal('viewModulModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                        <i class="fas fa-times text-gray-500"></i>
                    </button>
                </div>
            </div>
            
            <div id="modulPrintArea" class="p-8 print-area">
                <!-- Kop Modul -->
                <div class="border-b-2 border-black pb-4 mb-6 text-center">
                    <h2 class="text-xl font-bold uppercase">MODUL AJAR</h2>
                    <h3 class="text-lg font-semibold mt-2">${modul.judul}</h3>
                </div>
                
                <!-- Informasi Umum -->
                <table class="w-full mb-6 text-sm">
                    <tr>
                        <td class="py-1 w-40">Satuan Pendidikan</td>
                        <td class="py-1">: ${user.schoolName}</td>
                        <td class="py-1 w-32">Alokasi Waktu</td>
                        <td class="py-1">: ${modul.alokasiWaktu || 2} JP</td>
                    </tr>
                    <tr>
                        <td class="py-1">Mata Pelajaran</td>
                        <td class="py-1">: ${modul.subjectName || modul.subjectCode}</td>
                        <td class="py-1">Pertemuan</td>
                        <td class="py-1">: ${modul.pertemuan || 1}</td>
                    </tr>
                    <tr>
                        <td class="py-1">Kelas / Fase</td>
                        <td class="py-1">: ${modul.kelas} / ${modul.fase || '-'}</td>
                        <td class="py-1">Moda</td>
                        <td class="py-1">: ${modul.moda === 'tatap_muka' ? 'Tatap Muka' : modul.moda === 'daring' ? 'Daring' : 'Blended'}</td>
                    </tr>
                    <tr>
                        <td class="py-1">Elemen</td>
                        <td class="py-1">: ${modul.elemen || '-'}</td>
                        <td class="py-1">Topik</td>
                        <td class="py-1">: ${modul.topik || '-'}</td>
                    </tr>
                </table>
                
                <!-- Capaian Pembelajaran -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">A. CAPAIAN PEMBELAJARAN</h4>
                    <p class="mt-2 text-sm px-3">${modul.capaianPembelajaran || '-'}</p>
                </div>
                
                <!-- Tujuan Pembelajaran -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">B. TUJUAN PEMBELAJARAN</h4>
                    <ol class="list-decimal list-inside mt-2 text-sm px-3 space-y-1">
                        ${(modul.tujuanPembelajaran || []).map(tp => `<li>${tp}</li>`).join('')}
                    </ol>
                </div>
                
                <!-- Dimensi Profil Lulusan -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">C. DIMENSI PROFIL LULUSAN</h4>
                    <div class="flex flex-wrap gap-2 mt-2 px-3">
                        ${(modul.dimensiProfil || []).map(id => {
                            const dim = DIMENSI_PROFIL_LULUSAN.find(d => d.id === id);
                            return dim ? `<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">${dim.nama}</span>` : '';
                        }).join('') || '<span class="text-gray-500 text-sm">-</span>'}
                    </div>
                </div>
                
                <!-- Pemahaman Bermakna -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">D. PEMAHAMAN BERMAKNA</h4>
                    <p class="mt-2 text-sm px-3">${modul.pemahamanBermakna || '-'}</p>
                </div>
                
                <!-- Pertanyaan Pemantik -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">E. PERTANYAAN PEMANTIK</h4>
                    <p class="mt-2 text-sm px-3">${modul.pertanyaanPemantik || '-'}</p>
                </div>
                
                <!-- Kegiatan Pembelajaran -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">F. KEGIATAN PEMBELAJARAN</h4>
                    <table class="w-full border-collapse mt-2 text-sm">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-300 p-2 w-32">Tahap</th>
                                <th class="border border-gray-300 p-2">Kegiatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border border-gray-300 p-2 font-medium bg-blue-50">Pendahuluan</td>
                                <td class="border border-gray-300 p-2 whitespace-pre-line">${modul.kegiatanPendahuluan || '-'}</td>
                            </tr>
                            <tr>
                                <td class="border border-gray-300 p-2 font-medium bg-green-50">Inti</td>
                                <td class="border border-gray-300 p-2 whitespace-pre-line">${modul.kegiatanInti || '-'}</td>
                            </tr>
                            <tr>
                                <td class="border border-gray-300 p-2 font-medium bg-orange-50">Penutup</td>
                                <td class="border border-gray-300 p-2 whitespace-pre-line">${modul.kegiatanPenutup || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Asesmen -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">G. ASESMEN</h4>
                    <div class="grid grid-cols-2 gap-4 mt-2 px-3 text-sm">
                        <div>
                            <p class="font-medium">Formatif:</p>
                            <p class="text-gray-600">${modul.asesmenFormatif || '-'}</p>
                        </div>
                        <div>
                            <p class="font-medium">Sumatif:</p>
                            <p class="text-gray-600">${modul.asesmenSumatif || '-'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Sumber & Media -->
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800 bg-cyan-100 px-3 py-2 rounded">H. SUMBER BELAJAR & MEDIA</h4>
                    <div class="grid grid-cols-2 gap-4 mt-2 px-3 text-sm">
                        <div>
                            <p class="font-medium">Sumber Belajar:</p>
                            <p class="text-gray-600 whitespace-pre-line">${modul.sumberBelajar || '-'}</p>
                        </div>
                        <div>
                            <p class="font-medium">Media & Alat:</p>
                            <p class="text-gray-600 whitespace-pre-line">${modul.mediaAlat || '-'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Tanda Tangan -->
                <div class="mt-8 grid grid-cols-2 gap-8 text-center text-sm">
                    <div>
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <div class="h-20"></div>
                        <p class="font-bold border-t border-black pt-1 inline-block">(...........................)</p>
                        <p>NIP. ................................</p>
                    </div>
                    <div>
                        <p>..................., ..................... 20....</p>
                        <p>Guru Mata Pelajaran</p>
                        <div class="h-20"></div>
                        <p class="font-bold border-t border-black pt-1 inline-block">${user.nama}</p>
                        <p>NIP. ${user.nip || '................................'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.editModulAjar = function(id) {
    const modul = modulAjarData.find(m => m.id === id);
    if (modul) {
        showAddModulAjarModal(modul);
    }
};

window.deleteModulAjar = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ajar ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.MODUL_AJAR, id));
        showToast('Modul ajar berhasil dihapus!', 'success');
        await loadModulAjarFromDB();
        loadModulAjarList();
    } catch (error) {
        console.error('Error deleting modul ajar:', error);
        showToast('Gagal menghapus modul ajar', 'error');
    }
};

window.printModul = function(id) {
    window.print();
};

window.exportModulToPDF = function(id) {
    const modul = modulAjarData.find(m => m.id === id);
    if (!modul) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = APP_STATE.currentUser;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('MODUL AJAR', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.text(modul.judul, 105, 22, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    let y = 35;
    
    doc.text(`Satuan Pendidikan: ${user.schoolName}`, 20, y);
    doc.text(`Mata Pelajaran: ${modul.subjectName}`, 20, y + 5);
    doc.text(`Kelas: ${modul.kelas}`, 20, y + 10);
    
    y += 20;
    doc.setFont(undefined, 'bold');
    doc.text('Capaian Pembelajaran:', 20, y);
    doc.setFont(undefined, 'normal');
    const cpLines = doc.splitTextToSize(modul.capaianPembelajaran || '-', 170);
    doc.text(cpLines, 20, y + 5);
    
    y += 10 + (cpLines.length * 4);
    doc.setFont(undefined, 'bold');
    doc.text('Tujuan Pembelajaran:', 20, y);
    doc.setFont(undefined, 'normal');
    (modul.tujuanPembelajaran || []).forEach((tp, i) => {
        y += 5;
        doc.text(`${i + 1}. ${tp}`, 25, y);
    });
    
    doc.save(`Modul_Ajar_${modul.judul.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF berhasil diunduh!', 'success');
};

// =====================================================
// LKPD (LEMBAR KERJA PESERTA DIDIK) PAGE
// =====================================================
function renderLKPDPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-file-signature text-amber-600 mr-2"></i>
                            Lembar Kerja Peserta Didik (LKPD)
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Buat lembar kerja untuk aktivitas pembelajaran</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showAddLKPDModal()" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Buat LKPD
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="lkpdFilterSubject" onchange="loadLKPDList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Mapel</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="lkpdFilterKelas" onchange="loadLKPDList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <input type="text" id="lkpdSearch" onkeyup="loadLKPDList()" placeholder="Cari LKPD..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
            </div>
            
            <!-- LKPD List -->
            <div id="lkpdList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- LKPD cards will be loaded here -->
            </div>
            
            <div id="lkpdEmptyState" class="hidden bg-white rounded-xl shadow-sm p-8 text-center">
                <i class="fas fa-file-signature text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 mb-4">Belum ada LKPD</p>
                <button onclick="showAddLKPDModal()" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                    <i class="fas fa-plus mr-2"></i>
                    Buat LKPD
                </button>
            </div>
        </div>
    `;
}

let lkpdData = [];

async function initLKPDPage() {
    await loadLKPDFromDB();
    loadLKPDList();
}

async function loadLKPDFromDB() {
    try {
        const npsn = APP_STATE.currentUser.npsn;
        const lkpdQuery = query(
            collection(db, COLLECTIONS.LKPD),
            where('npsn', '==', npsn)
        );
        const snapshot = await getDocs(lkpdQuery);
        lkpdData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading LKPD:', error);
    }
}

function loadLKPDList() {
    const container = document.getElementById('lkpdList');
    const emptyState = document.getElementById('lkpdEmptyState');
    
    const filterSubject = document.getElementById('lkpdFilterSubject')?.value || '';
    const filterKelas = document.getElementById('lkpdFilterKelas')?.value || '';
    const search = document.getElementById('lkpdSearch')?.value?.toLowerCase() || '';
    
    let filtered = [...lkpdData];
    
    if (filterSubject) filtered = filtered.filter(l => l.subjectCode === filterSubject);
    if (filterKelas) filtered = filtered.filter(l => l.kelas === filterKelas);
    if (search) filtered = filtered.filter(l => 
        l.judul?.toLowerCase().includes(search) || 
        l.topik?.toLowerCase().includes(search)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    container.innerHTML = filtered.map(lkpd => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
            <div class="h-2 bg-amber-500"></div>
            <div class="p-5">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <span class="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">${lkpd.subjectCode}</span>
                        <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs ml-1">Kelas ${lkpd.kelas}</span>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="viewLKPD('${lkpd.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                            <i class="fas fa-eye text-sm"></i>
                        </button>
                        <button onclick="editLKPD('${lkpd.id}')" class="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button onclick="deleteLKPD('${lkpd.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <h4 class="font-semibold text-gray-800 mb-2">${lkpd.judul || 'LKPD'}</h4>
                <p class="text-sm text-gray-500 mb-3">${lkpd.topik || '-'}</p>
                
                <div class="flex items-center text-xs text-gray-400">
                    <span><i class="fas fa-list-ol mr-1"></i>${(lkpd.soal || []).length} soal</span>
                </div>
            </div>
        </div>
    `).join('');
}

window.showAddLKPDModal = function(editData = null) {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const isEdit = editData !== null;
    
    const modal = document.createElement('div');
    modal.id = 'lkpdModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-file-signature text-amber-600 mr-2"></i>
                    ${isEdit ? 'Edit' : 'Buat'} LKPD
                </h3>
                <button onclick="closeModal('lkpdModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="lkpdForm" class="p-6">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                        <select name="subjectCode" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Mapel</option>
                            ${APP_STATE.subjects.map(s => `
                                <option value="${s.kode}" data-name="${s.nama}" ${editData?.subjectCode === s.kode ? 'selected' : ''}>${s.nama}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
                        <select name="kelas" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}" ${editData?.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Waktu (menit)</label>
                        <input type="number" name="waktu" value="${editData?.waktu || 45}" min="1"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Judul LKPD *</label>
                        <input type="text" name="judul" value="${editData?.judul || ''}" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Judul LKPD">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Topik/Materi</label>
                        <input type="text" name="topik" value="${editData?.topik || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Topik atau materi">
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                    <textarea name="tujuan" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Tujuan dari LKPD ini...">${editData?.tujuan || ''}</textarea>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Petunjuk Pengerjaan</label>
                    <textarea name="petunjuk" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Petunjuk bagi peserta didik...">${editData?.petunjuk || ''}</textarea>
                </div>
                
                <!-- Soal/Kegiatan -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Soal/Kegiatan</label>
                    <div id="lkpdSoalContainer" class="space-y-4">
                        ${(editData?.soal || [{ pertanyaan: '', jenis: 'essay' }]).map((s, i) => renderLKPDSoalItem(s, i)).join('')}
                    </div>
                    <button type="button" onclick="addLKPDSoal()" class="mt-3 text-sm text-amber-600 hover:text-amber-700">
                        <i class="fas fa-plus mr-1"></i>Tambah Soal/Kegiatan
                    </button>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('lkpdModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'} LKPD
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    document.getElementById('lkpdForm').addEventListener('submit', handleLKPDSubmit);
};

function renderLKPDSoalItem(soal, index) {
    return `
        <div class="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div class="flex items-start justify-between mb-3">
                <span class="font-medium text-gray-700">Soal ${index + 1}</span>
                <button type="button" onclick="removeLKPDSoal(this)" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-3">
                <select name="jenisSoal[]" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="essay" ${soal.jenis === 'essay' ? 'selected' : ''}>Essay/Uraian</option>
                    <option value="isian" ${soal.jenis === 'isian' ? 'selected' : ''}>Isian Singkat</option>
                    <option value="kegiatan" ${soal.jenis === 'kegiatan' ? 'selected' : ''}>Kegiatan Praktik</option>
                    <option value="diskusi" ${soal.jenis === 'diskusi' ? 'selected' : ''}>Diskusi Kelompok</option>
                </select>
            </div>
            <textarea name="pertanyaan[]" rows="3" required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Tuliskan pertanyaan atau instruksi kegiatan...">${soal.pertanyaan || ''}</textarea>
        </div>
    `;
}

window.addLKPDSoal = function() {
    const container = document.getElementById('lkpdSoalContainer');
    const index = container.children.length;
    const div = document.createElement('div');
    div.innerHTML = renderLKPDSoalItem({ pertanyaan: '', jenis: 'essay' }, index);
    container.appendChild(div.firstElementChild);
};

window.removeLKPDSoal = function(btn) {
    const container = document.getElementById('lkpdSoalContainer');
    if (container.children.length > 1) {
        btn.closest('.p-4').remove();
        // Renumber
        Array.from(container.children).forEach((child, i) => {
            child.querySelector('span').textContent = `Soal ${i + 1}`;
        });
    }
};

async function handleLKPDSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const user = APP_STATE.currentUser;
    
    // Get soal array
    const pertanyaan = formData.getAll('pertanyaan[]');
    const jenisSoal = formData.getAll('jenisSoal[]');
    const soal = pertanyaan.map((p, i) => ({
        pertanyaan: p,
        jenis: jenisSoal[i] || 'essay'
    })).filter(s => s.pertanyaan.trim());
    
    const subjectSelect = form.querySelector('select[name="subjectCode"]');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.dataset.name || '';
    
    const lkpdDataSave = {
        subjectCode: formData.get('subjectCode'),
        subjectName: subjectName,
        kelas: formData.get('kelas'),
        waktu: parseInt(formData.get('waktu')) || 45,
        judul: formData.get('judul'),
        topik: formData.get('topik'),
        tujuan: formData.get('tujuan'),
        petunjuk: formData.get('petunjuk'),
        soal: soal,
        npsn: user.npsn,
        createdBy: user.email,
        createdByName: user.nama,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.LKPD, id), lkpdDataSave);
            showToast('LKPD berhasil diperbarui!', 'success');
        } else {
            lkpdDataSave.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.LKPD), lkpdDataSave);
            showToast('LKPD berhasil disimpan!', 'success');
        }
        
        closeModal('lkpdModal');
        await loadLKPDFromDB();
        loadLKPDList();
        
    } catch (error) {
        console.error('Error saving LKPD:', error);
        showToast('Gagal menyimpan LKPD', 'error');
    }
}

window.viewLKPD = function(id) {
    const lkpd = lkpdData.find(l => l.id === id);
    if (!lkpd) return;
    
    const user = APP_STATE.currentUser;
    
    const modal = document.createElement('div');
    modal.id = 'viewLKPDModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 no-print">
                <h3 class="text-lg font-semibold text-gray-800">Preview LKPD</h3>
                <div class="flex items-center space-x-2">
                    <button onclick="exportLKPDToPDF('${id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">
                        <i class="fas fa-file-pdf mr-1"></i> PDF
                    </button>
                    <button onclick="closeModal('viewLKPDModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                        <i class="fas fa-times text-gray-500"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-8 print-area">
                <!-- Header LKPD -->
                <div class="border-2 border-black p-4 mb-6">
                    <div class="text-center mb-4">
                        <h2 class="text-xl font-bold">LEMBAR KERJA PESERTA DIDIK (LKPD)</h2>
                        <h3 class="text-lg font-semibold mt-1">${lkpd.judul}</h3>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm border-t border-gray-300 pt-3">
                        <div>
                            <p><strong>Mata Pelajaran:</strong> ${lkpd.subjectName || lkpd.subjectCode}</p>
                            <p><strong>Kelas:</strong> ${lkpd.kelas}</p>
                        </div>
                        <div>
                            <p><strong>Waktu:</strong> ${lkpd.waktu || 45} menit</p>
                            <p><strong>Topik:</strong> ${lkpd.topik || '-'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Identitas Siswa -->
                <div class="border border-gray-400 p-4 mb-6 bg-gray-50">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="mb-2">Nama: _______________________________</p>
                            <p>Kelas: _______________________________</p>
                        </div>
                        <div>
                            <p class="mb-2">No. Absen: ___________________________</p>
                            <p>Tanggal: ______________________________</p>
                        </div>
                    </div>
                </div>
                
                <!-- Tujuan -->
                ${lkpd.tujuan ? `
                    <div class="mb-6">
                        <h4 class="font-bold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-bullseye text-green-500 mr-2"></i>
                            Tujuan Pembelajaran
                        </h4>
                        <p class="text-sm bg-green-50 p-3 rounded-lg">${lkpd.tujuan}</p>
                    </div>
                ` : ''}
                
                <!-- Petunjuk -->
                ${lkpd.petunjuk ? `
                    <div class="mb-6">
                        <h4 class="font-bold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            Petunjuk Pengerjaan
                        </h4>
                        <p class="text-sm bg-blue-50 p-3 rounded-lg">${lkpd.petunjuk}</p>
                    </div>
                ` : ''}
                
                <!-- Soal -->
                <div class="mb-6">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-tasks text-amber-500 mr-2"></i>
                        Kegiatan / Soal
                    </h4>
                    
                    ${(lkpd.soal || []).map((s, i) => `
                        <div class="mb-6 p-4 border border-gray-300 rounded-lg">
                            <div class="flex items-start mb-3">
                                <span class="font-bold mr-2">${i + 1}.</span>
                                <div class="flex-1">
                                    <span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs mr-2">
                                        ${s.jenis === 'essay' ? 'Uraian' : s.jenis === 'isian' ? 'Isian' : s.jenis === 'kegiatan' ? 'Praktik' : 'Diskusi'}
                                    </span>
                                    <p class="mt-2">${s.pertanyaan}</p>
                                </div>
                            </div>
                            
                            <!-- Answer area -->
                            <div class="mt-4">
                                ${s.jenis === 'isian' ? `
                                    <div class="border-b-2 border-gray-400 py-4">Jawaban: ___________________________________</div>
                                ` : `
                                    <div class="border border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50">
                                        <p class="text-gray-400 text-sm">Jawaban:</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Footer -->
                <div class="text-center text-sm text-gray-500 border-t pt-4 mt-8">
                    <p>${user.schoolName} | ${lkpd.subjectName || lkpd.subjectCode} | Kelas ${lkpd.kelas}</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.editLKPD = function(id) {
    const lkpd = lkpdData.find(l => l.id === id);
    if (lkpd) {
        showAddLKPDModal(lkpd);
    }
};

window.deleteLKPD = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus LKPD ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.LKPD, id));
        showToast('LKPD berhasil dihapus!', 'success');
        await loadLKPDFromDB();
        loadLKPDList();
    } catch (error) {
        console.error('Error deleting LKPD:', error);
        showToast('Gagal menghapus LKPD', 'error');
    }
};

window.exportLKPDToPDF = function(id) {
    const lkpd = lkpdData.find(l => l.id === id);
    if (!lkpd) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = APP_STATE.currentUser;
    
    // Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('LEMBAR KERJA PESERTA DIDIK (LKPD)', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(lkpd.judul, 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Mata Pelajaran: ${lkpd.subjectName}`, 20, 35);
    doc.text(`Kelas: ${lkpd.kelas}`, 20, 41);
    doc.text(`Waktu: ${lkpd.waktu} menit`, 120, 35);
    
    // Student info
    doc.text('Nama: _______________________', 20, 55);
    doc.text('Kelas: ______________________', 120, 55);
    
    let y = 70;
    
    // Soal
    (lkpd.soal || []).forEach((s, i) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`${i + 1}. [${s.jenis.toUpperCase()}]`, 20, y);
        doc.setFont(undefined, 'normal');
        
        const lines = doc.splitTextToSize(s.pertanyaan, 170);
        doc.text(lines, 20, y + 6);
        
        y += 10 + (lines.length * 5) + 30; // Space for answer
    });
    
    doc.save(`LKPD_${lkpd.judul.replace(/\s+/g, '_')}.pdf`);
    showToast('PDF berhasil diunduh!', 'success');
};

// =====================================================
// CONTINUE IN NEXT PART (Bank Soal & Export Modal)
// =====================================================
// =====================================================
// BANK SOAL PAGE
// =====================================================
function renderBankSoalPage() {
    const user = APP_STATE.currentUser;
    if (!user?.npsn) {
        return renderNeedLoginMessage();
    }
    
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">
                            <i class="fas fa-question-circle text-violet-600 mr-2"></i>
                            Bank Soal
                        </h3>
                        <p class="text-sm text-gray-500 mt-1">Kelola koleksi soal untuk berbagai keperluan asesmen</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="showAddSoalModal()" class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Tambah Soal
                        </button>
                        <button onclick="showImportSoalModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-file-import mr-2"></i>
                            Import
                        </button>
                        <button onclick="showGenerateSoalModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-cogs mr-2"></i>
                            Generate Paket
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-white rounded-xl p-4 shadow-sm text-center">
                    <div class="text-2xl font-bold text-violet-600" id="totalSoal">0</div>
                    <div class="text-sm text-gray-500">Total Soal</div>
                </div>
                <div class="bg-white rounded-xl p-4 shadow-sm text-center">
                    <div class="text-2xl font-bold text-blue-600" id="soalPG">0</div>
                    <div class="text-sm text-gray-500">Pilihan Ganda</div>
                </div>
                <div class="bg-white rounded-xl p-4 shadow-sm text-center">
                    <div class="text-2xl font-bold text-green-600" id="soalEssay">0</div>
                    <div class="text-sm text-gray-500">Essay</div>
                </div>
                <div class="bg-white rounded-xl p-4 shadow-sm text-center">
                    <div class="text-2xl font-bold text-orange-600" id="soalIsian">0</div>
                    <div class="text-sm text-gray-500">Isian Singkat</div>
                </div>
                <div class="bg-white rounded-xl p-4 shadow-sm text-center">
                    <div class="text-2xl font-bold text-pink-600" id="soalBenarSalah">0</div>
                    <div class="text-sm text-gray-500">Benar/Salah</div>
                </div>
            </div>
            
            <!-- Filter -->
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="bankSoalFilterSubject" onchange="loadBankSoalList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Mapel</option>
                            ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                        <select id="bankSoalFilterKelas" onchange="loadBankSoalList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                        <select id="bankSoalFilterTipe" onchange="loadBankSoalList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Tipe</option>
                            <option value="pg">Pilihan Ganda</option>
                            <option value="essay">Essay</option>
                            <option value="isian">Isian Singkat</option>
                            <option value="benar_salah">Benar/Salah</option>
                            <option value="menjodohkan">Menjodohkan</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan</label>
                        <select id="bankSoalFilterLevel" onchange="loadBankSoalList()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Semua Level</option>
                            <option value="mudah">Mudah (C1-C2)</option>
                            <option value="sedang">Sedang (C3-C4)</option>
                            <option value="sulit">Sulit (C5-C6)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Cari</label>
                        <input type="text" id="bankSoalSearch" onkeyup="loadBankSoalList()" placeholder="Cari soal..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
            </div>
            
            <!-- Soal List -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="table-responsive">
                    <table class="w-full">
                        <thead class="bg-violet-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                                    <input type="checkbox" id="selectAllSoal" onchange="toggleSelectAllSoal()" class="w-4 h-4 rounded">
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Soal</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">Mapel</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-20">Kelas</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-28">Tipe</th>
                                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-24">Level</th>
                                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="bankSoalTableBody" class="divide-y divide-gray-200">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <div id="bankSoalEmptyState" class="hidden p-8 text-center">
                    <i class="fas fa-question-circle text-gray-300 text-5xl mb-4"></i>
                    <p class="text-gray-500">Belum ada soal di bank soal</p>
                    <button onclick="showAddSoalModal()" class="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                        <i class="fas fa-plus mr-2"></i>
                        Tambah Soal Pertama
                    </button>
                </div>
                
                <!-- Bulk Actions -->
                <div id="bulkActions" class="hidden border-t border-gray-200 p-4 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600"><span id="selectedCount">0</span> soal dipilih</span>
                        <div class="flex space-x-2">
                            <button onclick="exportSelectedSoal()" class="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                <i class="fas fa-file-export mr-1"></i> Export
                            </button>
                            <button onclick="deleteSelectedSoal()" class="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                                <i class="fas fa-trash mr-1"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

let bankSoalData = [];
let selectedSoalIds = [];

async function initBankSoalPage() {
    await loadBankSoalFromDB();
    loadBankSoalList();
    updateBankSoalStats();
}

async function loadBankSoalFromDB() {
    try {
        const npsn = APP_STATE.currentUser.npsn;
        const soalQuery = query(
            collection(db, COLLECTIONS.BANK_SOAL),
            where('npsn', '==', npsn)
        );
        const snapshot = await getDocs(soalQuery);
        bankSoalData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading bank soal:', error);
    }
}

function updateBankSoalStats() {
    document.getElementById('totalSoal').textContent = bankSoalData.length;
    document.getElementById('soalPG').textContent = bankSoalData.filter(s => s.tipe === 'pg').length;
    document.getElementById('soalEssay').textContent = bankSoalData.filter(s => s.tipe === 'essay').length;
    document.getElementById('soalIsian').textContent = bankSoalData.filter(s => s.tipe === 'isian').length;
    document.getElementById('soalBenarSalah').textContent = bankSoalData.filter(s => s.tipe === 'benar_salah').length;
}

function loadBankSoalList() {
    const tbody = document.getElementById('bankSoalTableBody');
    const emptyState = document.getElementById('bankSoalEmptyState');
    
    const filterSubject = document.getElementById('bankSoalFilterSubject')?.value || '';
    const filterKelas = document.getElementById('bankSoalFilterKelas')?.value || '';
    const filterTipe = document.getElementById('bankSoalFilterTipe')?.value || '';
    const filterLevel = document.getElementById('bankSoalFilterLevel')?.value || '';
    const search = document.getElementById('bankSoalSearch')?.value?.toLowerCase() || '';
    
    let filtered = [...bankSoalData];
    
    if (filterSubject) filtered = filtered.filter(s => s.subjectCode === filterSubject);
    if (filterKelas) filtered = filtered.filter(s => s.kelas === filterKelas);
    if (filterTipe) filtered = filtered.filter(s => s.tipe === filterTipe);
    if (filterLevel) filtered = filtered.filter(s => s.level === filterLevel);
    if (search) filtered = filtered.filter(s => 
        s.pertanyaan?.toLowerCase().includes(search) ||
        s.elemen?.toLowerCase().includes(search)
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tbody.innerHTML = filtered.map(soal => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
                <input type="checkbox" class="soal-checkbox w-4 h-4 rounded" value="${soal.id}" 
                    onchange="toggleSoalSelection('${soal.id}')" ${selectedSoalIds.includes(soal.id) ? 'checked' : ''}>
            </td>
            <td class="px-4 py-3">
                <div class="max-w-md">
                    <p class="text-sm text-gray-800 line-clamp-2">${soal.pertanyaan}</p>
                    ${soal.elemen ? `<span class="text-xs text-gray-500">Elemen: ${soal.elemen}</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${soal.subjectCode}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">${soal.kelas}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 ${getTipeColorClass(soal.tipe)} rounded text-xs">${getTipeLabel(soal.tipe)}</span>
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 ${getLevelColorClass(soal.level)} rounded text-xs">${getLevelLabel(soal.level)}</span>
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-1">
                    <button onclick="viewSoal('${soal.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Lihat">
                        <i class="fas fa-eye text-sm"></i>
                    </button>
                    <button onclick="editSoal('${soal.id}')" class="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="duplicateSoal('${soal.id}')" class="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Duplikat">
                        <i class="fas fa-copy text-sm"></i>
                    </button>
                    <button onclick="deleteSoal('${soal.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getTipeColorClass(tipe) {
    const colors = {
        'pg': 'bg-blue-100 text-blue-700',
        'essay': 'bg-green-100 text-green-700',
        'isian': 'bg-orange-100 text-orange-700',
        'benar_salah': 'bg-pink-100 text-pink-700',
        'menjodohkan': 'bg-purple-100 text-purple-700'
    };
    return colors[tipe] || 'bg-gray-100 text-gray-700';
}

function getTipeLabel(tipe) {
    const labels = {
        'pg': 'Pilihan Ganda',
        'essay': 'Essay',
        'isian': 'Isian Singkat',
        'benar_salah': 'Benar/Salah',
        'menjodohkan': 'Menjodohkan'
    };
    return labels[tipe] || tipe;
}

function getLevelColorClass(level) {
    const colors = {
        'mudah': 'bg-green-100 text-green-700',
        'sedang': 'bg-yellow-100 text-yellow-700',
        'sulit': 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
}

function getLevelLabel(level) {
    const labels = {
        'mudah': 'Mudah',
        'sedang': 'Sedang',
        'sulit': 'Sulit'
    };
    return labels[level] || level;
}

window.showAddSoalModal = function(editData = null) {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    const isEdit = editData !== null;
    
    const modal = document.createElement('div');
    modal.id = 'soalModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto modal-enter">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-question-circle text-violet-600 mr-2"></i>
                    ${isEdit ? 'Edit' : 'Tambah'} Soal
                </h3>
                <button onclick="closeModal('soalModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="soalForm" class="p-6">
                <input type="hidden" name="id" value="${editData?.id || ''}">
                
                <!-- Info Soal -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran *</label>
                        <select name="subjectCode" required onchange="updateSoalElemenOptions(this.value)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Mapel</option>
                            ${APP_STATE.subjects.map(s => `
                                <option value="${s.kode}" data-name="${s.nama}" ${editData?.subjectCode === s.kode ? 'selected' : ''}>${s.nama}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kelas *</label>
                        <select name="kelas" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Kelas</option>
                            ${kelasList.map(k => `<option value="${k}" ${editData?.kelas === k ? 'selected' : ''}>Kelas ${k}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipe Soal *</label>
                        <select name="tipe" required onchange="togglePilihanContainer(this.value)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Tipe</option>
                            <option value="pg" ${editData?.tipe === 'pg' ? 'selected' : ''}>Pilihan Ganda</option>
                            <option value="essay" ${editData?.tipe === 'essay' ? 'selected' : ''}>Essay</option>
                            <option value="isian" ${editData?.tipe === 'isian' ? 'selected' : ''}>Isian Singkat</option>
                            <option value="benar_salah" ${editData?.tipe === 'benar_salah' ? 'selected' : ''}>Benar/Salah</option>
                            <option value="menjodohkan" ${editData?.tipe === 'menjodohkan' ? 'selected' : ''}>Menjodohkan</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan *</label>
                        <select name="level" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Level</option>
                            <option value="mudah" ${editData?.level === 'mudah' ? 'selected' : ''}>Mudah (C1-C2)</option>
                            <option value="sedang" ${editData?.level === 'sedang' ? 'selected' : ''}>Sedang (C3-C4)</option>
                            <option value="sulit" ${editData?.level === 'sulit' ? 'selected' : ''}>Sulit (C5-C6)</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Elemen CP</label>
                        <select name="elemen" id="soalElemenSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Pilih Elemen</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Indikator/Kata Kunci</label>
                        <input type="text" name="indikator" value="${editData?.indikator || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Kata kunci atau indikator soal">
                    </div>
                </div>
                
                <!-- Pertanyaan -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pertanyaan *</label>
                    <textarea name="pertanyaan" rows="4" required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Tuliskan pertanyaan soal...">${editData?.pertanyaan || ''}</textarea>
                </div>
                
                <!-- Pilihan Ganda Container -->
                <div id="pilihanContainer" class="${editData?.tipe === 'pg' ? '' : 'hidden'} mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Pilihan Jawaban</label>
                    <div class="space-y-2">
                        ${['A', 'B', 'C', 'D', 'E'].map(opt => `
                            <div class="flex items-center space-x-2">
                                <input type="radio" name="jawabanBenar" value="${opt}" 
                                    ${editData?.jawabanBenar === opt ? 'checked' : ''}
                                    class="w-4 h-4 text-violet-600">
                                <span class="font-medium w-6">${opt}.</span>
                                <input type="text" name="pilihan${opt}" value="${editData?.[`pilihan${opt}`] || ''}"
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Pilihan ${opt}">
                            </div>
                        `).join('')}
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Pilih radio button untuk menandai jawaban yang benar</p>
                </div>
                
                <!-- Benar/Salah Container -->
                <div id="benarSalahContainer" class="${editData?.tipe === 'benar_salah' ? '' : 'hidden'} mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Jawaban Benar</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="radio" name="jawabanBS" value="benar" ${editData?.jawabanBS === 'benar' ? 'checked' : ''}
                                class="w-4 h-4 text-green-600">
                            <span class="ml-2">Benar</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="jawabanBS" value="salah" ${editData?.jawabanBS === 'salah' ? 'checked' : ''}
                                class="w-4 h-4 text-red-600">
                            <span class="ml-2">Salah</span>
                        </label>
                    </div>
                </div>
                
                <!-- Kunci Jawaban (untuk isian & essay) -->
                <div id="kunciJawabanContainer" class="${['isian', 'essay'].includes(editData?.tipe) ? '' : 'hidden'} mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban / Rubrik</label>
                    <textarea name="kunciJawaban" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Kunci jawaban atau kriteria penilaian...">${editData?.kunciJawaban || ''}</textarea>
                </div>
                
                <!-- Pembahasan -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pembahasan (Opsional)</label>
                    <textarea name="pembahasan" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Penjelasan atau pembahasan jawaban...">${editData?.pembahasan || ''}</textarea>
                </div>
                
                <!-- Skor -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Skor/Bobot</label>
                        <input type="number" name="skor" value="${editData?.skor || 1}" min="1"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Waktu Pengerjaan (menit)</label>
                        <input type="number" name="waktu" value="${editData?.waktu || 2}" min="1"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal('soalModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Perbarui' : 'Simpan'} Soal
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    
    // Initialize elemen options
    if (editData?.subjectCode) {
        updateSoalElemenOptions(editData.subjectCode, editData.elemen);
    }
    
    document.getElementById('soalForm').addEventListener('submit', handleSoalSubmit);
};

window.togglePilihanContainer = function(tipe) {
    const pilihanContainer = document.getElementById('pilihanContainer');
    const benarSalahContainer = document.getElementById('benarSalahContainer');
    const kunciJawabanContainer = document.getElementById('kunciJawabanContainer');
    
    pilihanContainer.classList.add('hidden');
    benarSalahContainer.classList.add('hidden');
    kunciJawabanContainer.classList.add('hidden');
    
    if (tipe === 'pg') {
        pilihanContainer.classList.remove('hidden');
    } else if (tipe === 'benar_salah') {
        benarSalahContainer.classList.remove('hidden');
    } else if (['isian', 'essay'].includes(tipe)) {
        kunciJawabanContainer.classList.remove('hidden');
    }
};

window.updateSoalElemenOptions = function(subjectCode, selectedElemen = '') {
    const subject = APP_STATE.subjects.find(s => s.kode === subjectCode);
    const elemenSelect = document.getElementById('soalElemenSelect');
    
    if (!subject || !subject.elemen) {
        elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>';
        return;
    }
    
    elemenSelect.innerHTML = `
        <option value="">Pilih Elemen</option>
        ${subject.elemen.map(e => `<option value="${e}" ${selectedElemen === e ? 'selected' : ''}>${e}</option>`).join('')}
    `;
};

async function handleSoalSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const id = formData.get('id');
    const user = APP_STATE.currentUser;
    
    const subjectSelect = form.querySelector('select[name="subjectCode"]');
    const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.dataset.name || '';
    
    const soalData = {
        subjectCode: formData.get('subjectCode'),
        subjectName: subjectName,
        kelas: formData.get('kelas'),
        tipe: formData.get('tipe'),
        level: formData.get('level'),
        elemen: formData.get('elemen'),
        indikator: formData.get('indikator'),
        pertanyaan: formData.get('pertanyaan'),
        pilihanA: formData.get('pilihanA'),
        pilihanB: formData.get('pilihanB'),
        pilihanC: formData.get('pilihanC'),
        pilihanD: formData.get('pilihanD'),
        pilihanE: formData.get('pilihanE'),
        jawabanBenar: formData.get('jawabanBenar'),
        jawabanBS: formData.get('jawabanBS'),
        kunciJawaban: formData.get('kunciJawaban'),
        pembahasan: formData.get('pembahasan'),
        skor: parseInt(formData.get('skor')) || 1,
        waktu: parseInt(formData.get('waktu')) || 2,
        npsn: user.npsn,
        createdBy: user.email,
        createdByName: user.nama,
        updatedAt: serverTimestamp()
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, COLLECTIONS.BANK_SOAL, id), soalData);
            showToast('Soal berhasil diperbarui!', 'success');
        } else {
            soalData.createdAt = serverTimestamp();
            await addDoc(collection(db, COLLECTIONS.BANK_SOAL), soalData);
            showToast('Soal berhasil ditambahkan!', 'success');
        }
        
        closeModal('soalModal');
        await loadBankSoalFromDB();
        loadBankSoalList();
        updateBankSoalStats();
        
    } catch (error) {
        console.error('Error saving soal:', error);
        showToast('Gagal menyimpan soal', 'error');
    }
}

window.viewSoal = function(id) {
    const soal = bankSoalData.find(s => s.id === id);
    if (!soal) return;
    
    const modal = document.createElement('div');
    modal.id = 'viewSoalModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">Preview Soal</h3>
                <button onclick="closeModal('viewSoalModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Info badges -->
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">${soal.subjectCode}</span>
                    <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Kelas ${soal.kelas}</span>
                    <span class="px-2 py-1 ${getTipeColorClass(soal.tipe)} rounded text-xs">${getTipeLabel(soal.tipe)}</span>
                    <span class="px-2 py-1 ${getLevelColorClass(soal.level)} rounded text-xs">${getLevelLabel(soal.level)}</span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Skor: ${soal.skor}</span>
                </div>
                
                ${soal.elemen ? `<p class="text-sm text-gray-500 mb-4">Elemen: ${soal.elemen}</p>` : ''}
                
                <!-- Pertanyaan -->
                <div class="p-4 bg-gray-50 rounded-lg mb-4">
                    <p class="text-gray-800 font-medium">${soal.pertanyaan}</p>
                </div>
                
                <!-- Pilihan (jika PG) -->
                ${soal.tipe === 'pg' ? `
                    <div class="space-y-2 mb-4">
                        ${['A', 'B', 'C', 'D', 'E'].filter(opt => soal[`pilihan${opt}`]).map(opt => `
                            <div class="flex items-center p-2 rounded ${soal.jawabanBenar === opt ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}">
                                <span class="font-medium w-8">${opt}.</span>
                                <span>${soal[`pilihan${opt}`]}</span>
                                ${soal.jawabanBenar === opt ? '<i class="fas fa-check text-green-600 ml-auto"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Jawaban Benar/Salah -->
                ${soal.tipe === 'benar_salah' ? `
                    <div class="p-3 ${soal.jawabanBS === 'benar' ? 'bg-green-100' : 'bg-red-100'} rounded-lg mb-4">
                        <span class="font-medium">Jawaban: ${soal.jawabanBS === 'benar' ? 'BENAR' : 'SALAH'}</span>
                    </div>
                ` : ''}
                
                <!-- Kunci Jawaban -->
                ${soal.kunciJawaban ? `
                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-1">Kunci Jawaban:</p>
                        <p class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">${soal.kunciJawaban}</p>
                    </div>
                ` : ''}
                
                <!-- Pembahasan -->
                ${soal.pembahasan ? `
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-1">Pembahasan:</p>
                        <p class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">${soal.pembahasan}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.editSoal = function(id) {
    const soal = bankSoalData.find(s => s.id === id);
    if (soal) {
        showAddSoalModal(soal);
    }
};

window.duplicateSoal = async function(id) {
    const soal = bankSoalData.find(s => s.id === id);
    if (!soal) return;
    
    try {
        const newSoal = { ...soal };
        delete newSoal.id;
        newSoal.pertanyaan = `[SALINAN] ${newSoal.pertanyaan}`;
        newSoal.createdAt = serverTimestamp();
        newSoal.updatedAt = serverTimestamp();
        
        await addDoc(collection(db, COLLECTIONS.BANK_SOAL), newSoal);
        showToast('Soal berhasil diduplikasi!', 'success');
        
        await loadBankSoalFromDB();
        loadBankSoalList();
        updateBankSoalStats();
    } catch (error) {
        console.error('Error duplicating soal:', error);
        showToast('Gagal menduplikasi soal', 'error');
    }
};

window.deleteSoal = async function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    
    try {
        await deleteDoc(doc(db, COLLECTIONS.BANK_SOAL, id));
        showToast('Soal berhasil dihapus!', 'success');
        
        await loadBankSoalFromDB();
        loadBankSoalList();
        updateBankSoalStats();
    } catch (error) {
        console.error('Error deleting soal:', error);
        showToast('Gagal menghapus soal', 'error');
    }
};

// Selection functions
window.toggleSelectAllSoal = function() {
    const selectAll = document.getElementById('selectAllSoal');
    const checkboxes = document.querySelectorAll('.soal-checkbox');
    
    selectedSoalIds = [];
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
        if (selectAll.checked) {
            selectedSoalIds.push(cb.value);
        }
    });
    
    updateBulkActionsVisibility();
};

window.toggleSoalSelection = function(id) {
    if (selectedSoalIds.includes(id)) {
        selectedSoalIds = selectedSoalIds.filter(i => i !== id);
    } else {
        selectedSoalIds.push(id);
    }
    
    updateBulkActionsVisibility();
};

function updateBulkActionsVisibility() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedSoalIds.length > 0) {
        bulkActions.classList.remove('hidden');
        selectedCount.textContent = selectedSoalIds.length;
    } else {
        bulkActions.classList.add('hidden');
    }
}

window.deleteSelectedSoal = async function() {
    if (!confirm(`Hapus ${selectedSoalIds.length} soal yang dipilih?`)) return;
    
    try {
        const batch = writeBatch(db);
        selectedSoalIds.forEach(id => {
            batch.delete(doc(db, COLLECTIONS.BANK_SOAL, id));
        });
        await batch.commit();
        
        showToast(`${selectedSoalIds.length} soal berhasil dihapus!`, 'success');
        selectedSoalIds = [];
        
        await loadBankSoalFromDB();
        loadBankSoalList();
        updateBankSoalStats();
        updateBulkActionsVisibility();
    } catch (error) {
        console.error('Error deleting soal:', error);
        showToast('Gagal menghapus soal', 'error');
    }
};

window.exportSelectedSoal = function() {
    const selected = bankSoalData.filter(s => selectedSoalIds.includes(s.id));
    if (selected.length === 0) return;
    
    const data = [
        ['BANK SOAL - EXPORT'],
        [],
        ['No', 'Mapel', 'Kelas', 'Tipe', 'Level', 'Pertanyaan', 'Jawaban']
    ];
    
    selected.forEach((s, i) => {
        let jawaban = '';
        if (s.tipe === 'pg') jawaban = s.jawabanBenar;
        else if (s.tipe === 'benar_salah') jawaban = s.jawabanBS;
        else jawaban = s.kunciJawaban || '';
        
        data.push([
            i + 1,
            s.subjectCode,
            s.kelas,
            getTipeLabel(s.tipe),
            getLevelLabel(s.level),
            s.pertanyaan,
            jawaban
        ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Soal');
    XLSX.writeFile(wb, `Bank_Soal_Export_${Date.now()}.xlsx`);
    
    showToast('File Excel berhasil diunduh!', 'success');
};

// Generate Paket Soal
window.showGenerateSoalModal = function() {
    const user = APP_STATE.currentUser;
    const jenjang = user.jenjang || 'SD';
    const kelasList = JENJANG[jenjang]?.kelas || [];
    
    const modal = document.createElement('div');
    modal.id = 'generateSoalModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-cogs text-purple-600 mr-2"></i>
                    Generate Paket Soal
                </h3>
                <button onclick="closeModal('generateSoalModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <form id="generateSoalForm" class="p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
                        <input type="text" name="namaPaket" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Contoh: UTS Semester 1">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                            <select name="subjectCode" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Pilih Mapel</option>
                                ${APP_STATE.subjects.map(s => `<option value="${s.kode}">${s.nama}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                            <select name="kelas" required class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Pilih Kelas</option>
                                ${kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="border-t pt-4">
                        <p class="text-sm font-medium text-gray-700 mb-3">Jumlah Soal per Tipe:</p>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span class="text-sm">Pilihan Ganda</span>
                                <input type="number" name="jumlahPG" value="10" min="0" max="50"
                                    class="w-16 px-2 py-1 border border-gray-300 rounded text-center">
                            </div>
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span class="text-sm">Essay</span>
                                <input type="number" name="jumlahEssay" value="5" min="0" max="20"
                                    class="w-16 px-2 py-1 border border-gray-300 rounded text-center">
                            </div>
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span class="text-sm">Isian Singkat</span>
                                <input type="number" name="jumlahIsian" value="5" min="0" max="20"
                                    class="w-16 px-2 py-1 border border-gray-300 rounded text-center">
                            </div>
                            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span class="text-sm">Benar/Salah</span>
                                <input type="number" name="jumlahBS" value="0" min="0" max="20"
                                    class="w-16 px-2 py-1 border border-gray-300 rounded text-center">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" name="acak" id="acakSoal" checked class="w-4 h-4 text-purple-600 rounded">
                        <label for="acakSoal" class="text-sm text-gray-700">Acak urutan soal</label>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4 mt-4 border-t">
                    <button type="button" onclick="closeModal('generateSoalModal')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        <i class="fas fa-file-download mr-2"></i>
                        Generate & Download
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
    document.getElementById('generateSoalForm').addEventListener('submit', handleGenerateSoal);
};

async function handleGenerateSoal(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const subjectCode = formData.get('subjectCode');
    const kelas = formData.get('kelas');
    const namaPaket = formData.get('namaPaket');
    const acak = formData.get('acak') === 'on';
    
    const jumlah = {
        pg: parseInt(formData.get('jumlahPG')) || 0,
        essay: parseInt(formData.get('jumlahEssay')) || 0,
        isian: parseInt(formData.get('jumlahIsian')) || 0,
        benar_salah: parseInt(formData.get('jumlahBS')) || 0
    };
    
    // Filter soal berdasarkan kriteria
    const filteredSoal = bankSoalData.filter(s => 
        s.subjectCode === subjectCode && s.kelas === kelas
    );
    
    // Ambil soal per tipe
    const paketSoal = [];
    
    Object.entries(jumlah).forEach(([tipe, count]) => {
        if (count > 0) {
            let soalTipe = filteredSoal.filter(s => s.tipe === tipe);
            if (acak) {
                soalTipe = soalTipe.sort(() => Math.random() - 0.5);
            }
            paketSoal.push(...soalTipe.slice(0, count));
        }
    });
    
    if (paketSoal.length === 0) {
        showToast('Tidak ada soal yang sesuai kriteria', 'warning');
        return;
    }
    
    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = APP_STATE.currentUser;
    
    // Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(namaPaket.toUpperCase(), 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(user.schoolName, 105, 22, { align: 'center' });
    
    doc.text('Mata Pelajaran: ' + (APP_STATE.subjects.find(s => s.kode === subjectCode)?.nama || subjectCode), 20, 35);
    doc.text('Kelas: ' + kelas, 20, 41);
    doc.text('Waktu: ' + paketSoal.reduce((a, b) => a + (b.waktu || 2), 0) + ' menit', 120, 35);
    doc.text('Jumlah Soal: ' + paketSoal.length, 120, 41);
    
    doc.text('Nama: _______________________', 20, 52);
    doc.text('No. Absen: __________________', 120, 52);
    
    let y = 65;
    let nomorSoal = 1;
    
    // Group by tipe
    const soalByTipe = {};
    paketSoal.forEach(s => {
        if (!soalByTipe[s.tipe]) soalByTipe[s.tipe] = [];
        soalByTipe[s.tipe].push(s);
    });
    
    Object.entries(soalByTipe).forEach(([tipe, soalList]) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        // Tipe header
        doc.setFont(undefined, 'bold');
        doc.text(getTipeLabel(tipe).toUpperCase(), 20, y);
        doc.setFont(undefined, 'normal');
        y += 8;
        
        soalList.forEach(soal => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            const lines = doc.splitTextToSize(`${nomorSoal}. ${soal.pertanyaan}`, 170);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 3;
            
            // Pilihan untuk PG
            if (soal.tipe === 'pg') {
                ['A', 'B', 'C', 'D', 'E'].forEach(opt => {
                    if (soal[`pilihan${opt}`]) {
                        doc.text(`   ${opt}. ${soal[`pilihan${opt}`]}`, 25, y);
                        y += 5;
                    }
                });
            }
            
            y += 5;
            nomorSoal++;
        });
        
        y += 5;
    });
    
    doc.save(`${namaPaket.replace(/\s+/g, '_')}.pdf`);
    showToast('Paket soal berhasil di-generate!', 'success');
    closeModal('generateSoalModal');
}

// =====================================================
// GLOBAL EXPORT MODAL
// =====================================================
window.showExportModal = function() {
    const modal = document.createElement('div');
    modal.id = 'exportModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-download text-green-600 mr-2"></i>
                    Export Dokumen
                </h3>
                <button onclick="closeModal('exportModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6">
                <p class="text-sm text-gray-600 mb-4">Pilih dokumen yang ingin di-export:</p>
                
                <div class="space-y-3">
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="atp" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">ATP (Alur Tujuan Pembelajaran)</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="kktp" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">KKTP</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="prota" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">Program Tahunan</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="promes" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">Program Semester</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="kalender" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">Kalender Pendidikan</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="jadwal" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">Jadwal Pelajaran</span>
                    </label>
                    <label class="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" name="exportDoc" value="banksoal" class="w-4 h-4 text-blue-600 rounded">
                        <span class="ml-3">Bank Soal</span>
                    </label>
                </div>
                
                <div class="mt-6 pt-4 border-t">
                    <p class="text-sm text-gray-600 mb-3">Format export:</p>
                    <div class="flex space-x-4">
                        <button onclick="exportAllToExcel()" class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-file-excel mr-2"></i>
                            Excel (.xlsx)
                        </button>
                        <button onclick="exportAllToPDF()" class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.exportAllToExcel = function() {
    const selected = [];
    document.querySelectorAll('input[name="exportDoc"]:checked').forEach(cb => {
        selected.push(cb.value);
    });
    
    if (selected.length === 0) {
        showToast('Pilih minimal satu dokumen', 'warning');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    const user = APP_STATE.currentUser;
    
    if (selected.includes('kalender')) {
        const data = [['KALENDER PENDIDIKAN'], [user.schoolName], [], ['Tanggal', 'Kegiatan', 'Jenis']];
        APP_STATE.calendarEvents.forEach(e => data.push([e.date, e.title, e.type]));
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Kalender');
    }
    
    if (selected.includes('jadwal')) {
        const data = [['JADWAL PELAJARAN'], [], ['Hari', 'Jam', 'Kelas', 'Rombel', 'Mapel', 'Guru']];
        APP_STATE.schedules.forEach(s => data.push([s.hari, s.jamKe, s.kelas, s.rombel, s.subjectName, s.teacherName]));
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Jadwal');
    }
    
    if (selected.includes('banksoal')) {
        const data = [['BANK SOAL'], [], ['Mapel', 'Kelas', 'Tipe', 'Pertanyaan']];
        bankSoalData.forEach(s => data.push([s.subjectCode, s.kelas, s.tipe, s.pertanyaan]));
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Bank Soal');
    }
    
    XLSX.writeFile(wb, `GuruSmart_Export_${Date.now()}.xlsx`);
    showToast('File Excel berhasil diunduh!', 'success');
    closeModal('exportModal');
};

window.exportAllToPDF = function() {
    showToast('Untuk export PDF, silakan buka masing-masing halaman dan gunakan tombol Export PDF di sana.', 'info');
    closeModal('exportModal');
};

// =====================================================
// HELPER: Import Soal Modal
// =====================================================
window.showImportSoalModal = function() {
    const modal = document.createElement('div');
    modal.id = 'importSoalModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg modal-enter">
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-file-import text-blue-600 mr-2"></i>
                    Import Soal dari Excel
                </h3>
                <button onclick="closeModal('importSoalModal')" class="p-2 hover:bg-gray-100 rounded-lg">
                    <i class="fas fa-times text-gray-500"></i>
                </button>
            </div>
            
            <div class="p-6">
                <div class="mb-4">
                    <a href="#" onclick="downloadTemplateImport()" class="text-blue-600 hover:underline text-sm">
                        <i class="fas fa-download mr-1"></i>
                        Download Template Excel
                    </a>
                </div>
                
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input type="file" id="importFile" accept=".xlsx,.xls" class="hidden" onchange="handleImportFile(this)">
                    <label for="importFile" class="cursor-pointer">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                        <p class="text-gray-600">Klik untuk pilih file atau drag & drop</p>
                        <p class="text-xs text-gray-400 mt-1">Format: .xlsx, .xls</p>
                    </label>
                </div>
                
                <div id="importProgress" class="hidden mt-4">
                    <div class="flex items-center">
                        <div class="spinner w-5 h-5 mr-3"></div>
                        <span>Mengimport soal...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').appendChild(modal);
};

window.downloadTemplateImport = function() {
    const data = [
        ['TEMPLATE IMPORT BANK SOAL'],
        ['Petunjuk: Isi data mulai dari baris ke-4. Jangan ubah header.'],
        [],
        ['Kode Mapel', 'Kelas', 'Tipe (pg/essay/isian/benar_salah)', 'Level (mudah/sedang/sulit)', 'Pertanyaan', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Pilihan E', 'Jawaban Benar (A/B/C/D/E)', 'Kunci Jawaban', 'Pembahasan'],
        ['PAI', 'VII', 'pg', 'mudah', 'Contoh pertanyaan pilihan ganda?', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', '', 'A', '', 'Pembahasan soal'],
        ['MTK', 'VII', 'essay', 'sedang', 'Contoh soal essay?', '', '', '', '', '', '', 'Kunci jawaban essay', 'Pembahasan']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Soal.xlsx');
};

window.handleImportFile = async function(input) {
    const file = input.files[0];
    if (!file) return;
    
    const progress = document.getElementById('importProgress');
    progress.classList.remove('hidden');
    
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Skip header rows (first 4 rows)
        const soalRows = rows.slice(4);
        const user = APP_STATE.currentUser;
        const batch = writeBatch(db);
        let count = 0;
        
        soalRows.forEach(row => {
            if (row[0] && row[4]) { // Has mapel and pertanyaan
                const docRef = doc(collection(db, COLLECTIONS.BANK_SOAL));
                batch.set(docRef, {
                    subjectCode: row[0],
                    kelas: row[1],
                    tipe: row[2] || 'pg',
                    level: row[3] || 'sedang',
                    pertanyaan: row[4],
                    pilihanA: row[5] || '',
                    pilihanB: row[6] || '',
                    pilihanC: row[7] || '',
                    pilihanD: row[8] || '',
                    pilihanE: row[9] || '',
                    jawabanBenar: row[10] || '',
                    kunciJawaban: row[11] || '',
                    pembahasan: row[12] || '',
                    skor: 1,
                    waktu: 2,
                    npsn: user.npsn,
                    createdBy: user.email,
                    createdByName: user.nama,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                count++;
            }
        });
        
        await batch.commit();
        
        showToast(`${count} soal berhasil diimport!`, 'success');
        closeModal('importSoalModal');
        
        await loadBankSoalFromDB();
        loadBankSoalList();
        updateBankSoalStats();
        
    } catch (error) {
        console.error('Import error:', error);
        showToast('Gagal mengimport file', 'error');
    }
    
    progress.classList.add('hidden');
};

// =====================================================
// FINALIZATION
// =====================================================
console.log('Guru Smart App loaded successfully!');
console.log('Firebase Project: si-gumart');
console.log('Version: 1.0.0');