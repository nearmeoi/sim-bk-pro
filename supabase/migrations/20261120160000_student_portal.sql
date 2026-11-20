-- ============================================================================
-- SIM-BK | Portal siswa: sesi QR + PIN
-- ============================================================================
-- Portal siswa TIDAK memakai Supabase Auth per siswa. Kartu QR + PIN
-- diverifikasi oleh Edge Function `student-portal` memakai service role,
-- lalu Edge Function membuat sesi singkat di tabel ini.
--
-- Tabel sesi tidak boleh dibaca/ditulis browser. Hanya service_role yang
-- boleh menyentuhnya. Semua akses siswa lewat RPC di bawah.
-- ============================================================================

create table public.student_portal_sessions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  student_id    text not null,
  card_id       uuid not null references public.student_cards(id) on delete cascade,
  token_hash    text not null unique,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz,

  constraint student_portal_sessions_student_fk
    foreign key (student_id, school_id)
    references public.students (id, school_id)
    on delete cascade
);

create index idx_student_portal_sessions_student
on public.student_portal_sessions (school_id, student_id, expires_at desc);

create index idx_student_portal_sessions_expiry
on public.student_portal_sessions (expires_at);

comment on table public.student_portal_sessions is
  'Sesi portal siswa setelah verifikasi kartu QR + PIN. Token asli hanya dipegang browser; database menyimpan SHA-256.';
comment on column public.student_portal_sessions.token_hash is
  'SHA-256 dari token sesi. Token asli tidak pernah disimpan.';
comment on column public.student_portal_sessions.expires_at is
  'Sesi berakhir otomatis; default 45 menit sejak login.';

alter table public.student_portal_sessions enable row level security;

-- Tidak ada policy: service_role melewati RLS, browser tidak punya akses.
revoke all on table public.student_portal_sessions from anon, authenticated;
grant select, insert, update, delete on table public.student_portal_sessions to service_role;

