/**
 * =====================================================
 * FILE: auth.js
 * FUNGSI: Menangani login, logout, dan cek status user
 * =====================================================
 */

// =====================================================
// FUNGSI: Login dengan Email dan Password
// =====================================================
async function loginWithEmail(email, password) {
    // Tampilkan loading pada tombol
    const btnLogin = document.getElementById('btn-login');
    const originalText = btnLogin.innerHTML;
    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';
    btnLogin.disabled = true;
    
    // Sembunyikan pesan error sebelumnya
    hideError();
    
    try {
        // Proses login ke Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        console.log("✅ Login berhasil:", userCredential.user.email);
        
        // Redirect ke dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error("❌ Login gagal:", error);
        
        // Tampilkan pesan error yang user-friendly
        let pesanError = "";
        
        switch (error.code) {
            case 'auth/user-not-found':
                pesanError = "Email tidak terdaftar. Silakan daftar terlebih dahulu.";
                break;
            case 'auth/wrong-password':
                pesanError = "Password salah. Silakan coba lagi.";
                break;
            case 'auth/invalid-email':
                pesanError = "Format email tidak valid.";
                break;
            case 'auth/too-many-requests':
                pesanError = "Terlalu banyak percobaan. Coba lagi nanti.";
                break;
            default:
                pesanError = "Terjadi kesalahan. Silakan coba lagi.";
        }
        
        showError(pesanError);
        
    } finally {
        // Kembalikan tombol ke semula
        btnLogin.innerHTML = originalText;
        btnLogin.disabled = false;
    }
}

// =====================================================
// FUNGSI: Login dengan Google
// =====================================================
async function loginWithGoogle() {
    try {
        // Buat provider Google
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Tampilkan popup login Google
        const result = await auth.signInWithPopup(provider);
        
        console.log("✅ Login Google berhasil:", result.user.email);
        
        // Cek apakah user baru (pertama kali login)
        if (result.additionalUserInfo.isNewUser) {
            // Buat dokumen profil baru di Firestore
            await createNewUserProfile(result.user);
        }
        
        // Redirect ke dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error("❌ Login Google gagal:", error);
        
        if (error.code === 'auth/popup-closed-by-user') {
            showError("Login dibatalkan.");
        } else {
            showError("Gagal login dengan Google. Silakan coba lagi.");
        }
    }
}

// =====================================================
// FUNGSI: Logout
// =====================================================
async function logoutUser() {
    try {
        await auth.signOut();
        console.log("✅ Logout berhasil");
        
        // Redirect ke halaman login
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error("❌ Logout gagal:", error);
        alert("Gagal logout. Silakan coba lagi.");
    }
}

// =====================================================
// FUNGSI: Cek Status Login (dipanggil saat halaman dibuka)
// =====================================================
function checkAuthState() {
    // Tampilkan loading
    showLoading();
    
    // Pantau perubahan status login
    auth.onAuthStateChanged((user) => {
        hideLoading();
        
        if (user) {
            // User sudah login
            console.log("👤 User login:", user.email);
            
            // Jika di halaman login, redirect ke dashboard
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
            
            // Update tampilan dengan data user
            updateUserDisplay(user);
            
        } else {
            // User belum login
            console.log("👤 User belum login");
            
            // Jika bukan di halaman login, redirect ke login
            if (!window.location.pathname.includes('index.html') && 
                window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });
}

// =====================================================
// FUNGSI: Buat profil user baru di Firestore
// =====================================================
async function createNewUserProfile(user) {
    try {
        await db.collection('users').doc(user.uid).set({
            // Data dasar dari akun Google
            email: user.email,
            namaLengkap: user.displayName || '',
            fotoProfil: user.photoURL || '',
            
            // Data guru (akan dilengkapi nanti)
            nip: '',
            namaSekolah: '',
            kelasAmpu: [],
            
            // Metadata
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("✅ Profil user baru berhasil dibuat");
        
    } catch (error) {
        console.error("❌ Gagal membuat profil:", error);
    }
}

// =====================================================
// FUNGSI: Update tampilan dengan data user
// =====================================================
async function updateUserDisplay(user) {
    try {
        // Ambil data profil dari Firestore
        const doc = await db.collection('users').doc(user.uid).get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // Update nama di sidebar (jika ada)
            const namaElement = document.getElementById('nama-guru-sidebar');
            if (namaElement) {
                namaElement.textContent = data.namaLengkap || user.email;
            }
        }
        
    } catch (error) {
        console.error("❌ Gagal mengambil data profil:", error);
    }
}

// =====================================================
// FUNGSI BANTUAN: Tampilkan/Sembunyikan Error
// =====================================================
function showError(pesan) {
    const container = document.getElementById('pesan-error');
    const text = document.getElementById('text-error');
    
    if (container && text) {
        text.textContent = pesan;
        container.classList.remove('hidden');
    }
}

function hideError() {
    const container = document.getElementById('pesan-error');
    if (container) {
        container.classList.add('hidden');
    }
}

// =====================================================
// FUNGSI BANTUAN: Tampilkan/Sembunyikan Loading
// =====================================================
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}