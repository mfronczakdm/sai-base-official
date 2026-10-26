import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Default } from '@/components/uiim/faq/RegionalFAQ';
import type { RegionalFaqProps } from '@/components/uiim/faq/regional-faq.props';
import { mockPage, mockPageEditing } from '../../test-utils/mockPage';

jest.mock('lucide-react', () => ({
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
}));

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field }: { field?: { value?: string } }) => <span>{field?.value}</span>,
  RichText: ({ field }: { field?: { value?: string } }) => (
    <div dangerouslySetInnerHTML={{ __html: field?.value || '' }} />
  ),
  Link: ({ field }: { field?: { value?: { href?: string; text?: string } } }) => (
    <a href={field?.value?.href}>{field?.value?.text || field?.value?.href}</a>
  ),
}));

const text = (value: string) => ({ jsonValue: { value } });
const rich = (value: string) => ({ jsonValue: { value } });

const baseProps: RegionalFaqProps = {
  rendering: { componentName: 'RegionalFAQ' },
  page: mockPage,
  params: { styles: 'faq-block' },
  fields: {
    data: {
      datasource: {
        heading: text('Frequently Asked Questions'),
        introductoryText: rich('<p>Region FAQ intro.</p>'),
        expandFirstItem: text('1'),
        faqConfigurations: {
          targetItems: [
            {
              id: 'sf-missed',
              behavior: text('AddRegionalInformation'),
              active: text('1'),
              sortOrder: text('110'),
              regionalSupportingInformation: rich('<p>SF supporting info.</p>'),
              globalFaq: {
                targetItems: [
                  {
                    id: 'global-missed',
                    question: text('How do I report a missed pickup?'),
                    answer: rich('<p>Global missed pickup answer.</p>'),
                    category: text('Collection'),
                    sortOrder: text('110'),
                    active: text('1'),
                  },
                ],
              },
            },
            {
              id: 'excluded',
              behavior: text('Exclude'),
              active: text('1'),
              globalFaq: {
                targetItems: [
                  {
                    id: 'global-haz',
                    question: text('What should I do with hazardous materials?'),
                    answer: rich('<p>Hazardous guidance.</p>'),
                    active: text('1'),
                  },
                ],
              },
            },
            {
              id: 'portland',
              behavior: text('Override'),
              active: text('1'),
              sortOrder: text('120'),
              regionalAnswer: rich('<p>Portland override answer.</p>'),
              globalFaq: {
                targetItems: [
                  {
                    id: 'global-missed-2',
                    question: text('How do holiday schedules work?'),
                    answer: rich('<p>Global holiday answer.</p>'),
                    active: text('1'),
                  },
                ],
              },
            },
          ],
        },
      },
    },
  },
};

describe('RegionalFAQ', () => {
  it('renders accordion items and excludes Exclude behavior', () => {
    render(<Default {...baseProps} />);

    expect(screen.getByTestId('regional-faq')).toBeInTheDocument();
    expect(screen.getByText('How do I report a missed pickup?')).toBeInTheDocument();
    expect(screen.queryByText('What should I do with hazardous materials?')).not.toBeInTheDocument();
    expect(screen.getByTestId('regional-faq-supporting')).toHaveTextContent('SF supporting info');

    const overrideButton = screen.getByRole('button', { name: /How do holiday schedules work/i });
    fireEvent.click(overrideButton);
    expect(screen.getByText('Portland override answer.')).toBeInTheDocument();
    expect(screen.queryByText('Global holiday answer.')).not.toBeInTheDocument();
  });

  it('toggles aria-expanded on accordion buttons', () => {
    render(
      <Default
        {...baseProps}
        fields={{
          data: {
            datasource: {
              ...baseProps.fields?.data?.datasource,
              expandFirstItem: text(''),
            },
          },
        }}
      />
    );

    const button = screen.getByRole('button', { name: /How do I report a missed pickup/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows editor placeholder only in editing mode when empty', () => {
    render(
      <Default
        {...baseProps}
        page={mockPageEditing}
        fields={{ data: { datasource: { heading: text('FAQs'), faqConfigurations: { targetItems: [] } } } }}
      />
    );

    expect(screen.getByTestId('regional-faq-editor-empty')).toBeInTheDocument();
  });
});
