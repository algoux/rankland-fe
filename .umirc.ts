import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  favicon: '/favicon.ico',
  hash: true,
  antd: {},
  analytics: {
    ga: 'G-D6CVTJBDZT',
  },
  ssr: {},
  dynamicImport: {},
  fastRefresh: {},
  tailwindcss: {
    tailwindCssFilePath: '@/tailwind.css',
  },
});
