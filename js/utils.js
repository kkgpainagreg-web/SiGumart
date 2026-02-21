// Utility Functions

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Remove toast
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Show loading overlay
function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Format date to Indonesian locale
function formatDate(date, options = {}) {
    const defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('id-ID', { ...defaultOptions, ...options });
}

// Format short date
function formatShortDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format date for input
function formatDateForInput(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Get day name in Indonesian
function getDayName(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(date).getDay()];
}

// Get month name in Indonesian
function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// Sanitize HTML
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Convert number to Roman numeral
function toRoman(num) {
    const romanNumerals = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    let result = '';
    for (const [roman, value] of romanNumerals) {
        while (num >= value) {
            result += roman;
            num -= value;
        }
    }
    return result;
}

// Parse CSV
function parseCSV(text, delimiter = ',') {
    const lines = text.split('\n');
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }

    return { headers, data };
}

// Convert data to CSV
function toCSV(data, headers) {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
        headers.map(header => {
            let value = row[header] || '';
            // Escape commas and quotes
            if (value.toString().includes(',') || value.toString().includes('"')) {
                value = `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
}

// Download file
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Validate email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate Gmail
function isGmail(email) {
    return email.toLowerCase().endsWith('@gmail.com');
}

// Calculate effective days between two dates (excluding Sundays and holidays)
function calculateEffectiveDays(startDate, endDate, holidays = [], excludeSunday = true, excludeSaturday = false) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    const holidaySet = new Set(holidays.map(d => formatDateForInput(d)));

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const dateStr = formatDateForInput(current);
        
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;
        const isHoliday = holidaySet.has(dateStr);

        if (!isHoliday && !(excludeSunday && isSunday) && !(excludeSaturday && isSaturday)) {
            count++;
        }

        current.setDate(current.getDate() + 1);
    }

    return count;
}

// Get weeks between two dates
function getWeeksBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

// Group array by key
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const keyValue = item[key];
        (result[keyValue] = result[keyValue] || []).push(item);
        return result;
    }, {});
}

// Sort array by multiple keys
function sortBy(array, ...keys) {
    return array.sort((a, b) => {
        for (const key of keys) {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
        }
        return 0;
    });
}

// Calculate grade
function calculateGrade(scores, weights) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const key in scores) {
        if (weights[key] && scores[key] !== null && scores[key] !== undefined) {
            weightedSum += scores[key] * weights[key];
            totalWeight += weights[key];
        }
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// Convert grade to predicate
function gradeToPredicate(grade) {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'E';
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate color from string
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
        '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e'
    ];
    return colors[Math.abs(hash) % colors.length];
}

// Check if premium feature
function isPremiumFeature(feature) {
    const premiumFeatures = ['promes', 'modul-ajar', 'lkpd', 'bank-soal', 'kktp', 'daftar-nilai', 'jurnal'];
    return premiumFeatures.includes(feature);
}

// Console log with style
function logInfo(message) {
    console.log(`%c[AGSA] ${message}`, 'color: #22c55e; font-weight: bold;');
}

function logError(message) {
    console.error(`%c[AGSA Error] ${message}`, 'color: #ef4444; font-weight: bold;');
}

function logWarning(message) {
    console.warn(`%c[AGSA Warning] ${message}`, 'color: #f59e0b; font-weight: bold;');
}