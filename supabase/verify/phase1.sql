-- ============================================================================
-- SIM-BK PRO | Verifikasi Fase 1
-- ============================================================================
-- Jalankan SETELAH migrasi 20261120140000_saas_foundation.sql.
-- Semua query bersifat read-only.
-- ============================================================================

-- 1. Sekolah yang terbentuk ------------------------------------------------
select id, name, npsn, point_scale, sp_thresholds, leaderboard_mode, created_at
from public.schools
order by created_at;

-- 2. Anggota sekolah per role ----------------------------------------------
select role, count(*) as jumlah
from public.school_members
where is_active
group by role
order by role;

-- 3. Tahun ajaran & semester aktif ------------------------------------------
select ay.name as tahun_ajaran, s.name as semester, ay.is_active, s.is_active
from public.academic_years ay
left join public.semesters s on s.academic_year_id = ay.id
order by ay.created_at, s.name;

-- 4. Kelas dan jumlah siswa -------------------------------------------------
select c.name as kelas, c.level, count(s.id) as jumlah_siswa,
       m.display_name as wali_kelas
from public.classes c
left join public.students s on s.class_id = c.id
left join public.school_members m on m.id = c.homeroom_member_id
group by c.id, c.name, c.level, m.display_name
order by c.name;

-- 5. Data tanpa school_id (semua harus 0) -----------------------------------
select 'students' as tabel, count(*) as tanpa_sekolah from public.students where school_id is null
union all
select 'counseling_records', count(*) from public.counseling_records where school_id is null
union all
select 'case_items', count(*) from public.case_items where school_id is null
union all
select 'daily_journals', count(*) from public.daily_journals where school_id is null
union all
select 'school_settings', count(*) from public.school_settings where school_id is null
union all
select 'prota_items', count(*) from public.prota_items where school_id is null
union all
select 'career_surveys', count(*) from public.career_surveys where school_id is null
union all
select 'akpd_tallies', count(*) from public.akpd_tallies where school_id is null;

-- 6. Siswa yang belum punya class_id (informasi, bukan error) ---------------
select count(*) as siswa_tanpa_kelas
from public.students
where class_id is null;

-- 7. Siswa yang class_id-nya milik sekolah lain (harus 0) -------------------
select count(*) as siswa_kelas_beda_sekolah
from public.students s
join public.classes c on c.id = s.class_id
where c.school_id <> s.school_id;

-- 8. Wali kelas yang ditugaskan ke kelas sekolah lain (harus 0) -------------
select count(*) as wali_beda_sekolah
from public.classes c
join public.school_members m on m.id = c.homeroom_member_id
where m.school_id <> c.school_id;

-- 9. Pengaturan sekolah ganda (harus 0) -------------------------------------
select school_id, count(*) as jumlah_baris
from public.school_settings
group by school_id
having count(*) > 1;

-- 10. RLS aktif di semua tabel ---------------------------------------------
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'schools', 'school_members', 'academic_years', 'semesters', 'classes',
    'students', 'counseling_records', 'case_items', 'daily_journals',
    'school_settings', 'prota_items', 'career_surveys', 'akpd_tallies'
  )
order by tablename;

-- 11. Jumlah policy per tabel ----------------------------------------------
select tablename, count(*) as jumlah_policy
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 12. Fungsi bantu tersedia ------------------------------------------------
select proname, prosecdef as security_definer, proacl
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'default_school_id', 'is_school_member', 'has_school_role',
    'is_homeroom_of', 'claim_school'
  )
order by proname;

-- 13. Cek konsistensi ambang poin ------------------------------------------
select id, name, point_scale, sp_thresholds,
       cardinality(sp_thresholds) = 4 as jumlah_ambang_benar,
       sp_thresholds[1] < sp_thresholds[2]
         and sp_thresholds[2] < sp_thresholds[3]
         and sp_thresholds[3] < sp_thresholds[4] as urutan_benar
from public.schools;
