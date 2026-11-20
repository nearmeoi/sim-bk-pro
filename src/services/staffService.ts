/**
 * Layanan guru, akun staf, dan penugasan wali kelas.
 *
 * Semua penulisan lewat RPC agar BK terakhir tidak bisa hilang dan penugasan
 * lintas sekolah ditolak di database. Pembuatan akun login memakai Edge
 * Function `manage-staff` karena butuh service role.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type {
  CreatedStaffAccount,
  SchoolClassOption,
  StaffMember,
} from '../types';

function client() {
  if (!isSupabaseConfigured() || !supabase) return null;
  return supabase;
}

function mapStaff(row: Record<string, unknown>): StaffMember {
  return {
    memberId: row.id as string,
    schoolId: row.school_id as string,
    userId: row.user_id as string,
    role: row.role === 'bk' ? 'bk' : 'wali_kelas',
    displayName: (row.display_name as string) || 'Tanpa nama',
    email: (row.email as string) || null,
    isActive: Boolean(row.is_active),
    createdAt: (row.created_at as string) || '',
  };
}

function mapClass(row: Record<string, unknown>): SchoolClassOption {
  return {
    id: row.id as string,
    schoolId: row.school_id as string,
    academicYearId: row.academic_year_id as string,
    name: row.name as string,
    level: row.level == null ? null : Number(row.level),
    homeroomMemberId: (row.homeroom_member_id as string) || null,
  };
}

async function rpcError(error: unknown): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = (await context.json()) as { error?: string; message?: string };
      if (body?.error) return body.error;
      if (body?.message) return body.message;
    } catch {
      /* respons bukan JSON */
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Terjadi kesalahan. Coba lagi.';
}

export const staffService = {
  isAvailable(): boolean {
    return Boolean(client());
  },

  async getStaff(): Promise<StaffMember[]> {
    const sb = client();
    if (!sb) return [];
    const { data, error } = await sb
      .from('school_members')
      .select('id, school_id, user_id, role, display_name, email, is_active, created_at')
      .order('role', { ascending: true })
      .order('display_name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapStaff);
  },

  async getClasses(academicYearId: string): Promise<SchoolClassOption[]> {
    const sb = client();
    if (!sb || !academicYearId) return [];
    const { data, error } = await sb
      .from('classes')
      .select('id, school_id, academic_year_id, name, level, homeroom_member_id')
      .eq('academic_year_id', academicYearId)
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapClass);
  },

  async assignHomeroom(classId: string, memberId: string): Promise<void> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { error } = await sb.rpc('assign_homeroom', {
      p_class_id: classId,
      p_member_id: memberId,
    });
    if (error) throw new Error(error.message);
  },

  async clearHomeroom(classId: string): Promise<void> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { error } = await sb.rpc('clear_homeroom', { p_class_id: classId });
    if (error) throw new Error(error.message);
  },

  async updateMember(input: {
    memberId: string;
    displayName: string;
    role: StaffMember['role'];
    email: string | null;
  }): Promise<void> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { error } = await sb.rpc('update_school_member', {
      p_member_id: input.memberId,
      p_display_name: input.displayName,
      p_role: input.role,
      p_email: input.email,
    });
    if (error) throw new Error(error.message);
  },

  async setActive(memberId: string, isActive: boolean): Promise<void> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { error } = await sb.rpc('set_school_member_active', {
      p_member_id: memberId,
      p_is_active: isActive,
    });
    if (error) throw new Error(error.message);
  },

  async createAccount(input: {
    schoolId: string;
    email: string;
    displayName: string;
    role: StaffMember['role'];
  }): Promise<CreatedStaffAccount> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { data, error } = await sb.functions.invoke('manage-staff', {
      body: {
        action: 'create',
        schoolId: input.schoolId,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        role: input.role,
      },
    });
    if (error) throw new Error(await rpcError(error));
    if (!data?.ok || !data.member) {
      throw new Error(data?.error || 'Gagal membuat akun guru.');
    }
    const member = data.member as Record<string, unknown>;
    return {
      memberId: member.id as string,
      userId: member.user_id as string,
      displayName: (member.display_name as string) || input.displayName.trim(),
      role: member.role === 'bk' ? 'bk' : 'wali_kelas',
      email: (member.email as string) || input.email.trim().toLowerCase(),
      temporaryPassword: (data.temporary_password as string) || null,
      linked: Boolean(data.linked),
    };
  },

  async resetPassword(memberId: string): Promise<string> {
    const sb = client();
    if (!sb) throw new Error('Manajemen guru membutuhkan koneksi Supabase.');
    const { data, error } = await sb.functions.invoke('manage-staff', {
      body: { action: 'reset-password', memberId },
    });
    if (error) throw new Error(await rpcError(error));
    if (!data?.ok || !data.temporary_password) {
      throw new Error(data?.error || 'Gagal mereset kata sandi.');
    }
    return data.temporary_password as string;
  },
};
