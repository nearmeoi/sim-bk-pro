-- ============================================================================
-- SIM-BK | Laporan poin per semester dan tahun ajaran
-- ============================================================================
-- View ini tidak menyimpan data baru. Ia mengagregasi point_ledger agar BK
-- dan wali kelas bisa membuka laporan periode lama tanpa menghitung ulang
-- seluruh riwayat di browser.
--
-- security_invoker = true: RLS point_ledger dan students tetap berlaku.
-- Wali kelas hanya melihat siswa kelasnya; siswa tidak punya akses ke view.
-- ============================================================================

create or replace view public.v_period_student_points
with (security_invoker = true) as
select
  st.school_id,
  st.id as student_id,
  st.nama,
  st.nis,
  st.nisn,
  st.kelas,
  st.class_id,
  pl.academic_year_id,
  pl.semester_id,
  coalesce(sum(pl.violation_delta), 0)::integer as points,
  coalesce(sum(pl.guidebook_delta), 0)::integer as guidebook_points,
  count(*) filter (
    where pl.entry_type = 'violation' and coalesce(vr.status, 'recorded') <> 'void'
  )::integer as violation_count,
  max(pl.occurred_at) filter (
    where pl.entry_type = 'violation' and coalesce(vr.status, 'recorded') <> 'void'
  ) as last_violation_at
from public.point_ledger pl
join public.students st
  on st.id = pl.student_id
 and st.school_id = pl.school_id
left join public.violation_records vr
  on vr.id = pl.violation_record_id
group by
  st.school_id,
  st.id,
  st.nama,
  st.nis,
  st.nisn,
  st.kelas,
  st.class_id,
  pl.academic_year_id,
  pl.semester_id
having
  coalesce(sum(pl.violation_delta), 0) <> 0
  or count(*) filter (
    where pl.entry_type = 'violation' and coalesce(vr.status, 'recorded') <> 'void'
  ) > 0;

comment on view public.v_period_student_points is
  'Agregat poin pelanggaran per siswa per semester. Dipakai laporan periode dan tetap mengikuti RLS.';

revoke all on public.v_period_student_points from anon;
grant select on public.v_period_student_points to authenticated;
grant select on public.v_period_student_points to service_role;
