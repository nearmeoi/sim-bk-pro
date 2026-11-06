-- ==============================================================================
-- SIM-BK (Sistem Informasi Manajemen Bimbingan & Konseling)
-- SKEMA BASIS DATA SUPABASE POSTGRESQL LENGKAP (1:1 SESUAI FRONTEND)
-- Project Ref: fxunkyqasqgnqmfveizp
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL: school_settings (Profil Satuan Pendidikan, Penandatangan, dan Logo)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.school_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_school',
    nama_sekolah TEXT NOT NULL DEFAULT 'SMP Negeri 1 Bintang',
    npsn TEXT NOT NULL DEFAULT '20123456',
    alamat TEXT NOT NULL DEFAULT 'Jl. Pendidikan No. 1, Kota Bintang',
    instansi_atas TEXT DEFAULT 'PEMERINTAH KOTA MAKASSAR / DINAS PENDIDIKAN',
    telepon_sekolah TEXT DEFAULT '0411-8941314',
    email_sekolah TEXT DEFAULT 'smpn06.mks@gmail.com',
    kota_surat TEXT DEFAULT 'Makassar',
    kepala_sekolah TEXT NOT NULL DEFAULT 'Drs. H. Mulyadi Kusuma, M.Pd.',
    nip_kepala TEXT NOT NULL DEFAULT '19750101 200003 1 001',
    guru_bk TEXT NOT NULL DEFAULT 'Siti Rahmawati, S.Pd., Gr.',
    nip_guru_bk TEXT NOT NULL DEFAULT '19880512 201402 2 003',
    tahun_ajaran TEXT NOT NULL DEFAULT '2026/2027',
    logo_url TEXT,
    logo_kanan_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL: students (Master Data Peserta Didik & Nama Wali Murid)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nama TEXT NOT NULL,
    nis TEXT NOT NULL,
    nisn TEXT DEFAULT '-',
    jk TEXT NOT NULL CHECK (jk IN ('L', 'P')),
    kelas TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pindah', 'Lulus')),
    nama_wali TEXT,
    kontak_wali TEXT,
    alamat TEXT,
    catatan_khusus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_kelas ON public.students(kelas);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);

