// Nilai Management

let nilaiSiswaList = [];
let komponenNilai = ['PH1', 'PH2', 'PH3', 'PTS', 'PAS'];
let bobotNilai = { PH: 50, PTS: 25, PAS: 25 };

// Initialize Nilai Form
async function initNilaiForm() {
    // Load kelas options
    const jadwalSnap = await db.collection('users').doc(currentUser.uid)
        .collection('jadwal')
        .where('type', '==', 'jadwal')
        .get();
    
    const kelasSet = new Set();
    const rombelMap = {};
    
    jadwalSnap.forEach(doc => {
        const data = doc.data();
        kelasSet.add(data.kelas);
        if (!rombelMap[data.kelas]) rombelMap[data.kelas] = new Set();
        rombelMap[data.kelas].add(data.rombel);
    });

    const nilaiKelas = document.getElementById('nilaiKelas');
    nilaiKelas.innerHTML = '<option value="">Pilih Kelas</option>' +
        [...kelasSet].sort((a,b) => a-b).map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

    nilaiKelas.onchange = function() {
        const kelas = this.value;
        const nilaiRombel = document.getElementById('nilaiRombel');
        
        if (kelas && rombelMap[kelas]) {
            nilaiRombel.innerHTML = '<option value="">Pilih Rombel</option>' +
                [...rombelMap[kelas]].sort().map(r => `<option value="${r}">${r}</option>`).join('');
        } else {
            nilaiRombel.innerHTML = '<option value="">Pilih Rombel</option>';
        }
    };

    // Load settings
    const settingsDoc = await db.collection('users').doc(currentUser.uid)
        .collection('nilai').doc('settings').get();
    
    if (settingsDoc.exists) {
        const settings = settingsDoc.data();
        if (settings.komponen) komponenNilai = settings.komponen;
        if (settings.bobot) bobotNilai = settings.bobot;
    }
}

// Load Nilai
async function loadNilai() {
    const kelas = document.getElementById('nilaiKelas').value;
    const rombel = document.getElementById('nilaiRombel').value;
    
    if (!kelas || !rombel) {
        document.getElementById('tableNilai').innerHTML = `
            <tr>
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                    Pilih kelas dan rombel untuk menampilkan daftar nilai
                </td>
            </tr>
        `;
        return;
    }

    showLoading(true);

    try {
        // Load siswa
        const siswaSnap = await db.collection('users').doc(currentUser.uid)
            .collection('siswa')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        nilaiSiswaList = [];
        siswaSnap.forEach(doc => {
            nilaiSiswaList.push({ id: doc.id, ...doc.data() });
        });
        nilaiSiswaList.sort((a, b) => a.nama.localeCompare(b.nama));

        // Load existing nilai
        const nilaiSnap = await db.collection('users').doc(currentUser.uid)
            .collection('nilai')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('semester', '==', currentSemester)
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        const nilaiMap = {};
        nilaiSnap.forEach(doc => {
            const data = doc.data();
            nilaiMap[data.siswaId] = data.nilai || {};
        });

        renderNilaiTable(nilaiMap);

    } catch (error) {
        console.error('Error loading nilai:', error);
        showToast('Gagal memuat data nilai', 'error');
    }

    showLoading(false);
}

