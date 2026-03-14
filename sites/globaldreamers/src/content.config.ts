import { defineCollection, z } from 'astro:content';

/**
 * Configuración de colecciones de contenido
 * Define el schema para cada tipo de contenido editable
 */

// Colección: Blog
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.date(),
    author: z.string(),
    category: z.string(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Colección: Testimonios (se activa con skill testimonials)
const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    author: z.string(),
    company: z.string().optional(),
    quote: z.string(),
    image: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    date: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

// Colección: Páginas (para contenido editable vía CMS)
const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.boolean().default(true),
    lastModified: z.date().optional(),
  }),
});

// Colección: Servicios
const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    shortDescription: z.string(),
    icon: z.string().optional(),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

// Colección: Equipo
const team = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    position: z.string(),
    bio: z.string(),
    image: z.string().optional(),
    linkedin: z.string().optional(),
    email: z.string().optional(),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

export const collections = {
  blog,
  testimonials,
  pages,
  services,
  team,
};
