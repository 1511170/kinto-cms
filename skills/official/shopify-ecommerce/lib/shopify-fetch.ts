import {
  ALL_PRODUCTS_QUERY,
  ALL_COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from "../config/shopify.graphql";

interface ShopifyFetchOptions {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
}

async function shopifyFetch<T = any>(
  { storeDomain, storefrontAccessToken, apiVersion }: ShopifyFetchOptions,
  query: string,
  variables: Record<string, any> = {},
): Promise<T> {
  const endpoint = `https://${storeDomain}/api/${apiVersion}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(
      `Shopify GraphQL error: ${json.errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  return json.data;
}

export async function fetchAllProducts(options: ShopifyFetchOptions) {
  const products: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data = await shopifyFetch(options, ALL_PRODUCTS_QUERY, {
      // Shopify returns null metafields on this large product query at 250 items.
      // Keeping the page smaller preserves storefront metafield values.
      first: 50,
      after: cursor,
    });

    for (const edge of data.products.edges) {
      products.push(edge.node);
    }

    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return products;
}

export async function fetchProductByHandle(
  options: ShopifyFetchOptions,
  handle: string,
) {
  const data = await shopifyFetch(options, PRODUCT_BY_HANDLE_QUERY, { handle });
  return data.product;
}

export async function fetchAllCollections(options: ShopifyFetchOptions) {
  const data = await shopifyFetch(options, ALL_COLLECTIONS_QUERY, {
    first: 250,
  });
  return data.collections.edges.map((edge: any) => edge.node);
}

export async function fetchCollectionByHandle(
  options: ShopifyFetchOptions,
  handle: string,
) {
  let collection: any = null;
  const productEdges: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data = await shopifyFetch(options, COLLECTION_BY_HANDLE_QUERY, {
      handle,
      first: 250,
      after: cursor,
    });

    if (!data.collection) return null;
    collection ??= data.collection;
    productEdges.push(...(data.collection.products?.edges ?? []));
    hasNextPage = Boolean(data.collection.products?.pageInfo?.hasNextPage);
    cursor = data.collection.products?.pageInfo?.endCursor ?? null;
  }

  return {
    ...collection,
    products: {
      ...(collection.products ?? {}),
      edges: productEdges,
      pageInfo: { hasNextPage: false, endCursor: cursor },
    },
  };
}
