'use client';

import React, { useState, useEffect } from 'react';

import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Clock, 
  Layers, 
  Activity, 
  Sparkles,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  Percent,
  TrendingDown,
  Info,
  X,
  Plus,
  Compass,
  ArrowRight,
  FileText,
  Printer
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter, ZAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const CameroonMap = dynamic(() => import('@/components/CameroonMap'), { ssr: false });

// AGRICULTURES PRESETS
const CROPS_PRESETS = [
  { id: 'mais', name: 'Maïs Jaune', type: 'Céréales', basePrice: 420, trend: '+4.2%' },
  { id: 'manioc', name: 'Manioc Doux', type: 'Maraîchage', basePrice: 300, trend: '-1.5%' },
  { id: 'cafe', name: 'Café Arabica', type: 'Exportation', basePrice: 1100, trend: '+8.7%' },
  { id: 'sorgho', name: 'Sorgho Rouge', type: 'Céréales', basePrice: 380, trend: '+0.8%' },
  { id: 'igname', name: 'Igname Bêtê-Bêtê', type: 'Maraîchage', basePrice: 500, trend: '-2.1%' }
];

const ZONES_PRESETS = [
  { id: 'extreme_nord', name: 'Extrême-Nord (Maroua)', coefficient: 0.82, colorClass: 'fill-rose-100 hover:fill-rose-200 dark:fill-rose-950/20' },
  { id: 'nord', name: 'Nord (Garoua)', coefficient: 0.85, colorClass: 'fill-rose-200 hover:fill-rose-300 dark:fill-rose-900/20' },
  { id: 'adamaoua', name: 'Adamaoua (Ngaoundéré)', coefficient: 0.92, colorClass: 'fill-rose-250 hover:fill-rose-350 dark:fill-rose-850/20' },
  { id: 'nord_ouest', name: 'Nord-Ouest (Bamenda)', coefficient: 0.94, colorClass: 'fill-rose-300 hover:fill-rose-400 dark:fill-rose-900/30' },
  { id: 'ouest', name: 'Ouest (Bafoussam)', coefficient: 0.90, colorClass: 'fill-rose-350 hover:fill-rose-450 dark:fill-rose-850/30' },
  { id: 'sud_ouest', name: 'Sud-Ouest (Buea)', coefficient: 1.05, colorClass: 'fill-rose-300 hover:fill-rose-400 dark:fill-rose-800/30' },
  { id: 'littoral', name: 'Littoral (Douala)', coefficient: 1.18, colorClass: 'fill-rose-500 hover:fill-rose-600 dark:fill-rose-750/30' },
  { id: 'centre', name: 'Centre (Yaoundé)', coefficient: 1.12, colorClass: 'fill-rose-450 hover:fill-rose-550 dark:fill-rose-800/30' },
  { id: 'est', name: 'Est (Bertoua)', coefficient: 0.98, colorClass: 'fill-rose-400 hover:fill-rose-500 dark:fill-rose-800/30' },
  { id: 'sud', name: 'Sud (Ebolowa)', coefficient: 1.15, colorClass: 'fill-rose-550 hover:fill-rose-650 dark:fill-rose-700/30' }
];

const CAMEROON_CITIES = [
  { id: 'maroua', name: 'Maroua (Extrême-Nord)', x: 104, y: 25, multiplier: 0.82, desc: 'Grand marché céréalier sahélien (sorgho, mil).' },
  { id: 'garoua', name: 'Garoua (Nord)', x: 105, y: 58, multiplier: 0.85, desc: 'Bassin d\'approvisionnement fluvial lourd.' },
  { id: 'ngaoundere', name: 'Ngaoundéré (Adamaoua)', x: 112, y: 95, multiplier: 0.92, desc: 'Carrefour de transit bétail et tubercules.' },
  { id: 'bamenda', name: 'Bamenda (Nord-Ouest)', x: 65, y: 118, multiplier: 0.94, desc: 'Terres arables des hauts-plateaux.' },
  { id: 'bafoussam', name: 'Bafoussam (Ouest)', x: 66, y: 136, multiplier: 0.90, desc: 'Bassin maraîcher d\'excellence à fort rendement.' },
  { id: 'buea', name: 'Buea (Sud-Ouest)', x: 38, y: 142, multiplier: 1.05, desc: 'Zone côtière fertile, cultures d\'exportation.' },
  { id: 'yaounde', name: 'Yaoundé (Centre)', x: 92, y: 160, multiplier: 1.12, desc: 'Capitale politique à forte densité urbaine.' },
  { id: 'douala', name: 'Douala (Littoral)', x: 45, y: 170, multiplier: 1.18, desc: 'Grand port et pôle de consommation logistique.' },
  { id: 'bertoua', name: 'Bertoua (Est)', x: 135, y: 144, multiplier: 0.98, desc: 'Zone forestière de transition agropastorale.' },
  { id: 'ebolowa', name: 'Ebolowa (Sud)', x: 78, y: 188, multiplier: 1.15, desc: 'Bassin de production de cacao d\'excellence.' }
];

const MARKETS_PRESETS = [
  { id: 'gros', name: 'Marché de Gros', bonus: -20, percentShare: 50 },
  { id: 'central', name: 'Marché Central', bonus: 10, percentShare: 25 },
  { id: 'gouro', name: 'Marché Gouro', bonus: 25, percentShare: 15 },
  { id: 'cocody', name: 'Marché de Cocody', bonus: 40, percentShare: 10 }
];

const MARKETS_BY_ZONE: Record<string, string[]> = {
  'centre': ['Marché du Mfoundi', "Marché d'Essos", 'Marché 8ème', 'Marché Mokolo', "Marché d'Acacia"],
  'littoral': ['Marché Mboppi', 'Marché Sandaga', 'Marché Dakar', 'Marché de Bonassama', 'Marché Central'],
  'nord': ['Marché Central', 'Marché de Yelwa'],
  'extreme_nord': ['Marché Central', 'Marché Abattoir'],
  'ouest': ['Marché de Casablanca', 'Marché A', 'Marché B'],
  'nord_ouest': ['Nkwen Market', 'Main Market', 'Food Market'],
  'adamaoua': ['Marché Central', 'Petit Marché'],
  'sud_ouest': ['Marché Central'],
  'est': ['Marché Central'],
  'sud': ['Marché Central']
};

const PERIODS_PRESETS = [
  { id: '7d', label: 'Derniers 7 Jours', sub: 'Période active' },
  { id: '30d', label: 'Mois Dernier', sub: 'Maternité données' },
  { id: '90d', label: 'Dernier Trimestre', sub: 'Calcul macro' },
  { id: '180d', label: 'Dernier Semestre', sub: 'Moyenne historique' }
];

