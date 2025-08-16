/**
 * IntraDay Trading Dashboard - JSONP PRODUCTION Google Apps Script
 * SUPPORTS BOTH JSONP AND POST REQUESTS FOR NETLIFY STATIC DEPLOYMENT
 * 
 * Version: 7.0.0 - JSONP Production
 * Last Updated: 2025-07-27
 */

// Configuration - Update SPREADSHEET_ID with your actual Google Sheets ID
const CONFIG = {
  SPREADSHEET_ID: '1lRghEk9q9dXr4elu2387f7UOWdwaojr1g2aYx2TCRJs', // Your actual Sheet ID
  SHEETS: {
    TRADES: 'Trades',
    STRATEGIES: 'Strategies', 
    PSYCHOLOGY: 'Psychology'
  }
};

// CORRECT Headers that match UI exactly
const TRADES_HEADERS = [
  'ID', 'Trade Date', 'Stock Name', 'Trade Type', 'Quantity', 'Entry Price', 'Exit Price', 
  'Stop Loss', 'Target Price', 'P&L', 'Setup Followed', 'Strategy', 'Emotion', 
  'Trade Notes', 'Psychology Reflections', 'Screenshot Link', 'Created At'
];

const STRATEGIES_HEADERS = [
  'ID', 'Name', 'Description', 'Screenshot URL', 'Tags', 'Status', 'Created At'
];

const PSYCHOLOGY_HEADERS = [
  'ID', 'Entry Date', 'Daily P&L', 'Best Trade ID', 'Worst Trade ID',
  'Mental Reflections', 'Improvement Areas', 'Created At'
];

/**
 * INDIAN TIMEZONE FUNCTIONS
 */
