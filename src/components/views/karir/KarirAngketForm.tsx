import React from 'react';
import KopSurat from '../../ui/KopSurat';
import type { IndividualKarirAngket, SchoolSettings } from '../../../types';
interface KarirAngketFormProps {
  current: IndividualKarirAngket;
  updateCurrent: <K extends keyof IndividualKarirAngket>(field: K, val: IndividualKarirAngket[K]) => void;
  settings: SchoolSettings;
}

export const KarirAngketForm: React.FC<KarirAngketFormProps> = ({
  current,
  updateCurrent,
  settings,
}) => {
  return (
    <div className="bg-white border border-black rounded-none p-5 sm:p-8 shadow-sm print:border-none print:p-0 text-black text-[12px] leading-relaxed">
      <style>{`@media print { @page { size: A4 portrait; margin: 0 !important; } html, body { padding: 8mm 18mm 8mm 14mm !important; } }`}</style>
      {/* Kop Judul Angket Resmi */}
      <KopSurat
        settings={settings}
        compact
        judul="ANGKET PEMETAAN JALUR PENDIDIKAN LANJUTAN & KARIR SISWA"
        subjudul={`KELAS 9 Â· TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
      />

      {/* Identitas Peserta Didik */}
      <div className="border border-black p-3 mb-4 text-[12px] bg-white rounded-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold w-28 shrink-0">Nama Siswa :</span>
            <input
              type="text"
              value={current.namaSiswa}
              onChange={(e) => updateCurrent('namaSiswa', e.target.value)}
              className="flex-1 font-bold bg-transparent border-b border-black/40 focus:border-black focus:outline-none px-1 text-[14px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold w-28 shrink-0">Kelas / No. Absen :</span>
            <input
              type="text"
              value={current.kelas}
              onChange={(e) => updateCurrent('kelas', e.target.value)}
              className="w-16 font-bold text-center bg-transparent border-b border-black/40 focus:border-black focus:outline-none px-1"
            />
            <span>/</span>
            <input
              type="text"
              value={current.noAbsen}
              onChange={(e) => updateCurrent('noAbsen', e.target.value)}
              className="w-14 font-bold text-center bg-transparent border-b border-black/40 focus:border-black focus:outline-none px-1"
              placeholder="Absen"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold w-28 shrink-0">NIS / NISN :</span>
            <input
              type="text"
              value={`${current.nis} / ${current.nisn}`}
              onChange={(e) => {
                const parts = e.target.value.split('/');
                updateCurrent('nis', parts[0]?.trim() || '');
                updateCurrent('nisn', parts[1]?.trim() || '');
              }}
              className="flex-1 bg-transparent border-b border-black/40 focus:border-black focus:outline-none px-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold w-28 shrink-0">Nama Orang Tua :</span>
            <input
              type="text"
              value={current.namaOrtu}
              onChange={(e) => updateCurrent('namaOrtu', e.target.value)}
              className="flex-1 bg-transparent border-b border-black/40 focus:border-black focus:outline-none px-1"
            />
          </div>
        </div>
      </div>

      <p className="text-[12px] italic text-black/80 mb-5 leading-relaxed">
        * Angket ini bertujuan untuk memetakan arah pilihan studi lanjutan dan keselarasan minat karir peserta didik kelas 9. Isilah dengan sungguh-sungguh berdasarkan hasil diskusi bersama orang tua/wali.
      </p>

      {/* KONTEN PERTANYAAN */}
      <div className="space-y-6 text-[13px] text-black">
        {/* Bagian 1: Rencana Pokok */}
        <div className="border border-black p-4 space-y-3">
          <h3 className="font-extrabold text-[14px] uppercase bg-black text-white px-2 py-0.5 inline-block">
            1. Rencana Pokok Setelah Lulus SMP
          </h3>

          <div className="space-y-2">
            <p className="font-bold">A. Setelah lulus dari SMP, jenis pendidikan apa yang menjadi rencana utama Anda?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-2">
              {(['SMA', 'SMK', 'MA', 'Belum Memutuskan'] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="rencanaSetelahSMP"
                    checked={current.rencanaSetelahSMP === opt}
                    onChange={() => updateCurrent('rencanaSetelahSMP', opt)}
                    className="accent-black w-4 h-4 cursor-pointer"
                  />
                  <span>
                    {opt === 'SMA' ? 'SMA (Akademik)' : opt === 'SMK' ? 'SMK (Kejuruan)' : opt === 'MA' ? 'MA (Madrasah)' : 'Belum Pasti'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <p className="font-bold">B. Apa alasan utama Anda memilih jenis sekolah tersebut di atas?</p>
            <textarea
              rows={2}
              value={current.alasanRencana}
              onChange={(e) => updateCurrent('alasanRencana', e.target.value)}
              className="w-full p-2 bg-transparent border border-black/50 rounded focus:border-black focus:outline-none text-[13px] leading-relaxed resize-y"
              placeholder="Uraikan alasan memilih SMA atau SMK..."
            />
          </div>
        </div>

        {/* Bagian 2: Pilihan Sekolah Target */}
        <div className="border border-black p-4 space-y-4">
          <h3 className="font-extrabold text-[14px] uppercase bg-black text-white px-2 py-0.5 inline-block">
            2. Target Pilihan Sekolah Lanjutan
          </h3>

          {/* Pilihan 1 */}
          <div className="p-3 border border-black/80 bg-gray-50/50 print:bg-transparent space-y-2.5">
            <span className="font-extrabold text-[13px] underline block">
              PILIHAN 1 ( Target Utama ) :
            </span>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <span className="font-bold block text-xs mb-1">Nama SMA / SMK / MA Tujuan :</span>
                <input
                  type="text"
                  value={current.pilihan1Sekolah}
                  onChange={(e) => updateCurrent('pilihan1Sekolah', e.target.value)}
                  className="w-full p-1.5 font-bold bg-white border border-black/60 rounded focus:border-black focus:outline-none"
                  placeholder="Contoh: SMAN 1 Bintang"
                />
              </div>
              <div>
                <span className="font-bold block text-xs mb-1">Jurusan / Peminatan yang Diinginkan :</span>
                <input
                  type="text"
                  value={current.pilihan1Jurusan}
                  onChange={(e) => updateCurrent('pilihan1Jurusan', e.target.value)}
                  className="w-full p-1.5 font-medium bg-white border border-black/60 rounded focus:border-black focus:outline-none"
                  placeholder="Contoh: MIPA / Teknik Otomotif"
                />
              </div>
            </div>

            <div className="pt-1">
              <span className="font-bold block text-xs mb-1">Jalur PPDB yang Direncanakan :</span>
              <div className="flex flex-wrap gap-4 text-xs font-medium">
                {(['Prestasi Rapor/Lomba', 'Zonasi', 'Afirmasi', 'Tes Mandiri'] as const).map((j) => (
                  <label key={j} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="pilihan1Jalur"
                      checked={current.pilihan1Jalur === j}
                      onChange={() => updateCurrent('pilihan1Jalur', j)}
                      className="accent-black w-3.5 h-3.5"
                    />
                    <span>Jalur {j}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pilihan 2 (Cadangan) */}
          <div className="p-3 border border-black/80 space-y-2.5">
            <span className="font-extrabold text-[13px] underline block">
              PILIHAN 2 ( Rencana Cadangan - Backup Plan ) :
            </span>
            <p className="text-[11px] italic text-black/70 -mt-1">
              * Wajib diisi sebagai alternatif penyelamat jika tidak lolos seleksi di Pilihan 1
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <span className="font-bold block text-xs mb-1">Nama Sekolah Alternatif Cadangan :</span>
                <input
                  type="text"
                  value={current.pilihan2Sekolah}
                  onChange={(e) => updateCurrent('pilihan2Sekolah', e.target.value)}
                  className="w-full p-1.5 font-bold bg-white border border-black/60 rounded focus:border-black focus:outline-none"
                  placeholder="Contoh: SMAN 3 Bintang / SMKN 1"
                />
              </div>
              <div>
                <span className="font-bold block text-xs mb-1">Jurusan / Peminatan Cadangan :</span>
                <input
                  type="text"
                  value={current.pilihan2Jurusan}
                  onChange={(e) => updateCurrent('pilihan2Jurusan', e.target.value)}
                  className="w-full p-1.5 font-medium bg-white border border-black/60 rounded focus:border-black focus:outline-none"
                  placeholder="Contoh: IPS / Teknik Mesin"
                />
              </div>
            </div>
          </div>

          {/* Rencana Cadangan 3 */}
          <div className="space-y-1">
            <span className="font-bold block text-xs">
              Rencana Alternatif Ke-3 (Jika Pilihan 1 & 2 Negeri Tidak Lolos) :
            </span>
            <input
              type="text"
              value={current.rencanaCadangan3}
              onChange={(e) => updateCurrent('rencanaCadangan3', e.target.value)}
              className="w-full p-1.5 bg-transparent border border-black/50 rounded focus:border-black focus:outline-none"
              placeholder="Contoh: SMA Swasta Bintang Cendekia / Pondok Pesantren"
            />
          </div>
        </div>

        {/* Bagian 3: Cita-Cita & Karir */}
        <div className="border border-black p-4 space-y-3">
          <h3 className="font-extrabold text-[14px] uppercase bg-black text-white px-2 py-0.5 inline-block">
            3. Cita-Cita & Impian Karir Masa Depan
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="font-bold block text-xs mb-1">Cita-Cita / Profesi Impian Anda :</span>
              <input
                type="text"
                value={current.citaCita}
                onChange={(e) => updateCurrent('citaCita', e.target.value)}
                className="w-full p-1.5 font-bold bg-white border border-black/60 rounded focus:border-black focus:outline-none text-[14px]"
                placeholder="Contoh: Dokter Anak / Animator / Programmer"
              />
            </div>

            <div>
              <span className="font-bold block text-xs mb-1">Rencana Pasca Lulus SMA/SMK Nanti :</span>
              <select
                value={current.rencanaSetelahLanjutan}
                onChange={(e) =>
                  updateCurrent(
                    'rencanaSetelahLanjutan',
                    e.target.value as IndividualKarirAngket['rencanaSetelahLanjutan']
                  )
                }
                className="w-full p-1.5 font-bold bg-white border border-black/60 rounded focus:border-black focus:outline-none"
              >
                <option value="Kuliah (Perguruan Tinggi)">Melanjutkan Kuliah (Perguruan Tinggi)</option>
                <option value="Langsung Bekerja">Langsung Bekerja di Industri</option>
                <option value="Wirausaha / Usaha Mandiri">Membuka Usaha Mandiri / Wirausaha</option>
                <option value="Kedinasan / TNI / POLRI">Sekolah Kedinasan / TNI / POLRI</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold block text-xs">Alasan Mengapa Anda Tertarik pada Profesi Tersebut :</span>
            <textarea
              rows={2}
              value={current.alasanCitaCita}
              onChange={(e) => updateCurrent('alasanCitaCita', e.target.value)}
              className="w-full p-2 bg-transparent border border-black/50 rounded focus:border-black focus:outline-none text-[13px] leading-relaxed resize-y"
              placeholder="Uraikan alasan mengapa ingin menjadi profesi tersebut..."
            />
          </div>
        </div>

        {/* Bagian 4: Kesepakatan Orang Tua */}
        <div className="border border-black p-4 space-y-3">
          <h3 className="font-extrabold text-[14px] uppercase bg-black text-white px-2 py-0.5 inline-block">
            4. Musyawarah & Kesepakatan Orang Tua
          </h3>

          <div className="space-y-2">
            <p className="font-bold">A. Apakah rencana pilihan sekolah lanjutan di atas sudah disetujui orang tua?</p>
            <div className="space-y-1.5 pl-2 font-medium">
              {(
                [
                  ['Setuju Penuh', 'Sudah dibicarakan dan orang tua SETUJU PENUH dengan pilihan saya'],
                  ['Orang Tua Beda Pilihan', 'Sudah dibicarakan, tetapi orang tua MEMILIKI PILIHAN BERBEDA'],
                  ['Belum Dibicarakan Mendalam', 'BELUM DIBICARAKAN secara mendalam bersama orang tua di rumah'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="statusDiskusiOrtu"
                    checked={current.statusDiskusiOrtu === key}
                    onChange={() =>
                      updateCurrent('statusDiskusiOrtu', key as IndividualKarirAngket['statusDiskusiOrtu'])
                    }
                    className="accent-black w-4 h-4 cursor-pointer"
                  />
                  <span className={key === 'Orang Tua Beda Pilihan' ? 'text-red-700 font-bold' : ''}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {current.statusDiskusiOrtu === 'Orang Tua Beda Pilihan' && (
            <div className="p-2.5 bg-red-50 border border-red-300 rounded space-y-1">
              <span className="font-bold text-xs text-red-800 block">
                Jika orang tua berbeda pendapat, sekolah/jurusan apa yang diinginkan orang tua?
              </span>
              <input
                type="text"
                value={current.aspirasiPilihanOrtu}
                onChange={(e) => updateCurrent('aspirasiPilihanOrtu', e.target.value)}
                className="w-full p-1.5 bg-white border border-red-400 rounded focus:outline-none text-xs"
                placeholder="Contoh: Orang tua ingin masuk SMA reguler agar bisa kuliah akuntansi..."
              />
            </div>
          )}

          <div className="space-y-1 pt-1">
            <span className="font-bold block text-xs">
              Kendala atau Kekhawatiran Keluarga (Biaya, Jarak, Zonasi, atau Nilai Rapor) :
            </span>
            <input
              type="text"
              value={current.kendalaKeluarga}
              onChange={(e) => updateCurrent('kendalaKeluarga', e.target.value)}
              className="w-full p-1.5 bg-transparent border border-black/50 rounded focus:border-black focus:outline-none text-xs"
              placeholder="Contoh: Pertimbangan jarak transportasi atau biaya perlengkapan awal..."
            />
          </div>
        </div>

        {/* Bagian 5: Rekomendasi Guru BK */}
        <div className="border border-black p-4 space-y-3 bg-gray-50/60 print:bg-transparent">
          <h3 className="font-extrabold text-[14px] uppercase bg-black text-white px-2 py-0.5 inline-block">
            5. Analisis & Rekomendasi Guru Bimbingan Konseling
          </h3>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <span className="font-bold block text-xs mb-1">Rata-rata Rapor (Smt 1-5) :</span>
              <input
                type="text"
                value={current.rataRapor}
                onChange={(e) => updateCurrent('rataRapor', e.target.value)}
                className="w-full p-1.5 font-extrabold bg-white border border-black/60 rounded focus:border-black focus:outline-none text-[14px]"
                placeholder="Contoh: 88.5"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="font-bold block text-xs mb-1">Status Rekomendasi Tindak Lanjut :</span>
              <select
                value={current.tindakLanjutBK}
                onChange={(e) =>
                  updateCurrent('tindakLanjutBK', e.target.value as IndividualKarirAngket['tindakLanjutBK'])
                }
                className="w-full p-1.5 font-bold bg-white border border-black/60 rounded focus:border-black focus:outline-none text-xs"
              >
                <option value="Rekomendasi Aman">Rekomendasi Aman (Pilihan Realistis & Disetujui)</option>
                <option value="Konseling Karir Lanjutan">Perlu Konseling Karir Lanjutan (Eksplorasi Minat)</option>
                <option value="Pemanggilan Orang Tua">Perlu Temu Konsultasi dengan Orang Tua (Mediasi)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-bold block text-xs">Uraian Catatan Rekomendasi Konselor Sekolah :</span>
            <textarea
              rows={3}
              value={current.rekomendasiBK}
              onChange={(e) => updateCurrent('rekomendasiBK', e.target.value)}
              className="w-full p-2 bg-white border border-black/60 rounded focus:border-black focus:outline-none text-[13px] leading-relaxed resize-y"
              placeholder="Tuliskan analisis peluang masuk, kesiapan akademik siswa, dan saran persiapan..."
            />
          </div>
        </div>
      </div>

      {/* LEMBAR PENGESAHAN TANDA TANGAN TRILATERAL RESMI */}
      <div className="mt-8 pt-5 border-t-2 border-black grid grid-cols-3 gap-4 text-center text-[12px] text-black">
        <div>
          <p>Menyetujui,</p>
          <p className="font-bold mt-0.5">Orang Tua / Wali Siswa</p>
          <div className="mt-12">
            <p className="font-extrabold underline underline-offset-4 text-[12px]">
              {current.namaOrtu || '( .......................................... )'}
            </p>
            <p className="mt-1 text-[10.5px] text-black/70">Tanda Tangan & Nama Terang</p>
          </div>
        </div>

        <div>
          <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-bold mt-0.5">Peserta Didik</p>
          <div className="mt-12">
            <p className="font-extrabold underline underline-offset-4 text-[12px]">
              {current.namaSiswa || '( .......................................... )'}
            </p>
            <p className="mt-1 text-[10.5px] text-black/70">NISN. {current.nisn || '-'}</p>
          </div>
        </div>

        <div>
          <p>Mengetahui,</p>
          <p className="font-bold mt-0.5">Guru BK / Konselor</p>
          <div className="mt-12">
            <p className="font-extrabold underline underline-offset-4 text-[12px]">
              {settings.guruBK || 'Belum Diisi di Pengaturan'}
            </p>
            <p className="mt-1 text-[10.5px] text-black/70">NIP. {settings.nipGuruBK || '-'}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-black/40 text-[10px] text-black/70 flex justify-between items-center">
        <p>SIM-BK Â· Formulir Pilihan Jalur Lanjutan Siswa</p>
        <p className="font-bold">Halaman 1 dari 1 Â· {settings.namaSekolah || 'SIM BK PRO'}</p>
      </div>
    </div>
  );
};

export default KarirAngketForm;

