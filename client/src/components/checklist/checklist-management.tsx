import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, Save, X, CheckSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useChecklist, ChecklistItem } from '@/hooks/use-checklist';
import { useToast } from '@/hooks/use-toast';

const checklistItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.enum(['pre-trade', 'post-trade']),
  description: z.string().optional(),
});

type ChecklistItemForm = z.infer<typeof checklistItemSchema>;

export default function ChecklistManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const { checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem, preTradeItems, postTradeItems } = useChecklist();
  const { toast } = useToast();

  const form = useForm<ChecklistItemForm>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: {
      name: '',
      category: 'pre-trade',
      description: '',
    },
  });

  const onSubmit = (data: ChecklistItemForm) => {
    try {
      if (editingItem) {
        updateChecklistItem(editingItem.id, data);
        toast({
          title: 'Success',
          description: 'Checklist item updated successfully',
        });
      } else {
        addChecklistItem(data);
        toast({
          title: 'Success',
          description: 'Checklist item added successfully',
        });
      }
      
      form.reset();
      setIsAddDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save checklist item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      category: item.category,
      description: item.description || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    try {
      deleteChecklistItem(id);
      toast({
        title: 'Success',
        description: 'Checklist item deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete checklist item',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    form.reset();
    setIsAddDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5" />
            <span>Trading Discipline Checklist</span>
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Checked market trend" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pre-trade">Pre-Trade</SelectItem>
                            <SelectItem value="post-trade">Post-Trade</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this checklist item..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingItem(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pre-Trade Checklist */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-lg font-semibold">Pre-Trade Checklist</h3>
              <Badge variant="outline">{preTradeItems.length} items</Badge>
            </div>
            
            {preTradeItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No pre-trade checklist items</p>
                <p className="text-sm">Add items to track your pre-trade discipline</p>
              </div>
            ) : (
              <div className="space-y-2">
                {preTradeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This will remove it from all future trades.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post-Trade Checklist */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <CheckSquare className="w-4 h-4 text-green-500" />
              <h3 className="text-lg font-semibold">Post-Trade Checklist</h3>
              <Badge variant="outline">{postTradeItems.length} items</Badge>
            </div>
            
            {postTradeItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p>No post-trade checklist items</p>
                <p className="text-sm">Add items to track your post-trade discipline</p>
              </div>
            ) : (
              <div className="space-y-2">
                {postTradeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Checklist Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{item.name}"? This will remove it from all future trades.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}