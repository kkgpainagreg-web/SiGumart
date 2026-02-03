// js/bank-soal.js
// =====================================================
// BANK SOAL MODULE
// =====================================================

const BankSoal = {
    soalData: [],

    init: async () => {
        BankSoal.render();
        await BankSoal.loadSoal();
    },

    render: () => {
        const container = document.getElementById('tab-bank-soal');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex flex-wrap gap-3">
                            <select id="soal-filter-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Mapel</option>
                            </select>
                            <select id="soal-filter-kelas" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Kelas</option>
                                ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                    `<option value="${k}">Kelas ${k}</option>`
                                ).join('')}
                            </select>
                            <select id="soal-filter-tipe" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Tipe</option>
                                <option value="pilihan_ganda">Pilihan Ganda</option>
                                <option value="essay">Essay</option>
                                <option value="isian_singkat">Isian Singkat</option>
                                <option value="benar_salah">Benar/Salah</option>
                            </select>
                            <select id="soal-filter-level" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Level</option>
                                <option value="C1">C1 - Mengingat</option>
                                <option value="C2">C2 - Memahami</option>
                                <option value="C3">C3 - Menerapkan</option>
                                <option value="C4">C4 - Menganalisis</option>
                                <option value="C5">C5 - Mengevaluasi</option>
                                <option value="C6">C6 - Mencipta</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="BankSoal.showAddSoalModal()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                                ➕ Tambah Soal
                            </button>
                            <button onclick="BankSoal.exportSoal()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                🖨️ Cetak Soal
                            </button>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-4 text-sm">
                        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            Total: <strong id="soal-count-total">0</strong> soal
                        </span>
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            PG: <strong id="soal-count-pg">0</strong>
                        </span>
                        <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                            Essay: <strong id="soal-count-essay">0</strong>
                        </span>
                    </div>
                </div>

                <!-- Soal List -->
                <div id="soal-list" class="space-y-4">
                    <div class="text-center text-gray-400 py-8">
                        Belum ada soal. Klik "Tambah Soal" untuk memulai.
                    </div>
                </div>

                <!-- Print Template -->
                <div id="soal-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1 id="soal-print-title">BANK SOAL</h1>
                        <p id="soal-print-school"></p>
                    </div>
                    <div id="soal-print-info" class="info-box"></div>
                    <div id="soal-print-content"></div>
                </div>
            </div>

            <!-- Add/Edit Soal Modal -->
            <div id="soal-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="sticky top-0 bg-white flex justify-between items-center p-4 border-b z-10">
                        <h3 class="text-lg font-semibold" id="soal-modal-title">Tambah Soal</h3>
                        <button onclick="BankSoal.closeSoalModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>
                    <form id="soal-form" class="p-6 space-y-4">
                        <input type="hidden" id="soal-edit-id">
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                                <select id="soal-mapel" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Kelas *</label>
                                <select id="soal-kelas" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih</option>
                                    ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                        `<option value="${k}">Kelas ${k}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tipe Soal *</label>
                                <select id="soal-tipe" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih</option>
                                    <option value="pilihan_ganda">Pilihan Ganda</option>
                                    <option value="essay">Essay</option>
                                    <option value="isian_singkat">Isian Singkat</option>
                                    <option value="benar_salah">Benar/Salah</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Level Kognitif *</label>
                                <select id="soal-level" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih</option>
                                    <option value="C1">C1 - Mengingat</option>
                                    <option value="C2">C2 - Memahami</option>
                                    <option value="C3">C3 - Menerapkan</option>
                                    <option value="C4">C4 - Menganalisis</option>
                                    <option value="C5">C5 - Mengevaluasi</option>
                                    <option value="C6">C6 - Mencipta</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">Indikator/Tujuan Pembelajaran</label>
                            <input type="text" id="soal-indikator" class="w-full px-3 py-2 border rounded-lg"
                                placeholder="Indikator soal...">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-1">Pertanyaan *</label>
                            <textarea id="soal-pertanyaan" rows="4" required 
                                class="w-full px-3 py-2 border rounded-lg"
                                placeholder="Tuliskan pertanyaan soal..."></textarea>
                        </div>

                        <!-- Pilihan Ganda Options -->
                        <div id="pg-options" class="hidden space-y-3">
                            <label class="block text-sm font-medium">Pilihan Jawaban</label>
                            <div class="space-y-2">
                                ${['A', 'B', 'C', 'D', 'E'].map(opt => `
                                    <div class="flex items-center space-x-2">
                                        <input type="radio" name="soal-jawaban-pg" value="${opt}" class="w-4 h-4">
                                        <span class="font-medium w-6">${opt}.</span>
                                        <input type="text" id="soal-opsi-${opt.toLowerCase()}" 
                                            class="flex-1 px-3 py-2 border rounded-lg" placeholder="Pilihan ${opt}">
                                    </div>
                                `).join('')}
                            </div>
                            <p class="text-xs text-gray-500">* Pilih radio button untuk menandai jawaban benar</p>
                        </div>

                        <!-- Benar/Salah Options -->
                        <div id="bs-options" class="hidden">
                            <label class="block text-sm font-medium mb-2">Jawaban Benar</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center space-x-2">
                                    <input type="radio" name="soal-jawaban-bs" value="benar" class="w-4 h-4">
                                    <span>Benar</span>
                                </label>
                                <label class="flex items-center space-x-2">
                                    <input type="radio" name="soal-jawaban-bs" value="salah" class="w-4 h-4">
                                    <span>Salah</span>
                                </label>
                            </div>
                        </div>

                        <!-- Essay/Isian Jawaban -->
                        <div id="essay-options" class="hidden">
                            <label class="block text-sm font-medium mb-1">Kunci/Pedoman Jawaban</label>
                            <textarea id="soal-kunci-essay" rows="3" 
                                class="w-full px-3 py-2 border rounded-lg"
                                placeholder="Kunci jawaban atau pedoman penskoran..."></textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Skor/Bobot</label>
                                <input type="number" id="soal-skor" min="1" value="1" 
                                    class="w-full px-3 py-2 border rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tag/Kategori</label>
                                <input type="text" id="soal-tag" 
                                    class="w-full px-3 py-2 border rounded-lg"
                                    placeholder="PTS, PAS, UH1, dll">
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4 border-t">
                            <button type="button" onclick="BankSoal.closeSoalModal()" 
                                class="px-4 py-2 border rounded-lg">Batal</button>
                            <button type="button" onclick="BankSoal.saveSoal(false)" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg">Simpan</button>
                            <button type="button" onclick="BankSoal.saveSoal(true)" 
                                class="px-4 py-2 bg-primary text-white rounded-lg">Simpan & Tambah Lagi</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Export Modal -->
            <div id="export-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                    <h3 class="text-lg font-semibold mb-4">Export Soal</h3>
                    <form id="export-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Judul Dokumen</label>
                            <input type="text" id="export-judul" class="w-full px-3 py-2 border rounded-lg" 
                                value="SOAL ULANGAN">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Mata Pelajaran</label>
                                <select id="export-mapel" class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Semua</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Kelas</label>
                                <select id="export-kelas" class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Semua</option>
                                    ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                        `<option value="${k}">Kelas ${k}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Tipe Soal</label>
                            <select id="export-tipe" class="w-full px-3 py-2 border rounded-lg">
                                <option value="">Semua</option>
                                <option value="pilihan_ganda">Pilihan Ganda</option>
                                <option value="essay">Essay</option>
                            </select>
                        </div>
                        <div>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" id="export-show-answer" class="rounded">
                                <span class="text-sm">Tampilkan Kunci Jawaban</span>
                            </label>
                        </div>
                        <div class="flex justify-end space-x-3 pt-2">
                            <button type="button" onclick="BankSoal.closeExportModal()" 
                                class="px-4 py-2 border rounded-lg">Batal</button>
                            <button type="button" onclick="BankSoal.doPrint()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg">🖨️ Cetak</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('soal-filter-mapel').addEventListener('change', BankSoal.filterSoal);
        document.getElementById('soal-filter-kelas').addEventListener('change', BankSoal.filterSoal);
        document.getElementById('soal-filter-tipe').addEventListener('change', BankSoal.filterSoal);
        document.getElementById('soal-filter-level').addEventListener('change', BankSoal.filterSoal);
        document.getElementById('soal-tipe').addEventListener('change', BankSoal.handleTipeChange);

        BankSoal.updateDropdowns();
    },

    updateDropdowns: () => {
        const mapelOptions = MasterData.subjects.map(s => 
            `<option value="${s.id}" data-nama="${s.nama}">${s.nama}</option>`
        ).join('');

        document.getElementById('soal-filter-mapel').innerHTML = '<option value="">Semua Mapel</option>' + mapelOptions;
        document.getElementById('soal-mapel').innerHTML = '<option value="">Pilih</option>' + mapelOptions;
        document.getElementById('export-mapel').innerHTML = '<option value="">Semua</option>' + mapelOptions;
    },

    handleTipeChange: (e) => {
        const tipe = e.target.value;
        
        document.getElementById('pg-options').classList.add('hidden');
        document.getElementById('bs-options').classList.add('hidden');
        document.getElementById('essay-options').classList.add('hidden');

        if (tipe === 'pilihan_ganda') {
            document.getElementById('pg-options').classList.remove('hidden');
        } else if (tipe === 'benar_salah') {
            document.getElementById('bs-options').classList.remove('hidden');
        } else if (tipe === 'essay' || tipe === 'isian_singkat') {
            document.getElementById('essay-options').classList.remove('hidden');
        }
    },

    showAddSoalModal: () => {
        document.getElementById('soal-modal-title').textContent = 'Tambah Soal Baru';
        document.getElementById('soal-form').reset();
        document.getElementById('soal-edit-id').value = '';
        
        // Hide all answer options
        document.getElementById('pg-options').classList.add('hidden');
        document.getElementById('bs-options').classList.add('hidden');
        document.getElementById('essay-options').classList.add('hidden');

        document.getElementById('soal-modal').classList.remove('hidden');
    },

    closeSoalModal: () => {
        document.getElementById('soal-modal').classList.add('hidden');
    },

    saveSoal: async (addMore = false) => {
        const mapelId = document.getElementById('soal-mapel').value;
        const kelas = document.getElementById('soal-kelas').value;
        const tipe = document.getElementById('soal-tipe').value;
        const level = document.getElementById('soal-level').value;
        const pertanyaan = document.getElementById('soal-pertanyaan').value.trim();

        if (!mapelId || !kelas || !tipe || !level || !pertanyaan) {
            Utils.showNotification('Lengkapi semua field yang wajib', 'warning');
            return;
        }

        Utils.showLoading('Menyimpan soal...');

        const editId = document.getElementById('soal-edit-id').value;
        const mapelNama = document.getElementById('soal-mapel').selectedOptions[0].dataset.nama;

        // Get jawaban based on tipe
        let jawaban = '';
        let opsiJawaban = {};

        if (tipe === 'pilihan_ganda') {
            const selected = document.querySelector('input[name="soal-jawaban-pg"]:checked');
            jawaban = selected ? selected.value : '';
            opsiJawaban = {
                A: document.getElementById('soal-opsi-a').value.trim(),
                B: document.getElementById('soal-opsi-b').value.trim(),
                C: document.getElementById('soal-opsi-c').value.trim(),
                D: document.getElementById('soal-opsi-d').value.trim(),
                E: document.getElementById('soal-opsi-e').value.trim()
            };
        } else if (tipe === 'benar_salah') {
            const selected = document.querySelector('input[name="soal-jawaban-bs"]:checked');
            jawaban = selected ? selected.value : '';
        } else {
            jawaban = document.getElementById('soal-kunci-essay').value.trim();
        }

        const data = {
            userId: Auth.currentUser.uid,
            npsn: Auth.userData.npsn,
            mapelId: mapelId,
            mapelNama: mapelNama,
            kelas: parseInt(kelas),
            tipe: tipe,
            level: level,
            indikator: document.getElementById('soal-indikator').value.trim(),
            pertanyaan: pertanyaan,
            opsiJawaban: opsiJawaban,
            jawaban: jawaban,
            skor: parseInt(document.getElementById('soal-skor').value) || 1,
            tag: document.getElementById('soal-tag').value.trim(),
            tahunAjaran: Utils.getTahunAjaran(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection(COLLECTIONS.BANK_SOAL).doc(editId).update(data);
                Utils.showNotification('Soal berhasil diperbarui', 'success');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(COLLECTIONS.BANK_SOAL).add(data);
                Utils.showNotification('Soal berhasil disimpan', 'success');
            }

            if (addMore) {
                // Reset form but keep mapel and kelas
                const currentMapel = mapelId;
                const currentKelas = kelas;
                document.getElementById('soal-form').reset();
                document.getElementById('soal-mapel').value = currentMapel;
                document.getElementById('soal-kelas').value = currentKelas;
                document.getElementById('soal-edit-id').value = '';
                
                // Hide answer options
                document.getElementById('pg-options').classList.add('hidden');
                document.getElementById('bs-options').classList.add('hidden');
                document.getElementById('essay-options').classList.add('hidden');
            } else {
                BankSoal.closeSoalModal();
            }

            await BankSoal.loadSoal();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error saving soal:', error);
            Utils.showNotification('Gagal menyimpan', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadSoal: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.BANK_SOAL)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            BankSoal.soalData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            BankSoal.renderSoalList();
            BankSoal.updateStats();
        } catch (error) {
            console.error('Error loading soal:', error);
        }
    },

    renderSoalList: (filteredData = null) => {
        const container = document.getElementById('soal-list');
        const data = filteredData || BankSoal.soalData;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    Belum ada soal yang sesuai filter
                </div>
            `;
            return;
        }

        const tipeLabels = {
            pilihan_ganda: 'Pilihan Ganda',
            essay: 'Essay',
            isian_singkat: 'Isian Singkat',
            benar_salah: 'Benar/Salah'
        };

        const levelColors = {
            C1: 'bg-green-100 text-green-800',
            C2: 'bg-blue-100 text-blue-800',
            C3: 'bg-yellow-100 text-yellow-800',
            C4: 'bg-orange-100 text-orange-800',
            C5: 'bg-red-100 text-red-800',
            C6: 'bg-purple-100 text-purple-800'
        };

        container.innerHTML = data.map((soal, index) => `
            <div class="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center space-x-2">
                        <span class="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                            #${index + 1}
                        </span>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            ${soal.mapelNama}
                        </span>
                        <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            Kelas ${soal.kelas}
                        </span>
                        <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                            ${tipeLabels[soal.tipe] || soal.tipe}
                        </span>
                        <span class="${levelColors[soal.level] || 'bg-gray-100'} px-2 py-1 rounded text-xs">
                            ${soal.level}
                        </span>
                        ${soal.tag ? `<span class="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">${soal.tag}</span>` : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="BankSoal.editSoal('${soal.id}')" 
                            class="text-blue-500 hover:text-blue-700" title="Edit">✏️</button>
                        <button onclick="BankSoal.duplicateSoal('${soal.id}')" 
                            class="text-green-500 hover:text-green-700" title="Duplikat">📋</button>
                        <button onclick="BankSoal.deleteSoal('${soal.id}')" 
                            class="text-red-500 hover:text-red-700" title="Hapus">🗑️</button>
                    </div>
                </div>

                ${soal.indikator ? `<p class="text-sm text-gray-500 mb-2 italic">${soal.indikator}</p>` : ''}

                <div class="text-gray-800 mb-3">${soal.pertanyaan}</div>

                ${soal.tipe === 'pilihan_ganda' && soal.opsiJawaban ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        ${Object.entries(soal.opsiJawaban).filter(([k, v]) => v).map(([key, val]) => `
                            <div class="${soal.jawaban === key ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-50 text-gray-700'} px-3 py-2 rounded">
                                <span class="font-medium">${key}.</span> ${val}
                                ${soal.jawaban === key ? ' ✓' : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${soal.tipe === 'benar_salah' ? `
                    <div class="text-sm">
                        <span class="font-medium">Jawaban:</span> 
                        <span class="${soal.jawaban === 'benar' ? 'text-green-600' : 'text-red-600'} font-medium">
                            ${soal.jawaban === 'benar' ? '✓ Benar' : '✗ Salah'}
                        </span>
                    </div>
                ` : ''}

                ${(soal.tipe === 'essay' || soal.tipe === 'isian_singkat') && soal.jawaban ? `
                    <div class="mt-2 p-3 bg-green-50 rounded text-sm">
                        <span class="font-medium text-green-800">Kunci Jawaban:</span>
                        <p class="text-green-700 mt-1">${soal.jawaban}</p>
                    </div>
                ` : ''}

                <div class="mt-3 pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                    <span>Skor: ${soal.skor || 1}</span>
                    <span>${soal.createdAt ? Utils.formatDateShort(soal.createdAt.toDate()) : '-'}</span>
                </div>
            </div>
        `).join('');
    },

    updateStats: () => {
        const total = BankSoal.soalData.length;
        const pg = BankSoal.soalData.filter(s => s.tipe === 'pilihan_ganda').length;
        const essay = BankSoal.soalData.filter(s => s.tipe === 'essay').length;

        document.getElementById('soal-count-total').textContent = total;
        document.getElementById('soal-count-pg').textContent = pg;
        document.getElementById('soal-count-essay').textContent = essay;
    },

    filterSoal: () => {
        const mapelFilter = document.getElementById('soal-filter-mapel').value;
        const kelasFilter = document.getElementById('soal-filter-kelas').value;
        const tipeFilter = document.getElementById('soal-filter-tipe').value;
        const levelFilter = document.getElementById('soal-filter-level').value;

        let filtered = BankSoal.soalData;

        if (mapelFilter) filtered = filtered.filter(s => s.mapelId === mapelFilter);
        if (kelasFilter) filtered = filtered.filter(s => s.kelas === parseInt(kelasFilter));
        if (tipeFilter) filtered = filtered.filter(s => s.tipe === tipeFilter);
        if (levelFilter) filtered = filtered.filter(s => s.level === levelFilter);

        BankSoal.renderSoalList(filtered);
    },

    editSoal: (id) => {
        const soal = BankSoal.soalData.find(s => s.id === id);
        if (!soal) return;

        document.getElementById('soal-modal-title').textContent = 'Edit Soal';
        document.getElementById('soal-edit-id').value = id;

        document.getElementById('soal-mapel').value = soal.mapelId;
        document.getElementById('soal-kelas').value = soal.kelas;
        document.getElementById('soal-tipe').value = soal.tipe;
        document.getElementById('soal-level').value = soal.level;
        document.getElementById('soal-indikator').value = soal.indikator || '';
        document.getElementById('soal-pertanyaan').value = soal.pertanyaan;
        document.getElementById('soal-skor').value = soal.skor || 1;
        document.getElementById('soal-tag').value = soal.tag || '';

        // Show appropriate answer section
        BankSoal.handleTipeChange({ target: { value: soal.tipe } });

        if (soal.tipe === 'pilihan_ganda') {
            if (soal.opsiJawaban) {
                Object.entries(soal.opsiJawaban).forEach(([key, val]) => {
                    const input = document.getElementById(`soal-opsi-${key.toLowerCase()}`);
                    if (input) input.value = val || '';
                });
            }
            if (soal.jawaban) {
                const radio = document.querySelector(`input[name="soal-jawaban-pg"][value="${soal.jawaban}"]`);
                if (radio) radio.checked = true;
            }
        } else if (soal.tipe === 'benar_salah') {
            if (soal.jawaban) {
                const radio = document.querySelector(`input[name="soal-jawaban-bs"][value="${soal.jawaban}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            document.getElementById('soal-kunci-essay').value = soal.jawaban || '';
        }

        document.getElementById('soal-modal').classList.remove('hidden');
    },

    duplicateSoal: async (id) => {
        const soal = BankSoal.soalData.find(s => s.id === id);
        if (!soal) return;

        const confirm = await Utils.confirm('Duplikat soal ini?');
        if (!confirm) return;

        Utils.showLoading('Menduplikat soal...');

        try {
            const newSoal = { ...soal };
            delete newSoal.id;
            newSoal.pertanyaan = '[DUPLIKAT] ' + newSoal.pertanyaan;
            newSoal.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            newSoal.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            await db.collection(COLLECTIONS.BANK_SOAL).add(newSoal);
            Utils.showNotification('Soal berhasil diduplikat', 'success');
            await BankSoal.loadSoal();
        } catch (error) {
            console.error('Error duplicating:', error);
            Utils.showNotification('Gagal menduplikat', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    deleteSoal: async (id) => {
        const confirm = await Utils.confirm('Hapus soal ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.BANK_SOAL).doc(id).delete();
            Utils.showNotification('Soal dihapus', 'success');
            await BankSoal.loadSoal();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    },

    exportSoal: () => {
        BankSoal.updateDropdowns();
        document.getElementById('export-modal').classList.remove('hidden');
    },

    closeExportModal: () => {
        document.getElementById('export-modal').classList.add('hidden');
    },

    doPrint: () => {
        const judul = document.getElementById('export-judul').value || 'SOAL ULANGAN';
        const mapelFilter = document.getElementById('export-mapel').value;
        const kelasFilter = document.getElementById('export-kelas').value;
        const tipeFilter = document.getElementById('export-tipe').value;
        const showAnswer = document.getElementById('export-show-answer').checked;

        let filtered = BankSoal.soalData;
        if (mapelFilter) filtered = filtered.filter(s => s.mapelId === mapelFilter);
        if (kelasFilter) filtered = filtered.filter(s => s.kelas === parseInt(kelasFilter));
        if (tipeFilter) filtered = filtered.filter(s => s.tipe === tipeFilter);

        if (filtered.length === 0) {
            Utils.showNotification('Tidak ada soal untuk dicetak', 'warning');
            return;
        }

        const mapel = mapelFilter ? MasterData.subjects.find(s => s.id === mapelFilter) : null;

        document.getElementById('soal-print-title').textContent = judul;
        document.getElementById('soal-print-school').textContent = Auth.userData.namaSekolah;

        document.getElementById('soal-print-info').innerHTML = `
            <dt>Mata Pelajaran</dt><dd>${mapel ? mapel.nama : 'Semua'}</dd>
            <dt>Kelas</dt><dd>${kelasFilter || 'Semua'}</dd>
            <dt>Jumlah Soal</dt><dd>${filtered.length}</dd>
            <dt>Waktu</dt><dd>... menit</dd>
        `;

        // Separate by type
        const pgSoal = filtered.filter(s => s.tipe === 'pilihan_ganda');
        const essaySoal = filtered.filter(s => s.tipe === 'essay' || s.tipe === 'isian_singkat');
        const bsSoal = filtered.filter(s => s.tipe === 'benar_salah');

        let content = '<div style="margin-top: 20px;">';
        content += '<p><strong>Petunjuk:</strong> Kerjakan soal-soal berikut dengan teliti!</p>';

        // Pilihan Ganda
        if (pgSoal.length > 0) {
            content += '<h3 style="margin-top: 20px;">I. PILIHAN GANDA</h3>';
            content += '<p style="font-size: 10pt;">Pilihlah jawaban yang paling tepat!</p>';
            pgSoal.forEach((soal, i) => {
                content += `
                    <div class="question-item">
                        <p><span class="question-number">${i + 1}.</span> ${soal.pertanyaan}</p>
                        <ol class="question-options" type="A">
                            ${Object.entries(soal.opsiJawaban || {}).filter(([k, v]) => v).map(([key, val]) => `
                                <li>${val} ${showAnswer && soal.jawaban === key ? '<strong>(✓)</strong>' : ''}</li>
                            `).join('')}
                        </ol>
                    </div>
                `;
            });
        }

        // Benar Salah
        if (bsSoal.length > 0) {
            content += '<h3 style="margin-top: 20px;">II. BENAR/SALAH</h3>';
            content += '<p style="font-size: 10pt;">Tentukan pernyataan berikut Benar (B) atau Salah (S)!</p>';
            bsSoal.forEach((soal, i) => {
                content += `
                    <div class="question-item">
                        <p><span class="question-number">${i + 1}.</span> ${soal.pertanyaan}
                        ${showAnswer ? `<strong>(${soal.jawaban === 'benar' ? 'B' : 'S'})</strong>` : '( B / S )'}</p>
                    </div>
                `;
            });
        }

        // Essay
        if (essaySoal.length > 0) {
            content += '<h3 style="margin-top: 20px;">III. ESSAY</h3>';
            content += '<p style="font-size: 10pt;">Jawablah pertanyaan berikut dengan jelas!</p>';
            essaySoal.forEach((soal, i) => {
                content += `
                    <div class="question-item">
                        <p><span class="question-number">${i + 1}.</span> ${soal.pertanyaan}</p>
                        ${showAnswer && soal.jawaban ? `<p style="color: green; font-style: italic;">Kunci: ${soal.jawaban}</p>` : ''}
                    </div>
                `;
            });
        }

        // Kunci Jawaban (if shown)
        if (showAnswer && pgSoal.length > 0) {
            content += `
                <div class="page-break"></div>
                <h3>KUNCI JAWABAN</h3>
                <table style="width: 50%;">
                    <thead>
                        <tr><th>No</th><th>Jawaban</th></tr>
                    </thead>
                    <tbody>
                        ${pgSoal.map((s, i) => `<tr><td style="text-align: center;">${i + 1}</td><td style="text-align: center;">${s.jawaban || '-'}</td></tr>`).join('')}
                    </tbody>
                </table>
            `;
        }

        content += '</div>';

        document.getElementById('soal-print-content').innerHTML = content;
        
        BankSoal.closeExportModal();
        Utils.printDocument('soal-print-template', judul);
    }
};