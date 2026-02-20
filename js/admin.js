// Super Admin Functions

// Load Admin Data
async function loadAdminData() {
    if (userProfile.role !== 'superadmin') {
        showToast('Akses ditolak', 'error');
        showSection('dashboard');
        return;
    }

    try {
        // Load settings
        const settingsDoc = await db.collection('settings').doc('general').get();
        if (settingsDoc.exists) {
            document.getElementById('adminWA').value = settingsDoc.data().waNumber || '';
        }

        // Load users
        const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').get();
        
        let totalUsers = 0;
        let premiumUsers = 0;
        const usersData = [];
        
        usersSnap.forEach(doc => {
            const data = doc.data();
            totalUsers++;
            if (data.subscription === 'premium') premiumUsers++;
            usersData.push({ id: doc.id, ...data });
        });

        document.getElementById('adminStatUsers').textContent = totalUsers;
        document.getElementById('adminStatPremium').textContent = premiumUsers;

        // Render users table
        const tbody = document.getElementById('tableUsers');
        tbody.innerHTML = usersData.map(user => `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${user.email}</td>
                <td class="px-4 py-3">${user.displayName || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${user.subscription === 'premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}">
                        ${user.subscription === 'premium' ? 'Premium' : 'Free'}
                    </span>
                    ${user.role === 'superadmin' ? '<span class="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Admin</span>' : ''}
                </td>
                <td class="px-4 py-3 text-center text-sm">${user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                <td class="px-4 py-3 text-center">
                    ${user.role !== 'superadmin' ? `
                        <button onclick="toggleUserPremium('${user.id}', '${user.subscription}')" 
                            class="text-sm px-3 py-1 rounded ${user.subscription === 'premium' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}">
                            ${user.subscription === 'premium' ? 'Revoke Premium' : 'Set Premium'}
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Gagal memuat data admin', 'error');
    }
}

// Save Admin Settings
async function saveAdminSettings() {
    showLoading(true);
    try {
        await db.collection('settings').doc('general').set({
            waNumber: document.getElementById('adminWA').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.uid
        }, { merge: true });

        showToast('Pengaturan berhasil disimpan', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Gagal menyimpan pengaturan', 'error');
    }
    showLoading(false);
}

// Toggle User Premium
async function toggleUserPremium(userId, currentStatus) {
    const newStatus = currentStatus === 'premium' ? 'free' : 'premium';
    const action = newStatus === 'premium' ? 'upgrade ke Premium' : 'downgrade ke Free';
    
    if (!confirm(`Apakah Anda yakin ingin ${action} user ini?`)) return;

    showLoading(true);
    try {
        const updateData = {
            subscription: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.uid
        };

        if (newStatus === 'premium') {
            // Set expiry 1 year from now
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            updateData.subscriptionExpiry = firebase.firestore.Timestamp.fromDate(expiry);
        } else {
            updateData.subscriptionExpiry = null;
        }

        await db.collection('users').doc(userId).update(updateData);

        showToast(`User berhasil di-${action}`, 'success');
        loadAdminData();
    } catch (error) {
        console.error('Error toggling premium:', error);
        showToast('Gagal mengubah status user', 'error');
    }
    showLoading(false);
}