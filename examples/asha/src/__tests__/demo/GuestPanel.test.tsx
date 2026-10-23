import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestPanel from '@/demo/GuestPanel';
import { identifyDemoGuest, hardReloadPage } from '@/demo/identify-demo-guest';

const mockUseSitecore = jest.fn();

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  useSitecore: () => mockUseSitecore(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/Events/The-ASHA-Convention',
}));

jest.mock('@/demo/identify-demo-guest', () => ({
  identifyDemoGuest: jest.fn().mockResolvedValue(undefined),
  hardReloadPage: jest.fn(),
}));

describe('GuestPanel', () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEMO_GUEST_PANEL;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(identifyDemoGuest).mockResolvedValue(undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ affinities: [] }),
    });
    window.localStorage.clear();
    window.sessionStorage.clear();
    process.env.NEXT_PUBLIC_DEMO_GUEST_PANEL = 'true';
    mockUseSitecore.mockReturnValue({ page: { mode: { isNormal: true } } });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_GUEST_PANEL = originalEnv;
  });

  it('stays hidden outside a normal page', async () => {
    mockUseSitecore.mockReturnValue({ page: { mode: { isNormal: false } } });

    render(<GuestPanel />);

    await waitFor(() => {
      expect(screen.queryByTestId('demo-guest-tab')).not.toBeInTheDocument();
    });
  });

  it('starts anonymous even when a guest was stored in an earlier session', async () => {
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');

    render(<GuestPanel />);

    expect(await screen.findByTestId('demo-guest-tab')).toHaveTextContent('Guest');
    expect(screen.queryByTestId('demo-guest-banner')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBeNull();
  });

  it('offers the four known guests and hard-refreshes after one is chosen', async () => {
    const user = userEvent.setup();

    render(<GuestPanel />);

    await user.click(await screen.findByTestId('demo-guest-tab'));

    expect(screen.getByRole('heading', { name: 'Tealium Data Shared with Sitecore' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Julian Rossi/ })).toHaveTextContent('Student');
    expect(screen.getByRole('button', { name: /Julian Rossi/ })).toHaveTextContent('Public');
    expect(screen.getByRole('button', { name: /Lila Moreau/ })).toHaveTextContent('Member-only');
    expect(screen.getByRole('button', { name: /Nora Kim/ })).toHaveTextContent('Certificate holder');
    expect(screen.getByRole('button', { name: /Omar Haddad/ })).toHaveTextContent('Subscriber');
    expect(screen.queryByRole('button', { name: /More guests/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcus Hale/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Julian Rossi/ }));

    await waitFor(() => {
      expect(identifyDemoGuest).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'julian.rossi.39@example.com',
          profession: 'Student',
          certificationStatus: 'Public',
        })
      );
    });
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBe('julian.rossi.39@example.com');
    expect(window.sessionStorage.getItem('asha-demo-guest-bound')).toBe('1');
    expect(hardReloadPage).toHaveBeenCalled();
  });

  it('reloads after the identity event settles so personalization sees that guest', async () => {
    const user = userEvent.setup();
    let finishIdentity: () => void = () => undefined;
    jest.mocked(identifyDemoGuest).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishIdentity = resolve;
        })
    );

    render(<GuestPanel />);

    await user.click(await screen.findByTestId('demo-guest-tab'));
    await user.click(screen.getByRole('button', { name: /Nora Kim/ }));

    expect(hardReloadPage).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBe('nora.kim.09@example.com');

    finishIdentity();

    await waitFor(() => {
      expect(hardReloadPage).toHaveBeenCalled();
    });
  });

  it('shows the selected guest on the page after the hard refresh', async () => {
    window.sessionStorage.setItem('asha-demo-guest-bound', '1');
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');

    render(<GuestPanel />);

    const banner = await screen.findByTestId('demo-guest-banner');

    expect(banner).toHaveTextContent('Audiologist');
    expect(banner).toHaveTextContent('Subscriber');
    expect(banner).toHaveTextContent('Top affinities');
    expect(await screen.findByText(/Sitecore has not returned affinity scores/)).toBeInTheDocument();
    expect(screen.getByTestId('demo-guest-tab')).toHaveTextContent('Omar');
  });

  it('shows Sitecore affinity views and score for the selected guest', async () => {
    window.sessionStorage.setItem('asha-demo-guest-bound', '1');
    window.localStorage.setItem('asha-demo-guest-email', 'nora.kim.09@example.com');
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        affinities: [{ name: 'clinical_topic', value: 'Audiology', views: 2, score: 1 }],
      }),
    } as Response);

    render(<GuestPanel />);

    expect(await screen.findByText('Audiology')).toBeInTheDocument();
    const scores = screen.getByTestId('demo-guest-affinities');

    expect(scores).toHaveTextContent('Affinity');
    expect(scores).toHaveTextContent('Views');
    expect(scores).toHaveTextContent('Score');
    expect(scores).toHaveTextContent('clinical_topic');
    expect(scores).toHaveTextContent('Audiology');
    expect(scores).toHaveTextContent('2');
    expect(scores).toHaveTextContent('1.00');
  });

  it('logs out of the current guest and returns the browser to anonymous', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('asha-demo-guest-bound', '1');
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');
    window.sessionStorage.setItem('asha-demo-visit-trail', JSON.stringify(['/Events']));
    document.cookie = 'sc_cid=known-browser';

    render(<GuestPanel />);

    await user.click(await screen.findByTestId('demo-guest-logout'));

    await waitFor(() => {
      expect(hardReloadPage).toHaveBeenCalled();
    });
    expect(identifyDemoGuest).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBeNull();
    expect(window.sessionStorage.getItem('asha-demo-guest-bound')).toBeNull();
    expect(window.sessionStorage.getItem('asha-demo-visit-trail')).toBeNull();
    expect(document.cookie).not.toContain('sc_cid=known-browser');
  });
});
