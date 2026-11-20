import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X } from 'lucide-react';
import KopSurat from '../components/ui/KopSurat';
import type { SchoolSettings } from '../types';

/* ------------------------------------------------------------------ */
/* Tipe dokumen — satu sumber untuk pratinjau, cetak, dan ekspor Word  */
/* ------------------------------------------------------------------ */

export interface DocColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DocSection {
  heading?: string;
  intro?: string;
  /** Baris identitas dua kolom: label – isi. */
  facts?: Array<[string, string]>;
  /** Paragraf bebas (satu entri = satu paragraf). */
  paragraphs?: string[];
  columns?: Array<string | DocColumn>;
  rows?: Array<Array<string | number>>;
  /** Baris tebal di akhir tabel (mis. TOTAL). */
  totalRow?: Array<string | number>;
}

export interface DocNote {
  heading: string;
  body: string | string[];
}

export interface DocSpec {
  title: string;
  subtitle?: string;
  meta?: string[];
  sections: DocSection[];
  notes?: DocNote[];
  signature?: boolean;
  /** 'standard' = kepala sekolah + guru BK; 'sp' = 3 kolom + terima orang tua. */
  signatureMode?: 'standard' | 'sp';
  /** Teks latar (mis. DRAFT) yang ikut tercetak sebagai penanda. */
  watermark?: string;
  landscape?: boolean;
}

const normalizeColumn = (c: string | DocColumn): DocColumn =>
  typeof c === 'string' ? { label: c } : c;

const alignClass = (align?: DocColumn['align']) =>
  align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

const signatureDate = () =>
  new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/* Pratinjau dokumen (modal layar penuh)                              */
/* ------------------------------------------------------------------ */

interface DocPreviewProps {
  open: boolean;
  onClose: () => void;
  spec: DocSpec;
  settings: SchoolSettings;
}

