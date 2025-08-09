import { BundlerConfigType, defineConfig } from 'umi';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import { getRoutes } from './src/configs/route.config';

const isProd = process.env.NODE_ENV === 'production';
const siteAlias = process.env.SITE_ALIAS;

const outputPath = isProd && siteAlias === 'cn' ? '分发' : 'dist';
const publicProdPrefix = siteAlias === 'cn' ? 'https://cdn.algoux.cn/rankland/' : siteAlias === 'cnn' ? 'https://cdn.algoux.cn/rankland/' : '/';
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
    'process.env.API_BASE_CLIENT': isProd ? 'https://rl-api.algoux.cn' : 'https://rl-api.algoux.cn',
    'process.env.API_BASE_SERVER': isProd ? 'https://rl-api.algoux.cn' : 'https://rl-api.algoux.cn',
    'process.env.CDN_API_BASE_CLIENT': isProd ? 'https://algoux-rl.cdn.blueverse.cc' : 'https://rl-api.algoux.cn',
    'process.env.CDN_API_BASE_SERVER': isProd ? 'https://rl-api.algoux.cn' : 'https://rl-api.algoux.cn',
    'process.env.WS_BASE': isProd ? 'wss://rl-api.algoux.cn' : 'wss://rl-api.algoux.cn',
    'process.env.SITE_ALIAS': process.env.SITE_ALIAS,
    'process.env.HOST_GLOBAL': 'rl.algoux.org',
    'process.env.HOST_CN': 'rl.algoux.cn',
    'process.env.BEIAN': '鲁ICP备18021776号-5',
    'process.env.LIVE_POLLING_INTERVAL': '10000',
    'process.env.X_PHOTO_BASE': 'https://share-bj-1252277595.cos.ap-beijing.myqcloud.com/srk-storage',
    'GTAG': siteAlias === 'cn' ? 'G-D4PSNCRQJC' : 'G-D6CVTJBDZT',
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
  // terserOptions: {
  //   compress: false,
  // },
  chainWebpack(memo, { type }) {
    if (type === BundlerConfigType.csr) {
      memo.plugin('MonacoWebpackPlugin').use(MonacoWebpackPlugin, [
        {
          languages: ['json'],
          publicPath: `/${outputPath}`,
        },
      ]);
    }
    if (type === BundlerConfigType.ssr) {
      // disable all webpack minify
      memo.optimization.minimize(false);
    }
    memo.module.rule('mjs-rule').test(/.m?js/).resolve.set('fullySpecified', false);
  },
});
