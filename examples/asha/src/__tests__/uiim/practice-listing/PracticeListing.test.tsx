import { render, screen, waitFor } from '@testing-library/react';
import { Cards, Default } from '@/components/uiim/practice-listing/PracticeListing';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  useSitecore: () => ({ page: { mode: { isEditing: false } } }),
  Text: ({ field, tag: Tag = 'span' }: { field?: { value?: string }; tag?: string }) => {
    const Element = Tag as 'span';
    return <Element>{field?.value}</Element>;
  },
}));

const topics = [
  {
    id: 'public',
    title: 'Accent Modification',
    href: '/Practice-Management/Practice-Portal/Professional-Issues/Accent-Modification',
    summary: 'Public topic',
    access: ['Public'],
  },
  {
    id: 'member',
    title: 'Clinical Education and Supervision',
    href: '/Practice-Management/Practice-Portal/Professional-Issues/Clinical-Education-and-Supervision',
    summary: 'Members only',
    access: ['Member-only'],
  },
];

const props = {
  rendering: { componentName: 'PracticeListing' },
  params: { RenderingIdentifier: 'practice-listing' },
  page: mockPage,
  fields: { Title: { value: 'Practice topics' } },
};

describe('PracticeListing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ topics }),
    }) as jest.Mock;
  });

  it('shows only public topics when no profile is selected', async () => {
    render(<Default {...props} />);

    expect(await screen.findByRole('link', { name: 'Accent Modification' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Clinical Education and Supervision' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('practice-listing-status')).toHaveTextContent('Showing public topics');
  });

  it('adds member-only topics for a member-only profile', async () => {
    window.localStorage.setItem('asha-demo-guest-email', 'amina.farouk.01@example.com');

    render(<Default {...props} />);

    expect(await screen.findByRole('link', { name: 'Accent Modification' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Clinical Education and Supervision' })).toBeInTheDocument();
    expect(screen.getByTestId('practice-listing-status')).toHaveTextContent('Showing topics for Member-only');
  });

  it('applies a newly chosen profile without a fresh document', async () => {
    render(<Default {...props} />);

    expect(await screen.findByTestId('practice-listing-status')).toHaveTextContent('Showing public topics');

    window.localStorage.setItem('asha-demo-guest-email', 'amina.farouk.01@example.com');
    window.dispatchEvent(new Event('asha-demo-guest-changed'));

    expect(await screen.findByRole('link', { name: 'Clinical Education and Supervision' })).toBeInTheDocument();
    expect(screen.getByTestId('practice-listing-status')).toHaveTextContent('Showing topics for Member-only');
  });

  it('renders the card variant', async () => {
    render(<Cards {...props} />);

    expect(await screen.findByTestId('practice-listing')).toHaveAttribute('data-variant', 'cards');
    expect(await screen.findByRole('link', { name: 'Accent Modification' })).toBeInTheDocument();
  });
});
