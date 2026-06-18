import siteConfig from '../../config/site.config.ts';
import {
  isShopifyProduct,
  productAvailable,
  productHref,
  productImageUrl,
  productPartBrand,
  productSku,
  productTitle,
  type StorefrontProduct,
} from './shopify-catalog';

export const siteUrl = `https://${siteConfig.site.domain}`;
export const businessName = siteConfig.site.name;
export const businessEmail = 'ventas@distribuidormiranda.com.ec';
export const businessWhatsapp = `+593${'996140000'}`;
export const businessPhone = businessWhatsapp;

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function businessSchemas() {
  const orgId = `${siteUrl}/#organization`;
  const storeId = `${siteUrl}/#store`;
  const websiteId = `${siteUrl}/#website`;

  return [
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'AutoPartsStore', 'LocalBusiness'],
      '@id': orgId,
      name: businessName,
      legalName: 'Distribuidor Miranda',
      url: siteUrl,
      email: businessEmail,
      telephone: businessPhone,
      foundingDate: '1996',
      description:
        'Distribuidor Miranda vende repuestos automotrices de colisión, carrocería, iluminación, refrigeración, suspensión, frenos, motor y accesorios para talleres, aseguradoras, mayoristas y compradores en Ecuador.',
      slogan: 'Repuestos de colisión listos para despacho en Ecuador.',
      areaServed: [
        { '@type': 'Country', name: 'Ecuador' },
        { '@type': 'City', name: 'Quito' },
        { '@type': 'City', name: 'Guayaquil' },
        { '@type': 'City', name: 'Cuenca' },
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'EC',
        addressRegion: 'Ecuador',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: businessPhone,
          email: businessEmail,
          areaServed: 'EC',
          availableLanguage: ['es'],
        },
      ],
      makesOffer: [
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Guardachoques para autos' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Silvines, faros y neblineros' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Radiadores y refrigeración' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Capots y carrocería' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Espejos y vidrios automotrices' } },
      ],
      sameAs: [siteUrl],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'AutoPartsStore',
      '@id': storeId,
      name: businessName,
      url: siteUrl,
      parentOrganization: { '@id': orgId },
      priceRange: '$$ ',
      currenciesAccepted: 'USD',
      paymentAccepted: 'Cash on delivery, Credit Card, Debit Card, Bank Transfer',
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      }],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': websiteId,
      name: businessName,
      url: siteUrl,
      publisher: { '@id': orgId },
      inLanguage: 'es-EC',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/catalogo/todos/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function productSchema(product: StorefrontProduct, options: { category?: string; description?: string } = {}) {
  const isShopify = isShopifyProduct(product);
  const variant = isShopify ? product.variants?.[0] : null;
  const price = variant?.price?.amount ? Number(variant.price.amount) : undefined;
  const currency = variant?.price?.currencyCode || 'USD';
  const title = productTitle(product);
  const sku = productSku(product);
  const image = productImageUrl(product, 1200);
  const description = stripHtml(options.description || (isShopify ? product.descriptionHtml || product.description : `${title} disponible en Distribuidor Miranda Ecuador.`));
  const url = absoluteUrl(productHref(product));
  const category = options.category || (isShopify ? product.productType || product.collections?.[0] : product.catLabel) || 'Repuestos automotrices';
  const partBrand = productPartBrand(product);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: title,
    description,
    sku,
    mpn: sku,
    category,
    url,
    brand: {
      '@type': 'Brand',
      name: partBrand.name,
    },
    image: image ? [image] : undefined,
    itemCondition: 'https://schema.org/NewCondition',
    mainEntityOfPage: url,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'SKU', value: sku },
      { '@type': 'PropertyValue', name: 'Marca del repuesto', value: partBrand.name },
      { '@type': 'PropertyValue', name: 'Categoría', value: category },
      { '@type': 'PropertyValue', name: 'Mercado', value: 'Ecuador' },
    ],
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price && price > 0 ? price.toFixed(2) : undefined,
      availability: productAvailable(product) ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: { '@id': `${siteUrl}/#organization` },
      areaServed: { '@type': 'Country', name: 'Ecuador' },
      availableAtOrFrom: { '@id': `${siteUrl}/#store` },
      availableDeliveryMethod: 'https://schema.org/ParcelService',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'EC' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        },
      },
    },
  };

  return JSON.parse(JSON.stringify(schema));
}

export function collectionSchema(options: { name: string; description: string; url: string; products?: StorefrontProduct[] }) {
  const products = options.products?.slice(0, 24).map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: absoluteUrl(productHref(product)),
    name: productTitle(product),
  })) ?? [];

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: stripHtml(options.description),
    url: absoluteUrl(options.url),
    inLanguage: 'es-EC',
    isPartOf: { '@id': `${siteUrl}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.products?.length ?? products.length,
      itemListElement: products,
    },
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
