import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, getActiveStrategyTrades } from "@/lib/calculations";
import { Trade } from "@shared/schema";

interface TradeFrequencyChartProps {
  trades: Trade[];
  strategies?: any[];
}

export default function TradeFrequencyChart({ trades, strategies = [] }: TradeFrequencyChartProps) {
  // Only include active strategy trades in analytics
  const activeTrades = getActiveStrategyTrades(trades, strategies);
  
  // Group trades by week and calculate frequency
  const weeklyData = activeTrades.reduce((acc, trade) => {
    const date = new Date(trade.tradeDate + 'T00:00:00');
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];
    const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: weekLabel,
        trades: 0,
        totalVolume: 0,
        avgPnL: 0,
        pnlSum: 0,
      };
    }
    
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    const volume = parseFloat(trade.entryPrice?.toString() || "0") * trade.quantity;
    
    acc[weekKey].trades += 1;
    acc[weekKey].totalVolume += volume;
    acc[weekKey].pnlSum += pnl;
    acc[weekKey].avgPnL = acc[weekKey].pnlSum / acc[weekKey].trades;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(weeklyData)
    .sort((a: any, b: any) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-12); // Last 12 weeks

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">Week of {label}</p>
          <div className="space-y-1">
            <p className="text-sm">Trades: {data.trades}</p>
            <p className="text-sm">Volume: {formatCurrency(data.totalVolume)}</p>
            <p className="text-sm">
              Avg P&L: <span className={data.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.avgPnL)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Frequency (Weekly)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No trading frequency data available</p>
                <p className="text-sm">Add trades to see your weekly trading patterns</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="week" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${value} trades`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="trades"
                  stroke="hsl(221, 83%, 53%)"
                  fill="hsl(221, 83%, 53%)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Trading Frequency Summary */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Trades/Week</p>
              <p className="text-lg font-bold text-blue-600">
                {(chartData.reduce((sum: number, week: any) => sum + week.trades, 0) / chartData.length).toFixed(1)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Most Active Week</p>
              <p className="text-lg font-bold text-green-600">
                {Math.max(...chartData.map((week: any) => week.trades))}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Volume</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(chartData.reduce((sum: number, week: any) => sum + week.totalVolume, 0))}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Consistency</p>
              <p className="text-lg font-bold text-orange-600">
                {((chartData.filter((week: any) => week.trades > 0).length / chartData.length) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}