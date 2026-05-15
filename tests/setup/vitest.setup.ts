/**
 * Vitest 全局 setup：在所有测试运行前注入 process.env 默认值
 *
 * 这些环境变量在 webpack 构建时由 `.umirc.ts` 的 `define` 注入，
 * 在 Node 单元测试环境下需要手动提供，避免源码中读取到 `undefined`。
 */
process.env.API_BASE_CLIENT = process.env.API_BASE_CLIENT || 'http://api.test';
process.env.API_BASE_SERVER = process.env.API_BASE_SERVER || 'http://api.test';
process.env.CDN_API_BASE_CLIENT = process.env.CDN_API_BASE_CLIENT || 'http://cdn.test';
process.env.CDN_API_BASE_SERVER = process.env.CDN_API_BASE_SERVER || 'http://cdn.test';
process.env.SRK_STORAGE_BASE = process.env.SRK_STORAGE_BASE || 'http://srk.test';
process.env.HOST_GLOBAL = process.env.HOST_GLOBAL || 'rl.algoux.org';
process.env.HOST_CN = process.env.HOST_CN || 'rl.algoux.cn';
process.env.BEIAN = process.env.BEIAN || '鲁ICP备18021776号-5';
process.env.LIVE_POLLING_INTERVAL = process.env.LIVE_POLLING_INTERVAL || '10000';
process.env.WS_BASE = process.env.WS_BASE || 'ws://ws.test';
