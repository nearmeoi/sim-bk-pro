import { describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => {
  const rpc = vi.fn(
    async (): Promise<{ data: unknown; error: unknown }> => ({ data: null, error: null }),
  );
  const invoke = vi.fn(
    async (): Promise<{ data: any; error: any }> => ({ data: null, error: null }),
  );
  const order = vi.fn();
  const chain = {
    select: vi.fn(),
    order,
    eq: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return { rpc, invoke, chain, functions: { invoke } };
});

vi.mock('../lib/supabaseClient', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: fake.rpc,
    from: () => fake.chain,
    functions: fake.functions,
  },
}));

const { staffService } = await import('./staffService');

describe('staffService', () => {
  it('menugaskan wali kelas dengan parameter RPC yang benar', async () => {
    await staffService.assignHomeroom('class-1', 'member-1');

    expect(fake.rpc).toHaveBeenCalledWith('assign_homeroom', {
      p_class_id: 'class-1',
      p_member_id: 'member-1',
    });
  });

  it('memetakan hasil pindai kartu siswa', async () => {
    fake.rpc.mockResolvedValueOnce({
      data: [
        {
          card_id: 'card-1',
          student_id: 'S001',
          school_id: 'school',
          nama: 'SISWA A',
          nis: '2210001',
          nisn: '0090000001',
          jk: 'P',
          kelas: '7A',
          class_id: 'class-1',
          student_status: 'Aktif',
          point_scale: 1000,
          total_points: 260,
          total_guidebook_points: 26,
          semester_points: 260,
          year_points: 260,
          balance: 740,
          status: 'sp1',
          last_violation_at: '2026-11-18T02:00:00.000Z',
        },
      ],
      error: null,
    });

    const result = await staffService.resolveCard('SIMBK1:abc');

    expect(fake.rpc).toHaveBeenCalledWith('resolve_student_card', {
      p_token: 'SIMBK1:abc',
    });
    expect(result).toMatchObject({
      cardId: 'card-1',
      studentId: 'S001',
      nama: 'SISWA A',
      jk: 'P',
      kelas: '7A',
      totalPoints: 260,
      balance: 740,
      status: 'sp1',
    });
  });

  it('menampilkan pesan RPC saat kartu tidak valid', async () => {
    fake.rpc.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Kartu tidak dikenali atau sudah dicabut.',
        context: {
          json: async () => ({
            message: 'Kartu tidak dikenali atau sudah dicabut.',
          }),
        },
      },
    });

    await expect(staffService.resolveCard('SIMBK1:abc')).rejects.toThrow(
      'Kartu tidak dikenali atau sudah dicabut.',
    );
  });

  it('memetakan respons pembuatan akun dari Edge Function', async () => {
    fake.invoke.mockResolvedValueOnce({
      data: {
        ok: true,
        linked: false,
        temporary_password: 'Temp1234',
        member: {
          id: 'member-9',
          user_id: 'user-9',
          role: 'wali_kelas',
          display_name: 'PAK ANDI',
          email: 'andi@sekolah.test',
        },
      },
      error: null,
    });

    const account = await staffService.createAccount({
      schoolId: 'school',
      email: 'Andi@Sekolah.test',
      displayName: ' PAK ANDI ',
      role: 'wali_kelas',
    });

    expect(fake.invoke).toHaveBeenCalledWith('manage-staff', {
      body: {
        action: 'create',
        schoolId: 'school',
        email: 'andi@sekolah.test',
        displayName: 'PAK ANDI',
        role: 'wali_kelas',
      },
    });
    expect(account).toMatchObject({
      memberId: 'member-9',
      userId: 'user-9',
      email: 'andi@sekolah.test',
      temporaryPassword: 'Temp1234',
      linked: false,
    });
  });

  it('menolak respons Edge Function yang tidak sukses', async () => {
    fake.invoke.mockResolvedValueOnce({
      data: { ok: false, error: 'Email ini sudah menjadi anggota sekolah.' },
      error: null,
    });

    await expect(
      staffService.createAccount({
        schoolId: 'school',
        email: 'andi@sekolah.test',
        displayName: 'PAK ANDI',
        role: 'wali_kelas',
      }),
    ).rejects.toThrow('Email ini sudah menjadi anggota sekolah.');
  });
});
