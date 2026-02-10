/**
 * =====================================================
 * FILE: master-cp.js
 * FUNGSI: Menyimpan data Capaian Pembelajaran (CP) PAI SD
 *         berdasarkan Kepka BSKAP No. 046/H/KR/2025
 * 
 * STRUKTUR:
 * - Fase A (Kelas 1-2)
 * - Fase B (Kelas 3-4)  
 * - Fase C (Kelas 5-6)
 * 
 * Setiap fase memiliki 5 Elemen:
 * 1. Al-Qur'an dan Hadis
 * 2. Akidah
 * 3. Akhlak
 * 4. Fikih
 * 5. Sejarah Peradaban Islam (SPI)
 * =====================================================
 */

const MASTER_CP_PAI_2025 = {
    
    // =====================================================
    // FASE A (KELAS 1-2)
    // =====================================================
    "FASE_A": {
        nama: "Fase A",
        kelas: ["1", "2"],
        elemen: {
            
            // Elemen 1: Al-Qur'an dan Hadis
            "AL_QURAN_HADIS": {
                nama: "Al-Qur'an dan Hadis",
                capaian_pembelajaran: "Peserta didik mampu membaca surah-surah pendek dan ayat al-Qur'an serta mengenal hadis-hadis pilihan tentang akhlak terpuji.",
                tujuan_pembelajaran: [
                    {
                        kode: "A.QH.1.1",
                        deskripsi: "Peserta didik mampu melafalkan Q.S. Al-Fatihah dengan benar",
                        alokasi_waktu: 4 // dalam JP (Jam Pelajaran)
                    },
                    {
                        kode: "A.QH.1.2",
                        deskripsi: "Peserta didik mampu melafalkan Q.S. An-Nas dengan benar",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.QH.1.3",
                        deskripsi: "Peserta didik mampu melafalkan Q.S. Al-Falaq dengan benar",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.QH.1.4",
                        deskripsi: "Peserta didik mampu melafalkan Q.S. Al-Ikhlas dengan benar",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.QH.1.5",
                        deskripsi: "Peserta didik mampu menghafal Q.S. Al-Fatihah",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "A.QH.1.6",
                        deskripsi: "Peserta didik mampu menghafal Q.S. An-Nas, Al-Falaq, dan Al-Ikhlas",
                        alokasi_waktu: 8
                    },
                    {
                        kode: "A.QH.2.1",
                        deskripsi: "Peserta didik mampu melafalkan hadis tentang kasih sayang",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.QH.2.2",
                        deskripsi: "Peserta didik mampu memahami isi kandungan hadis tentang kasih sayang",
                        alokasi_waktu: 4
                    }
                ]
            },
            
            // Elemen 2: Akidah
            "AKIDAH": {
                nama: "Akidah",
                capaian_pembelajaran: "Peserta didik meyakini Allah Swt. sebagai Tuhan Yang Maha Esa, mengenal para malaikat, dan meyakini Nabi Muhammad saw. sebagai nabi dan rasul.",
                tujuan_pembelajaran: [
                    {
                        kode: "A.AK.1.1",
                        deskripsi: "Peserta didik mampu menyebutkan dua kalimat syahadat",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AK.1.2",
                        deskripsi: "Peserta didik mampu menjelaskan makna dua kalimat syahadat",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AK.1.3",
                        deskripsi: "Peserta didik mampu menyebutkan sifat-sifat Allah (Asmaul Husna)",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AK.1.4",
                        deskripsi: "Peserta didik mampu mengenal nama-nama malaikat dan tugasnya",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AK.1.5",
                        deskripsi: "Peserta didik mampu mengenal Nabi Muhammad saw. sebagai nabi terakhir",
                        alokasi_waktu: 4
                    }
                ]
            },
            
            // Elemen 3: Akhlak
            "AKHLAK": {
                nama: "Akhlak",
                capaian_pembelajaran: "Peserta didik mampu menerapkan akhlak terpuji dalam kehidupan sehari-hari seperti jujur, disiplin, tanggung jawab, dan hormat kepada orang tua serta guru.",
                tujuan_pembelajaran: [
                    {
                        kode: "A.AKH.1.1",
                        deskripsi: "Peserta didik mampu menerapkan perilaku jujur dalam kehidupan sehari-hari",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AKH.1.2",
                        deskripsi: "Peserta didik mampu menerapkan perilaku disiplin",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AKH.1.3",
                        deskripsi: "Peserta didik mampu menerapkan sikap hormat kepada orang tua",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AKH.1.4",
                        deskripsi: "Peserta didik mampu menerapkan sikap hormat kepada guru",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.AKH.1.5",
                        deskripsi: "Peserta didik mampu menerapkan sikap santun dalam berbicara",
                        alokasi_waktu: 4
                    }
                ]
            },
            
            // Elemen 4: Fikih
            "FIKIH": {
                nama: "Fikih",
                capaian_pembelajaran: "Peserta didik mampu mengenal dan mempraktikkan tata cara bersuci, salat fardu, dan doa sehari-hari.",
                tujuan_pembelajaran: [
                    {
                        kode: "A.FK.1.1",
                        deskripsi: "Peserta didik mampu mempraktikkan tata cara berwudu",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "A.FK.1.2",
                        deskripsi: "Peserta didik mampu mempraktikkan gerakan salat",
                        alokasi_waktu: 8
                    },
                    {
                        kode: "A.FK.1.3",
                        deskripsi: "Peserta didik mampu melafalkan bacaan salat",
                        alokasi_waktu: 8
                    },
                    {
                        kode: "A.FK.1.4",
                        deskripsi: "Peserta didik mampu melafalkan doa sebelum dan sesudah makan",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.FK.1.5",
                        deskripsi: "Peserta didik mampu melafalkan doa sebelum dan bangun tidur",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.FK.1.6",
                        deskripsi: "Peserta didik mampu melafalkan doa untuk orang tua",
                        alokasi_waktu: 4
                    }
                ]
            },
            
            // Elemen 5: Sejarah Peradaban Islam
            "SPI": {
                nama: "Sejarah Peradaban Islam",
                capaian_pembelajaran: "Peserta didik mampu mengenal kisah-kisah teladan para nabi dan rasul serta meneladani sikap dan perilakunya.",
                tujuan_pembelajaran: [
                    {
                        kode: "A.SPI.1.1",
                        deskripsi: "Peserta didik mampu menceritakan kisah Nabi Adam a.s.",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.SPI.1.2",
                        deskripsi: "Peserta didik mampu menceritakan kisah Nabi Nuh a.s.",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.SPI.1.3",
                        deskripsi: "Peserta didik mampu menceritakan kisah Nabi Ibrahim a.s.",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "A.SPI.1.4",
                        deskripsi: "Peserta didik mampu meneladani sifat-sifat terpuji para nabi",
                        alokasi_waktu: 4
                    }
                ]
            }
        }
    },
    
    // =====================================================
    // FASE B (KELAS 3-4)
    // =====================================================
    "FASE_B": {
        nama: "Fase B",
        kelas: ["3", "4"],
        elemen: {
            "AL_QURAN_HADIS": {
                nama: "Al-Qur'an dan Hadis",
                capaian_pembelajaran: "Peserta didik mampu membaca al-Qur'an dengan tartil, menghafal surah-surah pendek, dan memahami hadis-hadis tentang ibadah dan muamalah.",
                tujuan_pembelajaran: [
                    {
                        kode: "B.QH.1.1",
                        deskripsi: "Peserta didik mampu membaca Q.S. Al-Lahab dengan tartil",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.QH.1.2",
                        deskripsi: "Peserta didik mampu membaca Q.S. An-Nasr dengan tartil",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.QH.1.3",
                        deskripsi: "Peserta didik mampu membaca Q.S. Al-Kafirun dengan tartil",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.QH.1.4",
                        deskripsi: "Peserta didik mampu menghafal Q.S. Al-Lahab, An-Nasr, dan Al-Kafirun",
                        alokasi_waktu: 8
                    },
                    {
                        kode: "B.QH.2.1",
                        deskripsi: "Peserta didik mampu memahami hadis tentang kebersihan",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.QH.2.2",
                        deskripsi: "Peserta didik mampu memahami hadis tentang silaturahmi",
                        alokasi_waktu: 4
                    }
                ]
            },
            "AKIDAH": {
                nama: "Akidah",
                capaian_pembelajaran: "Peserta didik mampu mendalami iman kepada Allah dengan mengenal lebih banyak Asmaul Husna, iman kepada kitab-kitab Allah, dan iman kepada hari akhir.",
                tujuan_pembelajaran: [
                    {
                        kode: "B.AK.1.1",
                        deskripsi: "Peserta didik mampu menghafal 10 Asmaul Husna beserta artinya",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "B.AK.1.2",
                        deskripsi: "Peserta didik mampu menjelaskan iman kepada kitab-kitab Allah",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.AK.1.3",
                        deskripsi: "Peserta didik mampu menyebutkan nama-nama kitab Allah dan rasul penerimanya",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.AK.1.4",
                        deskripsi: "Peserta didik mampu menjelaskan iman kepada hari akhir",
                        alokasi_waktu: 4
                    }
                ]
            },
            "AKHLAK": {
                nama: "Akhlak",
                capaian_pembelajaran: "Peserta didik mampu menerapkan akhlak terpuji yang lebih kompleks seperti rendah hati, toleransi, dan peduli lingkungan.",
                tujuan_pembelajaran: [
                    {
                        kode: "B.AKH.1.1",
                        deskripsi: "Peserta didik mampu menerapkan sikap rendah hati",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.AKH.1.2",
                        deskripsi: "Peserta didik mampu menerapkan sikap toleransi",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.AKH.1.3",
                        deskripsi: "Peserta didik mampu menerapkan sikap peduli lingkungan",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.AKH.1.4",
                        deskripsi: "Peserta didik mampu menerapkan sikap saling menghormati",
                        alokasi_waktu: 4
                    }
                ]
            },
            "FIKIH": {
                nama: "Fikih",
                capaian_pembelajaran: "Peserta didik mampu mempraktikkan salat fardu berjamaah, salat Jumat, dan mengenal puasa Ramadan.",
                tujuan_pembelajaran: [
                    {
                        kode: "B.FK.1.1",
                        deskripsi: "Peserta didik mampu mempraktikkan salat berjamaah",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "B.FK.1.2",
                        deskripsi: "Peserta didik mampu menjelaskan tata cara salat Jumat",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.FK.1.3",
                        deskripsi: "Peserta didik mampu menjelaskan ketentuan puasa Ramadan",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.FK.1.4",
                        deskripsi: "Peserta didik mampu mempraktikkan puasa Ramadan",
                        alokasi_waktu: 4
                    }
                ]
            },
            "SPI": {
                nama: "Sejarah Peradaban Islam",
                capaian_pembelajaran: "Peserta didik mampu menceritakan kisah Nabi Muhammad saw. dan para sahabat serta meneladani perjuangan mereka.",
                tujuan_pembelajaran: [
                    {
                        kode: "B.SPI.1.1",
                        deskripsi: "Peserta didik mampu menceritakan masa kecil Nabi Muhammad saw.",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.SPI.1.2",
                        deskripsi: "Peserta didik mampu menceritakan kisah hijrah Nabi Muhammad saw.",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "B.SPI.1.3",
                        deskripsi: "Peserta didik mampu mengenal para sahabat Nabi",
                        alokasi_waktu: 4
                    }
                ]
            }
        }
    },
    
    // =====================================================
    // FASE C (KELAS 5-6)
    // =====================================================
    "FASE_C": {
        nama: "Fase C",
        kelas: ["5", "6"],
        elemen: {
            "AL_QURAN_HADIS": {
                nama: "Al-Qur'an dan Hadis",
                capaian_pembelajaran: "Peserta didik mampu membaca al-Qur'an dengan menerapkan tajwid, menghafal surah-surah pilihan, dan menganalisis kandungan hadis.",
                tujuan_pembelajaran: [
                    {
                        kode: "C.QH.1.1",
                        deskripsi: "Peserta didik mampu menerapkan hukum bacaan tajwid (nun mati/tanwin)",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "C.QH.1.2",
                        deskripsi: "Peserta didik mampu menerapkan hukum bacaan tajwid (mim mati)",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "C.QH.1.3",
                        deskripsi: "Peserta didik mampu membaca Q.S. Al-Ma'un dengan tartil",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.QH.1.4",
                        deskripsi: "Peserta didik mampu membaca Q.S. At-Tin dengan tartil",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.QH.1.5",
                        deskripsi: "Peserta didik mampu menghafal Q.S. Al-Ma'un dan At-Tin",
                        alokasi_waktu: 8
                    },
                    {
                        kode: "C.QH.2.1",
                        deskripsi: "Peserta didik mampu menganalisis kandungan hadis tentang menuntut ilmu",
                        alokasi_waktu: 4
                    }
                ]
            },
            "AKIDAH": {
                nama: "Akidah",
                capaian_pembelajaran: "Peserta didik mampu mendalami iman kepada qada dan qadar serta memahami hikmahnya dalam kehidupan.",
                tujuan_pembelajaran: [
                    {
                        kode: "C.AK.1.1",
                        deskripsi: "Peserta didik mampu menjelaskan pengertian qada dan qadar",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.AK.1.2",
                        deskripsi: "Peserta didik mampu menjelaskan hikmah beriman kepada qada dan qadar",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.AK.1.3",
                        deskripsi: "Peserta didik mampu menerapkan sikap tawakal",
                        alokasi_waktu: 4
                    }
                ]
            },
            "AKHLAK": {
                nama: "Akhlak",
                capaian_pembelajaran: "Peserta didik mampu menganalisis dan menerapkan akhlak dalam konteks sosial yang lebih luas.",
                tujuan_pembelajaran: [
                    {
                        kode: "C.AKH.1.1",
                        deskripsi: "Peserta didik mampu menganalisis pentingnya persatuan",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.AKH.1.2",
                        deskripsi: "Peserta didik mampu menerapkan sikap cinta tanah air",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.AKH.1.3",
                        deskripsi: "Peserta didik mampu menerapkan sikap peduli sosial",
                        alokasi_waktu: 4
                    }
                ]
            },
            "FIKIH": {
                nama: "Fikih",
                capaian_pembelajaran: "Peserta didik mampu memahami dan mempraktikkan zakat, infak, sedekah, dan haji.",
                tujuan_pembelajaran: [
                    {
                        kode: "C.FK.1.1",
                        deskripsi: "Peserta didik mampu menjelaskan ketentuan zakat fitrah",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.FK.1.2",
                        deskripsi: "Peserta didik mampu menjelaskan ketentuan zakat mal",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.FK.1.3",
                        deskripsi: "Peserta didik mampu membedakan infak dan sedekah",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.FK.1.4",
                        deskripsi: "Peserta didik mampu menjelaskan tata cara haji dan umrah",
                        alokasi_waktu: 6
                    }
                ]
            },
            "SPI": {
                nama: "Sejarah Peradaban Islam",
                capaian_pembelajaran: "Peserta didik mampu menganalisis perkembangan peradaban Islam dan kontribusinya bagi dunia.",
                tujuan_pembelajaran: [
                    {
                        kode: "C.SPI.1.1",
                        deskripsi: "Peserta didik mampu menganalisis perkembangan Islam di Indonesia",
                        alokasi_waktu: 6
                    },
                    {
                        kode: "C.SPI.1.2",
                        deskripsi: "Peserta didik mampu mengenal tokoh-tokoh penyebar Islam di Indonesia",
                        alokasi_waktu: 4
                    },
                    {
                        kode: "C.SPI.1.3",
                        deskripsi: "Peserta didik mampu menganalisis kontribusi peradaban Islam bagi dunia",
                        alokasi_waktu: 4
                    }
                ]
            }
        }
    }
};

