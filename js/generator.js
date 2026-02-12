// ============================================
// GENERATOR DOKUMEN MODULE
// Admin PAI Super App
// Single Input - Multi Output
// ATP, Prota, Promes, Modul Ajar
// ============================================

// === STATE ===
let userData = null;
let generatedDoc = null;
let savedDocs = [];

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeGeneratorPage();
});

// === INITIALIZE PAGE ===
async function initializeGeneratorPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userData = await getCurrentUserData();
            updateSidebarInfo();
            loadSavedDocuments();
            setupJPCalculation();
            
            // Check URL params
            const urlParams = new URLSearchParams(window.location.search);
            const type = urlParams.get('type');
            if (type) {
                showGeneratorForm(type);
            }
        }
    });
}

// === UPDATE SIDEBAR INFO ===
function updateSidebarInfo() {
    if (userData) {
        const name = userData.displayName || 'Guru PAI';
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = userData.email;
        document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
    }
}

// === SETUP JP CALCULATION ===
function setupJPCalculation() {
    const jpMinggu = document.getElementById('docJPMinggu');
    const mingguEfektif = document.getElementById('docMingguEfektif');
    
    const calculate = () => {
        const jp = parseInt(jpMinggu.value) || 4;
        const minggu = parseInt(mingguEfektif.value) || 18;
        document.getElementById('docTotalJP').value = jp * minggu;
    };
    
    jpMinggu.addEventListener('input', calculate);
    mingguEfektif.addEventListener('input', calculate);
}

// === SHOW GENERATOR FORM ===
function showGeneratorForm(type) {
    document.getElementById('docType').value = type;
    onDocTypeChange();
    
    // Scroll to form
    document.getElementById('generatorFormContainer').scrollIntoView({ behavior: 'smooth' });
}

// === ON DOC TYPE CHANGE ===
function onDocTypeChange() {
    const docType = document.getElementById('docType').value;
    const step2 = document.getElementById('step2Modul');
    const step3 = document.getElementById('step3Waktu');
    const dimensiPreview = document.getElementById('dimensiPreview');
    
    // Update title
    const titles = {
        'atp': '📋 Generator ATP (Alur Tujuan Pembelajaran)',
        'prota': '📅 Generator PROTA (Program Tahunan)',
        'promes': '📆 Generator PROMES (Program Semester)',
        'modul': '📖 Generator Modul Ajar'
    };
    document.getElementById('formTitle').textContent = titles[docType] || '⚡ Pilih Jenis Dokumen';
    
    // Show/hide steps based on doc type
    if (docType === 'modul') {
        step2.classList.remove('hidden');
        dimensiPreview.classList.remove('hidden');
    } else {
        step2.classList.add('hidden');
        dimensiPreview.classList.add('hidden');
    }
    
    if (docType === 'prota' || docType === 'promes') {
        step3.classList.remove('hidden');
    } else {
        step3.classList.add('hidden');
    }
}

// === ON KELAS CHANGE ===
function onKelasChange() {
    const kelas = document.getElementById('docKelas').value;
    if (!kelas) return;
    
    const fase = getFaseByKelas(kelas);
    loadDimensiPreview(fase);
}

// === LOAD CAPAIAN OPTIONS ===
function loadCapaianOptions() {
    const kelas = document.getElementById('docKelas').value;
    const elemen = document.getElementById('docElemen').value;
    const capaianSelect = document.getElementById('docCapaian');
    
    if (!kelas || !elemen) {
        capaianSelect.innerHTML = '<option value="">Pilih CP</option>';
        return;
    }
    
    const fase = getFaseByKelas(kelas);
    const cpData = getElemenCP(fase, elemen);
    
    if (cpData && cpData.capaian) {
        const options = cpData.capaian.map(cp => 
            `<option value="${cp.kode}">${cp.kode}: ${cp.teks.substring(0, 50)}...</option>`
        ).join('');
        
        capaianSelect.innerHTML = '<option value="">Pilih CP</option>' + options;
    }
    
    // Update dimensi preview
    loadDimensiPreview(fase, elemen);
}

