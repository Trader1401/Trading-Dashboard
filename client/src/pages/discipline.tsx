import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, TrendingUp, TrendingDown, Target, Award, AlertTriangle, Clock } from "lucide-react";
import ChecklistAdherenceChart from "@/components/charts/checklist-adherence-chart";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { useChecklist } from "@/hooks/use-checklist";
import {
  calculateTotalPnL,
  calculateWinRate,
  formatCurrency,
  formatPercentage,
  getActiveStrategyTrades,
} from "@/lib/calculations";

export default function Discipline() {
  const { trades, isLoading } = useTrades();
  const { strategies } = useStrategies();
  const { checklistItems, parseTradeNotes, calculateAdherenceScore, getAdherenceLevel } = useChecklist();
  const [timeRange, setTimeRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Filter trades based on selected time range
  const filteredTrades = useMemo(() => {
    if (timeRange === "all") return trades;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return trades;
        return trades.filter(trade => {
          const tradeDate = new Date(trade.tradeDate);
          return tradeDate >= new Date(customStartDate) && tradeDate <= new Date(customEndDate);
        });
      default:
        return trades;
    }
    
    return trades.filter(trade => new Date(trade.tradeDate) >= startDate);
  }, [trades, timeRange, customStartDate, customEndDate]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  // Parse checklist data from trades
  const tradesWithChecklist = filteredTrades.map(trade => {
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

  // Calculate discipline metrics
  const tradesWithChecklistData = tradesWithChecklist.filter(trade => 
    Object.keys(trade.checklist).length > 0
  );

  const highAdherenceTradesData = tradesWithChecklistData.filter(trade => trade.adherenceScore >= 75);
  const lowAdherenceTradesData = tradesWithChecklistData.filter(trade => trade.adherenceScore < 50);

  const highAdherencePnL = calculateTotalPnL(highAdherenceTradesData, strategies);
  const lowAdherencePnL = calculateTotalPnL(lowAdherenceTradesData, strategies);
  const highAdherenceWinRate = calculateWinRate(highAdherenceTradesData, strategies);
  const lowAdherenceWinRate = calculateWinRate(lowAdherenceTradesData, strategies);

  const avgAdherenceScore = tradesWithChecklistData.length > 0
    ? tradesWithChecklistData.reduce((sum, trade) => sum + trade.adherenceScore, 0) / tradesWithChecklistData.length
    : 0;

  const disciplineMetrics = [
    {
      title: "Average Adherence",
      value: `${avgAdherenceScore.toFixed(1)}%`,
      color: avgAdherenceScore >= 75 ? "text-green-600" : avgAdherenceScore >= 50 ? "text-yellow-600" : "text-red-600",
      icon: CheckSquare,
      change: getAdherenceLevel(avgAdherenceScore),
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "High Adherence P&L",
      value: formatCurrency(highAdherencePnL),
      color: highAdherencePnL >= 0 ? "text-green-600" : "text-red-600",
      icon: TrendingUp,
      change: `${highAdherenceTradesData.length} trades (≥75%)`,
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Low Adherence P&L",
      value: formatCurrency(lowAdherencePnL),
      color: lowAdherencePnL >= 0 ? "text-green-600" : "text-red-600",
      icon: TrendingDown,
      change: `${lowAdherenceTradesData.length} trades (<50%)`,
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Discipline Impact",
      value: formatCurrency(highAdherencePnL - lowAdherencePnL),
      color: (highAdherencePnL - lowAdherencePnL) >= 0 ? "text-green-600" : "text-red-600",
      icon: Award,
      change: `${(highAdherenceWinRate - lowAdherenceWinRate).toFixed(1)}% win rate diff`,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  if (checklistItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trading Discipline</h1>
            <p className="text-gray-600 dark:text-gray-400">Analyze your checklist adherence and trading discipline</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <CheckSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <div className="text-gray-500">
              <p className="text-xl mb-2">No Trading Checklist Configured</p>
              <p className="text-sm mb-4">Create your trading discipline checklist to start tracking adherence</p>
              <Badge variant="outline" className="mb-4">
                Go to Settings → Trading Checklist
              </Badge>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm">
                <p><strong>What you'll get:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Track pre-trade and post-trade discipline</li>
                  <li>Correlate adherence with performance</li>
                  <li>Identify which checklist items impact profitability most</li>
                  <li>Monitor discipline trends over time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trading Discipline</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyze your checklist adherence and trading discipline</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select defaultValue="all" onValueChange={(value) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                placeholder="Start Date"
                className="w-36 text-gray-900 dark:text-gray-100 cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:filter-invert"
                max={new Date().toISOString().split('T')[0]}
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                placeholder="End Date"
                className="w-36 text-gray-900 dark:text-gray-100 cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:filter-invert"
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Discipline Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
      >
        {disciplineMetrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                    <metric.icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {metric.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Checklist Analysis Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ChecklistAdherenceChart trades={filteredTrades} strategies={strategies} />
      </motion.div>

      {/* Discipline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Adherence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'].map(level => {
                const levelTrades = tradesWithChecklistData.filter(trade => trade.adherenceLevel === level);
                const percentage = tradesWithChecklistData.length > 0 
                  ? (levelTrades.length / tradesWithChecklistData.length) * 100 
                  : 0;
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{level}</span>
                      <span>{levelTrades.length} trades ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Impact Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklistItems
                .map(item => {
                  const followedTrades = tradesWithChecklistData.filter(trade => trade.checklist[item.id] === true);
                  const notFollowedTrades = tradesWithChecklistData.filter(trade => trade.checklist[item.id] === false);
                  
                  const followedPnL = followedTrades.length > 0 ? calculateTotalPnL(followedTrades, strategies) / followedTrades.length : 0;
                  const notFollowedPnL = notFollowedTrades.length > 0 ? calculateTotalPnL(notFollowedTrades, strategies) / notFollowedTrades.length : 0;
                  
                  return {
                    ...item,
                    impact: followedPnL - notFollowedPnL,
                    followedTrades: followedTrades.length,
                    notFollowedTrades: notFollowedTrades.length
                  };
                })
                .filter(item => item.followedTrades > 0 || item.notFollowedTrades > 0)
                .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant={item.category === 'pre-trade' ? 'default' : 'secondary'} className="text-xs">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {item.followedTrades + item.notFollowedTrades} trades
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${item.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.impact >= 0 ? '+' : ''}{formatCurrency(item.impact)}
                      </p>
                      <p className="text-xs text-gray-500">avg impact</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}