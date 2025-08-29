'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getDashboardInfo, triggerReminder, skipTurn, advanceTurn } from '@/lib/api';
import { type DashboardData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, nextWednesday, addDays } from 'date-fns';
import { AlertTriangle, ChevronsRight, SkipForward } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const { toast } = useToast();
  const { hasRole } = useAuth();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await getDashboardInfo();
      setData(dashboardData);
    } catch (error) {
      const errorMessage = 'Could not load dashboard information from the server.';
      setError(errorMessage);
      toast({
        title: 'Error fetching dashboard data',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const canPerformAction = hasRole(['superuser', 'editor']);

  const handleSendReminder = async (message?: string) => {
    try {
      await triggerReminder(message);
      toast({
        title: 'Reminder Sent!',
        description: 'The reminder has been successfully sent and the turn has been advanced.',
      });
      if (message) {
        setCustomMessage('');
      }
      loadDashboardData(); // Refresh data to show new person on duty
    } catch (error) {
      toast({
        title: 'Error Sending Reminder',
        description: 'Could not send the reminder.',
        variant: 'destructive',
      });
      console.error('Failed to send reminder:', error);
    }
  };

  const handleSkipTurn = async () => {
    try {
        await skipTurn();
        toast({
            title: 'Turn Skipped',
            description: 'The current turn has been skipped successfully.',
        });
        await loadDashboardData();
    } catch (error) {
        toast({
            title: 'Error Skipping Turn',
            description: 'Could not skip the current turn.',
            variant: 'destructive',
        });
        console.error('Failed to skip turn:', error);
    }
  };
  
  const handleAdvanceTurn = async () => {
    try {
        await advanceTurn();
        toast({
            title: 'Turn Advanced',
            description: 'The duty has been manually advanced to the next person.',
        });
        await loadDashboardData();
    } catch (error) {
        toast({
            title: 'Error Advancing Turn',
            description: 'Could not advance the current turn.',
            variant: 'destructive',
        });
        console.error('Failed to advance turn:', error);
    }
  };

  const currentDutyDate = nextWednesday(new Date());
  const nextDutyDate = addDays(currentDutyDate, 7);

  const renderCardContent = (value: string | undefined, date?: Date) => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-4 w-4" />
          <p className="text-sm font-medium">Error loading data</p>
        </div>
      );
    }
    return (
      <div>
        <p className="text-2xl font-bold">{value || 'N/A'}</p>
        {date && <p className="text-sm text-muted-foreground">{format(date, 'dd-MM-yyyy')}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Bin Duty</CardTitle>
          </CardHeader>
          <CardContent>
            {renderCardContent(data?.current_duty?.name, currentDutyDate)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next in Rotation</CardTitle>
          </CardHeader>
          <CardContent>
            {renderCardContent(data?.next_in_rotation?.name, nextDutyDate)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-1/2" />
            ) : error ? (
              <div className="flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <p className="text-sm font-medium">Error</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Last reminder run:</p>
                <p className="text-lg font-semibold">{data?.system_status?.last_reminder_run || 'N/A'}</p>
              </>
            )}
          </CardContent>
           {canPerformAction && (
             <CardFooter className='space-x-2'>
                  <Button variant="outline" onClick={handleAdvanceTurn} disabled={loading || !!error}>
                      <ChevronsRight /> Advance Turn
                  </Button>
                  <Button variant="outline" onClick={handleSkipTurn} disabled={loading || !!error}>
                      <SkipForward /> Skip Turn
                  </Button>
              </CardFooter>
            )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Weekly Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Send the standard weekly reminder to the person currently on duty. This will also advance the turn to the next person.
            </p>
            {canPerformAction && (
              <Button onClick={() => handleSendReminder()} disabled={loading || !!error}>Send Reminder & Advance</Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Send Custom Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={canPerformAction ? "Enter your custom reminder message here..." : "You do not have permission to send custom reminders."}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={loading || !!error || !canPerformAction}
            />
            {canPerformAction && (
              <Button onClick={() => handleSendReminder(customMessage)} disabled={!customMessage || loading || !!error}>Send Custom Reminder & Advance</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
