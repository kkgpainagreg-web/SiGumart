// Document Generation Functions (Continued)

// Get Phase from Class
function getPhase(kelas) {
    const k = parseInt(kelas);
    if (k <= 2) return 'A';
    if (k <= 4) return 'B';
    if (k <= 6) return 'C';
    if (k <= 9) return 'D';
    if (k === 10) return 'E';
    return 'F';
}

// Extract Kompetensi from TP
function extractKompetensi(tp) {
    const match = tp.match(/mampu\s+([a-zA-Z\-]+)/i);
    if (match) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
    
    const keywords = ['menjelaskan', 'mengidentifikasi', 'menganalisis', 'menerapkan', 
                     'membuat', 'menyusun', 'mengevaluasi', 'memahami', 'menghafal'];
    for (let kw of keywords) {
        if (tp.toLowerCase().includes(kw)) {
            return kw.charAt(0).toUpperCase() + kw.slice(1);
        }
    }
    return 'Memahami';
}

// Generate ATP
async function generateATP() {
    const subject = document.getElementById('atpSubject').value;
    const kelas = document.getElementById('atpClass').value;
    const semester = document.getElementById('atpSemester').value;
    const jpPerMeeting = parseInt(document.getElementById('atpJP').value) || 4;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header info
    document.getElementById('atpYear').textContent = academicYear;
    document.getElementById('atpSchool').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('atpSubjectName').textContent = subject;
    document.getElementById('atpPhaseClass').textContent = `Fase ${phase} / Kelas ${kelas}`;
    document.getElementById('atpSemesterName').textContent = semester;
    
    // Signature info
    const city = userData?.profile?.school?.city || 'Jakarta';
    const today = new Date();
    const dateStr = formatDate(today, 'long');
    
    document.getElementById('atpLocation').textContent = `${city}, ${dateStr}`;
    document.getElementById('atpHeadmaster').textContent = userData?.profile?.school?.headmaster || '-';
    document.getElementById('atpHeadmasterNip').textContent = userData?.profile?.school?.headmasterNip || '-';
    document.getElementById('atpTeacher').textContent = userData?.name || '-';
    document.getElementById('atpTeacherNip').textContent = userData?.profile?.nip || '-';
    
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
                <td colspan="8" class="border p-4 text-center text-gray-500">
                    Data CP/TP belum tersedia untuk ${subject} Kelas ${kelas} Semester ${semester}.<br>
                    Upload file CSV melalui menu AI Assistant.
                </td>
            </tr>
        `;
        return;
    }
    
    // Group by elemen
    const grouped = {};
    filteredData.forEach(item => {
        if (!grouped[item.elemen]) {
            grouped[item.elemen] = {
                cp: item.cp,
                tps: []
            };
        }
        grouped[item.elemen].tps.push({
            tp: item.tp,
            dimensi: item.dimensi
        });
    });
    
    let html = '';
    let no = 1;
    
    Object.entries(grouped).forEach(([elemen, data]) => {
        const totalJP = data.tps.length * jpPerMeeting;
        const minggu = data.tps.length;
        
        data.tps.forEach((tp, idx) => {
            const kompetensi = extractKompetensi(tp.tp);
            
            html += `<tr>`;
            
            if (idx === 0) {
                html += `
                    <td rowspan="${data.tps.length}" class="border p-2 text-center">${no}</td>
                    <td rowspan="${data.tps.length}" class="border p-2 text-left text-xs" contenteditable="true">
                        <strong>${elemen}</strong><br><br>${data.cp}
                    </td>
                    <td rowspan="${data.tps.length}" class="border p-2 text-left text-xs" contenteditable="true">
                        Memahami dan menerapkan materi ${elemen}
                    </td>
                `;
                no++;
            }
            
            html += `
                <td class="border p-2 text-left text-xs" contenteditable="true">${tp.tp}</td>
                <td class="border p-2 text-xs text-blue-700" contenteditable="true">${tp.dimensi}</td>
                <td class="border p-2 text-xs text-amber-600" contenteditable="true">${kompetensi}</td>
            `;
            
            if (idx === 0) {
                html += `
                    <td rowspan="${data.tps.length}" class="border p-2 text-xs" contenteditable="true">${elemen}</td>
                    <td rowspan="${data.tps.length}" class="border p-2 text-center text-xs" contenteditable="true">
                        <strong>${minggu} Minggu</strong><br>${totalJP} JP
                    </td>
                `;
            }
            
            html += `</tr>`;
        });
    });
    
    tbody.innerHTML = html;
    showAlert('ATP berhasil di-generate!', 'success');
}

// Generate Prota
async function generateProta() {
    const subject = document.getElementById('protaSubject').value;
    const kelas = document.getElementById('protaClass').value;
    const rombel = document.getElementById('protaRombel').value || 'A';
    const jpPerMeeting = parseInt(document.getElementById('protaJP').value) || 4;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Update header info
    document.getElementById('protaSubjectTitle').textContent = subject.toUpperCase();
    document.getElementById('protaSchool').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('protaSubjectName').textContent = subject;
    document.getElementById('protaPhaseClass').textContent = `Fase ${phase} / ${kelas} / ${rombel}`;
    document.getElementById('protaYear').textContent = academicYear;
    
    // Signature info
    const city = userData?.profile?.school?.city || 'Jakarta';
    const today = new Date();
    const dateStr = formatDate(today, 'long');
    
    document.getElementById('protaLocation').textContent = `${city}, ${dateStr}`;
    document.getElementById('protaHeadmaster').textContent = userData?.profile?.school?.headmaster || '-';
    document.getElementById('protaHeadmasterNip').textContent = userData?.profile?.school?.headmasterNip || '-';
    document.getElementById('protaTeacher').textContent = userData?.name || '-';
    document.getElementById('protaTeacherNip').textContent = userData?.profile?.nip || '-';
    
    // Load CP data for both semesters
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => d.kelas == kelas);
    
    const tbody = document.getElementById('protaBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="border p-4 text-center text-gray-500">
                    Data CP/TP belum tersedia untuk ${subject} Kelas ${kelas}.<br>
                    Upload file CSV melalui menu AI Assistant.
                </td>
            </tr>
        `;
        return;
    }
    
    // Group by semester and elemen
    const semesters = { 'Ganjil': {}, 'Genap': {} };
    
    filteredData.forEach(item => {
        const smt = item.semester;
        if (!semesters[smt]) semesters[smt] = {};
        
        if (!semesters[smt][item.elemen]) {
            semesters[smt][item.elemen] = {
                cp: item.cp,
                tps: []
            };
        }
        semesters[smt][item.elemen].tps.push(item.tp);
    });
    
    let html = '';
    
    ['Ganjil', 'Genap'].forEach(semester => {
        const elemenList = Object.entries(semesters[semester] || {});
        
        if (elemenList.length === 0) return;
        
        let totalTPSemester = 0;
        elemenList.forEach(([_, data]) => totalTPSemester += data.tps.length);
        
        let firstRow = true;
        
        elemenList.forEach(([elemen, data]) => {
            const totalJPBab = data.tps.length * jpPerMeeting;
            
            data.tps.forEach((tp, idx) => {
                html += `<tr>`;
                
                if (firstRow) {
                    html += `<td rowspan="${totalTPSemester}" class="border p-2 text-center font-semibold bg-gray-50">${semester}</td>`;
                    firstRow = false;
                }
                
                if (idx === 0) {
                    html += `
                        <td rowspan="${data.tps.length}" class="border p-2 bg-blue-50" contenteditable="true">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); text-align: center;">
                                <strong>${elemen}</strong>
                            </div>
                        </td>
                    `;
                }
                
                html += `
                    <td class="border p-2 text-left text-xs" contenteditable="true">${tp}</td>
                `;
                
                if (idx === 0) {
                    html += `<td rowspan="${data.tps.length}" class="border p-2 text-center font-bold">${totalJPBab} JP</td>`;
                }
                
                html += `</tr>`;
            });
        });
    });
    
    tbody.innerHTML = html;
    showAlert('Prota berhasil di-generate!', 'success');
}

