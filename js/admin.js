// Admin Panel Logic

let allUsers = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        // Check if super admin
        if (user.email !== SUPER_ADMIN_EMAIL) {
            document.getElementById('accessDenied').classList.remove('hidden');
            return;
        }

        document.getElementById('adminContent').classList.remove('hidden');
        
        showLoading(true);
        await loadAdminData();
        showLoading(false);
    });
});

// Load admin data
async function loadAdminData() {
    try {
        // Load all users
        const usersSnapshot = await db.collection('users').get();
        allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Update stats
        updateAdminStats();
        
        // Render users table
        renderUsersTable(allUsers);

        // Load settings
        loadAppSettings();

        // Load default CP
        renderDefaultCPList();

    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Gagal memuat data admin', 'error');
    }
}

// Update admin statistics
function updateAdminStats() {
    document.getElementById('statTotalUsers').textContent = allUsers.length;
    
    const premiumUsers = allUsers.filter(u => 
        u.subscription?.type === 'premium' || u.subscription?.type === 'school'
    );
    document.getElementById('statPremiumUsers').textContent = premiumUsers.length;

    // Active today (login within 24 hours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = allUsers.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin = u.lastLoginAt.toDate ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
        return lastLogin >= today;
    });
    document.getElementById('statActiveToday').textContent = activeToday.length;

    const schoolPackages = allUsers.filter(u => u.subscription?.type === 'school');
    document.getElementById('statSchoolPackages').textContent = schoolPackages.length;
}

// Show admin tab
function showAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active', 'border-primary-600', 'text-primary-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    event.target.closest('.admin-tab').classList.add('active', 'border-primary-600', 'text-primary-600');
    event.target.closest('.admin-tab').classList.remove('border-transparent', 'text-gray-500');

    // Show tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

// Render users table
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Tidak ada data pengguna</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => {
        const subType = user.subscription?.type || 'free';
        const endDate = user.subscription?.endDate;
        const endDateStr = endDate ? 
            (endDate.toDate ? formatShortDate(endDate.toDate()) : formatShortDate(endDate)) : '-';
        
        const statusBadge = {
            'free': '<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Free</span>',
            'premium': '<span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Premium</span>',
            'school': '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Sekolah</span>'
        };

        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">${user.email}</td>
                <td class="px-4 py-3 text-sm font-medium">${user.displayName || '-'}</td>
                <td class="px-4 py-3 text-sm">${user.schoolName || '-'}</td>
                <td class="px-4 py-3 text-center">${statusBadge[subType]}</td>
                <td class="px-4 py-3 text-sm text-center">${endDateStr}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="showSetPremiumModal('${user.id}', '${user.email}')" 
                        class="text-primary-600 hover:text-primary-700 text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search users
function searchUsers() {
    const query = document.getElementById('searchUser').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.email.toLowerCase().includes(query) ||
        (u.displayName || '').toLowerCase().includes(query) ||
        (u.schoolName || '').toLowerCase().includes(query)
    );
    renderUsersTable(filtered);
}

// Show set premium modal
function showSetPremiumModal(userId, email) {
    document.getElementById('premiumUserId').value = userId;
    document.getElementById('premiumUserEmail').value = email;
    
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        document.getElementById('premiumType').value = user.subscription?.type || 'free';
        
        if (user.subscription?.endDate) {
            const endDate = user.subscription.endDate.toDate ? 
                user.subscription.endDate.toDate() : new Date(user.subscription.endDate);
            document.getElementById('premiumEndDate').value = formatDateForInput(endDate);
        } else {
            // Default to 1 year from now
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            document.getElementById('premiumEndDate').value = formatDateForInput(nextYear);
        }
    }
    
    showModal('setPremiumModal');
}

// Set premium form handler
document.getElementById('setPremiumForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
        const userId = document.getElementById('premiumUserId').value;
        const type = document.getElementById('premiumType').value;
        const endDate = document.getElementById('premiumEndDate').value;

        await db.collection('users').doc(userId).update({
            'subscription.type': type,
            'subscription.endDate': type !== 'free' ? new Date(endDate) : null,
            'subscription.isActive': type !== 'free',
            'subscription.startDate': type !== 'free' ? firebase.firestore.FieldValue.serverTimestamp() : null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            allUsers[userIndex].subscription = {
                type,
                endDate: type !== 'free' ? new Date(endDate) : null,
                isActive: type !== 'free'
            };
        }

        hideModal('setPremiumModal');
        renderUsersTable(allUsers);
        updateAdminStats();
        showToast('Status premium berhasil diupdate!', 'success');

    } catch (error) {
        console.error('Error updating premium status:', error);
        showToast('Gagal mengupdate status', 'error');
    }

    showLoading(false);
});

// Load app settings
async function loadAppSettings() {
    try {
        const doc = await db.collection('settings').doc('app').get();
        if (doc.exists) {
            const settings = doc.data();
            document.getElementById('settingWhatsapp').value = settings.whatsappNumber || '';
            document.getElementById('settingPremiumPrice').value = settings.premiumPrice || 99000;
            document.getElementById('settingAppVersion').value = settings.appVersion || '1.0.0';
            document.getElementById('settingMaintenance').checked = settings.maintenanceMode || false;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Settings form handler
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading(true);

    try {
        const settings = {
            whatsappNumber: document.getElementById('settingWhatsapp').value,
            premiumPrice: parseInt(document.getElementById('settingPremiumPrice').value),
            appVersion: document.getElementById('settingAppVersion').value,
            maintenanceMode: document.getElementById('settingMaintenance').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('settings').doc('app').set(settings, { merge: true });
        
        APP_SETTINGS = { ...APP_SETTINGS, ...settings };
        showToast('Pengaturan berhasil disimpan!', 'success');

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Gagal menyimpan pengaturan', 'error');
    }

    showLoading(false);
});

// Render default CP list
function renderDefaultCPList() {
    const container = document.getElementById('defaultCPList');
    
    // Group by Fase
    const grouped = groupBy(CP_DEFAULT_DATA, 'fase');
    
    container.innerHTML = Object.entries(grouped).map(([fase, items]) => `
        <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 font-semibold text-gray-700 flex items-center justify-between cursor-pointer" onclick="toggleCPGroup(this)">
                <span>${fase} (${items.length} TP)</span>
                <i class="fas fa-chevron-down transition-transform"></i>
            </div>
            <div class="hidden divide-y divide-gray-100 max-h-96 overflow-y-auto">
                ${items.map((cp, i) => `
                    <div class="p-4 text-sm">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Kelas ${cp.kelas}</span>
                            <span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">${cp.semester}</span>
                            <span class="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">${cp.elemen}</span>
                        </div>
                        <p class="text-gray-700">${cp.tujuanPembelajaran}</p>
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${(cp.dimensi || []).map(d => `
                                <span class="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">${d}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Toggle CP group
function toggleCPGroup(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
}

// Show add default CP modal
function showAddDefaultCPModal() {
    showToast('Fitur tambah CP default akan segera tersedia', 'info');
}

// Show modal
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// Hide modal
function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

console.log('Admin.js loaded successfully');