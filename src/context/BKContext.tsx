import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  studentService,
  counselingService,
  caseService,
  journalService,
  settingsService,
  protaService,
  careerService,
  akpdService,
} from '../services/supabaseService';
import { newId } from '../lib/id';
import { buildBackup, parseBackup, downloadBackup } from '../lib/backup';
import type {
  Student,
  CounselingRecord,
  CaseItem,
  SchoolSettings,
  ProtaItem,
  JurnalRow,
  AKPDStatement,
  IndividualKarirAngket,
  QuickCatatPayload,
} from '../types';
import {
  STUDENTS,
  INITIAL_COUNSELING_RECORDS,
  CASES,
  DEFAULT_SETTINGS,
  INITIAL_PROTA,
  INITIAL_JURNAL_ROWS,
  DEFAULT_AKPD_STATEMENTS,
  SAMPLE_AKPD_TALLY,
  INITIAL_STUDENT_KARIR,
  AKPD_RPL_TOPICS,
} from '../data/dummy';

// SATU KALI per perangkat: bersihkan data demo lama di peramban (versi data v2 = mulai kosong)
const DATA_VERSION_KEY = 'sim_bk_data_version';
try {
  if (typeof window !== 'undefined' && window.localStorage.getItem(DATA_VERSION_KEY) !== '2') {
    [
      'sim_bk_students', 'sim_bk_records', 'sim_bk_cases', 'sim_bk_akpd',
      'sim_bk_akpd_resp', 'sim_bk_akpd_kelas', 'sim_bk_karir',
      'sim_bk_prota', 'sim_bk_jurnal', 'sim_bk_settings',
    ].forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.setItem(DATA_VERSION_KEY, '2');
  }
} catch {
  /* peramban tanpa localStorage — abaikan */
}

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

interface BKContextType {
  // Students
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;

  // Counseling Records
  records: CounselingRecord[];
  addCounselingRecord: (record: Omit<CounselingRecord, 'id'>) => CounselingRecord;
  updateCounselingRecord: (id: string, data: Partial<CounselingRecord>) => void;
  deleteCounselingRecord: (id: string) => void;

  // Cases
  cases: CaseItem[];
  updateCaseStatus: (id: string, status: 'Proses' | 'Selesai') => void;

  // Integrated Quick Catat
  addQuickCatat: (payload: QuickCatatPayload) => void;

  // AKPD
  akpdItems: AKPDStatement[];
  updateAKPDItem: (index: number, data: Partial<AKPDStatement>) => void;
  incrementAKPDTally: (index: number, maxResponden: number) => void;
  applyQuickAKPDNumbers: (numbers: number[]) => number;
  applyPasteAKPDTally: (numbers: number[]) => number;
  resetAKPD: () => void;
  totalRespondenAKPD: number;
  setTotalRespondenAKPD: React.Dispatch<React.SetStateAction<number>>;
  kelasAKPD: string;
  setKelasAKPD: React.Dispatch<React.SetStateAction<string>>;

  // Bimbingan Karir
  karirList: IndividualKarirAngket[];
  addKarirStudent: (student: IndividualKarirAngket) => void;
  updateKarirStudent: <K extends keyof IndividualKarirAngket>(
    id: string,
    field: K,
    val: IndividualKarirAngket[K]
  ) => void;
  deleteKarirStudent: (id: string) => void;
  setKarirList: React.Dispatch<React.SetStateAction<IndividualKarirAngket[]>>;

  // Dokumen: Prota & Jurnal
  protaList: ProtaItem[];
  addProtaItem: (item: Omit<ProtaItem, 'id'>) => void;
  updateProtaItem: (id: string, item: Partial<ProtaItem>) => void;
  deleteProtaItem: (id: string) => void;

  jurnalRows: JurnalRow[];
  addJurnalRow: (row: Omit<JurnalRow, 'id'>) => void;
  updateJurnalRow: (id: string, row: Partial<JurnalRow>) => void;
  deleteJurnalRow: (id: string) => void;

