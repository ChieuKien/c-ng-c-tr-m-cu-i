
export enum RiskPreference {
  CONSERVATIVE = 'Conservative',
  BALANCED = 'Balanced',
  AGGRESSIVE = 'Aggressive'
}

export enum TradeDirection {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum TradeStatus {
  WAITING = 'Waiting for entry',
  APPROACHING = 'Price approaching entry zone',
  INVALIDATED = 'Entry invalidated',
  ACTIVE = 'Active'
}

export interface TradePlan {
  direction: TradeDirection;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  riskReward: string;
  expectedProfit: number;
  timeHorizon: string;
  status: TradeStatus;
  timestamp: string;
  confidence: number;
}

export interface MarketAnalysis {
  id: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  structure: string;
  volatility: string;
  supportLevels: number[];
  resistanceLevels: number[];
  liquidityZones: string[];
  bias: string;
  newsWarnings: string[];
  groundingSources?: any[];
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  analysis: MarketAnalysis;
  plan: TradePlan | null;
  preferences: UserPreferences;
}

export interface UserPreferences {
  lotSize: number;
  profitTarget: number;
  riskPreference: RiskPreference;
}
