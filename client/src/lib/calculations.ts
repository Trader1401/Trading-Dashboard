import { Trade } from "@shared/schema";

// Helper function to check if a strategy is active
export function isActiveStrategy(strategies: any[], strategyName: string | null): boolean {
  if (!strategyName) return false;
  const strategy = strategies.find(s => s.name === strategyName);
  return strategy?.status === "active";
}

// Filter trades to only include those with active strategies OR no strategy assigned
export function getActiveStrategyTrades(trades: Trade[], strategies: any[]): Trade[] {
  return trades.filter(trade => {
    // If no strategy assigned, include in calculations (unassigned trades)
    if (!trade.whichSetup) return true;
    // Only include if strategy is active (exclude testing/deprecated)
    return isActiveStrategy(strategies, trade.whichSetup);
  });
}

// Filter trades to include both active AND testing strategies for dashboard display
export function getDashboardStrategyTrades(trades: Trade[], strategies: any[]): Trade[] {
  return trades.filter(trade => {
    // If no strategy assigned, include in calculations (unassigned trades)
    if (!trade.whichSetup) return true;
    // Include if strategy is active OR testing (exclude only deprecated)
    const strategy = strategies.find(s => s.name === trade.whichSetup);
    return strategy?.status === "active" || strategy?.status === "testing";
  });
}

// Get all trades for a specific strategy (regardless of status)
export function getTradesByStrategy(trades: Trade[], strategyName: string): Trade[] {
  return trades.filter(trade => trade.whichSetup === strategyName);
}
export function calculatePnL(entryPrice: number, exitPrice: number, quantity: number, tradeType: 'long' | 'short' = 'long'): number {
  // Handle string inputs and convert to numbers
  const entry = typeof entryPrice === 'string' ? parseFloat(entryPrice) : entryPrice;
  const exit = typeof exitPrice === 'string' ? parseFloat(exitPrice) : exitPrice;
  const qty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  // Return 0 if any values are invalid
  if (isNaN(entry) || isNaN(exit) || isNaN(qty) || entry <= 0 || qty <= 0) {
    return 0;
  }
  
  // Calculate P&L based on trade type
  if (tradeType === 'short') {
    // For short trades: profit when exit price is lower than entry price
    return (entry - exit) * qty;
  } else {
    // For long trades: profit when exit price is higher than entry price
    return (exit - entry) * qty;
  }
}

export function calculatePercentage(entryPrice: number, exitPrice: number, tradeType: 'long' | 'short' = 'long'): number {
  if (tradeType === 'short') {
    return ((entryPrice - exitPrice) / entryPrice) * 100;
  } else {
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  }
}

export function calculateWinRate(trades: Trade[], strategies?: any[]): number {
  if (trades.length === 0) return 0;
  
  // Filter to only active strategy trades if strategies provided
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  if (activeTrades.length === 0) return 0;
  
  const winningTrades = activeTrades.filter(trade => {
    // Get P&L from field or calculate it
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl > 0;
  });
  
  return (winningTrades.length / activeTrades.length) * 100;
}

export function calculateTotalPnL(trades: Trade[], strategies?: any[]): number {
  // Filter to only active strategy trades if strategies provided
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  
  return activeTrades.reduce((total, trade) => {
    // First try to use profitLoss field if it exists and is valid
    if (trade.profitLoss) {
      const pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
      if (!isNaN(pnl)) {
        return total + pnl;
      }
    }
    
    // If profitLoss is missing or invalid, calculate from entry/exit prices
    if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      const calculatedPnL = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()), 
        parseFloat(trade.quantity.toString())
      );
      return total + calculatedPnL;
    }
    
    return total;
  }, 0);
}

export function calculateAverageWin(trades: Trade[], strategies?: any[]): number {
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  
  const winningTrades = activeTrades.filter(trade => 
    trade.profitLoss && parseFloat(trade.profitLoss.toString()) > 0
  );
  
  if (winningTrades.length === 0) return 0;
  
  const totalWins = winningTrades.reduce((total, trade) => 
    total + parseFloat(trade.profitLoss?.toString() || "0"), 0
  );
  
  return totalWins / winningTrades.length;
}

export function calculateAverageLoss(trades: Trade[], strategies?: any[]): number {
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  
  const losingTrades = activeTrades.filter(trade => 
    trade.profitLoss && parseFloat(trade.profitLoss.toString()) < 0
  );
  
  if (losingTrades.length === 0) return 0;
  
  const totalLosses = losingTrades.reduce((total, trade) => 
    total + parseFloat(trade.profitLoss?.toString() || "0"), 0
  );
  
  return totalLosses / losingTrades.length;
}

export function calculateMaxDrawdown(trades: Trade[], strategies?: any[]): number {
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;
  
  activeTrades.forEach(trade => {
    runningPnL += parseFloat(trade.profitLoss?.toString() || "0");
    
    if (runningPnL > peak) {
      peak = runningPnL;
    }
    
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  return maxDrawdown;
}



export function formatCurrency(amount: number | string): string {
  // Handle string inputs
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

export function getTradesByDateRange(trades: Trade[], startDate: string, endDate: string): Trade[] {
  return trades.filter(trade => {
    const tradeDate = new Date(trade.tradeDate + 'T00:00:00');
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    return tradeDate >= start && tradeDate <= end;
  });
}

export function groupTradesByStrategy(trades: Trade[]): Record<string, Trade[]> {
  return trades.reduce((groups, trade) => {
    const strategy = trade.whichSetup || "No Strategy";
    if (!groups[strategy]) {
      groups[strategy] = [];
    }
    groups[strategy].push(trade);
    return groups;
  }, {} as Record<string, Trade[]>);
}

export function calculateProfitFactor(trades: Trade[], strategies?: any[]): number {
  const activeTrades = strategies ? getActiveStrategyTrades(trades, strategies) : trades;
  
  const winningTrades = activeTrades.filter(trade => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl > 0;
  });
  
  const losingTrades = activeTrades.filter(trade => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return pnl < 0;
  });
  
  const totalProfits = winningTrades.reduce((total, trade) => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return total + Math.abs(pnl);
  }, 0);
  
  const totalLosses = losingTrades.reduce((total, trade) => {
    let pnl = 0;
    if (trade.profitLoss) {
      pnl = typeof trade.profitLoss === 'string' ? parseFloat(trade.profitLoss) : trade.profitLoss;
    } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
      pnl = calculatePnL(
        parseFloat(trade.entryPrice.toString()),
        parseFloat(trade.exitPrice.toString()),
        parseFloat(trade.quantity.toString())
      );
    }
    return total + Math.abs(pnl);
  }, 0);
  
  return totalLosses === 0 ? (totalProfits > 0 ? totalProfits : 0) : totalProfits / totalLosses;
}
