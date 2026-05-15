/**
 * 仅在 Vitest / msw-node 环境下使用的 `umi` 模块 shim。
 *
 * 真实的 `umi` 在 Node 下会尝试 require `@@/core/umiExports`，
 * 该文件由 `umi dev/build` 时生成，单测环境下不存在，
 * 导致 `isBrowser` 等 SSR helpers 缺失。这里提供最小可用实现。
 */
export const isBrowser = (): boolean => false;
