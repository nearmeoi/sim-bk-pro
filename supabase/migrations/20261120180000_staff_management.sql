-- ============================================================================
-- SIM-BK | Manajemen guru dan penugasan wali kelas
-- ============================================================================
-- Tujuan:
--   1. BK dapat mengubah nama, email catatan, dan peran anggota sekolah.
--   2. BK dapat menugaskan wali kelas ke satu kelas per tahun ajaran.
--   3. Akun yang dinonaktifkan otomatis dilepas dari semua kelas agar tidak
--      menyisakan wali kelas "hantu" yang tidak bisa membuka data.
--   4. Perubahan penting tercatat di audit_log.
--
-- Pembuatan akun login tetap dilakukan Edge Function `manage-staff` karena
-- hanya service role yang boleh memanggil Supabase Auth Admin API.
-- ============================================================================

-- Email di sini hanya salinan untuk ditampilkan di layar BK. Email login yang
-- sebenarnya tetap berada di auth.users dan tidak pernah dibaca browser.
alter table public.school_members
  add column if not exists email text;

comment on column public.school_members.email is
  'Salinan email login untuk tampilan BK. Sumber kebenaran tetap auth.users.';

create index if not exists idx_school_members_school_email
  on public.school_members (school_id, lower(email))
  where email is not null;

-- ============================================================================
-- 1. TUGASKAN WALI KELAS
-- ============================================================================
-- Satu kelas hanya punya satu wali. Satu guru hanya menjadi wali untuk satu
-- kelas dalam tahun ajaran yang sama. Penugasan baru otomatis menggantikan
-- wali kelas sebelumnya pada kelas tersebut.

