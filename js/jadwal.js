// Jadwal Pelajaran Management

let jadwalData = [];
let jamPelajaranList = [];

// Load Jadwal Data
async function loadJadwalData() {
    try {
        // Load jam settings
        const settingsDoc = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').doc('settings').get();
        
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            document.getElementById('durasiJP').value = settings.durasiJP || 35;
            document.getElementById('jamMulai').value = settings.jamMulai || '07:00';
            document.getElementById('jumlahJPHari').value = settings.jumlahJPHari || 8;
        } else {
            // Set default based on jenjang
            const jenjang = window.profilData?.jenjang || 'SD';
            document.getElementById('durasiJP').value = APP_CONFIG.jenjangDurasi[jenjang] || 35;
        }

        generateJamPelajaran();

        // Load jadwal
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').where('type', '==', 'jadwal').get();
        
        jadwalData = [];
        jadwalSnap.forEach(doc => {
            jadwalData.push({ id: doc.id, ...doc.data() });
        });

        renderJadwalTable();

    } catch (error) {
        console.error('Error loading jadwal:', error);
        showToast('Gagal memuat jadwal', 'error');
    }
}

// Generate Jam Pelajaran
function generateJamPelajaran() {
    const durasi = parseInt(document.getElementById('durasiJP').value) || 35;
    const jamMulai = document.getElementById('jamMulai').value || '07:00';
    const jumlahJP = parseInt(document.getElementById('jumlahJPHari').value) || 8;

    const [startHour, startMin] = jamMulai.split(':').map(Number);
    let currentMinutes = startHour * 60 + startMin;
    
    jamPelajaranList = [];
    
    for (let i = 1; i <= jumlahJP; i++) {
        const mulai = formatTime(currentMinutes);
        currentMinutes += durasi;
        const selesai = formatTime(currentMinutes);
        
        jamPelajaranList.push({
            jam: i,
            mulai: mulai,
            selesai: selesai
        });

        // Add break after certain hours
        if (i === 3) currentMinutes += 15; // Istirahat 1
        if (i === 6) currentMinutes += 15; // Istirahat 2
    }

    // Render jam pelajaran list
    const container = document.getElementById('daftarJamPelajaran');
    container.innerHTML = jamPelajaranList.map(jp => `
        <div class="bg-white border rounded-lg px-3 py-2 text-sm">
            <span class="font-medium text-primary">Jam ${jp.jam}</span>
            <span class="text-gray-600 ml-2">${jp.mulai} - ${jp.selesai}</span>
        </div>
    `).join('');

    saveJamSettings();
    renderJadwalTable();
}

// Save Jam Settings
async function saveJamSettings() {
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').doc('settings').set({
                durasiJP: parseInt(document.getElementById('durasiJP').value) || 35,
                jamMulai: document.getElementById('jamMulai').value || '07:00',
                jumlahJPHari: parseInt(document.getElementById('jumlahJPHari').value) || 8,
                jamPelajaran: jamPelajaranList,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
    } catch (error) {
        console.error('Error saving jam settings:', error);
    }
}

// Render Jadwal Table
function renderJadwalTable() {
    const tbody = document.getElementById('tableJadwal');
    const jumlahJP = parseInt(document.getElementById('jumlahJPHari').value) || 8;
    const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

    let html = '';

    for (let jam = 1; jam <= jumlahJP; jam++) {
        const jpInfo = jamPelajaranList.find(j => j.jam === jam);
        html += `<tr class="border-b hover:bg-gray-50">`;
        html += `<td class="px-4 py-2 font-medium text-sm">
            Jam ${jam}<br>
            <span class="text-xs text-gray-500">${jpInfo ? jpInfo.mulai + '-' + jpInfo.selesai : ''}</span>
        </td>`;

        for (let h = 1; h <= 6; h++) {
            const jadwal = jadwalData.find(j => j.hari === h && j.jam === jam);
            if (jadwal) {
                html += `
                    <td class="px-2 py-2 text-center">
                        <div class="bg-blue-100 rounded-lg p-2 text-xs cursor-pointer hover:bg-blue-200" 
                            onclick="editJadwal('${jadwal.id}')">
                            <div class="font-medium text-blue-800">${jadwal.kelas}${jadwal.rombel}</div>
                            <div class="text-blue-600 truncate">${jadwal.mapel || 'PAI'}</div>
                        </div>
                    </td>
                `;
            } else {
                html += `
                    <td class="px-2 py-2 text-center">
                        <button onclick="tambahJadwalCell(${h}, ${jam})" 
                            class="w-full h-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition">
                            <i class="fas fa-plus"></i>
                        </button>
                    </td>
                `;
            }
        }

        html += `</tr>`;
    }

    tbody.innerHTML = html;
}

// Tambah Jadwal
function tambahJadwal() {
    showJadwalModal();
}

// Tambah Jadwal Cell
function tambahJadwalCell(hari, jam) {
    showJadwalModal(null, hari, jam);
}