// Generate Promes (Premium)
async function generatePromes() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('promesSubject').value;
    const kelas = document.getElementById('promesClass').value;
    const semester = document.getElementById('promesSemester').value;
    const rombel = document.getElementById('promesRombel').value || 'A';
    const jpPerMeeting = parseInt(document.getElementById('promesJP').value) || 4;
    const dayTarget = parseInt(document.getElementById('promesDay').value) || 1;
    
    if (!subject) {
        showAlert('Pilih mata pelajaran terlebih dahulu', 'warning');
        return;
    }
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Get calendar data
    const semesterData = semester === 'Ganjil' ? calendarData.ganjil : calendarData.genap;
    if (!semesterData?.start || !semesterData?.end) {
        showAlert('Atur kalender pendidikan terlebih dahulu', 'warning');
        return;
    }
    
    // Calculate effective dates
    const effectiveDates = calculateEffectiveDates(
        semesterData.start, 
        semesterData.end, 
        dayTarget, 
        calendarData.customHolidays || []
    );
    
    // Load CP data
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => 
        d.kelas == kelas && 
        d.semester.toLowerCase() === semester.toLowerCase()
    );
    
    if (filteredData.length === 0) {
        showAlert('Data CP/TP belum tersedia', 'warning');
        return;
    }
    
    // Generate Promes table
    generatePromesTable(filteredData, effectiveDates, jpPerMeeting, semester);
    
    // Update header info
    updatePromesHeader(subject, kelas, rombel, phase, semester, academicYear);
    
    showAlert('Promes berhasil di-generate!', 'success');
}

