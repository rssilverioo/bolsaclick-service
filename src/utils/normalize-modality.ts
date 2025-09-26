export function normalizeModality(input?: string): string {
  if (!input) return 'A distância';

  const s = input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove acentos
    .toLowerCase()
    .trim();

  if (s.includes('semi')) return 'Semipresencial';
  if (s.startsWith('presenc')) return 'Presencial';
  if (s.includes('dist')) return 'A distância';

  return 'A distância';
}