// === LOAD DIMENSI PREVIEW ===
function loadDimensiPreview(fase, elemen = null) {
    const container = document.getElementById('dimensiList');
    const dimensiPreview = document.getElementById('dimensiPreview');
    
    let dimensiTerkait = [];
    
    if (elemen) {
        const cpData = getElemenCP(fase, elemen);
        if (cpData && cpData.dimensiTerkait) {
            dimensiTerkait = cpData.dimensiTerkait.map(id => getDimensiById(id)).filter(Boolean);
        }
    } else {
        // Show all dimensi for ATP/Prota/Promes
        dimensiTerkait = getDimensiLulusan();
    }
    
    if (dimensiTerkait.length > 0) {
        container.innerHTML = dimensiTerkait.map(d => `
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                <span>${d.icon}</span>
                <span>${d.nama}</span>
            </span>
        `).join('');
        dimensiPreview.classList.remove('hidden');
    }
}

// === RESET GENERATOR ===
function resetGenerator() {
    document.getElementById('generatorForm').reset();
    document.getElementById('step2Modul').classList.add('hidden');
    document.getElementById('step3Waktu').classList.add('hidden');
    document.getElementById('dimensiPreview').classList.add('hidden');
    document.getElementById('documentPreview').classList.add('hidden');
    document.getElementById('formTitle').textContent = '⚡ Pilih Jenis Dokumen';
    generatedDoc = null;
}

// === GENERATE DOCUMENT ===
async function generateDocument() {
    const docType = document.getElementById('docType').value;
    const kelas = document.getElementById('docKelas').value;
    const semester = document.getElementById('docSemester').value;
    const tahun = document.getElementById('docTahun').value;
    
    if (!docType || !kelas) {
        showToast('Pilih jenis dokumen dan kelas!', 'error');
        return;
    }
    
    // Validate profile data
    if (!userData?.school?.name || !userData?.displayName) {
        showToast('Lengkapi profil sekolah dan guru terlebih dahulu!', 'warning');
        setTimeout(() => {
            window.location.href = 'profil.html';
        }, 2000);
        return;
    }
    
    const fase = getFaseByKelas(kelas);
    const cpData = getCPByFase(fase);
    
    let documentHTML = '';
    
    switch (docType) {
        case 'atp':
            documentHTML = generateATP(kelas, fase, semester, tahun, cpData);
            break;
        case 'prota':
            documentHTML = generateProta(kelas, fase, tahun, cpData);
            break;
        case 'promes':
            documentHTML = generatePromes(kelas, fase, semester, tahun, cpData);
            break;
        case 'modul':
            documentHTML = generateModulAjar(kelas, fase, semester, tahun, cpData);
            break;
    }
    
    // Store generated document data
    generatedDoc = {
        type: docType,
        kelas,
        fase,
        semester,
        tahun,
        html: documentHTML,
        createdAt: new Date().toISOString()
    };
    
    // Show preview
    document.getElementById('documentContent').innerHTML = documentHTML;
    document.getElementById('documentPreview').classList.remove('hidden');
    
    // Scroll to preview
    document.getElementById('documentPreview').scrollIntoView({ behavior: 'smooth' });
    
    showToast('Dokumen berhasil di-generate!', 'success');
}

