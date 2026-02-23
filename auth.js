// js/auth.js
// Authentication Handler

const Auth = {
    // Check if user is logged in
    checkAuth: function(callback) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // Cek apakah login dengan Gmail
                if (user.providerData[0].providerId === 'google.com') {
                    callback(user);
                } else {
                    this.logout();
                    alert('Silakan login menggunakan akun Gmail!');
                }
            } else {
                window.location.href = 'index.html';
            }
        });
    },

    // Login with Google
    loginWithGoogle: async function() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                'hd': '' // Kosongkan untuk membolehkan semua domain Gmail
            });
            
            const result = await auth.signInWithPopup(provider);
            const user = result.user;
            
            // Cek apakah email adalah Gmail
            if (!user.email.endsWith('@gmail.com')) {
                await auth.signOut();
                throw new Error('Hanya akun Gmail yang diperbolehkan!');
            }

            // Cek apakah user sudah terdaftar di Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // User baru, buat dokumen profil
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscription: 'free',
                    subscriptionExpiry: null,
                    profile: {
                        namaLengkap: user.displayName,
                        nip: '',
                        sekolah: '',
                        alamatSekolah: '',
                        kotaKabupaten: '',
                        namaKepsek: '',
                        nipKepsek: '',
                        jenjang: 'SD',
                        mapelDiampu: []
                    }
                });
            }

            // Redirect ke dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    logout: async function() {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Get current user data from Firestore
    getCurrentUserData: async function() {
        const user = auth.currentUser;
        if (!user) return null;
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        return userDoc.exists ? { id: user.uid, ...userDoc.data() } : null;
    },

    // Check if user is super admin
    isSuperAdmin: function(email) {
        return email === SUPER_ADMIN_EMAIL;
    },

    // Check subscription status
    checkSubscription: async function() {
        const userData = await this.getCurrentUserData();
        if (!userData) return 'free';
        
        if (userData.subscription === 'premium' && userData.subscriptionExpiry) {
            const expiry = userData.subscriptionExpiry.toDate();
            if (expiry > new Date()) {
                return 'premium';
            } else {
                // Subscription expired, downgrade to free
                await db.collection('users').doc(userData.id).update({
                    subscription: 'free'
                });
                return 'free';
            }
        }
        
        return userData.subscription || 'free';
    },

    // Update user profile
    updateProfile: async function(profileData) {
        const user = auth.currentUser;
        if (!user) throw new Error('User tidak ditemukan');
        
        await db.collection('users').doc(user.uid).update({
            profile: profileData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};

window.Auth = Auth;