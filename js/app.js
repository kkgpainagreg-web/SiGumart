// Main Application Logic

let currentUser = null;
let userData = null;
let cpData = {};
let studentsData = [];
let calendarData = {};
let scheduleData = {};

// Initialize App
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    await loadUserData();
    initializeApp();
});

async function loadUserData() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            userData = doc.data();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function initializeApp() {
    hideLoading();
    updateUI();
    loadAcademicYearOptions();
    loadSubjectOptions();
    loadCalendarData();
    loadScheduleData();
    loadStudentsData();
    initializeScheduleGrid();
}

function updateUI() {
    // Update user info
    document.getElementById('userName').textContent = userData?.name || currentUser.displayName || 'Pengguna';
    document.getElementById('userAvatar').src = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=3b82f6&color=fff`;
    
    // Update subscription badge
    const badge = document.getElementById('userBadge');
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (userData?.subscription === 'premium') {
        badge.className = 'premium-badge';
        badge.textContent = 'PREMIUM';
        upgradeBtn.classList.add('hidden');
    } else {
        badge.className = 'free-badge';
        badge.textContent = 'FREE';
        upgradeBtn.classList.remove('hidden');
    }
    
    // Update profile form if exists
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = userData?.name || '';
        document.getElementById('profileNip').value = userData?.profile?.nip || '';
        document.getElementById('profileEmail').value = currentUser.email;
        document.getElementById('profilePhone').value = userData?.profile?.phone || '';
        
        document.getElementById('schoolName').value = userData?.profile?.school?.name || '';
        document.getElementById('schoolNpsn').value = userData?.profile?.school?.npsn || '';
        document.getElementById('schoolLevel').value = userData?.profile?.school?.level || 'SD';
        document.getElementById('schoolCity').value = userData?.profile?.school?.city || '';
        document.getElementById('schoolProvince').value = userData?.profile?.school?.province || '';
        document.getElementById('schoolAddress').value = userData?.profile?.school?.address || '';
        document.getElementById('headmasterName').value = userData?.profile?.school?.headmaster || '';
        document.getElementById('headmasterNip').value = userData?.profile?.school?.headmasterNip || '';
        
        document.getElementById('lessonDuration').value = userData?.settings?.lessonDuration || 35;
    }
    
    loadSubjectsUI();
}

// Navigation
function showSection(sectionId) {
    // Check premium features
    const premiumFeatures = ['promes', 'modul', 'lkpd', 'kktp', 'attendance', 'journal', 'grades'];
    if (premiumFeatures.includes(sectionId) && userData?.subscription !== 'premium') {
        sectionId = 'locked';
    }
    
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'profile': 'Profil & Pengaturan',
        'calendar': 'Kalender Pendidikan',
        'schedule': 'Jadwal Pelajaran',
        'students': 'Data Siswa',
        'atp': 'Alur Tujuan Pembelajaran (ATP)',
        'prota': 'Program Tahunan (Prota)',
        'promes': 'Program Semester (Promes)',
        'modul': 'Modul Ajar',
        'lkpd': 'Lembar Kerja Peserta Didik',
        'kktp': 'Kriteria Ketercapaian TP',
        'attendance': 'Absensi',
        'journal': 'Jurnal Pembelajaran',
        'grades': 'Daftar Nilai',
        'ai-assistant': 'AI Assistant',
        'help': 'Panduan',
        'locked': 'Fitur Premium'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Academic Year
function loadAcademicYearOptions() {
    const select = document.getElementById('academicYearSelect');
    const years = getCurrentAcademicYear();
    
    select.innerHTML = '';
    years.options.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === userData?.settings?.academicYear || year === years.current) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    select.addEventListener('change', async (e) => {
        await db.collection('users').doc(currentUser.uid).update({
            'settings.academicYear': e.target.value
        });
        userData.settings.academicYear = e.target.value;
    });
}

// Lesson Duration based on School Level
function updateLessonDuration() {
    const level = document.getElementById('schoolLevel').value;
    const durations = { 'SD': 35, 'SMP': 40, 'SMA': 45, 'SMK': 45 };
    document.getElementById('lessonDuration').value = durations[level] || 35;
}

// Subjects Management
function loadSubjectsUI() {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;
    
    const subjects = userData?.profile?.subjects || [];
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <p class="text-gray-500 text-sm">Belum ada mata pelajaran. Klik tombol di bawah untuk menambahkan.</p>
        `;
        return;
    }
    
    container.innerHTML = subjects.map((subj, idx) => `
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" value="${subj.name}" placeholder="Nama Mata Pelajaran" 
                    class="input-field" onchange="updateSubject(${idx}, 'name', this.value)">
                <input type="number" value="${subj.jpPerWeek || 4}" min="1" max="20" placeholder="JP/Minggu"
                    class="input-field" onchange="updateSubject(${idx}, 'jpPerWeek', this.value)">
                <input type="number" value="${subj.jpPerMeeting || 4}" min="1" max="8" placeholder="JP/Pertemuan"
                    class="input-field" onchange="updateSubject(${idx}, 'jpPerMeeting', this.value)">
            </div>
            <button onclick="removeSubject(${idx})" class="text-red-500 hover:text-red-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

function addSubject() {
    if (!userData.profile.subjects) {
        userData.profile.subjects = [];
    }
    userData.profile.subjects.push({
        name: '',
        jpPerWeek: 4,
        jpPerMeeting: 4
    });
    loadSubjectsUI();
}

function updateSubject(index, field, value) {
    if (userData.profile.subjects[index]) {
        userData.profile.subjects[index][field] = field === 'name' ? value : parseInt(value);
    }
}

function removeSubject(index) {
    userData.profile.subjects.splice(index, 1);
    loadSubjectsUI();
}

// Save Profile
async function saveProfile() {
    showLoading();
    
    try {
        const profileData = {
            name: document.getElementById('profileName').value,
            profile: {
                nip: document.getElementById('profileNip').value,
                phone: document.getElementById('profilePhone').value,
                subjects: userData?.profile?.subjects || [],
                school: {
                    name: document.getElementById('schoolName').value,
                    npsn: document.getElementById('schoolNpsn').value,
                    level: document.getElementById('schoolLevel').value,
                    city: document.getElementById('schoolCity').value,
                    province: document.getElementById('schoolProvince').value,
                    address: document.getElementById('schoolAddress').value,
                    headmaster: document.getElementById('headmasterName').value,
                    headmasterNip: document.getElementById('headmasterNip').value
                }
            },
            settings: {
                ...userData?.settings,
                lessonDuration: parseInt(document.getElementById('lessonDuration').value)
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).update(profileData);
        userData = { ...userData, ...profileData };
        
        hideLoading();
        showAlert('Profil berhasil disimpan!', 'success');
        loadSubjectOptions();
    } catch (error) {
        hideLoading();
        console.error('Error saving profile:', error);
        showAlert('Gagal menyimpan profil: ' + error.message, 'error');
    }
}

// Subject Options for Dropdowns
function loadSubjectOptions() {
    const subjects = userData?.profile?.subjects || [];
    const selects = ['atpSubject', 'protaSubject'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = subjects.length > 0 
                ? subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')
                : '<option value="">Tambahkan mapel di Profil</option>';
        }
    });
}

// Upgrade Modal
function showUpgradeModal() {
    document.getElementById('upgradeModal').classList.remove('hidden');
    // Set WhatsApp link
    const waNumber = APP_CONFIG.whatsappNumber.replace(/\D/g, '');
    const waMessage = encodeURIComponent(`Halo, saya ingin upgrade ke AGSA Premium.\n\nEmail: ${currentUser.email}\nNama: ${userData?.name || currentUser.displayName}`);
    document.getElementById('waUpgradeLink').href = `https://wa.me/${waNumber}?text=${waMessage}`;
}

function closeUpgradeModal() {
    document.getElementById('upgradeModal').classList.add('hidden');
}

// Import Modal
function showImportStudents() {
    document.getElementById('importModal').classList.remove('hidden');
}

function closeImportModal() {
    document.getElementById('importModal').classList.add('hidden');
}

// Copy Prompt
function copyPrompt(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Prompt berhasil disalin!', 'success');
    });
}

// Print Document
function printDocument(docType) {
    window.print();
}

// Logout
async function logout() {
    showLoading();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        showAlert('Gagal keluar: ' + error.message, 'error');
    }
}

console.log('App Module Loaded');