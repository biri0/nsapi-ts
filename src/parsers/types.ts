export interface CensusHistoryPoint {
  timestamp?: number;
  score?: number;
}

export interface CensusScaleData {
  id?: number;
  score?: number;
  rank?: number;
  regionRank?: number;
  worldPercentRank?: number;
  regionPercentRank?: number;
  history: CensusHistoryPoint[];
}

export interface CensusData {
  scales: CensusScaleData[];
}

export interface HappeningEvent {
  id?: number;
  timestamp?: number;
  text?: string;
  type?: string;
}

export interface HappeningsData {
  events: HappeningEvent[];
}

export interface NationShardMap {
  name: string;
  region: string;
  population: number;
  wa: string;
  motto: string;
  category: string;
  endorsements: string[];
  census: CensusData;
  happenings: HappeningsData;
}

export interface RegionShardMap {
  name: string;
  numnations: number;
  delegate: string;
  delegatevotes: number;
  nations: string[];
  wanations: string[];
  power: string;
}

export interface WorldShardMap {
  numnations: number;
  numregions: number;
  featuredregion: string;
  newnations: string[];
  lasteventid: number;
  census: CensusData;
  happenings: HappeningsData;
}

export interface WAResolutionData {
  id?: number;
  name?: string;
  category?: string;
  desc?: string;
  proposer?: string;
}

export interface WAShardMap {
  numnations: number;
  numdelegates: number;
  delegates: string[];
  members: string[];
  resolution: WAResolutionData;
}

export type ParsedByShards<
  TMap,
  TShards extends readonly (keyof TMap)[],
> = {
  [K in TShards[number]]: TMap[K];
};
