import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useBK } from './BKContext';
import { disciplineService } from '../services/disciplineService';
import type {
  ClassPointSummary,
  LeaderboardEntry,
  RecordViolationPayload,
  SchoolMembership,
  SpLetter,
  SpType,
  StudentCard,
  StudentPointSummary,
  ViolationFeedItem,
  ViolationRule,
} from '../types';

interface DisciplineContextType {
  available: boolean;
  loading: boolean;
  error: string | null;
  membership: SchoolMembership | null;
  pointScale: number;
  spThresholds: number[];
  rules: ViolationRule[];
  points: StudentPointSummary[];
  feed: ViolationFeedItem[];
  spLetters: SpLetter[];
  leaderboard: LeaderboardEntry[];
  classPoints: ClassPointSummary[];
  cards: StudentCard[];
  pointsByStudent: Record<string, StudentPointSummary>;
  ruleById: Record<string, ViolationRule>;
  refresh: () => Promise<void>;
  recordViolation: (payload: RecordViolationPayload) => Promise<{ recordId: string; spDraft: SpLetter | null }>;
  voidViolation: (recordId: string, reason: string) => Promise<void>;
  createManualSp: (studentId: string, type: SpType, reason: string) => Promise<string>;
  issueSp: (id: string, number: string, meetingAt: string | null) => Promise<void>;
  cancelSp: (id: string, reason: string) => Promise<void>;
  setSpMeeting: (id: string, meetingAt: string) => Promise<void>;
  updateRule: (
    id: string,
    patch: Partial<
      Pick<
        ViolationRule,
        'name' | 'description' | 'points' | 'guidebookPoints' | 'defaultSanction' | 'isActive'
      >
    >
  ) => Promise<void>;
  createRule: (input: {
    code: string;
    category: ViolationRule['category'];
    name: string;
    points: number;
    guidebookPoints: number;
    defaultSanction?: string;
  }) => Promise<void>;
  createStudentCard: (studentId: string) => Promise<{ token: string; pin: string; cardId: string }>;
  revokeStudentCard: (cardId: string, reason: string) => Promise<void>;
}

const DisciplineContext = createContext<DisciplineContextType | null>(null);

