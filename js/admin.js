// Admin Panel Functions

let adminUser = null;
let allUsers = [];

// Check Admin Access
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        console.log('No user, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Check if super admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            console.log('User document not found');
            window.location.href = 'app.html';
            return;
        }
        
        const userData = userDoc.data();
        
        if (userData.role !== 'super_admin') {
            console.log('Not super admin, redirecting');
            window.location.href = 'app.html';
            return;
        }
        
        adminUser = user;
        initAdmin();
    } catch (error) {
        console.error('Error checking admin access:', error);
        hideLoading();
        showAlert('Terjadi kesalahan: ' + error.message, 'error');
    }
});

async function initAdmin() {
    try {
        hideLoading();
        await loadAllUsers();
        await loadSettings();
        updateStats();
        loadRecentActivity();
    } catch (error) {
        console.error('Error initializing admin:', error);
        showAlert('Gagal memuat data admin', 'error');
    }
}

// Load All Users
async function loadAllUsers() {
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        renderUsersTable(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Gagal memuat data user', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Belum ada user</td></tr>`;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        let createdAt = '-';
        if (user.createdAt) {
            try {
                const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                createdAt = date.toLocaleDateString('id-ID');
            } catch (e) {
                createdAt = '-';
            }
        }
        
        const statusBadge = user.subscription === 'premium' 
            ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">PREMIUM</span>'
            : '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">FREE</span>';
        
        const avatarUrl = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=3b82f6&color=fff`;
        
        const schoolName = user.profile?.school?.name || '-';
        const roleLabel = user.role === 'super_admin' ? '👑 Super Admin' : '👤 User';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${avatarUrl}" class="w-10 h-10 rounded-full" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
                        <div>
                            <p class="font-medium text-gray-800">${user.name || 'Tanpa Nama'}</p>
                            <p class="text-xs text-gray-500">${roleLabel}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${schoolName}</td>
                <td class="px-6 py-4 text-center">${statusBadge}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-500">${createdAt}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${user.subscription !== 'premium' ? `
                            <button onclick="quickUpgrade('${user.id}')" class="text-yellow-500 hover:text-yellow-700 text-xl" title="Upgrade ke Premium">⭐</button>
                        ` : `
                            <button onclick="downgradeUser('${user.id}')" class="text-gray-400 hover:text-gray-600 text-xl" title="Downgrade ke Free">⬇️</button>
                        `}
                        ${user.role !== 'super_admin' ? `
                            <button onclick="deleteUser('${user.id}')" class="text-red-500 hover:text-red-700 text-xl" title="Hapus User">🗑️</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    const total = allUsers.length;
    const premium = allUsers.filter(u => u.subscription === 'premium').length;
    const free = total - premium;
    
    // New users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsers = allUsers.filter(u => {
        if (!u.createdAt) return false;
        try {
            const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
            return date >= startOfMonth;
        } catch (e) {
            return false;
        }
    }).length;
    
    const els = {
        'statTotalUsers': total,
        'statPremiumUsers': premium,
        'statFreeUsers': free,
        'statNewUsers': newUsers
    };
    
    Object.entries(els).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const recent = allUsers.slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Belum ada aktivitas</p>';
        return;
    }
    
    container.innerHTML = recent.map(user => {
        let timeStr = '-';
        const timestamp = user.lastLogin || user.createdAt;
        
        if (timestamp) {
            try {
                const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                timeStr = date.toLocaleString('id-ID');
            } catch (e) {
                timeStr = '-';
            }
        }
        
        const avatarUrl = user.photoURL || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=3b82f6&color=fff`;
        
        const statusClass = user.subscription === 'premium' 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-gray-200 text-gray-600';
        
        const statusText = user.subscription === 'premium' ? 'PRO' : 'FREE';
        const activityType = user.lastLogin ? 'Login terakhir' : 'Terdaftar';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                    <img src="${avatarUrl}" class="w-8 h-8 rounded-full" onerror="this.src='https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff'">
                    <div>
                        <p class="font-medium text-sm">${user.name || user.email || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">${activityType}: ${timeStr}</p>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

// Search & Filter
function searchUsers() {
    const query = (document.getElementById('searchUser')?.value || '').toLowerCase();
    const filtered = allUsers.filter(u => 
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.profile?.school?.name || '').toLowerCase().includes(query)
    );
    renderUsersTable(filtered);
}

function filterUsers() {
    const filter = document.getElementById('filterSubscription')?.value || '';
    let filtered = allUsers;
    
    if (filter) {
        filtered = allUsers.filter(u => u.subscription === filter);
    }
    
    renderUsersTable(filtered);
}

// User Management
async function quickUpgrade(userId) {
    if (!confirm('Upgrade user ini ke Premium (30 hari)?')) return;
    
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
        updateStats();
        hideLoading();
        showAlert('User berhasil di-upgrade!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error upgrading user:', error);
        showAlert('Gagal upgrade: ' + error.message, 'error');
    }
}

async function upgradeUser() {
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
        
        const upgradeEmailEl = document.getElementById('upgradeEmail');
        if (upgradeEmailEl) upgradeEmailEl.value = '';
        
        await loadAllUsers();
        updateStats();
        hideLoading();
        showAlert(`User ${email} berhasil di-upgrade ke Premium!`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Error upgrading user:', error);
        showAlert('Gagal upgrade: ' + error.message, 'error');
    }
}

async function upgradeSchool() {
    const schoolName = (document.getElementById('schoolName')?.value || '').trim();
    const duration = document.getElementById('schoolDuration')?.value || '365';
    
    if (!schoolName) {
        showAlert('Masukkan nama sekolah', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        // Find users with matching school name
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
        
        // Update each user
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
        
        const schoolNameEl = document.getElementById('schoolName');
        if (schoolNameEl) schoolNameEl.value = '';
        
        await loadAllUsers();
        updateStats();
        hideLoading();
        showAlert(`${matchingUsers.length} guru dari ${schoolName} berhasil di-upgrade!`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Error upgrading school:', error);
        showAlert('Gagal upgrade sekolah: ' + error.message, 'error');
    }
}

async function downgradeUser(userId) {
    if (!confirm('Turunkan user ini ke Free?')) return;
    
    showLoading();
    try {
        await db.collection('users').doc(userId).update({
            subscription: 'free',
            subscriptionExpiry: null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAllUsers();
        updateStats();
        hideLoading();
        showAlert('User berhasil di-downgrade', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error downgrading user:', error);
        showAlert('Gagal downgrade: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('HAPUS user ini? Aksi ini tidak dapat dibatalkan!')) return;
    if (!confirm('Anda yakin? Semua data user akan hilang!')) return;
    
    showLoading();
    try {
        // Delete user document
        await db.collection('users').doc(userId).delete();
        
        // Try to delete related collections (silently fail if not exists)
        try {
            await db.collection('calendars').doc(userId).delete();
        } catch (e) {}
        
        try {
            await db.collection('schedules').doc(userId).delete();
        } catch (e) {}
        
        await loadAllUsers();
        updateStats();
        hideLoading();
        showAlert('User berhasil dihapus', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting user:', error);
        showAlert('Gagal menghapus: ' + error.message, 'error');
    }
}

// Settings
async function loadSettings() {
    try {
        const doc = await db.collection('settings').doc('app').get();
        if (doc.exists) {
            const data = doc.data();
            const waEl = document.getElementById('settingWhatsApp');
            const msgEl = document.getElementById('settingWAMessage');
            
            if (waEl) waEl.value = data.whatsappNumber || '';
            if (msgEl) msgEl.value = data.whatsappMessage || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    showLoading();
    
    try {
        const whatsappNumber = (document.getElementById('settingWhatsApp')?.value || '').trim();
        const whatsappMessage = (document.getElementById('settingWAMessage')?.value || '').trim();
        
        await db.collection('settings').doc('app').set({
            whatsappNumber: whatsappNumber,
            whatsappMessage: whatsappMessage,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: adminUser.uid
        }, { merge: true });
        
        hideLoading();
        showAlert('Pengaturan berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error saving settings:', error);
        showAlert('Gagal menyimpan: ' + error.message, 'error');
    }
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
    
    // Update nav active state
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('bg-gray-800');
    });
}

// Logout
async function adminLogout() {
    showLoading();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        hideLoading();
        showAlert('Gagal keluar: ' + error.message, 'error');
    }
}

console.log('Admin Module Loaded');
