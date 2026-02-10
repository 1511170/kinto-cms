/**
 * Skill: blog
 * Sistema de blog completo
 */

// ✅ EXPORTAR COMPONENTES
export { default as BlogList } from './components/BlogList.astro';
export { default as BlogCard } from './components/BlogCard.astro';
export { default as BlogPost } from './components/BlogPost.astro';

export const config = {
  name: 'blog',
  version: '1.0.0',
  description: 'Sistema de blog con listado, posts y componentes reutilizables',
  category: 'community',
  author: 'Kimi Code',
  createdFor: 'kinto-cms',
  reusable: true,
  dependencies: []
};

export function install(context: any) {
  // Registra componentes
  context.addComponent('BlogList', './components/BlogList.astro');
  context.addComponent('BlogCard', './components/BlogCard.astro');
  context.addComponent('BlogPost', './components/BlogPost.astro');
  
  // Añade CMS collection para posts
  context.addCMSCollection({
    name: 'blog',
    label: 'Blog Posts',
    folder: 'src/content/blog',
    create: true,
    fields: [
      { label: 'Título', name: 'title', widget: 'string', required: true },
      { label: 'Resumen', name: 'excerpt', widget: 'text', required: true },
      { label: 'Fecha', name: 'date', widget: 'datetime', required: true },
      { label: 'Autor', name: 'author', widget: 'string', required: true },
      { label: 'Categoría', name: 'category', widget: 'string' },
      { label: 'Tags', name: 'tags', widget: 'list' },
      { label: 'Imagen', name: 'image', widget: 'image', required: false },
      { label: 'Publicado', name: 'published', widget: 'boolean', default: true }
    ]
  });
  
  // Añade schema.org
  context.addSchemaType('BlogPosting');
  
  console.log('✅ Skill blog instalada');
  console.log('   Componentes: BlogList, BlogCard, BlogPost');
  console.log('   CMS: Colección "blog" creada');
}
