
import React from 'react';
import { MarketAnalysis } from '../types';
import { Icons } from '../constants';

interface AnalysisPanelProps {
  analysis: MarketAnalysis | null;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center border border-[#2a2a2a] rounded-lg bg-[#0d0d0d]">
        <div className="p-4 rounded-full bg-[#161616] mb-4">
          <Icons.TrendingUp />
        </div>
        <h3 className="text-white font-medium mb-1">Ready to Analyze</h3>
        <p className="text-sm">Click "Run Analysis" to scan XAU/USD technical structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Icons.TrendingUp />
          Market Context
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Bias</div>
            <div className={`text-sm font-bold ${analysis.trend === 'Bullish' ? 'text-green-500' : analysis.trend === 'Bearish' ? 'text-red-500' : 'text-yellow-500'}`}>
              {analysis.trend}
            </div>
          </div>
          <div className="bg-[#0d0d0d] p-3 rounded border border-[#2a2a2a]">
            <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Volatility</div>
            <div className="text-sm font-bold text-white">{analysis.volatility}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Market Structure</div>
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.structure}</p>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Technical Bias</div>
            <p className="text-xs text-gray-300 leading-relaxed italic">"{analysis.bias}"</p>
          </div>
        </div>
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg p-5">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">S/R Engine Levels</h3>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] text-red-500/70 uppercase font-bold mb-2">Resistance Zones</div>
            <div className="flex flex-wrap gap-2">
              {analysis.resistanceLevels.map(level => (
                <span key={level} className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-mono font-bold">
                  {level.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-green-500/70 uppercase font-bold mb-2">Support Zones</div>
            <div className="flex flex-wrap gap-2">
              {analysis.supportLevels.map(level => (
                <span key={level} className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] font-mono font-bold">
                  {level.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {analysis.newsWarnings.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
          <h4 className="text-[10px] text-yellow-500 uppercase font-bold mb-2 flex items-center gap-1">
            <Icons.AlertCircle />
            Risk Advisory
          </h4>
          <ul className="space-y-1">
            {analysis.newsWarnings.map((warn, i) => (
              <li key={i} className="text-[10px] text-yellow-500/80">• {warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
