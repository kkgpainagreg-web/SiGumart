// Authentication Functions

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Show/Hide Forms
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('forgotPasswordForm').classList.add('hidden');
}

function showForgotPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('forgotPasswordForm').classList.remove('hidden');
}

// Validate Gmail
function isGmail(email) {
    return email.toLowerCase().endsWith('@gmail.com');
}

// Login with Email
async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('Mohon isi email dan password', 'warning');
        return;
    }
    
    if (!isGmail(email)) {
        showAlert('Hanya email Gmail yang diizinkan', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await handleSuccessfulLogin(userCredential.user);
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Login with Google
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'hd': 'gmail.com' // Restrict to gmail.com domain
    });
    
    showLoading();
    
    try {
        const result = await auth.signInWithPopup(provider);
        
        if (!isGmail(result.user.email)) {
            await auth.signOut();
            hideLoading();
            showAlert('Hanya akun Gmail yang diizinkan', 'error');
            return;
        }
        
        await handleSuccessfulLogin(result.user);
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Register with Email
async function registerWithEmail() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Mohon lengkapi semua field', 'warning');
        return;
    }
    
    if (!isGmail(email)) {
        showAlert('Hanya email Gmail yang diizinkan untuk registrasi', 'error');
        return;
    }
    
    if (password.length < 8) {
        showAlert('Password minimal 8 karakter', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Password tidak cocok', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Update display name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await createUserDocument(userCredential.user, name);
        
        await handleSuccessfulLogin(userCredential.user);
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Reset Password
async function resetPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showAlert('Mohon masukkan email', 'warning');
        return;
    }
    
    if (!isGmail(email)) {
        showAlert('Hanya email Gmail yang diizinkan', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await auth.sendPasswordResetEmail(email);
        hideLoading();
        showAlert('Link reset password telah dikirim ke email Anda', 'success');
        showLogin();
    } catch (error) {
        hideLoading();
        handleAuthError(error);
    }
}

// Create User Document in Firestore
async function createUserDocument(user, name) {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
        const isSuperAdmin = user.email === APP_CONFIG.superAdminEmail;
        
        await userRef.set({
            uid: user.uid,
            email: user.email,
            name: name || user.displayName || 'Pengguna',
            photoURL: user.photoURL || null,
            role: isSuperAdmin ? 'super_admin' : 'user',
            subscription: isSuperAdmin ? 'premium' : 'free',
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
                    level: 'SD', // SD, SMP, SMA, SMK
                    headmaster: '',
                    headmasterNip: ''
                }
            },
            settings: {
                academicYear: getCurrentAcademicYear().current,
                lessonDuration: 35, // Default for SD
                theme: 'light'
            }
        });
    }
}

// Handle Successful Login
async function handleSuccessfulLogin(user) {
    try {
        // Check/create user document
        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            await createUserDocument(user, user.displayName);
        } else {
            // Update last login
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Check if super admin
        const userData = (await userRef.get()).data();
        
        hideLoading();
        
        if (userData.role === 'super_admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'app.html';
        }
    } catch (error) {
        hideLoading();
        console.error('Error in handleSuccessfulLogin:', error);
        showAlert('Terjadi kesalahan saat memproses login', 'error');
    }
}

// Handle Auth Errors
function handleAuthError(error) {
    console.error('Auth Error:', error);
    
    const errorMessages = {
        'auth/user-not-found': 'Email tidak terdaftar',
        'auth/wrong-password': 'Password salah',
        'auth/email-already-in-use': 'Email sudah terdaftar',
        'auth/weak-password': 'Password terlalu lemah',
        'auth/invalid-email': 'Format email tidak valid',
        'auth/popup-closed-by-user': 'Login dibatalkan',
        'auth/network-request-failed': 'Koneksi internet bermasalah',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.'
    };
    
    const message = errorMessages[error.code] || `Terjadi kesalahan: ${error.message}`;
    showAlert(message, 'error');
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is logged in, redirect if on login page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.role === 'super_admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'app.html';
                }
            }
        }
    }
});

console.log('Auth Module Loaded');