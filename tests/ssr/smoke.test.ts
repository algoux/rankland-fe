/**
 * SSR 渲染冒烟测试（可选，依赖 `dist/umi.server.js`）。
 *
 * 流程：
 * 1. 用 msw/node 拦截所有出站 HTTP，把 fixtures 回放回去
 * 2. require 已构建的 dist/umi.server.js（一个 function）
 * 3. 对每个核心路径调用 render，断言 result.error 为空（或在已知不可避免的情况下放宽）
 *
 * 在 CI 中需要先跑 `pnpm build`；本地若 dist 缺失则整组 test.skip。
 */
import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const distDir = path.resolve(__dirname, '..', '..', 'dist');
const umiServerPath = path.join(distDir, 'umi.server.js');
const indexHtmlPath = path.join(distDir, 'index.html');

const hasBuild = fs.existsSync(umiServerPath) && fs.existsSync(indexHtmlPath);

// 读 fixtures
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');
function fixture<T = unknown>(name: string) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8')) as T;
}

const ranklistInfo = fixture('ranklist-info.json');
const srk = fixture('ranklist.srk.json');
const collection = fixture('collection.json');
const listall = fixture('listall.json');
const statistics = fixture('statistics.json');
const liveInfo = fixture('live-info.json');

function ok(data: unknown) {
  return { code: 0, message: 'success', data };
}

// 仅当 dist 存在时才注册 suite
const suite = hasBuild ? describe : describe.skip;

suite('SSR smoke test', () => {
  let server: any;
  let render: (opts: { path: string; htmlTemplate: string }) => Promise<any>;
  let htmlTemplate: string;

  beforeAll(async () => {
    const { setupServer } = await import('msw/node');
    const { http, HttpResponse } = await import('msw');

    server = setupServer(
      http.get(/\/rank\/listall(?:\?.*)?$/, () => HttpResponse.json(ok(listall))),
      http.get(/\/rank\/search(?:\?.*)?$/, () => HttpResponse.json(ok(listall))),
      http.get(/\/statistics(?:\?.*)?$/, () => HttpResponse.json(ok(statistics))),
      http.get(/\/rank\/group\/[^/?]+(?:\?.*)?$/, () => HttpResponse.json(ok({ content: JSON.stringify(collection) }))),
      http.get(/\/file\/download(?:\?.*)?$/, () => HttpResponse.json(srk)),
      http.get(/\/ranking\/config\/[^/?]+(?:\?.*)?$/, () => HttpResponse.json(ok(liveInfo))),
      http.get(/\/ranking\/[^/?]+(?:\?.*)?$/, () => HttpResponse.json(ok(srk))),
      http.get(/\/rank\/[^/?]+(?:\?.*)?$/, () => HttpResponse.json(ok(ranklistInfo))),
    );
    server.listen({ onUnhandledRequest: 'error' });

    htmlTemplate = fs.readFileSync(indexHtmlPath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    render = require(umiServerPath);
  });

  afterAll(() => {
    server?.close();
  });

  it('renders /playground without errors (no API dependency)', async () => {
    const res = await render({ path: '/playground', htmlTemplate });
    expect(res.error).toBeFalsy();
    expect(typeof res.html).toBe('string');
    expect(res.html).toContain('<!DOCTYPE html>');
  });

  for (const p of ['/ranklist/test-key', '/collection/official', '/collection/official?rankId=test-key', '/search?kw=Test', '/live/live-test-key']) {
    it(`renders ${p} without errors`, async () => {
      const res = await render({ path: p, htmlTemplate });
      expect(res.error).toBeFalsy();
      expect(typeof res.html).toBe('string');
      expect(res.html).toContain('<!DOCTYPE html>');
    });
  }
});
