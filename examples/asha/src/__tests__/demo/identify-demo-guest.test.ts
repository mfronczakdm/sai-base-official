import { identifyDemoGuest } from '@/demo/identify-demo-guest';
import type { DemoGuest } from '@/demo/demo-guests';

const nora: DemoGuest = {
  email: 'nora.kim.09@example.com',
  firstName: 'Nora',
  lastName: 'Kim',
  profession: 'Speech-Language Pathologist',
  certificationStatus: 'Certificate holder',
  caseloadSize: 'Under 20',
  primaryInterest: 'Literacy',
  seasonalCampaign: '2027 Dues Renewal',
  engagementLevel: 'High',
};

describe('identifyDemoGuest', () => {
  const originalContext = process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
  const originalSite = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID = 'edge-context';
    process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME = 'asha';
    document.cookie = 'sc_cid=d248c83c-7a65-4d8b-94ea-06fa3e22818c; Path=/';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID = originalContext;
    process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME = originalSite;
  });

  it('identifies the current browser before personalization reloads', async () => {
    await identifyDemoGuest(nora);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://edge-platform.sitecorecloud.io/v1/events/v1.2/events?siteId=asha',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-sitecore-contextid': 'edge-context',
        }),
      })
    );

    const body = JSON.parse(
      (jest.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string
    );

    expect(body).toEqual(
      expect.objectContaining({
        type: 'IDENTITY',
        browser_id: 'd248c83c-7a65-4d8b-94ea-06fa3e22818c',
        email: 'nora.kim.09@example.com',
        firstname: 'Nora',
        lastname: 'Kim',
        identifiers: [{ id: 'nora.kim.09@example.com', provider: 'email' }],
      })
    );
  });
});
