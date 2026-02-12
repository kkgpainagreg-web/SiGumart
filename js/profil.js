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
    document.getElementById('inputName').value = data.displayName || '';
    document.getElementById('inputNip').value = data.profile?.nip || '';
    document.getElementById('inputEmail').value = data.email || '';
    document.getElementById('inputPhone').value = data.profile?.phone || '';
    document.getElementById('inputAddress').value = data.profile?.address || '';
    document.getElementById('inputEducation').value = data.profile?.education || '';
    document.getElementById('inputSpecialization').value = data.profile?.specialization || 'PAI';
    document.getElementById('inputTahunAjaran').value = data.settings?.tahunAjaran || '2024/2025';
    document.getElementById('inputSemester').value = data.settings?.semester || '2';
}

// === POPULATE SCHOOL FORM ===
function populateSchoolForm(school) {
    document.getElementById('inputSchoolName').value = school.name || '';
    document.getElementById('inputNpsn').value = school.npsn || '';
    document.getElementById('inputJenjang').value = school.jenjang || 'SD';
    document.getElementById('inputStatus').value = school.status || 'Negeri';
    document.getElementById('inputSchoolAddress').value = school.address || '';
    document.getElementById('inputKelurahan').value = school.kelurahan || '';
    document.getElementById('inputKecamatan').value = school.kecamatan || '';
    document.getElementById('inputKabupaten').value = school.kabupaten || '';
    document.getElementById('inputProvinsi').value = school.provinsi || '';
    document.getElementById('inputKodePos').value = school.kodePos || '';
    document.getElementById('inputSchoolPhone').value = school.phone || '';
    document.getElementById('inputSchoolEmail').value = school.email || '';
    document.getElementById('inputSchoolWebsite').value = school.website || '';
}

// === POPULATE PRINCIPAL FORM ===
function populatePrincipalForm(principal) {
    document.getElementById('inputPrincipalName').value = principal.name || '';
    document.getElementById('inputPrincipalNip').value = principal.nip || '';
    document.getElementById('inputPrincipalPangkat').value = principal.pangkat || '';
    document.getElementById('inputPrincipalEducation').value = principal.education || '';
    document.getElementById('inputPrincipalPhone').value = principal.phone || '';
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
    
    const data = {
        displayName: document.getElementById('inputName').value.trim(),
        profile: {
            nip: document.getElementById('inputNip').value.trim(),
            phone: document.getElementById('inputPhone').value.trim(),
            address: document.getElementById('inputAddress').value.trim(),
            education: document.getElementById('inputEducation').value,
            specialization: document.getElementById('inputSpecialization').value
        },
        settings: {
            ...currentProfileData?.settings,
            tahunAjaran: document.getElementById('inputTahunAjaran').value,
            semester: document.getElementById('inputSemester').value
        }
    };
    
    try {
        const success = await updateUserData(data);
        
        if (success) {
            // Update Firebase Auth profile
            await auth.currentUser.updateProfile({
                displayName: data.displayName
            });
            
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
    
    const school = {
        name: document.getElementById('inputSchoolName').value.trim(),
        npsn: document.getElementById('inputNpsn').value.trim(),
        jenjang: document.getElementById('inputJenjang').value,
        status: document.getElementById('inputStatus').value,
        address: document.getElementById('inputSchoolAddress').value.trim(),
        kelurahan: document.getElementById('inputKelurahan').value.trim(),
        kecamatan: document.getElementById('inputKecamatan').value.trim(),
        kabupaten: document.getElementById('inputKabupaten').value.trim(),
        provinsi: document.getElementById('inputProvinsi').value.trim(),
        kodePos: document.getElementById('inputKodePos').value.trim(),
        phone: document.getElementById('inputSchoolPhone').value.trim(),
        email: document.getElementById('inputSchoolEmail').value.trim(),
        website: document.getElementById('inputSchoolWebsite').value.trim()
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
    
    const principal = {
        name: document.getElementById('inputPrincipalName').value.trim(),
        nip: document.getElementById('inputPrincipalNip').value.trim(),
        pangkat: document.getElementById('inputPrincipalPangkat').value,
        education: document.getElementById('inputPrincipalEducation').value,
        phone: document.getElementById('inputPrincipalPhone').value.trim()
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
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab${capitalize(tab)}`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`content${capitalize(tab)}`).classList.add('active');
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
    }
}

function resetPrincipalForm() {
    if (currentProfileData?.principal) {
        populatePrincipalForm(currentProfileData.principal);
        showToast('Form direset ke data tersimpan', 'info');
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
        
    } catch (error) {
        console.error('Error uploading photo:', error);
        showToast('Gagal mengupload foto', 'error');
    }
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// === HELPER FUNCTIONS ===
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

console.log('✅ Profil module initialized');