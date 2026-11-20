import { useMemo } from 'react';
import { useBK } from '../../context/BKContext';
import { useDiscipline } from '../../context/DisciplineContext';
import { DocPreview } from '../../mobile/docPreview';
import { buildSpBeritaAcaraSpec, buildSpDocSpec } from '../../lib/spDocument';
import type { SpLetter } from '../../types';

interface SpDocumentModalProps {
  letter: SpLetter | null;
  kind?: 'sp' | 'berita-acara';
  onClose: () => void;
}

export default function SpDocumentModal({
  letter,
  kind = 'sp',
  onClose,
}: SpDocumentModalProps) {
  const { settings, students } = useBK();
  const { feed } = useDiscipline();

  const student = useMemo(
    () => (letter ? students.find((row) => row.id === letter.studentId) || null : null),
    [students, letter],
  );

  const history = useMemo(
    () => (letter ? feed.filter((row) => row.studentId === letter.studentId) : []),
    [feed, letter],
  );

  const spec = useMemo(() => {
    if (!letter) return null;
    return kind === 'berita-acara'
      ? buildSpBeritaAcaraSpec(letter, student, history)
      : buildSpDocSpec(letter, student, history);
  }, [letter, kind, student, history]);

  if (!spec) return null;

  return <DocPreview open={Boolean(letter)} onClose={onClose} spec={spec} settings={settings} />;
}
