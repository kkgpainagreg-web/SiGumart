/**
 * SYNC SERVICE
 * Handles automatic synchronization between documents
 */

const SyncService = {
    /**
     * Sync Promes with Calendar and Schedule
     */
    async syncPromes(userId, promesId) {
        try {
            // Get promes data
            const promes = await FirestoreService.getDocument('promes', promesId);
            if (!promes) return null;

            // Get calendar
            const calendar = await FirestoreService.getCalendar(userId, promes.tahunAjar);
            if (!calendar) {
                throw new Error('Kalender belum diatur');
            }

            // Get schedule
            const schedules = await FirestoreService.getSchedules(userId, promes.semester);
            const scheduleData = schedules.find(s => 
                s.jadwal?.some(j => j.mapel === promes.mapel && j.kelas === promes.kelas)
            );

            // Calculate weekly details
            const detailMingguan = this.calculateWeeklyDetails(
                promes,
                calendar,
                scheduleData
            );

            // Update promes with synced data
            const updatedPromes = {
                ...promes,
                calendarId: calendar.id,
                scheduleId: scheduleData?.id,
                detailMingguan,
                mingguEfektif: detailMingguan.length,
                rekapJP: this.calculateJPRekap(detailMingguan),
                syncedAt: new Date()
            };

            await FirestoreService.saveDocument('promes', promesId, updatedPromes);
            return updatedPromes;
        } catch (error) {
            console.error('Sync Promes error:', error);
            throw error;
        }
    },

    /**
     * Calculate weekly details based on calendar and schedule
     */
    calculateWeeklyDetails(promes, calendar, schedule) {
        const details = [];
        const semester = promes.semester;
        
        // Get semester dates
        const semesterData = semester === 1 
            ? calendar.semesterGanjil 
            : calendar.semesterGenap;

        if (!semesterData) return details;

        const startDate = new Date(semesterData.mulai);
        const endDate = new Date(semesterData.selesai);
        
        // Combine all holidays
        const holidays = [
            ...(calendar.hariLiburNasional || []).map(h => h.tanggal),
            ...(calendar.hariLiburLokal || []).map(h => h.tanggal)
        ];

        // Get JP per week from schedule
        let jpPerWeek = 2; // default
        if (schedule?.jadwal) {
            const classSchedule = schedule.jadwal.filter(
                j => j.mapel === promes.mapel && j.kelas === promes.kelas
            );
            jpPerWeek = classSchedule.reduce((sum, entry) => {
                const jamCount = (entry.jamKeSelesai || entry.jamKe) - entry.jamKe + 1;
                return sum + jamCount;
            }, 0);
        }

        // Get TP from prota/ATP
        const tpList = promes.distribusi || [];
        let tpIndex = 0;

        // Generate weekly details
        let currentDate = new Date(startDate);
        let mingguKe = 1;

        while (currentDate <= endDate) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Calculate effective days this week
            const hariEfektif = this.getEffectiveDaysInWeek(
                weekStart, 
                weekEnd > endDate ? endDate : weekEnd, 
                holidays
            );

            // Get current TP
            const currentTP = tpList[tpIndex] || {};

            details.push({
                mingguKe,
                tanggalMulai: weekStart.toISOString().split('T')[0],
                tanggalSelesai: (weekEnd > endDate ? endDate : weekEnd).toISOString().split('T')[0],
                hariEfektif,
                jpMingguIni: hariEfektif > 0 ? jpPerWeek : 0,
                materi: currentTP.materi || currentTP.tp || '',
                tp: currentTP.tp || '',
                elemen: currentTP.elemen || '',
                kegiatan: 'Pembelajaran',
                keterangan: hariEfektif === 0 ? 'Libur' : ''
            });

            // Move to next TP if this week has effective days
            if (hariEfektif > 0 && tpIndex < tpList.length - 1) {
                tpIndex++;
            }

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
            mingguKe++;
        }

        return details;
    },

    /**
     * Get effective days in a week
     */
    getEffectiveDaysInWeek(startDate, endDate, holidays) {
        let count = 0;
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            const dateStr = current.toISOString().split('T')[0];

            // Skip Sunday (0) and holidays
            if (dayOfWeek !== 0 && !holidays.includes(dateStr)) {
                count++;
            }

            current.setDate(current.getDate() + 1);
        }

        return count;
    },

    /**
     * Calculate JP recap
     */
    calculateJPRekap(detailMingguan) {
        const total = detailMingguan.reduce((sum, week) => sum + week.jpMingguIni, 0);
        return {
            total,
            terpakai: total, // Will be updated as lessons progress
            sisa: 0
        };
    },

    /**
     * Sync Jurnal from Promes and Absensi
     */
    async syncJurnal(userId, jurnalId) {
        try {
            const jurnal = await FirestoreService.getDocument('jurnal', jurnalId);
            if (!jurnal) return null;

            // Get related promes
            const promes = await FirestoreService.getDocument('promes', jurnal.promesId);
            if (!promes) {
                throw new Error('Promes tidak ditemukan');
            }

            // Get schedule for this class/mapel
            const schedules = await FirestoreService.getSchedules(userId, jurnal.semester);
            const schedule = schedules[0];

            // Get absensi data
            const absensiList = await FirestoreService.getDocuments('absensi', [
                where('userId', '==', userId),
                where('classId', '==', jurnal.classId),
                where('mapel', '==', jurnal.mapel)
            ]);

            // Generate jurnal entries from promes weekly details
            const entries = [];
            
            for (const week of promes.detailMingguan || []) {
                if (week.hariEfektif === 0) continue;

                // Find teaching days for this week
                const teachingDays = this.getTeachingDaysInWeek(
                    week.tanggalMulai,
                    week.tanggalSelesai,
                    schedule,
                    jurnal.kelas,
                    jurnal.mapel
                );

                for (const day of teachingDays) {
                    // Find absensi for this date
                    const absensi = absensiList.find(a => a.tanggal === day.tanggal);
                    const kehadiran = absensi ? {
                        hadir: absensi.kehadiran.filter(k => k.status === 'H').length,
                        sakit: absensi.kehadiran.filter(k => k.status === 'S').length,
                        izin: absensi.kehadiran.filter(k => k.status === 'I').length,
                        alpha: absensi.kehadiran.filter(k => k.status === 'A').length
                    } : { hadir: 0, sakit: 0, izin: 0, alpha: 0 };

                    entries.push({
                        tanggal: day.tanggal,
                        hari: day.hari,
                        jamKe: day.jamKe,
                        materi: week.materi,
                        elemen: week.elemen,
                        tp: week.tp,
                        kehadiran,
                        hasil: '',
                        keterangan: ''
                    });
                }
            }

            // Update jurnal
            const updatedJurnal = {
                ...jurnal,
                entries,
                syncedAt: new Date()
            };

            await FirestoreService.saveDocument('jurnal', jurnalId, updatedJurnal);
            return updatedJurnal;
        } catch (error) {
            console.error('Sync Jurnal error:', error);
            throw error;
        }
    },

    /**
     * Get teaching days in a week based on schedule
     */
    getTeachingDaysInWeek(startDate, endDate, schedule, kelas, mapel) {
        const days = [];
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

        if (!schedule?.jadwal) return days;

        // Find scheduled days for this class/mapel
        const scheduledDays = schedule.jadwal.filter(
            j => j.kelas === kelas && j.mapel === mapel
        );

        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dayName = dayNames[current.getDay()];
            const matchingSchedule = scheduledDays.find(s => s.hari === dayName);

            if (matchingSchedule) {
                days.push({
                    tanggal: current.toISOString().split('T')[0],
                    hari: dayName,
                    jamKe: `${matchingSchedule.jamKe}-${matchingSchedule.jamKeSelesai || matchingSchedule.jamKe}`
                });
            }

            current.setDate(current.getDate() + 1);
        }

        return days;
    },

    /**
     * Sync KKTP from Promes TP
     */
    async syncKKTP(userId, kktpId) {
        try {
            const kktp = await FirestoreService.getDocument('kktp', kktpId);
            if (!kktp) return null;

            // Get promes for this class/mapel
            const promesList = await FirestoreService.getDocuments('promes', [
                where('userId', '==', userId),
                where('mapel', '==', kktp.mapel),
                where('kelas', '==', kktp.kelas),
                where('semester', '==', kktp.semester)
            ]);

            if (promesList.length === 0) {
                throw new Error('Promes tidak ditemukan');
            }

            const promes = promesList[0];

            // Extract unique TPs
            const tpSet = new Set();
            (promes.detailMingguan || []).forEach(week => {
                if (week.tp) tpSet.add(week.tp);
            });

            // Generate KKTP criteria
            const tpArray = Array.from(tpSet);
            const bobotPerTP = Math.floor(100 / tpArray.length);
            
            const kriteria = tpArray.map((tp, index) => ({
                tp,
                indikator: `Indikator untuk ${tp}`,
                skorMaks: 100,
                bobotPersen: index === tpArray.length - 1 
                    ? 100 - (bobotPerTP * (tpArray.length - 1)) 
                    : bobotPerTP,
                keterangan: ''
            }));

            // Update KKTP
            const updatedKKTP = {
                ...kktp,
                promesId: promes.id,
                kriteria,
                syncedAt: new Date()
            };

            await FirestoreService.saveDocument('kktp', kktpId, updatedKKTP);
            return updatedKKTP;
        } catch (error) {
            console.error('Sync KKTP error:', error);
            throw error;
        }
    },

    /**
     * Sync Modul Ajar from Promes
     */
    async generateModulFromPromes(userId, promesId, mingguKe) {
        try {
            const promes = await FirestoreService.getDocument('promes', promesId);
            if (!promes) return null;

            const weekData = promes.detailMingguan?.find(w => w.mingguKe === mingguKe);
            if (!weekData) {
                throw new Error('Data minggu tidak ditemukan');
            }

            // Generate modul ajar template
            const modul = {
                userId,
                promesId,
                tahunAjar: promes.tahunAjar,
                semester: promes.semester,
                mapel: promes.mapel,
                kelas: promes.kelas,
                pertemuanKe: mingguKe,
                aloksiWaktu: `${weekData.jpMingguIni} x 35 menit`,
                tanggal: weekData.tanggalMulai,
                tujuanPembelajaran: weekData.tp,
                elemen: weekData.elemen,
                dimensiProfil: '',
                pemahaman: '',
                pertanyaanPemantik: '',
                kegiatanPembelajaran: {
                    pendahuluan: '- Guru membuka dengan salam dan doa\n- Guru mengecek kehadiran siswa\n- Guru menyampaikan tujuan pembelajaran',
                    inti: '- Guru menjelaskan materi\n- Siswa mengerjakan latihan\n- Diskusi kelas',
                    penutup: '- Guru dan siswa menyimpulkan pembelajaran\n- Guru memberikan tugas\n- Guru menutup dengan doa dan salam'
                },
                asesmen: 'Asesmen formatif melalui pengamatan dan tanya jawab',
                refleksi: '',
                sumberBelajar: 'Buku paket, LKS, dan sumber relevan lainnya',
                hasLKPD: false,
                supportRTL: false,
                createdAt: new Date()
            };

            const modulId = await FirestoreService.saveDocument('modul_ajar', null, modul);
            return { id: modulId, ...modul };
        } catch (error) {
            console.error('Generate Modul error:', error);
            throw error;
        }
    }
};

// Export for use in main app
window.SyncService = SyncService;