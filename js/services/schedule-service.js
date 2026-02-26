// ============================================
// SCHEDULE SERVICE - AGSA
// Handles jadwal pelajaran with conflict detection
// ============================================

const ScheduleService = {
    
    // Default JP duration by jenjang
    defaultDurations: {
        TK: 30,
        SD: 35,
        SMP: 40,
        SMA: 45,
        SMK: 45
    },
    
    /**
     * Generate time slots based on configuration
     */
    generateTimeSlots(config) {
        const {
            durasiPerJam = 40,
            jamMulai = '07:00',
            jumlahJamPerHari = 8,
            waktuIstirahat = [{ setelahJamKe: 3, durasi: 15 }]
        } = config;
        
        const slots = [];
        let [hours, minutes] = jamMulai.split(':').map(Number);
        
        for (let i = 1; i <= jumlahJamPerHari; i++) {
            const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            // Add duration
            minutes += durasiPerJam;
            while (minutes >= 60) {
                hours++;
                minutes -= 60;
            }
            
            const endTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            slots.push({
                jamKe: i,
                waktuMulai: startTime,
                waktuSelesai: endTime
            });
            
            // Check for break after this slot
            const breakConfig = waktuIstirahat.find(b => b.setelahJamKe === i);
            if (breakConfig) {
                minutes += breakConfig.durasi;
                while (minutes >= 60) {
                    hours++;
                    minutes -= 60;
                }
            }
        }
        
        return slots;
    },
    
    /**
     * Create empty schedule structure
     */
    createEmptySchedule(tahunAjar, semester, config) {
        const timeSlots = this.generateTimeSlots(config);
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        const jadwalHarian = {};
        days.forEach(day => {
            jadwalHarian[day] = timeSlots.map(slot => ({
                ...slot,
                kelas: null,
                mataPelajaran: null,
                mapelId: null,
                guruId: null
            }));
        });
        
        return {
            tahunAjar,
            semester,
            konfigurasiJam: config,
            jadwalHarian,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },
    
    /**
     * Add schedule entry with conflict checking
     */
    addScheduleEntry(scheduleData, entry) {
        const { hari, jamKe, kelas, mataPelajaran, mapelId, guruId } = entry;
        
        // Check for conflicts
        const conflicts = this.checkConflicts(scheduleData, entry);
        
        if (conflicts.length > 0) {
            return {
                success: false,
                conflicts,
                message: conflicts.map(c => c.message).join('; ')
            };
        }
        
        // Add entry
        const daySchedule = scheduleData.jadwalHarian[hari];
        const slot = daySchedule.find(s => s.jamKe === jamKe);
        
        if (slot) {
            slot.kelas = kelas;
            slot.mataPelajaran = mataPelajaran;
            slot.mapelId = mapelId;
            slot.guruId = guruId;
        }
        
        scheduleData.updatedAt = new Date();
        
        return {
            success: true,
            conflicts: [],
            message: 'Jadwal berhasil ditambahkan'
        };
    },
    
    /**
     * Remove schedule entry
     */
    removeScheduleEntry(scheduleData, hari, jamKe) {
        const daySchedule = scheduleData.jadwalHarian[hari];
        const slot = daySchedule.find(s => s.jamKe === jamKe);
        
        if (slot) {
            slot.kelas = null;
            slot.mataPelajaran = null;
            slot.mapelId = null;
            slot.guruId = null;
        }
        
        scheduleData.updatedAt = new Date();
        return scheduleData;
    },
    
    /**
     * Check for scheduling conflicts
     */
    checkConflicts(scheduleData, newEntry) {
        const { hari, jamKe, kelas, mapelId, guruId } = newEntry;
        const conflicts = [];
        
        // Get all entries for same day and time
        const daySchedule = scheduleData.jadwalHarian[hari] || [];
        const existingSlot = daySchedule.find(s => s.jamKe === jamKe);
        
        if (!existingSlot) return conflicts;
        
        // Check all days for guru conflicts
        Object.entries(scheduleData.jadwalHarian).forEach(([day, slots]) => {
            slots.forEach(slot => {
                // Skip if no assignment
                if (!slot.guruId) return;
                
                // Conflict Type 1: Same guru at different class at same time
                if (day === hari && 
                    slot.jamKe === jamKe && 
                    slot.guruId === guruId && 
                    slot.kelas !== kelas) {
                    conflicts.push({
                        type: 'GURU_BENTROK',
                        severity: 'error',
                        message: `Guru sudah mengajar di kelas ${slot.kelas} pada ${hari} jam ke-${jamKe}`
                    });
                }
                
                // Conflict Type 2: Same class has different subject at same time
                if (day === hari && 
                    slot.jamKe === jamKe && 
                    slot.kelas === kelas && 
                    slot.mapelId !== mapelId &&
                    slot.mapelId !== null) {
                    conflicts.push({
                        type: 'KELAS_BENTROK',
                        severity: 'error',
                        message: `Kelas ${kelas} sudah ada jadwal ${slot.mataPelajaran} pada ${hari} jam ke-${jamKe}`
                    });
                }
                
                // Conflict Type 3: Duplicate entry (same guru, same mapel, same time)
                if (day === hari && 
                    slot.jamKe === jamKe && 
                    slot.guruId === guruId && 
                    slot.mapelId === mapelId &&
                    slot.kelas === kelas) {
                    conflicts.push({
                        type: 'DUPLIKAT',
                        severity: 'warning',
                        message: `Jadwal ini sudah ada`
                    });
                }
            });
        });
        
        return conflicts;
    },
    
    /**
     * Validate entire schedule
     */
    validateSchedule(scheduleData) {
        const issues = [];
        
        Object.entries(scheduleData.jadwalHarian).forEach(([hari, slots]) => {
            slots.forEach(slot => {
                if (!slot.guruId) return;
                
                // Check conflicts
                const conflicts = this.checkConflicts(scheduleData, {
                    hari,
                    jamKe: slot.jamKe,
                    kelas: slot.kelas,
                    mapelId: slot.mapelId,
                    guruId: slot.guruId
                });
                
                conflicts.forEach(conflict => {
                    if (!issues.find(i => i.message === conflict.message)) {
                        issues.push({
                            hari,
                            jamKe: slot.jamKe,
                            ...conflict
                        });
                    }
                });
            });
        });
        
        return {
            valid: issues.filter(i => i.severity === 'error').length === 0,
            issues
        };
    },
    
    /**
     * Get guru's weekly schedule
     */
    getGuruSchedule(scheduleData, guruId) {
        const guruSchedule = {};
        
        Object.entries(scheduleData.jadwalHarian).forEach(([hari, slots]) => {
            const guruSlots = slots.filter(s => s.guruId === guruId);
            if (guruSlots.length > 0) {
                guruSchedule[hari] = guruSlots;
            }
        });
        
        return guruSchedule;
    },
    
    /**
     * Get kelas schedule
     */
    getKelasSchedule(scheduleData, kelas) {
        const kelasSchedule = {};
        
        Object.entries(scheduleData.jadwalHarian).forEach(([hari, slots]) => {
            const kelasSlots = slots.filter(s => s.kelas === kelas);
            if (kelasSlots.length > 0) {
                kelasSchedule[hari] = kelasSlots;
            }
        });
        
        return kelasSchedule;
    },
    
    /**
     * Get mapel schedule
     */
    getMapelSchedule(scheduleData, mapelId) {
        const mapelSchedule = {};
        
        Object.entries(scheduleData.jadwalHarian).forEach(([hari, slots]) => {
            const mapelSlots = slots.filter(s => s.mapelId === mapelId);
            if (mapelSlots.length > 0) {
                mapelSchedule[hari] = mapelSlots;
            }
        });
        
        return mapelSchedule;
    },
    
    /**
     * Calculate total JP per week for a mapel in a kelas
     */
    calculateWeeklyJP(scheduleData, mapelId, kelas) {
        let totalJP = 0;
        
        Object.values(scheduleData.jadwalHarian).forEach(slots => {
            slots.forEach(slot => {
                if (slot.mapelId === mapelId && slot.kelas === kelas) {
                    totalJP++;
                }
            });
        });
        
        return totalJP;
    },
    
    /**
     * Get teaching dates for specific mapel and kelas
     */
    getTeachingDates(scheduleData, mapelId, kelas, startDate, endDate, holidays = []) {
        const mapelSchedule = this.getMapelSchedule(scheduleData, mapelId);
        const dates = [];
        
        Object.entries(mapelSchedule).forEach(([hari, slots]) => {
            const kelasSlots = slots.filter(s => s.kelas === kelas);
            
            if (kelasSlots.length > 0) {
                const dayIndex = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].indexOf(hari);
                const dayDates = CalendarService.getMeetingDates(startDate, endDate, dayIndex, holidays);
                
                dayDates.forEach(date => {
                    kelasSlots.forEach(slot => {
                        dates.push({
                            tanggal: date,
                            hari,
                            jamKe: slot.jamKe,
                            waktuMulai: slot.waktuMulai,
                            waktuSelesai: slot.waktuSelesai
                        });
                    });
                });
            }
        });
        
        // Sort by date
        dates.sort((a, b) => a.tanggal - b.tanggal);
        
        return dates;
    },
    
    /**
     * Render schedule as HTML table
     */
    renderScheduleHTML(scheduleData, options = {}) {
        const { showEmpty = true, highlightConflicts = true } = options;
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        // Get validation issues for highlighting
        const validation = highlightConflicts ? this.validateSchedule(scheduleData) : { issues: [] };
        
        let html = `
            <table class="w-full border-collapse">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border p-2 w-24">Jam</th>
                        ${days.map(day => `<th class="border p-2">${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Get max slots
        const maxSlots = Math.max(...Object.values(scheduleData.jadwalHarian).map(s => s.length));
        
        for (let i = 0; i < maxSlots; i++) {
            const slot = scheduleData.jadwalHarian['Senin'][i];
            if (!slot) continue;
            
            html += `
                <tr>
                    <td class="border p-2 text-center">
                        <div class="font-medium">Jam ${slot.jamKe}</div>
                        <div class="text-xs text-gray-500">${slot.waktuMulai}-${slot.waktuSelesai}</div>
                    </td>
            `;
            
            days.forEach(day => {
                const daySlot = scheduleData.jadwalHarian[day][i];
                const hasContent = daySlot && daySlot.kelas;
                const hasConflict = validation.issues.some(issue => 
                    issue.hari === day && issue.jamKe === slot.jamKe
                );
                
                const cellClass = hasConflict ? 'bg-red-50 border-red-300' : '';
                
                if (hasContent) {
                    html += `
                        <td class="border p-2 ${cellClass}">
                            <div class="bg-blue-100 rounded p-2 text-center">
                                <div class="font-medium text-blue-800">${daySlot.mataPelajaran}</div>
                                <div class="text-xs text-blue-600">Kelas ${daySlot.kelas}</div>
                            </div>
                        </td>
                    `;
                } else if (showEmpty) {
                    html += `
                        <td class="border p-2 ${cellClass}">
                            <div class="h-12 border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 hover:border-blue-300 hover:bg-blue-50 cursor-pointer">
                                +
                            </div>
                        </td>
                    `;
                } else {
                    html += `<td class="border p-2"></td>`;
                }
            });
            
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        
        return html;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScheduleService;
}