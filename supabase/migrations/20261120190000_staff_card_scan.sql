-- ============================================================================
-- SIM-BK | Pemindaian kartu siswa oleh guru
-- ============================================================================
-- Tujuan:
--   1. Guru BK dapat memindai kartu siswa mana pun di sekolahnya.
--   2. Wali kelas hanya dapat membuka siswa di kelas yang diampu.
--   3. Setiap pindaian berhasil dicatat di audit_log.
--
-- Kartu guru memakai token QR saja (tanpa PIN). Token bersifat fisik dan
-- 128-bit, sedangkan PIN tetap wajib untuk portal siswa. Dengan begitu guru
-- tidak perlu meminta PIN siswa saat mencatat pelanggaran.
-- ============================================================================

create or replace function public.resolve_student_card(p_token text)
returns table (
  card_id                uuid,
  student_id             text,
  school_id              uuid,
  nama                   text,
  nis                    text,
  nisn                   text,
  jk                     text,
  kelas                  text,
  class_id               uuid,
  student_status         text,
  point_scale            integer,
  total_points           integer,
  total_guidebook_points integer,
  semester_points        integer,
  year_points            integer,
  balance                integer,
  status                 text,
  last_violation_at      timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_input  text;
  v_token  text;
  v_hash   text;
  v_card   public.student_cards%rowtype;
  v_member public.school_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Harus login terlebih dahulu.';
  end if;

  -- Terima token mentah, tempelan URL, atau query string ?card=...
  v_input := trim(coalesce(p_token, ''));

  if v_input ~* '^https?://' then
    v_token := coalesce(
      substring(v_input from '[?&]card=([^&#]+)'),
      ''
    );
  elsif position('card=' in v_input) > 0 then
    v_token := coalesce(
      substring(v_input from 'card=([^&#]+)'),
      ''
    );
  else
    v_token := v_input;
  end if;

  -- URL mungkin menuliskan ':' sebagai %3A.
  v_token := replace(v_token, '%3A', ':');
  v_token := replace(v_token, '%3a', ':');
  v_token := trim(both '"' from trim(v_token));

  if v_token !~ '^SIMBK1:[A-Za-z0-9_-]{16,64}$' then
    raise exception 'Kode kartu tidak valid.';
  end if;

  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  select c.* into v_card
  from public.student_cards c
  where c.token_hash = v_hash
    and c.status = 'active'
  limit 1;

  if not found then
    raise exception 'Kartu tidak dikenali atau sudah dicabut.';
  end if;

  select m.* into v_member
  from public.school_members m
  where m.school_id = v_card.school_id
    and m.user_id = auth.uid()
    and m.is_active
  limit 1;

  if not found then
    raise exception 'Akun ini bukan staf aktif di sekolah pemilik kartu.';
  end if;

  if v_member.role <> 'bk'
     and not public.is_wali_of_student(v_card.student_id, v_card.school_id)
  then
    raise exception 'Siswa ini bukan anggota kelas yang Anda ampu.';
  end if;

  perform public.log_audit(
    v_card.school_id,
    'card.scanned',
    'student_cards',
    v_card.id::text,
    null,
    jsonb_build_object(
      'student_id', v_card.student_id,
      'member_id', v_member.id,
      'role', v_member.role
    )
  );

  return query
  select
    v_card.id,
    p.student_id,
    p.school_id,
    p.nama,
    p.nis,
    p.nisn,
    p.jk::text,
    p.kelas,
    p.class_id,
    p.student_status,
    p.point_scale,
    p.total_points,
    p.total_guidebook_points,
    p.semester_points,
    p.year_points,
    p.balance,
    p.status,
    p.last_violation_at
  from public.v_student_points p
  where p.school_id = v_card.school_id
    and p.student_id = v_card.student_id;
end;
$$;

comment on function public.resolve_student_card(text) is
  'Guru memindai token kartu siswa. BK melihat semua siswa; wali kelas hanya kelasnya. Pindaian dicatat di audit_log.';

revoke all on function public.resolve_student_card(text)
  from public, anon, authenticated, service_role;

grant execute on function public.resolve_student_card(text) to authenticated;
