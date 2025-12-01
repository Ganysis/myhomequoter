import { defineCollection, z } from 'astro:content';

// Blog posts collection
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('MyHomeQuoter Team'),
    category: z.enum([
      'solar',
      'roofing',
      'hvac',
      'windows',
      'plumbing',
      'electrical',
      'home-improvement',
      'guides',
      'tips',
    ]),
    tags: z.array(z.string()).default([]),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }).optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(), // in minutes
  }),
});

export const collections = { blog };
