/**
 * Skill: contact-form
 * Formulario de contacto profesional con validación
 */

// ✅ EXPORTAR COMPONENTES
export { default as ContactForm } from './components/ContactForm.astro';

export const config = {
  name: 'contact-form',
  version: '1.0.0',
  description: 'Formulario de contacto profesional con validación y estilos Tailwind',
  category: 'community',
  author: 'Kimi Code',
  createdFor: 'kinto-cms',
  reusable: true,
  dependencies: []
};

export function install(context: any) {
  // Registra componentes
  context.addComponent('ContactForm', './components/ContactForm.astro');
  
  // Añade schema.org para SEO
  context.addSchemaType('ContactPoint');
  
  console.log('✅ Skill contact-form instalada');
  console.log('   Componente: ContactForm');
  console.log('   Uso: import { ContactForm } from "@skills/community/contact-form";');
}
