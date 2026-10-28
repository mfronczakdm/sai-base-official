/** Domain types aligned with /examples/recology Sitecore models (not a second repository). */

export type RegionalFaqBehavior =
  | "UseGlobal"
  | "AddRegionalInformation"
  | "Override"
  | "Exclude";

export type BehaviorBadge =
  | "GLOBAL"
  | "INHERITED"
  | "EXTENDED"
  | "OVERRIDDEN"
  | "EXCLUDED";

export type SitecoreFieldMap = Record<string, string>;

export type SitecoreItemSummary = {
  id: string;
  name: string;
  path: string;
  templateName?: string;
  fields: SitecoreFieldMap;
};

export type RegionOption = {
  id: string;
  name: string;
  path: string;
  /** Optional Regional FAQ Collection item id linked via Region droptree or name match */
  faqCollectionId?: string;
  faqCollectionPath?: string;
};

export type EnsureRegionalFaqResult = {
  region: RegionOption;
  createdCollection: boolean;
  createdConfigurationCount: number;
};

export type RegionalFaqSaveInput = {
  globalFaqId: string;
  configId?: string;
  behavior: RegionalFaqBehavior;
  regionalSupportingInformation: string;
  regionalAnswer: string;
};

export type GlobalFaq = {
  id: string;
  name: string;
  path: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type RegionalFaqConfig = {
  id: string;
  name: string;
  path: string;
  globalFaqId: string;
  behavior: RegionalFaqBehavior;
  regionalSupportingInformation: string;
  regionalAnswer: string;
  contactCta: string;
  sortOrder: number;
  active: boolean;
};

export type FaqRow = {
  global: GlobalFaq;
  config?: RegionalFaqConfig;
  behavior: RegionalFaqBehavior;
  badge: BehaviorBadge;
};

export type CartType = {
  id: string;
  name: string;
  path: string;
  displayName: string;
  code: string;
  capacity: string;
  unit: string;
  containerType: string;
  dimensions: string;
  description: string;
  color: string;
  stream: string;
};

export type CartSize = {
  id: string;
  name: string;
  path: string;
  displayName: string;
  code: string;
  capacity: string;
  unit: string;
  dimensions: string;
  description: string;
};

export type CartRate = {
  id: string;
  name: string;
  path: string;
  cartSizeId: string;
  monthlyRate: string;
  dimensions: string;
  typicalWeeklyNeeds: string;
};

export type AdditionalService = {
  id: string;
  name: string;
  path: string;
  serviceName: string;
  cost: string;
  isSectionHeader: boolean;
};

export type RegionRatesSummary = {
  ratesHeading: string;
  ratesIntro: string;
  importantNotes: string;
  careProgramHeading: string;
  careProgramContent: string;
  cartRates: CartRate[];
  additionalServices: AdditionalService[];
  /** LocationItem CartTypes multilist — which color streams apply */
  selectedCartTypeIds: string[];
  /** LocationItem CartSizes multilist — which sizes apply */
  selectedCartSizeIds: string[];
  cartRatesFolderId?: string;
  cartRatesFolderPath?: string;
  servicesFolderId?: string;
  servicesFolderPath?: string;
};

export type RegionOverviewStats = {
  regionName: string;
  faqs: {
    inherited: number;
    extended: number;
    overridden: number;
    excluded: number;
    unconfigured: number;
    totalGlobal: number;
  };
  carts: {
    cartTypesConfigured: number;
  };
  services: {
    servicesConfigured: number;
  };
};
