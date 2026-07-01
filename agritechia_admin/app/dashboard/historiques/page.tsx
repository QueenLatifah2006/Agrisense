'use client';

import React from 'react';
import { 
  ArrowLeft,
  Calendar,
  Search,
  SlidersHorizontal,
  Sprout,
  UserPlus,
  AlertTriangle,
  History,
  TrendingUp,
  X,
  FileText,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  category: 'crop' | 'user' | 'alert';
  date: Date;
  icon: any;
  color: string;
  metadata: {
    author?: string;
    details?: string;
    type?: string;
    additional?: string;
  };
}

export default function HistoriquesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [allActivities, setAllActivities] = React.useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'crop' | 'user' | 'alert'>('all');
  const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>('desc');
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityItem | null>(null);

  React.useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch crops
        let cropsData: any[] = [];
        try {
          const resCrops = await fetch('/api/crops', { headers });
          if (resCrops.ok) {
            cropsData = await resCrops.json();
          }
        } catch (e) {
          console.error("Error fetching crops for history:", e);
        }

        // 2. Fetch users
        let usersData: any[] = [];
        try {
          const resUsers = await fetch('/api/auth/users', { headers });
          if (resUsers.ok) {
            usersData = await resUsers.json();
          }
        } catch (e) {
          console.error("Error fetching users for history:", e);
        }

        // 3. Build events for last 3 months
        const rawActivities: ActivityItem[] = [];
        const now = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Process User creation events
        usersData.forEach((u: any, idx: number) => {
          const createDate = new Date(u.created_at || now);
          if (createDate >= ninetyDaysAgo) {
            rawActivities.push({
              id: `ACT-USER-${u.id || idx}`,
              title: `Nouvel Utilisateur : ${u.name || u.email}`,
              desc: `Inscription d'un nouvel utilisateur dans l'application.`,
              category: 'user',
              date: createDate,
              icon: UserPlus,
              color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              metadata: {
                author: 'Système AgriSense',
                details: `Email : ${u.email}`,
                type: `Rôle : ${u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Administrateur' : 'Agriculteur'}`,
                additional: `Créé le : ${createDate.toLocaleString('fr-FR')}`
              }
            });
          }
        });

        // Process Crop creation and potential level alerts
        cropsData.forEach((c: any, idx: number) => {
          const cropDate = new Date(c.created_at || c.planting_date || now);
          
          if (cropDate >= ninetyDaysAgo) {
            // New crop entry log
            rawActivities.push({
              id: `ACT-CROP-ADD-${c.id || idx}`,
              title: `Culture enregistrée : ${c.name}`,
              desc: `Saisie d'un nouveau lot de culture en plein champ.`,
              category: 'crop',
              date: cropDate,
              icon: Sprout,
              color: 'text-primary bg-primary/10 border-primary/20',
              metadata: {
                author: 'Saisie Opérateur',
                details: `Catégorie : ${c.type || 'Non spécifié'}`,
                type: `Secteur : ${c.variety || 'Zone standard'}`,
                additional: `Date de semis : ${c.planting_date ? new Date(c.planting_date).toLocaleDateString('fr-FR') : 'Non renseignée'}`
              }
            });

            // If crop has warning/critical alerts
            if (c.status === 'Alert' || c.status === 'Critical' || c.status === 'Critical/Alert') {
              const alertDate = new Date(cropDate.getTime() + 1000 * 60 * 60 * 4); // Simulate offset alert time 4 hours later
              if (alertDate >= ninetyDaysAgo && alertDate <= now) {
                rawActivities.push({
                  id: `ACT-CROP-ALERT-${c.id || idx}`,
                  title: `Alerte Sanitaire : ${c.name}`,
                  desc: `Un seuil critique de santé ou d'arrosage a déclenché une alerte.`,
                  category: 'alert',
                  date: alertDate,
                  icon: AlertTriangle,
                  color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                  metadata: {
                    author: 'Calculateur IA AgriSense',
                    details: `Niveau de sévérité : ${c.status === 'Critical' ? 'CRITIQUE (Action requise immédiate)' : 'AVERTISSEMENT'}`,
                    type: `Anomalie observée sur le lot ${c.name}.`,
                    additional: `Vérification requise dans le secteur ${c.variety || 'Zone locale'}`
                  }
                });
              }
            }
          }
        });

        // Sort initially by date desc
        rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
        setAllActivities(rawActivities);

      } catch (err) {
        console.error("Error loading operational intelligence histories:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Filter & Search Logic
  const filteredActivities = React.useMemo(() => {
    let result = [...allActivities];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(act => act.category === filterType);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(act => 
        act.title.toLowerCase().includes(q) || 
        act.desc.toLowerCase().includes(q) ||
        (act.metadata.details && act.metadata.details.toLowerCase().includes(q)) ||
        (act.metadata.type && act.metadata.type.toLowerCase().includes(q))
      );
    }

    // Sort Order
    result.sort((a, b) => {
      const timeA = a.date.getTime();
      const timeB = b.date.getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [allActivities, searchQuery, filterType, sortOrder]);

  // Statistics calculation for last 3 months
  const stats = React.useMemo(() => {
    const cropsCount = allActivities.filter(a => a.category === 'crop').length;
    const usersCount = allActivities.filter(a => a.category === 'user').length;
    const alertsCount = allActivities.filter(a => a.category === 'alert').length;
    return {
      total: allActivities.length,
      cropsCount,
      usersCount,
      alertsCount
    };
  }, [allActivities]);

  const getActivityAgeString = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      const diffMs = today.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      if (diffMins < 60) {
        return diffMins <= 5 ? "À l'instant" : `Il y a ${diffMins} min`;
      } else {
        return `Il y a ${diffHrs} h`;
      }
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return `Le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto w-full">
      
      {/* Upper Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/dashboard')}
            className="border-border rounded-xl w-10 h-10 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h1 className="text-3xl font-bold text-foreground tracking-tight font-sans">Historiques</h1>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Audit log & flux complet des activités des 3 derniers mois</p>
          </div>
        </div>
        <Badge variant="outline" className="self-start sm:self-center py-1.5 px-3 bg-primary/10 text-primary uppercase text-[10px] tracking-widest font-black border-primary/20 rounded-lg">
          Période : Glissante 90 Jours
        </Badge>
      </div>

      {/* Audit Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border rounded-xl shadow-xl border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mb-1">Total Logs Activités</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{isLoading ? "..." : stats.total}</span>
              <span className="text-xs text-muted-foreground">actions</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-xl shadow-xl border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mb-1">Nouveaux Utilisateurs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400">{isLoading ? "..." : stats.usersCount}</span>
              <span className="text-xs text-muted-foreground">inscriptions</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-xl shadow-xl border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mb-1">Cultures Enregistrées</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{isLoading ? "..." : stats.cropsCount}</span>
              <span className="text-xs text-muted-foreground">lots</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border rounded-xl shadow-xl border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mb-1">Alertes Déclenchées</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-400">{isLoading ? "..." : stats.alertsCount}</span>
              <span className="text-xs text-muted-foreground">anomalies</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Tools Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between p-4 bg-card/60 rounded-2xl border border-border">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une activité, un lot, une adresse..."
            className="pl-10 h-11 rounded-xl border-border bg-muted/30 focus:bg-background transition-all"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-muted p-1 rounded-xl border border-border">
            <Button 
              size="sm" 
              variant={filterType === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilterType('all')}
              className={cn("rounded-lg text-[10px] uppercase tracking-wider font-bold h-8 px-4", filterType === 'all' && 'shadow-md')}
            >
              Tous
            </Button>
            <Button 
              size="sm" 
              variant={filterType === 'crop' ? 'default' : 'ghost'}
              onClick={() => setFilterType('crop')}
              className={cn("rounded-lg text-[10px] uppercase tracking-wider font-bold h-8 px-4", filterType === 'crop' && 'shadow-md')}
            >
              Cultures
            </Button>
            <Button 
              size="sm" 
              variant={filterType === 'user' ? 'default' : 'ghost'}
              onClick={() => setFilterType('user')}
              className={cn("rounded-lg text-[10px] uppercase tracking-wider font-bold h-8 px-4", filterType === 'user' && 'shadow-md')}
            >
              Utilisateurs
            </Button>
            <Button 
              size="sm" 
              variant={filterType === 'alert' ? 'default' : 'ghost'}
              onClick={() => setFilterType('alert')}
              className={cn("rounded-lg text-[10px] uppercase tracking-wider font-bold h-8 px-4", filterType === 'alert' && 'shadow-md')}
            >
              Alertes
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="border-border hover:bg-muted font-mono text-[10px] uppercase tracking-widest font-black h-9 rounded-xl px-4 flex gap-2"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            Tri : {sortOrder === 'desc' ? "Récent d'abord" : "Ancien d'abord"}
          </Button>
        </div>
      </div>

      {/* Main Timeline Card or List */}
      <Card className="bg-card border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/25 flex items-center justify-between">
          <CardTitle className="text-md uppercase tracking-widest text-muted-foreground font-black flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Journal Opérationnel
          </CardTitle>
          <span className="text-[10px] text-muted-foreground font-mono">Affichage de {filteredActivities.length} logs</span>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analyse du stockage journalier...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif italic text-lg text-foreground">Aucune correspondance trouvée</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">Essayez d'ajuster vos filtres de filtrage ou de modifier le texte de recherche.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredActivities.map((item, idx) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedActivity(item)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 hover:bg-muted/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className={cn("w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                        <Badge variant="outline" className="text-[8px] font-mono tracking-tighter opacity-70 border-border uppercase">
                          {item.id}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-1">{item.desc}</p>
                      
                      {/* Timeline brief tags */}
                      <div className="flex flex-wrap gap-4 mt-2.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        {item.metadata.author && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-muted-foreground/75" />
                            {item.metadata.author}
                          </span>
                        )}
                        {item.metadata.details && (
                          <span className="truncate max-w-xs">{item.metadata.details}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Relative date on right */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 md:text-right border-t md:border-t-0 border-border/10 pt-3 md:pt-0">
                    <span className="text-xs font-semibold text-foreground bg-muted md:bg-transparent px-2 py-1 md:p-0 rounded-md select-none">
                      {getActivityAgeString(item.date)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono opacity-50 tracking-tighter uppercase select-none">
                      {item.date.toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Side-Drawer/Modal dialog */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setSelectedActivity(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center", selectedActivity.color)}>
                  <selectedActivity.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{selectedActivity.id}</div>
                  <h3 className="text-xl font-bold text-foreground mt-0.5">{selectedActivity.title}</h3>
                </div>
              </div>

              <div className="p-5 bg-muted/40 rounded-2xl border border-border">
                <p className="text-sm font-medium text-foreground tracking-tight leading-relaxed">{selectedActivity.desc}</p>
              </div>

              {/* Interactive Audit parameters */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Paramètres de l'action</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                    <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Émetteur</span>
                    <span className="text-xs font-semibold text-foreground mt-1 block">{selectedActivity.metadata.author || 'Inconnu'}</span>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl border border-border/50">
                    <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Date & Heure</span>
                    <span className="text-xs font-semibold text-foreground mt-1 block">{selectedActivity.date.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-xl border border-border/50 col-span-2">
                    <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Identifiants et détails</span>
                    <span className="text-xs font-semibold text-foreground mt-1 block">{selectedActivity.metadata.details || 'Aucune information technique supplémentaire'}</span>
                  </div>
                  {selectedActivity.metadata.type && (
                    <div className="p-4 bg-muted/20 rounded-xl border border-border/50 col-span-2">
                      <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Spécificités techniques</span>
                      <span className="text-xs font-semibold text-foreground mt-1 block">{selectedActivity.metadata.type}</span>
                    </div>
                  )}
                  {selectedActivity.metadata.additional && (
                    <div className="p-4 bg-muted/20 rounded-xl border border-border/50 col-span-2">
                      <span className="block text-[9px] text-muted-foreground font-black uppercase tracking-wider">Historique & Contexte</span>
                      <span className="text-xs font-semibold text-foreground mt-1 block">{selectedActivity.metadata.additional}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button or Secondary link */}
              <div className="flex gap-3 pt-4 border-t border-border">
                {selectedActivity.category === 'crop' && (
                  <Button 
                    onClick={() => {
                      router.push('/dashboard/crops');
                      setSelectedActivity(null);
                    }}
                    className="flex-1 bg-primary text-primary-foreground rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest gap-2"
                  >
                    Aller au lot <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
                {selectedActivity.category === 'user' && (
                  <Button 
                    onClick={() => {
                      router.push('/dashboard/users');
                      setSelectedActivity(null);
                    }}
                    className="flex-1 bg-primary text-primary-foreground rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest gap-2"
                  >
                    Gérer Utilisateurs <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedActivity(null)}
                  className="flex-1 border-border rounded-xl h-11 font-bold text-[10px] uppercase tracking-widest hover:bg-muted"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
