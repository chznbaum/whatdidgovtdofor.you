import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema, officialSchema, placeSchema } from './lib/schema.ts';

const refs = { officials: reference('officials'), places: reference('places') };

const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: entrySchema(refs),
});

const officials = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/officials' }),
  schema: officialSchema(refs),
});

const places = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/places' }),
  schema: placeSchema(refs),
});

export const collections = { entries, officials, places };
