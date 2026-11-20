-- ============================================================================
-- SIM-BK PRO | Fase 1: Fondasi SaaS Sekolah
-- ============================================================================
-- Tujuan:
--   1. Satu database dapat menampung banyak sekolah (multi-tenant).
--   2. Data lama (546 siswa + seluruh data BK) dipindahkan ke satu sekolah
--      default tanpa kehilangan data.
--   3. Hak akses berubah dari "owner_id = auth.uid()" menjadi berbasis
--      keanggotaan sekolah dan role (BK / wali kelas).
--   4. Aplikasi lama tetap bisa menulis data selama masa transisi:
--      kolom school_id diberi default ke sekolah pertama.
--
-- PRASYARAT:
--   - schema.sql versi lama sudah pernah dijalankan.
--   - Sudah ada backup production sebelum migrasi dijalankan.
--   - Migrasi ini HANYA untuk kondisi saat ini: 0 atau 1 sekolah.
--     Jangan jalankan pada database yang sudah berisi banyak sekolah.
--
-- TIDAK diterapkan otomatis oleh commit ini. Jalankan di staging lebih dulu.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. SEKOLAH & KEANGGOTAAN
-- ============================================================================

create table public.schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  npsn              text,
  address           text,
  phone             text,
  email             text,
  logo_url          text,
  timezone          text not null default 'Asia/Makassar',

  -- Skala poin yang dipakai aplikasi. Buku panduan SMPN 34 memakai 100,
  -- aplikasi menampilkan 1000 agar lebih granular. SP tetap bisa dicetak
  -- dalam skala 100 (lihat rencana di docs/tata-tertib-poin.md).
  point_scale       integer not null default 1000
                    check (point_scale between 100 and 10000),
  sp_thresholds     integer[] not null default '{260,510,760,1000}',
  sp_basis          text not null default 'cumulative'
                    check (sp_basis in ('cumulative', 'academic_year')),
  leaderboard_mode  text not null default 'staff'
                    check (leaderboard_mode in ('off', 'staff', 'class_only', 'anonymous_public')),

  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint schools_sp_thresholds_valid check (
    cardinality(sp_thresholds) = 4
    and sp_thresholds[1] > 0
    and sp_thresholds[1] < sp_thresholds[2]
    and sp_thresholds[2] < sp_thresholds[3]
    and sp_thresholds[3] < sp_thresholds[4]
    and sp_thresholds[4] <= point_scale
  )
);

comment on table public.schools is
  'Satu baris = satu sekolah (tenant). Semua data operasional terikat ke sini.';
comment on column public.schools.point_scale is
  'Skala poin tampilan. SMPN 34 memakai 1000; buku panduan asli memakai 100.';
comment on column public.schools.sp_thresholds is
  'Ambang SP1, SP2, SP3, dan batas akhir pada skala point_scale.';
comment on column public.schools.sp_basis is
  'cumulative = SP dihitung dari poin seumur sekolah; academic_year = per tahun ajaran.';
comment on column public.schools.leaderboard_mode is
  'staff = BK semua kelas + wali kelas hanya kelasnya; class_only = agregat kelas; anonymous_public = anonim.';

create table public.school_members (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('bk', 'wali_kelas')),
  display_name  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint school_members_school_user_unique unique (school_id, user_id),
  -- Dibutuhkan composite FK dari classes agar wali kelas tidak bisa
  -- ditugaskan ke sekolah lain.
  constraint school_members_id_school_unique unique (id, school_id)
);

comment on table public.school_members is
  'Keanggotaan staf sekolah. Siswa TIDAK masuk tabel ini; siswa memakai portal QR+PIN.';

create table public.academic_years (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  name        text not null,
  starts_on   date,
  ends_on     date,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint academic_years_school_name_unique unique (school_id, name),
  constraint academic_years_range_valid check (
    starts_on is null or ends_on is null or starts_on <= ends_on
  )
);

create unique index academic_years_one_active_per_school
  on public.academic_years (school_id)
  where is_active;

create table public.semesters (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  academic_year_id  uuid not null references public.academic_years(id) on delete cascade,
  name              text not null check (name in ('Ganjil', 'Genap')),
  starts_on         date,
  ends_on           date,
  is_active         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint semesters_year_name_unique unique (academic_year_id, name),
  constraint semesters_range_valid check (
    starts_on is null or ends_on is null or starts_on <= ends_on
  )
);

create unique index semesters_one_active_per_school
  on public.semesters (school_id)
  where is_active;

