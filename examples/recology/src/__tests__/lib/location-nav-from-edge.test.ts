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
    client.getData
      // resolve
      .mockResolvedValueOnce({
        item: {
          id: 'f013bb48-b6cd-4824-8cd9-c69eec056724',
          name: 'Recology American Canyon',
          displayName: 'Recology American Canyon',
          template: { id: '{F38AF42C-AC5C-41AC-9E7A-5BFA2DEF4E66}', name: 'LocationItem' },
          url: { path: '/Location/Recology-American-Canyon' },
          ancestors: [],
        },
      })
      // L1
      .mockResolvedValueOnce({
        item: {
          id: 'f013bb48-b6cd-4824-8cd9-c69eec056724',
          name: 'Recology American Canyon',
          displayName: 'Recology American Canyon',
          url: { path: '/Location/Recology-American-Canyon' },
          children: {
            results: [
              {
                id: 'all-services',
                name: 'All Services',
                displayName: 'All Services',
                url: { path: '/Location/Recology-American-Canyon/All-Services' },
              },
              {
                id: 'customer-service',
                name: 'Customer Service',
                displayName: 'Customer Service',
                url: { path: '/Location/Recology-American-Canyon/Customer-Service' },
              },
            ],
          },
        },
      })
      // L2 for Customer Service (sorted first)
      .mockResolvedValueOnce({
        item: {
          id: 'customer-service',
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
      })
      // L2 for All Services
      .mockResolvedValueOnce({
        item: {
          id: 'all-services',
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
      });

    const nav = await fetchLocationNavFromEdge('f013bb48-b6cd-4824-8cd9-c69eec056724');

    expect(nav?.locationLabel).toBe('Recology American Canyon');
    expect(nav?.sections).toHaveLength(2);
    expect(nav?.sections[0].title).toBe('Customer Service');
    expect(nav?.sections[0].children[0].href).toContain('FAQ');
    expect(nav?.sections[1].title).toBe('All Services');
    expect(nav?.sections[1].children[0].title).toBe('Your Cart');
    expect(client.getData).toHaveBeenCalledTimes(4);
  });

  it('walks ancestors when the current page is a child of a LocationItem', async () => {
    client.getData
      .mockResolvedValueOnce({
        item: {
          id: 'child',
          name: 'FAQ',
          displayName: 'FAQ',
          template: { id: '4cfdba63', name: 'Page' },
          url: { path: '/Location/Recology-American-Canyon/Customer-Service/FAQ' },
          ancestors: [
            {
              id: 'loc-id',
              name: 'Recology American Canyon',
              displayName: 'American Canyon',
              template: { id: 'f38af42cac5c41ac9e7a5bfa2def4e66', name: 'LocationItem' },
              url: { path: '/Location/Recology-American-Canyon' },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        item: {
          id: 'loc-id',
          name: 'Recology American Canyon',
          displayName: 'American Canyon',
          url: { path: '/Location/Recology-American-Canyon' },
          children: {
            results: [
              {
                id: 'helpful',
                name: 'Helpful Resources',
                displayName: 'Helpful Resources',
                url: { path: '/Location/Recology-American-Canyon/Helpful-Resources' },
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({
        item: {
          id: 'helpful',
          children: { results: [] },
        },
      });

    const nav = await fetchLocationNavFromEdge('35a9251b-a9de-42f8-86fc-d081ff1473ea');

    expect(nav?.locationLabel).toBe('American Canyon');
    expect(nav?.sections[0].title).toBe('Helpful Resources');
    expect(nav?.sections[0].children).toEqual([]);
  });
});
