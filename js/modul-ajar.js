// js/modul-ajar.js
// =====================================================
// MODUL AJAR MODULE
// =====================================================

const ModulAjar = {
    modulData: [],

    init: async () => {
        ModulAjar.render();
        await ModulAjar.loadModul();
    },

    render: () => {
        const container = document.getElementById('tab-modul');
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-wrap justify-between items-center gap-4">
                        <div class="flex gap-3">
                            <select id="modul-filter-mapel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Mapel</option>
                            </select>
                            <select id="modul-filter-rombel" class="px-4 py-2 border rounded-lg">
                                <option value="">Semua Rombel</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="ModulAjar.showAddModulModal()" 
                                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
                                ➕ Buat Modul Ajar
                            </button>
                            <button onclick="ModulAjar.generateFromATP()" 
                                class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-green-600">
                                ⚡ Generate dari ATP
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Modul List -->
                <div id="modul-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="col-span-full text-center text-gray-400 py-8">
                        Belum ada modul ajar. Klik "Buat Modul Ajar" untuk memulai.
                    </div>
                </div>

                <!-- Print Template -->
                <div id="modul-print-template" class="hidden print-only">
                    <div class="doc-header">
                        <h1>MODUL AJAR</h1>
                        <p id="modul-print-school"></p>
                    </div>
                    <div id="modul-print-content"></div>
                </div>
            </div>

            <!-- Add/Edit Modul Modal -->
            <div id="modul-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-xl w-full max-w-5xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
                    <div class="flex justify-between items-center p-4 border-b">
                        <h3 class="text-lg font-semibold" id="modul-modal-title">Buat Modul Ajar</h3>
                        <button onclick="ModulAjar.closeModulModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>
                    <div class="overflow-y-auto flex-1 p-6">
                        <form id="modul-form" class="space-y-6">
                            <input type="hidden" id="modul-edit-id">
                            
                            <!-- Informasi Umum -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-primary">📋 Informasi Umum</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Mata Pelajaran *</label>
                                        <select id="modul-mapel" required class="w-full px-3 py-2 border rounded-lg">
                                            <option value="">Pilih Mapel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Rombel *</label>
                                        <select id="modul-rombel" required class="w-full px-3 py-2 border rounded-lg">
                                            <option value="">Pilih Rombel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Alokasi Waktu *</label>
                                        <input type="text" id="modul-waktu" required placeholder="2 x 40 menit" 
                                            class="w-full px-3 py-2 border rounded-lg">
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Judul Modul *</label>
                                        <input type="text" id="modul-judul" required 
                                            class="w-full px-3 py-2 border rounded-lg" placeholder="Judul modul ajar">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Pertemuan Ke</label>
                                        <input type="number" id="modul-pertemuan" min="1" 
                                            class="w-full px-3 py-2 border rounded-lg" placeholder="1">
                                    </div>
                                </div>
                            </div>

                            <!-- Capaian & Tujuan -->
                            <div class="bg-blue-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-blue-700">🎯 Capaian & Tujuan Pembelajaran</h4>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Capaian Pembelajaran</label>
                                        <textarea id="modul-cp" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Capaian pembelajaran yang akan dicapai"></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Tujuan Pembelajaran *</label>
                                        <div id="modul-tp-container" class="space-y-2">
                                            <div class="flex space-x-2">
                                                <input type="text" class="modul-tp-input flex-1 px-3 py-2 border rounded-lg" 
                                                    placeholder="Tujuan Pembelajaran 1">
                                                <button type="button" onclick="ModulAjar.removeTPInput(this)" 
                                                    class="text-red-500 hover:text-red-700 px-2">✕</button>
                                            </div>
                                        </div>
                                        <button type="button" onclick="ModulAjar.addTPInput()" 
                                            class="mt-2 text-sm text-primary hover:underline">+ Tambah Tujuan</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Profil Lulusan -->
                            <div class="bg-purple-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-purple-700">👤 Dimensi Profil Lulusan</h4>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    ${PROFIL_LULUSAN.map(p => `
                                        <label class="flex items-center space-x-2 p-2 bg-white border rounded hover:bg-purple-100 cursor-pointer">
                                            <input type="checkbox" name="modul-profil" value="${p.id}" class="rounded">
                                            <span class="text-sm">${p.nama}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Pemahaman Bermakna -->
                            <div class="bg-green-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-green-700">💡 Pemahaman Bermakna</h4>
                                <textarea id="modul-pemahaman" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                    placeholder="Pemahaman bermakna yang akan diperoleh peserta didik"></textarea>
                            </div>

                            <!-- Pertanyaan Pemantik -->
                            <div class="bg-yellow-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-yellow-700">❓ Pertanyaan Pemantik</h4>
                                <div id="modul-pertanyaan-container" class="space-y-2">
                                    <div class="flex space-x-2">
                                        <input type="text" class="modul-pertanyaan-input flex-1 px-3 py-2 border rounded-lg" 
                                            placeholder="Pertanyaan pemantik 1">
                                        <button type="button" onclick="ModulAjar.removePertanyaanInput(this)" 
                                            class="text-red-500 hover:text-red-700 px-2">✕</button>
                                    </div>
                                </div>
                                <button type="button" onclick="ModulAjar.addPertanyaanInput()" 
                                    class="mt-2 text-sm text-primary hover:underline">+ Tambah Pertanyaan</button>
                            </div>

                            <!-- Kegiatan Pembelajaran -->
                            <div class="bg-orange-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-orange-700">📚 Kegiatan Pembelajaran</h4>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Pendahuluan</label>
                                        <textarea id="modul-pendahuluan" rows="3" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Kegiatan pendahuluan..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Kegiatan Inti</label>
                                        <textarea id="modul-inti" rows="5" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Kegiatan inti pembelajaran..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Penutup</label>
                                        <textarea id="modul-penutup" rows="3" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Kegiatan penutup..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Asesmen -->
                            <div class="bg-red-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-red-700">📝 Asesmen</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Asesmen Formatif</label>
                                        <textarea id="modul-asesmen-formatif" rows="3" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Asesmen formatif..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Asesmen Sumatif</label>
                                        <textarea id="modul-asesmen-sumatif" rows="3" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Asesmen sumatif..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Pengayaan & Remedial -->
                            <div class="bg-indigo-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-indigo-700">📖 Pengayaan & Remedial</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Pengayaan</label>
                                        <textarea id="modul-pengayaan" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Kegiatan pengayaan..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Remedial</label>
                                        <textarea id="modul-remedial" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Kegiatan remedial..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Refleksi -->
                            <div class="bg-teal-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-teal-700">🔄 Refleksi</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Refleksi Guru</label>
                                        <textarea id="modul-refleksi-guru" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Refleksi untuk guru..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Refleksi Peserta Didik</label>
                                        <textarea id="modul-refleksi-siswa" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Refleksi untuk peserta didik..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Sumber & Media -->
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h4 class="font-semibold mb-3 text-gray-700">📦 Sumber & Media Pembelajaran</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Sumber Belajar</label>
                                        <textarea id="modul-sumber" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="Buku, website, dll..."></textarea>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-1">Media & Alat</label>
                                        <textarea id="modul-media" rows="2" class="w-full px-3 py-2 border rounded-lg"
                                            placeholder="LCD, papan tulis, dll..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                        <button type="button" onclick="ModulAjar.closeModulModal()" 
                            class="px-6 py-2 border rounded-lg hover:bg-gray-100">Batal</button>
                        <button type="button" onclick="ModulAjar.saveModul()" 
                            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">💾 Simpan Modul</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        document.getElementById('modul-filter-mapel').addEventListener('change', ModulAjar.filterModul);
        document.getElementById('modul-filter-rombel').addEventListener('change', ModulAjar.filterModul);

        ModulAjar.updateDropdowns();
    },

    updateDropdowns: () => {
        const mapelOptions = MasterData.subjects.map(s => 
            `<option value="${s.id}" data-nama="${s.nama}">${s.nama}</option>`
        ).join('');
        const rombelOptions = MasterData.rombel.map(r => 
            `<option value="${r.id}" data-nama="${r.nama}">${r.nama}</option>`
        ).join('');

        document.getElementById('modul-filter-mapel').innerHTML = '<option value="">Semua Mapel</option>' + mapelOptions;
        document.getElementById('modul-filter-rombel').innerHTML = '<option value="">Semua Rombel</option>' + rombelOptions;
        document.getElementById('modul-mapel').innerHTML = '<option value="">Pilih Mapel</option>' + mapelOptions;
        document.getElementById('modul-rombel').innerHTML = '<option value="">Pilih Rombel</option>' + rombelOptions;
    },

    showAddModulModal: () => {
        document.getElementById('modul-modal-title').textContent = 'Buat Modul Ajar Baru';
        document.getElementById('modul-form').reset();
        document.getElementById('modul-edit-id').value = '';
        
        // Reset TP container
        document.getElementById('modul-tp-container').innerHTML = `
            <div class="flex space-x-2">
                <input type="text" class="modul-tp-input flex-1 px-3 py-2 border rounded-lg" 
                    placeholder="Tujuan Pembelajaran 1">
                <button type="button" onclick="ModulAjar.removeTPInput(this)" 
                    class="text-red-500 hover:text-red-700 px-2">✕</button>
            </div>
        `;

        // Reset pertanyaan container
        document.getElementById('modul-pertanyaan-container').innerHTML = `
            <div class="flex space-x-2">
                <input type="text" class="modul-pertanyaan-input flex-1 px-3 py-2 border rounded-lg" 
                    placeholder="Pertanyaan pemantik 1">
                <button type="button" onclick="ModulAjar.removePertanyaanInput(this)" 
                    class="text-red-500 hover:text-red-700 px-2">✕</button>
            </div>
        `;

        document.getElementById('modul-modal').classList.remove('hidden');
    },

    closeModulModal: () => {
        document.getElementById('modul-modal').classList.add('hidden');
    },

    addTPInput: () => {
        const container = document.getElementById('modul-tp-container');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'flex space-x-2';
        div.innerHTML = `
            <input type="text" class="modul-tp-input flex-1 px-3 py-2 border rounded-lg" 
                placeholder="Tujuan Pembelajaran ${count}">
            <button type="button" onclick="ModulAjar.removeTPInput(this)" 
                class="text-red-500 hover:text-red-700 px-2">✕</button>
        `;
        container.appendChild(div);
    },

    removeTPInput: (btn) => {
        const container = document.getElementById('modul-tp-container');
        if (container.children.length > 1) {
            btn.parentElement.remove();
        }
    },

    addPertanyaanInput: () => {
        const container = document.getElementById('modul-pertanyaan-container');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'flex space-x-2';
        div.innerHTML = `
            <input type="text" class="modul-pertanyaan-input flex-1 px-3 py-2 border rounded-lg" 
                placeholder="Pertanyaan pemantik ${count}">
            <button type="button" onclick="ModulAjar.removePertanyaanInput(this)" 
                class="text-red-500 hover:text-red-700 px-2">✕</button>
        `;
        container.appendChild(div);
    },

    removePertanyaanInput: (btn) => {
        const container = document.getElementById('modul-pertanyaan-container');
        if (container.children.length > 1) {
            btn.parentElement.remove();
        }
    },

    saveModul: async () => {
        const mapelId = document.getElementById('modul-mapel').value;
        const rombelId = document.getElementById('modul-rombel').value;
        const judul = document.getElementById('modul-judul').value.trim();

        if (!mapelId || !rombelId || !judul) {
            Utils.showNotification('Lengkapi field yang wajib diisi', 'warning');
            return;
        }

        Utils.showLoading('Menyimpan modul ajar...');

        const editId = document.getElementById('modul-edit-id').value;
        const mapelNama = document.getElementById('modul-mapel').selectedOptions[0].dataset.nama;
        const rombelNama = document.getElementById('modul-rombel').selectedOptions[0].dataset.nama;

        const tujuanPembelajaran = Array.from(document.querySelectorAll('.modul-tp-input'))
            .map(input => input.value.trim())
            .filter(v => v);

        const pertanyaanPemantik = Array.from(document.querySelectorAll('.modul-pertanyaan-input'))
            .map(input => input.value.trim())
            .filter(v => v);

        const profilLulusan = Array.from(document.querySelectorAll('input[name="modul-profil"]:checked'))
            .map(cb => cb.value);

        const data = {
            userId: Auth.currentUser.uid,
            npsn: Auth.userData.npsn,
            mapelId: mapelId,
            mapelNama: mapelNama,
            rombelId: rombelId,
            rombelNama: rombelNama,
            judul: judul,
            alokasiWaktu: document.getElementById('modul-waktu').value.trim(),
            pertemuan: parseInt(document.getElementById('modul-pertemuan').value) || 1,
            capaianPembelajaran: document.getElementById('modul-cp').value.trim(),
            tujuanPembelajaran: tujuanPembelajaran,
            profilLulusan: profilLulusan,
            pemahamanBermakna: document.getElementById('modul-pemahaman').value.trim(),
            pertanyaanPemantik: pertanyaanPemantik,
            kegiatanPendahuluan: document.getElementById('modul-pendahuluan').value.trim(),
            kegiatanInti: document.getElementById('modul-inti').value.trim(),
            kegiatanPenutup: document.getElementById('modul-penutup').value.trim(),
            asesmenFormatif: document.getElementById('modul-asesmen-formatif').value.trim(),
            asesmenSumatif: document.getElementById('modul-asesmen-sumatif').value.trim(),
            pengayaan: document.getElementById('modul-pengayaan').value.trim(),
            remedial: document.getElementById('modul-remedial').value.trim(),
            refleksiGuru: document.getElementById('modul-refleksi-guru').value.trim(),
            refleksiSiswa: document.getElementById('modul-refleksi-siswa').value.trim(),
            sumberBelajar: document.getElementById('modul-sumber').value.trim(),
            mediaAlat: document.getElementById('modul-media').value.trim(),
            tahunAjaran: Utils.getTahunAjaran(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (editId) {
                await db.collection(COLLECTIONS.MODUL_AJAR).doc(editId).update(data);
                Utils.showNotification('Modul ajar berhasil diperbarui', 'success');
            } else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection(COLLECTIONS.MODUL_AJAR).add(data);
                Utils.showNotification('Modul ajar berhasil disimpan', 'success');
            }

            ModulAjar.closeModulModal();
            await ModulAjar.loadModul();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error saving modul:', error);
            Utils.showNotification('Gagal menyimpan', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadModul: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.MODUL_AJAR)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            ModulAjar.modulData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            ModulAjar.renderModulList();
        } catch (error) {
            console.error('Error loading modul:', error);
        }
    },

    renderModulList: (filteredData = null) => {
        const container = document.getElementById('modul-list');
        const data = filteredData || ModulAjar.modulData;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-8">
                    Belum ada modul ajar
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(modul => `
            <div class="bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition">
                <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                    <h4 class="font-semibold text-white">${modul.judul}</h4>
                    <p class="text-blue-100 text-sm">${modul.mapelNama} • ${modul.rombelNama}</p>
                </div>
                <div class="p-4">
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Pertemuan ${modul.pertemuan || 1}
                        </span>
                        <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ${modul.alokasiWaktu || '-'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">
                        ${modul.tujuanPembelajaran && modul.tujuanPembelajaran[0] ? modul.tujuanPembelajaran[0] : 'Tidak ada tujuan pembelajaran'}
                    </p>
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${(modul.profilLulusan || []).slice(0, 3).map(p => {
                            const profil = PROFIL_LULUSAN.find(pl => pl.id === p);
                            return profil ? `<span class="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">${profil.nama.split(' ')[0]}</span>` : '';
                        }).join('')}
                    </div>
                    <div class="flex justify-between items-center pt-3 border-t">
                        <span class="text-xs text-gray-400">
                            ${modul.createdAt ? Utils.formatDateShort(modul.createdAt.toDate()) : '-'}
                        </span>
                        <div class="flex space-x-2">
                            <button onclick="ModulAjar.viewModul('${modul.id}')" 
                                class="text-blue-500 hover:text-blue-700" title="Lihat">👁️</button>
                            <button onclick="ModulAjar.editModul('${modul.id}')" 
                                class="text-green-500 hover:text-green-700" title="Edit">✏️</button>
                            <button onclick="ModulAjar.printModul('${modul.id}')" 
                                class="text-gray-500 hover:text-gray-700" title="Cetak">🖨️</button>
                            <button onclick="ModulAjar.deleteModul('${modul.id}')" 
                                class="text-red-500 hover:text-red-700" title="Hapus">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filterModul: () => {
        const mapelFilter = document.getElementById('modul-filter-mapel').value;
        const rombelFilter = document.getElementById('modul-filter-rombel').value;

        let filtered = ModulAjar.modulData;
        if (mapelFilter) filtered = filtered.filter(m => m.mapelId === mapelFilter);
        if (rombelFilter) filtered = filtered.filter(m => m.rombelId === rombelFilter);

        ModulAjar.renderModulList(filtered);
    },

    editModul: (id) => {
        const modul = ModulAjar.modulData.find(m => m.id === id);
        if (!modul) return;

        document.getElementById('modul-modal-title').textContent = 'Edit Modul Ajar';
        document.getElementById('modul-edit-id').value = id;

        // Fill form fields
        document.getElementById('modul-mapel').value = modul.mapelId;
        document.getElementById('modul-rombel').value = modul.rombelId;
        document.getElementById('modul-judul').value = modul.judul || '';
        document.getElementById('modul-waktu').value = modul.alokasiWaktu || '';
        document.getElementById('modul-pertemuan').value = modul.pertemuan || 1;
        document.getElementById('modul-cp').value = modul.capaianPembelajaran || '';
        document.getElementById('modul-pemahaman').value = modul.pemahamanBermakna || '';
        document.getElementById('modul-pendahuluan').value = modul.kegiatanPendahuluan || '';
        document.getElementById('modul-inti').value = modul.kegiatanInti || '';
        document.getElementById('modul-penutup').value = modul.kegiatanPenutup || '';
        document.getElementById('modul-asesmen-formatif').value = modul.asesmenFormatif || '';
        document.getElementById('modul-asesmen-sumatif').value = modul.asesmenSumatif || '';
        document.getElementById('modul-pengayaan').value = modul.pengayaan || '';
        document.getElementById('modul-remedial').value = modul.remedial || '';
        document.getElementById('modul-refleksi-guru').value = modul.refleksiGuru || '';
        document.getElementById('modul-refleksi-siswa').value = modul.refleksiSiswa || '';
        document.getElementById('modul-sumber').value = modul.sumberBelajar || '';
        document.getElementById('modul-media').value = modul.mediaAlat || '';

        // Fill TP inputs
        const tpContainer = document.getElementById('modul-tp-container');
        tpContainer.innerHTML = '';
        (modul.tujuanPembelajaran || ['']).forEach((tp, i) => {
            const div = document.createElement('div');
            div.className = 'flex space-x-2';
            div.innerHTML = `
                <input type="text" class="modul-tp-input flex-1 px-3 py-2 border rounded-lg" 
                    value="${tp}" placeholder="Tujuan Pembelajaran ${i + 1}">
                <button type="button" onclick="ModulAjar.removeTPInput(this)" 
                    class="text-red-500 hover:text-red-700 px-2">✕</button>
            `;
            tpContainer.appendChild(div);
        });

        // Fill pertanyaan inputs
        const pertanyaanContainer = document.getElementById('modul-pertanyaan-container');
        pertanyaanContainer.innerHTML = '';
        (modul.pertanyaanPemantik || ['']).forEach((p, i) => {
            const div = document.createElement('div');
            div.className = 'flex space-x-2';
            div.innerHTML = `
                <input type="text" class="modul-pertanyaan-input flex-1 px-3 py-2 border rounded-lg" 
                    value="${p}" placeholder="Pertanyaan pemantik ${i + 1}">
                <button type="button" onclick="ModulAjar.removePertanyaanInput(this)" 
                    class="text-red-500 hover:text-red-700 px-2">✕</button>
            `;
            pertanyaanContainer.appendChild(div);
        });

        // Check profil lulusan
        document.querySelectorAll('input[name="modul-profil"]').forEach(cb => {
            cb.checked = (modul.profilLulusan || []).includes(cb.value);
        });

        document.getElementById('modul-modal').classList.remove('hidden');
    },

    viewModul: (id) => {
        const modul = ModulAjar.modulData.find(m => m.id === id);
        if (!modul) return;

        // Create view modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto p-6">
                <div class="flex justify-between items-center mb-4 pb-4 border-b">
                    <h3 class="text-xl font-bold">${modul.judul}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <div class="grid grid-cols-3 gap-4 mb-6 text-sm">
                    <div><span class="text-gray-500">Mata Pelajaran:</span> <strong>${modul.mapelNama}</strong></div>
                    <div><span class="text-gray-500">Kelas:</span> <strong>${modul.rombelNama}</strong></div>
                    <div><span class="text-gray-500">Alokasi Waktu:</span> <strong>${modul.alokasiWaktu || '-'}</strong></div>
                </div>

                ${modul.capaianPembelajaran ? `
                    <div class="mb-4">
                        <h4 class="font-semibold text-blue-700 mb-2">Capaian Pembelajaran</h4>
                        <p class="text-gray-700 bg-blue-50 p-3 rounded">${modul.capaianPembelajaran}</p>
                    </div>
                ` : ''}

                ${modul.tujuanPembelajaran && modul.tujuanPembelajaran.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="font-semibold text-green-700 mb-2">Tujuan Pembelajaran</h4>
                        <ol class="list-decimal list-inside bg-green-50 p-3 rounded">
                            ${modul.tujuanPembelajaran.map(tp => `<li class="mb-1">${tp}</li>`).join('')}
                        </ol>
                    </div>
                ` : ''}

                ${modul.profilLulusan && modul.profilLulusan.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="font-semibold text-purple-700 mb-2">Profil Lulusan</h4>
                        <div class="flex flex-wrap gap-2">
                            ${modul.profilLulusan.map(p => {
                                const profil = PROFIL_LULUSAN.find(pl => pl.id === p);
                                return profil ? `<span class="bg-purple-100 text-purple-800 px-3 py-1 rounded">${profil.nama}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${modul.pertanyaanPemantik && modul.pertanyaanPemantik.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="font-semibold text-yellow-700 mb-2">Pertanyaan Pemantik</h4>
                        <ul class="list-disc list-inside bg-yellow-50 p-3 rounded">
                            ${modul.pertanyaanPemantik.map(p => `<li class="mb-1">${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="mb-4">
                    <h4 class="font-semibold text-orange-700 mb-2">Kegiatan Pembelajaran</h4>
                    <div class="space-y-2 bg-orange-50 p-3 rounded">
                        ${modul.kegiatanPendahuluan ? `<div><strong>Pendahuluan:</strong> ${modul.kegiatanPendahuluan}</div>` : ''}
                        ${modul.kegiatanInti ? `<div><strong>Kegiatan Inti:</strong> ${modul.kegiatanInti}</div>` : ''}
                        ${modul.kegiatanPenutup ? `<div><strong>Penutup:</strong> ${modul.kegiatanPenutup}</div>` : ''}
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button onclick="ModulAjar.printModul('${modul.id}'); this.closest('.fixed').remove();" 
                        class="px-4 py-2 bg-gray-600 text-white rounded-lg">🖨️ Cetak</button>
                    <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-primary text-white rounded-lg">Tutup</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    deleteModul: async (id) => {
        const confirm = await Utils.confirm('Hapus modul ajar ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.MODUL_AJAR).doc(id).delete();
            Utils.showNotification('Modul ajar dihapus', 'success');
            await ModulAjar.loadModul();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    },

    generateFromATP: async () => {
        if (AtpKktp.atpData.length === 0) {
            Utils.showNotification('Tidak ada ATP untuk generate modul', 'warning');
            return;
        }

        const confirm = await Utils.confirm('Generate modul ajar dari semua ATP?');
        if (!confirm) return;

        Utils.showLoading('Generating modul ajar...');

        try {
            for (const atp of AtpKktp.atpData) {
                // Check if modul already exists
                const exists = ModulAjar.modulData.find(m => 
                    m.mapelId === atp.mapelId && 
                    m.rombelId === atp.rombelId && 
                    m.judul.includes(atp.elemen)
                );
                if (exists) continue;

                await db.collection(COLLECTIONS.MODUL_AJAR).add({
                    userId: Auth.currentUser.uid,
                    npsn: Auth.userData.npsn,
                    mapelId: atp.mapelId,
                    mapelNama: atp.mapelNama,
                    rombelId: atp.rombelId,
                    rombelNama: atp.rombelNama,
                    judul: `Modul ${atp.elemen}`,
                    alokasiWaktu: `${atp.alokasiWaktu} x 40 menit`,
                    pertemuan: atp.urutan,
                    capaianPembelajaran: atp.capaianPembelajaran,
                    tujuanPembelajaran: atp.tujuanPembelajaran,
                    profilLulusan: atp.profilLulusan,
                    pemahamanBermakna: '',
                    pertanyaanPemantik: [],
                    kegiatanPendahuluan: 'Guru membuka pembelajaran dengan salam dan doa.',
                    kegiatanInti: 'Peserta didik melakukan kegiatan pembelajaran sesuai tujuan.',
                    kegiatanPenutup: 'Guru menutup pembelajaran dengan refleksi dan doa.',
                    asesmenFormatif: 'Observasi dan tanya jawab',
                    asesmenSumatif: 'Tes tertulis',
                    pengayaan: 'Penugasan tambahan',
                    remedial: 'Pembelajaran ulang',
                    refleksiGuru: '',
                    refleksiSiswa: '',
                    sumberBelajar: 'Buku Paket',
                    mediaAlat: 'Papan tulis, LCD',
                    tahunAjaran: Utils.getTahunAjaran(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            Utils.showNotification('Modul ajar berhasil di-generate', 'success');
            await ModulAjar.loadModul();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error generating modul:', error);
            Utils.showNotification('Gagal generate', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    printModul: (id) => {
        const modul = ModulAjar.modulData.find(m => m.id === id);
        if (!modul) return;

        document.getElementById('modul-print-school').textContent = Auth.userData.namaSekolah;

        const profilLulusanHtml = (modul.profilLulusan || []).map(p => {
            const profil = PROFIL_LULUSAN.find(pl => pl.id === p);
            return profil ? `<li>${profil.nama}: ${profil.deskripsi}</li>` : '';
        }).join('');

        document.getElementById('modul-print-content').innerHTML = `
            <div class="info-box">
                <dt>Mata Pelajaran</dt><dd>${modul.mapelNama}</dd>
                <dt>Kelas/Rombel</dt><dd>${modul.rombelNama}</dd>
                <dt>Alokasi Waktu</dt><dd>${modul.alokasiWaktu || '-'}</dd>
                <dt>Pertemuan Ke</dt><dd>${modul.pertemuan || 1}</dd>
            </div>

            <div class="doc-title">${modul.judul}</div>

            <div class="modul-section">
                <h3>A. Capaian Pembelajaran</h3>
                <p>${modul.capaianPembelajaran || '-'}</p>
            </div>

            <div class="modul-section">
                <h3>B. Tujuan Pembelajaran</h3>
                <ol>
                    ${(modul.tujuanPembelajaran || []).map(tp => `<li>${tp}</li>`).join('')}
                </ol>
            </div>

            <div class="modul-section">
                <h3>C. Dimensi Profil Lulusan</h3>
                <ul>${profilLulusanHtml || '<li>-</li>'}</ul>
            </div>

            <div class="modul-section">
                <h3>D. Pemahaman Bermakna</h3>
                <p>${modul.pemahamanBermakna || '-'}</p>
            </div>

            <div class="modul-section">
                <h3>E. Pertanyaan Pemantik</h3>
                <ol>
                    ${(modul.pertanyaanPemantik || []).map(p => `<li>${p}</li>`).join('') || '<li>-</li>'}
                </ol>
            </div>

            <div class="page-break"></div>

            <div class="modul-section">
                <h3>F. Kegiatan Pembelajaran</h3>
                <table>
                    <tr>
                        <th width="20%">Tahap</th>
                        <th>Kegiatan</th>
                    </tr>
                    <tr>
                        <td>Pendahuluan</td>
                        <td>${modul.kegiatanPendahuluan || '-'}</td>
                    </tr>
                    <tr>
                        <td>Kegiatan Inti</td>
                        <td>${modul.kegiatanInti || '-'}</td>
                    </tr>
                    <tr>
                        <td>Penutup</td>
                        <td>${modul.kegiatanPenutup || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="modul-section">
                <h3>G. Asesmen</h3>
                <table>
                    <tr>
                        <th width="50%">Asesmen Formatif</th>
                        <th width="50%">Asesmen Sumatif</th>
                    </tr>
                    <tr>
                        <td>${modul.asesmenFormatif || '-'}</td>
                        <td>${modul.asesmenSumatif || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="modul-section">
                <h3>H. Pengayaan dan Remedial</h3>
                <table>
                    <tr>
                        <th width="50%">Pengayaan</th>
                        <th width="50%">Remedial</th>
                    </tr>
                    <tr>
                        <td>${modul.pengayaan || '-'}</td>
                        <td>${modul.remedial || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="modul-section">
                <h3>I. Refleksi</h3>
                <table>
                    <tr>
                        <th width="50%">Refleksi Guru</th>
                        <th width="50%">Refleksi Peserta Didik</th>
                    </tr>
                    <tr>
                        <td>${modul.refleksiGuru || '-'}</td>
                        <td>${modul.refleksiSiswa || '-'}</td>
                    </tr>
                </table>
            </div>

            <div class="modul-section">
                <h3>J. Sumber dan Media Pembelajaran</h3>
                <p><strong>Sumber Belajar:</strong> ${modul.sumberBelajar || '-'}</p>
                <p><strong>Media dan Alat:</strong> ${modul.mediaAlat || '-'}</p>
            </div>

            <div class="signature-area">
                <div class="signature-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <div class="signature-line"></div>
                    <p>________________________</p>
                </div>
                <div class="signature-box right">
                    <p>${Utils.formatDate(new Date())}</p>
                    <p>Guru Mata Pelajaran</p>
                    <div class="signature-line"></div>
                    <p>${Auth.userData.nama}</p>
                </div>
            </div>
        `;

        Utils.printDocument('modul-print-template', 'Modul Ajar');
    }
};