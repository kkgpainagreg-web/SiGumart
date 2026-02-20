// AI Assistant for CSV Conversion

const AI_PROMPTS = {
    siswa: {
        title: 'Data Siswa',
        description: 'Konversi daftar siswa ke format CSV',
        prompt: `Tolong bantu saya mengkonversi data siswa berikut ke format CSV dengan kolom:
nisn,nama,jenis_kelamin,kelas,rombel

Aturan:
- nisn: Nomor Induk Siswa Nasional (10 digit)
- nama: Nama lengkap siswa
- jenis_kelamin: L untuk Laki-laki, P untuk Perempuan
- kelas: Angka kelas (1-6 untuk SD, 7-9 untuk SMP, 10-12 untuk SMA)
- rombel: Huruf rombel (A, B, C, dst)

Contoh output:
nisn,nama,jenis_kelamin,kelas,rombel
0012345678,Ahmad Fauzi,L,5,A
0012345679,Siti Aisyah,P,5,A

Berikut data yang perlu dikonversi:
[TEMPEL DATA SISWA DI SINI]

Tolong konversi ke format CSV yang siap diupload.`
    },
    
    kalender: {
        title: 'Kalender Pendidikan',
        description: 'Konversi jadwal kegiatan ke format CSV',
        prompt: `Tolong bantu saya mengkonversi kalender pendidikan berikut ke format CSV dengan kolom:
nama,jenis,mulai,selesai

Aturan:
- nama: Nama kegiatan/libur
- jenis: Libur, Ujian, atau Kegiatan
- mulai: Format tanggal YYYY-MM-DD
- selesai: Format tanggal YYYY-MM-DD

Contoh output:
nama,jenis,mulai,selesai
Libur Semester Gasal,Libur,2025-12-21,2026-01-05
Ujian Akhir Semester,Ujian,2025-12-08,2025-12-15

Berikut data kalender yang perlu dikonversi:
[TEMPEL DATA KALENDER DI SINI]

Tolong konversi ke format CSV yang siap diupload.`
    },
    
    cp: {
        title: 'Capaian Pembelajaran',
        description: 'Konversi CP/TP ke format CSV',
        prompt: `Tolong bantu saya mengkonversi Capaian Pembelajaran berikut ke format CSV dengan kolom:
fase,kelas,semester,bab,tp,jp

Aturan:
- fase: A, B, C, D, E, atau F
- kelas: Angka kelas
- semester: Gasal atau Genap
- bab: Judul bab/materi pokok
- tp: Tujuan pembelajaran
- jp: Alokasi jam pelajaran (angka)

Contoh output:
fase,kelas,semester,bab,tp,jp
A,1,Gasal,1. Aku Cinta Al-Qur'an,1.1 Membaca Basmalah,4
A,1,Gasal,1. Aku Cinta Al-Qur'an,1.2 Melafalkan Al-Fatihah,4

Berikut data CP yang perlu dikonversi:
[TEMPEL DATA CP DI SINI]

Tolong konversi ke format CSV yang siap diupload.`
    },
    
    soal: {
        title: 'Bank Soal',
        description: 'Konversi soal ke format CSV',
        prompt: `Tolong bantu saya mengkonversi soal-soal berikut ke format CSV dengan kolom:
fase,kelas,tipe,tp,teks_arab,soal,opsi_a,opsi_b,opsi_c,opsi_d,jawaban

Aturan:
- fase: A, B, C, D, E, atau F
- kelas: Angka kelas
- tipe: pilgan, essay, atau isian
- tp: Tujuan pembelajaran yang diukur
- teks_arab: Teks Arab jika ada (opsional)
- soal: Teks soal
- opsi_a sampai opsi_d: Pilihan jawaban (untuk pilihan ganda)
- jawaban: Indeks jawaban benar (0=A, 1=B, 2=C, 3=D) atau teks untuk essay/isian

Contoh output:
fase,kelas,tipe,tp,teks_arab,soal,opsi_a,opsi_b,opsi_c,opsi_d,jawaban
A,1,pilgan,Mengenal huruf hijaiyah,ا ب ت,Huruf pertama dalam hijaiyah adalah...,Alif,Ba,Ta,Tsa,0
A,1,isian,Menghafal doa,بِسْمِ اللهِ,Tuliskan arti basmalah!,,,,,Dengan menyebut nama Allah

Berikut data soal yang perlu dikonversi:
[TEMPEL DATA SOAL DI SINI]

Tolong konversi ke format CSV yang siap diupload.`
    }
};

// Show AI Prompt
function showAIPrompt(type) {
    const promptData = AI_PROMPTS[type];
    if (!promptData) return;

    const aiPromptArea = document.getElementById('aiPromptArea');
    aiPromptArea.innerHTML = `
        <div class="mb-4">
            <h4 class="font-semibold text-gray-800">${promptData.title}</h4>
            <p class="text-sm text-gray-600">${promptData.description}</p>
        </div>
        
        <div class="bg-white border rounded-lg p-3 text-sm" style="white-space: pre-wrap; font-family: monospace;" id="promptText">
${promptData.prompt}
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700"><i class="fas fa-info-circle mr-2"></i>
                Salin prompt di atas, lalu tempel ke ChatGPT, Gemini, atau Claude. 
                Ganti bagian [TEMPEL DATA...] dengan data Anda yang akan dikonversi.
            </p>
        </div>
    `;
}

// Copy Prompt
function copyPrompt() {
    const promptText = document.getElementById('promptText');
    if (!promptText) {
        showToast('Pilih jenis data terlebih dahulu', 'warning');
        return;
    }

    const text = promptText.innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Prompt berhasil disalin!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Gagal menyalin prompt', 'error');
    });
}