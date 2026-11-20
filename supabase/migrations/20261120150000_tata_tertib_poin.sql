-- ============================================================================
-- SIM-BK PRO | Fase 2: Aturan, Pelanggaran, Ledger Poin, SP, Kartu QR
-- ============================================================================
-- Prasyarat: 20261120140000_saas_foundation.sql sudah diterapkan.
--
-- Isi:
--   1. Master aturan (39 aturan SMPN 34, bisa diedit sekolah).
--   2. Catatan pelanggaran dengan snapshot aturan.
--   3. Ledger poin immutable (koreksi = baris baru).
--   4. SP1/SP2/SP3/pleno (draft otomatis, nomor saat terbit).
--   5. Kartu siswa QR + PIN (token dan PIN disimpan sebagai hash).
--   6. Audit log.
--   7. View poin, leaderboard, kelas, dan SP pending.
--   8. RPC pencatatan, pembatalan, penerbitan SP, dan kartu siswa.
--
-- TIDAK diterapkan otomatis. Jalankan di staging lebih dulu.
-- ============================================================================

begin;

-- ============================================================================
-- 1. KUNCI UNIK UNTUK FOREIGN KEY LINTAS SEKOLAH
-- ============================================================================
-- Tujuannya agar siswa, tahun ajaran, semester, dan aturan tidak bisa
-- dihubungkan ke sekolah lain lewat UUID/text yang salah.

alter table public.students
  add constraint students_id_school_unique unique (id, school_id);

alter table public.academic_years
  add constraint academic_years_id_school_unique unique (id, school_id);

alter table public.semesters
  add constraint semesters_id_school_unique unique (id, school_id);

-- ============================================================================
-- 2. MASTER ATURAN
-- ============================================================================

create table public.violation_rules (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null default public.default_school_id()
                      references public.schools(id) on delete cascade,
  code                text not null,
  category            text not null
                      check (category in ('kewajiban', 'ringan', 'sedang', 'berat', 'sangat_berat')),
  name                text not null,
  description         text,
  points              integer not null check (points > 0),
  guidebook_points    integer not null check (guidebook_points > 0),
  default_sanction    text,
  sanction_tiers      jsonb not null default '[]'::jsonb,
  sp_override         smallint check (sp_override between 1 and 3),
  is_expulsion        boolean not null default false,
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint violation_rules_school_code_unique unique (school_id, code),
  constraint violation_rules_id_school_unique unique (id, school_id)
);

comment on table public.violation_rules is
  'Master aturan disiplin per sekolah. Sekolah lain bebas mengubah nama, poin, dan sanksi.';
comment on column public.violation_rules.points is
  'Poin pada skala sekolah (default 1000). Untuk SMPN 34 = guidebook_points x 10.';
comment on column public.violation_rules.guidebook_points is
  'Poin asli buku panduan (skala 100) untuk cetak surat SP.';
comment on column public.violation_rules.sp_override is
  'Minimal SP yang wajib dibuat walau total poin belum mencapai ambang (1=SP1, 2=SP2, 3=SP3).';
comment on column public.violation_rules.is_expulsion is
  'Pelanggaran mutlak: langsung membuat draft sidang pleno.';

create index idx_violation_rules_school
  on public.violation_rules (school_id, category, sort_order)
  where is_active;

-- ============================================================================
-- 3. CATATAN PELANGGARAN
-- ============================================================================
-- Semua kolom aturan disalin (snapshot) saat pencatatan. Jika master aturan
-- diedit kemudian, riwayat dan SP lama tidak berubah.

create table public.violation_records (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null default public.default_school_id()
                          references public.schools(id) on delete cascade,
  student_id              text not null,
  rule_id                 uuid not null,

  rule_code               text not null,
  rule_name               text not null,
  rule_category           text not null,
  rule_points             integer not null check (rule_points > 0),
  rule_guidebook_points   integer not null check (rule_guidebook_points > 0),
  rule_sp_override        smallint,
  rule_is_expulsion       boolean not null default false,

  occurred_at             timestamptz not null default now(),
  academic_year_id        uuid not null,
  semester_id             uuid not null,
  location                text,
  chronology              text,
  evidence_paths          text[] not null default '{}',
  reported_by_member_id   uuid references public.school_members(id) on delete set null,
  reported_by_name        text,
  status                  text not null default 'recorded'
                          check (status in ('recorded', 'verified', 'void')),
  verified_by_member_id   uuid references public.school_members(id) on delete set null,
  verified_at             timestamptz,
  void_reason             text,
  voided_by_member_id     uuid references public.school_members(id) on delete set null,
  voided_at               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint violation_records_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete restrict,
  constraint violation_records_rule_school_fk
    foreign key (rule_id, school_id)
    references public.violation_rules(id, school_id) on delete restrict,
  constraint violation_records_year_school_fk
    foreign key (academic_year_id, school_id)
    references public.academic_years(id, school_id) on delete restrict,
  constraint violation_records_semester_school_fk
    foreign key (semester_id, school_id)
    references public.semesters(id, school_id) on delete restrict
);

comment on table public.violation_records is
  'Catatan pelanggaran terstruktur. Ditulis hanya lewat RPC record_violation.';
comment on column public.violation_records.rule_points is
  'Snapshot poin saat kejadian; tidak berubah bila master aturan diedit.';

create index idx_violation_records_student
  on public.violation_records (school_id, student_id, occurred_at desc);
create index idx_violation_records_semester
  on public.violation_records (school_id, semester_id, occurred_at desc);
create index idx_violation_records_rule
  on public.violation_records (school_id, rule_id);
create index idx_violation_records_status
  on public.violation_records (school_id, status);

-- ============================================================================
-- 4. LEDGER POIN
-- ============================================================================
-- Sumber kebenaran perhitungan poin. Baris tidak boleh diubah atau dihapus.
-- Pembatalan pelanggaran membuat baris koreksi baru.
--
-- Konvensi tanda:
--   violation  : points_delta positif  (menambah poin pelanggaran)
--   correction : points_delta negatif  (mengurangi poin pelanggaran)
--   achievement: points_delta positif  (poin prestasi, BUCKET TERPISAH)
--
-- Hanya violation + correction yang dihitung sebagai poin pelanggaran.

create table public.point_ledger (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null default public.default_school_id()
                        references public.schools(id) on delete cascade,
  student_id            text not null,
  violation_record_id   uuid references public.violation_records(id) on delete restrict,

  entry_type            text not null
                        check (entry_type in ('violation', 'correction', 'achievement')),
  points_delta          integer not null,
  guidebook_delta       integer not null default 0,
  violation_delta       integer generated always as (
                          case when entry_type = 'achievement' then 0 else points_delta end
                        ) stored,
  balance_after         integer not null,

  academic_year_id      uuid not null,
  semester_id           uuid not null,
  occurred_at           timestamptz not null default now(),
  reason                text,
  created_by            uuid references public.school_members(id) on delete set null,
  created_at            timestamptz not null default now(),

  constraint point_ledger_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete restrict,
  constraint point_ledger_year_school_fk
    foreign key (academic_year_id, school_id)
    references public.academic_years(id, school_id) on delete restrict,
  constraint point_ledger_semester_school_fk
    foreign key (semester_id, school_id)
    references public.semesters(id, school_id) on delete restrict,
  constraint point_ledger_delta_sign check (
    (entry_type = 'violation'   and points_delta > 0) or
    (entry_type = 'correction'  and points_delta < 0) or
    (entry_type = 'achievement' and points_delta > 0)
  ),
  constraint point_ledger_guidebook_sign check (
    (entry_type = 'violation'   and guidebook_delta > 0) or
    (entry_type = 'correction'  and guidebook_delta < 0) or
    (entry_type = 'achievement' and guidebook_delta = 0)
  )
);

comment on table public.point_ledger is
  'Ledger poin immutable. Koreksi dan pembatalan selalu berupa baris baru.';
comment on column public.point_ledger.balance_after is
  'Sisa poin saat baris dicatat (point_scale - total pelanggaran). Boleh negatif untuk audit.';
comment on column public.point_ledger.violation_delta is
  'Delta yang dihitung untuk poin pelanggaran; achievement selalu 0.';

create index idx_point_ledger_student
  on public.point_ledger (school_id, student_id, occurred_at desc);
create index idx_point_ledger_semester
  on public.point_ledger (school_id, semester_id);
create index idx_point_ledger_record
  on public.point_ledger (violation_record_id);

-- Satu pelanggaran hanya boleh punya satu baris violation dan satu koreksi.
create unique index point_ledger_one_entry_per_type
  on public.point_ledger (violation_record_id, entry_type)
  where violation_record_id is not null;

-- ============================================================================
-- 5. SURAT SP
-- ============================================================================

