import { parseGlobalHeaderLinks } from '@/lib/global-header-links';

describe('parseGlobalHeaderLinks', () => {
  it('keeps the global header order and strips the recology.com host', () => {
    const links = parseGlobalHeaderLinks([
      {
        name: 'Careers',
        link: {
          jsonValue: {
            value: {
              text: 'CAREERS',
              href: 'https://www.recology.com/Careers',
            },
          },
        },
      },
      {
        name: 'About Us',
        link: {
          jsonValue: {
            value: {
              text: 'ABOUT US',
              href: '//www.recology.com//About-Us',
            },
          },
        },
      },
      {
        name: 'Sustainability',
        link: {
          jsonValue: {
            value: {
              text: '',
              id: '{BE481733-EFC0-4D60-92D6-CF65057F0164}',
            },
          },
        },
      },
    ]);

    expect(links).toEqual([
      { text: 'ABOUT US', href: '/About-Us' },
      { text: 'Sustainability', href: '/Sustainability' },
      { text: 'CAREERS', href: '/Careers' },
    ]);
  });
});