// ============================================
// PROFIL MODULE
// Admin PAI Super App
// ============================================

// === STATE ===
let currentProfileData = null;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeProfilPage();
});

// === INITIALIZE PROFIL PAGE ===
async function initializeProfilPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadProfileData();
            setupFormListeners();
            updateSidebarInfo();
        }
    });
}

// === LOAD PROFILE DATA ===
async function loadProfileData() {
    try {
        const userData = await getCurrentUserData();
        
        if (userData) {
            currentProfileData = userData;
            populateUserForm(userData);
            populateSchoolForm(userData.school || {});
            populatePrincipalForm(userData.principal || {});
            updateProfileDisplay(userData);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Gagal memuat data profil', 'error');
    }
}

// === UPDATE SIDEBAR INFO ===
function updateSidebarInfo() {
    if (currentProfileData) {
        const name = currentProfileData.displayName || 'Guru PAI';
        const email = currentProfileData.email || '';
        const initial = name.charAt(0).toUpperCase();
        
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        
        if (sidebarName) sidebarName.textContent = name;
        if (sidebarEmail) sidebarEmail.textContent = email;
        if (sidebarAvatar) sidebarAvatar.textContent = initial;
    }
}

// === UPDATE PROFILE DISPLAY ===
function updateProfileDisplay(data) {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) profileName.textContent = data.displayName || 'Guru PAI';
    if (profileRole) profileRole.textContent = data.profile?.specialization || 'Guru PAI';
    if (profileAvatar) {
        const initial = (data.displayName || 'G').charAt(0).toUpperCase();
        profileAvatar.textContent = initial;
    }
}

// === POPULATE USER FORM ===
function populateUserForm(data) {
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };
    
    setVal('inputName', data.displayName);
    setVal('inputNip', data.profile?.nip);
    setVal('inputEmail', data.email);
    setVal('inputPhone', data.profile?.phone);
    setVal('inputAddress', data.profile?.address);
    setVal('inputEducation', data.profile?.education);
    setVal('inputSpecialization', data.profile?.specialization || 'PAI');
    setVal('inputTahunAjaran', data.settings?.tahunAjaran || '2024/2025');
    setVal('inputSemester', data.settings?.semester || '2');
}

// === POPULATE SCHOOL FORM ===
function populateSchoolForm(school) {
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };
    
    setVal('inputSchoolName', school.name);
    setVal('inputNpsn', school.npsn);
    setVal('inputJenjang', school.jenjang || 'SD');
    setVal('inputStatus', school.status || 'Negeri');
    setVal('inputSchoolAddress', school.address);
    setVal('inputKelurahan', school.kelurahan);
    setVal('inputKecamatan', school.kecamatan);
    setVal('inputKabupaten', school.kabupaten);
    setVal('inputProvinsi', school.provinsi);
    setVal('inputKodePos', school.kodePos);
    setVal('inputSchoolPhone', school.phone);
    setVal('inputSchoolEmail', school.email);
    setVal('inputSchoolWebsite', school.website);
}

// === POPULATE PRINCIPAL FORM ===
function populatePrincipalForm(principal) {
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    };
    
    setVal('inputPrincipalName', principal.name);
    setVal('inputPrincipalNip', principal.nip);
    setVal('inputPrincipalPangkat', principal.pangkat);
    setVal('inputPrincipalEducation', principal.education);
    setVal('inputPrincipalPhone', principal.phone);
}

// === SETUP FORM LISTENERS ===
function setupFormListeners() {
    // User Profile Form
    const formUser = document.getElementById('formUserProfile');
    if (formUser) {
        formUser.addEventListener('submit', handleUserSubmit);
    }
    
    // School Form
    const formSchool = document.getElementById('formSchool');
    if (formSchool) {
        formSchool.addEventListener('submit', handleSchoolSubmit);
    }
    
    // Principal Form
    const formPrincipal = document.getElementById('formPrincipal');
    if (formPrincipal) {
        formPrincipal.addEventListener('submit', handlePrincipalSubmit);
    }
}

