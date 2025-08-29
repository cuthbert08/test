'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getLogs, deleteLogs } from '@/lib/api';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

export function Logs() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hasRole } = useAuth();

  const canDelete = hasRole(['superuser']);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLogs();
      setLogs(data);
    } catch (error) {
      toast({
        title: 'Error fetching logs',
        description: 'Could not load the system logs.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSelectLog = (logEntry: string) => {
    const newSelection = new Set(selectedLogs);
    if (newSelection.has(logEntry)) {
      newSelection.delete(logEntry);
    } else {
      newSelection.add(logEntry);
    }
    setSelectedLogs(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLogs(new Set(logs));
    } else {
      setSelectedLogs(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (!canDelete) return;
    try {
      await deleteLogs(Array.from(selectedLogs));
      toast({
        title: 'Logs Deleted',
        description: 'The selected log entries have been deleted.',
      });
      setSelectedLogs(new Set());
      fetchLogs();
    } catch (error) {
      toast({
        title: 'Error Deleting Logs',
        description: 'Could not delete the selected logs.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Logs</h1>
        {canDelete && selectedLogs.size > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2" />
                Delete ({selectedLogs.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {selectedLogs.size} log entries.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full rounded-md border">
            <div className="p-4 font-mono text-sm">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : logs.length > 0 ? (
                <div>
                  {canDelete && (
                    <div className="flex items-center p-2 border-b">
                        <Checkbox
                        id="select-all-logs"
                        checked={selectedLogs.size > 0 && selectedLogs.size === logs.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        className="mr-4"
                        />
                        <label htmlFor="select-all-logs" className="cursor-pointer flex-1">
                        Select All
                        </label>
                    </div>
                  )}
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-center p-2 border-b last:border-b-0">
                      {canDelete && (
                        <Checkbox
                            id={`log-${index}`}
                            checked={selectedLogs.has(log)}
                            onCheckedChange={() => handleSelectLog(log)}
                            className="mr-4"
                        />
                      )}
                      <label htmlFor={`log-${index}`} className="cursor-pointer flex-1">
                        {log}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">No log entries found.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
