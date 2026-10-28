/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Default as HeroSTDefault,
  Right as HeroSTRight,
  Centered as HeroSTCentered,
  SplitScreen as HeroSTSplitScreen,
  Stacked as HeroSTStacked,
  Version3 as HeroSTVersion3,
} from '@/components/site-three/HeroST';

// Mock useContainerOffsets hook
jest.mock('@/hooks/useContainerOffsets', () => ({
  useContainerOffsets: () => ({
    containerRef: { current: null },
    rightOffset: 0,
    leftOffset: 0,
  }),
}));

// Mock Sitecore SDK
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  Text: ({ field, ...props }: any) => <span {...props}>{field?.value || ''}</span>,
  NextImage: ({ field, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={field?.value?.src || ''} alt={field?.value?.alt || ''} className={className} />
  ),
  Link: ({ field, children, className }: any) => (
    <a href={field?.value?.href || '#'} className={className}>
      {children || field?.value?.text || ''}
    </a>
  ),
}));

describe('HeroST', () => {
  const mockProps = {
    params: {
      styles: 'test-styles',
    },
    fields: {
      Eyebrow: {
        value: 'New Collection',
      },
      Title: {
        value: 'Premium Audio Experience',
      },
      Image1: {
        value: {
          src: '/images/hero-bg.jpg',
          alt: 'Hero background',
        },
      },
      Image2: {
        value: {
          src: '/images/hero-product.jpg',
          alt: 'Hero product',
        },
      },
      Link1: {
        value: {
          href: '/shop',
          text: 'Shop Now',
        },
      },
      Link2: {
        value: {
          href: '/learn-more',
          text: 'Learn More',
        },
      },
    },
  };

  describe('Default variant', () => {
    it('renders hero with eyebrow text', () => {
      render(<HeroSTDefault {...mockProps} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('renders hero with title', () => {
      render(<HeroSTDefault {...mockProps} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders background image', () => {
      render(<HeroSTDefault {...mockProps} />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('renders call-to-action links', () => {
      render(<HeroSTDefault {...mockProps} />);
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });
  });

  describe('Centered variant', () => {
    it('renders hero with title', () => {
      render(<HeroSTCentered {...mockProps} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders call-to-action links', () => {
      render(<HeroSTCentered {...mockProps} />);
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
    });

    it('renders eyebrow text in centered variant', () => {
      render(<HeroSTCentered {...mockProps} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('applies custom styles in centered variant', () => {
      const { container } = render(<HeroSTCentered {...mockProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('test-styles');
    });
  });

  describe('Right variant', () => {
    it('renders hero with title in right variant', () => {
      render(<HeroSTRight {...mockProps} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders eyebrow text in right variant', () => {
      render(<HeroSTRight {...mockProps} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('renders call-to-action links in right variant', () => {
      render(<HeroSTRight {...mockProps} />);
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('renders background images in right variant', () => {
      render(<HeroSTRight {...mockProps} />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('applies custom styles in right variant', () => {
      const { container } = render(<HeroSTRight {...mockProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('test-styles');
    });

    it('handles missing eyebrow in right variant', () => {
      const propsWithoutEyebrow: any = {
        ...mockProps,
        fields: {
          ...mockProps.fields,
          Eyebrow: undefined,
        },
      };
      render(<HeroSTRight {...propsWithoutEyebrow} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });
  });

  describe('SplitScreen variant', () => {
    it('renders hero with title in split screen variant', () => {
      render(<HeroSTSplitScreen {...mockProps} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders eyebrow text in split screen variant', () => {
      render(<HeroSTSplitScreen {...mockProps} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('renders call-to-action links in split screen variant', () => {
      render(<HeroSTSplitScreen {...mockProps} />);
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('applies primary background in split screen variant', () => {
      const { container } = render(<HeroSTSplitScreen {...mockProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-primary');
    });

    it('renders images in split screen layout', () => {
      render(<HeroSTSplitScreen {...mockProps} />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('handles missing title in split screen variant', () => {
      const propsWithoutTitle: any = {
        ...mockProps,
        fields: {
          ...mockProps.fields,
          Title: undefined,
        },
      };
      render(<HeroSTSplitScreen {...propsWithoutTitle} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });
  });

  describe('Stacked variant', () => {
    it('renders hero with title in stacked variant', () => {
      render(<HeroSTStacked {...mockProps} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders eyebrow text in stacked variant', () => {
      render(<HeroSTStacked {...mockProps} />);
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });

    it('renders call-to-action links in stacked variant', () => {
      render(<HeroSTStacked {...mockProps} />);
      expect(screen.getByText('Shop Now')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('applies primary background in stacked variant', () => {
      const { container } = render(<HeroSTStacked {...mockProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-primary');
    });

    it('renders both Image1 and Image2 in stacked layout', () => {
      render(<HeroSTStacked {...mockProps} />);
      const images = screen.getAllByRole('img');
      // Should render multiple images (Image1 and Image2 fields)
      expect(images.length).toBeGreaterThan(1);
    });

    it('handles missing Image2 in stacked variant', () => {
      const propsWithoutImage2: any = {
        ...mockProps,
        fields: {
          ...mockProps.fields,
          Image2: undefined,
        },
      };
      render(<HeroSTStacked {...propsWithoutImage2} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('applies custom styles in stacked variant', () => {
      const { container } = render(<HeroSTStacked {...mockProps} />);
      const section = container.querySelector('section');
      expect(section).toHaveClass('test-styles');
    });
  });

  describe('Version3 variant', () => {
    it('centers the title, supporting line, and primary link on the photo', () => {
      render(<HeroSTVersion3 {...mockProps} />);

      const panel = screen.getByTestId('hero-st-version3');
      expect(panel.className).toContain('justify-center');
      const overlay = screen.getByTestId('hero-st-version3-panel');
      expect(overlay.style.backgroundColor).toContain('color-mix');
      expect(overlay.style.backgroundColor).toContain('--color-secondary');
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
      expect(screen.getByText('New Collection')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Shop Now' })).toHaveClass('btn-primary');
      expect(screen.getByRole('link', { name: 'Learn More' })).toBeInTheDocument();
    });

    it('applies HeroHeight as viewport min-height and drops default rem mins', () => {
      render(<HeroSTVersion3 {...mockProps} params={{ ...mockProps.params, HeroHeight: '40' }} />);

      const section = screen.getByTestId('hero-st-version3');
      expect(section.style.minHeight).toBe('40vh');
      expect(section.className).not.toContain('min-h-[28rem]');
      expect(section.className).not.toContain('lg:min-h-[38rem]');
    });

    it('hides a link that has no destination', () => {
      render(
        <HeroSTVersion3
          {...mockProps}
          fields={{
            ...mockProps.fields,
            Link2: { value: { href: '', text: 'Second' } },
          }}
        />
      );

      expect(screen.queryByRole('link', { name: 'Second' })).not.toBeInTheDocument();
    });
  });

  describe('HeroHeight rendering param', () => {
    it('sets section min-height on Default when HeroHeight is set', () => {
      const { container } = render(
        <HeroSTDefault {...mockProps} params={{ ...mockProps.params, HeroHeight: '35' }} />
      );
      const section = container.querySelector('section');
      expect(section).toHaveStyle({ minHeight: '35vh' });
    });
  });

  describe('Edge cases and missing data', () => {
    it('handles completely missing fields in default variant', () => {
      const propsWithoutFields: any = {
        params: {},
        fields: {},
      };
      const { container } = render(<HeroSTDefault {...propsWithoutFields} />);
      // Component should still render without errors
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('handles missing links in default variant', () => {
      const propsWithoutLinks: any = {
        ...mockProps,
        fields: {
          ...mockProps.fields,
          Link1: undefined,
          Link2: undefined,
        },
      };
      render(<HeroSTDefault {...propsWithoutLinks} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('handles missing images in default variant', () => {
      const propsWithoutImages: any = {
        ...mockProps,
        fields: {
          ...mockProps.fields,
          Image1: undefined,
        },
      };
      render(<HeroSTDefault {...propsWithoutImages} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });

    it('renders without params styles', () => {
      const propsWithoutStyles = {
        ...mockProps,
        params: {},
      };
      render(<HeroSTDefault {...propsWithoutStyles} />);
      expect(screen.getByText('Premium Audio Experience')).toBeInTheDocument();
    });
  });
});