create or replace function public.assign_homeroom(
  p_class_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_class  public.classes%rowtype;
  v_member public.school_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'Kelas tidak ditemukan.';
  end if;

  if not public.has_school_role(v_class.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh menugaskan wali kelas.';
  end if;

  select * into v_member
  from public.school_members
  where id = p_member_id
    and school_id = v_class.school_id
  for update;

  if not found then
    raise exception 'Guru tidak ditemukan di sekolah ini.';
  end if;

  if not v_member.is_active then
    raise exception 'Akun guru tidak aktif. Aktifkan dulu sebelum ditugaskan.';
  end if;

  if exists (
    select 1
    from public.classes c
    where c.school_id = v_class.school_id
      and c.academic_year_id = v_class.academic_year_id
      and c.homeroom_member_id = p_member_id
      and c.id <> p_class_id
  ) then
    raise exception
      'Guru ini sudah menjadi wali kelas lain pada tahun ajaran yang sama.';
  end if;

  update public.classes
  set homeroom_member_id = p_member_id
  where id = p_class_id;

  perform public.log_audit(
    v_class.school_id,
    'homeroom.assigned',
    'classes',
    p_class_id::text,
    jsonb_build_object('homeroom_member_id', v_class.homeroom_member_id),
    jsonb_build_object('homeroom_member_id', p_member_id)
  );
end;
$$;

comment on function public.assign_homeroom(uuid, uuid) is
  'BK menugaskan satu guru aktif sebagai wali kelas. Satu guru satu kelas per tahun ajaran.';

-- ============================================================================
-- 2. LEPAS WALI KELAS
-- ============================================================================

create or replace function public.clear_homeroom(p_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_class public.classes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_class
  from public.classes
  where id = p_class_id
  for update;

  if not found then
    raise exception 'Kelas tidak ditemukan.';
  end if;

  if not public.has_school_role(v_class.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh melepas wali kelas.';
  end if;

  if v_class.homeroom_member_id is null then
    return;
  end if;

  update public.classes
  set homeroom_member_id = null
  where id = p_class_id;

  perform public.log_audit(
    v_class.school_id,
    'homeroom.cleared',
    'classes',
    p_class_id::text,
    jsonb_build_object('homeroom_member_id', v_class.homeroom_member_id),
    null
  );
end;
$$;

comment on function public.clear_homeroom(uuid) is
  'BK melepas wali kelas dari satu kelas tanpa menghapus akun guru.';

-- ============================================================================
-- 3. UBAH DATA ANGGOTA
-- ============================================================================

create or replace function public.update_school_member(
  p_member_id uuid,
  p_display_name text,
  p_role text,
  p_email text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.school_members%rowtype;
  v_name   text;
  v_email  text;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_member
  from public.school_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Anggota tidak ditemukan.';
  end if;

  if not public.has_school_role(v_member.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh mengubah data anggota.';
  end if;

  if p_role not in ('bk', 'wali_kelas') then
    raise exception 'Peran harus bk atau wali_kelas.';
  end if;

  v_name := nullif(trim(p_display_name), '');
  if v_name is null then
    raise exception 'Nama guru wajib diisi.';
  end if;

  v_email := nullif(lower(trim(p_email)), '');
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Format email tidak valid.';
  end if;

  -- Jangan sampai sekolah kehilangan BK terakhir.
  if v_member.role = 'bk'
     and p_role <> 'bk'
     and v_member.is_active
     and not exists (
       select 1
       from public.school_members m
       where m.school_id = v_member.school_id
         and m.role = 'bk'
         and m.is_active
         and m.id <> v_member.id
     )
  then
    raise exception 'Sekolah harus memiliki minimal satu guru BK aktif.';
  end if;

  update public.school_members
  set display_name = v_name,
      role = p_role,
      email = v_email
  where id = p_member_id;

  perform public.log_audit(
    v_member.school_id,
    'staff.updated',
    'school_members',
    p_member_id::text,
    jsonb_build_object(
      'display_name', v_member.display_name,
      'role', v_member.role,
      'email', v_member.email
    ),
    jsonb_build_object(
      'display_name', v_name,
      'role', p_role,
      'email', v_email
    )
  );
end;
$$;

comment on function public.update_school_member(uuid, text, text, text) is
  'BK mengubah nama, peran, dan email catatan anggota. Mencegah hilangnya BK aktif terakhir.';

-- ============================================================================
-- 4. AKTIFKAN / NONAKTIFKAN ANGGOTA
-- ============================================================================
-- Nonaktif berarti tidak bisa lagi membaca data sekolah. Semua penugasan
-- wali kelasnya dilepas agar kelas tidak menunjuk akun yang tidak aktif.

create or replace function public.set_school_member_active(
  p_member_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member public.school_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_member
  from public.school_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'Anggota tidak ditemukan.';
  end if;

  if not public.has_school_role(v_member.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh mengubah status anggota.';
  end if;

  if not p_is_active and v_member.user_id = auth.uid() then
    raise exception 'Tidak bisa menonaktifkan akun sendiri.';
  end if;

  if not p_is_active
     and v_member.role = 'bk'
     and v_member.is_active
     and not exists (
       select 1
       from public.school_members m
       where m.school_id = v_member.school_id
         and m.role = 'bk'
         and m.is_active
         and m.id <> v_member.id
     )
  then
    raise exception 'Sekolah harus memiliki minimal satu guru BK aktif.';
  end if;

  if v_member.is_active = p_is_active then
    return;
  end if;

  if not p_is_active then
    update public.classes
    set homeroom_member_id = null
    where school_id = v_member.school_id
      and homeroom_member_id = p_member_id;
  end if;

  update public.school_members
  set is_active = p_is_active
  where id = p_member_id;

  perform public.log_audit(
    v_member.school_id,
    case when p_is_active then 'staff.reactivated' else 'staff.deactivated' end,
    'school_members',
    p_member_id::text,
    jsonb_build_object('is_active', v_member.is_active),
    jsonb_build_object('is_active', p_is_active)
  );
end;
$$;

comment on function public.set_school_member_active(uuid, boolean) is
  'BK menonaktifkan/mengaktifkan anggota. Nonaktif melepas semua penugasan wali kelas.';

-- ============================================================================
-- 5. HAK EKSEKUSI
-- ============================================================================

revoke all on function public.assign_homeroom(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.clear_homeroom(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.update_school_member(uuid, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.set_school_member_active(uuid, boolean)
  from public, anon, authenticated, service_role;

grant execute on function public.assign_homeroom(uuid, uuid) to authenticated;
grant execute on function public.clear_homeroom(uuid) to authenticated;
grant execute on function public.update_school_member(uuid, text, text, text) to authenticated;
grant execute on function public.set_school_member_active(uuid, boolean) to authenticated;

-- ============================================================================
-- 6. CEK INTEGRITAS AWAL
-- ============================================================================
-- Tidak mengubah data. Hanya memastikan tidak ada penugasan lintas sekolah
-- yang terbawa dari data lama.

do $$
begin
  if exists (
    select 1
    from public.classes c
    join public.school_members m on m.id = c.homeroom_member_id
    where m.school_id <> c.school_id
  ) then
    raise exception 'Ada wali kelas yang terhubung ke sekolah lain.';
  end if;
end;
$$;
