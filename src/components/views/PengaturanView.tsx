import React, { useState, useEffect, useRef } from 'react';
import { Save, School, UserCheck, ShieldCheck, Check, RotateCcw, Upload, Trash2 } from "lucide-react";
import PetunjukIbu from '../ui/PetunjukIbu';
import KopSurat, { TutWuriEmblem } from '../ui/KopSurat';
import { useBK } from '../../context/BKContext';
import type { SchoolSettings } from '../../types';

interface PengaturanViewProps {
  onToast: (msg: string) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({ onToast }) => {
  const { settings: savedSettings, updateSettings, resetAllData } = useBK();
  const [formSettings, setFormSettings] = useState<SchoolSettings>(savedSettings);
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoKananInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setFormSettings(savedSettings);
  }, [savedSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onToast('Ukuran gambar logo maksimal 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormSettings((s) => ({ ...s, logoUrl: dataUrl }));
      onToast('Logo sekolah berhasil dimuat.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormSettings((s) => ({ ...s, logoUrl: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
    onToast('Logo sekolah dihapus.');
  };
  const handleLogoKananUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onToast('Ukuran gambar logo maksimal 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormSettings((s) => ({ ...s, logoKananUrl: dataUrl }));
      onToast('Logo kanan berhasil dimuat.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogoKanan = () => {
    setFormSettings((s) => ({ ...s, logoKananUrl: '' }));
    if (logoKananInputRef.current) logoKananInputRef.current.value = '';
    onToast('Logo kanan dikembalikan ke default (Tut Wuri Handayani).');
  };

  const handleSave = () => {
    updateSettings(formSettings);
    setSaved(true);
    onToast('Pengaturan sekolah dan kop surat disimpan.');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset semua data ke contoh bawaan? Data yang telah diubah akan terhapus.')) {
      resetAllData();
      onToast('Data aplikasi dikembalikan ke setelan awal.');
    }
  };

  return (
    <div className="fade-up space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            Pengaturan Kop Surat & Sekolah
          </h1>
        </div>

        {/* Action Button Utama di Pojok Kanan Atas (Standar Seragam) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-alert/30 text-alert text-xs font-bold hover:bg-alert-tint active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Kembalikan semua data ke setelan awal demo"
          >
            <RotateCcw size={15} />
            <span>Reset Demo</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[40px] px-4 rounded-[12px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <PetunjukIbu
        tips={[
          'Ibu bisa mengunggah foto/file Logo Asli Sekolah agar langsung muncul di pojok kiri atas setiap surat.',
          'Kop surat ini otomatis dipakai di Surat Panggilan Orang Tua, Home Visit, RPL 1-Lembar, Angket AKPD, dan Buku Siswa.',
          'Setelah mengubah identitas sekolah, tekan tombol "Simpan" di pojok kanan atas agar tersimpan permanen di browser.'
        ]}
      />

      {/* Bagian 1: Pengaturan Kop Surat & Logo Sekolah */}
      <section className="bk-card space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center flex-none">
            <School size={20} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-text">Kop Surat Resmi & Logo Sekolah</h3>
            <p className="text-xs text-muted mt-0.5">Identitas visual yang tercetak di kepala setiap dokumen resmi</p>
          </div>
        </div>

        {/* Dual Logo Upload: Sisi Kiri & Sisi Kanan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. LOGO SISI KIRI (LOGO PEMDA / YAYASAN / SEKOLAH) */}
          <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-border flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-white flex items-center justify-center overflow-hidden shrink-0">
                {formSettings.logoUrl ? (
                  <img
                    src={formSettings.logoUrl}
                    alt="Logo Kiri"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-red-50 text-center">
                    <div className="w-6 h-6 rounded-full border border-red-700 bg-red-100 flex items-center justify-center text-red-700 font-black text-[9px]">
                      MKS
                    </div>
                    <span className="text-[7.5px] font-black uppercase text-black mt-0.5 leading-none">PEMDA</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-text truncate">Logo Sisi Kiri</h4>
                  <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.2 rounded">
                    Pemda / Sekolah
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5 leading-snug">
                  {formSettings.logoUrl
                    ? 'Logo kiri khusus aktif (JPG/PNG)'
                    : 'Default: Lambang Pemda Makassar'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex-1 min-h-[38px] px-3 rounded-[10px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload size={14} />
                <span>{formSettings.logoUrl ? 'Ganti Logo Kiri' : 'Unggah Logo Kiri'}</span>
              </button>
              {formSettings.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="min-h-[38px] px-2.5 rounded-[10px] bg-alert-tint text-alert text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                  title="Hapus logo khusus & kembali ke standar Pemda"
                >
                  <Trash2 size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. LOGO SISI KANAN (TUT WURI / KEMENAG / KHUSUS) */}
          <div className="p-4 rounded-[16px] bg-[#FFFFFF] border border-border flex flex-col justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border bg-white flex items-center justify-center overflow-hidden shrink-0">
                {formSettings.logoKananUrl ? (
                  <img
                    src={formSettings.logoKananUrl}
                    alt="Logo Kanan"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center">
                    <TutWuriEmblem />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-text truncate">Logo Sisi Kanan</h4>
                  <span className="text-[10px] bg-primary-tint text-primary font-bold px-1.5 py-0.2 rounded">
                    Tut Wuri / Kemenag
                  </span>
                </div>
                <p className="text-[11px] text-muted mt-0.5 leading-snug">
                  {formSettings.logoKananUrl
                    ? 'Logo kanan khusus aktif (JPG/PNG)'
                    : 'Default: Lambang Tut Wuri Handayani'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <input
                type="file"
                ref={logoKananInputRef}
                onChange={handleLogoKananUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoKananInputRef.current?.click()}
                className="flex-1 min-h-[38px] px-3 rounded-[10px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Upload size={14} />
                <span>{formSettings.logoKananUrl ? 'Ganti Logo Kanan' : 'Unggah Logo Kanan'}</span>
              </button>
              {formSettings.logoKananUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogoKanan}
                  className="min-h-[38px] px-2.5 rounded-[10px] bg-alert-tint text-alert text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
                  title="Kembalikan ke lambang resmi Tut Wuri Handayani"
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Instansi Atas */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text">
                Instansi Pembina / Dinas Pendidikan / Nama Yayasan *
              </label>
              <span className="text-[11px] text-muted">Baris pertama kop surat</span>
            </div>
            <input
              type="text"
              value={formSettings.instansiAtas || ''}
              onChange={(e) => setFormSettings((s) => ({ ...s, instansiAtas: e.target.value }))}
              placeholder="Contoh: PEMERINTAH KOTA MAKASSAR"
              className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm"
            />
          </div>

          {/* Nama Lengkap Sekolah */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text">
                Nama Lengkap Satuan Pendidikan / Sekolah *
              </label>
              <span className="text-[11px] text-muted">Dicetak besar dan tebal</span>
            </div>
            <input
              type="text"
              value={formSettings.namaSekolah}
              onChange={(e) => setFormSettings((s) => ({ ...s, namaSekolah: e.target.value }))}
              placeholder="Contoh: UPT SPF SMP NEGERI 6 MAKASSAR"
              className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-bold text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-sm"
            />
          </div>

          {/* NPSN, Tahun Ajaran & Kota Domisili Surat */}
          <div className="grid sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">NPSN</label>
              <input
                type="text"
                value={formSettings.npsn}
                onChange={(e) => setFormSettings((s) => ({ ...s, npsn: e.target.value }))}
                placeholder="40307348"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Tahun Ajaran Aktif</label>
              <input
                type="text"
                value={formSettings.tahunAjaran}
                onChange={(e) => setFormSettings((s) => ({ ...s, tahunAjaran: e.target.value }))}
                placeholder="2026/2027"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Kota Titimangsa Surat</label>
              <input
                type="text"
                value={formSettings.kotaSurat || ''}
                onChange={(e) => setFormSettings((s) => ({ ...s, kotaSurat: e.target.value }))}
                placeholder="Makassar"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-text">Alamat Lengkap Satuan Pendidikan</label>
              <span className="text-[11px] text-muted">Jalan, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos</span>
            </div>
            <textarea
              rows={2}
              value={formSettings.alamat}
              onChange={(e) => setFormSettings((s) => ({ ...s, alamat: e.target.value }))}
              placeholder="Contoh: Jl. Jend. A. Yani No. 25 Makassar RT/RW: 002/002 Kec. Ujung Pandang Kota Makassar"
              className="w-full p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text placeholder:text-muted/60 focus:outline-none focus:border-primary resize-y shadow-sm"
            />
          </div>

          {/* Kontak Sekolah: Telepon & Email */}
          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Nomor Telepon / Fax Sekolah</label>
              <input
                type="text"
                value={formSettings.teleponSekolah || ''}
                onChange={(e) => setFormSettings((s) => ({ ...s, teleponSekolah: e.target.value }))}
                placeholder="Contoh: Telp.04118941314 Fax.04113617626"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">Alamat Email / Website Sekolah</label>
              <input
                type="text"
                value={formSettings.emailSekolah || ''}
                onChange={(e) => setFormSettings((s) => ({ ...s, emailSekolah: e.target.value }))}
                placeholder="Contoh: smpn06.mks@gmail.com"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 2: Pejabat Penandatangan */}
      <section className="bk-card space-y-5">
        <div className="flex items-center gap-3 border-b border-border pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center flex-none">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-text">Data Pejabat & Penandatangan</h3>
            <p className="text-xs text-muted mt-0.5">Identitas resmi yang dicetak pada lembar pengesahan dan tanda tangan</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">
                Nama Lengkap Kepala Sekolah (Beserta Gelar)
              </label>
              <input
                type="text"
                value={formSettings.kepalaSekolah}
                onChange={(e) => setFormSettings((s) => ({ ...s, kepalaSekolah: e.target.value }))}
                placeholder="Contoh: Drs. H. Mulyadi Kusuma, M.Pd."
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formSettings.nipKepala}
                onChange={(e) => setFormSettings((s) => ({ ...s, nipKepala: e.target.value }))}
                placeholder="19750101 200003 1 001"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">
                Nama Lengkap Guru BK / Konselor (Beserta Gelar)
              </label>
              <input
                type="text"
                value={formSettings.guruBK}
                onChange={(e) => setFormSettings((s) => ({ ...s, guruBK: e.target.value }))}
                placeholder="Contoh: Siti Rahmawati, S.Pd., M.Kons., Gr."
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text mb-1.5">NIP Guru BK / Konselor</label>
              <input
                type="text"
                value={formSettings.nipGuruBK}
                onChange={(e) => setFormSettings((s) => ({ ...s, nipGuruBK: e.target.value }))}
                placeholder="19880512 201402 2 003"
                className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm font-medium text-text focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian 3: Pratinjau Nyata Kop Surat Resmi */}
      <section className="bk-card space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center flex-none">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-text">Pratinjau Hasil Cetak Kop & Tanda Tangan</h3>
            <p className="text-xs text-muted mt-0.5">
              Tampilan persis seperti yang akan keluar dari mesin cetak printer
            </p>
          </div>
        </div>

        {/* Live Preview Paper */}
        <div className="bg-white border-2 border-dashed border-gray-400 rounded-none p-6 sm:p-10 shadow-sm text-black">
          {/* Komponen KopSurat Nyata */}
          <KopSurat
            settings={formSettings}
            judul="SURAT KETERANGAN"
            nomorSurat="423.10/620/SMPN.6/VI/2026"
          />

          <div className="p-3 my-4 bg-gray-50 border border-gray-200 rounded text-center text-xs text-gray-600 italic">
            [ Area isi naskah surat, instrumen angket AKPD, modul RPL 1-lembar, atau kartu konseling siswa ]
          </div>

          {/* Blok Tanda Tangan */}
          <div className="max-w-xl mx-auto grid grid-cols-2 gap-8 text-center text-xs pt-4">
            <div>
              <p className="text-gray-700">Mengetahui,</p>
              <p className="font-bold text-black mt-0.5">Kepala Sekolah</p>
              <div className="mt-16">
                <p className="font-bold text-black underline underline-offset-4 text-[13px]">
                  {formSettings.kepalaSekolah || 'Drs. H. Mulyadi Kusuma, M.Pd.'}
                </p>
                <p className="text-gray-700 mt-1 text-[11px]">
                  NIP. {formSettings.nipKepala || '19750101 200003 1 001'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-700">
                {formSettings.kotaSurat || 'Kota Bintang'},{' '}
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="font-bold text-black mt-0.5">Guru BK / Konselor</p>
              <div className="mt-16">
                <p className="font-bold text-black underline underline-offset-4 text-[13px]">
                  {formSettings.guruBK || 'Siti Rahmawati, S.Pd., Gr.'}
                </p>
                <p className="text-gray-700 mt-1 text-[11px]">
                  NIP. {formSettings.nipGuruBK || '19880512 201402 2 003'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tombol Simpan & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto min-h-[48px] px-5 rounded-[14px] text-xs font-bold text-alert hover:bg-alert-tint border border-alert/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
          <span>Reset Semua Data ke Standar Demo</span>
        </button>

        <button
          onClick={handleSave}
          className={`w-full sm:w-auto min-h-[50px] px-8 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_6px_16px_rgb(255_163_108/0.25)] ${
            saved
              ? 'bg-accent-600 text-white'
              : 'bg-primary text-white hover:brightness-105 active:scale-[0.98]'
          }`}
        >
          {saved ? (
            <>
              <Check size={18} />
              <span>Pengaturan Berhasil Disimpan</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Simpan Perubahan Pengaturan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PengaturanView;
