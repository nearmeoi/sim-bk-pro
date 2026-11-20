-- ============================================================================
-- SIM-BK PRO | Verifikasi Fase 3 — Portal siswa
-- ============================================================================
-- Jalankan SETELAH migrasi 20261120160000_student_portal.sql.
-- Semua query bersifat read-only.
-- ============================================================================

-- 1. Tabel sesi ada dan RLS aktif -------------------------------------------
-- Harus 1 baris: rls_aktif = true, jumlah_policy = 0.
select
  c.relname as tabel,
  c.relrowsecurity as rls_aktif,
  count(p.polname) as jumlah_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname = 'student_portal_sessions'
group by c.relname, c.relrowsecurity;

-- 2. Browser tidak boleh menyentuh tabel sesi --------------------------------
-- Harus 0 baris.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'student_portal_sessions'
  and grantee in ('anon', 'authenticated');

-- 3. RPC portal hanya untuk service_role -------------------------------------
-- login, data, logout harus hanya dapat dieksekusi service_role.
select
  p.proname as fungsi,
  has_function_privilege('anon', p.oid, 'execute') as anon_bisa,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_bisa,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_bisa
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'student_portal_login', 'student_portal_data', 'student_portal_logout'
  )
order by p.proname;

-- 4. Sesi yatim / lintas sekolah (harus 0) -----------------------------------
select 'sessions -> students' as relasi, count(*) as orphan
from public.student_portal_sessions sps
left join public.students st
  on st.id = sps.student_id and st.school_id = sps.school_id
where st.id is null
union all
select 'sessions -> cards', count(*)
from public.student_portal_sessions sps
left join public.student_cards sc
  on sc.id = sps.card_id and sc.school_id = sps.school_id
where sc.id is null;

-- 5. Sesi aktif saat ini (informasi) -----------------------------------------
select
  count(*) as total_sesi,
  count(*) filter (where revoked_at is null and expires_at > now()) as sesi_aktif,
  count(*) filter (where expires_at <= now()) as sesi_kedaluwarsa
from public.student_portal_sessions;
