/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Default as FooterSTDefault,
  Centered as FooterSTCentered,
  Recology as FooterSTRecology,
  Version2 as FooterSTVersion2,
} from '@/components/site-three/FooterST';
import { mockPage } from '../test-utils/mockPage';

// Mock FontAwesome icons
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, width, height }: any) => (
    <span
      data-testid="font-awesome-icon"
      data-icon={icon.iconName}
      data-width={width}
      data-height={height}
    />
  ),
}));

// Mock component-map to avoid circular dependency
jest.mock('.sitecore/component-map', () => ({
  __esModule: true,
  default: new Map(),
}));

// Mock Sitecore SDK
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field, tag: Tag = 'span', ...props }: any) => <Tag {...props}>{field?.value || ''}</Tag>,
  RichText: ({ field, ...props }: any) => <div {...props}>{field?.value || ''}</div>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Link: ({ field, children, prefetch, ...props }: any) => {
    // Remove prefetch from props since it's not a valid HTML attribute
    const linkProps = props;
    return (
      <a href={field?.value?.href || '#'} {...linkProps}>
        {children}
      </a>
    );
  },
  Placeholder: ({ name }: any) => <div data-testid={`placeholder-${name}`} />,
  AppPlaceholder: ({ name }: any) => <div data-testid={`placeholder-${name}`} />,
  withDatasourceCheck: () => (Component: React.ComponentType) => Component,
}));

describe('FooterST', () => {
  const mockProps = {
    rendering: {
      uid: 'footer-uid',
      componentName: 'FooterST',
    },
    params: {
      styles: 'test-styles',
      DynamicPlaceholderId: 'test-id',
    },
    page: mockPage,
    fields: {
      Title: {
        value: 'Footer Title',
      },
      CopyrightText: {
        value: '© 2025 Company Name. All rights reserved.',
      },
      FacebookLink: {
        value: {
          href: 'https://facebook.com/company',
          text: 'Facebook',
        },
      },
      InstagramLink: {
        value: {
          href: 'https://instagram.com/company',
          text: 'Instagram',
        },
      },
      LinkedinLink: {
        value: {
          href: 'https://linkedin.com/company',
          text: 'LinkedIn',
        },
      },
    },
  };

  describe('Default variant (Recology layout)', () => {
    it('renders the Recology.com-style footer', () => {
      render(<FooterSTDefault {...mockProps} />);
      expect(screen.getByTestId('footerst-recology')).toBeInTheDocument();
    });

    it('renders five social media icons', () => {
      render(<FooterSTDefault {...mockProps} />);
      expect(screen.getByTestId('footerst-recology-social').querySelectorAll('[data-testid="font-awesome-icon"]')).toHaveLength(5);
    });

    it('renders copyright text', () => {
      render(<FooterSTDefault {...mockProps} />);
      expect(screen.getByText('© 2025 Company Name. All rights reserved.')).toBeInTheDocument();
    });

    it('renders Recology legal links', () => {
      render(<FooterSTDefault {...mockProps} />);
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
        'href',
        'https://www.recology.com/privacy/'
      );
      expect(screen.getByRole('link', { name: 'Terms of Use' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Compliance' })).toBeInTheDocument();
    });
  });

  describe('Recology variant', () => {
    it('matches Default layout and prefers authored Facebook URL', () => {
      render(<FooterSTRecology {...mockProps} />);
      expect(screen.getByTestId('footerst-recology')).toBeInTheDocument();
      expect(screen.getByLabelText(/Facebook/i)).toHaveAttribute(
        'href',
        'https://facebook.com/company'
      );
    });
  });

  describe('Centered variant', () => {
    it('renders footer with title', () => {
      render(<FooterSTCentered {...mockProps} />);
      expect(screen.getByText('Footer Title')).toBeInTheDocument();
    });

    it('renders social media links with icons', () => {
      render(<FooterSTCentered {...mockProps} />);
      const icons = screen.getAllByTestId('font-awesome-icon');
      expect(icons).toHaveLength(3);
    });

    it('renders copyright text', () => {
      render(<FooterSTCentered {...mockProps} />);
      expect(screen.getByText('© 2025 Company Name. All rights reserved.')).toBeInTheDocument();
    });

    it('renders placeholders', () => {
      render(<FooterSTCentered {...mockProps} />);
      expect(screen.getByTestId('placeholder-footer-primary-links-test-id')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-footer-secondary-links-test-id')).toBeInTheDocument();
    });
  });

  describe('Version2 variant', () => {
    it('renders the multi-column BCAA footer layout', () => {
      render(<FooterSTVersion2 {...mockProps} />);
      expect(screen.getByTestId('footerst-version2')).toBeInTheDocument();
      expect(screen.getByText('Footer Title')).toBeInTheDocument();
      expect(screen.getByText('Follow BCAA')).toBeInTheDocument();
      expect(screen.getByLabelText('BCAA')).toBeInTheDocument();
    });

    it('renders social icons and placeholders', () => {
      render(<FooterSTVersion2 {...mockProps} />);
      expect(screen.getByTestId('footerst-version2-social')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-footer-primary-links-test-id')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-footer-secondary-links-test-id')).toBeInTheDocument();
      expect(screen.getAllByTestId('font-awesome-icon').length).toBeGreaterThanOrEqual(4);
    });
  });
});