export const DisciplineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isBooting } = useBK();
  const available = disciplineService.isAvailable();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membership, setMembership] = useState<SchoolMembership | null>(null);
  const [pointScale, setPointScale] = useState(1000);
  const [spThresholds, setSpThresholds] = useState<number[]>([260, 510, 760, 1000]);
  const [rules, setRules] = useState<ViolationRule[]>([]);
  const [points, setPoints] = useState<StudentPointSummary[]>([]);
  const [feed, setFeed] = useState<ViolationFeedItem[]>([]);
  const [spLetters, setSpLetters] = useState<SpLetter[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classPoints, setClassPoints] = useState<ClassPointSummary[]>([]);
  const [cards, setCards] = useState<StudentCard[]>([]);

  const refresh = useCallback(async () => {
    if (!available || !isAuthenticated) {
      setMembership(null);
      setPointScale(1000);
      setSpThresholds([260, 510, 760, 1000]);
      setRules([]);
      setPoints([]);
      setFeed([]);
      setSpLetters([]);
      setLeaderboard([]);
      setClassPoints([]);
      setCards([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextMembership = await disciplineService.getMembership();
      const nextSchoolConfig = await disciplineService.getSchoolConfig(nextMembership?.schoolId);
      const [
        nextRules,
        nextPoints,
        nextFeed,
        nextLetters,
        nextLeaderboard,
        nextClasses,
        nextCards,
      ] = await Promise.all([
        disciplineService.getRules(),
        disciplineService.getStudentPoints(),
        disciplineService.getFeed(),
        disciplineService.getSpLetters(),
        disciplineService.getLeaderboard(),
        disciplineService.getClassPoints(),
        disciplineService.getStudentCards(),
      ]);
      setMembership(nextMembership);
      if (nextSchoolConfig) {
        setPointScale(nextSchoolConfig.pointScale);
        setSpThresholds(nextSchoolConfig.spThresholds);
      }
      setRules(nextRules);
      setPoints(nextPoints);
      setFeed(nextFeed);
      setSpLetters(nextLetters);
      setLeaderboard(nextLeaderboard);
      setClassPoints(nextClasses);
      setCards(nextCards);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat data tata tertib.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [available, isAuthenticated]);

  useEffect(() => {
    if (isBooting) return;
    void refresh();
  }, [isBooting, refresh]);

  const recordViolation = useCallback(
    async (payload: RecordViolationPayload) => {
      const result = await disciplineService.recordViolation(payload);
      await refresh();
      return result;
    },
    [refresh]
  );

  const voidViolation = useCallback(
    async (recordId: string, reason: string) => {
      await disciplineService.voidViolation(recordId, reason);
      await refresh();
    },
    [refresh]
  );

  const createManualSp = useCallback(
    async (studentId: string, type: SpType, reason: string) => {
      const id = await disciplineService.createManualSp(studentId, type, reason);
      await refresh();
      return id;
    },
    [refresh]
  );

  const issueSp = useCallback(
    async (id: string, number: string, meetingAt: string | null) => {
      await disciplineService.issueSp(id, number, meetingAt);
      await refresh();
    },
    [refresh]
  );

  const cancelSp = useCallback(
    async (id: string, reason: string) => {
      await disciplineService.cancelSp(id, reason);
      await refresh();
    },
    [refresh]
  );

  const setSpMeeting = useCallback(
    async (id: string, meetingAt: string) => {
      await disciplineService.setSpMeeting(id, meetingAt);
      await refresh();
    },
    [refresh]
  );

  const updateRule = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<
          ViolationRule,
          'name' | 'description' | 'points' | 'guidebookPoints' | 'defaultSanction' | 'isActive'
        >
      >
    ) => {
      await disciplineService.updateRule(id, patch);
      await refresh();
    },
    [refresh]
  );

  const createRule = useCallback(
    async (input: {
      code: string;
      category: ViolationRule['category'];
      name: string;
      points: number;
      guidebookPoints: number;
      defaultSanction?: string;
    }) => {
      await disciplineService.createRule(input);
      await refresh();
    },
    [refresh]
  );

  const createStudentCard = useCallback(
    async (studentId: string) => {
      const card = await disciplineService.createStudentCard(studentId);
      await refresh();
      return card;
    },
    [refresh]
  );

  const revokeStudentCard = useCallback(
    async (cardId: string, reason: string) => {
      await disciplineService.revokeStudentCard(cardId, reason);
      await refresh();
    },
    [refresh]
  );

  const pointsByStudent = useMemo(() => {
    const map: Record<string, StudentPointSummary> = {};
    points.forEach((row) => {
      map[row.studentId] = row;
    });
    return map;
  }, [points]);

  const ruleById = useMemo(() => {
    const map: Record<string, ViolationRule> = {};
    rules.forEach((row) => {
      map[row.id] = row;
    });
    return map;
  }, [rules]);

  return (
    <DisciplineContext.Provider
      value={{
        available,
        loading,
        error,
        membership,
        pointScale,
        spThresholds,
        rules,
        points,
        feed,
        spLetters,
        leaderboard,
        classPoints,
        cards,
        pointsByStudent,
        ruleById,
        refresh,
        recordViolation,
        voidViolation,
        createManualSp,
        issueSp,
        cancelSp,
        setSpMeeting,
        updateRule,
        createRule,
        createStudentCard,
        revokeStudentCard,
      }}
    >
      {children}
    </DisciplineContext.Provider>
  );
};

export function useDiscipline() {
  const context = useContext(DisciplineContext);
  if (!context) {
    throw new Error('useDiscipline must be used within a DisciplineProvider');
  }
  return context;
}
