import { useState, useEffect } from 'react';

export interface ChecklistItem {
  id: string;
  name: string;
  category: 'pre-trade' | 'post-trade';
  description?: string;
}

export interface ChecklistAdherence {
  [itemId: string]: boolean;
}

export interface TradeWithChecklist {
  checklist?: ChecklistAdherence;
  userNotes?: string;
}

const STORAGE_KEY = 'tradingDashboard_checklistItems';

export function useChecklist() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    loadChecklistItems();
  }, []);

  const loadChecklistItems = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        setChecklistItems(items);
      } else {
        // Initialize with default checklist items
        const defaultItems: ChecklistItem[] = [
          {
            id: 'market-trend',
            name: 'Checked overall market trend',
            category: 'pre-trade',
            description: 'Verified market direction before entry'
          },
          {
            id: 'volume-confirmation',
            name: 'Volume confirmation present',
            category: 'pre-trade',
            description: 'Adequate volume to support the move'
          },
          {
            id: 'risk-reward',
            name: 'Risk-reward ratio calculated',
            category: 'pre-trade',
            description: 'Minimum 1:2 risk-reward ratio'
          },
          {
            id: 'stop-loss-set',
            name: 'Stop loss level defined',
            category: 'pre-trade',
            description: 'Clear exit strategy in place'
          },
          {
            id: 'position-size',
            name: 'Position size calculated',
            category: 'pre-trade',
            description: 'Risk per trade within limits'
          },
          {
            id: 'exit-plan',
            name: 'Exit plan executed',
            category: 'post-trade',
            description: 'Followed predetermined exit strategy'
          },
          {
            id: 'emotion-control',
            name: 'Emotions controlled',
            category: 'post-trade',
            description: 'Did not let emotions drive decisions'
          },
          {
            id: 'lesson-learned',
            name: 'Key lesson identified',
            category: 'post-trade',
            description: 'Identified learning from this trade'
          }
        ];
        setChecklistItems(defaultItems);
        saveChecklistItems(defaultItems);
      }
    } catch (error) {
      console.error('Failed to load checklist items:', error);
      setChecklistItems([]);
    }
  };

  const saveChecklistItems = (items: ChecklistItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setChecklistItems(items);
    } catch (error) {
      console.error('Failed to save checklist items:', error);
    }
  };

  const addChecklistItem = (item: Omit<ChecklistItem, 'id'>) => {
    const newItem: ChecklistItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const updatedItems = [...checklistItems, newItem];
    saveChecklistItems(updatedItems);
  };

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    const updatedItems = checklistItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveChecklistItems(updatedItems);
  };

  const deleteChecklistItem = (id: string) => {
    const updatedItems = checklistItems.filter(item => item.id !== id);
    saveChecklistItems(updatedItems);
  };

  const parseTradeNotes = (notes: string | null): TradeWithChecklist => {
    if (!notes) return { userNotes: '' };
    
    try {
      const parsed = JSON.parse(notes);
      if (parsed && typeof parsed === 'object' && 'checklist' in parsed) {
        return {
          checklist: parsed.checklist || {},
          userNotes: parsed.userNotes || ''
        };
      }
    } catch (error) {
      // If parsing fails, treat as plain notes
    }
    
    return { userNotes: notes };
  };

  const serializeTradeNotes = (checklist: ChecklistAdherence, userNotes: string): string => {
    const data = {
      checklist,
      userNotes: userNotes.trim()
    };
    return JSON.stringify(data);
  };

  const calculateAdherenceScore = (checklist: ChecklistAdherence): number => {
    const items = Object.values(checklist);
    if (items.length === 0) return 0;
    const followedItems = items.filter(Boolean).length;
    return (followedItems / items.length) * 100;
  };

  const getAdherenceLevel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 25) return 'Poor';
    return 'Very Poor';
  };

  return {
    checklistItems,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    parseTradeNotes,
    serializeTradeNotes,
    calculateAdherenceScore,
    getAdherenceLevel,
    preTradeItems: checklistItems.filter(item => item.category === 'pre-trade'),
    postTradeItems: checklistItems.filter(item => item.category === 'post-trade'),
  };
}