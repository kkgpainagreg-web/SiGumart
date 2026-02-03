// js/master-data.js
// =====================================================
// MASTER DATA & CAPAIAN PEMBELAJARAN MODULE
// =====================================================

const MasterData = {
    subjects: [],
    cpData: [],
    rombel: [],

    init: async () => {
        MasterData.render();
        await MasterData.loadSubjects();
        await MasterData.loadRombel();
        await MasterData.loadCPData();
    },

    render: () => {
        const container = document.getElementById('tab-master-data');
        container.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Kolom Kiri: Form Input -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- Pengaturan Mata Pelajaran -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold mb-4">📚 Mata Pelajaran</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Template</label>
                                <select id="subject-template" class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">-- Pilih Template --</option>
                                    ${Object.entries(SUBJECT_TEMPLATES).map(([key, val]) => 
                                        `<option value="${key}">${val.nama}</option>`
                                    ).join('')}
                                    <option value="custom">➕ Custom Mapel</option>
                                </select>
                            </div>
                            
                            <div id="custom-subject-form" class="hidden space-y-3">
                                <input type="text" id="custom-subject-name" placeholder="Nama Mata Pelajaran" 
                                    class="w-full px-3 py-2 border rounded-lg">
                                <div id="custom-elements-container">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Elemen CP</label>
                                    <div id="custom-elements-list" class="space-y-2"></div>
                                    <button type="button" onclick="MasterData.addCustomElement()" 
                                        class="mt-2 text-sm text-primary hover:underline">+ Tambah Elemen</button>
                                </div>
                            </div>

                            <button onclick="MasterData.addSubject()" 
                                class="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                Tambah Mata Pelajaran
                            </button>
                        </div>

                        <div class="mt-4">
                            <h4 class="font-medium text-gray-700 mb-2">Mata Pelajaran Saya:</h4>
                            <div id="my-subjects-list" class="space-y-2 max-h-48 overflow-y-auto">
                                <p class="text-gray-400 text-sm">Belum ada mata pelajaran</p>
                            </div>
                        </div>
                    </div>

                    <!-- Pengaturan Rombel -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold mb-4">👥 Rombongan Belajar</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                    <select id="rombel-kelas" class="w-full px-3 py-2 border rounded-lg">
                                        ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                            `<option value="${k}">Kelas ${k}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                                    <input type="text" id="rombel-nama" placeholder="A, B, C..." 
                                        class="w-full px-3 py-2 border rounded-lg">
                                </div>
                            </div>
                            <button onclick="MasterData.addRombel()" 
                                class="w-full bg-accent text-white py-2 rounded-lg hover:bg-green-600 transition">
                                Tambah Rombel
                            </button>
                        </div>

                        <div class="mt-4">
                            <h4 class="font-medium text-gray-700 mb-2">Rombel Saya:</h4>
                            <div id="my-rombel-list" class="flex flex-wrap gap-2">
                                <p class="text-gray-400 text-sm">Belum ada rombel</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kolom Kanan: Form CP -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold mb-4">📝 Input Capaian Pembelajaran (CP)</h3>
                        
                        <form id="cp-form" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                    <select id="cp-mapel" required class="w-full px-3 py-2 border rounded-lg">
                                        <option value="">Pilih Mata Pelajaran</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Kelas/Fase</label>
                                    <select id="cp-kelas" required class="w-full px-3 py-2 border rounded-lg">
                                        <option value="">Pilih Kelas</option>
                                        ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                            `<option value="${k}">Kelas ${k}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Elemen CP</label>
                                <select id="cp-elemen" required class="w-full px-3 py-2 border rounded-lg">
                                    <option value="">Pilih Elemen</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Capaian Pembelajaran</label>
                                <textarea id="cp-text" rows="4" required 
                                    class="w-full px-3 py-2 border rounded-lg resize-none"
                                    placeholder="Masukkan deskripsi Capaian Pembelajaran..."></textarea>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Dimensi Profil Lulusan</label>
                                <div class="grid grid-cols-2 gap-2">
                                    ${PROFIL_LULUSAN.map(p => `
                                        <label class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox" name="profil-lulusan" value="${p.id}" class="rounded">
                                            <span class="text-sm">${p.nama}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="flex space-x-3">
                                <button type="submit" 
                                    class="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                    💾 Simpan CP
                                </button>
                                <button type="button" onclick="MasterData.generateFromCP()"
                                    class="flex-1 bg-accent text-white py-2 rounded-lg hover:bg-green-600 transition">
                                    ⚡ Generate Otomatis
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Daftar CP -->
                    <div class="bg-white rounded-xl shadow p-6 mt-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">📋 Daftar Capaian Pembelajaran</h3>
                            <div class="flex space-x-2">
                                <select id="filter-mapel" class="px-3 py-1 border rounded-lg text-sm">
                                    <option value="">Semua Mapel</option>
                                </select>
                                <select id="filter-kelas" class="px-3 py-1 border rounded-lg text-sm">
                                    <option value="">Semua Kelas</option>
                                    ${JENJANG[Auth.userData.jenjang].kelas.map(k => 
                                        `<option value="${k}">Kelas ${k}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div id="cp-list" class="space-y-3 max-h-96 overflow-y-auto">
                            <p class="text-gray-400 text-center py-8">Belum ada data CP</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Print Template (Hidden) -->
            <div id="print-master-data" class="hidden print-only">
                <!-- Will be generated for print -->
            </div>
        `;

        // Event listeners
        document.getElementById('subject-template').addEventListener('change', MasterData.handleTemplateChange);
        document.getElementById('cp-mapel').addEventListener('change', MasterData.handleMapelChange);
        document.getElementById('cp-form').addEventListener('submit', MasterData.saveCP);
        document.getElementById('filter-mapel').addEventListener('change', MasterData.filterCP);
        document.getElementById('filter-kelas').addEventListener('change', MasterData.filterCP);
    },

    handleTemplateChange: (e) => {
        const customForm = document.getElementById('custom-subject-form');
        if (e.target.value === 'custom') {
            customForm.classList.remove('hidden');
            MasterData.addCustomElement(); // Add first element input
        } else {
            customForm.classList.add('hidden');
        }
    },

    addCustomElement: () => {
        const container = document.getElementById('custom-elements-list');
        const elementDiv = document.createElement('div');
        elementDiv.className = 'flex space-x-2';
        elementDiv.innerHTML = `
            <input type="text" placeholder="Nama Elemen" class="custom-element flex-1 px-3 py-1 border rounded">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700">✕</button>
        `;
        container.appendChild(elementDiv);
    },

    addSubject: async () => {
        const template = document.getElementById('subject-template').value;
        
        if (!template) {
            Utils.showNotification('Pilih template atau buat custom', 'warning');
            return;
        }

        let subjectData;

        if (template === 'custom') {
            const name = document.getElementById('custom-subject-name').value.trim();
            const elements = Array.from(document.querySelectorAll('.custom-element'))
                .map(el => el.value.trim())
                .filter(v => v);

            if (!name || elements.length === 0) {
                Utils.showNotification('Lengkapi nama dan minimal 1 elemen', 'warning');
                return;
            }

            subjectData = { nama: name, elemen: elements };
        } else {
            subjectData = SUBJECT_TEMPLATES[template];
        }

        Utils.showLoading('Menyimpan mata pelajaran...');

        try {
            await db.collection(COLLECTIONS.SUBJECTS).add({
                userId: Auth.currentUser.uid,
                npsn: Auth.userData.npsn,
                kode: template === 'custom' ? Utils.generateId() : template,
                ...subjectData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            Utils.showNotification('Mata pelajaran berhasil ditambahkan', 'success');
            document.getElementById('subject-template').value = '';
            document.getElementById('custom-subject-form').classList.add('hidden');
            await MasterData.loadSubjects();
        } catch (error) {
            console.error('Error adding subject:', error);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadSubjects: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.SUBJECTS)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            MasterData.subjects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            MasterData.renderSubjectsList();
            MasterData.updateMapelDropdowns();
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    },

    renderSubjectsList: () => {
        const container = document.getElementById('my-subjects-list');
        
        if (MasterData.subjects.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm">Belum ada mata pelajaran</p>';
            return;
        }

        container.innerHTML = MasterData.subjects.map(subj => `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                    <span class="font-medium text-sm">${subj.nama}</span>
                    <span class="text-xs text-gray-500 block">${subj.elemen.length} elemen</span>
                </div>
                <button onclick="MasterData.deleteSubject('${subj.id}')" 
                    class="text-red-500 hover:text-red-700 text-sm">🗑️</button>
            </div>
        `).join('');
    },

    updateMapelDropdowns: () => {
        const options = MasterData.subjects.map(s => 
            `<option value="${s.id}">${s.nama}</option>`
        ).join('');

        document.getElementById('cp-mapel').innerHTML = '<option value="">Pilih Mata Pelajaran</option>' + options;
        document.getElementById('filter-mapel').innerHTML = '<option value="">Semua Mapel</option>' + options;
    },

    handleMapelChange: (e) => {
        const subject = MasterData.subjects.find(s => s.id === e.target.value);
        const elemenSelect = document.getElementById('cp-elemen');

        if (subject) {
            elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>' + 
                subject.elemen.map(el => `<option value="${el}">${el}</option>`).join('');
        } else {
            elemenSelect.innerHTML = '<option value="">Pilih Elemen</option>';
        }
    },

    deleteSubject: async (id) => {
        const confirm = await Utils.confirm('Hapus mata pelajaran ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.SUBJECTS).doc(id).delete();
            Utils.showNotification('Mata pelajaran dihapus', 'success');
            await MasterData.loadSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            Utils.showNotification('Gagal menghapus', 'error');
        }
    },

    addRombel: async () => {
        const kelas = document.getElementById('rombel-kelas').value;
        const nama = document.getElementById('rombel-nama').value.trim().toUpperCase();

        if (!kelas || !nama) {
            Utils.showNotification('Lengkapi kelas dan nama rombel', 'warning');
            return;
        }

        const rombelName = `${kelas}${nama}`;

        // Check duplicate
        const exists = MasterData.rombel.find(r => r.nama === rombelName);
        if (exists) {
            Utils.showNotification('Rombel sudah ada', 'warning');
            return;
        }

        Utils.showLoading('Menyimpan rombel...');

        try {
            await db.collection(COLLECTIONS.ROMBEL).add({
                userId: Auth.currentUser.uid,
                npsn: Auth.userData.npsn,
                kelas: parseInt(kelas),
                nama: rombelName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            Utils.showNotification('Rombel berhasil ditambahkan', 'success');
            document.getElementById('rombel-nama').value = '';
            await MasterData.loadRombel();
        } catch (error) {
            console.error('Error adding rombel:', error);
            Utils.showNotification('Gagal menyimpan', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadRombel: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.ROMBEL)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('nama')
                .get();

            MasterData.rombel = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            MasterData.renderRombelList();
        } catch (error) {
            console.error('Error loading rombel:', error);
        }
    },

    renderRombelList: () => {
        const container = document.getElementById('my-rombel-list');
        
        if (MasterData.rombel.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-sm">Belum ada rombel</p>';
            return;
        }

        container.innerHTML = MasterData.rombel.map(r => `
            <span class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                ${r.nama}
                <button onclick="MasterData.deleteRombel('${r.id}')" 
                    class="ml-2 text-blue-600 hover:text-red-600">✕</button>
            </span>
        `).join('');
    },

    deleteRombel: async (id) => {
        const confirm = await Utils.confirm('Hapus rombel ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.ROMBEL).doc(id).delete();
            Utils.showNotification('Rombel dihapus', 'success');
            await MasterData.loadRombel();
        } catch (error) {
            console.error('Error deleting rombel:', error);
        }
    },

    saveCP: async (e) => {
        e.preventDefault();

        const mapelId = document.getElementById('cp-mapel').value;
        const kelas = document.getElementById('cp-kelas').value;
        const elemen = document.getElementById('cp-elemen').value;
        const cpText = document.getElementById('cp-text').value.trim();
        const profilLulusan = Array.from(document.querySelectorAll('input[name="profil-lulusan"]:checked'))
            .map(cb => cb.value);

        if (!mapelId || !kelas || !elemen || !cpText) {
            Utils.showNotification('Lengkapi semua field', 'warning');
            return;
        }

        const subject = MasterData.subjects.find(s => s.id === mapelId);

        Utils.showLoading('Menyimpan CP...');

        try {
            await db.collection(COLLECTIONS.CP_DATA).add({
                userId: Auth.currentUser.uid,
                npsn: Auth.userData.npsn,
                mapelId: mapelId,
                mapelNama: subject.nama,
                kelas: parseInt(kelas),
                elemen: elemen,
                capaianPembelajaran: cpText,
                profilLulusan: profilLulusan,
                tahunAjaran: Utils.getTahunAjaran(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            Utils.showNotification('CP berhasil disimpan', 'success');
            e.target.reset();
            await MasterData.loadCPData();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error saving CP:', error);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    loadCPData: async () => {
        try {
            const snapshot = await db.collection(COLLECTIONS.CP_DATA)
                .where('userId', '==', Auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            MasterData.cpData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            MasterData.renderCPList();
        } catch (error) {
            console.error('Error loading CP:', error);
        }
    },

    renderCPList: (filteredData = null) => {
        const container = document.getElementById('cp-list');
        const data = filteredData || MasterData.cpData;

        if (data.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">Belum ada data CP</p>';
            return;
        }

        container.innerHTML = data.map(cp => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                ${cp.mapelNama}
                            </span>
                            <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                Kelas ${cp.kelas}
                            </span>
                            <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                ${cp.elemen}
                            </span>
                        </div>
                        <p class="text-gray-700">${cp.capaianPembelajaran}</p>
                        ${cp.profilLulusan && cp.profilLulusan.length > 0 ? `
                            <div class="mt-2 flex flex-wrap gap-1">
                                ${cp.profilLulusan.map(p => {
                                    const profil = PROFIL_LULUSAN.find(pl => pl.id === p);
                                    return profil ? `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">${profil.nama}</span>` : '';
                                }).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="MasterData.editCP('${cp.id}')" class="text-blue-500 hover:text-blue-700">✏️</button>
                        <button onclick="MasterData.deleteCP('${cp.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    filterCP: () => {
        const mapelFilter = document.getElementById('filter-mapel').value;
        const kelasFilter = document.getElementById('filter-kelas').value;

        let filtered = MasterData.cpData;

        if (mapelFilter) {
            filtered = filtered.filter(cp => cp.mapelId === mapelFilter);
        }

        if (kelasFilter) {
            filtered = filtered.filter(cp => cp.kelas === parseInt(kelasFilter));
        }

        MasterData.renderCPList(filtered);
    },

    deleteCP: async (id) => {
        const confirm = await Utils.confirm('Hapus CP ini?');
        if (!confirm) return;

        try {
            await db.collection(COLLECTIONS.CP_DATA).doc(id).delete();
            Utils.showNotification('CP dihapus', 'success');
            await MasterData.loadCPData();
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error deleting CP:', error);
            Utils.showNotification('Gagal menghapus', 'error');
        }
    },

    editCP: async (id) => {
        const cp = MasterData.cpData.find(c => c.id === id);
        if (!cp) return;

        // Populate form with existing data
        document.getElementById('cp-mapel').value = cp.mapelId;
        MasterData.handleMapelChange({ target: { value: cp.mapelId } });
        
        setTimeout(() => {
            document.getElementById('cp-kelas').value = cp.kelas;
            document.getElementById('cp-elemen').value = cp.elemen;
            document.getElementById('cp-text').value = cp.capaianPembelajaran;
            
            // Check profil lulusan
            document.querySelectorAll('input[name="profil-lulusan"]').forEach(cb => {
                cb.checked = cp.profilLulusan && cp.profilLulusan.includes(cb.value);
            });
        }, 100);

        // Delete old and save new
        await MasterData.deleteCP(id);
        
        // Scroll to form
        document.getElementById('cp-form').scrollIntoView({ behavior: 'smooth' });
    },

    generateFromCP: async () => {
        if (MasterData.cpData.length === 0) {
            Utils.showNotification('Tidak ada CP untuk di-generate', 'warning');
            return;
        }

        const confirm = await Utils.confirm('Generate ATP, KKTP, Prota, dan Promes dari semua CP?');
        if (!confirm) return;

        Utils.showLoading('Generating documents...');

        try {
            // Generate ATP for each CP
            for (const cp of MasterData.cpData) {
                await AtpKktp.generateATPFromCP(cp);
                await AtpKktp.generateKKTPFromCP(cp);
            }

            // Generate Prota & Promes for each rombel
            for (const rombel of MasterData.rombel) {
                await ProtaPromes.generateProtaForRombel(rombel);
                await ProtaPromes.generatePromesForRombel(rombel);
            }

            Utils.showNotification('Generate berhasil!', 'success');
            App.loadDashboardStats();
        } catch (error) {
            console.error('Error generating:', error);
            Utils.showNotification('Gagal generate: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    }
};