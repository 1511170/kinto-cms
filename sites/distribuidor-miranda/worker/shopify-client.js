function getShopifyConfig(env) {
    return {
        storeDomain: env.SHOPIFY_STORE_DOMAIN,
        storefrontAccessToken: env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || env.SHOPIFY_STOREFRONT_TOKEN,
        apiVersion: env.SHOPIFY_API_VERSION || "2026-04",
    };
}
/**
 * Execute a GraphQL query/mutation against the Shopify Storefront API.
 * Returns a structured result with ok/data/errors instead of throwing.
 */
export async function shopifyRequest(env, query, variables = {}) {
    const config = getShopifyConfig(env);
    if (!config.storeDomain || !config.storefrontAccessToken) {
        return {
            ok: false,
            data: null,
            errors: [
                "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN/SHOPIFY_STOREFRONT_TOKEN",
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
        const json = await response.json();
        if (json.errors?.length) {
            return {
                ok: false,
                data: json.data ?? null,
                errors: json.errors.map((e) => e.message),
            };
        }
        return {
            ok: true,
            data: json.data,
            errors: [],
        };
    }
    catch (err) {
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
export async function shopifyPaginate(env, query, connectionPath, variables = {}, pageSize = 250) {
    const allItems = [];
    let cursor = null;
    let hasNextPage = true;
    while (hasNextPage) {
        const result = await shopifyRequest(env, query, {
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
