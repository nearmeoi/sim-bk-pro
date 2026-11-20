# Rencana Tata Tertib & Sistem Poin — SIM BK PRO

Status: **disetujui, Fase 1 sedang disiapkan**
Branch: `feat/tata-tertib-poin`
Baseline mobile: `dc9d3b4` di `main`
Tanggal: 20 November 2026

---

## 1. Ringkasan

Fitur ini mengubah SIM BK dari aplikasi satu pemilik menjadi **SaaS satu sekolah
dengan banyak pengguna**:

- 1 sekolah = 1 workspace.
- Banyak guru BK dan wali kelas dalam workspace yang sama.
- 546 siswa (dan data lama) tetap utuh, tidak diimpor ulang.
- Setiap pelanggaran mengurangi poin siswa seperti *health bar* pada game.
- SP1–SP3 dibuat otomatis sebagai **draft** saat ambang tercapai, dan bisa
  dibuat manual oleh BK.
- Siswa punya kartu QR + PIN untuk melihat poin dan riwayatnya sendiri.
- Poin tidak pernah di-reset; laporan bisa dilihat per semester dan tahun ajaran.

### Keputusan yang sudah final

| Topik | Keputusan |
|---|---|
| Skala tampilan | **1000 poin** (buku panduan 100, dikali 10) |
| Leaderboard | BK semua kelas + wali kelas hanya kelasnya. Tidak ada nama siswa di portal siswa |
| Login siswa | **QR kartu + PIN 6 digit** |
| Skala surat SP | **Skala 100** sesuai buku panduan |
| Kasus vs Pelanggaran | **Tetap terpisah**, ditampilkan dalam satu timeline profil |
| Reset poin | **Tidak pernah reset**; riwayat per semester/tahun |
| SP | Otomatis draft + manual, tidak pernah terkirim sendiri |
| WhatsApp | Ditunda; nanti memakai tautan `wa.me` |

---

## 2. Peran dan hak akses

| Kemampuan | BK | Wali Kelas | Siswa |
|---|---|---|---|
| Melihat semua siswa sekolah | Ya | Tidak | Tidak |
| Melihat siswa di kelasnya | Ya | Ya | Tidak |
| Mencatat pelanggaran | Ya | Tidak (Fase 1) | Tidak |
| Melihat poin & riwayat kelas | Ya | Ya | Tidak |
| Melihat poin & riwayat sendiri | — | — | Ya |
| Membuat/mengubah aturan | Ya | Tidak | Tidak |
| Membuat SP otomatis/manual | Ya | Tidak | Tidak |
| Melihat SP | Ya | Kelasnya | Miliknya |
| Melihat kasus konseling | Ya | Tidak | Tidak |
| Mengelola user & kartu | Ya | Tidak | Tidak |
| Melihat leaderboard | Semua kelas | Kelasnya | Tidak |

Catatan:

- **Kepala sekolah** dan **guru piket** belum menjadi role pada Fase 1. Buku
  panduan menyebut mereka, tetapi kebutuhan saat ini cukup 3 peran. Role bisa
  ditambah tanpa mengubah data.
- Wali kelas bersifat **read-only** pada Fase 1. Usulan pelanggaran dari wali
  kelas bisa ditambahkan nanti sebagai fitur terpisah.
- Siswa tidak memakai Supabase Auth dan tidak punya akses langsung ke tabel.
  Semua akses lewat Edge Function portal siswa.

---

## 3. Model poin

### 3.1 Dua skala, satu data

Buku panduan memakai skala **0–100**. Aplikasi menampilkan **0–1000** agar
perubahan poin terasa lebih halus dan tidak cepat habis.

- Data aturan disimpan pada **skala sekolah** (`schools.point_scale`, default 1000).
- Aturan SMPN 34 di-seed dengan `points = poin_buku × 10`.
- Nilai asli buku panduan tetap disimpan di `guidebook_points` untuk cetak SP.
- Sisa poin = `point_scale − total poin pelanggaran`, minimal 0.

### 3.2 Pemetaan

| Poin buku | Poin aplikasi | Sisa dari 1000 |
|---:|---:|---:|
| 5 | 50 | 950 |
| 10 | 100 | 900 |
| 25 | 250 | 750 |
| 40 | 400 | 600 |
| 50 | 500 | 500 |
| 75 | 750 | 250 |
| 100 | 1000 | 0 |

