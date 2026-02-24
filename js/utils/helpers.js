/**
 * HELPER UTILITIES
 * Common utility functions
 */

const Helpers = {
    /**
     * Format number with Indonesian locale
     */
    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    /**
     * Calculate grade from score
     */
    calculateGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'E';
    },

    /**
     * Calculate predikat from score
     */
    calculatePredikat(score) {
        if (score >= 90) return 'Sangat Baik';
        if (score >= 80) return 'Baik';
        if (score >= 70) return 'Cukup';
        if (score >= 60) return 'Kurang';
        return 'Sangat Kurang';
    },

    /**
     * Calculate weighted average
     */
    calculateWeightedAverage(scores, weights) {
        if (scores.length !== weights.length) return 0;
        
        let totalWeight = weights.reduce((a, b) => a + b, 0);
        let weightedSum = scores.reduce((sum, score, i) => sum + (score * weights[i]), 0);
        
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    },

    /**
     * Calculate NR (Nilai Rapor) from components
     */
    calculateNilaiRapor(sumatifScores, atsScore, asasScore, config = {}) {
        const sumatifBobot = config.sumatifBobot || 40;
        const atsBobot = config.atsBobot || 30;
        const asasBobot = config.asasBobot || 30;

        const avgSumatif = sumatifScores.length > 0 
            ? sumatifScores.reduce((a, b) => a + b, 0) / sumatifScores.length 
            : 0;

        const nr = (avgSumatif * sumatifBobot / 100) + 
                   (atsScore * atsBobot / 100) + 
                   (asasScore * asasBobot / 100);

        return Math.round(nr);
    },

    /**
     * Validate NISN format
     */
    validateNISN(nisn) {
        return /^\d{10}$/.test(nisn);
    },

    /**
     * Validate NIP format
     */
    validateNIP(nip) {
        return /^\d{18}$/.test(nip.replace(/\s/g, ''));
    },

    /**
     * Generate random color
     */
    generateColor() {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Truncate text with ellipsis
     */
    truncate(text, maxLength = 50) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Sanitize HTML
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },

    /**
     * Group array by key
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) result[group] = [];
            result[group].push(item);
            return result;
        }, {});
    },

    /**
     * Sort array of objects by key
     */
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            if (order === 'asc') {
                return a[key] > b[key] ? 1 : -1;
            }
            return a[key] < b[key] ? 1 : -1;
        });
    },

    /**
     * Get initials from name
     */
    getInitials(name) {
        if (!name) return '';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Check if date is weekend
     */
    isWeekend(date) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    /**
     * Get weeks in month
     */
    getWeeksInMonth(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const used = firstDay.getDay() + lastDay.getDate();
        return Math.ceil(used / 7);
    },

    /**
     * Generate date range
     */
    getDateRange(startDate, endDate) {
        const dates = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            dates.push(new Date(current).toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        return dates;
    },

    /**
     * Calculate age from birth date
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    /**
     * Convert to title case
     */
    toTitleCase(str) {
        return str.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },

    /**
     * Generate slug from string
     */
    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    /**
     * Download data as CSV
     */
    downloadCSV(data, filename) {
        const csvContent = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' && val.includes(',') ? `"${val}"` : val
            ).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    /**
     * Download data as JSON
     */
    downloadJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
};

// Export
window.Helpers = Helpers;