-- ============================================================================
-- Login portal: verifikasi kartu + PIN, buat sesi singkat
-- ============================================================================
create or replace function public.student_portal_login(
  p_token text,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_result   jsonb;
  v_card     public.student_cards%rowtype;
  v_session  text;
  v_expires  timestamptz;
begin
  v_result := public.verify_student_card(p_token, p_pin);

  if not coalesce((v_result->>'ok')::boolean, false) then
    return v_result;
  end if;

  select * into v_card
  from public.student_cards
  where token_hash = encode(digest(trim(p_token), 'sha256'), 'hex')
    and status = 'active';

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Kartu atau PIN tidak valid.');
  end if;

  -- Bersihkan sesi yang sudah lama berakhir agar tabel tidak membengkak.
  delete from public.student_portal_sessions
  where expires_at < now() - interval '1 day';

  v_session := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + interval '45 minutes';

  insert into public.student_portal_sessions (
    school_id, student_id, card_id, token_hash, expires_at
  )
  values (
    v_card.school_id,
    v_card.student_id,
    v_card.id,
    encode(digest(v_session, 'sha256'), 'hex'),
    v_expires
  );

  return v_result || jsonb_build_object(
    'session_token', v_session,
    'expires_at', v_expires
  );
end;
$$;

-- ============================================================================
-- Data portal: hanya milik siswa pemilik sesi
-- ============================================================================
create or replace function public.student_portal_data(
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_session          public.student_portal_sessions%rowtype;
  v_card             public.student_cards%rowtype;
  v_student          public.students%rowtype;
  v_school           public.schools%rowtype;
  v_points           record;
  v_violations       jsonb;
  v_letters          jsonb;
  v_next_threshold   integer;
  v_next_type        text;
begin
  if p_session_token is null or length(trim(p_session_token)) < 32 then
    return jsonb_build_object('ok', false, 'error', 'Sesi tidak valid.');
  end if;

  select * into v_session
  from public.student_portal_sessions
  where token_hash = encode(digest(trim(p_session_token), 'sha256'), 'hex')
  for update;

  if not found
     or v_session.revoked_at is not null
     or v_session.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'Sesi berakhir. Silakan login ulang.');
  end if;

  select * into v_card
  from public.student_cards
  where id = v_session.card_id;

  if not found or v_card.status <> 'active' then
    update public.student_portal_sessions
    set revoked_at = coalesce(revoked_at, now())
    where id = v_session.id;

    return jsonb_build_object(
      'ok', false,
      'error', 'Kartu sudah tidak aktif. Hubungi Guru BK.'
    );
  end if;

  select * into v_student
  from public.students
  where id = v_session.student_id
    and school_id = v_session.school_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Data siswa tidak ditemukan.');
  end if;

  select * into v_school
  from public.schools
  where id = v_session.school_id;

  select * into v_points
  from public.v_student_points
  where school_id = v_session.school_id
    and student_id = v_session.student_id;

  update public.student_portal_sessions
  set last_seen_at = now()
  where id = v_session.id;

  select coalesce(jsonb_agg(row_data order by occurred_at desc), '[]'::jsonb)
    into v_violations
  from (
    select
      vr.occurred_at,
      jsonb_build_object(
        'id', vr.id,
        'occurred_at', vr.occurred_at,
        'rule_code', vr.rule_code,
        'rule_name', vr.rule_name,
        'category', vr.rule_category,
        'points', vr.rule_points,
        'guidebook_points', vr.rule_guidebook_points,
        'location', vr.location,
        'status', vr.status
      ) as row_data
    from public.v_violation_feed vr
    where vr.school_id = v_session.school_id
      and vr.student_id = v_session.student_id
    order by vr.occurred_at desc
    limit 100
  ) feed;

  select coalesce(jsonb_agg(row_data order by issued_at desc), '[]'::jsonb)
    into v_letters
  from (
    select
      sp.issued_at,
      jsonb_build_object(
        'id', sp.id,
        'type', sp.type,
        'number', sp.number,
        'status', sp.status,
        'total_points', sp.total_points,
        'total_guidebook_points', sp.total_guidebook_points,
        'issued_at', sp.issued_at,
        'meeting_at', sp.meeting_at
      ) as row_data
    from public.v_sp_letters sp
    where sp.school_id = v_session.school_id
      and sp.student_id = v_session.student_id
      and sp.status = 'issued'
    order by sp.issued_at desc
    limit 50
  ) letters;

  if cardinality(v_school.sp_thresholds) = 4 then
    if v_points.total_points < v_school.sp_thresholds[1] then
      v_next_threshold := v_school.sp_thresholds[1];
      v_next_type := 'sp1';
    elsif v_points.total_points < v_school.sp_thresholds[2] then
      v_next_threshold := v_school.sp_thresholds[2];
      v_next_type := 'sp2';
    elsif v_points.total_points < v_school.sp_thresholds[3] then
      v_next_threshold := v_school.sp_thresholds[3];
      v_next_type := 'sp3';
    elsif v_points.total_points < v_school.sp_thresholds[4] then
      v_next_threshold := v_school.sp_thresholds[4];
      v_next_type := 'pleno';
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'student', jsonb_build_object(
      'nama', v_student.nama,
      'nis', v_student.nis,
      'nisn', v_student.nisn,
      'kelas', v_student.kelas
    ),
    'school', jsonb_build_object(
      'nama', v_school.name,
      'npsn', v_school.npsn
    ),
    'points', jsonb_build_object(
      'point_scale', v_points.point_scale,
      'total_points', v_points.total_points,
      'total_guidebook_points', v_points.total_guidebook_points,
      'balance', v_points.balance,
      'semester_points', v_points.semester_points,
      'year_points', v_points.year_points,
      'status', v_points.status,
      'last_violation_at', v_points.last_violation_at
    ),
    'thresholds', to_jsonb(v_school.sp_thresholds),
    'next_threshold', v_next_threshold,
    'next_type', v_next_type,
    'violations', v_violations,
    'sp_letters', v_letters,
    'server_time', now()
  );
end;
$$;

-- ============================================================================
-- Logout portal
-- ============================================================================
create or replace function public.student_portal_logout(
  p_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  if p_session_token is not null and length(trim(p_session_token)) >= 32 then
    update public.student_portal_sessions
    set revoked_at = coalesce(revoked_at, now())
    where token_hash = encode(digest(trim(p_session_token), 'sha256'), 'hex');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================================
-- Hak eksekusi: hanya service_role (Edge Function)
-- ============================================================================
revoke all on function public.student_portal_login(text, text) from public, anon, authenticated;
revoke all on function public.student_portal_data(text) from public, anon, authenticated;
revoke all on function public.student_portal_logout(text) from public, anon, authenticated;

grant execute on function public.student_portal_login(text, text) to service_role;
grant execute on function public.student_portal_data(text) to service_role;
grant execute on function public.student_portal_logout(text) to service_role;
