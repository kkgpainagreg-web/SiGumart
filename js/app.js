// js/app.js
// =====================================================
// MAIN APPLICATION CONTROLLER
// =====================================================

const App = {
    currentTab: 'dashboard',

    init: async () => {
        console.log('Initializing App...');
        
        // Set user info in sidebar
        document.getElementById('user-name').textContent = Auth.userData.nama;
        document.getElementById('school-name').textContent = Auth.userData.namaSekolah;
        document.getElementById('tahun-ajaran').textContent = `TA ${Utils.getTahunAjaran()}`;

        // Setup navigation
        App.setupNavigation();
        
        // Render profil lulusan
        App.renderProfilLulusan();

        // Initialize modules
        await MasterData.init();
        await AtpKktp.init();
        await CalendarSchedule.init();
        await ProtaPromes.init();
        await ModulAjar.init();
        await BankSoal.init();

        // Load dashboard stats
        await App.loadDashboardStats();

        // Setup print button
        document.getElementById('btn-print-current').addEventListener('click', () => {
            App.printCurrentTab();
        });

        console.log('App initialized successfully');
    },

    setupNavigation: () => {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tab = link.dataset.tab;
                App.switchTab(tab);
            });
        });

        // Toggle sidebar for mobile
        document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    },

    switchTab: (tabName) => {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(`tab-${tabName}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Update nav styling
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-gray-700');
            if (link.dataset.tab === tabName) {
                link.classList.add('bg-gray-700');
            }
        });

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'master-data': 'Master Data & Capaian Pembelajaran',
            'atp': 'Alur Tujuan Pembelajaran (ATP)',
            'kktp': 'Kriteria Ketercapaian Tujuan Pembelajaran',
            'calendar': 'Kalender Pendidikan',
            'schedule': 'Jadwal Pelajaran',
            'prota': 'Program Tahunan (Prota)',
            'promes': 'Program Semester (Promes)',
            'modul': 'Modul Ajar',
            'bank-soal': 'Bank Soal'
        };
        document.getElementById('page-title').textContent = titles[tabName] || tabName;
        
        App.currentTab = tabName;
    },

    renderProfilLulusan: () => {
        const container = document.getElementById('profil-lulusan-grid');
        container.innerHTML = PROFIL_LULUSAN.map(profil => `
            <div class="p-4 bg-gradient-to-br from-${App.getProfilColor(profil.id)}-50 to-${App.getProfilColor(profil.id)}-100 rounded-lg border border-${App.getProfilColor(profil.id)}-200">
                <h4 class="font-semibold text-${App.getProfilColor(profil.id)}-800">${profil.nama}</h4>
                <p class="text-sm text-${App.getProfilColor(profil.id)}-600 mt-1">${profil.deskripsi}</p>
            </div>
        `).join('');
    },

    getProfilColor: (id) => {
        const colors = {
            'keimanan': 'purple',
            'kewargaan': 'red',
            'penalaran': 'blue',
            'kreativitas': 'yellow',
            'kolaborasi': 'green',
            'kemandirian': 'indigo',
            'kesehatan': 'pink',
            'komunikasi': 'orange'
        };
        return colors[id] || 'gray';
    },

    loadDashboardStats: async () => {
        try {
            const userId = Auth.currentUser.uid;
            const npsn = Auth.userData.npsn;

            // Count CP
            const cpSnap = await db.collection(COLLECTIONS.CP_DATA)
                .where('userId', '==', userId)
                .get();
            document.getElementById('stat-cp').textContent = cpSnap.size;

            // Count ATP
            const atpSnap = await db.collection(COLLECTIONS.ATP)
                .where('userId', '==', userId)
                .get();
            document.getElementById('stat-atp').textContent = atpSnap.size;

            // Count Modul
            const modulSnap = await db.collection(COLLECTIONS.MODUL_AJAR)
                .where('userId', '==', userId)
                .get();
            document.getElementById('stat-modul').textContent = modulSnap.size;

            // Count Soal
            const soalSnap = await db.collection(COLLECTIONS.BANK_SOAL)
                .where('userId', '==', userId)
                .get();
            document.getElementById('stat-soal').textContent = soalSnap.size;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    printCurrentTab: () => {
        const tabId = `tab-${App.currentTab}`;
        const titles = {
            'dashboard': 'Dashboard',
            'master-data': 'Master Data CP',
            'atp': 'Alur Tujuan Pembelajaran',
            'kktp': 'KKTP',
            'calendar': 'Kalender Pendidikan',
            'schedule': 'Jadwal Pelajaran',
            'prota': 'Program Tahunan',
            'promes': 'Program Semester',
            'modul': 'Modul Ajar',
            'bank-soal': 'Bank Soal'
        };
        Utils.printDocument(tabId, titles[App.currentTab] || 'Dokumen');
    }
};