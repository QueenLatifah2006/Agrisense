'use client';

import React from 'react';
import { 
  Settings, 
  Cpu, 
  Database, 
  Cloud, 
  Terminal,
  Zap,
  Globe,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-serif italic tracking-tight text-gradient">System Core</h1>
        <p className="text-muted-foreground font-medium">Configuration globale du Kernel AgriSense et des couches de traitement IA.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> Architecture IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { title: "Moteur de Prédiction", desc: "Utiliser Gemini 1.5 Pro pour les analyses complexes.", status: true },
              { title: "Traitement Temps Réel", desc: "Latence réduite pour les notifications de capteurs.", status: true },
              { title: "Mode Debugging Neural", desc: "Exportation des logs bruts pour analyse technique.", status: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm">{item.title}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass border-border rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-secondary" /> Stockage & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
              <div className="space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Utilisation Node</div>
                <div className="text-2xl font-bold">42.8 GB / 100 GB</div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">42%</Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span>Auto-Sync Cloud</span>
                <Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] border-border gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Purger le Cache
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border rounded-[2.5rem] md:col-span-2 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Connectivité Locale
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-4">
              {['Secteur A1 - Online', 'Secteur B2 - Syncing', 'Node-Central - Primary'].map((node, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {node}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
