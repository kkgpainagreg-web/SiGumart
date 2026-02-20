// Update saveKalenderSettings to auto-load holidays
async function saveKalenderSettings() {
    try {
        const settings = {
            gasalMulai: document.getElementById('gasalMulai').value,
            gasalSelesai: document.getElementById('gasalSelesai').value,
            genapMulai: document.getElementById('genapMulai').value,
            genapSelesai: document.getElementById('genapSelesai').value,
            tahunAjaran: currentTahunAjaran,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(currentUser.uid)
            .collection('kalender').doc('settings').set(settings, { merge: true });

        kalenderSettings = settings;
        
        // Auto-load hari libur nasional
        await loadHariLiburOtomatis(currentUser.uid, currentTahunAjaran);
        
        showToast('Pengaturan kalender disimpan', 'success');

        // Update status
        document.getElementById('statusKalender').classList.remove('bg-red-500');
        document.getElementById('statusKalender').classList.add('bg-green-500');
        
        // Reload kalender data
        loadKalenderData();

    } catch (error) {
        console.error('Error saving kalender settings:', error);
        showToast('Gagal menyimpan pengaturan', 'error');
    }
}

// Render Kalender Table - Updated to mark national holidays
function renderKalenderTable() {
    const tbody = document.getElementById('tableKalender');
    
    if (kalenderData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-calendar-alt text-4xl text-gray-300 mb-3"></i>
                    <p>Belum ada kegiatan</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = kalenderData.map(item => `
        <tr class="border-b hover:bg-gray-50 ${item.isNasional ? 'bg-red-50' : ''}">
            <td class="px-4 py-3">
                ${item.nama}
                ${item.isNasional ? '<span class="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Nasional</span>' : ''}
            </td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${getJenisClass(item.jenis)}">${item.jenis}</span>
            </td>
            <td class="px-4 py-3">${formatDate(item.mulai)}</td>
            <td class="px-4 py-3">${formatDate(item.selesai)}</td>
            <td class="px-4 py-3 text-center">
                ${!item.isNasional ? `
                    <button onclick="editKegiatan('${item.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="hapusKegiatan('${item.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '<span class="text-gray-400 text-sm">Auto</span>'}
            </td>
        </tr>
    `).join('');
}