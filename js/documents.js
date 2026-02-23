// ================================================
// DOCUMENTS.JS - Generate All Documents
// ================================================

// Helper: Get Phase from Class
function getPhase(kelas) {
    const k = parseInt(kelas);
    if (k <= 2) return { letter: 'A', name: 'Fase A' };
    if (k <= 4) return { letter: 'B', name: 'Fase B' };
    if (k <= 6) return { letter: 'C', name: 'Fase C' };
    if (k <= 9) return { letter: 'D', name: 'Fase D' };
    if (k === 10) return { letter: 'E', name: 'Fase E' };
    return { letter: 'F', name: 'Fase F' };
}

// Helper: Extract competency keyword from TP
function extractKompetensi(tp) {
    const keywords = [
        'menjelaskan', 'mengidentifikasi', 'menganalisis', 'menerapkan',
        'membuat', 'menyusun', 'mengevaluasi', 'memahami', 'menghafal',
        'melafalkan', 'mempraktikkan', 'mendemonstrasikan', 'menyebutkan',
        'membedakan', 'mengklasifikasi', 'menghitung', 'menulis', 'membaca'
    ];
    
    const tpLower = tp.toLowerCase();
    for (let kw of keywords) {
        if (tpLower.includes(kw)) {
            return kw.charAt(0).toUpperCase() + kw.slice(1);
        }
    }
    return 'Memahami';
}

