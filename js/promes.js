/**
 * ================================
 * ADMIN PAI SUPER APP
 * Modul Program Semester (Promes)
 * ================================
 * Terintegrasi dengan:
 * - Kalender Pendidikan (minggu efektif, libur)
 * - Program Tahunan (Tujuan Pembelajaran)
 */

// ============================================
// STATE
// ============================================
const PromesState = {
    kelas: '',
    semester: '1',
    fase: '',
    tahunPelajaran: '2024/2025',
    view: 'timeline',
    jpPerMinggu: 4,
    
    // Data minggu
    mingguData: [], // Array of { mingguKe, tanggalMulai, tanggalSelesai, status, keterangan, tpList }
    
    // Data TP dari Prota
    tpList: [],
    tpTerdistribusi: {}, // { kodeTP: mingguKe }
    
    // Pengaturan semester
    semesterConfig: {
        1: {
            mulai: '2024-07-15', // Juli
            selesai: '2024-12-21', // Desember
            totalMinggu: 24,
            ptsMinggu: 9, // Minggu ke-9
            pasMinggu: 23 // Minggu ke-23
        },
        2: {
            mulai: '2025-01-06', // Januari
            selesai: '2025-06-21', // Juni
            totalMinggu: 24,
            ptsMinggu: 9,
            pasMinggu: 23
        }
    },
    
    currentEditMinggu: null
};

// Warna status minggu
const STATUS_COLORS = {
    efektif: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' },
    libur: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' },
    pts: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' },
    pas: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' },
    remedial: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' }
};

const STATUS_LABELS = {
    efektif: 'Efektif',
    libur: 'Libur',
    pts: 'PTS',
    pas: 'PAS',
    remedial: 'Remedial'
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default tahun pelajaran dari profil
    if (AppState?.profil?.tahunPelajaran) {
        document.getElementById('promesTahun').value = AppState.profil.tahunPelajaran;
    }
});

// ============================================
// LOAD PROMES
// ============================================
function loadPromesByKelas() {
    const kelas = document.getElementById('promesKelas').value;
    
    if (!kelas) {
        document.getElementById('promesContent').classList.add('hidden');
        document.getElementById('promesEmpty').classList.remove('hidden');
        document.getElementById('promesAlertProta').classList.add('hidden');
        return;
    }
    
    PromesState.kelas = kelas;
    PromesState.fase = getFaseByKelas(kelas);
    
    loadPromesBySemester();
}

function loadPromesBySemester() {
    if (!PromesState.kelas) return;
    
    PromesState.semester = document.getElementById('promesSemester').value;
    PromesState.tahunPelajaran = document.getElementById('promesTahun').value;
    
    // Load TP dari Prota
    loadTPFromProta();
    
    // Cek apakah ada data Prota
    if (PromesState.tpList.length === 0) {
        document.getElementById('promesContent').classList.add('hidden');
        document.getElementById('promesEmpty').classList.add('hidden');
        document.getElementById('promesAlertProta').classList.remove('hidden');
        return;
    }
    
    // Generate minggu-minggu semester
    generateMingguSemester();
    
    // Load data promes yang sudah disimpan
    loadPromesFromStorage();
    
    // Render
    renderPromesTPList();
    renderPromes();
    updatePromesStats();
    
    // Show content
    document.getElementById('promesContent').classList.remove('hidden');
    document.getElementById('promesEmpty').classList.add('hidden');
    document.getElementById('promesAlertProta').classList.add('hidden');
}

// ============================================
// LOAD TP FROM PROTA
// ============================================
function loadTPFromProta() {
    const protaKey = `adminPAI_prota_${PromesState.kelas}`;
    const protaData = localStorage.getItem(protaKey);
    
    PromesState.tpList = [];
    
    if (!protaData) return;
    
    const prota = JSON.parse(protaData);
    const semester = parseInt(PromesState.semester);
    
    // Ambil semua TP untuk semester ini
    Object.keys(prota).forEach(elemenKey => {
        const tpElemen = prota[elemenKey] || [];
        tpElemen.forEach(tp => {
            if (tp.semester === semester) {
                PromesState.tpList.push({
                    ...tp,
                    elemen: elemenKey,
                    elemenNama: DATABASE_CP_PAI[PromesState.fase]?.elemen[elemenKey]?.nama || elemenKey
                });
            }
        });
    });
    
    // Sort by kode
    PromesState.tpList.sort((a, b) => a.kode.localeCompare(b.kode));
}

