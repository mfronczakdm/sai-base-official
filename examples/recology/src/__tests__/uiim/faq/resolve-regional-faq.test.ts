import {
  resolveRegionalFaq,
  resolveRegionalFaqList,
} from '@/components/uiim/faq/resolve-regional-faq';
import type {
  GlobalFaqItem,
  RegionalFaqConfigurationItem,
} from '@/components/uiim/faq/regional-faq.props';

const text = (value: string) => ({ jsonValue: { value } });
const rich = (value: string) => ({ jsonValue: { value } });

const globalFaq: GlobalFaqItem = {
  id: 'global-1',
  question: text('How do I report a missed pickup?'),
  answer: rich('<p>Global missed pickup answer.</p>'),
  category: text('Collection'),
  sortOrder: text('110'),
  active: text('1'),
};

const config = (
  overrides: Partial<RegionalFaqConfigurationItem> = {}
): RegionalFaqConfigurationItem => ({
  id: 'config-1',
  active: text('1'),
  sortOrder: text('110'),
  globalFaq: { targetItems: [globalFaq] },
  ...overrides,
});

describe('resolveRegionalFaq', () => {
  it('returns the global FAQ when regional configuration is missing', () => {
    const result = resolveRegionalFaq(globalFaq, null);
    expect(result?.behavior).toBe('UseGlobal');
    expect(result?.resolvedAnswer?.value).toContain('Global missed pickup');
  });

  it('UseGlobal returns the global answer', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({ behavior: text('UseGlobal') })
    );
    expect(result?.behavior).toBe('UseGlobal');
    expect(result?.resolvedAnswer?.value).toContain('Global missed pickup');
    expect(result?.regionalSupportingInformation).toBeUndefined();
  });

  it('AddRegionalInformation returns global answer plus supporting information', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({
        behavior: text('AddRegionalInformation'),
        regionalSupportingInformation: rich('<p>SF local notes.</p>'),
      })
    );
    expect(result?.behavior).toBe('AddRegionalInformation');
    expect(result?.resolvedAnswer?.value).toContain('Global missed pickup');
    expect(result?.regionalSupportingInformation?.value).toContain('SF local notes');
  });

  it('Override returns the regional answer', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({
        behavior: text('Override'),
        regionalAnswer: rich('<p>Portland override answer.</p>'),
      })
    );
    expect(result?.behavior).toBe('Override');
    expect(result?.resolvedAnswer?.value).toContain('Portland override');
  });

  it('Override with a missing regional answer falls back to the global answer', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({
        behavior: text('Override'),
        regionalAnswer: rich(''),
      })
    );
    expect(result?.resolvedAnswer?.value).toContain('Global missed pickup');
  });

  it('Exclude returns null', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({ behavior: text('Exclude') })
    );
    expect(result).toBeNull();
  });

  it('removes inactive global FAQs', () => {
    const result = resolveRegionalFaq(
      { ...globalFaq, active: text('0') },
      config({ behavior: text('UseGlobal') })
    );
    expect(result).toBeNull();
  });

  it('ignores inactive regional configurations', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({ behavior: text('UseGlobal'), active: text('0') })
    );
    expect(result).toBeNull();
  });

  it('does not throw when Global FAQ reference is missing', () => {
    expect(() =>
      resolveRegionalFaq(null, config({ globalFaq: { targetItems: [] }, behavior: text('UseGlobal') }))
    ).not.toThrow();
    expect(
      resolveRegionalFaq(null, config({ globalFaq: { targetItems: [] }, behavior: text('UseGlobal') }))
    ).toBeNull();
  });

  it('unknown behavior falls back to UseGlobal', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({ behavior: text('SomethingElse') })
    );
    expect(result?.behavior).toBe('UseGlobal');
  });

  it('sorts by regional sort order then id', () => {
    const a = config({
      id: 'b',
      sortOrder: text('200'),
      behavior: text('UseGlobal'),
      globalFaq: {
        targetItems: [{ ...globalFaq, id: 'g2', question: text('Second'), sortOrder: text('10') }],
      },
    });
    const b = config({
      id: 'a',
      sortOrder: text('100'),
      behavior: text('UseGlobal'),
      globalFaq: {
        targetItems: [{ ...globalFaq, id: 'g1', question: text('First'), sortOrder: text('999') }],
      },
    });
    const list = resolveRegionalFaqList([a, b]);
    expect(list.map((item) => item.question.value)).toEqual(['First', 'Second']);
  });

  it('ignores Sitecore empty date sentinels (0001-01-01)', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({
        behavior: text('UseGlobal'),
        effectiveDate: text('0001-01-01T00:00:00Z'),
        expirationDate: text('0001-01-01T00:00:00Z'),
      })
    );
    expect(result?.behavior).toBe('UseGlobal');
    expect(result?.resolvedAnswer?.value).toContain('Global missed pickup');
  });

  it('excludes FAQs when a real expiration date has passed', () => {
    const result = resolveRegionalFaq(
      globalFaq,
      config({
        behavior: text('UseGlobal'),
        expirationDate: text('2020-01-01T00:00:00Z'),
      })
    );
    expect(result).toBeNull();
  });
});
