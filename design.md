# Design System & Pedoman UI/UX: SIM-BK (Sistem Informasi Manajemen Bimbingan & Konseling)

Dokumen ini merangkum seluruh pedoman desain visual, token CSS, tata letak responsif, komponen antarmuka, serta interaksi berdasarkan berkas prototype `SIM-BK · Contoh Tampilan.html`. Pedoman ini menjadi acuan tunggal (*single source of truth*) dalam pengembangan aplikasi web berbasis **React**, backend **Supabase**, dan hosting **Vercel**.

---

## 1. Prinsip Desain (*Design Principles*)

1. **Mobile-First & Native-App Feel**: Pengalaman penggunaan di perangkat seluler terasa seperti aplikasi mobile native (tersedia bottom navigation, FAB, bottom sheet modal, dan padding area aman/safe area insets).
2. **Adaptive Ergonomics (Desktop & Mobile)**:
   - **Layar < 1024px (Mobile/Tablet)**: Menggunakan navigasi bawah (*Bottom Nav*), tombol aksi cepat mengambang (*FAB Catat*), dan lembar aksi bawah (*Bottom Sheet*).
   - **Layar ≥ 1024px (Desktop/Laptop)**: Menggunakan bilah sisi (*Sidebar*) permanen selebar `248px`, modal popup di tengah layar, dan tata letak grid dua kolom yang luas.
3. **Clarity & High Legibility**: Tipografi menggunakan sistem font bawaan OS (*system-ui*) dengan hierarki kontras tinggi, label status berkode warna yang jelas, dan ikon minimalis.
4. **Accessible Touch Targets**: Semua elemen yang dapat ditekan memiliki area sentuh minimal `--tap: 48px` untuk kenyamanan di layar sentuh.

---

## 2. Token Desain (*Design Tokens*)

### 2.1 Palet Warna (*Color Palette*)

| Token CSS | Nilai HEX / RGB | Peran / Deskripsi |
| :--- | :--- | :--- |
| `--primary` | `#3949AB` | Warna utama (Indigo / Slate Blue), brand header, tombol sorotan |
| `--primary-2` | `#5262C9` | Variasi gradien primer, aksen tombol hero |
| `--primary-tint` | `#EEF0FA` | Latar belakang badge/avatar aktif, baris hover, tab aktif |
| `--accent` | `#0F766E` | Warna aksen (Teal / Emerald), FAB `+ Catat`, status sukses/selesai |
| `--accent-tint` | `#E3F4F1` | Latar belakang badge/avatar aksen |
| `--alert` | `#B91C1C` | Peringatan / Keterlambatan / Kasus mendesak (Crimson Red) |
| `--alert-tint` | `#FCE9E9` | Latar belakang pill keterlambatan & avatar kasus |
| `--bg` | `#F5F7FC` | Latar belakang halaman (Cool Light Grey) |
| `--surface` | `#FFFFFF` | Latar belakang kartu (*Card*), modal, dan sidebar |
| `--border` | `#E8EBF3` | Garis batas (*border*) pemisah elemen |
| `--text` | `#1B2236` | Teks utama kontras tinggi (Dark Navy) |
| `--muted` | `#667085` | Teks sekunder, label pembantu, deskripsi waktu |

#### Gradien Khas
- **Hero & Logo**: `linear-gradient(135deg, #3949AB 0%, #5262C9 100%)`

### 2.2 Bayangan (*Shadows & Elevation*)
```css
/* Card & Tile Standard Shadow */
--shadow: 0 1px 2px rgb(25 32 80 / 0.05), 0 8px 24px rgb(57 73 171 / 0.07);

/* Hero Card Shadow */
--shadow-hero: 0 12px 28px rgb(57 73 171 / 0.28);

/* FAB Button Shadow */
--shadow-fab: 0 6px 16px rgb(15 118 110 / 0.35), 0 0 0 5px var(--bg);

/* Bottom Navigation Top Shadow */
--shadow-bnav: 0 -6px 20px rgb(57 73 171 / 0.06);
```

