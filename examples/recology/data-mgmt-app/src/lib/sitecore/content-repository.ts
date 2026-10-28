import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { ApplicationContext } from "@sitecore-marketplace-sdk/client";
import {
  authoringGraphql,
  getSitecoreContextId,
} from "@/lib/sitecore/authoring-client";
import {
  fieldValue,
  formatGuidBraced,
  guidsEqual,
  isChecked,
  nodesToFieldMap,
  normalizeBehavior,
  parseIdList,
  parseSitecoreDate,
  parseSortOrder,
  toMultilistValue,
} from "@/lib/sitecore/field-utils";
import {
  DATABASE,
  LANGUAGE,
  RECOLOGY_PATHS,
  RECOLOGY_TEMPLATES,
} from "@/lib/sitecore/paths";
import type {
  AdditionalService,
  CartRate,
  CartSize,
  CartType,
  EnsureRegionalFaqResult,
  FaqRow,
  GlobalFaq,
  RegionOption,
  RegionOverviewStats,
  RegionRatesSummary,
  RegionalFaqConfig,
  RegionalFaqSaveInput,
  SitecoreItemSummary,
} from "@/types/content";

type AuthoringItemNode = {
  itemId?: string;
  name?: string;
  path?: string;
  template?: { name?: string };
  fields?: { nodes?: Array<{ name?: string; value?: string } | null> };
  children?: { nodes?: AuthoringItemNode[] };
};

function mapItem(node: AuthoringItemNode | null | undefined): SitecoreItemSummary | null {
  if (!node?.itemId || !node.name) return null;
  return {
    id: node.itemId,
    name: node.name,
    path: node.path || "",
    templateName: node.template?.name,
    fields: nodesToFieldMap(node.fields?.nodes),
  };
}

const ITEM_FIELDS = `
  itemId
  name
  path
  template { name }
  fields(ownFields: true, excludeStandardFields: true) {
    nodes { name value }
  }
`;

async function getItemByPath(
  client: ClientSDK,
  contextId: string,
  path: string,
  withChildren = false,
): Promise<AuthoringItemNode | null> {
  const childrenFragment = withChildren
    ? `children { nodes { ${ITEM_FIELDS} children { nodes { ${ITEM_FIELDS} } } } }`
    : "";

  const result = await authoringGraphql<{ item?: AuthoringItemNode }>(
    client,
    contextId,
    `
    query GetItem($path: String!) {
      item(where: { database: "${DATABASE}", path: $path }) {
        ${ITEM_FIELDS}
        ${childrenFragment}
      }
    }
    `,
    { path },
  );

  return result.data?.item ?? null;
}

async function getItemById(
  client: ClientSDK,
  contextId: string,
  itemId: string,
): Promise<AuthoringItemNode | null> {
  const result = await authoringGraphql<{ item?: AuthoringItemNode }>(
    client,
    contextId,
    `
    query GetItemById($itemId: String!) {
      item(where: { database: "${DATABASE}", itemId: $itemId, language: "${LANGUAGE}" }) {
        ${ITEM_FIELDS}
      }
    }
    `,
    { itemId },
  );
  return result.data?.item ?? null;
}

export class ContentRepository {
  constructor(
    private client: ClientSDK,
    private appContext: ApplicationContext,
  ) {}

  private requireContextId(): string {
    const id = getSitecoreContextId(this.appContext);
    if (!id) {
      throw new Error(
        "Sitecore Context ID not found in application context. Configure SitecoreAI API access for this Marketplace app.",
      );
    }
    return id;
  }

  async listRegions(): Promise<RegionOption[]> {
    const contextId = this.requireContextId();
    const locationRoot = await getItemByPath(
      this.client,
      contextId,
      RECOLOGY_PATHS.locationRoot,
      true,
    );
    const collectionsRoot = await getItemByPath(
      this.client,
      contextId,
      RECOLOGY_PATHS.regionalFaqCollections,
      true,
    );

    const collections = (collectionsRoot?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));