function calculateEffectiveDates(startDate, endDate, dayTarget, holidays) {
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

function generatePromesTable(data, effectiveDates, jpPerMeeting, semester) {
    const months = semester === 'Ganjil' 
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    // Group data by elemen
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.elemen]) {
            grouped[item.elemen] = { tps: [] };
        }
        grouped[item.elemen].tps.push(item);
    });
    
    // Build header
    let headerHtml = `
        <tr>
            <th rowspan="2" class="border p-2 bg-gray-100">Bab/Elemen</th>
            <th rowspan="2" class="border p-2 bg-gray-100">Tujuan Pembelajaran</th>
            <th rowspan="2" class="border p-2 bg-gray-100">JP</th>
    `;
    months.forEach(m => {
        headerHtml += `<th colspan="5" class="border p-2 bg-gray-100">${m}</th>`;
    });
    headerHtml += `</tr><tr>`;
    for (let i = 0; i < 6; i++) {
        for (let w = 1; w <= 5; w++) {
            headerHtml += `<th class="border p-1 bg-gray-50 text-xs">${w}</th>`;
        }
    }
    headerHtml += `</tr>`;
    
    document.getElementById('headPromes').innerHTML = headerHtml;
    
    // Build body
    let bodyHtml = '';
    let dateIndex = 0;
    
    Object.entries(grouped).forEach(([elemen, data]) => {
        data.tps.forEach((tp, idx) => {
            bodyHtml += `<tr>`;
            
            if (idx === 0) {
                bodyHtml += `
                    <td rowspan="${data.tps.length}" class="border p-2 bg-blue-50" contenteditable="true">
                        <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold; font-size: 9pt;">
                            ${elemen}
                        </div>
                    </td>
                `;
            }
            
            bodyHtml += `<td class="border p-2 text-xs text-left" contenteditable="true">${tp.tp}</td>`;
            bodyHtml += `<td class="border p-2 text-center font-bold">${jpPerMeeting}</td>`;
            
            // Generate week cells
            const startMonth = semester === 'Ganjil' ? 6 : 0; // July = 6, January = 0
            for (let m = 0; m < 6; m++) {
                for (let w = 1; w <= 5; w++) {
                    const targetMonth = startMonth + m;
                    const effectiveDate = effectiveDates[dateIndex];
                    
                    if (effectiveDate && 
                        effectiveDate.getMonth() === (targetMonth > 11 ? targetMonth - 12 : targetMonth) && 
                        Math.ceil(effectiveDate.getDate() / 7) === w) {
                        bodyHtml += `
                            <td class="border p-1 bg-blue-100 text-center" contenteditable="true">
                                <span class="font-bold">${jpPerMeeting}</span>
                                <span class="text-xs text-red-600 block">${effectiveDate.getDate()}</span>
                            </td>
                        `;
                        dateIndex++;
                    } else {
                        bodyHtml += `<td class="border p-1" contenteditable="true"></td>`;
                    }
                }
            }
            
            bodyHtml += `</tr>`;
        });
    });
    
    document.getElementById('bodyPromes').innerHTML = bodyHtml;
}