create table public.classes (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools(id) on delete cascade,
  academic_year_id    uuid not null references public.academic_years(id) on delete cascade,
  name                text not null,
  level               integer check (level between 1 and 12),
  homeroom_member_id  uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint classes_school_year_name_unique unique (school_id, academic_year_id, name),
  -- Wali kelas harus dipindahkan dulu sebelum akunnya dihapus.
  constraint classes_homeroom_same_school_fk
    foreign key (homeroom_member_id, school_id)
    references public.school_members(id, school_id)
    on delete restrict
);

comment on table public.classes is
  'Kelas per tahun ajaran. Wali kelas ditunjuk lewat homeroom_member_id.';

-- ============================================================================
-- 2. KOLOM TENANT PADA TABEL LAMA
-- ============================================================================
-- Ditambahkan nullable dulu, diisi di blok migrasi, lalu dibuat NOT NULL.

alter table public.students           add column school_id uuid references public.schools(id) on delete cascade;
alter table public.students           add column class_id  uuid references public.classes(id) on delete set null;
alter table public.counseling_records add column school_id uuid references public.schools(id) on delete cascade;
alter table public.case_items         add column school_id uuid references public.schools(id) on delete cascade;
alter table public.daily_journals     add column school_id uuid references public.schools(id) on delete cascade;
alter table public.school_settings    add column school_id uuid references public.schools(id) on delete cascade;
alter table public.prota_items        add column school_id uuid references public.schools(id) on delete cascade;
alter table public.career_surveys     add column school_id uuid references public.schools(id) on delete cascade;
alter table public.akpd_tallies       add column school_id uuid references public.schools(id) on delete cascade;

-- ============================================================================
-- 3. FUNGSI BANTU
-- ============================================================================

-- Selama masa transisi, aplikasi lama belum mengirim school_id.
-- Default ini menjaga insert lama tetap jalan. Hapus setelah frontend
-- mengirim school_id secara eksplisit.
create or replace function public.default_school_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id
  from public.schools
  order by created_at asc
  limit 1;
$$;

create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.school_members m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

create or replace function public.has_school_role(p_school_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.school_members m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.is_active
      and m.role = any(p_roles)
  );
$$;

