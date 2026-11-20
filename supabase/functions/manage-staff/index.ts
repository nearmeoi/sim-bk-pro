/**
 * SIM-BK | Edge Function manajemen guru
 * ------------------------------------------------------------------
 * Membuat akun login guru dan mereset kata sandi sementara. Hanya guru BK
 * aktif yang boleh memanggil fungsi ini. Service role key tidak pernah
 * dikirim ke browser.
 *
 * Deploy:
 *   supabase functions deploy manage-staff
 *
 * Aksi:
 *   POST /manage-staff  { action: 'create', email, displayName, role, schoolId? }
 *   POST /manage-staff  { action: 'reset-password', memberId }
 *
 * Catatan:
 *   - Akun baru memakai kata sandi sementara yang dikembalikan SEKALI.
 *   - Bila email sudah punya akun Supabase, akun itu dihubungkan ke sekolah
 *     tanpa mengubah kata sandinya.
 *   - Email undangan tidak dikirim; BK menyerahkan kata sandi sementara
 *     secara langsung atau lewat kanal yang disepakati sekolah.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGIN = Deno.env.get('STAFF_ALLOWED_ORIGIN') ?? '*';
const MAX_BODY_BYTES = 4096;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
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

/** Kata sandi sementara tanpa karakter ambigu (0/O, 1/l/I). */
const temporaryPassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
};

type Admin = ReturnType<typeof createClient>;

type Caller = {
  userId: string;
  memberId: string;
  schoolId: string;
};

async function resolveCaller(
  admin: Admin,
  token: string,
  requestedSchoolId: string,
): Promise<Caller | null> {
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return null;

  let query = admin
    .from('school_members')
    .select('id, school_id, role')
    .eq('user_id', authData.user.id)
    .eq('role', 'bk')
    .eq('is_active', true)
    .limit(1);

  if (requestedSchoolId) query = query.eq('school_id', requestedSchoolId);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;

  const row = data[0] as { id: string; school_id: string };
  return {
    userId: authData.user.id,
    memberId: row.id,
    schoolId: row.school_id,
  };
}

async function findUserByEmail(admin: Admin, email: string) {
  const perPage = 200;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { user: null, error };
    const users = data?.users ?? [];
    const hit = users.find(
      (user) => (user.email ?? '').trim().toLowerCase() === email,
    );
    if (hit) return { user: hit, error: null };
    if (users.length < perPage) break;
  }
  return { user: null, error: null };
}

async function writeAudit(
  admin: Admin,
  caller: Caller,
  action: string,
  memberId: string,
  after: Record<string, unknown>,
) {
  const { error } = await admin.from('audit_log').insert({
    school_id: caller.schoolId,
    actor_id: caller.userId,
    actor_member_id: caller.memberId,
    action,
    table_name: 'school_members',
    record_id: memberId,
    after_data: after,
  });
  if (error) console.error('manage-staff audit:', error.message);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Metode tidak didukung.' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('manage-staff: SUPABASE_URL / SERVICE_ROLE_KEY belum diatur');
    return json({ ok: false, error: 'Manajemen guru belum dikonfigurasi.' }, 503);
  }

  const token = bearer(req);
  if (!token) {
    return json({ ok: false, error: 'Sesi berakhir. Silakan login ulang.' }, 401);
  }

  const body = await readBody(req);
  if (!body) {
    return json({ ok: false, error: 'Permintaan tidak valid.' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const requestedSchoolId =
    typeof body.schoolId === 'string' ? body.schoolId.trim() : '';
  const caller = await resolveCaller(admin, token, requestedSchoolId);
  if (!caller) {
    return json(
      { ok: false, error: 'Hanya guru BK aktif yang boleh mengelola akun guru.' },
      403,
    );
  }

  const action = typeof body.action === 'string' ? body.action : '';

  if (action === 'create') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const displayName =
      typeof body.displayName === 'string' ? body.displayName.trim() : '';
    const role = body.role === 'bk' ? 'bk' : 'wali_kelas';

    if (email.length < 5 || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'Format email tidak valid.' }, 400);
    }
    if (displayName.length < 2 || displayName.length > 100) {
      return json({ ok: false, error: 'Nama guru harus 2–100 karakter.' }, 400);
    }

    const { data: sameEmail } = await admin
      .from('school_members')
      .select('id')
      .eq('school_id', caller.schoolId)
      .eq('email', email)
      .limit(1);

    if (sameEmail && sameEmail.length > 0) {
      return json(
        { ok: false, error: 'Email ini sudah terdaftar sebagai anggota sekolah.' },
        409,
      );
    }

    const { user: existing, error: lookupError } = await findUserByEmail(
      admin,
      email,
    );
    if (lookupError) {
      console.error('manage-staff lookup:', lookupError.message);
      return json({ ok: false, error: 'Gagal memeriksa email.' }, 500);
    }

    let userId = existing?.id ?? '';
    let tempPassword: string | null = null;

    if (userId) {
      const { data: membership } = await admin
        .from('school_members')
        .select('id')
        .eq('school_id', caller.schoolId)
        .eq('user_id', userId)
        .limit(1);

      if (membership && membership.length > 0) {
        return json(
          { ok: false, error: 'Email ini sudah menjadi anggota sekolah.' },
          409,
        );
      }
    } else {
      tempPassword = temporaryPassword();
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });

      if (createError || !created.user) {
        console.error('manage-staff create:', createError?.message);
        return json(
          { ok: false, error: createError?.message ?? 'Gagal membuat akun guru.' },
          400,
        );
      }
      userId = created.user.id;
    }

    const { data: member, error: memberError } = await admin
      .from('school_members')
      .insert({
        school_id: caller.schoolId,
        user_id: userId,
        role,
        display_name: displayName,
        email,
        is_active: true,
      })
      .select('id, school_id, user_id, role, display_name, email, is_active')
      .single();

    if (memberError || !member) {
      if (tempPassword) {
        await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      }
      console.error('manage-staff membership:', memberError?.message);
      return json(
        {
          ok: false,
          error:
            memberError?.code === '23505'
              ? 'Email ini sudah menjadi anggota sekolah.'
              : 'Gagal menambahkan guru ke sekolah.',
        },
        400,
      );
    }

    await writeAudit(admin, caller, 'staff.created', member.id, {
      role,
      email,
      linked: Boolean(existing),
    });

    return json({
      ok: true,
      member,
      linked: Boolean(existing),
      temporary_password: tempPassword,
    });
  }

  if (action === 'reset-password') {
    const memberId =
      typeof body.memberId === 'string' ? body.memberId.trim() : '';
    if (!memberId) {
      return json({ ok: false, error: 'Anggota tidak dipilih.' }, 400);
    }

    const { data: member, error: memberError } = await admin
      .from('school_members')
      .select('id, school_id, user_id, is_active')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError || !member || member.school_id !== caller.schoolId) {
      return json({ ok: false, error: 'Anggota tidak ditemukan di sekolah ini.' }, 404);
    }
    if (!member.is_active) {
      return json(
        { ok: false, error: 'Aktifkan akun guru sebelum mereset kata sandi.' },
        400,
      );
    }

    const password = temporaryPassword();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      member.user_id,
      { password },
    );
    if (updateError) {
      console.error('manage-staff reset:', updateError.message);
      return json({ ok: false, error: 'Gagal mereset kata sandi.' }, 500);
    }

    await writeAudit(admin, caller, 'staff.password_reset', member.id, {
      reset_at: new Date().toISOString(),
    });

    return json({ ok: true, temporary_password: password });
  }

  return json({ ok: false, error: 'Aksi tidak dikenal.' }, 404);
});