### 2.3 Radius Sudut (*Border Radius*)
| Token CSS | Nilai | Penggunaan |
| :--- | :--- | :--- |
| `--rc` | `20px` | Kartu (*Card*), baris list jadwal/kasus |
| `--rx` | `14px` | Input teks, tombol reguler, toast notification |
| Radius Hero | `24px` | Kartu Hero utama di Beranda |
| Radius Panel | `28px` | Panel Bottom Sheet & Modal Dialog |
| Radius Chip / Pill | `9999px` | Badge status, filter kategori, counter pill |
| Radius Tile Ikon | `18px` | Kotak pintasan menu (56x56px) |
| Radius Tile Kecil | `12px` | Ikon list (40x40px) |

### 2.4 Tipografi (*Typography*)
- **Font Stack**: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Timbangan Teks (Type Scale)**:
  - **H1 (Judul Halaman)**: `28px` (`1.75rem`), weight: `750` / Bold, tracking: `-0.02em`, line-height: `1.2`
  - **H2 (Subjudul Bagian)**: `18px` (`1.125rem`), weight: `650` / Semi-bold, margin-bottom: `12px`
  - **Hero Title**: `22px` (`1.375rem`), weight: `700`, line-height: `1.25`
  - **Stat Counter (Bignum)**: `28px`, weight: `750`, color: `var(--primary)`
  - **Body / Baris List**: `15px` - `16px`, weight: `500` - `650`
  - **Label / Muted Info**: `14px` (`0.875rem`), color: `var(--muted)`
  - **Bottom Nav & Badges**: `12px` - `13px`, weight: `600` - `700`

---

## 3. Sistem Layout & Responsivitas

### 3.1 Struktur Breakpoint
- **Mobile (< 1024px)**:
  - Sidebar disembunyikan (`display: none`).
  - Container utama: `max-width: 960px; margin: 0 auto; padding: 20px 16px calc(104px + env(safe-area-inset-bottom, 0px))`.
  - Menggunakan bottom bar fixed setinggi `68px` + *safe area*.
- **Desktop (≥ 1024px)**:
  - Bottom bar disembunyikan.
  - Sidebar kiri ditampilkan secara `fixed` selebar `248px`.
  - Konten utama memiliki margin kiri: `margin-left: 248px; padding: 32px 32px 48px`.
  - Bungkus isi (*wrap*): `max-width: 960px; margin: 0 auto`.

### 3.2 Tata Letak Grid Dashboard Beranda
- **Mobile (< 900px)**: Grid vertikal bertumpuk satu kolom:
  1. Bagian *Terlambat* (`g-late`)
  2. Bagian *Jadwal* (`g-sched`)
  3. Bagian *Statistik* (`g-stats`)
- **Desktop (≥ 900px)**: Grid 2 Kolom dengan rasio `3fr 2fr`:
  ```css
  grid-template-columns: 3fr 2fr;
  grid-template-areas:
    "sched late"
    "sched stats";
  align-items: start;
  ```

---

## 4. Spesifikasi Komponen (*Component Specifications*)

### 4.1 Header & User Profile
- **Header**: Menampilkan sapaan dinamis berdasarkan jam lokal (`Selamat pagi` / `siang` / `sore` / `malam`), diikuti judul halaman H1.
- **Avatar Inisial (`.me`)**: Lingkaran `44x44px` (atau `40x40px` di sidebar), background `var(--primary)`, teks putih tebal.

### 4.2 Hero Banner Jadwal Terdekat (`.hero`)
- Latar belakang gradien biru indigo dengan dua lingkaran dekoratif transparan putih (`::before` dan `::after`).
- Konten: Label "Berikutnya · [Waktu]", Nama Siswa & Jenis Layanan, substatus "Menunggu hadir", serta tombol "Mulai" putih dengan teks primer.

