// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkMermaid } from './src/lib/remark-mermaid.ts';

export default defineConfig({
  site: 'https://lab.smauiiyk.sch.id',
  output: 'server',
  integrations: [react()],
  adapter: node({ mode: 'standalone' }),
  markdown: {
    remarkPlugins: [remarkMath, remarkMermaid],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: 'github-dark' },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    css: {
      transformer: 'postcss', // skip lightningcss yang tidak support all:vars
    },
  }
});
