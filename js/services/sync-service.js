// ============================================
// SYNC SERVICE - AGSA
// Handles data synchronization between documents
// Single Input -> Multi Output Engine
// ============================================

const SyncService = {
    
    // Reference to Firestore (will be set during init)
    db: null,
    userId: null,
    
    /**
     * Initialize sync service
     */
    init(db, userId) {
        this.db = db;
        this.userId = userId;
    },
    
    // ==========================================
    // ATP SYNC
    // ==========================================
    
    /**
     * Generate ATP from CP data
     */
    async generateATP(mapelData, options = {}) {
        const {
            namaMapel,
            fase,
            kelas,
            semester,
            tahunAjar,
            capaianPembelajaran
        } = mapelData;
        
        // Structure TP from CP
        const alurTP = capaianPembelajaran.map((cp, index) => ({
            urutan: index + 1,
            elemen: cp.elemen,
            cp: cp.cp,
            tp: cp.tujuanPembelajaran.map((tp, tpIndex) => ({
                kode: `TP.${index + 1}.${tpIndex + 1}`,
                deskripsi: tp.deskripsi || tp,
                alokasiWaktu: options.defaultJP || 2,
                dimensiProfil: tp.dimensiProfil || []
            }))
        }));
        
        // Calculate total JP
        const totalJP = alurTP.reduce((sum, item) => {
            return sum + item.tp.reduce((tpSum, tp) => tpSum + tp.alokasiWaktu, 0);
        }, 0);
        
        const atpData = {
            mapelId: mapelData.id || Utils.generateId('mapel'),
            namaMapel,
            fase,
            kelas,
            semester,
            tahunAjar,
            alurTP,
            totalJP,
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return atpData;
    },
    
    /**
     * Save ATP and trigger downstream sync
     */
    async saveATP(atpData) {
        const atpRef = await this.db.collection(`users/${this.userId}/atp`).add(atpData);
        atpData.id = atpRef.id;
        
        // Trigger Prota generation if auto-sync enabled
        if (atpData.autoSync) {
            await this.syncATPtoProta(atpData);
        }
        
        return atpData;
    },
    
    // ==========================================
    // PROTA SYNC
    // ==========================================
    
    /**
     * Generate Prota from ATP
     */
    async generateProta(atpData, kalenderData = null) {
        const { alurTP, namaMapel, kelas, tahunAjar } = atpData;
        
        // Get kalender data if not provided
        if (!kalenderData) {
            const kalenderSnap = await this.db.collection(`users/${this.userId}/kalender`)
                .where('tahunAjar', '==', tahunAjar)
                .limit(1)
                .get();
            
            if (!kalenderSnap.empty) {
                kalenderData = kalenderSnap.docs[0].data();
            }
        }
        
        // Distribute TP to semesters
        const distribusiSemester1 = [];
        const distribusiSemester2 = [];
        
        let totalJPSem1 = 0;
        let totalJPSem2 = 0;
        
        // Simple distribution: first half to semester 1, second half to semester 2
        const midPoint = Math.ceil(alurTP.length / 2);
        
        alurTP.forEach((item, index) => {
            const distribusi = {
                urutan: index + 1,
                elemen: item.elemen,
                tp: item.tp.map(tp => tp.deskripsi).join('; '),
                alokasiWaktu: item.tp.reduce((sum, tp) => sum + tp.alokasiWaktu, 0),
                bulan: this.assignMonths(index, alurTP.length, kalenderData)
            };
            
            if (index < midPoint) {
                distribusiSemester1.push(distribusi);
                totalJPSem1 += distribusi.alokasiWaktu;
            } else {
                distribusiSemester2.push(distribusi);
                totalJPSem2 += distribusi.alokasiWaktu;
            }
        });
        
        const protaData = {
            atpId: atpData.id,
            mapelId: atpData.mapelId,
            namaMapel,
            kelas,
            tahunAjar,
            distribusiSemester1,
            distribusiSemester2,
            totalJPSemester1: totalJPSem1,
            totalJPSemester2: totalJPSem2,
            totalJPTahun: totalJPSem1 + totalJPSem2,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return protaData;
    },
    
    /**
     * Assign months based on position in curriculum
     */
    assignMonths(index, total, kalenderData) {
        const semester1Months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const semester2Months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
        
        const midPoint = Math.ceil(total / 2);
        
        if (index < midPoint) {
            const monthIndex = Math.floor((index / midPoint) * semester1Months.length);
            return [semester1Months[Math.min(monthIndex, semester1Months.length - 1)]];
        } else {
            const adjustedIndex = index - midPoint;
            const remaining = total - midPoint;
            const monthIndex = Math.floor((adjustedIndex / remaining) * semester2Months.length);
            return [semester2Months[Math.min(monthIndex, semester2Months.length - 1)]];
        }
    },
    
    /**
     * Sync ATP to Prota
     */
    async syncATPtoProta(atpData) {
        const protaData = await this.generateProta(atpData);
        const protaRef = await this.db.collection(`users/${this.userId}/prota`).add(protaData);
        protaData.id = protaRef.id;
        
        return protaData;
    },
    
    // ==========================================
    // PROMES SYNC (CORE SYNC ENGINE)
    // ==========================================
    
    /**
     * Generate Promes from Prota + Kalender + Jadwal
     */
    async generatePromes(protaData, semester, kalenderData, jadwalData) {
        const distribusi = semester === '1' ? 
            protaData.distribusiSemester1 : 
            protaData.distribusiSemester2;
        
        // Get semester dates
        const semesterConfig = semester === '1' ? 
            kalenderData.semester1 : 
            kalenderData.semester2;
        
        // Calculate effective weeks
        const mingguEfektif = semesterConfig?.mingguEfektif || 16;
        
        // Get class schedules for this subject
        const mapelSchedules = this.getMapelSchedules(jadwalData, protaData.mapelId);
        
        // Generate detailed weekly breakdown with actual dates
        const detailMingguan = this.generateWeeklyDetail(
            distribusi,
            semesterConfig,
            mapelSchedules,
            kalenderData
        );
        
        const promesData = {
            protaId: protaData.id,
            atpId: protaData.atpId,
            mapelId: protaData.mapelId,
            kalenderId: kalenderData.id,
            jadwalId: jadwalData?.id,
            namaMapel: protaData.namaMapel,
            kelas: protaData.kelas,
            fase: Utils.getFaseFromKelas(protaData.kelas, window.AGSA?.profil?.jenjang || 'SMP'),
            semester,
            tahunAjar: protaData.tahunAjar,
            mingguEfektif,
            totalJP: semester === '1' ? protaData.totalJPSemester1 : protaData.totalJPSemester2,
            detailMingguan,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return promesData;
    },
    
    /**
     * Get schedules for specific mapel
     */
    getMapelSchedules(jadwalData, mapelId) {
        if (!jadwalData || !jadwalData.jadwalHarian) return [];
        
        const schedules = [];
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        days.forEach(hari => {
            const daySchedule = jadwalData.jadwalHarian[hari] || [];
            daySchedule.forEach(slot => {
                if (slot.mapelId === mapelId) {
                    schedules.push({
                        hari,
                        jamKe: slot.jamKe,
                        waktuMulai: slot.waktuMulai,
                        waktuSelesai: slot.waktuSelesai,
                        kelas: slot.kelas
                    });
                }
            });
        });
        
        return schedules;
    },
    
    /**
     * Generate weekly detail with actual dates
     */
    generateWeeklyDetail(distribusi, semesterConfig, schedules, kalenderData) {
        const details = [];
        
        if (!semesterConfig || !semesterConfig.mulai) {
            // Return basic structure without dates
            return distribusi.map((item, index) => ({
                mingguKe: index + 1,
                tanggalMulai: null,
                tanggalSelesai: null,
                tanggalPertemuan: [],
                materi: {
                    elemen: item.elemen,
                    cp: '',
                    tp: [{ kode: `TP.${index + 1}`, deskripsi: item.tp }]
                },
                alokasiJP: item.alokasiWaktu,
                keterangan: ''
            }));
        }
        
        const startDate = new Date(semesterConfig.mulai);
        const endDate = new Date(semesterConfig.selesai);
        
        // Get all holidays
        const holidays = [
            ...(kalenderData.liburNasional || []).map(h => h.tanggal),
            ...(kalenderData.liburLokal || []).map(h => h.tanggal)
        ];
        
        let currentWeek = 0;
        let currentDate = new Date(startDate);
        
        // Move to Monday of first week
        while (currentDate.getDay() !== 1) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        distribusi.forEach((item, index) => {
            const weeksNeeded = Math.ceil(item.alokasiWaktu / (schedules.length * 2)); // Assuming 2 JP per meeting
            
            for (let w = 0; w < weeksNeeded && currentDate <= endDate; w++) {
                currentWeek++;
                
                const weekStart = new Date(currentDate);
                const weekEnd = new Date(currentDate);
                weekEnd.setDate(weekEnd.getDate() + 6);
                
                // Get actual meeting dates for this week
                const tanggalPertemuan = [];
                schedules.forEach(schedule => {
                    const dayIndex = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].indexOf(schedule.hari);
                    const meetingDate = new Date(weekStart);
                    meetingDate.setDate(weekStart.getDate() + (dayIndex - weekStart.getDay() + 7) % 7);
                    
                    // Check if not a holiday
                    const dateStr = Utils.formatDate(meetingDate, 'YYYY-MM-DD');
                    if (!holidays.includes(dateStr) && meetingDate <= endDate) {
                        tanggalPertemuan.push(meetingDate);
                    }
                });
                
                details.push({
                    mingguKe: currentWeek,
                    tanggalMulai: weekStart,
                    tanggalSelesai: weekEnd,
                    tanggalPertemuan,
                    materi: {
                        elemen: item.elemen,
                        cp: '',
                        tp: [{ kode: `TP.${index + 1}`, deskripsi: item.tp }]
                    },
                    alokasiJP: Math.min(item.alokasiWaktu, tanggalPertemuan.length * 2),
                    keterangan: ''
                });
                
                // Move to next week
                currentDate.setDate(currentDate.getDate() + 7);
            }
        });
        
        return details;
    },
    
    // ==========================================
    // MODUL AJAR SYNC
    // ==========================================
    
    /**
     * Generate Modul Ajar from Promes
     */
    async generateModulAjar(promesData, mingguKe, options = {}) {
        const weekData = promesData.detailMingguan.find(w => w.mingguKe === mingguKe);
        
        if (!weekData) {
            throw new Error(`Week ${mingguKe} not found in Promes`);
        }
        
        // Get profil for school info
        const profilSnap = await this.db.collection(`users/${this.userId}/profil`).limit(1).get();
        const profil = profilSnap.empty ? {} : profilSnap.docs[0].data();
        
        const modulAjarData = {
            promesId: promesData.id,
            mapelId: promesData.mapelId,
            namaMapel: promesData.namaMapel,
            kelas: promesData.kelas,
            fase: promesData.fase,
            semester: promesData.semester,
            tahunAjar: promesData.tahunAjar,
            pertemuanKe: mingguKe,
            tanggalPertemuan: weekData.tanggalPertemuan[0] || null,
            
            // School info from profil
            identitasSekolah: {
                penyusun: profil.namaGuru || '',
                instansi: profil.namaSatuan || '',
                tahunPenyusunan: new Date().getFullYear()
            },
            
            // TP synced from Promes
            tujuanPembelajaran: weekData.materi.tp,
            
            // Default P5 dimensions
            profilPelajarPancasila: options.dimensiProfil || ['Bernalar Kritis', 'Mandiri'],
            
            // Default sections
            saranaPrasarana: options.saranaPrasarana || '',
            targetPesertaDidik: options.targetPesertaDidik || 'Peserta didik reguler',
            modelPembelajaran: options.modelPembelajaran || 'Tatap Muka',
            
            pemahamanBermakna: options.pemahamanBermakna || '',
            pertanyaanPemantik: options.pertanyaanPemantik || '',
            
            kegiatanPembelajaran: {
                pendahuluan: {
                    durasi: options.durasiPendahuluan || 10,
                    kegiatan: options.kegiatanPendahuluan || 'Salam, doa, apersepsi, menyampaikan tujuan pembelajaran'
                },
                inti: {
                    durasi: options.durasiInti || 60,
                    kegiatan: options.kegiatanInti || ''
                },
                penutup: {
                    durasi: options.durasiPenutup || 10,
                    kegiatan: options.kegiatanPenutup || 'Refleksi, kesimpulan, doa penutup'
                }
            },
            
            asesmen: {
                formatif: options.asesmenFormatif || '',
                sumatif: options.asesmenSumatif || ''
            },
            
            pengayaanRemedial: options.pengayaanRemedial || '',
            refleksiGuru: '',
            refleksiPesertaDidik: '',
            
            bahanAjar: options.bahanAjar || '',
            glosarium: options.glosarium || '',
            daftarPustaka: options.daftarPustaka || '',
            
            // LKPD option
            lkpdEnabled: options.lkpdEnabled || false,
            lkpdId: null,
            
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return modulAjarData;
    },
    
    // ==========================================
    // JURNAL SYNC (AUTO GENERATED)
    // ==========================================
    
    /**
     * Generate Jurnal from Promes + Absensi
     */
    async generateJurnal(promesData, absensiData, options = {}) {
        const jurnalEntries = [];
        
        // Get profil for signatures
        const profilSnap = await this.db.collection(`users/${this.userId}/profil`).limit(1).get();
        const profil = profilSnap.empty ? {} : profilSnap.docs[0].data();
        
        promesData.detailMingguan.forEach(week => {
            week.tanggalPertemuan.forEach((tanggal, index) => {
                // Find matching absensi
                const dateStr = Utils.formatDate(tanggal, 'YYYY-MM-DD');
                const absensi = absensiData.find(a => 
                    Utils.formatDate(a.tanggal, 'YYYY-MM-DD') === dateStr
                );
                
                const jurnalEntry = {
                    promesId: promesData.id,
                    modulAjarId: null, // Will be linked if modul ajar exists
                    
                    // Auto from profil & mapel
                    mataPelajaran: promesData.namaMapel,
                    semester: promesData.semester,
                    tahunAjar: promesData.tahunAjar,
                    kelas: promesData.kelas,
                    fase: promesData.fase,
                    
                    // Auto from promes
                    tanggal: tanggal,
                    hari: Utils.getDayName(tanggal),
                    jamKe: options.jamKe || '1-2',
                    
                    // Materi from promes
                    materi: week.materi.tp.map(tp => tp.deskripsi).join(', '),
                    elemen: week.materi.elemen,
                    cp: week.materi.cp,
                    
                    // TP auto from promes
                    tujuanPembelajaran: week.materi.tp,
                    
                    // Kehadiran from absensi
                    kehadiran: absensi ? absensi.rekapitulasi : {
                        hadir: 0,
                        sakit: 0,
                        izin: 0,
                        alpha: 0,
                        total: 0
                    },
                    
                    // To be filled by teacher
                    hasilPembelajaran: '',
                    keterangan: '',
                    
                    // Auto signatures
                    ttdGuru: profil.linkTTDGuru || '',
                    ttdKepalaSekolah: profil.linkTTDKepalaSekolah || '',
                    tanggalPengesahan: Utils.getTanggalPengesahan(
                        tanggal.getMonth() + 1, 
                        tanggal.getFullYear()
                    ),
                    
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                jurnalEntries.push(jurnalEntry);
            });
        });
        
        return jurnalEntries;
    },
    
    // ==========================================
    // KKTP SYNC
    // ==========================================
    
    /**
     * Generate KKTP from Promes TP
     */
    async generateKKTP(promesData, kelasId, siswaList) {
        // Extract all TP from Promes
        const allTP = [];
        promesData.detailMingguan.forEach(week => {
            week.materi.tp.forEach(tp => {
                if (!allTP.find(t => t.kode === tp.kode)) {
                    allTP.push({
                        kode: tp.kode,
                        deskripsi: tp.deskripsi,
                        kriteria: {
                            mulai: { min: 0, max: 59, label: 'Mulai Berkembang' },
                            sedang: { min: 60, max: 79, label: 'Sedang Berkembang' },
                            mahir: { min: 80, max: 100, label: 'Sudah Berkembang' }
                        }
                    });
                }
            });
        });
        
        // Generate nilai structure for each siswa
        const nilaiSiswa = siswaList.map(siswa => ({
            siswaId: siswa.id,
            namaSiswa: siswa.nama,
            nilaiPerTP: {},
            rataRata: 0,
            statusAkhir: '',
            kktpAkhir: 0
        }));
        
        const kktpData = {
            promesId: promesData.id,
            mapelId: promesData.mapelId,
            kelasId,
            namaMapel: promesData.namaMapel,
            kelas: promesData.kelas,
            semester: promesData.semester,
            tahunAjar: promesData.tahunAjar,
            tujuanPembelajaran: allTP,
            nilaiSiswa,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        return kktpData;
    },
    
    /**
     * Calculate KKTP final values
     */
    calculateKKTPValues(kktpData) {
        kktpData.nilaiSiswa = kktpData.nilaiSiswa.map(siswa => {
            const tpValues = Object.values(siswa.nilaiPerTP);
            
            if (tpValues.length === 0) {
                return siswa;
            }
            
            // Calculate average
            const totalNilai = tpValues.reduce((sum, tp) => sum + (tp.nilai || 0), 0);
            const rataRata = totalNilai / tpValues.length;
            
            // Determine status
            let statusAkhir = 'Mulai Berkembang';
            if (rataRata >= 80) {
                statusAkhir = 'Sudah Berkembang';
            } else if (rataRata >= 60) {
                statusAkhir = 'Sedang Berkembang';
            }
            
            return {
                ...siswa,
                rataRata: Utils.round(rataRata, 2),
                statusAkhir,
                kktpAkhir: Utils.round(rataRata, 0)
            };
        });
        
        return kktpData;
    },
    
    // ==========================================
    // DAFTAR NILAI SYNC
    // ==========================================
    
    /**
     * Generate Daftar Nilai structure
     */
    generateDaftarNilai(mapelData, kelasId, siswaList, komponenNilai = null) {
        const defaultKomponen = {
            sumatif: { enabled: true, label: 'Sumatif', bobot: 40 },
            ats: { enabled: true, label: 'ATS', bobot: 20 },
            asas: { enabled: true, label: 'ASAS', bobot: 40 }
        };
        
        const nilaiSiswa = siswaList.map(siswa => ({
            siswaId: siswa.id,
            namaSiswa: siswa.nama,
            sumatif: { rataRata: 0 },
            ats: 0,
            asas: 0,
            nilaiRapor: 0,
            predikat: '',
            deskripsi: ''
        }));
        
        return {
            mapelId: mapelData.id,
            kelasId,
            namaMapel: mapelData.nama,
            kelas: mapelData.kelas,
            semester: mapelData.semester,
            tahunAjar: mapelData.tahunAjar,
            komponenNilai: komponenNilai || defaultKomponen,
            sumatifDetail: [
                { kode: 'S1', nama: 'Sumatif 1' },
                { kode: 'S2', nama: 'Sumatif 2' },
                { kode: 'S3', nama: 'Sumatif 3' }
            ],
            nilaiSiswa,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },
    
    /**
     * Calculate Nilai Rapor
     */
    calculateNilaiRapor(nilaiData) {
        const { komponenNilai } = nilaiData;
        
        nilaiData.nilaiSiswa = nilaiData.nilaiSiswa.map(siswa => {
            let totalBobot = 0;
            let totalNilai = 0;
            
            // Sumatif
            if (komponenNilai.sumatif.enabled && siswa.sumatif.rataRata > 0) {
                totalNilai += siswa.sumatif.rataRata * (komponenNilai.sumatif.bobot / 100);
                totalBobot += komponenNilai.sumatif.bobot;
            }
            
            // ATS
            if (komponenNilai.ats.enabled && siswa.ats > 0) {
                totalNilai += siswa.ats * (komponenNilai.ats.bobot / 100);
                totalBobot += komponenNilai.ats.bobot;
            }
            
            // ASAS
            if (komponenNilai.asas.enabled && siswa.asas > 0) {
                totalNilai += siswa.asas * (komponenNilai.asas.bobot / 100);
                totalBobot += komponenNilai.asas.bobot;
            }
            
            // Normalize if not all components are filled
            const nilaiRapor = totalBobot > 0 ? (totalNilai / totalBobot) * 100 : 0;
            const { grade, predikat } = Utils.getGrade(nilaiRapor);
            
            return {
                ...siswa,
                nilaiRapor: Utils.round(nilaiRapor, 2),
                predikat: grade,
                deskripsi: `Ananda ${predikat.toLowerCase()} dalam mata pelajaran ini.`
            };
        });
        
        return nilaiData;
    },
    
    // ==========================================
    // BATCH SYNC OPERATIONS
    // ==========================================
    
    /**
     * Full sync from ATP to all downstream documents
     */
    async fullSync(atpData, options = {}) {
        const results = {
            atp: null,
            prota: null,
            promes: [],
            modulAjar: [],
            jurnal: [],
            kktp: null
        };
        
        try {
            // 1. Save ATP
            results.atp = await this.saveATP(atpData);
            
            // 2. Generate and save Prota
            const protaData = await this.generateProta(atpData);
            const protaRef = await this.db.collection(`users/${this.userId}/prota`).add(protaData);
            protaData.id = protaRef.id;
            results.prota = protaData;
            
            // 3. Get Kalender and Jadwal
            const kalenderSnap = await this.db.collection(`users/${this.userId}/kalender`)
                .where('tahunAjar', '==', atpData.tahunAjar)
                .limit(1)
                .get();
            
            const jadwalSnap = await this.db.collection(`users/${this.userId}/jadwal`)
                .where('tahunAjar', '==', atpData.tahunAjar)
                .limit(1)
                .get();
            
            const kalenderData = kalenderSnap.empty ? null : { id: kalenderSnap.docs[0].id, ...kalenderSnap.docs[0].data() };
            const jadwalData = jadwalSnap.empty ? null : { id: jadwalSnap.docs[0].id, ...jadwalSnap.docs[0].data() };
            
            if (kalenderData) {
                // 4. Generate Promes for both semesters
                for (const sem of ['1', '2']) {
                    const promesData = await this.generatePromes(protaData, sem, kalenderData, jadwalData);
                    const promesRef = await this.db.collection(`users/${this.userId}/promes`).add(promesData);
                    promesData.id = promesRef.id;
                    results.promes.push(promesData);
                    
                    // 5. Generate Modul Ajar for each week (if option enabled)
                    if (options.generateModulAjar) {
                        for (const week of promesData.detailMingguan) {
                            const modulData = await this.generateModulAjar(promesData, week.mingguKe, options.modulOptions);
                            const modulRef = await this.db.collection(`users/${this.userId}/modulAjar`).add(modulData);
                            modulData.id = modulRef.id;
                            results.modulAjar.push(modulData);
                        }
                    }
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('Full sync error:', error);
            throw error;
        }
    },
    
    /**
     * Update all downstream documents when ATP changes
     */
    async cascadeUpdate(atpId, changes) {
        // Find all related documents
        const protaSnap = await this.db.collection(`users/${this.userId}/prota`)
            .where('atpId', '==', atpId)
            .get();
        
        for (const protaDoc of protaSnap.docs) {
            // Update Prota
            await protaDoc.ref.update({
                ...changes,
                updatedAt: new Date()
            });
            
            // Find related Promes
            const promesSnap = await this.db.collection(`users/${this.userId}/promes`)
                .where('protaId', '==', protaDoc.id)
                .get();
            
            for (const promesDoc of promesSnap.docs) {
                await promesDoc.ref.update({
                    ...changes,
                    updatedAt: new Date()
                });
            }
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncService;
}