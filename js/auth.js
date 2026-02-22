// Authentication Module - FIXED VERSION

// Global variables
let currentUser = null;
let userProfile = null;

// Show login modal
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Hide login modal
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        showLoading(true);
        
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Check if it's Gmail
        if (!isGmail(user.email)) {
            await auth.signOut();
            showLoading(false);
            showToast('Hanya akun Gmail yang dapat digunakan untuk login', 'error');
            return;
        }

        currentUser = user;
        hideLoginModal();
        showToast('Login berhasil! Selamat datang.', 'success');
        
        // Redirect to app
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 500);

    } catch (error) {
        showLoading(false);
        console.error('Login error:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('Login dibatalkan', 'warning');
        } else if (error.code === 'auth/popup-blocked') {
            showToast('Popup diblokir. Silakan izinkan popup untuk situs ini.', 'error');
        } else {
            showToast('Gagal login: ' + error.message, 'error');
        }
    }
}

// Check auth state (for index page)
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        showLoading(false);
        
        if (user) {
            currentUser = user;
            
            // If on landing page, redirect to app
            const path = window.location.pathname;
            if (path.endsWith('index.html') || path === '/' || path === '' || path.endsWith('/')) {
                window.location.href = 'app.html';
            }
        } else {
            currentUser = null;
            userProfile = null;
        }
    });
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        userProfile = null;
        showToast('Berhasil logout', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Gagal logout: ' + error.message, 'error');
    }
}

// Check if user is premium
function isPremium() {
    if (!userProfile) return false;
    if (isSuperAdmin()) return true;
    
    const sub = userProfile.subscription;
    if (!sub || sub.type === 'free') return false;
    
    if (sub.endDate) {
        let endDate;
        try {
            if (sub.endDate.toDate) {
                endDate = sub.endDate.toDate();
            } else {
                endDate = new Date(sub.endDate);
            }
            return new Date() < endDate;
        } catch (e) {
            return sub.isActive || false;
        }
    }
    
    return sub.isActive || false;
}

// Check if super admin
function isSuperAdmin() {
    if (!currentUser) return false;
    const adminEmail = typeof SUPER_ADMIN_EMAIL !== 'undefined' ? SUPER_ADMIN_EMAIL : 'afifaro@gmail.com';
    return currentUser.email === adminEmail;
}

// Redirect to WhatsApp for upgrade
function redirectToWhatsApp() {
    const email = currentUser ? currentUser.email : '';
    const whatsappNumber = typeof APP_SETTINGS !== 'undefined' ? APP_SETTINGS.whatsappNumber : '6281234567890';
    const message = encodeURIComponent('Halo, saya ingin upgrade ke AGSA Premium. Email: ' + email);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Update user profile
async function updateUserProfile(data) {
    if (!currentUser) {
        throw new Error('User not logged in');
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local profile
        if (userProfile) {
            userProfile = { ...userProfile, ...data };
        }
        
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

console.log('Auth.js loaded successfully');
