import React from 'react';
import { render, screen } from '@testing-library/react';
import { Default, ImageCards } from '@/components/uiim/news/NewsListing';
import type { NewsListingProps } from '@/components/uiim/news/news-listing.props';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field }: { field?: { value?: string } }) => {
    if (!field?.value) return null;
    return <span>{field.value}</span>;
  },
}));

const article = (
  id: string,
  title: string,
  href: string,
  options?: { accent?: boolean; summary?: string; imageField?: 'image' | 'pageThumbnail' }
) => {
  const imageValue = {
    jsonValue: { value: { src: `https://www.recology.com/news/${id}.png`, alt: title } },
  };
  return {
    id,
    name: id,
    url: { path: `/News/${id}` },
    pageTitle: { jsonValue: { value: title } },
    pageSummary: { jsonValue: { value: options?.summary || `${title} summary for the card.` } },
    ...(options?.imageField === 'pageThumbnail'
      ? { pageThumbnail: imageValue }
      : { image: imageValue }),
    sourceLink: { jsonValue: { value: { href, text: title } } },
    titleAccent: { jsonValue: { value: options?.accent ? '1' : '' } },
  };
};

const props: NewsListingProps = {
  rendering: { componentName: 'NewsListing' },
  page: mockPage,
  params: { styles: 'news-band', RenderingIdentifier: 'recology-news' },
  fields: {
    data: {
      datasource: {
        title: { jsonValue: { value: 'News' } },
        link: {
          jsonValue: {
            value: { href: '/News', text: 'Read More News' },
          },
        },
        articles: {
          targetItems: [
            article('tahoe', 'Recology to Acquire Tahoe Truckee Sierra Disposal', '/News/tahoe', {
              summary:
                'Employee-owned resource recovery company, Recology Inc., and Tahoe Truckee Disposal Co., Inc. jointly announce a definitive purchase agreement for Recology to acquire TTDC.',
            }),
            article(
              'sustainability',
              'Recology Hits 2028 Sustainability Target Three Years Early',
              '/News/sustainability'
            ),
            article('nwra', '2026 NWRA Award Winners', '/News/nwra', { accent: true }),
          ],
        },
      },
    },
  },
};

describe('NewsListing', () => {
  it('renders the compact Default grid', () => {
    render(<Default {...props} />);

    const listing = screen.getByTestId('news-listing');
    expect(listing).toHaveAttribute('data-variant', 'default');
    expect(listing).toHaveAttribute('id', 'recology-news');
    expect(screen.getByRole('heading', { name: 'News' })).toHaveClass('border-secondary');
    expect(screen.getAllByTestId('news-listing-card')).toHaveLength(3);
  });

  it('renders ImageCards with images, truncated summaries, and Read More CTA', () => {
    render(<ImageCards {...props} />);

    const listing = screen.getByTestId('news-listing');
    expect(listing).toHaveAttribute('data-variant', 'image-cards');
    expect(screen.getByRole('heading', { name: 'News' })).toHaveClass('text-2xl');

    const cards = screen.getAllByTestId('news-listing-image-card');
    expect(cards).toHaveLength(3);
    expect(cards[0].querySelector('img')).toHaveAttribute(
      'src',
      'https://www.recology.com/news/tahoe.png'
    );
    expect(cards[0].textContent).toMatch(/\[\.+\.\.\]/);
    expect(screen.getByTestId('news-listing-more')).toHaveAttribute('href', '/News');
    expect(screen.getByTestId('news-listing-more')).toHaveTextContent('Read More News');
  });

  it('lists child articles when a News page is the datasource', () => {
    const childProps: NewsListingProps = {
      rendering: { componentName: 'NewsListing' },
      page: mockPage,
      params: {},
      fields: {
        data: {
          datasource: {
            title: { jsonValue: { value: 'All Recology News' } },
            children: {
              results: [
                article(
                  'coat-drive',
                  'Donate Coats to our 30th Annual Winter Coat Drive',
                  '/News/coat-drive',
                  { imageField: 'pageThumbnail' }
                ),
              ],
            },
          },
        },
      },
    };

    render(<Default {...childProps} />);

    expect(screen.getByRole('heading', { name: 'NEWS' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Winter Coat Drive/i })).toHaveAttribute(
      'href',
      '/News/coat-drive'
    );
  });

  it('asks for a datasource when fields are missing', () => {
    render(<ImageCards rendering={{ componentName: 'NewsListing' }} page={mockPage} params={{}} />);

    expect(screen.getByText(/News Listing/i)).toBeInTheDocument();
    expect(screen.queryByTestId('news-listing')).not.toBeInTheDocument();
  });
});
