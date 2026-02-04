// =====================================================
// DOCUMENTS MODULE - documents.js
// Prota, Promes, Modul Ajar, LKPD, Bank Soal
// =====================================================

import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getCurrentUserData, getCurrentSchoolData } from './auth.js';
import { getCPByMapel, getTPByCP, DIMENSI_PROFIL_LULUSAN } from './master-data.js';

// =====================================================
// PROTA (Program Tahunan) FUNCTIONS
// =====================================================

// Get Prota
export async function getProta(userId, mapelId, tahunAjaran) {
    try {
        const q = query(
            collection(db, 'prota'),
            where('userId', '==', userId),
            where('mapelId', '==', mapelId),
            where('tahunAjaran', '==', tahunAjaran)
        );
        const snapshot = await getDocs(q);
        const protaList = [];
        snapshot.forEach(doc => {
            protaList.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: protaList };
    } catch (error) {
        console.error('Get prota error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// Generate Prota from CP/TP
export async function generateProta(mapelId, tahunAjaran, kelas) {
    try {
        const userData = getCurrentUserData();
        const schoolData = getCurrentSchoolData();
        
        // Get mapel data
        const mapelDoc = await getDoc(doc(db, 'user_mapel', mapelId));
        if (!mapelDoc.exists()) {
            return { success: false, error: 'Mata pelajaran tidak ditemukan' };
        }
        const mapelData = mapelDoc.data();
        
        // Get CP and TP
        const cpResult = await getCPByMapel(mapelId);
        if (!cpResult.success || cpResult.data.length === 0) {
            return { success: false, error: 'Belum ada CP untuk mata pelajaran ini' };
        }
        
        // Build semester data
        const semester1 = [];
        const semester2 = [];
        let tpCounter = 0;
        
        for (const cp of cpResult.data) {
            const tpResult = await getTPByCP(cp.id);
            if (tpResult.success && tpResult.data.length > 0) {
                tpResult.data.forEach(tp => {
                    tpCounter++;
                    const item = {
                        tpId: tp.id,
                        cpId: cp.id,
                        elemen: cp.elemen,
                        kodeTP: tp.kode,
                        deskripsiTP: tp.deskripsi,
                        alokasi: tp.alokasi || 2,
                        mingguKe: 0 // Will be set by user
                    };
                    
                    // Distribute to semesters (first half to sem 1, second half to sem 2)
                    if (tpCounter <= Math.ceil(tpResult.data.length / 2)) {
                        semester1.push(item);
                    } else {
                        semester2.push(item);
                    }
                });
            }
        }
        
        const protaData = {
            userId: userData.uid,
            npsn: userData.npsn,
            mapelId: mapelId,
            mapelNama: mapelData.nama,
            mapelKode: mapelData.kode,
            tahunAjaran: tahunAjaran,
            kelas: kelas,
            namaSekolah: schoolData.namaSekolah,
            alamatSekolah: schoolData.alamat,
            namaGuru: userData.namaGuru,
            nip: userData.nip,
            kepalaSekolah: schoolData.kepalaSekolah,
            nipKepsek: schoolData.nipKepsek,
            semester1: {
                items: semester1,
                totalJP: semester1.reduce((sum, item) => sum + item.alokasi, 0)
            },
            semester2: {
                items: semester2,
                totalJP: semester2.reduce((sum, item) => sum + item.alokasi, 0)
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'prota'), protaData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...protaData } };
    } catch (error) {
        console.error('Generate prota error:', error);
        return { success: false, error: error.message };
    }
}

// Update Prota
export async function updateProta(protaId, data) {
    try {
        const docRef = doc(db, 'prota', protaId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Update prota error:', error);
        return { success: false, error: error.message };
    }
}

// Delete Prota
export async function deleteProta(protaId) {
    try {
        await deleteDoc(doc(db, 'prota', protaId));
        return { success: true };
    } catch (error) {
        console.error('Delete prota error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// PROMES (Program Semester) FUNCTIONS
// =====================================================

// Get Promes
export async function getPromes(userId, mapelId, tahunAjaran, semester) {
    try {
        let q = query(
            collection(db, 'promes'),
            where('userId', '==', userId),
            where('mapelId', '==', mapelId),
            where('tahunAjaran', '==', tahunAjaran)
        );
        
        if (semester) {
            q = query(q, where('semester', '==', semester));
        }
        
        const snapshot = await getDocs(q);
        const promesList = [];
        snapshot.forEach(doc => {
            promesList.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: promesList };
    } catch (error) {
        console.error('Get promes error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// Generate Promes from Prota
export async function generatePromes(protaId, semester) {
    try {
        const userData = getCurrentUserData();
        const schoolData = getCurrentSchoolData();
        
        // Get prota data
        const protaDoc = await getDoc(doc(db, 'prota', protaId));
        if (!protaDoc.exists()) {
            return { success: false, error: 'Prota tidak ditemukan' };
        }
        const protaData = protaDoc.data();
        
        // Get semester data from prota
        const semesterData = semester === '1' ? protaData.semester1 : protaData.semester2;
        
        // Generate weekly distribution (assuming 16-18 effective weeks per semester)
        const totalWeeks = 18;
        const distribution = [];
        
        semesterData.items.forEach((item, idx) => {
            // Calculate weeks needed based on JP
            const weeksNeeded = Math.ceil(item.alokasi / 2); // Assuming 2 JP per week
            distribution.push({
                ...item,
                minggu: Array.from({ length: weeksNeeded }, (_, i) => ({
                    mingguKe: 0, // Will be set manually
                    jp: Math.min(2, item.alokasi - (i * 2))
                }))
            });
        });
        
        const promesData = {
            userId: userData.uid,
            npsn: userData.npsn,
            protaId: protaId,
            mapelId: protaData.mapelId,
            mapelNama: protaData.mapelNama,
            mapelKode: protaData.mapelKode,
            tahunAjaran: protaData.tahunAjaran,
            semester: semester,
            kelas: protaData.kelas,
            namaSekolah: schoolData.namaSekolah,
            alamatSekolah: schoolData.alamat,
            namaGuru: userData.namaGuru,
            nip: userData.nip,
            kepalaSekolah: schoolData.kepalaSekolah,
            nipKepsek: schoolData.nipKepsek,
            distribution: distribution,
            months: semester === '1' 
                ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
                : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
            totalJP: semesterData.totalJP,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'promes'), promesData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...promesData } };
    } catch (error) {
        console.error('Generate promes error:', error);
        return { success: false, error: error.message };
    }
}

// Update Promes
export async function updatePromes(promesId, data) {
    try {
        const docRef = doc(db, 'promes', promesId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Update promes error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// MODUL AJAR FUNCTIONS
// =====================================================

// Get Modul Ajar
export async function getModulAjar(userId, mapelId) {
    try {
        const q = query(
            collection(db, 'modul_ajar'),
            where('userId', '==', userId),
            where('mapelId', '==', mapelId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const modulList = [];
        snapshot.forEach(doc => {
            modulList.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: modulList };
    } catch (error) {
        console.error('Get modul ajar error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// Create Modul Ajar
export async function createModulAjar(data) {
    try {
        const userData = getCurrentUserData();
        const schoolData = getCurrentSchoolData();
        
        const modulData = {
            userId: userData.uid,
            npsn: userData.npsn,
            mapelId: data.mapelId,
            mapelNama: data.mapelNama,
            
            // Informasi Umum
            informasiUmum: {
                penyusun: userData.namaGuru,
                instansi: schoolData.namaSekolah,
                tahunPenyusunan: new Date().getFullYear(),
                jenjang: schoolData.jenjang,
                kelas: data.kelas,
                alokasi: data.alokasi || 2, // JP
                fase: data.fase
            },
            
            // Capaian & Tujuan
            capaianPembelajaran: data.capaianPembelajaran || '',
            tujuanPembelajaran: data.tujuanPembelajaran || [],
            
            // Profil Lulusan
            profilLulusan: data.profilLulusan || [],
            
            // Sarana & Prasarana
            saranaPrasarana: {
                sarana: data.sarana || [],
                prasarana: data.prasarana || []
            },
            
            // Target Peserta Didik
            targetPesertaDidik: data.targetPesertaDidik || {
                regular: true,
                kesulitanBelajar: false,
                pencapaianTinggi: false
            },
            
            // Model Pembelajaran
            modelPembelajaran: data.modelPembelajaran || '',
            
            // Materi
            materi: {
                faktual: data.materi?.faktual || [],
                konseptual: data.materi?.konseptual || [],
                prosedural: data.materi?.prosedural || [],
                metakognitif: data.materi?.metakognitif || []
            },
            
            // Kegiatan Pembelajaran
            kegiatanPembelajaran: {
                pendahuluan: data.kegiatan?.pendahuluan || [],
                inti: data.kegiatan?.inti || [],
                penutup: data.kegiatan?.penutup || []
            },
            
            // Asesmen
            asesmen: {
                diagnostik: data.asesmen?.diagnostik || '',
                formatif: data.asesmen?.formatif || '',
                sumatif: data.asesmen?.sumatif || ''
            },
            
            // Pengayaan & Remedial
            pengayaan: data.pengayaan || '',
            remedial: data.remedial || '',
            
            // Refleksi
            refleksiGuru: data.refleksiGuru || '',
            refleksiPesertaDidik: data.refleksiPesertaDidik || '',
            
            // Lampiran
            lampiran: {
                bahan: data.lampiran?.bahan || '',
                lkpd: data.lampiran?.lkpd || '',
                rubrik: data.lampiran?.rubrik || ''
            },
            
            // Glosarium & Referensi
            glosarium: data.glosarium || [],
            referensi: data.referensi || [],
            
            kepalaSekolah: schoolData.kepalaSekolah,
            nipKepsek: schoolData.nipKepsek,
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'modul_ajar'), modulData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...modulData } };
    } catch (error) {
        console.error('Create modul ajar error:', error);
        return { success: false, error: error.message };
    }
}

// Update Modul Ajar
export async function updateModulAjar(modulId, data) {
    try {
        const docRef = doc(db, 'modul_ajar', modulId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Update modul ajar error:', error);
        return { success: false, error: error.message };
    }
}

// Delete Modul Ajar
export async function deleteModulAjar(modulId) {
    try {
        await deleteDoc(doc(db, 'modul_ajar', modulId));
        return { success: true };
    } catch (error) {
        console.error('Delete modul ajar error:', error);
        return { success: false, error: error.message };
    }
}

// Generate Modul Ajar from TP
export async function generateModulAjarFromTP(tpId, cpId, mapelId) {
    try {
        const userData = getCurrentUserData();
        const schoolData = getCurrentSchoolData();
        
        // Get TP data
        const tpDoc = await getDoc(doc(db, 'tujuan_pembelajaran', tpId));
        if (!tpDoc.exists()) {
            return { success: false, error: 'Tujuan Pembelajaran tidak ditemukan' };
        }
        const tpData = tpDoc.data();
        
        // Get CP data
        const cpDoc = await getDoc(doc(db, 'capaian_pembelajaran', cpId));
        if (!cpDoc.exists()) {
            return { success: false, error: 'Capaian Pembelajaran tidak ditemukan' };
        }
        const cpData = cpDoc.data();
        
        // Get Mapel data
        const mapelDoc = await getDoc(doc(db, 'user_mapel', mapelId));
        const mapelData = mapelDoc.data();
        
        const modulData = {
            mapelId: mapelId,
            mapelNama: mapelData.nama,
            kelas: '', // To be filled
            fase: cpData.fase,
            alokasi: tpData.alokasi || 2,
            capaianPembelajaran: cpData.deskripsiCP,
            tujuanPembelajaran: [tpData.deskripsi],
            profilLulusan: cpData.dimensiProfil || [],
            
            // Default templates
            kegiatan: {
                pendahuluan: [
                    'Guru membuka pelajaran dengan salam dan doa',
                    'Guru mengecek kehadiran peserta didik',
                    'Guru menyampaikan tujuan pembelajaran',
                    'Guru memberikan apersepsi terkait materi'
                ],
                inti: [
                    'Peserta didik mengamati materi yang disajikan',
                    'Peserta didik berdiskusi dalam kelompok',
                    'Peserta didik mempresentasikan hasil diskusi',
                    'Guru memberikan penguatan materi'
                ],
                penutup: [
                    'Peserta didik menyimpulkan pembelajaran bersama guru',
                    'Guru memberikan evaluasi singkat',
                    'Guru menyampaikan rencana pembelajaran berikutnya',
                    'Guru menutup pelajaran dengan doa dan salam'
                ]
            },
            
            asesmen: {
                diagnostik: 'Tanya jawab tentang pengetahuan awal peserta didik',
                formatif: 'Observasi selama proses pembelajaran dan diskusi',
                sumatif: 'Tes tertulis dan/atau unjuk kerja'
            },
            
            pengayaan: 'Peserta didik yang sudah mencapai tujuan pembelajaran diberikan tugas pengayaan berupa pendalaman materi atau proyek tambahan.',
            remedial: 'Peserta didik yang belum mencapai tujuan pembelajaran diberikan bimbingan tambahan dan kesempatan untuk mengulang materi.',
            
            refleksiGuru: 'Refleksi tentang proses pembelajaran, apa yang sudah baik dan perlu diperbaiki.',
            refleksiPesertaDidik: 'Peserta didik merefleksikan pengalaman belajar mereka.'
        };
        
        return await createModulAjar(modulData);
    } catch (error) {
        console.error('Generate modul ajar error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// LKPD (Lembar Kerja Peserta Didik) FUNCTIONS
// =====================================================

// Get LKPD
export async function getLKPD(userId, mapelId) {
    try {
        const q = query(
            collection(db, 'lkpd'),
            where('userId', '==', userId),
            where('mapelId', '==', mapelId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const lkpdList = [];
        snapshot.forEach(doc => {
            lkpdList.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: lkpdList };
    } catch (error) {
        console.error('Get LKPD error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// Create LKPD
export async function createLKPD(data) {
    try {
        const userData = getCurrentUserData();
        const schoolData = getCurrentSchoolData();
        
        const lkpdData = {
            userId: userData.uid,
            npsn: userData.npsn,
            mapelId: data.mapelId,
            mapelNama: data.mapelNama,
            
            // Header
            judul: data.judul,
            kelas: data.kelas,
            semester: data.semester,
            alokasi: data.alokasi || 40, // menit
            
            // Identitas Peserta Didik (akan diisi siswa)
            identitasSiswa: {
                showNama: true,
                showKelas: true,
                showKelompok: data.jenisLKPD === 'kelompok',
                showTanggal: true
            },
            
            // Tujuan Pembelajaran
            tujuanPembelajaran: data.tujuanPembelajaran || [],
            
            // Petunjuk
            petunjukUmum: data.petunjukUmum || [
                'Bacalah petunjuk dengan cermat sebelum mengerjakan',
                'Kerjakan secara mandiri/kelompok sesuai instruksi',
                'Tanyakan kepada guru jika ada yang tidak dipahami',
                'Kumpulkan LKPD setelah selesai mengerjakan'
            ],
            
            // Materi Singkat
            materiSingkat: data.materiSingkat || '',
            
            // Kegiatan/Soal
            kegiatan: data.kegiatan || [],
            // Format kegiatan:
            // { nomor, instruksi, jenis: 'isian'|'uraian'|'pilihan'|'tabel'|'gambar', 
            //   konten, ruangJawab, skor }
            
            // Kesimpulan
            kesimpulan: {
                show: data.showKesimpulan !== false,
                template: data.templateKesimpulan || 'Berdasarkan kegiatan yang telah dilakukan, dapat disimpulkan bahwa...'
            },
            
            // Penilaian
            penilaian: {
                totalSkor: data.kegiatan?.reduce((sum, k) => sum + (k.skor || 0), 0) || 100,
                rubrik: data.rubrik || []
            },
            
            // Info
            namaSekolah: schoolData.namaSekolah,
            namaGuru: userData.namaGuru,
            
            jenisLKPD: data.jenisLKPD || 'individu', // individu | kelompok
            tingkatKesulitan: data.tingkatKesulitan || 'sedang', // mudah | sedang | sulit
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'lkpd'), lkpdData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...lkpdData } };
    } catch (error) {
        console.error('Create LKPD error:', error);
        return { success: false, error: error.message };
    }
}

// Update LKPD
export async function updateLKPD(lkpdId, data) {
    try {
        const docRef = doc(db, 'lkpd', lkpdId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Update LKPD error:', error);
        return { success: false, error: error.message };
    }
}

// Delete LKPD
export async function deleteLKPD(lkpdId) {
    try {
        await deleteDoc(doc(db, 'lkpd', lkpdId));
        return { success: true };
    } catch (error) {
        console.error('Delete LKPD error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// BANK SOAL FUNCTIONS
// =====================================================

export async function getBankSoal(userId, mapelId, filters = {}) {
    try {
        let q = query(
            collection(db, 'bank_soal'),
            where('userId', '==', userId),
            where('mapelId', '==', mapelId)
        );
        
        const snapshot = await getDocs(q);
        let soalList = [];
        snapshot.forEach(doc => {
            soalList.push({ id: doc.id, ...doc.data() });
        });
        
        // Apply client-side filters
        if (filters.tipeSoal) {
            soalList = soalList.filter(s => s.tipeSoal === filters.tipeSoal);
        }
        if (filters.level) {
            soalList = soalList.filter(s => s.levelKognitif === filters.level);
        }
        if (filters.kelas) {
            soalList = soalList.filter(s => s.kelas === filters.kelas);
        }
        if (filters.elemen) {
            soalList = soalList.filter(s => s.elemen === filters.elemen);
        }
        
        return { success: true, data: soalList };
    } catch (error) {
        console.error('Get bank soal error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// Add Soal
export async function addSoal(data) {
    try {
        const userData = getCurrentUserData();
        
        const soalData = {
            userId: userData.uid,
            npsn: userData.npsn,
            mapelId: data.mapelId,
            mapelNama: data.mapelNama,
            
            // Identifikasi
            kelas: data.kelas,
            elemen: data.elemen,
            tpId: data.tpId || null,
            tpDeskripsi: data.tpDeskripsi || '',
            
            // Soal
            tipeSoal: data.tipeSoal,
            levelKognitif: data.levelKognitif,
            tingkatKesulitan: data.tingkatKesulitan || 'sedang', // mudah, sedang, sulit
            
            pertanyaan: data.pertanyaan,
            
            // Opsi untuk pilihan ganda
            opsi: data.opsi || [], // [{label: 'A', teks: '...', benar: false}, ...]
            
            // Kunci jawaban
            kunciJawaban: data.kunciJawaban,
            
            // Pembahasan
            pembahasan: data.pembahasan || '',
            
            // Skor
            skorMaksimal: data.skorMaksimal || 1,
            
            // Media
            gambar: data.gambar || null, // URL gambar
            
            // Tags
            tags: data.tags || [],
            
            // Status
            isValidated: false,
            usageCount: 0, // Berapa kali digunakan dalam ujian
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'bank_soal'), soalData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...soalData } };
    } catch (error) {
        console.error('Add soal error:', error);
        return { success: false, error: error.message };
    }
}

// Update Soal
export async function updateSoal(soalId, data) {
    try {
        const docRef = doc(db, 'bank_soal', soalId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error('Update soal error:', error);
        return { success: false, error: error.message };
    }
}

// Delete Soal
export async function deleteSoal(soalId) {
    try {
        await deleteDoc(doc(db, 'bank_soal', soalId));
        return { success: true };
    } catch (error) {
        console.error('Delete soal error:', error);
        return { success: false, error: error.message };
    }
}

// Generate Soal Paket (untuk ujian)
export async function generatePaketSoal(mapelId, config) {
    try {
        const userData = getCurrentUserData();
        
        // Get all soal
        const soalResult = await getBankSoal(userData.uid, mapelId, {
            kelas: config.kelas
        });
        
        if (!soalResult.success || soalResult.data.length === 0) {
            return { success: false, error: 'Tidak ada soal tersedia' };
        }
        
        let selectedSoal = [];
        const allSoal = soalResult.data;
        
        // Select soal based on config
        if (config.distribusi) {
            // Distribute by level
            Object.entries(config.distribusi).forEach(([level, count]) => {
                const levelSoal = allSoal.filter(s => s.levelKognitif === level);
                const shuffled = levelSoal.sort(() => 0.5 - Math.random());
                selectedSoal = [...selectedSoal, ...shuffled.slice(0, count)];
            });
        } else {
            // Random selection
            const shuffled = allSoal.sort(() => 0.5 - Math.random());
            selectedSoal = shuffled.slice(0, config.jumlahSoal || 20);
        }
        
        // Shuffle final selection
        selectedSoal = selectedSoal.sort(() => 0.5 - Math.random());
        
        // Create paket
        const paketData = {
            userId: userData.uid,
            npsn: userData.npsn,
            mapelId: mapelId,
            namaPaket: config.namaPaket || `Paket Soal ${new Date().toLocaleDateString('id-ID')}`,
            kelas: config.kelas,
            jenisUjian: config.jenisUjian || 'UH', // UH, PTS, PAS
            waktu: config.waktu || 60, // menit
            soal: selectedSoal.map((s, idx) => ({
                nomor: idx + 1,
                soalId: s.id,
                pertanyaan: s.pertanyaan,
                tipeSoal: s.tipeSoal,
                opsi: s.opsi,
                skorMaksimal: s.skorMaksimal
            })),
            totalSkor: selectedSoal.reduce((sum, s) => sum + s.skorMaksimal, 0),
            createdAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'paket_soal'), paketData);
        return { success: true, id: docRef.id, data: { id: docRef.id, ...paketData } };
    } catch (error) {
        console.error('Generate paket soal error:', error);
        return { success: false, error: error.message };
    }

}
