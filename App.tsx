
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TradingViewWidget from './components/TradingViewWidget';
import AnalysisPanel from './components/AnalysisPanel';
import TradePlanCard from './components/TradePlanCard';
import { UserPreferences, RiskPreference, MarketAnalysis, TradePlan, AnalysisHistoryItem } from './types';
import { analyzeGoldMarket } from './services/geminiService';

const STORAGE_KEY = 'goldpulse_history';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after starting analysis
    try {
      const result = await analyzeGoldMarket(
        preferences.lotSize,
        preferences.riskPreference,
        preferences.profitTarget
      );
      
      const newHistoryItem: AnalysisHistoryItem = {
        id: result.analysis.id,
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        analysis: result.analysis,
        plan: result.plan,
        preferences: { ...preferences }
      };

      setAnalysis(result.analysis);
      setPlan(result.plan);
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20)); // Keep last 20
    } catch (err) {
      setError("Analysis failed. Please check market connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  const handleSelectHistory = useCallback((item: AnalysisHistoryItem) => {
    setAnalysis(item.analysis);
    setPlan(item.plan);
    setPreferences(item.preferences);
    setIsSidebarOpen(false);
  }, []);

  const handleDeleteHistory = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    if (analysis?.id === id) {
      setAnalysis(null);
      setPlan(null);
    }
  }, [analysis]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Sidebar / Drawer */}
        <Sidebar 
          preferences={preferences} 
          setPreferences={setPreferences} 
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          history={history}
          currentId={analysis?.id || null}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded text-sm mb-2 flex justify-between items-center animate-in slide-in-from-top duration-300">
              {error}
              <button onClick={() => setError(null)} className="text-lg">&times;</button>
            </div>
          )}

          <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
            {/* Chart Column */}
            <div className="xl:col-span-2 flex flex-col gap-4 md:gap-6">
              <div className="h-[350px] md:h-[500px] xl:h-[600px]">
                <TradingViewWidget />
              </div>
              <div className="order-first xl:order-last">
                <TradePlanCard plan={plan} />
              </div>
            </div>

            {/* Analysis Column */}
            <div className="xl:col-span-1">
              <AnalysisPanel analysis={analysis} />
            </div>
          </div>
        </div>
      </main>

      <footer className="h-10 border-t border-[#2a2a2a] bg-[#0d0d0d] flex items-center justify-center px-6 shrink-0">
        <p className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest text-center px-4">
          Risk Disclaimer: Educational purposes only. Gold trading involves substantial risk.
        </p>
      </footer>
    </div>
  );
};

export default App;
