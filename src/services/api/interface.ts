import type * as srk from '@algoux/standard-ranklist';

export interface IApiRanklistInfo {
  id: string;
  uniqueKey: string;
  name: string;
  fileID: string;
  viewCnt: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface IApiRanklist {
  info: IApiRanklistInfo;
  srk: srk.Ranklist;
}

export enum CollectionItemType {
  File = 1,
  Directory = 2,
}

export interface IApiCollectionItem {
  type: CollectionItemType;
  uniqueKey: string;
  name: string;
  children?: IApiCollectionItem[];
}

export interface IApiCollection {
  root: {
    children: IApiCollectionItem[];
  };
}

export interface IApiStatistics {
  totalSrkCount: number;
  totalViewCount: number;
}
