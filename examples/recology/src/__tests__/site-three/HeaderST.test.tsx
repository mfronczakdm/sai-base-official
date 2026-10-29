/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Default as HeaderSTDefault, Version4 as HeaderSTVersion4, RecologyGlobal as HeaderSTRecologyGlobal, Version5 as HeaderSTVersion5, Regional as HeaderSTRegional, Version6 as HeaderSTVersion6 } from '../../components/site-three/HeaderST';
import { mockPageEditing } from '../test-utils/mockPage';
import { clearLocationNavMemoryCache, clearRememberedLocation, rememberLocation } from '../../components/site-three/location-nav-client';
import {
  defaultHeaderSTProps,
  headerSTPropsBasic,
  headerSTPropsCustomStyles,
  headerSTPropsEmpty,
  headerSTPropsNoFields,
  headerSTPropsLongText,
  headerSTPropsSearchBoxOnly,
  headerSTPropsMiniCartOnly,
  headerSTPropsSpecialChars,
} from './HeaderST.mockProps';

// Mock FontAwesome icon
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, width, height, ...props }: any) => (
    <svg
      data-testid="fontawesome-icon"
      width={width}
      height={height}
      data-icon={icon.iconName}
      {...props}
    >
      <path d="M0 0h24v24H0z" />
    </svg>
  ),
}));

// Mock FontAwesome icons
jest.mock('@fortawesome/free-solid-svg-icons', () => ({
  faShoppingCart: {
    iconName: 'shopping-cart',
    prefix: 'fas',
  },
}));

jest.mock('lucide-react', () => ({
  User: (props: any) => <svg data-testid="login-icon" {...props} />,
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  Truck: (props: any) => <svg data-testid="truck-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
  X: (props: any) => <svg data-testid="close-icon" {...props} />,
}));

jest.mock('../../components/site-three/LocationRegionalNav', () => ({
  LocationRegionalNav: ({ itemId }: { itemId?: string }) =>
    itemId ? (
      <ul data-testid="location-regional-nav">
        <li>
          <button type="button">All Services</button>
        </li>
        <li>
          <button type="button">Customer Service</button>
        </li>
      </ul>
    ) : null,
}));

// Mock component-map to avoid circular dependency
jest.mock('.sitecore/component-map', () => ({
  __esModule: true,
  default: new Map(),
}));

// Mock Sitecore Content SDK components
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Link: ({ field, prefetch, className, children, ...props }: any) => (
    <a
      href={field?.value?.href || ''}
      className={className}
      data-prefetch={prefetch}
      data-testid="sitecore-link"
      {...props}
    >
      {children || field?.value?.text || ''}
    </a>
  ),
  NextImage: ({ field, className, ...props }: any) => (
    <img
      src={field?.value?.src || ''}
      alt={field?.value?.alt || ''}
      className={className}
      data-testid="sitecore-image"
      {...props}
    />
  ),
  Placeholder: ({ name, rendering, ...props }: any) => (
    <div
      data-testid="sitecore-placeholder"
      data-name={name}
      data-rendering={rendering?.componentName}
      {...props}
    >
      Navigation Placeholder
    </div>
  ),
  AppPlaceholder: ({ name, rendering, componentMap, ...props }: any) => (
    <div
      data-testid="app-placeholder"
      data-name={name}
      data-rendering={rendering?.componentName}
      {...props}
    >
      App Placeholder
    </div>
  ),
  withDatasourceCheck: () => (Component: React.ComponentType) => Component,
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, className, prefetch, ...props }: any) => (
    <a
      href={href}
      className={className}
      data-prefetch={prefetch}
      data-testid="next-link"
      {...props}
    >
      {children}
    </a>
  );
});

// Mock the custom hook
const mockSetIsVisible = jest.fn();
jest.mock('../../hooks/useToggleWithClickOutside', () => ({
  useToggleWithClickOutside: jest.fn(() => ({
    isVisible: false,
    setIsVisible: mockSetIsVisible,
    ref: { current: null },
  })),
}));

// Mock the non-sitecore components
jest.mock('../../components/site-three/non-sitecore/MiniCart', () => ({
  MiniCart: ({ cartLink }: any) => (
    <div data-testid="mini-cart" data-cart-link={cartLink?.value?.href}>
      Mini Cart Component
    </div>
  ),
}));

