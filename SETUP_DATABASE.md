# Panduan Setup Database Supabase untuk SIM-BK PRO

## Langkah 1: Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com) → **New Project**
2. Isi nama project (mis. `sim-bk-pro`), pilih region terdekat (mis. `Southeast Asia (Singapore)`)
3. Simpan password database yang kuat

---

## Langkah 2: Jalankan SQL Schema

1. Di dashboard Supabase, buka **SQL Editor**
2. Klik **New Query**
3. Salin seluruh isi file [`supabase/schema.sql`](./supabase/schema.sql) dan tempel di editor
4. Klik **Run** (Ctrl+Enter)

Ini akan membuat 8 tabel:
| Tabel | Fungsi |
|---|---|
| `students` | Data master siswa |
| `counseling_records` | Catatan konseling individual/kelompok |
| `case_items` | Daftar kasus aktif |
| `daily_journals` | Jurnal harian BK |
| `school_settings` | Pengaturan sekolah & kop surat |
| `prota_items` | Program Tahunan (PROTA) |
| `career_surveys` | Angket Bimbingan Karir / E-Shinro |
| `akpd_tallies` | Rekapitulasi AKPD 50 Butir |

---

## Langkah 3: Konfigurasi Autentikasi

1. Buka **Authentication > Users** → **Add User**
2. Isi email (mis. `guru_bk@sekolah.id`) dan password
3. Atau gunakan format NIP: `197509121998032001@sim-bk.local` (NIP + `@sim-bk.local`)

> Jika login menggunakan NIP (tanpa `@`), sistem otomatis menambahkan `@sim-bk.local`

---

## Langkah 4: Ambil Kredensial API

1. Buka **Project Settings > API**
2. Salin:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## Langkah 5: Buat File `.env.local`

Buat file `.env.local` di root proyek (sejajar `package.json`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Jangan commit file `.env.local` ke Git.** Sudah ada di `.gitignore`.

---

## Langkah 6: Jalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:5173`, login dengan akun yang dibuat di Langkah 3.

---

## Fitur Database yang Aktif

| Fitur | Keterangan |
|---|---|
| ✅ CRUD ke cloud | Setiap tambah/ubah/hapus langsung tersimpan ke Supabase |
| ✅ Sync saat login | Saat login, data terbaru ditarik dari cloud |
| ✅ Realtime | Perubahan dari tab/device lain langsung muncul otomatis |
| ✅ Mode offline | Jika `.env.local` tidak ada, aplikasi tetap jalan dengan localStorage |
| ✅ Manual sync | Tombol "Tarik dari Cloud" / "Unggah ke Cloud" di halaman Pengaturan |

---

## Troubleshooting

**Q: Login gagal "Invalid login credentials"**
→ Pastikan user sudah dibuat di Supabase Authentication > Users

**Q: Data tidak muncul setelah login**
→ Klik "Tarik dari Cloud" di halaman Pengaturan, atau cek RLS policy di SQL Editor

**Q: Supabase belum dikonfigurasi (Mode Lokal)**
→ Pastikan `.env.local` sudah ada dan nilai `VITE_SUPABASE_URL` tidak mengandung `your-project-ref`

**Q: Error "new row violates row-level security policy"**
→ Pastikan user sudah login sebelum mencoba menulis data


## MIGRASI WAJIB (multi-tenan + pengaman RLS)
Jalankan supabase/owner-migration.sql di SQL Editor Supabase SEKALI
SEBELUM mengunakan versi baru aplikasi. Tanpa migrasi ini, semua tulisan
dari aplikasi baru akan ditolak database (policy owner_id).
Detail: isi tabel lama otomatis dikaitkan ke akun Supabase pertama.
