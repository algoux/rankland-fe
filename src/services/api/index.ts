import type * as srk from '@algoux/standard-ranklist';
import requestAdapter, { ApiException, HttpException, RequestAdapter } from '@/utils/request';
import { IApiRanklistInfo } from './interface';
import urlcat from 'urlcat';
import { LogicException, LogicExceptionKind } from './logic.exception';

export class ApiService {
  public constructor(private readonly requestAdapter: RequestAdapter) {}

  public getRanklistInfo(opts: { uniqueKey: string }) {
    return this.requestAdapter.get<IApiRanklistInfo>(urlcat('/rank/:key', { key: opts.uniqueKey }));
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const res = await this.requestAdapter.get(urlcat('/file/download', { id: opts.fileID }), {
      getResponse: true,
    });
    switch (res.response.headers.get('content-type')) {
      case 'application/json':
        return await res.response.json();
    }
    throw new Error('Unknown srk content type');
  }

  public async getRanklist<T = srk.Ranklist>(opts: {
    uniqueKey: string;
  }): Promise<{
    info: IApiRanklistInfo;
    srk: T;
  }> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const srk = await this.getSrkFile<T>({ fileID: info.fileID });
      return {
        info,
        srk,
      };
    } catch (e) {
      if ((e instanceof ApiException && e.code === 11) || (e instanceof HttpException && e.status === 404)) {
        throw new LogicException(LogicExceptionKind.NotFound);
      }
      throw e;
    }
  }

  public async searchRanklist(opts: { kw?: string }) {
    return this.requestAdapter.get<{
      ranks: IApiRanklistInfo[];
    }>(urlcat('/rank/search', { query: opts.kw }));
  }
}

export const api = new ApiService(requestAdapter);
