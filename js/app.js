// Main Application Logic

// Global state
let currentModule = 'dashboard';
let currentAcademicYear = '';
let userData = {
    profile: null,
    calendar: null,
    schedule: null,
    cp: [],
    students: [],
    atp: [],
    prota: [],
    promes: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        showLoading(true);

        try {
            // Load user profile
            await loadUserProfile();
            
            // Setup UI
            setupUI();
            
            // Load academic year options
            setupAcademicYear();
            
            // Load user data
            await loadUserData();
            
            // Check hash for initial module
            const hash = window.location.hash.substring(1);
            if (hash) {
                showModule(hash);
            } else {
                showModule('dashboard');
            }

            // Update dashboard stats
            updateDashboardStats();

        } catch (error) {
            console.error('Error initializing app:', error);
            showToast('Terjadi kesalahan saat memuat aplikasi', 'error');
        }

        showLoading(false);
    });
});

// Load user profile
async function loadUserProfile() {
    if (!currentUser) return;

    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
        userProfile = doc.data();
        userData.profile = userProfile;
    }
}

// Setup UI elements
function setupUI() {
    // Set user info in UI
    document.getElementById('userName').textContent = userProfile?.displayName || currentUser.displayName || 'User';
    document.getElementById('userAvatar').src = userProfile?.photoURL || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'U')}&background=22c55e&color=fff`;
    document.getElementById('welcomeName').textContent = (userProfile?.displayName || currentUser.displayName || 'Guru').split(' ')[0];

    // Set subscription badge
    const badge = document.getElementById('subscriptionBadge');
    if (isPremium()) {
        badge.textContent = 'Premium';
        badge.className = 'ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full';
        document.getElementById('upgradeBtn').classList.add('hidden');
        
        // Hide premium badges in sidebar
        document.querySelectorAll('.premium-badge').forEach(el => el.classList.add('hidden'));
    } else {
        badge.textContent = 'Free';
        badge.className = 'ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full';
        document.getElementById('upgradeBtn').classList.remove('hidden');
    }

    // Show admin link if super admin
    if (isSuperAdmin()) {
        document.getElementById('adminLink').classList.remove('hidden');
        document.getElementById('adminLink').classList.add('flex');
    }

    // Load profile data into form
    loadProfileForm();

    // Setup form handlers
    setupFormHandlers();
}

// Setup academic year selector
function setupAcademicYear() {
    const years = getAvailableAcademicYears();
    const select = document.getElementById('academicYearSelect');
    
    select.innerHTML = years.map(year => 
        `<option value="${year}" ${year === userProfile?.settings?.defaultAcademicYear ? 'selected' : ''}>${year}</option>`
    ).join('');

    currentAcademicYear = select.value;
    document.getElementById('currentYearDisplay').textContent = currentAcademicYear;

    select.addEventListener('change', async (e) => {
        currentAcademicYear = e.target.value;
        document.getElementById('currentYearDisplay').textContent = currentAcademicYear;
        
        // Update user settings
        await updateUserProfile({
            'settings.defaultAcademicYear': currentAcademicYear
        });

        // Reload data for new academic year
        await loadUserData();
        updateDashboardStats();
    });
}

// Load user data
async function loadUserData() {
    if (!currentUser) return;

    try {
        // Load calendar
        const calendarDoc = await db.collection('users').doc(currentUser.uid)
            .collection('calendar').doc(currentAcademicYear).get();
        if (calendarDoc.exists) {
            userData.calendar = calendarDoc.data();
        }

        // Load schedule
        const scheduleDoc = await db.collection('users').doc(currentUser.uid)
            .collection('schedule').doc(currentAcademicYear).get();
        if (scheduleDoc.exists) {
            userData.schedule = scheduleDoc.data();
        }

        // Load CP
        const cpSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('cp').get();
        userData.cp = cpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load students
        const studentsSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('students').where('academicYear', '==', currentAcademicYear).get();
        userData.students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('totalStudents').textContent = userData.students.length;
    
    const classes = new Set(userData.students.map(s => `${s.kelas}-${s.rombel}`));
    document.getElementById('totalClasses').textContent = classes.size;
    
    document.getElementById('totalTP').textContent = userData.cp.length;
    
    // Calculate effective days
    if (userData.calendar) {
        const holidays = userData.calendar.holidays || [];
        const sem1Days = userData.calendar.sem1Start && userData.calendar.sem1End ?
            calculateEffectiveDays(userData.calendar.sem1Start, userData.calendar.sem1End, holidays) : 0;
        const sem2Days = userData.calendar.sem2Start && userData.calendar.sem2End ?
            calculateEffectiveDays(userData.calendar.sem2Start, userData.calendar.sem2End, holidays) : 0;
        document.getElementById('effectiveDays').textContent = sem1Days + sem2Days;
    }

    // Update setup progress
    updateSetupProgress();
}

// Update setup progress indicators
function updateSetupProgress() {
    const updateStatus = (elementId, isComplete) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        const statusSpan = el.querySelector('span:last-child');
        const iconDiv = el.querySelector('div');
        
        if (isComplete) {
            statusSpan.textContent = 'Selesai';
            statusSpan.className = 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700';
            iconDiv.className = 'w-8 h-8 bg-green-100 rounded-full flex items-center justify-center';
            iconDiv.innerHTML = '<i class="fas fa-check text-green-600"></i>';
        }
    };

    updateStatus('setupProfile', userProfile?.schoolName && userProfile?.displayName);
    updateStatus('setupCalendar', userData.calendar?.sem1Start);
    updateStatus('setupSchedule', userData.schedule?.timeSlots?.length > 0);
    updateStatus('setupCP', userData.cp.length > 0);
    updateStatus('setupStudents', userData.students.length > 0);
}

// Show module
function showModule(moduleName) {
    // Check premium features
    if (isPremiumFeature(moduleName) && !isPremium()) {
        // Show the module but with locked content
    }

    // Update sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${moduleName}`) {
            link.classList.add('active');
        }
    });

    // Hide all modules
    document.querySelectorAll('.module-content').forEach(module => {
        module.classList.add('hidden');
    });

    // Show selected module
    const moduleElement = document.getElementById(`module-${moduleName}`);
    if (moduleElement) {
        moduleElement.classList.remove('hidden');
    }

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'profil': 'Profil',
        'kalender': 'Kalender Pendidikan',
        'jadwal': 'Jadwal Pelajaran',
        'cp': 'Capaian Pembelajaran',
        'siswa': 'Data Siswa',
        'atp': 'Alur Tujuan Pembelajaran',
        'prota': 'Program Tahunan',
        'promes': 'Program Semester',
        'modul-ajar': 'Modul Ajar',
        'lkpd': 'LKPD',
        'bank-soal': 'Bank Soal',
        'absensi': 'Absensi',
        'jurnal': 'Jurnal Pembelajaran',
        'nilai': 'Daftar Nilai',
        'kktp': 'KKTP',
        'ai-assistant': 'AI Assistant'
    };
    document.getElementById('pageTitle').textContent = titles[moduleName] || moduleName;

    // Update URL hash
    window.location.hash = moduleName;
    currentModule = moduleName;

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');

    // Load module-specific data
    loadModuleData(moduleName);
}

