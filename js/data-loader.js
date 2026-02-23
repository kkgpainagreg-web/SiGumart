// Data Loading Functions

// Fixed National Holidays
const FIXED_HOLIDAYS = [
    { date: '01-01', name: 'Tahun Baru Masehi' },
    { date: '05-01', name: 'Hari Buruh' },
    { date: '06-01', name: 'Hari Lahir Pancasila' },
    { date: '08-17', name: 'Hari Kemerdekaan RI' },
    { date: '12-25', name: 'Hari Natal' }
];

// Default Non-Fixed Holidays (can be edited)
const DEFAULT_CUSTOM_HOLIDAYS = [
    { date: '2024-01-22', name: 'Isra Mi\'raj (Perkiraan)' },
    { date: '2024-03-11', name: 'Awal Ramadhan (Perkiraan)' },
    { date: '2024-04-10', name: 'Idul Fitri (Perkiraan)' },
    { date: '2024-04-11', name: 'Idul Fitri (Perkiraan)' },
    { date: '2024-06-17', name: 'Idul Adha (Perkiraan)' },
    { date: '2024-07-07', name: 'Tahun Baru Islam (Perkiraan)' },
    { date: '2025-02-12', name: 'Tahun Baru Imlek (Perkiraan)' },
    { date: '2025-03-29', name: 'Nyepi (Perkiraan)' },
    { date: '2025-04-18', name: 'Wafat Isa Almasih (Perkiraan)' },
    { date: '2025-05-12', name: 'Waisak (Perkiraan)' },
    { date: '2025-05-29', name: 'Kenaikan Isa Almasih (Perkiraan)' }
];

