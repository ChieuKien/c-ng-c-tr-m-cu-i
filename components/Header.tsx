
import React from 'react';
import { Icons, GOLD_PRIMARY } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0a0a0a] sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-700 flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-yellow-900/20">
          GP
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          GoldPulse <span className="text-yellow-500 font-light">AI</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-green-500 uppercase tracking-wider">Live Market Connection</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Instrument</div>
          <div className="text-sm font-bold text-white">XAU/USD</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
