
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TradingViewWidget from './components/TradingViewWidget';
import AnalysisPanel from './components/AnalysisPanel';
import TradePlanCard from './components/TradePlanCard';
import { UserPreferences, RiskPreference, MarketAnalysis, TradePlan } from './types';
import { analyzeGoldMarket } from './services/geminiService';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    lotSize: 0.05,
    profitTarget: 100,
    riskPreference: RiskPreference.BALANCED
  });

  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [plan, setPlan] = useState<TradePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeGoldMarket(
        preferences.lotSize,
        preferences.riskPreference,
        preferences.profitTarget
      );
      setAnalysis(result.analysis);
      setPlan(result.plan);
    } catch (err) {
      setError("Analysis failed. Please check market connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        <Sidebar 
          preferences={preferences} 
          setPreferences={setPreferences} 
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />
        
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded text-sm mb-2 flex justify-between items-center animate-in slide-in-from-top duration-300">
              {error}
              <button onClick={() => setError(null)} className="text-lg">&times;</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full min-h-0">
            {/* Chart Column */}
            <div className="xl:col-span-2 flex flex-col gap-6 h-full min-h-0">
              <div className="flex-1 min-h-[400px]">
                <TradingViewWidget />
              </div>
              <div className="h-fit">
                <TradePlanCard plan={plan} />
              </div>
            </div>

            {/* Analysis Column */}
            <div className="xl:col-span-1 h-full min-h-0">
              <AnalysisPanel analysis={analysis} />
            </div>
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center px-6">
        <p className="text-[9px] text-gray-500 uppercase tracking-widest text-center">
          Risk Disclaimer: Educational purposes only. Gold trading involves substantial risk. AI does not guarantee profits.
        </p>
      </footer>
    </div>
  );
};

export default App;
