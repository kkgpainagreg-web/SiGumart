// Siswa Management

let siswaData = [];

// Load Siswa Data
async function loadSiswaData() {
    try {
        const siswaSnap = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .orderBy('kelas')
            .orderBy('nama')
            .get();
        
        siswaData = [];
        siswaSnap.forEach(doc => {
            siswaData.push({ id: doc.id, ...doc.data() });
        });

        // Populate filter options
        populateFilterSiswa();
        renderSiswaTable();

    } catch (error) {
        console.error('Error loading siswa:', error);
        // If index error, try without ordering
        try {
            const siswaSnap = await db.collection('users').doc(currentUser.uid)
                .collection('siswa')
                .where('tahunAjaran', '==', currentTahunAjaran)
                .get();
            
            siswaData = [];
            siswaSnap.forEach(doc => {
                siswaData.push({ id: doc.id, ...doc.data() });
            });
            siswaData.sort((a, b) => {
                if (a.kelas !== b.kelas) return a.kelas - b.kelas;
                return a.nama.localeCompare(b.nama);
            });
            
            populateFilterSiswa();
            renderSiswaTable();
        } catch (e) {
            showToast('Gagal memuat data siswa', 'error');
        }
    }
}

// Populate Filter Options
function populateFilterSiswa() {
    const kelasList = [...new Set(siswaData.map(s => s.kelas))].sort((a,b) => a-b);
    const rombelList = [...new Set(siswaData.map(s => s.rombel))].sort();

    const filterKelas = document.getElementById('filterKelas');
    filterKelas.innerHTML = '<option value="">Semua Kelas</option>' + 
        kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

    const filterRombel = document.getElementById('filterRombel');
    filterRombel.innerHTML = '<option value="">Semua Rombel</option>' + 
        rombelList.map(r => `<option value="${r}">${r}</option>`).join('');
}

// Filter Siswa
function filterSiswa() {
    const kelas = document.getElementById('filterKelas').value;
    const rombel = document.getElementById('filterRombel').value;
    const search = document.getElementById('searchSiswa').value.toLowerCase();

    const filtered = siswaData.filter(s => {
        if (kelas && s.kelas.toString() !== kelas) return false;
        if (rombel && s.rombel !== rombel) return false;
        if (search && !s.nama.toLowerCase().includes(search) && !s.nisn.includes(search)) return false;
        return true;
    });

    renderSiswaTable(filtered);
}