// Show Jadwal Modal
function showJadwalModal(editId = null, defaultHari = null, defaultJam = null) {
    const mapelOptions = window.profilData?.mataPelajaran?.map(m => 
        `<option value="${m.nama}">${m.nama}</option>`
    ).join('') || '<option value="Pendidikan Agama Islam dan Budi Pekerti">PAI</option>';

    const modal = `
        <div id="modalJadwal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalJadwal')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">${editId ? 'Edit' : 'Tambah'} Jadwal</h3>
                
                <form onsubmit="saveJadwal(event, '${editId || ''}')">
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                                <select id="jadwalHari" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    <option value="1" ${defaultHari === 1 ? 'selected' : ''}>Senin</option>
                                    <option value="2" ${defaultHari === 2 ? 'selected' : ''}>Selasa</option>
                                    <option value="3" ${defaultHari === 3 ? 'selected' : ''}>Rabu</option>
                                    <option value="4" ${defaultHari === 4 ? 'selected' : ''}>Kamis</option>
                                    <option value="5" ${defaultHari === 5 ? 'selected' : ''}>Jum'at</option>
                                    <option value="6" ${defaultHari === 6 ? 'selected' : ''}>Sabtu</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Jam Ke</label>
                                <select id="jadwalJam" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    ${Array.from({length: parseInt(document.getElementById('jumlahJPHari').value) || 8}, (_, i) => 
                                        `<option value="${i+1}" ${defaultJam === i+1 ? 'selected' : ''}>Jam ${i+1}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                            <select id="jadwalMapel" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                ${mapelOptions}
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                <select id="jadwalKelas" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                                    ${getKelasOptions()}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Rombel</label>
                                <input type="text" id="jadwalRombel" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                    placeholder="A, B, C..." value="A" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button type="button" onclick="closeModal('modalJadwal')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Batal
                        </button>
                        ${editId ? `
                            <button type="button" onclick="hapusJadwal('${editId}')" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
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

// Get Kelas Options
function getKelasOptions() {
    const jenjang = window.profilData?.jenjang || 'SD';
    let kelasList = [];
    
    if (jenjang === 'SD') {
        kelasList = [1, 2, 3, 4, 5, 6];
    } else if (jenjang === 'SMP') {
        kelasList = [7, 8, 9];
    } else {
        kelasList = [10, 11, 12];
    }

    return kelasList.map(k => `<option value="${k}">Kelas ${k}</option>`).join('');
}

// Save Jadwal
async function saveJadwal(event, editId) {
    event.preventDefault();
    
    const hari = parseInt(document.getElementById('jadwalHari').value);
    const jam = parseInt(document.getElementById('jadwalJam').value);
    const mapel = document.getElementById('jadwalMapel').value;
    const kelas = document.getElementById('jadwalKelas').value;
    const rombel = document.getElementById('jadwalRombel').value.trim().toUpperCase();

    // Validasi bentrok
    const bentrok = jadwalData.find(j => {
        if (editId && j.id === editId) return false;
        
        // Guru tidak bisa di kelas berbeda di jam yang sama
        if (j.hari === hari && j.jam === jam) return true;
        
        return false;
    });

    if (bentrok) {
        showToast(`Jadwal bentrok dengan ${bentrok.kelas}${bentrok.rombel} pada waktu yang sama`, 'error');
        return;
    }

    showLoading(true);

    try {
        const data = {
            type: 'jadwal',
            hari: hari,
            jam: jam,
            mapel: mapel,
            kelas: kelas,
            rombel: rombel,
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editId) {
            await db.collection('users').doc(currentUser.uid)
                .collection('jadwal').doc(editId).update(data);
        } else {
            await db.collection('users').doc(currentUser.uid)
                .collection('jadwal').add(data);
        }

        closeModal('modalJadwal');
        showToast('Jadwal berhasil disimpan', 'success');
        loadJadwalData();

        // Update status
        document.getElementById('statusJadwal').classList.remove('bg-red-500');
        document.getElementById('statusJadwal').classList.add('bg-green-500');

    } catch (error) {
        console.error('Error saving jadwal:', error);
        showToast('Gagal menyimpan jadwal', 'error');
    }

    showLoading(false);
}

// Edit Jadwal
function editJadwal(id) {
    const jadwal = jadwalData.find(j => j.id === id);
    if (!jadwal) return;

    showJadwalModal(id);

    setTimeout(() => {
        document.getElementById('jadwalHari').value = jadwal.hari;
        document.getElementById('jadwalJam').value = jadwal.jam;
        document.getElementById('jadwalMapel').value = jadwal.mapel;
        document.getElementById('jadwalKelas').value = jadwal.kelas;
        document.getElementById('jadwalRombel').value = jadwal.rombel;
    }, 100);
}

// Hapus Jadwal
async function hapusJadwal(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;

    showLoading(true);
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('jadwal').doc(id).delete();
        
        closeModal('modalJadwal');
        showToast('Jadwal berhasil dihapus', 'success');
        loadJadwalData();
    } catch (error) {
        console.error('Error deleting jadwal:', error);
        showToast('Gagal menghapus jadwal', 'error');
    }
    showLoading(false);
}