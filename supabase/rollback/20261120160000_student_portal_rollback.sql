-- ============================================================================
-- ROLLBACK: Portal siswa (sesi QR + PIN)
-- ============================================================================
-- Aman dijalankan berulang. Tidak menyentuh tabel/aturan Fase 1-2.
-- ============================================================================

drop function if exists public.student_portal_logout(text);
drop function if exists public.student_portal_data(text);
drop function if exists public.student_portal_login(text, text);

drop table if exists public.student_portal_sessions;
