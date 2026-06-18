/**
 * Namespace de los metafields personalizados en Shopify Admin.
 *
 * SINGLE SOURCE OF TRUTH — cámbialo aquí para que tu tienda use otro namespace.
 * Debe coincidir EXACTAMENTE con el namespace configurado en Shopify Admin.
 * Ver docs/METAFIELDS_SETUP.md.
 */
export const METAFIELD_NAMESPACE = "kinto";

/** Keys de metafields que el storefront consume (specs, filtros técnicos, etc.). */
export const METAFIELD_KEYS = [
  "specs",
  "features",
  "reviews",
  "rating",
  "review_count",
  "datasheet_url",
  "faq",
  "application",
  "environment",
  "band",
  "wifi_standard",
  "ethernet_ports",
  "sfp_ports",
  "poe",
  "topology",
  "radio_type",
  "mimo",
  "switch_layer",
  "throughput",
  "mounting",
  "gtin",
  "mpn",
  "google_product_category",
];

const METAFIELD_IDENTIFIERS = METAFIELD_KEYS.map(
  (key) => `{ namespace: "${METAFIELD_NAMESPACE}", key: "${key}" }`,
).join("\n      ");

export const PRODUCT_FRAGMENT = `
  fragment ProductFragment on Product {
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
            altText
            width
            height
          }
          selectedOptions {
            name
            value
          }
          sku
        }
      }
    }
    seo {
      title
      description
    }
    metafields(identifiers: [
      ${METAFIELD_IDENTIFIERS}
    ]) {
      namespace
      key
      value
      type
    }
  }
`;

export const COLLECTION_FRAGMENT = `
  fragment CollectionFragment on Collection {
    handle
    title
    description
    image {
      url
      altText
      width
      height
    }
  }
`;

export const ALL_PRODUCTS_QUERY = `
  ${PRODUCT_FRAGMENT}
  query AllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...ProductFragment
          collections(first: 10) {
            edges {
              node {
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFragment
      collections(first: 10) {
        edges {
          node {
            handle
          }
        }
      }
    }
  }
`;

export const ALL_COLLECTIONS_QUERY = `
  ${COLLECTION_FRAGMENT}
  query AllCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFragment
          products(first: 50) {
            edges {
              node {
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_FRAGMENT}
  query CollectionByHandle($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      ...CollectionFragment
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...ProductFragment
          }
        }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    url
                    altText
                    width
                    height
                  }
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_ADD_LINES_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    url
                    altText
                    width
                    height
                  }
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_UPDATE_LINES_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    url
                    altText
                    width
                    height
                  }
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_REMOVE_LINES_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              cost {
                subtotalAmount {
                  amount
                  currencyCode
                }
              }
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  image {
                    url
                    altText
                    width
                    height
                  }
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_QUERY = `
  query CartQuery($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            cost {
              subtotalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                image {
                  url
                  altText
                  width
                  height
                }
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  handle
                }
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
`;
