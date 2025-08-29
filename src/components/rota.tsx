'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getResidents, updateResidentsOrder } from '@/lib/api';
import { type Resident } from '@/lib/types';
import { GripVertical, Save, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, nextWednesday, format, startOfDay } from 'date-fns';

export function Rota() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const [draggedItem, setDraggedItem] = useState<Resident | null>(null);

  const canPerformAction = hasRole(['superuser', 'editor']);

  const fetchResidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getResidents();
      setResidents(data);
    } catch (error) {
      toast({
        title: 'Error fetching residents',
        description: 'Could not load the list of residents.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, resident: Resident) => {
    setDraggedItem(resident);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    const draggedOverItem = residents[index];
    if (draggedItem === null || draggedItem.id === draggedOverItem.id) {
      return;
    }
    const items = residents.filter(item => item.id !== draggedItem.id);
    items.splice(index, 0, draggedItem);
    setResidents(items);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSaveChanges = async () => {
    try {
      await updateResidentsOrder(residents);
      toast({
        title: 'Rotation Updated!',
        description: 'The new duty rotation has been saved successfully.',
      });
      fetchResidents();
    } catch (error) {
      toast({
        title: 'Error Saving Rotation',
        description: 'Could not save the new resident order.',
        variant: 'destructive',
      });
    }
  };

  const getDutyDate = (index: number) => {
    const today = startOfDay(new Date());
    let wednesday = nextWednesday(today);
    // If today is Wednesday, we want to show *this* Wednesday for the person on top
    if (today.getDay() === 3) {
      wednesday = today;
    }
    return addDays(wednesday, index * 7);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Duty Rotation</h1>
        {canPerformAction && (
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rotation Order</CardTitle>
          <CardDescription>
            {canPerformAction ? 'Drag and drop residents to reorder the duty rotation. The changes will apply from the next cycle.' : 'This is the current duty rotation order.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ul className="space-y-2">
              {residents.map((resident, index) => (
                <li
                  key={resident.id}
                  draggable={canPerformAction}
                  onDragStart={(e) => handleDragStart(e, resident)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-3 rounded-md border bg-card text-card-foreground ${canPerformAction ? 'cursor-grab' : ''} ${draggedItem?.id === resident.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    {canPerformAction && <GripVertical className="mr-4 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold">{resident.name}</p>
                      <p className="text-sm text-muted-foreground">Flat {resident.flat_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {format(getDutyDate(index), 'EEE, dd MMM yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className='size-3' />
                      04:00 AM SAST
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
