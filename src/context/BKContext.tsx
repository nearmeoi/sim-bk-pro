import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
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

  // Authentication
  isAuthenticated: boolean;
  isBackendConnected: boolean;
  login: (nipOrEmail: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // School Settings
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  resetAllData: () => void;
}

const BKContext = createContext<BKContextType | null>(null);

const DEFAULT_AKPD_INIT: AKPDStatement[] = DEFAULT_AKPD_STATEMENTS.map((text, idx) => ({
  no: idx + 1,
  pernyataan: text,
  jumlahPemilih: SAMPLE_AKPD_TALLY[idx] || 15,
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
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('sim_bk_auth', true);
  const isBackendConnected = isSupabaseConfigured();

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setIsAuthenticated(true);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session));
      });
      return () => subscription.unsubscribe();
    }
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
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Gagal terhubung ke backend Supabase.' };
      }
    }

    // Mode offline / lokal: validasi sukses langsung
    setIsAuthenticated(true);
    return { success: true };
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
      id: `st-${Date.now()}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Counseling records methods
  const addCounselingRecord = (recordData: Omit<CounselingRecord, 'id'>): CounselingRecord => {
    const newRecord: CounselingRecord = {
      ...recordData,
      id: `cr-${Date.now()}`,
    };
    setRecords((prev) => [newRecord, ...prev]);

    // Also sync to daily journal automatically
    const newJurnal: JurnalRow = {
      id: `j-${Date.now()}`,
      hariTanggal: recordData.tanggal,
      waktu: recordData.waktu,
      nama: recordData.namaSiswa,
      kelas: recordData.kelas,
      jenis: recordData.jenis,
      topik: recordData.masalah,
      keterangan: recordData.status === 'Selesai' ? 'Selesai' : `${recordData.status} - ${recordData.tindakLanjut}`,
    };
    setJurnalRows((prev) => [newJurnal, ...prev]);

    // If unresolved or urgent case, update cases list
    if (recordData.status === 'Proses') {
      const newCase: CaseItem = {
        id: `c-${Date.now()}`,
        studentId: recordData.studentId,
        namaSiswa: recordData.namaSiswa,
        kelas: recordData.kelas,
        masalah: recordData.masalah,
        tanggal: recordData.tanggal,
        status: 'Proses',
      };
      setCases((prev) => [newCase, ...prev.filter((c) => c.studentId !== recordData.studentId)]);
    }

    return newRecord;
  };

  const updateCounselingRecord = (id: string, data: Partial<CounselingRecord>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const deleteCounselingRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Case methods
  const updateCaseStatus = (id: string, status: 'Proses' | 'Selesai') => {
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  // Integrated Quick Catat
  const addQuickCatat = (payload: QuickCatatPayload) => {
    // 1. Identify or match student
    const matched = students.find(
      (s) => s.nama.toLowerCase() === payload.namaSiswa.toLowerCase() && s.kelas === payload.kelas
    );
    const studentId = matched ? matched.id : `st-${Date.now()}`;

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
    }

    // 2. Map jenis layanan
    let jenisLayanan: CounselingRecord['jenis'] = 'Konseling Individual';
    if (payload.actionId === 'kunjungan') jenisLayanan = 'Kunjungan Rumah';
    else if (payload.actionId === 'kasus') jenisLayanan = 'Konferensi Kasus';
    else if (payload.actionId === 'jurnal') jenisLayanan = 'Bimbingan Klasikal';

    // 3. Create counseling record
    const newRecord: CounselingRecord = {
      id: `cr-${Date.now()}`,
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

    // 4. Create Jurnal Harian entry automatically
    const newJurnal: JurnalRow = {
      id: `j-${Date.now()}`,
      hariTanggal: payload.tanggal,
      waktu: payload.waktu,
      nama: payload.namaSiswa.trim(),
      kelas: payload.kelas,
      jenis: payload.actionLabel,
      topik: payload.uraianMasalah,
      keterangan: payload.tindakLanjut ? `${payload.status} (${payload.tindakLanjut})` : payload.status,
    };
    setJurnalRows((prev) => [newJurnal, ...prev]);

    // 5. If it's a case or status is 'Proses', add to active cases
    if (payload.actionId === 'kasus' || payload.status === 'Proses') {
      const newCase: CaseItem = {
        id: `c-${Date.now()}`,
        studentId,
        namaSiswa: payload.namaSiswa.trim(),
        kelas: payload.kelas,
        masalah: payload.uraianMasalah,
        tanggal: payload.tanggal,
        status: payload.status === 'Selesai' ? 'Selesai' : 'Proses',
      };
      setCases((prev) => [newCase, ...prev]);
    }
  };

  // AKPD methods
  const updateAKPDItem = (index: number, data: Partial<AKPDStatement>) => {
    setAkpdItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...data } : item)));
  };

  const incrementAKPDTally = (index: number, maxResponden: number) => {
    setAkpdItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, jumlahPemilih: Math.min(maxResponden, item.jumlahPemilih + 1) } : item
      )
    );
  };

  const applyQuickAKPDNumbers = (numbers: number[]): number => {
    if (!numbers || numbers.length === 0) return 0;
    setAkpdItems((prev) =>
      prev.map((item) => (numbers.includes(item.no) ? { ...item, jumlahPemilih: item.jumlahPemilih + 1 } : item))
    );
    return numbers.length;
  };

  const applyPasteAKPDTally = (numbers: number[]): number => {
    if (!numbers || numbers.length === 0) return 0;
    setAkpdItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        jumlahPemilih: numbers[idx] !== undefined ? Math.max(0, numbers[idx]) : item.jumlahPemilih,
      }))
    );
    return numbers.length;
  };

  const resetAKPD = () => {
    setAkpdItems(DEFAULT_AKPD_INIT);
  };

  // Bimbingan Karir methods
  const addKarirStudent = (newKarir: IndividualKarirAngket) => {
    setKarirList((prev) => [newKarir, ...prev]);
  };

  const updateKarirStudent = <K extends keyof IndividualKarirAngket>(
    id: string,
    field: K,
    val: IndividualKarirAngket[K]
  ) => {
    setKarirList((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)));
  };

  const deleteKarirStudent = (id: string) => {
    setKarirList((prev) => prev.filter((item) => item.id !== id));
  };

  // Prota methods
  const addProtaItem = (itemData: Omit<ProtaItem, 'id'>) => {
    const newItem: ProtaItem = { ...itemData, id: `p-${Date.now()}` };
    setProtaList((prev) => [...prev, newItem]);
  };

  const updateProtaItem = (id: string, itemData: Partial<ProtaItem>) => {
    setProtaList((prev) => prev.map((item) => (item.id === id ? { ...item, ...itemData } : item)));
  };

  const deleteProtaItem = (id: string) => {
    setProtaList((prev) => prev.filter((item) => item.id !== id));
  };

  // Jurnal methods
  const addJurnalRow = (rowData: Omit<JurnalRow, 'id'>) => {
    const newRow: JurnalRow = { ...rowData, id: `j-${Date.now()}` };
    setJurnalRows((prev) => [newRow, ...prev]);
  };

  const updateJurnalRow = (id: string, rowData: Partial<JurnalRow>) => {
    setJurnalRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...rowData } : row)));
  };

  const deleteJurnalRow = (id: string) => {
    setJurnalRows((prev) => prev.filter((row) => row.id !== id));
  };

  // Settings
  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
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
    setTotalRespondenAKPD(32);
    setKelasAKPD('KELAS 8');
    setKarirList(INITIAL_STUDENT_KARIR);
    setProtaList(INITIAL_PROTA);
    setJurnalRows(INITIAL_JURNAL_ROWS);
    setSettings(DEFAULT_SETTINGS);
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

        // Auth
        isAuthenticated,
        isBackendConnected,
        login,
        logout,

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
