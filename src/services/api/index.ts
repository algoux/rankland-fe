import type * as srk from '@algoux/standard-ranklist';
import { apiRequestAdapter, cdnApiRequestAdapter, ApiException, HttpException, RequestAdapter } from '@/utils/request';
import { IApiCollection, IApiLiveRanklistInfo, IApiRanklist, IApiRanklistInfo, IApiStatistics } from './interface';
import urlcat from 'urlcat';
import { LogicException, LogicExceptionKind } from './logic.exception';
import { isBrowser } from 'umi';

function getCacheManager() {
  if (isBrowser() || typeof global === 'undefined') {
    return null;
  } else {
    // @ts-ignore
    return global.cacheManager as {
      get: (...args: any[]) => Promise<any>;
      set: (...args: any[]) => Promise<void>;
      setEx: (...args: any[]) => Promise<void>;
      del: (...args: any[]) => Promise<void>;
    };
  }
}

export class ApiService {
  public constructor(private readonly requestAdapters: { api: RequestAdapter; cdnApi: RequestAdapter }) {}

  public async getRanklistInfo(opts: { uniqueKey: string }) {
    const cacheKey = `rankland_ssr_api_cache:getRanklistInfo:${opts.uniqueKey}`;
    const cached = await getCacheManager()?.get(cacheKey);
    if (cached) {
      console.log('[ssr_api_cache] cache hit:', cacheKey);
      return JSON.parse(cached) as IApiRanklistInfo;
    }
    const res = await this.requestAdapters.cdnApi.get<IApiRanklistInfo>(urlcat('/rank/:key', { key: opts.uniqueKey }));
    getCacheManager()?.setEx(cacheKey, 60, JSON.stringify(res));
    return res;
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const cacheKey = `rankland_ssr_api_cache:getSrkFile:${opts.fileID}`;
    const cached = await getCacheManager()?.get(cacheKey);
    if (cached) {
      console.log('[ssr_api_cache] cache hit:', cacheKey);
      if (typeof cached === 'string') {
        try {
          return JSON.parse(cached) as T;
        } catch (e) {
          console.error('JSON.parse the ssr api cache string failed, the cache may be broken:', cacheKey, cached);
          getCacheManager()?.del(cacheKey);
        }
      } else {
        return cached;
      }
    }
    let res;
    const apiRes = await this.requestAdapters.cdnApi.get(urlcat('/file/download', { id: opts.fileID }), {
      getResponse: true,
    });
    switch ((apiRes.response.headers.get('content-type') || '').split(';')[0]) {
      case 'application/json': {
        const plain = await apiRes.response.text();
        res = JSON.parse(plain) as T;
        getCacheManager()?.setEx(cacheKey, 24 * 60 * 60, plain);
        break;
      }
      default:
        throw new Error('Unknown srk content type');
    }
    return res;
  }

  public async getRanklist(opts: { uniqueKey: string }): Promise<IApiRanklist> {
    try {
      const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
      const srk = await this.getSrkFile({ fileID: info.fileID });
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
    return this.requestAdapters.api.get<{
      ranks: IApiRanklistInfo[];
    }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public async listAllRanklists() {
    return this.requestAdapters.api.get<{
      ranks: IApiRanklistInfo[];
    }>('/rank/listall');
  }

  public async getCollection(opts: { uniqueKey: string }) {
    const cacheKey = `rankland_ssr_api_cache:getCollection:${opts.uniqueKey}`;
    const cached = await getCacheManager()?.get(cacheKey);
    if (cached) {
      console.log('[ssr_api_cache] cache hit:', cacheKey);
      return JSON.parse(cached) as IApiCollection;
    }
    const plain = await this.requestAdapters.cdnApi
      .get(urlcat('/rank/group/:key', { key: opts.uniqueKey }))
      .then((res) => res.content as string);
    getCacheManager()?.setEx(cacheKey, 2 * 60, plain);
    return JSON.parse(plain) as IApiCollection;
  }

  public getStatistics() {
    return this.requestAdapters.api.get<IApiStatistics>('/statistics');
  }

  public async getLiveRanklistInfo(opts: { uniqueKey: string }): Promise<IApiLiveRanklistInfo> {
    const res = await this.requestAdapters.api.get<IApiLiveRanklistInfo>(
      urlcat('/ranking/config/:uniqueKey', { uniqueKey: opts.uniqueKey, _t: Date.now() }),
    );
    return res;
  }

  public async getLiveRanklist(opts: { id: string; token?: string }): Promise<srk.Ranklist> {
    const res = await this.requestAdapters.api.get<srk.Ranklist>(
      urlcat('/ranking/:id', { id: opts.id, token: opts.token || undefined, _t: Date.now() }),
    );
    return res;
  }
}

export const api = new ApiService({
  api: apiRequestAdapter,
  cdnApi: cdnApiRequestAdapter,
});
