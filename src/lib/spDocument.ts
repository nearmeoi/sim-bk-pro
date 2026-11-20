import type { DocSpec } from '../mobile/docPreview';
import type { SpLetter, Student, ViolationFeedItem } from '../types';
import { CATEGORY_LABELS, SP_TYPE_LABELS, formatDate, formatDateTime } from './discipline';

const SP_TITLE: Record<SpLetter['type'], string> = {
  sp1: 'SURAT PERINGATAN I',
  sp2: 'SURAT PERINGATAN II',
  sp3: 'SURAT PERINGATAN III',
  pleno: 'SURAT PERINGATAN TERAKHIR & UNDANGAN SIDANG PLENO',
};

const SP_INTRO: Record<SpLetter['type'], string> = {
  sp1: 'Peringatan pertama diberikan karena poin pelanggaran telah mencapai ambang pembinaan lanjutan.',
  sp2: 'Peringatan kedua diberikan karena poin pelanggaran telah mencapai ambang panggilan orang tua kedua.',
  sp3: 'Peringatan ketiga merupakan peringatan terakhir sebelum sidang pleno sesuai buku Tata Tertib sekolah.',
  pleno: 'Poin pelanggaran telah mencapai ambang sidang pleno. Sekolah mengundang orang tua/wali untuk mengikuti sidang pleno sesuai ketentuan.',
};

function totalRowFor(letter: SpLetter): Array<string | number> {
  return [
    '',
    '',
    'TOTAL POIN KUMULATIF',
    '',
    `${letter.totalPoints} / 1000`,
    `${letter.totalGuidebookPoints} / 100`,
  ];
}

