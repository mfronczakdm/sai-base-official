import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestPanel from '@/demo/GuestPanel';
import { identifyDemoGuest, reloadPage } from '@/demo/identify-demo-guest';

const mockUseSitecore = jest.fn();

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  useSitecore: () => mockUseSitecore(),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/Events/The-ASHA-Convention',
}));

jest.mock('@/demo/identify-demo-guest', () => ({
  identifyDemoGuest: jest.fn().mockResolvedValue(undefined),
  reloadPage: jest.fn(),
}));

describe('GuestPanel', () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEMO_GUEST_PANEL;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('opens the imported guest story and identifies the selected email', async () => {
    const user = userEvent.setup();

    render(<GuestPanel />);

    await user.click(await screen.findByTestId('demo-guest-tab'));

    expect(screen.getByRole('heading', { name: 'Tealium Data Shared with Sitecore' })).toBeInTheDocument();
    expect(screen.getByTestId('demo-guest-learning')).toHaveTextContent('convention interest');

    await user.click(screen.getByRole('button', { name: /Marcus Hale/ }));

    await waitFor(() => {
      expect(identifyDemoGuest).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'marcus.hale@example.com' })
      );
    });
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBe('marcus.hale@example.com');
    expect(reloadPage).toHaveBeenCalled();
  });

  it('shows the selected guest on the page after reload', async () => {
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');

    render(<GuestPanel />);

    const banner = await screen.findByTestId('demo-guest-banner');

    expect(banner).toHaveTextContent('Audiologist');
    expect(banner).toHaveTextContent('Subscriber');
    expect(banner).toHaveTextContent('Hearing Aids & Cochlear Implants');
    expect(banner).toHaveTextContent('convention interest');
    expect(screen.getByTestId('demo-guest-tab')).toHaveTextContent('Omar');
  });

  it('logs out of the current guest and returns the browser to anonymous', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');
    window.sessionStorage.setItem('asha-demo-visit-trail', JSON.stringify(['/Events']));
    document.cookie = 'sc_cid=known-browser';

    render(<GuestPanel />);

    await user.click(await screen.findByTestId('demo-guest-logout'));

    await waitFor(() => {
      expect(reloadPage).toHaveBeenCalled();
    });
    expect(identifyDemoGuest).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('asha-demo-guest-email')).toBeNull();
    expect(window.sessionStorage.getItem('asha-demo-visit-trail')).toBeNull();
    expect(document.cookie).not.toContain('sc_cid=known-browser');
  });
});