create or replace function public.is_homeroom_of(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.classes c
    join public.school_members m on m.id = c.homeroom_member_id
    where c.id = p_class_id
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

-- ============================================================================
-- 4. MIGRASI DATA LAMA KE SEKOLAH DEFAULT
-- ============================================================================

do $$
declare
  v_school_id       uuid;
  v_school_count    integer;
  v_settings_count  integer;
  v_name            text;
  v_npsn            text;
  v_address         text;
  v_phone           text;
  v_email           text;
  v_logo            text;
  v_year_name       text;
  v_year_id         uuid;
  v_year_start      date;
  v_year_end        date;
  v_semester_name   text;
  v_semester_id     uuid;
  v_semester_start  date;
  v_semester_end    date;
  v_table           text;
begin
  select count(*) into v_school_count from public.schools;
  if v_school_count > 1 then
    raise exception
      'Migrasi Fase 1 hanya untuk 0 atau 1 sekolah. Ditemukan % sekolah.',
      v_school_count;
  end if;

  select count(*) into v_settings_count from public.school_settings;
  if v_settings_count > 1 then
    raise exception
      'school_settings berisi % baris. Migrasi ini mengharapkan maksimal 1 baris.',
      v_settings_count;
  end if;

  select nama_sekolah, npsn, alamat, telepon_sekolah, email_sekolah, logo_url, tahun_ajaran
    into v_name, v_npsn, v_address, v_phone, v_email, v_logo, v_year_name
  from public.school_settings
  limit 1;

  v_name := coalesce(nullif(trim(v_name), ''), 'SMP Negeri 34 Makassar');

  select id into v_school_id
  from public.schools
  order by created_at asc
  limit 1;

  if v_school_id is null then
    v_school_id := '00000000-0000-4000-8000-000000000034'::uuid;

    insert into public.schools (id, name, npsn, address, phone, email, logo_url)
    values (
      v_school_id,
      v_name,
      nullif(trim(v_npsn), ''),
      nullif(trim(v_address), ''),
      nullif(trim(v_phone), ''),
      nullif(trim(v_email), ''),
      nullif(trim(v_logo), '')
    );
  end if;

  -- Tahun ajaran aktif: ambil dari pengaturan lama, fallback 2026/2027.
  v_year_name := coalesce(nullif(trim(v_year_name), ''), '2026/2027');

  -- Rentang tahun ajaran: Juli tahun pertama s.d. Juni tahun berikutnya.
  -- Tanpa rentang ini, resolve_period() tidak bisa memetakan pelanggaran
  -- yang diisi mundur (backdate) ke tahun ajaran yang benar.
  if v_year_name ~ '^[0-9]{4}' then
    v_year_start := make_date(substring(v_year_name from 1 for 4)::integer, 7, 1);
  elsif extract(month from current_date) >= 7 then
    v_year_start := make_date(extract(year from current_date)::integer, 7, 1);
  else
    v_year_start := make_date(extract(year from current_date)::integer - 1, 7, 1);
  end if;
  v_year_end := make_date(extract(year from v_year_start)::integer + 1, 6, 30);

  update public.academic_years
  set is_active = false
  where school_id = v_school_id and is_active;

  insert into public.academic_years (
    school_id, name, starts_on, ends_on, is_active
  )
  values (v_school_id, v_year_name, v_year_start, v_year_end, true)
  on conflict (school_id, name)
  do update set
    is_active = true,
    starts_on = coalesce(public.academic_years.starts_on, excluded.starts_on),
    ends_on   = coalesce(public.academic_years.ends_on, excluded.ends_on)
  returning id into v_year_id;

  -- Semester aktif mengikuti bulan berjalan: Jul-Des = Ganjil, Jan-Jun = Genap.
  v_semester_name := case
    when extract(month from current_date) between 7 and 12 then 'Ganjil'
    else 'Genap'
  end;

  if v_semester_name = 'Ganjil' then
    v_semester_start := v_year_start;
    v_semester_end := make_date(extract(year from v_year_start)::integer, 12, 31);
  else
    v_semester_start := make_date(extract(year from v_year_start)::integer + 1, 1, 1);
    v_semester_end := v_year_end;
  end if;

  update public.semesters
  set is_active = false
  where school_id = v_school_id and is_active;

  insert into public.semesters (
    school_id, academic_year_id, name, starts_on, ends_on, is_active
  )
  values (
    v_school_id, v_year_id, v_semester_name,
    v_semester_start, v_semester_end, true
  )
  on conflict (academic_year_id, name)
  do update set
    is_active = true,
    starts_on = coalesce(public.semesters.starts_on, excluded.starts_on),
    ends_on   = coalesce(public.semesters.ends_on, excluded.ends_on)
  returning id into v_semester_id;

  -- Isi school_id pada seluruh tabel lama.
  foreach v_table in array array[
    'students',
    'counseling_records',
    'case_items',
    'daily_journals',
    'school_settings',
    'prota_items',
    'career_surveys',
    'akpd_tallies'
  ]
  loop
    execute format(
      'update public.%I set school_id = $1 where school_id is null',
      v_table
    ) using v_school_id;

    execute format(
      'alter table public.%I alter column school_id set not null',
      v_table
    );

    execute format(
      'alter table public.%I alter column school_id set default public.default_school_id()',
      v_table
    );
  end loop;

  -- Bentuk kelas dari kolom teks "kelas" yang sudah ada.
  insert into public.classes (school_id, academic_year_id, name, level)
  select
    v_school_id,
    v_year_id,
    upper(regexp_replace(s.kelas, '[^0-9A-Za-z]', '', 'g')) as class_name,
    nullif(left(regexp_replace(s.kelas, '[^0-9]', '', 'g'), 1), '')::integer as level
  from public.students s
  where s.school_id = v_school_id
    and s.kelas is not null
    and trim(s.kelas) <> ''
  group by 1, 2, 3, 4
  on conflict (school_id, academic_year_id, name) do nothing;

  update public.students s
  set class_id = c.id
  from public.classes c
  where s.school_id = v_school_id
    and s.class_id is null
    and c.school_id = v_school_id
    and c.academic_year_id = v_year_id
    and c.name = upper(regexp_replace(s.kelas, '[^0-9A-Za-z]', '', 'g'));

  -- Pemilik data lama menjadi BK di sekolah default.
  insert into public.school_members (school_id, user_id, role)
  select v_school_id, owners.owner_id, 'bk'
  from (
    select owner_id from public.students
    union
    select owner_id from public.counseling_records
    union
    select owner_id from public.case_items
    union
    select owner_id from public.daily_journals
    union
    select owner_id from public.school_settings
    union
    select owner_id from public.prota_items
    union
    select owner_id from public.career_surveys
    union
    select owner_id from public.akpd_tallies
  ) owners
  where owners.owner_id is not null
  on conflict (school_id, user_id) do nothing;
end $$;

-- Satu baris pengaturan per sekolah.
create unique index school_settings_school_unique
  on public.school_settings (school_id);

-- ============================================================================
-- 5. SINKRONISASI KELAS SAAT APLIKASI LAMA MENYIMPAN SISWA
-- ============================================================================
-- Aplikasi lama hanya mengirim kolom "kelas". Trigger ini mengisi class_id
-- agar wali kelas langsung bisa melihat siswa tanpa menunggu update frontend.

create or replace function public.sync_student_class()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_year_id uuid;
begin
  if new.school_id is null then
    new.school_id := public.default_school_id();
  end if;

  -- Bila kelas atau sekolah berubah, class_id lama tidak boleh dipertahankan.
  if tg_op = 'UPDATE'
     and (new.kelas is distinct from old.kelas
          or new.school_id is distinct from old.school_id) then
    new.class_id := null;
  end if;

  if new.class_id is null and new.kelas is not null and trim(new.kelas) <> '' then
    select id into v_year_id
    from public.academic_years
    where school_id = new.school_id
      and is_active
    limit 1;

    if v_year_id is not null then
      select c.id into new.class_id
      from public.classes c
      where c.school_id = new.school_id
        and c.academic_year_id = v_year_id
        and c.name = upper(regexp_replace(new.kelas, '[^0-9A-Za-z]', '', 'g'))
      limit 1;

      -- Kelas baru (mis. rombel tambahan) dibuat otomatis agar siswa
      -- langsung terlihat oleh wali kelasnya.
      if new.class_id is null then
        insert into public.classes (school_id, academic_year_id, name, level)
        values (
          new.school_id,
          v_year_id,
          upper(regexp_replace(new.kelas, '[^0-9A-Za-z]', '', 'g')),
          nullif(left(regexp_replace(new.kelas, '[^0-9]', '', 'g'), 1), '')::integer
        )
        on conflict (school_id, academic_year_id, name)
        do update set name = excluded.name
        returning id into new.class_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_students_sync_class
  before insert or update of kelas, school_id on public.students
  for each row execute function public.sync_student_class();

-- ============================================================================
-- 6. TIMESTAMP OTOMATIS
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_schools_updated_at
  before update on public.schools
  for each row execute function public.set_updated_at();

create trigger trg_school_members_updated_at
  before update on public.school_members
  for each row execute function public.set_updated_at();

create trigger trg_academic_years_updated_at
  before update on public.academic_years
  for each row execute function public.set_updated_at();

create trigger trg_semesters_updated_at
  before update on public.semesters
  for each row execute function public.set_updated_at();

create trigger trg_classes_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

alter table public.schools          enable row level security;
alter table public.school_members   enable row level security;
alter table public.academic_years   enable row level security;
alter table public.semesters        enable row level security;
alter table public.classes          enable row level security;

-- Hapus kebijakan lama berbasis owner_id.
drop policy if exists owner_all_students    on public.students;
drop policy if exists owner_all_counseling  on public.counseling_records;
drop policy if exists owner_all_cases       on public.case_items;
drop policy if exists owner_all_journals    on public.daily_journals;
drop policy if exists owner_all_settings    on public.school_settings;
drop policy if exists owner_all_prota       on public.prota_items;
drop policy if exists owner_all_career      on public.career_surveys;
drop policy if exists owner_all_akpd        on public.akpd_tallies;

-- Sekolah: anggota boleh membaca, BK boleh mengubah.
create policy schools_member_read
  on public.schools for select to authenticated
  using (public.is_school_member(id));

create policy schools_bk_update
  on public.schools for update to authenticated
  using (public.has_school_role(id, array['bk']))
  with check (public.has_school_role(id, array['bk']));

-- Keanggotaan: diri sendiri atau BK sekolah tersebut.
create policy school_members_self_or_bk_read
  on public.school_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_school_role(school_id, array['bk'])
  );