// Load Calendar Data
async function loadCalendarData() {
    try {
        const doc = await db.collection('calendars').doc(currentUser.uid).get();
        if (doc.exists) {
            calendarData = doc.data();
        } else {
            // Initialize with defaults
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
    const year = getCurrentAcademicYear().current.split('/')[0];
    const nextYear = parseInt(year) + 1;
    
    return {
        ganjil: {
            start: `${year}-07-15`,
            end: `${year}-12-20`
        },
        genap: {
            start: `${nextYear}-01-02`,
            end: `${nextYear}-06-20`
        },
        genapEndKls6: `${nextYear}-06-01`,
        genapEndKls9: `${nextYear}-05-25`,
        genapEndKls12: `${nextYear}-05-20`,
        customHolidays: DEFAULT_CUSTOM_HOLIDAYS
    };
}

function populateCalendarForm() {
    document.getElementById('ganjilStart').value = calendarData.ganjil?.start || '';
    document.getElementById('ganjilEnd').value = calendarData.ganjil?.end || '';
    document.getElementById('genapStart').value = calendarData.genap?.start || '';
    document.getElementById('genapEnd').value = calendarData.genap?.end || '';
    document.getElementById('genapEndKls6').value = calendarData.genapEndKls6 || '';
    document.getElementById('genapEndKls9').value = calendarData.genapEndKls9 || '';
    document.getElementById('genapEndKls12').value = calendarData.genapEndKls12 || '';
    
    // Fixed holidays
    const fixedContainer = document.getElementById('fixedHolidaysContainer');
    const year = calendarData.ganjil?.start?.split('-')[0] || new Date().getFullYear();
    const nextYear = parseInt(year) + 1;
    
    fixedContainer.innerHTML = FIXED_HOLIDAYS.map(h => {
        const displayYear = h.date.startsWith('01') || h.date.startsWith('02') || 
                           h.date.startsWith('03') || h.date.startsWith('04') || 
                           h.date.startsWith('05') || h.date.startsWith('06') ? nextYear : year;
        return `<span class="px-3 py-1 bg-gray-200 rounded-full text-sm">${h.date.replace('-','/')}: ${h.name}</span>`;
    }).join('');
    
    // Custom holidays
    loadCustomHolidays();
}

function loadCustomHolidays() {
    const container = document.getElementById('customHolidaysContainer');
    const holidays = calendarData.customHolidays || [];
    
    container.innerHTML = holidays.map((h, idx) => `
        <div class="flex items-center gap-2">
            <input type="date" value="${h.date}" class="input-field flex-shrink-0 w-40" 
                onchange="updateCustomHoliday(${idx}, 'date', this.value)">
            <input type="text" value="${h.name}" placeholder="Nama libur" class="input-field flex-1"
                onchange="updateCustomHoliday(${idx}, 'name', this.value)">
            <button onclick="removeCustomHoliday(${idx})" class="text-red-500 hover:text-red-700 p-2">✕</button>
        </div>
    `).join('');
}

function addCustomHoliday() {
    if (!calendarData.customHolidays) {
        calendarData.customHolidays = [];
    }
    calendarData.customHolidays.push({ date: '', name: '' });
    loadCustomHolidays();
}

function updateCustomHoliday(idx, field, value) {
    if (calendarData.customHolidays[idx]) {
        calendarData.customHolidays[idx][field] = value;
    }
}

function removeCustomHoliday(idx) {
    calendarData.customHolidays.splice(idx, 1);
    loadCustomHolidays();
}

async function saveCalendar() {
    showLoading();
    
    calendarData = {
        ganjil: {
            start: document.getElementById('ganjilStart').value,
            end: document.getElementById('ganjilEnd').value
        },
        genap: {
            start: document.getElementById('genapStart').value,
            end: document.getElementById('genapEnd').value
        },
        genapEndKls6: document.getElementById('genapEndKls6').value,
        genapEndKls9: document.getElementById('genapEndKls9').value,
        genapEndKls12: document.getElementById('genapEndKls12').value,
        customHolidays: calendarData.customHolidays || [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('calendars').doc(currentUser.uid).set(calendarData);
        hideLoading();
        showAlert('Kalender berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal menyimpan kalender: ' + error.message, 'error');
    }
}

// Schedule Data
async function loadScheduleData() {
    try {
        const doc = await db.collection('schedules').doc(currentUser.uid).get();
        if (doc.exists) {
            scheduleData = doc.data();
        }
        initializeScheduleGrid();
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

function initializeScheduleGrid() {
    const container = document.getElementById('scheduleGrid');
    const jpDuration = userData?.settings?.lessonDuration || 35;
    const startTime = '07:00';
    const maxJP = 10;
    
    let html = '';
    let currentTime = parseTime(startTime);
    
    for (let jp = 1; jp <= maxJP; jp++) {
        const endTime = addMinutes(currentTime, jpDuration);
        const timeLabel = `${formatTime(currentTime)} - ${formatTime(endTime)}`;
        
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
        
        // Add break row after JP 3 (istirahat)
        if (jp === 3 || jp === 6) {
            html += `<tr class="bg-yellow-50">
                <td colspan="7" class="border p-2 text-center text-sm text-yellow-800 font-medium">
                    ☕ Istirahat (${jp === 3 ? '15' : '30'} menit)
                </td>
            </tr>`;
            currentTime = addMinutes(currentTime, jp === 3 ? 15 : 30);
        }
    }
    
    container.innerHTML = html;
}

function parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h, minutes: m };
}

function addMinutes(time, mins) {
    let totalMins = time.hours * 60 + time.minutes + mins;
    return {
        hours: Math.floor(totalMins / 60),
        minutes: totalMins % 60
    };
}

function formatTime(time) {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

function getClassOptions(selected) {
    const level = userData?.profile?.school?.level || 'SD';
    const classes = level === 'SD' ? [1,2,3,4,5,6] : 
                   level === 'SMP' ? [7,8,9] : [10,11,12];
    return classes.map(c => `<option value="${c}" ${selected == c ? 'selected' : ''}>Kelas ${c}</option>`).join('');
}

function getRombelOptions(selected) {
    const rombels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return rombels.map(r => `<option value="${r}" ${selected == r ? 'selected' : ''}>${r}</option>`).join('');
}

function updateScheduleCell(day, jp) {
    const kelas = document.getElementById(`schedule-${day}-${jp}-class`).value;
    const rombel = document.getElementById(`schedule-${day}-${jp}-rombel`).value;
    
    if (!scheduleData.grid) scheduleData.grid = {};
    scheduleData.grid[`${day}-${jp}`] = { class: kelas, rombel: rombel };
}

function validateSchedule() {
    const errors = [];
    const grid = scheduleData?.grid || {};
    
    // Check for conflicts
    const daySchedule = {};
    
    Object.entries(grid).forEach(([key, val]) => {
        if (!val.class || !val.rombel) return;
        
        const [day, jp] = key.split('-');
        const roomKey = `${day}-${val.class}${val.rombel}`;
        
        if (!daySchedule[roomKey]) {
            daySchedule[roomKey] = [];
        }
        
        // Check if same class-rombel already has schedule at same time
        if (daySchedule[roomKey].includes(jp)) {
            errors.push(`Konflik: Kelas ${val.class}${val.rombel} sudah dijadwalkan di JP ${jp} hari ${getDayName(day)}`);
        }
        daySchedule[roomKey].push(jp);
    });
    
    const validationDiv = document.getElementById('scheduleValidation');
    const errorsList = document.getElementById('validationErrors');
    
    if (errors.length > 0) {
        validationDiv.classList.remove('hidden');
        errorsList.innerHTML = errors.map(e => `<li>• ${e}</li>`).join('');
    } else {
        validationDiv.classList.add('hidden');
        showAlert('✅ Jadwal valid, tidak ada konflik!', 'success');
    }
}

function getDayName(day) {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[day] || '';
}

async function saveSchedule() {
    showLoading();
    
    try {
        scheduleData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('schedules').doc(currentUser.uid).set(scheduleData);
        hideLoading();
        showAlert('Jadwal berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
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
    }
}

function populateStudentsTable() {
    const tbody = document.getElementById('studentsTable');
    
    if (studentsData.length === 0) {
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
            <td class="border p-2">${s.nisn}</td>
            <td class="border p-2">${s.nama}</td>
            <td class="border p-2 text-center">${s.jenis_kelamin}</td>
            <td class="border p-2 text-center">${s.kelas}</td>
            <td class="border p-2 text-center">${s.rombel}</td>
            <td class="border p-2 text-center">
                <button onclick="deleteStudent('${s.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateFilters() {
    const classes = [...new Set(studentsData.map(s => s.kelas))].sort((a,b) => a-b);
    const rombels = [...new Set(studentsData.map(s => s.rombel))].sort();
    
    document.getElementById('filterClass').innerHTML = 
        '<option value="">Semua Kelas</option>' + 
        classes.map(c => `<option value="${c}">Kelas ${c}</option>`).join('');
    
    document.getElementById('filterRombel').innerHTML = 
        '<option value="">Semua Rombel</option>' + 
        rombels.map(r => `<option value="${r}">${r}</option>`).join('');
}

function filterStudents() {
    const filterClass = document.getElementById('filterClass').value;
    const filterRombel = document.getElementById('filterRombel').value;
    const filterGender = document.getElementById('filterGender').value;
    const search = document.getElementById('searchStudent').value.toLowerCase();
    
    let filtered = studentsData.filter(s => {
        if (filterClass && s.kelas != filterClass) return false;
        if (filterRombel && s.rombel !== filterRombel) return false;
        if (filterGender && s.jenis_kelamin !== filterGender) return false;
        if (search && !s.nama.toLowerCase().includes(search) && !s.nisn.includes(search)) return false;
        return true;
    });
    
    const tbody = document.getElementById('studentsTable');
    tbody.innerHTML = filtered.map((s, idx) => `
        <tr class="hover:bg-gray-50">
            <td class="border p-2 text-center">${idx + 1}</td>
            <td class="border p-2">${s.nisn}</td>
            <td class="border p-2">${s.nama}</td>
            <td class="border p-2 text-center">${s.jenis_kelamin}</td>
            <td class="border p-2 text-center">${s.kelas}</td>
            <td class="border p-2 text-center">${s.rombel}</td>
            <td class="border p-2 text-center">
                <button onclick="deleteStudent('${s.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function importStudents() {
    const csvUrl = document.getElementById('csvUrl').value.trim();
    const csvFile = document.getElementById('csvFile').files[0];
    
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
            csvText = await response.text();
        }
        
        const students = parseStudentCSV(csvText);
        
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
        showAlert('Gagal import: ' + error.message, 'error');
    }
}

function parseStudentCSV(csvText) {
    const lines = csvText.split('\n');
    const students = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(';');
        if (parts.length >= 5) {
            students.push({
                nisn: parts[0].trim(),
                nama: parts[1].trim(),
                jenis_kelamin: parts[2].trim().toUpperCase(),
                kelas: parseInt(parts[3].trim()),
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
        showAlert('Gagal menghapus: ' + error.message, 'error');
    }
}

function updateDashboardStats() {
    document.getElementById('totalStudents').textContent = studentsData.length;
    // Other stats can be calculated based on available data
}

// Load CP Data from CSV
async function loadCPData(subject, level) {
    const fileName = `cp-${subject.toLowerCase().replace(/\s+/g, '-')}-${level.toLowerCase()}.csv`;
    
    try {
        const response = await fetch(`data/${fileName}`);
        if (!response.ok) throw new Error('File not found');
        
        const csvText = await response.text();
        return parseCPCSV(csvText);
    } catch (error) {
        console.log(`CP data not found: ${fileName}`);
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