// =====================================================
// FUNGSI HELPER UNTUK MENGAKSES DATA CP
// =====================================================

/**
 * Mendapatkan fase berdasarkan kelas
 * @param {string} kelas - Nomor kelas (1-6)
 * @returns {string} Kode fase (FASE_A, FASE_B, atau FASE_C)
 */
function getFaseByKelas(kelas) {
    const kelasNum = parseInt(kelas);
    if (kelasNum <= 2) return "FASE_A";
    if (kelasNum <= 4) return "FASE_B";
    return "FASE_C";
}

/**
 * Mendapatkan semua TP berdasarkan kelas
 * @param {string} kelas - Nomor kelas
 * @returns {Array} Daftar semua TP
 */
function getAllTPByKelas(kelas) {
    const fase = getFaseByKelas(kelas);
    const dataFase = MASTER_CP_PAI_2025[fase];
    
    let semuaTP = [];
    
    Object.keys(dataFase.elemen).forEach(elemenKey => {
        const elemen = dataFase.elemen[elemenKey];
        elemen.tujuan_pembelajaran.forEach(tp => {
            semuaTP.push({
                ...tp,
                elemen: elemen.nama,
                fase: dataFase.nama
            });
        });
    });
    
    return semuaTP;
}

/**
 * Mendapatkan TP berdasarkan elemen tertentu
 * @param {string} kelas - Nomor kelas
 * @param {string} elemenKey - Key elemen (AL_QURAN_HADIS, AKIDAH, dll)
 * @returns {Array} Daftar TP untuk elemen tersebut
 */
function getTPByElemen(kelas, elemenKey) {
    const fase = getFaseByKelas(kelas);
    const dataFase = MASTER_CP_PAI_2025[fase];
    
    if (dataFase.elemen[elemenKey]) {
        return dataFase.elemen[elemenKey].tujuan_pembelajaran;
    }
    
    return [];
}

/**
 * Mendapatkan total jam pelajaran untuk satu fase
 * @param {string} fase - Kode fase
 * @returns {number} Total JP
 */
function getTotalJPByFase(fase) {
    const dataFase = MASTER_CP_PAI_2025[fase];
    let totalJP = 0;
    
    Object.keys(dataFase.elemen).forEach(elemenKey => {
        const elemen = dataFase.elemen[elemenKey];
        elemen.tujuan_pembelajaran.forEach(tp => {
            totalJP += tp.alokasi_waktu;
        });
    });
    
    return totalJP;
}

// Export untuk digunakan di file lain (jika menggunakan module)
// export { MASTER_CP_PAI_2025, getFaseByKelas, getAllTPByKelas, getTPByElemen, getTotalJPByFase };