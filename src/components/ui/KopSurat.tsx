import React from 'react';
import type { SchoolSettings } from '../../types';

interface KopSuratProps {
  settings: SchoolSettings;
  judul?: string;
  subjudul?: string;
  nomorSurat?: string;
  className?: string;
  compact?: boolean;
}

// Logo Tut Wuri Handayani Resmi Kemendikbudristek (Sisi Kanan)
export const TutWuriEmblem = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full object-contain" aria-label="Tut Wuri Handayani">
    {/* Perisai Biru Segi Lima */}
    <polygon
      points="50,4 93,26 80,88 50,98 20,88 7,26"
      fill="#FFA36C"
      stroke="#FF8A3D"
      strokeWidth="2"
    />
    <polygon
      points="50,7 90,28 78,85 50,94 22,85 10,28"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.5"
    />
    {/* Teks Melengkung TUT WURI HANDAYANI */}
    <path id="tutwuri-curve" d="M 16,34 Q 50,14 84,34" fill="transparent" />
    <text fill="#FFFFFF" fontSize="6.2" fontWeight="bold" letterSpacing="0.6">
      <textPath href="#tutwuri-curve" startOffset="50%" textAnchor="middle">
        TUT WURI HANDAYANI
      </textPath>
    </text>
    {/* Sayap Garuda Putih */}
    <path
      d="M 50,42 Q 32,38 24,55 Q 36,58 46,68 L 50,65 L 54,68 Q 64,58 76,55 Q 68,38 50,42 Z"
      fill="#FFFFFF"
    />
    {/* Garis Sayap */}
    <path
      d="M 30,47 Q 42,50 48,60 M 70,47 Q 58,50 52,60"
      stroke="#FFA36C"
      strokeWidth="1.2"
      fill="none"
    />
    {/* Buku Terbuka */}
    <path
      d="M 50,72 Q 38,68 28,73 L 30,79 Q 40,75 50,78 Q 60,75 70,79 L 72,73 Q 62,68 50,72 Z"
      fill="#FFFFFF"
      stroke="#FF8A3D"
      strokeWidth="1"
    />
    {/* Tangkai Obor Emas */}
    <path d="M 48,52 L 52,52 L 51,70 L 49,70 Z" fill="#FFD100" />
    {/* Nyala Api Obor */}
    <path
      d="M 50,33 Q 45,40 50,48 Q 55,40 50,33 Z"
      fill="#FFD100"
      stroke="#FF8C00"
      strokeWidth="0.8"
    />
    <path d="M 50,37 Q 47,42 50,46 Q 53,42 50,37 Z" fill="#FF4500" />
  </svg>
);



