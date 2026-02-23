// ============================================
// ADMIN PANEL - AGSA
// ============================================

let adminUser = null;
let adminUserData = null;
let allUsers = [];

// Auth State Listener for Admin
auth.onAuthStateChanged(async (user) => {
    updateStatus('Memeriksa autentikasi...');
    
    if (!user) {
        updateStatus('Tidak ada sesi login');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    adminUser = user;
    updateStatus('Memverifikasi hak akses...');
    
    try {
        await checkAdminAccess();
    } catch (error) {
        console.error('Admin access error:', error);
        showAccessDenied();
    }
});

function updateStatus(text) {
    const el = document.getElementById('loadingStatus');
    if (el) el.textContent = text;
}

async function checkAdminAccess() {
    const userDoc = await db.collection('users').doc(adminUser.uid).get();
    
    if (!userDoc.exists) {
        // Create super admin doc if email matches
        if (adminUser.email === APP_CONFIG.superAdminEmail) {
            updateStatus('Membuat akun Super Admin...');
            await createSuperAdminDocument();
            adminUserData = (await db.collection('users').doc(adminUser.uid).get()).data();
        } else {
            showAccessDenied();
            return;
        }
    } else {
        adminUserData = userDoc.data();
    }
    
    // Verify role
    if (adminUserData.role !== 'super_admin' && adminUser.email !== APP_CONFIG.superAdminEmail) {
        showAccessDenied();
        return;
    }
    
    // Fix role if email matches but role is wrong
    if (adminUser.email === APP_CONFIG.superAdminEmail && adminUserData.role !== 'super_admin') {
        await db.collection('users').doc(adminUser.uid).update({
            role: 'super_admin',
            subscription: 'premium'
        });
        adminUserData.role = 'super_admin';
        adminUserData.subscription = 'premium';
    }
    
    updateStatus('Memuat dashboard...');
    await initializeAdmin();
}

async function createSuperAdminDocument() {
    await db.collection('users').doc(adminUser.uid).set({
        uid: adminUser.uid,
        email: adminUser.email,
        name: adminUser.displayName || 'Super Admin',
        photoURL: adminUser.photoURL || '',
        role: 'super_admin',
        subscription: 'premium',
        subscriptionExpiry: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        profile: {
            nip: '',
            phone: '',
            subjects: [],
            school: { name: '', npsn: '', address: '', city: '', province: '', level: 'SD', headmaster: '', headmasterNip: '' }
        },
        settings: { academicYear: getCurrentAcademicYear().current, lessonDuration: 35, theme: 'light' }
    });
}

function showAccessDenied() {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('accessDenied').classList.remove('hidden');
}

async function initializeAdmin() {
    // Update admin info in sidebar
    const nameEl = document.getElementById('adminName');
    const emailEl = document.getElementById('adminEmail');
    const avatarEl = document.getElementById('adminAvatar');
    
    if (nameEl) nameEl.textContent = adminUserData.name || adminUser.displayName || 'Admin';
    if (emailEl) emailEl.textContent = adminUser.email;
    if (avatarEl) avatarEl.src = adminUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUserData.name || 'A')}&background=f59e0b&color=fff`;
    
    // Load data
    await loadAllUsers();
    await loadAdminSettings();
    
    // Show panel
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

// Load All Users
async function loadAllUsers() {
    try {
        const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        allUsers = [];
        snapshot.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));
        
        renderUsersTable(allUsers);
        updateStatistics();
        renderRecentActivity();
        renderSchoolsList();
        renderPremiumUsers();
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Gagal memuat data user', 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Tidak ada user</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const created = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('id-ID') : '-';
        const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=3b82f6&color=fff`;
        const badge = user.subscription === 'premium' 
            ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">PREMIUM</span>'
            : '<span class="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">FREE</span>';
        const role = user.role === 'super_admin' ? '👑 ' : '';
        
        return `
            <tr class="hover:bg-gray-50 border-b">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${avatar}" class="w-10 h-10 rounded-full" onerror="this.src='https://ui-avatars.com/api/?name=U'">
                        <div>
                            <p class="font-medium">${role}${user.name || 'Tanpa Nama'}</p>
                            <p class="text-xs text-gray-500">${user.profile?.nip || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.email || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${user.profile?.school?.name || '-'}</td>
                <td class="px-6 py-4 text-center">${badge}</td>
                <td class="px-6 py-4 text-center text-sm text-gray-500">${created}</td>
                <td class="px-6 py-4 text-center">
                    ${user.subscription !== 'premium' 
                        ? `<button onclick="quickUpgrade('${user.id}')" class="p-2 text-yellow-500 hover:bg-yellow-50 rounded" title="Upgrade">⭐</button>`
                        : `<button onclick="downgradeUser('${user.id}')" class="p-2 text-gray-400 hover:bg-gray-100 rounded" title="Downgrade">⬇️</button>`
                    }
                    ${user.role !== 'super_admin' 
                        ? `<button onclick="deleteUser('${user.id}')" class="p-2 text-red-500 hover:bg-red-50 rounded" title="Hapus">🗑️</button>`
                        : ''
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function updateStatistics() {
    const total = allUsers.length;
    const premium = allUsers.filter(u => u.subscription === 'premium').length;
    const free = total - premium;
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsers = allUsers.filter(u => {
        if (!u.createdAt) return false;
        const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        return d >= startOfMonth;
    }).length;
    
    document.getElementById('statTotalUsers').textContent = total;
    document.getElementById('statPremiumUsers').textContent = premium;
    document.getElementById('statFreeUsers').textContent = free;
    document.getElementById('statNewUsers').textContent = newUsers;
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const recent = allUsers.slice(0, 10);
    if (!recent.length) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada aktivitas</p>';
        return;
    }
    
    container.innerHTML = recent.map(user => {
        const time = (user.lastLogin || user.createdAt)?.toDate?.()?.toLocaleString('id-ID') || '-';
        const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&size=32`;
        const badge = user.subscription === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                    <img src="${avatar}" class="w-8 h-8 rounded-full">
                    <div>
                        <p class="font-medium text-sm">${user.name || user.email}</p>
                        <p class="text-xs text-gray-500">${time}</p>
                    </div>
                </div>
                <span class="text-xs px-2 py-1 rounded ${badge}">${user.subscription === 'premium' ? 'PRO' : 'FREE'}</span>
            </div>
        `;
    }).join('');
}

function renderSchoolsList() {
    const container = document.getElementById('schoolsList');
    if (!container) return;
    
    const schools = {};
    allUsers.forEach(u => {
        const name = u.profile?.school?.name;
        if (name) {
            if (!schools[name]) schools[name] = { total: 0, premium: 0 };
            schools[name].total++;
            if (u.subscription === 'premium') schools[name].premium++;
        }
    });
    
    const list = Object.entries(schools).sort((a, b) => b[1].total - a[1].total).slice(0, 15);
    
    if (!list.length) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada sekolah</p>';
        return;
    }
    
    container.innerHTML = list.map(([name, data]) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p class="font-medium text-sm">${name}</p>
                <p class="text-xs text-gray-500">${data.total} guru</p>
            </div>
            <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">${data.premium} premium</span>
        </div>
    `).join('');
}

