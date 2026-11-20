/**
 * Tautan WhatsApp manual untuk orang tua/wali.
 *
 * SIM-BK tidak mengirim pesan otomatis dan tidak memakai WhatsApp API.
 * Guru BK membuka tautan `wa.me`, memeriksa pesan, lalu menekan kirim
 * sendiri di aplikasi WhatsApp.
 */

export interface PointNoticeInput {
  schoolName?: string;
  guardianName?: string;
  studentName: string;
  className: string;
  statusLabel: string;
  totalPoints: number;
  balance: number;
  pointScale: number;
  suggestion?: string;
  lastViolation?: { name: string; occurredAt: string } | null;
}

export interface SpNoticeInput {
  schoolName?: string;
  guardianName?: string;
  studentName: string;
  className: string;
  spLabel: string;
  spNumber?: string | null;
  totalPoints: number;
  meetingAt?: string | null;
}

/**
 * Normalisasi nomor Indonesia ke format internasional tanpa tanda `+`.
 * `0812…`, `812…`, `+62 812…`, dan `62812…` menghasilkan `62812…`.
 */
export function normalizeWhatsAppNumber(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;

  if (!/^628\d{7,12}$/.test(digits)) return null;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized || !message.trim()) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message.trim())}`;
}

export function formatWhatsAppDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatWhatsAppDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day}, ${time}`;
}

function greeting(guardianName?: string): string {
  const name = guardianName?.trim();
  if (!name) return "Assalamu'alaikum Bapak/Ibu orang tua/wali,";
  if (/^(bapak|ibu|bpk|pak|bu|sdr|saudara|saudari)\b/i.test(name)) {
    return `Assalamu'alaikum ${name},`;
  }
  return `Assalamu'alaikum Bapak/Ibu ${name},`;
}

function schoolPart(schoolName?: string): string {
  const name = schoolName?.trim();
  return name ? `BK ${name}` : 'guru BK';
}

export function buildPointNoticeMessage(input: PointNoticeInput): string {
  const lines = [
    greeting(input.guardianName),
    '',
    `Kami dari ${schoolPart(input.schoolName)} menginformasikan bahwa ${input.studentName} (kelas ${input.className}) memiliki ${input.totalPoints} poin pelanggaran. Sisa poin saat ini ${input.balance} dari ${input.pointScale}.`,
    `Status pembinaan: ${input.statusLabel}.`,
  ];

  if (input.lastViolation) {
    const date = formatWhatsAppDate(input.lastViolation.occurredAt);
    lines.push(
      '',
      `Pelanggaran terakhir: ${input.lastViolation.name}${date ? ` (${date})` : ''}.`,
    );
  }

  if (input.suggestion?.trim()) {
    lines.push('', input.suggestion.trim());
  }

  lines.push(
    '',
    'Mohon Bapak/Ibu berkoordinasi dengan guru BK untuk pembinaan selanjutnya. Terima kasih.',
  );
  return lines.join('\n');
}

export function buildSpNoticeMessage(input: SpNoticeInput): string {
  const lines = [
    greeting(input.guardianName),
    '',
    `Kami dari ${schoolPart(input.schoolName)} mengundang Bapak/Ibu untuk membahas pembinaan ${input.studentName} (kelas ${input.className}).`,
    '',
    `Surat: ${input.spLabel}`,
  ];

  if (input.spNumber?.trim()) {
    lines.push(`Nomor: ${input.spNumber.trim()}`);
  }
  lines.push(`Total poin: ${input.totalPoints}`);

  const meeting = formatWhatsAppDateTime(input.meetingAt);
  lines.push(
    meeting
      ? `Pertemuan: ${meeting}`
      : 'Jadwal pertemuan akan diinformasikan lebih lanjut.',
  );

  lines.push('', 'Mohon kehadiran Bapak/Ibu sesuai jadwal. Terima kasih.');
  return lines.join('\n');
}