create policy school_members_bk_write
  on public.school_members for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

-- Tahun ajaran, semester, kelas: semua anggota boleh membaca; BK menulis.
create policy academic_years_member_read
  on public.academic_years for select to authenticated
  using (public.is_school_member(school_id));

create policy academic_years_bk_write
  on public.academic_years for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy semesters_member_read
  on public.semesters for select to authenticated
  using (public.is_school_member(school_id));

create policy semesters_bk_write
  on public.semesters for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy classes_member_read
  on public.classes for select to authenticated
  using (public.is_school_member(school_id));

create policy classes_bk_write
  on public.classes for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

-- Siswa: BK semua; wali kelas hanya kelas yang diampu.
create policy students_bk_all
  on public.students for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy students_wali_read
  on public.students for select to authenticated
  using (
    public.has_school_role(school_id, array['wali_kelas'])
    and class_id is not null
    and public.is_homeroom_of(class_id)
  );

-- Data konseling, kasus, jurnal, prota, karir, AKPD:
-- Fase 1 tetap BK-only. Wali kelas baru mendapat akses ke modul
-- kedisiplinan pada Fase 2.
create policy counseling_bk_all
  on public.counseling_records for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy cases_bk_all
  on public.case_items for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy journals_bk_all
  on public.daily_journals for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy prota_bk_all
  on public.prota_items for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy career_bk_all
  on public.career_surveys for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

