// ============================================
// CALENDAR SERVICE - AGSA
// Handles calendar, holidays, and effective days
// ============================================

const CalendarService = {
    
    // Default holidays (can be updated)
    defaultHolidays: [],
    
    /**
     * Initialize with default holidays
     */
    init(holidays = []) {
        this.defaultHolidays = holidays.length > 0 ? holidays : DEFAULT_HOLIDAYS_2024_2025;
    },
    
    /**
     * Generate full calendar structure for academic year
     */
    generateAcademicCalendar(tahunAwal, jenjang, customHolidays = []) {
        const tahunAkhir = tahunAwal + 1;
        
        // Combine default and custom holidays
        const allHolidays = [
            ...this.defaultHolidays,
            ...customHolidays
        ];
        
        // Academic year months (July - June)
        const months = [];
        
        // July - December (tahunAwal)
        for (let m = 6; m <= 11; m++) {
            months.push(this.generateMonthData(tahunAwal, m, allHolidays));
        }
        
        // January - June (tahunAkhir)
        for (let m = 0; m <= 5; m++) {
            months.push(this.generateMonthData(tahunAkhir, m, allHolidays));
        }
        
        // Calculate semester dates
        const semester1 = {
            mulai: new Date(tahunAwal, 6, 15), // Mid July
            selesai: new Date(tahunAwal, 11, 20), // Late December
            mingguEfektif: this.calculateEffectiveWeeks(
                new Date(tahunAwal, 6, 15),
                new Date(tahunAwal, 11, 20),
                allHolidays
            )
        };
        
        const semester2 = {
            mulai: new Date(tahunAkhir, 0, 2), // Early January
            selesai: new Date(tahunAkhir, 5, 20), // Late June
            mingguEfektif: this.calculateEffectiveWeeks(
                new Date(tahunAkhir, 0, 2),
                new Date(tahunAkhir, 5, 20),
                allHolidays
            ),
            kelasAkhirSelesai: this.getKelasAkhirEndDate(tahunAkhir, jenjang)
        };
        
        return {
            tahunAjar: `${tahunAwal}/${tahunAkhir}`,
            jenjang,
            months,
            semester1,
            semester2,
            liburNasional: allHolidays.filter(h => h.isDefault),
            liburLokal: allHolidays.filter(h => !h.isDefault),
            eventAkademik: this.generateDefaultEvents(tahunAwal, tahunAkhir)
        };
    },
    
    /**
     * Generate month data
     */
    generateMonthData(year, monthIndex, holidays) {
        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Calculate effective days (Mon-Sat, excluding holidays)
        let effectiveDays = 0;
        const holidayDates = holidays.map(h => h.tanggal);
        
        for (let d = 1; d <= totalDays; d++) {
            const date = new Date(year, monthIndex, d);
            const dateStr = Utils.formatDate(date, 'YYYY-MM-DD');
            const dayOfWeek = date.getDay();
            
            // Count Mon-Sat (1-6), excluding Sunday (0) and holidays
            if (dayOfWeek !== 0 && !holidayDates.includes(dateStr)) {
                effectiveDays++;
            }
        }
        
        return {
            year,
            month: monthIndex,
            name: Utils.getMonthName(monthIndex),
            totalDays,
            effectiveDays,
            holidays: holidays.filter(h => {
                const hDate = new Date(h.tanggal);
                return hDate.getMonth() === monthIndex && hDate.getFullYear() === year;
            })
        };
    },
    
    /**
     * Calculate effective weeks between two dates
     */
    calculateEffectiveWeeks(startDate, endDate, holidays = []) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let weeks = 0;
        let current = new Date(start);
        
        // Move to Monday of first week
        while (current.getDay() !== 1 && current <= end) {
            current.setDate(current.getDate() + 1);
        }
        
        const holidayDates = holidays.map(h => h.tanggal);
        
        while (current <= end) {
            // Check if this week has at least 3 effective days
            let effectiveDaysThisWeek = 0;
            
            for (let d = 0; d < 7 && current <= end; d++) {
                const dateStr = Utils.formatDate(current, 'YYYY-MM-DD');
                const dayOfWeek = current.getDay();
                
                if (dayOfWeek !== 0 && !holidayDates.includes(dateStr)) {
                    effectiveDaysThisWeek++;
                }
                
                current.setDate(current.getDate() + 1);
            }
            
            if (effectiveDaysThisWeek >= 3) {
                weeks++;
            }
        }
        
        return weeks;
    },
    
    /**
     * Get end date for final grade classes
     */
    getKelasAkhirEndDate(year, jenjang) {
        // Final grades typically end earlier for exam preparation
        // Usually around April-May
        const endDates = {
            SD: new Date(year, 4, 15),   // Mid May
            SMP: new Date(year, 4, 10),   // Early May
            SMA: new Date(year, 3, 20),   // Late April
            SMK: new Date(year, 3, 20)    // Late April
        };
        
        return endDates[jenjang] || new Date(year, 4, 15);
    },
    
    /**
     * Generate default academic events
     */
    generateDefaultEvents(tahunAwal, tahunAkhir) {
        return [
            {
                nama: 'Awal Tahun Pelajaran',
                tanggalMulai: new Date(tahunAwal, 6, 15),
                tanggalSelesai: new Date(tahunAwal, 6, 15),
                tipe: 'Lainnya'
            },
            {
                nama: 'Penilaian Tengah Semester 1',
                tanggalMulai: new Date(tahunAwal, 8, 18),
                tanggalSelesai: new Date(tahunAwal, 8, 23),
                tipe: 'PTS'
            },
            {
                nama: 'Penilaian Akhir Semester 1',
                tanggalMulai: new Date(tahunAwal, 11, 2),
                tanggalSelesai: new Date(tahunAwal, 11, 10),
                tipe: 'PAS'
            },
            {
                nama: 'Libur Semester 1',
                tanggalMulai: new Date(tahunAwal, 11, 23),
                tanggalSelesai: new Date(tahunAkhir, 0, 1),
                tipe: 'Libur'
            },
            {
                nama: 'Penilaian Tengah Semester 2',
                tanggalMulai: new Date(tahunAkhir, 2, 10),
                tanggalSelesai: new Date(tahunAkhir, 2, 15),
                tipe: 'PTS'
            },
            {
                nama: 'Penilaian Akhir Tahun',
                tanggalMulai: new Date(tahunAkhir, 4, 26),
                tanggalSelesai: new Date(tahunAkhir, 5, 5),
                tipe: 'PAT'
            },
            {
                nama: 'Libur Semester 2',
                tanggalMulai: new Date(tahunAkhir, 5, 23),
                tanggalSelesai: new Date(tahunAkhir, 6, 14),
                tipe: 'Libur'
            }
        ];
    },
    
    /**
     * Check if date is a school day
     */
    isSchoolDay(date, holidays = [], schoolDays = [1, 2, 3, 4, 5, 6]) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const dateStr = Utils.formatDate(d, 'YYYY-MM-DD');
        
        const holidayDates = holidays.map(h => 
            typeof h === 'string' ? h : h.tanggal
        );
        
        return schoolDays.includes(dayOfWeek) && !holidayDates.includes(dateStr);
    },
    
    /**
     * Get next school day
     */
    getNextSchoolDay(date, holidays = []) {
        let d = new Date(date);
        d.setDate(d.getDate() + 1);
        
        while (!this.isSchoolDay(d, holidays)) {
            d.setDate(d.getDate() + 1);
        }
        
        return d;
    },
    
    /**
     * Get all school days between two dates
     */
    getSchoolDaysBetween(startDate, endDate, holidays = []) {
        const days = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        while (current <= end) {
            if (this.isSchoolDay(current, holidays)) {
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    },
    
    /**
     * Get meeting dates for specific schedule
     */
    getMeetingDates(startDate, endDate, dayOfWeek, holidays = []) {
        const dates = [];
        let current = new Date(startDate);
        const end = new Date(endDate);
        
        // Find first occurrence of the day
        while (current.getDay() !== dayOfWeek && current <= end) {
            current.setDate(current.getDate() + 1);
        }
        
        // Collect all occurrences
        while (current <= end) {
            if (this.isSchoolDay(current, holidays)) {
                dates.push(new Date(current));
            }
            current.setDate(current.getDate() + 7);
        }
        
        return dates;
    },
    
    /**
     * Add holiday to calendar
     */
    addHoliday(calendarData, holiday) {
        if (holiday.isDefault) {
            calendarData.liburNasional.push(holiday);
        } else {
            calendarData.liburLokal.push(holiday);
        }
        
        // Recalculate effective days for affected month
        const hDate = new Date(holiday.tanggal);
        const monthData = calendarData.months.find(m => 
            m.year === hDate.getFullYear() && m.month === hDate.getMonth()
        );
        
        if (monthData) {
            monthData.effectiveDays--;
            monthData.holidays.push(holiday);
        }
        
        return calendarData;
    },
    
    /**
     * Remove holiday from calendar
     */
    removeHoliday(calendarData, tanggal) {
        const hDate = new Date(tanggal);
        
        // Remove from appropriate list
        calendarData.liburNasional = calendarData.liburNasional.filter(h => h.tanggal !== tanggal);
        calendarData.liburLokal = calendarData.liburLokal.filter(h => h.tanggal !== tanggal);
        
        // Recalculate effective days
        const monthData = calendarData.months.find(m => 
            m.year === hDate.getFullYear() && m.month === hDate.getMonth()
        );
        
        if (monthData) {
            monthData.effectiveDays++;
            monthData.holidays = monthData.holidays.filter(h => h.tanggal !== tanggal);
        }
        
        return calendarData;
    },
    
    /**
     * Add academic event
     */
    addEvent(calendarData, event) {
        calendarData.eventAkademik.push(event);
        
        // Sort by date
        calendarData.eventAkademik.sort((a, b) => 
            new Date(a.tanggalMulai) - new Date(b.tanggalMulai)
        );
        
        return calendarData;
    },
    
    /**
     * Get events for specific month
     */
    getEventsForMonth(calendarData, year, month) {
        return calendarData.eventAkademik.filter(event => {
            const startDate = new Date(event.tanggalMulai);
            const endDate = new Date(event.tanggalSelesai);
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            
            return (startDate <= monthEnd && endDate >= monthStart);
        });
    },
    
    /**
     * Render calendar as HTML
     */
    renderCalendarHTML(calendarData, selectedMonth = null) {
        const monthData = selectedMonth ? 
            calendarData.months.find(m => m.month === selectedMonth.month && m.year === selectedMonth.year) :
            calendarData.months[0];
        
        if (!monthData) return '<p>Data tidak ditemukan</p>';
        
        const firstDay = new Date(monthData.year, monthData.month, 1);
        const startDay = firstDay.getDay(); // 0 = Sunday
        
        let html = `
            <div class="calendar-grid">
                <div class="calendar-header">
                    <h3>${monthData.name} ${monthData.year}</h3>
                    <p>Hari Efektif: ${monthData.effectiveDays}</p>
                </div>
                <div class="calendar-days grid grid-cols-7 gap-1 text-center text-sm">
                    <div class="font-bold text-red-500">Min</div>
                    <div class="font-bold">Sen</div>
                    <div class="font-bold">Sel</div>
                    <div class="font-bold">Rab</div>
                    <div class="font-bold">Kam</div>
                    <div class="font-bold">Jum</div>
                    <div class="font-bold">Sab</div>
        `;
        
        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            html += '<div class="p-2"></div>';
        }
        
        // Days of month
        const holidayDates = monthData.holidays.map(h => new Date(h.tanggal).getDate());
        
        for (let d = 1; d <= monthData.totalDays; d++) {
            const date = new Date(monthData.year, monthData.month, d);
            const isHoliday = holidayDates.includes(d);
            const isSunday = date.getDay() === 0;
            
            const classes = [
                'p-2 rounded',
                isHoliday ? 'bg-red-100 text-red-600' : '',
                isSunday ? 'text-red-500' : '',
                !isHoliday && !isSunday ? 'hover:bg-blue-50 cursor-pointer' : ''
            ].filter(Boolean).join(' ');
            
            const holiday = monthData.holidays.find(h => new Date(h.tanggal).getDate() === d);
            const title = holiday ? holiday.nama : '';
            
            html += `<div class="${classes}" title="${title}">${d}</div>`;
        }
        
        html += '</div></div>';
        
        return html;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarService;
}