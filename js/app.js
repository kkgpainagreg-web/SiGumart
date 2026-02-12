// ============================================
// MAIN APP MODULE
// Admin PAI Super App
// ============================================

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setCurrentDate();
});

// === SET CURRENT DATE ===
function setCurrentDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const today = new Date().toLocaleDateString('id-ID', options);
    
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = today;
    }
}

// === INITIALIZE DASHBOARD ===
async function initializeDashboard() {
    // Wait for auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserInfo();
            await loadDashboardStats();
            await loadTodaySchedule();
            await loadRecentJournals();
            await loadAttendanceStats();
        }
    });
}

// === LOAD USER INFO ===
async function loadUserInfo() {
    try {
        const userData = await getCurrentUserData();
        
        if (userData) {
            // Update sidebar user info
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userAvatar = document.getElementById('userAvatar');
            const welcomeName = document.getElementById('welcomeName');
            
            if (userName) userName.textContent = userData.displayName || 'Guru PAI';
            if (userEmail) userEmail.textContent = userData.email;
            if (welcomeName) welcomeName.textContent = (userData.displayName || 'Guru').split(' ')[0];
            
            if (userAvatar) {
                const initial = (userData.displayName || 'G').charAt(0).toUpperCase();
                userAvatar.textContent = initial;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// === LOAD DASHBOARD STATS ===
async function loadDashboardStats() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Get student count
        const studentsSnapshot = await collections.students
            .where('teacherId', '==', userId)
            .get();
        document.getElementById('statStudents').textContent = studentsSnapshot.size;
        
        // Get class count
        const classesSnapshot = await collections.classes
            .where('teacherId', '==', userId)
            .get();
        document.getElementById('statClasses').textContent = classesSnapshot.size;
        
        // Get modules count
        const modulesSnapshot = await collections.modules
            .where('teacherId', '==', userId)
            .get();
        document.getElementById('statModules').textContent = modulesSnapshot.size;
        
        // Get questions count
        const questionsSnapshot = await collections.questions
            .where('teacherId', '==', userId)
            .get();
        document.getElementById('statQuestions').textContent = questionsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// === LOAD TODAY'S SCHEDULE ===
async function loadTodaySchedule() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const today = new Date();
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = dayNames[today.getDay()];
        
        const scheduleSnapshot = await collections.schedules
            .where('teacherId', '==', userId)
            .where('day', '==', todayName)
            .orderBy('startTime')
            .get();
        
        const container = document.getElementById('todaySchedule');
        if (!container) return;
        
        if (scheduleSnapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <span class="text-4xl block mb-2">📚</span>
                    <p>Tidak ada jadwal hari ini</p>
                    <a href="jadwal.html" class="text-pai-green hover:underline text-sm">+ Tambah Jadwal</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        scheduleSnapshot.forEach(doc => {
            const schedule = doc.data();
            html += `
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-pai-light transition-colors">
                    <div class="text-center">
                        <div class="text-lg font-bold text-pai-green">${schedule.startTime}</div>
                        <div class="text-xs text-gray-500">${schedule.endTime}</div>
                    </div>
                    <div class="w-1 h-12 bg-pai-green rounded-full"></div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${schedule.className}</h4>
                        <p class="text-sm text-gray-600">${schedule.topic || 'PAI'}</p>
                    </div>
                    <a href="absensi.html?class=${doc.id}" class="btn btn-outline text-sm py-2">
                        Absensi
                    </a>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

// === LOAD RECENT JOURNALS ===
async function loadRecentJournals() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const journalsSnapshot = await collections.journals
            .where('teacherId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const container = document.getElementById('recentJournals');
        if (!container) return;
        
        if (journalsSnapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <p class="text-sm">Belum ada jurnal</p>
                    <a href="jurnal.html" class="text-pai-green hover:underline text-sm">+ Buat Jurnal</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        journalsSnapshot.forEach(doc => {
            const journal = doc.data();
            const date = journal.date?.toDate?.() || new Date();
            const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            
            html += `
                <div class="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div class="w-10 h-10 bg-pai-light rounded-lg flex items-center justify-center text-pai-green font-bold text-sm">
                        ${dateStr}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-medium text-gray-800 truncate">${journal.topic || 'Pembelajaran'}</h4>
                        <p class="text-sm text-gray-500 truncate">${journal.className || 'Kelas'}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading journals:', error);
    }
}

// === LOAD ATTENDANCE STATS ===
async function loadAttendanceStats() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Get this week's attendance
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const attendanceSnapshot = await collections.attendance
            .where('teacherId', '==', userId)
            .where('date', '>=', startOfWeek)
            .get();
        
        let stats = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
        let total = 0;
        
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.records && Array.isArray(data.records)) {
                data.records.forEach(record => {
                    const status = record.status?.toLowerCase();
                    if (stats.hasOwnProperty(status)) {
                        stats[status]++;
                    }
                    total++;
                });
            }
        });
        
        // Calculate percentages and update UI
        const hadir = total > 0 ? Math.round((stats.hadir / total) * 100) : 0;
        const izin = total > 0 ? Math.round((stats.izin / total) * 100) : 0;
        const sakit = total > 0 ? Math.round((stats.sakit / total) * 100) : 0;
        const alpha = total > 0 ? Math.round((stats.alpha / total) * 100) : 0;
        
        document.getElementById('attendanceHadir').textContent = hadir + '%';
        document.getElementById('attendanceIzin').textContent = izin + '%';
        document.getElementById('attendanceSakit').textContent = sakit + '%';
        document.getElementById('attendanceAlpha').textContent = alpha + '%';
        
        document.getElementById('progressHadir').style.width = hadir + '%';
        document.getElementById('progressIzin').style.width = izin + '%';
        document.getElementById('progressSakit').style.width = sakit + '%';
        document.getElementById('progressAlpha').style.width = alpha + '%';
        
    } catch (error) {
        console.error('Error loading attendance stats:', error);
    }
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// === QUICK ACTION MODAL ===
function openQuickAction() {
    document.getElementById('quickActionModal').classList.add('active');
}

function closeQuickAction() {
    document.getElementById('quickActionModal').classList.remove('active');
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('quickActionModal');
    if (e.target === modal) {
        closeQuickAction();
    }
});

// === UTILITY FUNCTIONS ===

// Format date to Indonesian
function formatDate(date, format = 'full') {
    const options = {
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' }
    };
    
    return new Date(date).toLocaleDateString('id-ID', options[format] || options.full);
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

// Show loading overlay
function showLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    overlay.innerHTML = `
        <div class="bg-white rounded-xl p-6 flex flex-col items-center gap-4">
            <div class="loader"></div>
            <p class="text-gray-700">${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Export to PDF helper
async function exportToPDF(elementId, filename) {
    showLoading('Membuat PDF...');
    
    try {
        const element = document.getElementById(elementId);
        // Note: This requires html2pdf library
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        
        if (typeof html2pdf !== 'undefined') {
            const opt = {
                margin: 10,
                filename: filename + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            await html2pdf().set(opt).from(element).save();
            showToast('PDF berhasil diunduh!', 'success');
        } else {
            // Fallback: print dialog
            window.print();
        }
    } catch (error) {
        console.error('Export PDF error:', error);
        showToast('Gagal membuat PDF.', 'error');
    } finally {
        hideLoading();
    }
}

// Export to Excel helper
function exportToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        cols.forEach(col => {
            rowData.push('"' + col.innerText.replace(/"/g, '""') + '"');
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = filename + '.csv';
    link.click();
    
    showToast('File berhasil diunduh!', 'success');
}

console.log('✅ App module initialized');
