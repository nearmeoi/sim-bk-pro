import type {
  PointStatus,
  SpStatus,
  SpType,
  StudentPortalData,
  StudentPortalSpLetter,
  StudentPortalViolation,
  ViolationCategory,
} from '../../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '');
const configuredBase = (import.meta.env.VITE_STUDENT_PORTAL_URL ?? '').replace(/\/+$/, '');

/** URL Edge Function portal. Bisa dioverride lewat VITE_STUDENT_PORTAL_URL. */
export const portalBaseUrl =
  configuredBase || (supabaseUrl ? `${supabaseUrl}/functions/v1/student-portal` : '');

export const isPortalConfigured = Boolean(portalBaseUrl);

export class PortalApiError extends Error {
  status: number;
  lockedUntil: string | null;

  constructor(message: string, status = 0, lockedUntil: string | null = null) {
    super(message);
    this.name = 'PortalApiError';
    this.status = status;
    this.lockedUntil = lockedUntil;
  }
}

export interface PortalSession {
  token: string;
  expiresAt: string;
}

const SESSION_KEY = 'sim_bk_portal_session_v1';

export function loadPortalSession(): PortalSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PortalSession>;
    if (!parsed.token || typeof parsed.token !== 'string') return null;
    return {
      token: parsed.token,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : '',
    };
  } catch {
    return null;
  }
}

export function savePortalSession(session: PortalSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* mode privat / storage penuh: sesi tetap hidup sampai halaman ditutup */
  }
}

export function clearPortalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}

/** Helper token kartu dipakai portal dan pemindai guru. */
export { extractCardToken, isValidCardToken } from '../../lib/cardToken';

export function buildStudentPortalUrl(token: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://sim-bk.local');
  const url = new URL('/m/', base);
  url.searchParams.set('card', token);
  return url.toString();
}

async function post<T>(
  action: 'login' | 'me' | 'logout',
  body: Record<string, unknown>,
  sessionToken?: string,
): Promise<T> {
  if (!portalBaseUrl) {
    throw new PortalApiError('Portal siswa belum dikonfigurasi. Hubungi Guru BK.', 0);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) headers.apikey = anonKey;
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

  let response: Response;
  try {
    response = await fetch(`${portalBaseUrl}/${action}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    throw new PortalApiError(
      'Tidak dapat menghubungi server. Periksa koneksi internet lalu coba lagi.',
      0,
    );
  }

  let raw: Record<string, unknown> | null = null;
  try {
    raw = (await response.json()) as Record<string, unknown>;
  } catch {
    raw = null;
  }

  if (!response.ok || raw?.ok === false) {
    const message =
      typeof raw?.error === 'string' && raw.error
        ? raw.error
        : 'Permintaan gagal. Silakan coba lagi.';
    const lockedUntil =
      typeof raw?.locked_until === 'string' ? raw.locked_until : null;
    throw new PortalApiError(message, response.status, lockedUntil);
  }

  return raw as T;
}

function mapViolation(raw: Record<string, unknown>): StudentPortalViolation {
  return {
    id: String(raw.id ?? ''),
    occurredAt: String(raw.occurred_at ?? ''),
    ruleCode: String(raw.rule_code ?? ''),
    ruleName: String(raw.rule_name ?? ''),
    category: (raw.category as ViolationCategory) ?? 'ringan',
    points: Number(raw.points ?? 0),
    guidebookPoints: Number(raw.guidebook_points ?? 0),
    location: String(raw.location ?? ''),
    status: (raw.status as StudentPortalViolation['status']) ?? 'recorded',
  };
}

function mapLetter(raw: Record<string, unknown>): StudentPortalSpLetter {
  return {
    id: String(raw.id ?? ''),
    type: (raw.type as SpType) ?? 'sp1',
    number: typeof raw.number === 'string' ? raw.number : null,
    status: (raw.status as SpStatus) ?? 'issued',
    totalPoints: Number(raw.total_points ?? 0),
    totalGuidebookPoints: Number(raw.total_guidebook_points ?? 0),
    issuedAt: typeof raw.issued_at === 'string' ? raw.issued_at : null,
    meetingAt: typeof raw.meeting_at === 'string' ? raw.meeting_at : null,
  };
}

function mapPortalData(raw: Record<string, unknown>): StudentPortalData {
  const student = (raw.student ?? {}) as Record<string, unknown>;
  const school = (raw.school ?? {}) as Record<string, unknown>;
  const points = (raw.points ?? {}) as Record<string, unknown>;

  return {
    student: {
      nama: String(student.nama ?? ''),
      nis: String(student.nis ?? ''),
      nisn: String(student.nisn ?? ''),
      kelas: String(student.kelas ?? ''),
    },
    school: {
      nama: String(school.nama ?? ''),
      npsn: typeof school.npsn === 'string' ? school.npsn : null,
    },
    points: {
      pointScale: Number(points.point_scale ?? 1000),
      totalPoints: Number(points.total_points ?? 0),
      totalGuidebookPoints: Number(points.total_guidebook_points ?? 0),
      balance: Number(points.balance ?? 0),
      semesterPoints: Number(points.semester_points ?? 0),
      yearPoints: Number(points.year_points ?? 0),
      status: (points.status as PointStatus) ?? 'aman',
      lastViolationAt:
        typeof points.last_violation_at === 'string' ? points.last_violation_at : null,
    },
    thresholds: Array.isArray(raw.thresholds)
      ? raw.thresholds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [],
    nextThreshold:
      typeof raw.next_threshold === 'number' ? Number(raw.next_threshold) : null,
    nextType: typeof raw.next_type === 'string' ? (raw.next_type as SpType) : null,
    violations: Array.isArray(raw.violations)
      ? raw.violations.map((row) => mapViolation(row as Record<string, unknown>))
      : [],
    spLetters: Array.isArray(raw.sp_letters)
      ? raw.sp_letters.map((row) => mapLetter(row as Record<string, unknown>))
      : [],
    serverTime: String(raw.server_time ?? new Date().toISOString()),
  };
}

export async function loginToPortal(
  token: string,
  pin: string,
): Promise<{ session: PortalSession; data: StudentPortalData }> {
  const raw = await post<Record<string, unknown>>('login', { token, pin });
  const session: PortalSession = {
    token: String(raw.session_token ?? ''),
    expiresAt: String(raw.expires_at ?? ''),
  };

  if (!session.token) {
    throw new PortalApiError('Server tidak mengirim sesi. Coba lagi.', 0);
  }

  const data = await fetchPortalData(session.token);
  return { session, data };
}

export async function fetchPortalData(sessionToken: string): Promise<StudentPortalData> {
  const raw = await post<Record<string, unknown>>('me', {}, sessionToken);
  return mapPortalData(raw);
}

export async function logoutFromPortal(sessionToken: string): Promise<void> {
  try {
    await post('logout', {}, sessionToken);
  } catch {
    /* sesi tetap dihapus di perangkat walau server tidak terjangkau */
  }
}
