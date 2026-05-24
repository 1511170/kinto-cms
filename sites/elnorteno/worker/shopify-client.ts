import type { ShopifyRebuildCoordinator } from "./rebuild-coordinator";

/**
 * Generic Shopify Storefront API GraphQL client for Cloudflare Worker.
 * Handles authentication, error responses, and returns structured data.
 */

export interface Env {
  SHOPIFY_CACHE: KVNamespace;
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_API_VERSION: string;
  WEBHOOK_SIGNING_SECRET: string;
  ASSETS: Fetcher;
  DEPLOY_HOOK_URL?: string;
  GITHUB_DEPLOY_TOKEN?: string;
  SHOPIFY_REBUILD_COORDINATOR?: DurableObjectNamespace<ShopifyRebuildCoordinator>;
  SHOPIFY_REBUILD_DEBOUNCE_SECONDS?: string;
}

export interface ShopifyClientResult<T = any> {
  ok: boolean;
  data: T | null;
  errors: string[];
}

function getShopifyConfig(env: Env) {
  return {
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_API_VERSION || "2026-04",
  };
}

/**
 * Execute a GraphQL query/mutation against the Shopify Storefront API.
 * Returns a structured result with ok/data/errors instead of throwing.
 */
export async function shopifyRequest<T = any>(
  env: Env,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<ShopifyClientResult<T>> {
  const config = getShopifyConfig(env);

  if (!config.storeDomain || !config.storefrontAccessToken) {
    return {
      ok: false,
      data: null,
      errors: [
        "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN",
      ],
    };
  }

  const apiVersion = config.apiVersion || "2026-04";
  const endpoint = `https://${config.storeDomain}/api/${apiVersion}/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        errors: [
          `Shopify API HTTP error: ${response.status} ${response.statusText}`,
        ],
      };
    }

    const json = await response.json<{
      data?: T;
      errors?: Array<{ message: string }>;
    }>();

    if (json.errors?.length) {
      return {
        ok: false,
        data: json.data ?? null,
        errors: json.errors.map((e) => e.message),
      };
    }

    return {
      ok: true,
      data: json.data as T,
      errors: [],
    };
  } catch (err: any) {
    return {
      ok: false,
      data: null,
      errors: [`Shopify request failed: ${err?.message ?? String(err)}`],
    };
  }
}

/**
 * Paginate through all edges of a Shopify GraphQL connection.
 * Automatically follows cursors until all items are collected.
 */
export async function shopifyPaginate<T = any>(
  env: Env,
  query: string,
  connectionPath: (data: any) => {
    edges: Array<{ node: T; cursor: string }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  },
  variables: Record<string, unknown> = {},
  pageSize: number = 250,
): Promise<ShopifyClientResult<T[]>> {
  const allItems: T[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await shopifyRequest<any>(env, query, {
      ...variables,
      first: pageSize,
      after: cursor,
    });

    if (!result.ok) {
      return {
        ok: false,
        data: allItems.length > 0 ? allItems : null,
        errors: result.errors,
      };
    }

    const connection = connectionPath(result.data);
    for (const edge of connection.edges) {
      allItems.push(edge.node);
    }

    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return {
    ok: true,
    data: allItems,
    errors: [],
  };
}
