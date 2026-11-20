-- ============================================================================
-- SIM-BK PRO | Rollback darurat Fase 2
-- ============================================================================
-- ⚠️ HANYA UNTUK DARURAT / STAGING.
-- Rollback ini MENGHAPUS SEMUA data tata tertib:
--   aturan, pelanggaran, ledger poin, surat SP, kartu siswa, dan audit log.
--
-- Data Fase 1 (sekolah, anggota, kelas, tahun ajaran, siswa) TIDAK dihapus.
-- Jalankan rollback Fase 1 hanya setelah rollback ini selesai.
--
-- Backup tabel berikut sebelum menjalankan:
--   violation_rules, violation_records, point_ledger,
--   sp_letters, student_cards, audit_log
-- ============================================================================

begin;

-- 1. View laporan (urutan terbalik karena saling bergantung) ----------------
drop view if exists public.v_sp_pending;
drop view if exists public.v_sp_letters;
drop view if exists public.v_class_points;
drop view if exists public.v_violation_leaderboard;
drop view if exists public.v_violation_feed;
drop view if exists public.v_student_points;

-- 2. Trigger -----------------------------------------------------------------
drop trigger if exists trg_point_ledger_sp          on public.point_ledger;
drop trigger if exists trg_point_ledger_balance     on public.point_ledger;
drop trigger if exists trg_point_ledger_immutable   on public.point_ledger;
drop trigger if exists trg_violation_rules_updated_at   on public.violation_rules;
drop trigger if exists trg_violation_records_updated_at on public.violation_records;
drop trigger if exists trg_sp_letters_updated_at        on public.sp_letters;
drop trigger if exists trg_student_cards_updated_at     on public.student_cards;

-- 3. Tabel (urutan terbalik karena foreign key) ------------------------------
drop table if exists public.audit_log;
drop table if exists public.student_cards;
drop table if exists public.sp_letters;
drop table if exists public.point_ledger;
drop table if exists public.violation_records;
drop table if exists public.violation_rules;

-- 4. Fungsi ------------------------------------------------------------------
drop function if exists public.verify_student_card(text, text);
drop function if exists public.revoke_student_card(uuid, text);
drop function if exists public.create_student_card(text);
drop function if exists public.set_sp_meeting(uuid, timestamptz);
drop function if exists public.cancel_sp_letter(uuid, text);
drop function if exists public.issue_sp_letter(uuid, text, timestamptz);
drop function if exists public.create_manual_sp(text, text, text);
drop function if exists public.void_violation(uuid, text);
drop function if exists public.record_violation(text, uuid, timestamptz, text, text, text[]);
drop function if exists public.trg_point_ledger_sp();
drop function if exists public.maybe_create_sp_draft(uuid, text, uuid, smallint, boolean, uuid, uuid);
drop function if exists public.build_sp_snapshot(uuid, text, text, integer, integer, integer, uuid);
drop function if exists public.prevent_point_ledger_mutation();
drop function if exists public.set_point_ledger_balance();
drop function if exists public.log_audit(uuid, text, text, text, jsonb, jsonb);
drop function if exists public.resolve_period(uuid, timestamptz);
drop function if exists public.is_wali_of_student(text, uuid);

-- 5. Constraint unik komposit yang ditambahkan ke tabel Fase 1 ---------------
-- Harus setelah tabel Fase 2 dihapus karena FK-nya memakai constraint ini.
alter table public.semesters
  drop constraint if exists semesters_id_school_unique;
alter table public.academic_years
  drop constraint if exists academic_years_id_school_unique;
alter table public.students
  drop constraint if exists students_id_school_unique;

commit;

-- ============================================================================
-- CATATAN
-- ============================================================================
-- 1. Ekstensi pgcrypto TIDAK dihapus karena dibuat/dipakai sejak Fase 1.
-- 2. Setelah rollback, frontend Fase 2 harus dinonaktifkan lebih dulu;
--    service dan halaman tata tertib akan gagal karena tabel sudah tidak ada.
-- 3. Verifikasi sisa objek:
--      select tablename from pg_tables
--      where schemaname = 'public'
--        and tablename in ('violation_rules','violation_records','point_ledger',
--                          'sp_letters','student_cards','audit_log');
--    Harus 0 baris.
-- ============================================================================