export function DocPreview({ open, onClose, spec, settings }: DocPreviewProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('m-doc-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      document.body.classList.remove('m-doc-open');
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="m-doc-overlay fixed inset-0 z-[60] flex flex-col bg-black/70 backdrop-blur-[3px]">
      <style>{`@media print { @page { size: A4 ${
        spec.landscape ? 'landscape' : 'portrait'
      }; margin: 0 !important; } }`}</style>

      {/* Toolbar — di ponsel judul di atas, tombol aksi di bawahnya */}
      <div className="m-doc-toolbar flex flex-none flex-col gap-2 border-b border-black/10 bg-surface px-3 py-2.5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold leading-tight text-text">
              {spec.title}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">
              Pratinjau dokumen · A4 {spec.landscape ? 'landscape' : 'portrait'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gray-100 text-muted active:scale-95 sm:hidden"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <button
            type="button"
            onClick={() => downloadWordDoc(spec, settings)}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-surface px-2.5 text-[11px] font-bold text-text active:scale-95 sm:flex-none"
          >
            <Download size={14} /> Unduh Word
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 text-[11px] font-bold text-white active:scale-95 sm:flex-none"
          >
            <Printer size={14} /> Cetak / PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="hidden h-9 w-9 flex-none place-items-center rounded-full bg-gray-100 text-muted active:scale-95 sm:grid"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Kertas */}
      <div className="m-doc-scroll flex-1 overflow-y-auto p-2.5">
        <div className="m-doc-sheet relative mx-auto w-full max-w-[820px] bg-white p-4 text-black shadow-2xl sm:p-8">
          {spec.watermark && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 grid place-items-center overflow-hidden"
            >
              <span className="-rotate-12 text-[64px] font-black uppercase tracking-[0.2em] text-black/[0.07] sm:text-[110px]">
                {spec.watermark}
              </span>
            </div>
          )}
          <div className="relative z-[1]">
            <KopSurat settings={settings} judul={spec.title} subjudul={spec.subtitle} compact />

            {spec.meta && spec.meta.length > 0 && (
              <div className="mb-2 space-y-0.5 text-center text-[10px] font-semibold text-black/80">
                {spec.meta.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}

            <DocBody spec={spec} />

            {spec.signature !== false &&
              (spec.signatureMode === 'sp' ? (
                <SpSignatureBlock settings={settings} />
              ) : (
                <SignatureBlock settings={settings} />
              ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Isi dokumen (dipakai pratinjau)                                    */
/* ------------------------------------------------------------------ */

export function DocBody({ spec }: { spec: DocSpec }) {
  return (
    <div className="space-y-4">
      {spec.sections.map((section, si) => (
        <section key={si} className="space-y-1.5">
          {section.heading && (
            <h3 className="border-b border-black pb-1 text-[11px] font-extrabold uppercase text-black">
              {section.heading}
            </h3>
          )}
          {section.intro && (
            <p className="text-[10px] leading-relaxed text-black">{section.intro}</p>
          )}

          {section.facts && section.facts.length > 0 && (
            <table className="w-full border-collapse border border-black text-[10px]">
              <tbody>
                {section.facts.map(([label, value], fi) => (
                  <tr key={fi} className="align-top">
                    <td className="w-[32%] border border-black bg-gray-50 px-2 py-1 font-bold text-black">
                      {label}
                    </td>
                    <td className="border border-black px-2 py-1 text-black">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {section.paragraphs?.map((p, pi) => (
            <p key={pi} className="whitespace-pre-line text-[10px] leading-relaxed text-black">
              {p}
            </p>
          ))}

          {(section.columns?.length ?? 0) > 0 && (
            <div className="m-doc-table-wrap overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[9px] sm:text-[10px]">
                <thead>
                  <tr className="bg-gray-100 font-extrabold uppercase text-black">
                    {(section.columns ?? []).map((c, ci) => {
                      const col = normalizeColumn(c);
                      return (
                        <th
                          key={ci}
                          style={col.width ? { width: col.width } : undefined}
                          className={`border border-black px-1.5 py-1 ${alignClass(col.align)}`}
                        >
                          {col.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(section.rows?.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={section.columns?.length ?? 1}
                        className="border border-black px-2 py-4 text-center italic text-black/60"
                      >
                        Belum ada data.
                      </td>
                    </tr>
                  ) : (
                    section.rows?.map((row, ri) => (
                      <tr key={ri} className="align-top">
                        {row.map((cell, ci) => {
                          const col = normalizeColumn(section.columns?.[ci] ?? '');
                          return (
                            <td
                              key={ci}
                              className={`border border-black px-1.5 py-1 ${alignClass(col.align)}`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                  {section.totalRow && (
                    <tr className="bg-gray-50 font-extrabold">
                      {section.totalRow.map((cell, ci) => {
                        const col = normalizeColumn(section.columns?.[ci] ?? '');
                        return (
                          <td
                            key={ci}
                            className={`border border-black px-1.5 py-1 ${alignClass(col.align)}`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {spec.notes?.map((note, ni) => (
        <section key={ni} className="space-y-1">
          <h3 className="border-b border-black pb-1 text-[11px] font-extrabold uppercase text-black">
            {note.heading}
          </h3>
          {(Array.isArray(note.body) ? note.body : [note.body]).map((p, pi) => (
            <p key={pi} className="text-[10px] leading-relaxed text-black">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blok tanda tangan                                                  */
/* ------------------------------------------------------------------ */

function SignatureBlock({ settings }: { settings: SchoolSettings }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-black">
      <div>
        <p>Mengetahui,</p>
        <p className="font-bold">Kepala Sekolah</p>
        <div className="mt-12">
          <p className="font-bold underline">{settings.kepalaSekolah || '..........................'}</p>
          <p>NIP. {settings.nipKepala || '-'}</p>
        </div>
      </div>
      <div>
        <p>
          {settings.kotaSurat || '.....................'}, {signatureDate()}
        </p>
        <p className="font-bold">Guru Bimbingan &amp; Konseling</p>
        <div className="mt-12">
          <p className="font-bold underline">{settings.guruBK || '..........................'}</p>
          <p>NIP. {settings.nipGuruBK || '-'}</p>
        </div>
      </div>
    </div>
  );
}

function SpSignatureBlock({ settings }: { settings: SchoolSettings }) {
  return (
    <div className="mt-8 text-[10px] text-black">
      <p className="mb-4 leading-relaxed">
        Surat peringatan ini disampaikan kepada orang tua/wali. Kehadiran dan kerja sama Bapak/Ibu
        sangat diharapkan. Mohon menandatangani kolom penerimaan di bawah sebagai bukti surat telah
        diterima.
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold">Kepala Sekolah</p>
          <div className="mt-12">
            <p className="font-bold underline">
              {settings.kepalaSekolah || '..........................'}
            </p>
            <p>NIP. {settings.nipKepala || '-'}</p>
          </div>
        </div>
        <div>
          <p>
            {settings.kotaSurat || '.....................'}, {signatureDate()}
          </p>
          <p className="font-bold">Guru Bimbingan &amp; Konseling</p>
          <div className="mt-12">
            <p className="font-bold underline">{settings.guruBK || '..........................'}</p>
            <p>NIP. {settings.nipGuruBK || '-'}</p>
          </div>
        </div>
        <div>
          <p>Penerima,</p>
          <p className="font-bold">Orang Tua / Wali</p>
          <div className="mt-12">
            <p className="font-bold underline">..........................</p>
            <p>Nama jelas &amp; tanda tangan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ekspor Word (.doc) — dokumen asli, bukan tangkapan layar           */
/* ------------------------------------------------------------------ */

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const safeFileName = (name: string) =>
  name
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80);

function wordKop(settings: SchoolSettings): string {
  const instansi = escapeHtml(settings.instansiAtas || 'PEMERINTAH KOTA MAKASSAR');
  const sekolah = escapeHtml(settings.namaSekolah || 'SIM BK PRO');
  const alamat = escapeHtml(settings.alamat || '');
  const kontak = [
    settings.teleponSekolah ? `Telp. ${settings.teleponSekolah}` : '',
    settings.emailSekolah ? `Email: ${settings.emailSekolah}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  return `
  <div style="text-align:center;border-bottom:3px double #000;padding-bottom:4pt;margin-bottom:8pt;">
    <p style="margin:0;font-size:11pt;font-weight:bold;text-transform:uppercase;">${instansi}</p>
    <p style="margin:1pt 0;font-size:14pt;font-weight:bold;text-transform:uppercase;">${sekolah}</p>
    <p style="margin:0;font-size:9pt;">${alamat}</p>
    ${kontak ? `<p style="margin:0;font-size:9pt;">${escapeHtml(kontak)}</p>` : ''}
  </div>`;
}

function wordSection(section: DocSection): string {
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];

  const head = columns
    .map((c) => {
      const col = normalizeColumn(c);
      return `<th style="border:1px solid #000;padding:2pt 3pt;background:#e5e7eb;font-size:8pt;text-align:${col.align || 'center'};">${escapeHtml(col.label)}</th>`;
    })
    .join('');

  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, ci) => {
            const col = normalizeColumn(columns[ci] ?? '');
            return `<td style="border:1px solid #000;padding:2pt 3pt;font-size:8pt;vertical-align:top;text-align:${col.align || 'left'};">${escapeHtml(cell)}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');

  const totalRow = section.totalRow
    ? `<tr>${section.totalRow
        .map((cell, ci) => {
          const col = normalizeColumn(columns[ci] ?? '');
          return `<td style="border:1px solid #000;padding:2pt 3pt;font-size:8pt;font-weight:bold;background:#f3f4f6;text-align:${col.align || 'left'};">${escapeHtml(cell)}</td>`;
        })
        .join('')}</tr>`
    : '';

  const emptyRow =
    rows.length === 0
      ? `<tr><td colspan="${Math.max(1, columns.length)}" style="border:1px solid #000;padding:6pt;text-align:center;font-style:italic;">Belum ada data.</td></tr>`
      : '';

  const facts =
    section.facts && section.facts.length > 0
      ? `<table style="border-collapse:collapse;width:100%;margin-bottom:4pt;mso-table-lspace:0;mso-table-rspace:0;">
          ${section.facts
            .map(
              ([label, value]) =>
                `<tr><td style="border:1px solid #000;padding:2pt 3pt;font-size:9pt;width:30%;background:#f3f4f6;font-weight:bold;">${escapeHtml(label)}</td><td style="border:1px solid #000;padding:2pt 3pt;font-size:9pt;">${escapeHtml(value)}</td></tr>`,
            )
            .join('')}
        </table>`
      : '';

  const paragraphs = (section.paragraphs ?? [])
    .map((p) => `<p style="margin:0 0 3pt;font-size:9pt;">${escapeHtml(p)}</p>`)
    .join('');

  const table =
    columns.length > 0
      ? `<table style="border-collapse:collapse;width:100%;mso-table-lspace:0;mso-table-rspace:0;">
          <thead><tr>${head}</tr></thead>
          <tbody>${bodyRows}${totalRow}${emptyRow}</tbody>
        </table>`
      : '';

  return `
  <div style="margin-top:8pt;">
    ${section.heading ? `<p style="margin:0 0 3pt;font-size:10pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;">${escapeHtml(section.heading)}</p>` : ''}
    ${section.intro ? `<p style="margin:0 0 3pt;font-size:9pt;">${escapeHtml(section.intro)}</p>` : ''}
    ${facts}
    ${paragraphs}
    ${table}
  </div>`;
}

function wordSignature(settings: SchoolSettings): string {
  return `
  <table style="width:100%;border:none;margin-top:26pt;font-size:10pt;text-align:center;">
    <tr>
      <td style="border:none;width:50%;">
        <p style="margin:0;">Mengetahui,</p>
        <p style="margin:0;font-weight:bold;">Kepala Sekolah</p>
        <p style="margin:34pt 0 0;font-weight:bold;text-decoration:underline;">${escapeHtml(settings.kepalaSekolah || '..........................')}</p>
        <p style="margin:0;">NIP. ${escapeHtml(settings.nipKepala || '-')}</p>
      </td>
      <td style="border:none;width:50%;">
        <p style="margin:0;">${escapeHtml(settings.kotaSurat || '.....................')}, ${escapeHtml(signatureDate())}</p>
        <p style="margin:0;font-weight:bold;">Guru Bimbingan &amp; Konseling</p>
        <p style="margin:34pt 0 0;font-weight:bold;text-decoration:underline;">${escapeHtml(settings.guruBK || '..........................')}</p>
        <p style="margin:0;">NIP. ${escapeHtml(settings.nipGuruBK || '-')}</p>
      </td>
    </tr>
  </table>`;
}

function wordSignatureSp(settings: SchoolSettings): string {
  return `
  <p style="margin:14pt 0 6pt;font-size:9pt;">Surat peringatan ini disampaikan kepada orang tua/wali. Mohon menandatangani kolom penerimaan sebagai bukti surat telah diterima.</p>
  <table style="width:100%;border:none;margin-top:8pt;font-size:10pt;text-align:center;">
    <tr>
      <td style="border:none;width:33%;">
        <p style="margin:0;">Mengetahui,</p>
        <p style="margin:0;font-weight:bold;">Kepala Sekolah</p>
        <p style="margin:34pt 0 0;font-weight:bold;text-decoration:underline;">${escapeHtml(settings.kepalaSekolah || '..........................')}</p>
        <p style="margin:0;">NIP. ${escapeHtml(settings.nipKepala || '-')}</p>
      </td>
      <td style="border:none;width:33%;">
        <p style="margin:0;">${escapeHtml(settings.kotaSurat || '.....................')}, ${escapeHtml(signatureDate())}</p>
        <p style="margin:0;font-weight:bold;">Guru Bimbingan &amp; Konseling</p>
        <p style="margin:34pt 0 0;font-weight:bold;text-decoration:underline;">${escapeHtml(settings.guruBK || '..........................')}</p>
        <p style="margin:0;">NIP. ${escapeHtml(settings.nipGuruBK || '-')}</p>
      </td>
      <td style="border:none;width:33%;">
        <p style="margin:0;">Penerima,</p>
        <p style="margin:0;font-weight:bold;">Orang Tua / Wali</p>
        <p style="margin:34pt 0 0;font-weight:bold;text-decoration:underline;">..........................</p>
        <p style="margin:0;">Nama jelas &amp; tanda tangan</p>
      </td>
    </tr>
  </table>`;
}

export function buildWordHtml(spec: DocSpec, settings: SchoolSettings): string {
  const orientation = spec.landscape ? 'landscape' : 'portrait';
  const size = spec.landscape ? '29.7cm 21cm' : '21cm 29.7cm';
  const margin = spec.landscape ? '1.2cm 1.2cm 1.2cm 1.5cm' : '1.5cm 1.2cm 1.5cm 1.5cm';

  const meta = (spec.meta ?? [])
    .map((line) => `<p style="margin:0;font-size:9pt;">${escapeHtml(line)}</p>`)
    .join('');

  const notes = (spec.notes ?? [])
    .map(
      (note) => `
      <div style="margin-top:8pt;">
        <p style="margin:0 0 2pt;font-size:10pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;">${escapeHtml(note.heading)}</p>
        ${(Array.isArray(note.body) ? note.body : [note.body])
          .map((p) => `<p style="margin:0 0 2pt;font-size:9pt;">${escapeHtml(p)}</p>`)
          .join('')}
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(spec.title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  @page WordSection1 { size: ${size}; margin: ${margin}; mso-page-orientation: ${orientation}; }
  div.WordSection1 { page: WordSection1; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 10.5pt; color: #000; }
</style>
</head>
<body>
  <div class="WordSection1">
    ${spec.watermark ? `<p style="margin:0;text-align:center;font-size:16pt;font-weight:bold;color:#b91c1c;letter-spacing:4pt;">${escapeHtml(spec.watermark)}</p>` : ''}
    ${wordKop(settings)}
    <p style="margin:0;text-align:center;font-size:12pt;font-weight:bold;text-transform:uppercase;text-decoration:underline;">${escapeHtml(spec.title)}</p>
    ${spec.subtitle ? `<p style="margin:2pt 0 0;text-align:center;font-size:9pt;font-weight:bold;">${escapeHtml(spec.subtitle)}</p>` : ''}
    ${meta ? `<div style="text-align:center;margin-top:2pt;">${meta}</div>` : ''}
    ${spec.sections.map(wordSection).join('')}
    ${notes}
    ${spec.signature !== false
      ? spec.signatureMode === 'sp'
        ? wordSignatureSp(settings)
        : wordSignature(settings)
      : ''}
  </div>
</body>
</html>`;
}

export function downloadWordDoc(spec: DocSpec, settings: SchoolSettings) {
  const html = buildWordHtml(spec, settings);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(spec.title)}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tombol pemicu pratinjau untuk bar aksi halaman dokumen. */
export function PreviewButton({ onClick, label = 'Pratinjau' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[12px] border border-border bg-surface px-3 text-xs font-bold text-text shadow-sm transition-all active:scale-[0.98]"
    >
      <Printer size={14} /> {label}
    </button>
  );
}

/** Pembungkus agar pratinjau bisa diletakkan di halaman mana pun. */
export function DocPreviewHost({
  open,
  onClose,
  spec,
  settings,
}: DocPreviewProps): ReactNode {
  return <DocPreview open={open} onClose={onClose} spec={spec} settings={settings} />;
}
