import type { CardScanResult, Student } from '../types';

/** Ubah hasil pindai menjadi objek Student agar bisa dipakai modal pencatatan. */
export function studentFromCardScan(result: CardScanResult): Student {
  const status: Student['status'] =
    result.studentStatus === 'Lulus'
      ? 'Lulus'
      : result.studentStatus === 'Pindah'
        ? 'Pindah'
        : 'Aktif';

  return {
    id: result.studentId,
    nama: result.nama,
    nis: result.nis,
    nisn: result.nisn || '-',
    jk: result.jk,
    kelas: result.kelas,
    status,
  };
}

/** Prefer data siswa yang sudah dimuat agar nama wali dan kontak tetap ada. */
export function resolveScannedStudent(
  result: CardScanResult,
  students: Student[],
): Student {
  return (
    students.find((row) => row.id === result.studentId) ||
    studentFromCardScan(result)
  );
}
