// Authentication Functions

// Check Auth State
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Verify Gmail
        if (!user.email.endsWith('@gmail.com')) {
            await auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        currentUser = user;
        await loadUserProfile();
        initializeApp();
    } else {
        window.location.href = 'index.html';
    }
});

// Load User Profile
async function loadUserProfile() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        if (doc.exists) {
            userProfile = doc.data();
        } else {
            // Create default profile
            userProfile = {
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: currentUser.email === APP_CONFIG.superAdminEmail ? 'superadmin' : 'user',
                subscription: 'free',
                subscriptionExpiry: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('users').doc(currentUser.uid).set(userProfile);
        }

        // Update UI
        updateUserUI();
        updatePremiumBadges();
        
        if (userProfile.role === 'superadmin') {
            document.getElementById('adminMenu').classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Gagal memuat profil', 'error');
    }
}

// Update User UI
function updateUserUI() {
    const photo = document.getElementById('userPhoto');
    const name = document.getElementById('userName');
    const plan = document.getElementById('userPlan');
    const upgradeBtn = document.getElementById('upgradeBtn');

    photo.src = userProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName || 'User')}&background=3b82f6&color=fff`;
    name.textContent = userProfile.displayName || userProfile.email;
    
    if (userProfile.subscription === 'premium') {
        plan.textContent = 'Premium Plan';
        plan.classList.add('text-yellow-400');
        upgradeBtn.classList.add('hidden');
    } else {
        plan.textContent = 'Free Plan';
        upgradeBtn.classList.remove('hidden');
    }
}

// Update Premium Badges
function updatePremiumBadges() {
    const isPremium = userProfile.subscription === 'premium' || userProfile.role === 'superadmin';
    
    APP_CONFIG.premiumFeatures.forEach(feature => {
        const badge = document.getElementById(`${feature}Badge`);
        if (badge) {
            badge.classList.toggle('hidden', isPremium);
        }
    });
}

// Check Premium Access
function checkPremiumAccess(feature) {
    if (userProfile.role === 'superadmin') return true;
    if (userProfile.subscription === 'premium') return true;
    if (APP_CONFIG.freeFeatures.includes(feature)) return true;
    return false;
}

// Logout
async function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        showLoading(true);
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Gagal logout', 'error');
        }
        showLoading(false);
    }
}

// Show Upgrade Modal
function showUpgradeModal() {
    const modal = `
        <div id="upgradeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('upgradeModal')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-crown text-3xl text-yellow-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800">Upgrade ke Premium</h3>
                    <p class="text-gray-600 mt-2">Dapatkan akses ke semua fitur AGSA</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>Program Semester (Promes)</span>
                    </div>
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>Modul Ajar</span>
                    </div>
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>LKPD Builder</span>
                    </div>
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>Bank Soal</span>
                    </div>
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>Jurnal & Absensi</span>
                    </div>
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-check text-green-500 mr-3"></i>
                        <span>Daftar Nilai</span>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="text-center">
                        <span class="text-3xl font-bold text-gray-800">Rp 99.000</span>
                        <span class="text-gray-600">/tahun</span>
                    </div>
                </div>

                <button onclick="contactForUpgrade()" class="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                    <i class="fab fa-whatsapp mr-2"></i>Hubungi via WhatsApp
                </button>
                
                <button onclick="closeModal('upgradeModal')" class="w-full mt-3 text-gray-500 hover:text-gray-700">
                    Nanti saja
                </button>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

// Contact for Upgrade
async function contactForUpgrade() {
    let waNumber = APP_CONFIG.defaultWANumber;
    
    try {
        const settingsDoc = await db.collection('settings').doc('general').get();
        if (settingsDoc.exists && settingsDoc.data().waNumber) {
            waNumber = settingsDoc.data().waNumber;
        }
    } catch (error) {
        console.error('Error getting settings:', error);
    }

    const message = encodeURIComponent(`Halo, saya ingin upgrade ke Premium AGSA.\n\nEmail: ${currentUser.email}\nNama: ${userProfile.displayName || '-'}`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
}