'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getHistory, deleteHistory } from '@/lib/api';
import { type CommunicationEvent } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { useAuth } from '@/contexts/AuthContext';


export function History() {
  const [history, setHistory] = useState<CommunicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hasRole } = useAuth();

  const canPerformAction = hasRole(['superuser', 'editor']);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      // Ensure data is always an array to prevent errors
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error fetching history',
        description: 'Could not load the communication history.',
        variant: 'destructive',
      });
      setHistory([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSelectItem = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(history.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (!canPerformAction || selectedItems.size === 0) return;
    try {
      await deleteHistory(Array.from(selectedItems));
      toast({
        title: 'History Deleted',
        description: `${selectedItems.size} history event(s) have been deleted.`,
      });
      setSelectedItems(new Set());
      await fetchHistory(); // Refresh the history list
    } catch (error) {
      toast({
        title: 'Error Deleting History',
        description: 'Could not delete the selected items.',
        variant: 'destructive',
      });
    }
  };

  const isAllSelected = history.length > 0 && selectedItems.size === history.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communication History</h1>
        {canPerformAction && selectedItems.size > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2" />
                Delete ({selectedItems.size})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedItems.size} history event(s). This action cannot be undone.
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
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px]">
                             {canPerformAction && (
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    aria-label="Select all history items"
                                    disabled={!canPerformAction || history.length === 0}
                                />
                            )}
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Content</TableHead>
                        </TableRow>
                    </TableHeader>
                     <TableBody>
                         {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                         ) : history.length > 0 ? (
                            history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {canPerformAction && (
                                            <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onCheckedChange={() => handleSelectItem(item.id)}
                                                aria-label={`Select event ${item.id}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm')}</TableCell>
                                    <TableCell>{item.type}</TableCell>
                                    <TableCell>{(item as any).recipient || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-sm">{(item as any).content}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No communication history found.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
      </Card>
    </div>
  );
}
