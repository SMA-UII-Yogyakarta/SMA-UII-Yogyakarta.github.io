// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkMermaid } from './src/lib/remark-mermaid.ts';

const DEPLOY_MODE = process.env.DEPLOY_MODE || 'ssr';

const site = 'https://lab.smauiiyk.sch.id';

const baseConfig = {
  site,
  integrations: [react()],
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
      // Strip console statements in production
      /** @type {import('vite').Plugin} */
      ({
        name: 'remove-console',
        /** @param {string} code */
        /** @param {string} id */
        transform(code, id) {
          // Only strip in production build and only from src files
          if (process.env.NODE_ENV === 'production' && id.includes('/src/')) {
            return code.replace(/console\.(log|warn|error|debug|info)\([^)]*\);?/g, '');
          }
          return code;
        },
      }),
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    ssr: {
      noExternal: ['debug'],
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
