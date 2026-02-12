// ============================================
// KALENDER AKADEMIK MODULE
// Admin PAI Super App
// ============================================

// === STATE ===
let currentDate = new Date();
let selectedDate = new Date();
let calendarEvents = [];
let currentEventId = null;

// === HARI BESAR DEFAULT ===
const DEFAULT_EVENTS = [
    { title: "Tahun Baru Masehi", date: "2025-01-01", type: "nasional" },
    { title: "Isra Mi'raj Nabi Muhammad SAW", date: "2025-01-27", type: "islam" },
    { title: "Tahun Baru Imlek", date: "2025-01-29", type: "nasional" },
    { title: "Hari Raya Nyepi", date: "2025-03-29", type: "nasional" },
    { title: "Awal Ramadan 1446 H", date: "2025-03-01", type: "islam" },
    { title: "Wafat Isa Al-Masih", date: "2025-04-18", type: "nasional" },
    { title: "Idul Fitri 1446 H", date: "2025-03-31", type: "islam" },
    { title: "Cuti Bersama Idul Fitri", date: "2025-04-01", type: "libur" },
    { title: "Cuti Bersama Idul Fitri", date: "2025-04-02", type: "libur" },
    { title: "Cuti Bersama Idul Fitri", date: "2025-04-03", type: "libur" },
    { title: "Cuti Bersama Idul Fitri", date: "2025-04-04", type: "libur" },
    { title: "Hari Buruh Internasional", date: "2025-05-01", type: "nasional" },
    { title: "Kenaikan Isa Al-Masih", date: "2025-05-29", type: "nasional" },
    { title: "Hari Lahir Pancasila", date: "2025-06-01", type: "nasional" },
    { title: "Idul Adha 1446 H", date: "2025-06-07", type: "islam" },
    { title: "Cuti Bersama Idul Adha", date: "2025-06-09", type: "libur" },
    { title: "Tahun Baru Islam 1447 H", date: "2025-06-27", type: "islam" },
    { title: "Hari Kemerdekaan RI", date: "2025-08-17", type: "nasional" },
    { title: "Maulid Nabi Muhammad SAW", date: "2025-09-05", type: "islam" },
    { title: "Hari Guru Nasional", date: "2025-11-25", type: "sekolah" },
    { title: "Hari Natal", date: "2025-12-25", type: "nasional" }
];

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeKalender();
});

// === INITIALIZE KALENDER ===
async function initializeKalender() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadCalendarEvents();
            renderCalendar();
            loadUpcomingEvents();
            updateStats();
            updateSidebarInfo();
        }
    });
}

// === UPDATE SIDEBAR INFO ===
async function updateSidebarInfo() {
    const userData = await getCurrentUserData();
    if (userData) {
        const name = userData.displayName || 'Guru PAI';
        const email = userData.email || '';
        const initial = name.charAt(0).toUpperCase();
        
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = email;
        document.getElementById('sidebarAvatar').textContent = initial;
    }
}

