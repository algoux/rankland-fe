import urlcat from 'urlcat';

const siteAlias = process.env.SITE_ALIAS;

const _routes = [
  {
    name: 'Home',
    path: '/',
    alias: {
      cn: {
        path: '/',
      },
    },
    component: '@/pages/index',
    exact: true,
  },
  {
    name: 'Search',
    path: '/search',
    query: {
      kw: String,
    },
    alias: {
      cn: {
        path: '/探索',
        queryMapping: {
          kw: '关键词',
        },
      },
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
    alias: {
      cn: {
        path: '/榜单/:id',
        queryMapping: {
          focus: '聚焦',
        },
      },
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
    alias: {
      cn: {
        path: '/榜单合集/:id',
        queryMapping: {
          rankId: '当前选中榜单的标识符',
        },
      },
    },
    component: '@/pages/collection/[id]',
    exact: true,
  },
  {
    name: 'Playground',
    path: '/playground',
    alias: {
      cn: {
        path: '/游乐场',
      },
    },
    component: '@/pages/playground/index',
    exact: true,
  },
  {
    name: 'Live',
    path: '/live/:id',
    query: {
      focus: String,
    },
    alias: {
      cn: {
        path: '/直播/:id',
        queryMapping: {
          focus: '聚焦',
        },
      },
    },
    component: '@/pages/live/[id]',
    exact: true,
  },
];

export const knownUrlKeywordToGeneralReplacementMap = {
  当前选中榜单的标识符: 'rankId',
  由官方整理和维护的: 'official',
  榜单合集: 'collection',
  探索: 'search',
  榜单: 'ranklist',
  游乐场: 'playground',
  直播: 'live',
  关键词: 'kw',
  聚焦: 'focus',
  是: 'yes',
};

export const knownUrlKeywordToAliasReplacementMap = {
  cn: {
    search: '探索',
    ranklist: '榜单',
    collection: '榜单合集',
    playground: '游乐场',
    live: '直播',
    rankId: '当前选中榜单的标识符',
    kw: '关键词',
    official: '由官方整理和维护的',
    focus: '聚焦',
    yes: '是',
  },
};

export function getRoutes() {
  return _routes.map((r) => ({
    // @ts-ignore
    path: r.alias?.[siteAlias]?.path || r.path,
    component: r.component,
    exact: r.exact,
  }));
}

export function formatUrl(name: string, params: Record<string, any> = {}) {
  const route = _routes.find((r) => r.name === name);
  if (!route) {
    throw new Error(`Route ${name} not found`);
  }
  // @ts-ignore
  let path = route.alias?.[siteAlias]?.path || route.path;
  const translatedParams: Record<string, any> = {};
  Object.keys(params).forEach((key) => {
    // @ts-ignore
    const translatedKey = route.alias?.[siteAlias]?.queryMapping?.[key] || key;
    translatedParams[translatedKey] = params[key];
  });
  return urlcat(path, translatedParams);
}

export function extractQueryParams(name: string, originalQuery?: Record<string, any> | URLSearchParams) {
  let query: Record<string, any> = originalQuery || {};
  if (originalQuery instanceof URLSearchParams) {
    query = Object.fromEntries(originalQuery);
  }
  const route = _routes.find((r) => r.name === name);
  if (!route) {
    throw new Error(`Route ${name} not found`);
  }
  const extractedQuery: Record<string, any> = {};
  // @ts-ignore
  const queryMapping = route.alias?.[siteAlias]?.queryMapping || {};
  Object.keys(query).forEach((key) => {
    // reverse mapping
    const originalKey = Object.keys(queryMapping).find((k) => queryMapping[k] === key) || key;
    extractedQuery[originalKey] = query[key];
  });
  return extractedQuery;
}
