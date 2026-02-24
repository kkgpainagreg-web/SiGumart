/**
 * PRINT SERVICE
 * Handles document generation and printing
 */

const PrintService = {
    /**
     * Print ATP Document
     */
    async printATP(atpData, profile) {
        const html = this.generateATPHTML(atpData, profile);
        this.openPrintWindow(html, 'ATP');
    },

    generateATPHTML(atp, profile) {
        const tahunAjar = profile?.tahunAjar || '-';
        const namaSekolah = profile?.namaSatuan || '-';
        const namaGuru = profile?.namaGuru || '-';
        const nipGuru = profile?.nipGuru || '-';

        let itemsHTML = '';
        let no = 1;

        (atp.items || []).forEach(item => {
            itemsHTML += `
                <tr>
                    <td class="border px-2 py-1 text-center">${no++}</td>
                    <td class="border px-2 py-1 text-center">${item.semester}</td>
                    <td class="border px-2 py-1">${item.elemen}</td>
                    <td class="border px-2 py-1">${item.cp}</td>
                    <td class="border px-2 py-1">${item.tp}</td>
                    <td class="border px-2 py-1 text-center">${item.jpPerTP}</td>
                    <td class="border px-2 py-1 text-xs">${item.dimensi}</td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>ATP - ${atp.mapel} - ${atp.kelas}</title>
                <style>
                    ${this.getCommonStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'ALUR TUJUAN PEMBELAJARAN (ATP)')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${atp.mapel}</strong></td>
                            <td width="150">Tahun Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${tahunAjar}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas / Fase</td>
                            <td>:</td>
                            <td><strong>${atp.kelas} / ${atp.fase}</strong></td>
                            <td>Nama Guru</td>
                            <td>:</td>
                            <td><strong>${namaGuru}</strong></td>
                        </tr>
                    </table>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="30">No</th>
                                <th width="40">Sem</th>
                                <th width="100">Elemen</th>
                                <th>Capaian Pembelajaran</th>
                                <th>Tujuan Pembelajaran</th>
                                <th width="40">JP</th>
                                <th width="100">Dimensi P5</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>

                    ${this.generateSignature(profile)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Print Prota Document
     */
    async printProta(protaData, profile) {
        const html = this.generateProtaHTML(protaData, profile);
        this.openPrintWindow(html, 'Prota');
    },

    generateProtaHTML(prota, profile) {
        let sem1HTML = '';
        let sem2HTML = '';

        (prota.distribusi || []).forEach(item => {
            const row = `
                <tr>
                    <td class="border px-2 py-1">${item.bulan}</td>
                    <td class="border px-2 py-1 text-center">${item.mingguKe}</td>
                    <td class="border px-2 py-1 text-center">${item.jp}</td>
                    <td class="border px-2 py-1">${item.materi}</td>
                    <td class="border px-2 py-1">${item.keterangan}</td>
                </tr>
            `;

            if (item.semester === 1) {
                sem1HTML += row;
            } else {
                sem2HTML += row;
            }
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prota - ${prota.mapel} - ${prota.kelas}</title>
                <style>
                    ${this.getCommonStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'PROGRAM TAHUNAN (PROTA)')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${prota.mapel}</strong></td>
                            <td width="150">Tahun Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${prota.tahunAjar}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas</td>
                            <td>:</td>
                            <td><strong>${prota.kelas}</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </table>

                    <h3 style="margin-top: 20px;">SEMESTER GANJIL</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="80">Bulan</th>
                                <th width="60">Minggu</th>
                                <th width="50">JP</th>
                                <th>Materi/TP</th>
                                <th width="100">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sem1HTML}
                        </tbody>
                    </table>

                    <h3 style="margin-top: 20px;">SEMESTER GENAP</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="80">Bulan</th>
                                <th width="60">Minggu</th>
                                <th width="50">JP</th>
                                <th>Materi/TP</th>
                                <th width="100">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sem2HTML}
                        </tbody>
                    </table>

                    ${this.generateSignature(profile)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Print Promes Document
     */
    async printPromes(promesData, profile) {
        const html = this.generatePromesHTML(promesData, profile);
        this.openPrintWindow(html, 'Promes');
    },

    generatePromesHTML(promes, profile) {
        let rowsHTML = '';

        (promes.detailMingguan || []).forEach(week => {
            rowsHTML += `
                <tr>
                    <td class="border px-2 py-1 text-center">${week.mingguKe}</td>
                    <td class="border px-2 py-1">${week.tanggalMulai} s/d ${week.tanggalSelesai}</td>
                    <td class="border px-2 py-1 text-center">${week.hariEfektif}</td>
                    <td class="border px-2 py-1 text-center">${week.jpMingguIni}</td>
                    <td class="border px-2 py-1">${week.materi}</td>
                    <td class="border px-2 py-1">${week.kegiatan}</td>
                    <td class="border px-2 py-1">${week.keterangan}</td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Promes - ${promes.mapel} - ${promes.kelas}</title>
                <style>
                    ${this.getCommonStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'PROGRAM SEMESTER (PROMES)')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${promes.mapel}</strong></td>
                            <td width="150">Semester</td>
                            <td width="10">:</td>
                            <td><strong>${promes.semester === 1 ? 'Ganjil' : 'Genap'}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas</td>
                            <td>:</td>
                            <td><strong>${promes.kelas}</strong></td>
                            <td>Minggu Efektif</td>
                            <td>:</td>
                            <td><strong>${promes.mingguEfektif} minggu</strong></td>
                        </tr>
                        <tr>
                            <td>Tahun Pelajaran</td>
                            <td>:</td>
                            <td><strong>${promes.tahunAjar}</strong></td>
                            <td>Total JP</td>
                            <td>:</td>
                            <td><strong>${promes.rekapJP?.total || 0} JP</strong></td>
                        </tr>
                    </table>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="50">Minggu</th>
                                <th width="150">Tanggal</th>
                                <th width="60">Hari Efektif</th>
                                <th width="40">JP</th>
                                <th>Materi/TP</th>
                                <th width="100">Kegiatan</th>
                                <th width="80">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    ${this.generateSignature(profile)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Print Jurnal Document
     */
    async printJurnal(jurnalData, profile) {
        const html = this.generateJurnalHTML(jurnalData, profile);
        this.openPrintWindow(html, 'Jurnal');
    },

    generateJurnalHTML(jurnal, profile) {
        let rowsHTML = '';
        let no = 1;

        (jurnal.entries || []).forEach(entry => {
            const kehadiran = entry.kehadiran || {};
            rowsHTML += `
                <tr>
                    <td class="border px-2 py-1 text-center">${no++}</td>
                    <td class="border px-2 py-1">${entry.hari}, ${entry.tanggal}</td>
                    <td class="border px-2 py-1 text-center">${entry.jamKe}</td>
                    <td class="border px-2 py-1">${entry.materi}</td>
                    <td class="border px-2 py-1">${entry.elemen}</td>
                    <td class="border px-2 py-1">${entry.tp}</td>
                    <td class="border px-2 py-1 text-center text-xs">
                        H:${kehadiran.hadir || 0} S:${kehadiran.sakit || 0} I:${kehadiran.izin || 0} A:${kehadiran.alpha || 0}
                    </td>
                    <td class="border px-2 py-1">${entry.hasil}</td>
                    <td class="border px-2 py-1">${entry.keterangan}</td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Jurnal - ${jurnal.mapel} - ${jurnal.kelas}</title>
                <style>
                    ${this.getCommonStyles()}
                    @page { size: landscape; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'JURNAL PEMBELAJARAN')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${jurnal.mapel}</strong></td>
                            <td width="150">Semester</td>
                            <td width="10">:</td>
                            <td><strong>${jurnal.semester === 1 ? 'Ganjil' : 'Genap'}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas / Fase</td>
                            <td>:</td>
                            <td><strong>${jurnal.kelas} / ${jurnal.fase}</strong></td>
                            <td>Tahun Pelajaran</td>
                            <td>:</td>
                            <td><strong>${jurnal.tahunAjar}</strong></td>
                        </tr>
                    </table>

                    <table class="data-table" style="font-size: 10px;">
                        <thead>
                            <tr>
                                <th width="30">No</th>
                                <th width="100">Hari/Tanggal</th>
                                <th width="50">Jam</th>
                                <th>Materi</th>
                                <th width="80">Elemen</th>
                                <th>TP</th>
                                <th width="80">Kehadiran</th>
                                <th width="80">Hasil</th>
                                <th width="60">Ket</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    ${this.generateSignature(profile, true)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Print Modul Ajar Document
     */
    async printModulAjar(modulData, profile) {
        const html = this.generateModulAjarHTML(modulData, profile);
        this.openPrintWindow(html, 'Modul Ajar');
    },

    generateModulAjarHTML(modul, profile) {
        const kegiatan = modul.kegiatanPembelajaran || {};

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Modul Ajar - ${modul.mapel} - Pertemuan ${modul.pertemuanKe}</title>
                <style>
                    ${this.getCommonStyles()}
                    .section { margin-bottom: 15px; }
                    .section-title { font-weight: bold; background: #f3f4f6; padding: 5px 10px; margin-bottom: 5px; }
                    .section-content { padding: 5px 10px; }
                    .rtl { direction: rtl; text-align: right; font-family: 'Amiri', serif; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'MODUL AJAR')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${modul.mapel}</strong></td>
                            <td width="150">Pertemuan Ke</td>
                            <td width="10">:</td>
                            <td><strong>${modul.pertemuanKe}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas</td>
                            <td>:</td>
                            <td><strong>${modul.kelas}</strong></td>
                            <td>Alokasi Waktu</td>
                            <td>:</td>
                            <td><strong>${modul.aloksiWaktu}</strong></td>
                        </tr>
                        <tr>
                            <td>Semester</td>
                            <td>:</td>
                            <td><strong>${modul.semester === 1 ? 'Ganjil' : 'Genap'}</strong></td>
                            <td>Tanggal</td>
                            <td>:</td>
                            <td><strong>${modul.tanggal}</strong></td>
                        </tr>
                    </table>

                    <div class="section">
                        <div class="section-title">A. TUJUAN PEMBELAJARAN</div>
                        <div class="section-content">${modul.tujuanPembelajaran}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">B. ELEMEN / CAPAIAN PEMBELAJARAN</div>
                        <div class="section-content">${modul.elemen}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">C. DIMENSI PROFIL PELAJAR PANCASILA</div>
                        <div class="section-content">${modul.dimensiProfil || '-'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">D. PERTANYAAN PEMANTIK</div>
                        <div class="section-content">${modul.pertanyaanPemantik || '-'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">E. KEGIATAN PEMBELAJARAN</div>
                        <div class="section-content">
                            <p><strong>1. Pendahuluan</strong></p>
                            <p style="white-space: pre-line;">${kegiatan.pendahuluan || '-'}</p>
                            
                            <p><strong>2. Kegiatan Inti</strong></p>
                            <p style="white-space: pre-line;">${kegiatan.inti || '-'}</p>
                            
                            <p><strong>3. Penutup</strong></p>
                            <p style="white-space: pre-line;">${kegiatan.penutup || '-'}</p>
                        </div>
                    </div>

                    ${modul.kontenArab ? `
                        <div class="section">
                            <div class="section-title">F. MATERI BAHASA ARAB</div>
                            <div class="section-content rtl">${modul.kontenArab}</div>
                        </div>
                    ` : ''}

                    <div class="section">
                        <div class="section-title">G. ASESMEN</div>
                        <div class="section-content">${modul.asesmen || '-'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">H. SUMBER BELAJAR</div>
                        <div class="section-content">${modul.sumberBelajar || '-'}</div>
                    </div>

                    ${this.generateSignature(profile)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Print Daftar Nilai Document
     */
    async printNilai(nilaiData, students, profile) {
        const html = this.generateNilaiHTML(nilaiData, students, profile);
        this.openPrintWindow(html, 'Daftar Nilai');
    },

    generateNilaiHTML(nilai, students, profile) {
        const komponen = nilai.komponenNilai || {};
        const sumatifHeaders = (komponen.sumatif || []).map((s, i) => 
            `<th class="border px-2 py-1 text-center">${s.label || `S${i+1}`}</th>`
        ).join('');

        let rowsHTML = '';
        (nilai.dataNilai || []).forEach((data, index) => {
            const sumatifCells = (data.sumatif || []).map(n => 
                `<td class="border px-2 py-1 text-center">${n}</td>`
            ).join('');

            rowsHTML += `
                <tr>
                    <td class="border px-2 py-1 text-center">${index + 1}</td>
                    <td class="border px-2 py-1">${data.nisn}</td>
                    <td class="border px-2 py-1">${data.nama}</td>
                    ${sumatifCells}
                    <td class="border px-2 py-1 text-center">${data.ats || '-'}</td>
                    <td class="border px-2 py-1 text-center">${data.asas || '-'}</td>
                    <td class="border px-2 py-1 text-center font-bold">${data.nilaiRapor || '-'}</td>
                    <td class="border px-2 py-1 text-center">${data.predikat || '-'}</td>
                </tr>
            `;
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daftar Nilai - ${nilai.mapel} - ${nilai.kelas}</title>
                <style>
                    ${this.getCommonStyles()}
                    @page { size: landscape; }
                </style>
            </head>
            <body>
                <div class="container">
                    ${this.generateHeader(profile, 'DAFTAR NILAI')}
                    
                    <table class="info-table">
                        <tr>
                            <td width="150">Mata Pelajaran</td>
                            <td width="10">:</td>
                            <td><strong>${nilai.mapel}</strong></td>
                            <td width="150">Semester</td>
                            <td width="10">:</td>
                            <td><strong>${nilai.semester === 1 ? 'Ganjil' : 'Genap'}</strong></td>
                        </tr>
                        <tr>
                            <td>Kelas</td>
                            <td>:</td>
                            <td><strong>${nilai.kelas}</strong></td>
                            <td>Tahun Pelajaran</td>
                            <td>:</td>
                            <td><strong>${nilai.tahunAjar}</strong></td>
                        </tr>
                    </table>

                    <table class="data-table">
                        <thead>
                            <tr>
                                <th rowspan="2" class="border px-2 py-1">No</th>
                                <th rowspan="2" class="border px-2 py-1">NISN</th>
                                <th rowspan="2" class="border px-2 py-1">Nama Siswa</th>
                                <th colspan="${(komponen.sumatif || []).length}" class="border px-2 py-1">Sumatif</th>
                                <th rowspan="2" class="border px-2 py-1">ATS</th>
                                <th rowspan="2" class="border px-2 py-1">ASAS</th>
                                <th rowspan="2" class="border px-2 py-1 bg-yellow-100">NR</th>
                                <th rowspan="2" class="border px-2 py-1 bg-yellow-100">Predikat</th>
                            </tr>
                            <tr>
                                ${sumatifHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>

                    ${this.generateSignature(profile)}
                </div>
            </body>
            </html>
        `;
    },

    /**
     * Generate document header with school info and logo
     */
    generateHeader(profile, title) {
        const logoUrl = profile?.linkLogo || '';
        const namaSekolah = profile?.namaSatuan || 'NAMA SEKOLAH';
        const alamat = profile?.alamat || '';
        const kabupaten = profile?.kabupaten || '';
        const provinsi = profile?.provinsi || '';
        const npsn = profile?.npsn || '';

        return `
            <div class="header">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 80px; vertical-align: middle;">
                            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width: 70px; height: auto;">` : ''}
                        </td>
                        <td style="text-align: center; vertical-align: middle;">
                            <h2 style="margin: 0; font-size: 16px;">${namaSekolah.toUpperCase()}</h2>
                            <p style="margin: 2px 0; font-size: 11px;">${alamat}</p>
                            <p style="margin: 2px 0; font-size: 11px;">${kabupaten} - ${provinsi} | NPSN: ${npsn}</p>
                        </td>
                        <td style="width: 80px;"></td>
                    </tr>
                </table>
                <hr style="border: 1px solid #000; margin: 10px 0;">
                <h3 style="text-align: center; margin: 10px 0;">${title}</h3>
            </div>
        `;
    },

    /**
     * Generate signature section
     */
    generateSignature(profile, includeGuru = true) {
        const tanggal = profile?.tanggalPengesahan 
            ? new Date(profile.tanggalPengesahan).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            })
            : new Date().toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            });
        
        const kabupaten = profile?.kabupaten || '..................';
        const namaKepsek = profile?.namaKepalaSekolah || '................................';
        const nipKepsek = profile?.nipKepalaSekolah || '................................';
        const namaGuru = profile?.namaGuru || '................................';
        const nipGuru = profile?.nipGuru || '................................';
        const ttdKepsek = profile?.linkTTDKepsek || '';
        const ttdGuru = profile?.linkTTDGuru || '';

        return `
            <div class="signature" style="margin-top: 30px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; text-align: center;">
                            Mengetahui,<br>
                            Kepala Sekolah
                            <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
                                ${ttdKepsek ? `<img src="${ttdKepsek}" alt="TTD" style="max-height: 50px;">` : ''}
                            </div>
                            <u><strong>${namaKepsek}</strong></u><br>
                            NIP. ${nipKepsek}
                        </td>
                        ${includeGuru ? `
                            <td style="width: 50%; text-align: center;">
                                ${kabupaten}, ${tanggal}<br>
                                Guru Mata Pelajaran
                                <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
                                    ${ttdGuru ? `<img src="${ttdGuru}" alt="TTD" style="max-height: 50px;">` : ''}
                                </div>
                                <u><strong>${namaGuru}</strong></u><br>
                                NIP. ${nipGuru}
                            </td>
                        ` : ''}
                    </tr>
                </table>
            </div>
        `;
    },

    /**
     * Common print styles
     */
    getCommonStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12px;
                line-height: 1.4;
                padding: 20px;
            }
            .container {
                max-width: 210mm;
                margin: 0 auto;
            }
            .info-table {
                width: 100%;
                margin-bottom: 15px;
            }
            .info-table td {
                padding: 3px 0;
                vertical-align: top;
            }
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .data-table th, .data-table td {
                border: 1px solid #000;
                padding: 5px 8px;
                text-align: left;
                vertical-align: top;
            }
            .data-table th {
                background: #f3f4f6;
                font-weight: bold;
                text-align: center;
            }
            .text-center { text-align: center; }
            .text-xs { font-size: 10px; }
            .font-bold { font-weight: bold; }
            .bg-yellow-100 { background: #fef3c7; }
            @media print {
                body { padding: 0; }
                .container { max-width: 100%; }
            }
        `;
    },

    /**
     * Open print window
     */
    openPrintWindow(html, title) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images to load, then print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    }
};

// Export for use in main app
window.PrintService = PrintService;