### 3.3 Ambang dan status

| Total poin (1000) | Sisa | Status | Tindakan |
|---:|---:|---|---|
| 0–49 | 1000–951 | Aman | — |
| 50–259 | 950–741 | Pembinaan | Wali kelas, teguran lisan |
| 260–509 | 740–491 | SP1 | BK, panggilan orang tua I |
| 510–759 | 490–241 | SP2 | Skorsing 3 hari, panggilan II |
| 760–999 | 240–1 | SP3 | Skorsing 5–9 hari, peringatan terakhir |
| 1000+ | 0 | Sidang pleno | Dikembalikan ke orang tua / dikeluarkan |

Nilai default disimpan di `schools.sp_thresholds = {260,510,760,1000}` dan bisa
diubah per sekolah. Untuk sekolah yang tetap ingin skala 100, isi
`point_scale = 100` dan `sp_thresholds = {26,51,76,100}`.

### 3.4 Aturan perhitungan

1. **Ledger adalah sumber kebenaran.** Poin tidak diedit langsung di tabel siswa.
2. Setiap pelanggaran menghasilkan satu baris `point_ledger`.
3. Koreksi tidak menghapus baris lama; dibuat baris baru bertipe `correction`.
4. Poin prestasi (`achievement`) dicatat terpisah dan **tidak mengurangi**
   poin pelanggaran. Ini mencegah siswa “menebus” pelanggaran dengan prestasi.
5. Pelanggaran yang dibatalkan (`void`) menghasilkan baris koreksi, bukan hapus.
6. Total kumulatif dihitung dari seluruh ledger yang tidak `void`.
7. SP dihitung dari **kumulatif** (`sp_basis = cumulative`) sesuai keputusan.
   Sekolah lain bisa memilih `academic_year`.
8. SP otomatis hanya membuat **satu draft untuk jenis tertinggi** yang tercapai.
   Aturan dengan `sp_override` atau `is_expulsion` boleh membuat draft di atas
   hitungan poin; draft itu ditandai `is_override` dan tetap boleh diterbitkan
   walau total poin berada di bawah ambang jenisnya. Draft biasa tidak boleh
   diterbitkan bila koreksi sudah menurunkan poin di bawah ambang.

### 3.5 Riwayat semester dan tahun ajaran

Poin tidak di-reset. Setiap baris ledger menyimpan:

- `academic_year_id`
- `semester_id`
- `occurred_at`

Tampilan profil siswa:

| Kartu | Isi |
|---|---|
| Semester ini | Sisa poin + pelanggaran semester berjalan |
| Tahun ajaran ini | Sisa poin + total tahun berjalan |
| Kumulatif | Sisa poin sejak kelas 7 + total seumur sekolah |

Tab riwayat bisa difilter semester, tahun ajaran, kategori, dan status. SP tetap
memakai kumulatif, tetapi laporan dan leaderboard memakai semester berjalan agar
adil.

Saat migrasi, tahun ajaran aktif diisi rentang **1 Juli–30 Juni** (semester
Ganjil 1 Juli–31 Desember, Genap 1 Januari–30 Juni). Rentang ini wajib ada agar
pelanggaran yang diisi mundur (*backdate*) masuk ke tahun ajaran dan semester
yang benar, bukan ke tahun aktif.

---

## 4. Model data

### 4.1 Fase 1 — fondasi (sudah ditulis, belum diterapkan)

File: `supabase/migrations/20261120140000_saas_foundation.sql`

| Tabel | Fungsi |
|---|---|
| `schools` | Tenant, skala poin, ambang SP, mode leaderboard |
| `school_members` | User Auth + role `bk` / `wali_kelas` |
| `academic_years` | Tahun ajaran per sekolah, rentang Juli–Juni |
| `semesters` | Ganjil/Genap per tahun ajaran, dengan rentang tanggal |
| `classes` | Kelas per tahun ajaran + wali kelas |
| `students.school_id` | Pemilik tenant untuk setiap siswa |
| `students.class_id` | Kelas siswa, disinkronkan dari kolom `kelas` |

Kolom `owner_id` lama **dipertahankan sementara** agar aplikasi yang sekarang
tidak rusak. RLS baru tidak lagi memakai `owner_id`.

