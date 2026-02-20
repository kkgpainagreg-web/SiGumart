// Jurnal Pembelajaran Management

let jurnalData = [];

// Load Jurnal Data
async function loadJurnalData() {
    try {
        // Populate kelas filter
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('type', '==', 'jadwal')
            .get();
        
        const kelasList = new Set();
        jadwalSnap.forEach(doc => {
            const data = doc.data();
            kelasList.add(data.kelas);
        });

        const jurnalKelas = document.getElementById('jurnalKelas');
        jurnalKelas.innerHTML = '<option value="">Pilih Kelas</option>' +
            [...kelasList].sort((a,b) => a-b).map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

        // Load jurnal
        const jurnalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jurnal')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .where('semester', '==', currentSemester)
            .orderBy('tanggal', 'desc')
            .get();
        
        jurnalData = [];
        jurnalSnap.forEach(doc => {
            jurnalData.push({ id: doc.id, ...doc.data() });
        });

        renderJurnalTable();

    } catch (error) {
        console.error('Error loading jurnal:', error);
        // Try without ordering
        try {
            const jurnalSnap = await db.collection('users').doc(currentUser.uid)
                .collection('jurnal')
                .where('tahunAjaran', '==', currentTahunAjaran)
                .get();
            
            jurnalData = [];
            jurnalSnap.forEach(doc => {
                jurnalData.push({ id: doc.id, ...doc.data() });
            });
            jurnalData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            
            renderJurnalTable();
        } catch(e) {
            showToast('Gagal memuat jurnal', 'error');
        }
    }
}

// Load Jurnal with Filter
function loadJurnal() {
    renderJurnalTable();
}

