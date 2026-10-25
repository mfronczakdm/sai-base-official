# Recology — Sitecore Content Tree (IA draft)

Source: https://www.recology.com/
Client key: recology
Extracted: 2026-10-24
Extracted by: get-site-ia
Max depth: 3
Confidence: high

## Hand-off to sitecore-create-ia
- IA file: `docs/ai/ia/recology-ia.md`
- Site name: _(fill when creating)_
- Content root: _(e.g. /sitecore/content/<collection>/<site>/Home)_
- Page template ID: _(fill when creating)_
- Folder template ID: _(n/a — no folder/shared nodes)_

## Notes
- Primary menu and utility bar parsed from the live homepage header. Hub URLs confirmed in `page-sitemap.xml`.
- Home exists in Sitecore — skip creating Home; tree lists L1+ children only.
- Nav order: utility bar (Pay My Bill, FAQ, Contact Us), then main menu (About Us, Community Impact, Sustainability, Organics, Careers).
- About Us, Community Impact, Sustainability, Organics, and Careers use dropdown toggles (`href="#"`) and also have real hub pages, so they are pages.
- Sustainability display name; live hub path is `/resource-recovery/`. Battery Safety stays under Sustainability; live path is `/battery-safety/`.
- Who We Are is the Organics hub (`/recology-organics/`) — one page, label Organics.
- Working at Recology is the Careers hub (`/careers/`) — one page, label Careers. Internships (`/careers/internships/`) is the sitemap child and is included.
- Location companies and cities (California, Oregon, Washington; about 1,300 sitemap URLs) are excluded. Where We Serve is the corporate locations page.
- News archive and individual articles are excluded (homepage module, not in the main menu).
- Footer legal pages and Compliance are excluded.
- Sitemap-only page `/community-impact/success-stories/recology-in-the-news` is excluded (not in the menu).

## Tree (creatable items only)

- Pay My Bill
- FAQ
- Contact Us
- About Us
  - Our Mission & Vision
  - Employee-Owned
  - Where We Serve
  - Our History
  - Our Leadership
- Community Impact
  - Recology in the News
  - Success Stories
  - Government Partnership
  - The Art of Recology
  - Volunteer Program
  - Education & Outreach
- Sustainability
  - Sustainability at Recology
  - Sustainable Operations
  - Recycling
  - Composting
  - Community Engagement
  - Technology & Innovation
  - Commodities
  - Battery Safety
- Organics
  - Our Products
    - Compost
    - Mulch
    - Soil Blends
  - Specialty Services
  - Testimonials
  - Partnerships
- Careers
  - Internships
