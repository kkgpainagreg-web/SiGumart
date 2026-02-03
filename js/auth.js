// js/auth.js
// =====================================================
// AUTHENTICATION MODULE
// =====================================================

const Auth = {
    currentUser: null,
    userData: null,

    init: () => {
        Auth.renderAuthForm();
        Auth.setupAuthListener();
    },

    renderAuthForm: () => {
        const container = document.getElementById('auth-container');
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <!-- Tab Switch -->
                <div class="flex border-b">
                    <button id="login-tab" class="flex-1 py-4 text-center font-semibold text-primary border-b-2 border-primary">
                        Masuk
                    </button>
                    <button id="register-tab" class="flex-1 py-4 text-center font-semibold text-gray-500 hover:text-primary">
                        Daftar
                    </button>
                </div>

                <!-- Login Form -->
                <div id="login-form" class="p-8">
                    <div class="text-center mb-6">
                        <h1 class="text-2xl font-bold text-gray-800">Guru Smart</h1>
                        <p class="text-gray-500">Aplikasi Administrasi Guru Modern</p>
                    </div>
                    
                    <form id="login-form-submit" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="login-email" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="email@sekolah.sch.id">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="login-password" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="••••••••">
                        </div>
                        <button type="submit" 
                            class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                            Masuk
                        </button>
                    </form>
                </div>

                <!-- Register Form -->
                <div id="register-form" class="p-8 hidden">
                    <div class="text-center mb-6">
                        <h1 class="text-2xl font-bold text-gray-800">Daftar Akun Baru</h1>
                        <p class="text-gray-500">Bergabung dengan Guru Smart</p>
                    </div>
                    
                    <form id="register-form-submit" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" id="reg-nama" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Nama lengkap dengan gelar">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">NPSN Sekolah</label>
                            <input type="text" id="reg-npsn" required maxlength="8" pattern="[0-9]{8}"
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="8 digit NPSN">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Jenjang</label>
                            <select id="reg-jenjang" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="">Pilih Jenjang</option>
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA">SMA</option>
                                <option value="SMK">SMK</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                            <input type="text" id="reg-sekolah" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Nama lengkap sekolah">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="reg-email" required
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="email@sekolah.sch.id">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" id="reg-password" required minlength="6"
                                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Minimal 6 karakter">
                        </div>
                        <button type="submit" 
                            class="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition">
                            Daftar
                        </button>
                    </form>
                </div>
            </div>
        `;

        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-tab').classList.add('border-b-2', 'border-primary', 'text-primary');
            document.getElementById('login-tab').classList.remove('text-gray-500');
            document.getElementById('register-tab').classList.remove('border-b-2', 'border-primary', 'text-primary');
            document.getElementById('register-tab').classList.add('text-gray-500');
        });

        document.getElementById('register-tab').addEventListener('click', () => {
            document.getElementById('register-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-tab').classList.add('border-b-2', 'border-primary', 'text-primary');
            document.getElementById('register-tab').classList.remove('text-gray-500');
            document.getElementById('login-tab').classList.remove('border-b-2', 'border-primary', 'text-primary');
            document.getElementById('login-tab').classList.add('text-gray-500');
        });

        // Form submissions
        document.getElementById('login-form-submit').addEventListener('submit', Auth.handleLogin);
        document.getElementById('register-form-submit').addEventListener('submit', Auth.handleRegister);
    },

    handleLogin: async (e) => {
        e.preventDefault();
        Utils.showLoading('Memproses login...');

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            Utils.showNotification('Login berhasil!', 'success');
        } catch (error) {
            console.error('Login error:', error);
            Utils.showNotification('Login gagal: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    handleRegister: async (e) => {
        e.preventDefault();
        Utils.showLoading('Membuat akun...');

        const nama = document.getElementById('reg-nama').value;
        const npsn = document.getElementById('reg-npsn').value;
        const jenjang = document.getElementById('reg-jenjang').value;
        const sekolah = document.getElementById('reg-sekolah').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        if (!Utils.validateNPSN(npsn)) {
            Utils.showNotification('NPSN harus 8 digit angka', 'error');
            Utils.hideLoading();
            return;
        }

        try {
            // Create user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check or create school
            const schoolRef = db.collection(COLLECTIONS.SCHOOLS).doc(npsn);
            const schoolDoc = await schoolRef.get();

            if (!schoolDoc.exists) {
                await schoolRef.set({
                    npsn: npsn,
                    nama: sekolah,
                    jenjang: jenjang,
                    alamat: '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Create user profile
            await db.collection(COLLECTIONS.USERS).doc(user.uid).set({
                uid: user.uid,
                email: email,
                nama: nama,
                npsn: npsn,
                jenjang: jenjang,
                namaSekolah: sekolah,
                role: 'guru',
                mapel: [],
                rombel: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            Utils.showNotification('Pendaftaran berhasil!', 'success');
        } catch (error) {
            console.error('Register error:', error);
            Utils.showNotification('Pendaftaran gagal: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    setupAuthListener: () => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                Auth.currentUser = user;
                
                // Get user data
                const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
                if (userDoc.exists) {
                    Auth.userData = userDoc.data();
                    Auth.showApp();
                } else {
                    auth.signOut();
                    Utils.showNotification('Data user tidak ditemukan', 'error');
                }
            } else {
                Auth.currentUser = null;
                Auth.userData = null;
                Auth.showAuth();
            }
        });
    },

    showApp: () => {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        App.init();
    },

    showAuth: () => {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    },

    logout: async () => {
        const confirm = await Utils.confirm('Yakin ingin keluar?');
        if (confirm) {
            await auth.signOut();
            Utils.showNotification('Berhasil logout', 'success');
        }
    }
};

// Initialize auth on load
document.addEventListener('DOMContentLoaded', Auth.init);