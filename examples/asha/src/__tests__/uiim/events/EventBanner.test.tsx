import React from 'react';
import { render, screen } from '@testing-library/react';
import { Default, ImageLeft, ImageRight } from '@/components/uiim/events/EventBanner';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field }: { field?: { value?: string } }) => (field?.value ? <span>{field.value}</span> : null),
  Image: ({ field, className }: { field?: { value?: { src?: string; alt?: string } }; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={field?.value?.src || ''} alt={field?.value?.alt || ''} className={className} />
  ),
  Link: ({ field, children, className }: { field?: { value?: { href?: string; text?: string } }; children?: React.ReactNode; className?: string }) => (
    <a href={field?.value?.href || '#'} className={className}>
      {children || field?.value?.text}
    </a>
  ),
}));

const event = {
  eventName: { jsonValue: { value: 'ASHA Fall Virtual Career Fair' } },
  eventPlace: { jsonValue: { value: 'Virtual' } },
  eventDescription: { jsonValue: { value: 'October 7, 2026, 6–8:30 p.m. ET. Virtual event, not available for ASHA CEUs.' } },
  eventStart: { value: '20261007T180000Z' },
  eventEnd: { value: '20261007T203000Z' },
  eventLink: { jsonValue: { value: { href: 'https://www.asha.org/events/career-fair/', text: '' } } },
  eventImage: {
    jsonValue: { value: { src: '/-/media/career-fair.webp', alt: 'Career fair' } },
  },
};

const props = {
  rendering: { componentName: 'EventBanner' },
  page: mockPage,
  params: { RenderingIdentifier: 'career-fair-banner' },
  fields: { data: { datasource: event } },
};

describe('EventBanner', () => {
  it('puts the image on the left by default and shows the event details', () => {
    render(<Default {...props} />);

    const banner = screen.getByTestId('event-banner');
    expect(banner).toHaveAttribute('id', 'career-fair-banner');
    expect(banner.querySelector('[data-image-side="left"]')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Career fair' })).toHaveAttribute('src', '/-/media/career-fair.webp');
    expect(screen.getByRole('heading', { name: 'ASHA Fall Virtual Career Fair' })).toHaveStyle({ color: '#00778B' });
    expect(screen.getByText('Virtual · October 7, 2026 · 6–8:30 p.m.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', 'https://www.asha.org/events/career-fair/');
  });

  it('moves the image to the right for ImageRight', () => {
    render(<ImageRight {...props} />);

    const layout = screen.getByTestId('event-banner').querySelector('[data-image-side="right"]');
    expect(layout?.firstElementChild).toHaveClass('order-2');
  });

  it('keeps ImageLeft on the left', () => {
    render(<ImageLeft {...props} />);
    expect(screen.getByTestId('event-banner').querySelector('[data-image-side="left"]')?.firstElementChild).not.toHaveClass('order-2');
  });

  it('reads the standard Calendar Event fields when the layout has no query result', () => {
    render(
      <Default
        rendering={{ componentName: 'EventBanner' }}
        page={mockPage}
        params={{}}
        fields={{
          EventName: { value: 'New CPT Code Workshop for Speech-Language Pathologists' },
          EventPlace: { value: 'Indianapolis, IN' },
          EventDescription: { value: 'November 18, 2026 from 5:30–7:30 p.m. ET. Not available for ASHA CEUs.' },
          EventStart: { value: '20261118T173000Z' },
          EventEnd: { value: '20261118T193000Z' },
          eventImage: { value: { src: '/-/media/workshop.webp', alt: 'Workshop' } },
        }}
      />,
    );

    expect(screen.queryByText(/requires a datasource/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'New CPT Code Workshop for Speech-Language Pathologists' })).toBeInTheDocument();
    expect(screen.getByText('Indianapolis, IN · November 18, 2026 · 5:30–7:30 p.m.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Workshop' })).toHaveAttribute('src', '/-/media/workshop.webp');
  });
});
