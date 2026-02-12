// ============================================
// AUTHENTICATION MODULE
// Admin PAI Super App
// ============================================

// === STATE ===
let currentUser = null;

// === DOM ELEMENTS ===
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    
    if (formLogin) {
        formLogin.addEventListener('submit', handleLogin);
    }
    
    if (formRegister) {
        formRegister.addEventListener('submit', handleRegister);
    }
    
    // Check auth state
    checkAuthState();
});

// === TAB SWITCHING ===
function showTab(tab) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    
    if (tab === 'login') {
        tabLogin.classList.add('bg-pai-green', 'text-white');
        tabLogin.classList.remove('text-gray-600');
        tabRegister.classList.remove('bg-pai-green', 'text-white');
        tabRegister.classList.add('text-gray-600');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
    } else {
        tabRegister.classList.add('bg-pai-green', 'text-white');
        tabRegister.classList.remove('text-gray-600');
        tabLogin.classList.remove('bg-pai-green', 'text-white');
        tabLogin.classList.add('text-gray-600');
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
    }
}

// === PASSWORD TOGGLE ===
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// === CHECK AUTH STATE ===
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            
            // Check if user data exists in Firestore
            const userDoc = await collections.users.doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Create user document for Google sign-in users
                await createUserDocument(user);
            }
            
            // Redirect to dashboard if on login page
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
        } else {
            currentUser = null;
            // Redirect to login if not authenticated and not on login page
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });
}

// === CREATE USER DOCUMENT ===
async function createUserDocument(user, additionalData = {}) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: additionalData.displayName || user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'guru',
        createdAt: timestamp,
        updatedAt: timestamp,
        profile: {
            nip: '',
            phone: '',
            address: '',
            education: '',
            specialization: 'PAI'
        },
        school: {
            name: '',
            npsn: '',
            address: '',
            principalName: '',
            principalNip: ''
        },
        settings: {
            theme: 'light',
            notifications: true
        }
    };
    
    await collections.users.doc(user.uid).set(userData, { merge: true });
    return userData;
}

// === HANDLE LOGIN ===
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btnLogin = document.getElementById('btnLogin');
    const spinner = document.getElementById('loginSpinner');
    
    try {
        // Show loading
        btnLogin.disabled = true;
        spinner.classList.remove('hidden');
        
        // Sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        showToast('Login berhasil! Mengalihkan...', 'success');
        
        // Redirect will be handled by auth state listener
        
    } catch (error) {
        console.error('Login error:', error);
        
        let message = 'Terjadi kesalahan saat login.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'Email tidak terdaftar.';
                break;
            case 'auth/wrong-password':
                message = 'Password salah.';
                break;
            case 'auth/invalid-email':
                message = 'Format email tidak valid.';
                break;
            case 'auth/too-many-requests':
                message = 'Terlalu banyak percobaan. Coba lagi nanti.';
                break;
        }
        
        showToast(message, 'error');
        
    } finally {
        btnLogin.disabled = false;
        spinner.classList.add('hidden');
    }
}

// === HANDLE REGISTER ===
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const btnRegister = document.getElementById('btnRegister');
    const spinner = document.getElementById('registerSpinner');
    
    // Validation
    if (password !== confirm) {
        showToast('Password tidak cocok!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password minimal 6 karakter!', 'error');
        return;
    }
    
    try {
        // Show loading
        btnRegister.disabled = true;
        spinner.classList.remove('hidden');
        
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update display name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await createUserDocument(userCredential.user, { displayName: name });
        
        showToast('Pendaftaran berhasil! Mengalihkan...', 'success');
        
        // Redirect will be handled by auth state listener
        
    } catch (error) {
        console.error('Register error:', error);
        
        let message = 'Terjadi kesalahan saat pendaftaran.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'Email sudah terdaftar.';
                break;
            case 'auth/invalid-email':
                message = 'Format email tidak valid.';
                break;
            case 'auth/weak-password':
                message = 'Password terlalu lemah.';
                break;
        }
        
        showToast(message, 'error');
        
    } finally {
        btnRegister.disabled = false;
        spinner.classList.add('hidden');
    }
}

// === LOGIN WITH GOOGLE ===
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        showToast('Login dengan Google berhasil!', 'success');
        
        // Redirect will be handled by auth state listener
        
    } catch (error) {
        console.error('Google login error:', error);
        
        if (error.code !== 'auth/popup-closed-by-user') {
            showToast('Gagal login dengan Google.', 'error');
        }
    }
}

// === RESET PASSWORD ===
async function resetPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    
    if (!email) {
        showToast('Masukkan email terlebih dahulu!', 'warning');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Email reset password telah dikirim!', 'success');
    } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.code === 'auth/user-not-found') {
            showToast('Email tidak terdaftar.', 'error');
        } else {
            showToast('Gagal mengirim email reset.', 'error');
        }
    }
}

// === LOGOUT ===
async function logout() {
    try {
        await auth.signOut();
        showToast('Logout berhasil!', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Gagal logout.', 'error');
    }
}

// === GET CURRENT USER DATA ===
async function getCurrentUserData() {
    if (!currentUser) return null;
    
    try {
        const doc = await collections.users.doc(currentUser.uid).get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Get user data error:', error);
        return null;
    }
}

// === UPDATE USER DATA ===
async function updateUserData(data) {
    if (!currentUser) return false;
    
    try {
        await collections.users.doc(currentUser.uid).update({
            ...data,
            updatedAt: timestamp
        });
        return true;
    } catch (error) {
        console.error('Update user data error:', error);
        return false;
    }
}

// === TOAST NOTIFICATION ===
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toastContent');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set content
    toastMessage.textContent = message;
    
    // Set style based on type
    const styles = {
        success: { bg: 'bg-green-500', icon: '✓' },
        error: { bg: 'bg-red-500', icon: '✕' },
        warning: { bg: 'bg-yellow-500', icon: '⚠' },
        info: { bg: 'bg-blue-500', icon: 'ℹ' }
    };
    
    const style = styles[type] || styles.info;
    
    toastContent.className = `${style.bg} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`;
    toastIcon.textContent = style.icon;
    
    // Show toast
    toast.classList.remove('translate-x-full');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}