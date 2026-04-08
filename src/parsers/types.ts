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

export interface DispatchSummary {
  id?: number;
  title?: string;
  author?: string;
  category?: string;
  subcategory?: string;
  created?: number;
  edited?: number;
  score?: number;
  views?: number;
}

export interface DispatchListData {
  dispatches: DispatchSummary[];
}

export interface WAVoteEntry {
  nation?: string;
  delegate?: string;
  vote?: string;
  timestamp?: number;
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
  dispatchlist: DispatchListData;
}

export interface NationIssueOption {
  id: number;
  text?: string;
}

export interface NationIssueSummaryItem {
  id: number;
  title?: string;
  optionCount?: number;
}

export interface NationIssueData {
  id: number;
  title?: string;
  text?: string;
  author?: string;
  editor?: string;
  pic1?: string;
  pic2?: string;
  options: NationIssueOption[];
}

export interface NationIssuesData {
  issues: NationIssueData[];
}

export interface NationIssueSummaryData {
  issues: NationIssueSummaryItem[];
}

export interface NationNoticeData {
  id?: number;
  text?: string;
  timestamp?: number;
}

export interface NationNoticesData {
  notices: NationNoticeData[];
}

export interface NationPrivateShardMap {
  issues: NationIssuesData;
  issuesummary: NationIssueSummaryData;
  nextissue: number;
  nextissuetime: number;
  notices: NationNoticesData;
  unread: number;
}

export interface IssueCommandRankingData {
  id?: number;
  score?: number;
  change?: number;
  pchange?: number;
  rank?: number;
}

export interface IssueCommandResult {
  ok: boolean;
  desc?: string;
  rankings: IssueCommandRankingData[];
  unlocks: string[];
  reclassifications: string[];
  newPolicies: string[];
  removedPolicies: string[];
}

export interface VerifyData {
  success: boolean;
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
  dispatchlist: DispatchListData;
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
  voters: string[];
  votetrack: WAVoteEntry[];
  dellog: WAVoteEntry[];
  delvotes: WAVoteEntry[];
}

export type ParsedByShards<
  TMap,
  TShards extends readonly (keyof TMap)[],
> = {
  [K in TShards[number]]: TMap[K];
};
