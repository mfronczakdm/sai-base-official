import React from 'react';
import { render, screen } from '@testing-library/react';
import { Default } from '@/components/uiim/rates/RatesCartsDetail';
import type { RatesCartsDetailProps } from '@/components/uiim/rates/rates-carts-detail.props';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({
    field,
    tag: Tag = 'span',
  }: {
    field?: { value?: string };
    tag?: 'h2' | 'h3' | 'span';
  }) => {
    if (!field?.value) return null;
    return <Tag>{field.value}</Tag>;
  },
  RichText: ({ field }: { field?: { value?: string } }) => {
    if (!field?.value) return null;
    return <div dangerouslySetInnerHTML={{ __html: field.value }} />;
  },
}));

const textField = (value: string) => ({ jsonValue: { value } });
const richField = (value: string) => ({ jsonValue: { value } });

const props: RatesCartsDetailProps = {
  rendering: { componentName: 'RatesCartsDetail' },
  page: mockPage,
  params: { styles: 'rates-block', RenderingIdentifier: 'american-canyon-rates' },
  fields: {
    data: {
      contextItem: {
        id: 'page',
        name: 'Residential Rates',
        template: { name: 'Page' },
        parent: {
          id: 'location',
          name: 'Recology American Canyon',
          template: { name: 'LocationItem' },
          ratesHeading: textField('Residential Rates'),
          ratesIntro: richField(
            '<p>Recology provides weekly curbside collection for landfill, recyclables, and compost.</p>'
          ),
          importantNotes: richField('<p><strong>Important Notes</strong></p>'),
          careProgramHeading: textField('CARE Program for Residents'),
          careProgramContent: richField('<p>Eligible households may receive a 15% discount.</p>'),
          children: {
            results: [
              {
                id: 'cart-rates',
                name: 'Cart Rates',
                children: {
                  results: [
                    {
                      id: '32',
                      name: '32-Gal',
                      displayName: '32-Gal',
                      template: { name: 'LocationCartRate' },
                      monthlyRate: textField('$34.80'),
                      cartSize: {
                        targetItem: {
                          name: '32-Gallon',
                          description: textField(
                            'For approximately two (2) kitchen-sized garbage bags per week.'
                          ),
                          dimensions: textField('25″L x 20″W x 39″H'),
                        },
                      },
                    },
                    {
                      id: 'lifeline-32',
                      name: 'Lifeline32-Gal',
                      displayName: 'Lifeline32-Gal',
                      template: { name: 'LocationCartRate' },
                      monthlyRate: textField('$29.58'),
                      cartSize: {
                        targetItem: {
                          name: '32-Gallon',
                          description: textField(
                            'For approximately two (2) kitchen-sized garbage bags per week.'
                          ),
                          dimensions: textField('25″L x 20″W x 39″H'),
                        },
                      },
                    },
                  ],
                },
              },
              {
                id: 'services',
                name: 'Additional Services',
                children: {
                  results: [
                    {
                      id: 'bulky',
                      name: 'Additional Bulky Waste Collection',
                      template: { name: 'LocationAdditionalService' },
                      serviceName: textField('Additional Bulky Waste Collection per Cubic Yard'),
                      cost: textField('$24.78'),
                    },
                    {
                      id: 'overage-header',
                      name: 'Overage Charges Header',
                      template: { name: 'LocationAdditionalService' },
                      serviceName: textField('Overage Charges'),
                      isSectionHeader: textField('1'),
                    },
                    {
                      id: 'overage',
                      name: 'Overages per cart',
                      template: { name: 'LocationAdditionalService' },
                      serviceName: textField('Overages per cart'),
                      cost: textField('$15.61'),
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  },
};

describe('RatesCartsDetail', () => {
  it('renders rates from the parent LocationItem', () => {
    render(<Default {...props} />);

    const root = screen.getByTestId('rates-carts-detail');
    expect(root).toHaveAttribute('id', 'american-canyon-rates');
    expect(screen.getByRole('heading', { name: 'Residential Rates' })).toBeInTheDocument();
    expect(screen.getAllByTestId('rates-cart-row')).toHaveLength(2);
    expect(screen.getByText('$34.80')).toBeInTheDocument();
    expect(screen.getByText('Lifeline32-Gal')).toBeInTheDocument();
    expect(
      screen.getAllByText('For approximately two (2) kitchen-sized garbage bags per week.')
    ).toHaveLength(2);
    expect(screen.getAllByText('25″L x 20″W x 39″H')).toHaveLength(2);
    expect(screen.getByTestId('rates-care-program')).toHaveTextContent('CARE Program for Residents');
    expect(screen.getByTestId('rates-service-section')).toHaveTextContent('Overage Charges');
    expect(screen.getByText('$15.61')).toBeInTheDocument();
  });

  it('shows NoDataFallback when parent LocationItem data is missing', () => {
    render(
      <Default
        {...props}
        fields={{ data: { contextItem: { id: 'page', name: 'Residential Rates', template: { name: 'Page' } } } }}
      />
    );

    expect(screen.getByText(/requires a datasource item assigned/i)).toBeInTheDocument();
  });

  it('renders when LocationItem is provided as datasource', () => {
    const location = props.fields?.data?.contextItem?.parent;
    render(
      <Default
        {...props}
        fields={{
          data: {
            datasource: location,
          },
        }}
      />
    );

    expect(screen.getByTestId('rates-carts-detail')).toBeInTheDocument();
    expect(screen.getByText('$34.80')).toBeInTheDocument();
  });

  it('renders rates from CartRates MultilistField targetItems', () => {
    render(
      <Default
        {...props}
        fields={{
          data: {
            datasource: {
              id: 'location',
              name: 'Recology American Canyon',
              template: { name: 'LocationItem' },
              ratesHeading: textField('Residential Rates'),
              cartRates: {
                targetItems: [
                  {
                    id: '32',
                    name: '32-Gal',
                    displayName: '32-Gal',
                    monthlyRate: textField('$34.80'),
                    typicalWeeklyNeeds: textField(
                      'For approximately two (2) kitchen-sized garbage bags per week.'
                    ),
                    dimensions: textField('25″L x 20″W x 39″H'),
                  },
                ],
              },
              additionalServices: {
                targetItems: [
                  {
                    id: 'bulky',
                    name: 'Additional Bulky Waste Collection',
                    serviceName: textField('Additional Bulky Waste Collection per Cubic Yard'),
                    cost: textField('$24.78'),
                  },
                ],
              },
            },
          },
        }}
      />
    );

    expect(screen.getByTestId('rates-cart-table')).toBeInTheDocument();
    expect(screen.getByText('$34.80')).toBeInTheDocument();
    expect(screen.getByText('$24.78')).toBeInTheDocument();
  });
});
