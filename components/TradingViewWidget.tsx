
import React, { useEffect, useRef } from 'react';

declare const TradingView: any;

const TradingViewWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const widget = new TradingView.widget({
        autosize: true,
        symbol: "OANDA:XAUUSD",
        interval: "H1",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        container_id: containerRef.current.id,
        studies: [
          "MASimple@tv-basicstudies",
          "RSI@tv-basicstudies"
        ],
        backgroundColor: "#0a0a0a",
        gridColor: "rgba(42, 46, 57, 0.06)",
        hide_top_toolbar: false,
        save_image: false,
      });
    }
  }, []);

  return (
    <div className="w-full h-full border border-[#2a2a2a] rounded-lg overflow-hidden bg-[#0a0a0a]">
      <div id="tradingview_xauusd" ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default TradingViewWidget;