// Helper: Update signature areas
function updateSignature(prefix) {
    const city = userData?.profile?.school?.city || 'Jakarta';
    const today = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dateStr = `${city}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    
    const elements = {
        [`${prefix}Location`]: dateStr,
        [`${prefix}Headmaster`]: userData?.profile?.school?.headmaster || '.............................',
        [`${prefix}HeadmasterNip`]: userData?.profile?.school?.headmasterNip || '.............................',
        [`${prefix}Teacher`]: userData?.name || '.............................',
        [`${prefix}TeacherNip`]: userData?.profile?.nip || '.............................'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// Helper: Get class options based on school level
function getClassOptionsForLevel() {
    const level = userData?.profile?.school?.level || 'SD';
    if (level === 'SD') return [1, 2, 3, 4, 5, 6];
    if (level === 'SMP') return [7, 8, 9];
    return [10, 11, 12];
}

// Initialize class dropdowns
function initializeClassDropdowns() {
    const classes = getClassOptionsForLevel();
    const dropdowns = ['atpClass', 'protaClass', 'promesClass', 'modulClass', 'lkpdClass', 
                       'kktpClass', 'journalClass', 'gradesClass', 'attendanceClass'];
    
    dropdowns.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = classes.map(c => `<option value="${c}">Kelas ${c}</option>`).join('');
        }
    });
}

// Load Elemen/Bab options from CP data
async function loadElemenOptions(prefix) {
    const subjectEl = document.getElementById(`${prefix}Subject`);
    const classEl = document.getElementById(`${prefix}Class`);
    const semesterEl = document.getElementById(`${prefix}Semester`);
    const elemenEl = document.getElementById(`${prefix}Elemen`);
    
    if (!subjectEl || !classEl || !elemenEl) return;
    
    const subject = subjectEl.value;
    const kelas = classEl.value;
    const semester = semesterEl?.value || 'Ganjil';
    
    if (!subject) {
        elemenEl.innerHTML = '<option value="">Pilih mapel dulu</option>';
        return;
    }
    
    const level = userData?.profile?.school?.level || 'SD';
    const cpData = await loadCPData(subject, level);
    
    const filtered = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase()
    );
    
    const elemenSet = new Set();
    filtered.forEach(d => elemenSet.add(d.elemen));
    
    if (elemenSet.size === 0) {
        elemenEl.innerHTML = '<option value="">Tidak ada data</option>';
    } else {
        elemenEl.innerHTML = [...elemenSet].map(e => 
            `<option value="${e}">${e}</option>`
        ).join('');
    }
}

// ================================================
// GENERATE ATP
// ================================================
async function generateATP() {
    const subject = document.getElementById('atpSubject')?.value;
    const kelas = document.getElementById('atpClass')?.value;
    const semester = document.getElementById('atpSemester')?.value || 'Ganjil';
    const jpPerMeeting = parseInt(document.getElementById('atpJP')?.value) || 4;
    const rombel = document.getElementById('atpRombel')?.value || 'A';
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header
    document.getElementById('atpYear').textContent = academicYear;
    document.getElementById('atpSchool').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('atpSubjectName').textContent = subject;
    document.getElementById('atpPhaseClass').textContent = `${phase.name} / Kelas ${kelas}`;
    document.getElementById('atpSemesterName').textContent = semester;
    
    // Update signature
    updateSignature('atp');
    
    // Load CP data
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase()
    );
    
    const tbody = document.getElementById('atpBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-gray-500 py-8">
                    <p class="mb-2">Data CP/TP belum tersedia untuk <strong>${subject}</strong> Kelas <strong>${kelas}</strong> Semester <strong>${semester}</strong>.</p>
                    <p class="text-sm">Gunakan menu <a href="#" onclick="showSection('ai-assistant')" class="text-primary-600 underline">AI Assistant</a> untuk membuat file CSV.</p>
                </td>
            </tr>
        `;
        hideLoading();
        return;
    }
    
    // Group by elemen
    const grouped = {};
    filteredData.forEach(item => {
        if (!grouped[item.elemen]) {
            grouped[item.elemen] = { cp: item.cp, tps: [] };
        }
        grouped[item.elemen].tps.push({ tp: item.tp, dimensi: item.dimensi });
    });
    
    let html = '';
    let no = 1;
    
    Object.entries(grouped).forEach(([elemen, data]) => {
        const totalJP = data.tps.length * jpPerMeeting;
        const minggu = data.tps.length;
        
        data.tps.forEach((tp, idx) => {
            const kompetensi = extractKompetensi(tp.tp);
            
            html += `<tr class="hover:bg-gray-50">`;
            
            if (idx === 0) {
                html += `
                    <td rowspan="${data.tps.length}" class="border border-gray-400 p-2 text-center align-top">${no}</td>
                    <td rowspan="${data.tps.length}" class="border border-gray-400 p-2 text-left align-top text-xs">
                        <strong class="text-primary-700">${elemen}</strong><br><br>
                        <span class="text-gray-600">${data.cp}</span>
                    </td>
                `;
                no++;
            }
            
            html += `
                <td class="border border-gray-400 p-2 text-left text-xs">${idx + 1}. ${tp.tp}</td>
                <td class="border border-gray-400 p-2 text-left text-xs">${tp.tp}</td>
                <td class="border border-gray-400 p-2 text-xs text-center">
                    <span class="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px]">${tp.dimensi}</span>
                </td>
            `;
            
            if (idx === 0) {
                html += `
                    <td rowspan="${data.tps.length}" class="border border-gray-400 p-2 text-center align-middle">
                        <strong>${minggu} Mgg</strong><br>
                        <span class="text-primary-600">${totalJP} JP</span>
                    </td>
                    <td rowspan="${data.tps.length}" class="border border-gray-400 p-2 text-center align-top"></td>
                `;
            }
            
            html += `</tr>`;
        });
    });
    
    tbody.innerHTML = html;
    hideLoading();
    showAlert('ATP berhasil di-generate!', 'success');
}
// ================================================
// GENERATE PROTA
// ================================================
async function generateProta() {
    const subject = document.getElementById('protaSubject')?.value;
    const kelas = document.getElementById('protaClass')?.value;
    const rombel = document.getElementById('protaRombel')?.value || 'A';
    const jpPerMeeting = parseInt(document.getElementById('protaJP')?.value) || 4;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header
    document.getElementById('protaSubjectTitle').textContent = subject.toUpperCase();
    document.getElementById('protaSchool').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('protaSubjectName').textContent = subject;
    document.getElementById('protaPhaseClass').textContent = `${phase.name} / ${kelas} / ${rombel}`;
    document.getElementById('protaYear').textContent = academicYear;
    
    // Update signature
    updateSignature('prota');
    
    // Load CP data for both semesters
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => d.kelas == kelas);
    
    const tbody = document.getElementById('protaBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-gray-500 py-8">
                    Data CP/TP belum tersedia untuk ${subject} Kelas ${kelas}.
                </td>
            </tr>
        `;
        hideLoading();
        return;
    }
    
    // Group by semester then elemen
    const semesters = { 'Ganjil': {}, 'Genap': {} };
    
    filteredData.forEach(item => {
        const smt = item.semester;
        if (!semesters[smt]) semesters[smt] = {};
        
        if (!semesters[smt][item.elemen]) {
            semesters[smt][item.elemen] = { cp: item.cp, tps: [] };
        }
        semesters[smt][item.elemen].tps.push(item.tp);
    });
    
    let html = '';
    
    ['Ganjil', 'Genap'].forEach(semester => {
        const elemenList = Object.entries(semesters[semester] || {});
        if (elemenList.length === 0) return;
        
        let totalTPSemester = 0;
        elemenList.forEach(([_, data]) => totalTPSemester += data.tps.length);
        
        let firstRowSemester = true;
        
        elemenList.forEach(([elemen, data]) => {
            const totalJPBab = data.tps.length * jpPerMeeting;
            
            data.tps.forEach((tp, idx) => {
                html += `<tr class="hover:bg-gray-50">`;
                
                if (firstRowSemester) {
                    html += `<td rowspan="${totalTPSemester}" class="border border-gray-400 p-2 text-center font-bold bg-gray-50 align-middle">${semester}</td>`;
                    firstRowSemester = false;
                }
                
                if (idx === 0) {
                    html += `
                        <td rowspan="${data.tps.length}" class="border border-gray-400 p-2 bg-blue-50 align-middle">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-weight: bold; font-size: 11px; color: #1e40af;">
                                ${elemen}
                            </div>
                        </td>
                    `;
                }
                
                html += `<td class="border border-gray-400 p-2 text-left text-xs">${tp}</td>`;
                
                if (idx === 0) {
                    html += `<td rowspan="${data.tps.length}" class="border border-gray-400 p-2 text-center font-bold align-middle">${totalJPBab} JP</td>`;
                }
                
                html += `</tr>`;
            });
        });
    });
    
    tbody.innerHTML = html;
    hideLoading();
    showAlert('Prota berhasil di-generate!', 'success');
}

// ================================================
// GENERATE PROMES (PREMIUM)
// ================================================
async function generatePromes() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('promesSubject')?.value;
    const kelas = document.getElementById('promesClass')?.value;
    const semester = document.getElementById('promesSemester')?.value || 'Ganjil';
    const rombel = document.getElementById('promesRombel')?.value || 'A';
    const jpPerMeeting = parseInt(document.getElementById('promesJP')?.value) || 4;
    const dayTarget = parseInt(document.getElementById('promesDay')?.value) || 1;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    // Check calendar data
    if (!calendarData?.ganjil?.start) {
        showAlert('Atur Kalender Pendidikan terlebih dahulu', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Get semester dates
    const semesterData = semester === 'Ganjil' ? calendarData.ganjil : calendarData.genap;
    
    // Calculate teaching dates
    const teachingDates = calculateTeachingDates(
        semesterData.start,
        semesterData.end,
        dayTarget,
        calendarData.customHolidays || []
    );
    
    // Update header
    document.getElementById('promesSemesterTitle').textContent = semester.toUpperCase();
    document.getElementById('promesSchool').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('promesSubjectName').textContent = subject;
    document.getElementById('promesPhaseClass').textContent = `${phase.name} / ${kelas} / ${rombel}`;
    document.getElementById('promesYear').textContent = academicYear;
    
    // Update signature
    updateSignature('promes');
    
    // Build header with months
    const months = semester === 'Ganjil' 
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    // Week header row
    const weekRow = document.getElementById('promesWeekRow');
    let weekHtml = '';
    for (let m = 0; m < 6; m++) {
        for (let w = 1; w <= 5; w++) {
            weekHtml += `<th class="border border-gray-400 p-1 text-xs bg-gray-50">${w}</th>`;
        }
    }
    weekRow.innerHTML = weekHtml;
    
    // Load CP data
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase()
    );
    
    const tbody = document.getElementById('promesBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="33" class="text-center text-gray-500 py-8">Data belum tersedia</td></tr>`;
        hideLoading();
        return;
    }
    
    // Group by elemen
    const grouped = {};
    filteredData.forEach(item => {
        if (!grouped[item.elemen]) {
            grouped[item.elemen] = { tps: [] };
        }
        grouped[item.elemen].tps.push(item);
    });
    
    let html = '';
    let dateIndex = 0;
    const startMonth = semester === 'Ganjil' ? 6 : 0; // July = 6, January = 0
    const startYear = parseInt(academicYear.split('/')[0]);
    const operationalYear = semester === 'Ganjil' ? startYear : startYear + 1;
    
    Object.entries(grouped).forEach(([elemen, data]) => {
        data.tps.forEach((tp, idx) => {
            html += `<tr class="hover:bg-gray-50">`;
            
            if (idx === 0) {
                html += `
                    <td rowspan="${data.tps.length}" class="border border-gray-400 p-1 bg-blue-50 align-middle text-center">
                        <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px; white-space: nowrap;">
                            ${elemen}
                        </div>
                    </td>
                `;
            }
            
            html += `
                <td class="border border-gray-400 p-1 text-xs text-left">${tp.tp}</td>
                <td class="border border-gray-400 p-1 text-center font-bold text-xs">${jpPerMeeting}</td>
            `;
            
            // Generate week cells
            for (let m = 0; m < 6; m++) {
                for (let w = 1; w <= 5; w++) {
                    const currentMonth = (startMonth + m) % 12;
                    const currentYear = startMonth + m >= 12 ? operationalYear + 1 : operationalYear;
                    
                    // Find matching date
                    const matchDate = teachingDates[dateIndex];
                    let cellContent = '';
                    let cellClass = 'border border-gray-400 p-1 text-center';
                    
                    if (matchDate) {
                        const matchMonth = matchDate.getMonth();
                        const matchWeek = Math.ceil(matchDate.getDate() / 7);
                        
                        if (matchMonth === currentMonth && matchWeek === w) {
                            cellContent = `
                                <span class="font-bold text-primary-700">${jpPerMeeting}</span>
                                <span class="block text-[9px] text-red-600">${matchDate.getDate()}</span>
                            `;
                            cellClass += ' bg-blue-100';
                            dateIndex++;
                        }
                    }
                    
                    html += `<td class="${cellClass}">${cellContent}</td>`;
                }
            }
            
            html += `</tr>`;
        });
    });
    
    tbody.innerHTML = html;
    hideLoading();
    showAlert('Promes berhasil di-generate!', 'success');
}

