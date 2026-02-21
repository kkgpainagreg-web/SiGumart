// Authentication Module

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

        // Check if user exists, if not create profile
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create new user profile
            await createUserProfile(user);
        }

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

// Create user profile
async function createUserProfile(user) {
    const academicYears = getAvailableAcademicYears();
    
    const profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        nip: '',
        phone: '',
        
        // School info
        schoolName: '',
        schoolAddress: '',
        schoolCity: '',
        schoolProvince: '',
        principalName: '',
        
        // Teaching info
        subjects: [], // Array of subjects with jam per week
        
        // Subscription
        subscription: {
            type: 'free', // 'free', 'premium', 'school'
            startDate: null,
            endDate: null,
            isActive: false
        },
        
        // Settings
        settings: {
            defaultAcademicYear: academicYears[1], // Current year
            theme: 'light',
            notifications: true
        },
        
        // Meta
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(profile);
    logInfo('User profile created for: ' + user.email);
    
    return profile;
}

// Check auth state
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        showLoading(false);
        
        if (user) {
            currentUser = user;
            
            // Load user profile
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userProfile = userDoc.data();
                
                // Update last login
                await db.collection('users').doc(user.uid).update({
                    lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            // Check if on landing page, redirect to app
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                window.location.href = 'app.html';
            }
            
        } else {
            currentUser = null;
            userProfile = null;
            
            // If on protected page, redirect to login
            if (window.location.pathname.includes('app.html') || 
                window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
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
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Gagal logout', 'error');
    }
}

// Check if user is premium
function isPremium() {
    if (!userProfile) return false;
    if (isSuperAdmin()) return true;
    
    const sub = userProfile.subscription;
    if (!sub || sub.type === 'free') return false;
    
    if (sub.endDate) {
        const endDate = sub.endDate.toDate ? sub.endDate.toDate() : new Date(sub.endDate);
        return new Date() < endDate;
    }
    
    return sub.isActive;
}

// Check if super admin
function isSuperAdmin() {
    return currentUser && currentUser.email === SUPER_ADMIN_EMAIL;
}

// Redirect to WhatsApp for upgrade
function redirectToWhatsApp() {
    const message = encodeURIComponent('Halo, saya ingin upgrade ke AGSA Premium. Email: ' + (currentUser ? currentUser.email : ''));
    const whatsappUrl = `https://wa.me/${APP_SETTINGS.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Get user profile
async function getUserProfile() {
    if (!currentUser) return null;
    
    if (userProfile) return userProfile;
    
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
        userProfile = doc.data();
        return userProfile;
    }
    
    return null;
}

// Update user profile
async function updateUserProfile(data) {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local profile
        userProfile = { ...userProfile, ...data };
        
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}