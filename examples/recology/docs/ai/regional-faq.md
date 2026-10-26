# Regional FAQ (Recology)

Reusable, region-aware FAQ capability for multi-region waste and recycling sites. Global FAQ content is authored once; each region configures behavior without copying the global question/answer.

## Purpose

### Global FAQ items

Centrally managed Q&A items under `/sitecore/content/recology/recology/Data/Global FAQs`. These are the single source of truth for questions and default answers.

### Regional FAQ Configuration items

Per-region settings that **reference** a Global FAQ and choose a behavior. They may add supporting copy, override the answer, or exclude the FAQ. They do not duplicate the global question.

### Regional FAQ Collection

Datasource for the `RegionalFAQ` component. Holds heading/intro UI fields and an ordered Treelist of configurations for one service area (for example San Francisco).

## Four regional behaviors

| Editor label | Stable value | Result |
|---|---|---|
| Use global answer | `UseGlobal` | Global question + global answer |
| Add regional information | `AddRegionalInformation` | Global question + global answer + regional supporting information |
| Override global answer | `Override` | Global question + regional answer (falls back to global if regional answer empty) |
| Exclude from this region | `Exclude` | FAQ is not rendered |

## Fallback behavior

1. No regional configuration → treat as `UseGlobal` when resolving a global item alone.
2. Incomplete Override (missing regional answer) → global answer.
3. Missing Global FAQ reference → skip item (no throw).
4. Unknown behavior string → `UseGlobal`.
5. Inactive global FAQ or inactive configuration → skip.
6. Empty answers → skip item rather than render an empty panel.
7. Sitecore empty dates (`0001-01-01`) are ignored; only real Effective/Expiration values filter items.

## Editor workflows

### Add a new global FAQ

1. Insert under `Data/Global FAQs` using template **Global FAQ**.
2. Set Question, Answer, Category, Sort Order, Active.

### Adopt an FAQ for a region

1. Open the region’s **Regional FAQ Collection** (or create one under `Data/Regional FAQ Collections`).
2. Insert a **Regional FAQ Configuration** child (or create under the collection).
3. Set **Global FAQ** (Treelist, pick one), **Behavior** = Use global answer.
4. Add the configuration to the collection’s **FAQ Configurations** Treelist.

### Add supporting information

Same as adopt, but Behavior = Add regional information, and fill **Regional Supporting Information** (optional Contact CTA).

### Override an answer

Behavior = Override global answer, fill **Regional Answer**.

### Exclude an FAQ

Behavior = Exclude from this region. The FAQ will not appear for that collection.

### Add the component to a page

1. In Page Builder, insert **RegionalFAQ** into `headless-main` (Available Renderings → Page Content).
2. Assign a **Regional FAQ Collection** datasource (for example `Data/Regional FAQ Collections/Recology American Canyon`).

## Demo pages (wired)

| Page | Route | Datasource collection |
|---|---|---|
| Global FAQ | `/FAQ` | `Data/Regional FAQ Collections/Global Shared` (all 7 FAQs, UseGlobal) |
| American Canyon FAQ | `/Location/Recology-American-Canyon/FAQ` | `Data/Regional FAQ Collections/Recology American Canyon` |

### Recology American Canyon behaviors

| Global FAQ | Behavior |
|---|---|
| How do I find my service area? | UseGlobal |
| How do I report a missed pickup? | AddRegionalInformation |
| How should carts be placed at the curb? | UseGlobal |
| How do I search for an accepted material? | UseGlobal |
| How do I contact customer service? | AddRegionalInformation |
| What should I do with hazardous materials? | Exclude |
| How do holiday schedules work? | Override |

## Worked example

Global FAQ: **How do I report a missed pickup?**

| Region collection | Behavior | Notes |
|---|---|---|
| Recology American Canyon | AddRegionalInformation | Placeholder AC supporting copy + placeholder CTA |
| San Francisco | AddRegionalInformation | Placeholder SF supporting copy + placeholder CTA |
| Portland | Override | Placeholder Portland-specific answer |
| Seattle | UseGlobal | Global answer unchanged |
| Example Non-Applicable Region | Exclude (hazardous materials FAQ) | Hazardous FAQ hidden; other FAQs can still show |

## Region resolution

There is no automatic geolocation or hostname→region resolver for FAQs.

- The page component is **datasource-driven**.
- The selected **Regional FAQ Collection** defines the region (optional Region droptree to a `LocationItem` under `Home/Location` for authoring clarity).
- Future automatic site-to-region resolution can set the datasource from the current `LocationItem` without changing the resolver.

## Content querying

Integrated GraphQL `ComponentQuery` on the JSON Rendering expands:

- Collection presentation fields
- `FAQConfigurations` via `MultilistField.targetItems`
- Each configuration’s `GlobalFAQ` via nested `MultilistField.targetItems`
- Behavior as Droplist string (`UseGlobal`, etc.)

Nested folder `children { children }` is avoided (Edge layout complexity).

## Known limitations

- `__Standard values` links may need confirmation in Content Editor (MCP silent-write).
- Folder `__Masters` insert options for Global FAQs / Collections should be confirmed in CE.
- Publish templates, content, rendering, and variants to Edge before delivery sites update.
- Behavior Droplist stores item **names** (`UseGlobal`); keep option item names stable.
- GlobalFAQ Treelist should contain exactly one selected item per configuration.

## Files

### Created

- `src/components/uiim/faq/RegionalFAQ.tsx`
- `src/components/uiim/faq/regional-faq.props.ts`
- `src/components/uiim/faq/resolve-regional-faq.ts`
- `src/__tests__/uiim/faq/resolve-regional-faq.test.ts`
- `src/__tests__/uiim/faq/RegionalFAQ.test.tsx`
- `docs/ai/regional-faq.md`

### Sitecore (via Marketer MCP)

Templates under `/sitecore/templates/Project/recology/`, content under `Data/Global FAQs` and `Data/Regional FAQ Collections`, rendering `RegionalFAQ` `{4A6D97FA-CA24-4A30-BA70-634D01D1D78F}`.
