// Auth Module
import { auth, db, googleProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;
let currentSchoolData = null;

export function initAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const userData = await getUserData(user.uid);
            if (userData) {
                currentUserData = userData;
                currentSchoolData = await getSchoolData(userData.npsn);
                callback({ status: 'authenticated', user, userData, schoolData: currentSchoolData });
            } else {
                callback({ status: 'needSetup', user });
            }
        } else {
            currentUser = null;
            currentUserData = null;
            currentSchoolData = null;
            callback({ status: 'unauthenticated' });
        }
    });
}

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

export async function logout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getUserData(uid) {
    try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

export async function getSchoolData(npsn) {
    try {
        const docSnap = await getDoc(doc(db, 'schools', npsn));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        return null;
    }
}

export async function checkNPSN(npsn) {
    try {
        const docSnap = await getDoc(doc(db, 'schools', npsn));
        return docSnap.exists() ? { exists: true, data: docSnap.data() } : { exists: false };
    } catch (error) {
        return { exists: false, error: error.message };
    }
}

export async function saveUserProfile(data) {
    try {
        const uid = auth.currentUser.uid;
        const email = auth.currentUser.email;
        const photoURL = auth.currentUser.photoURL;
        
        const schoolCheck = await checkNPSN(data.npsn);
        
        const userData = {
            uid, email, photoURL,
            namaGuru: data.namaGuru,
            nip: data.nip || '',
            npsn: data.npsn,
            jenjang: data.jenjang,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', uid), userData);
        
        if (!schoolCheck.exists) {
            const schoolData = {
                npsn: data.npsn,
                namaSekolah: data.namaSekolah,
                alamat: data.alamat || '',
                jenjang: data.jenjang,
                kepalaSekolah: data.kepalaSekolah || '',
                nipKepsek: data.nipKepsek || '',
                createdAt: new Date().toISOString(),
                createdBy: uid
            };
            await setDoc(doc(db, 'schools', data.npsn), schoolData);
            currentSchoolData = schoolData;
        } else {
            currentSchoolData = schoolCheck.data;
        }
        
        currentUserData = userData;
        return { success: true, userData, schoolData: currentSchoolData };
    } catch (error) {
        console.error('Save profile error:', error);
        return { success: false, error: error.message };
    }
}

export function getCurrentUser() { return currentUser; }
export function getCurrentUserData() { return currentUserData; }
export function getCurrentSchoolData() { return currentSchoolData; }
