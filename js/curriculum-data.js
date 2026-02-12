// ============================================
// CURRICULUM DATA - CP PAI SD/MI
// Berdasarkan Kepka BSKAP No. 046/H/KR/2025
// Fase A (Kelas 1-2), Fase B (Kelas 3-4), Fase C (Kelas 5-6)
// ============================================

const CURRICULUM_DATA = {
    
    // === INFORMASI KURIKULUM ===
    info: {
        nama: "Kurikulum Merdeka",
        dasar: "Kepka BSKAP No. 046/H/KR/2025",
        mapel: "Pendidikan Agama Islam dan Budi Pekerti",
        jenjang: "SD/MI",
        tahunAjaran: "2024/2025"
    },
    
    // === 8 DIMENSI LULUSAN ===
    dimensiLulusan: [
        {
            id: "keimanan",
            kode: "D1",
            nama: "Keimanan dan Ketakwaan terhadap Tuhan YME",
            deskripsi: "Memiliki keyakinan teguh, akhlak mulia, dan menghayati nilai spiritual dalam kehidupan sehari-hari.",
            indikator: [
                "Menjalankan ibadah sesuai ajaran agama",
                "Menunjukkan akhlak mulia dalam perilaku sehari-hari",
                "Menghayati dan mengamalkan nilai-nilai spiritual",
                "Menghormati perbedaan agama dan kepercayaan",
                "Bersyukur atas nikmat Tuhan"
            ],
            icon: "🕌"
        },
        {
            id: "kewargaan",
            kode: "D2",
            nama: "Kewargaan",
            deskripsi: "Menjadi warga negara yang bertanggung jawab, cinta tanah air, taat norma, serta peduli terhadap lingkungan dan sosial.",
            indikator: [
                "Menunjukkan sikap cinta tanah air",
                "Menaati norma dan peraturan yang berlaku",
                "Berpartisipasi dalam kegiatan sosial kemasyarakatan",
                "Peduli terhadap kelestarian lingkungan",
                "Menghargai keberagaman budaya bangsa"
            ],
            icon: "🇮🇩"
        },
        {
            id: "penalaran-kritis",
            kode: "D3",
            nama: "Penalaran Kritis",
            deskripsi: "Kemampuan menganalisis informasi secara objektif, mengevaluasi argumen, dan memecahkan masalah.",
            indikator: [
                "Menganalisis informasi dari berbagai sumber",
                "Mengevaluasi argumen secara logis",
                "Membedakan fakta dan opini",
                "Memecahkan masalah dengan sistematis",
                "Mengambil keputusan berdasarkan pertimbangan matang"
            ],
            icon: "🧠"
        },
        {
            id: "kreativitas",
            kode: "D4",
            nama: "Kreativitas",
            deskripsi: "Menghasilkan gagasan orisinal, inovatif, dan mampu beradaptasi dengan perubahan.",
            indikator: [
                "Menghasilkan ide-ide baru dan orisinal",
                "Menciptakan karya inovatif",
                "Beradaptasi dengan situasi baru",
                "Mencari solusi alternatif",
                "Berani mencoba hal-hal baru"
            ],
            icon: "💡"
        },
        {
            id: "kolaborasi",
            kode: "D5",
            nama: "Kolaborasi",
            deskripsi: "Mampu bekerja sama, berinteraksi, dan berkontribusi secara efektif dalam berbagai situasi kelompok.",
            indikator: [
                "Bekerja sama dalam tim dengan baik",
                "Menghargai pendapat orang lain",
                "Berkontribusi aktif dalam kelompok",
                "Membangun hubungan positif dengan sesama",
                "Menyelesaikan konflik secara konstruktif"
            ],
            icon: "🤝"
        },
        {
            id: "kemandirian",
            kode: "D6",
            nama: "Kemandirian",
            deskripsi: "Bertanggung jawab atas proses dan hasil belajar, serta memiliki inisiatif.",
            indikator: [
                "Bertanggung jawab atas tugas dan kewajiban",
                "Memiliki inisiatif dalam belajar",
                "Mengatur waktu dengan baik",
                "Tidak bergantung pada orang lain",
                "Gigih dalam mencapai tujuan"
            ],
            icon: "🎯"
        },
        {
            id: "kesehatan",
            kode: "D7",
            nama: "Kesehatan",
            deskripsi: "Menjaga keseimbangan kesehatan fisik dan mental (well-being).",
            indikator: [
                "Menjaga kebersihan diri dan lingkungan",
                "Menerapkan pola hidup sehat",
                "Berolahraga secara teratur",
                "Mengelola stres dengan baik",
                "Menjaga kesehatan mental"
            ],
            icon: "💪"
        },
        {
            id: "komunikasi",
            kode: "D8",
            nama: "Komunikasi",
            deskripsi: "Mampu menyampaikan ide dan informasi dengan jelas, baik lisan maupun tulisan, serta melakukan refleksi diri.",
            indikator: [
                "Menyampaikan ide dengan jelas secara lisan",
                "Menulis dengan baik dan terstruktur",
                "Mendengarkan dengan aktif",
                "Melakukan refleksi diri",
                "Menerima dan memberikan umpan balik"
            ],
            icon: "💬"
        }
    ],
    
    // === FASE A (KELAS 1-2) ===
    faseA: {
        nama: "Fase A",
        kelas: ["1", "2"],
        deskripsi: "Fase A mencakup kelas 1 dan 2 SD/MI dengan fokus pada pengenalan dasar-dasar agama Islam",
        
        capaianPembelajaran: {
            // ELEMEN 1: AL-QUR'AN DAN HADIS
            alquranHadis: {
                id: "CP-A-01",
                elemen: "Al-Qur'an dan Hadis",
                deskripsi: "Peserta didik dapat membaca surah-surah pendek dan hadis pilihan dengan baik, menghafal, memahami pesan pokok, dan mengamalkannya dalam kehidupan sehari-hari.",
                dimensiTerkait: ["keimanan", "komunikasi"],
                capaian: [
                    {
                        kode: "CP-A-01-01",
                        teks: "Membaca surah-surah pendek dalam Al-Qur'an (Al-Fatihah, An-Nas, Al-Falaq, Al-Ikhlas) dengan baik dan benar",
                        indikator: [
                            "Melafalkan huruf hijaiyah dengan benar",
                            "Membaca surah Al-Fatihah dengan tartil",
                            "Membaca surah An-Nas dengan tartil",
                            "Membaca surah Al-Falaq dengan tartil",
                            "Membaca surah Al-Ikhlas dengan tartil"
                        ]
                    },
                    {
                        kode: "CP-A-01-02",
                        teks: "Menghafal surah-surah pendek (Al-Fatihah, An-Nas, Al-Falaq, Al-Ikhlas)",
                        indikator: [
                            "Menghafal surah Al-Fatihah dengan lancar",
                            "Menghafal surah An-Nas dengan lancar",
                            "Menghafal surah Al-Falaq dengan lancar",
                            "Menghafal surah Al-Ikhlas dengan lancar"
                        ]
                    },
                    {
                        kode: "CP-A-01-03",
                        teks: "Memahami pesan pokok surah-surah pendek secara sederhana",
                        indikator: [
                            "Menyebutkan pesan pokok surah Al-Fatihah",
                            "Menyebutkan pesan pokok surah An-Nas",
                            "Menyebutkan pesan pokok surah Al-Falaq",
                            "Menyebutkan pesan pokok surah Al-Ikhlas"
                        ]
                    },
                    {
                        kode: "CP-A-01-04",
                        teks: "Mengenal dan memahami hadis tentang kebersihan",
                        indikator: [
                            "Melafalkan hadis tentang kebersihan",
                            "Memahami arti hadis tentang kebersihan",
                            "Menerapkan hadis kebersihan dalam kehidupan"
                        ]
                    }
                ]
            },
            
            // ELEMEN 2: AKIDAH
            akidah: {
                id: "CP-A-02",
                elemen: "Akidah",
                deskripsi: "Peserta didik dapat mengenal rukun iman, meyakini keberadaan Allah melalui ciptaan-Nya, serta memahami kalimat syahadat.",
                dimensiTerkait: ["keimanan", "penalaran-kritis"],
                capaian: [
                    {
                        kode: "CP-A-02-01",
                        teks: "Mengenal rukun iman secara sederhana",
                        indikator: [
                            "Menyebutkan rukun iman yang enam",
                            "Memahami arti iman kepada Allah",
                            "Memahami arti iman kepada Malaikat",
                            "Memahami arti iman kepada Kitab",
                            "Memahami arti iman kepada Rasul",
                            "Memahami arti iman kepada Hari Akhir",
                            "Memahami arti iman kepada Qada dan Qadar"
                        ]
                    },
                    {
                        kode: "CP-A-02-02",
                        teks: "Meyakini keberadaan Allah melalui pengamatan terhadap ciptaan-Nya di sekitar",
                        indikator: [
                            "Mengamati ciptaan Allah di lingkungan sekitar",
                            "Menyebutkan contoh ciptaan Allah",
                            "Mengagumi kebesaran Allah melalui ciptaan-Nya"
                        ]
                    },
                    {
                        kode: "CP-A-02-03",
                        teks: "Memahami dan melafalkan dua kalimat syahadat dengan benar",
                        indikator: [
                            "Melafalkan syahadat tauhid dengan benar",
                            "Melafalkan syahadat rasul dengan benar",
                            "Memahami arti dua kalimat syahadat"
                        ]
                    }
                ]
            },
            
            // ELEMEN 3: AKHLAK
            akhlak: {
                id: "CP-A-03",
                elemen: "Akhlak",
                deskripsi: "Peserta didik dapat mengenal dan membiasakan akhlak terpuji seperti jujur, disiplin, tanggung jawab, santun, peduli, dan percaya diri.",
                dimensiTerkait: ["keimanan", "kewargaan", "kolaborasi", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-A-03-01",
                        teks: "Mengenal dan membiasakan sikap jujur dalam kehidupan sehari-hari",
                        indikator: [
                            "Memahami arti kejujuran",
                            "Menyebutkan contoh perilaku jujur",
                            "Membiasakan berkata jujur"
                        ]
                    },
                    {
                        kode: "CP-A-03-02",
                        teks: "Mengenal dan membiasakan sikap disiplin dan tanggung jawab",
                        indikator: [
                            "Memahami arti disiplin",
                            "Datang ke sekolah tepat waktu",
                            "Mengerjakan tugas dengan tanggung jawab"
                        ]
                    },
                    {
                        kode: "CP-A-03-03",
                        teks: "Mengenal dan membiasakan sikap santun dan peduli",
                        indikator: [
                            "Berbicara dengan sopan",
                            "Menghormati orang tua dan guru",
                            "Peduli terhadap sesama"
                        ]
                    },
                    {
                        kode: "CP-A-03-04",
                        teks: "Mengenal dan membiasakan sikap percaya diri",
                        indikator: [
                            "Berani tampil di depan kelas",
                            "Berani menyampaikan pendapat",
                            "Tidak malu bertanya"
                        ]
                    }
                ]
            },
            
            // ELEMEN 4: FIKIH
            fikih: {
                id: "CP-A-04",
                elemen: "Fikih",
                deskripsi: "Peserta didik dapat mengenal rukun Islam, tata cara bersuci, dan praktik salat dengan baik.",
                dimensiTerkait: ["keimanan", "kesehatan", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-A-04-01",
                        teks: "Mengenal rukun Islam",
                        indikator: [
                            "Menyebutkan rukun Islam yang lima",
                            "Memahami makna syahadat",
                            "Memahami kewajiban salat",
                            "Memahami kewajiban zakat",
                            "Memahami kewajiban puasa",
                            "Memahami kewajiban haji"
                        ]
                    },
                    {
                        kode: "CP-A-04-02",
                        teks: "Mengenal tata cara bersuci (taharah)",
                        indikator: [
                            "Memahami pengertian bersuci",
                            "Mempraktikkan cara berwudu",
                            "Memahami hal-hal yang membatalkan wudu"
                        ]
                    },
                    {
                        kode: "CP-A-04-03",
                        teks: "Mengenal dan mempraktikkan salat fardu",
                        indikator: [
                            "Menyebutkan nama-nama salat fardu",
                            "Mengenal waktu-waktu salat",
                            "Mempraktikkan gerakan salat",
                            "Melafalkan bacaan salat"
                        ]
                    }
                ]
            },
            
            // ELEMEN 5: SEJARAH PERADABAN ISLAM
            sejarah: {
                id: "CP-A-05",
                elemen: "Sejarah Peradaban Islam",
                deskripsi: "Peserta didik dapat mengenal kisah keteladanan Nabi Muhammad SAW.",
                dimensiTerkait: ["keimanan", "kewargaan", "komunikasi"],
                capaian: [
                    {
                        kode: "CP-A-05-01",
                        teks: "Mengenal kisah kelahiran dan masa kecil Nabi Muhammad SAW",
                        indikator: [
                            "Menceritakan kisah kelahiran Nabi Muhammad SAW",
                            "Menyebutkan nama orang tua Nabi Muhammad SAW",
                            "Menceritakan masa kecil Nabi Muhammad SAW"
                        ]
                    },
                    {
                        kode: "CP-A-05-02",
                        teks: "Mengenal sifat-sifat terpuji Nabi Muhammad SAW",
                        indikator: [
                            "Menyebutkan sifat sidiq Nabi Muhammad SAW",
                            "Menyebutkan sifat amanah Nabi Muhammad SAW",
                            "Menyebutkan sifat tabligh Nabi Muhammad SAW",
                            "Menyebutkan sifat fathanah Nabi Muhammad SAW"
                        ]
                    },
                    {
                        kode: "CP-A-05-03",
                        teks: "Meneladani sifat-sifat terpuji Nabi Muhammad SAW dalam kehidupan",
                        indikator: [
                            "Menerapkan sifat jujur seperti Nabi",
                            "Menerapkan sifat amanah seperti Nabi",
                            "Menerapkan sifat cerdas seperti Nabi"
                        ]
                    }
                ]
            }
        },
        
        // ALOKASI WAKTU FASE A
        alokasiWaktu: {
            jpPerMinggu: 4,
            mingguEfektif: {
                semester1: 18,
                semester2: 18
            },
            totalJPPerSemester: 72,
            totalJPPerTahun: 144
        }
    },
    
    // === FASE B (KELAS 3-4) ===
    faseB: {
        nama: "Fase B",
        kelas: ["3", "4"],
        deskripsi: "Fase B mencakup kelas 3 dan 4 SD/MI dengan pengembangan pemahaman dan praktik keagamaan",
        
        capaianPembelajaran: {
            // ELEMEN 1: AL-QUR'AN DAN HADIS
            alquranHadis: {
                id: "CP-B-01",
                elemen: "Al-Qur'an dan Hadis",
                deskripsi: "Peserta didik dapat membaca Al-Qur'an dengan tartil, menghafal surah-surah pendek dan ayat pilihan, memahami pesan pokok, serta mengamalkan kandungannya.",
                dimensiTerkait: ["keimanan", "komunikasi", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-B-01-01",
                        teks: "Membaca Al-Qur'an surah-surah pendek dan ayat pilihan dengan tartil",
                        indikator: [
                            "Membaca Q.S. Al-Lahab dengan tartil",
                            "Membaca Q.S. An-Nasr dengan tartil",
                            "Membaca Q.S. Al-Kafirun dengan tartil",
                            "Membaca Q.S. Al-Ma'un dengan tartil",
                            "Membaca Q.S. Al-Fil dengan tartil",
                            "Membaca Q.S. Al-'Asr dengan tartil"
                        ]
                    },
                    {
                        kode: "CP-B-01-02",
                        teks: "Menghafal surah-surah pendek dan ayat pilihan",
                        indikator: [
                            "Menghafal Q.S. Al-Lahab",
                            "Menghafal Q.S. An-Nasr",
                            "Menghafal Q.S. Al-Kafirun",
                            "Menghafal Q.S. Al-Ma'un",
                            "Menghafal Q.S. Al-Fil",
                            "Menghafal Q.S. Al-'Asr"
                        ]
                    },
                    {
                        kode: "CP-B-01-03",
                        teks: "Memahami pesan pokok surah/ayat yang dipelajari",
                        indikator: [
                            "Menjelaskan pesan pokok Q.S. Al-Lahab",
                            "Menjelaskan pesan pokok Q.S. An-Nasr",
                            "Menjelaskan pesan pokok Q.S. Al-Kafirun",
                            "Menjelaskan pesan pokok Q.S. Al-Ma'un",
                            "Menjelaskan pesan pokok Q.S. Al-Fil",
                            "Menjelaskan pesan pokok Q.S. Al-'Asr"
                        ]
                    },
                    {
                        kode: "CP-B-01-04",
                        teks: "Menghafal dan memahami hadis tentang silaturahmi dan menuntut ilmu",
                        indikator: [
                            "Melafalkan hadis tentang silaturahmi",
                            "Memahami kandungan hadis silaturahmi",
                            "Melafalkan hadis tentang menuntut ilmu",
                            "Memahami kandungan hadis menuntut ilmu"
                        ]
                    }
                ]
            },
            
            // ELEMEN 2: AKIDAH
            akidah: {
                id: "CP-B-02",
                elemen: "Akidah",
                deskripsi: "Peserta didik dapat memahami sifat-sifat Allah (Asmaul Husna), beriman kepada malaikat Allah, dan memahami konsep iman kepada kitab-kitab Allah.",
                dimensiTerkait: ["keimanan", "penalaran-kritis"],
                capaian: [
                    {
                        kode: "CP-B-02-01",
                        teks: "Mengenal dan memahami Asmaul Husna (Al-Alim, Al-Khabir, As-Sami', Al-Bashir)",
                        indikator: [
                            "Melafalkan Asmaul Husna dengan benar",
                            "Memahami arti Al-'Alim (Maha Mengetahui)",
                            "Memahami arti Al-Khabir (Maha Mengenal)",
                            "Memahami arti As-Sami' (Maha Mendengar)",
                            "Memahami arti Al-Bashir (Maha Melihat)"
                        ]
                    },
                    {
                        kode: "CP-B-02-02",
                        teks: "Beriman kepada malaikat Allah dan memahami tugas-tugasnya",
                        indikator: [
                            "Menyebutkan nama-nama malaikat",
                            "Menjelaskan tugas malaikat Jibril",
                            "Menjelaskan tugas malaikat Mikail",
                            "Menjelaskan tugas malaikat Israfil",
                            "Menjelaskan tugas malaikat Izrail"
                        ]
                    },
                    {
                        kode: "CP-B-02-03",
                        teks: "Beriman kepada kitab-kitab Allah",
                        indikator: [
                            "Menyebutkan nama-nama kitab Allah",
                            "Menjelaskan kitab yang diturunkan kepada Nabi Musa",
                            "Menjelaskan kitab yang diturunkan kepada Nabi Dawud",
                            "Menjelaskan kitab yang diturunkan kepada Nabi Isa",
                            "Menjelaskan Al-Qur'an sebagai kitab terakhir"
                        ]
                    }
                ]
            },
            
            // ELEMEN 3: AKHLAK
            akhlak: {
                id: "CP-B-03",
                elemen: "Akhlak",
                deskripsi: "Peserta didik dapat memahami dan mengamalkan akhlak terpuji serta menjauhi akhlak tercela dalam kehidupan sehari-hari.",
                dimensiTerkait: ["keimanan", "kewargaan", "kolaborasi", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-B-03-01",
                        teks: "Memahami dan membiasakan rendah hati, hemat, dan gemar membaca",
                        indikator: [
                            "Memahami arti rendah hati",
                            "Menerapkan sikap rendah hati",
                            "Memahami pentingnya hemat",
                            "Gemar membaca Al-Qur'an dan buku"
                        ]
                    },
                    {
                        kode: "CP-B-03-02",
                        teks: "Memahami dan menghindari sifat sombong, kikir, dan malas",
                        indikator: [
                            "Memahami bahaya sifat sombong",
                            "Menghindari sikap kikir",
                            "Menghindari sikap malas"
                        ]
                    },
                    {
                        kode: "CP-B-03-03",
                        teks: "Memahami dan menerapkan adab kepada orang tua dan guru",
                        indikator: [
                            "Menghormati kedua orang tua",
                            "Berbakti kepada orang tua",
                            "Menghormati guru",
                            "Menghargai ilmu yang diajarkan guru"
                        ]
                    }
                ]
            },
            
            // ELEMEN 4: FIKIH
            fikih: {
                id: "CP-B-04",
                elemen: "Fikih",
                deskripsi: "Peserta didik dapat memahami dan mempraktikkan salat dengan baik, memahami zikir dan doa, serta mengenal puasa.",
                dimensiTerkait: ["keimanan", "kesehatan", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-B-04-01",
                        teks: "Memahami dan mempraktikkan salat fardu secara sempurna",
                        indikator: [
                            "Menjelaskan syarat sah salat",
                            "Menjelaskan rukun salat",
                            "Mempraktikkan salat dengan sempurna",
                            "Melafalkan bacaan salat dengan benar"
                        ]
                    },
                    {
                        kode: "CP-B-04-02",
                        teks: "Memahami dan mempraktikkan zikir dan doa setelah salat",
                        indikator: [
                            "Melafalkan zikir setelah salat",
                            "Melafalkan doa setelah salat",
                            "Memahami makna zikir dan doa"
                        ]
                    },
                    {
                        kode: "CP-B-04-03",
                        teks: "Mengenal ibadah puasa Ramadan",
                        indikator: [
                            "Memahami pengertian puasa",
                            "Memahami syarat wajib puasa",
                            "Memahami hal yang membatalkan puasa",
                            "Memahami hikmah puasa"
                        ]
                    },
                    {
                        kode: "CP-B-04-04",
                        teks: "Mengenal salat Jumat dan salat sunah",
                        indikator: [
                            "Memahami hukum salat Jumat",
                            "Menjelaskan tata cara salat Jumat",
                            "Mengenal macam-macam salat sunah"
                        ]
                    }
                ]
            },
            
            // ELEMEN 5: SEJARAH PERADABAN ISLAM
            sejarah: {
                id: "CP-B-05",
                elemen: "Sejarah Peradaban Islam",
                deskripsi: "Peserta didik dapat mengenal kisah Nabi dan Rasul serta meneladani sifat-sifat mulia mereka.",
                dimensiTerkait: ["keimanan", "kewargaan", "komunikasi"],
                capaian: [
                    {
                        kode: "CP-B-05-01",
                        teks: "Mengenal kisah Nabi Ibrahim AS dan Nabi Ismail AS",
                        indikator: [
                            "Menceritakan kisah Nabi Ibrahim AS",
                            "Menceritakan kisah Nabi Ismail AS",
                            "Meneladani ketaatan Nabi Ibrahim dan Ismail"
                        ]
                    },
                    {
                        kode: "CP-B-05-02",
                        teks: "Mengenal kisah Nabi Musa AS dan Nabi Isa AS",
                        indikator: [
                            "Menceritakan kisah Nabi Musa AS",
                            "Menceritakan kisah Nabi Isa AS",
                            "Meneladani kesabaran para Nabi"
                        ]
                    },
                    {
                        kode: "CP-B-05-03",
                        teks: "Mengenal kisah perjuangan dakwah Nabi Muhammad SAW",
                        indikator: [
                            "Menceritakan dakwah Nabi Muhammad SAW di Mekah",
                            "Menceritakan hijrah ke Madinah",
                            "Meneladani perjuangan Nabi Muhammad SAW"
                        ]
                    }
                ]
            }
        },
        
        // ALOKASI WAKTU FASE B
        alokasiWaktu: {
            jpPerMinggu: 4,
            mingguEfektif: {
                semester1: 18,
                semester2: 18
            },
            totalJPPerSemester: 72,
            totalJPPerTahun: 144
        }
    },
    
    // === FASE C (KELAS 5-6) ===
    faseC: {
        nama: "Fase C",
        kelas: ["5", "6"],
        deskripsi: "Fase C mencakup kelas 5 dan 6 SD/MI dengan pendalaman dan pemahaman komprehensif ajaran Islam",
        
        capaianPembelajaran: {
            // ELEMEN 1: AL-QUR'AN DAN HADIS
            alquranHadis: {
                id: "CP-C-01",
                elemen: "Al-Qur'an dan Hadis",
                deskripsi: "Peserta didik dapat membaca Al-Qur'an dengan tartil dan fasih, menghafal surah dan ayat pilihan, memahami kandungan, dan mengamalkannya.",
                dimensiTerkait: ["keimanan", "komunikasi", "penalaran-kritis"],
                capaian: [
                    {
                        kode: "CP-C-01-01",
                        teks: "Membaca Al-Qur'an dengan tartil dan memahami hukum tajwid dasar",
                        indikator: [
                            "Membaca Q.S. At-Tin dengan tartil",
                            "Membaca Q.S. Al-Insyirah dengan tartil",
                            "Membaca Q.S. Ad-Duha dengan tartil",
                            "Membaca Q.S. Al-Lail dengan tartil",
                            "Memahami hukum nun sukun dan tanwin",
                            "Memahami hukum mim sukun"
                        ]
                    },
                    {
                        kode: "CP-C-01-02",
                        teks: "Menghafal surah-surah pendek dan ayat pilihan",
                        indikator: [
                            "Menghafal Q.S. At-Tin",
                            "Menghafal Q.S. Al-Insyirah",
                            "Menghafal Q.S. Ad-Duha",
                            "Menghafal Q.S. Al-Lail",
                            "Menghafal Q.S. Al-'Alaq ayat 1-5"
                        ]
                    },
                    {
                        kode: "CP-C-01-03",
                        teks: "Memahami kandungan dan pesan surah/ayat yang dipelajari",
                        indikator: [
                            "Menjelaskan kandungan Q.S. At-Tin",
                            "Menjelaskan kandungan Q.S. Al-Insyirah",
                            "Menjelaskan kandungan Q.S. Ad-Duha",
                            "Menjelaskan pesan Q.S. Al-'Alaq tentang perintah membaca"
                        ]
                    },
                    {
                        kode: "CP-C-01-04",
                        teks: "Memahami dan mengamalkan hadis tentang takwa, persaudaraan, dan tolong-menolong",
                        indikator: [
                            "Melafalkan hadis tentang takwa",
                            "Memahami kandungan hadis tentang takwa",
                            "Melafalkan hadis tentang persaudaraan",
                            "Menerapkan sikap tolong-menolong"
                        ]
                    }
                ]
            },
            
            // ELEMEN 2: AKIDAH
            akidah: {
                id: "CP-C-02",
                elemen: "Akidah",
                deskripsi: "Peserta didik dapat memahami dan mengimani hari akhir, qada dan qadar, serta mengenal lebih dalam Asmaul Husna.",
                dimensiTerkait: ["keimanan", "penalaran-kritis", "kemandirian"],
                capaian: [
                    {
                        kode: "CP-C-02-01",
                        teks: "Mengenal dan memahami Asmaul Husna (Al-Mumit, Al-Hayy, Al-Qayyum, Al-Ahad)",
                        indikator: [
                            "Melafalkan dan memahami Al-Mumit",
                            "Melafalkan dan memahami Al-Hayy",
                            "Melafalkan dan memahami Al-Qayyum",
                            "Melafalkan dan memahami Al-Ahad",
                            "Menerapkan nilai Asmaul Husna dalam kehidupan"
                        ]
                    },
                    {
                        kode: "CP-C-02-02",
                        teks: "Beriman kepada hari akhir",
                        indikator: [
                            "Memahami pengertian hari akhir",
                            "Menyebutkan tanda-tanda hari akhir",
                            "Memahami kehidupan setelah mati",
                            "Memahami hikmah beriman kepada hari akhir"
                        ]
                    },
                    {
                        kode: "CP-C-02-03",
                        teks: "Beriman kepada qada dan qadar Allah SWT",
                        indikator: [
                            "Memahami pengertian qada dan qadar",
                            "Membedakan qada dan qadar",
                            "Menyikapi qada dan qadar dengan benar",
                            "Menerapkan sikap tawakal"
                        ]
                    }
                ]
            },
            
            // ELEMEN 3: AKHLAK
            akhlak: {
                id: "CP-C-03",
                elemen: "Akhlak",
                deskripsi: "Peserta didik dapat memahami dan mengamalkan akhlak terpuji dalam berbagai aspek kehidupan serta menjauhi akhlak tercela.",
                dimensiTerkait: ["keimanan", "kewargaan", "kolaborasi", "kesehatan"],
                capaian: [
                    {
                        kode: "CP-C-03-01",
                        teks: "Memahami dan membiasakan sikap sabar, syukur, dan tawakal",
                        indikator: [
                            "Memahami hakikat sabar",
                            "Menerapkan sikap sabar menghadapi cobaan",
                            "Memahami hakikat syukur",
                            "Membiasakan bersyukur atas nikmat Allah",
                            "Memahami dan menerapkan tawakal"
                        ]
                    },
                    {
                        kode: "CP-C-03-02",
                        teks: "Memahami dan menghindari sifat hasad, dendam, dan riya",
                        indikator: [
                            "Memahami bahaya sifat hasad",
                            "Menghindari sikap dendam",
                            "Memahami bahaya riya",
                            "Mengamalkan keikhlasan"
                        ]
                    },
                    {
                        kode: "CP-C-03-03",
                        teks: "Memahami adab kepada lingkungan dan masyarakat",
                        indikator: [
                            "Menjaga kelestarian lingkungan",
                            "Menghormati tetangga",
                            "Bergaul dengan baik di masyarakat",
                            "Menghargai perbedaan"
                        ]
                    }
                ]
            },
            
            // ELEMEN 4: FIKIH
            fikih: {
                id: "CP-C-04",
                elemen: "Fikih",
                deskripsi: "Peserta didik dapat memahami dan mempraktikkan berbagai jenis ibadah dengan baik dan benar.",
                dimensiTerkait: ["keimanan", "kesehatan", "kemandirian", "kewargaan"],
                capaian: [
                    {
                        kode: "CP-C-04-01",
                        teks: "Memahami dan mempraktikkan puasa Ramadan dengan sempurna",
                        indikator: [
                            "Memahami rukun puasa",
                            "Memahami sunah puasa",
                            "Melaksanakan puasa Ramadan",
                            "Memahami hikmah puasa"
                        ]
                    },
                    {
                        kode: "CP-C-04-02",
                        teks: "Mengenal zakat fitrah dan zakat mal",
                        indikator: [
                            "Memahami pengertian zakat fitrah",
                            "Memahami ketentuan zakat fitrah",
                            "Memahami pengertian zakat mal",
                            "Memahami hikmah zakat"
                        ]
                    },
                    {
                        kode: "CP-C-04-03",
                        teks: "Mengenal ibadah haji dan umrah",
                        indikator: [
                            "Memahami pengertian haji dan umrah",
                            "Menyebutkan rukun haji",
                            "Menyebutkan wajib haji",
                            "Memahami hikmah haji"
                        ]
                    },
                    {
                        kode: "CP-C-04-04",
                        teks: "Memahami makanan dan minuman halal-haram",
                        indikator: [
                            "Membedakan makanan halal dan haram",
                            "Membedakan minuman halal dan haram",
                            "Memahami kriteria halal-haram",
                            "Membiasakan mengonsumsi yang halal"
                        ]
                    }
                ]
            },
            
            // ELEMEN 5: SEJARAH PERADABAN ISLAM
            sejarah: {
                id: "CP-C-05",
                elemen: "Sejarah Peradaban Islam",
                deskripsi: "Peserta didik dapat mengenal sejarah perkembangan Islam dan meneladani tokoh-tokoh Islam.",
                dimensiTerkait: ["keimanan", "kewargaan", "kreativitas", "komunikasi"],
                capaian: [
                    {
                        kode: "CP-C-05-01",
                        teks: "Mengenal Khulafaur Rasyidin",
                        indikator: [
                            "Menceritakan kisah Abu Bakar Ash-Shiddiq",
                            "Menceritakan kisah Umar bin Khattab",
                            "Menceritakan kisah Utsman bin Affan",
                            "Menceritakan kisah Ali bin Abi Thalib",
                            "Meneladani kepemimpinan Khulafaur Rasyidin"
                        ]
                    },
                    {
                        kode: "CP-C-05-02",
                        teks: "Mengenal perkembangan Islam di Nusantara",
                        indikator: [
                            "Menjelaskan masuknya Islam ke Nusantara",
                            "Menyebutkan kerajaan Islam di Nusantara",
                            "Mengenal Wali Songo",
                            "Menghargai jasa penyebar Islam di Nusantara"
                        ]
                    },
                    {
                        kode: "CP-C-05-03",
                        teks: "Mengenal tokoh-tokoh ilmuwan Muslim",
                        indikator: [
                            "Mengenal Ibnu Sina (kedokteran)",
                            "Mengenal Al-Khawarizmi (matematika)",
                            "Mengenal Ibnu Battuta (penjelajah)",
                            "Meneladani semangat keilmuan tokoh Muslim"
                        ]
                    }
                ]
            }
        },
        
        // ALOKASI WAKTU FASE C
        alokasiWaktu: {
            jpPerMinggu: 4,
            mingguEfektif: {
                semester1: 18,
                semester2: 18
            },
            totalJPPerSemester: 72,
            totalJPPerTahun: 144
        }
    },
    
    // === METODE PEMBELAJARAN ===
    metodePembelajaran: [
        { id: "ceramah", nama: "Ceramah Interaktif", deskripsi: "Penyampaian materi dengan interaksi" },
        { id: "diskusi", nama: "Diskusi Kelompok", deskripsi: "Pembelajaran melalui diskusi" },
        { id: "demonstrasi", nama: "Demonstrasi", deskripsi: "Peragaan langsung" },
        { id: "praktik", nama: "Praktik Langsung", deskripsi: "Peserta didik mempraktikkan" },
        { id: "hafalan", nama: "Hafalan/Tahfidz", deskripsi: "Menghafal ayat/surah/hadis" },
        { id: "kisah", nama: "Metode Kisah", deskripsi: "Pembelajaran melalui cerita" },
        { id: "keteladanan", nama: "Keteladanan", deskripsi: "Memberikan contoh langsung" },
        { id: "pembiasaan", nama: "Pembiasaan", deskripsi: "Membiasakan perilaku baik" },
        { id: "problem-based", nama: "Problem Based Learning", deskripsi: "Pembelajaran berbasis masalah" },
        { id: "project-based", nama: "Project Based Learning", deskripsi: "Pembelajaran berbasis proyek" },
        { id: "inquiry", nama: "Inquiry/Discovery", deskripsi: "Pembelajaran penemuan" },
        { id: "cooperative", nama: "Cooperative Learning", deskripsi: "Pembelajaran kooperatif" }
    ],
    
    // === MEDIA PEMBELAJARAN ===
    mediaPembelajaran: [
        { id: "alquran", nama: "Al-Qur'an dan Terjemah", kategori: "Sumber Belajar" },
        { id: "buku-paket", nama: "Buku Paket PAI", kategori: "Sumber Belajar" },
        { id: "poster", nama: "Poster/Gambar", kategori: "Visual" },
        { id: "video", nama: "Video Pembelajaran", kategori: "Audio Visual" },
        { id: "audio", nama: "Audio (Murottal)", kategori: "Audio" },
        { id: "kartu", nama: "Kartu/Flash Card", kategori: "Permainan" },
        { id: "powerpoint", nama: "Presentasi PowerPoint", kategori: "Digital" },
        { id: "lcd", nama: "LCD Proyektor", kategori: "Alat" },
        { id: "laptop", nama: "Laptop/Komputer", kategori: "Digital" },
        { id: "papan-tulis", nama: "Papan Tulis", kategori: "Alat" },
        { id: "alat-peraga", nama: "Alat Peraga Ibadah", kategori: "Alat" },
        { id: "worksheet", nama: "Lembar Kerja (LKPD)", kategori: "Sumber Belajar" }
    ],
    
    // === BENTUK ASESMEN ===
    bentukAsesmen: [
        { id: "tes-tulis", nama: "Tes Tertulis", jenis: "Tes", deskripsi: "Penilaian melalui soal tertulis" },
        { id: "tes-lisan", nama: "Tes Lisan", jenis: "Tes", deskripsi: "Penilaian melalui tanya jawab" },
        { id: "praktik", nama: "Tes Praktik", jenis: "Tes", deskripsi: "Penilaian keterampilan praktik" },
        { id: "hafalan", nama: "Tes Hafalan", jenis: "Tes", deskripsi: "Penilaian hafalan ayat/surah" },
        { id: "observasi", nama: "Observasi", jenis: "Non-Tes", deskripsi: "Pengamatan sikap dan perilaku" },
        { id: "portofolio", nama: "Portofolio", jenis: "Non-Tes", deskripsi: "Kumpulan karya peserta didik" },
        { id: "proyek", nama: "Proyek", jenis: "Non-Tes", deskripsi: "Penilaian berbasis proyek" },
        { id: "produk", nama: "Produk", jenis: "Non-Tes", deskripsi: "Penilaian hasil karya" },
        { id: "jurnal", nama: "Jurnal", jenis: "Non-Tes", deskripsi: "Catatan perkembangan" },
        { id: "penilaian-diri", nama: "Penilaian Diri", jenis: "Non-Tes", deskripsi: "Self assessment" },
        { id: "penilaian-teman", nama: "Penilaian Teman Sejawat", jenis: "Non-Tes", deskripsi: "Peer assessment" }
    ],
    
    // === TEMPLATE SURAH DAN AYAT ===
    surahPendek: [
        { nomor: 1, nama: "Al-Fatihah", namaArab: "الفاتحة", ayat: 7, fase: "A" },
        { nomor: 112, nama: "Al-Ikhlas", namaArab: "الإخلاص", ayat: 4, fase: "A" },
        { nomor: 113, nama: "Al-Falaq", namaArab: "الفلق", ayat: 5, fase: "A" },
        { nomor: 114, nama: "An-Nas", namaArab: "الناس", ayat: 6, fase: "A" },
        { nomor: 103, nama: "Al-'Asr", namaArab: "العصر", ayat: 3, fase: "B" },
        { nomor: 105, nama: "Al-Fil", namaArab: "الفيل", ayat: 5, fase: "B" },
        { nomor: 107, nama: "Al-Ma'un", namaArab: "الماعون", ayat: 7, fase: "B" },
        { nomor: 109, nama: "Al-Kafirun", namaArab: "الكافرون", ayat: 6, fase: "B" },
        { nomor: 110, nama: "An-Nasr", namaArab: "النصر", ayat: 3, fase: "B" },
        { nomor: 111, nama: "Al-Lahab", namaArab: "اللهب", ayat: 5, fase: "B" },
        { nomor: 92, nama: "Al-Lail", namaArab: "الليل", ayat: 21, fase: "C" },
        { nomor: 93, nama: "Ad-Duha", namaArab: "الضحى", ayat: 11, fase: "C" },
        { nomor: 94, nama: "Al-Insyirah", namaArab: "الإنشراح", ayat: 8, fase: "C" },
        { nomor: 95, nama: "At-Tin", namaArab: "التين", ayat: 8, fase: "C" },
        { nomor: 96, nama: "Al-'Alaq", namaArab: "العلق", ayat: 19, fase: "C" }
    ],
    
    // === HADIS PILIHAN ===
    hadisPilihan: [
        {
            id: "hadis-kebersihan",
            judul: "Hadis Kebersihan",
            arab: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
            latin: "Ath-thuhuuru syathrul iimaan",
            arti: "Kebersihan adalah sebagian dari iman",
            riwayat: "HR. Muslim",
            fase: "A",
            dimensiTerkait: ["keimanan", "kesehatan"]
        },
        {
            id: "hadis-silaturahmi",
            judul: "Hadis Silaturahmi",
            arab: "مَنْ أَحَبَّ أَنْ يُبْسَطَ لَهُ فِي رِزْقِهِ وَيُنْسَأَ لَهُ فِي أَثَرِهِ فَلْيَصِلْ رَحِمَهُ",
            latin: "Man ahabba an yubsatha lahu fi rizqihi wa yunsa'a lahu fi atsarihi falyashil rahimahu",
            arti: "Barangsiapa yang ingin dilapangkan rezekinya dan dipanjangkan umurnya, maka hendaklah ia menyambung silaturahmi",
            riwayat: "HR. Bukhari",
            fase: "B",
            dimensiTerkait: ["keimanan", "kolaborasi", "kewargaan"]
        },
        {
            id: "hadis-menuntut-ilmu",
            judul: "Hadis Menuntut Ilmu",
            arab: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
            latin: "Thalabul 'ilmi fariidhatun 'ala kulli muslim",
            arti: "Menuntut ilmu adalah kewajiban bagi setiap Muslim",
            riwayat: "HR. Ibnu Majah",
            fase: "B",
            dimensiTerkait: ["keimanan", "kemandirian", "penalaran-kritis"]
        },
        {
            id: "hadis-takwa",
            judul: "Hadis Takwa",
            arab: "اتَّقِ اللهَ حَيْثُمَا كُنْتَ",
            latin: "Ittaqillaha haitsu ma kunta",
            arti: "Bertakwalah kepada Allah di mana pun kamu berada",
            riwayat: "HR. Tirmidzi",
            fase: "C",
            dimensiTerkait: ["keimanan", "kemandirian"]
        },
        {
            id: "hadis-persaudaraan",
            judul: "Hadis Persaudaraan",
            arab: "الْمُسْلِمُ أَخُو الْمُسْلِمِ",
            latin: "Al-muslimu akhul muslim",
            arti: "Seorang Muslim adalah saudara bagi Muslim lainnya",
            riwayat: "HR. Bukhari Muslim",
            fase: "C",
            dimensiTerkait: ["keimanan", "kolaborasi", "kewargaan"]
        }
    ]
};

