'use client';

import React from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Signal, 
  Battery, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Search,
  Filter,
  Thermometer,
  CloudRain,
  Sun,
  Droplets
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SensorNode {
  id: string;
  type: 'Environmental' | 'Soil' | 'Water' | 'Weather';
  location: string;
  battery: number;
  signal: number;
  status: 'Online' | 'Offline' | 'Low Battery';
  lastPing: string;
  readings: { label: string; value: string; icon: any }[];
}

const SENSORS: SensorNode[] = [
  { 
    id: 'NODE-A1-01', 
    type: 'Environmental', 
    location: 'Sector A1 - North Gate', 
    battery: 84, 
    signal: 92, 
    status: 'Online', 
    lastPing: '30s ago',
    readings: [
      { label: 'Temp', value: '26.4°C', icon: Thermometer },
      { label: 'Humidity', value: '54%', icon: Droplets }
    ]
  },
  { 
    id: 'NODE-B2-04', 
    type: 'Soil', 
    location: 'Sector B2 - High Slope', 
    battery: 12, 
    signal: 45, 
    status: 'Low Battery', 
    lastPing: '5m ago',
    readings: [
      { label: 'Moisture', value: '28%', icon: CloudRain },
      { label: 'pH', value: '6.4', icon: Activity }
    ]
  },
  { 
    id: 'NODE-C1-12', 
    type: 'Weather', 
    location: 'Central Station', 
    battery: 100, 
    signal: 98, 
    status: 'Online', 
    lastPing: '2s ago',
    readings: [
      { label: 'Wind', value: '14km/h', icon: Sun },
      { label: 'Rain', value: '0.0mm', icon: CloudRain }
    ]
  },
  { 
    id: 'NODE-D4-09', 
    type: 'Soil', 
    location: 'Sector D4 - Riverside', 
    battery: 0, 
    signal: 0, 
    status: 'Offline', 
    lastPing: '2h ago',
    readings: [
      { label: 'Moisture', value: '--', icon: CloudRain },
      { label: 'pH', value: '--', icon: Activity }
    ]
  },
];

export const SensorsGrid = () => {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight">Matrice des Capteurs IoT</h2>
          <p className="text-muted-foreground max-w-2xl mt-1">
            Ce tableau de bord centralise toutes les données brutes provenant de votre infrastructure matérielle. 
            Il permet de monitorer l'état de santé des noeuds, la puissance du signal et les relevés télémétriques 
            en temps réel pour prévenir toute défaillance technique.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none border-border hover:bg-muted gap-2">
            <MapIcon className="w-4 h-4" /> View Map
          </Button>
          <Button className="flex-1 md:flex-none gap-2 bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20">
            <RefreshCw className="w-4 h-4" /> Force Sync
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search nodes by ID or location..." className="pl-10 h-11 glass border-border" />
        </div>
        <Button variant="outline" className="h-11 border-border glass">
          <Filter className="w-4 h-4 mr-2" /> All Types
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {SENSORS.map((node) => (
          <Card key={node.id} className={`glass overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-secondary/5 group ${
            node.status === 'Offline' ? 'opacity-70 grayscale-[0.5]' : ''
          }`}>
            <CardHeader className="p-5 pb-0">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                  <Signal className={`w-5 h-5 ${node.status === 'Online' ? 'text-secondary' : 'text-muted-foreground'}`} />
                </div>
                <Badge variant="outline" className={`font-mono text-[10px] tracking-widest ${
                  node.status === 'Online' ? 'text-secondary border-secondary/20' : 
                  node.status === 'Low Battery' ? 'text-amber-400 border-amber-500/20' : 'text-muted-foreground border-border'
                }`}>
                  {node.status.toUpperCase()}
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{node.id}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <MapIcon className="w-3 h-3" />
                {node.location}
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {node.readings.map((reading, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <reading.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{reading.label}</span>
                    </div>
                    <span className="text-lg font-bold font-mono tracking-tight">{reading.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 tooltip" title={`Battery: ${node.battery}%`}>
                    <Battery className={`w-4 h-4 ${
                      node.battery < 20 ? 'text-rose-500 animate-pulse' : 
                      node.battery < 50 ? 'text-amber-400' : 'text-secondary'
                    }`} />
                    <span className="text-xs font-mono">{node.battery}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-mono">{node.signal}%</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{node.lastPing}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Network Overview */}
      <Card className="glass p-6 bg-gradient-to-br from-muted/20 to-transparent">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-xl font-serif italic tracking-tight">Signal Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Stable Nodes', value: 88, color: 'bg-secondary' },
                { label: 'Unstable / Weak Signal', value: 8, color: 'bg-amber-500' },
                { label: 'Critical / Disconnected', value: 4, color: 'bg-rose-500' },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{item.label}</span>
                    <span className="text-foreground">{item.value}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                      className={`${item.color} h-full rounded-full shadow-[0_0_10px_rgba(var(--primary-foreground),0.1)]`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-none flex flex-col items-center justify-center p-8 rounded-3xl bg-primary/10 border border-primary/20 aspect-square w-48 emerald-glow">
            <Signal className="w-12 h-12 text-primary mb-2" />
            <span className="text-3xl font-black text-primary">94.2</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary/70">Global Connectivity</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
