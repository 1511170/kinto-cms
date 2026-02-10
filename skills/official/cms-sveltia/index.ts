/**
 * Skill: cms-sveltia
 * Framework de CMS para KINTO CMS
 */

export const config = {
  name: 'cms-sveltia',
  version: '1.0.0',
  description: 'Sveltia CMS integration for visual content editing',
  category: 'cms',
  author: 'KINTO'
};

export function install(context: any) {
  // Añade página /admin al sitio
  context.addRoute('/admin', '@skills/official/cms-sveltia/components/Admin.astro');
  
  // Añade config de CMS
  context.addConfigFile('cms.config.yml', './config/cms-base.yml');
  
  console.log('✅ CMS Sveltia instalado');
  console.log('   Acceso: https://[cms-subdomain]/admin');
}

export function getCMSCollections(): string[] {
  // Retorna collections registradas por otras skills
  return [];
}
