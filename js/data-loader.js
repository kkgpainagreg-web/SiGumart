// Data Loading Functions

// Fixed National Holidays
const FIXED_HOLIDAYS = [
    { date: '01-01', name: 'Tahun Baru Masehi' },
    { date: '05-01', name: 'Hari Buruh' },
    { date: '06-01', name: 'Hari Lahir Pancasila' },
    { date: '08-17', name: 'Hari Kemerdekaan RI' },
    { date: '12-25', name: 'Hari Natal' }
];

// Default Non-Fixed Holidays
const DEFAULT_CUSTOM_HOLIDAYS = [
    { date: '2025-01-29', name: 'Tahun Baru Imlek' },
    { date: '2025-03-29', name: 'Hari Raya Nyepi' },
    { date: '2025-03-31', name: 'Idul Fitri (Perkiraan)' },
    { date: '2025-04-01', name: 'Idul Fitri (Perkiraan)' },
    { date: '2025-04-18', name: 'Wafat Isa Almasih' },
    { date: '2025-05-12', name: 'Hari Raya Waisak' },
    { date: '2025-05-29', name: 'Kenaikan Isa Almasih' },
    { date: '2025-06-06', name: 'Idul Adha (Perkiraan)' },
    { date: '2025-06-27', name: 'Tahun Baru Islam' }
];

// Load Calendar Data
async function loadCalendarData() {
    try {
        const doc = await db.collection('calendars').doc(currentUser.uid).get();
        if (doc.exists) {
            calendarData = doc.data();
        } else {
            calendarData = getDefaultCalendarData();
        }
        populateCalendarForm();
    } catch (error) {
        console.error('Error loading calendar:', error);
        calendarData = getDefaultCalendarData();
        populateCalendarForm();
    }
}

function getDefaultCalendarData() {
    const yearData = getCurrentAcademicYear();
    const year = parseInt(yearData.current.split('/')[0]);
    const nextYear = year + 1;
    
    return {
        ganjil: {
            start: `${year}-07-14`,
            end: `${year}-12-20`
        },
        genap: {
            start: `${nextYear}-01-06`,
            end: `${nextYear}-06-21`
        },
        genapEndKls6: `${nextYear}-06-07`,
        genapEndKls9: `${nextYear}-05-31`,
        genapEndKls12: `${nextYear}-05-24`,
        customHolidays: DEFAULT_CUSTOM_HOLIDAYS
    };
}

function populateCalendarForm() {
    const fields = {
        'ganjilStart': calendarData?.ganjil?.start || '',
        'ganjilEnd': calendarData?.ganjil?.end || '',
        'genapStart': calendarData?.genap?.start || '',
        'genapEnd': calendarData?.genap?.end || '',
        'genapEndKls6': calendarData?.genapEndKls6 || '',
        'genapEndKls9': calendarData?.genapEndKls9 || '',
        'genapEndKls12': calendarData?.genapEndKls12 || ''
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    });
    
    // Fixed holidays display
    const fixedContainer = document.getElementById('fixedHolidaysContainer');
    if (fixedContainer) {
        fixedContainer.innerHTML = FIXED_HOLIDAYS.map(h => 
            `<span class="px-3 py-1 bg-gray-200 rounded-full text-sm">${h.date.replace('-','/')}: ${h.name}</span>`
        ).join('');
    }
    
    // Custom holidays
    loadCustomHolidays();
}

function loadCustomHolidays() {
    const container = document.getElementById('customHolidaysContainer');
    if (!container) return;
    
    const holidays = calendarData?.customHolidays || [];
    
    if (holidays.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Belum ada hari libur khusus</p>';
        return;
    }
    
    container.innerHTML = holidays.map((h, idx) => `
        <div class="flex items-center gap-2">
            <input type="date" value="${h.date || ''}" class="flex-shrink-0 w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                onchange="updateCustomHoliday(${idx}, 'date', this.value)">
            <input type="text" value="${h.name || ''}" placeholder="Nama libur" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onchange="updateCustomHoliday(${idx}, 'name', this.value)">
            <button onclick="removeCustomHoliday(${idx})" class="text-red-500 hover:text-red-700 p-2 text-xl">✕</button>
        </div>
    `).join('');
}

