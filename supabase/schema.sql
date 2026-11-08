-- ============================================================================
-- SIM-BK PRO | Supabase PostgreSQL Schema
-- Jalankan seluruh file ini di Supabase SQL Editor
-- https://supabase.com/dashboard/project/fxunkyqasqgnqmfveizp/sql
-- ============================================================================

-- ============================================================================
-- BERSIHKAN TABEL LAMA (urutan terbalik karena foreign key)
-- ⚠️ WARNING: DROP TABLE IF EXISTS CASCADE will delete all dependent data without recovery.
-- Use only during development or intentional database reset. Never run in production without backup.
-- ============================================================================
DROP TABLE IF EXISTS public.akpd_tallies      CASCADE;
DROP TABLE IF EXISTS public.career_surveys     CASCADE;
DROP TABLE IF EXISTS public.prota_items        CASCADE;
DROP TABLE IF EXISTS public.school_settings    CASCADE;
DROP TABLE IF EXISTS public.daily_journals     CASCADE;
DROP TABLE IF EXISTS public.case_items         CASCADE;
DROP TABLE IF EXISTS public.counseling_records CASCADE;
DROP TABLE IF EXISTS public.students           CASCADE;

-- ============================================================================
-- 1. STUDENTS
-- ============================================================================
CREATE TABLE public.students (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id              TEXT PRIMARY KEY,
  nama            TEXT NOT NULL,
  nis             TEXT NOT NULL,
  nisn            TEXT DEFAULT '-',
  jk              TEXT CHECK (jk IN ('L', 'P')) NOT NULL,
  kelas           TEXT NOT NULL,
  status          TEXT CHECK (status IN ('Aktif', 'Pindah', 'Lulus')) NOT NULL DEFAULT 'Aktif',
  nama_wali       TEXT,
  kontak_wali     TEXT,
  alamat          TEXT,
  catatan_khusus  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. COUNSELING RECORDS (Catatan Konseling)
-- ============================================================================
CREATE TABLE public.counseling_records (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id              TEXT PRIMARY KEY,
  student_id      TEXT REFERENCES public.students(id) ON DELETE SET NULL,
  nama_siswa      TEXT NOT NULL,
  kelas           TEXT NOT NULL,
  tanggal         TEXT NOT NULL,
  waktu           TEXT NOT NULL,
  jenis           TEXT NOT NULL,
  bidang          TEXT NOT NULL,
  masalah         TEXT NOT NULL,
  tindak_lanjut   TEXT NOT NULL,
  status          TEXT CHECK (status IN ('Proses', 'Selesai', 'Menunggu')) NOT NULL DEFAULT 'Proses',
  tahap           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CASE ITEMS (Daftar Kasus)
-- ============================================================================
CREATE TABLE public.case_items (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id              TEXT PRIMARY KEY,
  student_id      TEXT REFERENCES public.students(id) ON DELETE SET NULL,
  nama_siswa      TEXT NOT NULL,
  kelas           TEXT NOT NULL,
  masalah         TEXT NOT NULL,
  tanggal         TEXT NOT NULL,
  status          TEXT CHECK (status IN ('Proses', 'Selesai')) NOT NULL DEFAULT 'Proses',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. DAILY JOURNALS (Jurnal Harian BK)
-- ============================================================================
CREATE TABLE public.daily_journals (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id              TEXT PRIMARY KEY,
  hari_tanggal    TEXT NOT NULL,
  waktu           TEXT NOT NULL,
  nama            TEXT NOT NULL,
  kelas           TEXT NOT NULL,
  jenis           TEXT NOT NULL,
  topik           TEXT NOT NULL,
  keterangan      TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SCHOOL SETTINGS (Pengaturan Sekolah & Kop Surat)
-- ============================================================================
CREATE TABLE public.school_settings (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id                TEXT PRIMARY KEY DEFAULT 'default_school',
  nama_sekolah      TEXT NOT NULL,
  npsn              TEXT NOT NULL,
  alamat            TEXT NOT NULL,
  instansi_atas     TEXT,
  telepon_sekolah   TEXT,
  email_sekolah     TEXT,
  kota_surat        TEXT,
  kepala_sekolah    TEXT NOT NULL,
  nip_kepala        TEXT NOT NULL,
  guru_bk           TEXT NOT NULL,
  nip_guru_bk       TEXT NOT NULL,
  tahun_ajaran      TEXT NOT NULL,
  logo_url          TEXT,
  logo_kanan_url    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. PROTA ITEMS (Program Tahunan)
-- ============================================================================
CREATE TABLE public.prota_items (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id          TEXT PRIMARY KEY,
  komponen    TEXT NOT NULL,
  jenis       TEXT NOT NULL,
  bidang      TEXT NOT NULL,
  months      BOOLEAN[] NOT NULL DEFAULT '{false,false,false,false,false,false,false,false,false,false,false,false}',
  volume      INTEGER NOT NULL DEFAULT 1,
  sasaran     TEXT NOT NULL DEFAULT 'Kelas 7, 8, 9',
  urutan      INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. CAREER SURVEYS (Angket Bimbingan Karir / E-Shinro)
-- ============================================================================
CREATE TABLE public.career_surveys (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id                        TEXT PRIMARY KEY,
  nama_siswa                TEXT NOT NULL,
  kelas                     TEXT NOT NULL,
  no_absen                  TEXT NOT NULL DEFAULT '1',
  nis                       TEXT NOT NULL,
  nisn                      TEXT DEFAULT '-',
  nama_ortu                 TEXT,
  no_hp_ortu                TEXT,
  rencana_setelah_smp       TEXT NOT NULL DEFAULT 'SMA',
  alasan_rencana            TEXT,
  pilihan1_sekolah          TEXT,
  pilihan1_jurusan          TEXT,
  pilihan1_jalur            TEXT DEFAULT 'Zonasi',
  pilihan1_alasan           TEXT,
  pilihan2_sekolah          TEXT,
  pilihan2_jurusan          TEXT,
  pilihan2_jalur            TEXT DEFAULT 'Zonasi',
  rencana_cadangan3         TEXT,
  cita_cita                 TEXT,
  alasan_cita_cita          TEXT,
  rencana_setelah_lanjutan  TEXT NOT NULL DEFAULT 'Kuliah (Perguruan Tinggi)',
  status_diskusi_ortu       TEXT NOT NULL DEFAULT 'Setuju Penuh',
  aspirasi_pilihan_ortu     TEXT,
  kendala_keluarga          TEXT,
  rata_rapor                TEXT,
  rekomendasi_bk            TEXT,
  tindak_lanjut_bk          TEXT NOT NULL DEFAULT 'Rekomendasi Aman',
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. AKPD TALLIES (Rekapitulasi Angket Kebutuhan Peserta Didik)
-- ============================================================================
CREATE TABLE public.akpd_tallies (
    owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  id                TEXT PRIMARY KEY,
  no                INTEGER NOT NULL,
  bidang            TEXT NOT NULL,
  pernyataan        TEXT NOT NULL,
  jumlah_pemilih    INTEGER NOT NULL DEFAULT 0,
  total_responden   INTEGER NOT NULL DEFAULT 32,
  prioritas         TEXT NOT NULL DEFAULT 'Rendah',
  topik_rpl         TEXT,
  kelas             TEXT NOT NULL DEFAULT 'KELAS 8',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_journals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prota_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_surveys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akpd_tallies       ENABLE ROW LEVEL SECURITY;

-- Policy: hanya pemilik data sendiri (owner_id = auth.uid()) yang boleh akses
CREATE POLICY "owner_all_students"    ON public.students           FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_counseling"  ON public.counseling_records FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_cases"       ON public.case_items         FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_journals"    ON public.daily_journals     FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_settings"    ON public.school_settings    FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_prota"       ON public.prota_items        FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_career"      ON public.career_surveys     FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all_akpd"        ON public.akpd_tallies       FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_students_kelas      ON public.students(kelas);
CREATE INDEX idx_students_status     ON public.students(status);
CREATE INDEX idx_counseling_student  ON public.counseling_records(student_id);
CREATE INDEX idx_counseling_tanggal  ON public.counseling_records(tanggal);
CREATE INDEX idx_cases_status        ON public.case_items(status);
CREATE INDEX idx_journals_tanggal    ON public.daily_journals(hari_tanggal);
CREATE INDEX idx_career_kelas        ON public.career_surveys(kelas);
CREATE INDEX idx_akpd_kelas          ON public.akpd_tallies(kelas);
CREATE INDEX idx_prota_urutan        ON public.prota_items(urutan);

-- ============================================================================
-- REALTIME (aktifkan untuk sinkronisasi live antar tab/device)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.counseling_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_journals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prota_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.career_surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.akpd_tallies;