export const KopSurat: React.FC<KopSuratProps> = ({
  settings,
  judul,
  subjudul,
  nomorSurat,
  className = '',
  compact = false,
}) => {
  const instansi = settings.instansiAtas || 'PEMERINTAH KOTA MAKASSAR';
  const namaSekolah = settings.namaSekolah || 'UPT SPF NAMA SEKOLAH Ibu';
  const alamat = settings.alamat || 'Jl. Jend. A. Yani No. 25 Makassar RT/RW: 002/002 Kec. Ujung Pandang Kota Makassar';
  const npsn = settings.npsn ? `NPSN: ${settings.npsn}` : '';
  const kontak = [settings.teleponSekolah || '', settings.emailSekolah ? `Email: ${settings.emailSekolah}` : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`text-black font-sans ${className}`}>
      {/* ======================================================== */}
      {/* SUSUNAN KOP DINAS 1:1 SESUAI CONTOH FOTO RESMI           */}
      {/* ======================================================== */}
      <div className={compact ? 'pb-1' : 'pb-1.5'}>
        <div className="flex items-center justify-between gap-2 sm:gap-3 pl-1 pr-2 sm:pl-2 sm:pr-3">
          {/* 1. SISI KIRI: LOGO DAERAH / SEKOLAH (DAPAT DI-UPLOAD) */}
          <div className="w-16 h-18 sm:w-20 sm:h-22 shrink-0 flex items-center justify-center ml-0.5 sm:ml-1">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Daerah / Sekolah"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-1 border border-black/60 rounded-xs bg-gray-50 text-center font-sans">
                <div className="w-8 h-8 rounded-full border-2 border-red-700 bg-red-50 flex items-center justify-center text-red-700 font-black text-xs">
                  MKS
                </div>
                <span className="text-[7.5px] font-black uppercase tracking-tight text-black mt-1 leading-none">
                  PEMDA
                </span>
                <span className="text-[6.5px] text-gray-700 font-bold leading-none mt-0.5">
                  KOTA MAKASSAR
                </span>
              </div>
            )}
          </div>

          {/* 2. TENGAH: IDENTITAS LENGKAP SEKOLAH */}
          <div className="flex-1 text-center min-w-0 px-1 sm:px-2">
            {/* Baris 1: Instansi Atas (PEMERINTAH KOTA MAKASSAR) */}
            <h3
              className={`font-bold uppercase tracking-wide text-black ${
                compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-[14px]'
              }`}
            >
              {instansi}
            </h3>

            {/* Baris 2: Nama Lengkap Sekolah (UPT SPF NAMA SEKOLAH Ibu) */}
            <h1
              className={`font-black uppercase tracking-tight text-black leading-tight mt-0.5 ${
                compact ? 'text-sm sm:text-lg' : 'text-base sm:text-[22px]'
              }`}
            >
              {namaSekolah}
            </h1>

            {/* Baris 3: NPSN & Alamat Lengkap */}
            <p
              className={`text-black mt-1 leading-tight ${
                compact ? 'text-[9.5px] sm:text-[10.5px]' : 'text-[10px] sm:text-[11.5px]'
              }`}
            >
              {npsn ? `${npsn}, ` : ''}{alamat}
            </p>

            {/* Baris 4: Telepon, Fax, dan Email */}
            {kontak && (
              <p
                className={`text-black mt-0.5 leading-tight ${
                  compact ? 'text-[9.5px] sm:text-[10.5px]' : 'text-[10px] sm:text-[11.5px]'
                }`}
              >
                {kontak}
              </p>
            )}
          </div>

          {/* 3. SISI KANAN: LOGO TUT WURI HANDAYANI RESMI KEMENDIKBUD */}
          <div className="w-16 h-18 sm:w-20 sm:h-22 shrink-0 flex items-center justify-center mr-1 sm:mr-2">
            {settings.logoKananUrl ? (
              <img
                src={settings.logoKananUrl}
                alt="Logo Tut Wuri"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <TutWuriEmblem />
            )}
          </div>
        </div>

        {/* GARIS PEMBATAS GANDA RESMI (DOUBLE RULE DINAS) */}
        <div className="border-b-[2.5px] border-black mt-2 mb-[1.5px] w-full" />
        <div className="border-b-[1px] border-black w-full" />
      </div>

      {/* ======================================================== */}
      {/* JUDUL DAN NOMOR SURAT DI BAWAH KOP (FORMAT 1:1 FOTO)      */}
      {/* ======================================================== */}
      {(judul || nomorSurat || subjudul) && (
        <div className={`text-center ${compact ? 'mt-2 mb-2.5' : 'mt-3 mb-4'}`}>
          {judul && (
            <h2
              className={`font-black uppercase tracking-wide text-black underline underline-offset-4 ${
                compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-[15px]'
              }`}
            >
              {judul}
            </h2>
          )}
          {nomorSurat && (
            <p
              className={`font-bold text-black ${
                compact ? 'text-[10px] sm:text-[11px] mt-0.5' : 'text-[11px] sm:text-xs mt-1'
              }`}
            >
              Nomor : {nomorSurat}
            </p>
          )}
          {subjudul && (
            <p
              className={`font-semibold text-gray-800 ${
                compact ? 'text-[9.5px] sm:text-[10.5px] mt-0.5' : 'text-[10.5px] sm:text-[11.5px] mt-0.5'
              }`}
            >
              {subjudul}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default KopSurat;

