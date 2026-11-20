-- ============================================================================
-- SIM-BK PRO | Verifikasi Fase 2
-- ============================================================================
-- Jalankan SETELAH migrasi 20261120150000_tata_tertib_poin.sql.
-- Semua query bersifat read-only. Hasil yang diharapkan ditulis di komentar.
-- ============================================================================

-- 1. Tabel Fase 2 ada dan RLS aktif -----------------------------------------
-- Harus 6 baris, semuanya rls_aktif = true.
select c.relname as tabel, c.relrowsecurity as rls_aktif
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'violation_rules', 'violation_records', 'point_ledger',
    'sp_letters', 'student_cards', 'audit_log'
  )
order by c.relname;

-- 2. Seed aturan per kategori -------------------------------------------------
-- SMPN 34: kewajiban 3, ringan 11, sedang 5, berat 9, sangat_berat 11.
select school_id, category, count(*) as jumlah
from public.violation_rules
group by school_id, category
order by school_id, category;

-- 3. Total aturan dan konversi skala ----------------------------------------
-- total_aturan harus 39. Kolom menyimpang hanya informasi: sekolah boleh
-- mengedit poin, jadi nilai > 0 bukan berarti migrasi gagal.
select
  s.name as sekolah,
  s.point_scale,
  count(r.id) as total_aturan,
  count(*) filter (
    where r.points = r.guidebook_points * (s.point_scale / 100)
  ) as sesuai_skala,
  count(*) filter (
    where r.points <> r.guidebook_points * (s.point_scale / 100)
  ) as menyimpang
from public.schools s
left join public.violation_rules r on r.school_id = s.id
group by s.id, s.name, s.point_scale
order by s.name;

-- 4. Aturan ganda / tidak valid ---------------------------------------------
-- Harus 0 baris.
select school_id, code, count(*) as jumlah
from public.violation_rules
group by school_id, code
having count(*) > 1;

select count(*) as aturan_tidak_valid
from public.violation_rules
where points <= 0
   or guidebook_points <= 0
   or category not in ('kewajiban', 'ringan', 'sedang', 'berat', 'sangat_berat');

-- 5. Relasi lintas sekolah (harus 0) ----------------------------------------
select 'violation_records -> students' as relasi, count(*) as orphan
from public.violation_records vr
left join public.students st
  on st.id = vr.student_id and st.school_id = vr.school_id
where st.id is null
union all
select 'violation_records -> rules', count(*)
from public.violation_records vr
left join public.violation_rules r
  on r.id = vr.rule_id and r.school_id = vr.school_id
where r.id is null
union all
select 'point_ledger -> students', count(*)
from public.point_ledger pl
left join public.students st
  on st.id = pl.student_id and st.school_id = pl.school_id
where st.id is null
union all
select 'sp_letters -> students', count(*)
from public.sp_letters sp
left join public.students st
  on st.id = sp.student_id and st.school_id = sp.school_id
where st.id is null
union all
select 'student_cards -> students', count(*)
from public.student_cards sc
left join public.students st
  on st.id = sc.student_id and st.school_id = sc.school_id
where st.id is null;

-- 6. Duplikasi baris ledger per pelanggaran (harus 0 baris) ------------------
select violation_record_id, entry_type, count(*) as jumlah
from public.point_ledger
where violation_record_id is not null
group by violation_record_id, entry_type
having count(*) > 1;

-- 7. Saldo ledger terakhir vs total pelanggaran (harus 0) -------------------
with latest as (
  select distinct on (school_id, student_id)
    school_id, student_id, balance_after
  from public.point_ledger
  order by school_id, student_id, created_at desc, id desc
),
totals as (
  select school_id, student_id, sum(violation_delta)::integer as total
  from public.point_ledger
  group by school_id, student_id
)
select count(*) as saldo_tidak_sesuai
from latest l
join totals t
  on t.school_id = l.school_id and t.student_id = l.student_id
join public.schools s on s.id = l.school_id
where l.balance_after <> s.point_scale - t.total;

-- 8. SP ganda / tidak lengkap ------------------------------------------------
-- Harus 0 baris: satu draft per siswa per jenis.
select school_id, student_id, type, count(*) as jumlah
from public.sp_letters
where status = 'draft'
group by school_id, student_id, type
having count(*) > 1;

-- Harus 0: SP terbit wajib punya nomor, waktu terbit, dan penerbit.
select count(*) as sp_terbit_tidak_lengkap
from public.sp_letters
where status = 'issued'
  and (number is null or trim(number) = '' or issued_at is null or issued_by is null);

-- Harus 0 baris: draft otomatis yang sudah turun di bawah ambang.
-- Ini bisa terjadi setelah koreksi; review lalu batalkan draft tersebut.
select sp.id, sp.student_id, sp.type,
       sp.total_points as poin_saat_draft,
       p.total_points as poin_sekarang,
       sp.threshold_points as ambang
