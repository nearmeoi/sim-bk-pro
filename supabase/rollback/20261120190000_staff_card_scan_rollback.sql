-- ============================================================================
-- Rollback Fase 6 | Pemindaian kartu siswa oleh guru
-- ============================================================================
-- Aman dijalankan tanpa menghapus kartu, siswa, atau audit.
-- ============================================================================

drop function if exists public.resolve_student_card(text);
