// ============================================
// JADWAL MENGAJAR MODULE
// Admin PAI Super App
// ============================================

// === STATE ===
let schedules = [];
let classes = [];
let students = [];
let currentEditId = null;

// === TIME SLOTS ===
const TIME_SLOTS = [
    { start: "07:00", end: "07:35", label: "07:00 - 07:35" },
    { start: "07:35", end: "08:10", label: "07:35 - 08:10" },
    { start: "08:10", end: "08:45", label: "08:10 - 08:45" },
    { start: "08:45", end: "09:20", label: "08:45 - 09:20" },
    { start: "09:20", end: "09:35", label: "09:20 - 09:35 (Istirahat)" },
    { start: "09:35", end: "10:10", label: "09:35 - 10:10" },
    { start: "10:10", end: "10:45", label: "10:10 - 10:45" },
    { start: "10:45", end: "11:20", label: "10:45 - 11:20" },
    { start: "11:20", end: "11:55", label: "11:20 - 11:55" },
    { start: "11:55", end: "12:30", label: "11:55 - 12:30 (Istirahat)" },
    { start: "12:30", end: "13:05", label: "12:30 - 13:05" },
    { start: "13:05", end: "13:40", label: "13:05 - 13:40" }
];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeJadwalPage();
});

// === INITIALIZE PAGE ===
async function initializeJadwalPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadAllData();
            renderWeeklySchedule();
            renderClassesList();
            renderStudentsList();
            populateClassDropdowns();
            updateSidebarInfo();
            
            // Setup auto-update class name
            setupClassNameAutoUpdate();
        }
    });
}

// === UPDATE SIDEBAR INFO ===
async function updateSidebarInfo() {
    const userData = await getCurrentUserData();
    if (userData) {
        const name = userData.displayName || 'Guru PAI';
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = userData.email;
        document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
    }
}

