
import React from 'react';
import { TradePlan, TradeDirection } from '../types';

interface TradePlanCardProps {
  plan: TradePlan | null;
}

const TradePlanCard: React.FC<TradePlanCardProps> = ({ plan }) => {
  if (!plan) return null;

  const isBuy = plan.direction === TradeDirection.BUY;

  return (
    <div className="relative group overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-yellow-500/30 rounded-xl p-6 shadow-2xl">
      <div className={`absolute top-0 right-0 px-4 py-1 text-[10px] font-bold uppercase rounded-bl-lg ${isBuy ? 'bg-green-600' : 'bg-red-600'}`}>
        {plan.direction} Setup
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Status</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="text-sm font-semibold text-yellow-500">{plan.status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Analysis Freshness</div>
          <div className="text-xs text-white font-mono">{plan.timestamp} UTC</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Planned Entry</div>
          <div className="text-xl font-mono text-white tracking-tight">{plan.entryPrice.toFixed(2)}</div>
          <div className="text-[10px] text-gray-600 mt-1 italic">Limit order recommended</div>
        </div>
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[10px] text-green-500/70 uppercase font-bold mb-1">Take Profit</div>
          <div className="text-xl font-mono text-green-500 tracking-tight">{plan.takeProfit.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[10px] text-red-500/70 uppercase font-bold mb-1">Stop Loss</div>
          <div className="text-xl font-mono text-red-500 tracking-tight">{plan.stopLoss.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Est. Horizon</div>
          <div className="text-xl text-white font-medium">{plan.timeHorizon}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/10 gap-4">
        <div className="flex gap-8">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">R:R Ratio</div>
            <div className="text-sm font-bold text-white">{plan.riskReward}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">Est. Net Profit</div>
            <div className="text-sm font-bold text-green-500">+${plan.expectedProfit.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">AI Confidence</div>
            <div className="text-sm font-bold text-white">{(plan.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div className="text-xs text-yellow-500/60 font-medium italic">
          Wait for price action confirmation at entry.
        </div>
      </div>
    </div>
  );
};

export default TradePlanCard;
