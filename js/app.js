// Main Application Logic

// Initialize App
async function initializeApp() {
    showLoading(true);
    
    // Initialize Tahun Ajaran
    initTahunAjaran();
    
    // Load initial data
    await loadProfileData();
    await loadDashboardStats();
    
    // Show dashboard
    showSection('dashboard');
    
    showLoading(false);
}

// Show Section
function showSection(sectionName, updateHistory = true) {
    // Check premium access
    if (APP_CONFIG.premiumFeatures.includes(sectionName) && !checkPremiumAccess(sectionName)) {
        showUpgradeModal();
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });

    // Show target section
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionName) {
            link.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'profil': 'Profil',
        'kalender': 'Kalender Pendidikan',
        'jadwal': 'Jadwal Pelajaran',
        'siswa': 'Data Siswa',
        'atp': 'ATP - Alur Tujuan Pembelajaran',
        'prota': 'Program Tahunan (PROTA)',
        'promes': 'Program Semester (PROMES)',
        'modul': 'Modul Ajar',
        'absensi': 'Absensi Siswa',
        'jurnal': 'Jurnal Pembelajaran',
        'nilai': 'Daftar Nilai',
        'lkpd': 'LKPD',
        'banksoal': 'Bank Soal',
        'aiassistant': 'AI Assistant',
        'panduan': 'Panduan',
        'admin': 'Panel Super Admin'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || sectionName;

    // Load section specific data
    loadSectionData(sectionName);

    // Update current section
    currentSection = sectionName;

    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768 && !sidebar.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
}

// Load Section Data
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'profil':
            loadProfileForm();
            break;
        case 'kalender':
            loadKalenderData();
            break;
        case 'jadwal':
            loadJadwalData();
            break;
        case 'siswa':
            loadSiswaData();
            break;
        case 'atp':
            loadATPData();
            break;
        case 'prota':
            generateProta();
            break;
        case 'promes':
            generatePromes();
            break;
        case 'modul':
            loadModulData();
            break;
        case 'absensi':
            initAbsensiForm();
            break;
        case 'jurnal':
            loadJurnalData();
            break;
        case 'nilai':
            initNilaiForm();
            break;
        case 'lkpd':
            loadLKPDData();
            break;
        case 'banksoal':
            loadBankSoalData();
            break;
        case 'admin':
            if (userProfile.role === 'superadmin') {
                loadAdminData();
            }
            break;
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        // Get class count from jadwal
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').get();
        
        let kelasList = new Set();
        jadwalSnap.forEach(doc => {
            const data = doc.data();
            if (data.kelas && data.rombel) {
                kelasList.add(`${data.kelas}-${data.rombel}`);
            }
        });
        document.getElementById('statKelas').textContent = kelasList.size;

        // Get student count
        const siswaSnap = await db.collection('users').doc(currentUser.uid)
            .collection('siswa').get();
        document.getElementById('statSiswa').textContent = siswaSnap.size;

        // Get modul count
        const modulSnap = await db.collection('users').doc(currentUser.uid)
            .collection('modul').get();
        document.getElementById('statModul').textContent = modulSnap.size;

        // Get soal count
        const soalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('banksoal').get();
        document.getElementById('statSoal').textContent = soalSnap.size;

        // Update status indicators
        await updateStatusIndicators();

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update Status Indicators
async function updateStatusIndicators() {
    try {
        // Check profil
        const profilDoc = await db.collection('users').doc(currentUser.uid)
            .collection('profil').doc('data').get();
        const statusProfil = document.getElementById('statusProfil');
        if (profilDoc.exists && profilDoc.data().namaGuru) {
            statusProfil.classList.remove('bg-red-500');
            statusProfil.classList.add('bg-green-500');
        }

        // Check kalender
        const kalenderSnap = await db.collection('users').doc(currentUser.uid)
            .collection('kalender').limit(1).get();
        const statusKalender = document.getElementById('statusKalender');
        if (!kalenderSnap.empty) {
            statusKalender.classList.remove('bg-red-500');
            statusKalender.classList.add('bg-green-500');
        }

        // Check jadwal
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').limit(1).get();
        const statusJadwal = document.getElementById('statusJadwal');
        if (!jadwalSnap.empty) {
            statusJadwal.classList.remove('bg-red-500');
            statusJadwal.classList.add('bg-green-500');
        }

        // Check ATP
        const atpSnap = await db.collection('users').doc(currentUser.uid)
            .collection('atp').limit(1).get();
        const statusATP = document.getElementById('statusATP');
        if (!atpSnap.empty) {
            statusATP.classList.remove('bg-red-500');
            statusATP.classList.add('bg-green-500');
        }

    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Load Profile Data (for global use)
async function loadProfileData() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid)
            .collection('profil').doc('data').get();
        
        if (doc.exists) {
            window.profilData = doc.data();
        } else {
            window.profilData = {};
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        window.profilData = {};
    }
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
});