function addCustomHoliday() {
    if (!calendarData) {
        calendarData = getDefaultCalendarData();
    }
    if (!calendarData.customHolidays) {
        calendarData.customHolidays = [];
    }
    calendarData.customHolidays.push({ date: '', name: '' });
    loadCustomHolidays();
}

function updateCustomHoliday(idx, field, value) {
    if (calendarData?.customHolidays?.[idx]) {
        calendarData.customHolidays[idx][field] = value;
    }
}

function removeCustomHoliday(idx) {
    if (calendarData?.customHolidays) {
        calendarData.customHolidays.splice(idx, 1);
        loadCustomHolidays();
    }
}

async function saveCalendar() {
    showLoading();
    
    calendarData = {
        ganjil: {
            start: document.getElementById('ganjilStart')?.value || '',
            end: document.getElementById('ganjilEnd')?.value || ''
        },
        genap: {
            start: document.getElementById('genapStart')?.value || '',
            end: document.getElementById('genapEnd')?.value || ''
        },
        genapEndKls6: document.getElementById('genapEndKls6')?.value || '',
        genapEndKls9: document.getElementById('genapEndKls9')?.value || '',
        genapEndKls12: document.getElementById('genapEndKls12')?.value || '',
        customHolidays: calendarData?.customHolidays || [],
        userId: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('calendars').doc(currentUser.uid).set(calendarData);
        hideLoading();
        showAlert('Kalender berhasil disimpan!', 'success');
        updateDashboardStats();
    } catch (error) {
        hideLoading();
        console.error('Error saving calendar:', error);
        showAlert('Gagal menyimpan kalender: ' + error.message, 'error');
    }
}

// Schedule Data
async function loadScheduleData() {
    try {
        const doc = await db.collection('schedules').doc(currentUser.uid).get();
        if (doc.exists) {
            scheduleData = doc.data();
        } else {
            scheduleData = { grid: {} };
        }
        initializeScheduleGrid();
    } catch (error) {
        console.error('Error loading schedule:', error);
        scheduleData = { grid: {} };
        initializeScheduleGrid();
    }
}

function initializeScheduleGrid() {
    const container = document.getElementById('scheduleGrid');
    if (!container) return;
    
    const jpDuration = userData?.settings?.lessonDuration || 35;
    const startTimeStr = '07:00';
    const maxJP = 10;
    
    let html = '';
    let currentTime = parseTime(startTimeStr);
    
    for (let jp = 1; jp <= maxJP; jp++) {
        const endTime = addMinutes(currentTime, jpDuration);
        const timeLabel = `${formatTimeStr(currentTime)} - ${formatTimeStr(endTime)}`;
        
        html += `<tr>`;
        html += `<td class="border p-2 bg-gray-50 font-medium text-sm">
            <div>JP ${jp}</div>
            <div class="text-xs text-gray-500">${timeLabel}</div>
        </td>`;
        
        for (let day = 1; day <= 6; day++) {
            const cellId = `schedule-${day}-${jp}`;
            const cellData = scheduleData?.grid?.[`${day}-${jp}`] || {};
            
            html += `<td class="border p-1">
                <select id="${cellId}-class" class="w-full text-xs p-1 border rounded mb-1" 
                    onchange="updateScheduleCell(${day}, ${jp})">
                    <option value="">-</option>
                    ${getClassOptions(cellData.class)}
                </select>
                <select id="${cellId}-rombel" class="w-full text-xs p-1 border rounded"
                    onchange="updateScheduleCell(${day}, ${jp})">
                    <option value="">-</option>
                    ${getRombelOptions(cellData.rombel)}
                </select>
            </td>`;
        }
        html += `</tr>`;
        
        currentTime = endTime;
        
        // Add break row
        if (jp === 3 || jp === 6) {
            const breakDuration = jp === 3 ? 15 : 30;
            html += `<tr class="bg-yellow-50">
                <td colspan="7" class="border p-2 text-center text-sm text-yellow-800 font-medium">
                    ☕ Istirahat (${breakDuration} menit)
                </td>
            </tr>`;
            currentTime = addMinutes(currentTime, breakDuration);
        }
    }
    
    container.innerHTML = html;
}

