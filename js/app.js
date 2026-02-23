// Main Application Logic

let currentUser = null;
let userData = null;
let cpData = {};
let studentsData = [];
let calendarData = {};
let scheduleData = {};

// Initialize App - Wait for Auth
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    try {
        await loadUserData();
        initializeApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoading();
        showAlert('Terjadi kesalahan saat memuat data', 'error');
    }
});

// Load User Data
async function loadUserData() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        
        if (doc.exists) {
            userData = doc.data();
            
            // Ensure profile structure exists
            if (!userData.profile) {
                userData.profile = {
                    nip: '',
                    phone: '',
                    subjects: [],
                    school: {
                        name: '',
                        npsn: '',
                        address: '',
                        city: '',
                        province: '',
                        level: 'SD',
                        headmaster: '',
                        headmasterNip: ''
                    }
                };
            }
            
            // Ensure subjects array exists
            if (!userData.profile.subjects) {
                userData.profile.subjects = [];
            }
            
            // Ensure school object exists
            if (!userData.profile.school) {
                userData.profile.school = {
                    name: '',
                    npsn: '',
                    address: '',
                    city: '',
                    province: '',
                    level: 'SD',
                    headmaster: '',
                    headmasterNip: ''
                };
            }
            
            // Ensure settings exists
            if (!userData.settings) {
                userData.settings = {
                    academicYear: getCurrentAcademicYear().current,
                    lessonDuration: 35,
                    theme: 'light'
                };
            }
        } else {
            // Create new user document
            userData = getDefaultUserData(currentUser);
            await db.collection('users').doc(currentUser.uid).set(userData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        // Set default data on error
        userData = getDefaultUserData(currentUser);
    }
}

// Initialize App
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

