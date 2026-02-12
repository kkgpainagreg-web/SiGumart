/**
 * =====================================================
 * ADMIN PAI SUPER APP - Generator Program Tahunan (Prota)
 * =====================================================
 * Generate Prota otomatis berdasarkan:
 * - CP PAI (Kepka BSKAP No. 046/H/KR/2025)
 * - Data Profil Guru
 * - Kalender Pendidikan
 * =====================================================
 */

// ==================== PROTA STATE ====================
let protaData = [];
let selectedProtaKelas = null;
let selectedProtaFase = null;

// ==================== PROTA CONTENT ====================

function getProtaContent() {
    const profil = getProfilData();
    const kelasDiajar = profil?.kelasDiajar || [];
    
    return `
        <div class="space-y-6">
            
            <!-- Alert jika profil belum lengkap -->
            ${!profil?.isProfileComplete ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-yellow-800">Lengkapi Profil Terlebih Dahulu</h4>
                            <p class="text-sm text-yellow-700 mt-1">
                                Untuk generate Prota, pastikan data profil Anda sudah lengkap (nama, sekolah, tahun ajaran, semester, dan kelas yang diajar).
                            </p>
                            <button onclick="navigateTo('profil')" class="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline">
                                Lengkapi Profil →
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Header -->
            <div class="bg-gradient-to-r from-pai-600 to-pai-700 rounded-2xl p-6 text-white">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">Generator Program Tahunan</h2>
                        <p class="text-pai-100">
                            Generate Prota otomatis berdasarkan CP PAI (Kepka BSKAP No. 046/H/KR/2025)
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-4 py-2 bg-white/20 rounded-xl text-sm">
                            <i class="fas fa-calendar-alt mr-2"></i>${profil?.tahunAjaran || 'Tahun Ajaran'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Pilih Kelas -->
            <div class="bg-white rounded-2xl shadow-sm p-6">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-users text-pai-600"></i>
                    Pilih Kelas untuk Generate Prota
                </h3>
                
                <div id="protaKelasGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    ${kelasDiajar.length > 0 ? kelasDiajar.map(kelas => {
                        const fase = getFaseByKelas(kelas);
                        const faseColors = {
                            'A': 'from-blue-500 to-blue-600',
                            'B': 'from-green-500 to-green-600',
                            'C': 'from-purple-500 to-purple-600'
                        };
                        return `
                            <button onclick="selectProtaKelas(${kelas})" 
                                class="prota-kelas-btn group relative p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-all border-2 border-transparent hover:border-pai-300"
                                data-kelas="${kelas}">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-gray-800 group-hover:text-pai-600 transition-colors">
                                        ${kelas}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Kelas ${kelas}</div>
                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r ${faseColors[fase]} text-white text-sm font-bold mt-3">
                                        ${fase}
                                    </span>
                                    <div class="text-xs text-gray-400 mt-1">Fase ${fase}</div>
                                </div>
                            </button>
                        `;
                    }).join('') : `
                        <div class="col-span-full text-center py-8 text-gray-500">
                            <i class="fas fa-info-circle text-2xl mb-2"></i>
                            <p>Belum ada kelas yang dipilih. Silakan lengkapi profil terlebih dahulu.</p>
                            <button onclick="navigateTo('profil')" class="mt-3 text-pai-600 hover:text-pai-700 font-medium">
                                Lengkapi Profil →
                            </button>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Prota Preview/Editor -->
            <div id="protaPreviewContainer" class="hidden">
                
                <!-- Prota Info Header -->
                <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-bold text-lg">
                                    Program Tahunan - Kelas <span id="protaKelasTitle">-</span>
                                </h3>
                                <p class="text-blue-100 text-sm">
                                    Fase <span id="protaFaseTitle">-</span> | PAI dan Budi Pekerti
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick="printProta()" 
                                    class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all flex items-center gap-2">
                                    <i class="fas fa-print"></i>
                                    <span class="hidden sm:inline">Cetak</span>
                                </button>
                                <button onclick="downloadProta()" 
                                    class="px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 rounded-xl transition-all flex items-center gap-2">
                                    <i class="fas fa-download"></i>
                                    <span class="hidden sm:inline">Download</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Info Dokumen -->
                    <div class="p-6 grid md:grid-cols-2 gap-6">
                        <div class="space-y-3">
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Satuan Pendidikan</span>
                                <span id="protaSekolah" class="font-medium text-gray-800">-</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Mata Pelajaran</span>
                                <span class="font-medium text-gray-800">PAI dan Budi Pekerti</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Kelas / Fase</span>
                                <span id="protaKelasInfo" class="font-medium text-gray-800">-</span>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Tahun Ajaran</span>
                                <span id="protaTahunAjaran" class="font-medium text-gray-800">-</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Guru Pengampu</span>
                                <span id="protaNamaGuru" class="font-medium text-gray-800">-</span>
                            </div>
                            <div class="flex justify-between py-2 border-b border-gray-100">
                                <span class="text-gray-500">Alokasi Waktu</span>
                                <span id="protaAlokasiWaktu" class="font-medium text-gray-800">-</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Prota Table -->
                <div class="mt-6 bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h4 class="font-bold text-gray-800">Rincian Program Tahunan</h4>
                        <button onclick="saveProta()" 
                            class="px-4 py-2 bg-pai-600 hover:bg-pai-700 text-white rounded-xl transition-all flex items-center gap-2">
                            <i class="fas fa-save"></i>
                            Simpan Prota
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[800px]">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-16">No</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Elemen/Materi</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tujuan Pembelajaran</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-20">JP</th>
                                    <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase w-32">Semester</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody id="protaTabelBody">
                                <!-- Content will be generated -->
                            </tbody>
                            <tfoot class="bg-gray-50 font-semibold">
                                <tr>
                                    <td colspan="3" class="px-4 py-3 text-right text-gray-700">Total Alokasi Waktu</td>
                                    <td id="protaTotalJP" class="px-4 py-3 text-center text-pai-600">0 JP</td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <!-- Semester Summary -->
                <div class="mt-6 grid md:grid-cols-2 gap-6">
                    
                    <!-- Semester 1 -->
                    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-white">
                            <h4 class="font-semibold">Semester 1 (Ganjil)</h4>
                        </div>
                        <div class="p-5">
                            <div id="protaSemester1Summary" class="space-y-3">
                                <!-- Will be generated -->
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                <span class="text-gray-600">Total JP Semester 1</span>
                                <span id="protaTotalSmt1" class="font-bold text-blue-600">0 JP</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Semester 2 -->
                    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div class="bg-gradient-to-r from-green-500 to-green-600 px-5 py-3 text-white">
                            <h4 class="font-semibold">Semester 2 (Genap)</h4>
                        </div>
                        <div class="p-5">
                            <div id="protaSemester2Summary" class="space-y-3">
                                <!-- Will be generated -->
                            </div>
                            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                <span class="text-gray-600">Total JP Semester 2</span>
                                <span id="protaTotalSmt2" class="font-bold text-green-600">0 JP</span>
                            </div>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Tanda Tangan -->
                <div class="mt-6 bg-white rounded-2xl shadow-sm p-6">
                    <div class="grid md:grid-cols-2 gap-8">
                        <div class="text-center">
                            <p class="text-gray-600 mb-2">Mengetahui,</p>
                            <p class="font-medium text-gray-800">Kepala Sekolah</p>
                            <div class="h-20 flex items-center justify-center">
                                <!-- Space for signature -->
                            </div>
                            <p id="protaNamaKepsek" class="font-medium text-gray-800 border-b border-gray-400 pb-1 inline-block min-w-48">
                                ........................
                            </p>
                            <p id="protaNIPKepsek" class="text-sm text-gray-500 mt-1">NIP. ........................</p>
                        </div>
                        
                        <div class="text-center">
                            <p id="protaTanggalTTD" class="text-gray-600 mb-2">............, ................. 2025</p>
                            <p class="font-medium text-gray-800">Guru Mata Pelajaran</p>
                            <div class="h-20 flex items-center justify-center">
                                <img id="protaTTDGuru" src="" class="max-h-16 hidden" alt="TTD">
                            </div>
                            <p id="protaNamaGuruTTD" class="font-medium text-gray-800 border-b border-gray-400 pb-1 inline-block min-w-48">
                                ........................
                            </p>
                            <p id="protaNIPGuru" class="text-sm text-gray-500 mt-1">NIP. ........................</p>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <!-- Saved Prota List -->
            <div class="bg-white rounded-2xl shadow-sm p-6">
                <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-folder-open text-pai-600"></i>
                    Prota Tersimpan
                </h3>
                
                <div id="savedProtaList" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Saved prota will be listed here -->
                    <div class="col-span-full text-center py-8 text-gray-400">
                        <i class="fas fa-file-alt text-3xl mb-2"></i>
                        <p>Belum ada Prota tersimpan</p>
                    </div>
                </div>
            </div>
            
        </div>
    `;
}

// ==================== PROTA FUNCTIONS ====================

/**
 * Initialize Prota Module
 */
async function initProta() {
    console.log('📊 Initializing Prota Module...');
    
    // Load saved prota
    await loadSavedProta();
}

/**
 * Select Kelas for Prota Generation
 */
function selectProtaKelas(kelas) {
    selectedProtaKelas = kelas;
    selectedProtaFase = getFaseByKelas(kelas);
    
    // Update UI - active class
    document.querySelectorAll('.prota-kelas-btn').forEach(btn => {
        btn.classList.remove('border-pai-500', 'bg-pai-50');
        btn.classList.add('border-transparent');
    });
    
    const activeBtn = document.querySelector(`.prota-kelas-btn[data-kelas="${kelas}"]`);
    if (activeBtn) {
        activeBtn.classList.add('border-pai-500', 'bg-pai-50');
        activeBtn.classList.remove('border-transparent');
    }
    
    // Show preview container
    document.getElementById('protaPreviewContainer')?.classList.remove('hidden');
    
    // Generate Prota
    generateProta(kelas);
}

/**
 * Generate Prota
 */
function generateProta(kelas) {
    const profil = getProfilData();
    const fase = getFaseByKelas(kelas);
    const cpData = getCPByFase(fase);
    
    if (!cpData) {
        showToast('error', 'Error', 'Data CP tidak ditemukan untuk fase ini');
        return;
    }
    
    // Update info header
    document.getElementById('protaKelasTitle').textContent = kelas;
    document.getElementById('protaFaseTitle').textContent = fase;
    document.getElementById('protaSekolah').textContent = profil?.namaSekolah || '-';
    document.getElementById('protaKelasInfo').textContent = `Kelas ${kelas} / Fase ${fase}`;
    document.getElementById('protaTahunAjaran').textContent = profil?.tahunAjaran || '-';
    document.getElementById('protaNamaGuru').textContent = profil?.namaLengkap || '-';
    
    // Calculate alokasi waktu
    const jpPerMinggu = profil?.jpMinggu || 4;
    const mingguEfektif = 36; // Per tahun
    const totalJP = jpPerMinggu * mingguEfektif;
    document.getElementById('protaAlokasiWaktu').textContent = `${totalJP} JP (${jpPerMinggu} JP/minggu × ${mingguEfektif} minggu)`;
    
    // Generate table content
    generateProtaTabel(cpData, totalJP);
    
    // Generate semester summary
    generateSemesterSummary(cpData);
    
    // Update TTD section
    updateProtaTTD(profil);
}

/**
 * Generate Prota Table Content
 */
function generateProtaTabel(cpData, totalJP) {
    const tbody = document.getElementById('protaTabelBody');
    if (!tbody) return;
    
    let html = '';
    let no = 1;
    let runningTotalJP = 0;
    
    // Iterate through each elemen
    Object.entries(cpData.elemen).forEach(([elemenName, elemenData]) => {
        const tpList = elemenData.tujuanPembelajaran;
        
        // Elemen header row
        html += `
            <tr class="bg-pai-50">
                <td colspan="6" class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-lg bg-pai-600 text-white flex items-center justify-center text-sm font-bold">
                            ${elemenData.kode}
                        </span>
                        <span class="font-semibold text-pai-700">${elemenName}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-2 ml-10">${elemenData.capaian}</p>
                </td>
            </tr>
        `;
        
        // TP rows
        tpList.forEach((tp, idx) => {
            const semester = idx < Math.ceil(tpList.length / 2) ? 1 : 2;
            runningTotalJP += tp.alokasi;
            
            html += `
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 text-center text-gray-600">${no}</td>
                    <td class="px-4 py-3">
                        <div class="text-sm font-medium text-gray-800">${tp.kode}</div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${tp.materi.map(m => `• ${m}`).join('<br>')}
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">${tp.tp}</td>
                    <td class="px-4 py-3 text-center">
                        <input type="number" value="${tp.alokasi}" min="1" max="20"
                            class="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-pai-500 focus:border-transparent outline-none"
                            data-tp="${tp.kode}" onchange="updateProtaJP(this)">
                    </td>
                    <td class="px-4 py-3 text-center">
                        <select class="px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pai-500 focus:border-transparent outline-none text-sm"
                            data-tp="${tp.kode}">
                            <option value="1" ${semester === 1 ? 'selected' : ''}>Semester 1</option>
                            <option value="2" ${semester === 2 ? 'selected' : ''}>Semester 2</option>
                        </select>
                    </td>
                    <td class="px-4 py-3">
                        <input type="text" placeholder="Keterangan..."
                            class="w-full px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pai-500 focus:border-transparent outline-none"
                            data-tp="${tp.kode}">
                    </td>
                </tr>
            `;
            no++;
        });
    });
    
    tbody.innerHTML = html;
    document.getElementById('protaTotalJP').textContent = `${runningTotalJP} JP`;
}

/**
 * Generate Semester Summary
 */
function generateSemesterSummary(cpData) {
    const container1 = document.getElementById('protaSemester1Summary');
    const container2 = document.getElementById('protaSemester2Summary');
    
    if (!container1 || !container2) return;
    
    let smt1HTML = '';
    let smt2HTML = '';
    let totalSmt1 = 0;
    let totalSmt2 = 0;
    
    Object.entries(cpData.elemen).forEach(([elemenName, elemenData]) => {
        const tpList = elemenData.tujuanPembelajaran;
        const halfLength = Math.ceil(tpList.length / 2);
        
        const smt1TP = tpList.slice(0, halfLength);
        const smt2TP = tpList.slice(halfLength);
        
        const smt1JP = smt1TP.reduce((sum, tp) => sum + tp.alokasi, 0);
        const smt2JP = smt2TP.reduce((sum, tp) => sum + tp.alokasi, 0);
        
        totalSmt1 += smt1JP;
        totalSmt2 += smt2JP;
        
        smt1HTML += `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span class="text-sm text-gray-600">${elemenName}</span>
                <span class="text-sm font-medium text-gray-800">${smt1JP} JP</span>
            </div>
        `;
        
        smt2HTML += `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span class="text-sm text-gray-600">${elemenName}</span>
                <span class="text-sm font-medium text-gray-800">${smt2JP} JP</span>
            </div>
        `;
    });
    
    container1.innerHTML = smt1HTML;
    container2.innerHTML = smt2HTML;
    document.getElementById('protaTotalSmt1').textContent = `${totalSmt1} JP`;
    document.getElementById('protaTotalSmt2').textContent = `${totalSmt2} JP`;
}

/**
 * Update Prota TTD Section
 */
function updateProtaTTD(profil) {
    if (!profil) return;
    
    // Kepala Sekolah
    const namaKepsek = document.getElementById('protaNamaKepsek');
    const nipKepsek = document.getElementById('protaNIPKepsek');
    
    if (profil.namaKepsek) {
        namaKepsek.textContent = profil.namaKepsek;
        nipKepsek.textContent = `NIP. ${profil.nipKepsek || '........................'}`;
    }
    
    // Guru
    const namaGuru = document.getElementById('protaNamaGuruTTD');
    const nipGuru = document.getElementById('protaNIPGuru');
    const ttdGuru = document.getElementById('protaTTDGuru');
    
    namaGuru.textContent = profil.namaLengkap || '........................';
    nipGuru.textContent = `NIP. ${profil.nip || '........................'}`;
    
    if (profil.tandaTangan) {
        ttdGuru.src = profil.tandaTangan;
        ttdGuru.classList.remove('hidden');
    }
    
    // Tanggal
    const tanggalTTD = document.getElementById('protaTanggalTTD');
    const kab = profil.kabupaten || '............';
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    tanggalTTD.textContent = `${kab}, ${today}`;
}

/**
 * Update Prota JP (when user changes JP input)
 */
function updateProtaJP(input) {
    // Recalculate total
    const allInputs = document.querySelectorAll('#protaTabelBody input[type="number"]');
    let total = 0;
    allInputs.forEach(inp => {
        total += parseInt(inp.value) || 0;
    });
    document.getElementById('protaTotalJP').textContent = `${total} JP`;
}

/**
 * Save Prota to Firestore
 */
async function saveProta() {
    if (!selectedProtaKelas) {
        showToast('error', 'Error', 'Pilih kelas terlebih dahulu');
        return;
    }
    
    const profil = getProfilData();
    
    // Collect data from form
    const protaItems = [];
    const rows = document.querySelectorAll('#protaTabelBody tr:not(.bg-pai-50)');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const jpInput = row.querySelector('input[type="number"]');
            const semesterSelect = row.querySelector('select');
            const keteranganInput = row.querySelector('input[type="text"]');
            
            if (jpInput) {
                protaItems.push({
                    kode: jpInput.dataset.tp,
                    jp: parseInt(jpInput.value) || 0,
                    semester: semesterSelect?.value || '1',
                    keterangan: keteranganInput?.value || ''
                });
            }
        }
    });
    
    const protaDoc = {
        kelas: selectedProtaKelas,
        fase: selectedProtaFase,
        tahunAjaran: profil?.tahunAjaran || '',
        namaSekolah: profil?.namaSekolah || '',
        namaGuru: profil?.namaLengkap || '',
        items: protaItems,
        totalJP: protaItems.reduce((sum, item) => sum + item.jp, 0),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    showLoading();
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('prota')
            .doc(`kelas-${selectedProtaKelas}`)
            .set(protaDoc);
        
        showToast('success', 'Berhasil!', `Prota Kelas ${selectedProtaKelas} berhasil disimpan`);
        
        // Reload saved prota
        await loadSavedProta();
        
    } catch (error) {
        console.error('Error saving prota:', error);
        showToast('error', 'Error', 'Gagal menyimpan Prota');
    } finally {
        hideLoading();
    }
}

/**
 * Load Saved Prota
 */
async function loadSavedProta() {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('prota')
            .orderBy('kelas')
            .get();
        
        protaData = [];
        snapshot.forEach(doc => {
            protaData.push({ id: doc.id, ...doc.data() });
        });
        
        renderSavedProtaList();
        
    } catch (error) {
        console.error('Error loading saved prota:', error);
    }
}

/**
 * Render Saved Prota List
 */
function renderSavedProtaList() {
    const container = document.getElementById('savedProtaList');
    if (!container) return;
    
    if (protaData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-400">
                <i class="fas fa-file-alt text-3xl mb-2"></i>
                <p>Belum ada Prota tersimpan</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = protaData.map(prota => {
        const faseColors = {
            'A': 'from-blue-500 to-blue-600',
            'B': 'from-green-500 to-green-600',
            'C': 'from-purple-500 to-purple-600'
        };
        
        const updatedAt = prota.updatedAt?.toDate?.() 
            ? prota.updatedAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';
        
        return `
            <div class="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
                onclick="selectProtaKelas(${prota.kelas})">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-r ${faseColors[prota.fase]} flex items-center justify-center text-white font-bold text-lg">
                            ${prota.kelas}
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">Prota Kelas ${prota.kelas}</h4>
                            <p class="text-sm text-gray-500">Fase ${prota.fase}</p>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); deleteProta('${prota.id}')" 
                        class="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                        title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                    <span class="text-gray-500">${prota.totalJP} JP</span>
                    <span class="text-gray-400">Update: ${updatedAt}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Delete Prota
 */
