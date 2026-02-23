// Utility Functions

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Format Date to Indonesian locale
 * @param {Date|string} date
 * @param {string} format - 'long', 'full', 'short', 'day', 'month-year'
 * @returns {string}
 */
function formatDateID(date, format = 'long') {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '-';
    
    switch(format) {
        case 'long':
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        case 'full':
            return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        case 'short':
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        case 'day':
            return days[d.getDay()];
        case 'day-date':
            return `${days[d.getDay()]}, ${d.getDate()} ${monthsShort[d.getMonth()]}`;
        case 'date-only':
            return d.getDate().toString();
        case 'month-year':
            return `${months[d.getMonth()]} ${d.getFullYear()}`;
        case 'month-short':
            return monthsShort[d.getMonth()];
        default:
            return d.toLocaleDateString('id-ID');
    }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
function formatDateISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get day name in Indonesian
 * @param {number} dayIndex - 0=Minggu, 1=Senin, dst
 * @returns {string}
 */
function getDayName(dayIndex) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[dayIndex] || '';
}

/**
 * Get day index from name
 * @param {string} dayName
 * @returns {number}
 */
function getDayIndex(dayName) {
    const days = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
    return days[dayName] ?? -1;
}

// ============================================
// CSV PARSING
// ============================================

/**
 * Parse CSV text to array of objects
 * @param {string} csvText
 * @param {string} delimiter
 * @returns {Object} { headers: Array, data: Array }
 */