// Update UI with User Data
function updateUI() {
    // Update user info in sidebar
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const userBadgeEl = document.getElementById('userBadge');
    const upgradeBtnEl = document.getElementById('upgradeBtn');
    
    if (userNameEl) {
        userNameEl.textContent = userData?.name || currentUser.displayName || 'Pengguna';
    }
    
    if (userAvatarEl) {
        userAvatarEl.src = currentUser.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=3b82f6&color=fff`;
    }
    
    // Update subscription badge
    if (userBadgeEl) {
        if (userData?.subscription === 'premium') {
            userBadgeEl.className = 'inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full';
            userBadgeEl.textContent = 'PREMIUM';
        } else {
            userBadgeEl.className = 'inline-flex items-center px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded-full';
            userBadgeEl.textContent = 'FREE';
        }
    }
    
    if (upgradeBtnEl) {
        if (userData?.subscription === 'premium') {
            upgradeBtnEl.classList.add('hidden');
        } else {
            upgradeBtnEl.classList.remove('hidden');
        }
    }
    
    // Update profile form
    updateProfileForm();
    
    // Load subjects UI
    loadSubjectsUI();
}

// Update Profile Form
function updateProfileForm() {
    const fields = {
        'profileName': userData?.name || '',
        'profileNip': userData?.profile?.nip || '',
        'profileEmail': currentUser?.email || '',
        'profilePhone': userData?.profile?.phone || '',
        'schoolName': userData?.profile?.school?.name || '',
        'schoolNpsn': userData?.profile?.school?.npsn || '',
        'schoolLevel': userData?.profile?.school?.level || 'SD',
        'schoolCity': userData?.profile?.school?.city || '',
        'schoolProvince': userData?.profile?.school?.province || '',
        'schoolAddress': userData?.profile?.school?.address || '',
        'headmasterName': userData?.profile?.school?.headmaster || '',
        'headmasterNip': userData?.profile?.school?.headmasterNip || '',
        'lessonDuration': userData?.settings?.lessonDuration || 35
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
        }
    });
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
        link.classList.remove('active', 'bg-primary-600', 'shadow-lg');
        if (link.dataset.section === sectionId) {
            link.classList.add('active', 'bg-primary-600', 'shadow-lg');
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
    
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = titles[sectionId] || 'Dashboard';
    }
    
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
    }
}

// Toggle Sidebar (Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }
}

// Academic Year Options
function loadAcademicYearOptions() {
    const select = document.getElementById('academicYearSelect');
    if (!select) return;
    
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
        try {
            await db.collection('users').doc(currentUser.uid).update({
                'settings.academicYear': e.target.value
            });
            if (userData.settings) {
                userData.settings.academicYear = e.target.value;
            }
            showAlert('Tahun ajaran berhasil diubah', 'success');
        } catch (error) {
            console.error('Error updating academic year:', error);
        }
    });
}

// Lesson Duration based on School Level
function updateLessonDuration() {
    const levelSelect = document.getElementById('schoolLevel');
    const durationInput = document.getElementById('lessonDuration');
    
    if (levelSelect && durationInput) {
        const level = levelSelect.value;
        const durations = { 'SD': 35, 'SMP': 40, 'SMA': 45, 'SMK': 45 };
        durationInput.value = durations[level] || 35;
    }
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
                <div>
                    <label class="block text-xs text-gray-500 mb-1">Nama Mapel</label>
                    <input type="text" value="${subj.name || ''}" placeholder="Nama Mata Pelajaran" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                        onchange="updateSubject(${idx}, 'name', this.value)">
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">JP/Minggu</label>
                    <input type="number" value="${subj.jpPerWeek || 4}" min="1" max="20" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onchange="updateSubject(${idx}, 'jpPerWeek', this.value)">
                </div>
                <div>
                    <label class="block text-xs text-gray-500 mb-1">JP/Pertemuan</label>
                    <input type="number" value="${subj.jpPerMeeting || 4}" min="1" max="8"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onchange="updateSubject(${idx}, 'jpPerMeeting', this.value)">
                </div>
            </div>
            <button onclick="removeSubject(${idx})" class="text-red-500 hover:text-red-700 p-2" title="Hapus">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

function addSubject() {
    // Ensure userData and profile exist
    if (!userData) {
        userData = getDefaultUserData(currentUser);
    }
    if (!userData.profile) {
        userData.profile = { subjects: [], school: {}, nip: '', phone: '' };
    }
    if (!userData.profile.subjects) {
        userData.profile.subjects = [];
    }
    
    userData.profile.subjects.push({
        name: '',
        jpPerWeek: 4,
        jpPerMeeting: 4
    });
    
    loadSubjectsUI();
    showAlert('Mata pelajaran baru ditambahkan. Jangan lupa simpan!', 'info');
}

function updateSubject(index, field, value) {
    if (userData?.profile?.subjects?.[index]) {
        if (field === 'name') {
            userData.profile.subjects[index][field] = value;
        } else {
            userData.profile.subjects[index][field] = parseInt(value) || 4;
        }
    }
}

function removeSubject(index) {
    if (userData?.profile?.subjects) {
        userData.profile.subjects.splice(index, 1);
        loadSubjectsUI();
        showAlert('Mata pelajaran dihapus. Jangan lupa simpan!', 'info');
    }
}

// Save Profile
async function saveProfile() {
    showLoading();
    
    try {
        // Ensure profile structure
        if (!userData.profile) {
            userData.profile = { subjects: [], school: {}, nip: '', phone: '' };
        }
        if (!userData.profile.school) {
            userData.profile.school = {};
        }
        if (!userData.settings) {
            userData.settings = {};
        }
        
        const profileData = {
            name: document.getElementById('profileName')?.value || userData.name,
            profile: {
                nip: document.getElementById('profileNip')?.value || '',
                phone: document.getElementById('profilePhone')?.value || '',
                subjects: userData.profile.subjects || [],
                school: {
                    name: document.getElementById('schoolName')?.value || '',
                    npsn: document.getElementById('schoolNpsn')?.value || '',
                    level: document.getElementById('schoolLevel')?.value || 'SD',
                    city: document.getElementById('schoolCity')?.value || '',
                    province: document.getElementById('schoolProvince')?.value || '',
                    address: document.getElementById('schoolAddress')?.value || '',
                    headmaster: document.getElementById('headmasterName')?.value || '',
                    headmasterNip: document.getElementById('headmasterNip')?.value || ''
                }
            },
            settings: {
                ...userData.settings,
                lessonDuration: parseInt(document.getElementById('lessonDuration')?.value) || 35
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('users').doc(currentUser.uid).update(profileData);
        
        // Update local userData
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
    const selects = ['atpSubject', 'protaSubject', 'promesSubject', 'modulSubject', 'lkpdSubject', 'kktpSubject'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            if (subjects.length > 0) {
                select.innerHTML = subjects.map(s => 
                    `<option value="${s.name}">${s.name}</option>`
                ).join('');
            } else {
                select.innerHTML = '<option value="">Tambahkan mapel di Profil</option>';
            }
        }
    });
}

// Upgrade Modal
function showUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Set WhatsApp link
        const waNumber = (APP_CONFIG.whatsappNumber || '6281234567890').replace(/\D/g, '');
        const waMessage = encodeURIComponent(
            `Halo, saya ingin upgrade ke AGSA Premium.\n\nEmail: ${currentUser?.email}\nNama: ${userData?.name || currentUser?.displayName}`
        );
        
        const waLink = document.getElementById('waUpgradeLink');
        if (waLink) {
            waLink.href = `https://wa.me/${waNumber}?text=${waMessage}`;
        }
    }
}

function closeUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Import Modal
function showImportStudents() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Copy Prompt
function copyPrompt(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.textContent || element.innerText;
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Prompt berhasil disalin!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showAlert('Gagal menyalin. Coba manual select dan copy.', 'error');
        });
    }
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

// Update Dashboard Stats
function updateDashboardStats() {
    const totalStudentsEl = document.getElementById('totalStudents');
    const totalDocsEl = document.getElementById('totalDocs');
    const totalWeeksEl = document.getElementById('totalWeeks');
    const totalJPEl = document.getElementById('totalJP');
    
    if (totalStudentsEl) {
        totalStudentsEl.textContent = studentsData?.length || 0;
    }
    
    if (totalDocsEl) {
        totalDocsEl.textContent = '0'; // Will be updated when docs are generated
    }
    
    // Calculate effective weeks from calendar
    if (totalWeeksEl && calendarData?.ganjil?.start && calendarData?.ganjil?.end) {
        const start = new Date(calendarData.ganjil.start);
        const end = new Date(calendarData.ganjil.end);
        const weeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));
        totalWeeksEl.textContent = weeks || 0;
    }
    
    // Calculate total JP
    if (totalJPEl) {
        const subjects = userData?.profile?.subjects || [];
        const totalJP = subjects.reduce((sum, s) => sum + (s.jpPerWeek || 0), 0);
        totalJPEl.textContent = totalJP;
    }
}

console.log('App Module Loaded');