function getISTDateTime() {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function formatIndianDate(date) {
  if (!date) return getISTDateTime().split(',')[0];
  const istDate = new Date(typeof date === 'string' ? date : date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

/**
 * FAST CACHING - 30 second cache for speed
 */
const CACHE = {
  data: new Map(),
  timestamps: new Map(),
  CACHE_DURATION: 30000 // 30 seconds
};

function getCachedSheet(sheetName) {
  const cached = CACHE.data.get(sheetName);
  const timestamp = CACHE.timestamps.get(sheetName);
  
  if (cached && timestamp && (Date.now() - timestamp) < CACHE.CACHE_DURATION) {
    return cached;
  }
  
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  CACHE.data.set(sheetName, sheet);
  CACHE.timestamps.set(sheetName, Date.now());
  
  return sheet;
}

/**
 * MAIN ENTRY POINTS - SUPPORTS BOTH GET (JSONP) AND POST
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    const callback = e.parameter.callback;
    
    let result;
    
    switch (action) {
      case 'test':
        result = { success: true, message: 'JSONP Connection successful!', timestamp: getISTDateTime() };
        break;
      case 'getTrades':
        result = handleGetTrades();
        break;
      case 'getStrategies':
        result = handleGetStrategies();
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychologyEntries();
        break;
      case 'addTrade':
        result = handleAddTrade({ data });
        break;
      case 'addStrategy':
        result = handleAddStrategy({ data });
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychologyEntry({ data });
        break;
      case 'updateTrade':
        result = handleUpdateTrade({ data });
        break;
      case 'deleteTrade':
        result = handleDeleteTrade({ data });
        break;
      case 'updateStrategy':
        result = handleUpdateStrategy({ data });
        break;
      case 'deleteStrategy':
        result = handleDeleteStrategy({ data });
        break;
      case 'updatePsychologyEntry':
        result = handleUpdatePsychologyEntry({ data });
        break;
      case 'deletePsychologyEntry':
        result = handleDeletePsychologyEntry({ data });
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    // Handle JSONP callback
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(result) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Regular JSON response
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errorResult = { success: false, error: error.message, timestamp: getISTDateTime() };
    
    if (e.parameter.callback) {
      const jsonpError = e.parameter.callback + '(' + JSON.stringify(errorResult) + ');';
      return ContentService
        .createTextOutput(jsonpError)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    
    let result;
    
    switch (action) {
      case 'test':
        result = { success: true, message: 'POST Connection successful!', timestamp: getISTDateTime() };
        break;
      case 'getTrades':
        result = handleGetTrades();
        break;
      case 'getStrategies':
        result = handleGetStrategies();
        break;
      case 'getPsychologyEntries':
        result = handleGetPsychologyEntries();
        break;
      case 'addTrade':
        result = handleAddTrade(requestData);
        break;
      case 'addStrategy':
        result = handleAddStrategy(requestData);
        break;
      case 'addPsychologyEntry':
        result = handleAddPsychologyEntry(requestData);
        break;
      case 'updateTrade':
        result = handleUpdateTrade(requestData);
        break;
      case 'deleteTrade':
        result = handleDeleteTrade(requestData);
        break;
      case 'updateStrategy':
        result = handleUpdateStrategy(requestData);
        break;
      case 'deleteStrategy':
        result = handleDeleteStrategy(requestData);
        break;
      case 'updatePsychologyEntry':
        result = handleUpdatePsychologyEntry(requestData);
        break;
      case 'deletePsychologyEntry':
        result = handleDeletePsychologyEntry(requestData);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: getISTDateTime()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * DATA HANDLERS
 */
function handleGetTrades() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const trades = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      tradeDate: row[1] ? new Date(row[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      stockName: row[2] || '',
      tradeType: row[3] || 'long',
      quantity: parseInt(row[4]) || 0,
      entryPrice: row[5] || '0',
      exitPrice: row[6] || '',
      stopLoss: row[7] || '',
      targetPrice: row[8] || '',
      profitLoss: row[9] || '0',
      setupFollowed: row[10] === 'Yes' || row[10] === true || row[10] === 'TRUE',
      whichSetup: row[11] || null,
      emotion: row[12] || null,
      notes: row[13] || null,
      psychologyReflections: row[14] || null,
      screenshotLink: row[15] || '',
      createdAt: row[16] || getISTDateTime()
    }));
    
    return { success: true, data: trades };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleGetStrategies() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const strategies = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      name: row[1] || '',
      description: row[2] || '',
      screenshotUrl: row[3] || '',
      tags: row[4] ? row[4].split(',').map(tag => tag.trim()) : null,
      status: row[5] || 'active',
      createdAt: row[6] || getISTDateTime()
    }));
    
    return { success: true, data: strategies };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleGetPsychologyEntries() {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [] };
    }
    
    const entries = data.slice(1).map(row => ({
      id: row[0] || Date.now() + Math.random(),
      entryDate: row[1] || '',
      monthlyPnL: row[2] || '0',
      bestTradeId: row[3] ? parseInt(row[3]) : null,
      worstTradeId: row[4] ? parseInt(row[4]) : null,
      mentalReflections: row[5] || '',
      improvementAreas: row[6] || '',
      createdAt: row[7] || getISTDateTime()
    }));
    
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddTrade(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setValues([TRADES_HEADERS]);
      sheet.getRange(1, 1, 1, TRADES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const trade = requestData.data || requestData;
    
    // Check for duplicates
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[2] === trade.stockName && 
          row[1] && new Date(row[1]).toISOString().split('T')[0] === trade.tradeDate &&
          row[4] === trade.entryPrice) {
        return { success: true, message: 'Duplicate prevented', data: trade };
      }
    }
    
    // Create row
    const row = [
      trade.id || Date.now(),
      trade.tradeDate || new Date().toISOString().split('T')[0],
      trade.stockName || '',
      trade.tradeType || 'long',
      trade.quantity || 0,
      trade.entryPrice || '0',
      trade.exitPrice || '',
      trade.stopLoss || '',
      trade.targetPrice || '',
      trade.profitLoss || '0',
      trade.setupFollowed ? 'Yes' : 'No',
      trade.whichSetup || '',
      trade.emotion || '',
      trade.notes || '',
      trade.psychologyReflections || '',
      trade.screenshotLink || '',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: trade, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddStrategy(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setValues([STRATEGIES_HEADERS]);
      sheet.getRange(1, 1, 1, STRATEGIES_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const strategy = requestData.data || requestData;
    
    // Check for duplicates
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[1] === strategy.name) {
        return { success: true, message: 'Duplicate prevented', data: strategy };
      }
    }
    
    const row = [
      strategy.id || Date.now(),
      strategy.name || '',
      strategy.description || '',
      strategy.screenshotUrl || '',
      Array.isArray(strategy.tags) ? strategy.tags.join(',') : (strategy.tags || ''),
      strategy.status || 'active',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: strategy, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleAddPsychologyEntry(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([PSYCHOLOGY_HEADERS]);
      sheet.getRange(1, 1, 1, PSYCHOLOGY_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const entry = requestData.data || requestData;
    
    // Check for duplicates
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      const row = existingData[i];
      if (row[1] === entry.entryDate) {
        return { success: true, message: 'Duplicate prevented', data: entry };
      }
    }
    
    const row = [
      entry.id || Date.now(),
      entry.entryDate || '',
      entry.monthlyPnL || '0',
      entry.bestTradeId || '',
      entry.worstTradeId || '',
      entry.mentalReflections || '',
      entry.improvementAreas || '',
      getISTDateTime()
    ];
    
    sheet.appendRow(row);
    
    return { success: true, data: entry, timestamp: getISTDateTime() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * UPDATE AND DELETE OPERATIONS
 */
function handleUpdateTrade(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    const trade = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the trade by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == trade.id) {
        // Update the row
        const row = [
          trade.id,
          formatIndianDate(trade.tradeDate || data[i][1]),
          trade.stockName || data[i][2],
          trade.tradeType || data[i][3],
          trade.quantity || data[i][4],
          trade.entryPrice || data[i][5],
          trade.exitPrice || data[i][6],
          trade.stopLoss || data[i][7],
          trade.targetPrice || data[i][8],
          trade.profitLoss || data[i][9],
          trade.setupFollowed !== undefined ? (trade.setupFollowed ? 'Yes' : 'No') : data[i][10],
          trade.strategy || data[i][11],
          trade.emotion || data[i][12],
          trade.tradeNotes || data[i][13],
          trade.psychologyReflections || data[i][14],
          trade.screenshotUrl || data[i][15],
          data[i][16] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, TRADES_HEADERS.length).setValues([row]);
        return { success: true, data: trade, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Trade not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteTrade(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.TRADES);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the trade by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Trade deleted successfully' };
      }
    }
    
    return { success: false, error: 'Trade not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdateStrategy(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    const strategy = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the strategy by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == strategy.id) {
        const row = [
          strategy.id,
          strategy.name || data[i][1],
          strategy.description || data[i][2],
          strategy.screenshotUrl || data[i][3],
          strategy.tags || data[i][4],
          strategy.status || data[i][5],
          data[i][6] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, STRATEGIES_HEADERS.length).setValues([row]);
        return { success: true, data: strategy, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Strategy not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeleteStrategy(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.STRATEGIES);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the strategy by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Strategy deleted successfully' };
      }
    }
    
    return { success: false, error: 'Strategy not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleUpdatePsychologyEntry(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    const entry = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find the entry by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == entry.id) {
        const row = [
          entry.id,
          entry.entryDate !== undefined ? entry.entryDate : data[i][1],
          entry.monthlyPnL !== undefined ? entry.monthlyPnL : data[i][2],
          entry.bestTradeId !== undefined ? entry.bestTradeId : data[i][3],
          entry.worstTradeId !== undefined ? entry.worstTradeId : data[i][4],
          entry.mentalReflections !== undefined ? entry.mentalReflections : data[i][5],
          entry.improvementAreas !== undefined ? entry.improvementAreas : data[i][6],
          data[i][7] // Keep original created date
        ];
        
        sheet.getRange(i + 1, 1, 1, PSYCHOLOGY_HEADERS.length).setValues([row]);
        return { success: true, data: entry, timestamp: getISTDateTime() };
      }
    }
    
    return { success: false, error: 'Psychology entry not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function handleDeletePsychologyEntry(requestData) {
  try {
    const sheet = getCachedSheet(CONFIG.SHEETS.PSYCHOLOGY);
    const { id } = requestData.data || requestData;
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the entry by ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Psychology entry deleted successfully' };
      }
    }
    
    return { success: false, error: 'Psychology entry not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * TEST FUNCTION
 */
function testConfiguration() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    console.log('✅ Spreadsheet connection successful');
    console.log('✅ Configuration is correct');
    console.log('✅ Ready for deployment');
    return true;
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    return false;
  }
}