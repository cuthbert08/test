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
import { type CommunicationEvent, type CommunicationDetail } from '@/lib/types';
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
import { Trash2, MessageSquare, Users } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';

const getStatusVariant = (status: CommunicationEvent['status']) => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'Partial':
      return 'secondary';
    case 'Failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

const renderRecipients = (details: CommunicationDetail[]) => {
  if (!details || details.length === 0) {
    return 'N/A';
  }
  const uniqueRecipients = [...new Set(details.map(d => d.recipient))];
  const firstRecipient = uniqueRecipients[0];

  if (uniqueRecipients.length === 1) {
    return firstRecipient;
  }

  return `${firstRecipient} and ${uniqueRecipients.length - 1} others`;
};

const renderContentPreview = (details: CommunicationDetail[]) => {
    if (!details || details.length === 0) {
        return '...';
    }
    const firstDetailWithContent = details.find(d => d.content);
    return firstDetailWithContent ? firstDetailWithContent.content : 'Template Message';
}


export function History() {
  const [history, setHistory] = useState<CommunicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { hasRole } = useAuth();

  const canPerformAction = hasRole(['superuser', 'editor']);
  const canDelete = hasRole(['superuser']);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: 'Error fetching history',
        description: 'Could not load the communication history.',
        variant: 'destructive',
      });
      setHistory([]);
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
    if (!canDelete || selectedItems.size === 0) return;
    try {
      await deleteHistory(Array.from(selectedItems));
      toast({
        title: 'History Deleted',
        description: `${selectedItems.size} history event(s) have been deleted.`,
      });
      setSelectedItems(new Set());
      await fetchHistory(); 
    } catch (error) {
      toast({
        title: 'Error Deleting History',
        description: 'Could not delete the selected items.',
        variant: 'destructive',
      });
    }
  };

  const isAllSelected = history.length > 0 && selectedItems.size === history.length;
  
  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
        case 'reminder':
            return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'announcement':
            return <Users className="h-4 w-4 text-purple-500" />;
        case 'issue notification':
            return <MessageSquare className="h-4 w-4 text-red-500" />
        default:
            return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communication History</h1>
        {canDelete && selectedItems.size > 0 && (
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
                             {canDelete && (
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    aria-label="Select all history items"
                                    disabled={!canPerformAction || history.length === 0}
                                />
                            )}
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Preview</TableHead>
                        </TableRow>
                    </TableHeader>
                     <TableBody>
                         {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={7}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                         ) : history.length > 0 ? (
                            history.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        {canDelete && (
                                            <Checkbox
                                                checked={selectedItems.has(item.id)}
                                                onCheckedChange={() => handleSelectItem(item.id)}
                                                aria-label={`Select event ${item.id}`}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getIconForType(item.type)}
                                            <span className="font-medium">{item.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.subject}</TableCell>
                                    <TableCell className="whitespace-nowrap">{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm')}</TableCell>
                                    <TableCell>{renderRecipients(item.details)}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></TableCell>
                                    <TableCell className="text-muted-foreground truncate max-w-xs">{renderContentPreview(item.details)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
