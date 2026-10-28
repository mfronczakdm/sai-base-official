/* eslint-disable */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LocationRegionalNav, clearLocationNavMemoryCache } from '../../components/site-three/LocationRegionalNav';

jest.mock('lucide-react', () => ({
  ChevronDown: (props: any) => <svg data-testid="chevron-down" {...props} />,
}));

const mockNav = {
  locationLabel: 'Recology American Canyon',
  locationHref: '/Location/Recology-American-Canyon',
  sections: [
    {
      name: 'Customer Service',
      title: 'Customer Service',
      href: '/Location/Recology-American-Canyon/Customer-Service',
      children: [
        {
          name: 'FAQ',
          title: 'FAQ',
          href: '/Location/Recology-American-Canyon/Customer-Service/FAQ',
        },
      ],
    },
    {
      name: 'Helpful Resources',
      title: 'Helpful Resources',
      href: '/Location/Recology-American-Canyon/Helpful-Resources',
      children: [
        {
          name: 'Sorting Guides and Resources',
          title: 'Sorting Guides & Resources',
          href: '/Location/Recology-American-Canyon/Helpful-Resources/Sorting-Guides-and-Resources',
        },
        {
          name: 'What Bin',
          title: 'What Bin',
          href: '/Location/Recology-American-Canyon/Helpful-Resources/What-Bin',
        },
      ],
    },
  ],
};

describe('LocationRegionalNav', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
    window.sessionStorage.clear();
    clearLocationNavMemoryCache();
  });

  it('renders nothing while empty or without itemId', () => {
    const { container } = render(<LocationRegionalNav />);
    expect(container).toBeEmptyDOMElement();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('loads sections from /api/location-nav and opens child dropdowns', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockNav,
    });

    render(<LocationRegionalNav itemId="f013bb48-b6cd-4824-8cd9-c69eec056724" />);

    await waitFor(() => {
      expect(screen.getByTestId('location-regional-nav')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/location-nav?itemId=f013bb48-b6cd-4824-8cd9-c69eec056724')
    );

    const helpful = screen.getByRole('button', { name: /Helpful Resources/i });
    expect(helpful.className).toMatch(/uppercase/);
    expect(helpful.className).toMatch(/text-primary/);

    fireEvent.click(helpful);

    expect(screen.getByRole('menuitem', { name: 'Sorting Guides & Resources' })).toHaveAttribute(
      'href',
      '/Location/Recology-American-Canyon/Helpful-Resources/Sorting-Guides-and-Resources'
    );
    expect(screen.getByRole('menuitem', { name: 'What Bin' })).toBeInTheDocument();
  });

  it('shows the stored menu on the next page without fetching again', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockNav,
    });

    const { unmount } = render(
      <LocationRegionalNav itemId="f013bb48-b6cd-4824-8cd9-c69eec056724" />
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-regional-nav')).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();
    clearLocationNavMemoryCache();
    (global.fetch as jest.Mock).mockClear();

    render(<LocationRegionalNav itemId="f013bb48-b6cd-4824-8cd9-c69eec056724" />);

    expect(screen.getByRole('button', { name: /Customer Service/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Helpful Resources/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