  // Active document tab selector
  activeDocTab: string | null;
  setActiveDocTab: (docId: string | null) => void;

  // AKPD -> RPL bridge: store top 5 priorities as recommendation
  akpdRecommendations: Array<{ no: number; pernyataan: string; topikRPL: string; bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir' }>;
  setAkpdRecommendations: React.Dispatch<React.SetStateAction<Array<{ no: number; pernyataan: string; topikRPL: string; bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir' }>>>;

  // AKPD -> Prota bridge: pending auto-generated Prota targets
  akpdProtaTargets: ProtaItem[];
  setAkpdProtaTargets: React.Dispatch<React.SetStateAction<ProtaItem[]>>;

  // Authentication
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  isBooting: boolean;
  login: (nipOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPasswordEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Cloud Sync
  isSyncing: boolean;
  lastSynced: Date | null;
  syncFailed: boolean;
  retrySyncNow: () => Promise<boolean>;
  syncAllFromCloud: () => Promise<boolean>;

  // Cadangan manual (unduh & kembalikan file JSON)
  downloadDataBackup: () => void;
  restoreDataBackup: (file: File) => Promise<{ success: boolean; error?: string }>;
  syncAllToCloud: () => Promise<boolean>;

  // School Settings
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  resetAllData: () => void;
}

const BKContext = createContext<BKContextType | null>(null);

const DEFAULT_AKPD_INIT: AKPDStatement[] = DEFAULT_AKPD_STATEMENTS.map((text, idx) => ({
  no: idx + 1,
  pernyataan: text,
  jumlahPemilih: SAMPLE_AKPD_TALLY[idx] || 0,
  jawaban: null,
  bidang: idx < 15 ? 'Pribadi' : idx < 30 ? 'Sosial' : idx < 45 ? 'Belajar' : 'Karir',
  topikRPL: AKPD_RPL_TOPICS[idx],
}));

function normalizeAkpdItems(items: AKPDStatement[]): AKPDStatement[] {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_AKPD_INIT;
  return items.map((it, idx) => ({
    ...it,
    bidang: it.bidang ?? (idx < 15 ? 'Pribadi' : idx < 30 ? 'Sosial' : idx < 45 ? 'Belajar' : 'Karir'),
    topikRPL: it.topikRPL ?? AKPD_RPL_TOPICS[idx] ?? '',
  }));
}

export const BKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useLocalStorage<Student[]>('sim_bk_students', STUDENTS);
  const [records, setRecords] = useLocalStorage<CounselingRecord[]>('sim_bk_records', INITIAL_COUNSELING_RECORDS);
  const [cases, setCases] = useLocalStorage<CaseItem[]>('sim_bk_cases', CASES);
  const [akpdItems, setAkpdItems] = useLocalStorage<AKPDStatement[]>('sim_bk_akpd', DEFAULT_AKPD_INIT);
  // Migrate old stored items missing bidang/topikRPL
  useEffect(() => {
    const needsFix = akpdItems.some((it) => !it.bidang || !it.topikRPL);
    if (needsFix) setAkpdItems(normalizeAkpdItems(akpdItems));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [totalRespondenAKPD, setTotalRespondenAKPD] = useLocalStorage<number>('sim_bk_akpd_resp', 32);
  const [kelasAKPD, setKelasAKPD] = useLocalStorage<string>('sim_bk_akpd_kelas', 'KELAS 8');
  const [karirList, setKarirList] = useLocalStorage<IndividualKarirAngket[]>('sim_bk_karir', INITIAL_STUDENT_KARIR);
  const [protaList, setProtaList] = useLocalStorage<ProtaItem[]>('sim_bk_prota', INITIAL_PROTA);
  const [jurnalRows, setJurnalRows] = useLocalStorage<JurnalRow[]>('sim_bk_jurnal', INITIAL_JURNAL_ROWS);
  const [settings, setSettings] = useLocalStorage<SchoolSettings>('sim_bk_settings', DEFAULT_SETTINGS);
  const [activeDocTab, setActiveDocTab] = useState<string | null>(null);
  const [akpdRecommendations, setAkpdRecommendations] = useState<Array<{ no: number; pernyataan: string; topikRPL: string; bidang: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karir' }>>([]);
  const [akpdProtaTargets, setAkpdProtaTargets] = useState<ProtaItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('sim_bk_auth', false);
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  // Tanda ada penulisan yang gagal terkirim ke cloud (jaringan putus)
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const retryTimer = useRef<number | undefined>(undefined);
  const isBackendConnected = isSupabaseConfigured();

  // Gagal menulis ke cloud → tandai, banner muncul, lalu coba ulang otomatis
  const trackSyncFail = () => {
    setSyncFailed(true);
    window.clearTimeout(retryTimer.current);
    retryTimer.current = window.setTimeout(async () => {
      if (await syncAllToCloud()) setSyncFailed(false);
      else trackSyncFail();
    }, 20000);
  };

  const retrySyncNow = async () => {
    window.clearTimeout(retryTimer.current);
    const ok = await syncAllToCloud();
    if (ok) setSyncFailed(false);
    else trackSyncFail();
    return ok;
  };

  // Cadangan manual: unduh seluruh data saat ini sebagai file JSON
  const downloadDataBackup = () => {
    downloadBackup(
      buildBackup({
        students,
        records,
        cases,
        jurnalRows,
        protaList,
        karirList,
        akpdItems,
        totalRespondenAKPD,
        kelasAKPD,
        settings,
      }),
      settings?.namaSekolah || 'Data'
    );
  };

  // Kembalikan data dari file cadangan, lalu kirim ke cloud
  const restoreDataBackup = async (file: File): Promise<{ success: boolean; error?: string }> => {
    const parsed = parseBackup(await file.text());
    if (!parsed) {
      return { success: false, error: 'File ini bukan cadangan SIM BK PRO atau rusak isinya.' };
    }
    if (parsed.students.length > 0) setStudents(parsed.students);
    if (parsed.records.length > 0) setRecords(parsed.records);
    if (parsed.cases.length > 0) setCases(parsed.cases);
    if (parsed.jurnalRows.length > 0) setJurnalRows(parsed.jurnalRows);
    if (parsed.protaList.length > 0) setProtaList(parsed.protaList);
    if (parsed.karirList.length > 0) setKarirList(parsed.karirList);
    if (parsed.settings) setSettings(parsed.settings);
    if (parsed.akpdItems.length > 0) {
      setAkpdItems(parsed.akpdItems);
      setTotalRespondenAKPD(parsed.totalRespondenAKPD || 32);
      setKelasAKPD(parsed.kelasAKPD);
    }
    // Kirim ke cloud agar perangkat lain ikut dapat data yang dipulihkan
    const sent = await syncAllToCloud();
    return { success: true, error: sent ? undefined : 'Data diteraapkan lokal, namun belum terkirim ke cloud.' };
  };

  // Cloud Synchronization Methods
  const syncAllFromCloud = async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    setIsSyncing(true);
    try {
      const [
        remoteStudents,
        remoteRecords,
        remoteCases,
        remoteJournals,
        remoteSettings,
        remoteProta,
        remoteCareer,
        remoteAKPD,
      ] = await Promise.all([
        studentService.getAll(),
        counselingService.getAll(),
        caseService.getAll(),
        journalService.getAll(),
        settingsService.get(),
        protaService.getAll(),
        careerService.getAll(),
        akpdService.getAll(kelasAKPD),
      ]);

      if (remoteStudents && remoteStudents.length > 0) setStudents(remoteStudents);
      if (remoteRecords && remoteRecords.length > 0) setRecords(remoteRecords);
      if (remoteCases && remoteCases.length > 0) setCases(remoteCases);
      if (remoteJournals && remoteJournals.length > 0) setJurnalRows(remoteJournals);
      if (remoteSettings) setSettings(remoteSettings);
      if (remoteProta && remoteProta.length > 0) setProtaList(remoteProta);
      if (remoteCareer && remoteCareer.length > 0) setKarirList(remoteCareer);
      if (remoteAKPD && remoteAKPD.items.length > 0) {
        setAkpdItems(remoteAKPD.items);
        setTotalRespondenAKPD(remoteAKPD.totalResponden);
      }

      setLastSynced(new Date());
      setIsSyncing(false);
      return true;
    } catch (err) {
      console.warn('Gagal sinkronisasi data dari Supabase:', err);
      setIsSyncing(false);
      return false;
    }
  };

  const syncAllToCloud = async (): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    setIsSyncing(true);
    try {
      await Promise.all([
        studentService.saveAll(students),
        counselingService.saveAll(records),
        caseService.saveAll(cases),
        journalService.saveAll(jurnalRows),
        settingsService.save(settings),
        protaService.saveAll(protaList),
        careerService.saveAll(karirList),
        akpdService.saveTallies(akpdItems, totalRespondenAKPD, kelasAKPD),
      ]);
      setLastSynced(new Date());
      setIsSyncing(false);
      return true;
    } catch (err) {
      console.error('Gagal upload seluruh data ke Supabase:', err);
      setIsSyncing(false);
      return false;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      // Mode lokal: selesaikan boot setelah satu paint agar skeleton sempat terlihat.
      const t = setTimeout(() => setIsBooting(false), 350);
      return () => clearTimeout(t);
    }
    // Fallback aperture: selesaikan boot bila sync menggantung (jaringan lambat).
    const guard = setTimeout(() => setIsBooting(false), 4000);
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Tanpa sesi = dianggap keluar: flag lama di localStorage tidak boleh membobol gerbang
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      syncAllFromCloud().finally(() => {
        clearTimeout(guard);
        setIsBooting(false);
      });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (session) {
        syncAllFromCloud();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sinkron ulang saat ibu kembali membuka tab/app (pengganti realtime)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!isSupabaseConfigured() || !supabase) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) syncAllFromCloud();
      });
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const login = async (nipOrEmail: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const email = nipOrEmail.includes('@')
          ? nipOrEmail.trim()
          : `${nipOrEmail.replace(/\s+/g, '')}@sim-bk.local`;
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          return { success: false, error: error.message };
        }
        setIsAuthenticated(true);
        syncAllFromCloud();
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal terhubung ke backend Supabase.';
        return { success: false, error: message };
      }
    }

    // Mode dev tanpa backend: boleh masuk langsung untuk pengembangan.
    // Produksi WAJIB lewat Supabase Auth — tanpa ini siapa pun bisa akses data siswa.
    if (import.meta.env.DEV) {
      setIsAuthenticated(true);
      return { success: true };
    }
    return {
      success: false,
      error: 'Server belum terhubung. Periksa koneksi internet, lalu coba lagi.',
    };
  };

  // Login via Google: alihkan ke OAuth Supabase, sesi ditangani onAuthStateChange
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Login Google membutuhkan backend Supabase yang terhubung.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memulai login Google.';
      return { success: false, error: message };
    }
  };

  // Kirim email reset sandi via Supabase Auth
  const resetPasswordEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Reset sandi membutuhkan backend Supabase yang terhubung.' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirim email reset.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Gagal keluar dari Supabase:', e);
      }
    }
    setIsAuthenticated(false);
  };

  // Student methods
  const addStudent = (studentData: Omit<Student, 'id'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: newId("st"),
    };
    setStudents((prev) => [newStudent, ...prev]);
    studentService.insert(newStudent).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    studentService.update(id, data).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    studentService.delete(id).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Counseling records methods
  const addCounselingRecord = (recordData: Omit<CounselingRecord, 'id'>): CounselingRecord => {
    const newRecord: CounselingRecord = {
      ...recordData,
      id: newId("cr"),
    };
    setRecords((prev) => [newRecord, ...prev]);
    counselingService.insert(newRecord).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());

    // Also sync to daily journal automatically
    const newJurnal: JurnalRow = {
      id: newId("j"),
      hariTanggal: recordData.tanggal,
      waktu: recordData.waktu,
      nama: recordData.namaSiswa,
      kelas: recordData.kelas,
      jenis: recordData.jenis,
      topik: recordData.masalah,
      keterangan: recordData.status === 'Selesai' ? 'Selesai' : `${recordData.status} - ${recordData.tindakLanjut}`,
    };
    setJurnalRows((prev) => [newJurnal, ...prev]);
    journalService.insert(newJurnal).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());

    // If unresolved or urgent case, update cases list
    if (recordData.status === 'Proses') {
      const newCase: CaseItem = {
        id: newId("c"),
        studentId: recordData.studentId,
        namaSiswa: recordData.namaSiswa,
        kelas: recordData.kelas,
        masalah: recordData.masalah,
        tanggal: recordData.tanggal,
        status: 'Proses',
      };
      setCases((prev) => [newCase, ...prev.filter((c) => c.studentId !== recordData.studentId)]);
      caseService.insert(newCase).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
    }

    return newRecord;
  };

  const updateCounselingRecord = (id: string, data: Partial<CounselingRecord>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    counselingService.update(id, data).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const deleteCounselingRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    counselingService.delete(id).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Case methods
  const updateCaseStatus = (id: string, status: 'Proses' | 'Selesai') => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    caseService.updateStatus(id, status).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Integrated Quick Catat
  const addQuickCatat = (payload: QuickCatatPayload) => {
    // 1. Identify or match student
    const matched = students.find(
      (s) => s.nama.toLowerCase() === payload.namaSiswa.toLowerCase() && s.kelas === payload.kelas
    );
    const studentId = matched ? matched.id : newId("st");

    // If student is not registered, automatically register to student directory
    if (!matched) {
      const autoStudent: Student = {
        id: studentId,
        nama: payload.namaSiswa.trim(),
        nis: String(Math.floor(2000 + Math.random() * 8000)),
        nisn: '-',
        jk: 'L',
        kelas: payload.kelas,
        status: 'Aktif',
        catatanKhusus: `Dicatat melalui Aksi Cepat: ${payload.actionLabel}`,
      };
      setStudents((prev) => [autoStudent, ...prev]);
      studentService.insert(autoStudent).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
    }

    // 2. Map jenis layanan
    let jenisLayanan: CounselingRecord['jenis'] = 'Konseling Individual';
    if (payload.actionId === 'kunjungan') jenisLayanan = 'Kunjungan Rumah';
    else if (payload.actionId === 'kasus') jenisLayanan = 'Konferensi Kasus';
    else if (payload.actionId === 'jurnal') jenisLayanan = 'Bimbingan Klasikal';

    // 3. Create counseling record
    const newRecord: CounselingRecord = {
      id: newId("cr"),
      studentId,
      namaSiswa: payload.namaSiswa.trim(),
      kelas: payload.kelas,
      tanggal: payload.tanggal,
      waktu: payload.waktu,
      jenis: jenisLayanan,
      bidang: 'Pribadi',
      masalah: payload.uraianMasalah,
      tindakLanjut: payload.tindakLanjut,
      status: payload.status,
      tahap: 'Catatan Cepat',
    };
    setRecords((prev) => [newRecord, ...prev]);
    counselingService.insert(newRecord).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());

    // 4. Create Jurnal Harian entry automatically
    const newJurnal: JurnalRow = {
      id: newId("j"),
      hariTanggal: payload.tanggal,
      waktu: payload.waktu,
      nama: payload.namaSiswa.trim(),
      kelas: payload.kelas,
      jenis: payload.actionLabel,
      topik: payload.uraianMasalah,
      keterangan: payload.tindakLanjut ? `${payload.status} (${payload.tindakLanjut})` : payload.status,
    };
    setJurnalRows((prev) => [newJurnal, ...prev]);
    journalService.insert(newJurnal).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());

    // 5. If it's a case or status is 'Proses', add to active cases
    if (payload.actionId === 'kasus' || payload.status === 'Proses') {
      const newCase: CaseItem = {
        id: newId("c"),
        studentId,
        namaSiswa: payload.namaSiswa.trim(),
        kelas: payload.kelas,
        masalah: payload.uraianMasalah,
        tanggal: payload.tanggal,
        status: payload.status === 'Selesai' ? 'Selesai' : 'Proses',
      };
      setCases((prev) => [newCase, ...prev]);
      caseService.insert(newCase).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
    }
  };

  // AKPD methods
  const updateAKPDItem = (index: number, data: Partial<AKPDStatement>) => {
    setAkpdItems((prev) => {
      const updated = prev.map((item, idx) => (idx === index ? { ...item, ...data } : item));
      akpdService.saveTallies(updated, totalRespondenAKPD, kelasAKPD).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
  };

  const incrementAKPDTally = (index: number, maxResponden: number) => {
    setAkpdItems((prev) => {
      const updated = prev.map((item, idx) =>
        idx === index ? { ...item, jumlahPemilih: Math.min(maxResponden, item.jumlahPemilih + 1) } : item
      );
      akpdService.saveTallies(updated, maxResponden, kelasAKPD).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
  };

  const applyQuickAKPDNumbers = (numbers: number[]): number => {
    if (!numbers || numbers.length === 0) return 0;
    setAkpdItems((prev) => {
      const updated = prev.map((item) =>
        numbers.includes(item.no) ? { ...item, jumlahPemilih: item.jumlahPemilih + 1 } : item
      );
      akpdService.saveTallies(updated, totalRespondenAKPD, kelasAKPD).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
    return numbers.length;
  };

  const applyPasteAKPDTally = (numbers: number[]): number => {
    if (!numbers || numbers.length === 0) return 0;
    setAkpdItems((prev) => {
      const updated = prev.map((item, idx) => ({
        ...item,
        jumlahPemilih: numbers[idx] !== undefined ? Math.max(0, numbers[idx]) : item.jumlahPemilih,
      }));
      akpdService.saveTallies(updated, totalRespondenAKPD, kelasAKPD).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
    return numbers.length;
  };

  const resetAKPD = () => {
    setAkpdItems(DEFAULT_AKPD_INIT);
    akpdService.saveTallies(DEFAULT_AKPD_INIT, totalRespondenAKPD, kelasAKPD).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Bimbingan Karir methods
  const addKarirStudent = (newKarir: IndividualKarirAngket) => {
    setKarirList((prev) => [newKarir, ...prev]);
    careerService.upsert(newKarir).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const updateKarirStudent = <K extends keyof IndividualKarirAngket>(
    id: string,
    field: K,
    val: IndividualKarirAngket[K]
  ) => {
    setKarirList((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, [field]: val } : item));
      const target = updated.find((item) => item.id === id);
      if (target) careerService.upsert(target).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
  };

  const deleteKarirStudent = (id: string) => {
    setKarirList((prev) => prev.filter((item) => item.id !== id));
    careerService.delete(id).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Prota methods
  const addProtaItem = (itemData: Omit<ProtaItem, 'id'>) => {
    const newItem: ProtaItem = { ...itemData, id: newId("p") };
    setProtaList((prev) => {
      const updated = [...prev, newItem];
      protaService.insert(newItem, updated.length).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
      return updated;
    });
  };

  const updateProtaItem = (id: string, itemData: Partial<ProtaItem>) => {
    setProtaList((prev) => prev.map((item) => (item.id === id ? { ...item, ...itemData } : item)));
    protaService.update(id, itemData).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const deleteProtaItem = (id: string) => {
    setProtaList((prev) => prev.filter((item) => item.id !== id));
    protaService.delete(id).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Jurnal methods
  const addJurnalRow = (rowData: Omit<JurnalRow, 'id'>) => {
    const newRow: JurnalRow = { ...rowData, id: newId("j") };
    setJurnalRows((prev) => [newRow, ...prev]);
    journalService.insert(newRow).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const updateJurnalRow = (id: string, rowData: Partial<JurnalRow>) => {
    setJurnalRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...rowData } : row)));
    journalService.update(id, rowData).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const deleteJurnalRow = (id: string) => {
    setJurnalRows((prev) => prev.filter((row) => row.id !== id));
    journalService.delete(id).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  // Settings
  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    settingsService.save(updated).then((ok) => { if (ok === false) trackSyncFail(); }).catch(() => trackSyncFail());
  };

  const resetAllData = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('sim_bk_students');
      window.localStorage.removeItem('sim_bk_records');
      window.localStorage.removeItem('sim_bk_cases');
      window.localStorage.removeItem('sim_bk_akpd');
      window.localStorage.removeItem('sim_bk_akpd_resp');
      window.localStorage.removeItem('sim_bk_akpd_kelas');
      window.localStorage.removeItem('sim_bk_karir');
      window.localStorage.removeItem('sim_bk_prota');
      window.localStorage.removeItem('sim_bk_jurnal');
      window.localStorage.removeItem('sim_bk_settings');
    }
    setStudents(STUDENTS);
    setRecords(INITIAL_COUNSELING_RECORDS);
    setCases(CASES);
    setAkpdItems(DEFAULT_AKPD_INIT);
    setTotalRespondenAKPD(0);
    setKelasAKPD('KELAS 8');
    setKarirList(INITIAL_STUDENT_KARIR);
    setProtaList(INITIAL_PROTA);
    setJurnalRows(INITIAL_JURNAL_ROWS);
    setSettings(DEFAULT_SETTINGS);
    // Jika terhubung ke cloud, unggah data demo ke Supabase setelah reset
    if (isSupabaseConfigured() && supabase) {
      setTimeout(() => {
        Promise.all([
          studentService.saveAll(STUDENTS),
          counselingService.saveAll(INITIAL_COUNSELING_RECORDS),
          caseService.saveAll(CASES),
          journalService.saveAll(INITIAL_JURNAL_ROWS),
          settingsService.save(DEFAULT_SETTINGS),
          protaService.saveAll(INITIAL_PROTA),
          careerService.saveAll(INITIAL_STUDENT_KARIR),
        ]).catch(() => trackSyncFail());
      }, 100);
    }
  };

  return (
    <BKContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        setStudents,

        records,
        addCounselingRecord,
        updateCounselingRecord,
        deleteCounselingRecord,

        cases,
        updateCaseStatus,

        addQuickCatat,

        akpdItems,
        updateAKPDItem,
        incrementAKPDTally,
        applyQuickAKPDNumbers,
        applyPasteAKPDTally,
        resetAKPD,
        totalRespondenAKPD,
        setTotalRespondenAKPD,
        kelasAKPD,
        setKelasAKPD,

        karirList,
        addKarirStudent,
        updateKarirStudent,
        deleteKarirStudent,
        setKarirList,

        protaList,
        addProtaItem,
        updateProtaItem,
        deleteProtaItem,

        jurnalRows,
        addJurnalRow,
        updateJurnalRow,
        deleteJurnalRow,

        // Active document tab
        activeDocTab,
        setActiveDocTab,

        // AKPD -> RPL recommendations
        akpdRecommendations,
        setAkpdRecommendations,

        // AKPD -> Prota bridge
        akpdProtaTargets,
        setAkpdProtaTargets,

        // Auth
        isAuthenticated,
        isBackendConnected,
        isBooting,
        login,
        loginWithGoogle,
        resetPasswordEmail,
        logout,

        // Cloud Sync
        isSyncing,
        lastSynced,
        syncFailed,
        retrySyncNow,
        syncAllFromCloud,
        syncAllToCloud,

        // Cadangan manual
        downloadDataBackup,
        restoreDataBackup,

        // Settings
        settings,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </BKContext.Provider>
  );
};

export function useBK() {
  const context = useContext(BKContext);
  if (!context) {
    throw new Error('useBK must be used within a BKProvider');
  }
  return context;
}



