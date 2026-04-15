// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://lab.smauiiyk.sch.id',
  output: 'server', // Server-side rendering for dynamic pages
  integrations: [react()],
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  }
});
