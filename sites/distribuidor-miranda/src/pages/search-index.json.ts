import { getStorefrontProducts, isShopifyProduct, productHref } from '../lib/shopify-catalog';

export async function GET() {
  const products = await getStorefrontProducts();
  const index = products.map((product) => {
    if (isShopifyProduct(product)) {
      const variant = product.variants[0];
      return {
        title: product.title,
        handle: product.handle,
        url: productHref(product),
        sku: variant?.sku ?? '',
        vendor: product.vendor,
        productType: product.productType,
        tags: product.tags,
        description: product.description,
        image: product.featuredImage?.url ?? null,
        price: variant?.price?.amount ?? null,
        availableForSale: product.availableForSale,
      };
    }

    return {
      title: product.name,
      handle: product.id,
      url: productHref(product),
      sku: product.sku,
      vendor: product.brand,
      productType: product.catLabel,
      tags: product.applications.map((app) => `${app.make} ${app.model}`),
      description: product.name,
      image: null,
      price: product.price,
      availableForSale: product.stock > 0,
    };
  });

  return new Response(JSON.stringify({ generatedAt: new Date().toISOString(), products: index }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