// ============================================
// GENERATE MINGGU SEMESTER
// ============================================
function generateMingguSemester() {
    const semester = PromesState.semester;
    const config = PromesState.semesterConfig[semester];
    
    // Update tanggal berdasarkan tahun pelajaran
    const tahun = parseInt(PromesState.tahunPelajaran.split('/')[0]);
    
    let startDate;
    if (semester === '1') {
        startDate = new Date(tahun, 6, 15); // Juli
    } else {
        startDate = new Date(tahun + 1, 0, 6); // Januari tahun berikutnya
    }
    
    // Cari Senin pertama
    while (startDate.getDay() !== 1) {
        startDate.setDate(startDate.getDate() + 1);
    }
    
    PromesState.mingguData = [];
    
    for (let i = 1; i <= config.totalMinggu; i++) {
        const mingguMulai = new Date(startDate);
        mingguMulai.setDate(startDate.getDate() + (i - 1) * 7);
        
        const mingguSelesai = new Date(mingguMulai);
        mingguSelesai.setDate(mingguMulai.getDate() + 5); // Sabtu
        
        // Tentukan status default
        let status = 'efektif';
        let keterangan = '';
        
        if (i === config.ptsMinggu) {
            status = 'pts';
            keterangan = 'Penilaian Tengah Semester';
        } else if (i === config.pasMinggu || i === config.pasMinggu + 1) {
            status = 'pas';
            keterangan = 'Penilaian Akhir Semester';
        }
        
        // Cek dengan kalender libur
        const liburMingguIni = cekLiburMinggu(mingguMulai, mingguSelesai);
        if (liburMingguIni) {
            status = 'libur';
            keterangan = liburMingguIni;
        }
        
        PromesState.mingguData.push({
            mingguKe: i,
            tanggalMulai: mingguMulai.toISOString().split('T')[0],
            tanggalSelesai: mingguSelesai.toISOString().split('T')[0],
            status: status,
            keterangan: keterangan,
            tpList: [] // Akan diisi dari storage atau manual
        });
    }
}

function cekLiburMinggu(mulai, selesai) {
    // Cek dengan data kalender yang sudah diinput
    const hariLibur = AppState?.kalender?.hariLibur || [];
    
    for (const libur of hariLibur) {
        const tglLibur = new Date(libur.tanggal);
        if (tglLibur >= mulai && tglLibur <= selesai) {
            return libur.keterangan;
        }
    }
    
    return null;
}

