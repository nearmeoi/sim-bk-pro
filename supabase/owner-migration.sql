-- ============================================================================
-- MIGRASI MULTI-TENAN + PENGAMAN RLS (SIM BK PRO)
-- Jalankan di SQL Editor Supabase (Dashboard) SEKALI SAJA.
-- Tujuan:
--   1. Setiap data dikunci ke akun pemiliknya (kolom owner_id).
--   2. Anonim (tanpa login) tidak bisa membaca/ubah apa pun.
-- ============================================================================

DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'school_settings',
    'students',
    'counseling_records',
    'case_items',
    'daily_journals',
    'prota_items',
    'career_surveys',
    'akpd_tallies'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    -- 1. Buang policy lama yang "terbuka untuk semua"
    EXECUTE format('DROP POLICY IF EXISTS "Akses Penuh Guru Terotentikasi" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Akses Anonim Terbatas" ON public.%I', t);

    -- 2. Tambah kolom owner_id, isi ulang data lama ke user pertama (satu-sekolah-per-database)
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET owner_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) WHERE owner_id IS NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id SET DEFAULT auth.uid()', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN owner_id SET NOT NULL', t);

    -- 3. Policy baru: hanya pemilik data sendiri yang boleh baca/tulis
    EXECUTE format(
      'CREATE POLICY "Pemilik Data" ON public.%I FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())',
      t
    );
  END LOOP;
END $$;

-- 4. Blokir total akses tanpa login (anon)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Selesai. Aplikasi tidak perlu diubah untuk insert/update/delete:
-- kolom owner_id terisi otomatis dari akun yang sedang masuk (DEFAULT auth.uid()).
