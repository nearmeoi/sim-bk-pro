-- ============================================================================
-- Verifikasi Fase 6 | Pemindaian kartu siswa oleh guru
-- ============================================================================
-- Jalankan setelah 20261120190000_staff_card_scan.sql.
-- Semua query di bawah hanya membaca; tidak mengubah data.
-- ============================================================================

-- 1. Fungsi ada, security definer, dan search_path aman.
select
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'resolve_student_card';

-- 2. anon/PUBLIC tidak boleh mengeksekusi; authenticated boleh.
select
  r.routine_name,
  r.grantee,
  r.privilege_type
from information_schema.routine_privileges r
where r.routine_schema = 'public'
  and r.routine_name = 'resolve_student_card'
order by r.grantee;

-- 3. Kolom hasil tidak boleh membocorkan PIN/token.
select
  p.proname,
  pg_get_function_result(p.oid) as result_columns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'resolve_student_card';

-- 4. Kartu aktif harus tetap satu per siswa.
select school_id, student_id, count(*) as active_cards
from public.student_cards
where status = 'active'
group by school_id, student_id
having count(*) > 1;

-- 5. Siswa pemilik kartu harus ada di sekolah yang sama.
select c.id as card_id, c.school_id, c.student_id
from public.student_cards c
left join public.students s
  on s.id = c.student_id
 and s.school_id = c.school_id
where s.id is null;

-- 6. Ringkasan kartu per sekolah.
select
  s.id as school_id,
  s.name,
  count(c.id) filter (where c.status = 'active') as active_cards,
  count(c.id) filter (where c.status <> 'active') as inactive_cards,
  count(distinct c.student_id) as students_with_card
from public.schools s
left join public.student_cards c on c.school_id = s.id
group by s.id, s.name
order by s.name;