// Load module-specific data
function loadModuleData(moduleName) {
    switch (moduleName) {
        case 'kalender':
            loadCalendarModule();
            break;
        case 'jadwal':
            loadScheduleModule();
            break;
        case 'cp':
            loadCPModule();
            break;
        case 'siswa':
            loadStudentsModule();
            break;
        case 'atp':
            loadATPModule();
            break;
        case 'prota':
            loadProtaModule();
            break;
        // Add other modules as needed
    }
}

// Toggle sidebar (mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Toggle user menu
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const button = e.target.closest('button');
    
    if (!button || !button.onclick?.toString().includes('toggleUserMenu')) {
        if (!menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    }
});

// Show modal
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// Hide modal
function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Setup form handlers
function setupFormHandlers() {
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    
    // Add CP form
    document.getElementById('addCPForm').addEventListener('submit', saveCP);
    
    // Fase change handler for CP form
    document.getElementById('cpFase').addEventListener('change', (e) => {
        const fase = e.target.value;
        const kelasSelect = document.getElementById('cpKelas');
        
        if (FASE_MAPPING[fase]) {
            kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
                FASE_MAPPING[fase].kelas.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');
        }
    });
}

// ==================== PROFILE MODULE ====================

// Load profile form
function loadProfileForm() {
    if (!userProfile) return;

    document.getElementById('inputDisplayName').value = userProfile.displayName || '';
    document.getElementById('inputNIP').value = userProfile.nip || '';
    document.getElementById('inputEmail').value = userProfile.email || '';
    document.getElementById('inputPhone').value = userProfile.phone || '';
    document.getElementById('inputSchoolName').value = userProfile.schoolName || '';
    document.getElementById('inputSchoolAddress').value = userProfile.schoolAddress || '';
    document.getElementById('inputSchoolCity').value = userProfile.schoolCity || '';
    document.getElementById('inputSchoolProvince').value = userProfile.schoolProvince || '';
    document.getElementById('inputPrincipalName').value = userProfile.principalName || '';
    document.getElementById('inputPrincipalNIP').value = userProfile.principalNIP || '';

    // Profile header
    document.getElementById('profileDisplayName').textContent = userProfile.displayName || 'Nama Guru';
    document.getElementById('profileEmail').textContent = userProfile.email || '';
    document.getElementById('profileAvatar').src = userProfile.photoURL || currentUser.photoURL || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName || 'U')}&background=ffffff&color=22c55e&size=100`;

    // Load subjects
    loadSubjectsForm();
}

// Load subjects form
function loadSubjectsForm() {
    const container = document.getElementById('subjectsList');
    const subjects = userProfile?.subjects || [];

    if (subjects.length === 0) {
        addSubjectInput();
        return;
    }

    container.innerHTML = '';
    subjects.forEach((subject, index) => {
        addSubjectInput(subject);
    });
}

// Add subject input
function addSubjectInput(data = null) {
    const container = document.getElementById('subjectsList');
    const index = container.children.length;

    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-3 bg-gray-50 rounded-xl';
    div.innerHTML = `
        <div class="flex-1">
            <input type="text" name="subjectName[]" value="${data?.name || ''}" 
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" 
                placeholder="Nama Mata Pelajaran">
        </div>
        <div class="w-32">
            <input type="number" name="subjectHours[]" value="${data?.hoursPerWeek || 2}" min="1" max="10"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500" 
                placeholder="JP/Minggu">
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="p-2 text-red-500 hover:bg-red-50 rounded-lg">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// Save profile
async function saveProfile(e) {
    e.preventDefault();
    showLoading(true);

    try {
        // Collect subjects
        const subjectNames = document.querySelectorAll('input[name="subjectName[]"]');
        const subjectHours = document.querySelectorAll('input[name="subjectHours[]"]');
        const subjects = [];

        subjectNames.forEach((input, i) => {
            if (input.value.trim()) {
                subjects.push({
                    name: input.value.trim(),
                    hoursPerWeek: parseInt(subjectHours[i].value) || 2
                });
            }
        });

        const profileData = {
            displayName: document.getElementById('inputDisplayName').value.trim(),
            nip: document.getElementById('inputNIP').value.trim(),
            phone: document.getElementById('inputPhone').value.trim(),
            schoolName: document.getElementById('inputSchoolName').value.trim(),
            schoolAddress: document.getElementById('inputSchoolAddress').value.trim(),
            schoolCity: document.getElementById('inputSchoolCity').value.trim(),
            schoolProvince: document.getElementById('inputSchoolProvince').value.trim(),
            principalName: document.getElementById('inputPrincipalName').value.trim(),
            principalNIP: document.getElementById('inputPrincipalNIP').value.trim(),
            subjects: subjects
        };

        await updateUserProfile(profileData);
        
        // Update UI
        document.getElementById('userName').textContent = profileData.displayName || 'User';
        document.getElementById('welcomeName').textContent = (profileData.displayName || 'Guru').split(' ')[0];
        document.getElementById('profileDisplayName').textContent = profileData.displayName || 'Nama Guru';

        showToast('Profil berhasil disimpan!', 'success');
        updateSetupProgress();

    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Gagal menyimpan profil', 'error');
    }

    showLoading(false);
}

