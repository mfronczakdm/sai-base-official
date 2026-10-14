import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const pages = [
  ['Supplements', '/productstore/supplements'],
  ['Cleaning and Laundry', '/productstore/cleaning-and-laundry'],
  ['Cleaning', '/productstore/cleaning-and-laundry/cleaning'],
  ['Laundry', '/productstore/cleaning-and-laundry/laundry'],
  ['Personal Care', '/productstore/personal-care'],
  ['Bath and Body', '/productstore/personal-care/bath-body'],
  ['Dental', '/productstore/personal-care/dental'],
  ['Personal Hair Care', '/productstore/personal-care/hair-care'],
  ['Hand Soap and Sanitizer', '/productstore/personal-care/hand-soap-sanitizers'],
  ['Outdoor', '/productstore/personal-care/outdoor'],
  ['Baby Care', '/productstore/personal-care/baby-care'],
  ['Acne Prevention', '/productstore/personal-care/acne-prevention'],
  ['Beauty', '/productstore/beauty'],
  ['Premium Skin Care', '/productstore/beauty/premium-skin-care'],
  ['Color Cosmetics', '/productstore/beauty/color-cosmetics'],
  ['Beauty Specials', '/productstore/beauty/beauty-specials'],
  ['Beauty Hair Care', '/productstore/beauty/hair-care'],
  ['Fragrance Perfume', '/productstore/beauty/fragranceperfume'],
  ['Now Trending Seasonal Colors', '/productstore/beauty/now-trending-seasonal-colors'],
  ['Healthy Foods and Drinks', '/productstore/healthy-foods-and-drinks'],
  ['Healthy Weight and Protein', '/productstore/healthy-foods-and-drinks/healthy-weight-protein'],
  ['Healthy Snacks', '/productstore/healthy-foods-and-drinks/healthy-snacks'],
  ['Beverages', '/productstore/healthy-foods-and-drinks/beverages'],
  ['Cooking Essentials', '/productstore/healthy-foods-and-drinks/cooking-essentials'],
  ['Fiber Drink', '/productstore/healthy-foods-and-drinks/fiber-drink'],
  ['Mints', '/productstore/healthy-foods-and-drinks/mints'],
  ['Baking Mixes', '/productstore/healthy-foods-and-drinks/baking-mixes'],
  ['Medicines and Treatments', '/productstore/medicines-and-treatments'],
  ['Home Fragrance', '/productstore/home-fragrance'],
  ['Essential Oils', '/productstore/essential-oils'],
  ['New Products', '/productstore/new-products'],
  ['Extra Savings', '/productstore/extra-savings'],
  ['Outlet Store', '/productstore/extra-savings/outlet-store'],
  ['Monthly Specials', '/productstore/extra-savings/monthly-specials'],
  ['Featured This Month', '/productstore/featured-this-month'],
  ['Curated Collections', '/productstore/curated-collections'],
  ['Family Favorites', '/productstore/curated-collections/family-favorites'],
  ['Busy Moms', '/productstore/curated-collections/busy-moms'],
  ['Beauty Essentials', '/productstore/curated-collections/beauty-essentials'],
  ['For Him', '/productstore/curated-collections/for-him'],
  ['Fitness Focus', '/productstore/curated-collections/fitness-focus'],
  ['Healthy Weight Essentials', '/productstore/curated-collections/healthy-weight-essentials'],
  ['New Member Savings Packs', '/productstore/member-savings-pack'],
  ['Logo Gear', '/productstore/logo-gear'],
  ['Sales Aids and Materials', '/productstore/sales-aids-and-materials'],
  ['Our Story', '/our-story'],
  ['Total Wellness', '/our-story/total-wellness'],
  ['Our Brands', '/our-story/our-brands'],
  ['Ingredients Philosophy', '/our-story/ingredients-philosophy'],
  ['Awards', '/our-story/awards'],
  ['Made in America', '/our-story/made-in-america'],
  ['Become a Member', '/our-story/become-a-member'],
  ['Frank L VanderSloot', '/our-story/who-we-are/frank-l-vandersloot'],
  ['R3', '/productstore/r3'],
  ['Riverbend Ranch', '/riverbendranch'],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});
const page = await context.newPage();
const results = [];

for (const [label, path] of pages) {
  const url = `https://www.melaleuca.com${path}?skipGeolocationRedirect=true&sc_lang=en-US`;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);
    const data = await page.evaluate(() => {
      const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
      const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const h1 = clean(document.querySelector('h1')?.innerText || '');
      const main = document.querySelector('main') || document.body;
      const blocks = [];
      const nodes = main.querySelectorAll('h2, h3, p, li');
      for (const node of nodes) {
        if (node.closest('header, footer, nav, [class*="navMenu"], [class*="siteHeader"], [class*="siteFooter"]')) continue;
        const text = clean(node.innerText);
        if (!text || text.length < 2) continue;
        if (text.length > 400) continue;
        const tag = node.tagName.toLowerCase();
        blocks.push({ tag, text });
        if (blocks.length >= 14) break;
      }
      return { title: document.title, h1, meta: clean(meta), blocks, finalPath: location.pathname };
    });
    results.push({ label, path, url, status: response?.status() || 0, ...data });
    console.log('ok', path, data.h1 || data.title);
  } catch (error) {
    results.push({ label, path, url, error: String(error) });
    console.log('fail', path);
  }
}

writeFileSync(new URL('./_copy.json', import.meta.url), JSON.stringify(results, null, 2));
await browser.close();
console.log('pages', results.length);
