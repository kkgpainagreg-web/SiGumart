// Jurnal Pembelajaran Management

let jurnalData = [];

// Load Jurnal Data
async function loadJurnalData() {
    try {
        // Populate kelas filter
        const jadwalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jadwal')
            .where('type', '==', 'jadwal')
            .get();
        
        const kelasList = new Set();
        jadwalSnap.forEach(doc => {
            const data = doc.data();
            kelasList.add(data.kelas);
        });

        const jurnalKelas = document.getElementById('jurnalKelas');
        if (jurnalKelas) {
            jurnalKelas.innerHTML = '<option value="">Pilih Kelas</option>' +
                [...kelasList].sort((a,b) => a-b).map(k => `<option value="${k}">Kelas ${k}</option>`).join('');
        }

        // Load jurnal - query sederhana tanpa composite index
        const jurnalSnap = await db.collection('users').doc(currentUser.uid)
            .collection('jurnal')
            .where('tahunAjaran', '==', currentTahunAjaran)
            .get();
        
        jurnalData = [];
        jurnalSnap.forEach(doc => {
            const data = doc.data();
            // Filter by semester di client side
            if (data.semester === currentSemester) {
                jurnalData.push({ id: doc.id, ...data });
            }
        });

        // Sort di client side
        jurnalData.sort((a, b) => {
            const dateA = new Date(a.tanggal || 0);
            const dateB = new Date(b.tanggal || 0);
            return dateB - dateA;
        });

        renderJurnalTable();

    } catch (error) {
        console.error('Error loading jurnal:', error);
        showToast('Gagal memuat jurnal', 'error');
    }
}

// ... (rest of jurnal.js remains the same)
