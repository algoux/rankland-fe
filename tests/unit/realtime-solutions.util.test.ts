import { describe, expect, it } from 'vitest';
import Long from 'long';
import { parseRealtimeSolutionBuffer } from '@/utils/realtime-solutions.util';

/**
 * 构造一个符合协议的二进制 buffer：
 * - byte 0: fieldNum
 * - bytes 1..fieldNum: 每个字段的字节长度
 * - 后面依次是各字段的原始字节
 *
 * 字段顺序：[id(8B Long BE), problemAlias(str), userId(str), result(str), solved(1B int8)]
 */
function buildSolutionBuffer(opts: {
  idBytes: number[]; // 8 bytes big-endian
  problemAlias: string;
  userId: string;
  result: string;
  solved: number; // int8
}): ArrayBuffer {
  const enc = new TextEncoder();
  const aliasBytes = enc.encode(opts.problemAlias);
  const userBytes = enc.encode(opts.userId);
  const resultBytes = enc.encode(opts.result);
  const fieldLens = [opts.idBytes.length, aliasBytes.length, userBytes.length, resultBytes.length, 1];

  const total = 1 + fieldLens.length + fieldLens.reduce((a, b) => a + b, 0);
  const ab = new ArrayBuffer(total);
  const dv = new DataView(ab);
  const u8 = new Uint8Array(ab);

  let offset = 0;
  dv.setInt8(offset++, fieldLens.length);
  for (const len of fieldLens) {
    dv.setInt8(offset++, len);
  }
  for (const b of opts.idBytes) {
    u8[offset++] = b;
  }
  u8.set(aliasBytes, offset);
  offset += aliasBytes.length;
  u8.set(userBytes, offset);
  offset += userBytes.length;
  u8.set(resultBytes, offset);
  offset += resultBytes.length;
  dv.setInt8(offset, opts.solved);

  return ab;
}

describe('parseRealtimeSolutionBuffer', () => {
  it('parses a well-formed binary solution payload', () => {
    const idLong = Long.fromInt(0x12345678);
    const idBytes = idLong.toBytes(/* big-endian */ false);
    const buf = buildSolutionBuffer({
      idBytes,
      problemAlias: 'A',
      userId: 'team-alpha',
      result: 'AC',
      solved: 3,
    });

    const parsed = parseRealtimeSolutionBuffer(buf);
    expect(parsed.problemAlias).toBe('A');
    expect(parsed.userId).toBe('team-alpha');
    expect(parsed.result).toBe('AC');
    expect(parsed.solved).toBe(3);
    expect(parsed.id.toNumber()).toBe(0x12345678);
  });

  it('parses RJ result with multibyte safe ASCII fields', () => {
    const idBytes = Long.fromInt(1).toBytes(false);
    const buf = buildSolutionBuffer({
      idBytes,
      problemAlias: 'B',
      userId: 'team-beta',
      result: 'RJ',
      solved: 0,
    });
    const parsed = parseRealtimeSolutionBuffer(buf);
    expect(parsed.result).toBe('RJ');
    expect(parsed.solved).toBe(0);
    expect(parsed.id.toNumber()).toBe(1);
  });
});