// Helper: Calculate teaching dates
function calculateTeachingDates(startDate, endDate, dayTarget, holidays) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const holidayDates = holidays.map(h => h.date);
    
    let current = new Date(start);
    while (current <= end) {
        if (current.getDay() === dayTarget) {
            const dateStr = current.toISOString().split('T')[0];
            if (!holidayDates.includes(dateStr)) {
                dates.push(new Date(current));
            }
        }
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}
// ================================================
// GENERATE MODUL AJAR (PREMIUM)
// ================================================
async function generateModul() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('modulSubject')?.value;
    const kelas = document.getElementById('modulClass')?.value;
    const semester = document.getElementById('modulSemester')?.value || 'Ganjil';
    const elemen = document.getElementById('modulElemen')?.value;
    const jpPerMeeting = parseInt(document.getElementById('modulJP')?.value) || 4;
    
    if (!subject || !elemen) {
        showAlert('Pilih mata pelajaran dan bab/elemen', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    
    // Load CP data for specific elemen
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase() &&
        d.elemen === elemen
    );
    
    if (filteredData.length === 0) {
        hideLoading();
        showAlert('Data TP belum tersedia untuk bab ini', 'warning');
        return;
    }
    
    const totalJP = filteredData.length * jpPerMeeting;
    
    // Update identitas
    document.getElementById('modulGuru').textContent = userData?.name || '-';
    document.getElementById('modulSekolah').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('modulMapel').textContent = subject;
    document.getElementById('modulKelas').textContent = `${kelas} / ${phase.name} / ${semester}`;
    document.getElementById('modulTopik').textContent = elemen;
    document.getElementById('modulWaktu').textContent = totalJP;
    
    // Dimensi Profil
    const dimensiSet = new Set();
    filteredData.forEach(d => {
        (d.dimensi || '').split(',').forEach(dim => {
            const trimmed = dim.trim();
            if (trimmed) dimensiSet.add(trimmed);
        });
    });
    document.getElementById('modulDimensi').innerHTML = 
        `<ul class="list-disc list-inside">${[...dimensiSet].map(d => `<li>${d}</li>`).join('')}</ul>`;
    
    // CP
    document.getElementById('modulCP').textContent = filteredData[0]?.cp || '-';
    
    // TP
    document.getElementById('modulTP').innerHTML = filteredData.map((tp, idx) => 
        `<li><strong>Pertemuan ${idx + 1}:</strong> ${tp.tp}</li>`
    ).join('');
    
    // Langkah Pembelajaran
    const lessonDuration = userData?.settings?.lessonDuration || 35;
    const totalMinutes = jpPerMeeting * lessonDuration;
    const coreMinutes = totalMinutes - 25; // 10 menit pembuka + 15 menit penutup
    
    let langkahHtml = '';
    filteredData.forEach((tp, idx) => {
        langkahHtml += `
            <div class="bg-white border rounded-lg p-4 mb-3">
                <h5 class="font-bold text-primary-700 mb-3 flex items-center gap-2">
                    <span class="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">${idx + 1}</span>
                    Pertemuan ${idx + 1} (${jpPerMeeting} JP x ${lessonDuration} menit = ${totalMinutes} menit)
                </h5>
                <div class="space-y-3 text-sm">
                    <div class="pl-4 border-l-4 border-blue-400">
                        <p class="font-semibold text-blue-800">A. Pendahuluan (Mindful) - 10 menit</p>
                        <ul class="list-disc list-inside ml-4 text-gray-600">
                            <li>Guru membuka dengan salam dan berdoa bersama</li>
                            <li>Memeriksa kehadiran dan kesiapan siswa</li>
                            <li>Memberikan pertanyaan pemantik terkait materi</li>
                            <li>Menyampaikan tujuan pembelajaran hari ini</li>
                        </ul>
                    </div>
                    <div class="pl-4 border-l-4 border-green-400">
                        <p class="font-semibold text-green-800">B. Kegiatan Inti (Meaningful & Joyful) - ${coreMinutes} menit</p>
                        <ul class="list-disc list-inside ml-4 text-gray-600">
                            <li><strong>Eksplorasi:</strong> Siswa mengamati/membaca materi tentang ${tp.tp}</li>
                            <li><strong>Diskusi:</strong> Siswa berdiskusi dalam kelompok kecil</li>
                            <li><strong>Elaborasi:</strong> Siswa mengerjakan LKPD atau tugas</li>
                            <li><strong>Konfirmasi:</strong> Presentasi hasil dan umpan balik</li>
                        </ul>
                    </div>
                    <div class="pl-4 border-l-4 border-orange-400">
                        <p class="font-semibold text-orange-800">C. Penutup - 15 menit</p>
                        <ul class="list-disc list-inside ml-4 text-gray-600">
                            <li>Siswa menyimpulkan pembelajaran dengan bimbingan guru</li>
                            <li>Guru memberikan penguatan materi</li>
                            <li>Refleksi: Apa yang sudah dipahami dan apa yang masih sulit?</li>
                            <li>Doa penutup dan salam</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('modulLangkah').innerHTML = langkahHtml;
    
    // Update signature
    updateSignature('modul');
    
    hideLoading();
    showAlert('Modul Ajar berhasil di-generate!', 'success');
}

// ================================================
// GENERATE LKPD (PREMIUM)
// ================================================
async function generateLKPD() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('lkpdSubject')?.value;
    const kelas = document.getElementById('lkpdClass')?.value;
    const semester = document.getElementById('lkpdSemester')?.value || 'Ganjil';
    const elemen = document.getElementById('lkpdElemen')?.value;
    const rombel = document.getElementById('lkpdRombel')?.value || 'A';
    
    if (!subject || !elemen) {
        showAlert('Pilih mata pelajaran dan bab/elemen', 'warning');
        return;
    }
    
    showLoading();
    
    const level = userData?.profile?.school?.level || 'SD';
    
    // Check if needs Arabic support
    const needsArabic = ['pai', 'pendidikan agama islam', 'bahasa arab', 'quran', 'qur\'an']
        .some(s => subject.toLowerCase().includes(s));
    
    // Load TP
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase() &&
        d.elemen === elemen
    );
    
    // Update LKPD
    document.getElementById('lkpdMapelTitle').textContent = subject;
    document.getElementById('lkpdKelasInfo').textContent = `${kelas} / ${rombel}`;
    document.getElementById('lkpdMateri').textContent = elemen;
    
    // TP List
    document.getElementById('lkpdTP').innerHTML = filteredData.map((tp, idx) => 
        `<li>${tp.tp}</li>`
    ).join('');
    
    // Add Arabic support class if needed
    const lkpdDoc = document.getElementById('lkpdDocument');
    if (needsArabic) {
        lkpdDoc.classList.add('arabic-support');
    } else {
        lkpdDoc.classList.remove('arabic-support');
    }
    
    hideLoading();
    showAlert('LKPD berhasil di-generate!', 'success');
}

// ================================================
// GENERATE KKTP (PREMIUM)
// ================================================
async function generateKKTP() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('kktpSubject')?.value;
    const kelas = document.getElementById('kktpClass')?.value;
    const rombel = document.getElementById('kktpRombel')?.value || 'A';
    const defaultValue = parseInt(document.getElementById('kktpDefault')?.value) || 75;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header
    document.getElementById('kktpGuru').textContent = userData?.name || '-';
    document.getElementById('kktpSekolah').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('kktpTahun').textContent = academicYear;
    document.getElementById('kktpMapel').textContent = subject;
    document.getElementById('kktpKelas').textContent = `${phase.letter} / ${kelas} / ${rombel}`;
    
    // Update signature
    updateSignature('kktp');
    
    // Load CP data for both semesters
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => d.kelas == kelas);
    
    const tbody = document.getElementById('kktpBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-500 py-8">Data belum tersedia</td></tr>`;
        hideLoading();
        return;
    }
    
    // Group by semester then elemen
    const grouped = { 'Ganjil': {}, 'Genap': {} };
    filteredData.forEach(item => {
        const smt = item.semester;
        if (!grouped[smt]) grouped[smt] = {};
        if (!grouped[smt][item.elemen]) grouped[smt][item.elemen] = [];
        grouped[smt][item.elemen].push(item);
    });
    
    let html = '';
    let no = 1;
    
    ['Ganjil', 'Genap'].forEach(semester => {
        Object.entries(grouped[semester] || {}).forEach(([elemen, tps]) => {
            tps.forEach((tp, idx) => {
                html += `<tr class="hover:bg-gray-50">`;
                
                if (idx === 0) {
                    html += `
                        <td rowspan="${tps.length}" class="border border-gray-400 p-2 text-center align-middle">${no}</td>
                        <td rowspan="${tps.length}" class="border border-gray-400 p-2 text-center align-middle">${semester}</td>
                        <td rowspan="${tps.length}" class="border border-gray-400 p-1 bg-gray-50 align-middle text-center">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9px;">
                                ${elemen}
                            </div>
                        </td>
                    `;
                    no++;
                }
                
                const rowId = `kktp-${no}-${idx}`;
                html += `
                    <td class="border border-gray-400 p-2 text-left text-xs">${tp.tp}</td>
                    <td class="border border-gray-400 p-2 text-center bg-yellow-50">
                        <input type="number" value="${defaultValue}" min="0" max="100" 
                            class="w-12 text-center border rounded p-1 text-xs kktp-input" 
                            data-row="${rowId}" onchange="calculateKKTPRow('${rowId}')">
                    </td>
                    <td class="border border-gray-400 p-2 text-center bg-yellow-50">
                        <input type="number" value="${defaultValue}" min="0" max="100" 
                            class="w-12 text-center border rounded p-1 text-xs kktp-input" 
                            data-row="${rowId}" onchange="calculateKKTPRow('${rowId}')">
                    </td>
                    <td class="border border-gray-400 p-2 text-center bg-yellow-50">
                        <input type="number" value="${defaultValue}" min="0" max="100" 
                            class="w-12 text-center border rounded p-1 text-xs kktp-input" 
                            data-row="${rowId}" onchange="calculateKKTPRow('${rowId}')">
                    </td>
                    <td class="border border-gray-400 p-2 text-center bg-blue-100 font-bold kktp-result" id="result-${rowId}">${defaultValue}</td>
                </tr>`;
            });
        });
    });
    
    tbody.innerHTML = html;
    hideLoading();
    showAlert('KKTP berhasil di-generate!', 'success');
}

// Calculate KKTP row average
function calculateKKTPRow(rowId) {
    const inputs = document.querySelectorAll(`input[data-row="${rowId}"]`);
    const resultEl = document.getElementById(`result-${rowId}`);
    
    if (!resultEl) return;
    
    let sum = 0;
    let count = 0;
    
    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
            sum += val;
            count++;
        }
    });
    
    if (count > 0) {
        resultEl.textContent = Math.round(sum / count);
    }
}
// ================================================
// ATTENDANCE (PREMIUM)
// ================================================
let attendanceData = {};