function parseCSV(csvText, delimiter = ';') {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return { headers: [], data: [] };
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(delimiter);
        if (values.length >= headers.length - 1) {
            const row = {};
            headers.forEach((header, index) => {
                let val = (values[index] || '').trim().replace(/^["']|["']$/g, '');
                row[header] = val;
            });
            data.push(row);
        }
    }
    
    return { headers, data };
}

/**
 * Generate CSV from array of objects
 * @param {Array} data
 * @param {Array} headers
 * @param {string} delimiter
 * @returns {string}
 */
function generateCSV(data, headers, delimiter = ';') {
    let csv = headers.join(delimiter) + '\n';
    
    data.forEach(row => {
        const values = headers.map(h => {
            let val = row[h] || '';
            // Escape if contains delimiter
            if (val.includes(delimiter) || val.includes('\n')) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csv += values.join(delimiter) + '\n';
    });
    
    return csv;
}

// ============================================
// FILE DOWNLOAD
// ============================================

/**
 * Download content as file
 * @param {string} content
 * @param {string} filename
 * @param {string} type
 */
function downloadFile(content, filename, type = 'text/csv') {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + content], { type: type + ';charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// ============================================
// DATE CALCULATIONS
// ============================================

/**
 * Get all dates between start and end (inclusive)
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {Array<Date>}
 */
function getDatesBetween(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

/**
 * Get weeks between two dates
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {Array} Array of week objects
 */
function getWeeksBetweenDates(startDate, endDate) {
    const weeks = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    let weekNumber = 1;
    
    while (currentDate <= end) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        if (weekEnd > end) {
            weekEnd.setTime(end.getTime());
        }
        
        weeks.push({
            weekNumber,
            startDate: new Date(weekStart),
            endDate: new Date(weekEnd),
            month: weekStart.getMonth()
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
    }
    
    return weeks;
}

/**
 * Calculate effective teaching days
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {Array} holidays - Array of date strings (YYYY-MM-DD)
 * @param {boolean} excludeSunday
 * @returns {number}
 */
function calculateEffectiveDays(startDate, endDate, holidays = [], excludeSunday = true) {
    let count = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDateISO(currentDate);
        
        // Skip Sunday
        if (excludeSunday && dayOfWeek === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }
        
        // Skip holidays
        if (!holidays.includes(dateStr)) {
            count++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
}

/**
 * Get teaching dates for specific days of week
 * @param {Array<number>} dayIndices - Array of day indices (0=Minggu, 1=Senin, dst)
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {Array} holidays - Array of date strings (YYYY-MM-DD)
 * @returns {Array<Date>}
 */
function getTeachingDates(dayIndices, startDate, endDate, holidays = []) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDateISO(currentDate);
        
        // Check if this day is in target days and not a holiday
        if (dayIndices.includes(dayOfWeek) && !holidays.includes(dateStr)) {
            dates.push(new Date(currentDate));
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}

/**
 * Get teaching dates by day name
 * @param {string} dayName - "Senin", "Selasa", dst
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {Array} holidays
 * @returns {Array<Date>}
 */
function getTeachingDatesByDayName(dayName, startDate, endDate, holidays = []) {
    const dayIndex = getDayIndex(dayName);
    if (dayIndex < 0) return [];
    return getTeachingDates([dayIndex], startDate, endDate, holidays);
}

/**
 * Calculate week number of the month (1-5)
 * @param {Date} date
 * @returns {number}
 */
function getWeekOfMonth(date) {
    const d = new Date(date);
    const dayOfMonth = d.getDate();
    let week = Math.ceil(dayOfMonth / 7);
    return Math.min(week, 5); // Max 5 weeks per month
}

/**
 * Get months in semester
 * @param {string} semester - "Ganjil" atau "Genap"
 * @param {number} startYear - Tahun mulai ajaran
 * @returns {Array} Array of {month: number, year: number, name: string}
 */
function getMonthsInSemester(semester, startYear) {
    const months = [];
    
    if (semester === 'Ganjil') {
        // Juli - Desember (tahun awal)
        for (let m = 6; m <= 11; m++) { // 6=Juli, 11=Desember
            months.push({
                month: m,
                year: startYear,
                name: NAMA_BULAN[m],
                shortName: NAMA_BULAN_SHORT[m]
            });
        }
    } else {
        // Januari - Juni (tahun akhir = startYear + 1)
        const endYear = startYear + 1;
        for (let m = 0; m <= 5; m++) { // 0=Januari, 5=Juni
            months.push({
                month: m,
                year: endYear,
                name: NAMA_BULAN[m],
                shortName: NAMA_BULAN_SHORT[m]
            });
        }
    }
    
    return months;
}

// ============================================
// OTHER UTILITIES
// ============================================

/**
 * Generate unique ID
 * @returns {string}
 */
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Deep clone object
 * @param {Object} obj
 * @returns {Object}
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
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

/**
 * Format number with leading zero
 * @param {number} num
 * @param {number} size
 * @returns {string}
 */
function padZero(num, size = 2) {
    let s = num.toString();
    while (s.length < size) s = '0' + s;
    return s;
}

/**
 * Get Fase from Kelas number
 * @param {number|string} kelas
 * @returns {string}
 */
function getFaseFromKelas(kelas) {
    const kelasNum = parseInt(kelas);
    if (kelasNum <= 2) return 'A';
    if (kelasNum <= 4) return 'B';
    if (kelasNum <= 6) return 'C';
    if (kelasNum <= 9) return 'D';
    if (kelasNum === 10) return 'E';
    return 'F';
}

/**
 * Validate time format HH:MM
 * @param {string} time
 * @returns {boolean}
 */
function isValidTime(time) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

/**
 * Convert time string to minutes
 * @param {string} time - "HH:MM"
 * @returns {number}
 */
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes to time string
 * @param {number} minutes
 * @returns {string}
 */
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${padZero(hours)}:${padZero(mins)}`;
}

/**
 * Check time overlap
 * @param {string} start1
 * @param {string} end1
 * @param {string} start2
 * @param {string} end2
 * @returns {boolean}
 */
function isTimeOverlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    
    return (s1 < e2 && e1 > s2);
}

/**
 * Truncate text
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML
 * @param {string} text
 * @returns {string}
 */
function escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load CSV from URL
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function loadCSVFromURL(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CSV');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error loading CSV:', error);
        throw error;
    }
}

/**
 * Print element
 * @param {string} elementId
 * @param {string} title
 */
function printElement(elementId, title = 'Print') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                @page { size: A4 landscape; margin: 10mm; }
                body { 
                    font-family: 'Times New Roman', Times, serif; 
                    font-size: 11pt; 
                    padding: 0;
                    margin: 0;
                }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #333; padding: 4px 6px; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .date-cell { font-size: 8pt; color: #c00; display: block; margin-top: 2px; }
                .jp-cell { font-size: 10pt; font-weight: bold; color: #006; }
                .header-title { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 15px; }
                .identity-table { margin-bottom: 15px; }
                .identity-table td { border: none; padding: 2px 5px; }
                .signature-area { margin-top: 30px; display: flex; justify-content: space-between; }
                .signature-box { text-align: center; width: 45%; }
                .signature-name { text-decoration: underline; font-weight: bold; margin-top: 60px; }
            </style>
        </head>
        <body>
            ${element.innerHTML}
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 300);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

console.log('Utils Module Loaded');