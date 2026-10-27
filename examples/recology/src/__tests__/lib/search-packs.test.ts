import {
  findQaAnswers,
  getSearchPack,
  rankSearchPackItems,
  searchPackItems,
  tokenizeQuery,
} from '@/lib/search-packs';

describe('search-packs', () => {
  const pack = getSearchPack('recology');

  it('tokenizes natural-language queries without stop words', () => {
    expect(tokenizeQuery('I am moving to San Bruno area. What are my options for waste management')).toEqual(
      expect.arrayContaining(['moving', 'san', 'bruno', 'area', 'options', 'waste', 'management'])
    );
    expect(tokenizeQuery('I am moving to San Bruno area')).not.toContain('i');
    expect(tokenizeQuery('I am moving to San Bruno area')).not.toContain('am');
  });

  it('answers San Bruno moving queries with Q&A plus linked pages', () => {
    const query = 'I am moving to San Bruno area. What are my options for waste management';
    const answers = findQaAnswers(pack, query);
    const results = searchPackItems(pack, query);

    expect(answers[0]?.id).toBe('qa-san-bruno-moving');
    expect(answers[0]?.answer).toMatch(/Recology San Bruno/i);
    expect(answers[0]?.relatedLinks?.some((link) => link.href.includes('San-Bruno'))).toBe(true);

    expect(results.some((item) => item.id === 'san-bruno')).toBe(true);
    expect(results.some((item) => item.id === 'news-moving-san-bruno')).toBe(true);
    expect(results.some((item) => item.href.includes('Your-Three-Carts'))).toBe(true);

    const ranked = rankSearchPackItems(pack, query);
    expect(ranked[0].score).toBeGreaterThan(0);
    expect(ranked[0].id).toMatch(/san-bruno|qa-san-bruno|news-moving/i);
  });

  it('still finds simple keyword matches', () => {
    expect(searchPackItems(pack, 'compost').some((item) => item.title === 'Compost')).toBe(true);
  });
});
