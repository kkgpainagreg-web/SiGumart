// Absensi Management

let absensiSiswaList = [];
let absensiRombelMap = {};

// Initialize Absensi Form
async function initAbsensiForm() {
    // Set today's date
    const tanggalInput = document.getElementById('absensiTanggal');
    if (tanggalInput) {
        tanggalInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Load kelas options from jadwal
    try {
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('type', '==', 'jadwal')
            .get();
        
        const kelasSet = new Set();
        absensiRombelMap = {};
        
        jadwalSnap.forEach(doc => {
            const data = doc.data();
            if (data.kelas) {
                kelasSet.add(data.kelas);
                if (!absensiRombelMap[data.kelas]) absensiRombelMap[data.kelas] = new Set();
                if (data.rombel) absensiRombelMap[data.kelas].add(data.rombel);
            }
        });

        const absensiKelas = document.getElementById('absensiKelas');
        if (absensiKelas) {
            absensiKelas.innerHTML = '<option value="">Pilih Kelas</option>' +
                [...kelasSet].sort((a,b) => a-b).map(k => `<option value="${k}">Kelas ${k}</option>`).join('');
        }

    } catch (error) {
        console.error('Error init absensi:', error);
    }
}

// Load Absensi Rombel
function loadAbsensiRombel() {
    const kelas = document.getElementById('absensiKelas')?.value;
    const absensiRombel = document.getElementById('absensiRombel');
    
    if (absensiRombel && kelas && absensiRombelMap[kelas]) {
        absensiRombel.innerHTML = '<option value="">Pilih Rombel</option>' +
            [...absensiRombelMap[kelas]].sort().map(r => `<option value="${r}">${r}</option>`).join('');
    } else if (absensiRombel) {
        absensiRombel.innerHTML = '<option value="">Pilih Rombel</option>';
    }
}

// Load Absensi Siswa
async function loadAbsensiSiswa() {
    const kelas = document.getElementById('absensiKelas')?.value;
    const rombel = document.getElementById('absensiRombel')?.value;
    const tanggal = document.getElementById('absensiTanggal')?.value;
    const tbody = document.getElementById('tableAbsensi');
    
    if (!kelas || !rombel || !tbody) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Pilih kelas dan rombel</td></tr>`;
        }
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
        
        absensiSiswaList = [];
        siswaSnap.forEach(doc => {
            absensiSiswaList.push({ id: doc.id, ...doc.data() });
        });
        absensiSiswaList.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

        // Load existing absensi
        let existingAbsensi = {};
        if (tanggal) {
            const absensiSnap = await db.collection('users').doc(currentUser.uid)
                .collection('absensi')
                .where('kelas', '==', kelas)
                .where('rombel', '==', rombel)
                .where('tanggal', '==', tanggal)
                .get();
            
            absensiSnap.forEach(doc => {
                const data = doc.data();
                existingAbsensi[data.siswaId] = { status: data.status, keterangan: data.keterangan || '' };
            });
        }

        renderAbsensiTable(existingAbsensi);

    } catch (error) {
        console.error('Error loading absensi:', error);
        showToast('Gagal memuat data siswa', 'error');
    }

    showLoading(false);
}

// Render Absensi Table
function renderAbsensiTable(existingAbsensi = {}) {
    const tbody = document.getElementById('tableAbsensi');
    if (!tbody) return;

    if (absensiSiswaList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Tidak ada siswa</td></tr>`;
        return;
    }

    tbody.innerHTML = absensiSiswaList.map((siswa, index) => {
        const existing = existingAbsensi[siswa.id] || { status: 'H', keterangan: '' };
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 text-center">${index + 1}</td>
                <td class="px-4 py-3">${siswa.nama || '-'}</td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="H" ${existing.status === 'H' ? 'checked' : ''} class="w-4 h-4 text-green-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="I" ${existing.status === 'I' ? 'checked' : ''} class="w-4 h-4 text-yellow-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="S" ${existing.status === 'S' ? 'checked' : ''} class="w-4 h-4 text-blue-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="A" ${existing.status === 'A' ? 'checked' : ''} class="w-4 h-4 text-red-600">
                </td>
                <td class="px-4 py-3">
                    <input type="text" id="ket_${siswa.id}" value="${existing.keterangan}" class="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Keterangan">
                </td>
            </tr>
        `;
    }).join('');
}

// Save Absensi
async function saveAbsensi() {
    const kelas = document.getElementById('absensiKelas')?.value;
    const rombel = document.getElementById('absensiRombel')?.value;
    const tanggal = document.getElementById('absensiTanggal')?.value;
    const jam = document.getElementById('absensiJam')?.value || '1-2';
    
    if (!kelas || !rombel || !tanggal) {
        showToast('Lengkapi kelas, rombel, dan tanggal', 'warning');
        return;
    }

    showLoading(true);

    try {
        const batch = db.batch();
        let hadir = 0, izin = 0, sakit = 0, alpha = 0;

        // Delete existing
        const existingSnap = await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('tanggal', '==', tanggal)
            .get();
        
        existingSnap.forEach(doc => batch.delete(doc.ref));

        // Save new
        absensiSiswaList.forEach(siswa => {
            const statusRadio = document.querySelector(`input[name="absensi_${siswa.id}"]:checked`);
            const status = statusRadio ? statusRadio.value : 'H';
            const ketInput = document.getElementById(`ket_${siswa.id}`);
            const keterangan = ketInput ? ketInput.value.trim() : '';

            if (status === 'H') hadir++;
            else if (status === 'I') izin++;
            else if (status === 'S') sakit++;
            else if (status === 'A') alpha++;

            const docRef = db.collection('users').doc(currentUser.uid).collection('absensi').doc();
            batch.set(docRef, {
                siswaId: siswa.id,
                siswaName: siswa.nama,
                kelas, rombel, tanggal, jam, status, keterangan,
                semester: currentSemester,
                tahunAjaran: currentTahunAjaran,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        showToast('Absensi berhasil disimpan', 'success');

    } catch (error) {
        console.error('Error saving absensi:', error);
        showToast('Gagal menyimpan absensi', 'error');
    }

    showLoading(false);
}
