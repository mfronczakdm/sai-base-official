# Regional Content Manager (`recology-data-mgmt`)

Sitecore Marketplace application for managing **existing** Recology SitecoreAI structured content.

| App | Role |
|---|---|
| `/examples/recology` | Customer-facing website (Content SDK / Next.js) |
| `/examples/recology/data-mgmt-app` | Marketplace Regional Content Manager |

Both apps operate on the **same** Sitecore content. This app does **not** create a second content repository.

## Scaffold note (Git `--sparse`)

`npx shadcn@latest add …` failed on Git **2.22** (`unknown option sparse`). Workaround used:

1. `create-next-app` in this folder
2. `npx shadcn@4.21.0 init` then `add` the Blok marketplace quickstart with XMC

Upgrade Git (≥ 2.25) if you prefer `shadcn@latest` project creation.

## Discovered Recology models (source of truth)

- **Regions:** `LocationItem` under `/sitecore/content/recology/recology/Home/Location`
- **Global FAQ** `{C5B47B90-…}` — Question, Answer, Category, SortOrder, Active
- **Regional FAQ Configuration** `{3560F778-…}` — GlobalFAQ, Behavior (`UseGlobal` \| `AddRegionalInformation` \| `Override` \| `Exclude`), RegionalSupportingInformation, RegionalAnswer, ContactCTA
- **Regional FAQ Collection** `{DDE2369B-…}` — FAQConfigurations multilist, optional Region → LocationItem
- Opening FAQs for a location with no collection creates `Data/Regional FAQ Collections/{Location name}`, sets Region to that LocationItem, and adds one `UseGlobal` configuration per Global FAQ. Existing regional answers are not overwritten. The public FAQ page still uses whatever RegionalFAQ datasource is assigned on the page.
- **Cart Types (global):** `/Data/Cart Types` → `CartType` (Name, Color, Stream, Description, …) — Green / Blue / Black or Gray
- **Cart Sizes (global):** `/Data/Cart Sizes` → `CartSize` (Name, Capacity, Dimensions, …)
- **Regional checklist:** LocationItem `CartTypes` + `CartSizes` multilists (which globals apply)
- **Cart rates:** LocationItem `CartRates` → `LocationCartRate` (CartSize, MonthlyRate, Dimensions, TypicalWeeklyNeeds)
- **Services:** LocationItem `AdditionalServices` → `LocationAdditionalService` (ServiceName, Cost, IsSectionHeader)

## Data access

Uses Marketplace SDK:

- `@sitecore-marketplace-sdk/client`
- `@sitecore-marketplace-sdk/xmc`
- Verified operation: `client.mutate("xmc.authoring.graphql", …)` for Authoring GraphQL reads/writes

No silent mock fallback when Sitecore is unavailable.

## Run

```bash
cd examples/recology/data-mgmt-app
npm install
npm run dev
```

For live content, install/open the app from **Sitecore Marketplace** with SitecoreAI API access. Standalone `localhost` shows the shell and a clear disconnected state.

## App routes

- `/` Overview (counts from live content)
- `/faqs` Global + regional FAQ behavior editing
- `/carts` Cart rates for selected LocationItem
- `/services` Additional services for selected LocationItem
