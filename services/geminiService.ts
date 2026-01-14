
import { GoogleGenAI, Type } from "@google/genai";
import { MarketAnalysis, TradePlan, RiskPreference, TradeDirection, TradeStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function analyzeGoldMarket(
  lotSize: number,
  riskPref: RiskPreference,
  profitTarget: number
): Promise<{ analysis: MarketAnalysis; plan: TradePlan | null }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a detailed technical analysis for XAU/USD (Gold) based on real-time data. 
      Focus on Support & Resistance (S/R) zones. 
      User parameters: 
      - Lot Size: ${lotSize}
      - Risk: ${riskPref}
      - Profit Target: $${profitTarget}

      Determine:
      1. Trend (Bullish/Bearish/Neutral)
      2. Market Structure (H/H, L/L etc)
      3. Key S/R levels
      4. Liquidity Zones
      5. Session Bias (New York/London/Asia)
      6. A PLANNED LIMIT ORDER (Do not suggest market entry at current price unless it is exactly at a level).

      Provide the response in structured JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                trend: { type: Type.STRING },
                structure: { type: Type.STRING },
                volatility: { type: Type.STRING },
                supportLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                resistanceLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                liquidityZones: { type: Type.ARRAY, items: { type: Type.STRING } },
                bias: { type: Type.STRING },
                newsWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["trend", "structure", "supportLevels", "resistanceLevels"]
            },
            plan: {
              type: Type.OBJECT,
              properties: {
                direction: { type: Type.STRING, enum: ["BUY", "SELL"] },
                entryPrice: { type: Type.NUMBER },
                takeProfit: { type: Type.NUMBER },
                stopLoss: { type: Type.NUMBER },
                riskReward: { type: Type.STRING },
                expectedProfit: { type: Type.NUMBER },
                timeHorizon: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["direction", "entryPrice", "takeProfit", "stopLoss"]
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const plan: TradePlan | null = result.plan ? {
      ...result.plan,
      status: TradeStatus.WAITING,
      timestamp: new Date().toLocaleTimeString(),
      direction: result.plan.direction as TradeDirection
    } : null;

    const analysis: MarketAnalysis = {
      ...result.analysis,
      groundingSources
    };

    return { analysis, plan };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