function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h || 0, minutes: m || 0 };
}

function addMinutes(time, mins) {
    let totalMins = (time.hours * 60) + time.minutes + mins;
    return {
        hours: Math.floor(totalMins / 60) % 24,
        minutes: totalMins % 60
    };
}

function formatTimeStr(time) {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

function getClassOptions(selected) {
    const level = userData?.profile?.school?.level || 'SD';
    let classes = [];
    
    if (level === 'SD') classes = [1, 2, 3, 4, 5, 6];
    else if (level === 'SMP') classes = [7, 8, 9];
    else classes = [10, 11, 12];
    
    return classes.map(c => 
        `<option value="${c}" ${selected == c ? 'selected' : ''}>Kelas ${c}</option>`
    ).join('');
}

function getRombelOptions(selected) {
    const rombels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return rombels.map(r => 
        `<option value="${r}" ${selected === r ? 'selected' : ''}>${r}</option>`
    ).join('');
}

function updateScheduleCell(day, jp) {
    const kelasEl = document.getElementById(`schedule-${day}-${jp}-class`);
    const rombelEl = document.getElementById(`schedule-${day}-${jp}-rombel`);
    
    const kelas = kelasEl?.value || '';
    const rombel = rombelEl?.value || '';
    
    if (!scheduleData) scheduleData = { grid: {} };
    if (!scheduleData.grid) scheduleData.grid = {};
    
    scheduleData.grid[`${day}-${jp}`] = { class: kelas, rombel: rombel };
}

function validateSchedule() {
    const errors = [];
    const grid = scheduleData?.grid || {};
    
    // Group by day
    const daySchedules = {};
    
    Object.entries(grid).forEach(([key, val]) => {
        if (!val.class || !val.rombel) return;
        
        const [day, jp] = key.split('-');
        const roomKey = `${day}-${jp}`;
        
        // Check if guru (current user) is teaching multiple classes at same time
        // This is always invalid
        if (!daySchedules[roomKey]) {
            daySchedules[roomKey] = [];
        }
        daySchedules[roomKey].push(`${val.class}${val.rombel}`);
    });
    
    // Check for duplicate schedules at same time
    Object.entries(daySchedules).forEach(([key, classes]) => {
        if (classes.length > 1) {
            const [day, jp] = key.split('-');
            errors.push(`Konflik: Anda mengajar ${classes.length} kelas di JP ${jp} hari ${getDayName(day)}`);
        }
    });
    
    const validationDiv = document.getElementById('scheduleValidation');
    const errorsList = document.getElementById('validationErrors');
    
    if (validationDiv && errorsList) {
        if (errors.length > 0) {
            validationDiv.classList.remove('hidden');
            errorsList.innerHTML = errors.map(e => `<li>• ${e}</li>`).join('');
        } else {
            validationDiv.classList.add('hidden');
            showAlert('✅ Jadwal valid, tidak ada konflik!', 'success');
        }
    }
}

function getDayName(day) {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[parseInt(day)] || '';
}

async function saveSchedule() {
    showLoading();
    
    try {
        if (!scheduleData) scheduleData = { grid: {} };
        
        scheduleData.userId = currentUser.uid;
        scheduleData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('schedules').doc(currentUser.uid).set(scheduleData);
        hideLoading();
        showAlert('Jadwal berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error saving schedule:', error);
        showAlert('Gagal menyimpan jadwal: ' + error.message, 'error');
    }
}

// Students Data
async function loadStudentsData() {
    try {
        const snapshot = await db.collection('students')
            .where('userId', '==', currentUser.uid)
            .get();
        
        studentsData = [];
        snapshot.forEach(doc => {
            studentsData.push({ id: doc.id, ...doc.data() });
        });
        
        populateStudentsTable();
        updateFilters();
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading students:', error);
        studentsData = [];
    }
}

function populateStudentsTable() {
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;
    
    if (!studentsData || studentsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="border p-4 text-center text-gray-500">
                    Belum ada data siswa. Import dari CSV atau tambah manual.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = studentsData.map((s, idx) => `
        <tr class="hover:bg-gray-50">
            <td class="border p-2 text-center">${idx + 1}</td>
            <td class="border p-2">${s.nisn || '-'}</td>
            <td class="border p-2">${s.nama || '-'}</td>
            <td class="border p-2 text-center">${s.jenis_kelamin || '-'}</td>
            <td class="border p-2 text-center">${s.kelas || '-'}</td>
            <td class="border p-2 text-center">${s.rombel || '-'}</td>
            <td class="border p-2 text-center">
                <button onclick="deleteStudent('${s.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateFilters() {
    const filterClassEl = document.getElementById('filterClass');
    const filterRombelEl = document.getElementById('filterRombel');
    
    if (!studentsData || studentsData.length === 0) return;
    
    const classes = [...new Set(studentsData.map(s => s.kelas).filter(Boolean))].sort((a, b) => a - b);
    const rombels = [...new Set(studentsData.map(s => s.rombel).filter(Boolean))].sort();
    
    if (filterClassEl) {
        filterClassEl.innerHTML = 
            '<option value="">Semua Kelas</option>' + 
            classes.map(c => `<option value="${c}">Kelas ${c}</option>`).join('');
    }
    
    if (filterRombelEl) {
        filterRombelEl.innerHTML = 
            '<option value="">Semua Rombel</option>' + 
            rombels.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}

function filterStudents() {
    const filterClass = document.getElementById('filterClass')?.value || '';
    const filterRombel = document.getElementById('filterRombel')?.value || '';
    const filterGender = document.getElementById('filterGender')?.value || '';
    const search = (document.getElementById('searchStudent')?.value || '').toLowerCase();
    
    let filtered = studentsData.filter(s => {
        if (filterClass && s.kelas != filterClass) return false;
        if (filterRombel && s.rombel !== filterRombel) return false;
        if (filterGender && s.jenis_kelamin !== filterGender) return false;
        if (search && !(s.nama || '').toLowerCase().includes(search) && !(s.nisn || '').includes(search)) return false;
        return true;
    });
    
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="border p-4 text-center text-gray-500">Tidak ada data yang cocok</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map((s, idx) => `
        <tr class="hover:bg-gray-50">
            <td class="border p-2 text-center">${idx + 1}</td>
            <td class="border p-2">${s.nisn || '-'}</td>
            <td class="border p-2">${s.nama || '-'}</td>
            <td class="border p-2 text-center">${s.jenis_kelamin || '-'}</td>
            <td class="border p-2 text-center">${s.kelas || '-'}</td>
            <td class="border p-2 text-center">${s.rombel || '-'}</td>
            <td class="border p-2 text-center">
                <button onclick="deleteStudent('${s.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function importStudents() {
    const csvUrl = (document.getElementById('csvUrl')?.value || '').trim();
    const csvFileInput = document.getElementById('csvFile');
    const csvFile = csvFileInput?.files?.[0];
    
    if (!csvUrl && !csvFile) {
        showAlert('Masukkan URL atau pilih file CSV', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        let csvText;
        
        if (csvFile) {
            csvText = await csvFile.text();
        } else {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error('Gagal mengambil data dari URL');
            csvText = await response.text();
        }
        
        const students = parseStudentCSV(csvText);
        
        if (students.length === 0) {
            hideLoading();
            showAlert('Tidak ada data valid dalam file CSV', 'warning');
            return;
        }
        
        // Save to Firestore
        const batch = db.batch();
        students.forEach(s => {
            const ref = db.collection('students').doc();
            batch.set(ref, {
                ...s,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        closeImportModal();
        await loadStudentsData();
        hideLoading();
        showAlert(`Berhasil import ${students.length} siswa!`, 'success');
    } catch (error) {
        hideLoading();
        console.error('Error importing students:', error);
        showAlert('Gagal import: ' + error.message, 'error');
    }
}

function parseStudentCSV(csvText) {
    const lines = csvText.split('\n');
    const students = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Try semicolon first, then comma
        let parts = line.split(';');
        if (parts.length < 5) {
            parts = line.split(',');
        }
        
        if (parts.length >= 5) {
            students.push({
                nisn: parts[0].trim(),
                nama: parts[1].trim(),
                jenis_kelamin: parts[2].trim().toUpperCase(),
                kelas: parseInt(parts[3].trim()) || 0,
                rombel: parts[4].trim().toUpperCase()
            });
        }
    }
    
    return students;
}

async function deleteStudent(id) {
    if (!confirm('Hapus data siswa ini?')) return;
    
    showLoading();
    try {
        await db.collection('students').doc(id).delete();
        await loadStudentsData();
        hideLoading();
        showAlert('Data siswa berhasil dihapus', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting student:', error);
        showAlert('Gagal menghapus: ' + error.message, 'error');
    }
}

function exportStudents() {
    if (!studentsData || studentsData.length === 0) {
        showAlert('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    let csv = 'nisn;nama;jenis_kelamin;kelas;rombel\n';
    studentsData.forEach(s => {
        csv += `${s.nisn || ''};${s.nama || ''};${s.jenis_kelamin || ''};${s.kelas || ''};${s.rombel || ''}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_siswa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showAlert('Data siswa berhasil diekspor', 'success');
}

// ============================================
// LOAD CP DATA FROM CSV
// ============================================
async function loadCPData(subject, level) {
    // Normalize subject name to file name
    const subjectMap = {
        'pendidikan agama islam dan budi pekerti': 'pai',
        'pendidikan agama islam': 'pai',
        'pai dan budi pekerti': 'pai',
        'pai': 'pai',
        'agama islam': 'pai',
        'bahasa indonesia': 'bindo',
        'bahasa inggris': 'bing',
        'matematika': 'mtk',
        'ilmu pengetahuan alam': 'ipa',
        'ipa': 'ipa',
        'ilmu pengetahuan sosial': 'ips',
        'ips': 'ips',
        'pendidikan kewarganegaraan': 'pkn',
        'pkn': 'pkn',
        'ppkn': 'pkn',
        'seni budaya': 'senbud',
        'pjok': 'pjok',
        'penjas': 'pjok',
        'pendidikan jasmani': 'pjok',
        'informatika': 'info',
        'bahasa arab': 'arab',
        'sejarah kebudayaan islam': 'ski',
        'ski': 'ski',
        'akidah akhlak': 'akidah',
        'fiqih': 'fiqih',
        'quran hadis': 'quran',
        'al-quran hadis': 'quran'
    };
    
    // Find matching subject
    const subjectLower = (subject || '').toLowerCase().trim();
    let subjectSlug = subjectMap[subjectLower];
    
    // If not found in map, create slug from subject name
    if (!subjectSlug) {
        subjectSlug = subjectLower
            .replace(/pendidikan\s+/gi, '')
            .replace(/dan\s+/gi, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/gi, '')
            .substring(0, 20);
    }
    
    const levelSlug = (level || 'sd').toLowerCase();
    const fileName = `cp-${subjectSlug}-${levelSlug}.csv`;
    
    console.log(`Loading CP data: ${fileName} for subject: ${subject}`);
    
    try {
        const response = await fetch(`data/${fileName}`);
        if (!response.ok) {
            console.log(`CP file not found: ${fileName}`);
            return [];
        }
        
        const csvText = await response.text();
        return parseCPCSV(csvText);
    } catch (error) {
        console.log(`Error loading CP data: ${fileName}`, error);
        return [];
    }
}

function parseCPCSV(csvText) {
    const lines = csvText.split('\n');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(';');
        if (parts.length >= 7) {
            data.push({
                fase: parts[0].trim(),
                kelas: parts[1].trim(),
                semester: parts[2].trim(),
                elemen: parts[3].trim(),
                cp: parts[4].trim(),
                tp: parts[5].trim(),
                dimensi: parts[6].trim()
            });
        }
    }
    
    return data;
}
console.log('Data Loader Module Loaded');

