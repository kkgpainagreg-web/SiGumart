// Absensi Management

let absensiSiswaList = [];

// Initialize Absensi Form
async function initAbsensiForm() {
    // Set today's date
    document.getElementById('absensiTanggal').value = new Date().toISOString().split('T')[0];
    
    // Load kelas options from jadwal
    try {
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

        const absensiKelas = document.getElementById('absensiKelas');
        absensiKelas.innerHTML = '<option value="">Pilih Kelas</option>' +
            [...kelasSet].sort((a,b) => a-b).map(k => `<option value="${k}">Kelas ${k}</option>`).join('');

        // Store rombel map for later use
        window.rombelMapCache = rombelMap;

        // Add change event
        absensiKelas.onchange = function() {
            const kelas = this.value;
            const absensiRombel = document.getElementById('absensiRombel');
            
            if (kelas && rombelMap[kelas]) {
                absensiRombel.innerHTML = '<option value="">Pilih Rombel</option>' +
                    [...rombelMap[kelas]].sort().map(r => `<option value="${r}">${r}</option>`).join('');
            } else {
                absensiRombel.innerHTML = '<option value="">Pilih Rombel</option>';
            }
        };

    } catch (error) {
        console.error('Error init absensi:', error);
    }
}

// Load Absensi Siswa
async function loadAbsensiSiswa() {
    const kelas = document.getElementById('absensiKelas').value;
    const rombel = document.getElementById('absensiRombel').value;
    const tanggal = document.getElementById('absensiTanggal').value;
    
    if (!kelas || !rombel) {
        document.getElementById('tableAbsensi').innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    Pilih kelas dan rombel untuk menampilkan daftar siswa
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
        
        absensiSiswaList = [];
        siswaSnap.forEach(doc => {
            absensiSiswaList.push({ id: doc.id, ...doc.data() });
        });
        absensiSiswaList.sort((a, b) => a.nama.localeCompare(b.nama));

        // Load existing absensi for this date
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
                existingAbsensi[data.siswaId] = { status: data.status, keterangan: data.keterangan };
            });
        }

        renderAbsensiTable(existingAbsensi);

    } catch (error) {
        console.error('Error loading absensi siswa:', error);
        showToast('Gagal memuat data siswa', 'error');
    }

    showLoading(false);
}

// Render Absensi Table
function renderAbsensiTable(existingAbsensi = {}) {
    const tbody = document.getElementById('tableAbsensi');

    if (absensiSiswaList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    Tidak ada siswa di kelas/rombel ini
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = absensiSiswaList.map((siswa, index) => {
        const existing = existingAbsensi[siswa.id] || { status: 'H', keterangan: '' };
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 text-center">${index + 1}</td>
                <td class="px-4 py-3">${siswa.nama}</td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="H" ${existing.status === 'H' ? 'checked' : ''} 
                        class="w-4 h-4 text-green-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="I" ${existing.status === 'I' ? 'checked' : ''}
                        class="w-4 h-4 text-yellow-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="S" ${existing.status === 'S' ? 'checked' : ''}
                        class="w-4 h-4 text-blue-600">
                </td>
                <td class="px-4 py-3 text-center">
                    <input type="radio" name="absensi_${siswa.id}" value="A" ${existing.status === 'A' ? 'checked' : ''}
                        class="w-4 h-4 text-red-600">
                </td>
                <td class="px-4 py-3">
                    <input type="text" id="ket_${siswa.id}" value="${existing.keterangan || ''}"
                        class="w-full border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Keterangan">
                </td>
            </tr>
        `;
    }).join('');
}

// Save Absensi
async function saveAbsensi() {
    const kelas = document.getElementById('absensiKelas').value;
    const rombel = document.getElementById('absensiRombel').value;
    const tanggal = document.getElementById('absensiTanggal').value;
    const jam = document.getElementById('absensiJam').value;
    
    if (!kelas || !rombel || !tanggal) {
        showToast('Lengkapi kelas, rombel, dan tanggal', 'warning');
        return;
    }

    showLoading(true);

    try {
        const batch = db.batch();
        let hadir = 0, izin = 0, sakit = 0, alpha = 0;

        // Delete existing absensi for this date/class
        const existingSnap = await db.collection('users').doc(currentUser.uid)
            .collection('absensi')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('tanggal', '==', tanggal)
            .get();
        
        existingSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Save new absensi
        absensiSiswaList.forEach(siswa => {
            const statusRadio = document.querySelector(`input[name="absensi_${siswa.id}"]:checked`);
            const status = statusRadio ? statusRadio.value : 'H';
            const keterangan = document.getElementById(`ket_${siswa.id}`).value.trim();

            // Count
            if (status === 'H') hadir++;
            else if (status === 'I') izin++;
            else if (status === 'S') sakit++;
            else if (status === 'A') alpha++;

            const docRef = db.collection('users').doc(currentUser.uid)
                .collection('absensi').doc();
            
            batch.set(docRef, {
                siswaId: siswa.id,
                siswaName: siswa.nama,
                kelas: kelas,
                rombel: rombel,
                tanggal: tanggal,
                jam: jam,
                status: status,
                keterangan: keterangan,
                semester: currentSemester,
                tahunAjaran: currentTahunAjaran,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        // Auto update jurnal if exists
        const jurnalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jurnal')
            .where('kelas', '==', kelas)
            .where('rombel', '==', rombel)
            .where('tanggal', '==', tanggal)
            .limit(1)
            .get();
        
        if (!jurnalSnap.empty) {
            const jurnalDoc = jurnalSnap.docs[0];
            await jurnalDoc.ref.update({
                hadir: hadir,
                izin: izin,
                sakit: sakit,
                alpha: alpha
            });
        }

        showToast('Absensi berhasil disimpan', 'success');

    } catch (error) {
        console.error('Error saving absensi:', error);
        showToast('Gagal menyimpan absensi', 'error');
    }

    showLoading(false);
}