import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Save, ArrowLeft, Download, Printer, Eye } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { useBK } from '../../../context/BKContext';
import { exportToCsv } from '../../../lib/exportCsv';
import { confirmDialog } from '../../ui/ConfirmModal';
import type { ProtaItem } from '../../../types';

interface ProtaFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const MONTH_NAMES = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

const KOMPONEN_OPTIONS = [
  'Layanan Dasar',
  'Layanan Responsif',
  'Peminatan & Perencanaan',
  'Dukungan Sistem',
];

const BIDANG_OPTIONS = [
  'Pribadi',
  'Sosial',
  'Belajar',
  'Karir',
  'Pribadi & Sosial',
  'Belajar & Karir',
  'Semua Bidang',
];

export const ProtaForm: React.FC<ProtaFormProps> = ({ onBack, onToast }) => {
  const { protaList, addProtaItem, updateProtaItem, deleteProtaItem, settings } = useBK();
  const [modalOpen, setModalOpen] = useState(false);
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProtaItem | null>(null);
  const [formData, setFormData] = useState<ProtaItem>({
    id: '',
    komponen: 'Layanan Dasar',
    jenis: '',
    bidang: 'Pribadi & Sosial',
    months: Array(12).fill(false),
    volume: 12,
    sasaran: '',
  });

  const [prioritas, setPrioritas] = useState({
    pribadi: 'Meningkatkan kesadaran diri, pengelolaan emosi, dan pengembangan karakter siswa melalui bimbingan klasikal dan konseling individual secara berkala untuk membangun kematangan pribadi.',
    sosial: 'Membangun kemampuan komunikasi interpersonal, etika pergaulan yang sehat, toleransi, resolusi konflik, dan kerja sama antar siswa dalam lingkungan sekolah maupun media sosial.',
    belajar: 'Mendampingi siswa dengan kesulitan belajar, meningkatkan motivasi akademik, mengatasi prokrastinasi, dan menyiapkan strategi belajar efektif menjelang asesmen semester.',
    karir: 'Memberikan wawasan orientasi karir kepada siswa khususnya kelas 9, termasuk pemetaan minat bakat melalui asesmen AKPD serta informasi komprehensif jenjang SMA, MA, dan SMK lanjutan.',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: String(Date.now()),
      komponen: 'Layanan Dasar',
      jenis: '',
      bidang: 'Pribadi',
      months: Array(12).fill(true),
      volume: 12,
      sasaran: 'Semua siswa kelas 7, 8, dan 9',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ProtaItem) => {
    setEditingItem(item);
    setFormData({ ...item, months: [...item.months] });
    setModalOpen(true);
  };

  const handleDelete = async (id: string, nama: string) => {
    const ok = await confirmDialog({
      title: `Hapus program kerja "${nama}"?`,
      confirmLabel: 'Ya, Hapus',
      tone: 'danger',
    });
    if (ok) {
      deleteProtaItem(id);
      onToast(`Program kerja "${nama}" dihapus.`);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jenis.trim()) {
      onToast('Nama jenis layanan tidak boleh kosong');
      return;
    }

    if (editingItem) {
      updateProtaItem(editingItem.id, formData);
      onToast('Program kerja diperbarui.');
    } else {
      addProtaItem(formData);
      onToast('Program kerja ditambahkan.');
    }

    setModalOpen(false);
  };

  const handleToggleMonth = (itemId: string, monthIdx: number) => {
    const item = protaList.find((p) => p.id === itemId);
    if (!item) return;
    const newMonths = [...item.months];
    newMonths[monthIdx] = !newMonths[monthIdx];
    updateProtaItem(itemId, { months: newMonths });
  };

  const handleVolumeChange = (itemId: string, newVol: number) => {
    updateProtaItem(itemId, { volume: Math.max(0, newVol) });
  };

  const handleModalToggleMonth = (idx: number) => {
    setFormData((prev) => {
      const updated = [...prev.months];
      updated[idx] = !updated[idx];
      return { ...prev, months: updated };
    });
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Komponen Layanan',
      'Jenis Layanan',
      'Bidang',
      ...MONTH_NAMES,
      'Volume (Jam)',
      'Sasaran Peserta',
    ];
    const rows = protaList.map((row, i) => [
      i + 1,
      row.komponen,
      row.jenis,
      row.bidang,
      ...row.months.map((m) => (m ? 'V' : '-')),
      row.volume,
      row.sasaran,
    ]);
    exportToCsv(
      `Prota_BK_${settings.namaSekolah.replace(/\s+/g, '_')}_${settings.tahunAjaran.replace(/\//g, '-')}`,
      headers,
      rows
    );
    onToast('Program Tahunan berhasil diekspor.');
  };

  const totalVolume = protaList.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);

  return (
    <div className="fade-up space-y-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 0 !important; } html, body { padding: 8mm 16mm 10mm 14mm !important; } }`}</style>
      {/* Navigation header */}
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
        <span className="text-xs bg-primary-tint text-primary font-bold px-3.5 py-1.5 rounded-full">
          {protaList.length} Program Kerja Terjadwal
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight">
            Program Tahunan BK (Prota)
          </h1>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            {settings.namaSekolah}, Tahun Ajaran {settings.tahunAjaran}.
          </p>
        </div>

        {/* Action Button Utama di Pojok Kanan Atas (Standar Seragam) */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setPreviewHvsOpen(true)}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Lihat pratinjau lembar kertas HVS putih sebelum dicetak"
          >
            <Eye size={15} />
            <span>Preview HVS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewHvsOpen(true);
              setTimeout(() => window.print(), 150);
            }}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer size={15} />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Unduh matriks Prota ke file Excel"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onToast('Perubahan Program Tahunan disimpan.')}
            className="min-h-[40px] px-4 rounded-[12px] bg-primary text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Save size={15} />
            <span>Simpan</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="min-h-[40px] px-4 rounded-[12px] bg-accent text-white text-xs font-bold hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Tambah Program</span>
          </button>
        </div>
      </div>

      {/* Program Table - Desain Seragam Angket */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        <div className="hidden print:block mb-3">
          <KopSurat settings={settings} compact />
        </div>
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            MATRIKS PROGRAM TAHUNAN BIMBINGAN & KONSELING (PROTA)
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            {settings.namaSekolah || 'SIM BK PRO'}, TAHUN AJARAN {settings.tahunAjaran || '2026/2027'} Â· TOTAL ALOKASI: {totalVolume} JAM
          </p>
        </div>

        <div className="overflow-x-auto border-t border-black">
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[980px]">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                <th className="border border-black px-3 py-2 text-left min-w-[260px]">KOMPONEN & URAIAN JENIS LAYANAN</th>
                <th className="border border-black px-2 py-2 text-left w-32">BIDANG</th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="border border-black px-1 py-2 text-center w-9">
                    {m}
                  </th>
                ))}
                <th className="border border-black px-1.5 py-2 text-center w-14">VOL</th>
                <th className="border border-black px-3 py-2 text-left min-w-[180px]">SASARAN</th>
                <th className="print:hidden border border-black px-2 py-2 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {protaList.map((row, i) => (
                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="border border-black px-2 py-2 text-center font-bold align-top">
                    {i + 1}
                  </td>
                  <td className="border border-black px-3 py-2 align-top">
                    <span className="inline-block text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded mb-1">
                      {row.komponen}
                    </span>
                    <p className="font-bold text-black leading-snug">
                      {row.jenis}
                    </p>
                  </td>
                  <td className="border border-black px-2 py-2 align-top">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-primary-tint text-primary whitespace-nowrap">
                      {row.bidang}
                    </span>
                  </td>
                  {row.months.map((checked, mi) => (
                    <td key={mi} className="border border-black px-1 py-2 text-center align-top pt-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleMonth(row.id, mi)}
                        title={`${MONTH_NAMES[mi]}: ${checked ? 'Aktif' : 'Nonaktif'}`}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="border border-black px-1.5 py-2 text-center align-top">
                    <input
                      type="number"
                      min="0"
                      value={row.volume}
                      onChange={(e) => handleVolumeChange(row.id, parseInt(e.target.value) || 0)}
                      className="w-11 min-h-[32px] text-center text-xs font-bold border border-black/40 rounded bg-white focus:outline-none focus:border-primary shadow-xs"
                    />
                  </td>
                  <td className="border border-black px-3 py-2 text-xs text-gray-800 font-medium leading-relaxed align-top">
                    {row.sasaran || '-'}
                  </td>
                  <td className="print:hidden border border-black px-2 py-2 text-center align-top">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(row)}
                        title="Edit Program"
                        className="p-1.5 text-muted hover:text-primary rounded hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id, row.jenis)}
                        title="Hapus Program"
                        className="p-1.5 text-muted hover:text-alert rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-black/30 text-[11px] text-muted flex justify-between items-center">
          <p>Total: {protaList.length} Program Kerja Terjadwal</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>

        {/* Lembar Tanda Tangan Cetak Prota */}
        <div className="hidden print:grid grid-cols-2 text-center text-xs pt-6 print:break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.kepalaSekolah || 'Kepala Sekolah'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipKepala || '-'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{settings.guruBK || 'Guru BK'}</p>
              <p className="text-[9.5px]">NIP. {settings.nipGuruBK || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prioritas Bidang Bimbingan */}
      <div className="bk-card space-y-5 print:hidden">
        <div className="border-b border-border pb-3">
          <h3 className="text-[17px] font-bold text-text">Prioritas Layanan per Bidang Bimbingan</h3>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Rumusan sasaran, fokus materi, dan strategi intervensi masing-masing bidang bimbingan untuk tahun ajaran aktif.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-text">1. Bidang Pribadi</span>
              <span className="text-xs text-muted font-medium">Karakter & Pengelolaan Diri</span>
            </div>
            <textarea
              rows={5}
              value={prioritas.pribadi}
              onChange={(e) => setPrioritas((prev) => ({ ...prev, pribadi: e.target.value }))}
              placeholder="Tuliskan sasaran dan prioritas bimbingan pribadi..."
              className="w-full min-h-[120px] p-3.5 rounded-[14px] border border-border text-[14px] leading-relaxed text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-text">2. Bidang Sosial</span>
              <span className="text-xs text-muted font-medium">Relasi & Komunikasi Sebaya</span>
            </div>
            <textarea
              rows={5}
              value={prioritas.sosial}
              onChange={(e) => setPrioritas((prev) => ({ ...prev, sosial: e.target.value }))}
              placeholder="Tuliskan sasaran dan prioritas bimbingan sosial..."
              className="w-full min-h-[120px] p-3.5 rounded-[14px] border border-border text-[14px] leading-relaxed text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-text">3. Bidang Belajar</span>
              <span className="text-xs text-muted font-medium">Motivasi & Prestasi Belajar</span>
            </div>
            <textarea
              rows={5}
              value={prioritas.belajar}
              onChange={(e) => setPrioritas((prev) => ({ ...prev, belajar: e.target.value }))}
              placeholder="Tuliskan sasaran dan prioritas bimbingan belajar..."
              className="w-full min-h-[120px] p-3.5 rounded-[14px] border border-border text-[14px] leading-relaxed text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm"
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-text">4. Bidang Karir</span>
              <span className="text-xs text-muted font-medium">Orientasi Minat & Masa Depan</span>
            </div>
            <textarea
              rows={5}
              value={prioritas.karir}
              onChange={(e) => setPrioritas((prev) => ({ ...prev, karir: e.target.value }))}
              placeholder="Tuliskan sasaran dan prioritas bimbingan karir..."
              className="w-full min-h-[120px] p-3.5 rounded-[14px] border border-border text-[14px] leading-relaxed text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-sm"
            />
          </label>
        </div>
      </div>

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title={`Pratinjau Kertas HVS: Program Tahunan (Prota)`}
      >
        <KopSurat
          settings={settings}
          judul="MATRIKS PROGRAM TAHUNAN BIMBINGAN & KONSELING (PROTA)"
          subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'} Â· TOTAL ALOKASI: ${totalVolume} JAM`}
        />

        <table className="w-full text-[10.5px] border-collapse border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black">
              <th className="border border-black p-1 text-center w-8">NO</th>
              <th className="border border-black p-1 text-left">JENIS LAYANAN</th>
              <th className="border border-black p-1 text-center w-24">BIDANG</th>
              <th className="border border-black p-1 text-center w-12">VOL</th>
              <th className="border border-black p-1 text-left w-36">SASARAN</th>
            </tr>
          </thead>
          <tbody>
            {protaList.map((row, i) => (
              <tr key={row.id}>
                <td className="border border-black p-1 text-center font-bold">{i + 1}</td>
                <td className="border border-black p-1">{row.jenis}</td>
                <td className="border border-black p-1 text-center">{row.bidang}</td>
                <td className="border border-black p-1 text-center font-bold">{row.volume}</td>
                <td className="border border-black p-1">{row.sasaran || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 text-center text-xs pt-4">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.kepalaSekolah || 'Belum Diisi di Pengaturan'}</p>
              <p>NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
            </div>
          </div>
          <div>
            <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-16">
              <p className="font-bold underline">{settings.guruBK || 'Belum Diisi di Pengaturan'}</p>
              <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
            </div>
          </div>
        </div>
      </HvsPreviewModal>

      {/* Modal Tambah/Edit Program Kerja */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-surface rounded-[28px] p-6 sm:p-7 shadow-2xl fade-up max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
              <div>
                <h3 className="font-extrabold text-[19px] text-text">
                  {editingItem ? 'Edit Program Kerja BK' : 'Tambah Program Kerja Baru'}
                </h3>
                <p className="text-xs text-muted mt-1">Lengkapi parameter dan rincian kegiatan layanan</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-muted hover:text-text rounded-full hover:bg-bg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Komponen Layanan</label>
                  <select
                    value={formData.komponen}
                    onChange={(e) => setFormData((prev) => ({ ...prev, komponen: e.target.value }))}
                    className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary"
                  >
                    {KOMPONEN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Bidang Bimbingan</label>
                  <select
                    value={formData.bidang}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bidang: e.target.value }))}
                    className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-primary"
                  >
                    {BIDANG_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Jenis / Uraian Topik Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.jenis}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jenis: e.target.value }))}
                  placeholder="Contoh: Bimbingan Klasikal: Motivasi Belajar & Manajemen Waktu"
                  className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Alokasi Volume (Jam / Frekuensi)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.volume}
                    onChange={(e) => setFormData((prev) => ({ ...prev, volume: parseInt(e.target.value) || 1 }))}
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Sasaran Peserta</label>
                  <input
                    type="text"
                    value={formData.sasaran}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sasaran: e.target.value }))}
                    placeholder="Contoh: Seluruh siswa kelas 8"
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-2">
                  Distribusi Pelaksanaan Bulan (Juli - Juni)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {MONTH_NAMES.map((m, idx) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleModalToggleMonth(idx)}
                      className={`min-h-[40px] text-xs font-bold rounded-[10px] transition-all flex flex-col items-center justify-center ${
                        formData.months[idx]
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-bg text-muted hover:bg-gray-200'
                      }`}
                    >
                      <span>{m}</span>
                      <span className="text-[10px] opacity-80">{formData.months[idx] ? 'âœ“' : '-'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border mt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bk-btn ghost flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bk-btn primary flex-1"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Matriks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtaForm;

