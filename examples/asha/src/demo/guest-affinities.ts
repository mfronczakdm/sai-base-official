export type ScoredAffinity = {
  name: string;
  value: string;
  views: number;
  score: number;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const numberOrZero = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const rowFromLeaf = (name: string, value: string, leaf: unknown): ScoredAffinity | null => {
  const record = asRecord(leaf);
  if (!record || !('views' in record || 'score' in record)) return null;

  return {
    name,
    value,
    views: numberOrZero(record.views),
    score: numberOrZero(record.score),
  };
};

const rowsFromMap = (map: unknown): ScoredAffinity[] => {
  const groups = asRecord(map);
  if (!groups) return [];

  const rows: ScoredAffinity[] = [];

  Object.entries(groups).forEach(([name, values]) => {
    const group = asRecord(values);
    if (!group) return;

    Object.entries(group).forEach(([value, leaf]) => {
      const row = rowFromLeaf(name, value, leaf);
      if (row) rows.push(row);
    });
  });

  return rows;
};

const rowsFromList = (list: unknown[]): ScoredAffinity[] =>
  list.flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];

    const name = record.name ?? record.affinity ?? record.affinityName;
    const value = record.value ?? record.affinityValue;
    if (typeof name !== 'string' || typeof value !== 'string') return [];

    const row = rowFromLeaf(name, value, record);
    return row ? [row] : [];
  });

const affinityMap = (input: unknown): unknown => {
  const record = asRecord(input);
  if (!record) return null;

  if (Array.isArray(record.affinities)) return record.affinities;
  if (record.affinities) return record.affinities;

  const traits = asRecord(record.traits);
  if (traits?.affinities) return traits.affinities;

  const profile = asRecord(record.profile);
  if (profile) return affinityMap(profile);

  const data = asRecord(record.data);
  if (data) return affinityMap(data);

  return record;
};

export const flattenAffinities = (input: unknown): ScoredAffinity[] => {
  const source = affinityMap(input);
  const rows = Array.isArray(source) ? rowsFromList(source) : rowsFromMap(source);

  return rows.sort(
    (left, right) =>
      right.score - left.score ||
      right.views - left.views ||
      left.name.localeCompare(right.name) ||
      left.value.localeCompare(right.value)
  );
};

export const formatAffinityScore = (score: number): string => score.toFixed(2);