// ==================== CALENDAR MODULE ====================

// Load calendar module
function loadCalendarModule() {
    if (userData.calendar) {
        document.getElementById('sem1Start').value = userData.calendar.sem1Start || '';
        document.getElementById('sem1End').value = userData.calendar.sem1End || '';
        document.getElementById('sem2Start').value = userData.calendar.sem2Start || '';
        document.getElementById('sem2End').value = userData.calendar.sem2End || '';
        
        loadHolidays(userData.calendar.holidays || []);
        updateCalendarStats();
    } else {
        // Set default dates
        const years = currentAcademicYear.split('/');
        document.getElementById('sem1Start').value = `${years[0]}-07-15`;
        document.getElementById('sem1End').value = `${years[0]}-12-20`;
        document.getElementById('sem2Start').value = `${years[1]}-01-06`;
        document.getElementById('sem2End').value = `${years[1]}-06-20`;
        
        loadHolidays([]);
        updateCalendarStats();
    }

    // Add change listeners
    ['sem1Start', 'sem1End', 'sem2Start', 'sem2End'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateCalendarStats);
    });
}

// Load holidays
function loadHolidays(holidays) {
    const container = document.getElementById('holidaysList');
    container.innerHTML = '';

    if (holidays.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">Belum ada libur kustom. Klik "Tambah Libur" untuk menambahkan.</p>';
        return;
    }

    holidays.forEach((holiday, index) => {
        addHolidayRow(holiday, index);
    });
}

