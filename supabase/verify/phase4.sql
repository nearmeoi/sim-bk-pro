-- ============================================================================
-- SIM-BK PRO | Verifikasi Fase 4 — Laporan periode
-- ============================================================================
-- Jalankan SETELAH migrasi 20261120170000_period_reports.sql.
-- Semua query bersifat read-only.
-- ============================================================================

-- 1. View ada dan memakai security_invoker --------------------------------
-- Harus 1 baris: security_invoker = true.
select
  c.relname as view_name,
  c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'v_period_student_points'
  and c.relkind = 'v';

-- 2. Hak akses: anon tidak boleh, authenticated boleh ---------------------
select
  has_table_privilege('anon', 'public.v_period_student_points', 'SELECT') as anon_bisa,
  has_table_privilege('authenticated', 'public.v_period_student_points', 'SELECT') as authenticated_bisa,
  has_table_privilege('service_role', 'public.v_period_student_points', 'SELECT') as service_role_bisa;

-- 3. Tidak ada baris yatim / lintas sekolah --------------------------------
-- Harus 0.
select count(*) as orphan
from public.v_period_student_points p
left join public.students st
  on st.id = p.student_id and st.school_id = p.school_id
where st.id is null;

-- 4. Jumlah baris dan rentang poin (informasi) -----------------------------
select
  count(*) as total_baris,
  count(distinct student_id) as total_siswa,
  count(distinct semester_id) as total_semester,
  min(points) as poin_min,
  max(points) as poin_max
from public.v_period_student_points;
