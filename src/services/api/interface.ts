import type * as srk from '@algoux/standard-ranklist';
import Long from 'long';

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

export interface IApiLiveConfig {
  srkRefreshInterval: number;
  srkUrl: string;
  scrollSolutionRefreshInterval?: number;
  scrollSolutionUrl?: string;
  ranklistUniqueKey?: string;
}

export interface IApiLiveScrollSolutionDataItem {
  problem: srk.Problem;
  score: {
    value: srk.RankScore['value'];
  };
  result: Exclude<srk.SolutionResultFull, null>;
  user: srk.User;
}

export interface IApiLiveScrollSolutionData {
  rows: IApiLiveScrollSolutionDataItem[];
  updatedAt: number; // timestamp (s)
}

export interface IApiLiveRanklistInfo {
  id: string;
  uniqueKey: string;
  title: srk.Contest['title'];
  startAt: srk.Contest['title'];
  duration: srk.Contest['duration'];
  frozenDuration: srk.Contest['frozenDuration'];
  unfrozenAt: srk.DatetimeISOString;
  problems: srk.Problem[];
  members: srk.User[];
  markers: srk.Marker[];
  series: srk.RankSeries[];
  sorter: srk.SorterICPC;
  contributors: srk.Contributor[];
  type: srk.Type;
}

export interface IApiLiveScrollSolution {
  id: Long;
  problemAlias: string; // -> match from IApiLiveRanklistInfo['problems']
  userId: string; // -> match from IApiLiveRanklistInfo['members']
  result: 'AC' | 'FB' | 'RJ' | '?';
  solved: number;
}