**Onboarding sekolah baru:** `claim_school` hanya menambahkan anggota BK
pertama. Tahun ajaran, semester, dan aturan belum dibuat otomatis. Sebelum
mencatat pelanggaran, isi minimal satu `academic_years` + `semesters` aktif dan
salin 39 aturan default ke sekolah tersebut. Tanpa tahun ajaran,
`record_violation` menolak dengan pesan “Tahun ajaran belum diatur untuk
sekolah ini.”

### 4.2 Fase 2 — aturan, pelanggaran, poin

| Tabel | Kolom penting |
|---|---|
| `violation_rules` | `school_id`, `code`, `category`, `name`, `points`, `guidebook_points`, `sp_override`, `is_expulsion`, `sanction_tiers`, `is_active` |
| `violation_records` | `school_id`, `student_id`, `rule_id`, snapshot aturan, `occurred_at`, `academic_year_id`, `semester_id`, `location`, `chronology`, `evidence_paths`, `reported_by`, `status`, `verified_by` |
| `point_ledger` | `school_id`, `student_id`, `violation_record_id`, `entry_type`, `points_delta`, `balance_after`, `academic_year_id`, `semester_id`, `occurred_at`, `reason`, `created_by` |
| `sp_letters` | `school_id`, `student_id`, `type`, `number`, `sequence`, `threshold_points`, `total_points`, `total_guidebook_points`, `status`, `is_manual`, `is_override`, `meeting_at`, `snapshot`, `pdf_path` |
| `student_cards` | `school_id`, `student_id`, `token_hash`, `pin_hash`, `status`, `failed_attempts`, `locked_until`, `last_used_at` |
| `audit_log` | `school_id`, `actor_id`, `action`, `table_name`, `record_id`, `before`, `after` |

Snapshot aturan di `violation_records` penting: jika master aturan diedit,
catatan lama dan SP lama tidak berubah.

### 4.3 View laporan

- `v_student_points` — total kumulatif, per tahun, per semester, sisa poin.
- `v_class_points` — agregat kelas untuk leaderboard positif.
- `v_violation_leaderboard` — peringkat semester berjalan untuk BK/wali.
- `v_sp_pending` — SP draft yang menunggu review BK.

### 4.4 RLS Fase 2

| Tabel | BK | Wali kelas | Siswa |
|---|---|---|---|
| `violation_rules` | Baca/tulis | Baca | Baca (via portal) |
| `violation_records` | Semua | Kelasnya | Miliknya |
| `point_ledger` | Semua | Kelasnya | Miliknya |
| `sp_letters` | Semua | Kelasnya | Miliknya |
| `student_cards` | Semua | Tidak | Tidak |
| `audit_log` | Semua | Tidak | Tidak |

---

## 5. Alur pencatatan pelanggaran

Mengikuti 5 tahap SOP buku panduan:

1. **Temuan / OTT** — guru menemukan pelanggaran.
2. **Amankan bukti & catat** — BK memilih siswa, aturan, lokasi, kronologi,
   bukti foto.
3. **Sanksi langsung** — sistem menampilkan sanksi yang disarankan dan
   menghitung pelanggaran ke berapa.
4. **Laporan digital** — catatan tersimpan, ledger bertambah, publikasi ke
   wali kelas.
5. **Pemanggilan & SP** — jika ambang tercapai, SP draft dibuat.

Detail UI BK:

1. Klik **Catat Pelanggaran** atau scan kartu siswa.
2. Pilih aturan (search + kategori). Poin muncul otomatis.
3. Isi tanggal, lokasi, kronologi, bukti.
4. Pratinjau dampak: total sebelum → sesudah, status, sanksi.
5. Simpan.
6. Jika ambang tercapai: tampil “SP1 draft dibuat” dengan tombol review.
7. BK bisa mengirim tautan `wa.me` ke orang tua (Fase 5).

Aturan idempotensi SP:

- Satu siswa hanya punya satu SP aktif per jenis per siklus kumulatif.
- Membuat SP draft berulang tidak boleh menghasilkan duplikat.
- SP manual selalu boleh, tetapi diberi tanda `manual = true`.
- SP tidak pernah dikirim otomatis.

---

## 6. Surat SP dan berita acara

### 6.1 Template

1. **SP1** — Panggilan Orang Tua I (260–509).
2. **SP2** — Panggilan Orang Tua II (510–759) + keterangan skorsing.
3. **SP3** — Peringatan Terakhir (760–999) + kewajiban pembinaan.
4. **Berita Acara Pertemuan Orang Tua** — tanda tangan orang tua, BK, wali
   kelas, kepala sekolah.
