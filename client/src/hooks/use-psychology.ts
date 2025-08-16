import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GoogleSheetsAPI } from '@/lib/google-sheets';
import { useAppContext } from '@/contexts/app-context';

// Psychology Entry type
export interface PsychologyEntry {
  id: number;
  month: string;
  year: number;
  monthlyPnL: string | null;
  bestTradeId: number | null;
  worstTradeId: number | null;  
  mentalReflections: string;
  improvementAreas: string;
  createdAt: Date;
}

// Insert schema type
export interface InsertPsychologyEntry {
  month: string;
  year: number;
  monthlyPnL?: string;
  bestTradeId?: number;
  worstTradeId?: number;
  mentalReflections: string;
  improvementAreas: string;
}

export function usePsychologyEntries() {
  const { settings } = useAppContext();

  return useQuery({
    queryKey: ['/api/psychology-entries'],
    queryFn: async (): Promise<PsychologyEntry[]> => {
      if (!settings?.googleScriptUrl || !settings?.googleSheetId) {
        return [];
      }

      const googleSheetsAPI = new GoogleSheetsAPI(settings.googleScriptUrl, settings.googleSheetId);
      return googleSheetsAPI.getPsychologyEntries();
    },
    enabled: !!(settings?.googleScriptUrl && settings?.googleSheetId),
  });
}

export function useAddPsychologyEntry() {
  const queryClient = useQueryClient();
  const { settings } = useAppContext();
  
  return useMutation({
    mutationFn: async (entry: InsertPsychologyEntry): Promise<PsychologyEntry> => {
      if (!settings?.googleScriptUrl || !settings?.googleSheetId) {
        throw new Error('Google Sheets not configured');
      }

      const googleSheetsAPI = new GoogleSheetsAPI(settings.googleScriptUrl, settings.googleSheetId);
      return googleSheetsAPI.addPsychologyEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychology-entries'] });
    },
  });
}

// Update psychology entry hook
export function useUpdatePsychologyEntry() {
  const queryClient = useQueryClient();
  const { settings } = useAppContext();
  
  return useMutation({
    mutationFn: async ({ id, ...entry }: { id: number } & Partial<InsertPsychologyEntry>): Promise<PsychologyEntry> => {
      if (!settings?.googleScriptUrl || !settings?.googleSheetId) {
        throw new Error('Google Sheets not configured');
      }

      const googleSheetsAPI = new GoogleSheetsAPI(settings.googleScriptUrl, settings.googleSheetId);
      return googleSheetsAPI.updatePsychologyEntry(id, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychology-entries'] });
    },
  });
}

// Delete psychology entry hook
export function useDeletePsychologyEntry() {
  const queryClient = useQueryClient();
  const { settings } = useAppContext();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      if (!settings?.googleScriptUrl || !settings?.googleSheetId) {
        throw new Error('Google Sheets not configured');
      }

      const googleSheetsAPI = new GoogleSheetsAPI(settings.googleScriptUrl, settings.googleSheetId);
      return googleSheetsAPI.deletePsychologyEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psychology-entries'] });
    },
  });
}

export function usePsychology() {
  const { data: entries = [], isLoading } = usePsychologyEntries();
  const addEntryMutation = useAddPsychologyEntry();
  const updateEntryMutation = useUpdatePsychologyEntry();
  const deleteEntryMutation = useDeletePsychologyEntry();

  return {
    entries,
    isLoading,
    addEntry: addEntryMutation.mutateAsync,
    updateEntry: updateEntryMutation.mutateAsync,
    deleteEntry: deleteEntryMutation.mutateAsync,
    isAdding: addEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,
  };
}