// Render Siswa Table
function renderSiswaTable(data = null) {
    const tbody = document.getElementById('tableSiswa');
    const displayData = data || siswaData;

    if (displayData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-users text-4xl text-gray-300 mb-3"></i>
                    <p>Belum ada data siswa</p>
                    <button onclick="showImportSiswa()" class="text-primary hover:underline mt-2">Import dari CSV</button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = displayData.map((siswa, index) => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-3 text-center">${index + 1}</td>
            <td class="px-4 py-3">${siswa.nisn || '-'}</td>
            <td class="px-4 py-3 font-medium">${siswa.nama}</td>
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${siswa.jk === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}">
                    ${siswa.jk}
                </span>
            </td>
            <td class="px-4 py-3 text-center">${siswa.kelas}</td>
            <td class="px-4 py-3 text-center">${siswa.rombel}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="editSiswa('${siswa.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="hapusSiswa('${siswa.id}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Tambah Siswa
function tambahSiswa() {
    const modal = `
        <div id="modalSiswa" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalSiswa')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Tambah Siswa</h3>
                
                <form onsubmit="saveSiswa(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                            <input type="text" id="siswaNISN" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                            <input type="text" id="siswaNama" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">L/P</label>
                                <select id="siswaJK" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    <option value="L">L</option>
                                    <option value="P">P</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                <select id="siswaKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    ${getKelasOptions()}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                                <input type="text" id="siswaRombel" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    placeholder="A" value="A" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button type="button" onclick="closeModal('modalSiswa')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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
}

// Save Siswa
async function saveSiswa(event) {
    event.preventDefault();
    showLoading(true);

    try {
        const data = {
            nisn: document.getElementById('siswaNISN').value.trim(),
            nama: document.getElementById('siswaNama').value.trim(),
            jk: document.getElementById('siswaJK').value,
            kelas: document.getElementById('siswaKelas').value,
            rombel: document.getElementById('siswaRombel').value.trim().toUpperCase(),
            tahunAjaran: currentTahunAjaran,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editId = document.getElementById('siswaNISN').dataset.editId;

        if (editId) {
            await db.collection('users').doc(currentUser.uid)
                .collection('siswa').doc(editId).update(data);
        } else {
            await db.collection('users').doc(currentUser.uid)
                .collection('siswa').add(data);
        }

        closeModal('modalSiswa');
        showToast('Data siswa berhasil disimpan', 'success');
        loadSiswaData();

    } catch (error) {
        console.error('Error saving siswa:', error);
        showToast('Gagal menyimpan data siswa', 'error');
    }

    showLoading(false);
}

// Edit Siswa
function editSiswa(id) {
    const siswa = siswaData.find(s => s.id === id);
    if (!siswa) return;

    tambahSiswa();

    setTimeout(() => {
        document.getElementById('siswaNISN').value = siswa.nisn || '';
        document.getElementById('siswaNISN').dataset.editId = id;
        document.getElementById('siswaNama').value = siswa.nama;
        document.getElementById('siswaJK').value = siswa.jk;
        document.getElementById('siswaKelas').value = siswa.kelas;
        document.getElementById('siswaRombel').value = siswa.rombel;
    }, 100);
}

// Hapus Siswa
async function hapusSiswa(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('siswa').doc(id).delete();
        
        showToast('Siswa berhasil dihapus', 'success');
        loadSiswaData();
    } catch (error) {
        console.error('Error deleting siswa:', error);
        showToast('Gagal menghapus siswa', 'error');
    }
    showLoading(false);
}

// Show Import Siswa Modal
function showImportSiswa() {
    const modal = `
        <div id="modalImportSiswa" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalImportSiswa')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Import Data Siswa dari CSV</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">URL Google Spreadsheet (CSV)</label>
                        <input type="url" id="importSiswaURL" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="https://docs.google.com/spreadsheets/d/...">
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-sm text-blue-700 font-medium mb-2"><i class="fas fa-info-circle mr-2"></i>Format CSV:</p>
                        <code class="text-xs bg-white px-2 py-1 rounded block">nisn,nama,jenis_kelamin,kelas,rombel</code>
                        <p class="text-xs text-blue-600 mt-2">Contoh: 0012345678,Ahmad Fauzi,L,5,A</p>
                    </div>

                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p class="text-sm text-yellow-700"><i class="fas fa-lightbulb mr-2"></i>
                            Pastikan Google Spreadsheet sudah di-share sebagai "Anyone with the link" dan dipublish ke web
                        </p>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="closeModal('modalImportSiswa')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button onclick="importSiswaCSV()" class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                        <i class="fas fa-file-import mr-2"></i>Import
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

// Import Siswa CSV
async function importSiswaCSV() {
    const url = document.getElementById('importSiswaURL').value.trim();
    if (!url) {
        showToast('Masukkan URL CSV', 'warning');
        return;
    }

    showLoading(true);
    try {
        const data = await parseCSVFromURL(url);
        
        if (data.length === 0) {
            showToast('Tidak ada data yang ditemukan', 'warning');
            showLoading(false);
            return;
        }

        let imported = 0;
        const batch = db.batch();

        for (const row of data) {
            const nama = row.nama || row.nama_siswa || row.name;
            const jk = row.jenis_kelamin || row.jk || row.gender || 'L';
            const kelas = row.kelas || row.class;
            const rombel = row.rombel || row.room || 'A';
            const nisn = row.nisn || '';

            if (nama && kelas) {
                const docRef = db.collection('users').doc(currentUser.uid)
                    .collection('siswa').doc();
                
                batch.set(docRef, {
                    nisn: nisn.toString().trim(),
                    nama: nama.trim(),
                    jk: jk.toString().toUpperCase().charAt(0) === 'P' ? 'P' : 'L',
                    kelas: kelas.toString().trim(),
                    rombel: rombel.toString().toUpperCase().trim(),
                    tahunAjaran: currentTahunAjaran,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                imported++;
            }
        }

        await batch.commit();
        closeModal('modalImportSiswa');
        showToast(`${imported} siswa berhasil diimport`, 'success');
        loadSiswaData();

    } catch (error) {
        console.error('Error importing siswa:', error);
        showToast('Gagal import: ' + error.message, 'error');
    }
    showLoading(false);
}