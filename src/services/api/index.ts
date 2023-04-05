import type * as srk from '@algoux/standard-ranklist';
import { apiRequestAdapter, cdnApiRequestAdapter, ApiException, HttpException, RequestAdapter } from '@/utils/request';
import {
  IApiCollection,
  IApiLiveConfig,
  IApiLiveScrollSolutionData,
  IApiRanklist,
  IApiRanklistInfo,
  IApiStatistics,
} from './interface';
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

  public async getLiveConfig(opts: { id: string }): Promise<IApiLiveConfig> {
    const res = await this.requestAdapters.cdnApi.get(
      urlcat('/live/:id.json', { id: opts.id, _t: Math.floor(Date.now() / 1000) }),
      {
        getResponse: true,
      },
    );
    return await res.response.json();
  }

  public async getLiveRanklist(opts: { url: string; alignBaseSec?: number }): Promise<srk.Ranklist> {
    const res = await this.getLiveFile(opts.url, opts.alignBaseSec);
    switch ((res.response.headers.get('content-type') || '').split(';')[0]) {
      case 'application/json':
        return await res.response.json();
    }
    throw new Error('Unknown srk content type');
  }

  public async getLiveScrollSolution(opts: {
    url: string;
    alignBaseSec?: number;
  }): Promise<IApiLiveScrollSolutionData> {
    const res = await this.getLiveFile(opts.url, opts.alignBaseSec);
    return await res.response.json();
  }

  private getLiveFile<T>(url: string, alignBaseSec?: number) {
    let sec = Math.floor(Date.now() / 1000);
    if (alignBaseSec && alignBaseSec > 0) {
      sec -= sec % alignBaseSec;
    }
    return this.requestAdapters.api.get<T>(urlcat(url, { _t: sec }), {
      getResponse: true,
    });
  }
}

export const api = new ApiService({
  api: apiRequestAdapter,
  cdnApi: cdnApiRequestAdapter,
});
