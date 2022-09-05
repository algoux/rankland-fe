import type * as srk from '@algoux/standard-ranklist';
import requestAdapter, { RequestAdapter } from '@/utils/request';
import { IApiRanklistInfo } from './interface';

export class ApiService {
  public constructor(private readonly requestAdapter: RequestAdapter) {}

  public getRanklistInfo(opts: { uniqueKey: string }) {
    return this.requestAdapter.get<IApiRanklistInfo>(`/rank/${opts.uniqueKey}`);
  }

  public async getSrkFile<T = srk.Ranklist>(opts: { fileID: string }): Promise<T> {
    const res = await this.requestAdapter.get(`/file/download?id=${opts.fileID}`, {
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
    const info = await this.getRanklistInfo({ uniqueKey: opts.uniqueKey });
    const srk = await this.getSrkFile<T>({ fileID: info.fileID });
    return {
      info,
      srk,
    };
  }
}

export const api = new ApiService(requestAdapter);
