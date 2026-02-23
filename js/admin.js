// Admin Panel Functions

let adminUser = null;
let adminUserData = null;
let allUsers = [];
let filteredUsers = [];

// Firebase Config (inline untuk admin)
const firebaseConfig = {
    apiKey: "AIzaSyDe4ie2wSPEpNbAgWP-q03vTuHyxc9Jj3E",
    authDomain: "agsa-e5b08.firebaseapp.com",
    projectId: "agsa-e5b08",
    storageBucket: "agsa-e5b08.firebasestorage.app",
    messagingSenderId: "916052746331",
    appId: "1:916052746331:web:357cbadbfd8658f1689f7e",
};

const SUPER_ADMIN_EMAIL = 'afifaro@gmail.com';

// Update loading status
function updateLoadingStatus(text) {
    const el = document.getElementById('loadingStatus');
    if (el) el.textContent = text;
}

// Check Admin Access on Load
document.addEventListener('DOMContentLoaded', function() {
    updateLoadingStatus('Memeriksa autentikasi...');
    
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            updateLoadingStatus('Tidak ada sesi login...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }
        
        adminUser = user;
        updateLoadingStatus('Memeriksa hak akses...');
        
        try {
            // Check if user document exists
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create user document if not exists
                if (user.email === SUPER_ADMIN_EMAIL) {
                    updateLoadingStatus('Membuat akun Super Admin...');
                    await createSuperAdminDoc(user);
                    adminUserData = (await db.collection('users').doc(user.uid).get()).data();
                } else {
                    showAccessDenied();
                    return;
                }
            } else {
                adminUserData = userDoc.data();
            }
            
            // Check if super admin
            if (adminUserData.role !== 'super_admin' && user.email !== SUPER_ADMIN_EMAIL) {
                // Maybe role not set, check email
                if (user.email === SUPER_ADMIN_EMAIL) {
                    // Update to super admin
                    await db.collection('users').doc(user.uid).update({
                        role: 'super_admin',
                        subscription: 'premium'
                    });
                    adminUserData.role = 'super_admin';
                    adminUserData.subscription = 'premium';
                } else {
                    showAccessDenied();
                    return;
                }
            }
            
            // All good, initialize admin
            updateLoadingStatus('Memuat dashboard...');
            await initAdmin();
            
        } catch (error) {
            console.error('Error checking admin access:', error);
            updateLoadingStatus('Error: ' + error.message);
            
            // If error and email matches, try to continue
            if (user.email === SUPER_ADMIN_EMAIL) {
                try {
                    await createSuperAdminDoc(user);
                    await initAdmin();
                } catch (e) {
                    showAccessDenied();
                }
            } else {
                showAccessDenied();
            }
        }
    });
});

// Create Super Admin Document
async function createSuperAdminDoc(user) {
    const adminData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Super Admin',
        photoURL: user.photoURL || '',
        role: 'super_admin',
        subscription: 'premium',
        subscriptionExpiry: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        profile: {
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
        },
        settings: {
            academicYear: '2024/2025',
            lessonDuration: 35,
            theme: 'light'
        }
    };
    
    await db.collection('users').doc(user.uid).set(adminData);
}

// Show Access Denied
function showAccessDenied() {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('accessDenied').classList.remove('hidden');
}

