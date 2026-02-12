/**
 * Skill: forms-web3forms
 * Formularios funcionales con Web3Forms (sin backend propio)
 * https://web3forms.com/
 */

// Exportar componente
export { default as ContactForm } from './components/ContactForm.astro';

export const config = {
  name: 'forms-web3forms',
  version: '1.0.0',
  description: 'Formularios de contacto funcionales usando Web3Forms API',
  category: 'forms',
  author: 'KINTO CMS',
  reusable: true,
  dependencies: [],
  configFields: [
    {
      name: 'web3formsKey',
      type: 'string',
      label: 'Web3Forms Access Key',
      description: 'Obtén tu key gratis en https://web3forms.com/',
      required: false
    }
  ]
};

export function install(context: any) {
  // Registra componente
  context.addComponent('ContactForm', './components/ContactForm.astro');
  
  // Añade schema.org para SEO
  context.addSchemaType('ContactPoint');
  
  console.log('✅ Skill forms-web3forms instalada');
  console.log('   Componente: ContactForm');
  console.log('   Uso: import { ContactForm } from "@skills/community/forms-web3forms";');
  console.log('   Config: Añade web3formsKey en config/site.config.ts');
  console.log('   Obtén key gratis: https://web3forms.com/');
}
