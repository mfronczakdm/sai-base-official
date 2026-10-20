import React from 'react';
import { render, screen } from '@testing-library/react';
import { Default, formatSchedule } from '@/components/uiim/events/EventListing';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field }: { field?: { value?: string } }) => {
    if (!field?.value) return null;
    return <span>{field.value}</span>;
  },
}));

describe('formatSchedule', () => {
  it('keeps the stored clock time and shares one meridiem', () => {
    expect(formatSchedule('20261007T180000Z', '20261007T203000Z')).toBe('October 7, 2026 · 6–8:30 p.m.');
  });

  it('shows a date range when the event spans days', () => {
    expect(formatSchedule('20261112T000000Z', '20261114T000000Z')).toBe('November 12, 2026 – November 14, 2026');
  });
});

describe('EventListing', () => {
  it('renders selected event lists through their calendar event children', () => {
    render(
      <Default
        rendering={{ componentName: 'EventListing' }}
        page={mockPage}
        params={{ styles: 'event-band', RenderingIdentifier: 'asha-events' }}
        fields={{
          data: {
            datasource: {
              title: { jsonValue: { value: 'EVENTS' } },
              events: {
                targetItems: [
                  {
                    id: 'list-1',
                    title: { jsonValue: { value: 'ASHA Fall Virtual Career Fair' } },
                    children: {
                      results: [
                        {
                          id: 'event-1',
                          eventName: { jsonValue: { value: 'ASHA Fall Virtual Career Fair' } },
                          eventPlace: { jsonValue: { value: 'Virtual' } },
                          eventStart: { value: '20261007T180000Z' },
                          eventEnd: { value: '20261007T203000Z' },
                          eventLink: { jsonValue: { value: { href: 'https://www.asha.org/events/career-fair/' } } },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        }}
      />
    );

    const listing = screen.getByTestId('event-listing');
    expect(listing).toHaveAttribute('id', 'asha-events');
    expect(listing.querySelector('.grid')).toHaveClass('grid-cols-1', '@md:grid-cols-3', 'gap-5');
    expect(screen.getByRole('heading', { name: 'EVENTS' })).toHaveClass('border-[#991E66]');
    const card = screen.getByRole('link', { name: /ASHA Fall Virtual Career Fair/i });
    expect(card).toHaveAttribute('href', 'https://www.asha.org/events/career-fair/');
    expect(card).toHaveTextContent('Virtual');
    expect(card).toHaveTextContent('October 7, 2026 · 6–8:30 p.m.');
    expect(card.querySelector('h3')).toHaveStyle({ color: '#00778B' });
  });

  it('asks for events when none are selected', () => {
    render(
      <Default
        rendering={{ componentName: 'EventListing' }}
        page={mockPage}
        params={{}}
        fields={{ data: { datasource: { title: { jsonValue: { value: 'EVENTS' } }, events: { targetItems: [] } } } }}
      />
    );

    expect(screen.getByText('Select events from Data/Events.')).toBeInTheDocument();
  });
});