function updatePromesHeader(subject, kelas, rombel, phase, semester, academicYear) {
    document.querySelectorAll('.promesSubjectName').forEach(el => el.textContent = subject);
    document.querySelectorAll('.promesSchool').forEach(el => el.textContent = userData?.profile?.school?.name || '-');
    document.querySelectorAll('.promesPhaseClass').forEach(el => el.textContent = `Fase ${phase} / ${kelas} / ${rombel}`);
    document.querySelectorAll('.promesSemesterName').forEach(el => el.textContent = semester.toUpperCase());
    document.querySelectorAll('.promesYear').forEach(el => el.textContent = academicYear);
    
    const city = userData?.profile?.school?.city || 'Jakarta';
    const dateStr = formatDate(new Date(), 'long');
    document.querySelectorAll('.promesLocation').forEach(el => el.textContent = `${city}, ${dateStr}`);
    document.querySelectorAll('.promesHeadmaster').forEach(el => el.textContent = userData?.profile?.school?.headmaster || '-');
    document.querySelectorAll('.promesHeadmasterNip').forEach(el => el.textContent = userData?.profile?.school?.headmasterNip || '-');
    document.querySelectorAll('.promesTeacher').forEach(el => el.textContent = userData?.name || '-');
    document.querySelectorAll('.promesTeacherNip').forEach(el => el.textContent = userData?.profile?.nip || '-');
}

// Generate Modul Ajar (Premium)
async function generateModul() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('modulSubject').value;
    const kelas = document.getElementById('modulClass').value;
    const semester = document.getElementById('modulSemester').value;
    const elemen = document.getElementById('modulElemen').value;
    const jpPerMeeting = parseInt(document.getElementById('modulJP').value) || 4;
    
    if (!subject || !elemen) {
        showAlert('Pilih mata pelajaran dan bab/elemen', 'warning');
        return;
    }
    
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
        showAlert('Data TP belum tersedia untuk bab ini', 'warning');
        return;
    }
    
    // Update Modul Header
    document.getElementById('modulGuruName').textContent = `${userData?.name || '-'} (${userData?.profile?.school?.name || '-'})`;
    document.getElementById('modulMapel').textContent = subject;
    document.getElementById('modulKelasInfo').textContent = `${kelas} / Fase ${phase} / ${semester}`;
    document.getElementById('modulTopik').textContent = elemen;
    document.getElementById('modulAlokasiWaktu').textContent = `${filteredData.length * jpPerMeeting} JP`;
    
    // Dimensi Profil Lulusan
    const dimensiSet = new Set();
    filteredData.forEach(d => {
        d.dimensi.split(',').forEach(dim => dimensiSet.add(dim.trim()));
    });
    document.getElementById('modulDimensi').innerHTML = 
        `<ul>${[...dimensiSet].map(d => `<li><strong>${d}</strong></li>`).join('')}</ul>`;
    
    // Tujuan Pembelajaran
    let tpHtml = '<ul>';
    filteredData.forEach((tp, idx) => {
        tpHtml += `<li><strong>Pertemuan ${idx + 1}:</strong> ${tp.tp}</li>`;
    });
    tpHtml += '</ul>';
    document.getElementById('modulTP').innerHTML = tpHtml;
    
    // Langkah Pembelajaran
    let langkahHtml = '';
    filteredData.forEach((tp, idx) => {
        langkahHtml += `
            <div class="mb-4 p-3 bg-gray-50 rounded">
                <h5 class="font-bold text-primary-700 mb-2">Pertemuan ${idx + 1} (${jpPerMeeting} JP)</h5>
                <ul class="text-sm space-y-2">
                    <li><strong>Pendahuluan (Mindful) - 10 menit:</strong>
                        <ul class="ml-4 list-disc">
                            <li>Guru membuka dengan salam dan doa</li>
                            <li>Mengondisikan kelas dan memeriksa kehadiran</li>
                            <li>Memberikan pertanyaan pemantik terkait materi</li>
                        </ul>
                    </li>
                    <li><strong>Kegiatan Inti (Meaningful & Joyful) - ${jpPerMeeting * 35 - 25} menit:</strong>
                        <ul class="ml-4 list-disc">
                            <li>Eksplorasi: Siswa mengamati/membaca materi</li>
                            <li>Diskusi kelompok tentang ${tp.tp}</li>
                            <li>Presentasi hasil diskusi</li>
                            <li>Pengerjaan LKPD</li>
                        </ul>
                    </li>
                    <li><strong>Penutup - 15 menit:</strong>
                        <ul class="ml-4 list-disc">
                            <li>Refleksi pembelajaran</li>
                            <li>Penguatan materi oleh guru</li>
                            <li>Doa penutup</li>
                        </ul>
                    </li>
                </ul>
            </div>
        `;
    });
    document.getElementById('modulLangkah').innerHTML = langkahHtml;
    
    // Update signature
    updateModulSignature();
    
    showAlert('Modul Ajar berhasil di-generate!', 'success');
}

