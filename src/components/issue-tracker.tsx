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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getIssues, updateIssueStatus, getPublicIssues, deleteIssues } from '@/lib/api';
import { type Issue } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import ProtectedLayout from './ProtectedLayout';

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'reported':
      return 'destructive';
    case 'in progress':
      return 'secondary';
    case 'resolved':
      return 'default';
    default:
      return 'outline';
  }
};

export function IssueTracker() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { isAuthenticated, hasRole } = useAuth();
  
  const canPerformAction = hasRole(['superuser', 'editor']);
  const canDelete = hasRole(['superuser']);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const data = isAuthenticated ? await getIssues() : await getPublicIssues();
      setIssues(data);
    } catch (error) {
      toast({
        title: 'Error fetching issues',
        description: 'Could not load the list of maintenance issues.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast, isAuthenticated]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleOpenDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setNewStatus(issue.status);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedIssue(null);
    setIsDialogOpen(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedIssue || !newStatus) return;
    try {
        await updateIssueStatus(selectedIssue.id, newStatus);
        toast({
            title: "Status Updated",
            description: `Issue status changed to ${newStatus}.`
        })
        fetchIssues();
        handleCloseDialog();
    } catch (error) {
        toast({
            title: 'Error Updating Status',
            description: 'Could not update the issue status.',
            variant: 'destructive',
        });
        console.error(error);
    }
  }

  const handleSelectIssue = (issueId: string) => {
    const newSelection = new Set(selectedIssues);
    if (newSelection.has(issueId)) {
        newSelection.delete(issueId);
    } else {
        newSelection.add(issueId);
    }
    setSelectedIssues(newSelection);
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        const allIssueIds = new Set(issues.map(issue => issue.id));
        setSelectedIssues(allIssueIds);
    } else {
        setSelectedIssues(new Set());
    }
  }

  const handleDeleteSelected = async () => {
    if (!canDelete) return;
    try {
        await deleteIssues(Array.from(selectedIssues));
        toast({
            title: 'Issues Deleted',
            description: 'The selected issues have been deleted.',
        });
        setSelectedIssues(new Set());
        fetchIssues();
    } catch (error) {
        toast({
            title: 'Error Deleting Issues',
            description: 'Could not delete the selected issues.',
            variant: 'destructive',
        });
        console.error(error);
    }
  };

  const PageContent = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Issue Tracker</h1>
        {canDelete && selectedIssues.size > 0 && (
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                      <Trash2 className="mr-2"/>
                      Delete ({selectedIssues.size})
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {selectedIssues.size} issue(s).
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

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                  <TableHead className="w-[50px]">
                      <Checkbox
                          checked={selectedIssues.size > 0 && selectedIssues.size === issues.length}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          aria-label="Select all issues"
                      />
                  </TableHead>
              )}
              <TableHead>Date</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Flat</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              {canPerformAction && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderIssueList()}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
          ))
        ) : issues.length > 0 ? (
          issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <CardTitle className="text-lg">Flat {issue.flat_number}</CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{issue.reported_by}</span>
                  <span>{format(new Date(issue.timestamp), 'dd MMM yyyy')}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{issue.description}</p>
                <div className="flex items-center justify-between">
                    <Badge variant={getStatusVariant(issue.status)}>{issue.status}</Badge>
                    {canPerformAction && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(issue)}>
                          Update Status
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No issues reported yet.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Issue Status</DialogTitle>
                <DialogDescription>
                    Update the status for the issue reported by {selectedIssue?.reported_by}.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Reported">Reported</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleUpdateStatus}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderIssueList = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {canDelete && <TableCell><Skeleton className="h-5 w-5" /></TableCell>}
            <TableCell colSpan={canDelete ? 5 : 6}><Skeleton className="h-8 w-full" /></TableCell>
          </TableRow>
      ));
    }
    if (issues.length === 0) {
      return (
          <TableRow>
            <TableCell colSpan={canPerformAction ? 6 : 5} className="text-center">
              No issues reported yet.
            </TableCell>
          </TableRow>
      );
    }
    return issues.map((issue) => (
      <TableRow key={issue.id}>
        {canDelete && (
            <TableCell>
                <Checkbox
                    checked={selectedIssues.has(issue.id)}
                    onCheckedChange={() => handleSelectIssue(issue.id)}
                    aria-label={`Select issue ${issue.id}`}
                />
            </TableCell>
        )}
        <TableCell>{format(new Date(issue.timestamp), 'dd MMM yyyy, HH:mm')}</TableCell>
        <TableCell>{issue.reported_by}</TableCell>
        <TableCell>{issue.flat_number}</TableCell>
        <TableCell className='max-w-xs truncate'>{issue.description}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(issue.status)}>{issue.status}</Badge>
        </TableCell>
        {canPerformAction && (
          <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => handleOpenDialog(issue)}>
                  Update Status
              </Button>
          </TableCell>
        )}
      </TableRow>
    ))
  }

  if (isAuthenticated) {
    return (
      <ProtectedLayout>
        <PageContent />
      </ProtectedLayout>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <PageContent />
    </div>
  );
}
