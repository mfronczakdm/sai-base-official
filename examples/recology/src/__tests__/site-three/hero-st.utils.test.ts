import { hasHeroHeight, heroHeightStyle, parseHeroHeightVh } from '@/components/site-three/hero-st.utils';

describe('hero-st.utils', () => {
  it('parses valid HeroHeight values', () => {
    expect(parseHeroHeightVh({ HeroHeight: '40' })).toBe(40);
    expect(parseHeroHeightVh({ HeroHeight: ' 25 ' })).toBe(25);
  });

  it('rejects missing or out-of-range values', () => {
    expect(parseHeroHeightVh({})).toBeUndefined();
    expect(parseHeroHeightVh({ HeroHeight: '' })).toBeUndefined();
    expect(parseHeroHeightVh({ HeroHeight: 'abc' })).toBeUndefined();
    expect(parseHeroHeightVh({ HeroHeight: '5' })).toBeUndefined();
    expect(parseHeroHeightVh({ HeroHeight: '120' })).toBeUndefined();
  });

  it('builds minHeight style in vh', () => {
    expect(heroHeightStyle({ HeroHeight: '30' })).toEqual({ minHeight: '30vh' });
    expect(heroHeightStyle({})).toBeUndefined();
  });

  it('reports whether HeroHeight is set', () => {
    expect(hasHeroHeight({ HeroHeight: '45' })).toBe(true);
    expect(hasHeroHeight({ styles: 'x' })).toBe(false);
  });
});
