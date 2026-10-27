import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Default as SearchResults } from '@/components/search-results/SearchResults';
import { mockPage } from '../test-utils/mockPage';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/Search',
  useSearchParams: () => new URLSearchParams(''),
}));

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field, tag: Tag = 'span', className }: any) =>
    field?.value ? <Tag className={className}>{field.value}</Tag> : null,
  useSitecore: () => ({
    page: {
      ...mockPage,
      layout: {
        sitecore: {
          context: { site: { name: 'recology' } },
          route: null,
        },
      },
    },
  }),
}));

jest.mock('lucide-react', () => ({
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  ChevronLeft: (props: any) => <svg data-testid="chevron-left" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="chevron-right" {...props} />,
}));

const props = {
  rendering: { componentName: 'SearchResults' },
  params: {},
  page: mockPage,
  fields: {
    Title: { value: 'Your Resource Hub' },
    Subtitle: { value: 'Find guides, services, locations, and answers across Recology.' },
    Placeholder: { value: 'Search Recology' },
    Prompt: { value: 'What are you looking for?' },
  },
} as any;

describe('SearchResults', () => {
  it('renders the hub hero and Recology catalog cards', () => {
    render(<SearchResults {...props} />);

    expect(screen.getByTestId('search-results')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your Resource Hub' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByText('Refine by')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it('filters results from the search box', () => {
    render(<SearchResults {...props} />);

    fireEvent.change(screen.getByLabelText('Search Recology'), { target: { value: 'compost' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(screen.getByRole('link', { name: 'Compost' })).toHaveAttribute(
      'href',
      '/Organics/Our-Products/Compost'
    );
    expect(screen.getAllByText(/compost/i).length).toBeGreaterThan(0);
  });

  it('shows a Q&A answer and San Bruno links for a natural-language moving query', () => {
    render(<SearchResults {...props} />);

    fireEvent.change(screen.getByLabelText('Search Recology'), {
      target: {
        value: 'I am moving to San Bruno area. What are my options for waste management',
      },
    });
    fireEvent.submit(screen.getByRole('search'));

    expect(screen.getByTestId('search-qa-answers')).toBeInTheDocument();
    expect(
      screen.getByText(/If you are moving to the San Bruno area, Recology San Bruno provides/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Recology San Bruno' })[0]
    ).toHaveAttribute('href', '/Location/Recology-San-Bruno');
    expect(
      screen.getAllByRole('link', { name: 'Your Three Carts' })[0]
    ).toHaveAttribute('href', '/Location/Recology-San-Bruno/All-Services/Your-Three-Carts');
    expect(
      screen.getAllByRole('link', {
        name: 'Moving to San Bruno? Your Waste Management Options',
      }).length
    ).toBeGreaterThanOrEqual(1);
  });
});

