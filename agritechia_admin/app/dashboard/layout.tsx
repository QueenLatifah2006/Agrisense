'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useTheme } from '@/lib/theme-context';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  
  const isMainDashboard = pathname === '/dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const user = await response.json();
          if (user.role === 'farmer') {
             localStorage.removeItem('token');
             router.push('/login?error=restricted');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Check auth error:', error);
      }
    };
    checkAuth();
  }, [router]);

  // Close sidebar on page shift/navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setIsLogoutDialogOpen(false);
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/30 font-sans tracking-tight">
      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="glass border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-2xl tracking-tight">Terminer la session ?</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 font-medium">
              Voulez-vous vraiment vous déconnecter du système AgriSense ? Toutes les transmissions non sauvegardées pourront être perdues.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl border border-border my-2">
            <LogOut className="w-10 h-10 text-rose-500 opacity-20" />
            <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold tracking-widest">
              Security Protocol Delta-7: End of operational session will revoke current node access.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)} className="border-border rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px]">Rester Connecté</Button>
            <Button onClick={handleLogout} className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl h-11 px-8 font-bold uppercase tracking-widest text-[10px]">Déconnexion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conditionally display the Sidebar representing Central Console navigation */}
      {!isMainDashboard && (
        <>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onLogout={() => setIsLogoutDialogOpen(true)}
          />
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-background/85 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Left shift of 300px on desktop when sidebar is rendered */}
      <main className={cn(
        "flex-1 relative min-w-0 bg-background transition-all duration-300",
        !isMainDashboard && "lg:pl-[300px]"
      )}>
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={() => setIsLogoutDialogOpen(true)}
        />
        
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-none w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