// Render Jurnal Table
function renderJurnalTable() {
    const tbody = document.getElementById('tableJurnal');
    const kelasFilter = document.getElementById('jurnalKelas').value;
    const bulanFilter = document.getElementById('jurnalBulan').value;
    
    let filtered = jurnalData;
    
    if (kelasFilter) {
        filtered = filtered.filter(j => j.kelas === kelasFilter);
    }
    if (bulanFilter) {
        filtered = filtered.filter(j => {
            const month = new Date(j.tanggal).getMonth() + 1;
            return month === parseInt(bulanFilter);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-book-open text-4xl text-gray-300 mb-3"></i>
                    <p>Belum ada data jurnal</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map((jurnal, index) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-3 py-3 text-center">${index + 1}</td>
            <td class="px-3 py-3 text-center">${jurnal.kelas}${jurnal.rombel || ''}</td>
            <td class="px-3 py-3">${jurnal.materi}</td>
            <td class="px-3 py-3 text-sm">${jurnal.tp || '-'}</td>
            <td class="px-3 py-3 text-center text-sm">
                <span class="text-green-600">H: ${jurnal.hadir || 0}</span><br>
                <span class="text-red-600">A: ${jurnal.alpha || 0}</span>
            </td>
            <td class="px-3 py-3 text-sm">${formatDate(jurnal.tanggal, 'long')}</td>
            <td class="px-3 py-3 text-sm">${jurnal.hasil || '-'}</td>
            <td class="px-3 py-3 text-center">
                <button onclick="editJurnal('${jurnal.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="hapusJurnal('${jurnal.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Tambah Jurnal
async function tambahJurnal() {
    // Get materi options from Promes/ATP
    const atpSnap = await db.collection('users').doc(currentUser.uid)
        .collection('atp')
        .where('tahunAjaran', '==', currentTahunAjaran)
        .where('semester', '==', currentSemester)
        .get();
    
    const materiOptions = [];
    atpSnap.forEach(doc => {
        const data = doc.data();
        materiOptions.push({
            bab: data.bab,
            tp: data.tp,
            kelas: data.kelas
        });
    });

    // Get kelas from jadwal
    const jadwalSnap = await db.collection('users').doc(currentUser.uid)
        .collection('jadwal')
        .where('type', '==', 'jadwal')
        .get();
    
    const kelasRombelList = [];
    jadwalSnap.forEach(doc => {
        const data = doc.data();
        kelasRombelList.push({ kelas: data.kelas, rombel: data.rombel });
    });

    const modal = `
        <div id="modalJurnal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalJurnal')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 modal-content" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Tambah Jurnal Pembelajaran</h3>
                
                <form onsubmit="saveJurnal(event)">
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input type="date" id="jurnalTanggal" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas / Rombel</label>
                            <select id="jurnalKelasRombel" class="w-full border border-gray-300 rounded-lg px-3 py-2" required onchange="loadTPOptions()">
                                <option value="">Pilih Kelas</option>
                                ${kelasRombelList.map(kr => `<option value="${kr.kelas}-${kr.rombel}">Kelas ${kr.kelas}${kr.rombel}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Materi / Bab</label>
                        <select id="jurnalMateriSelect" class="w-full border border-gray-300 rounded-lg px-3 py-2" onchange="updateTPFromMateri()">
                            <option value="">Pilih Materi dari Promes (opsional)</option>
                            ${[...new Set(materiOptions.map(m => m.bab))].map(bab => `<option value="${bab}">${bab}</option>`).join('')}
                        </select>
                        <input type="text" id="jurnalMateri" class="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2" 
                            placeholder="Atau ketik materi secara manual..." required>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                        <textarea id="jurnalTP" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="Tujuan pembelajaran..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-4 mt-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hadir</label>
                            <input type="number" id="jurnalHadir" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="0" min="0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Izin</label>
                            <input type="number" id="jurnalIzin" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="0" min="0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Sakit</label>
                            <input type="number" id="jurnalSakit" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="0" min="0">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Alpha</label>
                            <input type="number" id="jurnalAlpha" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="0" min="0">
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Hasil Pembelajaran</label>
                        <textarea id="jurnalHasil" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="Capaian dan catatan pembelajaran..."></textarea>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button type="button" onclick="closeModal('modalJurnal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
    
    // Store materi options for later use
    window.materiOptionsCache = materiOptions;
}

// Update TP from selected materi
function updateTPFromMateri() {
    const selectedBab = document.getElementById('jurnalMateriSelect').value;
    if (selectedBab && window.materiOptionsCache) {
        document.getElementById('jurnalMateri').value = selectedBab;
        
        const tpList = window.materiOptionsCache
            .filter(m => m.bab === selectedBab)
            .map(m => m.tp);
        
        if (tpList.length > 0) {
            document.getElementById('jurnalTP').value = tpList.join('\n');
        }
    }
}

// Save Jurnal
async function saveJurnal(event) {
    event.preventDefault();
    showLoading(true);

    try {
        const kelasRombel = document.getElementById('jurnalKelasRombel').value.split('-');
        
        const data = {
            tanggal: document.getElementById('jurnalTanggal').value,
            kelas: kelasRombel[0],
            rombel: kelasRombel[1] || '',
            materi: document.getElementById('jurnalMateri').value.trim(),
            tp: document.getElementById('jurnalTP').value.trim(),
            hadir: parseInt(document.getElementById('jurnalHadir').value) || 0,
            izin: parseInt(document.getElementById('jurnalIzin').value) || 0,
            sakit: parseInt(document.getElementById('jurnalSakit').value) || 0,
            alpha: parseInt(document.getElementById('jurnalAlpha').value) || 0,
            hasil: document.getElementById('jurnalHasil').value.trim(),
            semester: currentSemester,
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editId = document.getElementById('jurnalTanggal').dataset.editId;

        if (editId) {
            await db.collection('users').doc(currentUser.uid)
                .collection('jurnal').doc(editId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(currentUser.uid)
                .collection('jurnal').add(data);
        }

        closeModal('modalJurnal');
        showToast('Jurnal berhasil disimpan', 'success');
        loadJurnalData();

    } catch (error) {
        console.error('Error saving jurnal:', error);
        showToast('Gagal menyimpan jurnal', 'error');
    }

    showLoading(false);
}

// Edit Jurnal
async function editJurnal(id) {
    const jurnal = jurnalData.find(j => j.id === id);
    if (!jurnal) return;

    await tambahJurnal();

    setTimeout(() => {
        document.getElementById('jurnalTanggal').value = jurnal.tanggal;
        document.getElementById('jurnalTanggal').dataset.editId = id;
        document.getElementById('jurnalKelasRombel').value = `${jurnal.kelas}-${jurnal.rombel}`;
        document.getElementById('jurnalMateri').value = jurnal.materi;
        document.getElementById('jurnalTP').value = jurnal.tp || '';
        document.getElementById('jurnalHadir').value = jurnal.hadir || 0;
        document.getElementById('jurnalIzin').value = jurnal.izin || 0;
        document.getElementById('jurnalSakit').value = jurnal.sakit || 0;
        document.getElementById('jurnalAlpha').value = jurnal.alpha || 0;
        document.getElementById('jurnalHasil').value = jurnal.hasil || '';
    }, 100);
}

// Hapus Jurnal
async function hapusJurnal(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('jurnal').doc(id).delete();
        
        showToast('Jurnal berhasil dihapus', 'success');
        loadJurnalData();
    } catch (error) {
        console.error('Error deleting jurnal:', error);
        showToast('Gagal menghapus jurnal', 'error');
    }
    showLoading(false);
}

// Print Jurnal
function printJurnal() {
    const kelasFilter = document.getElementById('jurnalKelas').value;
    const bulanFilter = document.getElementById('jurnalBulan').value;
    
    let filtered = jurnalData;
    if (kelasFilter) filtered = filtered.filter(j => j.kelas === kelasFilter);
    if (bulanFilter) {
        filtered = filtered.filter(j => {
            const month = new Date(j.tanggal).getMonth() + 1;
            return month === parseInt(bulanFilter);
        });
    }

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Jurnal Pembelajaran</title>
            <style>
                @page { size: A4 landscape; margin: 15mm; }
                body { font-family: 'Times New Roman', serif; font-size: 11pt; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 6px; }
                th { background-color: #f0f0f0; }
                .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>JURNAL PEMBELAJARAN</h2>
                <p>Mata Pelajaran: Pendidikan Agama Islam dan Budi Pekerti</p>
                <p>Semester: ${currentSemester} | Tahun Pelajaran: ${currentTahunAjaran}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th width="4%">No</th>
                        <th width="8%">Kelas</th>
                        <th width="20%">Materi</th>
                        <th width="25%">Tujuan Pembelajaran</th>
                        <th width="10%">Kehadiran</th>
                        <th width="13%">Hari/Tanggal</th>
                        <th width="20%">Hasil Pembelajaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map((j, i) => `
                        <tr>
                            <td style="text-align: center;">${i + 1}</td>
                            <td style="text-align: center;">${j.kelas}${j.rombel}</td>
                            <td>${j.materi}</td>
                            <td>${j.tp || '-'}</td>
                            <td style="text-align: center;">H:${j.hadir} I:${j.izin}<br>S:${j.sakit} A:${j.alpha}</td>
                            <td>${formatDate(j.tanggal, 'long')}</td>
                            <td>${j.hasil || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            ${generateSignature()}
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}