// Add holiday row
function addHolidayRow(holiday = null, index = null) {
    const container = document.getElementById('holidaysList');
    
    // Remove placeholder if exists
    const placeholder = container.querySelector('p');
    if (placeholder) placeholder.remove();

    const div = document.createElement('div');
    div.className = 'flex items-center space-x-3 p-3 bg-orange-50 rounded-lg';
    div.innerHTML = `
        <input type="date" class="holiday-date flex-1 px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white" 
            value="${holiday?.date || ''}">
        <input type="text" class="holiday-name flex-1 px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-white" 
            placeholder="Nama hari libur" value="${holiday?.name || ''}">
        <button type="button" onclick="this.parentElement.remove(); updateCalendarStats();" class="p-2 text-red-500 hover:bg-red-100 rounded-lg">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// Add holiday
function addHoliday() {
    addHolidayRow();
}

// Update calendar statistics
function updateCalendarStats() {
    const sem1Start = document.getElementById('sem1Start').value;
    const sem1End = document.getElementById('sem1End').value;
    const sem2Start = document.getElementById('sem2Start').value;
    const sem2End = document.getElementById('sem2End').value;

    // Get holidays
    const holidays = getHolidaysFromForm();

    if (sem1Start && sem1End) {
        const days = calculateEffectiveDays(sem1Start, sem1End, holidays.map(h => h.date));
        const weeks = getWeeksBetween(sem1Start, sem1End);
        document.getElementById('sem1EffectiveDays').textContent = `${days} hari`;
        document.getElementById('sem1EffectiveWeeks').textContent = `${weeks} minggu`;
    }

    if (sem2Start && sem2End) {
        const days = calculateEffectiveDays(sem2Start, sem2End, holidays.map(h => h.date));
        const weeks = getWeeksBetween(sem2Start, sem2End);
        document.getElementById('sem2EffectiveDays').textContent = `${days} hari`;
        document.getElementById('sem2EffectiveWeeks').textContent = `${weeks} minggu`;
    }
}

// Get holidays from form
function getHolidaysFromForm() {
    const holidays = [];
    const rows = document.querySelectorAll('#holidaysList > div');
    
    rows.forEach(row => {
        const date = row.querySelector('.holiday-date').value;
        const name = row.querySelector('.holiday-name').value;
        if (date && name) {
            holidays.push({ date, name });
        }
    });

    return holidays;
}

// Save calendar
async function saveCalendar() {
    showLoading(true);

    try {
        const calendarData = {
            sem1Start: document.getElementById('sem1Start').value,
            sem1End: document.getElementById('sem1End').value,
            sem2Start: document.getElementById('sem2Start').value,
            sem2End: document.getElementById('sem2End').value,
            holidays: getHolidaysFromForm(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(currentUser.uid)
            .collection('calendar').doc(currentAcademicYear).set(calendarData);

        userData.calendar = calendarData;
        showToast('Kalender berhasil disimpan!', 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error saving calendar:', error);
        showToast('Gagal menyimpan kalender', 'error');
    }

    showLoading(false);
}

// ==================== CP MODULE ====================

// Load CP module
function loadCPModule() {
    renderCPList(userData.cp);
}

// Load default CP (PAI)
async function loadDefaultCP() {
    if (userData.cp.length > 0) {
        if (!confirm('Data CP yang ada akan diganti dengan data default PAI. Lanjutkan?')) {
            return;
        }
    }

    showLoading(true);

    try {
        // Clear existing CP
        const batch = db.batch();
        const existingCP = await db.collection('users').doc(currentUser.uid)
            .collection('cp').get();
        existingCP.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Add default CP
        const newBatch = db.batch();
        CP_DEFAULT_DATA.forEach(cp => {
            const ref = db.collection('users').doc(currentUser.uid).collection('cp').doc();
            newBatch.set(ref, {
                ...cp,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await newBatch.commit();

        // Reload CP
        const cpSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('cp').get();
        userData.cp = cpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        renderCPList(userData.cp);
        showToast(`Berhasil memuat ${userData.cp.length} CP default PAI!`, 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error loading default CP:', error);
        showToast('Gagal memuat CP default', 'error');
    }

    showLoading(false);
}

// Show add CP modal
function showAddCPModal() {
    document.getElementById('addCPForm').reset();
    showModal('addCPModal');
}

// Save CP
async function saveCP(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const dimensi = Array.from(document.querySelectorAll('input[name="dimensi"]:checked'))
            .map(cb => cb.value);

        const cpData = {
            fase: document.getElementById('cpFase').value,
            kelas: parseInt(document.getElementById('cpKelas').value),
            semester: document.getElementById('cpSemester').value,
            elemen: document.getElementById('cpElemen').value,
            tujuanPembelajaran: document.getElementById('cpTP').value,
            dimensi: dimensi,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('users').doc(currentUser.uid)
            .collection('cp').add(cpData);

        userData.cp.push({ id: docRef.id, ...cpData });
        renderCPList(userData.cp);
        
        hideModal('addCPModal');
        showToast('CP berhasil ditambahkan!', 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error saving CP:', error);
        showToast('Gagal menyimpan CP', 'error');
    }

    showLoading(false);
}

// Render CP list
function renderCPList(cpData) {
    const container = document.getElementById('cpList');
    
    if (cpData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-bullseye text-4xl mb-4 text-gray-300"></i>
                <p>Belum ada data CP. Klik "Load Default PAI" untuk memuat data default atau "Tambah CP" untuk menambah manual.</p>
            </div>
        `;
        return;
    }

    // Group by fase and kelas
    const grouped = groupBy(cpData, 'fase');
    
    container.innerHTML = Object.entries(grouped).map(([fase, items]) => `
        <div class="border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div class="bg-gray-50 px-4 py-3 font-semibold text-gray-700 flex items-center justify-between">
                <span>${fase} (Kelas ${FASE_MAPPING[fase]?.kelas.join(', ') || '-'})</span>
                <span class="text-sm font-normal text-gray-500">${items.length} TP</span>
            </div>
            <div class="divide-y divide-gray-100">
                ${items.map(cp => `
                    <div class="p-4 hover:bg-gray-50">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Kelas ${cp.kelas}</span>
                                    <span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">${cp.semester}</span>
                                    <span class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">${cp.elemen}</span>
                                </div>
                                <p class="text-gray-700">${cp.tujuanPembelajaran}</p>
                                <div class="flex flex-wrap gap-1 mt-2">
                                    ${(cp.dimensi || []).map(d => `
                                        <span class="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">${d}</span>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="flex space-x-2 ml-4">
                                <button onclick="editCP('${cp.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteCP('${cp.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Filter CP
function filterCP() {
    const fase = document.getElementById('cpFilterFase').value;
    const kelas = document.getElementById('cpFilterKelas').value;
    const semester = document.getElementById('cpFilterSemester').value;
    const elemen = document.getElementById('cpFilterElemen').value;

    let filtered = userData.cp;

    if (fase) filtered = filtered.filter(cp => cp.fase === fase);
    if (kelas) filtered = filtered.filter(cp => cp.kelas === parseInt(kelas));
    if (semester) filtered = filtered.filter(cp => cp.semester === semester);
    if (elemen) filtered = filtered.filter(cp => cp.elemen === elemen);

    renderCPList(filtered);
}

// Delete CP
async function deleteCP(cpId) {
    if (!confirm('Yakin ingin menghapus CP ini?')) return;

    showLoading(true);

    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('cp').doc(cpId).delete();

        userData.cp = userData.cp.filter(cp => cp.id !== cpId);
        renderCPList(userData.cp);
        showToast('CP berhasil dihapus', 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error deleting CP:', error);
        showToast('Gagal menghapus CP', 'error');
    }

    showLoading(false);
}

// ==================== STUDENTS MODULE ====================

// Load students module
function loadStudentsModule() {
    populateClassFilters();
    renderStudentsTable(userData.students);
}

// Show import students modal
function showImportStudentsModal() {
    showModal('importStudentsModal');
}

// Process import students
async function processImportStudents() {
    const csvUrl = document.getElementById('csvUrl').value;
    const csvFile = document.getElementById('csvFile').files[0];

    if (!csvUrl && !csvFile) {
        showToast('Masukkan URL CSV atau pilih file', 'warning');
        return;
    }

    showLoading(true);

    try {
        let csvText;

        if (csvFile) {
            csvText = await csvFile.text();
        } else {
            const response = await fetch(csvUrl);
            csvText = await response.text();
        }

        const { data } = parseCSV(csvText);

        if (data.length === 0) {
            showToast('Data CSV kosong atau format tidak valid', 'error');
            showLoading(false);
            return;
        }

        // Validate required fields
        const requiredFields = ['nisn', 'nama', 'jenis_kelamin', 'kelas', 'rombel'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(f => !(f in firstRow));

        if (missingFields.length > 0) {
            showToast(`Field tidak lengkap: ${missingFields.join(', ')}`, 'error');
            showLoading(false);
            return;
        }

        // Save students to Firestore
        const batch = db.batch();
        
        data.forEach(row => {
            const ref = db.collection('users').doc(currentUser.uid)
                .collection('students').doc();
            batch.set(ref, {
                nisn: row.nisn,
                nama: row.nama,
                jenisKelamin: row.jenis_kelamin.toUpperCase(),
                kelas: parseInt(row.kelas),
                rombel: row.rombel.toUpperCase(),
                academicYear: currentAcademicYear,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        // Reload students
        const studentsSnapshot = await db.collection('users').doc(currentUser.uid)
            .collection('students').where('academicYear', '==', currentAcademicYear).get();
        userData.students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        renderStudentsTable(userData.students);
        hideModal('importStudentsModal');
        showToast(`Berhasil import ${data.length} siswa!`, 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error importing students:', error);
        showToast('Gagal import data siswa', 'error');
    }

    showLoading(false);
}

// Populate class filters
function populateClassFilters() {
    const classes = [...new Set(userData.students.map(s => s.kelas))].sort((a, b) => a - b);
    const rombels = [...new Set(userData.students.map(s => s.rombel))].sort();

    const classSelect = document.getElementById('studentFilterClass');
    const rombelSelect = document.getElementById('studentFilterRombel');

    classSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        classes.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

    rombelSelect.innerHTML = '<option value="">Semua Rombel</option>' +
        rombels.map(r => `<option value="${r}">Rombel ${r}</option>`).join('');
}

// Render students table
function renderStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4 text-gray-300"></i>
                    <p>Belum ada data siswa. Import dari CSV atau tambah manual.</p>
                </td>
            </tr>
        `;
        document.getElementById('studentsShowCount').textContent = '0';
        document.getElementById('studentsTotalCount').textContent = '0';
        return;
    }

    tbody.innerHTML = students.map((student, index) => `
        <tr class="hover:bg-gray-50 border-b border-gray-100">
            <td class="px-4 py-3 text-sm">${index + 1}</td>
            <td class="px-4 py-3 text-sm">${student.nisn}</td>
            <td class="px-4 py-3 text-sm font-medium">${student.nama}</td>
            <td class="px-4 py-3 text-sm text-center">
                <span class="${student.jenisKelamin === 'L' ? 'text-blue-600' : 'text-pink-600'}">${student.jenisKelamin}</span>
            </td>
            <td class="px-4 py-3 text-sm text-center">${student.kelas}</td>
            <td class="px-4 py-3 text-sm text-center">${student.rombel}</td>
            <td class="px-4 py-3 text-sm text-center">
                <button onclick="deleteStudent('${student.id}')" class="p-1 text-red-600 hover:bg-red-50 rounded">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('studentsShowCount').textContent = students.length;
    document.getElementById('studentsTotalCount').textContent = userData.students.length;
}

// Filter students
function filterStudents() {
    const kelas = document.getElementById('studentFilterClass').value;
    const rombel = document.getElementById('studentFilterRombel').value;
    const search = document.getElementById('studentSearch').value.toLowerCase();

    let filtered = userData.students;

    if (kelas) filtered = filtered.filter(s => s.kelas === parseInt(kelas));
    if (rombel) filtered = filtered.filter(s => s.rombel === rombel);
    if (search) filtered = filtered.filter(s => 
        s.nama.toLowerCase().includes(search) || s.nisn.includes(search)
    );

    renderStudentsTable(filtered);
}

// Delete student
async function deleteStudent(studentId) {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;

    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('students').doc(studentId).delete();

        userData.students = userData.students.filter(s => s.id !== studentId);
        renderStudentsTable(userData.students);
        showToast('Siswa berhasil dihapus', 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Gagal menghapus siswa', 'error');
    }
}

// ==================== SCHEDULE MODULE ====================

// Load schedule module
function loadScheduleModule() {
    // Populate class and subject selects
    const classSelect = document.getElementById('scheduleClass');
    const subjectSelect = document.getElementById('scheduleSubject');

    // Get unique classes from students
    const classes = [...new Set(userData.students.map(s => `${s.kelas}${s.rombel}`))].sort();
    classSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
        classes.map(c => `<option value="${c}">${c}</option>`).join('');

    // Get subjects from profile
    const subjects = userProfile?.subjects || [];
    subjectSelect.innerHTML = '<option value="">-- Pilih Mapel --</option>' +
        subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

    // Generate schedule table
    generateScheduleTable();
}

// Show time slots settings
function showTimeSlotsSettings() {
    loadDefaultTimeSlots();
    showModal('timeSlotsModal');
}

// Load default time slots
function loadDefaultTimeSlots() {
    const jenjang = document.getElementById('timeSlotJenjang').value;
    const container = document.getElementById('timeSlotsContainer');
    
    // Default durations per level
    const durations = { 'SD': 35, 'SMP': 40, 'SMA': 45 };
    document.getElementById('durationPerSlot').value = durations[jenjang];

    // Default time slots
    const defaultSlots = [
        { start: '07:00', end: '07:35' },
        { start: '07:35', end: '08:10' },
        { start: '08:10', end: '08:45' },
        { start: '08:45', end: '09:20' },
        { start: '09:35', end: '10:10' },
        { start: '10:10', end: '10:45' },
        { start: '10:45', end: '11:20' },
        { start: '11:20', end: '11:55' }
    ];

    // Load saved slots or defaults
    const savedSlots = userData.schedule?.timeSlots || defaultSlots;
    
    container.innerHTML = savedSlots.map((slot, i) => `
        <div class="flex items-center space-x-2">
            <span class="w-16 text-sm text-gray-600">Jam ${i + 1}</span>
            <input type="time" class="slot-start px-2 py-1 border border-gray-200 rounded" value="${slot.start}">
            <span>-</span>
            <input type="time" class="slot-end px-2 py-1 border border-gray-200 rounded" value="${slot.end}">
            <button type="button" onclick="this.parentElement.remove()" class="p-1 text-red-500 hover:bg-red-50 rounded">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// Add time slot
function addTimeSlot() {
    const container = document.getElementById('timeSlotsContainer');
    const index = container.children.length;
    
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2';
    div.innerHTML = `
        <span class="w-16 text-sm text-gray-600">Jam ${index + 1}</span>
        <input type="time" class="slot-start px-2 py-1 border border-gray-200 rounded" value="">
        <span>-</span>
        <input type="time" class="slot-end px-2 py-1 border border-gray-200 rounded" value="">
        <button type="button" onclick="this.parentElement.remove()" class="p-1 text-red-500 hover:bg-red-50 rounded">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(div);
}

// Save time slots
async function saveTimeSlots() {
    const slots = [];
    const rows = document.querySelectorAll('#timeSlotsContainer > div');
    
    rows.forEach(row => {
        const start = row.querySelector('.slot-start').value;
        const end = row.querySelector('.slot-end').value;
        if (start && end) {
            slots.push({ start, end });
        }
    });

    if (slots.length === 0) {
        showToast('Minimal harus ada 1 jam pelajaran', 'warning');
        return;
    }

    showLoading(true);

    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('schedule').doc(currentAcademicYear).set({
                timeSlots: slots,
                duration: parseInt(document.getElementById('durationPerSlot').value),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

        userData.schedule = { ...userData.schedule, timeSlots: slots };
        
        hideModal('timeSlotsModal');
        generateScheduleTable();
        showToast('Pengaturan jam pelajaran berhasil disimpan!', 'success');
        updateDashboardStats();

    } catch (error) {
        console.error('Error saving time slots:', error);
        showToast('Gagal menyimpan pengaturan', 'error');
    }

    showLoading(false);
}

// Generate schedule table
function generateScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    const slots = userData.schedule?.timeSlots || [
        { start: '07:00', end: '07:40' },
        { start: '07:40', end: '08:20' },
        { start: '08:20', end: '09:00' },
        { start: '09:15', end: '09:55' },
        { start: '09:55', end: '10:35' },
        { start: '10:35', end: '11:15' },
        { start: '11:15', end: '11:55' },
        { start: '12:30', end: '13:10' }
    ];

    tbody.innerHTML = slots.map((slot, i) => `
        <tr class="hover:bg-gray-50">
            <td class="border border-gray-200 px-4 py-2 text-center font-medium">${i + 1}</td>
            <td class="border border-gray-200 px-4 py-2 text-center text-sm">${slot.start} - ${slot.end}</td>
            ${['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].map(day => `
                <td class="border border-gray-200 px-2 py-1 text-center">
                    <button onclick="editScheduleSlot(${i}, '${day}')" class="w-full h-8 text-xs bg-gray-50 hover:bg-primary-50 rounded border border-dashed border-gray-300">
                        <i class="fas fa-plus text-gray-400"></i>
                    </button>
                </td>
            `).join('')}
        </tr>
    `).join('');
}

// ==================== ATP MODULE ====================

// Load ATP module
function loadATPModule() {
    populateATPFilters();
}

// Populate ATP filters
function populateATPFilters() {
    const classSelect = document.getElementById('atpFilterKelas');
    const mapelSelect = document.getElementById('atpFilterMapel');

    // Get classes from CP
    const classes = [...new Set(userData.cp.map(cp => cp.kelas))].sort((a, b) => a - b);
    classSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
        classes.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

    // Get subjects from profile or use PAI default
    const subjects = userProfile?.subjects?.map(s => s.name) || ['Pendidikan Agama Islam dan Budi Pekerti'];
    mapelSelect.innerHTML = '<option value="">Pilih Mapel</option>' +
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
}

// Generate ATP
function generateATP() {
    const kelas = document.getElementById('atpFilterKelas').value;
    const mapel = document.getElementById('atpFilterMapel').value;
    const semester = document.getElementById('atpFilterSemester').value;

    if (!kelas || !mapel) {
        showToast('Pilih kelas dan mata pelajaran terlebih dahulu', 'warning');
        return;
    }

    let filteredCP = userData.cp.filter(cp => cp.kelas === parseInt(kelas));
    if (semester) {
        filteredCP = filteredCP.filter(cp => cp.semester === semester);
    }

    if (filteredCP.length === 0) {
        showToast('Tidak ada CP untuk kelas dan semester yang dipilih', 'warning');
        return;
    }

    renderATP(filteredCP, kelas, mapel);
}

// Render ATP
function renderATP(cpData, kelas, mapel) {
    const container = document.getElementById('atpContent');
    
    // Group by semester
    const bySemester = groupBy(cpData, 'semester');

    container.innerHTML = `
        <div class="print-full">
            <!-- Header -->
            <div class="text-center mb-6">
                <h2 class="text-xl font-bold">ALUR TUJUAN PEMBELAJARAN (ATP)</h2>
                <p class="text-gray-600">Tahun Pelajaran ${currentAcademicYear}</p>
            </div>

            <!-- Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <p><span class="font-medium">Satuan Pendidikan:</span> ${userProfile?.schoolName || '-'}</p>
                    <p><span class="font-medium">Mata Pelajaran:</span> ${mapel}</p>
                </div>
                <div>
                    <p><span class="font-medium">Kelas:</span> ${kelas}</p>
                    <p><span class="font-medium">Fase:</span> ${getFaseByKelas(parseInt(kelas))}</p>
                </div>
            </div>

            <!-- ATP Table per Semester -->
            ${Object.entries(bySemester).map(([semester, items]) => `
                <div class="mb-6">
                    <h3 class="font-semibold text-lg mb-3 text-gray-800">Semester ${semester}</h3>
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-primary-50">
                                <th class="border border-gray-200 px-3 py-2 text-left text-sm w-10">No</th>
                                <th class="border border-gray-200 px-3 py-2 text-left text-sm w-32">Elemen</th>
                                <th class="border border-gray-200 px-3 py-2 text-left text-sm">Tujuan Pembelajaran</th>
                                <th class="border border-gray-200 px-3 py-2 text-left text-sm w-40">Dimensi Profil Lulusan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map((cp, i) => `
                                <tr class="hover:bg-gray-50">
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">${i + 1}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.elemen}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.tujuanPembelajaran}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">
                                        ${(cp.dimensi || []).map(d => `<span class="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full mr-1 mb-1">${d}</span>`).join('')}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            <!-- Signature -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br><br><br><br>
                    <p class="font-medium">${userProfile?.principalName || '...........................'}</p>
                    <p>NIP. ${userProfile?.principalNIP || '...........................'}</p>
                </div>
                <div>
                    <p>${userProfile?.schoolCity || '...........................'}, .................... ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <br><br><br><br>
                    <p class="font-medium">${userProfile?.displayName || '...........................'}</p>
                    <p>NIP. ${userProfile?.nip || '...........................'}</p>
                </div>
            </div>
        </div>
    `;
}

// Export ATP
function exportATP() {
    const content = document.getElementById('atpContent');
    if (content.querySelector('.print-full')) {
        window.print();
    } else {
        showToast('Generate ATP terlebih dahulu', 'warning');
    }
}

// ==================== PROTA MODULE ====================

// Load Prota module
function loadProtaModule() {
    populateProtaFilters();
}

// Populate Prota filters
function populateProtaFilters() {
    const classSelect = document.getElementById('protaFilterKelas');
    const mapelSelect = document.getElementById('protaFilterMapel');

    const classes = [...new Set(userData.cp.map(cp => cp.kelas))].sort((a, b) => a - b);
    classSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
        classes.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

    const subjects = userProfile?.subjects?.map(s => s.name) || ['Pendidikan Agama Islam dan Budi Pekerti'];
    mapelSelect.innerHTML = '<option value="">Pilih Mapel</option>' +
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
}

// Generate Prota
function generateProta() {
    const kelas = document.getElementById('protaFilterKelas').value;
    const mapel = document.getElementById('protaFilterMapel').value;

    if (!kelas || !mapel) {
        showToast('Pilih kelas dan mata pelajaran terlebih dahulu', 'warning');
        return;
    }

    if (!userData.calendar?.sem1Start) {
        showToast('Atur kalender pendidikan terlebih dahulu', 'warning');
        return;
    }

    const filteredCP = userData.cp.filter(cp => cp.kelas === parseInt(kelas));
    
    if (filteredCP.length === 0) {
        showToast('Tidak ada CP untuk kelas yang dipilih', 'warning');
        return;
    }

    renderProta(filteredCP, kelas, mapel);
}

// Render Prota
function renderProta(cpData, kelas, mapel) {
    const container = document.getElementById('protaContent');
    const cal = userData.calendar;

    // Calculate weeks per semester
    const sem1Weeks = getWeeksBetween(cal.sem1Start, cal.sem1End);
    const sem2Weeks = getWeeksBetween(cal.sem2Start, cal.sem2End);

    // Get hours per week for the subject
    const subjectInfo = userProfile?.subjects?.find(s => s.name === mapel);
    const hoursPerWeek = subjectInfo?.hoursPerWeek || 3;

    // Group CP by semester
    const cpGanjil = cpData.filter(cp => cp.semester === 'Ganjil');
    const cpGenap = cpData.filter(cp => cp.semester === 'Genap');

    container.innerHTML = `
        <div class="print-full">
            <!-- Header -->
            <div class="text-center mb-6">
                <h2 class="text-xl font-bold">PROGRAM TAHUNAN (PROTA)</h2>
                <p class="text-gray-600">Tahun Pelajaran ${currentAcademicYear}</p>
            </div>

            <!-- Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <p><span class="font-medium">Satuan Pendidikan:</span> ${userProfile?.schoolName || '-'}</p>
                    <p><span class="font-medium">Mata Pelajaran:</span> ${mapel}</p>
                    <p><span class="font-medium">Kelas:</span> ${kelas}</p>
                </div>
                <div>
                    <p><span class="font-medium">Fase:</span> ${getFaseByKelas(parseInt(kelas))}</p>
                    <p><span class="font-medium">Alokasi Waktu:</span> ${hoursPerWeek} JP/Minggu</p>
                </div>
            </div>

            <!-- Semester Ganjil -->
            <div class="mb-6">
                <h3 class="font-semibold text-lg mb-3 bg-blue-50 px-4 py-2 rounded">Semester Ganjil (${sem1Weeks} Minggu)</h3>
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-200 px-3 py-2 text-sm w-10">No</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-32">Elemen</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm">Tujuan Pembelajaran</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-24">Alokasi Waktu</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-24">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cpGanjil.map((cp, i) => {
                            const allocatedHours = Math.ceil((sem1Weeks * hoursPerWeek) / cpGanjil.length);
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">${i + 1}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.elemen}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.tujuanPembelajaran}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">${allocatedHours} JP</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">-</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr class="bg-gray-50 font-medium">
                            <td colspan="3" class="border border-gray-200 px-3 py-2 text-sm text-right">Total Jam Semester Ganjil:</td>
                            <td class="border border-gray-200 px-3 py-2 text-sm text-center">${sem1Weeks * hoursPerWeek} JP</td>
                            <td class="border border-gray-200 px-3 py-2 text-sm"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Semester Genap -->
            <div class="mb-6">
                <h3 class="font-semibold text-lg mb-3 bg-green-50 px-4 py-2 rounded">Semester Genap (${sem2Weeks} Minggu)</h3>
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-200 px-3 py-2 text-sm w-10">No</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-32">Elemen</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm">Tujuan Pembelajaran</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-24">Alokasi Waktu</th>
                            <th class="border border-gray-200 px-3 py-2 text-sm w-24">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cpGenap.map((cp, i) => {
                            const allocatedHours = Math.ceil((sem2Weeks * hoursPerWeek) / cpGenap.length);
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">${i + 1}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.elemen}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm">${cp.tujuanPembelajaran}</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">${allocatedHours} JP</td>
                                    <td class="border border-gray-200 px-3 py-2 text-sm text-center">-</td>
                                </tr>
                            `;
                        }).join('')}
                        <tr class="bg-gray-50 font-medium">
                            <td colspan="3" class="border border-gray-200 px-3 py-2 text-sm text-right">Total Jam Semester Genap:</td>
                            <td class="border border-gray-200 px-3 py-2 text-sm text-center">${sem2Weeks * hoursPerWeek} JP</td>
                            <td class="border border-gray-200 px-3 py-2 text-sm"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Total -->
            <div class="bg-primary-50 rounded-lg p-4 mb-8">
                <div class="flex justify-between items-center">
                    <span class="font-semibold">Total Jam Pelajaran Setahun:</span>
                    <span class="text-xl font-bold text-primary-700">${(sem1Weeks + sem2Weeks) * hoursPerWeek} JP</span>
                </div>
            </div>

            <!-- Signature -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br><br><br><br>
                    <p class="font-medium">${userProfile?.principalName || '...........................'}</p>
                    <p>NIP. ${userProfile?.principalNIP || '...........................'}</p>
                </div>
                <div>
                    <p>${userProfile?.schoolCity || '...........................'}, .................... ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <br><br><br><br>
                    <p class="font-medium">${userProfile?.displayName || '...........................'}</p>
                    <p>NIP. ${userProfile?.nip || '...........................'}</p>
                </div>
            </div>
        </div>
    `;
}

// Export Prota
function exportProta() {
    const content = document.getElementById('protaContent');
    if (content.querySelector('.print-full')) {
        window.print();
    } else {
        showToast('Generate Prota terlebih dahulu', 'warning');
    }
}

// ==================== AI ASSISTANT MODULE ====================

// Copy AI prompt
function copyPrompt(type) {
    const prompts = {
        students: `Tolong konversikan data siswa berikut ke format CSV dengan kolom:
nisn,nama,jenis_kelamin,kelas,rombel

Ketentuan:
- nisn: Nomor Induk Siswa Nasional (10 digit)
- nama: Nama lengkap siswa
- jenis_kelamin: L untuk Laki-laki, P untuk Perempuan
- kelas: Angka kelas (1-12)
- rombel: Huruf rombongan belajar (A, B, C, dst)

Contoh output:
nisn,nama,jenis_kelamin,kelas,rombel
1234567890,Ahmad Fauzi,L,7,A
1234567891,Siti Aminah,P,7,A

Data siswa yang perlu dikonversi:
[PASTE DATA SISWA ANDA DI SINI]`,

        cp: `Tolong konversikan Capaian Pembelajaran berikut ke format CSV dengan kolom:
fase,kelas,semester,elemen,tujuan_pembelajaran,dimensi

Ketentuan:
- fase: Fase A/B/C/D/E/F
- kelas: Angka 1-12
- semester: Ganjil atau Genap
- elemen: Nama bab/elemen pembelajaran
- tujuan_pembelajaran: Deskripsi TP lengkap
- dimensi: Dimensi Profil Lulusan (Keimanan/Kewargaan/Penalaran Kritis/Kreativitas/Kolaborasi/Kemandirian/Kesehatan/Komunikasi), pisahkan dengan tanda |

Contoh output:
fase,kelas,semester,elemen,tujuan_pembelajaran,dimensi
Fase A,1,Ganjil,Al-Qur'an Hadis,Peserta didik mampu mengenal huruf hijaiyah,Keimanan

Data CP yang perlu dikonversi:
[PASTE DATA CP ANDA DI SINI]`,

        calendar: `Tolong konversikan data kalender pendidikan berikut ke format CSV dengan kolom:
tanggal,nama_kegiatan,jenis

Ketentuan:
- tanggal: Format YYYY-MM-DD
- nama_kegiatan: Nama hari libur/kegiatan
- jenis: libur/kegiatan/ujian

Contoh output:
tanggal,nama_kegiatan,jenis
2024-08-17,Hari Kemerdekaan RI,libur
2024-12-09,Penilaian Akhir Semester,ujian

Data kalender yang perlu dikonversi:
[PASTE DATA KALENDER ANDA DI SINI]`,

        questions: `Tolong konversikan soal-soal berikut ke format CSV dengan kolom:
kelas,semester,elemen,materi,jenis_soal,soal,pilihan_a,pilihan_b,pilihan_c,pilihan_d,kunci_jawaban,pembahasan

Ketentuan:
- kelas: Angka 1-12
- semester: Ganjil atau Genap
- elemen: Nama bab/elemen
- materi: Sub materi spesifik
- jenis_soal: PG (Pilihan Ganda) atau Uraian
- soal: Teks soal (untuk teks Arab gunakan unicode)
- pilihan_a sampai pilihan_d: Opsi jawaban (kosongkan jika uraian)
- kunci_jawaban: A/B/C/D atau teks jawaban
- pembahasan: Penjelasan jawaban

Contoh output PG:
kelas,semester,elemen,materi,jenis_soal,soal,pilihan_a,pilihan_b,pilihan_c,pilihan_d,kunci_jawaban,pembahasan
7,Ganjil,Al-Qur'an Hadis,Tajwid,PG,Hukum bacaan nun mati bertemu ba disebut...,Ikhfa,Idgham,Iqlab,Izhar,C,Nun mati bertemu ba hukumnya iqlab

Data soal yang perlu dikonversi:
[PASTE SOAL ANDA DI SINI]`
    };

    const output = document.getElementById('promptOutput');
    output.value = prompts[type];
    
    navigator.clipboard.writeText(prompts[type])
        .then(() => showToast('Prompt berhasil disalin ke clipboard!', 'success'))
        .catch(() => showToast('Pilih dan salin manual dari textarea', 'info'));
}

// ==================== PREMIUM MODULES (Placeholder) ====================

// Check and show premium content or locked state
function checkPremiumModule(moduleName) {
    const lockedContent = document.getElementById(`${moduleName}LockedContent`);
    const content = document.getElementById(`${moduleName}Content`);
    
    if (!lockedContent || !content) return;
    
    if (isPremium()) {
        lockedContent.classList.add('hidden');
        content.classList.remove('hidden');
    } else {
        lockedContent.classList.remove('hidden');
        content.classList.add('hidden');
    }
}

// Initialize premium module placeholders
function initPremiumModules() {
    const premiumModules = ['modul-ajar', 'lkpd', 'bank-soal', 'absensi', 'jurnal', 'nilai', 'kktp'];
    
    premiumModules.forEach(moduleName => {
        const moduleEl = document.getElementById(`module-${moduleName}`);
        if (moduleEl && !moduleEl.innerHTML.trim()) {
            moduleEl.innerHTML = `
                <div id="${moduleName}LockedContent" class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div class="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-lock text-amber-600 text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Fitur Premium</h2>
                    <p class="text-gray-500 mb-6">Fitur ini memerlukan akun Premium. Upgrade untuk mengakses semua fitur lengkap.</p>
                    <button onclick="redirectToWhatsApp()" class="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition">
                        <i class="fas fa-crown mr-2"></i>
                        Upgrade ke Premium
                    </button>
                </div>
                <div id="${moduleName}Content" class="hidden">
                    <!-- Premium content will be loaded here -->
                </div>
            `;
        }
    });
}

// Call init on load
document.addEventListener('DOMContentLoaded', initPremiumModules);

// ==================== CSV IMPORT HELPERS ====================

// Import calendar from CSV
async function importCalendarCSV() {
    const url = prompt('Masukkan URL Google Spreadsheet (CSV):');
    if (!url) return;

    showLoading(true);

    try {
        const response = await fetch(url);
        const csvText = await response.text();
        const { data } = parseCSV(csvText);

        const holidays = data.filter(row => row.jenis === 'libur').map(row => ({
            date: row.tanggal,
            name: row.nama_kegiatan
        }));

        // Update holidays list
        const container = document.getElementById('holidaysList');
        container.innerHTML = '';
        holidays.forEach(h => addHolidayRow(h));

        updateCalendarStats();
        showToast(`Berhasil import ${holidays.length} hari libur!`, 'success');

    } catch (error) {
        console.error('Error importing calendar:', error);
        showToast('Gagal import kalender', 'error');
    }

    showLoading(false);
}

// ==================== HASH ROUTING ====================

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showModule(hash);
    }
});

console.log('App.js loaded successfully');