// Initialize Admin Panel
async function initAdmin() {
    // Update admin info
    document.getElementById('adminName').textContent = adminUserData.name || adminUser.displayName || 'Admin';
    document.getElementById('adminEmail').textContent = adminUser.email;
    
    const avatarUrl = adminUser.photoURL || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUserData.name || 'Admin')}&background=f59e0b&color=fff`;
    document.getElementById('adminAvatar').src = avatarUrl;
    
    // Load data
    await loadAllUsers();
    await loadAdminSettings();
    loadCPDataList();
    
    // Show admin panel
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

// Load All Users
async function loadAllUsers() {
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        filteredUsers = [...allUsers];
        renderUsersTable(filteredUsers);
        updateStats();
        loadRecentActivity();
        loadSchoolsList();
        loadPremiumUsersList();
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Gagal memuat data user: ' + error.message, 'error');
    }
}

// Render Users Table
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Tidak ada user ditemukan</td></tr>`;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const createdAt = formatTimestamp(user.createdAt);
        const avatarUrl = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=3b82f6&color=fff`;
        const schoolName = user.profile?.school?.name || '-';
        const roleLabel = user.role === 'super_admin' ? '👑' : '';
        
        const statusBadge = user.subscription === 'premium' 
            ? '<span class="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">PREMIUM</span>'
            : '<span class="px-3 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">FREE</span>';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${avatarUrl}" class="w-10 h-10 rounded-full" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
                        <div>
                            <p class="font-medium text-gray-800">${roleLabel} ${user.name || 'Tanpa Nama'}</p>
                            <p class="text-xs text-gray-500">${user.profile?.nip || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">${schoolName}</td>
                <td class="px-6 py-4 text-center">${statusBadge}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-500">${createdAt}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        ${user.subscription !== 'premium' ? `
                            <button onclick="quickUpgrade('${user.id}')" class="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg" title="Upgrade Premium">⭐</button>
                        ` : `
                            <button onclick="downgradeUser('${user.id}')" class="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" title="Downgrade">⬇️</button>
                        `}
                        ${user.role !== 'super_admin' ? `
                            <button onclick="deleteUser('${user.id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update Statistics
function updateStats() {
    const total = allUsers.length;
    const premium = allUsers.filter(u => u.subscription === 'premium').length;
    const free = total - premium;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsers = allUsers.filter(u => {
        if (!u.createdAt) return false;
        const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return date >= startOfMonth;
    }).length;
    
    document.getElementById('statTotalUsers').textContent = total;
    document.getElementById('statPremiumUsers').textContent = premium;
    document.getElementById('statFreeUsers').textContent = free;
    document.getElementById('statNewUsers').textContent = newUsers;
}

// Load Recent Activity
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const recent = allUsers.slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada aktivitas</p>';
        return;
    }
    
    container.innerHTML = recent.map(user => {
        const timestamp = user.lastLogin || user.createdAt;
        const timeStr = formatTimestamp(timestamp, true);
        const activityType = user.lastLogin ? 'Login' : 'Daftar';
        const avatarUrl = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=3b82f6&color=fff&size=32`;
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div class="flex items-center gap-3">
                    <img src="${avatarUrl}" class="w-8 h-8 rounded-full">
                    <div>
                        <p class="font-medium text-sm text-gray-800">${user.name || user.email}</p>
                        <p class="text-xs text-gray-500">${activityType}: ${timeStr}</p>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded ${user.subscription === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}">
                    ${user.subscription === 'premium' ? 'PRO' : 'FREE'}
                </span>
            </div>
        `;
    }).join('');
}

