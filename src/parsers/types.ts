export interface NationShardMap {
  name: string;
  region: string;
  population: number;
  wa: string;
  motto: string;
  category: string;
  endorsements: string[];
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
