import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatCurrency, getActiveStrategyTrades } from "@/lib/calculations";
import { Trade } from "@shared/schema";

interface RiskRewardChartProps {
  trades: Trade[];
  strategies?: any[];
}

export default function RiskRewardChart({ trades, strategies = [] }: RiskRewardChartProps) {
  // Only include active strategy trades in analytics
  const activeTrades = getActiveStrategyTrades(trades, strategies);
  
  // Calculate risk-reward data for each trade
  const riskRewardData = activeTrades
    .filter(trade => trade.entryPrice && trade.exitPrice && trade.stopLoss)
    .map(trade => {
      const entryPrice = parseFloat(trade.entryPrice?.toString() || "0");
      const exitPrice = parseFloat(trade.exitPrice?.toString() || "0");
      const stopLoss = parseFloat(trade.stopLoss?.toString() || "0");
      const pnl = parseFloat(trade.profitLoss?.toString() || "0");
      
      // Calculate risk and reward
      const risk = Math.abs(entryPrice - stopLoss);
      const reward = Math.abs(exitPrice - entryPrice);
      const riskRewardRatio = risk > 0 ? reward / risk : 0;
      
      return {
        risk,
        reward,
        ratio: riskRewardRatio,
        pnl,
        stockName: trade.stockName,
        tradeDate: trade.tradeDate,
        isWin: pnl > 0,
      };
    });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{data.stockName}</p>
          <div className="space-y-1">
            <p className="text-sm">Date: {new Date(data.tradeDate).toLocaleDateString()}</p>
            <p className="text-sm">Risk: ₹{data.risk.toFixed(2)}</p>
            <p className="text-sm">Reward: ₹{data.reward.toFixed(2)}</p>
            <p className="text-sm">R:R Ratio: {data.ratio.toFixed(2)}:1</p>
            <p className="text-sm">
              P&L: <span className={data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const avgRiskReward = riskRewardData.length > 0 
    ? riskRewardData.reduce((sum, trade) => sum + trade.ratio, 0) / riskRewardData.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk vs Reward Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {riskRewardData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No risk-reward data available</p>
                <p className="text-sm">Add trades with stop loss to see risk analysis</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={riskRewardData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="risk" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  label={{ value: 'Risk (₹)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="reward"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  label={{ value: 'Reward (₹)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  stroke="#e5e7eb" 
                  strokeDasharray="5 5"
                  segment={[{ x: 0, y: 0 }, { x: 1000, y: 1000 }]}
                />
                <Scatter 
                  dataKey="reward" 
                  fill={(entry: any) => entry.isWin ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Risk-Reward Summary */}
        {riskRewardData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg R:R Ratio</p>
              <p className="text-lg font-bold text-blue-600">
                {avgRiskReward.toFixed(2)}:1
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Best R:R</p>
              <p className="text-lg font-bold text-green-600">
                {Math.max(...riskRewardData.map(trade => trade.ratio)).toFixed(2)}:1
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Trades with SL</p>
              <p className="text-lg font-bold text-purple-600">
                {riskRewardData.length}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Good R:R ({'>'}1:1)</p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Good R:R ({'>'}1:1)</p>
              <p className="text-lg font-bold text-orange-600">
                {riskRewardData.filter(trade => trade.ratio > 1).length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}