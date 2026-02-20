// Profil Management

// Load Profile Form
async function loadProfileForm() {
    try {
        const doc = await db.collection('users').doc(currentUser.uid)
            .collection('profil').doc('data').get();
        
        // Set email (readonly)
        document.getElementById('emailGuru').value = currentUser.email;
        
        if (doc.exists) {
            const data = doc.data();
            
            // Fill form fields
            document.getElementById('namaGuru').value = data.namaGuru || '';
            document.getElementById('nipGuru').value = data.nipGuru || '';
            document.getElementById('hpGuru').value = data.hpGuru || '';
            document.getElementById('namaSekolah').value = data.namaSekolah || '';
            document.getElementById('jenjang').value = data.jenjang || '';
            document.getElementById('kotaSekolah').value = data.kotaSekolah || '';
            document.getElementById('alamatSekolah').value = data.alamatSekolah || '';
            document.getElementById('namaKepsek').value = data.namaKepsek || '';
            document.getElementById('nipKepsek').value = data.nipKepsek || '';
            
            // Load mata pelajaran
            if (data.mataPelajaran && data.mataPelajaran.length > 0) {
                renderMataPelajaran(data.mataPelajaran);
            } else {
                renderMataPelajaran([{ nama: 'Pendidikan Agama Islam dan Budi Pekerti', jpPerMinggu: 4, isPAI: true }]);
            }
        } else {
            // Default mata pelajaran
            renderMataPelajaran([{ nama: 'Pendidikan Agama Islam dan Budi Pekerti', jpPerMinggu: 4, isPAI: true }]);
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Gagal memuat profil', 'error');
    }
}

// Render Mata Pelajaran
function renderMataPelajaran(mapelList) {
    const container = document.getElementById('mataPelajaranContainer');
    container.innerHTML = '';
    
    mapelList.forEach((mapel, index) => {
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-start mb-3';
        div.innerHTML = `
            <div class="flex-1">
                <input type="text" 
                    class="mapel-nama w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                    value="${mapel.nama}" 
                    placeholder="Nama Mata Pelajaran"
                    ${mapel.isPAI ? 'readonly' : ''}>
            </div>
            <div class="w-24">
                <input type="number" 
                    class="mapel-jp w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                    value="${mapel.jpPerMinggu}" 
                    min="1" max="12"
                    placeholder="JP/Minggu"
                    title="Jumlah JP per minggu">
            </div>
            ${!mapel.isPAI ? `
                <button type="button" onclick="hapusMapel(this)" class="text-red-500 hover:text-red-700 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            ` : '<div class="w-10"></div>'}
        `;
        container.appendChild(div);
    });
}

// Tambah Mata Pelajaran
function tambahMapel() {
    const container = document.getElementById('mataPelajaranContainer');
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start mb-3';
    div.innerHTML = `
        <div class="flex-1">
            <input type="text" 
                class="mapel-nama w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                placeholder="Nama Mata Pelajaran">
        </div>
        <div class="w-24">
            <input type="number" 
                class="mapel-jp w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                value="2" min="1" max="12"
                placeholder="JP/Minggu"
                title="Jumlah JP per minggu">
        </div>
        <button type="button" onclick="hapusMapel(this)" class="text-red-500 hover:text-red-700 p-2">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(div);
}

// Hapus Mata Pelajaran
function hapusMapel(btn) {
    btn.parentElement.remove();
}

// Save Profil
async function saveProfil(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        // Collect mata pelajaran
        const mapelList = [];
        const mapelRows = document.querySelectorAll('#mataPelajaranContainer > div');
        mapelRows.forEach((row, index) => {
            const nama = row.querySelector('.mapel-nama').value.trim();
            const jp = parseInt(row.querySelector('.mapel-jp').value) || 2;
            if (nama) {
                mapelList.push({
                    nama: nama,
                    jpPerMinggu: jp,
                    isPAI: index === 0 && nama.toLowerCase().includes('agama')
                });
            }
        });

        const profilData = {
            namaGuru: document.getElementById('namaGuru').value.trim(),
            nipGuru: document.getElementById('nipGuru').value.trim(),
            emailGuru: currentUser.email,
            hpGuru: document.getElementById('hpGuru').value.trim(),
            namaSekolah: document.getElementById('namaSekolah').value.trim(),
            jenjang: document.getElementById('jenjang').value,
            kotaSekolah: document.getElementById('kotaSekolah').value.trim(),
            alamatSekolah: document.getElementById('alamatSekolah').value.trim(),
            namaKepsek: document.getElementById('namaKepsek').value.trim(),
            nipKepsek: document.getElementById('nipKepsek').value.trim(),
            mataPelajaran: mapelList,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(currentUser.uid)
            .collection('profil').doc('data').set(profilData, { merge: true });

        // Update global profil data
        window.profilData = profilData;

        showToast('Profil berhasil disimpan', 'success');
        
        // Update status indicator
        document.getElementById('statusProfil').classList.remove('bg-red-500');
        document.getElementById('statusProfil').classList.add('bg-green-500');

    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Gagal menyimpan profil', 'error');
    }
    
    showLoading(false);
}