// === HELPER FUNCTIONS ===

/**
 * Get semua dimensi lulusan
 */
function getDimensiLulusan() {
    return CURRICULUM_DATA.dimensiLulusan;
}

/**
 * Get dimensi lulusan by ID
 */
function getDimensiById(id) {
    return CURRICULUM_DATA.dimensiLulusan.find(d => d.id === id);
}

/**
 * Get CP by Fase
 */
function getCPByFase(fase) {
    const faseKey = `fase${fase.toUpperCase()}`;
    return CURRICULUM_DATA[faseKey] || null;
}

/**
 * Get CP by Kelas
 */
function getCPByKelas(kelas) {
    const kelasNum = parseInt(kelas);
    if (kelasNum >= 1 && kelasNum <= 2) return CURRICULUM_DATA.faseA;
    if (kelasNum >= 3 && kelasNum <= 4) return CURRICULUM_DATA.faseB;
    if (kelasNum >= 5 && kelasNum <= 6) return CURRICULUM_DATA.faseC;
    return null;
}

/**
 * Get Fase by Kelas
 */
function getFaseByKelas(kelas) {
    const kelasNum = parseInt(kelas);
    if (kelasNum >= 1 && kelasNum <= 2) return 'A';
    if (kelasNum >= 3 && kelasNum <= 4) return 'B';
    if (kelasNum >= 5 && kelasNum <= 6) return 'C';
    return null;
}

