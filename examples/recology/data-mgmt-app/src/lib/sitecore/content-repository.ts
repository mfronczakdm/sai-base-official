import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { ApplicationContext } from "@sitecore-marketplace-sdk/client";
import {
  authoringGraphql,
  getSitecoreContextId,
} from "@/lib/sitecore/authoring-client";
import {
  fieldValue,
  guidsEqual,
  isChecked,
  nodesToFieldMap,
  normalizeBehavior,
  parseIdList,
  parseSitecoreDate,
  parseSortOrder,
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
  FaqRow,
  GlobalFaq,
  RegionOption,
  RegionOverviewStats,
  RegionRatesSummary,
  RegionalFaqConfig,
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
      monthlyRate: fieldValue(item.fields, "MonthlyRate"),
      dimensions: fieldValue(item.fields, "Dimensions"),
      typicalWeeklyNeeds: fieldValue(item.fields, "TypicalWeeklyNeeds"),
    }));

    const additionalServices: AdditionalService[] = pickOrdered(
      serviceIds,
      servicesFromFolder,
    ).map((item) => ({
      id: item.id,
      name: item.name,
      path: item.path,
      serviceName: fieldValue(item.fields, "ServiceName") || item.name,
      cost: fieldValue(item.fields, "Cost"),
      isSectionHeader: isChecked(fieldValue(item.fields, "IsSectionHeader")) &&
        fieldValue(item.fields, "IsSectionHeader") !== "",
    }));

    // IsSectionHeader: empty should be false for section detection
    const normalizedServices = additionalServices.map((service) => {
      const raw = servicesFromFolder.find((s) => s.id === service.id);
      const flag = raw ? fieldValue(raw.fields, "IsSectionHeader") : "";
      return {
        ...service,
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
      additionalServices: normalizedServices,
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
}

function toSitecoreItemName(raw: string): string {
  const cleaned = raw
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "New Global FAQ";
}

export { getItemById };
