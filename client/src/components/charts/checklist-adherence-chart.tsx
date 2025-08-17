import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { formatCurrency, calculateTotalPnL, getActiveStrategyTrades } from "@/lib/calculations";
import { useChecklist } from "@/hooks/use-checklist";
import { Trade } from "@shared/schema";

interface ChecklistAdherenceChartProps {
  trades: Trade[];
  strategies?: any[];
}

export default function ChecklistAdherenceChart({ trades, strategies = [] }: ChecklistAdherenceChartProps) {
  const { parseTradeNotes, calculateAdherenceScore, getAdherenceLevel, checklistItems } = useChecklist();
  
  // Only include active strategy trades in analytics
  const activeTrades = getActiveStrategyTrades(trades, strategies);
  
  // Parse checklist data from trades
  const tradesWithChecklist = activeTrades.map(trade => {
    const parsed = parseTradeNotes(trade.notes);
    const adherenceScore = parsed.checklist ? calculateAdherenceScore(parsed.checklist) : 0;
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    
    return {
      ...trade,
      checklist: parsed.checklist || {},
      userNotes: parsed.userNotes || '',
      adherenceScore,
      adherenceLevel: getAdherenceLevel(adherenceScore),
      pnl,
      isWin: pnl > 0
    };
  });

  // Group trades by adherence level
  const adherenceGroups = tradesWithChecklist.reduce((acc, trade) => {
    const level = trade.adherenceLevel;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(trade);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate performance by adherence level
  const adherenceData = Object.entries(adherenceGroups).map(([level, levelTrades]) => {
    const totalPnL = calculateTotalPnL(levelTrades, strategies);
    const winRate = levelTrades.length > 0 ? (levelTrades.filter(t => t.isWin).length / levelTrades.length) * 100 : 0;
    const avgPnL = levelTrades.length > 0 ? totalPnL / levelTrades.length : 0;
    
    return {
      level,
      trades: levelTrades.length,
      totalPnL,
      winRate,
      avgPnL,
      color: getAdherenceColor(level)
    };
  }).sort((a, b) => getAdherenceSortOrder(a.level) - getAdherenceSortOrder(b.level));

  // Individual checklist item analysis
  const itemAnalysis = checklistItems.map(item => {
    const followedTrades = tradesWithChecklist.filter(trade => trade.checklist[item.id] === true);
    const notFollowedTrades = tradesWithChecklist.filter(trade => trade.checklist[item.id] === false);
    
    const followedPnL = followedTrades.length > 0 ? calculateTotalPnL(followedTrades, strategies) / followedTrades.length : 0;
    const notFollowedPnL = notFollowedTrades.length > 0 ? calculateTotalPnL(notFollowedTrades, strategies) / notFollowedTrades.length : 0;
    
    const followedWinRate = followedTrades.length > 0 ? (followedTrades.filter(t => t.isWin).length / followedTrades.length) * 100 : 0;
    const notFollowedWinRate = notFollowedTrades.length > 0 ? (notFollowedTrades.filter(t => t.isWin).length / notFollowedTrades.length) * 100 : 0;
    
    return {
      item: item.name,
      category: item.category,
      followedTrades: followedTrades.length,
      notFollowedTrades: notFollowedTrades.length,
      followedPnL,
      notFollowedPnL,
      followedWinRate,
      notFollowedWinRate,
      impact: followedPnL - notFollowedPnL,
      winRateImpact: followedWinRate - notFollowedWinRate
    };
  }).filter(item => item.followedTrades > 0 || item.notFollowedTrades > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2 text-black">{label}</p>
          <div className="space-y-1">
            <p className="text-black">Trades: {data.trades}</p>
            <p className="text-black">
              Total P&L: <span className={data.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.totalPnL)}
              </span>
            </p>
            <p className="text-black">
              Avg P&L: <span className={data.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(data.avgPnL)}
              </span>
            </p>
            <p className="text-black">Win Rate: {data.winRate.toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overall Adherence Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Adherence vs Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {adherenceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p>No checklist data available</p>
                  <p className="text-sm">Add checklist items to trades to see adherence analysis</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={adherenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="level" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="pnl"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="winRate"
                    orientation="right"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    yAxisId="pnl"
                    dataKey="totalPnL"
                    fill="hsl(221, 83%, 53%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="winRate"
                    type="monotone"
                    dataKey="winRate"
                    stroke="hsl(142, 76%, 36%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Item Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Checklist Item Impact</CardTitle>
        </CardHeader>
        <CardContent>
          {itemAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No item-specific data available</p>
              <p className="text-sm">Complete checklist items in your trades to see individual impact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itemAnalysis.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant={item.category === 'pre-trade' ? 'default' : 'secondary'}>
                        {item.category}
                      </Badge>
                      <h4 className="font-medium">{item.item}</h4>
                    </div>
                    <Badge variant={item.impact >= 0 ? 'default' : 'destructive'}>
                      Impact: {formatCurrency(item.impact)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="font-medium text-green-600 dark:text-green-400">When Followed</p>
                      <div className="space-y-1">
                        <p>Trades: {item.followedTrades}</p>
                        <p>Avg P&L: {formatCurrency(item.followedPnL)}</p>
                        <p>Win Rate: {item.followedWinRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium text-red-600 dark:text-red-400">When Not Followed</p>
                      <div className="space-y-1">
                        <p>Trades: {item.notFollowedTrades}</p>
                        <p>Avg P&L: {formatCurrency(item.notFollowedPnL)}</p>
                        <p>Win Rate: {item.notFollowedWinRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>P&L Impact:</span>
                      <span className={item.impact >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {item.impact >= 0 ? '+' : ''}{formatCurrency(item.impact)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Win Rate Impact:</span>
                      <span className={item.winRateImpact >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {item.winRateImpact >= 0 ? '+' : ''}{item.winRateImpact.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getAdherenceColor(level: string): string {
  switch (level) {
    case 'Excellent': return 'hsl(142, 76%, 36%)';
    case 'Good': return 'hsl(45, 93%, 47%)';
    case 'Fair': return 'hsl(221, 83%, 53%)';
    case 'Poor': return 'hsl(0, 84%, 60%)';
    case 'Very Poor': return 'hsl(0, 70%, 50%)';
    default: return 'hsl(210, 40%, 60%)';
  }
}

function getAdherenceSortOrder(level: string): number {
  switch (level) {
    case 'Excellent': return 1;
    case 'Good': return 2;
    case 'Fair': return 3;
    case 'Poor': return 4;
    case 'Very Poor': return 5;
    default: return 6;
  }
}