// === LOAD CALENDAR EVENTS ===
async function loadCalendarEvents() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        // Load user's custom events
        const snapshot = await collections.calendar
            .where('teacherId', '==', userId)
            .get();
        
        calendarEvents = [];
        
        snapshot.forEach(doc => {
            calendarEvents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Add default events if not exists
        DEFAULT_EVENTS.forEach(event => {
            const exists = calendarEvents.find(e => 
                e.title === event.title && 
                e.startDate === event.date
            );
            if (!exists) {
                calendarEvents.push({
                    id: 'default-' + event.date,
                    title: event.title,
                    startDate: event.date,
                    endDate: event.date,
                    type: event.type,
                    isDefault: true
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// === RENDER CALENDAR ===
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day and total days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const today = new Date();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const dayEl = createDayElement(day, 'prev', year, month - 1);
        grid.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDateString(year, month, day);
        const isToday = 
            today.getDate() === day && 
            today.getMonth() === month && 
            today.getFullYear() === year;
        
        const events = getEventsForDate(dateStr);
        const dayEl = createDayElement(day, 'current', year, month, isToday, events);
        
        // Check if selected
        if (selectedDate.getDate() === day && 
            selectedDate.getMonth() === month && 
            selectedDate.getFullYear() === year) {
            dayEl.classList.add('ring-2', 'ring-pai-gold');
        }
        
        grid.appendChild(dayEl);
    }
    
    // Next month days
    const remainingDays = 42 - (firstDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createDayElement(day, 'next', year, month + 1);
        grid.appendChild(dayEl);
    }
    
    // Update selected date events
    showSelectedDateEvents();
}

// === CREATE DAY ELEMENT ===
function createDayElement(day, type, year, month, isToday = false, events = []) {
    const div = document.createElement('div');
    const dateStr = formatDateString(year, month, day);
    
    div.className = `
        min-h-[60px] p-1 rounded-lg cursor-pointer transition-all hover:bg-gray-100
        ${type !== 'current' ? 'text-gray-400' : ''}
        ${isToday ? 'bg-pai-green text-white hover:bg-green-700' : ''}
    `;
    
    div.onclick = () => selectDate(year, month, day);
    
    // Day number
    const dayNum = document.createElement('div');
    dayNum.className = 'text-sm font-medium text-center';
    dayNum.textContent = day;
    div.appendChild(dayNum);
    
    // Event indicators
    if (events.length > 0 && type === 'current') {
        const indicators = document.createElement('div');
        indicators.className = 'flex justify-center gap-1 mt-1 flex-wrap';
        
        const uniqueTypes = [...new Set(events.map(e => e.type))];
        uniqueTypes.slice(0, 3).forEach(eventType => {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full ${getEventColor(eventType)}`;
            indicators.appendChild(dot);
        });
        
        if (events.length > 3) {
            const more = document.createElement('div');
            more.className = 'text-xs text-gray-500';
            more.textContent = '+' + (events.length - 3);
            indicators.appendChild(more);
        }
        
        div.appendChild(indicators);
    }
    
    return div;
}

// === GET EVENT COLOR ===
function getEventColor(type) {
    const colors = {
        sekolah: 'bg-blue-500',
        libur: 'bg-red-500',
        ujian: 'bg-yellow-500',
        islam: 'bg-purple-500',
        nasional: 'bg-green-500',
        lainnya: 'bg-gray-500'
    };
    return colors[type] || colors.lainnya;
}

// === GET EVENTS FOR DATE ===
function getEventsForDate(dateStr) {
    return calendarEvents.filter(event => {
        const startDate = event.startDate;
        const endDate = event.endDate || event.startDate;
        return dateStr >= startDate && dateStr <= endDate;
    });
}

// === FORMAT DATE STRING ===
function formatDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// === SELECT DATE ===
function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    renderCalendar();
}

// === SHOW SELECTED DATE EVENTS ===
function showSelectedDateEvents() {
    const dateStr = formatDateString(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    );
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = selectedDate.toLocaleDateString('id-ID', options);
    
    document.getElementById('selectedDateTitle').textContent = formattedDate;
    
    const events = getEventsForDate(dateStr);
    const container = document.getElementById('selectedDateEvents');
    
    if (events.length === 0) {
        container.innerHTML = `
            <p class="text-gray-500 text-sm text-center py-4">Tidak ada kegiatan</p>
            <button onclick="openEventModal('${dateStr}')" class="w-full py-2 text-pai-green text-sm hover:underline">
                + Tambah Kegiatan
            </button>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div onclick="showEventDetail('${event.id}')" 
             class="p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors
                    ${getBorderColor(event.type)}">
            <div class="font-medium text-gray-800">${event.title}</div>
            <div class="text-xs text-gray-500 mt-1">${getEventTypeLabel(event.type)}</div>
        </div>
    `).join('');
}

// === GET BORDER COLOR ===
function getBorderColor(type) {
    const colors = {
        sekolah: 'border-blue-500 bg-blue-50',
        libur: 'border-red-500 bg-red-50',
        ujian: 'border-yellow-500 bg-yellow-50',
        islam: 'border-purple-500 bg-purple-50',
        nasional: 'border-green-500 bg-green-50',
        lainnya: 'border-gray-500 bg-gray-50'
    };
    return colors[type] || colors.lainnya;
}

// === GET EVENT TYPE LABEL ===
function getEventTypeLabel(type) {
    const labels = {
        sekolah: '🏫 Kegiatan Sekolah',
        libur: '🔴 Libur',
        ujian: '📝 Ujian/Penilaian',
        islam: '🕌 Hari Besar Islam',
        nasional: '🇮🇩 Hari Nasional',
        lainnya: '📌 Lainnya'
    };
    return labels[type] || labels.lainnya;
}

// === LOAD UPCOMING EVENTS ===
function loadUpcomingEvents() {
    const today = new Date();
    const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    
    const upcoming = calendarEvents
        .filter(e => e.startDate >= todayStr)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 5);
    
    const container = document.getElementById('upcomingEvents');
    
    if (upcoming.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Tidak ada kegiatan mendatang</p>';
        return;
    }
    
    container.innerHTML = upcoming.map(event => {
        const date = new Date(event.startDate);
        const options = { day: 'numeric', month: 'short' };
        const formattedDate = date.toLocaleDateString('id-ID', options);
        
        return `
            <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                 onclick="showEventDetail('${event.id}')">
                <div class="w-12 h-12 rounded-lg ${getEventColor(event.type).replace('bg-', 'bg-opacity-20 bg-')} 
                            flex items-center justify-center text-sm font-bold">
                    ${formattedDate}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-800 truncate">${event.title}</div>
                    <div class="text-xs text-gray-500">${getEventTypeLabel(event.type)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// === UPDATE STATS ===
function updateStats() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    let liburCount = 0;
    let kegiatanCount = 0;
    
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDateString(year, month, day);
        const events = getEventsForDate(dateStr);
        
        const hasLibur = events.some(e => e.type === 'libur' || e.type === 'nasional');
        if (hasLibur) liburCount++;
        
        kegiatanCount += events.length;
    }
    
    // Count Sundays
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 0) {
            const dateStr = formatDateString(year, month, day);
            const hasEvent = getEventsForDate(dateStr).some(e => e.type === 'libur');
            if (!hasEvent) liburCount++;
        }
    }
    
    const efektif = totalDays - liburCount;
    
    document.getElementById('statEfektif').textContent = efektif + ' hari';
    document.getElementById('statLibur').textContent = liburCount + ' hari';
    document.getElementById('statKegiatan').textContent = kegiatanCount + ' kegiatan';
}

// === NAVIGATION ===
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateStats();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateStats();
}

// === MODAL FUNCTIONS ===
function openEventModal(dateStr = null) {
    document.getElementById('eventModalTitle').textContent = 'Tambah Kegiatan';
    document.getElementById('formEvent').reset();
    document.getElementById('eventId').value = '';
    
    if (dateStr) {
        document.getElementById('eventStartDate').value = dateStr;
        document.getElementById('eventEndDate').value = dateStr;
    } else {
        const today = formatDateString(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
        );
        document.getElementById('eventStartDate').value = today;
        document.getElementById('eventEndDate').value = today;
    }
    
    document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

function showEventDetail(eventId) {
    const event = calendarEvents.find(e => e.id === eventId);
    if (!event) return;
    
    currentEventId = eventId;
    
    document.getElementById('detailTitle').textContent = event.title;
    
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    let dateText = startDate.toLocaleDateString('id-ID', options);
    if (event.endDate && event.endDate !== event.startDate) {
        dateText += ' - ' + endDate.toLocaleDateString('id-ID', options);
    }
    
    document.getElementById('eventDetailContent').innerHTML = `
        <div class="space-y-4">
            <div>
                <div class="text-sm text-gray-500">Tanggal</div>
                <div class="font-medium">${dateText}</div>
            </div>
            <div>
                <div class="text-sm text-gray-500">Jenis Kegiatan</div>
                <div class="font-medium">${getEventTypeLabel(event.type)}</div>
            </div>
            ${event.description ? `
                <div>
                    <div class="text-sm text-gray-500">Deskripsi</div>
                    <div class="text-gray-700">${event.description}</div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Hide edit/delete for default events
    const footer = document.querySelector('#eventDetailModal .modal-footer');
    if (event.isDefault) {
        footer.innerHTML = `
            <button type="button" onclick="closeEventDetailModal()" class="btn btn-secondary">Tutup</button>
        `;
    } else {
        footer.innerHTML = `
            <button type="button" onclick="deleteEvent()" class="btn btn-danger">🗑️ Hapus</button>
            <button type="button" onclick="editEvent()" class="btn btn-warning">✏️ Edit</button>
            <button type="button" onclick="closeEventDetailModal()" class="btn btn-secondary">Tutup</button>
        `;
    }
    
    document.getElementById('eventDetailModal').classList.add('active');
}

function closeEventDetailModal() {
    document.getElementById('eventDetailModal').classList.remove('active');
    currentEventId = null;
}

// === SAVE EVENT ===
async function saveEvent() {
    const eventId = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value.trim();
    const startDate = document.getElementById('eventStartDate').value;
    const endDate = document.getElementById('eventEndDate').value || startDate;
    const type = document.getElementById('eventType').value;
    const description = document.getElementById('eventDescription').value.trim();
    
    if (!title || !startDate) {
        showToast('Lengkapi data kegiatan!', 'error');
        return;
    }
    
    const eventData = {
        title,
        startDate,
        endDate,
        type,
        description,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (eventId) {
            // Update existing
            await collections.calendar.doc(eventId).update(eventData);
            showToast('Kegiatan berhasil diperbarui!', 'success');
        } else {
            // Create new
            eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.calendar.add(eventData);
            showToast('Kegiatan berhasil ditambahkan!', 'success');
        }
        
        closeEventModal();
        await loadCalendarEvents();
        renderCalendar();
        loadUpcomingEvents();
        updateStats();
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Gagal menyimpan kegiatan', 'error');
    }
}

// === EDIT EVENT ===
function editEvent() {
    const event = calendarEvents.find(e => e.id === currentEventId);
    if (!event || event.isDefault) return;
    
    closeEventDetailModal();
    
    document.getElementById('eventModalTitle').textContent = 'Edit Kegiatan';
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventStartDate').value = event.startDate;
    document.getElementById('eventEndDate').value = event.endDate || '';
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDescription').value = event.description || '';
    
    document.getElementById('eventModal').classList.add('active');
}

// === DELETE EVENT ===
async function deleteEvent() {
    const event = calendarEvents.find(e => e.id === currentEventId);
    if (!event || event.isDefault) return;
    
    if (!confirm('Yakin ingin menghapus kegiatan ini?')) return;
    
    try {
        await collections.calendar.doc(currentEventId).delete();
        
        showToast('Kegiatan berhasil dihapus!', 'success');
        closeEventDetailModal();
        
        await loadCalendarEvents();
        renderCalendar();
        loadUpcomingEvents();
        updateStats();
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Gagal menghapus kegiatan', 'error');
    }
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

console.log('✅ Kalender module initialized');