function loadAttendanceStudents() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const kelas = document.getElementById('attendanceClass')?.value;
    const rombel = document.getElementById('attendanceRombel')?.value;
    const date = document.getElementById('attendanceDate')?.value;
    
    if (!kelas || !rombel || !date) return;
    
    // Filter students
    const filtered = (studentsData || []).filter(s => 
        s.kelas == kelas && s.rombel === rombel
    );
    
    const tbody = document.getElementById('attendanceTable');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="border p-8 text-center text-gray-500">Tidak ada siswa di kelas ini</td></tr>`;
        updateAttendanceSummary();
        return;
    }
    
    tbody.innerHTML = filtered.map((s, idx) => {
        const key = `${date}-${s.nisn}`;
        const status = attendanceData[key] || 'H';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="border p-2 text-center">${idx + 1}</td>
                <td class="border p-2 text-sm">${s.nisn}</td>
                <td class="border p-2">${s.nama}</td>
                <td class="border p-2 text-center">${s.jenis_kelamin}</td>
                <td class="border p-2 text-center">
                    <input type="radio" name="att-${s.nisn}" value="H" ${status === 'H' ? 'checked' : ''} 
                        onchange="setAttendance('${s.nisn}', 'H')" class="w-4 h-4 text-green-600">
                </td>
                <td class="border p-2 text-center">
                    <input type="radio" name="att-${s.nisn}" value="S" ${status === 'S' ? 'checked' : ''} 
                        onchange="setAttendance('${s.nisn}', 'S')" class="w-4 h-4 text-yellow-600">
                </td>
                <td class="border p-2 text-center">
                    <input type="radio" name="att-${s.nisn}" value="I" ${status === 'I' ? 'checked' : ''} 
                        onchange="setAttendance('${s.nisn}', 'I')" class="w-4 h-4 text-blue-600">
                </td>
                <td class="border p-2 text-center">
                    <input type="radio" name="att-${s.nisn}" value="A" ${status === 'A' ? 'checked' : ''} 
                        onchange="setAttendance('${s.nisn}', 'A')" class="w-4 h-4 text-red-600">
                </td>
                <td class="border p-2">
                    <input type="text" class="w-full border-0 text-sm" placeholder="Keterangan" id="ket-${s.nisn}">
                </td>
            </tr>
        `;
    }).join('');
    
    updateAttendanceSummary();
}

