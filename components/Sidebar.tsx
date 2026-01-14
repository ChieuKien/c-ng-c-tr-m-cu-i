
import React from 'react';
import { UserPreferences, RiskPreference } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onAnalyze: () => void;
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ preferences, setPreferences, onAnalyze, isLoading }) => {
  const lotOptions = [0.01, 0.05, 0.1, 0.5, 1.0];

  return (
    <aside className="w-80 h-[calc(100vh-64px)] border-r border-[#2a2a2a] bg-[#0d0d0d] flex flex-col p-6 gap-8 overflow-y-auto">
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trading Intent</h3>
        
        <div className="space-y-6">
          {/* Lot Size */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size</label>
            <div className="grid grid-cols-3 gap-2">
              {lotOptions.slice(0, 3).map(lot => (
                <button
                  key={lot}
                  onClick={() => setPreferences({ ...preferences, lotSize: lot })}
                  className={`py-2 text-xs rounded border transition-all ${
                    preferences.lotSize === lot 
                      ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' 
                      : 'border-[#2a2a2a] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {lot}
                </button>
              ))}
            </div>
            <input 
              type="number"
              step="0.01"
              value={preferences.lotSize}
              onChange={(e) => setPreferences({...preferences, lotSize: parseFloat(e.target.value)})}
              className="w-full mt-2 bg-[#161616] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
              placeholder="Custom Lot"
            />
          </div>

          {/* Profit Target */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profit Target (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input 
                type="number"
                value={preferences.profitTarget}
                onChange={(e) => setPreferences({...preferences, profitTarget: parseInt(e.target.value)})}
                className="w-full bg-[#161616] border border-[#2a2a2a] rounded pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Risk Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Risk Appetite</label>
            <div className="space-y-2">
              {Object.values(RiskPreference).map(risk => (
                <button
                  key={risk}
                  onClick={() => setPreferences({ ...preferences, riskPreference: risk })}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded border text-sm transition-all ${
                    preferences.riskPreference === risk 
                      ? 'border-yellow-500/50 bg-yellow-500/10 text-white' 
                      : 'border-[#2a2a2a] bg-[#161616] text-gray-400 hover:bg-[#1a1a1a]'
                  }`}
                >
                  {risk}
                  {preferences.riskPreference === risk && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto pt-6 border-t border-[#2a2a2a]">
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            isLoading 
              ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed' 
              : 'bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95 shadow-lg shadow-yellow-900/20'
          }`}
        >
          {isLoading ? (
             <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
          ) : (
            <>
              <Icons.Refresh />
              Run Analysis
            </>
          )}
        </button>
        <p className="text-[10px] text-gray-500 mt-4 text-center leading-relaxed italic">
          AI will scan market structure for confluence zones.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
