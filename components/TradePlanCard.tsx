
import React from 'react';
import { TradePlan, TradeDirection } from '../types';

interface TradePlanCardProps {
  plan: TradePlan | null;
}

const TradePlanCard: React.FC<TradePlanCardProps> = ({ plan }) => {
  if (!plan) return null;

  const isBuy = plan.direction === TradeDirection.BUY;

  return (
    <div className="relative group overflow-hidden bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-yellow-500/30 rounded-xl p-4 md:p-6 shadow-2xl">
      <div className={`absolute top-0 right-0 px-3 md:px-4 py-1 text-[9px] md:text-[10px] font-bold uppercase rounded-bl-lg ${isBuy ? 'bg-green-600' : 'bg-red-600'}`}>
        {plan.direction} Setup
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <span className="text-sm font-semibold text-yellow-500">{plan.status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Freshness</div>
          <div className="text-xs text-white font-mono">{plan.timestamp}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-[#0a0a0a] p-3 md:p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-1">Planned Entry</div>
          <div className="text-lg md:text-xl font-mono text-white tracking-tight">{plan.entryPrice.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0a0a] p-3 md:p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[9px] md:text-[10px] text-green-500/70 uppercase font-bold mb-1">Take Profit</div>
          <div className="text-lg md:text-xl font-mono text-green-500 tracking-tight">{plan.takeProfit.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0a0a] p-3 md:p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[9px] md:text-[10px] text-red-500/70 uppercase font-bold mb-1">Stop Loss</div>
          <div className="text-lg md:text-xl font-mono text-red-500 tracking-tight">{plan.stopLoss.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0a0a] p-3 md:p-4 rounded-lg border border-[#2a2a2a] group-hover:border-yellow-500/20 transition-all">
          <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold mb-1">Horizon</div>
          <div className="text-lg md:text-xl text-white font-medium">{plan.timeHorizon}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between p-3 md:p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/10 gap-4">
        <div className="flex justify-between w-full md:w-auto gap-4 md:gap-8">
          <div>
            <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">R:R Ratio</div>
            <div className="text-xs md:text-sm font-bold text-white">{plan.riskReward}</div>
          </div>
          <div>
            <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">Est. Profit</div>
            <div className="text-xs md:text-sm font-bold text-green-500">+${plan.expectedProfit.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold">AI Confidence</div>
            <div className="text-xs md:text-sm font-bold text-white">{(plan.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradePlanCard;
