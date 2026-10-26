/**
 * Content paths and template IDs discovered from examples/recology
 * (docs/ai/manifests/sitecore-manifest.yaml + live Marketer MCP).
 */

export const RECOLOGY_PATHS = {
  locationRoot: "/sitecore/content/recology/recology/Home/Location",
  globalFaqs: "/sitecore/content/recology/recology/Data/Global FAQs",
  regionalFaqCollections:
    "/sitecore/content/recology/recology/Data/Regional FAQ Collections",
  faqBehaviors: "/sitecore/content/recology/recology/Data/FAQ Regional Behaviors",
  cartTypes: "/sitecore/content/recology/recology/Data/Cart Types",
  cartSizes: "/sitecore/content/recology/recology/Data/Cart Sizes",
} as const;

export const RECOLOGY_TEMPLATES = {
  locationItem: "{F38AF42C-AC5C-41AC-9E7A-5BFA2DEF4E66}",
  globalFaq: "{C5B47B90-5428-415D-902B-2ED3C23AD0E6}",
  regionalFaqConfiguration: "{3560F778-A1E2-4AB2-A562-0EC524EDE0A7}",
  regionalFaqCollection: "{DDE2369B-E743-4ED3-AD27-C5A120A60484}",
  cartType: "{C06CFF53-1404-45E0-8586-316620E0FCD3}",
  cartSize: "{CECBFFCE-C0BA-4EBC-879F-172B7B313BE7}",
  locationCartRate: "{D039EE04-D7C8-4D29-A244-D28318A0CA82}",
  locationAdditionalService: "{584AA718-960C-4DB5-B5D6-82672C243859}",
  folder: "{A87A00B1-E6DB-45AB-8B54-636FEC3B5523}",
} as const;

export const FAQ_BEHAVIORS = [
  { value: "UseGlobal", label: "Use global answer", badge: "INHERITED" },
  {
    value: "AddRegionalInformation",
    label: "Add regional information",
    badge: "EXTENDED",
  },
  { value: "Override", label: "Override global answer", badge: "OVERRIDDEN" },
  { value: "Exclude", label: "Exclude from this region", badge: "EXCLUDED" },
] as const;

export const LANGUAGE = "en";
export const DATABASE = "master";