// === HANDLE USER SUBMIT ===
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };
    
    const data = {
        displayName: getVal('inputName'),
        profile: {
            nip: getVal('inputNip'),
            phone: getVal('inputPhone'),
            address: getVal('inputAddress'),
            education: getVal('inputEducation'),
            specialization: getVal('inputSpecialization')
        },
        settings: {
            ...currentProfileData?.settings,
            tahunAjaran: getVal('inputTahunAjaran'),
            semester: getVal('inputSemester')
        }
    };
    
    try {
        const success = await updateUserData(data);
        
        if (success) {
            // Update Firebase Auth profile
            if (auth.currentUser) {
                await auth.currentUser.updateProfile({
                    displayName: data.displayName
                });
            }
            
            showToast('Profil berhasil diperbarui!', 'success');
            currentProfileData = { ...currentProfileData, ...data };
            updateProfileDisplay(currentProfileData);
            updateSidebarInfo();
        } else {
            showToast('Gagal memperbarui profil', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Terjadi kesalahan', 'error');
    }
}

// === HANDLE SCHOOL SUBMIT ===
async function handleSchoolSubmit(e) {
    e.preventDefault();
    
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };
    
    const school = {
        name: getVal('inputSchoolName'),
        npsn: getVal('inputNpsn'),
        jenjang: getVal('inputJenjang'),
        status: getVal('inputStatus'),
        address: getVal('inputSchoolAddress'),
        kelurahan: getVal('inputKelurahan'),
        kecamatan: getVal('inputKecamatan'),
        kabupaten: getVal('inputKabupaten'),
        provinsi: getVal('inputProvinsi'),
        kodePos: getVal('inputKodePos'),
        phone: getVal('inputSchoolPhone'),
        email: getVal('inputSchoolEmail'),
        website: getVal('inputSchoolWebsite')
    };
    
    try {
        const success = await updateUserData({ school });
        
        if (success) {
            showToast('Data sekolah berhasil disimpan!', 'success');
            currentProfileData = { ...currentProfileData, school };
        } else {
            showToast('Gagal menyimpan data sekolah', 'error');
        }
    } catch (error) {
        console.error('Error saving school:', error);
        showToast('Terjadi kesalahan', 'error');
    }
}

// === HANDLE PRINCIPAL SUBMIT ===
async function handlePrincipalSubmit(e) {
    e.preventDefault();
    
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };
    
    const principal = {
        name: getVal('inputPrincipalName'),
        nip: getVal('inputPrincipalNip'),
        pangkat: getVal('inputPrincipalPangkat'),
        education: getVal('inputPrincipalEducation'),
        phone: getVal('inputPrincipalPhone')
    };
    
    try {
        const success = await updateUserData({ principal });
        
        if (success) {
            showToast('Data kepala sekolah berhasil disimpan!', 'success');
            currentProfileData = { ...currentProfileData, principal };
        } else {
            showToast('Gagal menyimpan data kepala sekolah', 'error');
        }
    } catch (error) {
        console.error('Error saving principal:', error);
        showToast('Terjadi kesalahan', 'error');
    }
}

// === TAB SWITCHING ===
function switchProfilTab(tab) {
    // Update tab buttons
    const tabs = ['User', 'School', 'Principal'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab${t}`);
        const content = document.getElementById(`content${t}`);
        
        if (btn) {
            if (t.toLowerCase() === tab.toLowerCase() || 
                (tab === 'user' && t === 'User') ||
                (tab === 'school' && t === 'School') ||
                (tab === 'principal' && t === 'Principal')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
        
        if (content) {
            if (t.toLowerCase() === tab.toLowerCase() ||
                (tab === 'user' && t === 'User') ||
                (tab === 'school' && t === 'School') ||
                (tab === 'principal' && t === 'Principal')) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        }
    });
}

// === RESET FORMS ===
function resetUserForm() {
    if (currentProfileData) {
        populateUserForm(currentProfileData);
        showToast('Form direset ke data tersimpan', 'info');
    }
}

function resetSchoolForm() {
    if (currentProfileData?.school) {
        populateSchoolForm(currentProfileData.school);
        showToast('Form direset ke data tersimpan', 'info');
    } else {
        document.getElementById('formSchool')?.reset();
        showToast('Form direset', 'info');
    }
}

function resetPrincipalForm() {
    if (currentProfileData?.principal) {
        populatePrincipalForm(currentProfileData.principal);
        showToast('Form direset ke data tersimpan', 'info');
    } else {
        document.getElementById('formPrincipal')?.reset();
        showToast('Form direset', 'info');
    }
}

// === UPLOAD PHOTO ===
async function uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB', 'error');
        return;
    }
    
    try {
        showToast('Mengupload foto...', 'info');
        
        // Check if Firebase Storage is available
        if (typeof firebase !== 'undefined' && firebase.storage) {
            const storage = firebase.storage();
            const userId = auth.currentUser.uid;
            const storageRef = storage.ref(`profiles/${userId}/photo.jpg`);
            
            await storageRef.put(file);
            const photoURL = await storageRef.getDownloadURL();
            
            // Update Firebase Auth
            await auth.currentUser.updateProfile({ photoURL });
            
            // Update Firestore
            await updateUserData({ photoURL });
            
            // Update display
            const avatar = document.getElementById('profileAvatar');
            if (avatar) {
                avatar.innerHTML = `<img src="${photoURL}" class="w-full h-full rounded-full object-cover">`;
            }
            
            showToast('Foto berhasil diupload!', 'success');
        } else {
            showToast('Firebase Storage tidak tersedia', 'warning');
        }
        
    } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Gagal mengupload foto', 'error');
    }
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar) {
        sidebar.classList.toggle('open');
        sidebar.classList.toggle('collapsed');
    }
    if (mainContent) {
        mainContent.classList.toggle('expanded');
    }
}

console.log('✅ Profil module initialized');
