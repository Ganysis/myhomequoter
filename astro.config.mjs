// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://myhomequoter.com',
  output: 'static',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()],

  // Optimizations for SEO
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
