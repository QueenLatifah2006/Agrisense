'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  ChevronRight,
  Menu,
  Sun,
  Moon,
  Users,
  LogOut,
  Cpu,
  LayoutDashboard,
  Sprout,
  Activity,
  Settings,
  FileText
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from 'next/navigation';

export function Header({ 
  onMenuClick, 
  isDarkMode, 
  toggleDarkMode,
  onLogout 
}: { 
  onMenuClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

 React.useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data); // Injecte les informations réelles de l'utilisateur (nom, photo, etc.)
        } else if (response.status === 401 || response.status === 403) {
          // Si la session a expiré ou le jeton est invalide
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
      }
    };

    fetchMe();
  }, [router]);

  const navigation = [
    { label: 'DASHBOARD', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'GESTION DES CULTURES', icon: Sprout, href: '/dashboard/crops' },
    ...((user?.role === 'superadmin' || user?.role === 'admin') ? [
      { label: 'UTILISATEURS', icon: Users, href: '/dashboard/users' },
      { label: 'VALIDATION NOTES', icon: FileText, href: '/dashboard/validation' }
    ] : []),
    { label: 'HISTORIQUES', icon: Activity, href: '/dashboard/historiques' },
    { label: 'PARAMETRES', icon: Settings, href: '/dashboard/settings' },
  ];

  const getBreadcrumb = () => {
    if (pathname === '/dashboard/users') return 'Gestion des Utilisateurs';
    if (pathname === '/dashboard/profile') return 'Profil Utilisateur';
    if (pathname === '/dashboard/crops') return 'Gestion des Cultures';
    if (pathname === '/dashboard/settings') return 'Paramètres Système';
    if (pathname === '/dashboard/validation') return 'Validation des Notes';
    if (pathname === '/dashboard/historiques') return 'Historiques d\'Activités';
    return 'METEO DES PRIX SUR LES MARCHES URBAINS'; // Valeur par défaut pour la page d'accueil du dashboard
  };

  return (
    <header className="sticky top-0 z-40 w-full h-20 px-8 flex items-center justify-between bg-background/70 dark:bg-background/70 backdrop-blur-xl border-b border-border/50 text-foreground transition-all duration-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-3 border-r border-border/50 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden md:block">
            <h2 className="text-xs font-black text-primary tracking-widest leading-none">AGRISENSE AI</h2>
            <p className="text-[8px] text-muted-foreground uppercase tracking-tight mt-0.5 font-bold">Console Centrale</p>
          </div>
        </div>

        {pathname === '/dashboard' ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center border border-border bg-background/50 hover:bg-primary/5 hover:text-primary gap-2 h-11 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all active:scale-95 cursor-pointer">
              <Menu className="w-4 h-4 text-primary animate-pulse" />
              <span>Menu Global</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px] p-2 rounded-2xl border border-border bg-popover/90 backdrop-blur-xl shadow-2xl z-50">
              <DropdownMenuGroup className="space-y-1">
                <DropdownMenuLabel className="px-3 pt-3 pb-1">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Modules d'application</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60 mx-1 mb-2" />
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 font-bold",
                        isActive 
                          ? "bg-primary/10 text-primary border-l-4 border-primary font-black" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("w-4.5 h-4.5", isActive ? "text-primary scale-105" : "text-muted-foreground")} />
                      <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-border/60 mx-1 my-2" />
              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/profile')}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-muted-foreground font-bold hover:bg-muted hover:text-foreground",
                  (pathname as string) === '/dashboard/profile' && "bg-primary/10 text-primary border-l-4 border-primary"
                )}
              >
                <Users className="w-4.5 h-4.5" />
                <span className="text-[10px] uppercase tracking-wider">Mon Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onLogout}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all text-rose-500 font-bold hover:bg-rose-500/10"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span className="text-[10px] uppercase tracking-wider">Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center border border-border bg-background/50 hover:bg-primary/5 hover:text-primary h-11 w-11 rounded-xl shadow-sm cursor-pointer"
          >
            <Menu className="w-4.5 h-4.5" />
          </Button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-[11px] font-bold tracking-widest uppercase pl-4 border-l border-border/40">
          <span className="text-foreground">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher des paramètres..." 
            className="w-[300px] h-11 pl-11 bg-muted/40 border-border focus:border-primary/30 transition-all text-sm rounded-full placeholder:text-muted-foreground/60" 
          />
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative group text-muted-foreground hover:text-primary transition-colors h-11 w-11 rounded-xl">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background animate-pulse" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode} 
            className="relative group text-muted-foreground hover:text-primary transition-colors h-11 w-11 rounded-xl"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-muted-foreground group-hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
            )}
          </Button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex items-center gap-3 hover:bg-muted p-1.5 pl-1.5 pr-4 rounded-2xl border border-border/50 transition-all glass")}>
            <Avatar className="w-8 h-8 rounded-xl ring-2 ring-primary/20">
              <AvatarImage src={user?.profile_picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} />
              <AvatarFallback>{user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}</AvatarFallback>
            </Avatar>
            <div className="text-left leading-tight">
              <div className="text-[11px] font-bold tracking-tight">{user?.name || 'Utilisateur'}</div>
              <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{user?.role || 'Rôle'}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass border-border w-64 p-2 rounded-2xl shadow-2xl">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-serif italic text-lg px-4 pt-4 pb-2">Profile Core</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border mx-2" />
              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/profile')}
                className="p-3 rounded-xl hover:bg-primary/10 hover:text-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Mon Profil</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onLogout} 
                className="p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Log Out</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
