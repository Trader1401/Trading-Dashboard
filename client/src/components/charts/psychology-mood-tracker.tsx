import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { formatCurrency, getActiveStrategyTrades } from "@/lib/calculations";
import { Trade } from "@shared/schema";

interface PsychologyMoodTrackerProps {
  trades: Trade[];
  strategies?: any[];
}

const EMOTION_SCORES = {
  "Confident": 5,
  "Excited": 4,
  "Disciplined": 4,
  "Neutral": 3,
  "Anxious": 2,
  "Fearful": 1,
  "Greedy": 1,
};

export default function PsychologyMoodTracker({ trades, strategies = [] }: PsychologyMoodTrackerProps) {
  // Only include active strategy trades in analytics
  const activeTrades = getActiveStrategyTrades(trades, strategies);
  
  // Group trades by date and calculate mood scores
  const dailyMoodData = activeTrades.reduce((acc, trade) => {
    const date = trade.tradeDate;
    const emotion = trade.emotion || "Neutral";
    const emotionScore = EMOTION_SCORES[emotion as keyof typeof EMOTION_SCORES] || 3;
    const pnl = parseFloat(trade.profitLoss?.toString() || "0");
    
    if (!acc[date]) {
      acc[date] = {
        date,
        emotions: [],
        pnls: [],
        trades: 0,
      };
    }
    
    acc[date].emotions.push(emotionScore);
    acc[date].pnls.push(pnl);
    acc[date].trades += 1;
    
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(dailyMoodData)
    .map((day: any) => {
      const avgMood = day.emotions.reduce((sum: number, score: number) => sum + score, 0) / day.emotions.length;
      const totalPnL = day.pnls.reduce((sum: number, pnl: number) => sum + pnl, 0);
      
      return {
        date: new Date(day.date + 'T00:00:00').toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: day.date,
        moodScore: avgMood,
        pnl: totalPnL,
        trades: day.trades,
        moodLabel: getMoodLabel(avgMood),
      };
    })
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    .slice(-30); // Last 30 days

  function getMoodLabel(score: number): string {
    if (score >= 4.5) return "Very Positive";
    if (score >= 3.5) return "Positive";
    if (score >= 2.5) return "Neutral";
    if (score >= 1.5) return "Negative";
    return "Very Negative";
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">Mood: {data.moodLabel} ({data.moodScore.toFixed(1)}/5)</p>
            <p className="text-sm">Trades: {data.trades}</p>
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

  const avgMoodScore = chartData.length > 0 
    ? chartData.reduce((sum, day) => sum + day.moodScore, 0) / chartData.length 
    : 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p>No mood data available</p>
                <p className="text-sm">Add emotions to your trades to track mood patterns</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  domain={[1, 5]}
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => {
                    const labels = ["", "Negative", "Anxious", "Neutral", "Positive", "Confident"];
                    return labels[value] || value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="moodScore"
                  stroke="hsl(280, 65%, 60%)"
                  fill="hsl(280, 65%, 60%)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <ReferenceLine y={3} stroke="#e5e7eb" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Mood Summary */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Mood</p>
              <p className="text-lg font-bold text-purple-600">
                {getMoodLabel(avgMoodScore)}
              </p>
              <p className="text-xs text-gray-500">{avgMoodScore.toFixed(1)}/5</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Best Day</p>
              <p className="text-lg font-bold text-green-600">
                {Math.max(...chartData.map(day => day.moodScore)).toFixed(1)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Positive Days</p>
              <p className="text-lg font-bold text-blue-600">
                {chartData.filter(day => day.moodScore > 3).length}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Mood Consistency</p>
              <p className="text-lg font-bold text-orange-600">
                {((chartData.filter(day => day.moodScore >= 3).length / chartData.length) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}