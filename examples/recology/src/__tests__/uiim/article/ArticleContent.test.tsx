import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ComponentRendering, Page } from '@sitecore-content-sdk/nextjs';
import {
  Default as ArticleContent,
  NoImage as ArticleContentNoImage,
} from '@/components/uiim/article/ArticleContent';
import { mockPage, mockPageEditing } from '../../test-utils/mockPage';
import type { ArticleContentProps } from '@/components/uiim/article/article-content.props';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  RichText: ({ field }: { field?: { value?: string } }) => {
    if (!field?.value) return null;
    return <div data-testid="article-body" dangerouslySetInnerHTML={{ __html: field.value }} />;
  },
  Text: ({ field, tag: Tag = 'span' }: { field?: { value?: string }; tag?: string }) => {
    if (!field?.value) return null;
    return React.createElement(Tag, {}, field.value);
  },
  Image: ({ field }: { field?: { value?: { src?: string; alt?: string } } }) => {
    if (!field?.value?.src) return null;
    return <img src={field.value.src} alt={field.value.alt || ''} data-testid="article-sdk-image" />;
  },
}));

jest.mock('@/components/uiim/article/ArticleEngagement.client', () => ({
  ArticleEngagement: ({ title }: { title?: string }) => (
    <div data-testid="article-engagement">{title}</div>
  ),
}));

const rendering = { componentName: 'ArticleContent', uid: 'article-content-1' } as ComponentRendering;

const sampleFields = {
  pageShortTitle: { value: 'Stay cool summer checklist' },
  pageHeaderTitle: { value: 'Beat the heat with our stay cool summer checklist' },
  pageTitle: { value: 'Beat the heat with our stay cool summer checklist' },
  pageSubtitle: { value: 'Keep your home, garden, pets and vehicle cool this summer' },
  pageSummary: {
    value: 'When things start to heat up, we all love to get outside and enjoy those summer vibes.',
  },
  pageDisplayDate: { value: 'July 15, 2026' },
  pageReadTime: { value: '10 min' },
  image: {
    value: {
      src: 'https://www.recology.com/news/summer.jpg',
      alt: 'Summer checklist',
    },
  },
  Content: {
    value:
      '<p>When things start to heat up, staying chilled can be a lifesaver.</p><h3>How to keep your home cool</h3>',
  },
};

const pageWithFields = {
  ...mockPage,
  layout: {
    sitecore: {
      context: {},
      route: {
        name: 'Beat the heat summer checklist',
        fields: sampleFields,
      },
    },
  },
} as unknown as Page;

const defaultProps: ArticleContentProps = {
  rendering,
  params: {
    styles: 'article-content-styles',
    RenderingIdentifier: 'article-content-1',
    LikesAndShares: '1',
  },
  page: pageWithFields,
};

describe('ArticleContent', () => {
  it('renders header, summary, image, engagement, and body for Default', () => {
    render(<ArticleContent {...defaultProps} />);

    expect(screen.getByTestId('article-content')).toHaveAttribute('data-variant', 'default');
    expect(
      screen.getByRole('heading', { name: 'Beat the heat with our stay cool summer checklist' })
    ).toBeInTheDocument();
    expect(screen.getByText('Stay cool summer checklist')).toBeInTheDocument();
    expect(
      screen.getByText('Keep your home, garden, pets and vehicle cool this summer')
    ).toBeInTheDocument();
    expect(screen.getByText('July 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.queryByText('•')).not.toBeInTheDocument();
    expect(screen.getByTestId('article-content-image')).toBeInTheDocument();
    expect(screen.getByTestId('article-engagement')).toHaveTextContent(
      'Beat the heat with our stay cool summer checklist'
    );
    expect(screen.getByTestId('article-body').innerHTML).toContain('How to keep your home cool');
  });

  it('hides the feature image for NoImage', () => {
    render(<ArticleContentNoImage {...defaultProps} />);

    expect(screen.getByTestId('article-content')).toHaveAttribute('data-variant', 'no-image');
    expect(screen.queryByTestId('article-content-image')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Beat the heat with our stay cool summer checklist' })
    ).toBeInTheDocument();
  });

  it('does not render empty subtitle or orphaned meta separators', () => {
    const page = {
      ...pageWithFields,
      layout: {
        sitecore: {
          context: {},
          route: {
            fields: {
              ...sampleFields,
              pageSubtitle: { value: '' },
              pageDisplayDate: { value: '' },
              pageReadTime: { value: '' },
            },
          },
        },
      },
    } as unknown as Page;

    render(<ArticleContent {...defaultProps} page={page} />);

    expect(screen.queryByText('[No text in field]')).not.toBeInTheDocument();
    expect(screen.queryByText('•')).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('hides likes and shares when the advanced styling checkbox is off', () => {
    render(
      <ArticleContent
        {...defaultProps}
        params={{ ...defaultProps.params, LikesAndShares: '' }}
      />
    );

    expect(screen.queryByTestId('article-engagement')).not.toBeInTheDocument();
  });

  it('applies styles and rendering identifier', () => {
    const { container } = render(<ArticleContent {...defaultProps} />);
    const article = container.querySelector('[data-testid="article-content"]');
    expect(article).toHaveClass('article-content-styles');
    expect(article).toHaveAttribute('id', 'article-content-1');
  });

  it('falls back to pageTitle when header title is empty', () => {
    const page = {
      ...pageWithFields,
      layout: {
        sitecore: {
          context: {},
          route: {
            fields: {
              ...sampleFields,
              pageHeaderTitle: { value: '' },
              pageTitle: { value: 'Fallback title' },
            },
          },
        },
      },
    } as unknown as Page;

    render(<ArticleContent {...defaultProps} page={page} />);
    expect(screen.getByRole('heading', { name: 'Fallback title' })).toBeInTheDocument();
  });

  it('shows empty hint when route fields are missing', () => {
    render(<ArticleContent {...defaultProps} page={mockPage} />);
    expect(screen.getByText(/no page fields to display/i)).toBeInTheDocument();
  });

  it('keeps empty title and content visible while editing', () => {
    const page = {
      ...mockPageEditing,
      layout: {
        sitecore: {
          context: {},
          route: {
            fields: {
              pageHeaderTitle: { value: '' },
              Content: { value: '' },
            },
          },
        },
      },
    } as unknown as Page;

    const { container } = render(<ArticleContent {...defaultProps} page={page} />);
    expect(container.querySelector('[data-testid="article-content"]')).toBeInTheDocument();
  });
});
