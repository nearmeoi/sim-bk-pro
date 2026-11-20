/**
 * Layanan Tata Tertib & Poin.
 *
 * Semua penulisan pelanggaran, pembatalan, dan penerbitan SP lewat RPC agar
 * ledger tetap immutable dan aturan tenant tidak bisa dilewati dari klien.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type {
  ClassPointSummary,
  LeaderboardEntry,
  RecordViolationPayload,
  SchoolMembership,
  SpLetter,
  SpType,
  StudentCard,
  StudentPointSummary,
  ViolationCategory,
  ViolationFeedItem,
  ViolationRule,
} from '../types';

function client() {
  if (!isSupabaseConfigured() || !supabase) return null;
  return supabase;
}

function fail(message: string): never {
  throw new Error(message);
}

function mapRule(row: Record<string, unknown>): ViolationRule {
  return {
    id: row.id as string,
    code: row.code as string,
    category: row.category as ViolationCategory,
    name: row.name as string,
    description: (row.description as string) || '',
    points: Number(row.points),
    guidebookPoints: Number(row.guidebook_points),
    defaultSanction: (row.default_sanction as string) || '',
    sanctionTiers: Array.isArray(row.sanction_tiers) ? row.sanction_tiers : [],
    spOverride: row.sp_override == null ? null : Number(row.sp_override),
    isExpulsion: Boolean(row.is_expulsion),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapPoints(row: Record<string, unknown>): StudentPointSummary {
  return {
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    nama: row.nama as string,
    nis: row.nis as string,
    nisn: (row.nisn as string) || '-',
    jk: row.jk as 'L' | 'P',
    kelas: row.kelas as string,
    classId: (row.class_id as string) || null,
    studentStatus: (row.student_status as string) || 'Aktif',
    pointScale: Number(row.point_scale ?? 1000),
    totalPoints: Number(row.total_points ?? 0),
    totalGuidebookPoints: Number(row.total_guidebook_points ?? 0),
    semesterPoints: Number(row.semester_points ?? 0),
    yearPoints: Number(row.year_points ?? 0),
    balance: Number(row.balance ?? row.point_scale ?? 1000),
    status: (row.status as StudentPointSummary['status']) || 'aman',
    lastViolationAt: (row.last_violation_at as string) || null,
  };
}

function mapFeed(row: Record<string, unknown>): ViolationFeedItem {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    nama: row.nama as string,
    kelas: row.kelas as string,
    classId: (row.class_id as string) || null,
    ruleId: row.rule_id as string,
    ruleCode: row.rule_code as string,
    ruleName: row.rule_name as string,
    ruleCategory: row.rule_category as ViolationCategory,
    rulePoints: Number(row.rule_points ?? 0),
    ruleGuidebookPoints: Number(row.rule_guidebook_points ?? 0),
    occurredAt: row.occurred_at as string,
    academicYearId: row.academic_year_id as string,
    semesterId: row.semester_id as string,
    location: (row.location as string) || '',
    chronology: (row.chronology as string) || '',
    evidencePaths: Array.isArray(row.evidence_paths) ? (row.evidence_paths as string[]) : [],
    reportedByName: (row.reported_by_name as string) || '',
    status: (row.status as ViolationFeedItem['status']) || 'recorded',
    createdAt: row.created_at as string,
  };
}

function mapSp(row: Record<string, unknown>): SpLetter {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    nama: row.nama as string,
    kelas: row.kelas as string,
    classId: (row.class_id as string) || null,
    type: row.type as SpType,
    sequence: Number(row.sequence ?? 1),
    number: (row.number as string) || null,
    status: row.status as SpLetter['status'],
    isManual: Boolean(row.is_manual),
    isOverride: Boolean(row.is_override),
    thresholdPoints: Number(row.threshold_points ?? 0),
    totalPoints: Number(row.total_points ?? 0),
    totalGuidebookPoints: Number(row.total_guidebook_points ?? 0),
    meetingAt: (row.meeting_at as string) || null,
    triggerRecordId: (row.trigger_record_id as string) || null,
    createdAt: row.created_at as string,
    issuedAt: (row.issued_at as string) || null,
    acknowledgedAt: (row.acknowledged_at as string) || null,
  };
}

function mapLeaderboard(row: Record<string, unknown>): LeaderboardEntry {
  return {
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    nama: row.nama as string,
    nis: row.nis as string,
    kelas: row.kelas as string,
    classId: (row.class_id as string) || null,
    points: Number(row.points ?? 0),
    schoolRank: Number(row.school_rank ?? 0),
    classRank: Number(row.class_rank ?? 0),
    schoolStudents: Number(row.school_students ?? 0),
    classStudents: Number(row.class_students ?? 0),
  };
}

function mapClassPoints(row: Record<string, unknown>): ClassPointSummary {
  return {
    schoolId: row.school_id as string,
    classId: row.class_id as string,
    kelas: row.kelas as string,
    studentCount: Number(row.student_count ?? 0),
    semesterPoints: Number(row.semester_points ?? 0),
    averagePoints: Number(row.average_points ?? 0),
    rank: Number(row.rank ?? 0),
  };
}

function mapCard(row: Record<string, unknown>): StudentCard {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    studentId: row.student_id as string,
    status: row.status === 'revoked' ? 'revoked' : 'active',
    failedAttempts: Number(row.failed_attempts ?? 0),
    lockedUntil: (row.locked_until as string) || null,
    lastUsedAt: (row.last_used_at as string) || null,
    issuedAt: row.issued_at as string,
    revokedAt: (row.revoked_at as string) || null,
    revokedReason: (row.revoked_reason as string) || null,
  };
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const sb = client();
  if (!sb) fail('Tata Tertib membutuhkan koneksi Supabase.');
  const { data, error } = await sb.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const disciplineService = {
  isAvailable(): boolean {
    return Boolean(client());
  },

  async getMembership(): Promise<SchoolMembership | null> {
    const sb = client();
    if (!sb) return null;
    const { data, error } = await sb
      .from('school_members')
      .select('id, school_id, role, display_name')
      .eq('is_active', true)
      .limit(1);
    if (error) {
      console.warn('Gagal memuat peran pengguna:', error.message);
      return null;
    }
    const row = data?.[0];
    if (!row) return null;
    return {
      memberId: row.id,
      schoolId: row.school_id,
      role: row.role === 'wali_kelas' ? 'wali_kelas' : 'bk',
      displayName: row.display_name || '',
    };
  },

  async getSchoolConfig(schoolId?: string): Promise<{ pointScale: number; spThresholds: number[] } | null> {
    const sb = client();
    if (!sb) return null;
    const { data, error } = await (schoolId
      ? sb.from('schools').select('point_scale, sp_thresholds').eq('id', schoolId).limit(1)
      : sb.from('schools').select('point_scale, sp_thresholds').limit(1));
    if (error) {
      console.warn('Gagal memuat skala poin sekolah:', error.message);
      return null;
    }
    const row = data?.[0];
    if (!row) return null;
    return {
      pointScale: Number(row.point_scale ?? 1000),
      spThresholds: Array.isArray(row.sp_thresholds)
        ? (row.sp_thresholds as number[]).map(Number)
        : [260, 510, 760, 1000],
    };
  },

  async getRules(): Promise<ViolationRule[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('violation_rules')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapRule);
  },

  async getStudentPoints(): Promise<StudentPointSummary[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('v_student_points')
      .select('*')
      .order('nama', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapPoints);
  },

  async getFeed(limit = 300): Promise<ViolationFeedItem[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('v_violation_feed')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map(mapFeed);
  },

  async getSpLetters(): Promise<SpLetter[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('v_sp_letters')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapSp);
  },

  async getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('v_violation_leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map(mapLeaderboard);
  },

  async getClassPoints(): Promise<ClassPointSummary[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('v_class_points')
      .select('*')
      .order('rank', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapClassPoints);
  },

  async getStudentCards(): Promise<StudentCard[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('student_cards')
      .select(
        'id, school_id, student_id, status, failed_attempts, locked_until, last_used_at, issued_at, revoked_at, revoked_reason'
      )
      .order('issued_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapCard);
  },

  async recordViolation(
    payload: RecordViolationPayload
  ): Promise<{ recordId: string; spDraft: SpLetter | null }> {
    const recordId = await rpc<string>('record_violation', {
      p_student_id: payload.studentId,
      p_rule_id: payload.ruleId,
      p_occurred_at: payload.occurredAt,
      p_location: payload.location || null,
      p_chronology: payload.chronology || null,
      p_evidence_paths: payload.evidencePaths || [],
    });

    const sb = client();
    let spDraft: SpLetter | null = null;
    if (sb) {
      const { data } = await sb
        .from('v_sp_letters')
        .select('*')
        .eq('trigger_record_id', recordId)
        .limit(1);
      if (data?.[0]) spDraft = mapSp(data[0]);
    }
    return { recordId, spDraft };
  },

  async voidViolation(recordId: string, reason: string): Promise<void> {
    await rpc<void>('void_violation', {
      p_record_id: recordId,
      p_reason: reason,
    });
  },

  async createManualSp(studentId: string, type: SpType, reason: string): Promise<string> {
    return rpc<string>('create_manual_sp', {
      p_student_id: studentId,
      p_type: type,
      p_reason: reason || null,
    });
  },

  async issueSp(id: string, number: string, meetingAt: string | null): Promise<void> {
    await rpc<void>('issue_sp_letter', {
      p_sp_id: id,
      p_number: number,
      p_meeting_at: meetingAt,
    });
  },

  async cancelSp(id: string, reason: string): Promise<void> {
    await rpc<void>('cancel_sp_letter', {
      p_sp_id: id,
      p_reason: reason,
    });
  },

  async setSpMeeting(id: string, meetingAt: string): Promise<void> {
    await rpc<void>('set_sp_meeting', {
      p_sp_id: id,
      p_meeting_at: meetingAt,
    });
  },

  async updateRule(
    id: string,
    patch: Partial<Pick<ViolationRule, 'name' | 'description' | 'points' | 'guidebookPoints' | 'defaultSanction' | 'isActive'>>
  ): Promise<void> {
    const sb = client();
    if (!sb) fail('Tata Tertib membutuhkan koneksi Supabase.');
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) payload.name = patch.name.trim();
    if (patch.description !== undefined) payload.description = patch.description.trim() || null;
    if (patch.points !== undefined) payload.points = patch.points;
    if (patch.guidebookPoints !== undefined) payload.guidebook_points = patch.guidebookPoints;
    if (patch.defaultSanction !== undefined) payload.default_sanction = patch.defaultSanction.trim() || null;
    if (patch.isActive !== undefined) payload.is_active = patch.isActive;
    const { error } = await sb.from('violation_rules').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createRule(input: {
    code: string;
    category: ViolationCategory;
    name: string;
    points: number;
    guidebookPoints: number;
    defaultSanction?: string;
  }): Promise<void> {
    const sb = client();
    if (!sb) fail('Tata Tertib membutuhkan koneksi Supabase.');
    const { data, error: maxError } = await sb
      .from('violation_rules')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    if (maxError) throw new Error(maxError.message);
    const nextSort = Number(data?.[0]?.sort_order ?? 0) + 10;
    const { error } = await sb.from('violation_rules').insert({
      code: input.code.trim().toUpperCase(),
      category: input.category,
      name: input.name.trim(),
      points: input.points,
      guidebook_points: input.guidebookPoints,
      default_sanction: input.defaultSanction?.trim() || null,
      sort_order: nextSort,
      is_active: true,
    });
    if (error) throw new Error(error.message);
  },

  async createStudentCard(studentId: string): Promise<{
    token: string;
    pin: string;
    cardId: string;
  }> {
    const data = await rpc<Record<string, unknown>>('create_student_card', {
      p_student_id: studentId,
    });
    return {
      token: data.token as string,
      pin: data.pin as string,
      cardId: data.card_id as string,
    };
  },

  async revokeStudentCard(cardId: string, reason: string): Promise<void> {
    await rpc<void>('revoke_student_card', {
      p_card_id: cardId,
      p_reason: reason,
    });
  },
};