export default function DashboardOverview() {
  // Filter States - matching Image 1 left filter inputs and states
  const [selectedCrop, setSelectedCrop] = useState<any>({ id: 'dummy', name: 'Maïs Jaune', type: 'Céréales', basePrice: 420, trend: '+4.2%' });
  const [selectedZone, setSelectedZone] = useState(ZONES_PRESETS[7]);
  const [selectedMarket, setSelectedMarket] = useState(MARKETS_PRESETS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS_PRESETS[0]);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  
  // Hover & Tooltip variables
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [hoveredDemandPoint, setHoveredDemandPoint] = useState<any | null>(null);
  const [hoveredCity, setHoveredCity] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // DB and live AI state variables
  const [dbCrops, setDbCrops] = useState<any[]>([]);
  const [dbMarkets, setDbMarkets] = useState<any[]>(MARKETS_PRESETS);
  const [realPrices, setRealPrices] = useState<any[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Dynamic Market Filtering
  const currentZoneName = selectedZone?.name?.split(' (')[0];
  const cityNameMatch = selectedZone?.name?.match(/\((.*?)\)/);
  const currentCityName = cityNameMatch ? cityNameMatch[1] : '';
  
  const filteredDbMarkets = dbMarkets.filter(m => m.zone === currentZoneName || m.zone === currentCityName);
  const validMarketsForZone = MARKETS_BY_ZONE[selectedZone?.id] || [];
  
  const displayMarkets = filteredDbMarkets.length > 0 ? filteredDbMarkets : (
    validMarketsForZone.length > 0 
      ? validMarketsForZone.map((m, idx) => ({ id: `default-${idx}`, name: m, bonus: 0, percentShare: 0 }))
      : dbMarkets
  );

  useEffect(() => {
    if (displayMarkets.length > 0 && selectedMarket) {
      const isCurrentValid = displayMarkets.find((m: any) => m.id === selectedMarket.id);
      if (!isCurrentValid) {
        setSelectedMarket(displayMarkets[0]);
      }
    }
  }, [selectedZone?.id, displayMarkets, selectedMarket]);

  // Stats Counters
  const [counters, setCounters] = useState({
    sessions: 1455,
    users: 1446,
    loading: false
  });

  // Weekly generation states
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  // Auto-mode and Countdown variables
  const [isAutoSchedulerActive, setIsAutoSchedulerActive] = useState(true);
  const [secondsUntilAutoTrigger, setSecondsUntilAutoTrigger] = useState(8);
  const [hasTriggeredAuto, setHasTriggeredAuto] = useState(false);
  const [showAutoAlert, setShowAutoAlert] = useState(false);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [advancedChartsData, setAdvancedChartsData] = useState<any>(null);

  // Get combined crops list (database crops strictly)
  const CROPS_LIST_ALL = dbCrops.length > 0 ? dbCrops : [{ id: 'dummy', name: 'Maïs Jaune', type: 'Céréales', basePrice: 420, trend: '+4.2%' }];

  // Fetch real crops from PostgreSQL database
  // Côté Frontend : Dans l'useEffect de chargement de app/dashboard/page.tsx
useEffect(() => {
  const fetchDbCrops = async () => {
    try {
      // Récupération du token JWT stocké lors du login
      const token = localStorage.getItem('token');
      const response = await fetch('/api/crops', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.warn("Session expirée ou non autorisée");
        // Rediriger vers le login si nécessaire
        return;
      }

      if (response.ok) {
        const crops = await response.json();
        // Si on a des cultures, on les map pour le select en évitant les doublons
        if (crops.length > 0) {
          const uniqueCropsMap = new Map();
          crops.forEach((c: any) => {
            const normalizedId = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
            if (!uniqueCropsMap.has(normalizedId)) {
              uniqueCropsMap.set(normalizedId, {
                id: normalizedId,
                name: c.name,
                type: c.type || 'Non spécifié',
                basePrice: Number(c.price) || 0,
                trend: '+0.0%'
              });
            }
          });
          const mappedCrops = Array.from(uniqueCropsMap.values());
          setDbCrops(mappedCrops);
          setSelectedCrop(mappedCrops[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching db crops:", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/dashboard-stats', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
        
        if (data.markets && data.markets.length > 0) {
          const mappedMarkets = data.markets.map((m: any, i: number) => ({
            id: `market-${i}`,
            name: m.market,
            zone: m.zone,
            bonus: 0,
            percentShare: Math.round(100 / data.markets.length),
            coords: m.coords
          }));
          setDbMarkets(mappedMarkets);
        }
        
        // Update counters
        let totalSessions = 0;
        data.sessions?.forEach((s: any) => totalSessions += Number(s.count));
        
        let totalUsers = 0;
        data.users?.forEach((u: any) => totalUsers += Number(u.count));
        
        const valTotal = (data.validation?.validated || 0) + (data.validation?.pending || 0);
        const valRate = valTotal > 0 ? ((data.validation?.validated || 0) / valTotal) * 100 : 0;
        
        setCounters(prev => ({
          ...prev,
          sessions: totalSessions,
          sessionsTrend: '+0.0%', // Could calculate trend based on previous week
          validation: parseFloat(valRate.toFixed(1)),
          validationTrend: '+0.0%',
          users: totalUsers,
          usersTrend: '+0.0%'
        }));
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  fetchDbCrops();
  fetchDashboardStats();
}, []);

// Effet pour recharger les données des graphiques avancés quand la culture change
useEffect(() => {
  const fetchAdvancedCharts = async () => {
    try {
      const token = localStorage.getItem('token');
      const cropQuery = selectedCrop.name && selectedCrop.name !== 'dummy' ? `?crop=${encodeURIComponent(selectedCrop.name)}` : '';
      const response = await fetch(`http://localhost:3000/api/ai/advanced-charts-stats${cropQuery}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const advData = await response.json();
        setAdvancedChartsData(advData);
      }
    } catch (err) {
      console.error("Error fetching advanced charts:", err);
    }
  };
  
  if (selectedCrop) {
    fetchAdvancedCharts();
  }
}, [selectedCrop]);

  // Fetch live prices datasets using AI backend
  const fetchRealPricesFromAi = async () => {
    setIsAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Extract clean zone name
      const region = selectedZone.name.split(' (')[0];
      const response = await fetch('http://localhost:3000/api/ai/prices-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          culture: selectedCrop.name.split(' (')[0],
          zone: region,
          marche: selectedMarket.name,
          date_debut: dateFrom,
          date_fin: dateTo
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.dataset && result.dataset.length > 0) {
          const mapped = result.dataset.map((dp: any) => {
            const dateObj = new Date(dp.date);
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : dp.date;
            const formattedTime = !isNaN(dateObj.getTime()) && dateObj.toISOString().includes('T') && !dateObj.toISOString().endsWith('T00:00:00.000Z')
              ? dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '12:00'; // Fallback noon if no specific time

            return {
              timestamp: !isNaN(dateObj.getTime()) ? dateObj.getTime() : 0,
              dateStr: `${formattedDate} à ${formattedTime}`,
              price: Number(dp.prix_moyen_fcfa_kg),
              source: dp.source || 'IA',
              volatilityIndex: dp.nb_sources > 2 ? 'Stable' : 'Élevée',
              volume: Math.round(150 + (dp.nb_sources || 1) * 35 + Math.random() * 50)
            };
          }).filter((dp: any) => dp.timestamp > 0);
          setRealPrices(mapped);
          setToastMessage(`IA connectée : Données de prix réelles chargées pour ${selectedCrop.name} !`);
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch real AI prices:', error);
    } finally {
      setIsAiLoading(false);
    }
    setRealPrices(null);
  };

  useEffect(() => {
    fetchRealPricesFromAi();
  }, [selectedCrop.id, selectedZone.id, selectedMarket.id, dateFrom, dateTo]);

  // Countdown clock effect for Cameroon weekly reports
  useEffect(() => {
    if (!isAutoSchedulerActive || hasTriggeredAuto || showWeeklyReport) return;

    const interval = setInterval(() => {
      setSecondsUntilAutoTrigger((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setHasTriggeredAuto(true);
          setShowAutoAlert(true);
          // Auto run weekly analysis block
          handleGenerateWeeklyReports();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSchedulerActive, hasTriggeredAuto, showWeeklyReport]);

  const handleGenerateWeeklyReports = () => {
    setIsGeneratingWeekly(true);
    setWeeklyProgress(0);
    setShowWeeklyReport(false);
    
    // Animate a professional progress calculation
    const timer = setInterval(() => {
      setWeeklyProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsGeneratingWeekly(false);
          setShowWeeklyReport(true);
          setToastMessage("Synthèses hebdomadaires et graphiques générés !");
          setTimeout(() => setToastMessage(null), 3000);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handlePrintReport = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - (margin * 2); // 180mm
      
      let cursorY = 20;

      // Helper function to draw elegant headers on each page
      const drawHeaderFooter = () => {
        doc.setFillColor(211, 47, 47); // crimson
        doc.rect(margin, cursorY, 4, 11, 'F');
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 110, 120);
        doc.text("METEO DES PRIX AGRICOLES — BILAN SYNTHÉTIQUE", margin + 6, cursorY + 4);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} | Page ${doc.getNumberOfPages()}`, pageWidth - margin, cursorY + 4, { align: 'right' });
        
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.3);
        doc.line(margin, cursorY + 8, pageWidth - margin, cursorY + 8);
        
        cursorY += 16;
      };

      const checkSpace = (requiredSpace: number) => {
        if (cursorY + requiredSpace > pageHeight - margin) {
          doc.addPage();
          cursorY = 15;
          drawHeaderFooter();
        }
      };

      // PAGE 1: Intro + Primary Indicators
      drawHeaderFooter();

      // Title Card Panel Block
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY, usableWidth, 26, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(margin, cursorY, usableWidth, 26, 'S');

      doc.setFillColor(211, 47, 47);
      doc.rect(margin, cursorY, 2, 26, 'F');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate 900
      doc.text("RAPPORT MENSUALISÉ D'EXPERTISES ET SYNTHÈSES HEBDO", margin + 6, cursorY + 8);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Culture auditée : ${selectedCrop.name} (${selectedCrop.type})  |  Zone Géographique : ${selectedZone.name}`, margin + 6, cursorY + 15);
      doc.text(`Réseau logistique de vente : ${selectedMarket.name}  |  Période du relevé : ${selectedPeriod.label}`, margin + 6, cursorY + 21);

      cursorY += 34;

      // Subsection I: Section heading
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(211, 47, 47);
      doc.text("I. COURS CHIMIQUE ET METRIQUES SYNTHETIQUES", margin, cursorY);
      cursorY += 5;

      // Draw Key Performance Indicators block
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(219, 223, 230);
      doc.setLineWidth(0.3);
      doc.rect(margin, cursorY, usableWidth, 22, 'FD');

      // Table Partition Vertical separators
      doc.line(margin + 60, cursorY, margin + 60, cursorY + 22);
      doc.line(margin + 120, cursorY, margin + 120, cursorY + 22);

      // Metrique 1: Total Average
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 120);
      doc.text("PRIX MOYEN DU KILO", margin + 5, cursorY + 7);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${averagePriceResult} FCFA`, margin + 5, cursorY + 15);

      // Metrique 2: Baseline Model Estimative
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 120);
      doc.text("MODELE THEORIQUE CALIBRÉ", margin + 65, cursorY + 7);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${basePriceValue} FCFA/kg`, margin + 65, cursorY + 15);

      // Metrique 3: Volatility Gap
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 110, 120);
      doc.text("VARIATION HEBDOMADAIRE MOYENNE", margin + 125, cursorY + 7);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(211, 47, 47);
      doc.text(`${weeklyVars.currentWeek > 0 ? '+' : ''}${weeklyVars.currentWeek}%`, margin + 125, cursorY + 15);

      cursorY += 31;

      // Subsection II: Section heading 
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(211, 47, 47);
      doc.text("II. DIAGRAMMES DE STRUCTURE D'EVOLUTION & DE PREVISIONS", margin, cursorY);
      cursorY += 6;

      // Row block 1: Left (Price Structure breakdown) and Right (Volatile Comparison)
      const graphY = cursorY;
      
      // Left box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, graphY, 86, 44, 'F');
      doc.rect(margin, graphY, 86, 44, 'S');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Diagramme 1 : Structure de tarification", margin + 4, graphY + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`- Cours de base garanti : ${valBase} FCFA (${pctBase}%)`, margin + 4, graphY + 14);
      doc.text(`- Indexation de zone (${selectedZone.name}) : +${valRegion} FCFA (${pctRegion}%)`, margin + 4, graphY + 21);
      doc.text(`- Majoration de canal (${selectedMarket.name}) : +${valMarket} FCFA (${pctMarket}%)`, margin + 4, graphY + 28);

      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(0.4);
      doc.line(margin + 4, graphY + 33, margin + 82, graphY + 33);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`MONTANT CONSOLIDÉ : ${valTotal} FCFA par kilo`, margin + 4, graphY + 38);

      // Right box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin + 94, graphY, 86, 44, 'F');
      doc.rect(margin + 94, graphY, 86, 44, 'S');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Diagramme 2 : Écart conjoint de variation", margin + 94 + 4, graphY + 6);

      // Draw bars in PDF matching the Right-Side compare graph
      doc.setFillColor(30, 41, 59); // slate 800
      const b1H = Math.min(22, Math.max(5, Math.abs(weeklyVars.lastWeek) * 2));
      doc.rect(margin + 94 + 16, graphY + 34 - b1H, 16, b1H, 'F');

      doc.setFillColor(211, 47, 47); // red
      const b2H = Math.min(22, Math.max(5, Math.abs(weeklyVars.currentWeek) * 2));
      doc.rect(margin + 94 + 50, graphY + 34 - b2H, 16, b2H, 'F');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${weeklyVars.lastWeek}%`, margin + 94 + 24, graphY + 34 - b1H - 2, { align: 'center' });
      doc.text(`${weeklyVars.currentWeek}%`, margin + 94 + 58, graphY + 34 - b2H - 2, { align: 'center' });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 110, 120);
      doc.text("S. Passée", margin + 94 + 24, graphY + 39, { align: 'center' });
      doc.text("S. Actuelle", margin + 94 + 58, graphY + 39, { align: 'center' });

      cursorY += 51;

      // Row block 2: Middle diagram equivalent (Prediction curve)
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY, usableWidth, 40, 'F');
      doc.rect(margin, cursorY, usableWidth, 40, 'S');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Diagramme 3 : Courbe Prédictive d'Évolution sur 4 mois (${selectedCrop.name})`, margin + 4, cursorY + 6);

      // Draw coordinates grid
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(margin + 12, cursorY + 11, margin + 12, cursorY + 32); // Y
      doc.line(margin + 12, cursorY + 32, margin + 168, cursorY + 32); // X

      // Plot 5 months curve coordinates in PDF
      const pCoords = predictionPoints.map((pt, idx) => {
        const sRange = basePriceValue * 0.4 || 100;
        const mY = cursorY + 30 - ((pt.price - basePriceValue * 0.85) / sRange) * 16;
        return {
          x: margin + 20 + idx * 34,
          y: Math.max(cursorY + 12, Math.min(cursorY + 30, mY)),
          pt
        };
      });

      // Plot line path in vector
      doc.setDrawColor(211, 47, 47);
      doc.setLineWidth(0.5);
      for (let i = 0; i < pCoords.length - 1; i++) {
        doc.line(pCoords[i].x, pCoords[i].y, pCoords[i + 1].x, pCoords[i + 1].y);
      }

      // Plot data dots & labels
      pCoords.forEach((c) => {
        doc.setFillColor(211, 47, 47);
        doc.circle(c.x, c.y, 1.1, 'F');
        
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.2);
        doc.setTextColor(15, 23, 42);
        doc.text(`${c.pt.price}`, c.x, c.y - 2.8, { align: 'center' });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(120, 120, 120);
        doc.text(c.pt.period, c.x, cursorY + 37, { align: 'center' });
      });

      cursorY += 49;

      // SECTION III: The Weekly analysis & graphs (The 4 columns requested)
      checkSpace(15);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(211, 47, 47);
      doc.text("III. CONJONCTURES HEBDOMADAIRES DES COURS", margin, cursorY);
      cursorY += 8;

      const wData = getWeeklyData();

      wData.forEach((week) => {
        // Safe boundary control
        checkSpace(58);

        // Backdrop
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.rect(margin, cursorY, usableWidth, 52, 'FD');

        // Color coding for trends
        let tColorR = 59; // Blue
        let tColorG = 130;
        let tColorB = 246;
        let trendLabel = "STABLE / FERME";

        if (week.trend === 'hausse' || week.trend === 'hausse_max') {
          tColorR = 211; // Red
          tColorG = 47;
          tColorB = 47;
          trendLabel = week.trend === 'hausse_max' ? "HAUSSE CRITIQUE" : "EN REUSSE ACCRUE";
        } else if (week.trend === 'baisse') {
          tColorR = 16;  // Emerald Green
          tColorG = 185;
          tColorB = 129;
          trendLabel = "SOUS REPLI COÛTEUX";
        }

        // Side color stroke
        doc.setFillColor(tColorR, tColorG, tColorB);
        doc.rect(margin, cursorY, 2.2, 52, 'F');

        // Week title header
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.2);
        doc.setTextColor(100, 110, 120);
        doc.text(week.weekName.toUpperCase(), margin + 5, cursorY + 5);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(tColorR, tColorG, tColorB);
        doc.text(`ETAT DE COURS : ${trendLabel}`, pageWidth - margin - 5, cursorY + 5, { align: 'right' });

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(week.title, margin + 5, cursorY + 11);

        // Thin separator
        doc.setDrawColor(241, 245, 249);
        doc.line(margin + 5, cursorY + 15, pageWidth - margin - 5, cursorY + 15);

        // Small sparkline coordinate on the middle-right
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 110, 120);
        doc.text("Courbe hebdomadaire :", margin + 5, cursorY + 22);

        const spX = margin + 45;
        const spY = cursorY + 25;
        const spW = 38;
        const spH = 7;
        const wMin = Math.min(...week.points);
        const wMax = Math.max(...week.points);
        const wRange = (wMax - wMin) || 1;
        const wStepX = spW / (week.points.length - 1);

        const wCoords = week.points.map((p, i) => ({
          x: spX + i * wStepX,
          y: spY + spH - ((p - wMin) / wRange) * spH
        }));

        doc.setDrawColor(tColorR, tColorG, tColorB);
        doc.setLineWidth(0.4);
        for (let i = 0; i < wCoords.length - 1; i++) {
          doc.line(wCoords[i].x, wCoords[i].y, wCoords[i + 1].x, wCoords[i + 1].y);
        }
        wCoords.forEach((pt) => {
          doc.setFillColor(tColorR, tColorG, tColorB);
          doc.circle(pt.x, pt.y, 0.55, 'F');
        });

        // Metrics text block
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(`Taux Moyen : ${week.metrics.avgPrice} FCFA/kg`, margin + 100, cursorY + 21);
        doc.text(`Volume : ${week.metrics.volume} T`, margin + 100, cursorY + 26);

        // Paragraph Wrapped descriptions
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        const wrappedLines = doc.splitTextToSize(`"${week.desc}"`, usableWidth - 12);
        doc.text(wrappedLines, margin + 5, cursorY + 34);

        cursorY += 57;
      });

      // Save PDF down
      doc.save(`Rapport_Agricole_Hebdo_${selectedCrop.id}_${selectedZone.id}.pdf`);
      setToastMessage("Rapport PDF généré et téléchargé !");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setToastMessage("Échec de la génération du PDF.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const renderSparkline = (points: number[], strokeColor: string) => {
    const width = 120;
    const height = 40;
    const paddingX = 5;
    const paddingY = 5;
    
    const minVal = Math.min(...points);
    const maxVal = Math.max(...points);
    const range = (maxVal - minVal) || 1;
    const stepX = (width - paddingX * 2) / (points.length - 1);
    
    const coords = points.map((p, i) => ({
      x: paddingX + i * stepX,
      y: height - paddingY - ((p - minVal) / range) * (height - paddingY * 2)
    }));
    
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const cpX1 = coords[i].x + stepX / 2;
      const cpY1 = coords[i].y;
      const cpX2 = coords[i + 1].x - stepX / 2;
      const cpY2 = coords[i + 1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i + 1].x} ${coords[i + 1].y}`;
    }
    
    return (
      <svg className="w-28 h-10 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, idx) => (
          <circle
            key={idx}
            cx={c.x}
            cy={c.y}
            r="2.5"
            fill={strokeColor}
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
      </svg>
    );
  };

  const getWeeklyData = () => {
    const coef = selectedZone.coefficient;
    const baseVal = selectedCrop.basePrice;
    
    return [
      {
        weekName: "Semaine 1 (01 - 07 Mai)",
        title: "Initialisation et premier calibrage régional",
        trend: "stabilité",
        colorClass: "text-blue-500",
        bgClass: "bg-blue-50/70 dark:bg-zinc-900/60 border-blue-200 dark:border-zinc-800",
        sparklineColor: "#3b82f6",
        metrics: {
          avgPrice: Math.round(baseVal * coef * 0.96),
          volume: Math.round(180 * coef),
          var: "+1.2%"
        },
        points: [
          Math.round(baseVal * coef * 0.93),
          Math.round(baseVal * coef * 0.95),
          Math.round(baseVal * coef * 0.96),
          Math.round(baseVal * coef * 0.94),
          Math.round(baseVal * coef * 0.96)
        ],
        desc: (() => {
          switch (selectedCrop.id) {
            case 'mais': return `Campagne d'ouverture pour le ${selectedCrop.name}. Les stocks de ${selectedZone.name} s'écoulent de manière fluide vers le ${selectedMarket.name}. L'approvisionnement initial est jugé satisfaisant par les analystes de terrain.`;
            case 'manioc': return `Démarrage de la récolte de ${selectedCrop.name}. On note une forte régularité sur les parcelles de ${selectedZone.name}. Le prix de base fixé à ${selectedCrop.basePrice} FCFA s'établit confortablement sur le carreau des champs.`;
            case 'cafe': return `Lancement officiel de la commercialisation du ${selectedCrop.name}. Forte attention sur les prix mondiaux. Dans la zone ${selectedZone.name}, les coopératives amorcent le pesage sous une atmosphère de stabilité générale.`;
            case 'sorgho': return `Premiers arrivages de ${selectedCrop.name} sur les marchés secondaires. Qualité de grain optimale malgré les pluies irrégulières passées. Le cours moyen régional reste maîtrisé sans tension majeure.`;
            case 'igname': return `Disponibilité stable pour l'${selectedCrop.name}. La logistique au sein de la région ${selectedZone.name} est au cœur des discussions techniques pour éviter les pertes post-récolte immédiates.`;
            default: return `Démarrage de la période d'observation des cours pour la culture ${selectedCrop.name}. Cohérence remarquable de la tarification au kilo sur l'ensemble de la zone administrative de ${selectedZone.name}.`;
          }
        })()
      },
      {
        weekName: "Semaine 2 (08 - 14 Mai)",
        title: "Perturbations climatiques et tension sur l'offre",
        trend: "hausse",
        colorClass: "text-rose-600 font-extrabold flex items-center gap-1",
        bgClass: "bg-rose-50/70 dark:bg-zinc-900/60 border-rose-200 dark:border-zinc-800",
        sparklineColor: "#d32f2f",
        metrics: {
          avgPrice: Math.round(baseVal * coef * 1.05),
          volume: Math.round(145 * coef),
          var: "+5.4%"
        },
        points: [
          Math.round(baseVal * coef * 0.96),
          Math.round(baseVal * coef * 0.98),
          Math.round(baseVal * coef * 1.02),
          Math.round(baseVal * coef * 1.06),
          Math.round(baseVal * coef * 1.05)
        ],
        desc: (() => {
          switch (selectedCrop.id) {
            case 'mais': return `Fortes précipitations saisonnières affectant l'acheminement routier du ${selectedCrop.name}. Le coût du gasoil et l'allongement des trajets créent une tension haussière immédiate sur le ${selectedMarket.name}.`;
            case 'manioc': return `L'humidité excessive ralentit le rythme de déterrage du ${selectedCrop.name}. Une pénurie de main-d'œuvre temporaire dans les friches de ${selectedZone.name} tire les prix vers le haut.`;
            case 'cafe': return `Taux d'humidité rémanent légèrement élevé, exigeant un surcroît de séchage. Cette étape complémentaire freine la livraison dans les usines de conditionnement et soutient le cours d'achat.`;
            case 'sorgho': return `Retrait de certains volumes de ${selectedCrop.name} du circuit à destination de la fabrication brassicole locale. Conséquence : l'offre grand public se contracte et les cours enregistrent des gains appréciables.`;
            case 'igname': return `Accalmie logistique forcée. La demande en tubercules d'${selectedCrop.name} s'intensifie sur Douala, provoquant des frictions temporaires sur le ${selectedMarket.name} par manque de fret routier disponible.`;
            default: return `Ajustement logistique significatif. Les fluctuations thermiques locales provoquent une baisse momentanée de la fluidité des flux routiers nationaux de transit de marchandises.`;
          }
        })()
      },
      {
        weekName: "Semaine 3 (15 - 21 Mai)",
        title: "Pic spéculatif et arbitrage transfrontalier",
        trend: "hausse_max",
        colorClass: "text-amber-600 font-extrabold flex items-center gap-1",
        bgClass: "bg-amber-50/70 dark:bg-zinc-900/60 border-amber-200 dark:border-zinc-800",
        sparklineColor: "#f59e0b",
        metrics: {
          avgPrice: Math.round(baseVal * coef * 1.12),
          volume: Math.round(210 * coef),
          var: "+8.9%"
        },
        points: [
          Math.round(baseVal * coef * 1.05),
          Math.round(baseVal * coef * 1.10),
          Math.round(baseVal * coef * 1.15),
          Math.round(baseVal * coef * 1.11),
          Math.round(baseVal * coef * 1.12)
        ],
        desc: (() => {
          switch (selectedCrop.id) {
            case 'mais': return `Pointe de consommation urbaine. Les acheteurs manifestent des besoins accrus, induisant une concurrence vigoureuse sur le ${selectedMarket.name} pour collecter l'essentiel de la récolte de ${selectedZone.name}.`;
            case 'manioc': return `Les transformateurs de semoule de ${selectedCrop.name} tournent à plein régime. Face à un carnet de commandes saturé, le cours de la matière première brute enregistre son niveau le plus haut en ${selectedZone.name}.`;
            case 'cafe': return `Intenses activités contractuelles spéculatives. Les négociants anticipent une baisse des quotas internationaux, déclenchant des vagues d'acquisitions agressives de ${selectedCrop.name} de première catégorie.`;
            case 'sorgho': return `Forte rétention stratégique. Les producteurs de Garoua et du Septentrion limitent intentionnellement les ventes journalières pour forcer le cours vers une cible optimale convenue en assemblée coopérative.`;
            case 'igname': return `Compte rendu de terrain : les prix de l'${selectedCrop.name} grimpent sous l'effet conjugué des festivités saisonnières et des achats impulsifs de gros volumes alimentaires.`;
            default: return `Forte poussée spéculative. Les volumes négociés à destination des marchés extérieurs influencent fortement le comportement d'achat des grossistes installés sur place.`;
          }
        })()
      },
      {
        weekName: "Semaine 4 (22 - 28 Mai)",
        title: "Détente progressive des cours et consolidation",
        trend: "baisse",
        colorClass: "text-emerald-600 font-extrabold flex items-center gap-1",
        bgClass: "bg-emerald-50/70 dark:bg-zinc-900/60 border-emerald-200 dark:border-zinc-800",
        sparklineColor: "#10b981",
        metrics: {
          avgPrice: Math.round(baseVal * coef * 0.98),
          volume: Math.round(260 * coef),
          var: "-4.5%"
        },
        points: [
          Math.round(baseVal * coef * 1.12),
          Math.round(baseVal * coef * 1.06),
          Math.round(baseVal * coef * 1.01),
          Math.round(baseVal * coef * 0.99),
          Math.round(baseVal * coef * 0.98)
        ],
        desc: (() => {
          switch (selectedCrop.id) {
            case 'mais': return `Fluidification de l'offre grâce au déblocage des pistes de ${selectedZone.name}. L'arrivée massive de transporteurs remet le marché de ${selectedMarket.name} sous pression baissière salutaire.`;
            case 'manioc': return `Retour de la stabilité. L'irrigation intelligente et le séchage traditionnel ont porté leurs fruits. Les grossistes reconstituent leurs réserves sans surcoût sur les transactions actuelles.`;
            case 'cafe': return `Fin de cycle haussier. Le marché international temporise en attendant les chiffres officiels d'Afrique de l'Ouest. Consolidation très satisfaisante dans les zones de production.`;
            case 'sorgho': return `Récoltes secondaires abondantes arrivées en renfort. La concurrence entre revendeurs réajuste naturellement les prix vers un niveau plus accessible pour le consommateur final.`;
            case 'igname': return `Arrivée du tubercule frais en quantité sur le ${selectedMarket.name}. Diminution nette de la rareté de l'${selectedCrop.name} et correction significative du prix à la pesée, soulageant l'acheteur.`;
            default: return `Apaisement général de l'amplitude spéculative. Les récoltes régulières des différents groupements d'agriculteurs de ${selectedZone.name} permettent de couvrir la totalité de la demande.`;
          }
        })()
      }
    ];
  };

  const basePriceValue = Math.round(selectedCrop.basePrice * selectedZone.coefficient + selectedMarket.bonus);
  
  const getCurvePoints = () => {
    return realPrices || [];
  };

  const trendPoints = getCurvePoints();

  // Left sidebar handler to reset all variables
  const handleResetFilters = () => {
    setSelectedCrop(dbCrops[0] || { id: 'dummy', name: 'Maïs Jaune', type: 'Céréales', basePrice: 420, trend: '+4.2%' });
    setSelectedZone(ZONES_PRESETS[7]);
    setSelectedMarket(MARKETS_PRESETS[0]);
    setSelectedPeriod(PERIODS_PRESETS[0]);
    setDateFrom('2026-05-01');
    setDateTo('2026-05-26');
    setToastMessage("Filtres réinitialisés aux valeurs d'origine.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simulate counter update on clicks for interactive feedback
  const triggerStatsRecalculation = (itemType: string, itemName: string) => {
    // Instead of mocking random data, we just set loading to true and false to simulate refresh,
    // or we could re-fetch. Since dashboardStats is global, we just show the loader briefly.
    setCounters(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      setCounters(prev => ({ ...prev, loading: false }));
    }, 450);
  };

  // Math calculated stats
  const averagePriceResult = trendPoints.length > 0 ? Math.round(trendPoints.reduce((sum, p) => sum + p.price, 0) / trendPoints.length) : 0;
  const maxPriceResult = trendPoints.length > 0 ? Math.max(...trendPoints.map(p => p.price)) : 0;
  const minPriceResult = trendPoints.length > 0 ? Math.min(...trendPoints.map(p => p.price)) : 0;

  // --- ANALYSE DYNAMIQUE DES VARIATIONS DE PRIX (BEHAVIOUR REPLACEMENT) ---
  // 1. Left Diagram Metrics: Price Component Distribution Shares (Circular dynamic donut)
  const valBase = selectedCrop.basePrice;
  const valRegion = Math.max(0, Math.round(selectedCrop.basePrice * (selectedZone.coefficient - 1)));
  const valMarket = Math.max(0, selectedMarket.bonus);
  const valTotal = valBase + valRegion + valMarket;
  
  const pctBase = valTotal > 0 ? Math.round((valBase / valTotal) * 100) : 70;
  const pctRegion = valTotal > 0 ? Math.round((valRegion / valTotal) * 100) : 20;
  const pctMarket = Math.max(0, 100 - pctBase - pctRegion);

  // 2. Middle Diagram Metrics: Crop Price Forecast Curve (5 Months analysis sequence)
  const getPredictionPoints = () => {
    const current = basePriceValue;
    // Multipliers sequence representing: Current, Mois +1, Mois +2, Mois +3, Mois +4
    let multiplierSeq = [1, 1.05, 1.12, 1.08, 1.15];
    if (selectedCrop.id === 'manioc') {
      multiplierSeq = [1, 0.97, 1.03, 1.04, 1.01];
    } else if (selectedCrop.id === 'cafe') {
      multiplierSeq = [1, 1.09, 1.21, 1.16, 1.28];
    } else if (selectedCrop.id === 'sorgho') {
      multiplierSeq = [1, 1.03, 1.05, 1.02, 1.06];
    } else if (selectedCrop.id === 'igname') {
      multiplierSeq = [1, 0.94, 0.90, 0.95, 0.98];
    }
    
    return multiplierSeq.map((m, i) => ({
      period: i === 0 ? "Actuel" : `Mois +${i}`,
      price: Math.round(current * m)
    }));
  };
  const predictionPoints = getPredictionPoints();

  // 3. Right Diagram Metrics: Comparison between current week's variation and past week's variation
  const getWeeklyVariations = () => {
    let lastWeekVar = 2.4;
    let currentWeekVar = 4.8;
    
    switch (selectedCrop.id) {
      case 'mais':
        lastWeekVar = 3.5 * selectedZone.coefficient;
        currentWeekVar = 6.2 * selectedZone.coefficient;
        break;
      case 'manioc':
        lastWeekVar = -1.2 * selectedZone.coefficient;
        currentWeekVar = 2.1 * selectedZone.coefficient;
        break;
      case 'cafe':
        lastWeekVar = 5.6 * selectedZone.coefficient;
        currentWeekVar = 8.9 * selectedZone.coefficient;
        break;
      case 'sorgho':
        lastWeekVar = 1.8 * selectedZone.coefficient;
        currentWeekVar = -0.5 * selectedZone.coefficient;
        break;
      case 'igname':
        lastWeekVar = -2.4 * selectedZone.coefficient;
        currentWeekVar = -4.2 * selectedZone.coefficient;
        break;
      default:
        lastWeekVar = 2.5;
        currentWeekVar = 3.8;
    }
    
    return {
      lastWeek: parseFloat(lastWeekVar.toFixed(1)),
      currentWeek: parseFloat(currentWeekVar.toFixed(1))
    };
  };
  const weeklyVars = getWeeklyVariations();

  // --- CALCUL DES POINTS DE LA COURBE DE LA DEMANDE ---
  const getDemandCurvePoints = () => {
    const currentPrice = basePriceValue;
    
    // We define 5 different price-factor levels from very high price to very low price
    // Law of demand: higher price = lower quantity purchased, lower price = higher quantity purchased
    const priceFactors = [1.4, 1.2, 1.0, 0.8, 0.6];
    const baseQuantities = [200, 480, 800, 1150, 1600]; // quantity demanded in kg
    
    let scale = 1.0;
    if (selectedCrop.id === 'manioc') scale = 1.45;
    else if (selectedCrop.id === 'cafe') scale = 0.35; // expensive export crop, less weight unit
    else if (selectedCrop.id === 'sorgho') scale = 1.15;
    else if (selectedCrop.id === 'igname') scale = 0.95;

    return priceFactors.map((factor, idx) => {
      const price = Math.round(currentPrice * factor);
      const quantity = Math.round(baseQuantities[idx] * scale);
      
      let label = "Prix Élevé (Demande Faible)";
      if (factor === 1.0) label = "Prix d'Équilibre (Demande Stable)";
      else if (factor < 1.0) label = "Prix Réduit (Forte Demande)";

      return {
        id: `demand-${idx}`,
        factor,
        price,
        quantity,
        label
      };
    });
  };

  const demandPoints = getDemandCurvePoints();

  // Helper to trace the demand curve path in our custom SVG
  const getDemandCurvePath = (points: any[]) => {
    const width = 430;
    const height = 180;
    const paddingLeft = 55;
    const paddingRight = 35;
    const paddingTop = 20;
    const paddingBottom = 35;

    // Sorting points by quantity ascending (P decreases as Q increases, drawing left to right)
    const sortedPoints = [...points].sort((a, b) => a.quantity - b.quantity);

    const prices = sortedPoints.map(p => p.price);
    const quantities = sortedPoints.map(p => p.quantity);

    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const maxQty = Math.max(...quantities);
    const minQty = Math.min(...quantities);

    const rangePrice = maxPrice - minPrice || 1;
    const rangeQty = maxQty - minQty || 1;

    const scaleX = (q: number) => {
      const drawableWidth = width - paddingLeft - paddingRight;
      return paddingLeft + ((q - minQty) / rangeQty) * drawableWidth;
    };

    const scaleY = (p: number) => {
      const drawableHeight = height - paddingTop - paddingBottom;
      // Higher price is placed higher up on screen (smaller SVG y)
      return height - paddingBottom - ((p - minPrice) / rangePrice) * drawableHeight;
    };

    const coords = sortedPoints.map(p => ({
      x: scaleX(p.quantity),
      y: scaleY(p.price),
      point: p
    }));

    // Trace smooth cubic bezier curve
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const stepX = coords[i + 1].x - coords[i].x;
      const cpX1 = coords[i].x + stepX / 2;
      const cpY1 = coords[i].y;
      const cpX2 = coords[i + 1].x - stepX / 2;
      const cpY2 = coords[i + 1].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i + 1].x} ${coords[i + 1].y}`;
    }

    return {
      path,
      coords,
      scaleX,
      scaleY,
      maxPrice,
      minPrice,
      maxQty,
      minQty,
      width,
      height,
      paddingLeft,
      paddingBottom
    };
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto min-h-screen bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-slate-100 p-2 md:p-6 transition-colors">
      
      {/* Backdrop blur overlay for fullscreen expanded charts */}
      {expandedChart && (
        <div 
          onClick={() => setExpandedChart(null)}
          className="fixed inset-0 z-45 bg-slate-950/50 dark:bg-zinc-950/70 backdrop-blur-xl transition-all duration-300 animate-in fade-in cursor-zoom-out"
        />
      )}

      {/* Toast Alert message */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-2xl transition-all duration-300 transform scale-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="text-sm font-sans tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Main Outer Grid mimicking Image 1 layout: Sidebar left (col-span-3) & Content right (col-span-9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
        
        {/* ========================================== */}
        {/*           LEFT FILTER SIDEBAR CONTAINER    */}
        {/* ========================================== */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-lg p-5 shadow-sm space-y-6">
          
          {/* Period selector - mimicking image 1 column of buttons */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
              Filtres temporels
            </label>
            <div className="flex flex-col gap-1.5">
              {PERIODS_PRESETS.map((p) => {
                const isActive = selectedPeriod.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPeriod(p);
                      triggerStatsRecalculation('Periode', p.label);
                    }}
                    className={cn(
                      "w-full text-left py-2.5 px-4 rounded text-xs font-bold transition-all border block cursor-pointer",
                      isActive
                        ? "bg-slate-200 dark:bg-zinc-800 border-slate-400 dark:border-zinc-700 text-slate-900 dark:text-white shadow-sm"
                        : "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span>{p.label}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500 animate-ping" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* From / To Date Pickers - mimicking Image 1 exactly */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1">From</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    triggerStatsRecalculation('DateFrom', e.target.value);
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-zinc-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1">To</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    triggerStatsRecalculation('DateTo', e.target.value);
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 dark:text-zinc-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Description text - matching Image 1 column description text */}
          <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
            <span className="font-semibold block text-slate-700 dark:text-zinc-300 mb-1">Interactive Guidance :</span>
            Cliquez directement sur les segments de diagrammes, les régions de la carte ou les cultures ci-dessous pour filtrer instantanément l'ensemble du rapport statistique.
          </div>

          {/* Menu de filtres actifs et interactifs - matching Image 1 "Medium selected", "Country selected" inputs */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <div>
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 block mb-1 tracking-widest">
                Filtrer par Culture
              </label>
              <div className="relative">
                <select
                  id="crop-select-filter"
                  value={selectedCrop.id}
                  onChange={(e) => {
                    const found = CROPS_LIST_ALL.find(c => c.id === e.target.value);
                    if (found) {
                      setSelectedCrop(found);
                      triggerStatsRecalculation('Crop', found.name);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded px-3 py-2 text-xs font-extrabold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer appearance-none pr-8"
                >
                  {CROPS_LIST_ALL.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[8px]">▼</div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 block mb-1 tracking-widest">
                Filtrer par Région (Zone)
              </label>
              <div className="relative">
                <select
                  id="zone-select-filter"
                  value={selectedZone.id}
                  onChange={(e) => {
                    const found = ZONES_PRESETS.find(z => z.id === e.target.value);
                    if (found) {
                      setSelectedZone(found);
                      triggerStatsRecalculation('Zone', found.name);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded px-3 py-2 text-xs font-extrabold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer appearance-none pr-8"
                >
                  {ZONES_PRESETS.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.coefficient}x)
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[8px]">▼</div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-zinc-400 block mb-1 tracking-widest">
                Filtrer par Marché (Canal)
              </label>
              <div className="relative">
                  <select
                    id="market-select-filter"
                    value={selectedMarket?.id || ''}
                    onChange={(e) => {
                    const found = displayMarkets.find(m => m.id === e.target.value);
                    if (found) {
                      setSelectedMarket(found);
                      triggerStatsRecalculation('Market', found.name);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded px-3 py-2 text-xs font-extrabold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer appearance-none pr-8"
                >
                  {displayMarkets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.bonus ? `(${m.bonus >= 0 ? `+${m.bonus}` : m.bonus} FCFA)` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[8px]">▼</div>
              </div>
            </div>
          </div>

          {/* Reset all filters button styled exactly like Image 1 at bottom of sidebar */}
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              id="reset-filters-btn"
              className="w-full bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-2 border-slate-800 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 py-3 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <span>Réinitialiser les filtres</span>
              <X className="w-4 h-4 text-rose-600 shrink-0 stroke-[3]" />
            </button>
          </div>

        </div>

        {/* ========================================== */}
        {/*           RIGHT STATS CONTENT WORKSPACE    */}
        {/* ========================================== */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Main Title Banner matching top centered title format in Image 1 */}
          <div className="text-center py-6 bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-600" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase font-sans">
              METEO DES PRIX AGRICOLES
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-semibold tracking-wider uppercase mt-1">
              Rapport analytique hebdomadaire de suivi statistique de marché
            </p>
          </div>

          {/* Quick interactive shortcuts to quickly switch between the 5 Crops */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-950 p-3 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-wider pl-1">
              Cultures Catalogue :
            </span>
            {CROPS_LIST_ALL.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map((crop) => {
              const isActive = selectedCrop.id === crop.id;
              return (
                <button
                  key={crop.id}
                  onClick={() => {
                    setSelectedCrop(crop);
                    triggerStatsRecalculation('Crop', crop.name);
                  }}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-black transition-all cursor-pointer border",
                    isActive 
                      ? "bg-rose-600 border-rose-600 text-white shadow" 
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
                  )}
                >
                  {crop.name}
                </button>
              );
            })}
          </div>

          {/* ========================================== */}
          {/*   SECTION 1: APERÇU GÉNÉRAL (Red Theme)    */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Left box: dynamic average price */}
            <div className="md:col-span-4 bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-6 flex flex-col justify-center items-center text-center space-y-4 relative min-h-[280px]">
              {counters.loading ? (
                <div className="absolute inset-0 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-lg">
                  <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
                </div>
              ) : null}
              
              <div className="space-y-2 mt-4">
                <span className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none block">
                  {averagePriceResult ? averagePriceResult.toLocaleString('fr-FR') : '...'}
                </span>
                <span className="text-sm font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                  FCFA / kg
                </span>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 w-3/4">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block uppercase tracking-wider">
                  Prix moyen pondéré
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">
                  {selectedCrop.name} • {selectedZone.name.split(' (')[0]}
                  <br/>
                  Marché: {selectedMarket.name}
                </span>
              </div>
            </div>

            {/* Right box: Smooth crimson area chart matching "Sessions" in Image 1 */}
            <div className={cn("md:col-span-8", expandedChart === 'variations' ? "relative" : "")}>
              {expandedChart === 'variations' && (
                <div className="w-full h-full min-h-[300px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'variations') {
                    setExpandedChart('variations');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between relative transition-all duration-300",
                  expandedChart === 'variations' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'variations' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                  Courbe des Variations Journalières (Courbe Réelle)
                </span>
                <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 font-black">
                  Valeurs étalonnées
                </Badge>
              </div>

              {/* Graphic container with Scatter Chart */}
              {/* Graphic container with Scatter Chart */}
              <div className={cn("relative w-full border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/10 rounded-lg p-3 mt-1 transition-all duration-300", expandedChart === 'variations' ? "h-[380px]" : "h-[220px]")}>
                {trendPoints.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendPoints} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                      <linearGradient id="areaGlowRed" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#d32f2f" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#d32f2f" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="number"
                      domain={trendPoints.length === 1 ? [trendPoints[0].timestamp - 86400000 * 2, trendPoints[0].timestamp + 86400000 * 2] : ['dataMin', 'dataMax']}
                      tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      domain={[(dataMin: number) => Math.max(0, dataMin - 50), (dataMax: number) => dataMax + 50]}
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v) => `${v}F`}
                    />
                    <ZAxis range={[30, 30]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3', stroke: '#d32f2f', opacity: 0.5 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-900/95 dark:bg-zinc-950/95 text-white rounded-lg shadow-2xl border border-slate-700/80 max-w-[210px] text-[10px] space-y-1.5 backdrop-blur-md">
                              <div className="font-extrabold border-b border-white/20 pb-1 uppercase tracking-wider text-rose-450 flex justify-between items-center">
                                <span>{data.source === 'terrain' ? 'B.D. Terrain' : 'Prédiction IA'}</span>
                                <span className="text-[8px] px-1 bg-rose-500/20 text-rose-300 font-mono rounded">{data.dateStr}</span>
                              </div>
                              <div>Prix Exact : <span className="font-mono font-black text-emerald-400">{data.price} FCFA/Kg</span></div>
                              <div>Statut : <span className="font-semibold text-rose-300">{data.volatilityIndex || 'Variable'}</span></div>
                              <div>Volume : <span className="font-mono font-bold text-zinc-350">{data.volume || 150} T</span></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="none" 
                      fill="url(#areaGlowRed)" 
                      animationDuration={1500}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#d32f2f" 
                      strokeWidth={3} 
                      dot={{ r: 4.5, fill: '#ffffff', stroke: '#d32f2f', strokeWidth: 2 }} 
                      activeDot={{ r: 7, fill: '#d32f2f', stroke: '#ffffff', strokeWidth: 2 }} 
                      animationDuration={1500}
                    />
                    {trendPoints.length === 1 && (
                      <Scatter dataKey="price" fill="#d32f2f" shape="circle" />
                    )}
                  </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-widest text-center px-4">
                    <div className="text-4xl mb-2 opacity-50">📭</div>
                    Aucune donnée de prix disponible pour cette sélection
                    <p className="text-[9px] mt-2 normal-case font-normal max-w-xs opacity-70">
                      Essayez de sélectionner un autre marché ou une autre période pour ce produit.
                    </p>
                  </div>
                )}
              </div>

            </div>
            </div>

          </div>

          {/* ========================================== */}
          {/*   SECTION 2: ORIGINS HEADER SPLIT (Gray Bar) */}
          {/* ========================================== */}
          <div className="w-full text-center py-2 bg-slate-200 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Origins
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Card: Interactive Demand Curve (Courbe de la demande) representing price-quantity relation */}
            <div className={cn(expandedChart === 'demand' ? "relative col-span-2" : "h-full")}>
              {expandedChart === 'demand' && (
                <div className="w-full h-full min-h-[350px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'demand') {
                    setExpandedChart('demand');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between relative transition-all duration-300",
                  expandedChart === 'demand' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'demand' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider block">
                      Courbe de la Demande (Économie de Marché)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                      Élasticité : Relation entre le prix du {selectedCrop.name} (FCFA/kg) et la quantité achetée
                    </span>
                  </div>
                  <HelpCircle className="w-4 h-4 text-slate-400 dark:text-zinc-500 hover:text-rose-500 cursor-help transition-colors" />
                </div>

                <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold mt-2 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded border border-slate-200 dark:border-zinc-800">
                  <span className="text-rose-600 dark:text-rose-450 font-bold">Loi de la Demande :</span> Ce diagramme montre l'impact du prix de vente sur la propensité d'achat des consommateurs pour le <b>{selectedCrop.name}</b>. Lorsque les prix baissent, les quantités totales achetées par les détaillants et ménages augmentent (haut à gauche vers le bas à droite).
                </p>
              </div>

              {/* Recharts Demand Curve Graph */}
              <div className={cn("relative flex flex-col items-center justify-center py-4 w-full transition-all duration-300", expandedChart === 'demand' ? "h-[360px]" : "h-[220px]")}>
                {advancedChartsData?.demand ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={advancedChartsData.demand} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis dataKey="price" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}F`} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#d32f2f', fontWeight: 'bold' }}
                        formatter={(value) => [`${value} kg`, 'Demande (Qté)']}
                        labelFormatter={(label) => `Prix de vente : ${label} FCFA/kg`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quantity" 
                        stroke="#d32f2f" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#d32f2f', strokeWidth: 2, stroke: '#fff' }} 
                        activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }} 
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                    Chargement des élasticités...
                  </div>
                )}
              </div>

              {/* Small interactive indicator text */}
              <div className="text-[9px] font-black text-slate-500 dark:text-zinc-500 text-center uppercase tracking-widest mt-1 border-t border-slate-100 dark:border-zinc-900 pt-3">
                👉 Survolez les points rouges pour tester la réponse de la demande (API Recharts dynamique)
              </div>

            </div>
            </div>

            {/* Right Card: Cameroon interactive map displaying affordable zones as dots, mimicking "Sessions by Country" */}
            <div className={cn(expandedChart === 'cameroon-map' ? "relative col-span-2" : "h-full")}>
              {expandedChart === 'cameroon-map' && (
                <div className="w-full h-full min-h-[350px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'cameroon-map') {
                    setExpandedChart('cameroon-map');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between relative transition-all duration-300",
                  expandedChart === 'cameroon-map' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'cameroon-map' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider block">
                      Sessions by Country (Carte du Cameroun)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                      Indicateurs d'accessibilité des cours (Prix du {selectedCrop.name})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[8px] bg-emerald-50 dark:bg-zinc-900 font-extrabold text-emerald-600 dark:text-emerald-400 border-emerald-250 dark:border-zinc-800">
                    Cameroun Actif
                  </Badge>
                </div>

                <p className="text-[9.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium mt-2">
                  La carte ci-dessous affiche les flux de prix à travers le territoire national. Les points de couleurs indiquent où la culture est <span className="text-emerald-600 font-bold">abordable</span>, <span className="text-amber-500 font-bold">moyenne</span> ou <span className="text-rose-600 font-bold">chère</span>.
                </p>
              </div>

              {/* Dynamic Interactive Leaflet Map of Cameroon */}
              <div className="flex-1 w-full relative min-h-[220px] py-4">
                <CameroonMap 
                  marketsData={dbMarkets} 
                  cropName={selectedCrop.name} 
                  averagePrice={averagePriceResult} 
                />
              </div>

              {/* Red shading color density bar legend exactly matching the density bar in Image 1 */}
              <div className="flex flex-col space-y-1.5 mt-2 border-t border-slate-100 dark:border-zinc-900 pt-3">
                <div className="flex justify-between text-[8.5px] font-bold text-slate-400 dark:text-zinc-500 pb-1 font-mono uppercase">
                  <span className="text-emerald-500">● Abordable (&lt;90%)</span>
                  <span className="text-amber-500">● Moyen (Autour de moy)</span>
                  <span className="text-rose-600">● Elevé (&gt;110%)</span>
                </div>
                <div className="w-full h-1.5 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 border border-slate-200 dark:border-zinc-800" />
              </div>

            </div>
            </div>

          </div>

          {/* ========================================== */}
          {/*   SECTION: SUIVI & SYNTHÈSES HEBDO         */}
          {/* ========================================== */}
          <div className="w-full text-center py-2 bg-slate-200 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700 mt-2">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Suivi & Synthèses Hebdo
            </span>
          </div>

          <div id="weekly-synthesis-card" className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            
            {/* Automatic Weekly Scheduler Banner Indicator */}
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isAutoSchedulerActive ? "animate-ping bg-emerald-400" : "bg-slate-400")} />
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", isAutoSchedulerActive ? "bg-emerald-500" : "bg-slate-400")} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                    Planificateur d'Impression Hebdomadaire Automatique
                  </span>
                  {hasTriggeredAuto && (
                    <Badge className="bg-emerald-600 text-white text-[8px] font-bold uppercase tracking-wider">
                      Auto-Exécuté ✅
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-normal">
                  Chaque fin de semaine, si les diagrammes ne sont pas imprimés manuellement, la sauvegarde s'exécute automatiquement.
                </p>
                
                {isAutoSchedulerActive && !showWeeklyReport ? (
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-450 mt-1">
                    <Clock className="w-3.5 h-3.5 animate-spin duration-3000 shrink-0" />
                    <span>Lancement automatique dans : <span className="font-extrabold text-sm text-rose-750 dark:text-rose-400">{secondsUntilAutoTrigger}s</span></span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mt-1">
                    {showWeeklyReport 
                      ? "✓ Bilan de fin de semaine sauvegardé ! Prêt pour l'impression ou l'exportation." 
                      : "✕ Planificateur automatique en pause."}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-zinc-950 px-3 py-2 rounded-md border border-slate-250 dark:border-zinc-800">
                <label className="text-[10.5px] font-extrabold text-slate-700 dark:text-zinc-300 cursor-pointer select-none">
                  Contrôle Automatique
                </label>
                <button
                  onClick={() => {
                    setIsAutoSchedulerActive(!isAutoSchedulerActive);
                    setSecondsUntilAutoTrigger(12); // reset timer
                    setToastMessage(isAutoSchedulerActive ? "Planificateur automatique désactivé" : "Planificateur automatique réactivé !");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isAutoSchedulerActive ? "bg-emerald-500" : "bg-slate-350 dark:bg-zinc-750"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      isAutoSchedulerActive ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider">
                  Générateur de Graphiques & Synthèses par Semaine
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Générez instantanément des courbes de prix adaptées au <span className="font-bold text-rose-600 dark:text-rose-500">{selectedCrop.name}</span> dans la région de <span className="font-bold text-rose-600 dark:text-rose-500">{selectedZone.name}</span> pour chaque semaine.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  id="generate-weekly-btn"
                  onClick={handleGenerateWeeklyReports}
                  disabled={isGeneratingWeekly}
                  className={cn(
                    "px-4 py-3 rounded font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer border border-transparent",
                    isGeneratingWeekly 
                      ? "bg-slate-100 dark:bg-zinc-900 text-slate-400 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                      : "bg-rose-600 text-white hover:bg-rose-700 active:scale-95"
                  )}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 shrink-0 stroke-[2.5]", isGeneratingWeekly && "animate-spin")} />
                  <span>{isGeneratingWeekly ? `Analyse (${weeklyProgress}%)` : (showWeeklyReport ? "Régénérer" : "Générer les graphiques & descriptions")}</span>
                </button>

                {showWeeklyReport && (
                  <>
                    <button
                      id="export-pdf-weekly-btn"
                      onClick={handleExportPDF}
                      className="px-4 py-3 rounded font-black text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2 border border-transparent"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
                      <span>Télécharger PDF</span>
                    </button>
                    <button
                      id="print-report-weekly-btn"
                      onClick={handlePrintReport}
                      className="px-4 py-3 rounded font-black text-xs uppercase tracking-wider bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Imprimer</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Simulated loading bar */}
            {isGeneratingWeekly && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-600 transition-all duration-150 rounded-full animate-pulse"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            )}

            {showWeeklyReport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4 transition-all duration-500 animate-fadeIn text-left">
                
                {/* Curve 1: Variations Journalières Report */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 1/6 • Cours Réel</span>
                    <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase">Actif • Calibré</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Variations Journalières</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Support moyen calculé à <strong className="text-rose-600 dark:text-rose-400">{averagePriceResult.toLocaleString('fr-FR')} FCFA</strong> sur la période active pour le <strong>{selectedCrop.name}</strong>. Intègre des crosshairs de précision et des grilles d'analyse financière.
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Max: {maxPriceResult} FCFA</span>
                    <span>Min: {minPriceResult} FCFA</span>
                  </div>
                </div>

                {/* Curve 2: Courbe de la Demande Report */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 2/6 • Élasticité</span>
                    <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase">Régénéré</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Élasticité de la Demande</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Analyse de corrélation prix-quantité pour le <strong>{selectedCrop.name}</strong>. Modélise la propension d'achat des détaillants camerounais face à la fluctuation des tarifs au kilo.
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Loi macroéconomique</span>
                    <span className="text-rose-500">Flux d'Achats Actif</span>
                  </div>
                </div>

                {/* Curve 3: Cameroon SVG Map regional index mapping */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 3/6 • Spatial</span>
                    <Badge className="bg-emerald-600 text-white text-[8px] font-black uppercase">{selectedZone.name}</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Cartographie Nationale</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Application du coefficient de majoration de zone agronomique de <strong className="text-emerald-500">{selectedZone.coefficient}x</strong> pour <strong>{selectedZone.name}</strong>. Marqueurs interactifs calibrés.
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Région active: {selectedZone.name}</span>
                    <span>10 Provinces Calibrées</span>
                  </div>
                </div>

                {/* Curve 4: Cost Structure breakdown Report */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 4/6 • Composition</span>
                    <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase">Indexé</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Structure Interne de Prix</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Base: <strong className="text-slate-800 dark:text-zinc-200">{valBase} FCFA</strong> ({pctBase}%) • Majoration Zone coordonnée: <strong className="text-amber-500">{valRegion} FCFA</strong> ({pctRegion}%) • Surcharge canal de distribution: <strong className="text-slate-600 dark:text-zinc-300">{valMarket} FCFA</strong> ({pctMarket}%).
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Total Consolidé: {basePriceValue} FCFA/Kg</span>
                    <span className="text-amber-500">Structure à 3 segments</span>
                  </div>
                </div>

                {/* Curve 5: Price predictions confidence interval Report */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 5/6 • Statistique</span>
                    <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase">Extrapolé</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Prévision de Tendance à 4 Mois</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Projeté sur modèle de regression à 4 mois: tendance estimée à <strong className="text-rose-600 dark:text-rose-500">{predictionPoints[4].price > basePriceValue ? "HAUSSIÈRE" : "SURE & STABLE"}</strong> ({predictionPoints[4].price} FCFA au terme) sous canal de confiance statistique de ±5%.
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Delta: {(((predictionPoints[4].price - basePriceValue) / basePriceValue) * 100).toFixed(1)}%</span>
                    <span>Zone de confiance intégrée</span>
                  </div>
                </div>

                {/* Curve 6: Volatility comparisons Report */}
                <div className="rounded-lg border border-slate-250 dark:border-zinc-800 bg-rose-50/20 dark:bg-zinc-900/10 p-5 flex flex-col justify-between gap-3 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 uppercase">Diagramme 6/6 • Variance</span>
                    <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase">Calculé</Badge>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Ecart de Volatilité Hebdo</h4>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Variations comparatives d'indice: Semaine passée évaluée à <strong className="text-slate-700 dark:text-zinc-300">{weeklyVars.lastWeek > 0 ? `+${weeklyVars.lastWeek}` : weeklyVars.lastWeek}%</strong> contre <strong className="text-rose-600 dark:text-rose-450">{weeklyVars.currentWeek > 0 ? `+${weeklyVars.currentWeek}` : weeklyVars.currentWeek}%</strong> cette semaine.
                  </p>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-1 border-t border-slate-100 dark:border-zinc-900 pt-2 flex justify-between">
                    <span>Fluctuation active</span>
                    <span className="text-rose-500">Écart : {Math.abs(weeklyVars.currentWeek - weeklyVars.lastWeek).toFixed(1)}%</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-zinc-900/30 border border-dashed border-slate-250 dark:border-zinc-800 rounded-lg p-10 flex flex-col justify-center items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <span className="text-xs font-black uppercase text-slate-600 dark:text-zinc-400 tracking-wider">
                  Aucun rapport hebdomadaire généré
                </span>
                <p className="text-[11px] text-slate-400 max-w-sm font-semibold">
                  Cliquez sur le bouton "Générer les graphiques & descriptions" ci-dessus pour lancer l'extrapolateur de courbes de prix hébdo et obtenir des rapports de synthèse.
                </p>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/*   SECTION 3: BEHAVIOUR HEADER SPLIT (Gray Bar) */}
          {/* ========================================== */}
          <div className="w-full text-center py-2 bg-slate-200 dark:bg-zinc-800 rounded border border-slate-300 dark:border-zinc-700">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
              Analyse Graphique d'Évolution de Prix
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Behaviour Card Left: Dynamic Circular breakdown representing Price component share */}
            <div className={cn(expandedChart === 'price-structure' ? "relative" : "")}>
              {expandedChart === 'price-structure' && (
                <div className="w-full h-full min-h-[290px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'price-structure') {
                    setExpandedChart('price-structure');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between items-center relative transition-all duration-300",
                  expandedChart === 'price-structure' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700 min-h-[290px]"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'price-structure' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div className="w-full text-left">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider block">
                  Structure des Prix du Kilo
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                  Répartition des facteurs du cours actuel
                </span>
              </div>

              {/* Recharts PieChart for Structure des Prix */}
              <div className={cn("relative flex items-center justify-center mt-2 transition-all duration-300 w-full", expandedChart === 'price-structure' ? "h-64" : "h-40")}>
                {advancedChartsData?.structure ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={advancedChartsData.structure}
                        cx="50%"
                        cy="50%"
                        innerRadius={expandedChart === 'price-structure' ? 70 : 45}
                        outerRadius={expandedChart === 'price-structure' ? 95 : 65}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                      >
                        {advancedChartsData.structure.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Part du prix']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '15px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                    Calcul de structure...
                  </div>
                )}
                {/* Inner center labels */}
                <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none" style={{ top: 'calc(50% - 15px)' }}>
                  <span className={cn("font-black text-slate-900 dark:text-white leading-tight", expandedChart === 'price-structure' ? "text-2xl" : "text-sm")}>
                    {basePriceValue}
                  </span>
                  <span className={cn("font-black uppercase text-slate-400 tracking-wider", expandedChart === 'price-structure' ? "text-xs mt-1" : "text-[8px]")}>
                    FCFA / kg
                  </span>
                </div>
              </div>

            </div>
            </div>

            {/* Behaviour Card Middle: Prediction Line Chart simulated model analytics */}
            <div className={cn(expandedChart === 'prediction' ? "relative" : "")}>
              {expandedChart === 'prediction' && (
                <div className="w-full h-full min-h-[290px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'prediction') {
                    setExpandedChart('prediction');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between items-center relative transition-all duration-300",
                  expandedChart === 'prediction' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700 min-h-[290px]"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'prediction' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div className="w-full text-left">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider block">
                  Prédiction Prévisionnelle du Cours
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                  Modèle d'extrapolateur prédictif (Mois futures)
                </span>
              </div>

              {/* Recharts AreaChart for Predictions */}
              <div className={cn("relative w-full mt-2 bg-slate-50/50 dark:bg-zinc-900/30 rounded border border-slate-100 dark:border-zinc-900/60 p-2 flex flex-col justify-between transition-all duration-300", expandedChart === 'prediction' ? "h-64" : "h-40")}>
                
                <div className="absolute top-1 right-2 bg-rose-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-rose-700 dark:text-zinc-300 tracking-widest border border-rose-200/50 z-10">
                  Modèle Prévisionnel
                </div>

                {advancedChartsData?.prediction ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={advancedChartsData.prediction} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} domain={['dataMin - 15', 'dataMax + 15']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                        formatter={(value, name) => {
                          if (name === 'price') return [`${value} FCFA`, 'Prix Projeté'];
                          if (name === 'intervalMax') return [`${value} FCFA`, 'Borne Supérieure'];
                          if (name === 'intervalMin') return [`${value} FCFA`, 'Borne Inférieure'];
                          return [value, name];
                        }}
                      />
                      <Area type="monotone" dataKey="intervalMax" stroke="none" fill="#d32f2f" fillOpacity={0.08} />
                      <Area type="monotone" dataKey="intervalMin" stroke="none" fill="#fff" fillOpacity={1} className="dark:fill-zinc-950" />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#d32f2f" 
                        strokeWidth={2} 
                        strokeDasharray="4 3" 
                        dot={{ r: 3, fill: '#d32f2f', strokeWidth: 1, stroke: '#fff' }} 
                        activeDot={{ r: 5, fill: '#ef4444' }} 
                        animationDuration={1500}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                    Chargement prédictions...
                  </div>
                )}
              </div>

              <div className="text-center w-full bg-slate-50 dark:bg-zinc-900/50 p-2 rounded border border-slate-100 dark:border-zinc-900 mt-2">
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block leading-relaxed">
                  Tendance moyenne projetée à 4 mois: <b className="text-rose-600 dark:text-rose-500 font-extrabold">{predictionPoints[4].price > basePriceValue ? "HAUSSIÈRE" : "PLUTÔT STABLE"} ({predictionPoints[4].price} FCFA)</b>
                </span>
              </div>

            </div>
            </div>

            {/* Behaviour Card Right: Weekly variation rate comparison chart (Current vs Past Week) */}
            <div className={cn(expandedChart === 'volatility' ? "relative" : "")}>
              {expandedChart === 'volatility' && (
                <div className="w-full h-full min-h-[290px] bg-slate-100/50 dark:bg-zinc-905/30 rounded-lg border border-slate-200 dark:border-zinc-800 animate-pulse" />
              )}
              <div 
                onClick={() => {
                  if (expandedChart !== 'volatility') {
                    setExpandedChart('volatility');
                  }
                }}
                className={cn(
                  "bg-white dark:bg-zinc-950 rounded-lg border border-slate-300 dark:border-zinc-800 shadow-sm p-5 flex flex-col justify-between relative transition-all duration-300",
                  expandedChart === 'volatility' 
                    ? "fixed inset-4 sm:inset-10 md:inset-16 lg:inset-20 z-50 shadow-2xl overflow-y-auto max-h-[85vh] scale-100 cursor-default" 
                    : "h-full hover:shadow-md cursor-zoom-in hover:border-rose-450 dark:hover:border-zinc-700 min-h-[290px]"
                )}
              >
                {/* Close Button when zoomed */}
                {expandedChart === 'volatility' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedChart(null);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors z-55 cursor-pointer"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              
              <div>
                <span className="text-xs font-black uppercase text-slate-900 dark:text-slate-100 tracking-wider block">
                  Écart de Volatilité Hebdo
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block font-semibold">
                  Comparaison: Semaine passée vs Semaine actuelle
                </span>
              </div>

              {/* Recharts BarChart for Volatility */}
              <div className={cn("relative w-full mt-2 transition-all duration-300", expandedChart === 'volatility' ? "h-64" : "h-40")}>
                {advancedChartsData?.volatility ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={advancedChartsData.volatility} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                        formatter={(value) => {
                          const num = Number(value);
                          return [`${num > 0 ? '+' : ''}${num}%`, 'Variation Hebdo'];
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]} 
                        animationDuration={1500}
                        barSize={40}
                      >
                        {advancedChartsData.volatility.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                    Chargement volatilité...
                  </div>
                )}
              </div>

            </div>
            </div>

          </div>

          {/* Core Footer certification stamp */}
          <div className="text-center p-3 text-[10px] text-slate-400 dark:text-zinc-500 font-mono border-t border-slate-200 dark:border-zinc-800/85">
            Certification Agronomique Nationale • Calibration active sur {selectedCrop.name.toUpperCase()} (coefficient zone actuel: {selectedZone.coefficient}x)
          </div>

        </div>

      </div>

      {/* Print-optimized custom responsive Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html, main, #root, #__next {
            background: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide sidebar filter column, reset button, and all system interactive triggers */
          .lg\\:col-span-3,
          button,
          span.pointer-events-none,
          .no-print,
          #reset-filters-btn,
          #generate-weekly-btn,
          #export-pdf-weekly-btn,
          #print-report-weekly-btn,
          .fixed {
            display: none !important;
          }
          /* Stretch stats content tray to 100% printed page width */
          .lg\\:col-span-9 {
            width: 100% !important;
            grid-column: span 12 / span 12 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Eliminate shadows and convert dark/light surfaces into clean white cards */
          .bg-white, .bg-slate-100, .bg-zinc-950, .bg-zinc-900, .bg-slate-50, [class*="bg-"], [class*="dark:bg-"] {
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          /* Reset color schemas for pure dark grayscale on text */
          span, p, h1, h2, h3, h4, text, b, strong, select, option {
            color: #000000 !important;
          }
          /* Keep essential vector line art, sparklines, and charts perfectly crisp */
          path, svg, circle, line {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            stroke: #000000 !important;
          }
          /* Prevent page-breaks in the middle of active weekly block items */
          #weekly-synthesis-card img,
          #weekly-synthesis-card svg,
          #weekly-synthesis-card .rounded-lg {
            page-break-inside: avoid !important;
          }
        }
      ` }} />

    </div>
  );
}
