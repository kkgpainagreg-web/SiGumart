// LKPD Management

let lkpdData = [];

// Load LKPD Data
async function loadLKPDData() {
    if (!checkPremiumAccess('lkpd')) {
        document.getElementById('lkpdList').innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-lock text-4xl text-yellow-500 mb-4"></i>
                <p class="text-gray-600">Fitur LKPD tersedia untuk pengguna Premium</p>
                <button onclick="showUpgradeModal()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                    <i class="fas fa-crown mr-2"></i>Upgrade ke Premium
                </button>
            </div>
        `;
        return;
    }

    try {
        const lkpdSnap = await db.collection('users').doc(currentUser.uid)
            .collection('lkpd')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        lkpdData = [];
        lkpdSnap.forEach(doc => {
            lkpdData.push({ id: doc.id, ...doc.data() });
        });

        renderLKPDList();

    } catch (error) {
        console.error('Error loading LKPD:', error);
        showToast('Gagal memuat LKPD', 'error');
    }
}

// Render LKPD List
function renderLKPDList() {
    const container = document.getElementById('lkpdList');

    if (lkpdData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <i class="fas fa-file-alt text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">Belum ada LKPD</p>
                <button onclick="tambahLKPD()" class="text-primary hover:underline mt-2">Buat LKPD pertama</button>
            </div>
        `;
        return;
    }

    container.innerHTML = lkpdData.map(lkpd => `
        <div class="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
            <div class="bg-gradient-to-r from-green-500 to-teal-600 p-4 text-white">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs bg-white/20 px-2 py-0.5 rounded">Kelas ${lkpd.kelas}</span>
                        <h3 class="font-semibold mt-1 line-clamp-2">${lkpd.judul}</h3>
                    </div>
                </div>
            </div>
            <div class="p-4">
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${lkpd.tujuan || '-'}</p>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500">${formatDate(lkpd.createdAt)}</span>
                    <div class="flex gap-2">
                        <button onclick="viewLKPD('${lkpd.id}')" class="text-blue-500 hover:text-blue-700">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editLKPD('${lkpd.id}')" class="text-yellow-500 hover:text-yellow-700">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="hapusLKPD('${lkpd.id}')" class="text-red-500 hover:text-red-700">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Tambah LKPD
function tambahLKPD() {
    const modal = `
        <div id="modalLKPD" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalLKPD')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Buat LKPD</h3>
                
                <form onsubmit="saveLKPD(event)">
                    <div class="space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                <select id="lkpdKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    ${getKelasOptions()}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Pertemuan Ke</label>
                                <input type="number" id="lkpdPertemuan" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    value="1" min="1">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Judul LKPD</label>
                            <input type="text" id="lkpdJudul" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Judul lembar kerja..." required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran</label>
                            <textarea id="lkpdTujuan" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Siswa dapat..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Petunjuk untuk Siswa</label>
                            <textarea id="lkpdPetunjuk" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="1. Baca dengan teliti..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Teks Arab (jika ada)</label>
                            <textarea id="lkpdArab" rows="2" dir="rtl" 
                                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg" 
                                placeholder="أدخل النص العربي هنا..." style="font-family: 'Amiri', serif;"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Konten / Soal</label>
                            <textarea id="lkpdKonten" rows="8" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Tulis soal dan instruksi untuk siswa..."></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rubrik Penilaian (opsional)</label>
                            <textarea id="lkpdRubrik" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                placeholder="Kriteria penilaian..."></textarea>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button type="button" onclick="closeModal('modalLKPD')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                            <i class="fas fa-save mr-2"></i>Simpan LKPD
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

// Save LKPD
async function saveLKPD(event) {
    event.preventDefault();
    showLoading(true);

    try {
        const data = {
            kelas: document.getElementById('lkpdKelas').value,
            pertemuan: parseInt(document.getElementById('lkpdPertemuan').value) || 1,
            judul: document.getElementById('lkpdJudul').value.trim(),
            tujuan: document.getElementById('lkpdTujuan').value.trim(),
            petunjuk: document.getElementById('lkpdPetunjuk').value.trim(),
            teksArab: document.getElementById('lkpdArab').value.trim(),
            konten: document.getElementById('lkpdKonten').value.trim(),
            rubrik: document.getElementById('lkpdRubrik').value.trim(),
            semester: currentSemester,
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const editId = document.getElementById('lkpdJudul').dataset.editId;

        if (editId) {
            await db.collection('users').doc(currentUser.uid)
                .collection('lkpd').doc(editId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(currentUser.uid)
                .collection('lkpd').add(data);
        }

        closeModal('modalLKPD');
        showToast('LKPD berhasil disimpan', 'success');
        loadLKPDData();

    } catch (error) {
        console.error('Error saving LKPD:', error);
        showToast('Gagal menyimpan LKPD', 'error');
    }

    showLoading(false);
}

// View LKPD
function viewLKPD(id) {
    const lkpd = lkpdData.find(l => l.id === id);
    if (!lkpd) return;

    const modal = `
        <div id="modalViewLKPD" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalViewLKPD')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onclick="event.stopPropagation()">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Preview LKPD</h3>
                    <div class="flex gap-2">
                        <button onclick="printLKPD('${id}')" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            <i class="fas fa-print mr-2"></i>Cetak
                        </button>
                        <button onclick="closeModal('modalViewLKPD')" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div id="lkpdPrintContent" class="border-2 border-gray-300 rounded-lg p-6" style="font-family: 'Times New Roman', serif;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">LEMBAR KERJA PESERTA DIDIK (LKPD)</h2>
                        <h3 style="font-size: 12pt; font-weight: bold;">${lkpd.judul}</h3>
                    </div>
                    
                    <table style="width: 100%; margin-bottom: 15px; font-size: 11pt;">
                        <tr>
                            <td style="width: 100px;">Nama</td>
                            <td>: ................................................</td>
                            <td style="width: 100px;">Kelas</td>
                            <td>: ${lkpd.kelas}</td>
                        </tr>
                        <tr>
                            <td>No. Absen</td>
                            <td>: ................................................</td>
                            <td>Tanggal</td>
                            <td>: .........................................</td>
                        </tr>
                    </table>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="font-weight: bold;">Tujuan Pembelajaran:</p>
                        <p style="margin-left: 15px;">${lkpd.tujuan || '-'}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <p style="font-weight: bold;">Petunjuk:</p>
                        <p style="margin-left: 15px; white-space: pre-line;">${lkpd.petunjuk || '-'}</p>
                    </div>
                    
                    ${lkpd.teksArab ? `
                        <div style="margin-bottom: 15px; text-align: center;">
                            <p dir="rtl" style="font-family: 'Amiri', serif; font-size: 18pt; line-height: 2;">${lkpd.teksArab}</p>
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 15px;">
                        <p style="font-weight: bold;">Soal / Kegiatan:</p>
                        <div style="margin-left: 15px; white-space: pre-line;">${lkpd.konten || '-'}</div>
                    </div>
                    
                    ${lkpd.rubrik ? `
                        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <p style="font-weight: bold; font-size: 10pt;">Rubrik Penilaian:</p>
                            <p style="font-size: 10pt; white-space: pre-line;">${lkpd.rubrik}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

// Print LKPD
function printLKPD(id) {
    const content = document.getElementById('lkpdPrintContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>LKPD</title>
            <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
                table { border-collapse: collapse; }
                td { padding: 3px; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Edit LKPD
function editLKPD(id) {
    const lkpd = lkpdData.find(l => l.id === id);
    if (!lkpd) return;

    tambahLKPD();

    setTimeout(() => {
        document.getElementById('lkpdKelas').value = lkpd.kelas;
        document.getElementById('lkpdPertemuan').value = lkpd.pertemuan;
        document.getElementById('lkpdJudul').value = lkpd.judul;
        document.getElementById('lkpdJudul').dataset.editId = id;
        document.getElementById('lkpdTujuan').value = lkpd.tujuan || '';
        document.getElementById('lkpdPetunjuk').value = lkpd.petunjuk || '';
        document.getElementById('lkpdArab').value = lkpd.teksArab || '';
        document.getElementById('lkpdKonten').value = lkpd.konten || '';
        document.getElementById('lkpdRubrik').value = lkpd.rubrik || '';
    }, 100);
}

// Hapus LKPD
async function hapusLKPD(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus LKPD ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('lkpd').doc(id).delete();
        
        showToast('LKPD berhasil dihapus', 'success');
        loadLKPDData();
    } catch (error) {
        console.error('Error deleting LKPD:', error);
        showToast('Gagal menghapus LKPD', 'error');
    }
    showLoading(false);
}