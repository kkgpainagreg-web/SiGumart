// Modul Ajar Management

let modulAjarData = [];

// Load Modul Ajar Data
async function loadModulData() {
    if (!checkPremiumAccess('modul')) {
        document.getElementById('modulAjarList').innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-lock text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-600">Fitur Modul Ajar tersedia untuk pengguna Premium</p>
                <button onclick="showUpgradeModal()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                    <i class="fas fa-crown mr-2"></i>Upgrade ke Premium
                </button>
            </div>
        `;
        return;
    }

    try {
        const modulSnap = await db.collection('users').doc(currentUser.uid)
            .collection('modul')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .orderBy('createdAt', 'desc')
            .get();
        
        modulAjarData = [];
        modulSnap.forEach(doc => {
            modulAjarData.push({ id: doc.id, ...doc.data() });
        });

        renderModulAjarList();

    } catch (error) {
        console.error('Error loading modul:', error);
        // Try without ordering
        try {
            const modulSnap = await db.collection('users').doc(currentUser.uid)
                .collection('modul')
                .where('tahunAjaran', '==', currentTahunAjaran)
                .get();
            
            modulAjarData = [];
            modulSnap.forEach(doc => {
                modulAjarData.push({ id: doc.id, ...doc.data() });
            });
            
            renderModulAjarList();
        } catch(e) {
            showToast('Gagal memuat modul ajar', 'error');
        }
    }
}

// Render Modul Ajar List
function renderModulAjarList() {
    const container = document.getElementById('modulAjarList');

    if (modulAjarData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <i class="fas fa-book text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">Belum ada modul ajar</p>
                <button onclick="tambahModulAjar()" class="text-primary hover:underline mt-2">Buat modul pertama</button>
            </div>
        `;
        return;
    }

    container.innerHTML = modulAjarData.map(modul => `
        <div class="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <div class="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs bg-white/20 px-2 py-0.5 rounded">Kelas ${modul.kelas}</span>
                        <h3 class="font-semibold mt-1 line-clamp-2">${modul.judul}</h3>
                    </div>
                    <span class="text-sm">${modul.jp || 0} JP</span>
                </div>
            </div>
            <div class="p-4">
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${modul.tujuan || '-'}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">${formatDate(modul.createdAt)}</span>
                    <div class="flex gap-2">
                        ${modul.enableLKPD ? '<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">LKPD</span>' : ''}
                        <button onclick="viewModulAjar('${modul.id}')" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editModulAjar('${modul.id}')" class="text-yellow-500 hover:text-yellow-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="hapusModulAjar('${modul.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Tambah Modul Ajar
async function tambahModulAjar() {
    // Get ATP data for selection
    const atpSnap = await db.collection('users').doc(currentUser.uid)
        .collection('atp')
        .where('tahunAjaran', '==', currentTahunAjaran)
        .where('semester', '==', currentSemester)
        .get();
    
    const atpOptions = [];
    atpSnap.forEach(doc => {
        const data = doc.data();
        atpOptions.push({ id: doc.id, ...data });
    });

    const modal = `
        <div id="modalModul" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalModul')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Buat Modul Ajar</h3>
                
                <form onsubmit="saveModulAjar(event)">
                    <!-- Identitas -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">A. Identitas Modul</h4>
                        <div class="grid md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                <select id="modulKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    ${getKelasOptions()}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Alokasi Waktu (JP)</label>
                                <input type="number" id="modulJP" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    value="4" min="1" required>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Pertemuan Ke</label>
                                <input type="number" id="modulPertemuan" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    value="1" min="1">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Judul / Topik</label>
                            <input type="text" id="modulJudul" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Judul modul ajar..." required>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pilih dari ATP (opsional)</label>
                            <select id="modulATP" class="w-full border border-gray-300 rounded-lg px-3 py-2" onchange="loadFromATP()">
                                <option value="">-- Pilih atau ketik manual --</option>
                                ${atpOptions.map(a => `<option value="${a.id}" data-bab="${a.bab}" data-tp="${a.tp}" data-jp="${a.jp}">${a.bab} - ${a.tp}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Tujuan Pembelajaran -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">B. Tujuan Pembelajaran</h4>
                        <textarea id="modulTujuan" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="Siswa dapat..."></textarea>
                    </div>

                    <!-- Profil Pelajar Pancasila -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">C. Profil Pelajar Pancasila</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="beriman" class="mr-2"> Beriman & Bertakwa
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="mandiri" class="mr-2"> Mandiri
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="gotong-royong" class="mr-2"> Gotong Royong
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="kreatif" class="mr-2"> Kreatif
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="bernalar-kritis" class="mr-2"> Bernalar Kritis
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" name="p3" value="berkebinekaan" class="mr-2"> Berkebinekaan Global
                            </label>
                        </div>
                    </div>

                    <!-- Kegiatan Pembelajaran -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">D. Kegiatan Pembelajaran</h4>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Pendahuluan</label>
                            <textarea id="modulPendahuluan" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Kegiatan pembuka..."></textarea>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Kegiatan Inti</label>
                            <textarea id="modulInti" rows="5" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Kegiatan inti pembelajaran..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Penutup</label>
                            <textarea id="modulPenutup" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Kegiatan penutup..."></textarea>
                        </div>
                    </div>

                    <!-- Asesmen -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">E. Asesmen</h4>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Asesmen Formatif</label>
                                <textarea id="modulAsesmenFormatif" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    placeholder="Observasi, tanya jawab..."></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Asesmen Sumatif</label>
                                <textarea id="modulAsesmenSumatif" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    placeholder="Tes tertulis, praktik..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Materi & LKPD -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">F. Materi & Lampiran</h4>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Materi Ajar (Teks untuk Guru)</label>
                            <textarea id="modulMateri" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Materi pembelajaran..."></textarea>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teks Arab (jika ada)</label>
                            <textarea id="modulArab" rows="2" dir="rtl" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 font-arabic text-lg" 
                                placeholder="أدخل النص العربي هنا..." style="font-family: 'Amiri', serif;"></textarea>
                        </div>
                        
                        <div class="flex items-center gap-4">
                            <label class="flex items-center">
                                <input type="checkbox" id="modulEnableLKPD" class="mr-2" onchange="toggleLKPDSection()"> 
                                <span class="font-medium">Sertakan LKPD</span>
                            </label>
                        </div>
                        
                        <div id="lkpdSection" class="hidden mt-4 border-t pt-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Konten LKPD (Teks untuk Siswa)</label>
                            <textarea id="modulLKPDContent" rows="4" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Petunjuk dan soal untuk siswa..."></textarea>
                        </div>
                    </div>

                    <!-- Sumber Belajar -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">G. Sumber Belajar</h4>
                        <textarea id="modulSumber" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="Buku, video, website..."></textarea>
                    </div>

                    <!-- Refleksi -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-gray-700 mb-3">H. Refleksi Guru</h4>
                        <textarea id="modulRefleksi" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            placeholder="Catatan refleksi setelah pembelajaran..."></textarea>
                    </div>
                    
                    <div class="flex gap-3 mt-6 sticky bottom-0 bg-white py-4 border-t">
                        <button type="button" onclick="closeModal('modalModul')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                            <i class="fas fa-save mr-2"></i>Simpan Modul
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
    
    // Store ATP options for later use
    window.atpOptionsCache = atpOptions;
}

// Load From ATP Selection
function loadFromATP() {
    const select = document.getElementById('modulATP');
    const selected = select.options[select.selectedIndex];
    
    if (selected.value && window.atpOptionsCache) {
        const atp = window.atpOptionsCache.find(a => a.id === selected.value);
        if (atp) {
            document.getElementById('modulJudul').value = atp.bab;
            document.getElementById('modulTujuan').value = atp.tp;
            document.getElementById('modulJP').value = atp.jp;
            document.getElementById('modulKelas').value = atp.kelas;
        }
    }
}

// Toggle LKPD Section
function toggleLKPDSection() {
    const checkbox = document.getElementById('modulEnableLKPD');
    const section = document.getElementById('lkpdSection');
    
    if (checkbox.checked) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

// Save Modul Ajar
async function saveModulAjar(event) {
    event.preventDefault();
    showLoading(true);

    try {
        // Collect P3 checkboxes
        const p3Checked = [];
        document.querySelectorAll('input[name="p3"]:checked').forEach(cb => {
            p3Checked.push(cb.value);
        });

        const data = {
            kelas: document.getElementById('modulKelas').value,
            jp: parseInt(document.getElementById('modulJP').value) || 4,
            pertemuan: parseInt(document.getElementById('modulPertemuan').value) || 1,
            judul: document.getElementById('modulJudul').value.trim(),
            tujuan: document.getElementById('modulTujuan').value.trim(),
            profilPelajar: p3Checked,
            pendahuluan: document.getElementById('modulPendahuluan').value.trim(),
            inti: document.getElementById('modulInti').value.trim(),
            penutup: document.getElementById('modulPenutup').value.trim(),
            asesmenFormatif: document.getElementById('modulAsesmenFormatif').value.trim(),
            asesmenSumatif: document.getElementById('modulAsesmenSumatif').value.trim(),
            materi: document.getElementById('modulMateri').value.trim(),
            teksArab: document.getElementById('modulArab').value.trim(),
            enableLKPD: document.getElementById('modulEnableLKPD').checked,
            lkpdContent: document.getElementById('modulLKPDContent').value.trim(),
            sumberBelajar: document.getElementById('modulSumber').value.trim(),
            refleksi: document.getElementById('modulRefleksi').value.trim(),
            semester: currentSemester,
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editId = document.getElementById('modulJudul').dataset.editId;

        if (editId) {
            await db.collection('users').doc(currentUser.uid)
                .collection('modul').doc(editId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(currentUser.uid)
                .collection('modul').add(data);
        }

        closeModal('modalModul');
        showToast('Modul ajar berhasil disimpan', 'success');
        loadModulData();

    } catch (error) {
        console.error('Error saving modul:', error);
        showToast('Gagal menyimpan modul ajar', 'error');
    }

    showLoading(false);
}

// View Modul Ajar
function viewModulAjar(id) {
    const modul = modulAjarData.find(m => m.id === id);
    if (!modul) return;

    const modal = `
        <div id="modalViewModul" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalViewModul')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Modul Ajar</h3>
                    <div class="flex gap-2">
                        <button onclick="printModulAjar('${id}')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            <i class="fas fa-print mr-2"></i>Cetak
                        </button>
                        <button onclick="closeModal('modalViewModul')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div id="modulPrintContent" style="font-family: 'Times New Roman', serif;">
                    <div style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px;">
                        MODUL AJAR<br>
                        ${modul.judul.toUpperCase()}
                    </div>
                    
                    <table style="width: 100%; margin-bottom: 15px; font-size: 11pt;">
                        <tr><td width="150">Satuan Pendidikan</td><td>: ${window.profilData?.namaSekolah || '-'}</td></tr>
                        <tr><td>Kelas / Semester</td><td>: ${modul.kelas} / ${modul.semester}</td></tr>
                        <tr><td>Alokasi Waktu</td><td>: ${modul.jp} JP</td></tr>
                        <tr><td>Pertemuan Ke</td><td>: ${modul.pertemuan}</td></tr>
                    </table>
                    
                    <h4 style="font-weight: bold; margin-top: 15px;">A. Tujuan Pembelajaran</h4>
                    <p style="margin-left: 20px;">${modul.tujuan || '-'}</p>
                    
                    <h4 style="font-weight: bold; margin-top: 15px;">B. Profil Pelajar Pancasila</h4>
                    <p style="margin-left: 20px;">${modul.profilPelajar?.join(', ') || '-'}</p>
                    
                    <h4 style="font-weight: bold; margin-top: 15px;">C. Kegiatan Pembelajaran</h4>
                    <p style="font-weight: bold; margin-left: 20px;">Pendahuluan:</p>
                    <p style="margin-left: 40px;">${modul.pendahuluan || '-'}</p>
                    <p style="font-weight: bold; margin-left: 20px;">Kegiatan Inti:</p>
                    <p style="margin-left: 40px;">${modul.inti || '-'}</p>
                    <p style="font-weight: bold; margin-left: 20px;">Penutup:</p>
                    <p style="margin-left: 40px;">${modul.penutup || '-'}</p>
                    
                    <h4 style="font-weight: bold; margin-top: 15px;">D. Asesmen</h4>
                    <p style="margin-left: 20px;"><strong>Formatif:</strong> ${modul.asesmenFormatif || '-'}</p>
                    <p style="margin-left: 20px;"><strong>Sumatif:</strong> ${modul.asesmenSumatif || '-'}</p>
                    
                    ${modul.teksArab ? `
                        <h4 style="font-weight: bold; margin-top: 15px;">E. Materi (Teks Arab)</h4>
                        <p dir="rtl" style="margin-left: 20px; font-family: 'Amiri', serif; font-size: 16pt; text-align: right;">${modul.teksArab}</p>
                    ` : ''}
                    
                    <h4 style="font-weight: bold; margin-top: 15px;">F. Sumber Belajar</h4>
                    <p style="margin-left: 20px;">${modul.sumberBelajar || '-'}</p>
                    
                    ${generateSignature()}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

// Print Modul Ajar
function printModulAjar(id) {
    const content = document.getElementById('modulPrintContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Modul Ajar</title>
            <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 20mm; }
                body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
                h4 { margin-bottom: 5px; }
                p { margin: 5px 0; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Edit Modul Ajar
async function editModulAjar(id) {
    const modul = modulAjarData.find(m => m.id === id);
    if (!modul) return;

    await tambahModulAjar();

    setTimeout(() => {
        document.getElementById('modulKelas').value = modul.kelas;
        document.getElementById('modulJP').value = modul.jp;
        document.getElementById('modulPertemuan').value = modul.pertemuan;
        document.getElementById('modulJudul').value = modul.judul;
        document.getElementById('modulJudul').dataset.editId = id;
        document.getElementById('modulTujuan').value = modul.tujuan || '';
        document.getElementById('modulPendahuluan').value = modul.pendahuluan || '';
        document.getElementById('modulInti').value = modul.inti || '';
        document.getElementById('modulPenutup').value = modul.penutup || '';
        document.getElementById('modulAsesmenFormatif').value = modul.asesmenFormatif || '';
        document.getElementById('modulAsesmenSumatif').value = modul.asesmenSumatif || '';
        document.getElementById('modulMateri').value = modul.materi || '';
        document.getElementById('modulArab').value = modul.teksArab || '';
        document.getElementById('modulEnableLKPD').checked = modul.enableLKPD;
        document.getElementById('modulLKPDContent').value = modul.lkpdContent || '';
        document.getElementById('modulSumber').value = modul.sumberBelajar || '';
        document.getElementById('modulRefleksi').value = modul.refleksi || '';
        
        // Set P3 checkboxes
        if (modul.profilPelajar) {
            modul.profilPelajar.forEach(p => {
                const cb = document.querySelector(`input[name="p3"][value="${p}"]`);
                if (cb) cb.checked = true;
            });
        }
        
        toggleLKPDSection();
    }, 100);
}

// Hapus Modul Ajar
async function hapusModulAjar(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus modul ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('modul').doc(id).delete();
        
        showToast('Modul berhasil dihapus', 'success');
        loadModulData();
    } catch (error) {
        console.error('Error deleting modul:', error);
        showToast('Gagal menghapus modul', 'error');
    }
    showLoading(false);
}