5. **Surat Pernyataan Siswa/Orang Tua**.
6. **Berita Acara Sidang Pleno** (1000) + lampiran rekap pelanggaran.

### 6.2 Susunan SP

- Kop surat sekolah.
- Nomor / Lampiran / Hal.
- Tujuan: orang tua/wali + alamat.
- Identitas siswa: nama, NIS/NISN, kelas, wali kelas.
- Narasi akumulasi poin dan dasar pemanggilan.
- Tabel pelanggaran: tanggal, aturan, kategori, poin, tindakan.
- Total poin, ambang, dan sanksi.
- Undangan: hari, tanggal, waktu, tempat, yang perlu dibawa.
- Penutup.
- Tanda tangan 3 kolom: Guru BK, Wali Kelas, Kepala Sekolah.
- Kolom konfirmasi orang tua/wali.
- Tembusan.

### 6.3 Format cetak

- A4 portrait.
- Times New Roman 12 pt, spasi 1,5, rata kanan-kiri.
- Margin 2,5 / 2 / 2,5 / 2 cm.
- Tanda tangan tidak terpotong antar halaman.
- Nomor halaman.
- Pratinjau = hasil cetak = hasil Word.
- PDF final disimpan di Storage agar cetak ulang identik.

### 6.4 Perubahan mesin dokumen

Mesin `src/mobile/docPreview.tsx` saat ini mendukung:

- A4 portrait/landscape.
- Section, tabel, catatan.
- Ekspor `.doc`.
- Tanda tangan 2 kolom.

Yang perlu ditambahkan:

- Blok surat: nomor, lampiran, hal, tujuan.
- Tabel identitas siswa.
- Tanda tangan 3 kolom + kolom orang tua.
- Pengaturan font, ukuran, spasi, margin.
- Nomor halaman.
- Lampiran tabel pelanggaran.
- Opsi skala poin surat (default 100).

---

## 7. Kartu siswa dan QR

### 7.1 Spesifikasi kartu

- Ukuran CR80: 85,6 × 54 mm.
- 8 kartu per lembar A4 + crop mark.
- Depan: logo, nama sekolah, “KARTU PELAJAR”, foto opsional, nama, NIS,
  kelas, QR, tahun berlaku.
- Belakang: aturan singkat, alamat portal, kontak BK, nomor kartu.
- PIN **tidak** dicetak di kartu.

### 7.2 Token QR

- Isi QR: `SIMBK1:<random 128-bit>`, bukan NIS/nama/PIN.
- Database menyimpan SHA-256 dari token, bukan token asli.
- Token bisa dicabut dan dibuat ulang.
- Satu siswa bisa punya satu kartu aktif; kartu lama otomatis `revoked`.

### 7.3 Login siswa

1. Scan QR → portal `/s/<token>`.
2. Masukkan PIN 6 digit.
3. Sesi berlaku 30–60 menit.
4. Salah PIN 5× → terkunci 15 menit.
5. BK bisa mencabut kartu atau mereset PIN.

QR saja tidak cukup karena kartu bisa difoto. QR + PIN adalah keseimbangan
antara keamanan dan kemudahan.

### 7.4 Pemakaian oleh guru

Scan kartu siswa membuka profil siswa langsung di aplikasi guru:

- BK: bisa mencatat pelanggaran.
- Wali kelas: hanya melihat siswa di kelasnya.
- Scan dicatat di `audit_log`.

### 7.5 Implementasi

- Tidak membuat 500 akun Supabase Auth.
- Edge Function `student-portal`:
  - verifikasi token + PIN,
  - rate limit,
  - kembalikan hanya data siswa tersebut,
  - tanda tangan sesi singkat.
- Tabel `student_cards` disiapkan di Fase 2.

---

## 8. Leaderboard dan privasi

Mode yang tersedia:

| Mode | Perilaku |
|---|---|
| `off` | Tidak ada leaderboard |
| `staff` (default) | BK melihat semua kelas; wali kelas hanya kelasnya |
| `class_only` | Hanya agregat kelas, tanpa nama siswa |
| `anonymous_public` | 5 besar anonim: inisial + NIS disamarkan |

Aturan:

