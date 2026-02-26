// ============================================
// UTILITY FUNCTIONS - AGSA
// Common helper functions used across the app
// ============================================

const Utils = {
    
    // ==========================================
    // DATE UTILITIES
    // ==========================================
    
    /**
     * Get current academic year based on current date
     * Academic year starts in July
     */
    getAutoTahunAjar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        
        // Academic year starts in July (month = 6)
        if (month >= 6) { // July - December
            return { tahunAwal: year, tahunAkhir: year + 1 };
        } else { // January - June
            return { tahunAwal: year - 1, tahunAkhir: year };
        }
    },
    
    /**
     * Format tahun ajar string
     */
    formatTahunAjar(tahunAwal) {
        const tahunAkhir = parseInt(tahunAwal) + 1;
        return `${tahunAwal}/${tahunAkhir}`;
    },
    
    /**
     * Get tanggal pengesahan (last working day of month)
     */
    getTanggalPengesahan(bulan, tahun, liburList = []) {
        // Get last day of month
        const lastDay = new Date(tahun, bulan, 0).getDate();
        let tanggal = new Date(tahun, bulan - 1, lastDay);
        
        // Move back if weekend
        while (tanggal.getDay() === 0 || tanggal.getDay() === 6) {
            tanggal.setDate(tanggal.getDate() - 1);
        }
        
        // Check against holiday list
        const tanggalStr = this.formatDate(tanggal, 'YYYY-MM-DD');
        while (liburList.includes(tanggalStr)) {
            tanggal.setDate(tanggal.getDate() - 1);
            // Skip weekends again
            while (tanggal.getDay() === 0 || tanggal.getDay() === 6) {
                tanggal.setDate(tanggal.getDate() - 1);
            }
        }
        
        return tanggal;
    },
    
    /**
     * Format date to various formats
     */
    formatDate(date, format = 'DD/MM/YYYY') {
        if (!date) return '';
        
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                           'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD MMMM YYYY':
                return `${d.getDate()} ${monthNames[d.getMonth()]} ${year}`;
            case 'dddd, DD MMMM YYYY':
                return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${year}`;
            case 'MMMM YYYY':
                return `${monthNames[d.getMonth()]} ${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    },
    
    /**
     * Get day name in Indonesian
     */
    getDayName(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const d = date instanceof Date ? date : new Date(date);
        return days[d.getDay()];
    },
    
    /**
     * Get month name in Indonesian
     */
    getMonthName(monthIndex) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[monthIndex];
    },
    
    /**
     * Calculate effective days in a month
     */
    calculateEffectiveDays(year, month, holidays = [], schoolDays = [1, 2, 3, 4, 5, 6]) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let effectiveDays = 0;
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateStr = this.formatDate(d, 'YYYY-MM-DD');
            
            // Check if it's a school day and not a holiday
            if (schoolDays.includes(dayOfWeek) && !holidays.includes(dateStr)) {
                effectiveDays++;
            }
        }
        
        return effectiveDays;
    },
    
    /**
     * Calculate effective weeks between two dates
     */
    calculateEffectiveWeeks(startDate, endDate, holidays = []) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Subtract holidays
        const holidayCount = holidays.filter(h => {
            const hDate = new Date(h);
            return hDate >= start && hDate <= end;
        }).length;
        
        return Math.floor((diffDays - holidayCount) / 7);
    },
    
    /**
     * Get dates for specific day in date range
     */
    getDatesForDay(startDate, endDate, dayOfWeek) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Find first occurrence
        const current = new Date(start);
        while (current.getDay() !== dayOfWeek) {
            current.setDate(current.getDate() + 1);
        }
        
        // Collect all occurrences
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 7);
        }
        
        return dates;
    },
    
    // ==========================================
    // CSV UTILITIES
    // ==========================================
    
    /**
     * Parse CSV text to array of objects
     */
    parseCSV(csvText, delimiter = ';') {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return { headers: [], data: [] };
        
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line, delimiter);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            data.push(row);
        }
        
        return { headers, data };
    },
    
    /**
     * Parse a single CSV line handling quoted values
     */
    parseCSVLine(line, delimiter = ';') {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    },
    
    /**
     * Convert array of objects to CSV string
     */
    toCSV(data, headers = null, delimiter = ';') {
        if (!data || data.length === 0) return '';
        
        const cols = headers || Object.keys(data[0]);
        const csvRows = [cols.join(delimiter)];
        
        data.forEach(row => {
            const values = cols.map(col => {
                const val = row[col] || '';
                // Escape quotes and wrap in quotes if contains delimiter
                if (val.toString().includes(delimiter) || val.toString().includes('"')) {
                    return `"${val.toString().replace(/"/g, '""')}"`;
                }
                return val;
            });
            csvRows.push(values.join(delimiter));
        });
        
        return csvRows.join('\n');
    },
    
    /**
     * Fetch CSV from URL
     */
    async fetchCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();
            return this.parseCSV(text);
        } catch (error) {
            console.error('Error fetching CSV:', error);
            throw error;
        }
    },
    
    /**
     * Download CSV file
     */
    downloadCSV(data, filename, headers = null) {
        const csv = this.toCSV(data, headers);
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    // ==========================================
    // VALIDATION UTILITIES
    // ==========================================
    
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Validate NPSN (8 digits)
     */
    isValidNPSN(npsn) {
        return /^\d{8}$/.test(npsn);
    },
    
    /**
     * Validate NIP (18 digits)
     */
    isValidNIP(nip) {
        return /^\d{18}$/.test(nip);
    },
    
    /**
     * Validate NISN (10 digits)
     */
    isValidNISN(nisn) {
        return /^\d{10}$/.test(nisn);
    },
    
    /**
     * Check for schedule conflicts
     */
    checkScheduleConflict(existingSchedules, newSchedule) {
        const conflicts = [];
        
        existingSchedules.forEach(existing => {
            // Same teacher at different class at same time
            if (existing.guruId === newSchedule.guruId && 
                existing.hari === newSchedule.hari && 
                existing.jamKe === newSchedule.jamKe &&
                existing.kelasId !== newSchedule.kelasId) {
                conflicts.push({
                    type: 'GURU_BENTROK',
                    message: `Guru sudah mengajar di kelas ${existing.namaKelas} pada jam yang sama`
                });
            }
            
            // Same class has different subject at same time
            if (existing.kelasId === newSchedule.kelasId && 
                existing.hari === newSchedule.hari && 
                existing.jamKe === newSchedule.jamKe &&
                existing.mapelId !== newSchedule.mapelId) {
                conflicts.push({
                    type: 'KELAS_BENTROK',
                    message: `Kelas ${existing.namaKelas} sudah ada jadwal ${existing.namaMapel} pada jam yang sama`
                });
            }
            
            // Same teacher teaches same subject at same time (duplicate)
            if (existing.guruId === newSchedule.guruId && 
                existing.hari === newSchedule.hari && 
                existing.jamKe === newSchedule.jamKe &&
                existing.mapelId === newSchedule.mapelId) {
                conflicts.push({
                    type: 'DUPLIKAT',
                    message: `Jadwal duplikat terdeteksi`
                });
            }
        });
        
        return conflicts;
    },
    
    // ==========================================
    // STRING UTILITIES
    // ==========================================
    
    /**
     * Generate unique ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
    },
    
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    /**
     * Title case
     */
    titleCase(str) {
        if (!str) return '';
        return str.split(' ').map(word => this.capitalize(word)).join(' ');
    },
    
    /**
     * Truncate string with ellipsis
     */
    truncate(str, maxLength = 50) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    },
    
    /**
     * Slugify string
     */
    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    },
    
    // ==========================================
    // NUMBER UTILITIES
    // ==========================================
    
    /**
     * Format number with thousand separator
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    },
    
    /**
     * Format currency (Rupiah)
     */
    formatRupiah(num) {
        return 'Rp ' + this.formatNumber(num);
    },
    
    /**
     * Calculate percentage
     */
    percentage(value, total, decimals = 1) {
        if (total === 0) return 0;
        return ((value / total) * 100).toFixed(decimals);
    },
    
    /**
     * Round to decimals
     */
    round(num, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
    },
    
    /**
     * Calculate grade from score
     */
    getGrade(score) {
        if (score >= 90) return { grade: 'A', predikat: 'Sangat Baik' };
        if (score >= 80) return { grade: 'B', predikat: 'Baik' };
        if (score >= 70) return { grade: 'C', predikat: 'Cukup' };
        if (score >= 60) return { grade: 'D', predikat: 'Kurang' };
        return { grade: 'E', predikat: 'Sangat Kurang' };
    },
    
    // ==========================================
    // DOM UTILITIES
    // ==========================================
    
    /**
     * Query selector shorthand
     */
    $(selector) {
        return document.querySelector(selector);
    },
    
    /**
     * Query selector all shorthand
     */
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    /**
     * Create element with attributes
     */
    createElement(tag, attributes = {}, innerHTML = '') {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else {
                el.setAttribute(key, value);
            }
        });
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    },
    
    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // ==========================================
    // STORAGE UTILITIES
    // ==========================================
    
    /**
     * Safe localStorage get
     */
    getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    
    /**
     * Safe localStorage set
     */
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Remove from localStorage
     */
    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },
    
    // ==========================================
    // PHASE/KELAS UTILITIES
    // ==========================================
    
    /**
     * Get fase from kelas and jenjang
     */
    getFaseFromKelas(kelas, jenjang) {
        const kelasNum = parseInt(kelas);
        
        if (jenjang === 'SD') {
            if (kelasNum <= 2) return 'A';
            if (kelasNum <= 4) return 'B';
            return 'C';
        }
        
        if (jenjang === 'SMP') {
            return 'D';
        }
        
        if (jenjang === 'SMA' || jenjang === 'SMK') {
            if (kelasNum === 10) return 'E';
            return 'F';
        }
        
        return '';
    },
    
    /**
     * Get kelas options based on jenjang
     */
    getKelasOptions(jenjang) {
        switch (jenjang) {
            case 'SD': return ['1', '2', '3', '4', '5', '6'];
            case 'SMP': return ['7', '8', '9'];
            case 'SMA':
            case 'SMK': return ['10', '11', '12'];
            default: return [];
        }
    },
    
    /**
     * Check if kelas is final grade
     */
    isKelasAkhir(kelas, jenjang) {
        const kelasNum = parseInt(kelas);
        if (jenjang === 'SD' && kelasNum === 6) return true;
        if (jenjang === 'SMP' && kelasNum === 9) return true;
        if ((jenjang === 'SMA' || jenjang === 'SMK') && kelasNum === 12) return true;
        return false;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}