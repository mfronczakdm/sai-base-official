import {
  accessNamesFromValue,
  canViewPracticePage,
  selectPracticeTopics,
} from '@/components/uiim/practice-listing/practice-access.util';

describe('practice access', () => {
  it('maps checklist ids to access names', () => {
    expect(
      accessNamesFromValue(
        '{15576C6D-8009-411D-A37B-313E88A4C213}|{30F685CF-3560-4ABC-BC54-B56945E6E9E1}'
      )
    ).toEqual(['Public', 'Certificate holder']);
  });

  it('shows public topics to every profile, including anonymous', () => {
    expect(canViewPracticePage(['Public'], null)).toBe(true);
    expect(canViewPracticePage(['Public', 'Member-only'], 'Subscriber')).toBe(true);
  });

  it('shows a topic when the profile matches one access value', () => {
    expect(canViewPracticePage(['Certificate holder', 'Subscriber'], 'Subscriber')).toBe(true);
    expect(canViewPracticePage(['Member-only'], 'Member-only')).toBe(true);
  });

  it('hides a topic when the profile does not match and the topic is not public', () => {
    expect(canViewPracticePage(['Certificate holder'], 'Subscriber')).toBe(false);
    expect(canViewPracticePage(['Member-only'], null)).toBe(false);
    expect(canViewPracticePage([], 'Certificate holder')).toBe(false);
  });

  it('keeps the latest page version and skips datasource items', () => {
    const topics = selectPracticeTopics([
      {
        id: 'page',
        version: 1,
        name: 'Clinical Education',
        url: { path: '/Practice-Management/Clinical-Education' },
        access: { value: '{15576C6D-8009-411D-A37B-313E88A4C213}' },
      },
      {
        id: 'page',
        version: 2,
        name: 'Clinical Education',
        url: { path: '/Practice-Management/Clinical-Education' },
        access: { value: '{0152C723-1DA5-41D8-961A-F40DD634CAD4}' },
      },
      {
        id: 'datasource',
        version: 1,
        name: 'Practice_Portal_Topic',
        url: { path: '/Practice-Management/Clinical-Education/Data/Practice_Portal_Topic' },
        access: { value: '' },
      },
    ]);

    expect(topics).toEqual([
      {
        id: 'page',
        title: 'Clinical Education',
        href: '/Practice-Management/Clinical-Education',
        summary: '',
        access: ['Member-only'],
      },
    ]);
  });
});