    const locations = (locationRoot?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item))
      .filter((item) => item.templateName === "LocationItem" || !item.templateName);

    return locations.map((location) => {
      const byRegionField = collections.find((collection) =>
        guidsEqual(fieldValue(collection.fields, "Region"), location.id),
      );
      const byName = collections.find(
        (collection) =>
          collection.name.toLowerCase() === location.name.toLowerCase(),
      );
      const matched = byRegionField || byName;
      return {
        id: location.id,
        name: location.name,
        path: location.path,
        faqCollectionId: matched?.id,
        faqCollectionPath: matched?.path,
      };
    });
  }

  async listGlobalFaqs(): Promise<GlobalFaq[]> {
    const contextId = this.requireContextId();
    // Include standard fields so we can surface Created / Updated / Author in the list UI.
    const result = await authoringGraphql<{ item?: AuthoringItemNode }>(
      this.client,
      contextId,
      `
      query GetGlobalFaqs($path: String!) {
        item(where: { database: "${DATABASE}", path: $path }) {
          children {
            nodes {
              itemId
              name
              path
              template { name }
              fields(ownFields: false, excludeStandardFields: false) {
                nodes { name value }
              }
            }
          }
        }
      }
      `,
      { path: RECOLOGY_PATHS.globalFaqs },
    );

    return (result.data?.item?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item))
      .map((item) => {
        const createdAt = parseSitecoreDate(
          fieldValue(item.fields, "__Created", "Created"),
        );
        const updatedAt =
          parseSitecoreDate(fieldValue(item.fields, "__Updated", "Updated")) ||
          createdAt;
        return {
          id: item.id,
          name: item.name,
          path: item.path,
          question: fieldValue(item.fields, "Question") || item.name,
          answer: fieldValue(item.fields, "Answer"),
          category: fieldValue(item.fields, "Category"),
          sortOrder: parseSortOrder(fieldValue(item.fields, "SortOrder")),
          active: isChecked(fieldValue(item.fields, "Active")),
          createdAt,
          updatedAt,
          createdBy: fieldValue(
            item.fields,
            "__Created by",
            "Created by",
            "__Owner",
          ),
          updatedBy: fieldValue(item.fields, "__Updated by", "Updated by"),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.question.localeCompare(b.question));
  }

  async listRegionalFaqConfigs(collectionPath: string): Promise<RegionalFaqConfig[]> {
    const contextId = this.requireContextId();
    const collection = await getItemByPath(this.client, contextId, collectionPath, true);
    if (!collection) return [];

    const collectionFields = nodesToFieldMap(collection.fields?.nodes);
    const mappedChildren = (collection.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));

    const multilistIds = parseIdList(fieldValue(collectionFields, "FAQConfigurations"));

    // Prefer ordered multilist when present; otherwise use child configs.
    let ordered = mappedChildren;
    if (multilistIds.length > 0) {
      const byId = new Map(mappedChildren.map((c) => [c.id.replace(/[{}-]/g, "").toUpperCase(), c]));
      ordered = multilistIds
        .map((id) => byId.get(id.replace(/-/g, "")))
        .filter((item): item is SitecoreItemSummary => Boolean(item));
      if (ordered.length === 0) {
        ordered = mappedChildren;
      }
    }

    return ordered.map((item) => {
      const globalRaw = fieldValue(item.fields, "GlobalFAQ");
      const globalIds = parseIdList(globalRaw);
      return {
        id: item.id,
        name: item.name,
        path: item.path,
        globalFaqId: globalIds[0] || globalRaw,
        behavior: normalizeBehavior(fieldValue(item.fields, "Behavior")),
        regionalSupportingInformation: fieldValue(
          item.fields,
          "RegionalSupportingInformation",
        ),
        regionalAnswer: fieldValue(item.fields, "RegionalAnswer"),
        contactCta: fieldValue(item.fields, "ContactCTA"),
        sortOrder: parseSortOrder(fieldValue(item.fields, "SortOrder")),
        active: isChecked(fieldValue(item.fields, "Active")),
      };
    });
  }

  /**
   * Creates the region's Regional FAQ Collection when none is linked, and a
   * UseGlobal configuration for every Global FAQ that does not have one yet.
   * Existing collections and configurations are left as authored.
   */
  async ensureRegionalFaqCollection(
    region: RegionOption,
  ): Promise<EnsureRegionalFaqResult> {
    let createdCollection = false;
    let collection = await this.findCollectionForRegion(region);

    if (!collection) {
      const folder = await this.requireFolder(
        RECOLOGY_PATHS.regionalFaqCollections,
        "Regional FAQ Collections",
      );
      try {
        collection = await this.createChildItem({
          parentId: folder.itemId!,
          templateId: RECOLOGY_TEMPLATES.regionalFaqCollection,
          name: region.name,
          fields: [
            { name: "Title", value: `${region.name} FAQs` },
            { name: "Heading", value: "Frequently Asked Questions" },
            {
              name: "IntroductoryText",
              value: `<p>Answers for the ${region.name} service area.</p>`,
            },
            { name: "ExpandFirstItem", value: "1" },
            { name: "ShowCategories", value: "1" },
            {
              name: "EmptyStateMessage",
              value: "No FAQs are available for this region.",
            },
            { name: "Region", value: formatGuidBraced(region.id) },
          ],
        });
        createdCollection = true;
      } catch (error) {
        collection = await this.findCollectionForRegion(region);
        if (!collection) throw error;
      }
    } else if (!guidsEqual(fieldValue(collection.fields, "Region"), region.id)) {
      await this.updateItemFields(collection.id, [
        { name: "Region", value: formatGuidBraced(region.id) },
      ]);
    }

    const collectionPath =
      collection.path ||
      `${RECOLOGY_PATHS.regionalFaqCollections}/${collection.name}`;
    const globals = await this.listGlobalFaqs();
    const existing = await this.listRegionalFaqConfigs(collectionPath);
    const usedNames = new Set(existing.map((config) => config.name.toLowerCase()));
    const createdIds: string[] = [];

    for (const global of globals) {
      if (existing.some((config) => guidsEqual(config.globalFaqId, global.id))) {
        continue;
      }
      const created = await this.createChildItem({
        parentId: collection.id,
        templateId: RECOLOGY_TEMPLATES.regionalFaqConfiguration,
        name: uniqueConfigName(global.question, usedNames),
        fields: [
          { name: "GlobalFAQ", value: formatGuidBraced(global.id) },
          { name: "Behavior", value: "UseGlobal" },
          { name: "SortOrder", value: String(global.sortOrder) },
          { name: "Active", value: "1" },
        ],
      });
      createdIds.push(created.id);
    }

    if (createdIds.length > 0) {
      await this.updateItemFields(collection.id, [
        {
          name: "FAQConfigurations",
          value: toMultilistValue([...existing.map((config) => config.id), ...createdIds]),
        },
      ]);
    }

    return {
      region: {
        ...region,
        faqCollectionId: collection.id,
        faqCollectionPath: collectionPath,
      },
      createdCollection,
      createdConfigurationCount: createdIds.length,
    };
  }

  async saveRegionalFaq(
    region: RegionOption,
    input: RegionalFaqSaveInput,
  ): Promise<RegionOption> {
    let nextRegion = region;
    let configId = input.configId;

    if (!configId || !nextRegion.faqCollectionPath) {
      const ensured = await this.ensureRegionalFaqCollection(nextRegion);
      nextRegion = ensured.region;
      const configs = nextRegion.faqCollectionPath
        ? await this.listRegionalFaqConfigs(nextRegion.faqCollectionPath)
        : [];
      configId = configs.find((config) =>
        guidsEqual(config.globalFaqId, input.globalFaqId),
      )?.id;
    }

    if (!configId) {
      throw new Error(
        "Could not create a Regional FAQ Configuration for this FAQ.",
      );
    }

    await this.updateItemFields(configId, [
      { name: "Behavior", value: input.behavior },
      {
        name: "RegionalSupportingInformation",
        value: input.regionalSupportingInformation,
      },
      { name: "RegionalAnswer", value: input.regionalAnswer },
    ]);

    return nextRegion;
  }

  async getFaqRowsForRegion(region: RegionOption): Promise<FaqRow[]> {
    const globals = await this.listGlobalFaqs();
    const configs = region.faqCollectionPath
      ? await this.listRegionalFaqConfigs(region.faqCollectionPath)
      : [];

    return globals.map((global) => {
      const config = configs.find((c) => guidsEqual(c.globalFaqId, global.id));
      const behavior = config?.behavior ?? "UseGlobal";
      const badge =
        !config
          ? ("GLOBAL" as const)
          : behavior === "UseGlobal"
            ? ("INHERITED" as const)
            : behavior === "AddRegionalInformation"
              ? ("EXTENDED" as const)
              : behavior === "Override"
                ? ("OVERRIDDEN" as const)
                : ("EXCLUDED" as const);

      return { global, config, behavior, badge };
    });
  }

  async getRegionRates(region: RegionOption): Promise<RegionRatesSummary> {
    const contextId = this.requireContextId();
    const location = await getItemByPath(this.client, contextId, region.path, true);
    if (!location) {
      throw new Error(`Location item not found: ${region.path}`);
    }

    const fields = nodesToFieldMap(location.fields?.nodes);
    const cartRateIds = parseIdList(fieldValue(fields, "CartRates"));
    const serviceIds = parseIdList(fieldValue(fields, "AdditionalServices"));
    const selectedCartTypeIds = parseIdList(fieldValue(fields, "CartTypes"));
    const selectedCartSizeIds = parseIdList(fieldValue(fields, "CartSizes"));

    const childFolders = location.children?.nodes || [];
    const cartFolder = childFolders.find((c) => c.name === "Cart Rates");
    const servicesFolder = childFolders.find((c) => c.name === "Additional Services");

    const cartFromFolder = (cartFolder?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));
    const servicesFromFolder = (servicesFolder?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));

    const pickOrdered = (ids: string[], items: SitecoreItemSummary[]) => {
      if (!ids.length) return items;
      const byId = new Map(
        items.map((item) => [item.id.replace(/[{}-]/g, "").toUpperCase(), item]),
      );
      const ordered = ids
        .map((id) => byId.get(id.replace(/-/g, "")))
        .filter((item): item is SitecoreItemSummary => Boolean(item));
      return ordered.length ? ordered : items;
    };

    const cartRates: CartRate[] = pickOrdered(cartRateIds, cartFromFolder).map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      cartSizeId: parseIdList(fieldValue(item.fields, "CartSize"))[0] || "",
      monthlyRate: fieldValue(item.fields, "MonthlyRate"),
      dimensions: fieldValue(item.fields, "Dimensions"),
      typicalWeeklyNeeds: fieldValue(item.fields, "TypicalWeeklyNeeds"),
    }));

    const additionalServices: AdditionalService[] = pickOrdered(
      serviceIds,
      servicesFromFolder,
    ).map((item) => {
      const flag = fieldValue(item.fields, "IsSectionHeader");
      return {
        id: item.id,
        name: item.name,
        path: item.path,
        serviceName: fieldValue(item.fields, "ServiceName") || item.name,
        cost: fieldValue(item.fields, "Cost"),
        isSectionHeader: flag === "1" || flag === "true" || flag === "True",
      };
    });

    return {
      ratesHeading: fieldValue(fields, "RatesHeading"),
      ratesIntro: fieldValue(fields, "RatesIntro"),
      importantNotes: fieldValue(fields, "ImportantNotes"),
      careProgramHeading: fieldValue(fields, "CareProgramHeading"),
      careProgramContent: fieldValue(fields, "CareProgramContent"),
      cartRates,
      additionalServices,
      selectedCartTypeIds,
      selectedCartSizeIds,
      cartRatesFolderId: cartFolder?.itemId,
      cartRatesFolderPath: cartFolder?.path,
      servicesFolderId: servicesFolder?.itemId,
      servicesFolderPath: servicesFolder?.path,
    };
  }

  async getOverviewStats(region: RegionOption): Promise<RegionOverviewStats> {
    const [faqRows, rates] = await Promise.all([
      this.getFaqRowsForRegion(region),
      this.getRegionRates(region),
    ]);

    return {
      regionName: region.name,
      faqs: {
        inherited: faqRows.filter((r) => r.badge === "INHERITED").length,
        extended: faqRows.filter((r) => r.badge === "EXTENDED").length,
        overridden: faqRows.filter((r) => r.badge === "OVERRIDDEN").length,
        excluded: faqRows.filter((r) => r.badge === "EXCLUDED").length,
        unconfigured: faqRows.filter((r) => r.badge === "GLOBAL").length,
        totalGlobal: faqRows.length,
      },
      carts: {
        cartTypesConfigured: rates.cartRates.length,
      },
      services: {
        servicesConfigured: rates.additionalServices.filter((s) => !s.isSectionHeader)
          .length,
      },
    };
  }

  async updateItemFields(
    itemId: string,
    fields: Array<{ name: string; value: string }>,
  ): Promise<void> {
    const contextId = this.requireContextId();
    const fieldInputs = fields
      .map(
        (field) =>
          `{ name: "${field.name}", value: ${JSON.stringify(field.value)}, reset: false }`,
      )
      .join(", ");

    await authoringGraphql(
      this.client,
      contextId,
      `
      mutation {
        updateItem(
          input: {
            itemId: "${itemId}"
            language: "${LANGUAGE}"
            database: "${DATABASE}"
            fields: [${fieldInputs}]
          }
        ) {
          item { itemId name }
        }
      }
      `,
    );
  }

  async createGlobalFaq(input: {
    question: string;
    answer: string;
    category?: string;
    sortOrder?: number;
    active?: boolean;
  }): Promise<GlobalFaq> {
    const contextId = this.requireContextId();
    const folder = await getItemByPath(
      this.client,
      contextId,
      RECOLOGY_PATHS.globalFaqs,
      false,
    );
    if (!folder?.itemId) {
      throw new Error(`Global FAQs folder not found at ${RECOLOGY_PATHS.globalFaqs}`);
    }

    const itemName = toSitecoreItemName(input.question);
    const activeValue = input.active === false ? "" : "1";
    const sortOrder = String(input.sortOrder ?? 100);
    const category = input.category ?? "";

    const result = await authoringGraphql<{
      createItem?: { item?: AuthoringItemNode };
    }>(
      this.client,
      contextId,
      `
      mutation {
        createItem(
          input: {
            name: ${JSON.stringify(itemName)}
            templateId: "${RECOLOGY_TEMPLATES.globalFaq}"
            parent: "${folder.itemId}"
            language: "${LANGUAGE}"
            fields: [
              { name: "Question", value: ${JSON.stringify(input.question)} }
              { name: "Answer", value: ${JSON.stringify(input.answer)} }
              { name: "Category", value: ${JSON.stringify(category)} }
              { name: "SortOrder", value: ${JSON.stringify(sortOrder)} }
              { name: "Active", value: ${JSON.stringify(activeValue)} }
            ]
          }
        ) {
          item {
            ${ITEM_FIELDS}
          }
        }
      }
      `,
    );

    const created = mapItem(result.data?.createItem?.item);
    if (!created) {
      throw new Error("createItem did not return a Global FAQ item");
    }

    return {
      id: created.id,
      name: created.name,
      path: created.path,
      question: fieldValue(created.fields, "Question") || input.question,
      answer: fieldValue(created.fields, "Answer") || input.answer,
      category: fieldValue(created.fields, "Category") || category,
      sortOrder: parseSortOrder(fieldValue(created.fields, "SortOrder") || sortOrder),
      active: isChecked(fieldValue(created.fields, "Active") || activeValue),
    };
  }

  async updateGlobalFaq(
    itemId: string,
    input: {
      question: string;
      answer: string;
      category: string;
      sortOrder: number;
      active: boolean;
    },
  ): Promise<void> {
    await this.updateItemFields(itemId, [
      { name: "Question", value: input.question },
      { name: "Answer", value: input.answer },
      { name: "Category", value: input.category },
      { name: "SortOrder", value: String(input.sortOrder) },
      { name: "Active", value: input.active ? "1" : "" },
    ]);
  }

  async deleteItem(itemId: string, permanently = false): Promise<void> {
    const contextId = this.requireContextId();
    const result = await authoringGraphql<{
      deleteItem?: { successful?: boolean };
    }>(
      this.client,
      contextId,
      `
      mutation {
        deleteItem(
          input: {
            itemId: "${itemId}"
            permanently: ${permanently ? "true" : "false"}
          }
        ) {
          successful
        }
      }
      `,
    );

    if (!result.data?.deleteItem?.successful) {
      throw new Error("Delete failed — check Marketplace authoring permissions");
    }
  }

  async listCartTypes(): Promise<CartType[]> {
    const items = await this.listChildren(RECOLOGY_PATHS.cartTypes);
    return items
      .map(mapCartType)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async listCartSizes(): Promise<CartSize[]> {
    const items = await this.listChildren(RECOLOGY_PATHS.cartSizes);
    return items
      .map(mapCartSize)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async createCartType(input: CartTypeInput): Promise<CartType> {
    const folder = await this.requireFolder(
      RECOLOGY_PATHS.cartTypes,
      "Cart Types",
    );
    const created = await this.createChildItem({
      parentId: folder.itemId!,
      templateId: RECOLOGY_TEMPLATES.cartType,
      name: input.displayName || input.name || "New Cart Type",
      fields: cartTypeFields(input),
    });
    return mapCartType(created);
  }

  async updateCartType(itemId: string, input: CartTypeInput): Promise<void> {
    await this.updateItemFields(itemId, cartTypeFields(input));
  }

  async createCartSize(input: CartSizeInput): Promise<CartSize> {
    const folder = await this.requireFolder(
      RECOLOGY_PATHS.cartSizes,
      "Cart Sizes",
    );
    const created = await this.createChildItem({
      parentId: folder.itemId!,
      templateId: RECOLOGY_TEMPLATES.cartSize,
      name: input.displayName || input.name || "New Cart Size",
      fields: cartSizeFields(input),
    });
    return mapCartSize(created);
  }

  async updateCartSize(itemId: string, input: CartSizeInput): Promise<void> {
    await this.updateItemFields(itemId, cartSizeFields(input));
  }

  async setRegionCartTypes(regionId: string, typeIds: string[]): Promise<void> {
    await this.updateItemFields(regionId, [
      { name: "CartTypes", value: toMultilistValue(typeIds) },
    ]);
  }

  async setRegionCartSizes(regionId: string, sizeIds: string[]): Promise<void> {
    await this.updateItemFields(regionId, [
      { name: "CartSizes", value: toMultilistValue(sizeIds) },
    ]);
  }

  async createCartRate(
    region: RegionOption,
    input: {
      name: string;
      cartSizeId?: string;
      monthlyRate: string;
      dimensions: string;
      typicalWeeklyNeeds: string;
    },
  ): Promise<CartRate> {
    const rates = await this.getRegionRates(region);
    const parentId = rates.cartRatesFolderId;
    if (!parentId) {
      throw new Error(
        `No "Cart Rates" folder under ${region.name}. Create it in Sitecore first.`,
      );
    }

    const fields = [
      { name: "MonthlyRate", value: input.monthlyRate },
      { name: "Dimensions", value: input.dimensions },
      { name: "TypicalWeeklyNeeds", value: input.typicalWeeklyNeeds },
    ];
    if (input.cartSizeId) {
      fields.push({ name: "CartSize", value: formatGuidBraced(input.cartSizeId) });
    }

    const created = await this.createChildItem({
      parentId,
      templateId: RECOLOGY_TEMPLATES.locationCartRate,
      name: input.name,
      fields,
    });

    // Keep LocationItem CartRates multilist in sync when present
    const nextIds = [...rates.cartRates.map((r) => r.id), created.id];
    await this.updateItemFields(region.id, [
      { name: "CartRates", value: toMultilistValue(nextIds) },
    ]);

    return {
      id: created.id,
      name: created.name,
      path: created.path,
      cartSizeId: input.cartSizeId || "",
      monthlyRate: fieldValue(created.fields, "MonthlyRate") || input.monthlyRate,
      dimensions: fieldValue(created.fields, "Dimensions") || input.dimensions,
      typicalWeeklyNeeds:
        fieldValue(created.fields, "TypicalWeeklyNeeds") ||
        input.typicalWeeklyNeeds,
    };
  }

  async updateCartRate(
    itemId: string,
    input: {
      monthlyRate: string;
      dimensions: string;
      typicalWeeklyNeeds: string;
      cartSizeId?: string;
    },
  ): Promise<void> {
    const fields = [
      { name: "MonthlyRate", value: input.monthlyRate },
      { name: "Dimensions", value: input.dimensions },
      { name: "TypicalWeeklyNeeds", value: input.typicalWeeklyNeeds },
    ];
    if (input.cartSizeId !== undefined) {
      fields.push({
        name: "CartSize",
        value: input.cartSizeId ? formatGuidBraced(input.cartSizeId) : "",
      });
    }
    await this.updateItemFields(itemId, fields);
  }

  async createAdditionalService(
    region: RegionOption,
    input: {
      name: string;
      serviceName: string;
      cost: string;
      isSectionHeader: boolean;
    },
  ): Promise<AdditionalService> {
    const rates = await this.getRegionRates(region);
    const parentId = rates.servicesFolderId;
    if (!parentId) {
      throw new Error(
        `No "Additional Services" folder under ${region.name}. Create it in Sitecore first.`,
      );
    }

    const created = await this.createChildItem({
      parentId,
      templateId: RECOLOGY_TEMPLATES.locationAdditionalService,
      name: input.name || input.serviceName,
      fields: [
        { name: "ServiceName", value: input.serviceName },
        { name: "Cost", value: input.cost },
        { name: "IsSectionHeader", value: input.isSectionHeader ? "1" : "" },
      ],
    });

    const nextIds = [...rates.additionalServices.map((s) => s.id), created.id];
    await this.updateItemFields(region.id, [
      { name: "AdditionalServices", value: toMultilistValue(nextIds) },
    ]);

    return {
      id: created.id,
      name: created.name,
      path: created.path,
      serviceName: fieldValue(created.fields, "ServiceName") || input.serviceName,
      cost: fieldValue(created.fields, "Cost") || input.cost,
      isSectionHeader: input.isSectionHeader,
    };
  }

  async updateAdditionalService(
    itemId: string,
    input: {
      serviceName: string;
      cost: string;
      isSectionHeader: boolean;
    },
  ): Promise<void> {
    await this.updateItemFields(itemId, [
      { name: "ServiceName", value: input.serviceName },
      { name: "Cost", value: input.cost },
      { name: "IsSectionHeader", value: input.isSectionHeader ? "1" : "" },
    ]);
  }

  private collectionBelongsToRegion(
    collection: SitecoreItemSummary,
    region: RegionOption,
  ): boolean {
    const regionField = fieldValue(collection.fields, "Region");
    if (regionField) return guidsEqual(regionField, region.id);
    return collection.name.toLowerCase() === region.name.toLowerCase();
  }

  private async findCollectionForRegion(
    region: RegionOption,
  ): Promise<SitecoreItemSummary | null> {
    const contextId = this.requireContextId();
    if (region.faqCollectionPath) {
      const direct = mapItem(
        await getItemByPath(this.client, contextId, region.faqCollectionPath, false),
      );
      if (direct && this.collectionBelongsToRegion(direct, region)) return direct;
    }

    const root = await getItemByPath(
      this.client,
      contextId,
      RECOLOGY_PATHS.regionalFaqCollections,
      true,
    );
    const collections = (root?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));

    return (
      collections.find((collection) =>
        guidsEqual(fieldValue(collection.fields, "Region"), region.id),
      ) ||
      collections.find(
        (collection) =>
          !fieldValue(collection.fields, "Region") &&
          collection.name.toLowerCase() === region.name.toLowerCase(),
      ) ||
      null
    );
  }

  private async listChildren(path: string): Promise<SitecoreItemSummary[]> {
    const contextId = this.requireContextId();
    const folder = await getItemByPath(this.client, contextId, path, true);
    return (folder?.children?.nodes || [])
      .map(mapItem)
      .filter((item): item is SitecoreItemSummary => Boolean(item));
  }

  private async requireFolder(path: string, label: string): Promise<AuthoringItemNode> {
    const contextId = this.requireContextId();
    const folder = await getItemByPath(this.client, contextId, path, false);
    if (!folder?.itemId) {
      throw new Error(`${label} folder not found at ${path}`);
    }
    return folder;
  }

  private async createChildItem(input: {
    parentId: string;
    templateId: string;
    name: string;
    fields: Array<{ name: string; value: string }>;
  }): Promise<SitecoreItemSummary> {
    const contextId = this.requireContextId();
    const itemName = toSitecoreItemName(input.name);
    const fieldInputs = input.fields
      .map(
        (field) =>
          `{ name: "${field.name}", value: ${JSON.stringify(field.value)} }`,
      )
      .join(", ");

    const result = await authoringGraphql<{
      createItem?: { item?: AuthoringItemNode };
    }>(
      this.client,
      contextId,
      `
      mutation {
        createItem(
          input: {
            name: ${JSON.stringify(itemName)}
            templateId: "${input.templateId}"
            parent: "${input.parentId}"
            language: "${LANGUAGE}"
            fields: [${fieldInputs}]
          }
        ) {
          item { ${ITEM_FIELDS} }
        }
      }
      `,
    );

    const created = mapItem(result.data?.createItem?.item);
    if (!created) {
      throw new Error("createItem did not return an item");
    }
    return created;
  }
}

