import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Save, ArrowLeft, Download, Printer, Eye, Check } from 'lucide-react';
import KopSurat from '../../ui/KopSurat';
import HvsPreviewModal from '../../ui/HvsPreviewModal';
import { AppGlassButton } from '../../ui/glass';
import { useBK } from '../../../context/BKContext';
import { exportToCsv } from '../../../lib/exportCsv';
import { formatKotaTanggal, formatNamaPejabat, formatNIP, formatNamaSekolah, formatTahunAjaran } from '../../../lib/documentFormat';
import type { ProsemItem } from '../../../types';
interface ProsemFormProps {
  onBack: () => void;
  onToast: (msg: string) => void;
}

const MONTH_NAMES = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];

export const ProsemForm: React.FC<ProsemFormProps> = ({ onBack, onToast }) => {
  const { settings } = useBK();
  const [prosemItems, setProsemItems] = useState<ProsemItem[]>([
    {
      id: '1',
      no: 1,
      kegiatan: 'Penyusunan Program Semester Ganjil',
      semester: '1',
      bulan: {
        jul: true,
        agu: true,
        sep: false,
        okt: false,
        nov: false,
        des: false,
        jan: false,
        feb: false,
        mar: false,
        apr: false,
        mei: false,
        jun: false,
      },
      keterangan: 'Persiapan Rencana Kerja',
    },
    {
      id: '2',
      no: 2,
      kegiatan: 'Pelaksanaan Asesmen Kebutuhan (AKPD)',
      semester: '1',
      bulan: {
        jul: false,
        agu: false,
        sep: true,
        okt: true,
        nov: true,
        des: false,
        jan: false,
        feb: false,
        mar: false,
        apr: false,
        mei: false,
        jun: false,
      },
      keterangan: 'Masa Persiapan Angket',
    },
    {
      id: '3',
      no: 3,
      kegiatan: 'Bimbingan Klasikal Bidang Karir Kelas 9',
      semester: '1',
      bulan: {
        jul: false,
        agu: false,
        sep: true,
        okt: true,
        nov: true,
        des: true,
        jan: false,
        feb: false,
        mar: false,
        apr: false,
        mei: false,
        jun: false,
      },
      keterangan: 'Sesi Klasikal Per Kelas',
    },
    {
      id: '4',
      no: 4,
      kegiatan: 'Penyusunan Laporan Bulanan',
      semester: '1',
      bulan: {
        jul: true,
        agu: true,
        sep: true,
        okt: true,
        nov: true,
        des: true,
        jan: true,
        feb: true,
        mar: true,
        apr: true,
        mei: true,
        jun: true,
      },
      keterangan: 'Tiap Akhir Bulan',
    },
    {
      id: '5',
      no: 5,
      kegiatan: 'Penyusunan Program Semester Genap',
      semester: '2',
      bulan: {
        jul: false,
        agu: false,
        sep: false,
        okt: false,
        nov: false,
        des: false,
        jan: true,
        feb: true,
        mar: false,
        apr: false,
        mei: false,
        jun: false,
      },
      keterangan: 'Revisi Program',
    },
    {
      id: '6',
      no: 6,
      kegiatan: 'Evaluasi Diri & Portofolio BK',
      semester: '2',
      bulan: {
        jul: false,
        agu: false,
        sep: false,
        okt: false,
        nov: false,
        des: false,
        jan: false,
        feb: false,
        mar: true,
        apr: true,
        mei: true,
        jun: true,
      },
      keterangan: 'Evaluasi Tahunan',
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProsemItem | null>(null);
  const [formData, setFormData] = useState<ProsemItem>({
    id: '',
    no: 0,
    kegiatan: '',
    semester: '1',
    bulan: {
      jul: false,
      agu: false,
      sep: false,
      okt: false,
      nov: false,
      des: false,
      jan: false,
      feb: false,
      mar: false,
      apr: false,
      mei: false,
      jun: false,
    },
    keterangan: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      id: String(Date.now()),
      no: prosemItems.length + 1,
      kegiatan: '',
      semester: '1',
      bulan: {
        jul: false,
        agu: false,
        sep: false,
        okt: false,
        nov: false,
        des: false,
        jan: false,
        feb: false,
        mar: false,
        apr: false,
        mei: false,
        jun: false,
      },
      keterangan: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ProsemItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleDelete = (id: string, kegiatan: string) => {
    if (window.confirm(`Hapus kegiatan "${kegiatan}"?`)) {
      setProsemItems(prosemItems.filter((item) => item.id !== id));
      // Renumber items
      const renumbered = prosemItems
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, no: idx + 1 }));
      setProsemItems(renumbered);
      onToast(`Kegiatan "${kegiatan}" dihapus.`);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kegiatan.trim()) {
      onToast('Nama kegiatan tidak boleh kosong');
      return;
    }

    if (editingItem) {
      setProsemItems(
        prosemItems.map((item) =>
          item.id === editingItem.id ? { ...formData } : item
        )
      );
      onToast('Kegiatan diperbarui.');
    } else {
      setProsemItems([...prosemItems, formData]);
      onToast('Kegiatan ditambahkan.');
    }
    setModalOpen(false);
  };

  const handleToggleMonth = (itemId: string, monthKey: keyof ProsemItem['bulan']) => {
    setProsemItems(
      prosemItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              bulan: { ...item.bulan, [monthKey]: !item.bulan[monthKey] },
            }
          : item
      )
    );
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'Uraian Kegiatan Program Semester',
      'Semester',
      ...MONTH_NAMES,
      'Keterangan',
    ];
    const exportRows = prosemItems.map((item) => [
      item.no,
      item.kegiatan,
      item.semester === '1' ? 'Ganjil' : 'Genap',
      ...MONTH_NAMES.map((m) => (item.bulan[m.toLowerCase() as keyof ProsemItem['bulan']] ? '✓' : '')),
      item.keterangan,
    ]);
    exportToCsv(
      `Program_Semester_BK_${formatNamaSekolah(settings.namaSekolah, 'Sekolah').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      exportRows
    );
    onToast(`Program Semester berhasil diekspor (${prosemItems.length} kegiatan).`);
  };

  return (
    <div className="fade-up space-y-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 0 !important; } html, body { padding: 8mm 16mm 10mm 14mm !important; } }`}</style>
      <div className="print:hidden flex items-center justify-between">
        <button onClick={onBack} className="bk-chip !min-h-[44px] text-xs font-bold">
          <ArrowLeft size={16} /> Kembali ke Dokumen
        </button>
        <span className="text-xs bg-neutral-50 text-neutral-800 font-bold px-3.5 py-1.5 rounded-full">
          {prosemItems.length} Kegiatan Tercatat
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold text-text tracking-tight">
            Program Semester (Prosem) BK
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Penjabaran agenda bimbingan per semester ganjil & genap tahun ajaran{' '}
            {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <AppGlassButton
            size="sm"
            variant="ghost"
            icon={<Eye size={15} />}
            onClick={() => setPreviewHvsOpen(true)}
          >
            Pratinjau
          </AppGlassButton>
          <AppGlassButton
            size="sm"
            variant="neutral"
            icon={<Download size={15} />}
            onClick={handleExportCsv}
          >
            Unduh Excel
          </AppGlassButton>
          <AppGlassButton
            size="sm"
            variant="neutral"
            icon={<Save size={15} />}
            onClick={() => onToast('Perubahan Program Semester disimpan.')}
          >
            Simpan
          </AppGlassButton>
          <AppGlassButton
            size="sm"
            variant="neutral"
            icon={<Plus size={15} strokeWidth={2.5} />}
            onClick={handleOpenAdd}
          >
            Tambah Kegiatan
          </AppGlassButton>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        <div className="hidden print:block mb-3">
          <KopSurat settings={settings} compact />
        </div>
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            PROGRAM SEMESTER (PROSEM) BIMBINGAN & KONSELING
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            {formatNamaSekolah(settings.namaSekolah, 'Bimbingan & Konseling')}, TAHUN AJARAN{' '}
            {formatTahunAjaran(settings.tahunAjaran)}
          </p>
        </div>

        <div className="overflow-x-auto border-t border-black">
          <table className="w-full text-[10px] sm:text-[12px] border-collapse border border-black min-w-[600px] sm:min-w-[760px]">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                <th className="border border-black px-3 py-2 text-left min-w-[240px]">
                  URAIAN KEGIATAN PROGRAM SEMESTER
                </th>
                <th className="border border-black px-2 py-2 text-center w-24">
                  SEMESTER
                </th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="border border-black px-1 py-2 text-center w-8">
                    {m}
                  </th>
                ))}
                <th className="border border-black px-3 py-2 text-left min-w-[180px]">
                  KETERANGAN
                </th>
                <th className="print:hidden border border-black px-2 py-2 text-center w-20">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {prosemItems.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="border border-black px-2 py-2 text-center font-bold align-top">
                    {row.no}
                  </td>
                  <td className="border border-black px-3 py-2 align-top">
                    <p className="font-bold text-black leading-snug">
                      {row.kegiatan}
                    </p>
                  </td>
                  <td className="border border-black px-2 py-2 text-center align-top">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.semester === '1'
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-800'
                      } whitespace-nowrap`}
                    >
                      {row.semester === '1' ? 'GANJIL' : 'GENAP'}
                    </span>
                  </td>
                  {MONTH_NAMES.map((monthName) => {
                    const monthKey = monthName.toLowerCase() as keyof ProsemItem['bulan'];
                    return (
                      <td
                        key={monthKey}
                        className="border border-black px-1 py-2 text-center align-top pt-3"
                      >
                        <input
                          type="checkbox"
                          checked={row.bulan[monthKey]}
                          onChange={() => handleToggleMonth(row.id, monthKey)}
                          title={`${monthName}: ${row.bulan[monthKey] ? 'Aktif' : 'Nonaktif'}`}
                          className="w-4 h-4 rounded accent-black cursor-pointer"
                        />
                      </td>
                    );
                  })}
                  <td className="border border-black px-3 py-2 align-top">
                    <p className="text-black text-xs leading-snug">{row.keterangan}</p>
                  </td>
                  <td className="print:hidden border border-black px-2 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="px-2 py-1 rounded bg-black text-white text-[10px] font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1"
                      >
                        <Edit2 size={10} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id, row.kegiatan)}
                        className="px-2 py-1 rounded bg-alert-tint text-alert text-[10px] font-bold hover:bg-alert-tint transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 size={10} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-black pt-4 mt-4 text-[11px] text-black flex justify-between items-center print:hidden">
          <p>Dokumen Program Semester BK – {formatTahunAjaran(settings.tahunAjaran)}</p>
          <p className="font-bold">
            {formatNamaPejabat(settings.guruBK, 'Guru Bimbingan & Konseling')} –{' '}
            {formatNamaSekolah(settings.namaSekolah, 'Satuan Pendidikan')}
          </p>
        </div>

        {/* Lembar Tanda Tangan Cetak Prosem */}
        <div className="hidden print:grid grid-cols-2 text-center text-xs pt-6 print:break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{formatNamaPejabat(settings.kepalaSekolah)}</p>
              <p className="text-[9.5px]">{formatNIP(settings.nipKepala)}</p>
            </div>
          </div>
          <div>
            <p>{formatKotaTanggal(settings.kotaSurat)}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-14">
              <p className="font-bold underline text-[11px]">{formatNamaPejabat(settings.guruBK, 'Guru BK / Konselor')}</p>
              <p className="text-[9.5px]">{formatNIP(settings.nipGuruBK)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
            <div className="sticky top-0 bg-white p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-text">
                {editingItem ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-bg rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text">
                    No Urut
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.no}
                    onChange={(e) =>
                      setFormData({ ...formData, no: parseInt(e.target.value) })
                    }
                    className="bk-input w-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text">
                    Semester
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        semester: e.target.value as '1' | '2',
                      })
                    }
                    className="bk-input w-full"
                  >
                    <option value="1">Semester Ganjil</option>
                    <option value="2">Semester Genap</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text">
                  Uraian Kegiatan *
                </label>
                <input
                  type="text"
                  value={formData.kegiatan}
                  onChange={(e) =>
                    setFormData({ ...formData, kegiatan: e.target.value })
                  }
                  placeholder="Contoh: Pelaksanaan Asesmen Kebutuhan (AKPD)"
                  className="bk-input w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text">
                  Bulan Pelaksanaan
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {MONTH_NAMES.map((monthName) => {
                    const monthKey = monthName.toLowerCase() as keyof ProsemItem['bulan'];
                    return (
                      <label
                        key={monthKey}
                        className="flex items-center gap-2 text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={formData.bulan[monthKey]}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              bulan: {
                                ...formData.bulan,
                                [monthKey]: !formData.bulan[monthKey],
                              },
                            })
                          }
                          className="w-4 h-4 rounded accent-black"
                        />
                        <span className="text-black font-medium">{monthName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-text">
                  Keterangan Tambahan
                </label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  placeholder="Contoh: Persiapan Angket, Sesi Klasikal Per Kelas, dll."
                  className="bk-input w-full min-h-[80px] resize-y"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2">
                <AppGlassButton size="sm" variant="ghost" onClick={() => setModalOpen(false)}>
                  Batal
                </AppGlassButton>
                <AppGlassButton
                  type="submit"
                  size="sm"
                  variant="neutral"
                  icon={<Save size={14} />}
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan'}
                </AppGlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HVS Preview Modal */}
      <HvsPreviewModal
        open={previewHvsOpen}
        onClose={() => setPreviewHvsOpen(false)}
        title={`Pratinjau Kertas HVS: Program Semester (Prosem)`}
      >
        <KopSurat
          settings={settings}
          judul="PROGRAM SEMESTER (PROSEM) BIMBINGAN & KONSELING"
          subjudul={`${formatNamaSekolah(settings.namaSekolah, 'Bimbingan & Konseling')} · TAHUN AJARAN ${formatTahunAjaran(settings.tahunAjaran)}`}
        />

        <table className="w-full text-[10px] border-collapse border border-black mb-6 min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 font-extrabold text-black uppercase">
              <th className="border border-black p-1 text-center w-8">No</th>
              <th className="border border-black p-1 text-left">Uraian Kegiatan Program Semester</th>
              <th className="border border-black p-1 text-center w-20">Semester</th>
              {MONTH_NAMES.map((m) => (
                <th key={m} className="border border-black p-1 text-center w-7">{m}</th>
              ))}
              <th className="border border-black p-1 text-left w-28">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {prosemItems.map((row) => (
              <tr key={row.id}>
                <td className="border border-black p-1 text-center font-bold">{row.no}</td>
                <td className="border border-black p-1 font-bold">{row.kegiatan}</td>
                <td className="border border-black p-1 text-center">{row.semester === '1' ? 'Ganjil' : 'Genap'}</td>
                {MONTH_NAMES.map((m) => {
                  const k = m.toLowerCase() as keyof ProsemItem['bulan'];
                  return <td key={k} className="border border-black p-1 text-center">{row.bulan[k] ? '✓' : ''}</td>;
                })}
                <td className="border border-black p-1">{row.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 text-center text-xs pt-4">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="mt-16">
              <p className="font-bold underline">{formatNamaPejabat(settings.kepalaSekolah)}</p>
              <p>{formatNIP(settings.nipKepala)}</p>
            </div>
          </div>
          <div>
            <p>{formatKotaTanggal(settings.kotaSurat)}</p>
            <p className="font-bold">Guru BK / Konselor</p>
            <div className="mt-16">
              <p className="font-bold underline">{formatNamaPejabat(settings.guruBK, 'Guru BK / Konselor')}</p>
              <p>{formatNIP(settings.nipGuruBK)}</p>
            </div>
          </div>
        </div>
      </HvsPreviewModal>
    </div>
  );
};