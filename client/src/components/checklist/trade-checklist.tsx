import { useState, useEffect } from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useChecklist, ChecklistAdherence } from '@/hooks/use-checklist';

interface TradeChecklistProps {
  checklist: ChecklistAdherence;
  onChecklistChange: (checklist: ChecklistAdherence) => void;
  disabled?: boolean;
}

export default function TradeChecklist({ checklist, onChecklistChange, disabled = false }: TradeChecklistProps) {
  const { preTradeItems, postTradeItems, calculateAdherenceScore, getAdherenceLevel } = useChecklist();
  
  const handleItemChange = (itemId: string, checked: boolean) => {
    if (disabled) return;
    
    const updatedChecklist = {
      ...checklist,
      [itemId]: checked
    };
    onChecklistChange(updatedChecklist);
  };

  const preTradeScore = calculateAdherenceScore(
    Object.fromEntries(
      preTradeItems.map(item => [item.id, checklist[item.id] || false])
    )
  );

  const postTradeScore = calculateAdherenceScore(
    Object.fromEntries(
      postTradeItems.map(item => [item.id, checklist[item.id] || false])
    )
  );

  const overallScore = calculateAdherenceScore(checklist);

  if (preTradeItems.length === 0 && postTradeItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500">No checklist items configured</p>
          <p className="text-sm text-gray-400">Go to Settings to create your trading checklist</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Trading Discipline Checklist</span>
          </CardTitle>
          <Badge variant={overallScore >= 75 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'}>
            {overallScore.toFixed(0)}% ({getAdherenceLevel(overallScore)})
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pre-Trade Section */}
        {preTradeItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Pre-Trade</h3>
              </div>
              <Badge variant="outline">
                {preTradeScore.toFixed(0)}%
              </Badge>
            </div>
            
            <div className="space-y-3">
              {preTradeItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Checkbox
                    id={item.id}
                    checked={checklist[item.id] || false}
                    onCheckedChange={(checked) => handleItemChange(item.id, checked as boolean)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={item.id} 
                      className={`font-medium cursor-pointer ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {item.name}
                    </label>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {preTradeItems.length > 0 && postTradeItems.length > 0 && (
          <Separator />
        )}

        {/* Post-Trade Section */}
        {postTradeItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Post-Trade</h3>
              </div>
              <Badge variant="outline">
                {postTradeScore.toFixed(0)}%
              </Badge>
            </div>
            
            <div className="space-y-3">
              {postTradeItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Checkbox
                    id={item.id}
                    checked={checklist[item.id] || false}
                    onCheckedChange={(checked) => handleItemChange(item.id, checked as boolean)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={item.id} 
                      className={`font-medium cursor-pointer ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {item.name}
                    </label>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Adherence
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} items
              </span>
              <Badge variant={overallScore >= 75 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'}>
                {getAdherenceLevel(overallScore)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}