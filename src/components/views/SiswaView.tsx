import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  X,
  ArrowUpDown,
  UserCheck,
  Printer,
  Home,
  Check,
  Save,
  Mail,
  Eye,
  Edit2,
} from "lucide-react";
import PetunjukIbu from '../ui/PetunjukIbu';
import KopSurat from '../ui/KopSurat';
import HvsPreviewModal from '../ui/HvsPreviewModal';
import { SuratModal } from './siswa/SuratModal';
import { useBK } from '../../context/BKContext';
import { exportToCsv, parseCsv } from '../../lib/exportCsv';
import { ListSkeleton } from '../ui/Skeleton';
import type { Student, CounselingRecord } from '../../types';
interface SiswaViewProps {
  onToast: (msg: string) => void;
}

type SortKey = keyof Pick<Student, 'nama' | 'nis' | 'kelas' | 'status'>;

export default function SiswaView({ onToast }: SiswaViewProps) {
  const { students, records, addStudent, updateStudent, addCounselingRecord, settings, isBooting } = useBK();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nama');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal tambah siswa
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    nama: '',
    nis: '',
    nisn: '',
    jk: 'L' as 'L' | 'P',
    kelas: '7A',
    namaWali: '',
    kontakWali: '',
    alamat: '',
    catatanKhusus: '',
  });
  // Modal Edit Master Data Siswa
  const [editOpen, setEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({
    nama: '',
    nis: '',
    nisn: '',
    jk: 'L' as 'L' | 'P',
    kelas: '7A',
    status: 'Aktif' as 'Aktif' | 'Pindah' | 'Lulus',
    namaWali: '',
    kontakWali: '',
    alamat: '',
    catatanKhusus: '',
  });

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      nama: student.nama,
      nis: student.nis,
      nisn: student.nisn || '',
      jk: student.jk,
      kelas: student.kelas,
      status: student.status,
      namaWali: student.namaWali || '',
      kontakWali: student.kontakWali || '',
      alamat: student.alamat || '',
      catatanKhusus: student.catatanKhusus || '',
    });
    setEditOpen(true);
  };
  // Simpan perubahan data siswa
  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, editForm);
    setEditOpen(false);
    setEditForm({
      nama: '',
      nis: '',
      nisn: '',
      jk: 'L',
      kelas: '7A',
      status: 'Aktif',
      namaWali: '',
      kontakWali: '',
      alamat: '',
      catatanKhusus: '',
    });
    onToast(`Data ${editForm.nama} berhasil diperbarui.`);
  };

  // Drawer / Modal Buku Pribadi Siswa
  // Drawer / Modal Buku Pribadi Siswa
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [suratModalOpen, setSuratModalOpen] = useState(false);
  const [previewHvsOpen, setPreviewHvsOpen] = useState(false);
  const [suratType, setSuratType] = useState<'panggilan' | 'home_visit'>('panggilan');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState<{
    jenis: CounselingRecord['jenis'];
    bidang: CounselingRecord['bidang'];
    tanggal: string;
    waktu: string;
    masalah: string;
    tindakLanjut: string;
    status: CounselingRecord['status'];
  }>({
    jenis: 'Konseling Individual',
    bidang: 'Pribadi',
    tanggal: '2026-11-05',
    waktu: '10:00',
    masalah: '',
    tindakLanjut: '',
    status: 'Proses',
  });

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        if (kelasFilter && !s.kelas.startsWith(kelasFilter)) return false;
        if (!q) return true;
        const lq = q.toLowerCase();
        return (
          s.nama.toLowerCase().includes(lq) ||
          s.nis.includes(lq) ||
          s.kelas.toLowerCase().includes(lq)
        );
      })
      .sort((a, b) => {
        const cmp = a[sortKey].localeCompare(b[sortKey], 'id');
        return sortAsc ? cmp : -cmp;
      });
  }, [students, q, kelasFilter, sortKey, sortAsc]);

  // Pagination tabel siswa: 20 baris/halaman agar tetap ringan di HP
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Kembali ke halaman 1 saat pencarian/filter berubah, dan jaga page tetap valid
  useEffect(() => {
    setPage(1);
  }, [q, kelasFilter, sortKey, sortAsc]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);      setSortAsc(true);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.nis.trim()) {
      onToast('Nama dan NIS wajib diisi');
      return;
    }
    const created = addStudent({
      nama: form.nama.trim(),
      nis: form.nis.trim(),
      nisn: form.nisn.trim() || '-',
      jk: form.jk,
      kelas: form.kelas,
      status: 'Aktif',
      namaWali: form.namaWali.trim(),
      kontakWali: form.kontakWali.trim(),
      alamat: form.alamat.trim(),
      catatanKhusus: form.catatanKhusus.trim(),
    });
    setForm({
      nama: '',
      nis: '',
      nisn: '',
      jk: 'L',
      kelas: '7A',
      namaWali: '',
      kontakWali: '',
      alamat: '',
      catatanKhusus: '',
    });
    setAddOpen(false);
    onToast(`Siswa ${created.nama} berhasil ditambahkan`);
  };

  // Tambah catatan baru langsung ke buku siswa ini
  const handleSaveStudentRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudent || !newRecordForm.masalah.trim()) {
      onToast('Uraian masalah / konseling wajib diisi');
      return;
    }

    addCounselingRecord({
      studentId: selectedStudent.id,
      namaSiswa: selectedStudent.nama,
      kelas: selectedStudent.kelas,
      tanggal: newRecordForm.tanggal,
      waktu: newRecordForm.waktu,
      jenis: newRecordForm.jenis,
      bidang: newRecordForm.bidang,
      masalah: newRecordForm.masalah,
      tindakLanjut: newRecordForm.tindakLanjut,
      status: newRecordForm.status,
      tahap: 'Catatan Baru',
    });
    setNewRecordForm({
      jenis: 'Konseling Individual',
      bidang: 'Pribadi',
      tanggal: '2026-11-05',
      waktu: '10:00',
      masalah: '',
      tindakLanjut: '',
      status: 'Proses',
    });
    setShowAddRecord(false);
    onToast(`Catatan konseling ${selectedStudent.nama} berhasil disimpan.`);
  };

  // Ambil riwayat konseling siswa terpilih
  const studentRecords = selectedStudent
    ? records.filter((r) => r.studentId === selectedStudent.id)
    : [];

  const CLASS_FILTERS = [
    { key: '', label: 'Semua Siswa' },
    { key: '7', label: 'Kelas 7' },
    { key: '8', label: 'Kelas 8' },
    { key: '9', label: 'Kelas 9' },
  ];

  return (
    <div className="space-y-4 fade-up">
      {/* Head */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] sm:text-[28px] font-[750] text-text tracking-tight leading-tight">
            Data Siswa &amp; Catatan Konseling
          </h1>
        </div>

        {/* Action Button Utama di Pojok Kanan Atas (Standar Seragam) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const headers = ['Nama Siswa', 'NIS', 'NISN', 'Jenis Kelamin', 'Kelas', 'Status', 'Nama Wali', 'Kontak Wali', 'Alamat', 'Catatan Khusus'];
              const rows = filtered.map((s) => [
                s.nama,
                s.nis,
                s.nisn,
                s.jk === 'L' ? 'Laki-laki' : 'Perempuan',
                s.kelas,
                s.status,
                s.namaWali || '-',
                s.kontakWali || '-',
                s.alamat || '-',
                s.catatanKhusus || '-',
              ]);
              exportToCsv(`Data_Siswa_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
              onToast(`Data siswa berhasil diekspor (${rows.length} siswa).`);
            }}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Unduh seluruh data siswa ke format Excel"
          >
            <Download size={15} />
            <span>Unduh Excel</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[40px] px-3.5 rounded-[12px] bg-white border border-border text-text text-xs font-bold hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Impor daftar siswa dari berkas CSV / Excel"
          >
            <Upload size={15} />
            <span>Impor Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="min-h-[40px] px-4 rounded-[12px] bg-black text-white font-bold text-xs hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      <PetunjukIbu
        tips={[
          'Klik baris nama siswa untuk membuka Buku Catatan Siswa, menambah sesi konseling, atau mencetak Kartu Konseling.',
          'Bila siswa membutuhkan pembinaan khusus bersama keluarga, klik nama siswa lalu gunakan tombol "Surat Panggilan" atau "Home Visit" untuk mencetak surat resmi ber-kop sekolah.',
          'Ibu juga bisa menyaring siswa berdasarkan tingkat kelas (7, 8, atau 9) dan mencari nama siswa dengan cepat lewat kolom pencarian.'
        ]}
      />
      {/* Floating Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          strokeWidth={2}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Cari nama siswa, NIS, atau kelas... (Klik nama siswa untuk membuka catatan)"
          className="w-full min-h-[50px] pl-11 pr-4 rounded-[16px] bg-surface text-text text-[15px] shadow-[0_1px_2px_rgb(0_0_0/0.03),0_4px_12px_rgb(0_0_0/0.06)] border border-border/80 placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
        />
      </div>

      {/* Chips Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CLASS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKelasFilter(f.key)}
            className={`bk-chip ${kelasFilter === f.key ? 'on' : ''}`}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 pl-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const text = event.target?.result as string;
                  const parsed = parseCsv(text);
                  if (parsed.length <= 1) {
                    onToast('Berkas CSV kosong atau tidak memiliki baris data.');
                    return;
                  }
                  const dataRows = parsed.slice(1);
                  let count = 0;
                  dataRows.forEach((cols, idx) => {
                    const nama = cols[0]?.trim();
                    if (nama) {
                      addStudent({
                        nama,
                        nis: cols[1]?.trim() || String(2400 + students.length + idx),
                        nisn: cols[2]?.trim() || '-',
                        jk: (cols[3]?.trim().toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P',
                        kelas: cols[4]?.trim() || '7A',
                        status: 'Aktif',
                        namaWali: cols[6]?.trim() || '',
                        kontakWali: cols[7]?.trim() || '',
                        alamat: cols[8]?.trim() || '',
                        catatanKhusus: cols[9]?.trim() || '',
                      });
                      count++;
                    }
                  });
                  onToast(`${count} data siswa berhasil diimpor.`);
                } catch {
                  onToast('Gagal memproses CSV. Pastikan format tabel sesuai.');
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
              };
              reader.readAsText(file);
            }}
            accept=".csv,text/csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bk-chip"
            title="Impor daftar siswa dari berkas CSV"
          >
            <Upload size={14} /> Impor Excel
          </button>
          <button
            onClick={() => {
              const headers = ['Nama Siswa', 'NIS', 'NISN', 'Jenis Kelamin', 'Kelas', 'Status', 'Nama Wali', 'Kontak Wali', 'Alamat', 'Catatan Khusus'];
              const rows = filtered.map((s) => [
                s.nama,
                s.nis,
                s.nisn,
                s.jk === 'L' ? 'Laki-laki' : 'Perempuan',
                s.kelas,
                s.status,
                s.namaWali || '-',
                s.kontakWali || '-',
                s.alamat || '-',
                s.catatanKhusus || '-',
              ]);
              exportToCsv(`Data_Siswa_${settings.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
              onToast(`Data siswa berhasil diekspor (${rows.length} siswa).`);
            }}
            className="bk-chip"
            title="Ekspor seluruh data siswa ke format CSV"
          >
            <Download size={14} /> Unduh Excel
          </button>
        </div>
      </div>

      {/* Student Table - Desain Seragam Pilihan Karir */}
      <div className="bg-white border border-black rounded-none p-4 sm:p-5 shadow-sm text-black">
        {/* Table Title Bar */}
        <div className="border-b-2 border-black pb-3 mb-3 text-center">
          <h2 className="text-[16px] sm:text-[17px] font-extrabold uppercase tracking-wide text-black">
            BUKU CATATAN PESERTA DIDIK {kelasFilter ? `( KELAS ${kelasFilter} )` : '( SEMUA KELAS )'}
          </h2>
          <p className="text-xs text-black/80 font-bold mt-0.5">
            {settings.namaSekolah || 'SIM BK PRO'} · TAHUN AJARAN {settings.tahunAjaran || '2026/2027'}
          </p>
        </div>

        <div className="overflow-x-auto border-t border-black">
          <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[760px]">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black uppercase">
                <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                <th
                  onClick={() => toggleSort('nama')}
                  className="border border-black px-3 py-2 text-left cursor-pointer hover:bg-gray-200 select-none min-w-[200px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NAMA SISWA</span>
                    <ArrowUpDown size={12} className={sortKey === 'nama' ? 'text-gray-900 font-black' : 'opacity-40'} />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('nis')}
                  className="border border-black px-2 py-2 text-center w-20 cursor-pointer hover:bg-gray-200 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>NIS</span>
                    <ArrowUpDown size={12} className={sortKey === 'nis' ? 'text-gray-900 font-black' : 'opacity-40'} />
                  </div>
                </th>
                <th className="border border-black px-2 py-2 text-center w-28">NISN</th>
                <th className="border border-black px-1.5 py-2 text-center w-12">L/P</th>
                <th
                  onClick={() => toggleSort('kelas')}
                  className="border border-black px-2 py-2 text-center w-16 cursor-pointer hover:bg-gray-200 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>KELAS</span>
                    <ArrowUpDown size={12} className={sortKey === 'kelas' ? 'text-gray-900 font-black' : 'opacity-40'} />
                  </div>
                </th>
                <th className="border border-black px-2 py-2 text-center w-28">RIWAYAT KASUS</th>
                <th
                  onClick={() => toggleSort('status')}
                  className="border border-black px-2 py-2 text-center w-20 cursor-pointer hover:bg-gray-200 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>STATUS</span>
                    <ArrowUpDown size={12} className={sortKey === 'status' ? 'text-gray-900 font-black' : 'opacity-40'} />
                  </div>
                </th>
                <th className="border border-black px-2 py-2 text-center w-20">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {isBooting ? (
                <tr className="no-print">
                  <td colSpan={9} className="border border-black p-4">
                    <ListSkeleton rows={5} className="print:hidden" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black px-4 py-12 text-center text-muted">
                    <UserCheck size={32} className="mx-auto mb-2 text-muted/50" />
                    <p className="text-[14px] font-bold text-text">
                      {students.length === 0 ? 'Belum ada data siswa' : 'Siswa tidak ditemukan'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {students.length === 0
                        ? 'Tambahkan siswa atau impor daftar siswa untuk mulai mengisi buku catatan.'
                        : 'Coba sesuaikan kata kunci pencarian atau filter kelas.'}
                    </p>
                    {students.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="mt-3 min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800"
                      >
                        Tambah siswa pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((s, i) => {
                  const sRecords = records.filter((r) => r.studentId === s.id);
                  const hasActiveCase = sRecords.some((r) => r.status === 'Proses');
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="hover:bg-primary-tint cursor-pointer transition-colors group"
                      title="Klik untuk membuka catatan konseling siswa"
                    >
                      <td className="border border-black px-2 py-2 text-center font-bold">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="border border-black px-3 py-2 font-bold text-black whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-text transition-colors">{s.nama}</span>
                          {hasActiveCase && (
                            <span className="w-2 h-2 rounded-full bg-alert flex-none animate-pulse" title="Ada kasus berjalan" />
                          )}
                        </div>
                      </td>
                      <td className="border border-black px-2 py-2 text-center font-medium whitespace-nowrap">
                        {s.nis}
                      </td>
                      <td className="border border-black px-2 py-2 text-center text-gray-700 whitespace-nowrap">
                        {s.nisn}
                      </td>
                      <td className="border border-black px-1.5 py-2 text-center font-bold whitespace-nowrap">
                        {s.jk}
                      </td>
                      <td className="border border-black px-2 py-2 text-center font-bold text-gray-700 whitespace-nowrap">
                        {s.kelas}
                      </td>
                      <td className="border border-black px-2 py-2 text-center whitespace-nowrap">
                        {sRecords.length > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              hasActiveCase
                                ? 'bg-alert-tint text-alert'
                                : 'bg-neutral-200 text-neutral-800'
                            }`}
                          >
                            {sRecords.length} Catatan
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border border-black px-2 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            s.status === 'Aktif'
                              ? 'bg-neutral-50 text-neutral-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="border border-black px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(s);
                            }}
                            className="px-2.5 py-1 rounded-[8px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs"
                            title="Buka Catatan Siswa"
                          >
                            Buka
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(s);
                            }}
                            className="p-1 rounded-[8px] text-muted hover:text-text hover:bg-gray-100 transition-colors"
                            title="Ubah Data Siswa & Nama Orang Tua"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination: sembunyikan bila hanya 1 halaman */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 print:hidden">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="bk-btn ghost !min-h-[42px] !text-xs !px-4"
            >
              â€¹ Sebelumnya
            </button>
            <span className="px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold whitespace-nowrap">
              Halaman {page} dari {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="bk-btn ghost !min-h-[42px] !text-xs !px-4"
            >
              Berikutnya â€º
            </button>
          </div>
        )}

        {/* Table Footer */}
        <div className="mt-4 pt-3 border-t border-black/30 text-[11px] text-muted flex justify-between items-center">
          <p>Total: {filtered.length} siswa terdata. Klik "Buka" untuk melihat catatan konseling.</p>
          <p className="font-semibold text-text">{settings.namaSekolah || 'SIM BK PRO'}</p>
        </div>
      </div>

      {/* DRAWER / MODAL: BUKU PRIBADI SISWA */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] p-3 sm:p-5"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-4xl bg-white border border-black rounded-none p-5 sm:p-7 shadow-2xl fade-up max-h-[92vh] overflow-y-auto space-y-4 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Profil Siswa */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-extrabold text-xl shadow-md flex-none">
                  {selectedStudent.nama.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[20px] text-text">{selectedStudent.nama}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
                      Kelas {selectedStudent.kelas}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    NIS: <b>{selectedStudent.nis}</b>, NISN: <b>{selectedStudent.nisn}</b> ({selectedStudent.jk === 'L' ? 'Laki-laki' : 'Perempuan'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-none">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedStudent)}
                  className="min-h-[40px] px-4 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Ubah data master siswa dan nama orang tua"
                >
                  <Edit2 size={14} />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-10 h-10 text-muted hover:text-text rounded-full hover:bg-bg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Biodata Ringkas Siswa (Model Bimbingan Karir: Rapi, Atas ke Bawah, Tanpa Kolom Terpisah) */}
            <div className="border border-black p-3 text-xs bg-gray-50/50 space-y-1.5 text-black">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 pb-1.5">
                <div>
                  <span className="font-bold">Wali Murid / Orang Tua : </span>
                  <span className="font-bold text-text">{selectedStudent.namaWali || '(Belum diisi â€” tekan Edit Data di atas)'}</span>
                  {selectedStudent.kontakWali && (
                    <span className="ml-1 text-muted">({selectedStudent.kontakWali})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary bg-primary-tint px-2 py-0.5 rounded text-[11px] border border-primary">
                    {selectedStudent.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedStudent)}
                    className="px-2.5 py-1 rounded-[8px] bg-white border border-black/30 hover:border-gray-600 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Ubah data master siswa dan nama orang tua"
                  >
                    <Edit2 size={13} />
                    <span>Ubah Data Siswa / Orang Tua</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="font-bold">Alamat : </span>
                <span className="text-gray-800">{selectedStudent.alamat || 'Belum ada alamat'}</span>
              </div>

              {selectedStudent.catatanKhusus && (
                <div className="pt-1 text-text border-t border-black/10">
                  <span className="font-bold text-text">Catatan Khusus : </span>
                  <span>{selectedStudent.catatanKhusus}</span>
                </div>
              )}
            </div>

            {/* Riwayat Konseling & Kasus */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                <h4 className="font-extrabold text-[15px] text-text">
                  Catatan Konseling Siswa
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewHvsOpen(true)}
                    className="bk-chip !min-h-[38px] text-xs font-bold"
                    title="Lihat pratinjau lembar kertas HVS putih sebelum dicetak"
                  >
                    <Eye size={14} /> Preview HVS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewHvsOpen(true);
                      setTimeout(() => window.print(), 150);
                    }}
                    className="bk-chip !min-h-[38px] text-xs font-bold"
                    title="Cetak Kartu Konseling Siswa Resmi"
                  >
                    <Printer size={14} /> Cetak Kartu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuratType('panggilan');
                      setSuratModalOpen(true);
                    }}
                    className="bk-chip !min-h-[38px] text-xs font-bold text-alert hover:bg-alert-tint"
                    title="Cetak Surat Panggilan Orang Tua Resmi"
                  >
                    <Mail size={14} /> Surat Panggilan
                  </button>
                  <button
                    onClick={() => {
                      setSuratType('home_visit');
                      setSuratModalOpen(true);
                    }}
                    className="bk-chip !min-h-[38px] text-xs font-bold text-gray-600 hover:bg-gray-100"
                    title="Cetak Surat Kunjungan Rumah (Home Visit)"
                  >
                    <Home size={14} /> Home Visit
                  </button>
                  <button
                    onClick={() => setShowAddRecord(!showAddRecord)}
                    className="min-h-[38px] px-3.5 rounded-[12px] bg-black text-white font-bold text-xs hover:bg-neutral-800 flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={15} /> Tambah Sesi
                  </button>
                </div>
              </div>

              {/* Form Tambah Catatan Cepat untuk Siswa Ini */}
              {showAddRecord && (
                <form
                  onSubmit={handleSaveStudentRecord}
                  className="p-5 rounded-[18px] bg-neutral-50 border border-neutral-300 space-y-4 fade-up"
                >
                    <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
                    <h5 className="font-bold text-sm text-neutral-800">Tambah Catatan Konseling untuk {selectedStudent.nama}</h5>
                    <button
                      type="button"
                      onClick={() => setShowAddRecord(false)}
                      className="text-xs font-bold text-muted hover:text-text"
                    >
                      Tutup Form
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Jenis Layanan</label>
                      <select
                        value={newRecordForm.jenis}
                        onChange={(e) => setNewRecordForm((prev) => ({ ...prev, jenis: e.target.value as CounselingRecord['jenis'] }))}
                        className="w-full min-h-[42px] px-3 rounded-[10px] border border-border text-xs font-bold bg-white"
                      >
                        <option>Konseling Individual</option>
                        <option>Konseling Kelompok</option>
                        <option>Kunjungan Rumah</option>
                        <option>Konferensi Kasus</option>
                        <option>Bimbingan Klasikal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Bidang Layanan</label>
                      <select
                        value={newRecordForm.bidang}
                        onChange={(e) => setNewRecordForm((prev) => ({ ...prev, bidang: e.target.value as CounselingRecord['bidang'] }))}
                        className="w-full min-h-[42px] px-3 rounded-[10px] border border-border text-xs font-bold bg-white"
                      >
                        <option value="Pribadi">Pribadi</option>
                        <option value="Sosial">Sosial</option>
                        <option value="Belajar">Belajar</option>
                        <option value="Karir">Karir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text mb-1">Status Penanganan</label>
                      <select
                        value={newRecordForm.status}
                        onChange={(e) => setNewRecordForm((prev) => ({ ...prev, status: e.target.value as CounselingRecord['status'] }))}
                        className="w-full min-h-[42px] px-3 rounded-[10px] border border-border text-xs font-bold bg-white"
                      >
                        <option value="Proses">Masih Diproses</option>
                        <option value="Selesai">Kasus Selesai</option>
                        <option value="Menunggu">Menunggu Tindak Lanjut</option>
                      </select>
                    </div>
                  </div>

                  {/* Input Masalah Lapang */}
                  <div>
                    <label className="block text-xs font-bold text-text mb-1">
                      Deskripsi Masalah / Dinamika Konseling *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newRecordForm.masalah}
                      onChange={(e) => setNewRecordForm((prev) => ({ ...prev, masalah: e.target.value }))}
                      placeholder="Tuliskan kronologi, keluhan siswa, atau observasi sesi konseling secara leluasa..."
                      className="w-full min-h-[100px] p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text bg-white focus:outline-none focus:border-black shadow-sm"
                    />
                  </div>

                  {/* Kesepakatan / Tindak Lanjut */}
                  <div>
                    <label className="block text-xs font-bold text-text mb-1">
                      Rencana Tindak Lanjut / Kesepakatan Bersama
                    </label>
                    <textarea
                      rows={2}
                      value={newRecordForm.tindakLanjut}
                      onChange={(e) => setNewRecordForm((prev) => ({ ...prev, tindakLanjut: e.target.value }))}
                      placeholder="Langkah berikutnya, komitmen siswa, koordinasi ortu..."
                      className="w-full min-h-[70px] p-3 rounded-[12px] border border-border text-sm leading-relaxed text-text bg-white focus:outline-none focus:border-black shadow-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddRecord(false)}
                      className="bk-btn ghost !min-h-[40px] !text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-[10px] bg-black text-white font-bold text-xs hover:bg-neutral-800 shadow-sm"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              )}

              {/* Tabel Riwayat Konseling Siswa (Model Bimbingan Karir) */}
              <div className="overflow-x-auto border-t border-black">
                <table className="w-full text-[12px] sm:text-[13px] border-collapse border border-black min-w-[620px]">
                  <thead>
                    <tr className="bg-gray-100 font-extrabold text-black uppercase">
                      <th className="border border-black px-2 py-2 text-center w-10">NO</th>
                      <th className="border border-black px-3 py-2 text-left w-36">TANGGAL & WAKTU</th>
                      <th className="border border-black px-3 py-2 text-left w-36">LAYANAN</th>
                      <th className="border border-black px-3 py-2 text-left">URAIAN MASALAH / KONSELING</th>
                      <th className="border border-black px-3 py-2 text-left w-40">TINDAK LANJUT</th>
                      <th className="border border-black px-2 py-2 text-center w-24">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-black p-4 text-center text-xs text-gray-500 italic">
                          Belum ada catatan konseling untuk siswa ini.
                        </td>
                      </tr>
                    ) : (
                      studentRecords.map((rec, idx) => (
                        <tr key={rec.id} className="hover:bg-primary-tint transition-colors">
                          <td className="border border-black px-2 py-2 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="border border-black px-3 py-2 text-xs font-semibold whitespace-nowrap">
                            {rec.tanggal} ({rec.waktu})
                          </td>
                          <td className="border border-black px-3 py-2 text-xs font-bold text-gray-700 whitespace-nowrap">
                            {rec.jenis}
                          </td>
                          <td className="border border-black px-3 py-2 text-xs text-black leading-snug">
                            {rec.masalah}
                          </td>
                          <td className="border border-black px-3 py-2 text-xs text-gray-700 leading-snug">
                            {rec.tindakLanjut || '-'}
                          </td>
                          <td className="border border-black px-2 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                rec.status === 'Selesai'
                                  ? 'bg-neutral-50 text-neutral-800'
                                  : 'bg-alert-tint text-alert'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="min-h-[44px] px-6 rounded-[14px] bg-bg font-bold text-sm text-text hover:bg-gray-200"
              >
                Tutup Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SISWA BARU */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface rounded-[28px] p-6 sm:p-7 shadow-2xl fade-up max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
              <div>
                <h3 className="font-extrabold text-[19px] text-text">Tambah Data Siswa Baru</h3>
                <p className="text-xs text-muted mt-0.5">Lengkapi identitas pokok & kontak wali peserta didik</p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="p-1.5 text-muted hover:text-text rounded-full hover:bg-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Nama Lengkap Siswa *</label>
                <input
                  required
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Contoh: Muhammad Raditya Pratama"
                  className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-[15px] font-medium text-text focus:outline-none focus:border-black shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">NIS (Nomor Induk Siswa) *</label>
                  <input
                    required
                    value={form.nis}
                    onChange={(e) => setForm((f) => ({ ...f, nis: e.target.value }))}
                    placeholder="2413"
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-[15px] font-medium text-text focus:outline-none focus:border-black shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">NISN</label>
                  <input
                    value={form.nisn}
                    onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value }))}
                    placeholder="3101234509"
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-[15px] font-medium text-text focus:outline-none focus:border-black shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Jenis Kelamin</label>
                  <select
                    value={form.jk}
                    onChange={(e) => setForm((f) => ({ ...f, jk: e.target.value as 'L' | 'P' }))}
                    className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-black"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Kelas / Rombel</label>
                  <select
                    value={form.kelas}
                    onChange={(e) => setForm((f) => ({ ...f, kelas: e.target.value }))}
                    className="w-full min-h-[48px] px-3.5 rounded-[12px] border border-border text-sm text-text bg-surface focus:outline-none focus:border-black"
                  >
                    {['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-text">Nama Orang Tua / Wali</label>
                    <span className="text-[10.5px] text-neutral-800 font-bold">Untuk TTD Surat</span>
                  </div>
                  <input
                    value={form.namaWali}
                    onChange={(e) => setForm((f) => ({ ...f, namaWali: e.target.value }))}
                    placeholder="Contoh: Bpk. Supardi / Ibu Ratna"
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Nomor Telepon / WhatsApp Wali</label>
                  <input
                    value={form.kontakWali}
                    onChange={(e) => setForm((f) => ({ ...f, kontakWali: e.target.value }))}
                    placeholder="0812-3456-xxxx"
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Alamat Tempat Tinggal</label>
                <input
                  value={form.alamat}
                  onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Jl. Merpati No. 12, RT 01/RW 02..."
                    className="w-full min-h-[48px] px-4 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">
                  Catatan Khusus / Latar Belakang Siswa (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={form.catatanKhusus}
                  onChange={(e) => setForm((f) => ({ ...f, catatanKhusus: e.target.value }))}
                  placeholder="Contoh: Siswa tinggal bersama nenek, berbakat di bidang atletik, butuh pemantauan kedisiplinan..."
                  className="w-full min-h-[84px] p-3.5 rounded-[12px] border border-border text-sm leading-relaxed text-text focus:outline-none focus:border-black shadow-sm resize-y"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="bk-btn ghost flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-[14px] bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: UBAH DATA MASTER SISWA & NAMA ORANG TUA */}
      {editOpen && editingStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-3 sm:p-5"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface rounded-[24px] p-6 sm:p-7 shadow-2xl fade-up max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <h3 className="font-extrabold text-[19px] text-text">Ubah Data Master Siswa</h3>
                <p className="text-xs text-muted mt-0.5">Perbarui biodata pokok, kelas, status, dan nama orang tua/wali murid</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 text-muted hover:text-text rounded-full hover:bg-bg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Nama Lengkap Siswa *</label>
                <input
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Nama Lengkap Siswa"
                  className="w-full min-h-[46px] px-3.5 rounded-[12px] border border-border text-[15px] font-medium text-text focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">NIS (Nomor Induk) *</label>
                  <input
                    required
                    value={editForm.nis}
                    onChange={(e) => setEditForm((f) => ({ ...f, nis: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">NISN</label>
                  <input
                    value={editForm.nisn}
                    onChange={(e) => setEditForm((f) => ({ ...f, nisn: e.target.value }))}
                    className="w-full min-h-[46px] px-3.5 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Jenis Kelamin</label>
                  <select
                    value={editForm.jk}
                    onChange={(e) => setEditForm((f) => ({ ...f, jk: e.target.value as 'L' | 'P' }))}
                    className="w-full min-h-[46px] px-2.5 rounded-[12px] border border-border text-xs text-text bg-surface focus:outline-none focus:border-black"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Kelas</label>
                  <select
                    value={editForm.kelas}
                    onChange={(e) => setEditForm((f) => ({ ...f, kelas: e.target.value }))}
                    className="w-full min-h-[46px] px-2.5 rounded-[12px] border border-border text-xs text-text bg-surface focus:outline-none focus:border-black"
                  >
                    {['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '9C'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">Status Siswa</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as 'Aktif' | 'Pindah' | 'Lulus' }))}
                    className="w-full min-h-[46px] px-2.5 rounded-[12px] border border-border text-xs text-text bg-surface focus:outline-none focus:border-black"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pindah">Pindah</option>
                    <option value="Lulus">Lulus</option>
                  </select>
                </div>
              </div>

              {/* NAMA ORANG TUA / WALI MURID (PENTING UNTUK TTD) */}
              <div className="bg-neutral-50 border border-neutral-300 p-3.5 rounded-[14px] space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-800">
                      Nama Lengkap Orang Tua / Wali Murid
                    </label>
                    <span className="text-[10.5px] bg-black text-white font-bold px-2 py-0.5 rounded-full">
                      Penting untuk Kolom TTD
                    </span>
                  </div>
                  <input
                    value={editForm.namaWali}
                    onChange={(e) => setEditForm((f) => ({ ...f, namaWali: e.target.value }))}
                    placeholder="Contoh: Bpk. Hendra Rahman / Ibu Sri Wahyuni"
                    className="w-full min-h-[46px] px-3.5 rounded-[10px] border border-neutral-300 bg-white text-sm font-semibold text-text focus:outline-none focus:border-black shadow-xs"
                  />
                  <p className="text-[11px] text-neutral-800 mt-1 leading-snug">
                    Nama ini akan otomatis tercetak di bawah kolom tanda tangan orang tua pada <b>Surat Panggilan</b>, <b>Surat Kunjungan Rumah</b>, dan <b>Formulir Pemetaan Karir</b>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text mb-1">Nomor Telepon / WhatsApp Orang Tua</label>
                  <input
                    value={editForm.kontakWali}
                    onChange={(e) => setEditForm((f) => ({ ...f, kontakWali: e.target.value }))}
                    placeholder="0812-3456-xxxx"
                    className="w-full min-h-[44px] px-3.5 rounded-[10px] border border-border bg-white text-sm text-text focus:outline-none focus:border-black shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Alamat Lengkap</label>
                <input
                  value={editForm.alamat}
                  onChange={(e) => setEditForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Alamat tempat tinggal siswa..."
                  className="w-full min-h-[46px] px-3.5 rounded-[12px] border border-border text-sm text-text focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1.5">Catatan Khusus / Latar Belakang</label>
                <textarea
                  rows={2}
                  value={editForm.catatanKhusus}
                  onChange={(e) => setEditForm((f) => ({ ...f, catatanKhusus: e.target.value }))}
                  placeholder="Catatan latar belakang siswa..."
                  className="w-full p-3 rounded-[12px] border border-border text-xs leading-relaxed text-text focus:outline-none focus:border-black shadow-xs resize-y"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="bk-btn ghost flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[46px] rounded-[12px] bg-black text-white text-sm font-bold hover:bg-neutral-800 transition-all shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* FORMAT CETAK FISIK RESMI: KARTU KONSELING SISWA          */}
      {/* ======================================================== */}
      {selectedStudent && (
        <div className="hidden print:block bg-white text-black text-xs font-sans w-full p-2">
          <KopSurat
            settings={settings}
            judul="KARTU KONSELING PESERTA DIDIK"
            subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
          />

          <div className="grid grid-cols-2 gap-2 text-xs mb-4 border border-black p-3">
            <div>
              <p>Nama Siswa: <b>{selectedStudent.nama}</b></p>
              <p>NIS / NISN: {selectedStudent.nis} / {selectedStudent.nisn}</p>
              <p>Kelas / Jenis Kelamin: Kelas {selectedStudent.kelas} / {selectedStudent.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            <div>
              <p>Orang Tua / Wali: {selectedStudent.namaWali || '-'}</p>
              <p>Telepon Wali: {selectedStudent.kontakWali || '-'}</p>
              <p>Catatan Khusus: {selectedStudent.catatanKhusus || 'Tidak ada'}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[11px] mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1.5 w-8">No</th>
                <th className="border border-black p-1.5 w-24">Tanggal / Waktu</th>
                <th className="border border-black p-1.5 w-28">Jenis Layanan</th>
                <th className="border border-black p-1.5">Uraian Masalah / Konseling</th>
                <th className="border border-black p-1.5">Tindak Lanjut & Solusi</th>
                <th className="border border-black p-1.5 w-16">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black p-3 text-center italic">
                    Belum ada riwayat konseling tercatat untuk siswa ini.
                  </td>
                </tr>
              ) : (
                studentRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1.5 text-center">{i + 1}</td>
                    <td className="border border-black p-1.5">{r.tanggal} ({r.waktu})</td>
                    <td className="border border-black p-1.5">{r.jenis}</td>
                    <td className="border border-black p-1.5">{r.masalah}</td>
                    <td className="border border-black p-1.5">{r.tindakLanjut || '-'}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{r.status}</td>
                  </tr>
                ))
              )}
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
              <p className="font-bold mt-0.5">Guru BK / Konselor</p>
              <div className="mt-20">
                <p className="font-bold underline">{settings.guruBK || 'Belum Diisi di Pengaturan'}</p>
                <p>NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CETAK SURAT RESMI: PANGGILAN ORANG TUA / HOME VISIT */}
      <SuratModal
        open={suratModalOpen}
        onClose={() => setSuratModalOpen(false)}
        student={selectedStudent}
        type={suratType}
        settings={settings}
      />

      {/* MODAL SIMULASI KERTAS HVS A4 / FOLIO PUTIH: KARTU KONSELING */}
      {selectedStudent && (
        <HvsPreviewModal
          open={previewHvsOpen}
          onClose={() => setPreviewHvsOpen(false)}
          title={`Pratinjau Kertas HVS: Kartu Konseling (${selectedStudent.nama})`}
        >
          <KopSurat
            settings={settings}
            judul="KARTU KONSELING PESERTA DIDIK"
            subjudul={`TAHUN AJARAN ${settings.tahunAjaran || '2026/2027'}`}
          />

          <div className="grid grid-cols-2 gap-2 text-xs mb-4 border border-black p-3 bg-gray-50">
            <div>
              <p>Nama Siswa: <b>{selectedStudent.nama}</b></p>
              <p>NIS / NISN: {selectedStudent.nis} / {selectedStudent.nisn}</p>
              <p>Kelas / Jenis Kelamin: Kelas {selectedStudent.kelas} / {selectedStudent.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            <div>
              <p>Orang Tua / Wali: {selectedStudent.namaWali || '-'}</p>
              <p>Telepon Wali: {selectedStudent.kontakWali || '-'}</p>
              <p>Catatan Khusus: {selectedStudent.catatanKhusus || 'Tidak ada'}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[11px] mb-6">
            <thead>
              <tr className="bg-gray-100 font-extrabold text-black">
                <th className="border border-black p-1.5 w-8">No</th>
                <th className="border border-black p-1.5 w-24">Tanggal / Waktu</th>
                <th className="border border-black p-1.5 w-28">Jenis Layanan</th>
                <th className="border border-black p-1.5">Uraian Masalah / Konseling</th>
                <th className="border border-black p-1.5">Tindak Lanjut & Solusi</th>
                <th className="border border-black p-1.5 w-16">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-black p-3 text-center italic">
                    Belum ada riwayat konseling tercatat untuk siswa ini.
                  </td>
                </tr>
              ) : (
                studentRecords.map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-black p-1.5 text-center">{i + 1}</td>
                    <td className="border border-black p-1.5">{r.tanggal} ({r.waktu})</td>
                    <td className="border border-black p-1.5">{r.jenis}</td>
                    <td className="border border-black p-1.5">{r.masalah}</td>
                    <td className="border border-black p-1.5">{r.tindakLanjut || '-'}</td>
                    <td className="border border-black p-1.5 text-center font-bold">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="grid grid-cols-2 text-center text-xs pt-4">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="mt-14">
                <p className="font-bold underline">{settings.kepalaSekolah || 'Belum Diisi di Pengaturan'}</p>
                <p>NIP. {settings.nipKepala || '-'}</p>
              </div>
            </div>
            <div>
              <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold">Guru BK / Konselor</p>
              <div className="mt-14">
                <p className="font-bold underline">{settings.guruBK || 'Belum Diisi di Pengaturan'}</p>
                <p>NIP. {settings.nipGuruBK || '-'}</p>
              </div>
            </div>
          </div>
        </HvsPreviewModal>
      )}
    </div>
  );
}