create policy akpd_bk_all
  on public.akpd_tallies for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

-- Pengaturan sekolah: semua anggota boleh membaca (perlu kop surat),
-- hanya BK yang boleh mengubah.
create policy settings_member_read
  on public.school_settings for select to authenticated
  using (public.is_school_member(school_id));

create policy settings_bk_write
  on public.school_settings for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

-- ============================================================================
-- 8. INDEKS
-- ============================================================================

create index idx_school_members_school  on public.school_members (school_id);
create index idx_school_members_user    on public.school_members (user_id) where is_active;
create index idx_academic_years_school  on public.academic_years (school_id);
create index idx_semesters_school       on public.semesters (school_id, academic_year_id);
create index idx_classes_school_year    on public.classes (school_id, academic_year_id);
create index idx_classes_homeroom       on public.classes (homeroom_member_id);

create index idx_students_school        on public.students (school_id);
create index idx_students_class         on public.students (class_id);
create index idx_students_school_nis    on public.students (school_id, nis);
create index idx_counseling_school      on public.counseling_records (school_id);
create index idx_cases_school           on public.case_items (school_id);
create index idx_journals_school        on public.daily_journals (school_id);
create index idx_prota_school           on public.prota_items (school_id);
create index idx_career_school          on public.career_surveys (school_id);
create index idx_akpd_school            on public.akpd_tallies (school_id);

-- ============================================================================
-- 9. HAK AKSES & FUNGSI BOOTSTRAP
-- ============================================================================

revoke all on public.schools        from anon;
revoke all on public.school_members from anon;
revoke all on public.academic_years from anon;
revoke all on public.semesters      from anon;
revoke all on public.classes        from anon;

grant select, insert, update, delete
  on public.schools, public.school_members, public.academic_years,
     public.semesters, public.classes
  to authenticated;

revoke all on function public.default_school_id() from public;
revoke all on function public.is_school_member(uuid) from public;
revoke all on function public.has_school_role(uuid, text[]) from public;
revoke all on function public.is_homeroom_of(uuid) from public;

grant execute on function public.default_school_id() to authenticated, service_role;
grant execute on function public.is_school_member(uuid) to authenticated, service_role;
grant execute on function public.has_school_role(uuid, text[]) to authenticated, service_role;
grant execute on function public.is_homeroom_of(uuid) to authenticated, service_role;

-- Untuk instalasi baru yang belum punya anggota sama sekali.
-- User pertama yang login boleh mengklaim sekolah kosong sebagai BK.
create or replace function public.claim_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'Sekolah tidak ditemukan.';
  end if;

  if exists (select 1 from public.school_members where school_id = p_school_id) then
    raise exception 'Sekolah sudah memiliki anggota.';
  end if;

  insert into public.school_members (school_id, user_id, role)
  values (p_school_id, auth.uid(), 'bk');
end;
$$;

revoke all on function public.claim_school(uuid) from public;
grant execute on function public.claim_school(uuid) to authenticated, service_role;

comment on function public.claim_school(uuid) is
  'Klaim sekolah kosong sebagai BK. Hanya berhasil bila belum ada anggota.';

commit;

-- ============================================================================
-- CATATAN PASCA-MIGRASI
-- ============================================================================
-- 1. Semua data lama berada di sekolah:
--      00000000-0000-4000-8000-000000000034
-- 2. Pemilik data lama otomatis menjadi BK.
-- 3. Kolom owner_id sengaja dipertahankan sementara agar aplikasi lama
--    tidak rusak. Kolom ini tidak lagi dipakai untuk RLS dan bisa dihapus
--    pada migrasi berikutnya setelah frontend selesai diperbarui.
-- 4. school_id punya DEFAULT ke sekolah pertama selama masa transisi.
--    Hapus default tersebut setelah frontend selalu mengirim school_id.
-- 5. Jalankan supabase/verify/phase1.sql untuk memeriksa hasil migrasi.
-- ============================================================================
