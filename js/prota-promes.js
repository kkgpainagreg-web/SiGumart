// Prota & Promes Generator

const namaBulanGasal = ["Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const namaBulanGenap = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];

// Generate Prota
async function generateProta() {
    const kelas = document.getElementById('protaKelas').value;
    const rombel = document.getElementById('protaRombel').value || 'A';
    const hariTarget = parseInt(document.getElementById('protaHari').value);
    const jpPerHari = parseInt(document.getElementById('protaJP').value) || 4;
    const jenjang = window.profilData?.jenjang || 'SD';
    
    const kurikulum = getKurikulumData(kelas, jenjang);
    
    if (!kurikulum) {
        document.getElementById('protaPrintArea').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-600">Data kurikulum untuk kelas ${kelas} belum tersedia.</p>
                <p class="text-sm text-gray-500 mt-2">Silakan tambahkan ATP terlebih dahulu.</p>
            </div>
        `;
        return;
    }

    const tahunAwal = parseInt(currentTahunAjaran.split('/')[0]);
    const tahunAkhir = tahunAwal + 1;
    const fase = getFaseFromKelas(kelas, jenjang);
    
    // Combine Gasal and Genap
    const allData = [];
    let no = 1;
    
    ['Gasal', 'Genap'].forEach(semester => {
        if (kurikulum[semester]) {
            kurikulum[semester].forEach(bab => {
                const totalJP = bab.sub.reduce((sum, s) => sum + s[1], 0);
                allData.push({
                    no: no++,
                    semester: semester,
                    bab: bab.bab,
                    subMateri: bab.sub.map(s => s[0]),
                    totalJP: totalJP
                });
            });
        }
    });

    // Generate HTML
    const html = `
        <style>
            @media print {
                .prota-page { page-break-after: always; }
                .prota-page:last-child { page-break-after: auto; }
            }
            .prota-table th, .prota-table td { border: 1px solid #000; padding: 6px 8px; }
            .prota-table th { background-color: #f3f4f6; }
        </style>
        
        <div class="prota-page">
            <div style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase;">
                PROGRAM TAHUNAN (PROTA)<br>
                PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI
            </div>
            
            <table style="width: 70%; margin-bottom: 20px; font-size: 11pt;">
                <tr>
                    <td width="180">Satuan Pendidikan</td>
                    <td width="10">:</td>
                    <td><strong>${window.profilData?.namaSekolah || '-'}</strong></td>
                </tr>
                <tr>
                    <td>Mata Pelajaran</td>
                    <td>:</td>
                    <td>Pendidikan Agama Islam & BP</td>
                </tr>
                <tr>
                    <td>Fase / Kelas / Rombel</td>
                    <td>:</td>
                    <td>Fase ${fase} / Kelas ${toRoman(parseInt(kelas))} / ${rombel}</td>
                </tr>
                <tr>
                    <td>Tahun Ajaran</td>
                    <td>:</td>
                    <td>${currentTahunAjaran}</td>
                </tr>
            </table>
            
            <table class="prota-table" style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="12%">Semester</th>
                        <th width="35%">Bab / Materi Pokok</th>
                        <th width="38%">Capaian Pembelajaran (Sub Materi)</th>
                        <th width="10%">Alokasi Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    ${allData.map(item => `
                        <tr>
                            <td style="text-align: center; vertical-align: top;">${item.no}</td>
                            <td style="text-align: center; vertical-align: top;">${item.semester}</td>
                            <td style="vertical-align: top;">${item.bab}</td>
                            <td style="vertical-align: top;">
                                <ul style="margin: 0; padding-left: 16px;">
                                    ${item.subMateri.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </td>
                            <td style="text-align: center; vertical-align: top;">${item.totalJP} JP</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <td colspan="4" style="text-align: right; font-weight: bold;">Total Alokasi Waktu</td>
                        <td style="text-align: center; font-weight: bold;">${allData.reduce((sum, i) => sum + i.totalJP, 0)} JP</td>
                    </tr>
                </tbody>
            </table>
            
            ${generateSignature()}
        </div>
    `;
    
    document.getElementById('protaPrintArea').innerHTML = html;
}

// Generate Promes
async function generatePromes() {
    if (!checkPremiumAccess('promes')) {
        document.getElementById('promesPrintArea').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-lock text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-600">Fitur Promes tersedia untuk pengguna Premium</p>
                <button onclick="showUpgradeModal()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                    <i class="fas fa-crown mr-2"></i>Upgrade ke Premium
                </button>
            </div>
        `;
        return;
    }

    const kelas = document.getElementById('promesKelas').value;
    const rombel = document.getElementById('promesRombel').value || 'A';
    const semester = document.getElementById('promesSemester').value;
    const hariTarget = parseInt(document.getElementById('promesHari').value);
    const jpPerHari = parseInt(document.getElementById('promesJP').value) || 4;
    const jenjang = window.profilData?.jenjang || 'SD';
    
    const kurikulum = getKurikulumData(kelas, jenjang);
    
    if (!kurikulum || !kurikulum[semester]) {
        document.getElementById('promesPrintArea').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-circle text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-600">Data kurikulum untuk kelas ${kelas} semester ${semester} belum tersedia.</p>
            </div>
        `;
        return;
    }

    const tahunAwal = parseInt(currentTahunAjaran.split('/')[0]);
    const fase = getFaseFromKelas(kelas, jenjang);
    
    // Calculate teaching dates
    const thnOperasional = (semester === "Gasal") ? tahunAwal : tahunAwal + 1;
    const blnAwal = (semester === "Gasal") ? 6 : 0; // July = 6, January = 0
    
    // Get all teaching dates for the semester
    const startDate = new Date(thnOperasional, blnAwal, 1);
    const endDate = new Date(thnOperasional, blnAwal + 5, 31);
    
    const semuaTanggalMengajar = getTeachingDates(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        hariTarget
    );

    // Process allocation
    let idxTanggal = (semester === "Gasal") ? 2 : 1;
    let sisaJpHariIni = jpPerHari;
    const dataBab = kurikulum[semester];
    
    const promesRows = [];
    
    dataBab.forEach((bab, iBab) => {
        bab.sub.forEach((sub, iSub) => {
            let kebutuhanJp = sub[1];
            const alokasiPromes = [];

            while (kebutuhanJp > 0 && idxTanggal < semuaTanggalMengajar.length) {
                if (sisaJpHariIni === 0) {
                    idxTanggal++;
                    sisaJpHariIni = jpPerHari;
                    if (idxTanggal >= semuaTanggalMengajar.length) break;
                }

                const tglAktif = semuaTanggalMengajar[idxTanggal];
                const jpDiberikan = Math.min(kebutuhanJp, sisaJpHariIni);

                alokasiPromes.push({ date: tglAktif, jp: jpDiberikan });
                kebutuhanJp -= jpDiberikan;
                sisaJpHariIni -= jpDiberikan;
            }

            promesRows.push({
                namaBab: iSub === 0 ? (iBab + 1) : "",
                namaSub: sub[0],
                totalJp: sub[1],
                alokasi: alokasiPromes,
                rowspan: iSub === 0 ? bab.sub.length : 0
            });
        });
    });

    // Generate table header
    const namaBulan = (semester === "Gasal") ? namaBulanGasal : namaBulanGenap;
    
    let headHTML = `
        <tr>
            <th rowspan="2" style="width: 3%;">No</th>
            <th rowspan="2" style="width: 25%;">Capaian Materi Pokok</th>
            <th rowspan="2" style="width: 4%;">JP</th>
            ${namaBulan.map(b => `<th colspan="5">${b}</th>`).join('')}
        </tr>
        <tr>
            ${Array(6).fill('').map(() => '<th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>').join('')}
        </tr>
    `;

    // Generate table body
    let bodyHTML = promesRows.map(row => {
        let rowHTML = `<tr>`;
        if (row.rowspan > 0) {
            rowHTML += `<td rowspan="${row.rowspan}" style="text-align: center;">${row.namaBab}</td>`;
        }
        rowHTML += `<td style="text-align: left; padding-left: 5px; font-size: 9pt;">${row.namaSub}</td>`;
        rowHTML += `<td style="text-align: center;">${row.totalJp}</td>`;

        for (let b = 0; b < 6; b++) {
            for (let w = 1; w <= 5; w++) {
                const bulanTarget = blnAwal + b;
                const alokasiSelIni = row.alokasi.filter(a => {
                    const aMonth = a.date.getMonth();
                    let aWeek = Math.ceil(a.date.getDate() / 7);
                    if (aWeek > 5) aWeek = 5;
                    return (aMonth === bulanTarget) && (aWeek === w);
                });

                if (alokasiSelIni.length > 0) {
                    const totalJpSel = alokasiSelIni.reduce((sum, a) => sum + a.jp, 0);
                    const labelTgl = alokasiSelIni.map(a => a.date.getDate()).join(',');
                    rowHTML += `<td style="background-color: #eaf2ff; text-align: center;">
                        <span style="font-size: 10pt; font-weight: bold; color: #2980b9;">${totalJpSel}</span><br>
                        <span style="font-size: 7pt; color: #c0392b;">(${labelTgl})</span>
                    </td>`;
                } else {
                    rowHTML += `<td></td>`;
                }
            }
        }

        rowHTML += `</tr>`;
        return rowHTML;
    }).join('');

    // Final HTML
    const html = `
        <style>
            @media print {
                @page { size: A4 landscape; margin: 10mm; }
                .promes-page { page-break-after: always; }
            }
            .promes-table th, .promes-table td { 
                border: 1px solid #000; 
                padding: 3px; 
                vertical-align: middle;
                text-align: center;
                font-size: 9pt;
            }
            .promes-table th { background-color: #f3f4f6; font-weight: bold; }
        </style>
        
        <div class="promes-page" style="min-width: 1100px;">
            <div style="text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 15px; text-transform: uppercase;">
                PROGRAM SEMESTER (PROMES)<br>
                SEMESTER ${semester.toUpperCase()}
            </div>
            
            <table style="width: 70%; margin-bottom: 15px; font-size: 10pt;">
                <tr>
                    <td width="160">Satuan Pendidikan</td>
                    <td width="10">:</td>
                    <td><strong>${window.profilData?.namaSekolah || '-'}</strong></td>
                </tr>
                <tr>
                    <td>Mata Pelajaran</td>
                    <td>:</td>
                    <td>Pendidikan Agama Islam & BP</td>
                </tr>
                <tr>
                    <td>Fase / Kelas / Rombel</td>
                    <td>:</td>
                    <td>Fase ${fase} / Kelas ${toRoman(parseInt(kelas))} / ${rombel}</td>
                </tr>
                <tr>
                    <td>Tahun Ajaran</td>
                    <td>:</td>
                    <td>${currentTahunAjaran}</td>
                </tr>
                <tr>
                    <td>Hari Efektif KBM</td>
                    <td>:</td>
                    <td style="color: #c0392b;">Setiap Hari ${namaHari[hariTarget]}</td>
                </tr>
            </table>
            
            <table class="promes-table" style="width: 100%; border-collapse: collapse;">
                <thead>${headHTML}</thead>
                <tbody>
                    ${bodyHTML}
                    <tr style="background-color: #f8f9fa;">
                        <td colspan="3" style="text-align: left; font-weight: bold; padding-left: 5px;">
                            Penilaian / Cadangan / Remedial
                        </td>
                        <td colspan="30" style="text-align: left; font-style: italic; font-size: 8pt; padding-left: 5px;">
                            Tanggal (warna merah) di-generate secara otomatis berdasarkan kalender akademik.
                        </td>
                    </tr>
                </tbody>
            </table>
            
            ${generateSignature()}
        </div>
    `;
    
    document.getElementById('promesPrintArea').innerHTML = html;
}

// Generate Signature Area
function generateSignature() {
    const kota = window.profilData?.kotaSekolah || 'Kudus';
    const now = new Date();
    const tanggal = `${kota}, ${now.getDate()} ${getBulanName(now.getMonth())} ${now.getFullYear()}`;
    
    return `
        <div style="width: 100%; margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid;">
            <div style="text-align: center; width: 45%;">
                Mengetahui,<br>Kepala Sekolah
                <div style="text-decoration: underline; font-weight: bold; margin-top: 70px;">
                    ${window.profilData?.namaKepsek || '............................'}
                </div>
                NIP. ${window.profilData?.nipKepsek || '............................'}
            </div>
            <div style="text-align: center; width: 45%;">
                ${tanggal}<br>Guru PAI & BP
                <div style="text-decoration: underline; font-weight: bold; margin-top: 70px;">
                    ${window.profilData?.namaGuru || '............................'}
                </div>
                NIP. ${window.profilData?.nipGuru || '............................'}
            </div>
        </div>
    `;
}