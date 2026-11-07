/** ID unik tahan bentrok (pengganti Date.now yang bisa tabrakan saat klik cepat). */
export const newId = (prefix: string): string => {
  const rnd = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rnd}`;
};