function updateModulSignature() {
    const city = userData?.profile?.school?.city || 'Jakarta';
    const dateStr = formatDate(new Date(), 'long');
    
    document.getElementById('modulLocation').textContent = `${city}, ${dateStr}`;
    document.getElementById('modulHeadmaster').textContent = userData?.profile?.school?.headmaster || '-';
    document.getElementById('modulHeadmasterNip').textContent = userData?.profile?.school?.headmasterNip || '-';
    document.getElementById('modulTeacher').textContent = userData?.name || '-';
    document.getElementById('modulTeacherNip').textContent = userData?.profile?.nip || '-';
}

// Generate LKPD (Premium)
async function generateLKPD() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('lkpdSubject').value;
    const kelas = document.getElementById('lkpdClass').value;
    const elemen = document.getElementById('lkpdElemen').value;
    const rombel = document.getElementById('lkpdRombel').value || 'A';
    
    // Check if needs Arabic support
    const needsArabic = ['PAI', 'Pendidikan Agama Islam', 'Bahasa Arab'].some(
        s => subject.toLowerCase().includes(s.toLowerCase())
    );
    
    // Update LKPD header
    document.getElementById('lkpdMapelName').textContent = subject;
    document.getElementById('lkpdKelasRombel').textContent = `${kelas} / ${rombel}`;
    document.getElementById('lkpdElemen').textContent = elemen;
    
    // Load TP for this elemen
    const level = userData?.profile?.school?.level || 'SD';
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => d.kelas == kelas && d.elemen === elemen);
    
    let tpHtml = '';
    filteredData.forEach(tp => {
        tpHtml += `<li>${tp.tp}</li>`;
    });
    document.getElementById('lkpdTPList').innerHTML = tpHtml;
    
    // Add Arabic support if needed
    if (needsArabic) {
        document.getElementById('lkpdContainer').classList.add('arabic-support');
    }
    
    showAlert('LKPD berhasil di-generate!', 'success');
}

