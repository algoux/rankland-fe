import { BundlerConfigType, defineConfig } from 'umi';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import { getRoutes } from './src/configs/route.config';

const isProd = process.env.NODE_ENV === 'production';
const siteAlias = process.env.SITE_ALIAS;

const outputPath = isProd && siteAlias === 'cn' ? '分发' : 'dist';
const publicProdPrefix = siteAlias === 'cn' ? 'https://内容分发网络.算法与用户体验.中国/榜单大陆/' : '/';
const publicPath = isProd ? `${publicProdPrefix}${outputPath}/` : `http://127.0.0.1:8000/${outputPath}/`;
console.log(
  'Build options:',
  JSON.stringify({
    isProd,
    siteAlias,
    outputPath,
    publicPath,
  }),
);

export default defineConfig({
  webpack5: {},
  routes: [
    {
      path: '/',
      component: '@/layouts/index',
      routes: [...getRoutes(), { component: '@/pages/404' }],
    },
  ],
  nodeModulesTransform: {
    type: 'none',
  },
  favicon: `/${outputPath}/favicon.ico`,
  hash: true,
  title: false,
  antd: {},
  define: {
    'process.env.API_BASE_CLIENT': isProd ? 'https://rl.mushan.top' : 'https://rl-dev.algoux.org',
    'process.env.API_BASE_SERVER': isProd ? 'https://rl.mushan.top' : 'https://rl-dev.algoux.org',
    'process.env.SITE_ALIAS': process.env.SITE_ALIAS,
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
          publicPath: `/${outputPath}`,
        },
      ]);
    }
  },
});
