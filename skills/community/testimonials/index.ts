/**
 * Skill: testimonials
 * Creada por IA para serviworldlogistics
 * Reutilizable para cualquier sitio
 */

export const config = {
  name: 'testimonials',
  version: '1.0.0',
  description: 'Testimonials system with schema.org markup for AI citations',
  category: 'content',
  author: 'Kimi Code',
  createdFor: 'serviworldlogistics',
  reusable: true
};

export function install(context: any) {
  // Registra componentes
  context.addComponent('TestimonialsGrid', './components/TestimonialsGrid.astro');
  context.addComponent('TestimonialCard', './components/TestimonialCard.astro');
  
  // Añade CMS collection
  context.addCMSCollection({
    name: 'testimonials',
    label: 'Testimonios',
    folder: 'src/content/testimonials',
    create: true,
    fields: [
      { label: 'Autor', name: 'author', widget: 'string', required: true },
      { label: 'Empresa', name: 'company', widget: 'string' },
      { label: 'Testimonio', name: 'quote', widget: 'markdown', required: true },
      { label: 'Foto', name: 'image', widget: 'image', required: false },
      { label: 'Calificación', name: 'rating', widget: 'number', min: 1, max: 5, default: 5 },
      { label: 'Fecha', name: 'date', widget: 'datetime' },
      { label: 'Publicado', name: 'published', widget: 'boolean', default: true }
    ]
  });
  
  // Añade schema.org script
  context.addSchemaType('Review');
  
  console.log('✅ Skill testimonials instalada');
  console.log('   Componentes: TestimonialsGrid, TestimonialCard');
  console.log('   CMS: Colección "testimonials" creada');
}