// Load Schools List
function loadSchoolsList() {
    const container = document.getElementById('schoolsList');
    if (!container) return;
    
    const schools = {};
    allUsers.forEach(user => {
        const schoolName = user.profile?.school?.name;
        if (schoolName) {
            if (!schools[schoolName]) {
                schools[schoolName] = { total: 0, premium: 0 };
            }
            schools[schoolName].total++;
            if (user.subscription === 'premium') {
                schools[schoolName].premium++;
            }
        }
    });
    
    const schoolList = Object.entries(schools).sort((a, b) => b[1].total - a[1].total);
    
    if (schoolList.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada sekolah terdaftar</p>';
        return;
    }
    
    container.innerHTML = schoolList.slice(0, 15).map(([name, data]) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p class="font-medium text-sm text-gray-800">${name}</p>
                <p class="text-xs text-gray-500">${data.total} guru</p>
            </div>
            <div class="text-right">
                <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">${data.premium} premium</span>
            </div>
        </div>
    `).join('');
}

// Load Premium Users List
function loadPremiumUsersList() {
    const tbody = document.getElementById('premiumUsersTable');
    if (!tbody) return;
    
    const premiumUsers = allUsers.filter(u => u.subscription === 'premium');
    
    if (premiumUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Belum ada user premium</td></tr>';
        return;
    }
    
    tbody.innerHTML = premiumUsers.map(user => {
        const expiry = user.subscriptionExpiry ? formatTimestamp(user.subscriptionExpiry) : 'Unlimited';
        return `
            <tr class="hover:bg-yellow-50">
                <td class="px-4 py-3 text-sm">${user.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.profile?.school?.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-center">${expiry}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="downgradeUser('${user.id}')" class="text-sm text-red-500 hover:text-red-700">Downgrade</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search Users
function searchUsers() {
    const query = (document.getElementById('searchUser')?.value || '').toLowerCase().trim();
    const filter = document.getElementById('filterSubscription')?.value || '';
    
    filteredUsers = allUsers.filter(u => {
        const matchesSearch = !query || 
            (u.name || '').toLowerCase().includes(query) ||
            (u.email || '').toLowerCase().includes(query) ||
            (u.profile?.school?.name || '').toLowerCase().includes(query);
        
        const matchesFilter = !filter || u.subscription === filter;
        
        return matchesSearch && matchesFilter;
    });
    
    renderUsersTable(filteredUsers);
}

function filterUsers() {
    searchUsers();
}

// Quick Upgrade
async function quickUpgrade(userId) {
    if (!confirm('Upgrade user ini ke Premium untuk 30 hari?')) return;
    
    showLoading();
    try {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        await db.collection('users').doc(userId).update({
            subscription: 'premium',
            subscriptionExpiry: firebase.firestore.Timestamp.fromDate(expiryDate),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAllUsers();
        hideLoading();
        showAlert('User berhasil di-upgrade ke Premium!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal upgrade: ' + error.message, 'error');
    }
}

// Upgrade by Email
async function upgradeUserByEmail() {
    const email = (document.getElementById('upgradeEmail')?.value || '').trim();
    const duration = document.getElementById('upgradeDuration')?.value || '30';
    
    if (!email) {
        showAlert('Masukkan email user', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const snapshot = await db.collection('users').where('email', '==', email).get();
        
        if (snapshot.empty) {
            hideLoading();
            showAlert('User dengan email tersebut tidak ditemukan', 'error');
            return;
        }
        
        const userDoc = snapshot.docs[0];
        let expiryDate = null;
        
        if (duration !== 'unlimited') {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
        }
        
        await db.collection('users').doc(userDoc.id).update({
            subscription: 'premium',
            subscriptionExpiry: expiryDate ? firebase.firestore.Timestamp.fromDate(expiryDate) : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('upgradeEmail').value = '';
        await loadAllUsers();
        hideLoading();
        
        const durationText = duration === 'unlimited' ? 'Unlimited' : `${duration} hari`;
        showAlert(`${email} berhasil di-upgrade ke Premium (${durationText})!`, 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal upgrade: ' + error.message, 'error');
    }
}

// Upgrade School
async function upgradeSchool() {
    const schoolName = (document.getElementById('upgradeSchoolName')?.value || '').trim();
    const duration = document.getElementById('upgradeSchoolDuration')?.value || '365';
    
    if (!schoolName) {
        showAlert('Masukkan nama sekolah', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const matchingUsers = allUsers.filter(u => 
            (u.profile?.school?.name || '').toLowerCase() === schoolName.toLowerCase()
        );
        
        if (matchingUsers.length === 0) {
            hideLoading();
            showAlert('Tidak ada user dari sekolah tersebut', 'error');
            return;
        }
        
        let expiryDate = null;
        if (duration !== 'unlimited') {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
        }
        
        const batch = db.batch();
        matchingUsers.forEach(user => {
            const ref = db.collection('users').doc(user.id);
            batch.update(ref, {
                subscription: 'premium',
                subscriptionExpiry: expiryDate ? firebase.firestore.Timestamp.fromDate(expiryDate) : null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        document.getElementById('upgradeSchoolName').value = '';
        await loadAllUsers();
        hideLoading();
        showAlert(`${matchingUsers.length} guru dari "${schoolName}" berhasil di-upgrade!`, 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal upgrade: ' + error.message, 'error');
    }
}

// Downgrade User
async function downgradeUser(userId) {
    if (!confirm('Turunkan user ini ke FREE?')) return;
    
    showLoading();
    try {
        await db.collection('users').doc(userId).update({
            subscription: 'free',
            subscriptionExpiry: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAllUsers();
        hideLoading();
        showAlert('User berhasil di-downgrade ke FREE', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal downgrade: ' + error.message, 'error');
    }
}

// Delete User
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    if (!confirm(`Hapus user "${user.name || user.email}"?\n\nSemua data user akan dihapus permanen!`)) return;
    if (!confirm('KONFIRMASI TERAKHIR: Yakin hapus user ini?')) return;
    
    showLoading();
    try {
        await db.collection('users').doc(userId).delete();
        
        // Try delete related data
        try { await db.collection('calendars').doc(userId).delete(); } catch(e) {}
        try { await db.collection('schedules').doc(userId).delete(); } catch(e) {}
        
        // Delete students
        const studentsSnapshot = await db.collection('students').where('userId', '==', userId).get();
        const batch = db.batch();
        studentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        
        await loadAllUsers();
        hideLoading();
        showAlert('User berhasil dihapus', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal menghapus: ' + error.message, 'error');
    }
}

// Admin Settings
async function loadAdminSettings() {
    try {
        const doc = await db.collection('settings').doc('app').get();
        if (doc.exists) {
            const data = doc.data();
            if (document.getElementById('settingWhatsApp')) {
                document.getElementById('settingWhatsApp').value = data.whatsappNumber || '';
            }
            if (document.getElementById('settingWAMessage')) {
                document.getElementById('settingWAMessage').value = data.whatsappMessage || '';
            }
            if (document.getElementById('settingPriceMonth')) {
                document.getElementById('settingPriceMonth').value = data.priceMonth || '';
            }
            if (document.getElementById('settingPriceYear')) {
                document.getElementById('settingPriceYear').value = data.priceYear || '';
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveAdminSettings() {
    showLoading();
    
    try {
        await db.collection('settings').doc('app').set({
            whatsappNumber: document.getElementById('settingWhatsApp')?.value || '',
            whatsappMessage: document.getElementById('settingWAMessage')?.value || '',
            priceMonth: document.getElementById('settingPriceMonth')?.value || '',
            priceYear: document.getElementById('settingPriceYear')?.value || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: adminUser.uid
        }, { merge: true });
        
        hideLoading();
        showAlert('Pengaturan berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal menyimpan: ' + error.message, 'error');
    }
}

// CP Data Management
function loadCPDataList() {
    const container = document.getElementById('cpDataList');
    if (!container) return;
    
    // This would normally load from Firestore or check local files
    const defaultData = [
        { name: 'PAI SD', file: 'cp-pai-sd.csv', status: 'default' },
        { name: 'PAI SMP', file: 'cp-pai-smp.csv', status: 'default' },
        { name: 'PAI SMA', file: 'cp-pai-sma.csv', status: 'default' }
    ];
    
    container.innerHTML = defaultData.map(d => `
        <div class="bg-gray-50 rounded-lg p-4 border hover:border-blue-300 transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-gray-800">${d.name}</p>
                    <p class="text-xs text-gray-500">${d.file}</p>
                </div>
                <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">${d.status}</span>
            </div>
        </div>
    `).join('');
}

async function uploadCPData() {
    const subject = document.getElementById('cpSubject')?.value?.trim();
    const level = document.getElementById('cpLevel')?.value;
    const fileInput = document.getElementById('cpFile');
    const file = fileInput?.files?.[0];
    
    if (!subject || !file) {
        showAlert('Lengkapi mata pelajaran dan pilih file', 'warning');
        return;
    }
    
    showAlert('Fitur upload ke Firestore dalam pengembangan. Untuk sementara, simpan file CSV di folder data/', 'info');
}

// Navigation
function showAdminSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    const targetSection = document.getElementById(`admin-${sectionId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active', 'bg-yellow-600');
        if (link.dataset.section === sectionId) {
            link.classList.add('active', 'bg-yellow-600');
        }
    });
}

// Logout
async function adminLogout() {
    if (!confirm('Keluar dari Admin Panel?')) return;
    
    showLoading();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        showAlert('Gagal keluar: ' + error.message, 'error');
    }
}

// Helper Functions
function formatTimestamp(timestamp, includeTime = false) {
    if (!timestamp) return '-';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (includeTime) {
            return date.toLocaleString('id-ID');
        }
        return date.toLocaleDateString('id-ID');
    } catch (e) {
        return '-';
    }
}

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const box = document.getElementById('alertBox');
    
    if (!container || !box) {
        alert(message);
        return;
    }
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    box.className = `p-4 rounded-lg shadow-lg max-w-md ${colors[type]}`;
    box.innerHTML = `<div class="flex items-center gap-3"><span>${icons[type]}</span><span>${message}</span></div>`;
    container.classList.remove('hidden');
    
    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
}

console.log('Admin Module Loaded');
