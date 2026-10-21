import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Default as SearchResults } from '@/components/uiim/search/SearchResults';

const payload = {
  data: {
    search: {
      pageInfo: { hasNext: false, endCursor: null },
      results: [
        {
          id: '1',
          name: 'AAC Overview',
          url: { path: '/Publications/AAC' },
          pageTitle: { value: 'Augmentative and Alternative Communication' },
          pageSummary: { value: 'AAC strategies for speech-language pathologists.' },
          updated: { value: '20260301T000000Z' },
        },
        {
          id: '2',
          name: 'Hearing Aids',
          url: { path: '/Audiology/Hearing-Aids' },
          pageTitle: { value: 'Hearing Aids' },
          pageSummary: { value: 'Fitting guidance for audiologists.' },
          updated: { value: '20250101T000000Z' },
        },
      ],
    },
  },
};

describe('SearchResults', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: payload.data.search.results,
      }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists published pages and filters them by the search box', async () => {
    const user = userEvent.setup();
    render(<SearchResults fields={{ Title: { value: 'ASHA Website Search' } }} />);

    expect(await screen.findByRole('link', { name: 'Hearing Aids' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Augmentative and Alternative Communication' })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search ASHA'), 'hearing');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByTestId('search-results-summary')).toHaveTextContent('for hearing');
    });
    expect(screen.getByRole('link', { name: 'Hearing Aids' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Augmentative and Alternative Communication' })
    ).not.toBeInTheDocument();
  });
});
