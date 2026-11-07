/**
 * Cadangan data manual: Unduh JSON seluruh data + terima data kembali dari file.
 * shortcut: validasi per-item masih longgar (cek field wajib utama saja).
 */
import type {
  Student,
  CounselingRecord,
  CaseItem,
  SchoolSettings,
  ProtaItem,
  JurnalRow,
  AKPDStatement,
  IndividualKarirAngket,
} from '../types';

export interface BackupFile {
  app: 'SIM BK PRO';
  version: 1;
  createdAt: string;
  students: Student[];
  records: CounselingRecord[];
  cases: CaseItem[];
  jurnalRows: JurnalRow[];
  protaList: ProtaItem[];
  karirList: IndividualKarirAngket[];
  akpdItems: AKPDStatement[];
  totalRespondenAKPD: number;
  kelasAKPD: string;
  settings: SchoolSettings;
}

export const buildBackup = (state: Omit<BackupFile, 'app' | 'version' | 'createdAt'>): BackupFile => ({
  app: 'SIM BK PRO',
  version: 1,
  createdAt: new Date().toISOString(),
  ...state,
});

/** Validasi bentuk minimal; kembalikan objek bersih atau null kalau bukan cadangan aplikasi ini. */
export const parseBackup = (text: string): BackupFile | null => {
  try {
    const raw = JSON.parse(text) as Partial<BackupFile>;
    if (raw.app !== 'SIM BK PRO' || !Array.isArray(raw.students)) return null;

    const pick = <T>(arr: unknown, key: keyof T): T[] => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((x): x is T =>
        Boolean(x) && typeof x === 'object' && Boolean((x as T)[key])
      );
    };

    return {
      app: 'SIM BK PRO',
      version: 1,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      students: pick<Student>(raw.students, 'id'),
      records: pick<CounselingRecord>(raw.records, 'id'),
      cases: pick<CaseItem>(raw.cases, 'id'),
      jurnalRows: pick<JurnalRow>(raw.jurnalRows, 'id'),
      protaList: pick<ProtaItem>(raw.protaList, 'id'),
      karirList: pick<IndividualKarirAngket>(raw.karirList, 'id'),
      akpdItems: pick<AKPDStatement>(raw.akpdItems, 'no'),
      totalRespondenAKPD: Number(raw.totalRespondenAKPD) || 0,
      kelasAKPD: typeof raw.kelasAKPD === 'string' ? raw.kelasAKPD : 'KELAS 8',
      settings:
        raw.settings && typeof raw.settings === 'object' && 'namaSekolah' in raw.settings
          ? (raw.settings as SchoolSettings)
          : (null as unknown as SchoolSettings),
    };
  } catch {
    return null;
  }
};

/** Simpan cadangan sebagai file .json di unduhan peramban. */
export const downloadBackup = (data: BackupFile, namaSekolah = 'Data'): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const tgl = new Date().toISOString().slice(0, 10);
  const nama = namaSekolah.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'data';
  a.href = url;
  a.download = `sim-bk-backup-${nama}-${tgl}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
