import { fetchLocationNavFromEdge } from '@/lib/location-nav-from-edge';

jest.mock('@/lib/sitecore-client', () => ({
  __esModule: true,
  default: {
    getData: jest.fn(),
  },
}));

jest.mock('sitecore.config', () => ({
  __esModule: true,
  default: { defaultLanguage: 'en', defaultSite: 'recology' },
}));

const client = require('@/lib/sitecore-client').default;

describe('fetchLocationNavFromEdge', () => {
  beforeEach(() => {
    client.getData.mockReset();
  });

  it('returns null when itemId is empty', async () => {
    await expect(fetchLocationNavFromEdge('')).resolves.toBeNull();
    expect(client.getData).not.toHaveBeenCalled();
  });

  it('maps LocationItem children into dropdown sections', async () => {
    client.getData.mockResolvedValue({
      item: {
        id: 'loc',
        name: 'Recology American Canyon',
        displayName: 'Recology American Canyon',
        template: { id: '{F38AF42C-AC5C-41AC-9E7A-5BFA2DEF4E66}', name: 'LocationItem' },
        url: { path: '/Location/Recology-American-Canyon' },
        children: {
          results: [
            {
              name: 'All Services',
              displayName: 'All Services',
              url: { path: '/Location/Recology-American-Canyon/All-Services' },
              children: {
                results: [
                  {
                    name: 'Your Cart',
                    displayName: 'Your Cart',
                    url: { path: '/Location/Recology-American-Canyon/All-Services/Your-Cart' },
                  },
                ],
              },
            },
            {
              name: 'Customer Service',
              displayName: 'Customer Service',
              url: { path: '/Location/Recology-American-Canyon/Customer-Service' },
              children: {
                results: [
                  {
                    name: 'FAQ',
                    displayName: 'FAQ',
                    url: { path: '/Location/Recology-American-Canyon/Customer-Service/FAQ' },
                  },
                ],
              },
            },
          ],
        },
        ancestors: [],
      },
    });

    const nav = await fetchLocationNavFromEdge('f013bb48-b6cd-4824-8cd9-c69eec056724');

    expect(nav?.locationLabel).toBe('Recology American Canyon');
    expect(nav?.sections).toHaveLength(2);
    expect(nav?.sections[0].title).toBe('All Services');
    expect(nav?.sections[0].children[0].title).toBe('Your Cart');
    expect(nav?.sections[1].children[0].href).toContain('FAQ');
  });

  it('walks ancestors when the current page is a child of a LocationItem', async () => {
    client.getData.mockResolvedValue({
      item: {
        id: 'child',
        name: 'FAQ',
        displayName: 'FAQ',
        template: { id: '4cfdba63', name: 'Page' },
        url: { path: '/Location/Recology-American-Canyon/Customer-Service/FAQ' },
        children: { results: [] },
        ancestors: [
          {
            id: 'loc',
            name: 'Recology American Canyon',
            displayName: 'American Canyon',
            template: { id: 'f38af42cac5c41ac9e7a5bfa2def4e66', name: 'LocationItem' },
            url: { path: '/Location/Recology-American-Canyon' },
            children: {
              results: [
                {
                  name: 'Helpful Resources',
                  displayName: 'Helpful Resources',
                  url: { path: '/Location/Recology-American-Canyon/Helpful-Resources' },
                  children: { results: [] },
                },
              ],
            },
          },
        ],
      },
    });

    const nav = await fetchLocationNavFromEdge('35a9251b-a9de-42f8-86fc-d081ff1473ea');

    expect(nav?.locationLabel).toBe('American Canyon');
    expect(nav?.sections[0].title).toBe('Helpful Resources');
    expect(nav?.sections[0].children).toEqual([]);
  });
});