// === GENERATE ATP ===
function generateATP(kelas, fase, semester, tahun, cpData) {
    const school = userData?.school || {};
    const teacher = userData?.displayName || 'Guru PAI';
    const principal = userData?.principal || {};
    const dimensiLulusan = getDimensiLulusan();
    
    let atpRows = '';
    let no = 1;
    
    // Generate rows from CP
    for (const [elemenKey, elemenData] of Object.entries(cpData.capaianPembelajaran)) {
        elemenData.capaian.forEach(cp => {
            const tujuanPembelajaran = cp.indikator.map((ind, idx) => 
                `${no}.${idx + 1} ${ind}`
            ).join('<br>');
            
            const dimensiTerkait = elemenData.dimensiTerkait?.map(id => {
                const d = getDimensiById(id);
                return d ? `${d.icon} ${d.nama}` : '';
            }).filter(Boolean).join(', ') || '-';
            
            atpRows += `
                <tr>
                    <td class="text-center align-top">${no}</td>
                    <td class="align-top">${elemenData.elemen}</td>
                    <td class="align-top">${cp.teks}</td>
                    <td class="align-top text-sm">${tujuanPembelajaran}</td>
                    <td class="align-top text-sm">${dimensiTerkait}</td>
                    <td class="text-center align-top">${Math.ceil(cpData.alokasiWaktu.totalJPPerSemester / (no + 2))} JP</td>
                </tr>
            `;
            no++;
        });
    }
    
    return `
        <div class="p-8 bg-white">
            <!-- Header -->
            <div class="text-center mb-6">
                <h1 class="text-xl font-bold uppercase">ALUR TUJUAN PEMBELAJARAN (ATP)</h1>
                <h2 class="text-lg font-semibold">PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
                <p class="text-gray-600">Tahun Pelajaran ${tahun}</p>
            </div>
            
            <!-- Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Satuan Pendidikan</td><td>: ${school.name || '-'}</td></tr>
                        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam dan Budi Pekerti</td></tr>
                        <tr><td>Fase / Kelas</td><td>: Fase ${fase} / Kelas ${kelas}</td></tr>
                    </table>
                </div>
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Tahun Pelajaran</td><td>: ${tahun}</td></tr>
                        <tr><td>Semester</td><td>: ${semester == 1 ? 'Ganjil' : 'Genap'}</td></tr>
                        <tr><td>Guru Pengampu</td><td>: ${teacher}</td></tr>
                    </table>
                </div>
            </div>
            
            <!-- 8 Dimensi Lulusan -->
            <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 class="font-semibold mb-2">8 Dimensi Lulusan:</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    ${dimensiLulusan.map(d => `
                        <div class="flex items-center gap-1">
                            <span>${d.icon}</span>
                            <span>${d.nama}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Tabel ATP -->
            <table class="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr class="bg-pai-green text-white">
                        <th class="border border-gray-400 p-2 w-10">No</th>
                        <th class="border border-gray-400 p-2 w-32">Elemen</th>
                        <th class="border border-gray-400 p-2">Capaian Pembelajaran</th>
                        <th class="border border-gray-400 p-2">Tujuan Pembelajaran</th>
                        <th class="border border-gray-400 p-2 w-40">Dimensi Lulusan</th>
                        <th class="border border-gray-400 p-2 w-20">Alokasi Waktu</th>
                    </tr>
                </thead>
                <tbody>
                    ${atpRows}
                </tbody>
            </table>
            
            <!-- Tanda Tangan -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala ${school.name || 'Sekolah'}</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${principal.name || '................................'}</p>
                    <p>NIP. ${principal.nip || '................................'}</p>
                </div>
                <div>
                    <p>${school.kabupaten || '................'}, ........................ ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${teacher}</p>
                    <p>NIP. ${userData?.profile?.nip || '................................'}</p>
                </div>
            </div>
        </div>
    `;
}

// === GENERATE PROTA ===
function generateProta(kelas, fase, tahun, cpData) {
    const school = userData?.school || {};
    const teacher = userData?.displayName || 'Guru PAI';
    const principal = userData?.principal || {};
    
    const jpMinggu = parseInt(document.getElementById('docJPMinggu').value) || 4;
    const mingguEfektif = parseInt(document.getElementById('docMingguEfektif').value) || 18;
    
    let protaRows = '';
    let no = 1;
    
    // Semester 1
    protaRows += `
        <tr class="bg-green-100">
            <td colspan="5" class="border border-gray-400 p-2 font-bold">SEMESTER 1 (GANJIL)</td>
        </tr>
    `;
    
    for (const [elemenKey, elemenData] of Object.entries(cpData.capaianPembelajaran)) {
        const jpPerElemen = Math.floor((mingguEfektif * jpMinggu) / 5);
        
        protaRows += `
            <tr>
                <td class="border border-gray-400 p-2 text-center">${no}</td>
                <td class="border border-gray-400 p-2">${elemenData.elemen}</td>
                <td class="border border-gray-400 p-2 text-sm">${elemenData.deskripsi}</td>
                <td class="border border-gray-400 p-2 text-center">${jpPerElemen}</td>
                <td class="border border-gray-400 p-2 text-center">Jul-Des</td>
            </tr>
        `;
        no++;
    }
    
    protaRows += `
        <tr class="bg-gray-200">
            <td colspan="3" class="border border-gray-400 p-2 font-bold text-right">Jumlah JP Semester 1</td>
            <td class="border border-gray-400 p-2 text-center font-bold">${mingguEfektif * jpMinggu}</td>
            <td class="border border-gray-400 p-2"></td>
        </tr>
    `;
    
    // Semester 2
    no = 1;
    protaRows += `
        <tr class="bg-blue-100">
            <td colspan="5" class="border border-gray-400 p-2 font-bold">SEMESTER 2 (GENAP)</td>
        </tr>
    `;
    
    for (const [elemenKey, elemenData] of Object.entries(cpData.capaianPembelajaran)) {
        const jpPerElemen = Math.floor((mingguEfektif * jpMinggu) / 5);
        
        protaRows += `
            <tr>
                <td class="border border-gray-400 p-2 text-center">${no}</td>
                <td class="border border-gray-400 p-2">${elemenData.elemen}</td>
                <td class="border border-gray-400 p-2 text-sm">${elemenData.deskripsi}</td>
                <td class="border border-gray-400 p-2 text-center">${jpPerElemen}</td>
                <td class="border border-gray-400 p-2 text-center">Jan-Jun</td>
            </tr>
        `;
        no++;
    }
    
    protaRows += `
        <tr class="bg-gray-200">
            <td colspan="3" class="border border-gray-400 p-2 font-bold text-right">Jumlah JP Semester 2</td>
            <td class="border border-gray-400 p-2 text-center font-bold">${mingguEfektif * jpMinggu}</td>
            <td class="border border-gray-400 p-2"></td>
        </tr>
        <tr class="bg-pai-green text-white">
            <td colspan="3" class="border border-gray-400 p-2 font-bold text-right">TOTAL JP 1 TAHUN</td>
            <td class="border border-gray-400 p-2 text-center font-bold">${mingguEfektif * jpMinggu * 2}</td>
            <td class="border border-gray-400 p-2"></td>
        </tr>
    `;
    
    return `
        <div class="p-8 bg-white">
            <!-- Header -->
            <div class="text-center mb-6">
                <h1 class="text-xl font-bold uppercase">PROGRAM TAHUNAN (PROTA)</h1>
                <h2 class="text-lg font-semibold">PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
                <p class="text-gray-600">Tahun Pelajaran ${tahun}</p>
            </div>
            
            <!-- Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Satuan Pendidikan</td><td>: ${school.name || '-'}</td></tr>
                        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam dan Budi Pekerti</td></tr>
                        <tr><td>Fase / Kelas</td><td>: Fase ${fase} / Kelas ${kelas}</td></tr>
                    </table>
                </div>
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Tahun Pelajaran</td><td>: ${tahun}</td></tr>
                        <tr><td>Alokasi Waktu</td><td>: ${jpMinggu} JP/Minggu</td></tr>
                        <tr><td>Guru Pengampu</td><td>: ${teacher}</td></tr>
                    </table>
                </div>
            </div>
            
            <!-- Tabel Prota -->
            <table class="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr class="bg-pai-green text-white">
                        <th class="border border-gray-400 p-2 w-10">No</th>
                        <th class="border border-gray-400 p-2 w-40">Elemen</th>
                        <th class="border border-gray-400 p-2">Deskripsi Capaian Pembelajaran</th>
                        <th class="border border-gray-400 p-2 w-20">Alokasi Waktu (JP)</th>
                        <th class="border border-gray-400 p-2 w-24">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${protaRows}
                </tbody>
            </table>
            
            <!-- Tanda Tangan -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala ${school.name || 'Sekolah'}</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${principal.name || '................................'}</p>
                    <p>NIP. ${principal.nip || '................................'}</p>
                </div>
                <div>
                    <p>${school.kabupaten || '................'}, ........................ ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${teacher}</p>
                    <p>NIP. ${userData?.profile?.nip || '................................'}</p>
                </div>
            </div>
        </div>
    `;
}

// === GENERATE PROMES ===
function generatePromes(kelas, fase, semester, tahun, cpData) {
    const school = userData?.school || {};
    const teacher = userData?.displayName || 'Guru PAI';
    const principal = userData?.principal || {};
    
    const jpMinggu = parseInt(document.getElementById('docJPMinggu').value) || 4;
    const mingguEfektif = parseInt(document.getElementById('docMingguEfektif').value) || 18;
    
    // Generate month headers based on semester
    const months = semester == 1 
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
    
    let promesRows = '';
    let no = 1;
    let totalJP = 0;
    
    for (const [elemenKey, elemenData] of Object.entries(cpData.capaianPembelajaran)) {
        elemenData.capaian.forEach((cp, cpIdx) => {
            const jpPerCP = Math.floor((mingguEfektif * jpMinggu) / 15) || 4;
            totalJP += jpPerCP;
            
            // Distribute JP across months
            const monthIdx = (cpIdx + no - 1) % 6;
            let monthCells = months.map((_, idx) => {
                if (idx === monthIdx || idx === (monthIdx + 1) % 6) {
                    return `<td class="border border-gray-400 p-1 text-center bg-green-100">${Math.ceil(jpPerCP / 2)}</td>`;
                }
                return `<td class="border border-gray-400 p-1 text-center">-</td>`;
            }).join('');
            
            promesRows += `
                <tr>
                    <td class="border border-gray-400 p-2 text-center align-top">${no}</td>
                    <td class="border border-gray-400 p-2 align-top text-sm">${cp.teks.substring(0, 80)}...</td>
                    <td class="border border-gray-400 p-2 text-center align-top">${jpPerCP}</td>
                    ${monthCells}
                    <td class="border border-gray-400 p-2 text-center align-top">-</td>
                </tr>
            `;
            no++;
        });
    }
    
    return `
        <div class="p-8 bg-white">
            <!-- Header -->
            <div class="text-center mb-6">
                <h1 class="text-xl font-bold uppercase">PROGRAM SEMESTER (PROMES)</h1>
                <h2 class="text-lg font-semibold">PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
                <p class="text-gray-600">Tahun Pelajaran ${tahun} - Semester ${semester == 1 ? 'Ganjil' : 'Genap'}</p>
            </div>
            
            <!-- Info -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Satuan Pendidikan</td><td>: ${school.name || '-'}</td></tr>
                        <tr><td>Mata Pelajaran</td><td>: Pendidikan Agama Islam dan Budi Pekerti</td></tr>
                        <tr><td>Fase / Kelas</td><td>: Fase ${fase} / Kelas ${kelas}</td></tr>
                    </table>
                </div>
                <div>
                    <table class="w-full">
                        <tr><td class="w-32">Tahun Pelajaran</td><td>: ${tahun}</td></tr>
                        <tr><td>Semester</td><td>: ${semester == 1 ? 'Ganjil' : 'Genap'}</td></tr>
                        <tr><td>Guru Pengampu</td><td>: ${teacher}</td></tr>
                    </table>
                </div>
            </div>
            
            <!-- Tabel Promes -->
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-400 text-xs">
                    <thead>
                        <tr class="bg-pai-green text-white">
                            <th class="border border-gray-400 p-2 w-8" rowspan="2">No</th>
                            <th class="border border-gray-400 p-2" rowspan="2">Tujuan Pembelajaran</th>
                            <th class="border border-gray-400 p-2 w-12" rowspan="2">JP</th>
                            <th class="border border-gray-400 p-2" colspan="6">Bulan</th>
                            <th class="border border-gray-400 p-2 w-16" rowspan="2">Ket</th>
                        </tr>
                        <tr class="bg-pai-green text-white">
                            ${months.map(m => `<th class="border border-gray-400 p-1 w-12">${m.substring(0, 3)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${promesRows}
                        <tr class="bg-gray-200 font-bold">
                            <td colspan="2" class="border border-gray-400 p-2 text-right">Jumlah</td>
                            <td class="border border-gray-400 p-2 text-center">${totalJP}</td>
                            <td colspan="7" class="border border-gray-400 p-2"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Tanda Tangan -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala ${school.name || 'Sekolah'}</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${principal.name || '................................'}</p>
                    <p>NIP. ${principal.nip || '................................'}</p>
                </div>
                <div>
                    <p>${school.kabupaten || '................'}, ........................ ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${teacher}</p>
                    <p>NIP. ${userData?.profile?.nip || '................................'}</p>
                </div>
            </div>
        </div>
    `;
}

// === GENERATE MODUL AJAR ===
function generateModulAjar(kelas, fase, semester, tahun, cpData) {
    const school = userData?.school || {};
    const teacher = userData?.displayName || 'Guru PAI';
    const principal = userData?.principal || {};
    
    const elemen = document.getElementById('docElemen').value;
    const capaianKode = document.getElementById('docCapaian').value;
    const topik = document.getElementById('docTopik').value || 'Topik Pembelajaran';
    const pertemuan = document.getElementById('docPertemuan').value || 1;
    
    // Get elemen data
    const elemenData = cpData.capaianPembelajaran[elemen];
    if (!elemenData) {
        showToast('Pilih elemen pembelajaran!', 'error');
        return '';
    }
    
    // Find selected capaian
    let selectedCP = elemenData.capaian[0];
    if (capaianKode) {
        const found = elemenData.capaian.find(cp => cp.kode === capaianKode);
        if (found) selectedCP = found;
    }
    
    // Get dimensi terkait
    const dimensiTerkait = elemenData.dimensiTerkait?.map(id => getDimensiById(id)).filter(Boolean) || [];
    
    // Get methods and media
    const metode = CURRICULUM_DATA.metodePembelajaran.slice(0, 4);
    const media = CURRICULUM_DATA.mediaPembelajaran.slice(0, 4);
    const asesmen = CURRICULUM_DATA.bentukAsesmen.slice(0, 3);
    
    const elemenLabel = {
        'alquranHadis': "Al-Qur'an dan Hadis",
        'akidah': 'Akidah',
        'akhlak': 'Akhlak',
        'fikih': 'Fikih',
        'sejarah': 'Sejarah Peradaban Islam'
    }[elemen] || elemen;
    
    return `
        <div class="p-8 bg-white">
            <!-- Header -->
            <div class="text-center mb-6 border-b-2 border-pai-green pb-4">
                <h1 class="text-xl font-bold uppercase">MODUL AJAR</h1>
                <h2 class="text-lg font-semibold">PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
                <p class="text-pai-green font-medium mt-2">${topik}</p>
            </div>
            
            <!-- Informasi Umum -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">A. INFORMASI UMUM</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <table class="w-full">
                            <tr><td class="w-40 py-1">Satuan Pendidikan</td><td class="py-1">: ${school.name || '-'}</td></tr>
                            <tr><td class="py-1">Mata Pelajaran</td><td class="py-1">: PAI dan Budi Pekerti</td></tr>
                            <tr><td class="py-1">Fase / Kelas</td><td class="py-1">: Fase ${fase} / Kelas ${kelas}</td></tr>
                            <tr><td class="py-1">Elemen</td><td class="py-1">: ${elemenLabel}</td></tr>
                        </table>
                    </div>
                    <div>
                        <table class="w-full">
                            <tr><td class="w-40 py-1">Tahun Pelajaran</td><td class="py-1">: ${tahun}</td></tr>
                            <tr><td class="py-1">Semester</td><td class="py-1">: ${semester == 1 ? 'Ganjil' : 'Genap'}</td></tr>
                            <tr><td class="py-1">Pertemuan Ke</td><td class="py-1">: ${pertemuan}</td></tr>
                            <tr><td class="py-1">Alokasi Waktu</td><td class="py-1">: 4 x 35 menit</td></tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Dimensi Lulusan -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">B. DIMENSI LULUSAN</h3>
                <div class="flex flex-wrap gap-2">
                    ${dimensiTerkait.map(d => `
                        <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            ${d.icon} ${d.nama}
                        </span>
                    `).join('')}
                </div>
            </div>
            
            <!-- Capaian Pembelajaran -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">C. CAPAIAN PEMBELAJARAN</h3>
                <p class="text-sm bg-gray-50 p-3 rounded">${selectedCP.teks}</p>
            </div>
            
            <!-- Tujuan Pembelajaran -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">D. TUJUAN PEMBELAJARAN</h3>
                <ul class="list-disc list-inside text-sm space-y-1">
                    ${selectedCP.indikator.map(ind => `<li>${ind}</li>`).join('')}
                </ul>
            </div>
            
            <!-- Pemahaman Bermakna -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">E. PEMAHAMAN BERMAKNA</h3>
                <p class="text-sm bg-yellow-50 p-3 rounded">${elemenData.deskripsi}</p>
            </div>
            
            <!-- Pertanyaan Pemantik -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">F. PERTANYAAN PEMANTIK</h3>
                <ol class="list-decimal list-inside text-sm space-y-1">
                    <li>Apa yang kalian ketahui tentang ${topik.toLowerCase()}?</li>
                    <li>Mengapa penting mempelajari ${topik.toLowerCase()}?</li>
                    <li>Bagaimana cara menerapkan ${topik.toLowerCase()} dalam kehidupan sehari-hari?</li>
                </ol>
            </div>
            
            <!-- Kegiatan Pembelajaran -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">G. KEGIATAN PEMBELAJARAN</h3>
                
                <div class="mb-4">
                    <h4 class="font-semibold bg-green-100 p-2 rounded">1. Pendahuluan (15 menit)</h4>
                    <ul class="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                        <li>Guru membuka pembelajaran dengan salam dan doa</li>
                        <li>Guru mengecek kehadiran peserta didik</li>
                        <li>Guru melakukan apersepsi dengan mengajukan pertanyaan pemantik</li>
                        <li>Guru menyampaikan tujuan pembelajaran</li>
                    </ul>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-semibold bg-blue-100 p-2 rounded">2. Kegiatan Inti (90 menit)</h4>
                    <ul class="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                        <li>Peserta didik mengamati materi tentang ${topik}</li>
                        <li>Guru menjelaskan materi dengan metode yang sesuai</li>
                        <li>Peserta didik berdiskusi dalam kelompok</li>
                        <li>Peserta didik mempresentasikan hasil diskusi</li>
                        <li>Guru memberikan penguatan dan klarifikasi</li>
                    </ul>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-semibold bg-yellow-100 p-2 rounded">3. Penutup (35 menit)</h4>
                    <ul class="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
                        <li>Peserta didik menyimpulkan pembelajaran dengan bimbingan guru</li>
                        <li>Guru melakukan refleksi dan evaluasi</li>
                        <li>Guru memberikan tugas tindak lanjut</li>
                        <li>Guru menutup pembelajaran dengan doa dan salam</li>
                    </ul>
                </div>
            </div>
            
            <!-- Metode, Media, Asesmen -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div>
                    <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">H. METODE</h3>
                    <ul class="list-disc list-inside text-sm">
                        ${metode.map(m => `<li>${m.nama}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">I. MEDIA/SUMBER</h3>
                    <ul class="list-disc list-inside text-sm">
                        ${media.map(m => `<li>${m.nama}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">J. ASESMEN</h3>
                    <ul class="list-disc list-inside text-sm">
                        ${asesmen.map(a => `<li>${a.nama}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <!-- Refleksi -->
            <div class="mb-6">
                <h3 class="font-bold text-pai-green border-b border-pai-green pb-1 mb-3">K. REFLEKSI</h3>
                <table class="w-full border-collapse border border-gray-300 text-sm">
                    <tr>
                        <td class="border border-gray-300 p-2 w-1/2 align-top">
                            <strong>Refleksi Guru:</strong><br>
                            <div class="h-16"></div>
                        </td>
                        <td class="border border-gray-300 p-2 w-1/2 align-top">
                            <strong>Refleksi Peserta Didik:</strong><br>
                            <div class="h-16"></div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Tanda Tangan -->
            <div class="grid grid-cols-2 gap-8 mt-12 text-center text-sm">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala ${school.name || 'Sekolah'}</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${principal.name || '................................'}</p>
                    <p>NIP. ${principal.nip || '................................'}</p>
                </div>
                <div>
                    <p>${school.kabupaten || '................'}, ........................ ${new Date().getFullYear()}</p>
                    <p>Guru Mata Pelajaran</p>
                    <div class="h-20"></div>
                    <p class="font-bold underline">${teacher}</p>
                    <p>NIP. ${userData?.profile?.nip || '................................'}</p>
                </div>
            </div>
        </div>
    `;
}

// === PRINT DOCUMENT ===
function printDocument() {
    window.print();
}

// === DOWNLOAD PDF ===
function downloadPDF() {
    // Using browser print to PDF
    showToast('Gunakan Ctrl+P dan pilih "Save as PDF"', 'info');
    setTimeout(() => {
        window.print();
    }, 500);
}

// === SAVE DOCUMENT ===
async function saveDocument() {
    if (!generatedDoc) {
        showToast('Tidak ada dokumen untuk disimpan!', 'error');
        return;
    }
    
    const docLabels = {
        'atp': 'ATP',
        'prota': 'PROTA',
        'promes': 'PROMES',
        'modul': 'Modul Ajar'
    };
    
    const data = {
        type: generatedDoc.type,
        label: docLabels[generatedDoc.type],
        kelas: generatedDoc.kelas,
        fase: generatedDoc.fase,
        semester: generatedDoc.semester,
        tahun: generatedDoc.tahun,
        topik: document.getElementById('docTopik')?.value || '',
        elemen: document.getElementById('docElemen')?.value || '',
        html: generatedDoc.html,
        teacherId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('documents').add(data);
        showToast('Dokumen berhasil disimpan!', 'success');
        loadSavedDocuments();
    } catch (error) {
        console.error('Error saving document:', error);
        showToast('Gagal menyimpan dokumen', 'error');
    }
}

// === LOAD SAVED DOCUMENTS ===
async function loadSavedDocuments() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const snapshot = await db.collection('documents')
            .where('teacherId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        savedDocs = [];
        snapshot.forEach(doc => {
            savedDocs.push({ id: doc.id, ...doc.data() });
        });
        
        renderSavedDocuments();
        
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// === RENDER SAVED DOCUMENTS ===
function renderSavedDocuments() {
    const container = document.getElementById('savedDocuments');
    
    if (savedDocs.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Belum ada dokumen tersimpan</p>';
        return;
    }
    
    container.innerHTML = savedDocs.map(doc => {
        const date = doc.createdAt?.toDate?.() || new Date();
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        const icons = {
            'atp': '📋',
            'prota': '📅',
            'promes': '📆',
            'modul': '📖'
        };
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${icons[doc.type] || '📄'}</span>
                    <div>
                        <div class="font-medium">${doc.label} - Kelas ${doc.kelas}</div>
                        <div class="text-sm text-gray-500">
                            ${doc.topik || 'Semester ' + doc.semester} • ${dateStr}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="viewSavedDocument('${doc.id}')" class="btn btn-outline text-sm py-1">
                        👁️ Lihat
                    </button>
                    <button onclick="deleteSavedDocument('${doc.id}')" class="btn btn-outline text-sm py-1 text-red-500">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// === VIEW SAVED DOCUMENT ===
function viewSavedDocument(id) {
    const doc = savedDocs.find(d => d.id === id);
    if (!doc) return;
    
    document.getElementById('documentContent').innerHTML = doc.html;
    document.getElementById('documentPreview').classList.remove('hidden');
    document.getElementById('documentPreview').scrollIntoView({ behavior: 'smooth' });
    
    generatedDoc = doc;
}

// === DELETE SAVED DOCUMENT ===
async function deleteSavedDocument(id) {
    if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
    
    try {
        await db.collection('documents').doc(id).delete();
        showToast('Dokumen berhasil dihapus!', 'success');
        loadSavedDocuments();
    } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Gagal menghapus dokumen', 'error');
    }
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

console.log('✅ Generator module initialized');