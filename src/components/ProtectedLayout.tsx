'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
            <div
                className="fixed inset-0 z-20 bg-black/60 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}
        
        {/* Sidebar */}
        <div
            className={cn(
                'fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
                {
                    'translate-x-0': isSidebarOpen,
                    '-translate-x-full': !isSidebarOpen,
                }
            )}
        >
            <Sidebar />
        </div>
        
        <div className="flex flex-1 flex-col">
             {/* Mobile Header */}
            <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden"
                >
                    {isSidebarOpen ? <X /> : <Menu />}
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
        </div>
    </div>
  );
}