export type CartTypeInput = {
  name?: string;
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

export type CartSizeInput = {
  name?: string;
  displayName: string;
  code: string;
  capacity: string;
  unit: string;
  dimensions: string;
  description: string;
};

function cartTypeFields(input: CartTypeInput) {
  return [
    { name: "Name", value: input.displayName },
    { name: "Code", value: input.code },
    { name: "Capacity", value: input.capacity },
    { name: "Unit", value: input.unit },
    { name: "ContainerType", value: input.containerType },
    { name: "Dimensions", value: input.dimensions },
    { name: "Description", value: input.description },
    { name: "Color", value: input.color },
    { name: "Stream", value: input.stream },
  ];
}

function cartSizeFields(input: CartSizeInput) {
  return [
    { name: "Name", value: input.displayName },
    { name: "Code", value: input.code },
    { name: "Capacity", value: input.capacity },
    { name: "Unit", value: input.unit },
    { name: "Dimensions", value: input.dimensions },
    { name: "Description", value: input.description },
  ];
}

function mapCartType(item: SitecoreItemSummary): CartType {
  return {
    id: item.id,
    name: item.name,
    path: item.path,
    displayName: fieldValue(item.fields, "Name") || item.name,
    code: fieldValue(item.fields, "Code"),
    capacity: fieldValue(item.fields, "Capacity"),
    unit: fieldValue(item.fields, "Unit"),
    containerType: fieldValue(item.fields, "ContainerType"),
    dimensions: fieldValue(item.fields, "Dimensions"),
    description: fieldValue(item.fields, "Description"),
    color: fieldValue(item.fields, "Color"),
    stream: fieldValue(item.fields, "Stream"),
  };
}

function mapCartSize(item: SitecoreItemSummary): CartSize {
  return {
    id: item.id,
    name: item.name,
    path: item.path,
    displayName: fieldValue(item.fields, "Name") || item.name,
    code: fieldValue(item.fields, "Code"),
    capacity: fieldValue(item.fields, "Capacity"),
    unit: fieldValue(item.fields, "Unit"),
    dimensions: fieldValue(item.fields, "Dimensions"),
    description: fieldValue(item.fields, "Description"),
  };
}

function toSitecoreItemName(raw: string): string {
  const cleaned = raw
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "New Item";
}

function uniqueConfigName(question: string, used: Set<string>): string {
  const base = toSitecoreItemName(question);
  if (!used.has(base.toLowerCase())) {
    used.add(base.toLowerCase());
    return base;
  }

  let index = 2;
  let candidate = base;
  do {
    const suffix = ` ${index}`;
    candidate = `${base.slice(0, 80 - suffix.length)}${suffix}`;
    index += 1;
  } while (used.has(candidate.toLowerCase()));

  used.add(candidate.toLowerCase());
  return candidate;
}

export { getItemById };
