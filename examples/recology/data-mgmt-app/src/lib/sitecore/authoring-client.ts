import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import type { ApplicationContext } from "@sitecore-marketplace-sdk/client";

export type AuthoringGraphqlResult<T = unknown> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export function getSitecoreContextId(
  appContext: ApplicationContext | null | undefined,
): string | null {
  const access = appContext?.resourceAccess?.[0]?.context as
    | { preview?: string; live?: string }
    | undefined;
  return access?.preview || access?.live || null;
}

/**
 * Authoring & Management GraphQL via Marketplace SDK.
 * Verified operation: client.mutate("xmc.authoring.graphql", ...)
 * @see https://doc.sitecore.com/mp/en/developers/sdk/0/sitecore-marketplace-sdk/make-a-graphql-query.html
 */
export async function authoringGraphql<T = unknown>(
  client: ClientSDK,
  sitecoreContextId: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<AuthoringGraphqlResult<T>> {
  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      query: { sitecoreContextId },
      body: { query, variables },
    },
  });

  const payload = response?.data as AuthoringGraphqlResult<T> | undefined;
  if (payload?.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join("; "));
  }
  return payload ?? {};
}
