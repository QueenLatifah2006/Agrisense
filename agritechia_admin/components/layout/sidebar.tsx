'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sprout, 
  Activity, 
  MessageSquare, 
  Settings, 
  LogOut,
  HelpCircle,
  Cpu,
  Globe,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`}
  >
    <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="font-medium">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
      />
    )}
  </button>
);

export function Sidebar({ onLogout, isOpen = false }: { onLogout: () => void; isOpen?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Fetch me error:', error);
      }
    };
    fetchMe();
  }, []);

  const navigation = [
    { label: 'DASHBOARD', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'GESTION DES CULTURES', icon: Sprout, href: '/dashboard/crops' },
    // Only show Users link if not a farmer
    ...((user?.role === 'superadmin' || user?.role === 'admin') ? [
      { label: 'UTILISATEURS', icon: Users, href: '/dashboard/users' },
      { label: 'VALIDATION NOTES', icon: FileText, href: '/dashboard/validation' }
    ] : []),
    { label: 'HISTORIQUES', icon: Activity, href: '/dashboard/historiques' },
    { label: 'PARAMETRES', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <aside className={cn(
      "fixed top-0 left-0 z-50 h-screen w-[300px] bg-background border-r border-border flex flex-col py-6 px-4 space-y-8 shadow-2xl transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex items-center gap-4 px-2">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-primary tracking-widest leading-none text-nowrap">AGRISENSE AI</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-tighter mt-1">Système de Gestion</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 group rounded-lg",
              pathname === item.href
                ? "bg-primary/10 text-primary font-bold border-l-4 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-1"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-border space-y-2">
        <button className="w-full flex items-center gap-3 text-muted-foreground px-4 py-3 hover:text-foreground transition-all hover:bg-muted hover:translate-x-1 text-sm rounded-lg group">
          <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Aide & Support</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-muted-foreground px-4 py-3 hover:text-rose-500 hover:bg-rose-500/5 hover:translate-x-1 transition-all text-sm rounded-lg group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Déconnexion</span>
        </button>
      </div>

      <div className="pt-6 border-t border-border">
        <div 
          onClick={() => router.push('/dashboard/profile')}
          className={cn(
            "flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all hover:bg-muted group",
            pathname === '/dashboard/profile' && "bg-muted border border-border"
          )}
        >
          <Avatar className="w-10 h-10 border border-border ring-2 ring-primary/20">
            <AvatarImage src={user?.profile_picture} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{user?.name || 'Inconnu'}</div>
            <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{user?.role || 'Utilisateur'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