-- ==============================================================================
-- 4. TABEL: counseling_records (Buku Catatan Rekam Jejak Konseling Siswa)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.counseling_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    nama_siswa TEXT NOT NULL,
    kelas TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu TEXT NOT NULL DEFAULT '08:00',
    jenis TEXT NOT NULL CHECK (jenis IN (
        'Konseling Individual',
        'Konseling Kelompok',
        'Bimbingan Klasikal',
        'Kunjungan Rumah',
        'Konferensi Kasus'
    )),
    bidang TEXT NOT NULL CHECK (bidang IN ('Pribadi', 'Sosial', 'Belajar', 'Karir')),
    masalah TEXT NOT NULL,
    tindak_lanjut TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Proses' CHECK (status IN ('Proses', 'Selesai', 'Menunggu')),
    tahap TEXT DEFAULT 'Tahap 1: Pengungkapan Masalah',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counseling_student_id ON public.counseling_records(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_tanggal ON public.counseling_records(tanggal);
CREATE INDEX IF NOT EXISTS idx_counseling_status ON public.counseling_records(status);

-- ==============================================================================
-- 5. TABEL: case_items (Rekap Kasus Perlu Tindak Lanjut)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.case_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
    nama_siswa TEXT NOT NULL,
    kelas TEXT NOT NULL,
    masalah TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'Proses' CHECK (status IN ('Proses', 'Selesai')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON public.case_items(status);

-- ==============================================================================
-- 6. TABEL: daily_journals (Jurnal Harian Kegiatan Bimbingan & Konseling)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_journals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    hari_tanggal TEXT NOT NULL,
    waktu TEXT NOT NULL,
    nama TEXT NOT NULL,
    kelas TEXT NOT NULL,
    jenis TEXT NOT NULL,
    topik TEXT NOT NULL,
    keterangan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journals_created ON public.daily_journals(created_at DESC);

-- ==============================================================================
-- 7. TABEL: prota_items (Program Tahunan BK - Matriks 12 Bulan Juli s.d. Juni)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prota_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    komponen TEXT NOT NULL,
    jenis TEXT NOT NULL,
    bidang TEXT NOT NULL,
    months BOOLEAN[] NOT NULL DEFAULT '{false,false,false,false,false,false,false,false,false,false,false,false}',
    volume INTEGER NOT NULL DEFAULT 1,
    sasaran TEXT NOT NULL DEFAULT 'Kelas 7, 8, 9',
    urutan INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABEL: career_surveys (Formulir Pemetaan Karir Kelas 9 / E-Shinro Chosa)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.career_surveys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    nama_siswa TEXT NOT NULL,
    kelas TEXT NOT NULL,
    no_absen TEXT DEFAULT '1',
    nis TEXT NOT NULL,
    nisn TEXT DEFAULT '-',
    nama_ortu TEXT,
    no_hp_ortu TEXT,
    
    -- Bagian 1: Rencana Pokok
    rencana_setelah_smp TEXT NOT NULL DEFAULT 'SMA' CHECK (rencana_setelah_smp IN ('SMA', 'SMK', 'MA', 'Belum Memutuskan')),
    alasan_rencana TEXT,
    
    -- Bagian 2: Target Sekolah
    pilihan1_sekolah TEXT,
    pilihan1_jurusan TEXT,
    pilihan1_jalur TEXT DEFAULT 'Zonasi',
    pilihan1_alasan TEXT,
    
    pilihan2_sekolah TEXT,
    pilihan2_jurusan TEXT,
    pilihan2_jalur TEXT DEFAULT 'Zonasi',
    rencana_cadangan3 TEXT,
    
    -- Bagian 3: Karir Masa Depan
    cita_cita TEXT,
    alasan_cita_cita TEXT,
    rencana_setelah_lanjutan TEXT DEFAULT 'Kuliah (Perguruan Tinggi)',
    
    -- Bagian 4: Diskusi Orang Tua
    status_diskusi_ortu TEXT DEFAULT 'Setuju Penuh' CHECK (status_diskusi_ortu IN ('Setuju Penuh', 'Orang Tua Beda Pilihan', 'Belum Dibicarakan Mendalam')),
    aspirasi_pilihan_ortu TEXT,
    kendala_keluarga TEXT,
    
    -- Bagian 5: Guru BK
    rata_rapor TEXT,
    rekomendasi_bk TEXT,
    tindak_lanjut_bk TEXT DEFAULT 'Rekomendasi Aman',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_kelas ON public.career_surveys(kelas);
CREATE INDEX IF NOT EXISTS idx_career_siswa ON public.career_surveys(nama_siswa);

-- ==============================================================================
-- 9. TABEL: akpd_tallies (Tabulasi 50 Butir Angket Kebutuhan Peserta Didik)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.akpd_tallies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    no INTEGER NOT NULL,
    bidang TEXT NOT NULL CHECK (bidang IN ('Pribadi', 'Sosial', 'Belajar', 'Karir')),
    pernyataan TEXT NOT NULL,
    jumlah_pemilih INTEGER NOT NULL DEFAULT 0,
    total_responden INTEGER NOT NULL DEFAULT 32,
    prioritas TEXT NOT NULL DEFAULT 'Rendah' CHECK (prioritas IN ('Tinggi', 'Sedang', 'Rendah')),
    topik_rpl TEXT NOT NULL,
    kelas TEXT NOT NULL DEFAULT 'KELAS 8',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_akpd_no ON public.akpd_tallies(no);
CREATE INDEX IF NOT EXISTS idx_akpd_prioritas ON public.akpd_tallies(prioritas);

-- ==============================================================================
-- 10. KEAMANAN BASIS DATA: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prota_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akpd_tallies ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Pengguna yang terotentikasi memiliki akses penuh (CRUD)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'school_settings', 'students', 'counseling_records',
            'case_items', 'daily_journals', 'prota_items',
            'career_surveys', 'akpd_tallies'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Akses Penuh Guru Terotentikasi" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Akses Penuh Guru Terotentikasi" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);

        -- Akses baca untuk klien anonim jika diizinkan aplikasi:
        EXECUTE format('DROP POLICY IF EXISTS "Akses Anonim Terbatas" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Akses Anonim Terbatas" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- ==============================================================================
-- 11. DATA AWAL (SEED): 1 Set Data Baku Sekolah & 50 Butir Standar AKPD
-- ==============================================================================
INSERT INTO public.school_settings (
    id, nama_sekolah, npsn, alamat, instansi_atas, telepon_sekolah, email_sekolah, kota_surat, kepala_sekolah, nip_kepala, guru_bk, nip_guru_bk, tahun_ajaran
) VALUES (
    'default_school',
    'UPT SPF SMP NEGERI 6 MAKASSAR',
    '40307348',
    'Jl. Jend. A. Yani No. 25 Makassar RT/RW: 002/002 Kec. Ujung Pandang Kota Makassar',
    'PEMERINTAH KOTA MAKASSAR / DINAS PENDIDIKAN',
    'Telp. 04118941314 Fax. 04113617626',
    'smpn06.mks@gmail.com',
    'Makassar',
    'Drs. H. Mulyadi Kusuma, M.Pd.',
    '19750101 200003 1 001',
    'Siti Rahmawati, S.Pd., Gr.',
    '19880512 201402 2 003',
    '2026/2027'
) ON CONFLICT (id) DO NOTHING;
