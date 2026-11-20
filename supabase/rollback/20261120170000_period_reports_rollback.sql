-- ============================================================================
-- ROLLBACK: Laporan poin per semester dan tahun ajaran
-- ============================================================================
-- Aman dijalankan berulang. Tidak menyentuh tabel/aturan Fase 1-3.
-- ============================================================================

drop view if exists public.v_period_student_points;
