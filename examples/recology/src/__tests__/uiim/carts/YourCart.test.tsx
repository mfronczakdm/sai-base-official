import React from 'react';
import { render, screen } from '@testing-library/react';
import { Default } from '@/components/uiim/carts/YourCart';
import type { YourCartProps } from '@/components/uiim/carts/your-cart.props';
import { mockPage } from '../../test-utils/mockPage';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({
    field,
    tag: Tag = 'span',
  }: {
    field?: { value?: string };
    tag?: keyof JSX.IntrinsicElements;
  }) => {
    if (!field?.value) return null;
    return <Tag>{field.value}</Tag>;
  },
  Link: ({ field }: { field?: { value?: { href?: string; text?: string } } }) => {
    if (!field?.value?.href && !field?.value?.text) return null;
    return <a href={field.value.href || '#'}>{field.value.text || 'Link'}</a>;
  },
  NextImage: ({ field }: { field?: { value?: { src?: string; alt?: string } } }) => {
    if (!field?.value?.src) return null;
    return <img src={field.value.src} alt={field.value.alt || ''} />;
  },
}));

const textField = (value: string) => ({ jsonValue: { value } });
const linkField = (text: string, href: string) => ({
  jsonValue: { value: { text, href, linktype: 'external' } },
});

const props: YourCartProps = {
  rendering: { componentName: 'YourCart' },
  page: mockPage,
  params: { styles: 'your-cart-block', RenderingIdentifier: 'ac-your-cart' },
  fields: {
    data: {
      datasource: {
        id: 'location',
        name: 'Recology American Canyon',
        locationName: textField('Recology American Canyon'),
        cartTypes: {
          targetItems: [
            {
              id: '1',
              name: 'Green Cart',
              cartName: textField('Green Cart'),
              stream: textField('Compost / Organics'),
              color: textField('Green'),
              description: textField('Food scraps and yard waste go here.'),
            },
            {
              id: '2',
              name: 'Blue Cart',
              cartName: textField('Blue Cart'),
              stream: textField('Recycling'),
              color: textField('Blue'),
              description: textField('Clean paper, plastic, glass, and metal.'),
            },
          ],
        },
        cartSizes: {
          targetItems: [
            {
              id: 's1',
              name: '32-Gallon',
              sizeName: textField('32-Gallon'),
              capacity: textField('32'),
              unit: textField('Gallon'),
              dimensions: textField('25″L x 20″W x 39″H'),
            },
          ],
        },
        modifyServiceLink: linkField('Modify Service', 'https://example.com/modify'),
        newCustomersLink: linkField('New Customers', 'https://example.com/new'),
      },
    },
  },
};

describe('YourCart', () => {
  it('renders cart types, sizes, and CTAs for a location', () => {
    render(<Default {...props} />);

    expect(screen.getByTestId('your-cart')).toBeInTheDocument();
    expect(screen.getByText(/Your carts in Recology American Canyon/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('your-cart-type')).toHaveLength(2);
    expect(screen.getByText('Green Cart')).toBeInTheDocument();
    expect(screen.getByText('Blue Cart')).toBeInTheDocument();
    expect(screen.getByTestId('your-cart-size')).toHaveTextContent('32-Gallon');
    expect(screen.getByRole('link', { name: 'Modify Service' })).toHaveAttribute(
      'href',
      'https://example.com/modify'
    );
    expect(screen.getByRole('link', { name: 'New Customers' })).toHaveAttribute(
      'href',
      'https://example.com/new'
    );
  });
});
