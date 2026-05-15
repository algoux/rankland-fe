/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Page, Route } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const fixturesDir = path.resolve(__dirname, '..', '..', 'fixtures');

function readFixture<T = unknown>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8')) as T;
}

// 真实后端返回的统一包装：{ code, data, message } —— 0 表示成功
function wrap<T>(data: T) {
  return { code: 0, message: 'success', data };
}

function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  });
}

export interface MockOptions {
  /** /rank/listall 返回的列表 */
  listAll?: unknown;
  /** /statistics 返回 */
  statistics?: unknown;
  /** /rank/group/:key 返回的 collection 数据 */
  collection?: unknown;
  /**
   * /rank/:key 的返回：
   * - 对象  -> 200 wrap(对象)
   * - null  -> 模拟未找到 ({ code: 11 })
   */
  ranklistInfo?: unknown | null;
  /** /file/download 返回的 srk JSON */
  srk?: unknown;
  /** /ranking/config/:key 返回 */
  liveInfo?: unknown;
  /** /ranking/:id 返回 */
  liveRanklist?: unknown;
}

/**
 * 在 Playwright Page 上集中注册 API mock。
 *
 * Playwright 的多路由匹配规则：最后注册的优先级最高。所以下面"先泛后具体"地注册。
 */
export async function installApiMocks(page: Page, opts: MockOptions = {}) {
  const listAll = opts.listAll ?? readFixture('listall.json');
  const statistics = opts.statistics ?? readFixture('statistics.json');
  const collection = opts.collection ?? readFixture('collection.json');
  const ranklistInfo = opts.ranklistInfo === undefined ? readFixture('ranklist-info.json') : opts.ranklistInfo;
  const srk = opts.srk ?? readFixture('ranklist.srk.json');
  const liveInfo = opts.liveInfo ?? readFixture('live-info.json');
  const liveRanklist = opts.liveRanklist ?? readFixture('ranklist.srk.json');

  // /rank/:key  (匹配 /rank/foo 但不匹配 /rank/group/foo, /rank/listall, /rank/search)
  await page.route(/\/rank\/[^/?]+(?:\?.*)?$/, (route) => {
    const url = route.request().url();
    if (url.includes('/rank/listall') || url.includes('/rank/search')) {
      return route.fallback();
    }
    if (ranklistInfo === null) {
      return jsonResponse(route, { code: 11, message: 'ranklist not found' });
    }
    return jsonResponse(route, wrap(ranklistInfo));
  });

  // /rank/group/:key —— 通过 `content` 字段以字符串形式返回 collection
  await page.route(/\/rank\/group\/[^/?]+(?:\?.*)?$/, (route) =>
    jsonResponse(route, wrap({ content: JSON.stringify(collection) })),
  );

  // /rank/listall
  await page.route(/\/rank\/listall(?:\?.*)?$/, (route) => jsonResponse(route, wrap(listAll)));

  // /rank/search?query=...
  await page.route(/\/rank\/search(?:\?.*)?$/, (route) => jsonResponse(route, wrap(listAll)));

  // /statistics
  await page.route(/\/statistics(?:\?.*)?$/, (route) => jsonResponse(route, wrap(statistics)));

  // /file/download?id=...
  await page.route(/\/file\/download(?:\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(srk),
    }),
  );

  // /ranking/config/:key
  await page.route(/\/ranking\/config\/[^/?]+(?:\?.*)?$/, (route) => jsonResponse(route, wrap(liveInfo)));

  // /ranking/:id  —— 普通 live ranklist 数据接口
  await page.route(/\/ranking\/[^/?]+(?:\?.*)?$/, (route) => {
    const url = route.request().url();
    if (url.includes('/ranking/config/')) {
      return route.fallback();
    }
    return jsonResponse(route, wrap(liveRanklist));
  });
}

/**
 * 在页面环境注入 init script：用桩对象替换 window.WebSocket，避免 live 页面建立真实 ws 连接。
 */
export async function stubWebSocket(page: Page) {
  await page.addInitScript(() => {
    class FakeWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      readyState = 0;
      binaryType: BinaryType = 'blob';
      onopen: ((ev: any) => void) | null = null;
      onmessage: ((ev: any) => void) | null = null;
      onclose: ((ev: any) => void) | null = null;
      onerror: ((ev: any) => void) | null = null;
      // constructor(_url: string) {
      //   // no-op
      // }
      addEventListener() {}
      removeEventListener() {}
      send() {}
      close() {}
    }
    // @ts-ignore
    window.WebSocket = FakeWebSocket;
  });
}

/**
 * 阻断所有未被 mock 的、指向线上 API/统计的请求，防止漏 mock 时静默联网。
 * 这是一道兜底的安全网。
 */
export async function denyExternalCalls(page: Page) {
  const externalHosts = [
    'rl-api.algoux.cn',
    'algoux-rl.cdn.blueverse.cc',
    'cdn.algoux.cn',
    'www.google-analytics.com',
    'analytics.google.com',
    'googletagmanager.com',
    'www.googletagmanager.com',
  ];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    for (const host of externalHosts) {
      if (url.includes(host)) {
        return route.abort();
      }
    }
    return route.fallback();
  });
}
