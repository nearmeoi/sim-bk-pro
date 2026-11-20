# Rencana Perbaikan Halaman Tata Tertib untuk Guru Senior

Status: rencana (belum dikerjakan)
Cakupan: halaman **Tata Tertib & Poin Siswa** di desktop, plus penyesuaian teks di `/m/`
Prinsip utama: **jangan mengubah logika poin, ledger, SP, atau struktur data** — hanya tampilan, bahasa, dan alur.

---

## 1. Ringkasan

Tampilan sekarang enak dilihat untuk pengguna muda, tetapi terlalu padat dan penuh istilah sistem
untuk guru berusia 45–58 tahun. Masalahnya bukan "kurang modern", melainkan:

- teks terlalu kecil (10–12 px),
- banyak ikon tanpa label,
- istilah internal (`SP DRAFT`, `Ambang jenis`, `Poin buku`, `Void`),
- enam bagian sejajar tanpa hierarki,
- aksi berbahaya dan aksi rutin tampil dengan bobot visual yang sama.

Rencana ini menurunkannya menjadi **satu alur utama** (mencatat pelanggaran), **satu alur kedua**
(menerbitkan SP), dan sisanya jadi halaman pendukung yang mudah dicari.

---

## 2. Sasaran dan ukuran keberhasilan

**Persona acuan — "Ibu Rina"**
Guru BK / wali kelas, 50 tahun, terbiasa Excel dan WhatsApp, memakai laptop 1366×768, tidak hafal
istilah teknis, penglihatan mulai menurun, takut salah klik karena data siswa.

**Lima tugas yang harus bisa diselesaikan tanpa dibantu:**

1. Mencari satu siswa dan melihat sisa poinnya.
2. Mencatat satu pelanggaran untuk siswa itu.
3. Melihat siswa yang sudah mendekati SP.
4. Menerbitkan / mencetak surat peringatan.
5. Mencetak kartu QR siswa.

**Target terukur (diuji ke 5 guru):**

| Ukuran | Target |
| --- | --- |
| Guru berhasil tanpa bertanya | ≥ 4 dari 5 |
| Waktu mencatat 1 pelanggaran | < 60 detik |
| Salah klik / batal per tugas | ≤ 2 |
| Keluhan "tulisannya kecil" | 0 |
| Overflow horizontal 1024–1440 px | 0 |

---

## 3. Temuan: kenapa halaman ini menyulitkan

| Elemen | Sekarang | Dampak untuk guru senior |
| --- | --- | --- |
| Navigasi bagian | label 11,5 px, ikon 14 px, garis bawah tipis | harus mendekat ke layar; garis aktif kurang terlihat |
| Label kartu ringkasan | 10 px, HURUF BESAR, spasi lebar | sulit dibaca, terasa seperti istilah mesin |
| Tabel | isi 12 px, header 10 px | nama siswa dan poin sering tertukar kolom |
| Istilah | `SP DRAFT`, `Ambang jenis`, `Poin buku`, `Sisa poin` | tidak jelas artinya tanpa dijelaskan sekali pun |
| Aksi di tabel | ikon mata / pensil tanpa teks | guru menebak-nebak fungsi tombol |
| Aksi header | 3 tombol sejajar, bobot hampir sama | "Scan Kartu" terlihat sama penting dengan "Catat Pelanggaran" |
| `Peringkat` | berisi siswa poin **tertinggi** | dikira ranking prestasi, padahal daftar siswa bermasalah |
| `Peringkat` vs `Kelas paling tertib` | dua arah makna di satu layar | membingungkan: satu daftar "terburuk", satu "terbaik" |
| Kata kerja | Batalkan / Cabut / Nonaktifkan / Hapus | tiga kata mirip untuk tiga hal berbeda |
| Badge | angka merah 9 px | tidak terbaca, tidak jelas maksudnya |
| Bantuan | tidak ada | guru harus bertanya ke operator |

---

## 4. Prinsip desain yang dipakai