function renderPremiumUsers() {
    const tbody = document.getElementById('premiumUsersTable');
    if (!tbody) return;
    
    const premium = allUsers.filter(u => u.subscription === 'premium');
    
    if (!premium.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Belum ada user premium</td></tr>';
        return;
    }
    
    tbody.innerHTML = premium.map(user => {
        const expiry = user.subscriptionExpiry?.toDate?.()?.toLocaleDateString('id-ID') || 'Unlimited';
        return `
            <tr class="hover:bg-yellow-50 border-b">
                <td class="px-4 py-3 text-sm">${user.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.email}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${user.profile?.school?.name || '-'}</td>
                <td class="px-4 py-3 text-sm text-center">${expiry}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="downgradeUser('${user.id}')" class="text-sm text-red-500 hover:underline">Downgrade</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search & Filter
function searchUsers() {
    const q = (document.getElementById('searchUser')?.value || '').toLowerCase();
    const f = document.getElementById('filterSubscription')?.value || '';
    
    const filtered = allUsers.filter(u => {
        const matchSearch = !q || 
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.profile?.school?.name || '').toLowerCase().includes(q);
        const matchFilter = !f || u.subscription === f;
        return matchSearch && matchFilter;
    });
    
    renderUsersTable(filtered);
}

function filterUsers() { searchUsers(); }

// User Management
async function quickUpgrade(userId) {
    if (!confirm('Upgrade user ini ke Premium (30 hari)?')) return;
    
    showLoading();
    try {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        
        await db.collection('users').doc(userId).update({
            subscription: 'premium',
            subscriptionExpiry: firebase.firestore.Timestamp.fromDate(expiry),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadAllUsers();
        hideLoading();
        showAlert('User berhasil di-upgrade!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

async function upgradeUserByEmail() {
    const email = (document.getElementById('upgradeEmail')?.value || '').trim();
    const duration = document.getElementById('upgradeDuration')?.value || '30';
    
    if (!email) return showAlert('Masukkan email', 'warning');
    
    showLoading();
    try {
        const snap = await db.collection('users').where('email', '==', email).get();
        if (snap.empty) {
            hideLoading();
            return showAlert('User tidak ditemukan', 'error');
        }
        
        let expiry = null;
        if (duration !== 'unlimited') {
            expiry = new Date();
            expiry.setDate(expiry.getDate() + parseInt(duration));
        }
        
        await db.collection('users').doc(snap.docs[0].id).update({
            subscription: 'premium',
            subscriptionExpiry: expiry ? firebase.firestore.Timestamp.fromDate(expiry) : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('upgradeEmail').value = '';
        await loadAllUsers();
        hideLoading();
        showAlert(`${email} berhasil di-upgrade!`, 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

async function upgradeSchool() {
    const name = (document.getElementById('upgradeSchoolName')?.value || '').trim();
    const duration = document.getElementById('upgradeSchoolDuration')?.value || '365';
    
    if (!name) return showAlert('Masukkan nama sekolah', 'warning');
    
    showLoading();
    try {
        const matched = allUsers.filter(u => 
            (u.profile?.school?.name || '').toLowerCase() === name.toLowerCase()
        );
        
        if (!matched.length) {
            hideLoading();
            return showAlert('Tidak ada user dari sekolah tersebut', 'error');
        }
        
        let expiry = null;
        if (duration !== 'unlimited') {
            expiry = new Date();
            expiry.setDate(expiry.getDate() + parseInt(duration));
        }
        
        const batch = db.batch();
        matched.forEach(u => {
            batch.update(db.collection('users').doc(u.id), {
                subscription: 'premium',
                subscriptionExpiry: expiry ? firebase.firestore.Timestamp.fromDate(expiry) : null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        
        document.getElementById('upgradeSchoolName').value = '';
        await loadAllUsers();
        hideLoading();
        showAlert(`${matched.length} guru dari "${name}" berhasil di-upgrade!`, 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

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
        showAlert('User di-downgrade ke FREE', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!confirm(`Hapus user "${user?.name || user?.email}"? Data akan hilang permanen!`)) return;
    if (!confirm('KONFIRMASI: Yakin hapus?')) return;
    
    showLoading();
    try {
        await db.collection('users').doc(userId).delete();
        try { await db.collection('calendars').doc(userId).delete(); } catch(e) {}
        try { await db.collection('schedules').doc(userId).delete(); } catch(e) {}
        
        await loadAllUsers();
        hideLoading();
        showAlert('User dihapus', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

// Settings
async function loadAdminSettings() {
    try {
        const doc = await db.collection('settings').doc('app').get();
        if (doc.exists) {
            const d = doc.data();
            const wa = document.getElementById('settingWhatsApp');
            const msg = document.getElementById('settingWAMessage');
            const pm = document.getElementById('settingPriceMonth');
            const py = document.getElementById('settingPriceYear');
            
            if (wa) wa.value = d.whatsappNumber || '';
            if (msg) msg.value = d.whatsappMessage || '';
            if (pm) pm.value = d.priceMonth || '';
            if (py) py.value = d.priceYear || '';
        }
    } catch (e) { console.error('Load settings error:', e); }
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
        showAlert('Pengaturan disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal: ' + error.message, 'error');
    }
}

// Navigation
function showAdminSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`admin-${sectionId}`)?.classList.remove('hidden');
    
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active', 'bg-yellow-600');
        if (link.dataset.section === sectionId) link.classList.add('active', 'bg-yellow-600');
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
        showAlert('Gagal keluar', 'error');
    }
}

console.log('Admin Module Loaded');
