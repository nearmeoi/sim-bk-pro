-- ============================================================================
-- HAPUS SELURUH DATA DEMO/SIMULASI DI CLOUD (SIM BK PRO)
-- Jalankan di SQL Editor Supabase SEKALI SAJA, SETELAH owner-migration.sql.
--
-- TUJUAN: aplikasi versi produksi mulai KOSONG. Tanpa script ini, perangkat
-- baru yang login pertama kali akan menarik kembali data demo lama dari cloud.
--
-- AMAN: tabel auth.users tidak disentuh — akun masuk tetap utuh.
-- ============================================================================
TRUNCATE TABLE public.students, public.counseling_records, public.case_items,
  public.daily_journals, public.prota_items, public.career_surveys,
  public.akpd_tallies;
DELETE FROM public.school_settings;