- Peringkat memakai **poin semester berjalan**, bukan kumulatif.
- Siswa tidak pernah melihat nama siswa lain.
- Papan publik tidak menampilkan foto atau nama lengkap.
- Papan positif “Kelas Paling Tertib” lebih disarankan daripada papan aib.
- Data anak termasuk data pribadi; sekolah perlu kebijakan tertulis dan
  persetujuan orang tua sebelum publikasi.

---

## 9. Kasus vs Pelanggaran

| | Kasus | Pelanggaran |
|---|---|---|
| Sifat | Naratif, rahasia BK | Terstruktur, berbasis aturan |
| Contoh | “Siswa menarik diri”, “orang tua bercerai” | “Terlambat 10 menit” → 10 poin |
| Poin | Tidak ada | Ada |
| Akses | BK | BK + wali kelas kelasnya |
| Hasil | Konseling, status Proses/Selesai | Sanksi, SP1–SP3 |
| Terlihat siswa | Tidak | Ya, miliknya sendiri |

Keduanya tidak digabung karena:

- Kasus bersifat sensitif dan tidak boleh terlihat wali kelas.
- Pelanggaran butuh poin, bukti, dan audit.
- Satu kasus bisa menyebabkan pelanggaran, dan sebaliknya.

Yang disatukan hanya **tampilan**: profil siswa menampilkan timeline dengan dua
label. Menu bisa bernama “Kasus & Pelanggaran” dengan dua tab.

---

## 10. Migrasi dan keamanan

### 10.1 Urutan

1. Backup production (`pg_dump` / Supabase dashboard).
2. Buat project staging.
3. Jalankan `schema.sql` lama di staging.
4. Jalankan migrasi Fase 1 di staging.
5. Jalankan `supabase/verify/phase1.sql`.
6. Uji login BK, wali kelas, dan query lintas sekolah.
7. Baru jalankan di production pada jam sepi.
8. Deploy frontend dengan feature flag.

### 10.2 Prinsip

- Jangan pernah menjalankan ulang `schema.sql` di production; file itu berisi
  `DROP TABLE`.
- Semua perubahan baru lewat `supabase/migrations/`.
- Jangan commit `supabase/import/` (sudah di-ignore).
- `owner_id` dipertahankan sampai frontend selesai migrasi.
- `school_id` punya default ke sekolah pertama selama masa transisi.
- Rollback darurat: `supabase/rollback/20261120140000_saas_foundation_rollback.sql`.

### 10.3 Setelah migrasi

- Semua data lama masuk ke sekolah
  `00000000-0000-4000-8000-000000000034`.
- Pemilik data lama otomatis menjadi BK.
- Siswa otomatis dipetakan ke kelas berdasarkan kolom `kelas`.
- Wali kelas belum ditugaskan; assign lewat SQL atau UI Fase 4.

### 10.4 Perubahan frontend yang menyertai Fase 1

- `src/services/supabaseService.ts` sekarang mencari `school_settings`
  berdasarkan `school_id`, bukan `id = user.id`. Ini membuat pengaturan
  sekolah terbaca oleh semua guru di sekolah yang sama.
- Semua service lain tetap memakai `select('*')`; RLS yang membatasi baris.
  Tidak ada perubahan data yang perlu dikirim frontend karena `school_id`
  punya default selama masa transisi.
- Untuk sementara aplikasi memakai keanggotaan sekolah aktif pertama.
  Jika satu user nanti menjadi anggota beberapa sekolah, perlu pemilih
  sekolah aktif.

Contoh assign wali kelas:

```sql
-- 1. Tambahkan user (buat dulu di Supabase Auth)
insert into public.school_members (school_id, user_id, role, display_name)
values (
  '00000000-0000-4000-8000-000000000034',
  '<uuid-user-wali>',
  'wali_kelas',
  'Nama Wali Kelas'
);

-- 2. Tugaskan ke kelas
update public.classes
set homeroom_member_id = (
  select id from public.school_members
  where school_id = '00000000-0000-4000-8000-000000000034'
    and user_id = '<uuid-user-wali>'
)
where school_id = '00000000-0000-4000-8000-000000000034'
  and name = '7A';
```

---

## 11. Fase pengerjaan

