// js/prota-promes.js
// =====================================================
// PROGRAM TAHUNAN & PROGRAM SEMESTER MODULE
// =====================================================

const ProtaPromes = {
    protaData: [],
    promesData: [],

    init: async () => {
        ProtaPromes.renderProta();
        ProtaPromes.renderPromes();
        await ProtaPromes.loadProta();
        await ProtaPromes.loadPromes();
    },

    // ==================== PROGRAM TAHUNAN ====================
    renderProta: () => {
        const container = document.getElementById('tab-prota');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex gap-3">
                            <select id="prota-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Pilih Mapel</option>
                            </select>
                            <select id="prota-rombel" class="px-4 py-2 border rounded-lg">
                                <option value="">Pilih Rombel</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="ProtaPromes.generateProta()" 
                                class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600">
                                ⚡ Generate dari ATP
                            </button>
                            <button onclick="ProtaPromes.showAddProtaModal()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                                ➕ Tambah Manual
                            </button>
                            <button onclick="ProtaPromes.printProta()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Prota Content -->
                <div id="prota-content" class="bg-white rounded-xl shadow">
                    <div class="p-6 text-center text-gray-400">
                        Pilih mata pelajaran dan rombel untuk melihat Program Tahunan
                    </div>
                </div>

                <!-- Print Template -->
                <div id="prota-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1>PROGRAM TAHUNAN (PROTA)</h1>
                        <p id="prota-print-school"></p>
                        <p id="prota-print-tahun"></p>
                    </div>
                    <div id="prota-print-info" class="info-box"></div>
                    <table id="prota-print-table"></table>
                    <div class="signature-area">
                        <div class="signature-box">
                            <p>Mengetahui,</p>
                            <p>Kepala Sekolah</p>
                            <div class="signature-line"></div>
                            <p>________________________</p>
                            <p>NIP. </p>
                        </div>
                        <div class="signature-box right">
                            <p id="prota-print-date"></p>
                            <p>Guru Mata Pelajaran</p>
                            <div class="signature-line"></div>
                            <p id="prota-print-teacher"></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Prota Modal -->
            <div id="prota-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold" id="prota-modal-title">Tambah Item Prota</h3>
                        <button onclick="ProtaPromes.closeProtaModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>
                    <form id="prota-form" class="space-y-4">
                        <input type="hidden" id="prota-edit-id">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                                <select id="prota-form-mapel" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih Mapel</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Rombel *</label>
                                <select id="prota-form-rombel" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih Rombel</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Semester *</label>
                            <select id="prota-semester" required class="w-full px-3 py-2 border rounded-lg">
                                <option value="1">Semester 1 (Ganjil)</option>
                                <option value="2">Semester 2 (Genap)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Kompetensi/Materi Pokok *</label>
                            <textarea id="prota-materi" rows="3" required class="w-full px-3 py-2 border rounded-lg"
                                placeholder="Masukkan kompetensi atau materi pokok..."></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Alokasi Waktu (JP) *</label>
                                <input type="number" id="prota-waktu" min="1" required class="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Contoh: 4">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Urutan *</label>
                                <input type="number" id="prota-urutan" min="1" required class="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Contoh: 1">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Keterangan</label>
                            <input type="text" id="prota-keterangan" class="w-full px-3 py-2 border rounded-lg"
                                placeholder="Keterangan tambahan (opsional)">
                        </div>
                        <div class="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onclick="ProtaPromes.closeProtaModal()" 
                                class="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                            <button type="submit" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">💾 Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('prota-form').addEventListener('submit', ProtaPromes.saveProta);
        document.getElementById('prota-mapel').addEventListener('change', ProtaPromes.loadProtaContent);
        document.getElementById('prota-rombel').addEventListener('change', ProtaPromes.loadProtaContent);

        ProtaPromes.updateProtaDropdowns();
    },

    updateProtaDropdowns: () => {
        const mapelOptions = MasterData.subjects.map(s => 
            `<option value="${s.id}">${s.nama}</option>`
        ).join('');
        const rombelOptions = MasterData.rombel.map(r => 
            `<option value="${r.id}">${r.nama}</option>`
        ).join('');

        document.getElementById('prota-mapel').innerHTML = '<option value="">Pilih Mapel</option>' + mapelOptions;
        document.getElementById('prota-rombel').innerHTML = '<option value="">Pilih Rombel</option>' + rombelOptions;
        
        if (document.getElementById('prota-form-mapel')) {
            document.getElementById('prota-form-mapel').innerHTML = '<option value="">Pilih Mapel</option>' + mapelOptions;
        }
        if (document.getElementById('prota-form-rombel')) {
            document.getElementById('prota-form-rombel').innerHTML = '<option value="">Pilih Rombel</option>' + rombelOptions;
        }
    },

    loadProta: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.PROTA)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('semester')
                .orderBy('urutan')
                .get();

            ProtaPromes.protaData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Refresh content if filters are selected
            const mapelId = document.getElementById('prota-mapel').value;
            const rombelId = document.getElementById('prota-rombel').value;
            if (mapelId && rombelId) {
                ProtaPromes.loadProtaContent();
            }
        } catch (error) {
            console.error('Error loading Prota:', error);
        }
    },

    loadProtaContent: () => {
        const mapelId = document.getElementById('prota-mapel').value;
        const rombelId = document.getElementById('prota-rombel').value;
        const container = document.getElementById('prota-content');

        if (!mapelId || !rombelId) {
            container.innerHTML = '<div class="p-6 text-center text-gray-400">Pilih mata pelajaran dan rombel untuk melihat Program Tahunan</div>';
            return;
        }

        const filtered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId
        );

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center">
                    <div class="text-6xl mb-4">📋</div>
                    <p class="text-gray-500 mb-4">Belum ada data Program Tahunan untuk <strong>${subject?.nama || ''}</strong> - <strong>${rombel?.nama || ''}</strong></p>
                    <div class="flex justify-center gap-3">
                        <button onclick="ProtaPromes.generateProta()" 
                            class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600">
                            ⚡ Generate dari ATP
                        </button>
                        <button onclick="ProtaPromes.showAddProtaModal()" 
                            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                            ➕ Tambah Manual
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Group by semester
        const semester1 = filtered.filter(p => p.semester === 1).sort((a, b) => a.urutan - b.urutan);
        const semester2 = filtered.filter(p => p.semester === 2).sort((a, b) => a.urutan - b.urutan);

        const totalJPSem1 = semester1.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);
        const totalJPSem2 = semester2.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);
        const totalJPTahun = totalJPSem1 + totalJPSem2;

        container.innerHTML = `
            <div class="p-6">
                <!-- Header Info -->
                <div class="mb-6 pb-4 border-b">
                    <h4 class="font-semibold text-xl text-gray-800">${subject?.nama || ''}</h4>
                    <p class="text-gray-500">Kelas/Rombel: ${rombel?.nama || ''} | Tahun Ajaran ${Utils.getTahunAjaran()}</p>
                </div>

                <!-- Semester 1 -->
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-3">
                        <h5 class="font-semibold text-lg text-blue-700 flex items-center">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2">Semester 1</span>
                            Ganjil
                        </h5>
                        <span class="text-sm text-gray-500">Total: ${totalJPSem1} JP</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr class="bg-blue-50">
                                    <th class="border border-gray-300 px-4 py-3 text-left w-16">No</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left">Kompetensi/Materi Pokok</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center w-28">Alokasi (JP)</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left w-40">Keterangan</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${semester1.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="border border-gray-300 px-4 py-6 text-center text-gray-400">
                                            Belum ada data untuk Semester 1
                                        </td>
                                    </tr>
                                ` : semester1.map((p, i) => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="border border-gray-300 px-4 py-3 text-center font-medium">${i + 1}</td>
                                        <td class="border border-gray-300 px-4 py-3">${p.materi}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-center font-medium">${p.alokasiWaktu}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-gray-500">${p.keterangan || '-'}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-center">
                                            <button onclick="ProtaPromes.editProta('${p.id}')" 
                                                class="text-blue-500 hover:text-blue-700 mx-1" title="Edit">✏️</button>
                                            <button onclick="ProtaPromes.deleteProta('${p.id}')" 
                                                class="text-red-500 hover:text-red-700 mx-1" title="Hapus">🗑️</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr class="bg-blue-50 font-semibold">
                                    <td colspan="2" class="border border-gray-300 px-4 py-3 text-right">Jumlah JP Semester 1:</td>
                                    <td class="border border-gray-300 px-4 py-3 text-center">${totalJPSem1}</td>
                                    <td colspan="2" class="border border-gray-300 px-4 py-3"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Semester 2 -->
                <div class="mb-6">
                    <div class="flex justify-between items-center mb-3">
                        <h5 class="font-semibold text-lg text-green-700 flex items-center">
                            <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">Semester 2</span>
                            Genap
                        </h5>
                        <span class="text-sm text-gray-500">Total: ${totalJPSem2} JP</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr class="bg-green-50">
                                    <th class="border border-gray-300 px-4 py-3 text-left w-16">No</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left">Kompetensi/Materi Pokok</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center w-28">Alokasi (JP)</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left w-40">Keterangan</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${semester2.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="border border-gray-300 px-4 py-6 text-center text-gray-400">
                                            Belum ada data untuk Semester 2
                                        </td>
                                    </tr>
                                ` : semester2.map((p, i) => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="border border-gray-300 px-4 py-3 text-center font-medium">${i + 1}</td>
                                        <td class="border border-gray-300 px-4 py-3">${p.materi}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-center font-medium">${p.alokasiWaktu}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-gray-500">${p.keterangan || '-'}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-center">
                                            <button onclick="ProtaPromes.editProta('${p.id}')" 
                                                class="text-blue-500 hover:text-blue-700 mx-1" title="Edit">✏️</button>
                                            <button onclick="ProtaPromes.deleteProta('${p.id}')" 
                                                class="text-red-500 hover:text-red-700 mx-1" title="Hapus">🗑️</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr class="bg-green-50 font-semibold">
                                    <td colspan="2" class="border border-gray-300 px-4 py-3 text-right">Jumlah JP Semester 2:</td>
                                    <td class="border border-gray-300 px-4 py-3 text-center">${totalJPSem2}</td>
                                    <td colspan="2" class="border border-gray-300 px-4 py-3"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Summary -->
                <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm text-gray-600">Ringkasan Program Tahunan</p>
                            <p class="text-lg font-bold text-gray-800">${subject?.nama || ''} - ${rombel?.nama || ''}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600">Total JP Setahun</p>
                            <p class="text-3xl font-bold text-primary">${totalJPTahun} JP</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    showAddProtaModal: () => {
        document.getElementById('prota-modal-title').textContent = 'Tambah Item Program Tahunan';
        document.getElementById('prota-form').reset();
        document.getElementById('prota-edit-id').value = '';
        
        // Pre-fill with selected filter values
        const mapelId = document.getElementById('prota-mapel').value;
        const rombelId = document.getElementById('prota-rombel').value;
        
        ProtaPromes.updateProtaDropdowns();
        
        if (mapelId) document.getElementById('prota-form-mapel').value = mapelId;
        if (rombelId) document.getElementById('prota-form-rombel').value = rombelId;

        // Set default urutan
        const filtered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId
        );
        const nextUrutan = filtered.length > 0 ? Math.max(...filtered.map(p => p.urutan || 0)) + 1 : 1;
        document.getElementById('prota-urutan').value = nextUrutan;

        document.getElementById('prota-modal').classList.remove('hidden');
    },

    closeProtaModal: () => {
        document.getElementById('prota-modal').classList.add('hidden');
    },

    saveProta: async (e) => {
        e.preventDefault();
        Utils.showLoading('Menyimpan Program Tahunan...');

        const editId = document.getElementById('prota-edit-id').value;
        const mapelId = document.getElementById('prota-form-mapel').value;
        const rombelId = document.getElementById('prota-form-rombel').value;

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        if (!subject || !rombel) {
            Utils.showNotification('Pilih mata pelajaran dan rombel', 'warning');
            Utils.hideLoading();
            return;
        }

        const data = {
            userId: Auth.currentUser.uid,
            npsn: Auth.userData.npsn,
            mapelId: mapelId,
            mapelNama: subject.nama,
            rombelId: rombelId,
            rombelNama: rombel.nama,
            kelas: rombel.kelas,
            semester: parseInt(document.getElementById('prota-semester').value),
            materi: document.getElementById('prota-materi').value.trim(),
            alokasiWaktu: parseInt(document.getElementById('prota-waktu').value),
            urutan: parseInt(document.getElementById('prota-urutan').value),
            keterangan: document.getElementById('prota-keterangan').value.trim(),
            tahunAjaran: Utils.getTahunAjaran(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection(COLLECTIONS.PROTA).doc(editId).update(data);
                Utils.showNotification('Program Tahunan berhasil diperbarui', 'success');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(COLLECTIONS.PROTA).add(data);
                Utils.showNotification('Program Tahunan berhasil disimpan', 'success');
            }

            ProtaPromes.closeProtaModal();
            await ProtaPromes.loadProta();
            
            // Update filter to show the saved data
            document.getElementById('prota-mapel').value = mapelId;
            document.getElementById('prota-rombel').value = rombelId;
            ProtaPromes.loadProtaContent();
        } catch (error) {
            console.error('Error saving Prota:', error);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    editProta: (id) => {
        const prota = ProtaPromes.protaData.find(p => p.id === id);
        if (!prota) return;

        document.getElementById('prota-modal-title').textContent = 'Edit Item Program Tahunan';
        document.getElementById('prota-edit-id').value = id;
        
        ProtaPromes.updateProtaDropdowns();

        setTimeout(() => {
            document.getElementById('prota-form-mapel').value = prota.mapelId;
            document.getElementById('prota-form-rombel').value = prota.rombelId;
            document.getElementById('prota-semester').value = prota.semester;
            document.getElementById('prota-materi').value = prota.materi;
            document.getElementById('prota-waktu').value = prota.alokasiWaktu;
            document.getElementById('prota-urutan').value = prota.urutan;
            document.getElementById('prota-keterangan').value = prota.keterangan || '';
        }, 100);

        document.getElementById('prota-modal').classList.remove('hidden');
    },

    deleteProta: async (id) => {
        const confirm = await Utils.confirm('Hapus item Program Tahunan ini?');
        if (!confirm) return;

        Utils.showLoading('Menghapus...');

        try {
            await db.collection(COLLECTIONS.PROTA).doc(id).delete();
            Utils.showNotification('Item berhasil dihapus', 'success');
            await ProtaPromes.loadProta();
            ProtaPromes.loadProtaContent();
        } catch (error) {
            console.error('Error deleting:', error);
            Utils.showNotification('Gagal menghapus', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    generateProta: async () => {
        const mapelId = document.getElementById('prota-mapel').value;
        const rombelId = document.getElementById('prota-rombel').value;

        if (!mapelId || !rombelId) {
            Utils.showNotification('Pilih mata pelajaran dan rombel terlebih dahulu', 'warning');
            return;
        }

        // Get ATP for this mapel and rombel
        const atpFiltered = AtpKktp.atpData.filter(a => 
            a.mapelId === mapelId && a.rombelId === rombelId
        );

        if (atpFiltered.length === 0) {
            Utils.showNotification('Tidak ada ATP untuk mata pelajaran dan rombel yang dipilih. Buat ATP terlebih dahulu.', 'warning');
            return;
        }

        // Check if prota already exists
        const existingProta = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId
        );

        if (existingProta.length > 0) {
            const confirmOverwrite = await Utils.confirm(`Sudah ada ${existingProta.length} item Prota. Lanjutkan generate? (Data lama tidak akan dihapus)`);
            if (!confirmOverwrite) return;
        }

        const confirm = await Utils.confirm(`Generate Program Tahunan dari ${atpFiltered.length} ATP?`);
        if (!confirm) return;

        Utils.showLoading('Generating Program Tahunan...');

        try {
            const subject = MasterData.subjects.find(s => s.id === mapelId);
            const rombel = MasterData.rombel.find(r => r.id === rombelId);

            // Sort ATP by urutan
            const sortedATP = atpFiltered.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));

            // Distribute ATP to semesters (roughly half each)
            const half = Math.ceil(sortedATP.length / 2);
            
            for (let i = 0; i < sortedATP.length; i++) {
                const atp = sortedATP[i];
                const semester = i < half ? 1 : 2;

                // Check if this ATP already has a prota entry
                const exists = ProtaPromes.protaData.find(p => 
                    p.mapelId === mapelId && 
                    p.rombelId === rombelId && 
                    p.materi.includes(atp.elemen)
                );

                if (exists) continue;

                // Create prota entry
                const materiText = atp.tujuanPembelajaran && atp.tujuanPembelajaran.length > 0
                    ? `${atp.elemen}: ${atp.tujuanPembelajaran.join('; ')}`
                    : atp.elemen;

                await db.collection(COLLECTIONS.PROTA).add({
                    userId: Auth.currentUser.uid,
                    npsn: Auth.userData.npsn,
                    mapelId: mapelId,
                    mapelNama: subject.nama,
                    rombelId: rombelId,
                    rombelNama: rombel.nama,
                    kelas: rombel.kelas,
                    semester: semester,
                    materi: materiText,
                    alokasiWaktu: atp.alokasiWaktu || 4,
                    urutan: i + 1,
                    keterangan: '',
                    atpId: atp.id, // Reference to ATP
                    tahunAjaran: Utils.getTahunAjaran(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            Utils.showNotification('Program Tahunan berhasil di-generate!', 'success');
            await ProtaPromes.loadProta();
            ProtaPromes.loadProtaContent();
        } catch (error) {
            console.error('Error generating Prota:', error);
            Utils.showNotification('Gagal generate: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    generateProtaForRombel: async (rombel) => {
        // Called from MasterData.generateFromCP
        // Generate for all subjects assigned to this teacher
        for (const subject of MasterData.subjects) {
            const atpForSubject = AtpKktp.atpData.filter(a => 
                a.mapelId === subject.id && a.rombelId === rombel.id
            );

            if (atpForSubject.length === 0) continue;

            const half = Math.ceil(atpForSubject.length / 2);

            for (let i = 0; i < atpForSubject.length; i++) {
                const atp = atpForSubject[i];
                const semester = i < half ? 1 : 2;

                const materiText = atp.tujuanPembelajaran && atp.tujuanPembelajaran.length > 0
                    ? `${atp.elemen}: ${atp.tujuanPembelajaran.join('; ')}`
                    : atp.elemen;

                await db.collection(COLLECTIONS.PROTA).add({
                    userId: Auth.currentUser.uid,
                    npsn: Auth.userData.npsn,
                    mapelId: subject.id,
                    mapelNama: subject.nama,
                    rombelId: rombel.id,
                    rombelNama: rombel.nama,
                    kelas: rombel.kelas,
                    semester: semester,
                    materi: materiText,
                    alokasiWaktu: atp.alokasiWaktu || 4,
                    urutan: i + 1,
                    keterangan: '',
                    atpId: atp.id,
                    tahunAjaran: Utils.getTahunAjaran(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    },

    printProta: () => {
        const mapelId = document.getElementById('prota-mapel').value;
        const rombelId = document.getElementById('prota-rombel').value;

        if (!mapelId || !rombelId) {
            Utils.showNotification('Pilih mata pelajaran dan rombel untuk mencetak', 'warning');
            return;
        }

        const filtered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId
        );

        if (filtered.length === 0) {
            Utils.showNotification('Tidak ada data untuk dicetak', 'warning');
            return;
        }

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        // Prepare print template
        document.getElementById('prota-print-school').textContent = Auth.userData.namaSekolah;
        document.getElementById('prota-print-tahun').textContent = `Tahun Ajaran ${Utils.getTahunAjaran()}`;
        document.getElementById('prota-print-date').textContent = Utils.formatDate(new Date());
        document.getElementById('prota-print-teacher').textContent = Auth.userData.nama;

        document.getElementById('prota-print-info').innerHTML = `
            <dt>Mata Pelajaran</dt><dd>${subject?.nama || '-'}</dd>
            <dt>Kelas/Rombel</dt><dd>${rombel?.nama || '-'}</dd>
            <dt>Tahun Ajaran</dt><dd>${Utils.getTahunAjaran()}</dd>
        `;

        // Group by semester
        const semester1 = filtered.filter(p => p.semester === 1).sort((a, b) => a.urutan - b.urutan);
        const semester2 = filtered.filter(p => p.semester === 2).sort((a, b) => a.urutan - b.urutan);

        const totalJPSem1 = semester1.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);
        const totalJPSem2 = semester2.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);

        document.getElementById('prota-print-table').innerHTML = `
            <thead>
                <tr>
                    <th colspan="4" style="background: #e3f2fd; text-align: center; font-size: 12pt;">SEMESTER 1 (GANJIL)</th>
                </tr>
                <tr>
                    <th width="8%">No</th>
                    <th width="55%">Kompetensi/Materi Pokok</th>
                    <th width="17%">Alokasi Waktu (JP)</th>
                    <th width="20%">Keterangan</th>
                </tr>
            </thead>
            <tbody>
                ${semester1.map((p, i) => `
                    <tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td>${p.materi}</td>
                        <td style="text-align: center;">${p.alokasiWaktu}</td>
                        <td>${p.keterangan || '-'}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background: #f5f5f5;">
                    <td colspan="2" style="text-align: right;">Jumlah JP Semester 1:</td>
                    <td style="text-align: center;">${totalJPSem1}</td>
                    <td></td>
                </tr>
            </tbody>
            <thead>
                <tr>
                    <th colspan="4" style="background: #e8f5e9; text-align: center; font-size: 12pt;">SEMESTER 2 (GENAP)</th>
                </tr>
                <tr>
                    <th>No</th>
                    <th>Kompetensi/Materi Pokok</th>
                    <th>Alokasi Waktu (JP)</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                ${semester2.map((p, i) => `
                    <tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td>${p.materi}</td>
                        <td style="text-align: center;">${p.alokasiWaktu}</td>
                        <td>${p.keterangan || '-'}</td>
                    </tr>
                `).join('')}
                <tr style="font-weight: bold; background: #f5f5f5;">
                    <td colspan="2" style="text-align: right;">Jumlah JP Semester 2:</td>
                    <td style="text-align: center;">${totalJPSem2}</td>
                    <td></td>
                </tr>
                <tr style="font-weight: bold; background: #fff3e0;">
                    <td colspan="2" style="text-align: right;">TOTAL JP SETAHUN:</td>
                    <td style="text-align: center;">${totalJPSem1 + totalJPSem2}</td>
                    <td></td>
                </tr>
            </tbody>
        `;

        Utils.printDocument('prota-print-template', 'Program Tahunan');
    },

    // ==================== PROGRAM SEMESTER ====================
    renderPromes: () => {
        const container = document.getElementById('tab-promes');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex flex-wrap gap-3">
                            <select id="promes-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Pilih Mapel</option>
                            </select>
                            <select id="promes-rombel" class="px-4 py-2 border rounded-lg">
                                <option value="">Pilih Rombel</option>
                            </select>
                            <select id="promes-semester" class="px-4 py-2 border rounded-lg">
                                <option value="1">Semester 1 (Ganjil)</option>
                                <option value="2">Semester 2 (Genap)</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="ProtaPromes.generatePromes()" 
                                class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600">
                                ⚡ Auto Distribusi
                            </button>
                            <button onclick="ProtaPromes.clearPromesSchedule()" 
                                class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                                🔄 Reset Jadwal
                            </button>
                            <button onclick="ProtaPromes.printPromes()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>
                    <p class="mt-3 text-sm text-gray-500">
                        💡 Klik checkbox untuk menandai minggu pelaksanaan setiap materi pembelajaran
                    </p>
                </div>

                <!-- Promes Content -->
                <div id="promes-content" class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="p-6 text-center text-gray-400">
                        Pilih mata pelajaran, rombel, dan semester untuk melihat Program Semester
                    </div>
                </div>

                <!-- Print Template -->
                <div id="promes-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1>PROGRAM SEMESTER (PROMES)</h1>
                        <p id="promes-print-school"></p>
                        <p id="promes-print-tahun"></p>
                    </div>
                    <div id="promes-print-info" class="info-box"></div>
                    <div id="promes-print-content"></div>
                    <div class="signature-area">
                        <div class="signature-box">
                            <p>Mengetahui,</p>
                            <p>Kepala Sekolah</p>
                            <div class="signature-line"></div>
                            <p>________________________</p>
                            <p>NIP. </p>
                        </div>
                        <div class="signature-box right">
                            <p id="promes-print-date"></p>
                            <p>Guru Mata Pelajaran</p>
                            <div class="signature-line"></div>
                            <p id="promes-print-teacher"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('promes-mapel').addEventListener('change', ProtaPromes.loadPromesContent);
        document.getElementById('promes-rombel').addEventListener('change', ProtaPromes.loadPromesContent);
        document.getElementById('promes-semester').addEventListener('change', ProtaPromes.loadPromesContent);

        ProtaPromes.updatePromesDropdowns();
    },

    updatePromesDropdowns: () => {
        const mapelOptions = MasterData.subjects.map(s => 
            `<option value="${s.id}">${s.nama}</option>`
        ).join('');
        const rombelOptions = MasterData.rombel.map(r => 
            `<option value="${r.id}">${r.nama}</option>`
        ).join('');

        document.getElementById('promes-mapel').innerHTML = '<option value="">Pilih Mapel</option>' + mapelOptions;
        document.getElementById('promes-rombel').innerHTML = '<option value="">Pilih Rombel</option>' + rombelOptions;
    },

    loadPromes: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.PROMES)
                .where('userId', '==', Auth.currentUser.uid)
                .get();

            ProtaPromes.promesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Refresh content if filters are selected
            const mapelId = document.getElementById('promes-mapel')?.value;
            const rombelId = document.getElementById('promes-rombel')?.value;
            if (mapelId && rombelId) {
                ProtaPromes.loadPromesContent();
            }
        } catch (error) {
            console.error('Error loading Promes:', error);
        }
    },

    loadPromesContent: () => {
        const mapelId = document.getElementById('promes-mapel').value;
        const rombelId = document.getElementById('promes-rombel').value;
        const semester = parseInt(document.getElementById('promes-semester').value);
        const container = document.getElementById('promes-content');

        if (!mapelId || !rombelId) {
            container.innerHTML = '<div class="p-6 text-center text-gray-400">Pilih mata pelajaran dan rombel untuk melihat Program Semester</div>';
            return;
        }

        // Get Prota data for this selection
        const protaFiltered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
        ).sort((a, b) => a.urutan - b.urutan);

        // Get Promes data (schedule)
        const promesFiltered = ProtaPromes.promesData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
        );

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        if (protaFiltered.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center">
                    <div class="text-6xl mb-4">📆</div>
                    <p class="text-gray-500 mb-4">Belum ada data Program Tahunan untuk semester ${semester}.</p>
                    <p class="text-gray-400 mb-4">Buat Program Tahunan terlebih dahulu untuk membuat Program Semester.</p>
                    <button onclick="App.switchTab('prota')" 
                        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                        📋 Buat Program Tahunan
                    </button>
                </div>
            `;
            return;
        }

        // Generate months based on semester
        const months = semester === 1 
            ? [
                { name: 'Juli', index: 6 },
                { name: 'Agustus', index: 7 },
                { name: 'September', index: 8 },
                { name: 'Oktober', index: 9 },
                { name: 'November', index: 10 },
                { name: 'Desember', index: 11 }
            ]
            : [
                { name: 'Januari', index: 0 },
                { name: 'Februari', index: 1 },
                { name: 'Maret', index: 2 },
                { name: 'April', index: 3 },
                { name: 'Mei', index: 4 },
                { name: 'Juni', index: 5 }
            ];

        const totalJP = protaFiltered.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);

        container.innerHTML = `
            <div class="p-6">
                <!-- Header Info -->
                <div class="mb-6 pb-4 border-b">
                    <h4 class="font-semibold text-xl text-gray-800">${subject?.nama || ''}</h4>
                    <p class="text-gray-500">
                        Kelas/Rombel: ${rombel?.nama || ''} | 
                        Semester ${semester} (${semester === 1 ? 'Ganjil' : 'Genap'}) | 
                        Tahun Ajaran ${Utils.getTahunAjaran()}
                    </p>
                    <p class="text-sm text-gray-400 mt-1">Total: ${protaFiltered.length} materi, ${totalJP} JP</p>
                </div>

                <!-- Schedule Table -->
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300 text-sm" style="min-width: 1200px;">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-300 px-2 py-2 text-center w-12" rowspan="2">No</th>
                                <th class="border border-gray-300 px-2 py-2 text-left" rowspan="2" style="min-width: 250px;">Kompetensi/Materi</th>
                                <th class="border border-gray-300 px-2 py-2 text-center w-16" rowspan="2">JP</th>
                                ${months.map(m => `
                                    <th class="border border-gray-300 px-1 py-2 text-center bg-blue-50" colspan="4">${m.name}</th>
                                `).join('')}
                                <th class="border border-gray-300 px-2 py-2 text-center w-24" rowspan="2">Ket</th>
                            </tr>
                            <tr class="bg-gray-50">
                                ${months.map(() => `
                                    <th class="border border-gray-300 px-1 py-1 text-center text-xs w-8">1</th>
                                    <th class="border border-gray-300 px-1 py-1 text-center text-xs w-8">2</th>
                                    <th class="border border-gray-300 px-1 py-1 text-center text-xs w-8">3</th>
                                    <th class="border border-gray-300 px-1 py-1 text-center text-xs w-8">4</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${protaFiltered.map((prota, index) => {
                                // Find promes schedule for this prota
                                const promesItem = promesFiltered.find(p => p.protaId === prota.id) || {};
                                const schedule = promesItem.schedule || {};
                                
                                return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="border border-gray-300 px-2 py-2 text-center font-medium">${index + 1}</td>
                                        <td class="border border-gray-300 px-2 py-2 text-xs">
                                            <div class="max-h-20 overflow-y-auto">${prota.materi}</div>
                                        </td>
                                        <td class="border border-gray-300 px-2 py-2 text-center font-medium">${prota.alokasiWaktu}</td>
                                        ${months.map((m, mi) => {
                                            return [1, 2, 3, 4].map(w => {
                                                const key = `${mi}-${w}`;
                                                const isChecked = schedule[key] || false;
                                                return `
                                                    <td class="border border-gray-300 px-1 py-1 text-center ${isChecked ? 'bg-green-100' : ''}">
                                                        <input type="checkbox" 
                                                            ${isChecked ? 'checked' : ''}
                                                            onchange="ProtaPromes.updatePromesSchedule('${prota.id}', '${key}', this.checked, '${mapelId}', '${rombelId}', ${semester})"
                                                            class="w-4 h-4 cursor-pointer accent-green-600">
                                                    </td>
                                                `;
                                            }).join('');
                                        }).join('')}
                                        <td class="border border-gray-300 px-2 py-2 text-xs text-gray-500">${prota.keterangan || '-'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-100 font-semibold">
                                <td colspan="2" class="border border-gray-300 px-2 py-2 text-right">Total JP:</td>
                                <td class="border border-gray-300 px-2 py-2 text-center">${totalJP}</td>
                                <td colspan="${months.length * 4 + 1}" class="border border-gray-300 px-2 py-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Legend -->
                <div class="mt-4 p-3 bg-gray-50 rounded-lg flex flex-wrap items-center gap-4 text-sm">
                    <span class="font-medium">Keterangan:</span>
                    <span class="flex items-center gap-1">
                        <span class="w-4 h-4 bg-green-100 border border-green-300 rounded"></span>
                        Minggu pelaksanaan
                    </span>
                    <span class="flex items-center gap-1">
                        <span class="w-4 h-4 bg-white border border-gray-300 rounded"></span>
                        Belum dijadwalkan
                    </span>
                </div>
            </div>
        `;
    },

    updatePromesSchedule: async (protaId, weekKey, isChecked, mapelId, rombelId, semester) => {
        try {
            // Find existing promes document for this prota
            let promesDoc = ProtaPromes.promesData.find(p => p.protaId === protaId);
            
            if (promesDoc) {
                // Update existing document
                const newSchedule = { ...promesDoc.schedule, [weekKey]: isChecked };
                
                // Remove false values to keep document clean
                if (!isChecked) {
                    delete newSchedule[weekKey];
                }

                await db.collection(COLLECTIONS.PROMES).doc(promesDoc.id).update({
                    schedule: newSchedule,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update local data
                promesDoc.schedule = newSchedule;
            } else {
                // Create new promes document
                const prota = ProtaPromes.protaData.find(p => p.id === protaId);
                if (!prota) return;

                const newSchedule = isChecked ? { [weekKey]: true } : {};

                const docRef = await db.collection(COLLECTIONS.PROMES).add({
                    userId: Auth.currentUser.uid,
                    npsn: Auth.userData.npsn,
                    protaId: protaId,
                    mapelId: mapelId,
                    mapelNama: prota.mapelNama,
                    rombelId: rombelId,
                    rombelNama: prota.rombelNama,
                    semester: semester,
                    schedule: newSchedule,
                    tahunAjaran: Utils.getTahunAjaran(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Add to local data
                ProtaPromes.promesData.push({
                    id: docRef.id,
                    protaId: protaId,
                    mapelId: mapelId,
                    mapelNama: prota.mapelNama,
                    rombelId: rombelId,
                    rombelNama: prota.rombelNama,
                    semester: semester,
                    schedule: newSchedule
                });
            }

            // Visual feedback - update cell background
            const checkbox = event.target;
            const cell = checkbox.closest('td');
            if (isChecked) {
                cell.classList.add('bg-green-100');
            } else {
                cell.classList.remove('bg-green-100');
            }

        } catch (error) {
            console.error('Error updating promes schedule:', error);
            Utils.showNotification('Gagal menyimpan jadwal', 'error');
            // Revert checkbox state
            event.target.checked = !isChecked;
        }
    },

    generatePromes: async () => {
        const mapelId = document.getElementById('promes-mapel').value;
        const rombelId = document.getElementById('promes-rombel').value;
        const semester = parseInt(document.getElementById('promes-semester').value);

        if (!mapelId || !rombelId) {
            Utils.showNotification('Pilih mata pelajaran dan rombel terlebih dahulu', 'warning');
            return;
        }

        const protaFiltered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
        ).sort((a, b) => a.urutan - b.urutan);

        if (protaFiltered.length === 0) {
            Utils.showNotification('Tidak ada Program Tahunan untuk semester ini', 'warning');
            return;
        }

        const confirm = await Utils.confirm('Auto distribusi materi ke minggu-minggu pembelajaran? Jadwal yang sudah ada akan di-reset.');
        if (!confirm) return;

        Utils.showLoading('Mendistribusikan jadwal...');

        try {
            // Delete existing promes for this selection
            const existingPromes = ProtaPromes.promesData.filter(p => 
                p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
            );

            for (const promes of existingPromes) {
                await db.collection(COLLECTIONS.PROMES).doc(promes.id).delete();
            }

            // Calculate weeks needed per materi based on JP
            // Assume 2 JP per week as baseline
            const jpPerWeek = 2;
            let currentWeek = 0;

            for (const prota of protaFiltered) {
                const weeksNeeded = Math.ceil((prota.alokasiWaktu || 4) / jpPerWeek);
                const schedule = {};

                for (let w = 0; w < weeksNeeded && currentWeek < 24; w++) {
                    const monthIndex = Math.floor(currentWeek / 4);
                    const weekInMonth = (currentWeek % 4) + 1;
                    const weekKey = `${monthIndex}-${weekInMonth}`;
                    schedule[weekKey] = true;
                    currentWeek++;
                }

                // Create promes document
                await db.collection(COLLECTIONS.PROMES).add({
                    userId: Auth.currentUser.uid,
                    npsn: Auth.userData.npsn,
                    protaId: prota.id,
                    mapelId: mapelId,
                    mapelNama: prota.mapelNama,
                    rombelId: rombelId,
                    rombelNama: prota.rombelNama,
                    semester: semester,
                    schedule: schedule,
                    tahunAjaran: Utils.getTahunAjaran(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            Utils.showNotification('Jadwal berhasil didistribusikan!', 'success');
            await ProtaPromes.loadPromes();
            ProtaPromes.loadPromesContent();
        } catch (error) {
            console.error('Error generating Promes:', error);
            Utils.showNotification('Gagal mendistribusikan jadwal: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    clearPromesSchedule: async () => {
        const mapelId = document.getElementById('promes-mapel').value;
        const rombelId = document.getElementById('promes-rombel').value;
        const semester = parseInt(document.getElementById('promes-semester').value);

        if (!mapelId || !rombelId) {
            Utils.showNotification('Pilih mata pelajaran dan rombel terlebih dahulu', 'warning');
            return;
        }

        const confirm = await Utils.confirm('Reset semua jadwal untuk semester ini? Semua centang akan dihapus.');
        if (!confirm) return;

        Utils.showLoading('Mereset jadwal...');

        try {
            const toDelete = ProtaPromes.promesData.filter(p => 
                p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
            );

            for (const promes of toDelete) {
                await db.collection(COLLECTIONS.PROMES).doc(promes.id).delete();
            }

            // Remove from local data
            ProtaPromes.promesData = ProtaPromes.promesData.filter(p => 
                !(p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester)
            );

            Utils.showNotification('Jadwal berhasil direset', 'success');
            ProtaPromes.loadPromesContent();
        } catch (error) {
            console.error('Error clearing schedule:', error);
            Utils.showNotification('Gagal mereset jadwal', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    generatePromesForRombel: async (rombel) => {
        // Called from MasterData.generateFromCP
        // Auto generation is handled when user opens the Promes tab
        // This is a placeholder for batch generation if needed
        console.log('Promes will be generated when user opens Promes tab for', rombel.nama);
    },

    printPromes: () => {
        const mapelId = document.getElementById('promes-mapel').value;
        const rombelId = document.getElementById('promes-rombel').value;
        const semester = parseInt(document.getElementById('promes-semester').value);

        if (!mapelId || !rombelId) {
            Utils.showNotification('Pilih mata pelajaran dan rombel untuk mencetak', 'warning');
            return;
        }

        const protaFiltered = ProtaPromes.protaData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
        ).sort((a, b) => a.urutan - b.urutan);

        const promesFiltered = ProtaPromes.promesData.filter(p => 
            p.mapelId === mapelId && p.rombelId === rombelId && p.semester === semester
        );

        if (protaFiltered.length === 0) {
            Utils.showNotification('Tidak ada data untuk dicetak', 'warning');
            return;
        }

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        const months = semester === 1 
            ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
            : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

        const totalJP = protaFiltered.reduce((sum, p) => sum + (p.alokasiWaktu || 0), 0);

        // Prepare print template
        document.getElementById('promes-print-school').textContent = Auth.userData.namaSekolah;
        document.getElementById('promes-print-tahun').textContent = `Tahun Ajaran ${Utils.getTahunAjaran()}`;
        document.getElementById('promes-print-date').textContent = Utils.formatDate(new Date());
        document.getElementById('promes-print-teacher').textContent = Auth.userData.nama;

        document.getElementById('promes-print-info').innerHTML = `
            <dt>Mata Pelajaran</dt><dd>${subject?.nama || '-'}</dd>
            <dt>Kelas/Rombel</dt><dd>${rombel?.nama || '-'}</dd>
            <dt>Semester</dt><dd>${semester} (${semester === 1 ? 'Ganjil' : 'Genap'})</dd>
            <dt>Tahun Ajaran</dt><dd>${Utils.getTahunAjaran()}</dd>
        `;

        let tableContent = `
            <table style="font-size: 8pt; width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th rowspan="2" style="border: 1px solid #000; padding: 4px; width: 4%;">No</th>
                        <th rowspan="2" style="border: 1px solid #000; padding: 4px; width: 28%;">Kompetensi/Materi</th>
                        <th rowspan="2" style="border: 1px solid #000; padding: 4px; width: 4%;">JP</th>
                        ${months.map(m => `
                            <th colspan="4" style="border: 1px solid #000; padding: 4px; text-align: center; background: #f0f0f0;">${m}</th>
                        `).join('')}
                        <th rowspan="2" style="border: 1px solid #000; padding: 4px; width: 8%;">Ket</th>
                    </tr>
                    <tr>
                        ${months.map(() => `
                            <th style="border: 1px solid #000; padding: 2px; text-align: center; width: 2%;">1</th>
                            <th style="border: 1px solid #000; padding: 2px; text-align: center; width: 2%;">2</th>
                            <th style="border: 1px solid #000; padding: 2px; text-align: center; width: 2%;">3</th>
                            <th style="border: 1px solid #000; padding: 2px; text-align: center; width: 2%;">4</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${protaFiltered.map((prota, index) => {
                        const promesItem = promesFiltered.find(p => p.protaId === prota.id) || {};
                        const schedule = promesItem.schedule || {};
                        
                        return `
                            <tr>
                                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
                                <td style="border: 1px solid #000; padding: 4px; font-size: 7pt;">${prota.materi}</td>
                                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${prota.alokasiWaktu}</td>
                                ${months.map((m, mi) => {
                                    return [1, 2, 3, 4].map(w => {
                                        const key = `${mi}-${w}`;
                                        const isChecked = schedule[key] || false;
                                        return `<td style="border: 1px solid #000; padding: 2px; text-align: center; ${isChecked ? 'background: #c8e6c9;' : ''}">${isChecked ? '✓' : ''}</td>`;
                                    }).join('');
                                }).join('')}
                                <td style="border: 1px solid #000; padding: 4px; font-size: 7pt;">${prota.keterangan || ''}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background: #f5f5f5;">
                        <td colspan="2" style="border: 1px solid #000; padding: 4px; text-align: right;">Total JP:</td>
                        <td style="border: 1px solid #000; padding: 4px; text-align: center;">${totalJP}</td>
                        <td colspan="${months.length * 4 + 1}" style="border: 1px solid #000; padding: 4px;"></td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin-top: 10px; font-size: 9pt;">
                <strong>Keterangan:</strong> ✓ = Minggu pelaksanaan pembelajaran
            </p>
        `;

        document.getElementById('promes-print-content').innerHTML = tableContent;

        Utils.printDocument('promes-print-template', 'Program Semester');
    }
};

console.log('Prota-Promes Module Loaded');