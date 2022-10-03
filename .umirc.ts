import { BundlerConfigType, defineConfig } from 'umi';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const isProd = process.env.NODE_ENV === 'production';

const outputPath = 'dist/';
const publicPath = isProd ? `https://rl.algoux.org.dist.online/${outputPath}` : `http://127.0.0.1:8000/${outputPath}`;

export default defineConfig({
  webpack5: {},
  nodeModulesTransform: {
    type: 'none',
  },
  favicon: '/dist/favicon.ico',
  hash: true,
  title: false,
  antd: {},
  define: {
    'process.env.API_BASE_CLIENT': isProd ? 'https://rl.algoux.org/api' : 'https://rl-dev.algoux.org',
    'process.env.API_BASE_SERVER': isProd ? 'https://rl.algoux.org/api' : 'https://rl-dev.algoux.org',
  },
  ssr: {
    devServerRender: false,
  },
  dynamicImport: {
    loading: '@/components/Loading',
  },
  fastRefresh: {},
  tailwindcss: {
    tailwindCssFilePath: '@/tailwind.css',
  },
  outputPath,
  publicPath,
  chainWebpack(memo, { type }) {
    if (type === BundlerConfigType.csr) {
      memo.plugin('MonacoWebpackPlugin').use(MonacoWebpackPlugin, [
        {
          languages: ['json'],
          publicPath: '/dist',
        },
      ]);
    }
  },
});
