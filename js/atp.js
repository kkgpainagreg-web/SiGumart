// ATP (Alur Tujuan Pembelajaran) Management

let atpData = [];

// Load ATP Data
async function loadATPData() {
    try {
        // Populate mapel filter
        const mapelSelect = document.getElementById('filterMapelATP');
        const mapelList = window.profilData?.mataPelajaran || [];
        if (mapelSelect) {
            mapelSelect.innerHTML = '<option value="">Semua Mapel</option>' +
                mapelList.map(m => `<option value="${m.nama}">${m.nama}</option>`).join('');
        }

        // Load ATP
        const atpSnap = await db.collection('users').doc(currentUser.uid)
            .collection('atp')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        atpData = [];
        atpSnap.forEach(doc => {
            atpData.push({ id: doc.id, ...doc.data() });
        });

        renderATPList();

    } catch (error) {
        console.error('Error loading ATP:', error);
        showToast('Gagal memuat ATP', 'error');
    }
}

// Filter ATP
function filterATP() {
    renderATPList();
}

// Render ATP List
function renderATPList() {
    const container = document.getElementById('atpContainer');
    if (!container) return;
    
    const fase = document.getElementById('filterFase')?.value || '';
    const mapel = document.getElementById('filterMapelATP')?.value || '';

    let filtered = atpData;
    if (fase) filtered = filtered.filter(a => a.fase === fase);
    if (mapel) filtered = filtered.filter(a => a.mapel === mapel);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm p-8 text-center">
                <i class="fas fa-route text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 mb-4">Belum ada ATP</p>
                <div class="flex justify-center gap-4">
                    <button onclick="loadCPDefault()" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        <i class="fas fa-database mr-2"></i>Load CP PAI
                    </button>
                    <button onclick="tambahTP()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                        <i class="fas fa-plus mr-2"></i>Tambah Manual
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // Group by fase and bab
    const grouped = {};
    filtered.forEach(tp => {
        const key = `${tp.fase}-${tp.bab}`;
        if (!grouped[key]) {
            grouped[key] = { fase: tp.fase, bab: tp.bab, mapel: tp.mapel, kelas: tp.kelas, items: [] };
        }
        grouped[key].items.push(tp);
    });

    container.innerHTML = Object.values(grouped).map(group => `
        <div class="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div class="bg-gradient-to-r from-primary to-blue-600 text-white p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-xs font-medium bg-white/20 px-2 py-1 rounded">Fase ${group.fase} | Kelas ${group.kelas || '-'}</span>
                        <h3 class="font-semibold mt-1">${group.bab}</h3>
                        <p class="text-sm text-blue-100">${group.mapel || '-'}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold">${group.items.reduce((sum, i) => sum + (parseInt(i.jp) || 0), 0)}</p>
                        <p class="text-xs text-blue-100">Total JP</p>
                    </div>
                </div>
            </div>
            <div class="divide-y">
                ${group.items.map(tp => `
                    <div class="p-4 hover:bg-gray-50 flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-gray-800">${tp.tp}</p>
                            <p class="text-sm text-gray-500 mt-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs mr-2">${tp.jp} JP</span>
                                Semester ${tp.semester}
                            </p>
                        </div>
                        <div class="flex gap-2 ml-4">
                            <button onclick="editTP('${tp.id}')" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                            <button onclick="hapusTP('${tp.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Print ATP
function printATP() {
    const fase = document.getElementById('filterFase')?.value || '';
    
    let filtered = atpData;
    if (fase) filtered = filtered.filter(a => a.fase === fase);
    
    // Group by bab
    const grouped = {};
    filtered.forEach(tp => {
        if (!grouped[tp.bab]) {
            grouped[tp.bab] = { bab: tp.bab, semester: tp.semester, items: [] };
        }
        grouped[tp.bab].items.push(tp);
    });

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ATP - Alur Tujuan Pembelajaran</title>
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                h2 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                th { background-color: #f0f0f0; }
                .info-table { border: none; margin-bottom: 15px; }
                .info-table td { border: none; padding: 3px; }
            </style>
        </head>
        <body>
            <h2>ALUR TUJUAN PEMBELAJARAN (ATP)<br>PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI</h2>
            
            <table class="info-table">
                <tr><td width="150">Satuan Pendidikan</td><td>: ${window.profilData?.namaSekolah || '-'}</td></tr>
                <tr><td>Fase</td><td>: ${fase || 'Semua Fase'}</td></tr>
                <tr><td>Tahun Ajaran</td><td>: ${currentTahunAjaran}</td></tr>
            </table>
            
            <table>
                <thead>
                    <tr>
                        <th width="5%">No</th>
                        <th width="10%">Semester</th>
                        <th width="30%">Bab / Materi Pokok</th>
                        <th width="45%">Tujuan Pembelajaran</th>
                        <th width="10%">Alokasi JP</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(grouped).map((group, idx) => `
                        ${group.items.map((tp, i) => `
                            <tr>
                                ${i === 0 ? `<td rowspan="${group.items.length}" style="text-align:center;">${idx + 1}</td>` : ''}
                                ${i === 0 ? `<td rowspan="${group.items.length}" style="text-align:center;">${group.semester}</td>` : ''}
                                ${i === 0 ? `<td rowspan="${group.items.length}">${group.bab}</td>` : ''}
                                <td>${tp.tp}</td>
                                ${i === 0 ? `<td rowspan="${group.items.length}" style="text-align:center;">${group.items.reduce((s, t) => s + (parseInt(t.jp) || 0), 0)} JP</td>` : ''}
                            </tr>
                        `).join('')}
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 45%;">
                    Mengetahui,<br>Kepala Sekolah
                    <div style="margin-top: 60px; text-decoration: underline; font-weight: bold;">
                        ${window.profilData?.namaKepsek || '............................'}
                    </div>
                    NIP. ${window.profilData?.nipKepsek || '............................'}
                </div>
                <div style="text-align: center; width: 45%;">
                    ${window.profilData?.kotaSekolah || 'Kudus'}, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br>
                    Guru PAI & BP
                    <div style="margin-top: 60px; text-decoration: underline; font-weight: bold;">
                        ${window.profilData?.namaGuru || '............................'}
                    </div>
                    NIP. ${window.profilData?.nipGuru || '............................'}
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Load CP Default (PAI)
function loadCPDefault() {
    const modal = `
        <div id="modalLoadCP" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalLoadCP')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Load CP PAI Default</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                        <select id="loadCPKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            ${getKelasOptions()}
                        </select>
                    </div>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-sm text-blue-700"><i class="fas fa-info-circle mr-2"></i>
                            Data CP PAI akan dimuat dari database kurikulum yang tersedia.
                        </p>
                    </div>
                </div>
                <div class="flex gap-3 mt-6">
                    <button onclick="closeModal('modalLoadCP')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                    <button onclick="confirmLoadCP()" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><i class="fas fa-download mr-2"></i>Load</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

// Confirm Load CP
async function confirmLoadCP() {
    const kelas = document.getElementById('loadCPKelas')?.value;
    const jenjang = window.profilData?.jenjang || 'SD';
    
    const kurikulum = getKurikulumData(kelas, jenjang);
    
    if (!kurikulum) {
        showToast('Data kurikulum tidak ditemukan', 'error');
        return;
    }

    showLoading(true);

    try {
        const batch = db.batch();
        const fase = getFaseFromKelas(kelas, jenjang);
        const mapel = 'Pendidikan Agama Islam dan Budi Pekerti';
        let count = 0;

        ['Gasal', 'Genap'].forEach(semester => {
            if (kurikulum[semester]) {
                kurikulum[semester].forEach(bab => {
                    bab.sub.forEach(sub => {
                        const docRef = db.collection('users').doc(currentUser.uid).collection('atp').doc();
                        batch.set(docRef, {
                            fase, kelas, semester,
                            bab: bab.bab,
                            tp: sub[0],
                            jp: sub[1],
                            mapel,
                            tahunAjaran: currentTahunAjaran,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        count++;
                    });
                });
            }
        });

        await batch.commit();
        closeModal('modalLoadCP');
        showToast(`${count} TP berhasil dimuat`, 'success');
        loadATPData();

        const statusATP = document.getElementById('statusATP');
        if (statusATP) {
            statusATP.classList.remove('bg-red-500');
            statusATP.classList.add('bg-green-500');
        }

    } catch (error) {
        console.error('Error loading CP:', error);
        showToast('Gagal memuat CP', 'error');
    }

    showLoading(false);
}

// Tambah TP
function tambahTP() {
    const mapelOptions = window.profilData?.mataPelajaran?.map(m => 
        `<option value="${m.nama}">${m.nama}</option>`
    ).join('') || '<option value="Pendidikan Agama Islam dan Budi Pekerti">PAI</option>';

    const modal = `
        <div id="modalTP" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalTP')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 modal-content" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Tambah Tujuan Pembelajaran</h3>
                <form onsubmit="saveTP(event)">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                            <select id="tpFase" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                <option value="A">Fase A</option><option value="B">Fase B</option><option value="C">Fase C</option>
                                <option value="D">Fase D</option><option value="E">Fase E</option><option value="F">Fase F</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                            <select id="tpKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>${getKelasOptions()}</select>
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                        <select id="tpMapel" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>${mapelOptions}</select>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Bab / Materi Pokok</label>
                        <input type="text" id="tpBab" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Contoh: 1. Aku Cinta Al-Qur'an" required>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                        <textarea id="tpTP" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Deskripsi TP..." required></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Alokasi JP</label>
                            <input type="number" id="tpJP" class="w-full border border-gray-300 rounded-lg px-3 py-2" value="4" min="1" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select id="tpSemester" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                <option value="Gasal">Gasal</option><option value="Genap">Genap</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="button" onclick="closeModal('modalTP')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

// Save TP
async function saveTP(event) {
    event.preventDefault();
    showLoading(true);

    try {
        const data = {
            fase: document.getElementById('tpFase')?.value || '',
            kelas: document.getElementById('tpKelas')?.value || '',
            mapel: document.getElementById('tpMapel')?.value || '',
            bab: document.getElementById('tpBab')?.value.trim() || '',
            tp: document.getElementById('tpTP')?.value.trim() || '',
            jp: parseInt(document.getElementById('tpJP')?.value) || 4,
            semester: document.getElementById('tpSemester')?.value || 'Gasal',
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editId = document.getElementById('tpBab')?.dataset.editId;

        if (editId) {
            await db.collection('users').doc(currentUser.uid).collection('atp').doc(editId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(currentUser.uid).collection('atp').add(data);
        }

        closeModal('modalTP');
        showToast('TP berhasil disimpan', 'success');
        loadATPData();

    } catch (error) {
        console.error('Error saving TP:', error);
        showToast('Gagal menyimpan TP', 'error');
    }

    showLoading(false);
}

// Edit TP
function editTP(id) {
    const tp = atpData.find(t => t.id === id);
    if (!tp) return;

    tambahTP();

    setTimeout(() => {
        const faseEl = document.getElementById('tpFase');
        if (faseEl) faseEl.value = tp.fase || '';
        
        const kelasEl = document.getElementById('tpKelas');
        if (kelasEl) kelasEl.value = tp.kelas || '';
        
        const mapelEl = document.getElementById('tpMapel');
        if (mapelEl) mapelEl.value = tp.mapel || '';
        
        const babEl = document.getElementById('tpBab');
        if (babEl) {
            babEl.value = tp.bab || '';
            babEl.dataset.editId = id;
        }
        
        const tpEl = document.getElementById('tpTP');
        if (tpEl) tpEl.value = tp.tp || '';
        
        const jpEl = document.getElementById('tpJP');
        if (jpEl) jpEl.value = tp.jp || 4;
        
        const semesterEl = document.getElementById('tpSemester');
        if (semesterEl) semesterEl.value = tp.semester || 'Gasal';
    }, 100);
}

// Hapus TP
async function hapusTP(id) {
    if (!confirm('Hapus TP ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid).collection('atp').doc(id).delete();
        showToast('TP dihapus', 'success');
        loadATPData();
    } catch (error) {
        showToast('Gagal menghapus', 'error');
    }
    showLoading(false);
}
