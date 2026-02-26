// ============================================
// PRINT SERVICE - AGSA
// Handles document printing and PDF generation
// ============================================

const PrintService = {
    
    // Print settings
    settings: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: {
            top: '2cm',
            right: '2cm',
            bottom: '2cm',
            left: '2.5cm'
        }
    },
    
    /**
     * Initialize print service
     */
    init() {
        // Add print styles to document if not exists
        if (!document.getElementById('print-styles')) {
            const style = document.createElement('style');
            style.id = 'print-styles';
            style.textContent = this.getPrintStyles();
            document.head.appendChild(style);
        }
    },
    
    /**
     * Get print CSS styles
     */
    getPrintStyles() {
        return `
            @media print {
                /* Hide non-print elements */
                .no-print, 
                #sidebar, 
                #navbar, 
                .nav-link,
                button:not(.print-btn) {
                    display: none !important;
                }
                
                /* Reset body */
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 12pt;
                    line-height: 1.5;
                }
                
                /* Print container */
                .print-container {
                    width: 100%;
                    max-width: none;
                    margin: 0;
                    padding: 0;
                }
                
                /* Page break controls */
                .page-break {
                    page-break-before: always;
                }
                
                .no-break {
                    page-break-inside: avoid;
                }
                
                /* Table styles */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11pt;
                }
                
                th, td {
                    border: 1px solid #000;
                    padding: 4px 8px;
                    text-align: left;
                    vertical-align: top;
                }
                
                th {
                    background-color: #f0f0f0 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                /* Header styles */
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 3px double #000;
                    padding-bottom: 10px;
                }
                
                .print-header h1 {
                    font-size: 14pt;
                    font-weight: bold;
                    margin: 0;
                }
                
                .print-header h2 {
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 5px 0;
                }
                
                /* Signature area */
                .signature-area {
                    margin-top: 30px;
                    page-break-inside: avoid;
                }
                
                .signature-box {
                    display: inline-block;
                    width: 45%;
                    text-align: center;
                    vertical-align: top;
                }
                
                .signature-box img {
                    max-width: 100px;
                    max-height: 60px;
                }
                
                .signature-line {
                    border-bottom: 1px solid #000;
                    width: 200px;
                    margin: 60px auto 5px;
                }
                
                /* RTL Support */
                .rtl {
                    direction: rtl;
                    text-align: right;
                    font-family: 'Traditional Arabic', 'Scheherazade', serif;
                }
                
                /* Footer */
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 10pt;
                    color: #666;
                }
            }
        `;
    },
    
    /**
     * Generate printable HTML for ATP
     */
    generateATPPrint(atpData, profil) {
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    ALUR TUJUAN PEMBELAJARAN (ATP)
                </h2>
                
                <table style="margin-bottom: 20px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${atpData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Fase / Kelas</td>
                        <td style="border: none;">: ${atpData.fase} / ${atpData.kelas}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${atpData.tahunAjar}</td>
                    </tr>
                </table>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 20%;">Elemen</th>
                            <th style="width: 30%;">Capaian Pembelajaran</th>
                            <th style="width: 35%;">Tujuan Pembelajaran</th>
                            <th style="width: 10%;">JP</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${atpData.alurTP.map((item, idx) => `
                            <tr class="no-break">
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${item.elemen}</td>
                                <td>${item.cp}</td>
                                <td>
                                    ${item.tp.map(tp => `
                                        <p><strong>${tp.kode}</strong>: ${tp.deskripsi}</p>
                                    `).join('')}
                                </td>
                                <td style="text-align: center;">
                                    ${item.tp.reduce((sum, tp) => sum + tp.alokasiWaktu, 0)}
                                </td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">Total JP</td>
                            <td style="text-align: center; font-weight: bold;">${atpData.totalJP}</td>
                        </tr>
                    </tbody>
                </table>
                
                ${this.generateSignature(profil, atpData.tanggalPengesahan)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for Prota
     */
    generateProtaPrint(protaData, profil) {
        const semester1Months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const semester2Months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
        
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    PROGRAM TAHUNAN (PROTA)
                </h2>
                
                <table style="margin-bottom: 20px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${protaData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Kelas</td>
                        <td style="border: none;">: ${protaData.kelas}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${protaData.tahunAjar}</td>
                    </tr>
                </table>
                
                <!-- Semester 1 -->
                <h3>Semester 1 (Ganjil)</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 20%;">Elemen</th>
                            <th style="width: 40%;">Tujuan Pembelajaran</th>
                            <th style="width: 10%;">JP</th>
                            <th style="width: 25%;">Bulan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${protaData.distribusiSemester1.map((item, idx) => `
                            <tr>
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${item.elemen}</td>
                                <td>${item.tp}</td>
                                <td style="text-align: center;">${item.alokasiWaktu}</td>
                                <td>${item.bulan.join(', ')}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Total JP Semester 1</td>
                            <td style="text-align: center; font-weight: bold;">${protaData.totalJPSemester1}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Semester 2 -->
                <h3 class="page-break">Semester 2 (Genap)</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 20%;">Elemen</th>
                            <th style="width: 40%;">Tujuan Pembelajaran</th>
                            <th style="width: 10%;">JP</th>
                            <th style="width: 25%;">Bulan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${protaData.distribusiSemester2.map((item, idx) => `
                            <tr>
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${item.elemen}</td>
                                <td>${item.tp}</td>
                                <td style="text-align: center;">${item.alokasiWaktu}</td>
                                <td>${item.bulan.join(', ')}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Total JP Semester 2</td>
                            <td style="text-align: center; font-weight: bold;">${protaData.totalJPSemester2}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                <p style="margin-top: 20px; font-weight: bold;">
                    Total JP Setahun: ${protaData.totalJPTahun} JP
                </p>
                
                ${this.generateSignature(profil)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for Promes
     */
    generatePromesPrint(promesData, profil) {
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    PROGRAM SEMESTER (PROMES)
                </h2>
                
                <table style="margin-bottom: 20px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${promesData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Kelas / Fase</td>
                        <td style="border: none;">: ${promesData.kelas} / ${promesData.fase}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Semester</td>
                        <td style="border: none;">: ${promesData.semester}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${promesData.tahunAjar}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Minggu Efektif</td>
                        <td style="border: none;">: ${promesData.mingguEfektif} minggu</td>
                    </tr>
                </table>
                
                <table>
                    <thead>
                        <tr>
                            <th style="width: 8%;">Minggu</th>
                            <th style="width: 15%;">Tanggal</th>
                            <th style="width: 15%;">Elemen</th>
                            <th style="width: 40%;">Tujuan Pembelajaran</th>
                            <th style="width: 7%;">JP</th>
                            <th style="width: 15%;">Ket</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${promesData.detailMingguan.map(week => `
                            <tr class="no-break">
                                <td style="text-align: center;">${week.mingguKe}</td>
                                <td style="font-size: 10pt;">
                                    ${week.tanggalMulai ? Utils.formatDate(week.tanggalMulai, 'DD/MM') : '-'} -
                                    ${week.tanggalSelesai ? Utils.formatDate(week.tanggalSelesai, 'DD/MM') : '-'}
                                    ${week.tanggalPertemuan.length > 0 ? `
                                        <br><small>Pertemuan: ${week.tanggalPertemuan.map(t => Utils.formatDate(t, 'DD/MM')).join(', ')}</small>
                                    ` : ''}
                                </td>
                                <td>${week.materi.elemen}</td>
                                <td>
                                    ${week.materi.tp.map(tp => `
                                        <p style="margin: 2px 0;"><strong>${tp.kode}</strong>: ${tp.deskripsi}</p>
                                    `).join('')}
                                </td>
                                <td style="text-align: center;">${week.alokasiJP}</td>
                                <td>${week.keterangan || ''}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">Total JP</td>
                            <td style="text-align: center; font-weight: bold;">${promesData.totalJP}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                
                ${this.generateSignature(profil)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for Modul Ajar
     */
    generateModulAjarPrint(modulData, profil) {
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    MODUL AJAR
                </h2>
                
                <!-- Identitas -->
                <table style="margin-bottom: 15px;">
                    <tr>
                        <td style="width: 30%; font-weight: bold;">Nama Penyusun</td>
                        <td>${modulData.identitasSekolah.penyusun}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Instansi</td>
                        <td>${modulData.identitasSekolah.instansi}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Mata Pelajaran</td>
                        <td>${modulData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Fase / Kelas</td>
                        <td>${modulData.fase} / ${modulData.kelas}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Pertemuan Ke</td>
                        <td>${modulData.pertemuanKe}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Alokasi Waktu</td>
                        <td>${modulData.kegiatanPembelajaran.pendahuluan.durasi + 
                            modulData.kegiatanPembelajaran.inti.durasi + 
                            modulData.kegiatanPembelajaran.penutup.durasi} menit</td>
                    </tr>
                </table>
                
                <!-- Tujuan Pembelajaran -->
                <h3>A. Tujuan Pembelajaran</h3>
                <div style="margin-left: 20px;">
                    ${modulData.tujuanPembelajaran.map(tp => `
                        <p><strong>${tp.kode}</strong>: ${tp.deskripsi}</p>
                    `).join('')}
                </div>
                
                <!-- Profil Pelajar Pancasila -->
                <h3>B. Profil Pelajar Pancasila</h3>
                <p style="margin-left: 20px;">${modulData.profilPelajarPancasila.join(', ')}</p>
                
                <!-- Sarana & Prasarana -->
                <h3>C. Sarana & Prasarana</h3>
                <p style="margin-left: 20px;">${modulData.saranaPrasarana || '-'}</p>
                
                <!-- Model Pembelajaran -->
                <h3>D. Model Pembelajaran</h3>
                <p style="margin-left: 20px;">${modulData.modelPembelajaran || '-'}</p>
                
                <!-- Pemahaman Bermakna -->
                <h3 class="page-break">E. Pemahaman Bermakna</h3>
                <p style="margin-left: 20px;">${modulData.pemahamanBermakna || '-'}</p>
                
                <!-- Pertanyaan Pemantik -->
                <h3>F. Pertanyaan Pemantik</h3>
                <p style="margin-left: 20px;">${modulData.pertanyaanPemantik || '-'}</p>
                
                <!-- Kegiatan Pembelajaran -->
                <h3>G. Kegiatan Pembelajaran</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 20%;">Kegiatan</th>
                            <th style="width: 65%;">Deskripsi</th>
                            <th style="width: 15%;">Durasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight: bold;">Pendahuluan</td>
                            <td>${modulData.kegiatanPembelajaran.pendahuluan.kegiatan}</td>
                            <td style="text-align: center;">${modulData.kegiatanPembelajaran.pendahuluan.durasi} menit</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">Inti</td>
                            <td>${modulData.kegiatanPembelajaran.inti.kegiatan}</td>
                            <td style="text-align: center;">${modulData.kegiatanPembelajaran.inti.durasi} menit</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold;">Penutup</td>
                            <td>${modulData.kegiatanPembelajaran.penutup.kegiatan}</td>
                            <td style="text-align: center;">${modulData.kegiatanPembelajaran.penutup.durasi} menit</td>
                        </tr>
                    </tbody>
                </table>
                
                <!-- Asesmen -->
                <h3>H. Asesmen</h3>
                <table>
                    <tr>
                        <td style="width: 30%; font-weight: bold;">Formatif</td>
                        <td>${modulData.asesmen.formatif || '-'}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold;">Sumatif</td>
                        <td>${modulData.asesmen.sumatif || '-'}</td>
                    </tr>
                </table>
                
                <!-- Pengayaan & Remedial -->
                <h3>I. Pengayaan & Remedial</h3>
                <p style="margin-left: 20px;">${modulData.pengayaanRemedial || '-'}</p>
                
                <!-- Bahan Ajar -->
                ${modulData.bahanAjar ? `
                    <h3>J. Bahan Ajar</h3>
                    <div style="margin-left: 20px;" class="${modulData.bahanAjar.includes('ا') ? 'rtl' : ''}">
                        ${modulData.bahanAjar}
                    </div>
                ` : ''}
                
                <!-- Daftar Pustaka -->
                ${modulData.daftarPustaka ? `
                    <h3>K. Daftar Pustaka</h3>
                    <p style="margin-left: 20px;">${modulData.daftarPustaka}</p>
                ` : ''}
                
                ${this.generateSignature(profil, modulData.tanggalPertemuan)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for Jurnal
     */
    generateJurnalPrint(jurnalList, profil, filterMonth = null) {
        // Filter by month if specified
        const filtered = filterMonth ? 
            jurnalList.filter(j => {
                const date = new Date(j.tanggal);
                return date.getMonth() === filterMonth.month && date.getFullYear() === filterMonth.year;
            }) : 
            jurnalList;
        
        const monthName = filterMonth ? 
            Utils.getMonthName(filterMonth.month) + ' ' + filterMonth.year :
            'Semua Periode';
        
        // Get pengesahan date (last working day of month)
        const pengesahanDate = filterMonth ?
            Utils.getTanggalPengesahan(filterMonth.month + 1, filterMonth.year) :
            new Date();
        
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    JURNAL PEMBELAJARAN
                </h2>
                
                <table style="margin-bottom: 15px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${filtered[0]?.mataPelajaran || '-'}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Kelas / Fase</td>
                        <td style="border: none;">: ${filtered[0]?.kelas || '-'} / ${filtered[0]?.fase || '-'}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Semester</td>
                        <td style="border: none;">: ${filtered[0]?.semester || '-'}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${filtered[0]?.tahunAjar || '-'}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Periode</td>
                        <td style="border: none;">: ${monthName}</td>
                    </tr>
                </table>
                
                <table style="font-size: 10pt;">
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 12%;">Hari/Tgl</th>
                            <th style="width: 8%;">Jam</th>
                            <th style="width: 20%;">Materi</th>
                            <th style="width: 20%;">Tujuan Pembelajaran</th>
                            <th style="width: 10%;">Hadir</th>
                            <th style="width: 15%;">Hasil</th>
                            <th style="width: 10%;">Ket</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((jurnal, idx) => `
                            <tr class="no-break">
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${jurnal.hari}, ${Utils.formatDate(jurnal.tanggal, 'DD/MM/YY')}</td>
                                <td style="text-align: center;">${jurnal.jamKe}</td>
                                <td>${jurnal.materi}</td>
                                <td style="font-size: 9pt;">
                                    ${jurnal.tujuanPembelajaran.map(tp => tp.deskripsi).join('; ')}
                                </td>
                                <td style="text-align: center;">
                                    H:${jurnal.kehadiran.hadir}<br>
                                    S:${jurnal.kehadiran.sakit}<br>
                                    I:${jurnal.kehadiran.izin}<br>
                                    A:${jurnal.kehadiran.alpha}
                                </td>
                                <td>${jurnal.hasilPembelajaran || ''}</td>
                                <td>${jurnal.keterangan || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${this.generateSignature(profil, pengesahanDate)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for KKTP
     */
    generateKKTPPrint(kktpData, profil) {
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
                </h2>
                
                <table style="margin-bottom: 15px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${kktpData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Kelas</td>
                        <td style="border: none;">: ${kktpData.kelas}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Semester</td>
                        <td style="border: none;">: ${kktpData.semester}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${kktpData.tahunAjar}</td>
                    </tr>
                </table>
                
                <!-- Kriteria -->
                <h3>Kriteria Penilaian:</h3>
                <table style="width: auto; margin-bottom: 15px;">
                    ${kktpData.tujuanPembelajaran[0]?.kriteria ? `
                        <tr>
                            <td style="width: 150px;">Mulai Berkembang</td>
                            <td>: ${kktpData.tujuanPembelajaran[0].kriteria.mulai.min} - ${kktpData.tujuanPembelajaran[0].kriteria.mulai.max}</td>
                        </tr>
                        <tr>
                            <td>Sedang Berkembang</td>
                            <td>: ${kktpData.tujuanPembelajaran[0].kriteria.sedang.min} - ${kktpData.tujuanPembelajaran[0].kriteria.sedang.max}</td>
                        </tr>
                        <tr>
                            <td>Sudah Berkembang</td>
                            <td>: ${kktpData.tujuanPembelajaran[0].kriteria.mahir.min} - ${kktpData.tujuanPembelajaran[0].kriteria.mahir.max}</td>
                        </tr>
                    ` : ''}
                </table>
                
                <!-- Nilai Table -->
                <table style="font-size: 10pt;">
                    <thead>
                        <tr>
                            <th style="width: 5%;">No</th>
                            <th style="width: 25%;">Nama Siswa</th>
                            ${kktpData.tujuanPembelajaran.map(tp => `
                                <th style="width: ${50 / kktpData.tujuanPembelajaran.length}%;">${tp.kode}</th>
                            `).join('')}
                            <th style="width: 10%;">Rata-rata</th>
                            <th style="width: 10%;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${kktpData.nilaiSiswa.map((siswa, idx) => `
                            <tr>
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${siswa.namaSiswa}</td>
                                ${kktpData.tujuanPembelajaran.map(tp => `
                                    <td style="text-align: center;">
                                        ${siswa.nilaiPerTP[tp.kode]?.nilai || '-'}
                                    </td>
                                `).join('')}
                                <td style="text-align: center; font-weight: bold;">${siswa.rataRata || '-'}</td>
                                <td style="text-align: center;">${siswa.statusAkhir || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${this.generateSignature(profil)}
            </div>
        `;
    },
    
    /**
     * Generate printable HTML for Daftar Nilai
     */
    generateNilaiPrint(nilaiData, profil) {
        const sumatifCodes = nilaiData.sumatifDetail.map(s => s.kode);
        
        return `
            <div class="print-container">
                ${this.generateHeader(profil)}
                
                <h2 style="text-align: center; margin: 20px 0;">
                    DAFTAR NILAI SISWA
                </h2>
                
                <table style="margin-bottom: 15px; border: none;">
                    <tr>
                        <td style="border: none; width: 150px;">Mata Pelajaran</td>
                        <td style="border: none;">: ${nilaiData.namaMapel}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Kelas</td>
                        <td style="border: none;">: ${nilaiData.kelas}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Semester</td>
                        <td style="border: none;">: ${nilaiData.semester}</td>
                    </tr>
                    <tr>
                        <td style="border: none;">Tahun Pelajaran</td>
                        <td style="border: none;">: ${nilaiData.tahunAjar}</td>
                    </tr>
                </table>
                
                <table style="font-size: 10pt;">
                    <thead>
                        <tr>
                            <th rowspan="2" style="width: 5%;">No</th>
                            <th rowspan="2" style="width: 25%;">Nama Siswa</th>
                            <th colspan="${sumatifCodes.length + 1}">${nilaiData.komponenNilai.sumatif.label}</th>
                            <th rowspan="2">${nilaiData.komponenNilai.ats.label}</th>
                            <th rowspan="2">${nilaiData.komponenNilai.asas.label}</th>
                            <th rowspan="2">NR</th>
                            <th rowspan="2">Predikat</th>
                        </tr>
                        <tr>
                            ${sumatifCodes.map(code => `<th>${code}</th>`).join('')}
                            <th>Rata²</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${nilaiData.nilaiSiswa.map((siswa, idx) => `
                            <tr>
                                <td style="text-align: center;">${idx + 1}</td>
                                <td>${siswa.namaSiswa}</td>
                                ${sumatifCodes.map(code => `
                                    <td style="text-align: center;">${siswa.sumatif[code] || '-'}</td>
                                `).join('')}
                                <td style="text-align: center;">${siswa.sumatif.rataRata || '-'}</td>
                                <td style="text-align: center;">${siswa.ats || '-'}</td>
                                <td style="text-align: center;">${siswa.asas || '-'}</td>
                                <td style="text-align: center; font-weight: bold;">${siswa.nilaiRapor || '-'}</td>
                                <td style="text-align: center;">${siswa.predikat || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <p style="margin-top: 10px; font-size: 10pt;">
                    <strong>Keterangan Bobot:</strong>
                    ${nilaiData.komponenNilai.sumatif.label}: ${nilaiData.komponenNilai.sumatif.bobot}% |
                    ${nilaiData.komponenNilai.ats.label}: ${nilaiData.komponenNilai.ats.bobot}% |
                    ${nilaiData.komponenNilai.asas.label}: ${nilaiData.komponenNilai.asas.bobot}%
                </p>
                
                ${this.generateSignature(profil)}
            </div>
        `;
    },
    
    /**
     * Generate document header
     */
    generateHeader(profil) {
        return `
            <div class="print-header">
                <h1>PEMERINTAH DAERAH</h1>
                <h2>${(profil?.namaSatuan || 'NAMA SEKOLAH').toUpperCase()}</h2>
                <p style="margin: 0;">${profil?.alamat || 'Alamat Sekolah'}</p>
                <p style="margin: 0;">NPSN: ${profil?.npsn || '-'}</p>
            </div>
        `;
    },
    
    /**
     * Generate signature area
     */
    generateSignature(profil, tanggal = null) {
        const signDate = tanggal ? new Date(tanggal) : new Date();
        const formattedDate = Utils.formatDate(signDate, 'DD MMMM YYYY');
        
        return `
            <div class="signature-area">
                <table style="width: 100%; border: none; margin-top: 40px;">
                    <tr>
                        <td style="width: 50%; border: none; text-align: center;">
                            Mengetahui,<br>
                            Kepala ${profil?.namaSatuan || 'Sekolah'}
                            <div style="height: 80px; display: flex; align-items: center; justify-content: center;">
                                ${profil?.linkTTDKepalaSekolah ? 
                                    `<img src="${profil.linkTTDKepalaSekolah}" style="max-height: 60px;" alt="TTD Kepsek">` : 
                                    ''
                                }
                            </div>
                            <u><strong>${profil?.namaKepalaSekolah || '________________________'}</strong></u><br>
                            NIP. ${profil?.nipKepalaSekolah || '________________________'}
                        </td>
                        <td style="width: 50%; border: none; text-align: center;">
                            ${profil?.lokasiPengesahan || 'Kota'}, ${formattedDate}<br>
                            Guru Mata Pelajaran
                            <div style="height: 80px; display: flex; align-items: center; justify-content: center;">
                                ${profil?.linkTTDGuru ? 
                                    `<img src="${profil.linkTTDGuru}" style="max-height: 60px;" alt="TTD Guru">` : 
                                    ''
                                }
                            </div>
                            <u><strong>${profil?.namaGuru || '________________________'}</strong></u><br>
                            NIP. ${profil?.nipGuru || '________________________'}
                        </td>
                    </tr>
                </table>
            </div>
        `;
    },
    
    /**
     * Print document
     */
    print(htmlContent) {
        // Create print window
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak Dokumen - AGSA</title>
                <style>
                    ${this.getPrintStyles().replace(/@media print \{/, '').replace(/\}$/, '')}
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        margin: 2cm;
                    }
                    .rtl {
                        direction: rtl;
                        text-align: right;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
                <script>
                    window.onload = function() {
                        window.print();
                        // window.close();
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    },
    
    /**
     * Download as PDF (using browser print to PDF)
     */
    downloadPDF(htmlContent, filename) {
        // For now, use print dialog with PDF option
        // In production, can integrate with libraries like jsPDF or html2pdf
        this.print(htmlContent);
        
        // Show instruction
        if (typeof showToast === 'function') {
            showToast('Pilih "Save as PDF" pada dialog print untuk menyimpan sebagai PDF', 'info');
        }
    },
    
    /**
     * Preview document in modal
     */
    preview(htmlContent) {
        const modalContent = `
            <div class="p-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Preview Dokumen</h3>
                    <div class="space-x-2">
                        <button onclick="PrintService.print(document.getElementById('previewContent').innerHTML)" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Cetak
                        </button>
                        <button onclick="closeModal()" 
                            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Tutup
                        </button>
                    </div>
                </div>
                <div id="previewContent" class="bg-white border rounded-lg p-8 max-h-[70vh] overflow-auto" 
                    style="font-family: 'Times New Roman', Times, serif; font-size: 12pt;">
                    ${htmlContent}
                </div>
            </div>
        `;
        
        if (typeof showModal === 'function') {
            showModal(modalContent);
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    PrintService.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrintService;
}