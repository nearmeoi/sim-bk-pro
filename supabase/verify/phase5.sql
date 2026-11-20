-- ============================================================================
-- Verifikasi Fase 5 | Manajemen guru dan wali kelas
-- ============================================================================
-- Jalankan setelah 20261120180000_staff_management.sql.
-- Semua query di bawah hanya membaca; tidak mengubah data.
-- ============================================================================

-- 1. Kolom email dan index harus ada.
select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'school_members'
      and column_name = 'email'
  ) as has_email_column,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'idx_school_members_school_email'
  ) as has_email_index;

-- 2. Empat RPC harus ada, security definer, dan search_path aman.
select
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'assign_homeroom',
    'clear_homeroom',
    'update_school_member',
    'set_school_member_active'
  )
order by p.proname;

-- 3. anon tidak boleh bisa memanggil RPC.
select
  r.routine_name,
  r.grantee,
  r.privilege_type
from information_schema.routine_privileges r
where r.routine_schema = 'public'
  and r.routine_name in (
    'assign_homeroom',
    'clear_homeroom',
    'update_school_member',
    'set_school_member_active'
  )
  and r.grantee in ('anon', 'PUBLIC')
order by r.routine_name, r.grantee;

-- 4. Setiap sekolah harus punya minimal satu BK aktif.
select
  s.id as school_id,
  s.name,
  count(m.id) filter (where m.role = 'bk' and m.is_active) as active_bk
from public.schools s
left join public.school_members m on m.school_id = s.id
group by s.id, s.name
having count(m.id) filter (where m.role = 'bk' and m.is_active) = 0;

-- 5. Tidak boleh ada wali kelas lintas sekolah.
select c.id as class_id, c.school_id, c.name, c.homeroom_member_id
from public.classes c
join public.school_members m on m.id = c.homeroom_member_id
where m.school_id <> c.school_id;

-- 6. Tidak boleh ada guru yang memegang dua kelas pada tahun ajaran sama.
select
  c.school_id,
  c.academic_year_id,
  c.homeroom_member_id,
  count(*) as classes_held,
  array_agg(c.name order by c.name) as class_names
from public.classes c
where c.homeroom_member_id is not null
group by c.school_id, c.academic_year_id, c.homeroom_member_id
having count(*) > 1;

-- 7. Ringkasan penugasan per sekolah.
select
  s.id as school_id,
  s.name,
  count(distinct m.id) filter (where m.is_active) as active_staff,
  count(distinct c.id) filter (where c.homeroom_member_id is not null) as classes_with_homeroom,
  count(distinct c.id) filter (where c.homeroom_member_id is null) as classes_without_homeroom
from public.schools s
left join public.school_members m on m.school_id = s.id
left join public.classes c on c.school_id = s.id
group by s.id, s.name
order by s.name;
