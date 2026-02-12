// ============================================
// BANK SOAL MODULE
// Admin PAI Super App
// Support Teks Arab (RTL)
// ============================================

// === STATE ===
let soalList = [];
let currentSoalId = null;
let lastDoc = null;
let searchTimeout = null;
const LIMIT = 20;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeBankSoalPage();
});

// === INITIALIZE PAGE ===
async function initializeBankSoalPage() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadSoalList();
            loadStatistics();
            updateSidebarInfo();
        }
    });
}

// === UPDATE SIDEBAR INFO ===
async function updateSidebarInfo() {
    const userData = await getCurrentUserData();
    if (userData) {
        const name = userData.displayName || 'Guru PAI';
        document.getElementById('sidebarName').textContent = name;
        document.getElementById('sidebarEmail').textContent = userData.email;
        document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
    }
}

// === LOAD STATISTICS ===
async function loadStatistics() {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const snapshot = await collections.questions
            .where('teacherId', '==', userId)
            .get();
        
        let stats = { total: 0, pg: 0, essay: 0, isian: 0, praktik: 0 };
        
        snapshot.forEach(doc => {
            const data = doc.data();
            stats.total++;
            if (data.jenis === 'pg') stats.pg++;
            else if (data.jenis === 'essay') stats.essay++;
            else if (data.jenis === 'isian') stats.isian++;
            else if (data.jenis === 'praktik') stats.praktik++;
        });
        
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statPG').textContent = stats.pg;
        document.getElementById('statEssay').textContent = stats.essay;
        document.getElementById('statIsiSingkat').textContent = stats.isian;
        document.getElementById('statPraktik').textContent = stats.praktik;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// === LOAD SOAL LIST ===
async function loadSoalList(loadMore = false) {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const fase = document.getElementById('filterFase').value;
        const elemen = document.getElementById('filterElemen').value;
        const jenis = document.getElementById('filterJenis').value;
        const tingkat = document.getElementById('filterTingkat').value;
        const search = document.getElementById('filterSearch').value.toLowerCase().trim();
        
        let query = collections.questions.where('teacherId', '==', userId);
        
        if (fase) query = query.where('fase', '==', fase);
        if (elemen) query = query.where('elemen', '==', elemen);
        if (jenis) query = query.where('jenis', '==', jenis);
        if (tingkat) query = query.where('tingkat', '==', tingkat);
        
        query = query.orderBy('createdAt', 'desc');
        
        if (loadMore && lastDoc) {
            query = query.startAfter(lastDoc);
        }
        
        query = query.limit(LIMIT);
        
        const snapshot = await query.get();
        
        if (!loadMore) {
            soalList = [];
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Client-side search filter
            if (!search || 
                data.pertanyaan?.toLowerCase().includes(search) ||
                data.topik?.toLowerCase().includes(search) ||
                data.arab?.includes(search)) {
                soalList.push({ id: doc.id, ...data });
            }
        });
        
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        renderSoalList();
        
        // Show/hide load more button
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (snapshot.size >= LIMIT) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error loading soal:', error);
        showToast('Gagal memuat data soal', 'error');
    }
}

// === LOAD MORE SOAL ===
function loadMoreSoal() {
    loadSoalList(true);
}

// === DEBOUNCE SEARCH ===
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        lastDoc = null;
        loadSoalList();
    }, 500);
}