create table public.sp_letters (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null default public.default_school_id()
                          references public.schools(id) on delete cascade,
  student_id              text not null,

  type                    text not null check (type in ('sp1', 'sp2', 'sp3', 'pleno')),
  sequence                integer not null default 1 check (sequence > 0),
  number                  text,
  academic_year_id        uuid not null,
  semester_id             uuid,

  threshold_points        integer not null check (threshold_points > 0),
  total_points            integer not null,
  total_guidebook_points  integer not null,

  status                  text not null default 'draft'
                          check (status in ('draft', 'issued', 'cancelled')),
  is_manual               boolean not null default false,
  is_override             boolean not null default false,
  manual_reason           text,
  trigger_record_id       uuid references public.violation_records(id) on delete set null,

  meeting_at              timestamptz,
  snapshot                jsonb not null default '{}'::jsonb,
  pdf_path                text,

  created_by              uuid references public.school_members(id) on delete set null,
  issued_by               uuid references public.school_members(id) on delete set null,
  issued_at               timestamptz,
  cancelled_by            uuid references public.school_members(id) on delete set null,
  cancelled_at            timestamptz,
  cancel_reason           text,
  acknowledged_at         timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint sp_letters_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete restrict,
  constraint sp_letters_year_school_fk
    foreign key (academic_year_id, school_id)
    references public.academic_years(id, school_id) on delete restrict,
  constraint sp_letters_semester_school_fk
    foreign key (semester_id, school_id)
    references public.semesters(id, school_id) on delete restrict,
  constraint sp_letters_school_student_type_seq_unique
    unique (school_id, student_id, type, sequence)
);

comment on table public.sp_letters is
  'SP1-SP3 dan sidang pleno. Draft dibuat otomatis; penerbitan dan nomor lewat RPC.';
comment on column public.sp_letters.is_override is
  'Draft dibuat karena aturan override/expulsion, sehingga boleh terbit walau poin di bawah ambang jenis SP.';
comment on column public.sp_letters.snapshot is
  'Snapshot identitas sekolah, siswa, dan daftar pelanggaran saat surat dibuat/diterbitkan.';

create unique index sp_letters_number_unique
  on public.sp_letters (school_id, academic_year_id, number)
  where number is not null;

create unique index sp_letters_one_draft_per_type
  on public.sp_letters (school_id, student_id, type)
  where status = 'draft';

create index idx_sp_letters_student
  on public.sp_letters (school_id, student_id, created_at desc);
create index idx_sp_letters_status
  on public.sp_letters (school_id, status, created_at desc);

-- ============================================================================
-- 6. KARTU SISWA (QR + PIN)
-- ============================================================================

create table public.student_cards (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null default public.default_school_id()
                    references public.schools(id) on delete cascade,
  student_id        text not null,
  token_hash        text not null unique,
  pin_hash          text not null,
  status            text not null default 'active'
                    check (status in ('active', 'revoked', 'lost')),
  failed_attempts   integer not null default 0 check (failed_attempts >= 0),
  locked_until      timestamptz,
  last_used_at      timestamptz,
  issued_at         timestamptz not null default now(),
  created_by        uuid references public.school_members(id) on delete set null,
  revoked_at        timestamptz,
  revoked_by        uuid references public.school_members(id) on delete set null,
  revoked_reason    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint student_cards_student_school_fk
    foreign key (student_id, school_id)
    references public.students(id, school_id) on delete cascade
);

comment on table public.student_cards is
  'Kartu QR siswa. Token asli dan PIN tidak pernah disimpan; hanya hash-nya.';
comment on column public.student_cards.token_hash is
  'SHA-256 dari token SIMBK1:<128-bit>. Token asli hanya dikembalikan sekali saat dibuat.';

create unique index student_cards_one_active
  on public.student_cards (school_id, student_id)
  where status = 'active';

create index idx_student_cards_student
  on public.student_cards (school_id, student_id);

-- ============================================================================
-- 7. AUDIT LOG
-- ============================================================================

create table public.audit_log (
  id              bigint generated always as identity primary key,
  school_id       uuid not null references public.schools(id) on delete cascade,
  actor_id        uuid references auth.users(id) on delete set null,
  actor_member_id uuid references public.school_members(id) on delete set null,
  action          text not null,
  table_name      text not null,
  record_id       text,
  before_data     jsonb,
  after_data      jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.audit_log is
  'Jejak perubahan penting: pencatatan/pembatalan pelanggaran, SP, dan kartu.';

create index idx_audit_log_school on public.audit_log (school_id, created_at desc);
create index idx_audit_log_record on public.audit_log (table_name, record_id);

-- ============================================================================
-- 8. TIMESTAMP OTOMATIS
-- ============================================================================

create trigger trg_violation_rules_updated_at
  before update on public.violation_rules
  for each row execute function public.set_updated_at();

create trigger trg_violation_records_updated_at
  before update on public.violation_records
  for each row execute function public.set_updated_at();

create trigger trg_sp_letters_updated_at
  before update on public.sp_letters
  for each row execute function public.set_updated_at();

create trigger trg_student_cards_updated_at
  before update on public.student_cards
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 9. FUNGSI BANTU
-- ============================================================================

-- Wali kelas hanya boleh membaca data siswa di kelas yang diampu.
-- SECURITY DEFINER agar tidak terjadi rekursi RLS saat dipakai di policy.
create or replace function public.is_wali_of_student(
  p_student_id text,
  p_school_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.students s
    join public.classes c
      on c.id = s.class_id
     and c.school_id = s.school_id
    join public.school_members m
      on m.id = c.homeroom_member_id
     and m.school_id = c.school_id
    where s.id = p_student_id
      and s.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

create or replace function public.log_audit(
  p_school_id uuid,
  p_action text,
  p_table_name text,
  p_record_id text,
  p_before jsonb default null,
  p_after jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
begin
  select id into v_member_id
  from public.school_members
  where school_id = p_school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  insert into public.audit_log (
    school_id, actor_id, actor_member_id, action, table_name,
    record_id, before_data, after_data
  )
  values (
    p_school_id, auth.uid(), v_member_id, p_action, p_table_name,
    p_record_id, p_before, p_after
  );
end;
$$;

-- ============================================================================
-- 10. LEDGER: SALDO, IMMUTABILITAS, DAN PEMBUATAN SP
-- ============================================================================

-- Hitung balance_after saat baris ledger dibuat. Advisory lock per siswa
-- membuat dua pencatatan bersamaan tidak menghasilkan saldo yang sama.
create or replace function public.set_point_ledger_balance()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_scale  integer;
  v_total  integer;
  v_delta  integer;
begin
  perform pg_advisory_xact_lock(
    hashtext(new.school_id::text),
    hashtext(new.student_id)
  );

  select point_scale into v_scale
  from public.schools
  where id = new.school_id;

  if v_scale is null then
    raise exception 'Sekolah % tidak ditemukan.', new.school_id;
  end if;

  select coalesce(sum(violation_delta), 0) into v_total
  from public.point_ledger
  where school_id = new.school_id
    and student_id = new.student_id;

  v_delta := case
    when new.entry_type = 'achievement' then 0
    else new.points_delta
  end;

  new.balance_after := v_scale - (v_total + v_delta);
  return new;
end;
$$;

create trigger trg_point_ledger_balance
  before insert on public.point_ledger
  for each row execute function public.set_point_ledger_balance();

create or replace function public.prevent_point_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'point_ledger bersifat immutable. Buat baris koreksi baru, jangan ubah/hapus baris lama.';
end;
$$;

create trigger trg_point_ledger_immutable
  before update or delete on public.point_ledger
  for each row execute function public.prevent_point_ledger_mutation();

-- Bangun snapshot surat: identitas sekolah, siswa, dan daftar pelanggaran.
-- p_academic_year_id null = kumulatif; terisi = hanya tahun ajaran tersebut.
create or replace function public.build_sp_snapshot(
  p_school_id uuid,
  p_student_id text,
  p_type text,
  p_threshold_points integer,
  p_total_points integer,
  p_total_guidebook_points integer,
  p_academic_year_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_school      jsonb;
  v_student     jsonb;
  v_violations  jsonb;
  v_basis       text;
  v_point_scale integer;
begin
  select sp_basis, point_scale into v_basis, v_point_scale
  from public.schools
  where id = p_school_id;

  select jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'npsn', s.npsn,
    'address', s.address,
    'phone', s.phone,
    'email', s.email,
    'logo_url', s.logo_url,
    'kepala_sekolah', ss.kepala_sekolah,
    'nip_kepala', ss.nip_kepala,
    'guru_bk', ss.guru_bk,
    'nip_guru_bk', ss.nip_guru_bk,
    'kota_surat', ss.kota_surat
  )
  into v_school
  from public.schools s
  left join public.school_settings ss on ss.school_id = s.id
  where s.id = p_school_id;

  select jsonb_build_object(
    'id', st.id,
    'nama', st.nama,
    'nis', st.nis,
    'nisn', st.nisn,
    'jk', st.jk,
    'kelas', st.kelas,
    'nama_wali', st.nama_wali,
    'alamat', st.alamat,
    'class_id', st.class_id
  )
  into v_student
  from public.students st
  where st.id = p_student_id
    and st.school_id = p_school_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', vr.id,
        'occurred_at', vr.occurred_at,
        'rule_code', vr.rule_code,
        'rule_name', vr.rule_name,
        'category', vr.rule_category,
        'points', vr.rule_points,
        'guidebook_points', vr.rule_guidebook_points,
        'location', vr.location,
        'chronology', vr.chronology,
        'reported_by', vr.reported_by_name
      )
      order by vr.occurred_at, vr.created_at
    ),
    '[]'::jsonb
  )
  into v_violations
  from public.violation_records vr
  where vr.school_id = p_school_id
    and vr.student_id = p_student_id
    and vr.status <> 'void'
    and (
      p_academic_year_id is null
      or vr.academic_year_id = p_academic_year_id
    );

  return jsonb_build_object(
    'generated_at', now(),
    'basis', v_basis,
    'academic_year_id', p_academic_year_id,
    'point_scale', v_point_scale,
    'sp', jsonb_build_object(
      'type', p_type,
      'threshold_points', p_threshold_points,
      'total_points', p_total_points,
      'total_guidebook_points', p_total_guidebook_points
    ),
    'school', v_school,
    'student', v_student,
    'violations', v_violations
  );
