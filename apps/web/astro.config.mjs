// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkMermaid } from './src/lib/remark-mermaid.ts';
import { fileURLToPath } from 'node:url';

const DEPLOY_MODE = process.env.DEPLOY_MODE || 'ssr';

// Domain utama — dipakai untuk canonical URL, sitemap, og:url, dsb.
// Ganti ke domain Anda kalau deploy ke GitHub Pages atau domain lain.
// Contoh: 'https://sma-uii-yogyakarta.github.io/smauii-dev-foundation'
const site = 'https://lab.smauiiyk.sch.id';

const dbAlias = DEPLOY_MODE === 'ssg'
  ? [
      { find: /^@smauii\/db$/, replacement: fileURLToPath(new URL('./src/lib/db-mock.ts', import.meta.url)) },
      { find: /^@smauii\/db\/(.*)$/, replacement: fileURLToPath(new URL('./src/lib/db-mock.ts', import.meta.url)) }
    ]
  : [];

/**
 * Astro integration that filters out all /api/** routes in SSG builds.
 * API endpoints are served at runtime by the Hono backend.
 */
function excludeApiIntegration() {
  return {
    name: 'exclude-api-routes',
    hooks: {
      'astro:build:setup'({ pages }) {
        if (DEPLOY_MODE !== 'ssg') return;
        // Remove all pages/api routes from the build pipeline
        for (const [key] of pages) {
          if (key.startsWith('/api/')) {
            pages.delete(key);
          }
        }
      },
    },
  };
}

const baseConfig = {
  site,
  integrations: [react(), excludeApiIntegration()],
  markdown: {
    remarkPlugins: [remarkMath, remarkMermaid],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { 
      theme: /** @type {any} */ ('github-dark') 
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: dbAlias,
    },
    optimizeDeps: {
      exclude: ['@node-rs/argon2', '@node-rs/argon2-linux-x64-gnu', '@node-rs/argon2-linux-x64-musl'],
    },
    ssr: {
      noExternal: ['debug', '@smauii/shared', '@smauii/db', '@smauii/validation'],
    },
  }
};

let config;

if (DEPLOY_MODE === 'ssg') {
  config = defineConfig({
    ...baseConfig,
    output: 'static',
  });
} else if (DEPLOY_MODE === 'hybrid') {
  config = defineConfig({
    ...baseConfig,
    output: 'server',
    adapter: node({ mode: 'standalone' }),
  });
} else {
  config = defineConfig({
    ...baseConfig,
    output: 'server',
    adapter: node({ mode: 'standalone' }),
  });
}

export default config;