// Generate KKTP (Premium)
async function generateKKTP() {
    if (userData?.subscription !== 'premium') {
        showUpgradeModal();
        return;
    }
    
    const subject = document.getElementById('kktpSubject').value;
    const kelas = document.getElementById('kktpClass').value;
    const rombel = document.getElementById('kktpRombel').value || 'A';
    
    if (!subject) {
        showAlert('Pilih mata pelajaran', 'warning');
        return;
    }
    
    const phase = getPhase(kelas);
    const level = userData?.profile?.school?.level || 'SD';
    const academicYear = userData?.settings?.academicYear || getCurrentAcademicYear().current;
    
    // Load CP data
    const cpData = await loadCPData(subject, level);
    const filteredData = cpData.filter(d => d.kelas == kelas);
    
    // Update header
    document.getElementById('kktpGuru').textContent = userData?.name || '-';
    document.getElementById('kktpSekolah').textContent = userData?.profile?.school?.name || '-';
    document.getElementById('kktpTahun').textContent = academicYear;
    document.getElementById('kktpMapel').textContent = subject;
    document.getElementById('kktpFaseKelas').textContent = `${phase} / ${kelas} / ${rombel}`;
    
    // Generate table
    const tbody = document.getElementById('kktpBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="border p-4 text-center text-gray-500">Data belum tersedia</td></tr>`;
        return;
    }
    
    // Group by semester and elemen
    const grouped = { 'Ganjil': {}, 'Genap': {} };
    filteredData.forEach(item => {
        const smt = item.semester;
        if (!grouped[smt][item.elemen]) {
            grouped[smt][item.elemen] = [];
        }
        grouped[smt][item.elemen].push(item);
    });
    
    let html = '';
    let no = 1;
    
    ['Ganjil', 'Genap'].forEach(semester => {
        Object.entries(grouped[semester] || {}).forEach(([elemen, tps]) => {
            tps.forEach((tp, idx) => {
                html += `<tr>`;
                
                if (idx === 0) {
                    html += `
                        <td rowspan="${tps.length}" class="border p-2 text-center">${no}</td>
                        <td rowspan="${tps.length}" class="border p-2 text-center">${semester}</td>
                        <td rowspan="${tps.length}" class="border p-2 bg-gray-50">
                            <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-weight: bold;">
                                ${elemen}
                            </div>
                        </td>
                    `;
                    no++;
                }
                
                html += `
                    <td class="border p-2 text-left text-xs" contenteditable="true">${tp.tp}</td>
                    <td class="border p-2 text-center bg-yellow-50" contenteditable="true" oninput="calculateKKTP(this)">75</td>
                    <td class="border p-2 text-center bg-yellow-50" contenteditable="true" oninput="calculateKKTP(this)">75</td>
                    <td class="border p-2 text-center bg-yellow-50" contenteditable="true" oninput="calculateKKTP(this)">75</td>
                    <td class="border p-2 text-center bg-blue-100 font-bold kktp-result">75</td>
                </tr>`;
            });
        });
    });
    
    tbody.innerHTML = html;
    
    // Update signature
    const city = userData?.profile?.school?.city || 'Jakarta';
    const dateStr = formatDate(new Date(), 'long');
    document.getElementById('kktpLocation').textContent = `${city}, ${dateStr}`;
    document.getElementById('kktpHeadmaster').textContent = userData?.profile?.school?.headmaster || '-';
    document.getElementById('kktpHeadmasterNip').textContent = userData?.profile?.school?.headmasterNip || '-';
    document.getElementById('kktpTeacher').textContent = userData?.name || '-';
    document.getElementById('kktpTeacherNip').textContent = userData?.profile?.nip || '-';
    
    showAlert('KKTP berhasil di-generate!', 'success');
}

function calculateKKTP(element) {
    const row = element.closest('tr');
    const inputs = row.querySelectorAll('td[contenteditable="true"]');
    const resultCell = row.querySelector('.kktp-result');
    
    if (inputs.length >= 3 && resultCell) {
        let sum = 0;
        let count = 0;
        
        // Get last 3 editable cells (the KKTP criteria)
        const kriteria = Array.from(inputs).slice(-3);
        kriteria.forEach(td => {
            const val = parseFloat(td.textContent.replace(/[^0-9.]/g, ''));
            if (!isNaN(val)) {
                sum += val;
                count++;
            }
        });
        
        if (count > 0) {
            resultCell.textContent = Math.round(sum / count);
        }
    }
}

// Print Document
function printDocument(docType) {
    window.print();
}

console.log('Documents Module Loaded');