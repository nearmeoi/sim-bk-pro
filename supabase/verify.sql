-- ============================================================================
-- SIM-BK PRO | Buat User Auth
-- Jalankan di Supabase SQL Editor SETELAH schema.sql berhasil
-- ============================================================================

-- Buat user guru BK (ganti email dan password sesuai kebutuhan)
-- CATATAN: Cara lebih mudah via dashboard Authentication > Users > Add User

-- Contoh insert langsung ke auth.users (hanya jika diperlukan via SQL):
-- SELECT auth.create_user(
--   uid := gen_random_uuid(),
--   email := 'guru_bk@sekolah.id',
--   password := 'password_anda_disini',
--   email_confirm := true
-- );

-- ============================================================================
-- CEK STATUS TABEL (jalankan ini untuk verifikasi semua tabel sudah dibuat)
-- ============================================================================
SELECT
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✓ OK' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'students',
    'counseling_records',
    'case_items',
    'daily_journals',
    'school_settings',
    'prota_items',
    'career_surveys',
    'akpd_tallies'
  )
ORDER BY table_name;
