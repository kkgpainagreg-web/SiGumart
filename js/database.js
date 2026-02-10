/**
 * =====================================================
 * FILE: database.js
 * FUNGSI: Semua operasi CRUD ke Firestore
 * 
 * STRUKTUR DATABASE:
 * - users/{userId}           → Data profil guru
 * - master_cp/{fase}         → Data CP PAI 2025
 * - perencanaan/{userId}/prota/{tahunAjaran}  → Data Prota
 * - perencanaan/{userId}/promes/{semester}    → Data Promes
 * - kelas/{userId}/siswa/{siswaId}            → Data siswa
 * - absensi/{userId}/{tanggal}                → Data absensi
 * - nilai/{userId}/{semester}                 → Data nilai
 * =====================================================
 */

// =====================================================
// OPERASI: PROFIL GURU
// =====================================================

/**
 * Simpan atau update profil guru
 * @param {Object} dataProfil - Data profil yang akan disimpan
 */
async function simpanProfilGuru(dataProfil) {
    // Pastikan user sudah login
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Anda harus login terlebih dahulu");
    }
    
    try {
        // Tambahkan timestamp update
        dataProfil.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        // Simpan ke Firestore
        await db.collection('users').doc(user.uid).update(dataProfil);
        
        console.log("✅ Profil berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan profil:", error);
        throw error;
    }
}

/**
 * Ambil profil guru yang sedang login
 * @returns {Object} Data profil guru
 */
async function ambilProfilGuru() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("Anda harus login terlebih dahulu");
    }
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            return null;
        }
        
    } catch (error) {
        console.error("❌ Gagal mengambil profil:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: KALENDER PENDIDIKAN
// =====================================================

/**
 * Simpan pengaturan kalender pendidikan
 * @param {Object} dataKalender - Data kalender
 */
async function simpanKalender(dataKalender) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        await db.collection('users').doc(user.uid)
            .collection('kalender')
            .doc(dataKalender.tahunAjaran)
            .set({
                ...dataKalender,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log("✅ Kalender berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan kalender:", error);
        throw error;
    }
}

/**
 * Ambil data kalender pendidikan
 * @param {string} tahunAjaran - Contoh: "2024-2025"
 */
async function ambilKalender(tahunAjaran) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const doc = await db.collection('users').doc(user.uid)
            .collection('kalender')
            .doc(tahunAjaran)
            .get();
        
        return doc.exists ? doc.data() : null;
        
    } catch (error) {
        console.error("❌ Gagal mengambil kalender:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: PROTA (Program Tahunan)
// =====================================================

/**
 * Simpan Prota
 */
async function simpanProta(dataProta) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const docId = `${dataProta.tahunAjaran}_${dataProta.kelas}`;
        
        await db.collection('users').doc(user.uid)
            .collection('prota')
            .doc(docId)
            .set({
                ...dataProta,
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log("✅ Prota berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan Prota:", error);
        throw error;
    }
}

/**
 * Ambil semua Prota milik user
 */
async function ambilSemuaProta() {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const snapshot = await db.collection('users').doc(user.uid)
            .collection('prota')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error("❌ Gagal mengambil Prota:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: PROMES (Program Semester)
// =====================================================

/**
 * Simpan Promes
 */
async function simpanPromes(dataPromes) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const docId = `${dataPromes.tahunAjaran}_${dataPromes.semester}_${dataPromes.kelas}`;
        
        await db.collection('users').doc(user.uid)
            .collection('promes')
            .doc(docId)
            .set({
                ...dataPromes,
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log("✅ Promes berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan Promes:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: DATA SISWA
// =====================================================

/**
 * Tambah siswa baru
 */
async function tambahSiswa(dataSiswa) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const docRef = await db.collection('users').doc(user.uid)
            .collection('siswa')
            .add({
                ...dataSiswa,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log("✅ Siswa berhasil ditambahkan:", docRef.id);
        return docRef.id;
        
    } catch (error) {
        console.error("❌ Gagal menambah siswa:", error);
        throw error;
    }
}

/**
 * Ambil daftar siswa berdasarkan kelas
 */
async function ambilSiswaByKelas(kelas) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const snapshot = await db.collection('users').doc(user.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .orderBy('nama', 'asc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error("❌ Gagal mengambil siswa:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: ABSENSI
// =====================================================

/**
 * Simpan absensi harian
 */
async function simpanAbsensi(tanggal, kelas, dataAbsensi) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const docId = `${tanggal}_${kelas}`;
        
        await db.collection('users').doc(user.uid)
            .collection('absensi')
            .doc(docId)
            .set({
                tanggal: tanggal,
                kelas: kelas,
                data: dataAbsensi, // Array berisi {siswaId, status: 'H'/'I'/'S'/'A'}
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log("✅ Absensi berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan absensi:", error);
        throw error;
    }
}

// =====================================================
// OPERASI: NILAI
// =====================================================

/**
 * Simpan nilai siswa
 */
async function simpanNilai(semester, kelas, dataNilai) {
    const user = auth.currentUser;
    if (!user) throw new Error("Harus login");
    
    try {
        const docId = `${semester}_${kelas}`;
        
        await db.collection('users').doc(user.uid)
            .collection('nilai')
            .doc(docId)
            .set({
                semester: semester,
                kelas: kelas,
                data: dataNilai, // Array berisi {siswaId, nilai: [...]}
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        
        console.log("✅ Nilai berhasil disimpan");
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menyimpan nilai:", error);
        throw error;
    }
}