### 4.3 Action Shortcuts (Pintasan 4 Menu)
- Grid 4 kolom: `grid-template-columns: repeat(4, 1fr); gap: 8px`.
- Setiap tombol memiliki:
  - Kotak ikon (`.tile`): `56x56px`, radius `18px`, latar putih berbayang, ikon `24x24px`.
  - Label teks di bawahnya berukuran `14px` tebal.
  - Efek tekan: `transform: scale(0.95)` pada tile.
- Item pintasan:
  1. **Kunjungan** (Ikon Pintu / Door)
  2. **Konseling** (Ikon Percakapan / Message Bubble)
  3. **Kasus** (Ikon Map Folder)
  4. **Jurnal** (Ikon Dokumen / File-Text)

### 4.4 Kartu Statistik (`.stats > .card.stat`)
- Grid 3 kolom: Siswa, Kasus, Tindak Lanjut.
- Angka besar `28px` tebal dengan warna `var(--primary)`, diikuti keterangan kecil di bawahnya.

### 4.5 Timeline & Row Jadwal (`.tl`, `.trow`, `.row`)
- Menggunakan garis vertikal pemisah: lebar `2px`, warna `var(--border)`.
- Waktu (misal `08:00`) berukuran `14px` warna netral.
- Titik bulat status (`10x10px`) dengan warna dinamis sesuai status (`var(--accent)` hijau atau `var(--primary)` biru).
- Kartu baris (`.row`):
  - Tinggi minimum `68px`, radius `20px`, padding `10px 14px`.
  - Inisial avatar lingkaran `42x42px` (`.ini`, `.ini.a`, `.ini.r`).
  - Judul nama siswa & subtitel jenis layanan.
  - Indikator status (`.st.p`, `.st.a`, `.st.r`) dengan titik warna `8x8px`.

### 4.6 Tabel Data Siswa (`.tw > table`)
- Wadah kartu berkas `overflow-x: auto`.
- Header (`th`): Latar `#F9FAFD`, teks `13px` warna `var(--muted)`, dapat diklik untuk sorting naik/turun.
- Kolom Nama (`.nm`): Berposisi **sticky left: 0** dengan latar belakang putih agar tetap terbaca saat tabel digulir horizontal di layar ponsel.
- Efek hover baris: `background: var(--primary-tint)`.

### 4.7 Filter Chips (`.chips > .chip`)
- Daftar chip horizontal yang dapat di-scroll (`scrollbar-width: none`).
- Tinggi minimum `48px` (`--tap`), radius penuh (`9999px`), latar putih berbayang.
- Keadaan aktif (`.chip.on`): Latar `var(--primary)` dan teks putih.

### 4.8 Kalender Strip 7 Hari (`.days > .day`)
- 7 kotak hari berturut-turut horizontal.
- Hari aktif (`.day.on`): latar `var(--primary)`, teks putih.
- Hari yang memiliki agenda ditandai dengan dot kecil di bawah angka (`.day.has::after`).

### 4.9 Lembar Aksi Cepat (*Bottom Sheet* / Modal)
- Wadah latar gelap transparan: `rgb(27 34 54 / 0.45)`.
- Mobile: Menempel dari bawah (*bottom-up*), radius sudut atas `28px`, disertai handle batang pegangan (`.grab`).
- Desktop: Berposisi di tengah layar (*centered modal*) dengan radius `28px` penuh.
- Opsi pilihan: Kunjungan, Konseling, Kasus, Jurnal, dan tombol Batal.

