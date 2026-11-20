-- ============================================================================
-- Rollback Fase 5 | Manajemen guru dan wali kelas
-- ============================================================================
-- Aman dijalankan tanpa menghapus anggota, kelas, atau data poin.
-- Kolom email hanya salinan tampilan; data login tetap di auth.users.
-- ============================================================================

drop function if exists public.set_school_member_active(uuid, boolean);
drop function if exists public.update_school_member(uuid, text, text, text);
drop function if exists public.clear_homeroom(uuid);
drop function if exists public.assign_homeroom(uuid, uuid);

drop index if exists public.idx_school_members_school_email;

alter table public.school_members
  drop column if exists email;