function setAttendance(nisn, status) {
    const date = document.getElementById('attendanceDate')?.value;
    if (!date) return;
    
    const key = `${date}-${nisn}`;
    attendanceData[key] = status;
    updateAttendanceSummary();
}

function setAllAttendance(status) {
    const kelas = document.getElementById('attendanceClass')?.value;
    const rombel = document.getElementById('attendanceRombel')?.value;
    const date = document.getElementById('attendanceDate')?.value;
    
    if (!date) {
        showAlert('Pilih tanggal terlebih dahulu', 'warning');
        return;
    }
    
    const filtered = (studentsData || []).filter(s => 
        s.kelas == kelas && s.rombel === rombel
    );
    
    filtered.forEach(s => {
        const key = `${date}-${s.nisn}`;
        attendanceData[key] = status;
        
        const radio = document.querySelector(`input[name="att-${s.nisn}"][value="${status}"]`);
        if (radio) radio.checked = true;
    });
    
    updateAttendanceSummary();
}

function updateAttendanceSummary() {
    const date = document.getElementById('attendanceDate')?.value;
    const kelas = document.getElementById('attendanceClass')?.value;
    const rombel = document.getElementById('attendanceRombel')?.value;
    
    let h = 0, s = 0, i = 0, a = 0;
    
    const filtered = (studentsData || []).filter(st => 
        st.kelas == kelas && st.rombel === rombel
    );
    
    filtered.forEach(st => {
        const key = `${date}-${st.nisn}`;
        const status = attendanceData[key] || 'H';
        if (status === 'H') h++;
        else if (status === 'S') s++;
        else if (status === 'I') i++;
        else if (status === 'A') a++;
    });
    
    document.getElementById('attendanceHadir').textContent = h;
    document.getElementById('attendanceSakit').textContent = s;
    document.getElementById('attendanceIzin').textContent = i;
    document.getElementById('attendanceAlpha').textContent = a;
}

