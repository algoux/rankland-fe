import Long from 'long';
import { IApiLiveScrollSolution } from '@/services/api/interface';

export function parseRealtimeSolutionBuffer(d: ArrayBuffer): IApiLiveScrollSolution {
  const dv = new DataView(d);
  const fieldNum = dv.getInt8(0);
  const fieldLen = [];
  for (let i = 1; i <= fieldNum; ++i) {
    fieldLen.push(dv.getInt8(i));
  }
  let start = fieldNum + 1;
  const td = new TextDecoder();
  const fieldArrayBffers: ArrayBuffer[] = [];
  for (let i = 0; i < fieldNum; ++i) {
    fieldArrayBffers.push(d.slice(start, start + fieldLen[i]));
    start += fieldLen[i];
  }
  const id = Long.fromBytes(Array.from(new Uint8Array(fieldArrayBffers[0])));
  const problemAlias = td.decode(fieldArrayBffers[1]);
  const userId = td.decode(fieldArrayBffers[2]);
  const result = td.decode(fieldArrayBffers[3]);
  const solvedDv = new DataView(fieldArrayBffers[4]);
  const solved = solvedDv.getInt8(0);

  return {
    id,
    problemAlias,
    userId,
    // @ts-ignore
    result,
    solved,
  };
}