// === RENDER SOAL LIST ===
function renderSoalList() {
    const container = document.getElementById('soalList');
    document.getElementById('showingCount').textContent = soalList.length;
    
    if (soalList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <span class="text-5xl block mb-3">📚</span>
                <p class="font-medium">Belum ada soal</p>
                <button onclick="openSoalModal()" class="text-pai-green hover:underline mt-2">
                    + Tambah Soal Baru
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = soalList.map((soal, index) => {
        const jenisLabel = getJenisLabel(soal.jenis);
        const tingkatBadge = getTingkatBadge(soal.tingkat);
        const elemenLabel = getElemenLabel(soal.elemen);
        
        // Truncate pertanyaan
        const pertanyaanShort = soal.pertanyaan.length > 150 
            ? soal.pertanyaan.substring(0, 150) + '...' 
            : soal.pertanyaan;
        
        return `
            <div onclick="viewSoal('${soal.id}')" 
                 class="bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="flex-shrink-0 text-center">
                        <div class="w-12 h-12 bg-pai-light rounded-xl flex items-center justify-center mx-auto">
                            <span class="text-lg font-bold text-pai-green">${index + 1}</span>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span class="badge badge-info">Fase ${soal.fase}</span>
                            <span class="badge badge-success">${elemenLabel}</span>
                            <span class="badge ${jenisLabel.badge}">${jenisLabel.text}</span>
                            <span class="badge ${tingkatBadge.class}">${tingkatBadge.text}</span>
                        </div>
                        
                        ${soal.arab ? `
                            <div class="arabic-text bg-gray-50 rounded-lg p-3 mb-2">
                                ${soal.arab}
                            </div>
                        ` : ''}
                        
                        <p class="text-gray-800 mb-2">${pertanyaanShort}</p>
                        
                        ${soal.topik ? `
                            <p class="text-sm text-gray-500">📌 ${soal.topik}</p>
                        ` : ''}
                    </div>
                    <div class="flex-shrink-0 text-right">
                        <div class="text-lg font-bold text-pai-green">${soal.skor || 10}</div>
                        <div class="text-xs text-gray-500">poin</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === GET JENIS LABEL ===
function getJenisLabel(jenis) {
    const labels = {
        'pg': { text: 'Pilihan Ganda', badge: 'bg-blue-100 text-blue-700' },
        'essay': { text: 'Essay', badge: 'bg-yellow-100 text-yellow-700' },
        'isian': { text: 'Isian Singkat', badge: 'bg-purple-100 text-purple-700' },
        'praktik': { text: 'Praktik/Hafalan', badge: 'bg-green-100 text-green-700' }
    };
    return labels[jenis] || { text: jenis, badge: 'bg-gray-100 text-gray-700' };
}

// === GET TINGKAT BADGE ===
function getTingkatBadge(tingkat) {
    const badges = {
        'mudah': { text: 'Mudah', class: 'bg-green-100 text-green-700' },
        'sedang': { text: 'Sedang', class: 'bg-yellow-100 text-yellow-700' },
        'sulit': { text: 'Sulit', class: 'bg-red-100 text-red-700' }
    };
    return badges[tingkat] || { text: tingkat, class: 'bg-gray-100 text-gray-700' };
}

// === GET ELEMEN LABEL ===
function getElemenLabel(elemen) {
    const labels = {
        'alquranHadis': "Al-Qur'an & Hadis",
        'akidah': 'Akidah',
        'akhlak': 'Akhlak',
        'fikih': 'Fikih',
        'sejarah': 'Sejarah Islam'
    };
    return labels[elemen] || elemen || '-';
}

// === MODAL FUNCTIONS ===
function openSoalModal() {
    document.getElementById('soalModalTitle').textContent = 'Tambah Soal Baru';
    document.getElementById('formSoal').reset();
    document.getElementById('soalId').value = '';
    document.getElementById('hasArabic').checked = false;
    document.getElementById('arabicInputContainer').classList.add('hidden');
    document.getElementById('pgOptions').classList.add('hidden');
    document.getElementById('kunciJawabanContainer').classList.remove('hidden');
    document.getElementById('soalModal').classList.add('active');
}

function closeSoalModal() {
    document.getElementById('soalModal').classList.remove('active');
}

// === TOGGLE JENIS OPTIONS ===
function toggleJenisOptions() {
    const jenis = document.getElementById('soalJenis').value;
    const pgOptions = document.getElementById('pgOptions');
    const kunciContainer = document.getElementById('kunciJawabanContainer');
    
    if (jenis === 'pg') {
        pgOptions.classList.remove('hidden');
        kunciContainer.classList.add('hidden');
    } else {
        pgOptions.classList.add('hidden');
        kunciContainer.classList.remove('hidden');
    }
}

// === TOGGLE ARABIC INPUT ===
function toggleArabicInput() {
    const hasArabic = document.getElementById('hasArabic').checked;
    const container = document.getElementById('arabicInputContainer');
    
    if (hasArabic) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
        document.getElementById('soalArab').value = '';
    }
}

// === SAVE SOAL ===
async function saveSoal() {
    const soalId = document.getElementById('soalId').value;
    const fase = document.getElementById('soalFase').value;
    const elemen = document.getElementById('soalElemen').value;
    const jenis = document.getElementById('soalJenis').value;
    const tingkat = document.getElementById('soalTingkat').value;
    const arab = document.getElementById('soalArab').value.trim();
    const pertanyaan = document.getElementById('soalPertanyaan').value.trim();
    const topik = document.getElementById('soalTopik').value.trim();
    const skor = parseInt(document.getElementById('soalSkor').value) || 10;
    const pembahasan = document.getElementById('soalPembahasan').value.trim();
    
    if (!fase || !elemen || !jenis || !pertanyaan) {
        showToast('Lengkapi data yang wajib!', 'error');
        return;
    }
    
    const data = {
        fase,
        elemen,
        jenis,
        tingkat,
        arab,
        pertanyaan,
        topik,
        skor,
        pembahasan,
        teacherId: auth.currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Handle PG options
    if (jenis === 'pg') {
        data.opsiA = document.getElementById('opsiA').value.trim();
        data.opsiB = document.getElementById('opsiB').value.trim();
        data.opsiC = document.getElementById('opsiC').value.trim();
        data.opsiD = document.getElementById('opsiD').value.trim();
        
        const jawabanBenar = document.querySelector('input[name="jawabanBenar"]:checked');
        data.jawabanBenar = jawabanBenar ? jawabanBenar.value : '';
        
        if (!data.opsiA || !data.opsiB || !data.jawabanBenar) {
            showToast('Lengkapi pilihan jawaban dan pilih jawaban yang benar!', 'error');
            return;
        }
    } else {
        data.kunci = document.getElementById('soalKunci').value.trim();
    }
    
    try {
        if (soalId) {
            await collections.questions.doc(soalId).update(data);
            showToast('Soal berhasil diperbarui!', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await collections.questions.add(data);
            showToast('Soal berhasil ditambahkan!', 'success');
        }
        
        closeSoalModal();
        lastDoc = null;
        await loadSoalList();
        loadStatistics();
        
    } catch (error) {
        console.error('Error saving soal:', error);
        showToast('Gagal menyimpan soal', 'error');
    }
}

// === VIEW SOAL ===
function viewSoal(id) {
    const soal = soalList.find(s => s.id === id);
    if (!soal) return;
    
    currentSoalId = id;
    
    const jenisLabel = getJenisLabel(soal.jenis);
    const tingkatBadge = getTingkatBadge(soal.tingkat);
    const elemenLabel = getElemenLabel(soal.elemen);
    
    let jawabanHtml = '';
    
    if (soal.jenis === 'pg') {
        jawabanHtml = `
            <div class="space-y-2">
                <div class="flex items-center gap-2 ${soal.jawabanBenar === 'A' ? 'text-green-600 font-bold' : ''}">
                    <span class="w-6">A.</span>
                    <span>${soal.opsiA || '-'}</span>
                    ${soal.jawabanBenar === 'A' ? '<span class="text-green-600">✓</span>' : ''}
                </div>
                <div class="flex items-center gap-2 ${soal.jawabanBenar === 'B' ? 'text-green-600 font-bold' : ''}">
                    <span class="w-6">B.</span>
                    <span>${soal.opsiB || '-'}</span>
                    ${soal.jawabanBenar === 'B' ? '<span class="text-green-600">✓</span>' : ''}
                </div>
                <div class="flex items-center gap-2 ${soal.jawabanBenar === 'C' ? 'text-green-600 font-bold' : ''}">
                    <span class="w-6">C.</span>
                    <span>${soal.opsiC || '-'}</span>
                    ${soal.jawabanBenar === 'C' ? '<span class="text-green-600">✓</span>' : ''}
                </div>
                <div class="flex items-center gap-2 ${soal.jawabanBenar === 'D' ? 'text-green-600 font-bold' : ''}">
                    <span class="w-6">D.</span>
                    <span>${soal.opsiD || '-'}</span>
                    ${soal.jawabanBenar === 'D' ? '<span class="text-green-600">✓</span>' : ''}
                </div>
            </div>
        `;
    } else if (soal.kunci) {
        jawabanHtml = `<p class="text-gray-700 whitespace-pre-line">${soal.kunci}</p>`;
    }
    
    document.getElementById('soalDetailContent').innerHTML = `
        <div class="space-y-4">
            <!-- Info -->
            <div class="flex flex-wrap gap-2">
                <span class="badge badge-info">Fase ${soal.fase}</span>
                <span class="badge badge-success">${elemenLabel}</span>
                <span class="badge ${jenisLabel.badge}">${jenisLabel.text}</span>
                <span class="badge ${tingkatBadge.class}">${tingkatBadge.text}</span>
                <span class="badge bg-gray-100 text-gray-700">${soal.skor || 10} poin</span>
            </div>
            
            ${soal.topik ? `
                <div class="text-sm text-gray-600">
                    <strong>Topik:</strong> ${soal.topik}
                </div>
            ` : ''}
            
            <!-- Teks Arab -->
            ${soal.arab ? `
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="arabic-text text-2xl leading-loose">
                        ${soal.arab}
                    </div>
                </div>
            ` : ''}
            
            <!-- Pertanyaan -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-2">Pertanyaan:</h4>
                <p class="text-gray-700 whitespace-pre-line">${soal.pertanyaan}</p>
            </div>
            
            <!-- Jawaban -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-2">
                    ${soal.jenis === 'pg' ? 'Pilihan Jawaban:' : 'Kunci Jawaban:'}
                </h4>
                ${jawabanHtml || '<p class="text-gray-500">-</p>'}
            </div>
            
            <!-- Pembahasan -->
            ${soal.pembahasan ? `
                <div class="bg-yellow-50 rounded-lg p-4">
                    <h4 class="font-semibold text-yellow-800 mb-2">💡 Pembahasan:</h4>
                    <p class="text-gray-700 whitespace-pre-line">${soal.pembahasan}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('soalDetailModal').classList.add('active');
}

function closeSoalDetailModal() {
    document.getElementById('soalDetailModal').classList.remove('active');
    currentSoalId = null;
}

// === EDIT SOAL ===
function editSoal() {
    const soal = soalList.find(s => s.id === currentSoalId);
    if (!soal) return;
    
    closeSoalDetailModal();
    
    document.getElementById('soalModalTitle').textContent = 'Edit Soal';
    document.getElementById('soalId').value = soal.id;
    document.getElementById('soalFase').value = soal.fase;
    document.getElementById('soalElemen').value = soal.elemen;
    document.getElementById('soalJenis').value = soal.jenis;
    document.getElementById('soalTingkat').value = soal.tingkat || 'mudah';
    document.getElementById('soalArab').value = soal.arab || '';
    document.getElementById('soalPertanyaan').value = soal.pertanyaan;
    document.getElementById('soalTopik').value = soal.topik || '';
    document.getElementById('soalSkor').value = soal.skor || 10;
    document.getElementById('soalPembahasan').value = soal.pembahasan || '';
    
    // Toggle Arabic input
    if (soal.arab) {
        document.getElementById('hasArabic').checked = true;
        document.getElementById('arabicInputContainer').classList.remove('hidden');
    } else {
        document.getElementById('hasArabic').checked = false;
        document.getElementById('arabicInputContainer').classList.add('hidden');
    }
    
    // Handle jenis-specific fields
    toggleJenisOptions();
    
    if (soal.jenis === 'pg') {
        document.getElementById('opsiA').value = soal.opsiA || '';
        document.getElementById('opsiB').value = soal.opsiB || '';
        document.getElementById('opsiC').value = soal.opsiC || '';
        document.getElementById('opsiD').value = soal.opsiD || '';
        
        if (soal.jawabanBenar) {
            const radio = document.querySelector(`input[name="jawabanBenar"][value="${soal.jawabanBenar}"]`);
            if (radio) radio.checked = true;
        }
    } else {
        document.getElementById('soalKunci').value = soal.kunci || '';
    }
    
    document.getElementById('soalModal').classList.add('active');
}

// === DELETE SOAL ===
async function deleteSoal() {
    if (!currentSoalId) return;
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    
    try {
        await collections.questions.doc(currentSoalId).delete();
        showToast('Soal berhasil dihapus!', 'success');
        
        closeSoalDetailModal();
        lastDoc = null;
        await loadSoalList();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting soal:', error);
        showToast('Gagal menghapus soal', 'error');
    }
}

// === DUPLICATE SOAL ===
async function duplicateSoal() {
    const soal = soalList.find(s => s.id === currentSoalId);
    if (!soal) return;
    
    try {
        const newData = { ...soal };
        delete newData.id;
        newData.pertanyaan = '[SALINAN] ' + newData.pertanyaan;
        newData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        newData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        await collections.questions.add(newData);
        
        showToast('Soal berhasil diduplikasi!', 'success');
        closeSoalDetailModal();
        lastDoc = null;
        await loadSoalList();
        loadStatistics();
        
    } catch (error) {
        console.error('Error duplicating soal:', error);
        showToast('Gagal menduplikasi soal', 'error');
    }
}

// === EXPORT SOAL ===
function exportSoal() {
    if (soalList.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    let csv = ['No,Fase,Elemen,Jenis,Tingkat,Pertanyaan,Jawaban,Skor'];
    
    soalList.forEach((s, index) => {
        let jawaban = '';
        if (s.jenis === 'pg') {
            jawaban = s.jawabanBenar || '-';
        } else {
            jawaban = (s.kunci || '-').replace(/"/g, '""').replace(/\n/g, ' ');
        }
        
        csv.push([
            index + 1,
            `"Fase ${s.fase}"`,
            `"${getElemenLabel(s.elemen)}"`,
            `"${getJenisLabel(s.jenis).text}"`,
            `"${s.tingkat || '-'}"`,
            `"${s.pertanyaan.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
            `"${jawaban}"`,
            s.skor || 10
        ].join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `bank_soal_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('File berhasil diunduh!', 'success');
}

// === SIDEBAR TOGGLE ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
}

console.log('✅ Bank Soal module initialized');