### 4.10 Notifikasi Melayang (*Toast*)
- Elemen melayang dengan warna `var(--text)` (#1B2236) dan teks putih kontras.
- Di perangkat mobile ditempatkan di atas navigasi bawah (`bottom: calc(100px + safe-area)`), sedangkan di desktop di pojok bawah (`bottom: 32px`).
- Waktu tayang otomatis: `2200ms`.

---

## 5. Pemetaan Ikon (*Iconography*)

Prototip asli menggunakan simbol SVG inline. Untuk implementasi di React, gunakan pustaka **Lucide React** (`lucide-react`) yang memiliki padanan 1:1:

| Ikon Prototype | Komponen Lucide React | Contoh Penggunaan |
| :--- | :--- | :--- |
| `#home` | `<Home className="w-6 h-6" />` | Navigasi Beranda |
| `#users` | `<Users className="w-6 h-6" />` | Navigasi Siswa & Statistik |
| `#plus` | `<Plus className="w-6 h-6" />` | FAB & Tombol Tambah |
| `#cal` | `<Calendar className="w-6 h-6" />` | Navigasi Kalender |
| `#grid` | `<LayoutGrid className="w-6 h-6" />` | Navigasi Lainnya |
| `#door` | `<DoorOpen className="w-6 h-6" />` | Layanan Kunjungan (Home Visit) |
| `#chat` | `<MessageSquare className="w-6 h-6" />` | Konseling |
| `#folder` | `<Folder className="w-6 h-6" />` | Kasus Siswa |
| `#doc` | `<FileText className="w-6 h-6" />` | Jurnal & Dokumen BK |
| `#chev` | `<ChevronRight className="w-5 h-5" />` | Panah baris list navigasi |
| `#find` | `<Search className="w-5 h-5" />` | Form pencarian |
| `#check` | `<Check className="w-5 h-5" />` | Tindak lanjut selesai |
| `#set` | `<SlidersHorizontal className="w-6 h-6" />` | Pengaturan aplikasi |

---

## 6. Arsitektur Kode React & Tailwind CSS

Untuk menjaga konsistensi tanpa harus menulis ulang ratusan baris CSS vanilla, gunakan konfigurasi **Tailwind CSS** berikut:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3949AB',
          2: '#5262C9',
          tint: '#EEF0FA',
        },
        accent: {
          DEFAULT: '#0F766E',
          tint: '#E3F4F1',
        },
        alert: {
          DEFAULT: '#B91C1C',
          tint: '#FCE9E9',
        },
        bg: '#F5F7FC',
        surface: '#FFFFFF',
        border: '#E8EBF3',
        text: '#1B2236',
        muted: '#667085',
      },
      borderRadius: {
        rc: '20px',
        rx: '14px',
        panel: '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(25 32 80 / 0.05), 0 8px 24px rgb(57 73 171 / 0.07)',
        hero: '0 12px 28px rgb(57 73 171 / 0.28)',
        fab: '0 6px 16px rgb(15 118 110 / 0.35), 0 0 0 5px #F5F7FC',
        bnav: '0 -6px 20px rgb(57 73 171 / 0.06)',
      },
      minHeight: {
        tap: '48px',
      }
    },
  },
  plugins: [],
}
```

---

## 7. Rangkuman Aturan Konsistensi untuk Developer

1. **Jangan mengubah skema warna dasar**: Tetap gunakan `#3949AB` untuk identitas sekolah/BK dan `#0F766E` khusus untuk aksi utama (*Call to Action* / tombol sukses).
2. **Pertahankan tinggi interaksi**: Selalu terapkan minimal `48px` untuk setiap tombol navigasi, field input, dan filter chip.
3. **Sticky Column pada Tabel Mobile**: Pastikan kolom nama siswa selalu terkunci di sebelah kiri (`sticky left-0 bg-white z-1`) agar data NIS dan status dapat diinspeksi dengan nyaman di ponsel.
4. **Animasi Halus & Ringan**: Terapkan transisi `150ms ease` untuk hover kartu dan transform tekan (`active:scale-95`). Gunakan animasi fade-in sederhana (`opacity: 0 -> 1`) saat perpindahan tab tampilan.