from public.sp_letters sp
join public.schools s on s.id = sp.school_id
join public.v_student_points p
  on p.school_id = sp.school_id and p.student_id = sp.student_id
where sp.status = 'draft'
  and not sp.is_manual
  and not sp.is_override
  and s.sp_basis = 'cumulative'
  and p.total_points < sp.threshold_points
order by sp.created_at;

-- 9. Kartu siswa -------------------------------------------------------------
-- Harus 0: token hash 64 hex, PIN hash bcrypt, dan tidak ada token asli.
select count(*) as token_hash_tidak_valid
from public.student_cards
where token_hash !~ '^[0-9a-f]{64}$';

select count(*) as pin_hash_bukan_bcrypt
from public.student_cards
where pin_hash !~ '^\$2[aby]\$';

select count(*) as token_plaintext_bocor
from public.student_cards
where token_hash like 'SIMBK1:%';

-- Harus 0 baris: satu kartu aktif per siswa.
select school_id, student_id, count(*) as jumlah
from public.student_cards
where status = 'active'
group by school_id, student_id
having count(*) > 1;

-- 10. View laporan ada dan memakai security_invoker -------------------------
-- Harus 6 baris dengan security_invoker=true.
select c.relname as view_name, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in (
    'v_student_points', 'v_violation_feed', 'v_violation_leaderboard',
    'v_class_points', 'v_sp_letters', 'v_sp_pending'
  )
order by c.relname;

-- 11. Hak akses hash dan RPC verifikasi -------------------------------------
-- Semua harus false kecuali yang ditandai true.
select
  has_table_privilege('anon', 'public.violation_rules', 'SELECT')
    as anon_baca_aturan,                                  -- false
  has_table_privilege('authenticated', 'public.violation_rules', 'SELECT')
    as guru_baca_aturan,                                  -- true
  has_table_privilege('authenticated', 'public.point_ledger', 'INSERT')
    as guru_insert_ledger,                                -- false
  has_column_privilege('authenticated', 'public.student_cards', 'token_hash', 'SELECT')
    as guru_baca_token_hash,                              -- false
  has_column_privilege('authenticated', 'public.student_cards', 'pin_hash', 'SELECT')
    as guru_baca_pin_hash,                                -- false
  has_column_privilege('authenticated', 'public.student_cards', 'id', 'SELECT')
    as guru_baca_kartu,                                   -- true
  has_function_privilege('anon', 'public.verify_student_card(text,text)', 'EXECUTE')
    as anon_verifikasi_kartu,                             -- false
  has_function_privilege('authenticated', 'public.verify_student_card(text,text)', 'EXECUTE')
    as guru_verifikasi_kartu,                             -- false
  has_function_privilege('service_role', 'public.verify_student_card(text,text)', 'EXECUTE')
    as edge_verifikasi_kartu;                             -- true

-- 12. Fungsi Fase 2 tersedia ------------------------------------------------
select proname, prosecdef as security_definer, proacl
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'record_violation', 'void_violation',
    'create_manual_sp', 'issue_sp_letter', 'cancel_sp_letter', 'set_sp_meeting',
    'create_student_card', 'revoke_student_card', 'verify_student_card',
    'maybe_create_sp_draft', 'build_sp_snapshot', 'resolve_period'
  )
order by proname;

-- 13. Index penting ----------------------------------------------------------
select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'point_ledger_one_entry_per_type',
    'sp_letters_number_unique',
    'sp_letters_one_draft_per_type',
    'student_cards_one_active',
    'idx_violation_records_student',
    'idx_point_ledger_student'
  )
order by indexname;

-- 14. Ambang SP per sekolah --------------------------------------------------
select id, name, point_scale, sp_thresholds, sp_basis,
       cardinality(sp_thresholds) = 4 as jumlah_ambang_benar,
       sp_thresholds[1] < sp_thresholds[2]
         and sp_thresholds[2] < sp_thresholds[3]
         and sp_thresholds[3] < sp_thresholds[4] as urutan_benar
from public.schools
order by created_at;

-- 15. Ringkasan jumlah data --------------------------------------------------
select
  (select count(*) from public.violation_rules)     as aturan,
  (select count(*) from public.violation_records)   as pelanggaran,
  (select count(*) from public.point_ledger)        as baris_ledger,
  (select count(*) from public.sp_letters)          as surat_sp,
  (select count(*) from public.student_cards)       as kartu_siswa,
  (select count(*) from public.audit_log)           as baris_audit;

-- 16. Audit terakhir (informasi) ---------------------------------------------
select action, table_name, record_id, created_at
from public.audit_log
order by created_at desc, id desc
limit 20;
