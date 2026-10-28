import { fireEvent, render, screen } from '@testing-library/react';
import { Default as AlertBannerDefault, Notice as AlertBannerNotice } from '../../components/alert-banner/AlertBanner';
import {
  defaultAlertBannerProps,
  alertBannerPropsNoFields,
  alertBannerPropsMinimal,
  alertBannerPropsWithLink,
} from './AlertBanner.mockProps';

jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({
    field,
    tag: Tag = 'span',
    ...rest
  }: {
    field?: { value?: string };
    tag?: keyof JSX.IntrinsicElements;
  }) => (field?.value ? <Tag {...rest}>{field.value}</Tag> : null),
}));

jest.mock('@/components/button-component/ButtonComponent', () => ({
  ButtonBase: ({ buttonLink }: { buttonLink?: { value?: { href?: string; text?: string } } }) =>
    buttonLink?.value?.href ? (
      <a href={buttonLink.value.href}>{buttonLink.value.text || 'Link'}</a>
    ) : null,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="alert">
      {children}
    </div>
  ),
  AlertTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  AlertDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
  }) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

jest.mock('lucide-react', () => ({
  X: () => <span>X</span>,
}));

describe('AlertBanner Component', () => {
  it('renders Default with title and description', () => {
    render(<AlertBannerDefault {...defaultAlertBannerProps} />);
    expect(screen.getByText('Site notice')).toBeInTheDocument();
    expect(screen.getByText('This is an alert banner for site-wide messages.')).toBeInTheDocument();
  });

  it('renders link in Default when provided', () => {
    render(<AlertBannerDefault {...alertBannerPropsWithLink} />);
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('href', '/learn-more');
  });

  it('hides Default banner when dismiss is clicked', () => {
    const { container } = render(<AlertBannerDefault {...defaultAlertBannerProps} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(container.querySelector('.hidden')).toBeTruthy();
  });

  it('shows fallback when Default has no fields', () => {
    const { container } = render(<AlertBannerDefault {...alertBannerPropsNoFields} />);
    expect(container.textContent).toMatch(/requires a datasource/i);
  });

  it('renders Notice cream strip with title and description', () => {
    render(<AlertBannerNotice {...defaultAlertBannerProps} />);
    expect(screen.getByText('Site notice')).toBeInTheDocument();
    expect(screen.getByText('This is an alert banner for site-wide messages.')).toBeInTheDocument();
    expect(document.querySelector('.alert-banner--notice')).toBeTruthy();
  });

  it('renders Notice with empty description when minimal', () => {
    render(<AlertBannerNotice {...alertBannerPropsMinimal} />);
    expect(screen.getByText('Site notice')).toBeInTheDocument();
  });
});
