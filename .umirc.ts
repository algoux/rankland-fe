import { defineConfig } from 'umi';

const isProd = process.env.NODE_ENV === 'production';

const outputPath = 'dist/';
const publicPath = isProd ? `/${outputPath}` : `http://127.0.0.1:8000/${outputPath}`;

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  favicon: '/dist/favicon.ico',
  hash: true,
  antd: {},
  analytics: {
    ga: 'G-D6CVTJBDZT',
  },
  ssr: {
    devServerRender: false,
  },
  dynamicImport: {},
  fastRefresh: {},
  tailwindcss: {
    tailwindCssFilePath: '@/tailwind.css',
  },
  outputPath,
  publicPath,
});
