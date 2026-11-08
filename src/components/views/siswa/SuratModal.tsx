import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText } from "lucide-react";
import KopSurat from '../../ui/KopSurat';
import type { Student, SchoolSettings } from '../../../types';

interface SuratModalProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  type: 'panggilan' | 'home_visit';
  settings: SchoolSettings;
}

export const SuratModal: React.FC<SuratModalProps> = ({
  open,
  onClose,
  student,
  type,
  settings,
}) => {
  const isPanggilan = type === 'panggilan';

  // Form parameters
  const [nomorSurat, setNomorSurat] = useState('421.3 / 085 / SMP-BK / 2026');
  const [hariTanggal, setHariTanggal] = useState('Senin, 10 November 2026');
  const [waktu, setWaktu] = useState('09:00 WIB');
  const [tempat, setTempat] = useState('Ruang Bimbingan & Konseling (BK)');
  const [keperluan, setKeperluan] = useState(
    isPanggilan
      ? 'Koordinasi dan konsultasi bersama orang tua terkait perkembangan belajar serta ketertiban kehadiran putra/putri di sekolah.'
      : 'Kunjungan silaturahmi dan verifikasi kondisi lingkungan belajar siswa di rumah guna pendampingan bimbingan konseling yang optimal.'
  );

  useEffect(() => {
    if (student) {
      setKeperluan(
        isPanggilan
          ? `Koordinasi dan konsultasi bersama orang tua terkait perkembangan belajar serta ketertiban kehadiran ananda ${student.nama} (Kelas ${student.kelas}) di sekolah.`
          : `Kunjungan silaturahmi dan koordinasi bersama orang tua di kediaman ananda ${student.nama} (Kelas ${student.kelas}) guna memverifikasi kondisi belajar di rumah.`
      );
    }
  }, [student, isPanggilan]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('surat-modal-open');
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('surat-modal-open');
    };
  }, [open, onClose]);

  if (!open || !student || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[3px] p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          html, body { padding: 10mm 18mm 12mm 15mm !important; background: #ffffff !important; }
        }
      `}</style>
      <div
        className="w-full max-w-4xl max-h-[95vh] flex flex-col bg-surface rounded-none sm:rounded-[12px] shadow-2xl border border-border overflow-hidden print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Header - Hidden when printing */}
        <div className="print:hidden p-4 sm:p-5 border-b border-border bg-[#FFFFFF] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-[18px] text-text flex items-center gap-2">
              <FileText size={20} className="text-black" />
              {isPanggilan ? 'Cetak Surat Panggilan Orang Tua / Wali' : 'Cetak Surat Kunjungan Rumah (Home Visit)'}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              Siswa: <b>{student.nama}</b> (Kelas {student.kelas}) · Format resmi siap cetak
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="min-h-[42px] px-5 rounded-[12px] bg-black text-white text-xs font-bold hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
            >
              <Printer size={16} />
              <span>Cetak Surat Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-200/80 hover:bg-gray-300 text-muted hover:text-text flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Parameters Editor - Hidden when printing */}
        <div className="print:hidden p-4 border-b border-border bg-white text-xs space-y-3">
          <span className="font-bold text-muted uppercase tracking-wider block text-[11px]">
            Pengaturan Cepat Surat (Dapat Diedit):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-text mb-1">Nomor Surat:</label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-border text-xs focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text mb-1">Hari & Tanggal:</label>
              <input
                type="text"
                value={hariTanggal}
                onChange={(e) => setHariTanggal(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-border text-xs focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text mb-1">Waktu / Pukul:</label>
              <input
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-border text-xs focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text mb-1">Tempat Menghadap:</label>
              <input
                type="text"
                value={tempat}
                onChange={(e) => setTempat(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-[8px] border border-border text-xs focus:outline-none focus:border-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text mb-1">Keperluan / Alasan:</label>
            <textarea
              rows={2}
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              className="w-full p-2 rounded-[8px] border border-border text-xs focus:outline-none focus:border-black resize-y"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* SURAT RESMI CETAK (Kertas A4 / Folio Standar Dinas)      */}
        {/* ======================================================== */}
        <div className="surat-print-sheet flex-1 overflow-y-auto p-6 sm:p-10 print:p-0 bg-white text-black text-[12.5px] leading-relaxed font-sans print:overflow-visible">
          {/* Kop Surat Sekolah Resmi */}
          <KopSurat settings={settings} />
          {/* Nomor & Perihal */}
          <div className="flex justify-between items-start text-xs sm:text-[13px] mb-5">
            <div className="space-y-1">
              <p>Nomor&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {nomorSurat}</p>
              <p>Lampiran&nbsp;&nbsp;: -</p>
              <p className="font-bold">
                Perihal&nbsp;&nbsp;&nbsp;&nbsp;: {isPanggilan ? 'Panggilan Orang Tua / Wali Siswa' : 'Pemberitahuan Kunjungan Rumah (Home Visit)'}
              </p>
            </div>
            <div className="text-right">
              <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Tujuan Surat */}
          <div className="mb-5 text-xs sm:text-[13px]">
            <p>Kepada Yth.</p>
            <p className="font-bold">Bapak / Ibu Orang Tua / Wali dari :</p>
            <p className="font-bold text-[14px] mt-0.5">{student.nama} (Kelas {student.kelas})</p>
            <p className="text-xs text-gray-700">Alamat : {student.alamat || 'Di Tempat'}</p>
            <p className="mt-1">di - Tempat</p>
          </div>

          {/* Isi Surat */}
          <div className="space-y-3 text-justify text-xs sm:text-[13px] leading-relaxed">
            <p>Dengan hormat,</p>
            {isPanggilan ? (
              <>
                <p>
                  Sehubungan dengan perlunya koordinasi dan konsultasi bersama mengenai perkembangan belajar, kedisiplinan, serta pembinaan peserta didik di sekolah, dengan ini kami mengharap kehadiran Bapak/Ibu Orang Tua/Wali pada:
                </p>

                <div className="my-3 pl-6 sm:pl-10 space-y-1.5 font-medium border-l-2 border-black/30">
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Hari, Tanggal</span>
                    <span className="col-span-3">: {hariTanggal}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Waktu</span>
                    <span className="col-span-3">: Pukul {waktu}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Tempat</span>
                    <span className="col-span-3">: {tempat}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Menghadap</span>
                    <span className="col-span-3">: Guru Bimbingan dan Konseling ({settings.guruBK || 'Konselor Sekolah'})</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Keperluan</span>
                    <span className="col-span-3">: {keperluan}</span>
                  </div>
                </div>

                <p>
                  Mengingat pentingnya koordinasi ini demi masa depan dan kelancaran pendidikan putra/putri Bapak/Ibu, kami sangat mengharapkan kehadiran tepat pada waktunya. Atas perhatian, kehadiran, dan kerja sama yang baik, kami ucapkan terima kasih.
                </p>
              </>
            ) : (
              <>
                <p>
                  Dalam rangka mempererat silaturahmi, memverifikasi kondisi belajar peserta didik di lingkungan keluarga, serta memberikan pendampingan bimbingan konseling yang menyeluruh, dengan ini kami memberitahukan bahwa tim Bimbingan dan Konseling sekolah bermaksud melaksanakan <b>Kunjungan Rumah (Home Visit)</b> pada:
                </p>

                <div className="my-3 pl-6 sm:pl-10 space-y-1.5 font-medium border-l-2 border-black/30">
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Hari, Tanggal</span>
                    <span className="col-span-3">: {hariTanggal}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Perkiraan Waktu</span>
                    <span className="col-span-3">: Pukul {waktu}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Alamat Tujuan</span>
                    <span className="col-span-3">: {student.alamat || 'Kediaman Orang Tua Siswa'}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Tim Petugas</span>
                    <span className="col-span-3">: {settings.guruBK || 'Guru BK'} & Wali Kelas {student.kelas}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-bold">Maksud Kegiatan</span>
                    <span className="col-span-3">: {keperluan}</span>
                  </div>
                </div>

                <p>
                  Demikian surat pemberitahuan ini kami sampaikan. Kami berharap kehadiran tim pendidik dapat disambut dengan baik demi kepentingan tumbuh kembang peserta didik. Atas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.
                </p>
              </>
            )}
          </div>

          {/* Tanda Tangan Resmi Trilateral: Orang Tua, Guru BK, dan Kepala Sekolah */}
          <div className="mt-6 pt-2 print:mt-4 grid grid-cols-3 gap-2 text-center text-xs print:break-inside-avoid">
            <div>
              <p>Orang Tua / Wali Siswa,</p>
              <div className="mt-12 sm:mt-14">
                <p className="font-bold underline text-[12.5px]">
                  {student.namaWali || '( .......................................... )'}
                </p>
                <p className="text-[10.5px] text-gray-700 mt-0.5">Tanda Tangan & Nama Terang</p>
              </div>
            </div>

            <div>
              <p>{settings.kotaSurat || 'diisi di Pengaturan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold mt-0.5">Guru BK</p>
              <div className="mt-12 sm:mt-14">
                <p className="font-bold underline text-[12.5px]">
                  {settings.guruBK || 'Belum Diisi di Pengaturan'}
                </p>
                <p className="text-[10.5px] text-gray-700 mt-0.5">NIP. {settings.nipGuruBK || '19880512 201402 2 003'}</p>
              </div>
            </div>

            <div>
              <p>Mengetahui,</p>
              <p className="font-bold mt-0.5">Kepala Sekolah</p>
              <div className="mt-12 sm:mt-14">
                <p className="font-bold underline text-[12.5px]">
                  {settings.kepalaSekolah || 'Belum Diisi di Pengaturan'}
                </p>
                <p className="text-[10.5px] text-gray-700 mt-0.5">NIP. {settings.nipKepala || '19750101 200003 1 001'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body as Element
  );
};
export default SuratModal;