async function saveAttendance() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const date = document.getElementById('attendanceDate')?.value;
    const kelas = document.getElementById('attendanceClass')?.value;
    const rombel = document.getElementById('attendanceRombel')?.value;
    const subject = document.getElementById('attendanceSubject')?.value;
    const jp = document.getElementById('attendanceJP')?.value;
    
    if (!date || !kelas) {
        showAlert('Lengkapi data terlebih dahulu', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const filtered = (studentsData || []).filter(s => 
            s.kelas == kelas && s.rombel === rombel
        );
        
        const records = filtered.map(s => {
            const key = `${date}-${s.nisn}`;
            return {
                nisn: s.nisn,
                nama: s.nama,
                status: attendanceData[key] || 'H',
                keterangan: document.getElementById(`ket-${s.nisn}`)?.value || ''
            };
        });
        
        await db.collection('attendance').add({
            userId: currentUser.uid,
            date: date,
            kelas: kelas,
            rombel: rombel,
            subject: subject,
            jp: jp,
            records: records,
            summary: {
                hadir: records.filter(r => r.status === 'H').length,
                sakit: records.filter(r => r.status === 'S').length,
                izin: records.filter(r => r.status === 'I').length,
                alpha: records.filter(r => r.status === 'A').length
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        hideLoading();
        showAlert('Absensi berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal menyimpan: ' + error.message, 'error');
    }
}

// ================================================
// GENERATE JOURNAL (PREMIUM)
// ================================================
async function generateJournal() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('journalSubject')?.value;
    const kelas = document.getElementById('journalClass')?.value;
    const semester = document.getElementById('journalSemester')?.value || 'Ganjil';
    const rombel = document.getElementById('journalRombel')?.value || 'A';
    
    if (!subject) {
        showAlert('Pilih mata pelajaran', 'warning');
        return;
    }
    
    showLoading();
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header
    document.getElementById('journalMapel').textContent = subject;
    document.getElementById('journalKelas').textContent = `${kelas} / ${rombel}`;
    document.getElementById('journalSmt').textContent = semester;
    document.getElementById('journalTahun').textContent = academicYear;
    
    // Update signature
    updateSignature('journal');
    
    // Load CP data
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase()
    );
    
    const tbody = document.getElementById('journalBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-gray-500 py-8">Data belum tersedia</td></tr>`;
        hideLoading();
        return;
    }
    
    // Get teaching schedule dates
    const semesterData = semester === 'Ganjil' ? calendarData?.ganjil : calendarData?.genap;
    let teachingDates = [];
    
    if (semesterData?.start && semesterData?.end) {
        // Get first day from schedule or default to Monday (1)
        const dayTarget = 1; // Default Monday
        teachingDates = calculateTeachingDates(
            semesterData.start,
            semesterData.end,
            dayTarget,
            calendarData?.customHolidays || []
        );
    }
    
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    let html = '';
    let dateIdx = 0;
    
    filteredData.forEach((tp, idx) => {
        const date = teachingDates[dateIdx];
        let dateStr = '........................';
        
        if (date) {
            dateStr = `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
            dateIdx++;
        }
        
        html += `
            <tr class="hover:bg-gray-50">
                <td class="border border-gray-400 p-2 text-center">${idx + 1}</td>
                <td class="border border-gray-400 p-2 text-center">${kelas} / ${phase.name}</td>
                <td class="border border-gray-400 p-2 text-xs" contenteditable="true">${dateStr}</td>
                <td class="border border-gray-400 p-2 text-xs">${tp.elemen}</td>
                <td class="border border-gray-400 p-2 text-xs">${tp.tp}</td>
                <td class="border border-gray-400 p-2 text-center text-xs" contenteditable="true">H: ..., S: ..., I: ..., A: ...</td>
                <td class="border border-gray-400 p-2 text-xs" contenteditable="true">Tersampaikan dan dapat dipahami dengan baik</td>
                <td class="border border-gray-400 p-2 text-xs" contenteditable="true">Terlaksana sesuai jadwal</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    hideLoading();
    showAlert('Jurnal berhasil di-generate!', 'success');
}

// ================================================
// GRADES (PREMIUM)
// ================================================
let gradesData = {};

function loadGrades() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('gradesSubject')?.value;
    const kelas = document.getElementById('gradesClass')?.value;
    const rombel = document.getElementById('gradesRombel')?.value;
    const kkm = parseInt(document.getElementById('gradesKKM')?.value) || 75;
    
    if (!subject || !kelas || !rombel) return;
    
    // Filter students
    const filtered = (studentsData || []).filter(s => 
        s.kelas == kelas && s.rombel === rombel
    );
    
    const tbody = document.getElementById('gradesTable');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="border p-8 text-center text-gray-500">Tidak ada siswa di kelas ini</td></tr>`;
        return;
    }
    
    // Get active components
    const components = [];
    if (document.getElementById('gradeSum1')?.checked) components.push('sum1');
    if (document.getElementById('gradeSum2')?.checked) components.push('sum2');
    if (document.getElementById('gradeSum3')?.checked) components.push('sum3');
    if (document.getElementById('gradeSum4')?.checked) components.push('sum4');
    if (document.getElementById('gradeATS')?.checked) components.push('ats');
    if (document.getElementById('gradeASAS')?.checked) components.push('asas');
    
    tbody.innerHTML = filtered.map((s, idx) => {
        const key = `${subject}-${s.nisn}`;
        const data = gradesData[key] || {};
        
        // Calculate average
        let total = 0;
        let count = 0;
        components.forEach(c => {
            const val = data[c] || 0;
            if (val > 0) {
                total += val;
                count++;
            }
        });
        const avg = count > 0 ? Math.round(total / count) : 0;
        const status = avg >= kkm ? '✓' : '✗';
        const statusClass = avg >= kkm ? 'text-green-600' : 'text-red-600';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="border p-2 text-center text-sm">${idx + 1}</td>
                <td class="border p-2 text-sm">${s.nisn}</td>
                <td class="border p-2">${s.nama}</td>
                <td class="border p-2 text-center">${s.jenis_kelamin}</td>
                ${components.includes('sum1') ? `<td class="border p-1 text-center bg-blue-50"><input type="number" class="w-14 text-center border rounded p-1 text-sm grade-input" value="${data.sum1 || ''}" min="0" max="100" onchange="updateGrade('${s.nisn}', 'sum1', this.value, '${subject}')"></td>` : ''}
                ${components.includes('sum2') ? `<td class="border p-1 text-center bg-blue-50"><input type="number" class="w-14 text-center border rounded p-1 text-sm grade-input" value="${data.sum2 || ''}" min="0" max="100" onchange="updateGrade('${s.nisn}', 'sum2', this.value, '${subject}')"></td>` : ''}
                ${components.includes('sum3') ? `<td class="border p-1 text-center bg-blue-50"><input type="number" class="w-14 text-center border rounded p-1 text-sm grade-input" value="${data.sum3 || ''}" min="0" max="100" onchange="updateGrade('${s.nisn}', 'sum3', this.value, '${subject}')"></td>` : ''}
                ${components.includes('ats') ? `<td class="border p-1 text-center bg-yellow-50"><input type="number" class="w-14 text-center border rounded p-1 text-sm grade-input" value="${data.ats || ''}" min="0" max="100" onchange="updateGrade('${s.nisn}', 'ats', this.value, '${subject}')"></td>` : ''}
                ${components.includes('asas') ? `<td class="border p-1 text-center bg-green-50"><input type="number" class="w-14 text-center border rounded p-1 text-sm grade-input" value="${data.asas || ''}" min="0" max="100" onchange="updateGrade('${s.nisn}', 'asas', this.value, '${subject}')"></td>` : ''}
                <td class="border p-2 text-center bg-purple-100 font-bold" id="avg-${s.nisn}">${avg || '-'}</td>
                <td class="border p-2 text-center font-bold ${statusClass}">${avg ? status : '-'}</td>
            </tr>
        `;
    }).join('');
    
    updateGradesSummary();
}

function updateGrade(nisn, component, value, subject) {
    const key = `${subject}-${nisn}`;
    if (!gradesData[key]) gradesData[key] = {};
    gradesData[key][component] = parseInt(value) || 0;
    
    // Recalculate average
    const data = gradesData[key];
    const components = ['sum1', 'sum2', 'sum3', 'sum4', 'ats', 'asas'];
    
    let total = 0;
    let count = 0;
    components.forEach(c => {
        if (data[c] && data[c] > 0) {
            total += data[c];
            count++;
        }
    });
    
    const avg = count > 0 ? Math.round(total / count) : 0;
    const avgEl = document.getElementById(`avg-${nisn}`);
    if (avgEl) avgEl.textContent = avg || '-';
    
    updateGradesSummary();
}

function updateGradesSummary() {
    const subject = document.getElementById('gradesSubject')?.value;
    const kelas = document.getElementById('gradesClass')?.value;
    const rombel = document.getElementById('gradesRombel')?.value;
    const kkm = parseInt(document.getElementById('gradesKKM')?.value) || 75;
    
    const filtered = (studentsData || []).filter(s => 
        s.kelas == kelas && s.rombel === rombel
    );
    
    let tuntas = 0;
    let belumTuntas = 0;
    let totalNilai = 0;
    let tertinggi = 0;
    let count = 0;
    
    filtered.forEach(s => {
        const key = `${subject}-${s.nisn}`;
        const data = gradesData[key] || {};
        
        const components = ['sum1', 'sum2', 'sum3', 'sum4', 'ats', 'asas'];
        let total = 0;
        let c = 0;
        components.forEach(comp => {
            if (data[comp] && data[comp] > 0) {
                total += data[comp];
                c++;
            }
        });
        
        if (c > 0) {
            const avg = Math.round(total / c);
            if (avg >= kkm) tuntas++;
            else belumTuntas++;
            
            totalNilai += avg;
            if (avg > tertinggi) tertinggi = avg;
            count++;
        }
    });
    
    document.getElementById('gradesTuntas').textContent = tuntas;
    document.getElementById('gradesBelumTuntas').textContent = belumTuntas;
    document.getElementById('gradesRataRata').textContent = count > 0 ? Math.round(totalNilai / count) : 0;
    document.getElementById('gradesTertinggi').textContent = tertinggi;
}

async function saveGrades() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('gradesSubject')?.value;
    const kelas = document.getElementById('gradesClass')?.value;
    const rombel = document.getElementById('gradesRombel')?.value;
    const semester = document.getElementById('gradesSemester')?.value;
    
    if (!subject || !kelas) {
        showAlert('Lengkapi data terlebih dahulu', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const filtered = (studentsData || []).filter(s => 
            s.kelas == kelas && s.rombel === rombel
        );
        
        const records = filtered.map(s => {
            const key = `${subject}-${s.nisn}`;
            const data = gradesData[key] || {};
            
            const components = ['sum1', 'sum2', 'sum3', 'sum4', 'ats', 'asas'];
            let total = 0;
            let c = 0;
            components.forEach(comp => {
                if (data[comp] && data[comp] > 0) {
                    total += data[comp];
                    c++;
                }
            });
            const avg = c > 0 ? Math.round(total / c) : 0;
            
            return {
                nisn: s.nisn,
                nama: s.nama,
                ...data,
                average: avg
            };
        });
        
        // Save to Firestore
        const docId = `${currentUser.uid}-${subject}-${kelas}-${rombel}-${semester}`;
        await db.collection('grades').doc(docId).set({
            userId: currentUser.uid,
            subject: subject,
            kelas: kelas,
            rombel: rombel,
            semester: semester,
            records: records,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        hideLoading();
        showAlert('Nilai berhasil disimpan!', 'success');
    } catch (error) {
        hideLoading();
        showAlert('Gagal menyimpan: ' + error.message, 'error');
    }
}

// ================================================
// PRINT DOCUMENT
// ================================================
function printDocument() {
    window.print();
}

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date for attendance
    const today = new Date().toISOString().split('T')[0];
    const attendanceDate = document.getElementById('attendanceDate');
    if (attendanceDate) attendanceDate.value = today;
});

console.log('Documents Module Loaded');
