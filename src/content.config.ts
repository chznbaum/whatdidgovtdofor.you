import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema, officialSchema, placeSchema } from './lib/schema.ts';

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: entrySchema(reference),
});

const officials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/officials' }),
  schema: officialSchema(reference),
});

const places = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/places' }),
  schema: placeSchema(reference),
});

export const collections = { entries, officials, places };
