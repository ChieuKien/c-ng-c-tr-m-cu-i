
import React from 'react';
import { UserPreferences, RiskPreference, AnalysisHistoryItem, TradeDirection } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  onAnalyze: () => void;
  isLoading: boolean;
  history: AnalysisHistoryItem[];
  currentId: string | null;
  onSelectHistory: (item: AnalysisHistoryItem) => void;
  onDeleteHistory: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  preferences, 
  setPreferences, 
  onAnalyze, 
  isLoading, 
  history, 
  currentId,
  onSelectHistory,
  onDeleteHistory,
  isOpen,
  onClose
}) => {
  const lotOptions = [0.01, 0.05, 0.1, 0.5, 1.0];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#0d0d0d] border-r border-[#2a2a2a] 
        transform transition-transform duration-300 ease-in-out flex flex-col p-6 gap-8
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        xl:relative xl:translate-x-0 xl:z-auto shrink-0
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="xl:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

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

        {/* Analysis History Section */}
        <section className="flex-1 overflow-hidden flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex justify-between items-center">
            Recent History
            <span className="text-[10px] text-gray-600 font-normal">{history.length} runs</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-[10px] text-gray-600 italic text-center py-4">No recent analyses</div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelectHistory(item)}
                  className={`group relative flex flex-col p-3 rounded border cursor-pointer transition-all ${
                    currentId === item.id 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : 'border-[#2a2a2a] bg-[#161616]/50 hover:bg-[#1a1a1a] hover:border-[#3a3a3a]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase ${item.plan?.direction === TradeDirection.BUY ? 'text-green-500' : 'text-red-500'}`}>
                      {item.plan?.direction || 'N/A'} @ {item.plan?.entryPrice.toFixed(1) || '---'}
                    </span>
                    <button 
                      onClick={(e) => onDeleteHistory(item.id, e)}
                      className="xl:opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-600 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-gray-500 font-mono">{item.timestamp}</span>
                    <span className="text-[9px] text-gray-400 bg-[#2a2a2a] px-1.5 py-0.5 rounded uppercase">{item.preferences.riskPreference}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="pt-6 border-t border-[#2a2a2a] mt-auto">
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
