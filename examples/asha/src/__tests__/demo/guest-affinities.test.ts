import { flattenAffinities, formatAffinityScore } from '@/demo/guest-affinities';

describe('guest affinities', () => {
  it('reads Sitecore affinity name, value, views, and score', () => {
    const rows = flattenAffinities({
      traits: {
        affinities: {
          clinical_topic: {
            Audiology: { views: 2, score: 1, lastViewAt: '2026-10-23T12:46:00Z' },
            Literacy: { views: 1, score: 0.4 },
          },
        },
      },
    });

    expect(rows).toEqual([
      { name: 'clinical_topic', value: 'Audiology', views: 2, score: 1 },
      { name: 'clinical_topic', value: 'Literacy', views: 1, score: 0.4 },
    ]);
    expect(formatAffinityScore(rows[0].score)).toBe('1.00');
  });

  it('reads a list returned by a headless experience', () => {
    const rows = flattenAffinities({
      affinities: [{ name: 'clinical_topic', value: 'Audiology', views: 2, score: 1 }],
    });

    expect(rows).toEqual([{ name: 'clinical_topic', value: 'Audiology', views: 2, score: 1 }]);
  });

  it('ignores a personalize error payload', () => {
    expect(flattenAffinities({ message: 'No experiences found' })).toEqual([]);
  });
});
