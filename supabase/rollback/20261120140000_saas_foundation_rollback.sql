-- ============================================================================
-- SIM-BK PRO | Rollback darurat Fase 1
-- ============================================================================
-- ⚠️ HANYA UNTUK DARURAT / STAGING.
-- Rollback ini menghapus pemetaan sekolah, kelas, tahun ajaran, dan role.
-- Data siswa, konseling, kasus, jurnal, prota, karir, dan AKPD TIDAK dihapus.
--
-- Setelah rollback, aplikasi kembali memakai kebijakan lama:
--   owner_id = auth.uid()
--
-- Jangan jalankan bila sudah ada data Fase 2 (pelanggaran/poin/SP) yang
-- bergantung pada school_id.
-- ============================================================================

begin;

-- 1. Kebijakan baru ---------------------------------------------------------
drop policy if exists schools_member_read             on public.schools;
drop policy if exists schools_bk_update               on public.schools;
drop policy if exists school_members_self_or_bk_read  on public.school_members;
drop policy if exists school_members_bk_write         on public.school_members;
drop policy if exists academic_years_member_read      on public.academic_years;
drop policy if exists academic_years_bk_write         on public.academic_years;
drop policy if exists semesters_member_read           on public.semesters;
drop policy if exists semesters_bk_write              on public.semesters;
drop policy if exists classes_member_read             on public.classes;
drop policy if exists classes_bk_write                on public.classes;
drop policy if exists students_bk_all                 on public.students;
drop policy if exists students_wali_read              on public.students;
drop policy if exists counseling_bk_all               on public.counseling_records;
drop policy if exists cases_bk_all                    on public.case_items;
drop policy if exists journals_bk_all                 on public.daily_journals;
drop policy if exists prota_bk_all                    on public.prota_items;
drop policy if exists career_bk_all                   on public.career_surveys;
drop policy if exists akpd_bk_all                     on public.akpd_tallies;
drop policy if exists settings_member_read            on public.school_settings;
drop policy if exists settings_bk_write               on public.school_settings;

-- 2. Trigger ----------------------------------------------------------------
drop trigger if exists trg_students_sync_class on public.students;

-- 3. Kolom tenant -----------------------------------------------------------
alter table public.students           drop column if exists class_id;
alter table public.students           drop column if exists school_id;
alter table public.counseling_records drop column if exists school_id;
alter table public.case_items         drop column if exists school_id;
alter table public.daily_journals     drop column if exists school_id;
alter table public.school_settings    drop column if exists school_id;
alter table public.prota_items        drop column if exists school_id;
alter table public.career_surveys     drop column if exists school_id;
alter table public.akpd_tallies       drop column if exists school_id;

-- 4. Tabel baru (urutan terbalik karena foreign key) ------------------------
drop table if exists public.classes        cascade;
drop table if exists public.semesters      cascade;
drop table if exists public.academic_years cascade;
drop table if exists public.school_members cascade;
drop table if exists public.schools        cascade;

-- 5. Fungsi -----------------------------------------------------------------
drop function if exists public.claim_school(uuid);
drop function if exists public.sync_student_class();
drop function if exists public.set_updated_at();
drop function if exists public.is_homeroom_of(uuid);
drop function if exists public.has_school_role(uuid, text[]);
drop function if exists public.is_school_member(uuid);
drop function if exists public.default_school_id();

-- 6. Pulihkan kebijakan lama ------------------------------------------------
create policy "owner_all_students"    on public.students           for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_counseling"  on public.counseling_records for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_cases"       on public.case_items         for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_journals"    on public.daily_journals     for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_settings"    on public.school_settings    for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_prota"       on public.prota_items        for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_career"      on public.career_surveys     for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all_akpd"        on public.akpd_tallies       for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

commit;