async function deleteProta(protaId) {
    if (!confirm('Yakin ingin menghapus Prota ini?')) return;
    
    showLoading();
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('prota')
            .doc(protaId)
            .delete();
        
        showToast('success', 'Berhasil', 'Prota berhasil dihapus');
        await loadSavedProta();
        
    } catch (error) {
        console.error('Error deleting prota:', error);
        showToast('error', 'Error', 'Gagal menghapus Prota');
    } finally {
        hideLoading();
    }
}

/**
 * Print Prota
 */
function printProta() {
    const profil = getProfilData();
    const fase = selectedProtaFase;
    const kelas = selectedProtaKelas;
    const cpData = getCPByFase(fase);
    
    const printContent = generatePrintableProta(profil, kelas, fase, cpData);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

/**
 * Generate Printable Prota HTML
 */
function generatePrintableProta(profil, kelas, fase, cpData) {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    let tableRows = '';
    let no = 1;
    let totalJP = 0;
    
    Object.entries(cpData.elemen).forEach(([elemenName, elemenData]) => {
        // Elemen header
        tableRows += `
            <tr style="background: #e8f5e9;">
                <td colspan="6" style="padding: 8px; font-weight: bold;">
                    <strong>${elemenData.kode} - ${elemenName}</strong><br>
                    <span style="font-weight: normal; font-size: 11px;">${elemenData.capaian}</span>
                </td>
            </tr>
        `;
        
        elemenData.tujuanPembelajaran.forEach((tp, idx) => {
            const semester = idx < Math.ceil(elemenData.tujuanPembelajaran.length / 2) ? 1 : 2;
            totalJP += tp.alokasi;
            
            tableRows += `
                <tr>
                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${no}</td>
                    <td style="padding: 6px; border: 1px solid #ddd; font-size: 11px;">
                        <strong>${tp.kode}</strong><br>
                        ${tp.materi.map(m => `• ${m}`).join('<br>')}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd; font-size: 11px;">${tp.tp}</td>
                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${tp.alokasi}</td>
                    <td style="padding: 6px; text-align: center; border: 1px solid #ddd;">${semester}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;"></td>
                </tr>
            `;
            no++;
        });
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Program Tahunan - Kelas ${kelas}</title>
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2cm; }
                h1 { text-align: center; font-size: 14pt; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #4caf50; color: white; padding: 8px; text-align: left; }
                td { padding: 6px; vertical-align: top; }
                .header-table td { border: none; padding: 4px 0; }
                .signature-table { margin-top: 40px; }
                .signature-table td { text-align: center; padding: 10px; border: none; }
                @media print {
                    body { margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <h1>PROGRAM TAHUNAN (PROTA)</h1>
            
            <table class="header-table">
                <tr>
                    <td width="150">Satuan Pendidikan</td>
                    <td width="10">:</td>
                    <td>${profil?.namaSekolah || '-'}</td>
                    <td width="120">Tahun Ajaran</td>
                    <td width="10">:</td>
                    <td>${profil?.tahunAjaran || '-'}</td>
                </tr>
                <tr>
                    <td>Mata Pelajaran</td>
                    <td>:</td>
                    <td>Pendidikan Agama Islam dan Budi Pekerti</td>
                    <td>Guru Pengampu</td>
                    <td>:</td>
                    <td>${profil?.namaLengkap || '-'}</td>
                </tr>
                <tr>
                    <td>Kelas / Fase</td>
                    <td>:</td>
                    <td>${kelas} / ${fase}</td>
                    <td>Alokasi Waktu</td>
                    <td>:</td>
                    <td>${totalJP} JP</td>
                </tr>
            </table>
            
            <table border="1" style="border: 1px solid #ddd;">
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="25%">Materi/Elemen</th>
                        <th width="35%">Tujuan Pembelajaran</th>
                        <th width="8%">JP</th>
                        <th width="10%">Smt</th>
                        <th width="17%">Ket</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
                <tfoot>
                    <tr style="background: #f5f5f5; font-weight: bold;">
                        <td colspan="3" style="text-align: right; padding: 8px;">Total</td>
                        <td style="text-align: center; padding: 8px;">${totalJP}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>
            
            <table class="signature-table" width="100%">
                <tr>
                    <td width="50%">
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <br><br><br>
                        <p><u><strong>${profil?.namaKepsek || '........................'}</strong></u></p>
                        <p>NIP. ${profil?.nipKepsek || '........................'}</p>
                    </td>
                    <td width="50%">
                        <p>${profil?.kabupaten || '............'}, ${today}</p>
                        <p>Guru Mata Pelajaran</p>
                        <br><br><br>
                        <p><u><strong>${profil?.namaLengkap || '........................'}</strong></u></p>
                        <p>NIP. ${profil?.nip || '........................'}</p>
                    </td>
                </tr>
            </table>
            
        </body>
        </html>
    `;
}

/**
 * Download Prota as HTML file
 */
function downloadProta() {
    const profil = getProfilData();
    const fase = selectedProtaFase;
    const kelas = selectedProtaKelas;
    const cpData = getCPByFase(fase);
    
    const content = generatePrintableProta(profil, kelas, fase, cpData);
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prota_PAI_Kelas${kelas}_Fase${fase}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Berhasil', 'Prota berhasil didownload');
}

console.log('📊 Prota module loaded');