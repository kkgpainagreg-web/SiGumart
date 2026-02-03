// js/atp-kktp.js
// =====================================================
// ALUR TUJUAN PEMBELAJARAN & KKTP MODULE
// =====================================================

const AtpKktp = {
    atpData: [],
    kktpData: [],

    init: async () => {
        AtpKktp.renderATP();
        AtpKktp.renderKKTP();
        await AtpKktp.loadATP();
        await AtpKktp.loadKKTP();
    },

    // ==================== ATP ====================
    renderATP: () => {
        const container = document.getElementById('tab-atp');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Filter & Actions -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex flex-wrap gap-3">
                            <select id="atp-filter-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Mapel</option>
                            </select>
                            <select id="atp-filter-kelas" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Kelas</option>
                                ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                    `<option value="${k}">Kelas ${k}</option>`
                                ).join('')}
                            </select>
                            <select id="atp-filter-rombel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Rombel</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="AtpKktp.showAddATPModal()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition">
                                ➕ Tambah ATP
                            </button>
                            <button onclick="AtpKktp.printATP()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ATP Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mapel</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas/Rombel</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elemen</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capaian Pembelajaran</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan Pembelajaran</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alokasi Waktu</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profil Lulusan</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="atp-table-body" class="divide-y divide-gray-200">
                                <tr>
                                    <td colspan="9" class="px-4 py-8 text-center text-gray-400">
                                        Belum ada data ATP. Tambahkan dari Master Data atau manual.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Print Template -->
                <div id="atp-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1>ALUR TUJUAN PEMBELAJARAN (ATP)</h1>
                        <p id="atp-print-school"></p>
                        <p id="atp-print-tahun"></p>
                    </div>
                    <div id="atp-print-info" class="info-box"></div>
                    <table class="atp-table" id="atp-print-table"></table>
                    <div class="signature-area">
                        <div class="signature-box right">
                            <p id="atp-print-date"></p>
                            <p>Guru Mata Pelajaran</p>
                            <div class="signature-line"></div>
                            <p id="atp-print-teacher"></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add/Edit ATP Modal -->
            <div id="atp-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold" id="atp-modal-title">Tambah ATP</h3>
                        <button onclick="AtpKktp.closeATPModal()" class="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <form id="atp-form" class="space-y-4">
                        <input type="hidden" id="atp-edit-id">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                <select id="atp-mapel" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih Mapel</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                                <select id="atp-rombel" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih Rombel</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Elemen</label>
                            <select id="atp-elemen" required class="w-full px-3 py-2 border rounded-lg">
                                <option value="">Pilih Elemen</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran</label>
                            <textarea id="atp-cp" rows="3" required class="w-full px-3 py-2 border rounded-lg"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                            <div id="atp-tp-container" class="space-y-2">
                                <div class="flex space-x-2">
                                    <input type="text" class="atp-tp-input flex-1 px-3 py-2 border rounded-lg" 
                                        placeholder="Tujuan Pembelajaran 1">
                                    <button type="button" onclick="AtpKktp.removeTPInput(this)" 
                                        class="text-red-500 hover:text-red-700 px-2">✕</button>
                                </div>
                            </div>
                            <button type="button" onclick="AtpKktp.addTPInput()" 
                                class="mt-2 text-sm text-primary hover:underline">+ Tambah Tujuan Pembelajaran</button>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu (JP)</label>
                                <input type="number" id="atp-waktu" min="1" required 
                                    class="w-full px-3 py-2 border rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
                                <input type="number" id="atp-urutan" min="1" required 
                                    class="w-full px-3 py-2 border rounded-lg">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Dimensi Profil Lulusan</label>
                            <div class="grid grid-cols-2 gap-2">
                                ${PROFIL_LULUSAN.map(p => `
                                    <label class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" name="atp-profil" value="${p.id}" class="rounded">
                                        <span class="text-sm">${p.nama}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="AtpKktp.closeATPModal()" 
                                class="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                            <button type="submit" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('atp-form').addEventListener('submit', AtpKktp.saveATP);
        document.getElementById('atp-filter-mapel').addEventListener('change', AtpKktp.filterATP);
        document.getElementById('atp-filter-kelas').addEventListener('change', AtpKktp.filterATP);
        document.getElementById('atp-filter-rombel').addEventListener('change', AtpKktp.filterATP);
        document.getElementById('atp-mapel').addEventListener('change', AtpKktp.handleATPMapelChange);
    },

    showAddATPModal: () => {
        document.getElementById('atp-modal-title').textContent = 'Tambah ATP';
        document.getElementById('atp-form').reset();
        document.getElementById('atp-edit-id').value = '';
        AtpKktp.updateATPModalDropdowns();
        document.getElementById('atp-modal').classList.remove('hidden');
    },

    closeATPModal: () => {
        document.getElementById('atp-modal').classList.add('hidden');
    },

    updateATPModalDropdowns: () => {
        // Update mapel dropdown
        const mapelSelect = document.getElementById('atp-mapel');
        mapelSelect.innerHTML = '<option value="">Pilih Mapel</option>' + 
            MasterData.subjects.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');

        // Update rombel dropdown
        const rombelSelect = document.getElementById('atp-rombel');
        rombelSelect.innerHTML = '<option value="">Pilih Rombel</option>' + 
            MasterData.rombel.map(r => `<option value="${r.id}" data-kelas="${r.kelas}">${r.nama}</option>`).join('');

        // Update filter dropdowns
        document.getElementById('atp-filter-mapel').innerHTML = '<option value="">Semua Mapel</option>' + 
            MasterData.subjects.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
        document.getElementById('atp-filter-rombel').innerHTML = '<option value="">Semua Rombel</option>' + 
            MasterData.rombel.map(r => `<option value="${r.id}">${r.nama}</option>`).join('');
    },

    handleATPMapelChange: (e) => {
        const subject = MasterData.subjects.find(s => s.id === e.target.value);
        const elemenSelect = document.getElementById('atp-elemen');

        if (subject) {
            elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>' + 
                subject.elemen.map(el => `<option value="${el}">${el}</option>`).join('');
        } else {
            elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>';
        }
    },

    addTPInput: () => {
        const container = document.getElementById('atp-tp-container');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'flex space-x-2';
        div.innerHTML = `
            <input type="text" class="atp-tp-input flex-1 px-3 py-2 border rounded-lg" 
                placeholder="Tujuan Pembelajaran ${count}">
            <button type="button" onclick="AtpKktp.removeTPInput(this)" 
                class="text-red-500 hover:text-red-700 px-2">✕</button>
        `;
        container.appendChild(div);
    },

    removeTPInput: (btn) => {
        const container = document.getElementById('atp-tp-container');
        if (container.children.length > 1) {
            btn.parentElement.remove();
        }
    },

    saveATP: async (e) => {
        e.preventDefault();
        Utils.showLoading('Menyimpan ATP...');

        const editId = document.getElementById('atp-edit-id').value;
        const mapelId = document.getElementById('atp-mapel').value;
        const rombelId = document.getElementById('atp-rombel').value;
        const elemen = document.getElementById('atp-elemen').value;
        const cp = document.getElementById('atp-cp').value.trim();
        const tujuanPembelajaran = Array.from(document.querySelectorAll('.atp-tp-input'))
            .map(input => input.value.trim())
            .filter(v => v);
        const waktu = parseInt(document.getElementById('atp-waktu').value);
        const urutan = parseInt(document.getElementById('atp-urutan').value);
        const profilLulusan = Array.from(document.querySelectorAll('input[name="atp-profil"]:checked'))
            .map(cb => cb.value);

        const subject = MasterData.subjects.find(s => s.id === mapelId);
        const rombel = MasterData.rombel.find(r => r.id === rombelId);

        const atpData = {
            userId: Auth.currentUser.uid,
            npsn: Auth.userData.npsn,
            mapelId: mapelId,
            mapelNama: subject.nama,
            rombelId: rombelId,
            rombelNama: rombel.nama,
            kelas: rombel.kelas,
            elemen: elemen,
            capaianPembelajaran: cp,
            tujuanPembelajaran: tujuanPembelajaran,
            alokasiWaktu: waktu,
            urutan: urutan,
            profilLulusan: profilLulusan,
            tahunAjaran: Utils.getTahunAjaran(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection(COLLECTIONS.ATP).doc(editId).update(atpData);
                Utils.showNotification('ATP berhasil diperbarui', 'success');
            } else {
                atpData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(COLLECTIONS.ATP).add(atpData);
                Utils.showNotification('ATP berhasil disimpan', 'success');
            }
            
            AtpKktp.closeATPModal();
            await AtpKktp.loadATP();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error saving ATP:', error);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadATP: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.ATP)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('rombelNama')
                .orderBy('urutan')
                .get();

            AtpKktp.atpData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            AtpKktp.renderATPTable();
            AtpKktp.updateATPModalDropdowns();
        } catch (error) {
            console.error('Error loading ATP:', error);
        }
    },

    renderATPTable: (filteredData = null) => {
        const tbody = document.getElementById('atp-table-body');
        const data = filteredData || AtpKktp.atpData;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-4 py-8 text-center text-gray-400">
                        Belum ada data ATP
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((atp, index) => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm">${index + 1}</td>
                <td class="px-4 py-3 text-sm font-medium">${atp.mapelNama}</td>
                <td class="px-4 py-3 text-sm">${atp.rombelNama}</td>
                <td class="px-4 py-3 text-sm">${atp.elemen}</td>
                <td class="px-4 py-3 text-sm max-w-xs truncate" title="${atp.capaianPembelajaran}">
                    ${atp.capaianPembelajaran.substring(0, 100)}...
                </td>
                <td class="px-4 py-3 text-sm">
                    <ul class="list-disc list-inside">
                        ${atp.tujuanPembelajaran.slice(0, 2).map(tp => `<li class="truncate">${tp}</li>`).join('')}
                        ${atp.tujuanPembelajaran.length > 2 ? `<li class="text-gray-400">+${atp.tujuanPembelajaran.length - 2} lainnya</li>` : ''}
                    </ul>
                </td>
                <td class="px-4 py-3 text-sm text-center">${atp.alokasiWaktu} JP</td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex flex-wrap gap-1">
                        ${atp.profilLulusan.slice(0, 2).map(p => {
                            const profil = PROFIL_LULUSAN.find(pl => pl.id === p);
                            return profil ? `<span class="text-xs bg-gray-100 px-1 rounded">${profil.nama.split(' ')[0]}</span>` : '';
                        }).join('')}
                    </div>
                </td>
                <td class="px-4 py-3 text-center">
                    <button onclick="AtpKktp.editATP('${atp.id}')" class="text-blue-500 hover:text-blue-700 mx-1">✏️</button>
                    <button onclick="AtpKktp.deleteATP('${atp.id}')" class="text-red-500 hover:text-red-700 mx-1">🗑️</button>
                </td>
            </tr>
        `).join('');
    },

    filterATP: () => {
        const mapelFilter = document.getElementById('atp-filter-mapel').value;
        const kelasFilter = document.getElementById('atp-filter-kelas').value;
        const rombelFilter = document.getElementById('atp-filter-rombel').value;

        let filtered = AtpKktp.atpData;

        if (mapelFilter) filtered = filtered.filter(a => a.mapelId === mapelFilter);
        if (kelasFilter) filtered = filtered.filter(a => a.kelas === parseInt(kelasFilter));
        if (rombelFilter) filtered = filtered.filter(a => a.rombelId === rombelFilter);

        AtpKktp.renderATPTable(filtered);
    },

    editATP: async (id) => {
        const atp = AtpKktp.atpData.find(a => a.id === id);
        if (!atp) return;

        document.getElementById('atp-modal-title').textContent = 'Edit ATP';
        document.getElementById('atp-edit-id').value = id;
        AtpKktp.updateATPModalDropdowns();

        setTimeout(() => {
            document.getElementById('atp-mapel').value = atp.mapelId;
            AtpKktp.handleATPMapelChange({ target: { value: atp.mapelId } });
            
            setTimeout(() => {
                document.getElementById('atp-rombel').value = atp.rombelId;
                document.getElementById('atp-elemen').value = atp.elemen;
                document.getElementById('atp-cp').value = atp.capaianPembelajaran;
                document.getElementById('atp-waktu').value = atp.alokasiWaktu;
                document.getElementById('atp-urutan').value = atp.urutan;

                // Set TP inputs
                const container = document.getElementById('atp-tp-container');
                container.innerHTML = '';
                atp.tujuanPembelajaran.forEach((tp, i) => {
                    const div = document.createElement('div');
                    div.className = 'flex space-x-2';
                    div.innerHTML = `
                        <input type="text" class="atp-tp-input flex-1 px-3 py-2 border rounded-lg" 
                            value="${tp}" placeholder="Tujuan Pembelajaran ${i + 1}">
                        <button type="button" onclick="AtpKktp.removeTPInput(this)" 
                            class="text-red-500 hover:text-red-700 px-2">✕</button>
                    `;
                    container.appendChild(div);
                });

                // Set profil lulusan checkboxes
                document.querySelectorAll('input[name="atp-profil"]').forEach(cb => {
                    cb.checked = atp.profilLulusan.includes(cb.value);
                });
            }, 100);
        }, 100);

        document.getElementById('atp-modal').classList.remove('hidden');
    },

    deleteATP: async (id) => {
        const confirm = await Utils.confirm('Hapus ATP ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.ATP).doc(id).delete();
            Utils.showNotification('ATP dihapus', 'success');
            await AtpKktp.loadATP();
        } catch (error) {
            console.error('Error deleting ATP:', error);
        }
    },

    generateATPFromCP: async (cp) => {
        // Auto generate ATP for each rombel in the class
        const rombelList = MasterData.rombel.filter(r => r.kelas === cp.kelas);

        for (const rombel of rombelList) {
            const existingAtp = AtpKktp.atpData.find(a => 
                a.mapelId === cp.mapelId && 
                a.rombelId === rombel.id && 
                a.elemen === cp.elemen
            );

            if (existingAtp) continue; // Skip if already exists

            await db.collection(COLLECTIONS.ATP).add({
                userId: Auth.currentUser.uid,
                npsn: Auth.userData.npsn,
                mapelId: cp.mapelId,
                mapelNama: cp.mapelNama,
                rombelId: rombel.id,
                rombelNama: rombel.nama,
                kelas: rombel.kelas,
                elemen: cp.elemen,
                capaianPembelajaran: cp.capaianPembelajaran,
                tujuanPembelajaran: [`Peserta didik mampu memahami ${cp.elemen}`],
                alokasiWaktu: 4,
                urutan: 1,
                profilLulusan: cp.profilLulusan || [],
                tahunAjaran: Utils.getTahunAjaran(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        await AtpKktp.loadATP();
    },

    printATP: () => {
        const mapelFilter = document.getElementById('atp-filter-mapel').value;
        const rombelFilter = document.getElementById('atp-filter-rombel').value;

        let data = AtpKktp.atpData;
        if (mapelFilter) data = data.filter(a => a.mapelId === mapelFilter);
        if (rombelFilter) data = data.filter(a => a.rombelId === rombelFilter);

        if (data.length === 0) {
            Utils.showNotification('Tidak ada data untuk dicetak', 'warning');
            return;
        }

        const subject = mapelFilter ? MasterData.subjects.find(s => s.id === mapelFilter) : null;
        const rombel = rombelFilter ? MasterData.rombel.find(r => r.id === rombelFilter) : null;

        // Generate print content
        document.getElementById('atp-print-school').textContent = Auth.userData.namaSekolah;
        document.getElementById('atp-print-tahun').textContent = `Tahun Ajaran ${Utils.getTahunAjaran()}`;
        document.getElementById('atp-print-date').textContent = Utils.formatDate(new Date());
        document.getElementById('atp-print-teacher').textContent = Auth.userData.nama;

        document.getElementById('atp-print-info').innerHTML = `
            <dt>Mata Pelajaran</dt><dd>${subject ? subject.nama : 'Semua Mata Pelajaran'}</dd>
            <dt>Kelas/Rombel</dt><dd>${rombel ? rombel.nama : 'Semua Kelas'}</dd>
            <dt>Semester</dt><dd>${Utils.getSemester()}</dd>
        `;

        document.getElementById('atp-print-table').innerHTML = `
            <thead>
                <tr>
                    <th>No</th>
                    <th>Elemen</th>
                    <th>Capaian Pembelajaran</th>
                    <th>Tujuan Pembelajaran</th>
                    <th>Alokasi Waktu</th>
                    <th>Profil Lulusan</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((atp, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${atp.elemen}</td>
                        <td>${atp.capaianPembelajaran}</td>
                        <td><ol>${atp.tujuanPembelajaran.map(tp => `<li>${tp}</li>`).join('')}</ol></td>
                        <td>${atp.alokasiWaktu} JP</td>
                        <td>${atp.profilLulusan.map(p => PROFIL_LULUSAN.find(pl => pl.id === p)?.nama || p).join(', ')}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        Utils.printDocument('atp-print-template', 'Alur Tujuan Pembelajaran');
    },

    // ==================== KKTP ====================
    renderKKTP: () => {
        const container = document.getElementById('tab-kktp');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header & Filter -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex flex-wrap gap-3">
                            <select id="kktp-filter-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Mapel</option>
                            </select>
                            <select id="kktp-filter-rombel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Rombel</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="AtpKktp.showAddKKTPModal()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                                ➕ Tambah KKTP
                            </button>
                            <button onclick="AtpKktp.generateKKTPFromAllATP()" 
                                class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600">
                                ⚡ Generate dari ATP
                            </button>
                            <button onclick="AtpKktp.printKKTP()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                                🖨️ Cetak
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KKTP Cards -->
                <div id="kktp-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <p class="col-span-2 text-center text-gray-400 py-8">Belum ada data KKTP</p>
                </div>

                <!-- Print Template -->
                <div id="kktp-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1>KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h1>
                        <p id="kktp-print-school"></p>
                    </div>
                    <div id="kktp-print-content"></div>
                </div>
            </div>

            <!-- KKTP Modal -->
            <div id="kktp-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Tambah/Edit KKTP</h3>
                        <button onclick="AtpKktp.closeKKTPModal()" class="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <form id="kktp-form" class="space-y-4">
                        <input type="hidden" id="kktp-edit-id">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Pilih ATP</label>
                                <select id="kktp-atp" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih ATP</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tujuan Pembelajaran yang Dipilih</label>
                                <select id="kktp-tp" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih TP</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Kriteria Ketercapaian</label>
                            <div id="kktp-kriteria-container" class="space-y-4">
                                <!-- Kriteria items will be added here -->
                            </div>
                            <button type="button" onclick="AtpKktp.addKriteriaRow()" 
                                class="mt-3 text-sm text-primary hover:underline">+ Tambah Kriteria</button>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="AtpKktp.closeKKTPModal()" 
                                class="px-4 py-2 border rounded-lg">Batal</button>
                            <button type="submit" class="px-4 py-2 bg-primary text-white rounded-lg">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('kktp-form').addEventListener('submit', AtpKktp.saveKKTP);
        document.getElementById('kktp-filter-mapel').addEventListener('change', AtpKktp.filterKKTP);
        document.getElementById('kktp-filter-rombel').addEventListener('change', AtpKktp.filterKKTP);
        document.getElementById('kktp-atp').addEventListener('change', AtpKktp.handleKKTPAtpChange);
    },

    showAddKKTPModal: () => {
        document.getElementById('kktp-form').reset();
        document.getElementById('kktp-edit-id').value = '';
        
        // Populate ATP dropdown
        const atpSelect = document.getElementById('kktp-atp');
        atpSelect.innerHTML = '<option value="">Pilih ATP</option>' + 
            AtpKktp.atpData.map(atp => 
                `<option value="${atp.id}">${atp.mapelNama} - ${atp.rombelNama} - ${atp.elemen}</option>`
            ).join('');

        // Clear kriteria container and add default rows
        const container = document.getElementById('kktp-kriteria-container');
        container.innerHTML = '';
        AtpKktp.addKriteriaRow();
        AtpKktp.addKriteriaRow();
        AtpKktp.addKriteriaRow();

        document.getElementById('kktp-modal').classList.remove('hidden');
    },

    closeKKTPModal: () => {
        document.getElementById('kktp-modal').classList.add('hidden');
    },

    handleKKTPAtpChange: (e) => {
        const atp = AtpKktp.atpData.find(a => a.id === e.target.value);
        const tpSelect = document.getElementById('kktp-tp');

        if (atp && atp.tujuanPembelajaran) {
            tpSelect.innerHTML = '<option value="">Pilih TP</option>' + 
                atp.tujuanPembelajaran.map((tp, i) => 
                    `<option value="${i}">${tp}</option>`
                ).join('');
        } else {
            tpSelect.innerHTML = '<option value="">Pilih TP</option>';
        }
    },

    addKriteriaRow: () => {
        const container = document.getElementById('kktp-kriteria-container');
        const index = container.children.length + 1;
        
        const div = document.createElement('div');
        div.className = 'border rounded-lg p-4 bg-gray-50';
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-medium">Kriteria ${index}</span>
                <button type="button" onclick="this.closest('.border').remove()" 
                    class="text-red-500 hover:text-red-700">✕</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                    <label class="text-xs text-gray-500">Belum Berkembang</label>
                    <textarea class="kktp-bb w-full px-2 py-1 border rounded text-sm" rows="2" 
                        placeholder="Deskripsi..."></textarea>
                </div>
                <div>
                    <label class="text-xs text-gray-500">Mulai Berkembang</label>
                    <textarea class="kktp-mb w-full px-2 py-1 border rounded text-sm" rows="2" 
                        placeholder="Deskripsi..."></textarea>
                </div>
                <div>
                    <label class="text-xs text-gray-500">Berkembang Sesuai Harapan</label>
                    <textarea class="kktp-bsh w-full px-2 py-1 border rounded text-sm" rows="2" 
                        placeholder="Deskripsi..."></textarea>
                </div>
                <div>
                    <label class="text-xs text-gray-500">Sangat Berkembang</label>
                    <textarea class="kktp-sb w-full px-2 py-1 border rounded text-sm" rows="2" 
                        placeholder="Deskripsi..."></textarea>
                </div>
            </div>
        `;
        container.appendChild(div);
    },

    saveKKTP: async (e) => {
        e.preventDefault();
        Utils.showLoading('Menyimpan KKTP...');

        const editId = document.getElementById('kktp-edit-id').value;
        const atpId = document.getElementById('kktp-atp').value;
        const tpIndex = document.getElementById('kktp-tp').value;

        const atp = AtpKktp.atpData.find(a => a.id === atpId);
        if (!atp) return;

        // Collect kriteria
        const kriteriaElements = document.querySelectorAll('#kktp-kriteria-container > div');
        const kriteria = Array.from(kriteriaElements).map(el => ({
            belumBerkembang: el.querySelector('.kktp-bb').value.trim(),
            mulaiBerkembang: el.querySelector('.kktp-mb').value.trim(),
            berkembangSesuaiHarapan: el.querySelector('.kktp-bsh').value.trim(),
            sangatBerkembang: el.querySelector('.kktp-sb').value.trim()
        })).filter(k => k.belumBerkembang || k.mulaiBerkembang || k.berkembangSesuaiHarapan || k.sangatBerkembang);

        const kktpData = {
            userId: Auth.currentUser.uid,
            npsn: Auth.userData.npsn,
            atpId: atpId,
            mapelId: atp.mapelId,
            mapelNama: atp.mapelNama,
            rombelId: atp.rombelId,
            rombelNama: atp.rombelNama,
            elemen: atp.elemen,
            tujuanPembelajaran: atp.tujuanPembelajaran[parseInt(tpIndex)],
            tpIndex: parseInt(tpIndex),
            kriteria: kriteria,
            tahunAjaran: Utils.getTahunAjaran(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection(COLLECTIONS.KKTP).doc(editId).update(kktpData);
            } else {
                kktpData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(COLLECTIONS.KKTP).add(kktpData);
            }

            Utils.showNotification('KKTP berhasil disimpan', 'success');
            AtpKktp.closeKKTPModal();
            await AtpKktp.loadKKTP();
        } catch (error) {
            console.error('Error saving KKTP:', error);
            Utils.showNotification('Gagal menyimpan', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadKKTP: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.KKTP)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            AtpKktp.kktpData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            AtpKktp.renderKKTPList();
            AtpKktp.updateKKTPFilters();
        } catch (error) {
            console.error('Error loading KKTP:', error);
        }
    },

    renderKKTPList: (filteredData = null) => {
        const container = document.getElementById('kktp-list');
        const data = filteredData || AtpKktp.kktpData;

        if (data.length === 0) {
            container.innerHTML = '<p class="col-span-2 text-center text-gray-400 py-8">Belum ada data KKTP</p>';
            return;
        }

        container.innerHTML = data.map(kktp => `
            <div class="bg-white rounded-xl shadow p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-semibold text-gray-800">${kktp.mapelNama}</h4>
                        <p class="text-sm text-gray-500">${kktp.rombelNama} • ${kktp.elemen}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="AtpKktp.editKKTP('${kktp.id}')" class="text-blue-500 hover:text-blue-700">✏️</button>
                        <button onclick="AtpKktp.deleteKKTP('${kktp.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 mb-3">
                    <p class="text-sm font-medium text-gray-700">Tujuan Pembelajaran:</p>
                    <p class="text-sm text-gray-600">${kktp.tujuanPembelajaran}</p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="p-2 text-left">Belum Berkembang</th>
                                <th class="p-2 text-left">Mulai Berkembang</th>
                                <th class="p-2 text-left">Berkembang Sesuai Harapan</th>
                                <th class="p-2 text-left">Sangat Berkembang</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${kktp.kriteria.map(k => `
                                <tr class="border-b">
                                    <td class="p-2">${k.belumBerkembang || '-'}</td>
                                    <td class="p-2">${k.mulaiBerkembang || '-'}</td>
                                    <td class="p-2">${k.berkembangSesuaiHarapan || '-'}</td>
                                    <td class="p-2">${k.sangatBerkembang || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },

    updateKKTPFilters: () => {
        document.getElementById('kktp-filter-mapel').innerHTML = '<option value="">Semua Mapel</option>' + 
            MasterData.subjects.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
        document.getElementById('kktp-filter-rombel').innerHTML = '<option value="">Semua Rombel</option>' + 
            MasterData.rombel.map(r => `<option value="${r.id}">${r.nama}</option>`).join('');
    },

    filterKKTP: () => {
        const mapelFilter = document.getElementById('kktp-filter-mapel').value;
        const rombelFilter = document.getElementById('kktp-filter-rombel').value;

        let filtered = AtpKktp.kktpData;
        if (mapelFilter) filtered = filtered.filter(k => k.mapelId === mapelFilter);
        if (rombelFilter) filtered = filtered.filter(k => k.rombelId === rombelFilter);

        AtpKktp.renderKKTPList(filtered);
    },

    editKKTP: async (id) => {
        const kktp = AtpKktp.kktpData.find(k => k.id === id);
        if (!kktp) return;

        document.getElementById('kktp-edit-id').value = id;
        
        // Populate ATP dropdown
        const atpSelect = document.getElementById('kktp-atp');
        atpSelect.innerHTML = '<option value="">Pilih ATP</option>' + 
            AtpKktp.atpData.map(atp => 
                `<option value="${atp.id}">${atp.mapelNama} - ${atp.rombelNama} - ${atp.elemen}</option>`
            ).join('');
        atpSelect.value = kktp.atpId;

        AtpKktp.handleKKTPAtpChange({ target: { value: kktp.atpId } });
        
        setTimeout(() => {
            document.getElementById('kktp-tp').value = kktp.tpIndex;

            // Populate kriteria
            const container = document.getElementById('kktp-kriteria-container');
            container.innerHTML = '';
            kktp.kriteria.forEach((k, i) => {
                AtpKktp.addKriteriaRow();
                const row = container.children[i];
                row.querySelector('.kktp-bb').value = k.belumBerkembang || '';
                row.querySelector('.kktp-mb').value = k.mulaiBerkembang || '';
                row.querySelector('.kktp-bsh').value = k.berkembangSesuaiHarapan || '';
                row.querySelector('.kktp-sb').value = k.sangatBerkembang || '';
            });
        }, 100);

        document.getElementById('kktp-modal').classList.remove('hidden');
    },

    deleteKKTP: async (id) => {
        const confirm = await Utils.confirm('Hapus KKTP ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.KKTP).doc(id).delete();
            Utils.showNotification('KKTP dihapus', 'success');
            await AtpKktp.loadKKTP();
        } catch (error) {
            console.error('Error deleting KKTP:', error);
        }
    },

    generateKKTPFromCP: async (cp) => {
        // This is called from MasterData.generateFromCP
        // Just a placeholder - actual generation happens in generateKKTPFromAllATP
    },

    generateKKTPFromAllATP: async () => {
        if (AtpKktp.atpData.length === 0) {
            Utils.showNotification('Tidak ada ATP untuk generate KKTP', 'warning');
            return;
        }

        const confirm = await Utils.confirm('Generate KKTP untuk semua ATP?');
        if (!confirm) return;

        Utils.showLoading('Generating KKTP...');

        try {
            for (const atp of AtpKktp.atpData) {
                for (let i = 0; i < atp.tujuanPembelajaran.length; i++) {
                    // Check if KKTP already exists
                    const exists = AtpKktp.kktpData.find(k => 
                        k.atpId === atp.id && k.tpIndex === i
                    );
                    if (exists) continue;

                    await db.collection(COLLECTIONS.KKTP).add({
                        userId: Auth.currentUser.uid,
                        npsn: Auth.userData.npsn,
                        atpId: atp.id,
                        mapelId: atp.mapelId,
                        mapelNama: atp.mapelNama,
                        rombelId: atp.rombelId,
                        rombelNama: atp.rombelNama,
                        elemen: atp.elemen,
                        tujuanPembelajaran: atp.tujuanPembelajaran[i],
                        tpIndex: i,
                        kriteria: [
                            {
                                belumBerkembang: 'Peserta didik belum mampu mencapai tujuan pembelajaran',
                                mulaiBerkembang: 'Peserta didik mulai menunjukkan kemampuan sesuai tujuan pembelajaran',
                                berkembangSesuaiHarapan: 'Peserta didik mampu mencapai tujuan pembelajaran',
                                sangatBerkembang: 'Peserta didik mampu melampaui tujuan pembelajaran'
                            }
                        ],
                        tahunAjaran: Utils.getTahunAjaran(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            Utils.showNotification('KKTP berhasil di-generate', 'success');
            await AtpKktp.loadKKTP();
        } catch (error) {
            console.error('Error generating KKTP:', error);
            Utils.showNotification('Gagal generate KKTP', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    printKKTP: () => {
        if (AtpKktp.kktpData.length === 0) {
            Utils.showNotification('Tidak ada data untuk dicetak', 'warning');
            return;
        }

        document.getElementById('kktp-print-school').textContent = Auth.userData.namaSekolah;
        
        let content = '';
        AtpKktp.kktpData.forEach((kktp, i) => {
            content += `
                <div class="modul-section ${i > 0 ? 'page-break' : ''}">
                    <h3>${kktp.mapelNama} - ${kktp.rombelNama}</h3>
                    <p><strong>Elemen:</strong> ${kktp.elemen}</p>
                    <p><strong>Tujuan Pembelajaran:</strong> ${kktp.tujuanPembelajaran}</p>
                    <table>
                        <thead>
                            <tr>
                                <th width="25%">Belum Berkembang</th>
                                <th width="25%">Mulai Berkembang</th>
                                <th width="25%">Berkembang Sesuai Harapan</th>
                                <th width="25%">Sangat Berkembang</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${kktp.kriteria.map(k => `
                                <tr>
                                    <td>${k.belumBerkembang || '-'}</td>
                                    <td>${k.mulaiBerkembang || '-'}</td>
                                    <td>${k.berkembangSesuaiHarapan || '-'}</td>
                                    <td>${k.sangatBerkembang || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        });

        document.getElementById('kktp-print-content').innerHTML = content;
        Utils.printDocument('kktp-print-template', 'KKTP');
    }
};