| Fase | Isi | Status |
|---|---|---|
| **0** | Commit mobile baseline, branch, backup/staging | Selesai untuk commit + branch |
| **1** | Schema SaaS, role, RLS, migrasi data lama | SQL ditulis, belum diterapkan |
| **2** | Master aturan, catat pelanggaran, ledger, tab siswa | Belum |
| **3** | SP1–3, berita acara, preview/cetak/Word, rekap | Belum |
| **4** | Manajemen user, portal wali, kartu QR + PIN | Belum |
| **5** | Mobile parity, `wa.me`, audit, testing 320–430 | Belum |

MVP yang layak dipakai: **Fase 1–3**.

---

## 12. Kriteria penerimaan

### Fase 1

- [ ] 546 siswa tetap ada dan semuanya punya `school_id`.
- [ ] Tidak ada siswa yang `class_id`-nya milik sekolah lain.
- [ ] BK bisa membaca semua siswa di sekolahnya.
- [ ] Wali kelas hanya bisa membaca siswa di kelas yang ditugaskan.
- [ ] Wali kelas tidak bisa membaca kasus/konseling.
- [ ] User sekolah lain tidak bisa membaca data sekolah ini.
- [ ] Insert dari aplikasi lama tetap berhasil tanpa mengirim `school_id`.
- [ ] `verify/phase1.sql` tidak menunjukkan pelanggaran integritas.

### Fase 2

- [ ] 39 aturan SMPN 34 ter-seed, bisa diedit.
- [ ] Pelanggaran mengurangi poin dan menghasilkan ledger.
- [ ] Koreksi tidak menghapus riwayat.
- [ ] Total semester, tahun, dan kumulatif benar.
- [ ] Wali kelas hanya melihat pelanggaran kelasnya.
- [ ] Siswa tidak bisa mengakses data siswa lain.

### Fase 3

- [ ] SP draft otomatis dibuat sekali saat ambang tercapai.
- [ ] SP manual bisa dibuat kapan saja.
- [ ] Preview, cetak, PDF, dan Word rapi.
- [ ] Nomor surat unik per jenis per tahun.
- [ ] Data siswa di SP memakai snapshot saat terbit.

### Fase 4

- [ ] Kartu QR tercetak 8 per A4.
- [ ] Login QR + PIN berhasil.
- [ ] Kartu hilang bisa dicabut.
- [ ] PIN salah berulang terkunci.
- [ ] Scan guru membuka siswa yang benar.

---

## 13. Pengujian

- **SQL/RLS**: tiga user uji (BK, wali 7A, wali 7B) + satu user sekolah lain.
- **Unit**: perhitungan sisa poin, ambang SP, idempotensi SP, koreksi ledger.
- **UI**: 320/360/390/430 px untuk mobile; 1280/1440 untuk PC.
- **Dokumen**: cetak A4, PDF, Word, tanda tangan tidak terpotong.
- **Migrasi**: bandingkan jumlah baris sebelum/sesudah, cek sampel 10 siswa.
- **Keamanan**: token kartu tidak bisa dipakai tanpa PIN; tidak ada kebocoran
  nama siswa di portal siswa.

---

## 14. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Migrasi merusak data production | Backup + staging + verifikasi + rollback |
| Aplikasi lama berhenti menulis | `school_id` default + trigger kelas |
| Wali kelas melihat data sensitif | RLS ketat; kasus tetap BK-only |
| Siswa saling melihat poin | Portal hanya data sendiri; tidak ada daftar nama |
| Kartu difoto orang lain | QR + PIN, rate limit, revoke |
| SP dobel | Idempotensi + unique index |
| Poin diedit manual | Ledger immutable + audit log |
| Aturan buku tidak konsisten | Master data editable + verifikasi sekolah |

---

## 15. Hal yang masih perlu diputuskan nanti

Ini tidak menghambat Fase 1–3, tetapi perlu sebelum Fase 4:

1. Siapa saja wali kelas yang dibuatkan akun lebih dulu?
2. Apakah wali kelas boleh **mengusulkan** pelanggaran, atau tetap read-only?
3. Apakah poin prestasi ditampilkan ke siswa?
4. Apakah sekolah ingin papan publik anonim, atau cukup papan kelas?
5. Siapa yang menandatangani SP3 dan berita acara sidang pleno?

Default saat ini sudah dipilih agar pekerjaan bisa jalan tanpa menunggu:
read-only, tanpa papan publik, poin prestasi terpisah, dan tanda tangan BK +
wali kelas + kepala sekolah.
