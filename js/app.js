// js/app.js
// Main Application Logic

const App = {
    currentUser: null,
    subscription: 'free',
    kurikulumData: {},
    
    // Initialize app
    init: async function() {
        Auth.checkAuth(async (user) => {
            this.currentUser = user;
            this.subscription = await Auth.checkSubscription();
            await this.loadUserData();
            this.setupUI();
            this.setupEventListeners();
        });
    },

    // Load user data
    loadUserData: async function() {
        const userData = await Auth.getCurrentUserData();
        this.userData = userData;
        return userData;
    },

    // Setup UI based on subscription
    setupUI: function() {
        // Update user info in sidebar
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userPhotoEl = document.getElementById('userPhoto');
        const subscriptionBadge = document.getElementById('subscriptionBadge');

        if (userNameEl) userNameEl.textContent = this.currentUser.displayName;
        if (userEmailEl) userEmailEl.textContent = this.currentUser.email;
        if (userPhotoEl) userPhotoEl.src = this.currentUser.photoURL || 'https://via.placeholder.com/40';
        
        if (subscriptionBadge) {
            if (this.subscription === 'premium') {
                subscriptionBadge.textContent = 'PREMIUM';
                subscriptionBadge.className = 'px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded';
            } else {
                subscriptionBadge.textContent = 'FREE';
                subscriptionBadge.className = 'px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded';
            }
        }

        // Hide premium features if free user
        if (this.subscription === 'free') {
            document.querySelectorAll('.premium-only').forEach(el => {
                el.classList.add('opacity-50', 'pointer-events-none');
                el.setAttribute('title', 'Fitur Premium - Upgrade untuk mengakses');
            });
        }

        // Show admin menu if super admin
        if (Auth.isSuperAdmin(this.currentUser.email)) {
            const adminMenu = document.getElementById('adminMenu');
            if (adminMenu) adminMenu.classList.remove('hidden');
        }
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
            });
        }
    },

    // Load CP data from CSV
    loadCPData: async function(mapel, jenjang) {
        const fileName = `cp-${mapel.toLowerCase().replace(/\s+/g, '-')}-${jenjang.toLowerCase()}.csv`;
        try {
            const response = await fetch(`data/${fileName}`);
            if (!response.ok) throw new Error('File tidak ditemukan');
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error('Error loading CP data:', error);
            return null;
        }
    },

    // Parse CSV data
    parseCSV: function(csvText) {
        const lines = csvText.split('\n');
        const data = {};
        
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].trim();
            if (!row) continue;
            
            const columns = row.split(';');
            if (columns.length < 7) continue;
            
            const fase = columns[0].trim();
            const kelas = columns[1].trim();
            const semester = columns[2].trim();
            const elemen = columns[3].trim();
            const cp = columns[4].trim();
            const tp = columns[5].trim();
            const dimensi = columns[6].trim();
            
            if (!data[kelas]) data[kelas] = {};
            if (!data[kelas][semester]) data[kelas][semester] = {};
            if (!data[kelas][semester][elemen]) {
                data[kelas][semester][elemen] = { cp: cp, tps: [] };
            }
            
            data[kelas][semester][elemen].tps.push({ tp, dimensi, fase });
        }
        
        return data;
    },

    // Load from Google Spreadsheet CSV URL
    loadFromGoogleSheet: async function(url) {
        try {
            // Convert Google Sheets URL to CSV export URL
            let csvUrl = url;
            if (url.includes('docs.google.com/spreadsheets')) {
                const sheetId = url.match(/\/d\/(.*?)\//)?.[1];
                if (sheetId) {
                    csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                }
            }
            
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Gagal mengambil data');
            const csvText = await response.text();
            return csvText;
        } catch (error) {
            console.error('Error loading from Google Sheet:', error);
            throw error;
        }
    },

    // Save document to Firestore
    saveDocument: async function(type, data) {
        const user = auth.currentUser;
        if (!user) throw new Error('User tidak login');
        
        const docRef = db.collection('users').doc(user.uid)
                        .collection('documents').doc();
        
        await docRef.set({
            type: type,
            data: data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return docRef.id;
    },

    // Get documents by type
    getDocuments: async function(type) {
        const user = auth.currentUser;
        if (!user) return [];
        
        const snapshot = await db.collection('users').doc(user.uid)
                                .collection('documents')
                                .where('type', '==', type)
                                .orderBy('createdAt', 'desc')
                                .get();
        
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Generate all documents from single input
    generateAllDocuments: function(inputData) {
        return {
            atp: this.generateATP(inputData),
            prota: this.generateProta(inputData),
            promes: this.generatePromes(inputData),
            modulAjar: this.generateModulAjar(inputData),
            kktp: this.generateKKTP(inputData)
        };
    },

    // Generate ATP
    generateATP: function(data) {
        // Implementation based on input data
        return data;
    },

    // Generate Prota
    generateProta: function(data) {
        return data;
    },

    // Generate Promes
    generatePromes: function(data) {
        return data;
    },

    // Generate Modul Ajar
    generateModulAjar: function(data) {
        return data;
    },

    // Generate KKTP
    generateKKTP: function(data) {
        return data;
    },

    // Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('animate-fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Show loading overlay
    showLoading: function(message = 'Memuat...') {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex flex-col items-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-700">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // Hide loading overlay
    hideLoading: function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    },

    // Format WhatsApp link
    getWhatsAppLink: async function() {
        const settingsDoc = await db.collection('settings').doc('general').get();
        const waNumber = settingsDoc.exists ? settingsDoc.data().whatsappNumber : '6281234567890';
        return `https://wa.me/${waNumber}?text=Halo, saya ingin upgrade ke Premium ADMIN GURU SUPER APP`;
    }
};

window.App = App;
