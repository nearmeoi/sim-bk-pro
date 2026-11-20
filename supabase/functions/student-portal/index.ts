/**
 * SIM-BK | Edge Function portal siswa
 * ------------------------------------------------------------------
 * Verifikasi kartu QR + PIN, lalu buat sesi singkat. Browser siswa
 * tidak pernah memegang service role key dan tidak bisa membaca tabel
 * student_cards / student_portal_sessions.
 *
 * Deploy:
 *   supabase functions deploy student-portal --no-verify-jwt
 *
 * Endpoint:
 *   POST /student-portal/login   { token, pin }
 *   POST /student-portal/me      Authorization: Bearer <session>
 *   POST /student-portal/logout  Authorization: Bearer <session>
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('PORTAL_ALLOWED_ORIGIN') ?? '*';
const MAX_BODY_BYTES = 4096;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      ...extra,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const readBody = async (req: Request): Promise<Record<string, unknown> | null> => {
  const text = await req.text();
  if (!text || text.length > MAX_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const bearer = (req: Request): string => {
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
};

const sessionError = json(
  { ok: false, error: 'Sesi berakhir. Silakan login ulang.' },
  401,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Metode tidak didukung.' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('student-portal: SUPABASE_URL / SERVICE_ROLE_KEY belum diatur');
    return json({ ok: false, error: 'Portal belum dikonfigurasi.' }, 503);
  }

  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const action = parts[parts.length - 1];
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === 'login') {
    const body = await readBody(req);
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';

    if (token.length < 10 || token.length > 200 || !/^\d{6}$/.test(pin)) {
      return json({ ok: false, error: 'Kartu atau PIN tidak valid.' }, 400);
    }

    const { data, error } = await admin.rpc('student_portal_login', {
      p_token: token,
      p_pin: pin,
    });

    if (error) {
      console.error('student-portal login:', error.message);
      return json({ ok: false, error: 'Portal sedang tidak tersedia.' }, 500);
    }

    if (!data?.ok) {
      const lockedUntil = data?.locked_until
        ? new Date(data.locked_until).toISOString()
        : null;
      return json(
        {
          ok: false,
          error: data?.error ?? 'Kartu atau PIN tidak valid.',
          locked_until: lockedUntil,
        },
        lockedUntil ? 423 : 401,
        lockedUntil ? { 'Retry-After': '900' } : {},
      );
    }

    return json(data);
  }

  const sessionToken = bearer(req);
  if (sessionToken.length < 32) {
    return sessionError;
  }

  if (action === 'me' || action === 'data') {
    const { data, error } = await admin.rpc('student_portal_data', {
      p_session_token: sessionToken,
    });

    if (error) {
      console.error('student-portal data:', error.message);
      return json({ ok: false, error: 'Portal sedang tidak tersedia.' }, 500);
    }

    if (!data?.ok) {
      return json(data ?? { ok: false, error: 'Sesi berakhir.' }, 401);
    }

    return json(data);
  }

  if (action === 'logout') {
    const { error } = await admin.rpc('student_portal_logout', {
      p_session_token: sessionToken,
    });

    if (error) {
      console.error('student-portal logout:', error.message);
    }

    return json({ ok: true });
  }

  return json({ ok: false, error: 'Aksi tidak dikenal.' }, 404);
});
