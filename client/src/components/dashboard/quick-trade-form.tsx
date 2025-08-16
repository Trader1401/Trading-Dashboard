import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Eraser, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTrades } from "@/hooks/use-trades";
import { useStrategies } from "@/hooks/use-strategies";
import { calculatePnL } from "@/lib/calculations";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const quickTradeSchema = z.object({
  stockName: z.string().min(1, "Stock name is required"),
  tradeType: z.enum(["long", "short"]).default("long"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  entryPrice: z.coerce.number().min(0.01, "Entry price must be greater than 0"),
  exitPrice: z.coerce.number().min(0.01, "Exit price must be greater than 0"),
  setupFollowed: z.boolean().default(false),
  whichSetup: z.string().optional(),
});

type QuickTradeForm = z.infer<typeof quickTradeSchema>;

export default function QuickTradeForm() {
  const { addTrade, isAdding } = useTrades();
  const { strategies } = useStrategies();
  
  const form = useForm<QuickTradeForm>({
    resolver: zodResolver(quickTradeSchema),
    defaultValues: {
      stockName: "",
      tradeType: "long",
      quantity: 0,
      entryPrice: 0,
      exitPrice: 0,
      setupFollowed: false,
      whichSetup: "",
    },
  });

  const onSubmit = (data: QuickTradeForm) => {
    const profitLoss = calculatePnL(data.entryPrice, data.exitPrice, data.quantity, data.tradeType);
    
    addTrade({
      tradeDate: new Date().toISOString().split('T')[0],
      stockName: data.stockName.toUpperCase(),
      tradeType: data.tradeType,
      quantity: data.quantity,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice.toString(),
      profitLoss: profitLoss.toString(),
      setupFollowed: data.setupFollowed,
      whichSetup: data.whichSetup || null,
      emotion: null,
      notes: null,
      psychologyReflections: null,
      screenshotLink: null,
      stopLoss: null,
      targetPrice: null,
    });
    
    form.reset();
  };

  const clearForm = () => {
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Trade Entry</CardTitle>
          <Link href="/trades">
            <Button variant="ghost" size="sm">
              View Full Form <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., RELIANCE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="long">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="text-xs">LONG</Badge>
                            <span>Buy First</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="short">
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive" className="text-xs">SHORT</Badge>
                            <span>Sell First</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="2,450.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="2,475.25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="setupFollowed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Setup Followed
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="whichSetup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strategy/Setup</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select strategy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {strategies.map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.name}>
                            {strategy.name}
                            <Badge 
                              variant={strategy.status === "active" ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {strategy.status}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isAdding}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isAdding ? "Adding..." : "Add Trade"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={clearForm}
              >
                <Eraser className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
