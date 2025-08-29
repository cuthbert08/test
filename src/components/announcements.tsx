'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendAnnouncement, getResidents } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Resident } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

export function Announcements() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<Set<string>>(new Set());
  const [loadingResidents, setLoadingResidents] = useState(true);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  const canPerformAction = hasRole(['superuser', 'editor']);

  const fetchResidents = useCallback(async () => {
    if (!canPerformAction) {
        setLoadingResidents(false);
        return;
    };
    try {
      setLoadingResidents(true);
      const data = await getResidents();
      setResidents(data);
    } catch (error) {
       toast({
        title: 'Error fetching residents',
        description: 'Could not load the list of residents.',
        variant: 'destructive',
      });
    } finally {
        setLoadingResidents(false);
    }
  }, [toast, canPerformAction]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const handleSelectResident = (residentId: string) => {
    const newSelection = new Set(selectedResidents);
    if (newSelection.has(residentId)) {
      newSelection.delete(residentId);
    } else {
      newSelection.add(residentId);
    }
    setSelectedResidents(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResidents(new Set(residents.map(r => r.id)));
    } else {
      setSelectedResidents(new Set());
    }
  };


  const handleSendAnnouncement = async () => {
    if (!subject || !message) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in both the subject and message fields.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedResidents.size === 0) {
        toast({
            title: 'No Recipients Selected',
            description: 'Please select at least one resident to receive the announcement.',
            variant: 'destructive',
        });
        return;
    }

    try {
      await sendAnnouncement(subject, message, Array.from(selectedResidents));
      toast({
        title: 'Announcement Sent!',
        description: `Your message has been sent to ${selectedResidents.size} resident(s).`,
      });
      setSubject('');
      setMessage('');
      setSelectedResidents(new Set());
    } catch (error) {
      toast({
        title: 'Error Sending Announcement',
        description: 'Could not send the announcement.',
        variant: 'destructive',
      });
      console.error('Failed to send announcement:', error);
    }
  };

  const isAllSelected = residents.length > 0 && selectedResidents.size === residents.length;
  const isSendButtonDisabled = !subject || !message || selectedResidents.size === 0 || !canPerformAction;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Announcements</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Compose Announcement</CardTitle>
                <CardDescription>Write your message below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                id="subject"
                placeholder="e.g., Water Outage"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!canPerformAction}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                id="message"
                placeholder="Enter your announcement message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!canPerformAction}
                />
            </div>
            {canPerformAction && (
                <Button onClick={handleSendAnnouncement} disabled={isSendButtonDisabled}>
                Send to Selected ({selectedResidents.size})
                </Button>
            )}
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Select Recipients</CardTitle>
                <CardDescription>Choose which residents will receive this announcement.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loadingResidents ? (
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                <ScrollArea className="h-72 w-full rounded-md border">
                    <div className="p-4">
                        <div className="flex items-center p-2 border-b">
                            <Checkbox
                                id="select-all-residents"
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                className="mr-4"
                                disabled={!canPerformAction}
                            />
                            <Label htmlFor="select-all-residents" className="font-semibold flex-1 cursor-pointer">
                                Select All
                            </Label>
                        </div>
                        {residents.map(resident => (
                            <div key={resident.id} className="flex items-center p-2 border-b last:border-b-0">
                                <Checkbox
                                    id={`resident-${resident.id}`}
                                    checked={selectedResidents.has(resident.id)}
                                    onCheckedChange={() => handleSelectResident(resident.id)}
                                    className="mr-4"
                                    disabled={!canPerformAction}
                                />
                                <Label htmlFor={`resident-${resident.id}`} className="flex-1 cursor-pointer">
                                    <span className="font-medium">{resident.name}</span>
                                    <span className="text-muted-foreground ml-2">(Flat {resident.flat_number})</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