export function buildSpDocSpec(
  letter: SpLetter,
  student: Student | null,
  history: ViolationFeedItem[],
): DocSpec {
  const isDraft = letter.status === 'draft';
  const isCancelled = letter.status === 'cancelled';
  const activeHistory = history
    .filter((row) => row.status !== 'void')
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const rows = activeHistory.slice(-15).map((row, index) => [
    index + 1,
    formatDate(row.occurredAt),
    row.ruleName,
    CATEGORY_LABELS[row.ruleCategory].replace('Pelanggaran ', ''),
    `+${row.rulePoints}`,
    `+${row.ruleGuidebookPoints}`,
  ]);

  const meeting = letter.meetingAt
    ? [
        formatDate(letter.meetingAt),
        new Date(letter.meetingAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        'Ruang Bimbingan dan Konseling',
      ]
    : ['Belum dijadwalkan', '-', 'Ruang Bimbingan dan Konseling'];

  return {
    title: SP_TITLE[letter.type],
    subtitle: letter.number ? `Nomor: ${letter.number}` : 'Nomor: belum ditetapkan',
    meta: [
      isDraft
        ? 'DRAFT — belum diterbitkan, tidak untuk diserahkan kepada orang tua/wali'
        : isCancelled
          ? 'DIBATALKAN — dokumen tidak berlaku'
          : `Diterbitkan: ${formatDate(letter.issuedAt || letter.createdAt)}`,
    ],
    watermark: isDraft ? 'DRAFT' : isCancelled ? 'DIBATALKAN' : undefined,
    signatureMode: 'sp',
    sections: [
      {
        intro: 'Dengan hormat,',
        paragraphs: [
          `Berdasarkan Buku Tata Tertib dan Sistem Poin Peserta Didik, bersama ini kami sampaikan bahwa ananda ${student?.nama || letter.nama} (Kelas ${student?.kelas || letter.kelas}) telah memperoleh poin pelanggaran kumulatif sebesar ${letter.totalPoints} poin dari skala 1000, atau setara ${letter.totalGuidebookPoints} poin pada skala buku panduan (100).`,
          `${SP_INTRO[letter.type]} Jenis surat: ${SP_TYPE_LABELS[letter.type]}.`,
        ],
      },
      {
        heading: 'Identitas Peserta Didik',
        facts: [
          ['Nama', student?.nama || letter.nama],
          ['NIS / NISN', `${student?.nis || '-'} / ${student?.nisn || '-'}`],
          ['Kelas', student?.kelas || letter.kelas],
          ['Wali / Orang Tua', student?.namaWali || '-'],
          ['Alamat', student?.alamat || '-'],
          ['Total Poin Kumulatif', `${letter.totalPoints} poin (skala 1000)`],
          ['Poin Buku Panduan', `${letter.totalGuidebookPoints} poin (skala 100)`],
          ['Ambang SP', `${letter.thresholdPoints} poin`],
        ],
      },
      {
        heading: 'Rincian Pelanggaran',
        intro:
          activeHistory.length > 15
            ? `Menampilkan 15 catatan terakhir dari ${activeHistory.length} catatan pelanggaran.`
            : 'Catatan pelanggaran yang menjadi dasar penerbitan surat ini.',
        columns: [
          { label: 'No', align: 'center', width: '7%' },
          { label: 'Tanggal', width: '17%' },
          { label: 'Pelanggaran', width: '38%' },
          { label: 'Kategori', align: 'center', width: '14%' },
          { label: 'Poin', align: 'right', width: '11%' },
          { label: 'Buku', align: 'right', width: '11%' },
        ],
        rows,
        totalRow: totalRowFor(letter),
      },
      {
        heading: 'Undangan Pertemuan',
        facts: [
          ['Hari / Tanggal', meeting[0]],
          ['Waktu', meeting[1]],
          ['Tempat', meeting[2]],
          ['Menghadap', 'Guru Bimbingan dan Konseling'],
          ['Keperluan', `Pembinaan dan penandatanganan ${SP_TYPE_LABELS[letter.type]}`],
        ],
      },
      {
        paragraphs: [
          'Demikian surat ini kami sampaikan. Kami mengharapkan kehadiran Bapak/Ibu tepat waktu untuk bersama-sama mendampingi dan membina ananda. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.',
          'Catatan: poin pelanggaran bersifat kumulatif dan tidak dihapus. Pembinaan yang berhasil akan dicatat sebagai capaian positif tersendiri.',
        ],
      },
    ],
  };
}

export function buildSpBeritaAcaraSpec(
  letter: SpLetter,
  student: Student | null,
  history: ViolationFeedItem[],
): DocSpec {
  const activeHistory = history.filter((row) => row.status !== 'void');
  return {
    title: 'BERITA ACARA PERTEMUAN ORANG TUA / WALI',
    subtitle: letter.number ? `Nomor: ${letter.number}` : undefined,
    meta: [`Terkait: ${SP_TYPE_LABELS[letter.type]}`],
    signatureMode: 'sp',
    sections: [
      {
        intro:
          'Pada hari ini telah dilaksanakan pertemuan antara pihak sekolah dengan orang tua/wali peserta didik dalam rangka pembinaan tata tertib.',
        facts: [
          ['Nama Peserta Didik', student?.nama || letter.nama],
          ['Kelas', student?.kelas || letter.kelas],
          ['NIS / NISN', `${student?.nis || '-'} / ${student?.nisn || '-'}`],
          ['Jenis Surat', SP_TYPE_LABELS[letter.type]],
          ['Total Poin', `${letter.totalPoints} poin (buku panduan ${letter.totalGuidebookPoints})`],
          [
            'Waktu Pertemuan',
            letter.meetingAt
              ? `${formatDateTime(letter.meetingAt)} WIB`
              : 'Belum dijadwalkan',
          ],
          ['Jumlah Pelanggaran Tercatat', `${activeHistory.length} catatan`],
        ],
      },
      {
        heading: 'Hasil Pertemuan',
        paragraphs: [
          '1. Penjelasan sekolah mengenai poin dan pelanggaran yang tercatat: ................................................................................................................',
          '2. Tanggapan orang tua/wali: ................................................................................................................',
          '3. Kesepakatan pembinaan: ................................................................................................................',
          '4. Rencana tindak lanjut dan evaluasi: ................................................................................................................',
        ],
      },
      {
        heading: 'Kesimpulan',
        paragraphs: [
          'Pertemuan berlangsung dengan suasana kekeluargaan. Orang tua/wali bersedia bekerja sama dengan sekolah dalam pembinaan peserta didik.',
        ],
      },
    ],
  };
}