/**
 * Get Elemen CP
 */
function getElemenCP(fase, elemen) {
    const cp = getCPByFase(fase);
    if (!cp || !cp.capaianPembelajaran) return null;
    return cp.capaianPembelajaran[elemen] || null;
}

/**
 * Get all surah by Fase
 */
function getSurahByFase(fase) {
    return CURRICULUM_DATA.surahPendek.filter(s => s.fase === fase.toUpperCase());
}

/**
 * Get all hadis by Fase
 */
function getHadisByFase(fase) {
    return CURRICULUM_DATA.hadisPilihan.filter(h => h.fase === fase.toUpperCase());
}

/**
 * Get semua elemen untuk dropdown
 */
function getAllElemen() {
    return [
        { id: "alquranHadis", nama: "Al-Qur'an dan Hadis" },
        { id: "akidah", nama: "Akidah" },
        { id: "akhlak", nama: "Akhlak" },
        { id: "fikih", nama: "Fikih" },
        { id: "sejarah", nama: "Sejarah Peradaban Islam" }
    ];
}

/**
 * Get dimensi terkait dari CP
 */
function getDimensiTerkaitCP(fase, elemen) {
    const cp = getElemenCP(fase, elemen);
    if (!cp || !cp.dimensiTerkait) return [];
    
    return cp.dimensiTerkait.map(id => getDimensiById(id)).filter(Boolean);
}

console.log('✅ Curriculum Data (8 Dimensi Lulusan) loaded successfully');