// Render Nilai Table
function renderNilaiTable(nilaiMap = {}) {
    const tbody = document.getElementById('tableNilai');

    if (nilaiSiswaList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${komponenNilai.length + 3}" class="px-4 py-8 text-center text-gray-500">
                    Tidak ada siswa di kelas/rombel ini
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = nilaiSiswaList.map((siswa, index) => {
        const nilai = nilaiMap[siswa.id] || {};
        
        // Calculate NR
        let totalPH = 0, countPH = 0;
        komponenNilai.forEach(k => {
            if (k.startsWith('PH') && nilai[k]) {
                totalPH += parseFloat(nilai[k]) || 0;
                countPH++;
            }
        });
        const avgPH = countPH > 0 ? totalPH / countPH : 0;
        const pts = parseFloat(nilai.PTS) || 0;
        const pas = parseFloat(nilai.PAS) || 0;
        
        const nr = Math.round((avgPH * bobotNilai.PH/100) + (pts * bobotNilai.PTS/100) + (pas * bobotNilai.PAS/100));

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-3 py-2 text-center">${index + 1}</td>
                <td class="px-3 py-2">${siswa.nama}</td>
                ${komponenNilai.map(k => `
                    <td class="px-1 py-2 text-center">
                        <input type="number" id="nilai_${siswa.id}_${k}" 
                            value="${nilai[k] || ''}" 
                            min="0" max="100"
                            class="w-14 border border-gray-300 rounded px-1 py-1 text-center text-sm"
                            onchange="calculateNR('${siswa.id}')">
                    </td>
                `).join('')}
                <td class="px-3 py-2 text-center font-bold bg-blue-50" id="nr_${siswa.id}">${nr || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Calculate NR on input change
function calculateNR(siswaId) {
    let totalPH = 0, countPH = 0;
    
    komponenNilai.forEach(k => {
        const val = document.getElementById(`nilai_${siswaId}_${k}`).value;
        if (k.startsWith('PH') && val) {
            totalPH += parseFloat(val) || 0;
            countPH++;
        }
    });
    
    const avgPH = countPH > 0 ? totalPH / countPH : 0;
    const pts = parseFloat(document.getElementById(`nilai_${siswaId}_PTS`)?.value) || 0;
    const pas = parseFloat(document.getElementById(`nilai_${siswaId}_PAS`)?.value) || 0;
    
    const nr = Math.round((avgPH * bobotNilai.PH/100) + (pts * bobotNilai.PTS/100) + (pas * bobotNilai.PAS/100));
    
    document.getElementById(`nr_${siswaId}`).textContent = nr || '-';
}

// Save Nilai
async function saveNilai() {
    const kelas = document.getElementById('nilaiKelas').value;
    const rombel = document.getElementById('nilaiRombel').value;
    
    if (!kelas || !rombel) {
        showToast('Pilih kelas dan rombel terlebih dahulu', 'warning');
        return;
    }

    showLoading(true);

    try {
        const batch = db.batch();

        // Delete existing
        const existingSnap = await db.collection('users').doc(currentUser.uid)
            .collection('nilai')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('semester', '==', currentSemester)
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        existingSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Save new nilai
        nilaiSiswaList.forEach(siswa => {
            const nilai = {};
            komponenNilai.forEach(k => {
                const val = document.getElementById(`nilai_${siswa.id}_${k}`)?.value;
                if (val) nilai[k] = parseFloat(val);
            });

            if (Object.keys(nilai).length > 0) {
                const docRef = db.collection('users').doc(currentUser.uid)
                    .collection('nilai').doc();
                
                batch.set(docRef, {
                    siswaId: siswa.id,
                    siswaName: siswa.nama,
                    kelas: kelas,
                    rombel: rombel,
                    nilai: nilai,
                    semester: currentSemester,
                    tahunAjaran: currentTahunAjaran,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();
        showToast('Nilai berhasil disimpan', 'success');

    } catch (error) {
        console.error('Error saving nilai:', error);
        showToast('Gagal menyimpan nilai', 'error');
    }

    showLoading(false);
}

// Setting Komponen Nilai
function settingKomponen() {
    const modal = `
        <div id="modalKomponen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onclick="closeModal('modalKomponen')">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onclick="event.stopPropagation()">
                <h3 class="text-xl font-bold text-gray-800 mb-4">Setting Komponen Nilai</h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Komponen Nilai (pisah dengan koma)</label>
                        <input type="text" id="settingKomponen" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                            value="${komponenNilai.join(', ')}" placeholder="PH1, PH2, PH3, PTS, PAS">
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bobot PH (%)</label>
                            <input type="number" id="settingBobotPH" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="${bobotNilai.PH}" min="0" max="100">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bobot PTS (%)</label>
                            <input type="number" id="settingBobotPTS" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="${bobotNilai.PTS}" min="0" max="100">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Bobot PAS (%)</label>
                            <input type="number" id="settingBobotPAS" class="w-full border border-gray-300 rounded-lg px-3 py-2" 
                                value="${bobotNilai.PAS}" min="0" max="100">
                        </div>
                    </div>
                    <p class="text-sm text-gray-500">Total bobot harus 100%</p>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button onclick="closeModal('modalKomponen')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button onclick="saveSettingKomponen()" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary">
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

// Save Setting Komponen
async function saveSettingKomponen() {
    const komponenStr = document.getElementById('settingKomponen').value;
    const bobotPH = parseInt(document.getElementById('settingBobotPH').value) || 0;
    const bobotPTS = parseInt(document.getElementById('settingBobotPTS').value) || 0;
    const bobotPAS = parseInt(document.getElementById('settingBobotPAS').value) || 0;

    if (bobotPH + bobotPTS + bobotPAS !== 100) {
        showToast('Total bobot harus 100%', 'warning');
        return;
    }

    komponenNilai = komponenStr.split(',').map(k => k.trim()).filter(k => k);
    bobotNilai = { PH: bobotPH, PTS: bobotPTS, PAS: bobotPAS };

    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('nilai').doc('settings').set({
                komponen: komponenNilai,
                bobot: bobotNilai,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

        closeModal('modalKomponen');
        showToast('Pengaturan disimpan', 'success');
        loadNilai();

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Gagal menyimpan pengaturan', 'error');
    }
}