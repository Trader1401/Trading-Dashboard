import { useState } from "react";
import { Settings, Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculateTotalPnL, formatCurrency, groupTradesByStrategy } from "@/lib/calculations";

export default function QuickStats() {
  const { trades, isLoading: tradesLoading } = useTrades();
  const { strategies, isLoading: strategiesLoading } = useStrategies();
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [capital, setCapital] = useState(() => {
    const saved = localStorage.getItem("tradingCapital");
    return saved ? parseFloat(saved) : 100000;
  });
  const [monthlyTarget, setMonthlyTarget] = useState(() => {
    const saved = localStorage.getItem("monthlyTarget");
    return saved ? parseFloat(saved) : 10000;
  });

  if (tradesLoading || strategiesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgTradeSize = trades.length > 0
    ? trades.reduce((sum, trade) => {
        const entryPrice = parseFloat(trade.entryPrice?.toString() || "0");
        return sum + (entryPrice * trade.quantity);
      }, 0) / trades.length
    : 0;

  const strategyPerformance = groupTradesByStrategy(trades);
  const bestStrategy = Object.entries(strategyPerformance)
    .map(([strategy, strategyTrades]) => ({
      strategy,
      pnl: calculateTotalPnL(strategyTrades, strategies),
    }))
    .sort((a, b) => b.pnl - a.pnl)[0];

  const worstStrategy = Object.entries(strategyPerformance)
    .map(([strategy, strategyTrades]) => ({
      strategy,
      pnl: calculateTotalPnL(strategyTrades, strategies),
    }))
    .sort((a, b) => a.pnl - b.pnl)[0];

  const activeStrategies = strategies.filter(s => s.status === "active").length;
  const testingStrategies = strategies.filter(s => s.status === "testing").length;
  
  const currentMonth = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const tradingDaysThisMonth = new Set(
    trades
      .filter(trade => {
        const tradeDate = new Date(trade.tradeDate);
        return tradeDate.getMonth() === currentMonth.getMonth() && 
               tradeDate.getFullYear() === currentMonth.getFullYear();
      })
      .map(trade => trade.tradeDate)
  ).size;

  const targetProgress = Math.min((tradingDaysThisMonth / 22) * 100, 100); // Assuming 22 trading days per month
  
  // Calculate monthly P&L for target tracking
  const currentMonthTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDate);
    return tradeDate.getMonth() === currentMonth.getMonth() && 
           tradeDate.getFullYear() === currentMonth.getFullYear();
  });
  const monthlyPnL = calculateTotalPnL(currentMonthTrades, strategies);
  const targetProgress2 = monthlyTarget > 0 ? Math.min((monthlyPnL / monthlyTarget) * 100, 100) : 0;
  
  const saveCapitalSettings = () => {
    localStorage.setItem("tradingCapital", capital.toString());
    localStorage.setItem("monthlyTarget", monthlyTarget.toString());
    setIsSettingsOpen(false);
    toast({
      title: "Settings Saved",
      description: "Capital and monthly target updated successfully",
    });
  };

  const stats = [
    { label: "Avg Trade Size", value: formatCurrency(avgTradeSize) },
    { label: "Trading Capital", value: formatCurrency(capital) },
    { label: "Best Strategy", value: bestStrategy?.strategy || "None", color: "text-profit" },
    { label: "Worst Strategy", value: worstStrategy?.strategy || "None", color: "text-loss" },
    { label: "Active Strategies", value: activeStrategies.toString() },
    { label: "Testing Strategies", value: testingStrategies.toString(), color: "text-yellow-600" },
    { label: "Trading Days", value: `${tradingDaysThisMonth}/22` },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quick Stats</CardTitle>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Capital & Target Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="capital">Trading Capital (₹)</Label>
                    <Input
                      id="capital"
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyTarget">Monthly Target (₹)</Label>
                    <Input
                      id="monthlyTarget"
                      type="number"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(parseFloat(e.target.value) || 0)}
                      placeholder="10000"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveCapitalSettings}>
                      Save Settings
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-white-600">{stat.label}</span>
              <span className={`font-semibold ${stat.color || 'text-white-900'}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress Bars */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white-600">Trading Days Progress</span>
            <span className="text-blue-900">{Math.round(targetProgress)}%</span>
          </div>
          <Progress value={targetProgress} className="h-2" />
          
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white-600">Monthly Target ({formatCurrency(monthlyTarget)})</span>
            <span className={`font-medium ${monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyPnL)} ({Math.round(targetProgress2)}%)
            </span>
          </div>
          <Progress 
            value={Math.abs(targetProgress2)} 
            className={`h-2 ${monthlyPnL >= 0 ? '' : '[&>div]:bg-red-500'}`} 
          />
        </div>
      </CardContent>
      </Card>
    </>
  );
}
