import urlcat from 'urlcat';

const siteAlias = process.env.SITE_ALIAS;

const _routes = [
  {
    name: 'Home',
    path: '/',
    component: '@/pages/index',
    exact: true,
  },
  {
    name: 'Search',
    path: '/search',
    query: {
      kw: String,
    },
    component: '@/pages/search/index',
    exact: true,
  },
  {
    name: 'Ranklist',
    path: '/ranklist/:id',
    query: {
      focus: String,
    },
    component: '@/pages/ranklist/[id]',
    exact: true,
  },
  {
    name: 'Collection',
    path: '/collection/:id',
    query: {
      rankId: String,
    },
    component: '@/pages/collection/[id]',
    exact: true,
  },
  {
    name: 'Playground',
    path: '/playground',
    component: '@/pages/playground/index',
    exact: true,
  },
  {
    name: 'Live',
    path: '/live/:id',
    query: {
      focus: String,
    },
    component: '@/pages/live/[id]',
    exact: true,
  },
];

const siteOrigin =
  process.env.SITE_ALIAS === 'cnn'
    ? 'https://rl.algoux.cn'
    : 'https://rl.algoux.org';

export function getRoutes() {
  return _routes.map((r) => ({
    path: r.path,
    component: r.component,
    exact: r.exact,
  }));
}

export function formatUrl(name: string, params: Record<string, any> = {}) {
  const route = _routes.find((r) => r.name === name);
  if (!route) {
    throw new Error(`Route ${name} not found`);
  }
  return urlcat(route.path, params);
}

export function getFullUrl(url: string) {
  return siteOrigin + (url.startsWith('/') ? url : `/${url}`);
}

export function extractQueryParams(originalQuery: Record<string, any> | URLSearchParams) {
  let query: Record<string, any> = originalQuery || {};
  if (originalQuery instanceof URLSearchParams) {
    query = Object.fromEntries(originalQuery);
  }
  return query;
}