1. **Satu layar, satu tujuan.** Navigasi dua tingkat: beranda modul → bagian.
2. **Bahasa manusia, bukan istilah sistem.** Tidak ada `void`, `ledger`, `draft` di layar guru.
3. **Ukuran minimum:** teks isi 14 px, label 12 px, tombol 44 px, ikon selalu berpasangan label.
4. **Kontras cukup** (WCAG AA, ≥ 4.5:1) dan tanpa teks HURUF BESAR untuk kalimat panjang.
5. **Aksi utama selalu hitam besar di kanan atas**; aksi lain bergaris (outline).
6. **Konfirmasi + ringkasan** sebelum menyimpan, dan hasil yang bisa dibaca setelah menyimpan
   ("Poin Ani +10, sisa 720").
7. **Jangan sembunyikan informasi penting** di balik hover atau ikon saja.
8. **Jangan pakai warna sebagai satu-satunya penanda** (buta warna): selalu ada teks.

---

## 5. Opsi model navigasi

### Opsi A — Beranda modul + breadcrumb (rekomendasi)

```
Tata Tertib & Poin Siswa
Pilih pekerjaan yang ingin dilakukan.

┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  ⚠  Catat Pelanggaran│ │  ✉  Surat Peringatan │ │  🏆  Peringkat Poin  │
│  Input kejadian baru │ │  Draft & riwayat SP  │ │  Siswa poin tertinggi│
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  👤  Data Poin Siswa │ │  📖  Daftar Aturan   │ │  🪪  Kartu Siswa     │
│  Cari & lihat riwayat│ │  Poin tiap pelanggaran│ │  Cetak QR + PIN     │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

- Kartu besar (min 120 px tinggi), ikon 24 px, judul 15 px, keterangan 12,5 px.
- Di dalam bagian: `‹ Tata Tertib` di atas judul, jadi selalu ada jalan pulang.
- "Catat Pelanggaran" dan "Surat Peringatan" diberi penanda "Sering dipakai".

**Kelebihan:** target besar, tidak ada 6 pilihan sempit, jelas untuk pemula.
**Kekurangan:** pindah bagian butuh satu klik tambahan.

### Opsi B — Sub-menu kiri seperti "Dokumen BK"

Daftar 6 bagian vertikal di kiri, isi di kanan.

**Kelebihan:** semua bagian terlihat sekaligus, konsisten dengan sidebar yang sudah ada.
**Kekurangan:** butuh ±200 px. Pada 1280 px sisa konten hanya ±740 px, sedangkan tabel butuh
780–820 px → tabel akan tergeser ke samping. Perlu pengurangan kolom lagi. **Kurang disarankan.**

### Opsi C — Tab bar besar (perubahan termurah)

Tetap tab di atas, tetapi label 14 px, ikon 18 px, tinggi 52 px, dan tab aktif diberi latar abu
muda + garis bawah tebal.

**Kelebihan:** cepat dikerjakan (½ hari), tidak mengubah struktur.
**Kekurangan:** masih 6 pilihan sempit; akar masalah (hierarki) belum terpecahkan.

**Rekomendasi: Opsi A**, dengan Opsi C sebagai langkah sementara bila ingin hasil cepat.

---

## 6. Rencana perubahan per bagian

### 6.1 Kepala halaman

- Judul 26 px, satu baris penjelasan 14 px:
  "Catat pelanggaran, pantau poin, dan terbitkan surat peringatan."
- Tombol utama: **Catat Pelanggaran** (tinggi 48 px, teks 14 px, ikon + label).
- Tombol kedua: **Scan Kartu** dan **Buat SP** (outline, teks 13 px).
- Hapus tombol ikon-saja.

### 6.2 Kartu ringkasan

| Sekarang | Menjadi |
| --- | --- |
| `SISWA DIPANTAU` 10 px | `Siswa dipantau` 12 px, nilai 26 px |
| `POIN SEMESTER INI` | `Total poin semester ini` + ket. "semakin tinggi, semakin banyak pelanggaran" |
| `SP DRAFT` | `Surat peringatan menunggu` |
| `KELAS PALING TERTIB` | `Kelas paling tertib` + ket. "poin pelanggaran paling rendah" |

- Tambahkan satu kartu "Perlu tindakan" yang bisa diklik → langsung ke daftar siswa ber-SP.

### 6.3 Daftar pelanggaran (tabel)

- Isi tabel 13,5 px, header 12 px **bukan** HURUF BESAR penuh (cukup tebal).
- Tinggi baris minimal 52 px, zebra sangat tipis, garis vertikal dihapus.
- Kolom aksi memakai teks: **Lihat**, **Batalkan** (bukan ikon).
- Poin ditulis `+20 poin` dengan warna, plus kolom **Poin tersisa** yang selalu tampil di ≥1280.
- Filter dibuat satu baris dengan label di atas: `Kelas`, `Kategori`, `Status`, `Cari siswa…`.
- Tombol "Muat 40 lagi" diganti "Tampilkan lebih banyak (sisa 126)".

### 6.4 Peringkat

- Ganti judul jadi **Peringkat Poin Pelanggaran**.
- Tambahkan kalimat: "Urutan dari poin pelanggaran tertinggi. Gunakan untuk menentukan pembinaan."
- Pisahkan jelas dari kartu "Kelas paling tertib" (pindahkan ke bagian Ringkasan).

### 6.5 Surat peringatan

- Status ditulis apa adanya: **Belum diterbitkan**, **Sudah terbit**, **Dibatalkan**.
- Tombol utama kartu draft: **Terbitkan SP** (bukan "Terbitkan" saja).
- Tombol sekunder: **Pratinjau**, **Batalkan** (dengan konfirmasi yang menjelaskan akibatnya).

### 6.6 Form Catat Pelanggaran (paling penting)

Alur 3 langkah dengan indikator "Langkah 1 dari 3":

1. **Pilih siswa** — kolom cari besar (48 px), hasil berupa baris nama + kelas + poin saat ini.
2. **Pilih pelanggaran** — kartu per aturan: nama aturan, kategori, `+20 poin`.
3. **Konfirmasi** — ringkasan: siswa, aturan, tanggal/jam, poin sesudah ("720 → 700"), lalu tombol
   **Simpan Pelanggaran**.

Setelah simpan:

- Notifikasi besar: "Pelanggaran tercatat. Poin Ani sekarang 700."
- Dua tombol: **Catat lagi** dan **Lihat riwayat siswa**.

### 6.7 Istilah (kamus)

| Istilah sekarang | Diganti |
| --- | --- |
| SP DRAFT / Draft SP | Surat peringatan belum diterbitkan |
| Ambang jenis | Batas poin |
| Poin buku | Poin buku panduan (disembunyikan default, ada di detail) |
| Sisa poin | Poin tersisa |
| Void / dibatalkan sistem | Dibatalkan |
| Ledger / koreksi | Riwayat perubahan |
| Pembinaan | Peringatan lisan |
| SP1 / SP2 / SP3 | SP 1 (peringatan pertama) dst., dengan keterangan sekali di atas tabel |
| Peringkat | Peringkat poin pelanggaran |
| Kartu QR | Kartu siswa (QR) |

### 6.8 Bantuan

- Kotak bantuan yang bisa ditutup di bawah judul: 2–3 kalimat "Di halaman ini Anda bisa …".
- Tautan **Panduan singkat** (halaman statis berisi 5 langkah dengan gambar).
- Tooltip teks (bukan ikon `?` kecil) pada istilah yang masih teknis.

### 6.9 Mode tampilan besar (opsional, fase akhir)

- Sakelar di **Pengaturan → Tampilan**: "Perbesar teks dan tombol".
- Menambah skala 15–20% untuk seluruh aplikasi, disimpan per perangkat.
- Ini jalan pintas yang menyenangkan banyak guru tanpa mengorbankan desain untuk pengguna lain.

---

## 7. Fase pelaksanaan

| Fase | Isi | File utama | Perkiraan |
| --- | --- | --- | --- |
| 0 | Wawancara 3 guru, catat istilah yang membingungkan | — | 1 hari |
| 1 | Bahasa + ukuran teks + tombol (tanpa ubah struktur) | `TataTertibView.tsx`, `lib/discipline.ts` | 2–3 hari |
| 2 | Opsi A: beranda modul + breadcrumb | `TataTertibView.tsx`, `BKContext` (state bagian) | 3–4 hari |
| 3 | Tabel & aksi: kolom, tombol teks, filter berlabel | `TataTertibView.tsx`, `SiswaView.tsx` | 2–3 hari |
| 4 | Alur catat pelanggaran 3 langkah + konfirmasi | `RecordViolationModal.tsx` | 3 hari |
| 5 | Panduan singkat + tooltip istilah | `dokumen/`, komponen bantuan | 1–2 hari |
| 6 | Uji ke 5 guru, perbaikan temuan | — | 2 hari |

Total ± 2–3 minggu kerja paruh waktu. Fase 1 saja sudah memberi perbaikan yang terasa.

Urutan yang disarankan: **1 → 4 → 3 → 2 → 5 → 6**. Alur mencatat pelanggaran adalah pekerjaan
harian, jadi didahulukan sebelum menata ulang navigasi.

---

## 8. Kriteria penerimaan

- [ ] Tidak ada teks isi di bawah 13 px pada halaman Tata Tertib.
- [ ] Semua tombol aksi minimal 44 px dan punya label teks.
- [ ] Tidak ada istilah `draft`, `void`, `ledger`, `ambang` di layar guru.
- [ ] `Peringkat` diberi penjelasan arah (tertinggi = paling banyak melanggar).
- [ ] Form catat pelanggaran selesai dalam < 60 detik oleh guru baru.
- [ ] Setelah simpan, muncul ringkasan poin sebelum dan sesudah.
- [ ] 5 tugas uji berhasil oleh ≥ 4 dari 5 guru tanpa dibantu.
- [ ] Tidak ada overflow horizontal pada 1024, 1280, 1440 px.
- [ ] Cetak SP dan cetak kartu tidak berubah.
- [ ] `npm test -- --run`, `tsc --noEmit`, `npm run build` hijau.
- [ ] Mobile `/m/` tetap punya fitur yang sama.

---

## 9. Yang tidak diubah

- Skema database, migrasi, RLS, RPC.
- Perhitungan poin, `point_ledger`, ambang SP otomatis.
- Token QR, PIN, dan masa berlaku sesi portal.
- Tata letak cetak SP dan cetak kartu.
- Struktur menu sidebar utama.

---

## 10. Risiko

| Risiko | Mitigasi |
| --- | --- |
| Guru sudah terbiasa dengan tampilan sekarang | sediakan masa transisi, jangan ubah dua hal besar sekaligus |
| Beranda modul menambah satu klik | taruh "Catat Pelanggaran" dan "Surat Peringatan" paling depan + tombol cepat di Ringkasan |
| Perubahan teks menyentuh banyak file | mulai dari satu file (`TataTertibView.tsx`), istilah dipusatkan di `lib/discipline.ts` |
| Uji ke guru sulit dijadwalkan | siapkan 5 tugas tertulis + lembar observasi, cukup 30 menit per guru |

---

## 11. Keputusan yang menunggu

1. Model navigasi: **A (beranda modul)**, B (sub-menu kiri), atau C (tab besar)?
2. Apakah "Poin buku panduan" tetap ditampilkan, atau disembunyikan ke detail siswa?
3. Apakah "Mode tampilan besar" masuk lingkup sekarang atau nanti?
4. Siapa 3–5 guru yang bisa dijadikan penguji?
