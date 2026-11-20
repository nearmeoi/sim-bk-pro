import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, MessageCircle, Phone } from 'lucide-react';
import { buildWhatsAppUrl, normalizeWhatsAppNumber } from '../../lib/whatsapp';

interface WhatsAppComposerProps {
  defaultPhone: string;
  defaultMessage: string;
  studentName: string;
  guardianName?: string;
  onDone?: () => void;
  onToast?: (message: string) => void;
}

export default function WhatsAppComposer({
  defaultPhone,
  defaultMessage,
  studentName,
  guardianName,
  onDone,
  onToast,
}: WhatsAppComposerProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhone(defaultPhone);
    setMessage(defaultMessage);
    setCopied(false);
  }, [defaultPhone, defaultMessage]);

  const normalized = useMemo(() => normalizeWhatsAppNumber(phone), [phone]);
  const url = useMemo(() => buildWhatsAppUrl(phone, message), [phone, message]);
  const phoneInvalid = phone.trim().length > 0 && !normalized;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      onToast?.('Pesan disalin. Tempel di WhatsApp bila perlu.');
    } catch {
      onToast?.('Pesan tidak bisa disalin otomatis. Salin manual dari kotak pesan.');
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="rounded-[16px] border border-border bg-bg/40 p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#128C7E] text-white">
            <MessageCircle size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-extrabold text-text">Pesan untuk orang tua/wali</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {guardianName ? `${guardianName} · ` : ''}
              {studentName}
            </p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Nomor WhatsApp
        </span>
        <div className="relative">
          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx xxxx xxxx"
            className={`min-h-[44px] w-full rounded-[11px] border bg-white pl-9 pr-3 text-sm font-semibold text-text focus:outline-none ${
              phoneInvalid ? 'border-red-300 focus:border-red-500' : 'border-border focus:border-black'
            }`}
          />
        </div>
        <p
          className={`mt-1 text-[10.5px] ${
            phoneInvalid ? 'font-semibold text-red-700' : 'text-muted'
          }`}
        >
          {phone.trim().length === 0
            ? 'Nomor wali belum diisi. Isi nomor WhatsApp yang aktif sebelum membuka.'
            : phoneInvalid
              ? 'Nomor belum valid. Gunakan nomor WhatsApp aktif, misalnya 0812… atau 62812….'
              : `Akan dibuka sebagai +${normalized}`}
        </p>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-muted">
          Isi pesan
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={8}
          className="w-full resize-y rounded-[11px] border border-border bg-white p-3 text-[12px] leading-relaxed text-text focus:border-black focus:outline-none"
        />
        <span className="mt-1 block text-right text-[10px] text-muted">
          {message.trim().length} karakter
        </span>
      </label>

      <div className="flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[10.5px] leading-relaxed text-amber-900">
        <AlertTriangle size={14} className="mt-0.5 flex-none" />
        <p>
          WhatsApp akan terbuka dengan pesan ini. Pesan <b>belum terkirim</b>; periksa lalu tekan
          kirim di aplikasi WhatsApp. SIM-BK tidak menyimpan status pengiriman.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-[10px] border border-border bg-white px-3 text-[11px] font-bold text-text hover:bg-gray-50"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? 'Tersalin' : 'Salin pesan'}
        </button>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onToast?.('WhatsApp dibuka. Tekan kirim setelah memeriksa pesan.');
              onDone?.();
            }}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] bg-[#128C7E] px-4 text-xs font-extrabold text-white hover:bg-[#0f7368]"
          >
            <MessageCircle size={15} /> Buka WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] bg-[#128C7E] px-4 text-xs font-extrabold text-white opacity-40"
          >
            <MessageCircle size={15} /> Buka WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