end;
$$;

-- Buat draft SP bila ambang terlewati. Idempoten: satu draft per jenis.
-- Aturan override (mis. melawan guru fisik = SP3) dapat menaikkan jenis SP.
create or replace function public.maybe_create_sp_draft(
  p_school_id uuid,
  p_student_id text,
  p_trigger_record_id uuid,
  p_rule_sp_override smallint,
  p_rule_is_expulsion boolean,
  p_academic_year_id uuid,
  p_semester_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_thresholds  integer[];
  v_basis       text;
  v_total       integer;
  v_guide_total integer;
  v_scope_year  uuid;
  v_type        text;
  v_tier        integer;
  v_threshold   integer;
  v_sequence    integer;
  v_sp_id       uuid;
  v_override_tier integer;
  v_is_override boolean := false;
  v_snapshot    jsonb;
  v_member_id   uuid;
begin
  select sp_thresholds, sp_basis
    into v_thresholds, v_basis
  from public.schools
  where id = p_school_id;

  if v_thresholds is null then
    raise exception 'Sekolah % tidak ditemukan.', p_school_id;
  end if;

  if v_basis = 'academic_year' then
    v_scope_year := p_academic_year_id;
  else
    v_scope_year := null;
  end if;

  select
    coalesce(sum(violation_delta), 0),
    coalesce(sum(guidebook_delta), 0)
  into v_total, v_guide_total
  from public.point_ledger
  where school_id = p_school_id
    and student_id = p_student_id
    and (v_scope_year is null or academic_year_id = v_scope_year);

  if p_rule_is_expulsion then
    v_type := 'pleno';
    v_is_override := true;
  else
    if v_total >= v_thresholds[4] then
      v_type := 'pleno';
    elsif v_total >= v_thresholds[3] then
      v_type := 'sp3';
    elsif v_total >= v_thresholds[2] then
      v_type := 'sp2';
    elsif v_total >= v_thresholds[1] then
      v_type := 'sp1';
    end if;

    if p_rule_sp_override is not null then
      v_override_tier := p_rule_sp_override;
      if v_type is null
         or v_override_tier > (case v_type
             when 'sp1' then 1
             when 'sp2' then 2
             when 'sp3' then 3
             else 4
           end) then
        v_type := 'sp' || v_override_tier::text;
        v_is_override := true;
      end if;
    end if;
  end if;

  if v_type is null then
    return null;
  end if;

  -- Sudah ada draft/terbit untuk jenis ini? Jangan buat duplikat.
  if exists (
    select 1
    from public.sp_letters
    where school_id = p_school_id
      and student_id = p_student_id
      and type = v_type
      and status in ('draft', 'issued')
  ) then
    return null;
  end if;

  v_tier := case v_type
    when 'sp1' then 1
    when 'sp2' then 2
    when 'sp3' then 3
    else 4
  end;
  v_threshold := v_thresholds[v_tier];

  select coalesce(max(sequence), 0) + 1
    into v_sequence
  from public.sp_letters
  where school_id = p_school_id
    and student_id = p_student_id
    and type = v_type;

  v_snapshot := public.build_sp_snapshot(
    p_school_id,
    p_student_id,
    v_type,
    v_threshold,
    v_total,
    v_guide_total,
    v_scope_year
  );

  select id into v_member_id
  from public.school_members
  where school_id = p_school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  insert into public.sp_letters (
    school_id, student_id, type, sequence, academic_year_id, semester_id,
    threshold_points, total_points, total_guidebook_points, status,
    is_override, trigger_record_id, snapshot, created_by
  )
  values (
    p_school_id, p_student_id, v_type, v_sequence, p_academic_year_id, p_semester_id,
    v_threshold, v_total, v_guide_total, 'draft',
    v_is_override, p_trigger_record_id, v_snapshot, v_member_id
  )
  returning id into v_sp_id;

  perform public.log_audit(
    p_school_id,
    'sp.draft_created',
    'sp_letters',
    v_sp_id::text,
    null,
    jsonb_build_object(
      'type', v_type,
      'total_points', v_total,
      'threshold_points', v_threshold,
      'is_override', v_is_override,
      'trigger_record_id', p_trigger_record_id
    )
  );

  return v_sp_id;
end;
$$;

create or replace function public.trg_point_ledger_sp()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record public.violation_records%rowtype;
begin
  if new.entry_type <> 'violation' or new.points_delta <= 0 then
    return new;
  end if;

  if new.violation_record_id is null then
    return new;
  end if;

  select * into v_record
  from public.violation_records
  where id = new.violation_record_id;

  if not found then
    return new;
  end if;

  perform public.maybe_create_sp_draft(
    new.school_id,
    new.student_id,
    new.violation_record_id,
    v_record.rule_sp_override,
    v_record.rule_is_expulsion,
    new.academic_year_id,
    new.semester_id
  );

  return new;
end;
$$;

create trigger trg_point_ledger_sp
  after insert on public.point_ledger
  for each row execute function public.trg_point_ledger_sp();

-- ============================================================================
-- 11. RPC PENCATATAN & PEMBATALAN PELANGGARAN
-- ============================================================================

-- Hitung tahun ajaran dan semester dari tanggal kejadian.
-- Bila tanggal tidak masuk rentang mana pun, pakai tahun/semester aktif.
create or replace function public.resolve_period(
  p_school_id uuid,
  p_occurred_at timestamptz,
  out academic_year_id uuid,
  out semester_id uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_date        date := p_occurred_at::date;
  v_year_id     uuid;
  v_semester_id uuid;
begin
  select ay.id into v_year_id
  from public.academic_years ay
  where ay.school_id = p_school_id
    and (ay.starts_on is null or ay.starts_on <= v_date)
    and (ay.ends_on is null or ay.ends_on >= v_date)
  order by ay.is_active desc, ay.starts_on desc nulls last, ay.created_at desc
  limit 1;

  if v_year_id is null then
    select ay.id into v_year_id
    from public.academic_years ay
    where ay.school_id = p_school_id
      and ay.is_active
    limit 1;
  end if;

  if v_year_id is null then
    raise exception 'Tahun ajaran belum diatur untuk sekolah ini.';
  end if;

  select s.id into v_semester_id
  from public.semesters s
  where s.school_id = p_school_id
    and s.academic_year_id = v_year_id
    and (s.starts_on is null or s.starts_on <= v_date)
    and (s.ends_on is null or s.ends_on >= v_date)
  order by s.is_active desc, s.starts_on desc nulls last, s.name desc
  limit 1;

  if v_semester_id is null then
    select s.id into v_semester_id
    from public.semesters s
    where s.school_id = p_school_id
      and s.academic_year_id = v_year_id
      and s.is_active
    limit 1;
  end if;

  if v_semester_id is null then
    raise exception 'Semester belum diatur untuk tahun ajaran ini.';
  end if;

  academic_year_id := v_year_id;
  semester_id := v_semester_id;
end;
$$;

create or replace function public.record_violation(
  p_student_id text,
  p_rule_id uuid,
  p_occurred_at timestamptz default now(),
  p_location text default null,
  p_chronology text default null,
  p_evidence_paths text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student    public.students%rowtype;
  v_rule       public.violation_rules%rowtype;
  v_member     public.school_members%rowtype;
  v_year_id    uuid;
  v_semester_id uuid;
  v_record_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_student
  from public.students
  where id = p_student_id;

  if not found then
    raise exception 'Siswa tidak ditemukan.';
  end if;

  if not public.has_school_role(v_student.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh mencatat pelanggaran.';
  end if;

  select * into v_rule
  from public.violation_rules
  where id = p_rule_id
    and school_id = v_student.school_id;

  if not found then
    raise exception 'Aturan pelanggaran tidak ditemukan di sekolah siswa.';
  end if;

  if not v_rule.is_active then
    raise exception 'Aturan "%" sudah tidak aktif.', v_rule.name;
  end if;

  select * into v_member
  from public.school_members
  where school_id = v_student.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  if not found then
    raise exception 'Keanggotaan sekolah tidak ditemukan.';
  end if;

  select r.academic_year_id, r.semester_id
    into v_year_id, v_semester_id
  from public.resolve_period(v_student.school_id, p_occurred_at) r;

  insert into public.violation_records (
    school_id, student_id, rule_id,
    rule_code, rule_name, rule_category,
    rule_points, rule_guidebook_points, rule_sp_override, rule_is_expulsion,
    occurred_at, academic_year_id, semester_id,
    location, chronology, evidence_paths,
    reported_by_member_id, reported_by_name, status
  )
  values (
    v_student.school_id, v_student.id, v_rule.id,
    v_rule.code, v_rule.name, v_rule.category,
    v_rule.points, v_rule.guidebook_points, v_rule.sp_override, v_rule.is_expulsion,
    p_occurred_at, v_year_id, v_semester_id,
    nullif(trim(p_location), ''), nullif(trim(p_chronology), ''),
    coalesce(p_evidence_paths, '{}'),
    v_member.id, coalesce(v_member.display_name, 'Guru BK'), 'recorded'
  )
  returning id into v_record_id;

  insert into public.point_ledger (
    school_id, student_id, violation_record_id,
    entry_type, points_delta, guidebook_delta,
    academic_year_id, semester_id, occurred_at, reason, created_by
  )
  values (
    v_student.school_id, v_student.id, v_record_id,
    'violation', v_rule.points, v_rule.guidebook_points,
    v_year_id, v_semester_id, p_occurred_at, v_rule.name, v_member.id
  );

  perform public.log_audit(
    v_student.school_id,
    'violation.recorded',
    'violation_records',
    v_record_id::text,
    null,
    jsonb_build_object(
      'student_id', v_student.id,
      'rule_code', v_rule.code,
      'points', v_rule.points,
      'occurred_at', p_occurred_at
    )
  );

  return v_record_id;
end;
$$;

create or replace function public.void_violation(
  p_record_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_record public.violation_records%rowtype;
  v_member public.school_members%rowtype;
  v_original jsonb;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Alasan pembatalan wajib diisi.';
  end if;

  select * into v_record
  from public.violation_records
  where id = p_record_id
  for update;

  if not found then
    raise exception 'Catatan pelanggaran tidak ditemukan.';
  end if;

  if not public.has_school_role(v_record.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh membatalkan pelanggaran.';
  end if;

  -- Idempoten: pembatalan kedua tidak menambah koreksi baru.
  if v_record.status = 'void' then
    return;
  end if;

  select * into v_member
  from public.school_members
  where school_id = v_record.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  if not found then
    raise exception 'Keanggotaan sekolah tidak ditemukan.';
  end if;

  v_original := jsonb_build_object(
    'student_id', v_record.student_id,
    'rule_code', v_record.rule_code,
    'rule_points', v_record.rule_points,
    'occurred_at', v_record.occurred_at
  );

  insert into public.point_ledger (
    school_id, student_id, violation_record_id,
    entry_type, points_delta, guidebook_delta,
    academic_year_id, semester_id, occurred_at, reason, created_by
  )
  values (
    v_record.school_id, v_record.student_id, v_record.id,
    'correction', -v_record.rule_points, -v_record.rule_guidebook_points,
    v_record.academic_year_id, v_record.semester_id, now(),
    'Pembatalan: ' || trim(p_reason), v_member.id
  );

  update public.violation_records
  set status = 'void',
      void_reason = trim(p_reason),
      voided_by_member_id = v_member.id,
      voided_at = now()
  where id = v_record.id;

  -- Draft SP yang lahir khusus dari pelanggaran ini tidak boleh terbit.
  -- SP yang sudah terbit tetap ada dan harus dibatalkan manual oleh BK.
  update public.sp_letters
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = v_member.id,
      cancel_reason = 'Pelanggaran dibatalkan: ' || trim(p_reason)
  where school_id = v_record.school_id
    and student_id = v_record.student_id
    and status = 'draft'
    and trigger_record_id = v_record.id;

  perform public.log_audit(
    v_record.school_id,
    'violation.voided',
    'violation_records',
    v_record.id::text,
    v_original,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;

-- ============================================================================
-- 12. RPC SURAT SP
-- ============================================================================

create or replace function public.create_manual_sp(
  p_student_id text,
  p_type text,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student   public.students%rowtype;
  v_school    public.schools%rowtype;
  v_member    public.school_members%rowtype;
  v_year_id   uuid;
  v_semester_id uuid;
  v_scope     uuid;
  v_total     integer;
  v_guide     integer;
  v_tier      integer;
  v_threshold integer;
  v_sequence  integer;
  v_existing  uuid;
  v_sp_id     uuid;
  v_snapshot  jsonb;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if p_type not in ('sp1', 'sp2', 'sp3', 'pleno') then
    raise exception 'Jenis SP tidak dikenal: %', p_type;
  end if;

  select * into v_student
  from public.students
  where id = p_student_id;

  if not found then
    raise exception 'Siswa tidak ditemukan.';
  end if;

  if not public.has_school_role(v_student.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh membuat SP.';
  end if;

  select * into v_school
  from public.schools
  where id = v_student.school_id;

  select * into v_member
  from public.school_members
  where school_id = v_student.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  select r.academic_year_id, r.semester_id
    into v_year_id, v_semester_id
  from public.resolve_period(v_student.school_id, now()) r;

  v_scope := case
    when v_school.sp_basis = 'academic_year' then v_year_id
    else null
  end;

  select
    coalesce(sum(violation_delta), 0),
    coalesce(sum(guidebook_delta), 0)
  into v_total, v_guide
  from public.point_ledger
  where school_id = v_student.school_id
    and student_id = v_student.id
    and (v_scope is null or academic_year_id = v_scope);

  -- Manual tetap idempoten: satu draft/terbit per jenis.
  select id into v_existing
  from public.sp_letters
  where school_id = v_student.school_id
    and student_id = v_student.id
    and type = p_type
    and status in ('draft', 'issued')
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  v_tier := case p_type
    when 'sp1' then 1
    when 'sp2' then 2
    when 'sp3' then 3
    else 4
  end;
  v_threshold := v_school.sp_thresholds[v_tier];

  select coalesce(max(sequence), 0) + 1
    into v_sequence
  from public.sp_letters
  where school_id = v_student.school_id
    and student_id = v_student.id
    and type = p_type;

  v_snapshot := public.build_sp_snapshot(
    v_student.school_id,
    v_student.id,
    p_type,
    v_threshold,
    v_total,
    v_guide,
    v_scope
  );

  insert into public.sp_letters (
    school_id, student_id, type, sequence, academic_year_id, semester_id,
    threshold_points, total_points, total_guidebook_points, status,
    is_manual, manual_reason, snapshot, created_by
  )
  values (
    v_student.school_id, v_student.id, p_type, v_sequence, v_year_id, v_semester_id,
    v_threshold, v_total, v_guide, 'draft',
    true, nullif(trim(p_reason), ''), v_snapshot, v_member.id
  )
  returning id into v_sp_id;

  perform public.log_audit(
    v_student.school_id,
    'sp.manual_created',
    'sp_letters',
    v_sp_id::text,
    null,
    jsonb_build_object(
      'student_id', v_student.id,
      'type', p_type,
      'total_points', v_total,
      'reason', nullif(trim(p_reason), '')
    )
  );

  return v_sp_id;
end;
$$;

create or replace function public.issue_sp_letter(
  p_sp_id uuid,
  p_number text,
  p_meeting_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sp        public.sp_letters%rowtype;
  v_school    public.schools%rowtype;
  v_member    public.school_members%rowtype;
  v_scope     uuid;
  v_total     integer;
  v_guide     integer;
  v_snapshot  jsonb;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if p_number is null or trim(p_number) = '' then
    raise exception 'Nomor surat wajib diisi.';
  end if;

  select * into v_sp
  from public.sp_letters
  where id = p_sp_id
  for update;

  if not found then
    raise exception 'Surat SP tidak ditemukan.';
  end if;

  if not public.has_school_role(v_sp.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh menerbitkan SP.';
  end if;

  if v_sp.status <> 'draft' then
    raise exception 'Hanya SP berstatus draft yang bisa diterbitkan.';
  end if;

  select * into v_school
  from public.schools
  where id = v_sp.school_id;

  select * into v_member
  from public.school_members
  where school_id = v_sp.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  v_scope := case
    when v_school.sp_basis = 'academic_year' then v_sp.academic_year_id
    else null
  end;

  select
    coalesce(sum(violation_delta), 0),
    coalesce(sum(guidebook_delta), 0)
  into v_total, v_guide
  from public.point_ledger
  where school_id = v_sp.school_id
    and student_id = v_sp.student_id
    and (v_scope is null or academic_year_id = v_scope);

  -- SP otomatis biasa tidak boleh terbit bila koreksi sudah menurunkan poin
  -- di bawah ambang. SP override/expulsion sengaja dibuat di bawah ambang.
  if not v_sp.is_manual
     and not v_sp.is_override
     and v_total < v_sp.threshold_points then
    raise exception
      'Total poin saat ini (%) berada di bawah ambang SP (%).

Periksa koreksi pelanggaran atau batalkan draft ini.',
      v_total, v_sp.threshold_points;
  end if;

  v_snapshot := public.build_sp_snapshot(
    v_sp.school_id,
    v_sp.student_id,
    v_sp.type,
    v_sp.threshold_points,
    v_total,
    v_guide,
    v_scope
  );

  begin
    update public.sp_letters
    set number = trim(p_number),
        status = 'issued',
        total_points = v_total,
        total_guidebook_points = v_guide,
        snapshot = v_snapshot,
        issued_by = v_member.id,
        issued_at = now(),
        meeting_at = coalesce(p_meeting_at, meeting_at)
    where id = v_sp.id;
  exception when unique_violation then
    raise exception 'Nomor surat "%" sudah dipakai untuk tahun ajaran ini.', trim(p_number);
  end;

  perform public.log_audit(
    v_sp.school_id,
    'sp.issued',
    'sp_letters',
    v_sp.id::text,
    jsonb_build_object('status', 'draft'),
    jsonb_build_object(
      'status', 'issued',
      'number', trim(p_number),
      'total_points', v_total,
      'is_override', v_sp.is_override,
      'is_manual', v_sp.is_manual
    )
  );
end;
$$;

create or replace function public.cancel_sp_letter(
  p_sp_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sp     public.sp_letters%rowtype;
  v_member public.school_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Alasan pembatalan wajib diisi.';
  end if;

  select * into v_sp
  from public.sp_letters
  where id = p_sp_id
  for update;

  if not found then
    raise exception 'Surat SP tidak ditemukan.';
  end if;

  if not public.has_school_role(v_sp.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh membatalkan SP.';
  end if;

  if v_sp.status = 'cancelled' then
    return;
  end if;

  select * into v_member
  from public.school_members
  where school_id = v_sp.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  update public.sp_letters
  set status = 'cancelled',
      cancel_reason = trim(p_reason),
      cancelled_by = v_member.id,
      cancelled_at = now()
  where id = v_sp.id;

  perform public.log_audit(
    v_sp.school_id,
    'sp.cancelled',
    'sp_letters',
    v_sp.id::text,
    jsonb_build_object('status', v_sp.status),
    jsonb_build_object('status', 'cancelled', 'reason', trim(p_reason))
  );
end;
$$;

create or replace function public.set_sp_meeting(
  p_sp_id uuid,
  p_meeting_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sp public.sp_letters%rowtype;
begin
  select * into v_sp
  from public.sp_letters
  where id = p_sp_id;

  if not found then
    raise exception 'Surat SP tidak ditemukan.';
  end if;

  if not public.has_school_role(v_sp.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh mengubah jadwal pertemuan.';
  end if;

  if v_sp.status = 'cancelled' then
    raise exception 'SP yang sudah dibatalkan tidak bisa dijadwalkan ulang.';
  end if;

  update public.sp_letters
  set meeting_at = p_meeting_at
  where id = p_sp_id;
end;
$$;

-- ============================================================================
-- 13. VIEW LAPORAN
-- ============================================================================
-- security_invoker = true agar RLS tabel dasar tetap berlaku untuk
-- BK (semua kelas) dan wali kelas (kelasnya saja).

create or replace view public.v_student_points
with (security_invoker = true) as
with totals as (
  select
    pl.school_id,
    pl.student_id,
    coalesce(sum(pl.violation_delta), 0)::integer as total_points,
    coalesce(sum(pl.guidebook_delta), 0)::integer as total_guidebook_points,
    max(pl.occurred_at) filter (where pl.entry_type = 'violation') as last_violation_at
  from public.point_ledger pl
  group by pl.school_id, pl.student_id
),
semester_totals as (
  select
    pl.school_id,
    pl.student_id,
    coalesce(sum(pl.violation_delta), 0)::integer as semester_points
  from public.point_ledger pl
  join public.semesters s
    on s.id = pl.semester_id
   and s.school_id = pl.school_id
  where s.is_active
  group by pl.school_id, pl.student_id
),
year_totals as (
  select
    pl.school_id,
    pl.student_id,
    coalesce(sum(pl.violation_delta), 0)::integer as year_points
  from public.point_ledger pl
  join public.academic_years ay
    on ay.id = pl.academic_year_id
   and ay.school_id = pl.school_id
  where ay.is_active
  group by pl.school_id, pl.student_id
)
select
  st.school_id,
  st.id as student_id,
  st.nama,
  st.nis,
  st.nisn,
  st.jk,
  st.kelas,
  st.class_id,
  st.status as student_status,
  sc.point_scale,
  coalesce(t.total_points, 0) as total_points,
  coalesce(t.total_guidebook_points, 0) as total_guidebook_points,
  coalesce(sem.semester_points, 0) as semester_points,
  coalesce(yr.year_points, 0) as year_points,
  greatest(sc.point_scale - coalesce(t.total_points, 0), 0) as balance,
  case
    when coalesce(t.total_points, 0) >= sc.sp_thresholds[4] then 'pleno'
    when coalesce(t.total_points, 0) >= sc.sp_thresholds[3] then 'sp3'
    when coalesce(t.total_points, 0) >= sc.sp_thresholds[2] then 'sp2'
    when coalesce(t.total_points, 0) >= sc.sp_thresholds[1] then 'sp1'
    when coalesce(t.total_points, 0) > 0 then 'pembinaan'
    else 'aman'
  end as status,
  t.last_violation_at
from public.students st
join public.schools sc on sc.id = st.school_id
left join totals t
  on t.school_id = st.school_id and t.student_id = st.id
left join semester_totals sem
  on sem.school_id = st.school_id and sem.student_id = st.id
left join year_totals yr
  on yr.school_id = st.school_id and yr.student_id = st.id;

comment on view public.v_student_points is
  'Poin kumulatif, semester berjalan, tahun berjalan, dan status SP per siswa.';

create or replace view public.v_violation_feed
with (security_invoker = true) as
select
  vr.id,
  vr.school_id,
  vr.student_id,
  st.nama,
  st.kelas,
  st.class_id,
  vr.rule_id,
  vr.rule_code,
  vr.rule_name,
  vr.rule_category,
  vr.rule_points,
  vr.rule_guidebook_points,
  vr.occurred_at,
  vr.academic_year_id,
  vr.semester_id,
  vr.location,
  vr.chronology,
  vr.evidence_paths,
  vr.reported_by_name,
  vr.status,
  vr.created_at
from public.violation_records vr
join public.students st
  on st.id = vr.student_id
 and st.school_id = vr.school_id;

comment on view public.v_violation_feed is
  'Catatan pelanggaran + identitas siswa untuk timeline dan rekap.';

create or replace view public.v_violation_leaderboard
with (security_invoker = true) as
select
  p.school_id,
  p.student_id,
  p.nama,
  p.nis,
  p.kelas,
  p.class_id,
  p.semester_points as points,
  rank() over (
    partition by p.school_id
    order by p.semester_points desc, p.nama
  ) as school_rank,
  rank() over (
    partition by p.school_id, p.class_id
    order by p.semester_points desc, p.nama
  ) as class_rank,
  count(*) over (partition by p.school_id) as school_students,
  count(*) over (partition by p.school_id, p.class_id) as class_students
from public.v_student_points p
where p.semester_points > 0;

comment on view public.v_violation_leaderboard is
  'Peringkat poin pelanggaran semester berjalan. Hanya untuk staf (BK/wali kelas).';

create or replace view public.v_class_points
with (security_invoker = true) as
select
  p.school_id,
  p.class_id,
  p.kelas,
  count(*)::integer as student_count,
  coalesce(sum(p.semester_points), 0)::integer as semester_points,
  round(avg(p.semester_points), 2) as average_points,
  rank() over (
    partition by p.school_id
    order by avg(p.semester_points) asc, p.kelas
  ) as rank
from public.v_student_points p
where p.class_id is not null
group by p.school_id, p.class_id, p.kelas;

comment on view public.v_class_points is
  'Agregat kelas untuk papan "Kelas Paling Tertib" (rata-rata terendah terbaik).';

create or replace view public.v_sp_letters
with (security_invoker = true) as
select
  sp.id,
  sp.school_id,
  sp.student_id,
  st.nama,
  st.kelas,
  st.class_id,
  sp.type,
  sp.sequence,
  sp.number,
  sp.status,
  sp.is_manual,
  sp.is_override,
  sp.threshold_points,
  sp.total_points,
  sp.total_guidebook_points,
  sp.meeting_at,
  sp.trigger_record_id,
  sp.created_at,
  sp.issued_at,
  sp.acknowledged_at
from public.sp_letters sp
join public.students st
  on st.id = sp.student_id
 and st.school_id = sp.school_id;

comment on view public.v_sp_letters is
  'Daftar SP dengan identitas siswa untuk BK dan wali kelas.';

create or replace view public.v_sp_pending
with (security_invoker = true) as
select *
from public.v_sp_letters
where status = 'draft';

comment on view public.v_sp_pending is
  'Draft SP yang menunggu review/penerbitan BK.';

-- ============================================================================
-- 14. RPC KARTU SISWA
-- ============================================================================

-- Buat kartu baru. Token dan PIN hanya dikembalikan SEKALI di sini.
-- Kartu aktif lama otomatis dicabut.
create or replace function public.create_student_card(
  p_student_id text
)
returns jsonb
language plpgsql
security definer
-- pgcrypto bisa berada di schema public (instalasi lama) atau extensions
-- (Supabase). Keduanya aman dicantumkan; schema yang tidak ada diabaikan.
set search_path = public, extensions, pg_temp
as $$
declare
  v_student  public.students%rowtype;
  v_member   public.school_members%rowtype;
  v_token    text;
  v_pin      text;
  v_bytes    bytea;
  v_pin_num  integer;
  v_card_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  select * into v_student
  from public.students
  where id = p_student_id;

  if not found then
    raise exception 'Siswa tidak ditemukan.';
  end if;

  if not public.has_school_role(v_student.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh membuat kartu siswa.';
  end if;

  select * into v_member
  from public.school_members
  where school_id = v_student.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  update public.student_cards
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_member.id,
      revoked_reason = 'Diganti kartu baru'
  where school_id = v_student.school_id
    and student_id = v_student.id
    and status = 'active';

  v_token := 'SIMBK1:' || encode(gen_random_bytes(16), 'hex');

  -- PIN 6 digit dari 3 byte acak (0..16.777.215 mod 1.000.000).
  v_bytes := gen_random_bytes(3);
  v_pin_num := (
    (get_byte(v_bytes, 0) << 16)
    | (get_byte(v_bytes, 1) << 8)
    | get_byte(v_bytes, 2)
  ) % 1000000;
  v_pin := lpad(v_pin_num::text, 6, '0');

  insert into public.student_cards (
    school_id, student_id, token_hash, pin_hash, created_by
  )
  values (
    v_student.school_id,
    v_student.id,
    encode(digest(v_token, 'sha256'), 'hex'),
    crypt(v_pin, gen_salt('bf', 10)),
    v_member.id
  )
  returning id into v_card_id;

  perform public.log_audit(
    v_student.school_id,
    'card.created',
    'student_cards',
    v_card_id::text,
    null,
    jsonb_build_object('student_id', v_student.id)
  );

  return jsonb_build_object(
    'ok', true,
    'card_id', v_card_id,
    'student_id', v_student.id,
    'token', v_token,
    'pin', v_pin
  );
end;
$$;

create or replace function public.revoke_student_card(
  p_card_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_card   public.student_cards%rowtype;
  v_member public.school_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  if p_reason is null or trim(p_reason) = '' then
    raise exception 'Alasan pencabutan wajib diisi.';
  end if;

  select * into v_card
  from public.student_cards
  where id = p_card_id
  for update;

  if not found then
    raise exception 'Kartu tidak ditemukan.';
  end if;

  if not public.has_school_role(v_card.school_id, array['bk']) then
    raise exception 'Hanya guru BK yang boleh mencabut kartu.';
  end if;

  if v_card.status <> 'active' then
    return;
  end if;

  select * into v_member
  from public.school_members
  where school_id = v_card.school_id
    and user_id = auth.uid()
    and is_active
  limit 1;

  update public.student_cards
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = v_member.id,
      revoked_reason = trim(p_reason)
  where id = v_card.id;

  perform public.log_audit(
    v_card.school_id,
    'card.revoked',
    'student_cards',
    v_card.id::text,
    jsonb_build_object('status', 'active'),
    jsonb_build_object('status', 'revoked', 'reason', trim(p_reason))
  );
end;
$$;

-- Verifikasi QR + PIN. HANYA untuk service_role (dipanggil Edge Function),
-- bukan langsung oleh browser siswa.
create or replace function public.verify_student_card(
  p_token text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_card     public.student_cards%rowtype;
  v_student  public.students%rowtype;
  v_points   record;
  v_recent   jsonb;
begin
  if p_token is null
     or p_pin is null
     or length(trim(p_pin)) <> 6 then
    return jsonb_build_object('ok', false, 'error', 'Kartu atau PIN tidak valid.');
  end if;

  select * into v_card
  from public.student_cards
  where token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
  for update;

  if not found or v_card.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'Kartu atau PIN tidak valid.');
  end if;

  if v_card.locked_until is not null and v_card.locked_until > now() then
    return jsonb_build_object(
      'ok', false,
      'error', 'Terlalu banyak percobaan. Coba lagi nanti.',
      'locked_until', v_card.locked_until
    );
  end if;

  if v_card.pin_hash = crypt(trim(p_pin), v_card.pin_hash) then
    update public.student_cards
    set failed_attempts = 0,
        locked_until = null,
        last_used_at = now()
    where id = v_card.id;

    select * into v_student
    from public.students
    where id = v_card.student_id;

    select * into v_points
    from public.v_student_points
    where school_id = v_card.school_id
      and student_id = v_card.student_id;

    select coalesce(jsonb_agg(row_data order by occurred_at desc), '[]'::jsonb)
      into v_recent
    from (
      select
        vr.occurred_at,
        jsonb_build_object(
          'occurred_at', vr.occurred_at,
          'rule_name', vr.rule_name,
          'category', vr.rule_category,
          'points', vr.rule_points,
          'location', vr.location
        ) as row_data
      from public.violation_records vr
      where vr.school_id = v_card.school_id
        and vr.student_id = v_card.student_id
        and vr.status <> 'void'
      order by vr.occurred_at desc
      limit 20
    ) recent;

    perform public.log_audit(
      v_card.school_id,
      'card.login',
      'student_cards',
      v_card.id::text,
      null,
      jsonb_build_object('student_id', v_card.student_id)
    );

    return jsonb_build_object(
      'ok', true,
      'student', jsonb_build_object(
        'id', v_student.id,
        'nama', v_student.nama,
        'nis', v_student.nis,
        'kelas', v_student.kelas
      ),
      'points', jsonb_build_object(
        'point_scale', v_points.point_scale,
        'total_points', v_points.total_points,
        'balance', v_points.balance,
        'semester_points', v_points.semester_points,
        'status', v_points.status
      ),
      'recent_violations', v_recent
    );
  end if;

  if v_card.failed_attempts + 1 >= 5 then
    update public.student_cards
    set failed_attempts = 0,
        locked_until = now() + interval '15 minutes'
    where id = v_card.id;

    return jsonb_build_object(
      'ok', false,
      'error', 'Terlalu banyak percobaan. Kartu terkunci 15 menit.'
    );
  end if;

  update public.student_cards
  set failed_attempts = failed_attempts + 1
  where id = v_card.id;

  return jsonb_build_object('ok', false, 'error', 'Kartu atau PIN tidak valid.');
end;
$$;

-- ============================================================================
-- 15. SEED 39 ATURAN SMPN 34
-- ============================================================================
-- Poin aplikasi = poin buku panduan x (point_scale / 100).
-- Untuk SMPN 34 (point_scale 1000), setiap poin buku menjadi 10 poin aplikasi.
-- on conflict do nothing: aturan yang sudah diedit sekolah tidak ditimpa.

with seed (
  code, category, name, description, guidebook_points,
  default_sanction, sp_override, is_expulsion, sort_order
) as (
  values
    ('R01', 'kewajiban', 'Siswa yang Berhalangan Hadir',
     'Tidak hadir karena sakit atau urusan mendesak tanpa surat/bukti medis kepada wali kelas atau piket sebelum pukul 07.30 WITA.',
     5, 'Teguran lisan via telepon ke orang tua; siswa wajib mengejar materi.', null::smallint, false, 1),
    ('R02', 'kewajiban', 'Menjaga Kebersihan dan Keindahan Sekolah',
     'Lalai menjaga kebersihan dan keindahan kelas, koridor, taman, atau fasilitas umum sekolah.',
     10, 'Teguran langsung dan membersihkan kembali area yang kotor seketika.', null, false, 2),
    ('R03', 'kewajiban', 'Mengikuti Shalat Dhuhur Berjamaah',
     'Sengaja membolos atau bersembunyi dari shalat Dhuhur berjamaah tanpa alasan syar''i.',
     10, 'Teguran dan melaksanakan shalat sendiri di bawah pengawasan guru agama.', null, false, 3),
    ('R04', 'ringan', 'Keterlambatan Hadir di Sekolah',
     'Tiba di gerbang sekolah setelah bel masuk pukul 07.30 WITA tanpa alasan medis darurat atau surat dispensasi sah.',
     10, 'Menyapu halaman atau menyiram tanaman selama 15 menit sebelum masuk kelas.', null, false, 4),
    ('R05', 'ringan', 'Pakaian Tidak Seragam / Atribut Tidak Lengkap',
     'Seragam tidak sesuai jadwal, dimodifikasi berlebihan, atau atribut wajib (dasi, ikat pinggang, kaos kaki) tidak lengkap.',
     10, 'Teguran lisan, merapikan seragam, atau meminjam atribut darurat.', null, false, 5),
    ('R06', 'ringan', 'Tidak Membawa Tempat Air Minum (Tumbler) Pribadi',
     'Tidak membawa botol minum isi ulang sendiri dari rumah.',
     5, 'Teguran lisan dan catatan pada buku penghubung siswa.', null, false, 6),
    ('R07', 'ringan', 'Tidak Membawa Wadah Makanan (Kotak Bekal) Pribadi',
     'Tidak membawa wadah atau kotak makan isi ulang untuk mendukung program Zero-Waste.',
     5, 'Teguran lisan dan catatan pada buku penghubung siswa.', null, false, 7),
    ('R08', 'ringan', 'Membuang Sampah Bukan Pada Tempatnya',
     'Membuang atau menyembunyikan sampah di laci, lantai, koridor, lapangan, atau area selain bak sampah resmi.',
     10, 'Memungut dan memilah 30 sampah non-organik di halaman sekolah.', null, false, 8),
    ('R09', 'ringan', 'Makan Bukan di Kantin Sekolah',
     'Mengonsumsi makanan berat, mie instan, atau jajanan basah di kelas, laboratorium, perpustakaan, atau tempat ibadah.',
     5, 'Membersihkan dan mengepel area yang dikotori seketika.', null, false, 9),
    ('R10', 'ringan', 'Standar Rambut Tidak Sesuai',
     'Rambut melebihi batas alis/kerah/telinga, potongan ekstrem, atau diwarnai dengan warna non-alami.',
     10, 'Teguran dan peringatan tertulis untuk merapikan rambut dalam 1x24 jam.', null, false, 10),
    ('R11', 'ringan', 'Penggunaan Anting-Anting (Khusus Laki-Laki)',
     'Siswa laki-laki menggunakan anting atau tindik di telinga, bibir, lidah, atau bagian tubuh lain di lingkungan sekolah.',
     10, 'Aksesori disita permanen dan siswa wajib mencopotnya seketika.', null, false, 11),
    ('R12', 'ringan', 'Kepemilikan Tatto',
     'Membuat tato permanen atau tato temporer berskala besar yang melanggar norma kerapian sekolah.',
     40, 'Tato temporer digosok bersih di ruang BK; tato permanen dipanggil orang tua dan ditutup selama di sekolah.', null, false, 12),
    ('R13', 'ringan', 'Penggunaan Kalung Non-Standar',
     'Memakai kalung aksesoris, kalung besi, tali, atau perhiasan berlebihan di luar ketentuan seragam.',
     5, 'Penyitaan aksesoris sampai akhir semester dan merapikan seragam.', null, false, 13),
    ('R14', 'ringan', 'Penggunaan Gelang Non-Standar',
     'Memakai gelang tali, gelang besi, karet berlebihan, atau aksesoris tangan non-jam tangan.',
     5, 'Penyitaan aksesoris sampai akhir semester dan merapikan seragam.', null, false, 14),
    ('R15', 'sedang', 'Keluar Kelas Tanpa Izin Saat Jam Pelajaran',
     'Meninggalkan kelas saat guru mengajar atau transisi mapel tanpa izin atau kartu izin keluar kelas.',
     15, 'Teguran langsung dan segera kembali belajar ke kelas.', null, false, 15),
    ('R16', 'sedang', 'Berseliweran / Berkeliaran Saat Jam Pelajaran',
     'Berada di luar kelas, koridor, kantin, atau lapangan saat jam pelajaran tanpa tujuan instruksional atau surat tugas.',
     15, 'Membersihkan selasar koridor dan membuat surat pernyataan tertulis.', null, false, 16),
    ('R17', 'sedang', 'Tidak Mengerjakan Tugas Sekolah',
     'Sengaja tidak menyelesaikan atau tidak mengumpulkan PR, tugas kelas, atau proyek pembelajaran.',
     15, 'Menyelesaikan tugas saat jam istirahat di bawah pengawasan guru/piket.', null, false, 17),
    ('R18', 'sedang', 'Membawa/Menggunakan HP Tanpa Izin',
     'Membawa gawai tanpa surat izin tertulis atau mengoperasikannya saat KBM untuk keperluan non-belajar.',
     20, 'HP disita 3 hari dan hanya boleh diambil orang tua dengan surat komitmen.', null, false, 18),
    ('R19', 'sedang', 'Menyontek Massal / Terencana',
     'Bekerja sama atau menggunakan media ilegal saat ujian/asesmen secara berkelompok atau terorganisasi.',
     25, 'Nilai ujian 0, esai refleksi kejujuran 3 halaman, dan ujian susulan.', null, false, 19),
    ('R20', 'berat', 'Membolos Jam Pelajaran Tertentu di Dalam Sekolah',
     'Tidak mengikuti jam pelajaran tertentu meski tercatat hadir, misalnya bersembunyi di UKS atau kantin.',
     25, 'Membersihkan fasilitas ibadah 2 hari dan mengejar materi secara mandiri.', null, false, 20),
    ('R21', 'berat', 'Membolos Sekolah Secara Akumulatif',
     'Tidak hadir tanpa alasan sah secara berturut-turut atau akumulatif dalam satu bulan berjalan.',
     40, 'Teguran tertulis pada buku penghubung dan menyalin rangkuman materi.', null, false, 21),
    ('R22', 'berat', 'Melawan Perintah Guru',
     'Menolak, membantah dengan kata kasar, atau mengabaikan instruksi disiplin guru/staf sekolah.',
     30, 'Dibina di ruang BK, membuat surat penyesalan, dan meminta maaf terbuka.', null, false, 22),
    ('R23', 'berat', 'Melawan Guru / Staf Secara Fisik / Agresif Kontak',
     'Menyerang, mendorong, mengancam fisik, atau melakukan kontak agresif kepada guru/staf sekolah.',
     50, 'Isolasi di ruang kepala sekolah, panggilan orang tua darurat, dan SP3.', 3::smallint, false, 23),
    ('R24', 'berat', 'Merusak Peralatan / Fasilitas Sekolah',
     'Sengaja merusak, memecahkan, menghancurkan, atau mencoret aset dan fasilitas sekolah.',
     40, 'Mengganti/memperbaiki barang dan piket pemeliharaan sarpras 3 hari.', null, false, 24),
    ('R25', 'berat', 'Meninggalkan Sekolah Tanpa Izin / Bolos Keluar Gerbang',
     'Keluar atau melarikan diri dari area sekolah sebelum jam pulang tanpa izin tertulis.',
     40, 'Panggilan orang tua, SP1, dan tugas merapikan taman 2 hari.', null, false, 25),
    ('R26', 'berat', 'Melompati Pagar Sekolah (Lompat Pagar)',
     'Keluar atau masuk lingkungan sekolah dengan memanjat atau melompati pagar pembatas.',
     40, 'Sanksi sama dengan meninggalkan sekolah tanpa izin, ditambah menguras bak mandi 2 hari.', null, false, 26),
    ('R27', 'berat', 'Terlibat Praktik Perjudian Langsung maupun Online',
     'Mengikuti permainan untung-untungan dengan uang taruhan, baik langsung maupun online.',
     50, 'Sita alat/bukti, panggilan orang tua, konseling adiksi, dan jurnal 5 hari.', 2::smallint, false, 27),
    ('R28', 'berat', 'Membawa Masuk Permasalahan / Konflik dari Luar Sekolah',
     'Membawa geng, alumni, atau oknum luar untuk intimidasi atau penyelesaian konflik di sekolah.',
     50, 'Surat pernyataan bermaterai, isolasi belajar 3 hari, dan piket gudang 5 hari.', 2::smallint, false, 28),
    ('R29', 'sangat_berat', 'Berkelahi atau Melakukan Kekerasan Fisik Perorangan',
     'Kontak fisik agresif sebagai pelaku atau pemicu, di dalam sekolah atau di luar dengan seragam.',
     75, 'SP2/SP3, pembinaan PBB, dan proses pengeluaran bila menimbulkan luka serius.', null, false, 29),
    ('R30', 'sangat_berat', 'Perundungan (Bullying) Fisik, Verbal, atau Siber',
     'Intimidasi, pengucilan, pemalakan, atau teror psikologis berulang terhadap siswa yang lebih lemah.',
     50, 'Permohonan maaf tertulis, kampanye anti-bullying, dan pembinaan BK 2 minggu.', null, false, 30),
    ('R31', 'sangat_berat', 'Menghina Guru atau Karyawan Sekolah',
     'Kata kasar, gestur melecehkan, atau konten digital yang menyerang martabat guru/staf.',
     75, 'SP2, surat maaf bermaterai, dan permohonan maaf di upacara bendera.', 2::smallint, false, 31),
    ('R32', 'sangat_berat', 'Berbuat Asusila / Kesusilaan Standar',
     'Bermesraan melampaui batas atau menyimpan/menyebarkan konten pornografi di lingkungan sekolah.',
     75, 'SP3, konseling intensif, dan pembersihan tempat ibadah 5 hari.', 3::smallint, false, 32),
    ('R33', 'sangat_berat', 'Tindakan Asusila Berat / Pelecehan Seksual Fisik',
     'Pelecehan seksual fisik, persetubuhan, atau kekerasan seksual berat terhadap warga sekolah.',
     100, 'Dikeluarkan secara tidak hormat melalui sidang pleno dan diserahkan ke Unit PPA.', null, true, 33),
    ('R34', 'sangat_berat', 'Aktivitas Kampanye / Simbol LGBT Awal',
     'Menyebarkan atau mempromosikan atribut/simbol LGBT di lingkungan sekolah.',
     50, 'Pembinaan moral-spiritual dan SP2; pelanggaran kedua menjadi SP3.', 2::smallint, false, 34),
    ('R35', 'sangat_berat', 'Mencemarkan Nama Baik Sekolah',
     'Tindakan atau unggahan yang merusak martabat dan reputasi sekolah.',
     75, 'Klarifikasi publik dan kerja sosial; dampak berat dapat berujung SP3/pengeluaran.', null, false, 35),
    ('R36', 'sangat_berat', 'Membawa / Mengonsumsi Minuman Keras (Miras)',
     'Membawa, menyimpan, mengonsumsi, atau mabuk akibat alkohol di sekolah atau saat berseragam.',
     75, 'Tes urine, pembersihan koridor dan drainase 5 hari, dan SP3.', 3::smallint, false, 36),
    ('R37', 'sangat_berat', 'Menghirup Lem (Ngelem) / Zat Adiktif Alternatif',
     'Menyalahgunakan lem, inhalan, bensin, tiner, atau gas untuk mendapatkan efek mabuk.',
     75, 'Konseling/rehabilitasi, pembersihan sanitasi 5 hari, dan SP3.', 3::smallint, false, 37),
    ('R38', 'sangat_berat', 'Tindakan Merokok / Vape di Sekolah',
     'Membawa, memiliki, menghisap, atau mengedarkan rokok/vape di sekolah atau saat berseragam.',
     75, 'SP2, kerja sosial 5 hari, dan esai dampak nikotin 4 halaman.', 2::smallint, false, 38),
    ('R39', 'sangat_berat', 'Pelanggaran Mutlak Hukum Pidana Nasional',
     'Narkotika, tawuran massal dengan senjata, atau mengedarkan minuman keras.',
     100, 'Dikeluarkan melalui sidang pleno dan proses hukum diserahkan kepada kepolisian.', null, true, 39)
)
insert into public.violation_rules (
  school_id, code, category, name, description,
  points, guidebook_points, default_sanction,
  sp_override, is_expulsion, sort_order
)
select
  s.id,
  seed.code,
  seed.category,
  seed.name,
  seed.description,
  seed.guidebook_points * (s.point_scale / 100),
  seed.guidebook_points,
  seed.default_sanction,
  seed.sp_override,
  seed.is_expulsion,
  seed.sort_order
from seed
cross join public.schools s
where s.id = public.default_school_id()
on conflict (school_id, code) do nothing;

-- ============================================================================
-- 16. ROW LEVEL SECURITY
-- ============================================================================

alter table public.violation_rules    enable row level security;
alter table public.violation_records  enable row level security;
alter table public.point_ledger       enable row level security;
alter table public.sp_letters         enable row level security;
alter table public.student_cards      enable row level security;
alter table public.audit_log          enable row level security;

-- Aturan: semua anggota sekolah boleh membaca; hanya BK yang menulis.
create policy violation_rules_member_read
  on public.violation_rules for select to authenticated
  using (public.is_school_member(school_id));

create policy violation_rules_bk_write
  on public.violation_rules for all to authenticated
  using (public.has_school_role(school_id, array['bk']))
  with check (public.has_school_role(school_id, array['bk']));

-- Pelanggaran: BK semua; wali kelas hanya siswa di kelasnya.
create policy violation_records_bk_read
  on public.violation_records for select to authenticated
  using (public.has_school_role(school_id, array['bk']));

create policy violation_records_wali_read
  on public.violation_records for select to authenticated
  using (
    public.has_school_role(school_id, array['wali_kelas'])
    and public.is_wali_of_student(student_id, school_id)
  );

-- Ledger: pola akses sama dengan pelanggaran. Tidak ada policy tulis;
-- penulisan hanya lewat RPC SECURITY DEFINER.
create policy point_ledger_bk_read
  on public.point_ledger for select to authenticated
  using (public.has_school_role(school_id, array['bk']));

create policy point_ledger_wali_read
  on public.point_ledger for select to authenticated
  using (
    public.has_school_role(school_id, array['wali_kelas'])
    and public.is_wali_of_student(student_id, school_id)
  );

-- SP: BK semua; wali kelas hanya kelasnya.
create policy sp_letters_bk_read
  on public.sp_letters for select to authenticated
  using (public.has_school_role(school_id, array['bk']));

create policy sp_letters_wali_read
  on public.sp_letters for select to authenticated
  using (
    public.has_school_role(school_id, array['wali_kelas'])
    and public.is_wali_of_student(student_id, school_id)
  );

-- Kartu: hanya BK. Hash token/PIN tidak diberikan lewat grant kolom.
create policy student_cards_bk_read
  on public.student_cards for select to authenticated
  using (public.has_school_role(school_id, array['bk']));

-- Audit: hanya BK.
create policy audit_log_bk_read
  on public.audit_log for select to authenticated
  using (public.has_school_role(school_id, array['bk']));

-- ============================================================================
-- 17. HAK AKSES
-- ============================================================================

revoke all on table
  public.violation_rules,
  public.violation_records,
  public.point_ledger,
  public.sp_letters,
  public.student_cards,
  public.audit_log
from anon, authenticated;

revoke all on table
  public.v_student_points,
  public.v_violation_feed,
  public.v_violation_leaderboard,
  public.v_class_points,
  public.v_sp_letters,
  public.v_sp_pending
from anon, authenticated;

-- Master aturan: BK boleh menulis langsung (dibatasi RLS).
grant select, insert, update, delete
  on public.violation_rules
  to authenticated;

-- Data operasional: hanya baca. Semua tulis lewat RPC.
grant select
  on public.violation_records,
     public.point_ledger,
     public.sp_letters,
     public.audit_log
  to authenticated;

-- Kartu: jangan pernah kirim hash ke browser.
grant select (
  id, school_id, student_id, status, failed_attempts, locked_until,
  last_used_at, issued_at, revoked_at, revoked_reason, created_at, updated_at
)
  on public.student_cards
  to authenticated;

grant select
  on public.v_student_points,
     public.v_violation_feed,
     public.v_violation_leaderboard,
     public.v_class_points,
     public.v_sp_letters,
     public.v_sp_pending
  to authenticated;

grant select on public.v_student_points to service_role;
grant select on public.v_sp_letters to service_role;

-- Fungsi internal: cabut dari publik DAN role klien. Supabase memberi
-- default privilege ke anon/authenticated/service_role, jadi revoke dari
-- public saja tidak cukup.
revoke all on function public.resolve_period(uuid, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.log_audit(uuid, text, text, text, jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.set_point_ledger_balance()
  from public, anon, authenticated, service_role;
revoke all on function public.prevent_point_ledger_mutation()
  from public, anon, authenticated, service_role;
revoke all on function public.build_sp_snapshot(uuid, text, text, integer, integer, integer, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.maybe_create_sp_draft(uuid, text, uuid, smallint, boolean, uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.trg_point_ledger_sp()
  from public, anon, authenticated, service_role;

revoke all on function public.is_wali_of_student(text, uuid)
  from public, anon, service_role;
grant execute on function public.is_wali_of_student(text, uuid)
  to authenticated;

-- RPC yang dipakai aplikasi guru/BK. service_role tidak perlu karena
-- Edge Function hanya memakai verify_student_card.
revoke all on function public.record_violation(text, uuid, timestamptz, text, text, text[])
  from public, anon, service_role;
grant execute on function public.record_violation(text, uuid, timestamptz, text, text, text[])
  to authenticated;

revoke all on function public.void_violation(uuid, text)
  from public, anon, service_role;
grant execute on function public.void_violation(uuid, text)
  to authenticated;

revoke all on function public.create_manual_sp(text, text, text)
  from public, anon, service_role;
grant execute on function public.create_manual_sp(text, text, text)
  to authenticated;

revoke all on function public.issue_sp_letter(uuid, text, timestamptz)
  from public, anon, service_role;
grant execute on function public.issue_sp_letter(uuid, text, timestamptz)
  to authenticated;

revoke all on function public.cancel_sp_letter(uuid, text)
  from public, anon, service_role;
grant execute on function public.cancel_sp_letter(uuid, text)
  to authenticated;

revoke all on function public.set_sp_meeting(uuid, timestamptz)
  from public, anon, service_role;
grant execute on function public.set_sp_meeting(uuid, timestamptz)
  to authenticated;

revoke all on function public.create_student_card(text)
  from public, anon, service_role;
grant execute on function public.create_student_card(text)
  to authenticated;

revoke all on function public.revoke_student_card(uuid, text)
  from public, anon, service_role;
grant execute on function public.revoke_student_card(uuid, text)
  to authenticated;

-- Verifikasi kartu hanya untuk Edge Function (service role), bukan browser.
-- Ini wajib dicabut eksplisit dari anon/authenticated agar tidak bisa
-- dipakai brute-force token/PIN lewat PostgREST.
revoke all on function public.verify_student_card(text, text)
  from public, anon, authenticated;
grant execute on function public.verify_student_card(text, text)
  to service_role;

commit;

-- ============================================================================
-- CATATAN PASCA-MIGRASI
-- ============================================================================
-- 1. 39 aturan SMPN 34 sudah di-seed ke sekolah default. Poin aplikasi
--    otomatis dikali 10 (point_scale 1000).
-- 2. Semua penulisan pelanggaran/poin memakai RPC:
--      select public.record_violation('<student_id>', '<rule_uuid>');
--      select public.void_violation('<record_uuid>', 'Salah input');
-- 3. SP draft dibuat otomatis oleh trigger point_ledger. Draft tidak
--    pernah terkirim sendiri. Terbitkan lewat issue_sp_letter.
-- 4. Kartu siswa dibuat lewat create_student_card; token + PIN hanya
--    muncul sekali. Verifikasi lewat Edge Function yang memanggil
--    verify_student_card dengan service role.
-- 5. Jalankan supabase/verify/phase2.sql setelah migrasi.
-- ============================================================================
