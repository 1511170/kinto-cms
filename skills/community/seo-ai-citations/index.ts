/**
 * Skill: seo-ai-citations
 * SEO optimizado para AI Citations - Schema.org completo
 */

// Exportar componentes
export { default as SEOHead } from './components/SEOHead.astro';
export { default as SchemaOrg } from './components/SchemaOrg.astro';

export const config = {
  name: 'seo-ai-citations',
  version: '1.0.0',
  description: 'SEO + AEO (AI Citation Optimization) con Schema.org completo',
  category: 'community',
  author: 'AI',
  createdFor: 'edupayments',
  reusable: true
};

export function install(context: any) {
  context.addComponent('SEOHead', './components/SEOHead.astro');
  context.addComponent('SchemaOrg', './components/SchemaOrg.astro');
  
  console.log('✅ Skill seo-ai-citations instalada');
  console.log('   Componentes: SEOHead, SchemaOrg');
  console.log('   Schemas: Organization, WebSite, Service, FinancialService, FAQPage, HowTo, BlogPosting, etc.');
}
