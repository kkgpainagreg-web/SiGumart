// Utility Functions

// Show/Hide Loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    } else {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const content = document.getElementById('toastContent');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');

    content.className = 'px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3';
    icon.className = 'fas text-xl';

    if (type === 'success') {
        content.classList.add('bg-green-500', 'text-white');
        icon.classList.add('fa-check-circle');
    } else if (type === 'error') {
        content.classList.add('bg-red-500', 'text-white');
        icon.classList.add('fa-exclamation-circle');
    } else if (type === 'warning') {
        content.classList.add('bg-yellow-500', 'text-white');
        icon.classList.add('fa-exclamation-triangle');
    } else {
        content.classList.add('bg-blue-500', 'text-white');
        icon.classList.add('fa-info-circle');
    }

    msg.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Format Date
function formatDate(date, format = 'short') {
    if (!date) return '-';
    
    let d;
    if (date instanceof Date) {
        d = date;
    } else if (date.toDate) {
        d = date.toDate();
    } else if (typeof date === 'string') {
        d = new Date(date);
    } else {
        return '-';
    }
    
    if (isNaN(d.getTime())) return '-';
    
    const options = {
        'short': { day: 'numeric', month: 'short', year: 'numeric' },
        'long': { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
        'input': null
    };

    if (format === 'input') {
        return d.toISOString().split('T')[0];
    }

    return d.toLocaleDateString('id-ID', options[format] || options.short);
}

// Format Time
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get Tahun Ajaran Options
function getTahunAjaranOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let options = [];
    
    if (currentMonth >= 6) {
        options.push(`${currentYear}/${currentYear + 1}`);
        options.push(`${currentYear - 1}/${currentYear}`);
    } else {
        options.push(`${currentYear - 1}/${currentYear}`);
        options.push(`${currentYear}/${currentYear + 1}`);
    }
    
    return options;
}

// Initialize Tahun Ajaran Selector
function initTahunAjaran() {
    const select = document.getElementById('tahunAjaran');
    const options = getTahunAjaranOptions();
    
    select.innerHTML = options.map((opt, idx) => 
        `<option value="${opt}" ${idx === 0 ? 'selected' : ''}>${opt}</option>`
    ).join('');
    
    currentTahunAjaran = options[0];
}

// Change Tahun Ajaran
function changeTahunAjaran() {
    currentTahunAjaran = document.getElementById('tahunAjaran').value;
    showSection(currentSection, false);
}

// Change Semester
function changeSemester() {
    currentSemester = document.getElementById('semester').value;
    showSection(currentSection, false);
}

// Parse CSV from URL - DIPERBAIKI
async function parseCSVFromURL(url) {
    try {
        let csvUrl = url.trim();
        
        // Convert Google Sheets URL to CSV export URL
        if (csvUrl.includes('docs.google.com/spreadsheets')) {
            // Handle berbagai format URL Google Sheets
            
            // Format: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
            let sheetId = null;
            
            // Coba extract dari format /d/ID/
            const match1 = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (match1) {
                sheetId = match1[1];
            }
            
            // Coba extract dari format /e/ID/
            const match2 = csvUrl.match(/\/e\/([a-zA-Z0-9-_]+)/);
            if (match2) {
                sheetId = match2[1];
            }
            
            if (sheetId) {
                // Jika URL sudah berformat pub, gunakan langsung
                if (csvUrl.includes('/pub?') && csvUrl.includes('output=csv')) {
                    csvUrl = csvUrl;
                } else {
                    // Buat URL export CSV
                    csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
                }
            } else {
                throw new Error('Format URL Google Sheets tidak valid. Gunakan format: https://docs.google.com/spreadsheets/d/SHEET_ID/...');
            }
        }

        console.log('Fetching CSV from:', csvUrl);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}. Pastikan spreadsheet sudah di-share ke "Anyone with the link"`);
        }
        
        const text = await response.text();
        
        if (!text || text.trim().length === 0) {
            throw new Error('File CSV kosong atau tidak dapat dibaca');
        }
        
        return parseCSV(text);
    } catch (error) {
        console.error('Error parsing CSV:', error);
        throw new Error('Gagal memuat CSV: ' + error.message);
    }
}

// Parse CSV Text
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Clean header names
    const headers = parseCSVLine(lines[0]).map(h => 
        h.trim().toLowerCase()
         .replace(/['"]/g, '')
         .replace(/\s+/g, '_')
         .replace(/[^a-z0-9_]/g, '')
    );
    
    console.log('CSV Headers:', headers);
    
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 0 && values.some(v => v.trim())) {
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
            });
            data.push(row);
        }
    }

    console.log('Parsed data count:', data.length);
    return data;
}

// Parse CSV Line (handle quotes)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce Function
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

// Toggle Guide Section
function toggleGuide(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.toggle('hidden');
    }
}

// Get Hari Name
function getHariName(dayIndex) {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
    return hari[dayIndex] || '';
}

// Get Bulan Name
function getBulanName(monthIndex) {
    const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return bulan[monthIndex] || '';
}

// Get Fase from Kelas
function getFaseFromKelas(kelas, jenjang = 'SD') {
    const kelasNum = parseInt(kelas);
    
    if (jenjang === 'SD') {
        if (kelasNum <= 2) return 'A';
        if (kelasNum <= 4) return 'B';
        return 'C';
    } else if (jenjang === 'SMP') {
        return 'D';
    } else {
        if (kelasNum === 10) return 'E';
        return 'F';
    }
}

// Roman Numeral Converter
function toRoman(num) {
    const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return roman[num] || num.toString();
}

// Get Kelas Options based on Jenjang
function getKelasOptions() {
    const jenjang = window.profilData?.jenjang || 'SD';
    let kelasList = [];
    
    if (jenjang === 'SD') {
        kelasList = [1, 2, 3, 4, 5, 6];
    } else if (jenjang === 'SMP') {
        kelasList = [7, 8, 9];
    } else {
        kelasList = [10, 11, 12];
    }

    return kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');
}