// === LOAD ALL DATA ===
async function loadAllData() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Load classes
        const classesSnapshot = await collections.classes
            .where('teacherId', '==', userId)
            .orderBy('level')
            .get();
        
        classes = [];
        classesSnapshot.forEach(doc => {
            classes.push({ id: doc.id, ...doc.data() });
        });
        
        // Load schedules
        const schedulesSnapshot = await collections.schedules
            .where('teacherId', '==', userId)
            .get();
        
        schedules = [];
        schedulesSnapshot.forEach(doc => {
            schedules.push({ id: doc.id, ...doc.data() });
        });
        
        // Load students
        const studentsSnapshot = await collections.students
            .where('teacherId', '==', userId)
            .orderBy('name')
            .get();
        
        students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ id: doc.id, ...doc.data() });
        });
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// === RENDER WEEKLY SCHEDULE ===
function renderWeeklySchedule() {
    const tbody = document.getElementById('weeklyScheduleBody');
    if (!tbody) return;
    
    let html = '';
    
    TIME_SLOTS.forEach(slot => {
        const isBreak = slot.label.includes('Istirahat');
        
        html += `<tr class="${isBreak ? 'bg-gray-100' : ''}">`;
        html += `<td class="font-medium text-sm ${isBreak ? 'text-gray-500' : ''}">${slot.label}</td>`;
        
        DAYS.forEach(day => {
            if (isBreak) {
                html += `<td class="text-center text-gray-400 text-sm">-</td>`;
            } else {
                const schedule = findScheduleForSlot(day, slot.start, slot.end);
                
                if (schedule) {
                    html += `
                        <td onclick="editSchedule('${schedule.id}')" 
                            class="cursor-pointer hover:bg-pai-light transition-colors">
                            <div class="bg-pai-green text-white rounded-lg p-2 text-xs">
                                <div class="font-semibold">${schedule.className}</div>
                                <div class="opacity-80">${schedule.room || 'PAI'}</div>
                            </div>
                        </td>
                    `;
                } else {
                    html += `
                        <td onclick="openScheduleModalWithTime('${day}', '${slot.start}', '${slot.end}')"
                            class="cursor-pointer hover:bg-gray-100 transition-colors text-center">
                            <span class="text-gray-300 text-xl">+</span>
                        </td>
                    `;
                }
            }
        });
        
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
}

// === FIND SCHEDULE FOR SLOT ===
function findScheduleForSlot(day, start, end) {
    return schedules.find(s => 
        s.day === day && 
        s.startTime === start && 
        s.endTime === end
    );
}

// === RENDER CLASSES LIST ===
function renderClassesList() {
    const container = document.getElementById('classesList');
    if (!container) return;
    
    if (classes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 col-span-full">
                <span class="text-4xl block mb-2">🏫</span>
                <p>Belum ada kelas</p>
                <button onclick="openClassModal()" class="text-pai-green hover:underline text-sm mt-2">
                    + Tambah Kelas Baru
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = classes.map(cls => {
        const studentCount = students.filter(s => s.classId === cls.id).length;
        const scheduleCount = schedules.filter(s => s.classId === cls.id).length;
        
        return `
            <div class="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-12 h-12 bg-pai-light rounded-xl flex items-center justify-center">
                        <span class="text-2xl">🏫</span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="editClass('${cls.id}')" class="p-1 hover:bg-gray-100 rounded" title="Edit">
                            ✏️
                        </button>
                        <button onclick="deleteClass('${cls.id}')" class="p-1 hover:bg-gray-100 rounded" title="Hapus">
                            🗑️
                        </button>
                    </div>
                </div>
                <h4 class="font-bold text-lg text-gray-800">${cls.name}</h4>
                <p class="text-sm text-gray-500 mb-3">Fase ${cls.fase} • ${cls.wali || 'Wali belum diisi'}</p>
                <div class="flex gap-4 text-sm">
                    <div class="flex items-center gap-1">
                        <span>👨‍🎓</span>
                        <span>${studentCount} siswa</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span>📅</span>
                        <span>${scheduleCount} jadwal</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === RENDER STUDENTS LIST ===
function renderStudentsList(filterClassId = '') {
    const tbody = document.getElementById('studentsBody');
    if (!tbody) return;
    
    let filteredStudents = students;
    if (filterClassId) {
        filteredStudents = students.filter(s => s.classId === filterClassId);
    }
    
    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <span class="text-4xl block mb-2">👨‍🎓</span>
                    <p>Belum ada data siswa</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredStudents.map((student, index) => {
        const cls = classes.find(c => c.id === student.classId);
        
        return `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>${student.nis || '-'}</td>
                <td class="font-medium">${student.name}</td>
                <td>${cls?.name || '-'}</td>
                <td class="text-center">
                    <span class="badge ${student.gender === 'L' ? 'badge-info' : 'badge-warning'}">
                        ${student.gender}
                    </span>
                </td>
                <td>
                    <div class="flex gap-1">
                        <button onclick="editStudent('${student.id}')" class="p-1 hover:bg-gray-100 rounded" title="Edit">
                            ✏️
                        </button>
                        <button onclick="deleteStudent('${student.id}')" class="p-1 hover:bg-gray-100 rounded" title="Hapus">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// === POPULATE CLASS DROPDOWNS ===
function populateClassDropdowns() {
    const dropdowns = ['scheduleClass', 'studentClass', 'importClass', 'filterClass'];
    
    const options = classes.map(cls => 
        `<option value="${cls.id}">${cls.name}</option>`
    ).join('');
    
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const firstOption = select.querySelector('option:first-child');
            select.innerHTML = firstOption.outerHTML + options;
        }
    });
}

// === TAB SWITCHING ===
function switchJadwalTab(tab) {
    document.querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabId = `tab${capitalize(tab)}`;
    const contentId = `content${capitalize(tab)}`;
    
    document.getElementById(tabId)?.classList.add('active');
    document.getElementById(contentId)?.classList.add('active');
}

// === SCHEDULE MODAL ===
function openScheduleModal() {
    document.getElementById('scheduleModalTitle').textContent = 'Tambah Jadwal';
    document.getElementById('formSchedule').reset();
    document.getElementById('scheduleId').value = '';
    document.getElementById('scheduleModal').classList.add('active');
}

function openScheduleModalWithTime(day, start, end) {
    openScheduleModal();
    document.getElementById('scheduleDay').value = day;
    document.getElementById('scheduleStart').value = start;
    document.getElementById('scheduleEnd').value = end;
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('active');
}

async function saveSchedule() {
    const scheduleId = document.getElementById('scheduleId').value;
    const classId = document.getElementById('scheduleClass').value;
    const day = document.getElementById('scheduleDay').value;
    const startTime = document.getElementById('scheduleStart').value;
    const endTime = document.getElementById('scheduleEnd').value;
    const room = document.getElementById('scheduleRoom').value.trim();
    const note = document.getElementById('scheduleNote').value.trim();
    
    if (!classId || !day || !startTime || !endTime) {
        showToast('Lengkapi semua data yang wajib!', 'error');
        return;
    }
    
    const selectedClass = classes.find(c => c.id === classId);
    
    const data = {
        classId,
        className: selectedClass?.name || '',
        day,
        startTime,
        endTime,
        room,
        note,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (scheduleId) {
            await collections.schedules.doc(scheduleId).update(data);
            showToast('Jadwal berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.schedules.add(data);
            showToast('Jadwal berhasil ditambahkan!', 'success');
        }
        
        closeScheduleModal();
        await loadAllData();
        renderWeeklySchedule();
        renderClassesList();
        
    } catch (error) {
        console.error('Error saving schedule:', error);
        showToast('Gagal menyimpan jadwal', 'error');
    }
}

function editSchedule(id) {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;
    
    document.getElementById('scheduleModalTitle').textContent = 'Edit Jadwal';
    document.getElementById('scheduleId').value = schedule.id;
    document.getElementById('scheduleClass').value = schedule.classId;
    document.getElementById('scheduleDay').value = schedule.day;
    document.getElementById('scheduleStart').value = schedule.startTime;
    document.getElementById('scheduleEnd').value = schedule.endTime;
    document.getElementById('scheduleRoom').value = schedule.room || '';
    document.getElementById('scheduleNote').value = schedule.note || '';
    
    document.getElementById('scheduleModal').classList.add('active');
}

async function deleteSchedule(id) {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    
    try {
        await collections.schedules.doc(id).delete();
        showToast('Jadwal berhasil dihapus!', 'success');
        
        await loadAllData();
        renderWeeklySchedule();
        renderClassesList();
    } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Gagal menghapus jadwal', 'error');
    }
}

// === CLASS MODAL ===
function openClassModal() {
    document.getElementById('classModalTitle').textContent = 'Tambah Kelas';
    document.getElementById('formClass').reset();
    document.getElementById('classId').value = '';
    document.getElementById('className').value = '';
    document.getElementById('classFase').value = '';
    document.getElementById('classModal').classList.add('active');
}

function closeClassModal() {
    document.getElementById('classModal').classList.remove('active');
}

function setupClassNameAutoUpdate() {
    const levelInput = document.getElementById('classLevel');
    const rombelInput = document.getElementById('classRombel');
    
    const updateClassName = () => {
        const level = levelInput.value;
        const rombel = rombelInput.value.trim().toUpperCase();
        
        if (level && rombel) {
            document.getElementById('className').value = `Kelas ${level}${rombel}`;
        }
    };
    
    levelInput?.addEventListener('change', updateClassName);
    rombelInput?.addEventListener('input', updateClassName);
}

function updateFase() {
    const level = document.getElementById('classLevel').value;
    const fase = getFaseByKelas(level);
    document.getElementById('classFase').value = fase ? `Fase ${fase}` : '';
}

async function saveClass() {
    const classId = document.getElementById('classId').value;
    const level = document.getElementById('classLevel').value;
    const rombel = document.getElementById('classRombel').value.trim().toUpperCase();
    const studentCount = parseInt(document.getElementById('classStudentCount').value) || 0;
    const wali = document.getElementById('classWali').value.trim();
    
    if (!level || !rombel) {
        showToast('Lengkapi tingkat dan rombel!', 'error');
        return;
    }
    
    const name = `Kelas ${level}${rombel}`;
    const fase = getFaseByKelas(level);
    
    const data = {
        name,
        level: parseInt(level),
        rombel,
        fase,
        studentCount,
        wali,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (classId) {
            await collections.classes.doc(classId).update(data);
            showToast('Kelas berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.classes.add(data);
            showToast('Kelas berhasil ditambahkan!', 'success');
        }
        
        closeClassModal();
        await loadAllData();
        renderClassesList();
        populateClassDropdowns();
        
    } catch (error) {
        console.error('Error saving class:', error);
        showToast('Gagal menyimpan kelas', 'error');
    }
}

function editClass(id) {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    
    document.getElementById('classModalTitle').textContent = 'Edit Kelas';
    document.getElementById('classId').value = cls.id;
    document.getElementById('classLevel').value = cls.level;
    document.getElementById('classRombel').value = cls.rombel;
    document.getElementById('className').value = cls.name;
    document.getElementById('classFase').value = `Fase ${cls.fase}`;
    document.getElementById('classStudentCount').value = cls.studentCount || 0;
    document.getElementById('classWali').value = cls.wali || '';
    
    document.getElementById('classModal').classList.add('active');
}

async function deleteClass(id) {
    const cls = classes.find(c => c.id === id);
    const studentCount = students.filter(s => s.classId === id).length;
    
    if (studentCount > 0) {
        showToast(`Tidak bisa menghapus kelas yang memiliki ${studentCount} siswa!`, 'error');
        return;
    }
    
    if (!confirm(`Yakin ingin menghapus ${cls?.name}?`)) return;
    
    try {
        // Delete associated schedules
        const schedulesToDelete = schedules.filter(s => s.classId === id);
        for (const schedule of schedulesToDelete) {
            await collections.schedules.doc(schedule.id).delete();
        }
        
        await collections.classes.doc(id).delete();
        showToast('Kelas berhasil dihapus!', 'success');
        
        await loadAllData();
        renderClassesList();
        renderWeeklySchedule();
        populateClassDropdowns();
    } catch (error) {
        console.error('Error deleting class:', error);
        showToast('Gagal menghapus kelas', 'error');
    }
}

// === STUDENT MODAL ===
function openStudentModal() {
    document.getElementById('studentModalTitle').textContent = 'Tambah Siswa';
    document.getElementById('formStudent').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentModal').classList.add('active');
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('active');
}

async function saveStudent() {
    const studentId = document.getElementById('studentId').value;
    const nis = document.getElementById('studentNis').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const classId = document.getElementById('studentClass').value;
    const gender = document.getElementById('studentGender').value;
    const birthPlace = document.getElementById('studentBirthPlace').value.trim();
    const birthDate = document.getElementById('studentBirthDate').value;
    const parent = document.getElementById('studentParent').value.trim();
    
    if (!name || !classId || !gender) {
        showToast('Lengkapi data yang wajib!', 'error');
        return;
    }
    
    const data = {
        nis,
        name,
        classId,
        gender,
        birthPlace,
        birthDate,
        parent,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (studentId) {
            await collections.students.doc(studentId).update(data);
            showToast('Siswa berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.students.add(data);
            showToast('Siswa berhasil ditambahkan!', 'success');
        }
        
        closeStudentModal();
        await loadAllData();
        renderStudentsList();
        renderClassesList();
        
    } catch (error) {
        console.error('Error saving student:', error);
        showToast('Gagal menyimpan data siswa', 'error');
    }
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    document.getElementById('studentModalTitle').textContent = 'Edit Siswa';
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentNis').value = student.nis || '';
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentClass').value = student.classId;
    document.getElementById('studentGender').value = student.gender;
    document.getElementById('studentBirthPlace').value = student.birthPlace || '';
    document.getElementById('studentBirthDate').value = student.birthDate || '';
    document.getElementById('studentParent').value = student.parent || '';
    
    document.getElementById('studentModal').classList.add('active');
}

async function deleteStudent(id) {
    const student = students.find(s => s.id === id);
    if (!confirm(`Yakin ingin menghapus data ${student?.name}?`)) return;
    
    try {
        await collections.students.doc(id).delete();
        showToast('Siswa berhasil dihapus!', 'success');
        
        await loadAllData();
        renderStudentsList();
        renderClassesList();
    } catch (error) {
        console.error('Error deleting student:', error);
        showToast('Gagal menghapus siswa', 'error');
    }
}

function filterStudentsByClass() {
    const classId = document.getElementById('filterClass').value;
    renderStudentsList(classId);
}

// === IMPORT MODAL ===
function openImportModal() {
    document.getElementById('importModal').classList.add('active');
    document.getElementById('importPreview').classList.add('hidden');
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}

function downloadTemplate() {
    const csvContent = "NIS,Nama Lengkap,Jenis Kelamin (L/P),Tempat Lahir,Tanggal Lahir (YYYY-MM-DD),Nama Orang Tua\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_siswa.csv';
    a.click();
    showToast('Template berhasil diunduh!', 'success');
}

async function processImport() {
    const classId = document.getElementById('importClass').value;
    const file = document.getElementById('importFile').files[0];
    
    if (!classId) {
        showToast('Pilih kelas tujuan!', 'error');
        return;
    }
    
    if (!file) {
        showToast('Pilih file untuk diimport!', 'error');
        return;
    }
    
    try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        let imported = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 2 && values[1].trim()) {
                const data = {
                    nis: values[0]?.trim() || '',
                    name: values[1]?.trim() || '',
                    gender: values[2]?.trim().toUpperCase() === 'P' ? 'P' : 'L',
                    birthPlace: values[3]?.trim() || '',
                    birthDate: values[4]?.trim() || '',
                    parent: values[5]?.trim() || '',
                    classId,
                    teacherId: auth.currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await collections.students.add(data);
                imported++;
            }
        }
        
        showToast(`${imported} siswa berhasil diimport!`, 'success');
        closeImportModal();
        
        await loadAllData();
        renderStudentsList();
        renderClassesList();
        
    } catch (error) {
        console.error('Error importing:', error);
        showToast('Gagal mengimport data. Pastikan format file benar.', 'error');
    }
}

// === PRINT ===
function printSchedule() {
    window.print();
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

// === HELPER ===
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

console.log('✅ Jadwal module initialized');