// ============================================
// RENDER TP LIST (untuk dipilih)
// ============================================
function renderPromesTPList() {
    const container = document.getElementById('promesTPList');
    
    if (PromesState.tpList.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <p>Tidak ada TP untuk semester ini</p>
            </div>
        `;
        return;
    }
    
    // Group by elemen
    const grouped = {};
    PromesState.tpList.forEach(tp => {
        if (!grouped[tp.elemen]) {
            grouped[tp.elemen] = [];
        }
        grouped[tp.elemen].push(tp);
    });
    
    let html = '';
    
    Object.keys(grouped).forEach(elemen => {
        const warna = WARNA_ELEMEN[elemen] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
        const icon = ICON_ELEMEN[elemen] || '📚';
        
        grouped[elemen].forEach(tp => {
            const terdistribusi = PromesState.tpTerdistribusi[tp.kode];
            const statusClass = terdistribusi ? 'opacity-50' : '';
            
            html += `
                <div class="${warna.bg} ${warna.border} border rounded-xl p-3 ${statusClass}" data-kode="${tp.kode}">
                    <div class="flex items-start gap-2">
                        <span class="text-lg">${icon}</span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-mono px-1.5 py-0.5 bg-white rounded">${tp.kode}</span>
                                <span class="text-xs ${warna.text} font-medium">${tp.alokasi} JP</span>
                                ${terdistribusi ? `<span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Minggu ${terdistribusi}</span>` : ''}
                            </div>
                            <p class="text-sm text-gray-700 line-clamp-2">${tp.tujuan}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    container.innerHTML = html;
}

// ============================================
// RENDER PROMES (TIMELINE & TABLE)
// ============================================
function renderPromes() {
    if (PromesState.view === 'timeline') {
        renderPromesTimeline();
    } else {
        renderPromesTable();
    }
}

function renderPromesTimeline() {
    const container = document.getElementById('promesTimeline');
    
    // Generate header bulan
    const bulanSet = new Set();
    PromesState.mingguData.forEach(m => {
        const date = new Date(m.tanggalMulai);
        const bulanTahun = `${date.getFullYear()}-${date.getMonth()}`;
        bulanSet.add(bulanTahun);
    });
    
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    let html = `
        <!-- Header Bulan -->
        <div class="flex border-b border-gray-200 mb-4">
            <div class="w-32 flex-shrink-0 p-2 font-semibold text-gray-600">Elemen</div>
            <div class="flex-1 flex">
    `;
    
    // Hitung minggu per bulan
    const mingguPerBulan = {};
    PromesState.mingguData.forEach(m => {
        const date = new Date(m.tanggalMulai);
        const bulanKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!mingguPerBulan[bulanKey]) {
            mingguPerBulan[bulanKey] = { nama: namaBulan[date.getMonth()], count: 0 };
        }
        mingguPerBulan[bulanKey].count++;
    });
    
    Object.keys(mingguPerBulan).forEach(key => {
        const bulan = mingguPerBulan[key];
        html += `
            <div class="text-center font-semibold text-gray-700 border-l border-gray-200 py-2" style="width: ${bulan.count * 48}px;">
                ${bulan.nama}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    // Header Minggu
    html += `
        <div class="flex border-b border-gray-300 mb-2">
            <div class="w-32 flex-shrink-0 p-2 text-sm text-gray-500">Minggu ke-</div>
            <div class="flex-1 flex">
    `;
    
    PromesState.mingguData.forEach(m => {
        const colors = STATUS_COLORS[m.status];
        html += `
            <div class="w-12 flex-shrink-0 text-center py-1">
                <div class="w-8 h-8 mx-auto ${colors.bg} ${colors.text} rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80"
                    onclick="openModalKeterangan(${m.mingguKe})" title="${m.keterangan || STATUS_LABELS[m.status]}">
                    ${m.mingguKe}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    // Row per Elemen
    const elemenList = Object.keys(DATABASE_CP_PAI[PromesState.fase]?.elemen || {});
    
    elemenList.forEach(elemenKey => {
        const elemenData = DATABASE_CP_PAI[PromesState.fase].elemen[elemenKey];
        const warna = WARNA_ELEMEN[elemenKey];
        const icon = ICON_ELEMEN[elemenKey];
        
        html += `
            <div class="flex border-b border-gray-100 hover:bg-gray-50">
                <div class="w-32 flex-shrink-0 p-2 flex items-center gap-2">
                    <span>${icon}</span>
                    <span class="text-sm font-medium text-gray-700 truncate">${elemenData.nama.split(' ')[0]}</span>
                </div>
                <div class="flex-1 flex">
        `;
        
        PromesState.mingguData.forEach(m => {
            // Cek apakah minggu ini ada TP dari elemen ini
            const tpMingguIni = m.tpList.filter(tp => tp.elemen === elemenKey);
            const colors = STATUS_COLORS[m.status];
            
            if (m.status !== 'efektif' || tpMingguIni.length === 0) {
                html += `
                    <div class="w-12 flex-shrink-0 p-1">
                        <div class="h-10 border border-dashed ${m.status === 'efektif' ? 'border-gray-200 hover:border-green-400 cursor-pointer' : 'border-gray-200'} rounded flex items-center justify-center"
                            ${m.status === 'efektif' ? `onclick="openModalPilihTPMinggu(${m.mingguKe})"` : ''}>
                            ${m.status !== 'efektif' ? `<span class="w-2 h-2 ${colors.dot} rounded-full"></span>` : '<span class="text-gray-300 text-lg">+</span>'}
                        </div>
                    </div>
                `;
            } else {
                // Ada TP, tampilkan bar
                const jp = tpMingguIni.reduce((sum, tp) => sum + tp.alokasi, 0);
                html += `
                    <div class="w-12 flex-shrink-0 p-1">
                        <div class="${warna.bg} ${warna.border} border h-10 rounded flex items-center justify-center cursor-pointer hover:opacity-80"
                            onclick="openModalPilihTPMinggu(${m.mingguKe})" title="${tpMingguIni.map(t => t.kode).join(', ')}">
                            <span class="${warna.text} text-xs font-bold">${jp}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    // Baris total JP per minggu
    html += `
        <div class="flex border-t-2 border-gray-300 mt-2 pt-2">
            <div class="w-32 flex-shrink-0 p-2 font-semibold text-gray-700">Total JP</div>
            <div class="flex-1 flex">
    `;
    
    PromesState.mingguData.forEach(m => {
        const totalJP = m.tpList.reduce((sum, tp) => sum + tp.alokasi, 0);
        const colors = STATUS_COLORS[m.status];
        
        html += `
            <div class="w-12 flex-shrink-0 text-center py-1">
                <span class="${m.status === 'efektif' && totalJP > 0 ? 'font-bold text-green-600' : 'text-gray-400'}">${m.status === 'efektif' ? totalJP : '-'}</span>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderPromesTable() {
    const tbody = document.getElementById('promesTableBody');
    
    let html = '';
    
    PromesState.mingguData.forEach(m => {
        const colors = STATUS_COLORS[m.status];
        const tanggalMulai = new Date(m.tanggalMulai);
        const tanggalSelesai = new Date(m.tanggalSelesai);
        const totalJP = m.tpList.reduce((sum, tp) => sum + tp.alokasi, 0);
        
        const formatTanggal = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        html += `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 ${colors.bg} ${colors.text} rounded-lg font-bold text-sm">
                        ${m.mingguKe}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">
                    ${formatTanggal(tanggalMulai)} - ${formatTanggal(tanggalSelesai)}
                </td>
                <td class="py-3 px-4">
                    ${m.status === 'efektif' ? `
                        ${m.tpList.length > 0 ? `
                            <div class="space-y-1">
                                ${m.tpList.map(tp => `
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-mono px-1.5 py-0.5 bg-gray-100 rounded">${tp.kode}</span>
                                        <span class="text-sm text-gray-700 truncate">${tp.tujuan.substring(0, 60)}...</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <button onclick="openModalPilihTPMinggu(${m.mingguKe})" class="text-sm text-gray-400 hover:text-green-600 flex items-center gap-1">
                                <i data-feather="plus-circle" class="w-4 h-4"></i>
                                Tambah materi
                            </button>
                        `}
                    ` : `
                        <span class="text-sm ${colors.text}">${m.keterangan || STATUS_LABELS[m.status]}</span>
                    `}
                </td>
                <td class="py-3 px-4 text-center">
                    ${m.status === 'efektif' ? `
                        <span class="font-bold ${totalJP > 0 ? 'text-green-600' : 'text-gray-400'}">${totalJP}</span>
                    ` : '-'}
                </td>
                <td class="py-3 px-4 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium">
                        <span class="w-2 h-2 ${colors.dot} rounded-full"></span>
                        ${STATUS_LABELS[m.status]}
                    </span>
                </td>
                <td class="py-3 px-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                        ${m.status === 'efektif' ? `
                            <button onclick="openModalPilihTPMinggu(${m.mingguKe})" class="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg" title="Edit Materi">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        <button onclick="openModalKeterangan(${m.mingguKe})" class="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="Ubah Status">
                            <i data-feather="settings" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    feather.replace();
}

// ============================================
// MODAL PILIH TP UNTUK MINGGU
// ============================================
function openModalPilihTPMinggu(mingguKe) {
    const minggu = PromesState.mingguData.find(m => m.mingguKe === mingguKe);
    if (!minggu || minggu.status !== 'efektif') return;
    
    PromesState.currentEditMinggu = mingguKe;
    
    document.getElementById('modalMingguKe').textContent = mingguKe;
    
    const tglMulai = new Date(minggu.tanggalMulai);
    const tglSelesai = new Date(minggu.tanggalSelesai);
    document.getElementById('modalTanggalMinggu').textContent = 
        `${tglMulai.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - ${tglSelesai.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    
    renderModalTPList(minggu);
    
    document.getElementById('modalPilihTPMinggu').classList.remove('hidden');
    feather.replace();
}

function closeModalPilihTPMinggu() {
    document.getElementById('modalPilihTPMinggu').classList.add('hidden');
    PromesState.currentEditMinggu = null;
}

function renderModalTPList(minggu) {
    const container = document.getElementById('modalTPMingguList');
    const selectedKodes = minggu.tpList.map(tp => tp.kode);
    
    // Filter TP yang belum didistribusikan atau sudah di minggu ini
    const availableTP = PromesState.tpList.filter(tp => {
        const distributed = PromesState.tpTerdistribusi[tp.kode];
        return !distributed || distributed === minggu.mingguKe;
    });
    
    if (availableTP.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>Semua TP sudah didistribusikan</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = availableTP.map(tp => {
        const isSelected = selectedKodes.includes(tp.kode);
        const warna = WARNA_ELEMEN[tp.elemen];
        const icon = ICON_ELEMEN[tp.elemen];
        
        return `
            <label class="flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}">
                <input type="checkbox" 
                    value="${tp.kode}" 
                    data-alokasi="${tp.alokasi}"
                    data-elemen="${tp.elemen}"
                    data-tujuan="${tp.tujuan.replace(/"/g, '&quot;')}"
                    ${isSelected ? 'checked' : ''}
                    onchange="updateModalJPCount()"
                    class="mt-1 w-5 h-5 text-green-600 rounded">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span>${icon}</span>
                        <span class="text-xs font-mono px-1.5 py-0.5 bg-gray-200 rounded">${tp.kode}</span>
                        <span class="text-xs ${warna.text} font-medium">${tp.alokasi} JP</span>
                    </div>
                    <p class="text-sm text-gray-700">${tp.tujuan}</p>
                </div>
            </label>
        `;
    }).join('');
    
    updateModalJPCount();
}

function updateModalJPCount() {
    const checkboxes = document.querySelectorAll('#modalTPMingguList input[type="checkbox"]:checked');
    let totalJP = 0;
    
    checkboxes.forEach(cb => {
        totalJP += parseInt(cb.dataset.alokasi);
    });
    
    const jpEl = document.getElementById('modalJPTerpilih');
    jpEl.textContent = totalJP;
    jpEl.className = totalJP > PromesState.jpPerMinggu ? 'font-bold text-red-600' : 'font-bold text-green-600';
}

function simpanTPMinggu() {
    const mingguKe = PromesState.currentEditMinggu;
    const minggu = PromesState.mingguData.find(m => m.mingguKe === mingguKe);
    
    if (!minggu) return;
    
    // Hapus distribusi lama dari minggu ini
    minggu.tpList.forEach(tp => {
        delete PromesState.tpTerdistribusi[tp.kode];
    });
    
    // Ambil TP yang dipilih
    const checkboxes = document.querySelectorAll('#modalTPMingguList input[type="checkbox"]:checked');
    minggu.tpList = [];
    
    checkboxes.forEach(cb => {
        const tp = {
            kode: cb.value,
            alokasi: parseInt(cb.dataset.alokasi),
            elemen: cb.dataset.elemen,
            tujuan: cb.dataset.tujuan
        };
        minggu.tpList.push(tp);
        PromesState.tpTerdistribusi[tp.kode] = mingguKe;
    });
    
    savePromesToStorage();
    renderPromesTPList();
    renderPromes();
    updatePromesStats();
    closeModalPilihTPMinggu();
    
    showToast('✅ Materi minggu berhasil disimpan!');
}

// ============================================
// MODAL KETERANGAN MINGGU
// ============================================
function openModalKeterangan(mingguKe) {
    const minggu = PromesState.mingguData.find(m => m.mingguKe === mingguKe);
    if (!minggu) return;
    
    document.getElementById('keteranganMingguKe').value = mingguKe;
    document.getElementById('inputStatusMinggu').value = minggu.status;
    document.getElementById('inputKeteranganMinggu').value = minggu.keterangan || '';
    
    document.getElementById('modalKeteranganMinggu').classList.remove('hidden');
}

function closeModalKeterangan() {
    document.getElementById('modalKeteranganMinggu').classList.add('hidden');
}

function simpanKeteranganMinggu() {
    const mingguKe = parseInt(document.getElementById('keteranganMingguKe').value);
    const status = document.getElementById('inputStatusMinggu').value;
    const keterangan = document.getElementById('inputKeteranganMinggu').value;
    
    const minggu = PromesState.mingguData.find(m => m.mingguKe === mingguKe);
    if (!minggu) return;
    
    // Jika status berubah dari efektif, hapus TP
    if (minggu.status === 'efektif' && status !== 'efektif') {
        minggu.tpList.forEach(tp => {
            delete PromesState.tpTerdistribusi[tp.kode];
        });
        minggu.tpList = [];
    }
    
    minggu.status = status;
    minggu.keterangan = keterangan;
    
    savePromesToStorage();
    renderPromesTPList();
    renderPromes();
    updatePromesStats();
    closeModalKeterangan();
    
    showToast('✅ Status minggu berhasil diperbarui!');
}

// ============================================
// AUTO DISTRIBUSI
// ============================================
function autoDistribusiPromes() {
    if (!confirm('Ini akan mendistribusikan TP secara otomatis ke minggu-minggu efektif. TP yang sudah didistribusikan akan tetap. Lanjutkan?')) {
        return;
    }
    
    // Ambil TP yang belum didistribusikan
    const tpBelumDistribusi = PromesState.tpList.filter(tp => !PromesState.tpTerdistribusi[tp.kode]);
    
    if (tpBelumDistribusi.length === 0) {
        showToast('✅ Semua TP sudah didistribusikan!');
        return;
    }
    
    // Ambil minggu efektif yang masih kosong atau belum penuh
    const mingguEfektif = PromesState.mingguData.filter(m => m.status === 'efektif');
    
    let tpIndex = 0;
    
    for (const minggu of mingguEfektif) {
        if (tpIndex >= tpBelumDistribusi.length) break;
        
        const jpMingguIni = minggu.tpList.reduce((sum, tp) => sum + tp.alokasi, 0);
        const sisaJP = PromesState.jpPerMinggu - jpMingguIni;
        
        if (sisaJP <= 0) continue;
        
        // Tambahkan TP yang muat
        while (tpIndex < tpBelumDistribusi.length) {
            const tp = tpBelumDistribusi[tpIndex];
            const currentJP = minggu.tpList.reduce((sum, t) => sum + t.alokasi, 0);
            
            if (currentJP + tp.alokasi <= PromesState.jpPerMinggu) {
                minggu.tpList.push(tp);
                PromesState.tpTerdistribusi[tp.kode] = minggu.mingguKe;
                tpIndex++;
            } else {
                break;
            }
        }
    }
    
    savePromesToStorage();
    renderPromesTPList();
    renderPromes();
    updatePromesStats();
    
    const terdistribusi = Object.keys(PromesState.tpTerdistribusi).length;
    showToast(`✅ ${terdistribusi} TP berhasil didistribusikan!`);
}

// ============================================
// VIEW TOGGLE
// ============================================
function setPromesView(view) {
    PromesState.view = view;
    
    document.getElementById('btnPromesTimeline').classList.toggle('bg-islamic-green', view === 'timeline');
    document.getElementById('btnPromesTimeline').classList.toggle('text-white', view === 'timeline');
    document.getElementById('btnPromesTimeline').classList.toggle('bg-white', view !== 'timeline');
    document.getElementById('btnPromesTimeline').classList.toggle('text-gray-700', view !== 'timeline');
    
    document.getElementById('btnPromesTable').classList.toggle('bg-islamic-green', view === 'table');
    document.getElementById('btnPromesTable').classList.toggle('text-white', view === 'table');
    document.getElementById('btnPromesTable').classList.toggle('bg-white', view !== 'table');
    document.getElementById('btnPromesTable').classList.toggle('text-gray-700', view !== 'table');
    
    document.getElementById('promesTimelineView').classList.toggle('hidden', view !== 'timeline');
    document.getElementById('promesTableView').classList.toggle('hidden', view !== 'table');
    
    renderPromes();
}

// ============================================
// STATISTIK
// ============================================
function updatePromesStats() {
    const mingguEfektif = PromesState.mingguData.filter(m => m.status === 'efektif').length;
    const mingguLibur = PromesState.mingguData.filter(m => m.status !== 'efektif').length;
    const totalJPRencana = PromesState.tpList.reduce((sum, tp) => sum + tp.alokasi, 0);
    const jpTerdistribusi = Object.keys(PromesState.tpTerdistribusi).reduce((sum, kode) => {
        const tp = PromesState.tpList.find(t => t.kode === kode);
        return sum + (tp?.alokasi || 0);
    }, 0);
    
    document.getElementById('promesMingguEfektif').textContent = mingguEfektif;
    document.getElementById('promesMingguLibur').textContent = mingguLibur;
    document.getElementById('promesTotalJP').textContent = totalJPRencana;
    document.getElementById('promesJPDistribusi').textContent = jpTerdistribusi;
    document.getElementById('promesJPSisa').textContent = totalJPRencana - jpTerdistribusi;
}

// ============================================
// STORAGE
// ============================================
function savePromesToStorage() {
    const key = `adminPAI_promes_${PromesState.kelas}_smt${PromesState.semester}`;
    const data = {
        mingguData: PromesState.mingguData,
        tpTerdistribusi: PromesState.tpTerdistribusi,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
}

function savePromesToFirebase() {
    savePromesToStorage();
    
    if (typeof db !== 'undefined' && db && AppState?.userId) {
        saveToFirestore('promes', `${AppState.userId}_kelas${PromesState.kelas}_smt${PromesState.semester}`, {
            kelas: PromesState.kelas,
            semester: PromesState.semester,
            fase: PromesState.fase,
            mingguData: PromesState.mingguData,
            tpTerdistribusi: PromesState.tpTerdistribusi,
            updatedAt: new Date().toISOString()
        });
    }
    
    showToast('✅ Promes berhasil disimpan!');
}

function loadPromesFromStorage() {
    const key = `adminPAI_promes_${PromesState.kelas}_smt${PromesState.semester}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
        const data = JSON.parse(saved);
        
        // Merge dengan data yang sudah digenerate
        data.mingguData.forEach(savedMinggu => {
            const minggu = PromesState.mingguData.find(m => m.mingguKe === savedMinggu.mingguKe);
            if (minggu) {
                minggu.status = savedMinggu.status;
                minggu.keterangan = savedMinggu.keterangan;
                minggu.tpList = savedMinggu.tpList || [];
            }
        });
        
        PromesState.tpTerdistribusi = data.tpTerdistribusi || {};
    } else {
        PromesState.tpTerdistribusi = {};
    }
}

// ============================================
// CETAK PROMES
// ============================================
function printPromes() {
    if (!PromesState.kelas) {
        showToast('⚠️ Pilih kelas terlebih dahulu!', 'warning');
        return;
    }
    
    const profil = AppState?.profil || {};
    const printWindow = window.open('', '_blank');
    
    // Generate tabel
    let tableRows = '';
    
    PromesState.mingguData.forEach(m => {
        const tglMulai = new Date(m.tanggalMulai);
        const tglSelesai = new Date(m.tanggalSelesai);
        const formatTgl = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const totalJP = m.tpList.reduce((sum, tp) => sum + tp.alokasi, 0);
        
        let materiCell = '-';
        if (m.status === 'efektif' && m.tpList.length > 0) {
            materiCell = m.tpList.map(tp => `<div style="margin-bottom: 5px;"><b>${tp.kode}</b>: ${tp.tujuan}</div>`).join('');
        } else if (m.status !== 'efektif') {
            materiCell = `<i>${m.keterangan || STATUS_LABELS[m.status]}</i>`;
        }
        
        const bgColor = m.status !== 'efektif' ? '#fff3e0' : '';
        
        tableRows += `
            <tr style="background: ${bgColor};">
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${m.mingguKe}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${formatTgl(tglMulai)} - ${formatTgl(tglSelesai)}</td>
                <td style="border: 1px solid #000; padding: 8px;">${materiCell}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${m.status === 'efektif' ? totalJP : '-'}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${m.keterangan || ''}</td>
            </tr>
        `;
    });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Program Semester PAI - Kelas ${PromesState.kelas} Semester ${PromesState.semester}</title>
            <style>
                body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 11px; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 14px; }
                .header h2 { margin: 5px 0; font-size: 12px; }
                .identitas { margin-bottom: 15px; }
                .identitas table { border-collapse: collapse; font-size: 11px; }
                .identitas td { padding: 2px 10px 2px 0; }
                table.main { width: 100%; border-collapse: collapse; }
                table.main th { background: #1B5E20; color: white; padding: 8px; font-size: 10px; }
                .ttd { margin-top: 30px; display: flex; justify-content: space-between; }
                .ttd > div { text-align: center; width: 200px; font-size: 11px; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PROGRAM SEMESTER</h1>
                <h2>PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
                <h2>SEMESTER ${PromesState.semester === '1' ? 'GANJIL' : 'GENAP'} TAHUN PELAJARAN ${PromesState.tahunPelajaran}</h2>
            </div>
            
            <div class="identitas">
                <table>
                    <tr><td>Satuan Pendidikan</td><td>:</td><td>${profil.sekolah || '...'}</td></tr>
                    <tr><td>Mata Pelajaran</td><td>:</td><td>Pendidikan Agama Islam dan Budi Pekerti</td></tr>
                    <tr><td>Kelas / Fase</td><td>:</td><td>Kelas ${PromesState.kelas} / Fase ${PromesState.fase}</td></tr>
                    <tr><td>Semester</td><td>:</td><td>${PromesState.semester === '1' ? 'Ganjil' : 'Genap'}</td></tr>
                </table>
            </div>
            
            <table class="main">
                <thead>
                    <tr>
                        <th style="width: 50px;">Minggu Ke</th>
                        <th style="width: 100px;">Tanggal</th>
                        <th>Tujuan Pembelajaran</th>
                        <th style="width: 50px;">JP</th>
                        <th style="width: 100px;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="ttd">
                <div>
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <br><br><br><br>
                    <p>________________________</p>
                    <p>NIP. </p>
                </div>
                <div>
                    <p>${profil.kabupaten || '...'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Guru PAI</p>
                    <br><br><br><br>
                    <p><u>${profil.nama || '...'}</u></p>
                    <p>NIP. ${profil.nip || '-'}</p>
                </div>
            </div>
            
            <script>window.print();</script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// ============================================
// EXPOSE GLOBAL
// ============================================
window.loadPromesByKelas = loadPromesByKelas;
window.loadPromesBySemester = loadPromesBySemester;
window.setPromesView = setPromesView;
window.openModalPilihTPMinggu = openModalPilihTPMinggu;
window.closeModalPilihTPMinggu = closeModalPilihTPMinggu;
window.updateModalJPCount = updateModalJPCount;
window.simpanTPMinggu = simpanTPMinggu;
window.openModalKeterangan = openModalKeterangan;
window.closeModalKeterangan = closeModalKeterangan;
window.simpanKeteranganMinggu = simpanKeteranganMinggu;
window.autoDistribusiPromes = autoDistribusiPromes;
window.savePromesToFirebase = savePromesToFirebase;
window.printPromes = printPromes;