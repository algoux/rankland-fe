import type * as srk from '@algoux/standard-ranklist';
import requestAdapter, { ApiException, HttpException, RequestAdapter } from '@/utils/request';
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
    return this.requestAdapter.get<{
      ranks: IApiRanklistInfo[];
    }>(urlcat('/rank/search', { query: opts.kw }));
  }

  public getCollection(opts: { uniqueKey: string }) {
    return this.requestAdapter
      .get(urlcat('/rank/group/:key', { key: opts.uniqueKey }))
      .then((res) => JSON.parse(res.content) as IApiCollection);
  }

  public getStatistics() {
    return this.requestAdapter.get<IApiStatistics>('/statistics');
  }

  public async getLiveConfig(opts: { id: string }): Promise<IApiLiveConfig> {
    const res = await this.requestAdapter.get(
      urlcat('/live/:id.json', { id: opts.id, _t: Math.floor(Date.now() / 1000) }),
      {
        getResponse: true,
      },
    );
    return await res.response.json();
  }

  public async getLiveRanklist(opts: { url: string }): Promise<srk.Ranklist> {
    const res = await this.getLiveFile(opts.url);
    switch (res.response.headers.get('content-type')) {
      case 'application/json':
        return await res.response.json();
    }
    throw new Error('Unknown srk content type');
  }

  public async getLiveScrollSolution(opts: { url: string }): Promise<IApiLiveScrollSolutionData> {
    const res = await this.getLiveFile(opts.url);
    return await res.response.json();
  }

  private getLiveFile<T>(url: string) {
    return this.requestAdapter.get<T>(urlcat(url, { _t: Math.floor(Date.now() / 1000) }), {
      getResponse: true,
    });
  }
}

export const api = new ApiService(requestAdapter);