jest.mock('../../components/site-three/non-sitecore/SearchBox', () => ({
  SearchBox: ({ searchLink }: any) => (
    <div data-testid="search-box" data-search-link={searchLink?.value?.href}>
      Search Box Component
    </div>
  ),
}));

// Import the hook mock to control its behavior
const mockUseToggleWithClickOutside = require('../../hooks/useToggleWithClickOutside')
  .useToggleWithClickOutside as jest.Mock;

describe('HeaderST Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToggleWithClickOutside.mockReturnValue({
      isVisible: false,
      setIsVisible: jest.fn(),
    });
  });

  describe('Default Rendering', () => {
    it('renders header structure with all components', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      // Check main section
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check logo link
      expect(screen.getByTestId('next-link')).toBeInTheDocument();
      expect(screen.getByTestId('next-link')).toHaveAttribute('href', '/');

      // Check logo image
      expect(screen.getByTestId('sitecore-image')).toBeInTheDocument();
      expect(screen.getByTestId('sitecore-image')).toHaveAttribute('src', '/images/sync-logo.svg');
      expect(screen.getByTestId('sitecore-image')).toHaveAttribute('alt', 'SYNC Audio Logo');
    });

    it('applies custom styles from params', () => {
      render(<HeaderSTDefault {...headerSTPropsCustomStyles} />);

      const section = document.querySelector('section[data-class-change]');
      expect(section).toHaveClass('bg-primary', 'text-white', 'custom-header-class');
    });

    it('renders navigation placeholder with correct props', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const placeholders = screen.getAllByTestId('app-placeholder');
      expect(placeholders.length).toBeGreaterThan(0);
      const placeholder = placeholders[0];
      expect(placeholder).toHaveAttribute('data-name', 'header-navigation-main-nav');
      expect(placeholder).toHaveAttribute('data-rendering', 'HeaderST');
    });
  });

  describe('Navigation Links', () => {
    it('renders support links in both desktop and mobile locations', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const supportLinks = screen.getAllByTestId('sitecore-link');
      const supportLinkElements = supportLinks.filter(
        (link) => link.getAttribute('href') === '/support'
      );

      expect(supportLinkElements.length).toBeGreaterThan(0);
      supportLinkElements.forEach((link) => {
        expect(link).toHaveAttribute('data-prefetch', 'false');
      });
    });

    it('handles search link correctly based on showSearchBox param', () => {
      // With search box enabled
      render(<HeaderSTDefault {...headerSTPropsSearchBoxOnly} />);

      expect(screen.getByTestId('search-box')).toBeInTheDocument();
      expect(screen.getByTestId('search-box')).toHaveAttribute('data-search-link', '/search');

      // With search box disabled, should show link instead
      const { rerender } = render(<HeaderSTDefault {...headerSTPropsSearchBoxOnly} />);
      rerender(<HeaderSTDefault {...headerSTPropsBasic} />);

      const searchLinks = screen.getAllByTestId('sitecore-link');
      const searchLink = searchLinks.find((link) => link.getAttribute('href') === '/search');
      expect(searchLink).toBeInTheDocument();
    });

    it('handles cart link correctly based on showMiniCart param', () => {
      // With mini cart enabled
      render(<HeaderSTDefault {...headerSTPropsMiniCartOnly} />);

      expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
      expect(screen.getByTestId('mini-cart')).toHaveAttribute('data-cart-link', '/cart');
    });

    it('renders FontAwesome cart icon when mini cart is disabled', () => {
      render(<HeaderSTDefault {...headerSTPropsBasic} />);

      const cartIcon = screen.getByTestId('fontawesome-icon');
      expect(cartIcon).toBeInTheDocument();
      expect(cartIcon).toHaveAttribute('data-icon', 'shopping-cart');
      expect(cartIcon).toHaveAttribute('width', '24');
      expect(cartIcon).toHaveAttribute('height', '24');
    });
  });

  describe('Mobile Menu Functionality', () => {
    it('renders mobile menu toggle button', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const mobileToggle = document.querySelector('.cursor-pointer');
      expect(mobileToggle).toBeInTheDocument();
    });

    it('shows hamburger menu lines in closed state', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const menuLines = document.querySelectorAll('.bg-current');
      expect(menuLines).toHaveLength(3); // Three hamburger lines
    });

    it('handles mobile menu state changes', () => {
      const mockSetIsVisible = jest.fn();
      mockUseToggleWithClickOutside.mockReturnValue({
        isVisible: false,
        setIsVisible: mockSetIsVisible,
      });

      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const mobileToggle = screen.getByLabelText('Toggle mobile menu');
      if (mobileToggle) {
        fireEvent.click(mobileToggle);
        expect(mockSetIsVisible).toHaveBeenCalledWith(true);
      } else {
        // Skip test if mobile toggle not found (due to CSS class variations)
        expect(true).toBe(true);
      }
    });

    it('applies correct classes when mobile menu is open', () => {
      mockUseToggleWithClickOutside.mockReturnValue({
        isVisible: true,
        setIsVisible: jest.fn(),
      });

      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const mobileMenu = document.querySelector('.opacity-100.pointer-events-auto');
      expect(mobileMenu).toBeInTheDocument();
    });

    it('applies correct classes when mobile menu is closed', () => {
      mockUseToggleWithClickOutside.mockReturnValue({
        isVisible: false,
        setIsVisible: jest.fn(),
      });

      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const closedMenu = document.querySelector('.opacity-0.pointer-events-none');
      expect(closedMenu).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile and desktop navigation', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      // Check for responsive classes - desktop navigation should be hidden on mobile
      const desktopNavigation = screen.getByRole('navigation');
      expect(desktopNavigation).toBeInTheDocument();
      
      // Check that mobile menu wrapper exists
      const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('shows mobile-specific elements only on mobile', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      // Mobile menu toggle should be hidden on desktop
      const mobileToggle = document.querySelector('.lg\\:hidden');
      expect(mobileToggle).toBeInTheDocument();
    });

    it('shows desktop-specific elements only on desktop', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      // Desktop support link should be hidden on mobile
      const desktopSupportLink = document.querySelector('.hidden.lg\\:block');
      expect(desktopSupportLink).toBeInTheDocument();
    });
  });

  describe('Content Scenarios', () => {
    it('handles empty field values gracefully', () => {
      render(<HeaderSTDefault {...headerSTPropsEmpty} />);

      // Component should render without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // If any sitecore-link elements are present, they should have empty href.
      const sitecoreLinks = screen.queryAllByTestId('sitecore-link');
      sitecoreLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '');
      });

      // Image should render without crashing
      const image = screen.getByTestId('sitecore-image');
      expect(image).toBeInTheDocument();
    });

    it('handles long text content', () => {
      render(<HeaderSTDefault {...headerSTPropsLongText} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Check that long alt text is properly set
      const image = screen.getByTestId('sitecore-image');
      expect(image).toHaveAttribute('alt', 'SYNC Audio Professional Equipment Company Logo');
    });

    it('handles special characters in content', () => {
      render(<HeaderSTDefault {...headerSTPropsSpecialChars} />);

      const image = screen.getByTestId('sitecore-image');
      expect(image).toHaveAttribute('alt', 'Logó with Àccents');

      const links = screen.getAllByTestId('sitecore-link');
      const supportLink = links.find((link) => link.textContent?.includes('Suppört'));
      expect(supportLink).toBeInTheDocument();
    });
  });

  describe('Parameter Handling', () => {
    it('handles missing showSearchBox parameter', () => {
      const propsWithoutSearchBox = {
        ...defaultHeaderSTProps,
        params: {
          styles: defaultHeaderSTProps.params.styles,
          showMiniCart: defaultHeaderSTProps.params.showMiniCart,
          DynamicPlaceholderId: defaultHeaderSTProps.params.DynamicPlaceholderId,
        },
      };

      render(<HeaderSTDefault {...propsWithoutSearchBox} />);

      // Should default to showing link instead of search box
      expect(screen.queryByTestId('search-box')).not.toBeInTheDocument();
    });

    it('handles missing showMiniCart parameter', () => {
      const propsWithoutMiniCart = {
        ...defaultHeaderSTProps,
        params: {
          styles: defaultHeaderSTProps.params.styles,
          showSearchBox: defaultHeaderSTProps.params.showSearchBox,
          DynamicPlaceholderId: defaultHeaderSTProps.params.DynamicPlaceholderId,
        },
      };

      render(<HeaderSTDefault {...propsWithoutMiniCart} />);

      // Should default to showing cart icon
      expect(screen.queryByTestId('mini-cart')).not.toBeInTheDocument();
      expect(screen.getByTestId('fontawesome-icon')).toBeInTheDocument();
    });

    it('handles missing styles parameter', () => {
      const propsWithoutStyles = {
        ...defaultHeaderSTProps,
        params: {
          showSearchBox: defaultHeaderSTProps.params.showSearchBox,
          showMiniCart: defaultHeaderSTProps.params.showMiniCart,
          DynamicPlaceholderId: defaultHeaderSTProps.params.DynamicPlaceholderId,
        },
      };

      expect(() => {
        render(<HeaderSTDefault {...propsWithoutStyles} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('provides proper navigation landmark', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('includes alt text for logo image', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const logo = screen.getByTestId('sitecore-image');
      expect(logo).toHaveAttribute('alt');
      expect(logo.getAttribute('alt')).toBeTruthy();
    });

    it('sets prefetch={false} on navigation links', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const sitecoreLinks = screen.getAllByTestId('sitecore-link');
      sitecoreLinks.forEach((link) => {
        expect(link).toHaveAttribute('data-prefetch', 'false');
      });

      const nextLink = screen.getByTestId('next-link');
      expect(nextLink).toHaveAttribute('data-prefetch', 'false');
    });

    it('provides semantic list structure for navigation', () => {
      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const lists = document.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('handles re-renders efficiently', () => {
      const { rerender } = render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();

      rerender(<HeaderSTDefault {...headerSTPropsCustomStyles} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('manages mobile menu state without performance issues', () => {
      const mockSetIsVisible = jest.fn();

      mockUseToggleWithClickOutside.mockReturnValue({
        isVisible: false,
        setIsVisible: mockSetIsVisible,
      });

      render(<HeaderSTDefault {...defaultHeaderSTProps} />);

      const mobileToggle = screen.getByLabelText('Toggle mobile menu');

      if (mobileToggle) {
        // Multiple rapid clicks should be handled gracefully
        fireEvent.click(mobileToggle);
        fireEvent.click(mobileToggle);
        fireEvent.click(mobileToggle);

        expect(mockSetIsVisible).toHaveBeenCalledTimes(3);
      } else {
        // Skip test if mobile toggle not found
        expect(mockSetIsVisible).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('handles null fields gracefully', () => {
      expect(() => {
        render(<HeaderSTDefault {...headerSTPropsNoFields} />);
      }).not.toThrow();
    });

    it('handles missing field properties', () => {
      const propsWithIncompleteFields = {
        ...defaultHeaderSTProps,
        fields: {
          Logo: undefined as any,
          SupportLink: defaultHeaderSTProps.fields.SupportLink,
          // Missing other fields
        },
      } as any;

      expect(() => {
        render(<HeaderSTDefault {...propsWithIncompleteFields} />);
      }).not.toThrow();
    });

  });

  describe('RecologyGlobal and Regional', () => {
    beforeEach(() => {
      clearLocationNavMemoryCache();
      clearRememberedLocation();
    });

    it('renders the Recology utility bar and search form without changing Default', () => {
      render(<HeaderSTRecologyGlobal {...headerSTPropsSearchBoxOnly} />);

      expect(screen.getByTestId('header-st-recology-global')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pay My Bill' })).toHaveAttribute('href', '/Pay-My-Bill');
      expect(screen.getByRole('link', { name: 'Recology' })).toHaveAttribute('href', '/');
      expect(screen.getAllByRole('link', { name: 'About Us' })[0]).toHaveAttribute('href', '/About-Us');
      expect(screen.getAllByRole('link', { name: 'Careers' })[0]).toHaveAttribute('href', '/Careers');
      expect(screen.getByRole('link', { name: 'My Recology' })).toHaveAttribute('href', '/Location');
      fireEvent.click(screen.getByRole('button', { name: 'Open My Recology menu' }));
      expect(screen.getByRole('menuitem', { name: 'My Recology Home' })).toHaveAttribute('href', '/Location');
      expect(screen.getByRole('menuitem', { name: 'Manage My Account' })).toHaveAttribute('href', '/Pay-My-Bill');
      expect(screen.getByRole('menuitem', { name: 'Nearby Locations' })).toHaveAttribute('href', '/Location');
      expect(screen.getByRole('menuitem', { name: 'See All Locations' })).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.queryByTestId('header-st-regional')).not.toBeInTheDocument();
    });

    it('keeps Version5 as an alias of RecologyGlobal', () => {
      render(<HeaderSTVersion5 {...headerSTPropsSearchBoxOnly} />);
      expect(screen.getByTestId('header-st-recology-global')).toBeInTheDocument();
    });

    it('uses the current location as My Recology home', async () => {
      const nav = {
        locationLabel: 'Recology American Canyon',
        locationHref: '/Location/Recology-American-Canyon',
        sections: [
          {
            name: 'Customer Service',
            title: 'Customer Service',
            href: '/Location/Recology-American-Canyon/Customer-Service',
            children: [
              {
                name: 'Pay My Bill',
                title: 'Pay My Bill',
                href: '/Location/Recology-American-Canyon/Customer-Service/Pay-My-Bill',
              },
            ],
          },
          {
            name: 'Nearby Locations',
            title: 'Nearby Locations',
            href: '/Location/Recology-American-Canyon/Nearby-Locations',
            children: [],
          },
        ],
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => nav,
      });

      const pageWithRoute = {
        ...headerSTPropsBasic.page,
        locale: 'en',
        layout: {
          sitecore: {
            context: {},
            route: { itemId: 'f013bb48-b6cd-4824-8cd9-c69eec056724', name: 'Recology American Canyon' },
          },
        },
      };

      render(<HeaderSTRegional {...headerSTPropsBasic} page={pageWithRoute as any} />);

      const home = await screen.findByRole('link', { name: /My Recology \(American Canyon\)/i });
      expect(home).toHaveAttribute('href', '/Location/Recology-American-Canyon');
      fireEvent.click(screen.getByRole('button', { name: /Open My Recology \(American Canyon\) menu/i }));

      expect(screen.getByRole('menuitem', { name: 'My Recology Home' })).toHaveAttribute(
        'href',
        '/Location/Recology-American-Canyon'
      );
      expect(screen.getByRole('menuitem', { name: 'Manage My Account' })).toHaveAttribute(
        'href',
        '/Location/Recology-American-Canyon/Customer-Service/Pay-My-Bill'
      );
      expect(screen.getByRole('menuitem', { name: 'See All Locations' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Recology' })).toHaveAttribute('href', '/');
    });

    it('remembers the location on the global header after a regional visit', async () => {
      const nav = {
        locationLabel: 'Recology American Canyon',
        locationHref: '/Location/Recology-American-Canyon',
        sections: [
          {
            name: 'Customer Service',
            title: 'Customer Service',
            href: '/Location/Recology-American-Canyon/Customer-Service',
            children: [
              {
                name: 'Pay My Bill',
                title: 'Pay My Bill',
                href: '/Location/Recology-American-Canyon/Customer-Service/Pay-My-Bill',
              },
            ],
          },
        ],
      };
      rememberLocation('f013bb48-b6cd-4824-8cd9-c69eec056724', 'en');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => nav,
      });

      render(
        <HeaderSTRecologyGlobal
          {...headerSTPropsSearchBoxOnly}
          page={{ ...headerSTPropsSearchBoxOnly.page, locale: 'en' } as any}
        />
      );

      expect(await screen.findByRole('link', { name: /My Recology \(American Canyon\)/i })).toHaveAttribute(
        'href',
        '/Location/Recology-American-Canyon'
      );
      expect(screen.getByRole('link', { name: 'Pay My Bill' })).toHaveAttribute(
        'href',
        '/Location/Recology-American-Canyon/Customer-Service/Pay-My-Bill'
      );
    });

    it('adds the location row with tree-driven nav and keeps search and cart params', () => {
      const pageWithRoute = {
        ...headerSTPropsBasic.page,
        layout: {
          sitecore: {
            context: {},
            route: { itemId: 'f013bb48-b6cd-4824-8cd9-c69eec056724', name: 'Recology American Canyon' },
          },
        },
      };

      const { rerender } = render(
        <HeaderSTRegional
          {...headerSTPropsBasic}
          page={pageWithRoute as any}
          params={{ ...headerSTPropsBasic.params, showSearchBox: '1', showMiniCart: '1' }}
        />
      );

      expect(screen.getByTestId('header-st-regional')).toBeInTheDocument();
      expect(screen.getByTestId('truck-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
      // Desktop location row + mobile drawer both mount the tree-driven nav
      expect(screen.getAllByTestId('location-regional-nav').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByRole('button', { name: 'All Services' }).length).toBeGreaterThanOrEqual(1);

      rerender(
        <HeaderSTVersion6
          {...headerSTPropsBasic}
          page={pageWithRoute as any}
          params={{ ...headerSTPropsBasic.params, HideCart: '1', showMiniCart: '1' }}
        />
      );
      expect(screen.queryByTestId('mini-cart')).not.toBeInTheDocument();
      expect(screen.getByTestId('header-st-regional')).toBeInTheDocument();
    });
  });

  describe('Version4', () => {
    it('renders login and search icons with the hamburger always available', () => {
      render(
        <HeaderSTVersion4
          {...headerSTPropsBasic}
          fields={{
            ...headerSTPropsBasic.fields,
            LoginLink: {
              value: { href: '/login', text: 'Log in' },
            },
          }}
        />
      );

      expect(screen.getByTestId('header-st-version4')).toHaveAttribute('data-header-chrome', 'top');
      expect(screen.getByTestId('header-st-version4').className).toContain('bg-transparent');
      expect(screen.getByTestId('login-icon')).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
      expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');

      const menuButton = screen.getByRole('button', { name: 'Toggle mobile menu' });
      expect(menuButton.closest('li')?.className).not.toContain('lg:hidden');
      expect(screen.queryByTestId('fontawesome-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mini-cart')).not.toBeInTheDocument();
    });

    it('keeps showSearchBox and showMiniCart and hides the cart when HideCart is set', () => {
      const { rerender } = render(
        <HeaderSTVersion4
          {...headerSTPropsBasic}
          params={{ ...headerSTPropsBasic.params, showSearchBox: 'true', showMiniCart: 'true' }}
        />
      );

      expect(screen.getByTestId('search-box')).toBeInTheDocument();
      expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();

      rerender(
        <HeaderSTVersion4
          {...headerSTPropsBasic}
          params={{
            ...headerSTPropsBasic.params,
            showSearchBox: 'true',
            showMiniCart: 'true',
            HideCart: '1',
          }}
        />
      );

      expect(screen.queryByTestId('mini-cart')).not.toBeInTheDocument();
    });

    it('turns the bar blue after a short scroll, then hides it further down', () => {
      render(<HeaderSTVersion4 {...headerSTPropsBasic} />);
      const header = screen.getByTestId('header-st-version4');

      window.scrollY = 40;
      fireEvent.scroll(window);
      expect(header).toHaveAttribute('data-header-chrome', 'solid');
      expect(header.className).toContain('bg-primary');

      window.scrollY = 400;
      fireEvent.scroll(window);
      expect(header).toHaveAttribute('data-header-chrome', 'hidden');
      expect(header.className).toContain('-translate-y-full');

      window.scrollY = 80;
      fireEvent.scroll(window);
      expect(header).toHaveAttribute('data-header-chrome', 'solid');

      window.scrollY = 0;
    });

    it('stays visible with a blue background while editing', () => {
      render(<HeaderSTVersion4 {...headerSTPropsBasic} page={mockPageEditing} />);
      const header = screen.getByTestId('header-st-version4');

      expect(header).toHaveAttribute('data-header-chrome', 'editing');
      expect(header.className).toContain('bg-primary');
      expect(header.className).not.toContain('fixed');

      window.scrollY = 400;
      fireEvent.scroll(window);
      expect(header).toHaveAttribute('data-header-chrome', 'editing');
      window.scrollY = 0;
    });
  });

  describe('Error Handling parameters', () => {
    it('handles malformed parameter values', () => {
      const propsWithMalformedParams = {
        ...defaultHeaderSTProps,
        params: {
          styles: null as any,
          showSearchBox: 'invalid-boolean',
          showMiniCart: '',
          DynamicPlaceholderId: undefined as any,
        },
      };

      expect(() => {
        render(<HeaderSTDefault {...propsWithMalformedParams} />);
      }).not.toThrow();
    });
  });
});
