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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getResidents, addResident, updateResident, deleteResident, setCurrentTurn } from '@/lib/api';
import { type Resident } from '@/lib/types';
import { Pencil, Trash2, CheckCircle, MoreVertical } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

const emptyResident: Partial<Resident> = {
  name: '',
  flat_number: '',
  notes: '',
  contact: {
    whatsapp: '',
    sms: '',
    email: '',
  },
};

export function Residents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Partial<Resident> | null>(null);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  
  const canPerformAction = hasRole(['superuser', 'editor']);
  const canDelete = hasRole(['superuser']);

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

  const handleOpenDialog = (resident?: Resident) => {
    setEditingResident(resident ? {...resident} : emptyResident);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingResident(null);
    setIsDialogOpen(false);
  };
  
  const handleSaveResident = async () => {
    if (!editingResident?.name) {
      toast({
        title: 'Validation Error',
        description: 'Resident name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if ('id' in editingResident && editingResident.id) {
        await updateResident(editingResident.id, editingResident);
        toast({
          title: 'Resident Updated',
          description: 'The resident\'s details have been successfully updated.',
        });
      } else {
        await addResident(editingResident as Omit<Resident, 'id'>);
        toast({
          title: 'Resident Added',
          description: 'The new resident has been successfully added.',
        });
      }
      fetchResidents();
      handleCloseDialog();
    } catch (error) {
      toast({
        title: 'Error Saving Resident',
        description: 'Could not save the resident\'s details.',
        variant: 'destructive',
      });
      console.error(error);
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (!canDelete) return;
    try {
        await deleteResident(id);
        toast({
            title: 'Resident Deleted',
            description: 'The resident has been successfully deleted.',
        });
        fetchResidents();
    } catch (error) {
        toast({
            title: 'Error Deleting Resident',
            description: 'Could not delete the resident.',
            variant: 'destructive',
        });
        console.error(error);
    }
  };

  const handleSetCurrent = async (resident: Resident) => {
      try {
          await setCurrentTurn(resident.id);
          toast({
              title: 'Current Turn Updated',
              description: `${resident.name} is now set as the current person on duty.`
          });
          fetchResidents();
      } catch (error) {
          toast({
              title: 'Error Setting Current Turn',
              description: 'Could not update the current turn.',
              variant: 'destructive',
          });
          console.error(error);
      }
  }

  const handleDialogInputChange = (field: keyof Resident, value: any) => {
    if(editingResident) {
      setEditingResident({ ...editingResident, [field]: value });
    }
  }

  const handleDialogContactChange = (field: keyof Resident['contact'], value: string) => {
      if(editingResident) {
          setEditingResident({
              ...editingResident,
              contact: {
                  ...editingResident.contact,
                  [field]: value
              }
          })
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Residents</h1>
        {canPerformAction && <Button onClick={() => handleOpenDialog()}>Add New Resident</Button>}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flat</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-32" /></TableCell>
                </TableRow>
              ))
            ) : residents.length > 0 ? (
              residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell>{resident.flat_number}</TableCell>
                  <TableCell>{resident.name}</TableCell>
                  <TableCell>{resident.contact.whatsapp || 'N/A'}</TableCell>
                  <TableCell>{resident.contact.email || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                      {canPerformAction && (
                        <Button variant="outline" size="sm" onClick={() => handleSetCurrent(resident)}>
                            <CheckCircle className="mr-2 h-4 w-4"/>
                            Set as Current
                        </Button>
                      )}
                      {canPerformAction && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resident)}>
                              <Pencil />
                              <span className="sr-only">Edit</span>
                          </Button>
                      )}
                      {canDelete && (
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 />
                                      <span className="sr-only">Delete</span>
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure you want to delete this resident?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteResident(resident.id)}>
                                      Delete
                                  </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No residents found.
                </TableCell>
              </TableRow>
            )}
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
        ) : residents.length > 0 ? (
          residents.map((resident) => (
            <Card key={resident.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{resident.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Flat {resident.flat_number}</p>
                </div>
                {canPerformAction && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => handleSetCurrent(resident)}>
                          <CheckCircle className="mr-2"/> Set as Current
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => handleOpenDialog(resident)}>
                          <Pencil className="mr-2"/> Edit
                       </DropdownMenuItem>
                       {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="mr-2"/> Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to delete this resident?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteResident(resident.id)}>
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                       )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <b>WhatsApp:</b> {resident.contact.whatsapp || 'N/A'}
                </p>
                <p className="text-sm">
                  <b>Email:</b> {resident.contact.email || 'N/A'}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
           <div className="text-center text-muted-foreground py-8">
                No residents found.
            </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>{editingResident && 'id' in editingResident ? 'Edit Resident' : 'Add New Resident'}</DialogTitle>
            <DialogDescription>
                Fill in the details below. Click save when you're done.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={editingResident?.name || ''} onChange={(e) => handleDialogInputChange('name', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="flat_number" className="text-right">Flat No.</Label>
                    <Input id="flat_number" value={editingResident?.flat_number || ''} onChange={(e) => handleDialogInputChange('flat_number', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
                    <Input id="whatsapp" value={editingResident?.contact?.whatsapp || ''} onChange={(e) => handleDialogContactChange('whatsapp', e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sms" className="text-right">SMS</Label>
                    <Input id="sms" value={editingResident?.contact?.sms || ''} onChange={(e) => handleDialogContactChange('sms', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" value={editingResident?.contact?.email || ''} onChange={(e) => handleDialogContactChange('email', e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                    <Textarea id="notes" value={editingResident?.notes || ''} onChange={(e) => handleDialogInputChange('notes', e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleSaveResident}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
