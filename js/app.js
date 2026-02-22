// js/app.js
import './jadwal.js';
import './csv-parser.js';
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged, db, doc, getDoc, setDoc } from './firebase-config.js';

// --- UTILITY: Auto School Year ---
function getAutoSchoolYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 (Jan) - 11 (Dec)
    // Jika bulan Juni (5) atau lebih, masuk tahun ajar baru
    if (month >= 5) {
        return `${year}/${year + 1}`;
    } else {
        return `${year - 1}/${year}`;
    }
}

// --- STATE MANAGEMENT ---
let currentUser = null;
let userRole = 'free'; // free, premium, superadmin
const SUPER_ADMIN_EMAIL = 'afifaro@gmail.com';
const WHATSAPP_UPGRADE = '6281234567890'; // Default, nantinya ditarik dari DB

// --- UI ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userNameDisplay = document.getElementById('user-name');
const schoolYearDisplay = document.getElementById('school-year');
const upgradeBtn = document.getElementById('upgrade-btn');

// --- AUTHENTICATION LOGIC ---
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Gagal Login:", error);
        alert("Gagal login dengan Google. Silakan coba lagi.");
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        userNameDisplay.innerText = user.displayName;
        schoolYearDisplay.innerText = `Tahun Ajar: ${getAutoSchoolYear()}`;
        
        // Cek/Set Role di Firestore
        await checkAndSetUserRole(user);
        
    } else {
        currentUser = null;
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

async function checkAndSetUserRole(user) {
    if (user.email === SUPER_ADMIN_EMAIL) {
        userRole = 'superadmin';
    } else {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            userRole = userSnap.data().role || 'free';
        } else {
            // Register user baru secara otomatis
            await setDoc(userRef, {
                email: user.email,
                name: user.displayName,
                role: 'free',
                createdAt: new Date()
            });
            userRole = 'free';
        }
    }
    updateUIBasedOnRole();
}

function updateUIBasedOnRole() {
    const premiumLocks = document.querySelectorAll('.premium-lock');
    if (userRole === 'premium' || userRole === 'superadmin') {
        premiumLocks.forEach(el => el.classList.add('hidden'));
        upgradeBtn.classList.add('hidden');
    } else {
        premiumLocks.forEach(el => el.classList.remove('hidden'));
        upgradeBtn.classList.remove('hidden');
    }
}

// --- WHATSAPP UPGRADE REDIRECT ---
upgradeBtn.addEventListener('click', () => {
    const message = `Halo Admin, saya ingin upgrade akun Admin Guru Super App saya. Email: ${currentUser.email}`;
    window.open(`https://wa.me/${WHATSAPP_UPGRADE}?text=${encodeURIComponent(message)}`, '_blank');
});

// --- NAVIGATION LOGIC ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        
        sections.forEach(sec => sec.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
        
        navLinks.forEach(n => n.classList.remove('bg-blue-700'));
        link.classList.add('bg-blue-700');
    });
});