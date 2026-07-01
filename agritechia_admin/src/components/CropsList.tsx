'use client';

import React, { useState } from 'react';
import { 
  Sprout, 
  Search, 
  Filter, 
  Plus, 
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  Brain,
  Sparkles,
  Copy,
  Info,
  Save,
  Globe,
  Leaf,
  Banknote,
  Check,
  Coins,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CropRecord {
  id: string;
  name: string;
  category: string;
  sector: string;
  sowingStart: string;
  sowingEnd: string;
  harvestStart: string;
  harvestEnd: string;
  sellingStart: string;
  sellingEnd: string;
  price: number;
  quantity: number;
  stage: string;
  health: number; // 0-100
  status: 'Critical' | 'Alert' | 'Normal' | 'Great';
  market?: string;
}

const RECORDS: CropRecord[] = [];

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl",
      type === 'success' ? "bg-primary/10 border-primary/20 text-primary shadow-primary/20" : "bg-destructive/10 border-destructive/20 text-destructive shadow-destructive/20"
    )}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
    <p className="font-bold text-sm uppercase tracking-widest">{message}</p>
    <button onClick={onClose} className="ml-4 hover:opacity-70">
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

const CropForm = ({ initialData, mode, onSubmit, onCancel }: { initialData?: Partial<CropRecord>, mode: 'add' | 'edit', onSubmit: (data: any) => void, onCancel: () => void }) => {
  const [categories, setCategories] = useState(['Céréales', 'Oléagineux', 'Maraîchage', 'Fruits']);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'Céréales');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [name, setName] = useState(initialData?.name || '');
  const [sector, setSector] = useState(initialData?.sector || '');
  const [market, setMarket] = useState(initialData?.market || '');
  const [price, setPrice] = useState(initialData?.price || 0);
  const [quantity, setQuantity] = useState(initialData?.quantity || 0);
  const [sowingStart, setSowingStart] = useState(initialData?.sowingStart || '');
  const [sowingEnd, setSowingEnd] = useState(initialData?.sowingEnd || '');
  const [harvestStart, setHarvestStart] = useState(initialData?.harvestStart || '');
  const [harvestEnd, setHarvestEnd] = useState(initialData?.harvestEnd || '');
  const [sellingStart, setSellingStart] = useState(initialData?.sellingStart || '');
  const [sellingEnd, setSellingEnd] = useState(initialData?.sellingEnd || '');

  React.useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSelectedCategory(initialData.category || 'Céréales');
      setSector(initialData.sector || '');
      setMarket(initialData.market || '');
      setPrice(initialData.price || 0);
      setQuantity(initialData.quantity || 0);
      setSowingStart(initialData.sowingStart || '');
      setSowingEnd(initialData.sowingEnd || '');
      setHarvestStart(initialData.harvestStart || '');
      setHarvestEnd(initialData.harvestEnd || '');
      setSellingStart(initialData.sellingStart || '');
      setSellingEnd(initialData.sellingEnd || '');
    }
  }, [initialData]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'autre') {
      setShowOtherInput(true);
    } else {
      setSelectedCategory(value);
      setShowOtherInput(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setSelectedCategory(newCategory.trim());
      setShowOtherInput(false);
      setNewCategory('');
    }
  };

  const handleSubmitClick = () => {
    if (!name.trim()) {
      alert("Le nom de la culture est obligatoire.");
      return;
    }
    if (!selectedCategory.trim()) {
      alert("La catégorie est obligatoire.");
      return;
    }
    if (!sector.trim()) {
      alert("La zone géographique est obligatoire.");
      return;
    }
    onSubmit({
      id: initialData?.id,
      name,
      category: selectedCategory,
      sector,
      market,
      price,
      quantity,
      sowingStart,
      sowingEnd,
      harvestStart,
      harvestEnd,
      sellingStart,
      sellingEnd,
      status: initialData?.status || 'Normal',
      health: initialData?.health || 85
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-12 gap-8">
        {/* Main Fields */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="glass border-border rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-serif italic text-xl text-foreground">Informations de base</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                    Nom de la culture <span className="text-rose-500 font-bold ml-1">*</span>
                  </label>
                  <div className="relative group/input">
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Blé d'hiver" 
                      className="h-12 pl-4 pr-12 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium" 
                    />
                    <Leaf className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                    Catégorie <span className="text-rose-500 font-bold ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="w-full h-12 px-4 bg-muted/20 border border-border rounded-xl text-sm text-foreground focus:ring-1 focus:ring-primary/20 outline-none appearance-none font-medium"
                    >
                      <option value="">Sélectionner...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="autre" className="text-primary font-bold italic">Autre (Ajouter...)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {showOtherInput && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="col-span-1 md:col-span-2 space-y-2 overflow-hidden"
                    >
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 italic">Nouvelle Catégorie</label>
                      <div className="flex gap-2">
                        <Input 
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Entrez le nom de la catégorie..." 
                          className="h-11 bg-primary/5 border-primary/20 text-foreground"
                        />
                        <Button 
                          onClick={handleAddCategory}
                          className="h-11 px-4 bg-primary text-primary-foreground hover:bg-emerald-600 font-bold text-[10px] uppercase tracking-widest"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Valider
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                    Zone Géographique <span className="text-rose-500 font-bold ml-1">*</span>
                  </label>
                  <div className="relative group/input">
                    <Input 
                      value={sector} 
                      onChange={(e) => setSector(e.target.value)}
                      placeholder="Ex: Secteur Sud-Est, Parcelles A1-A4" 
                      className="h-12 pl-12 pr-4 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium" 
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Marché ciblé</label>
                  <div className="relative group/input">
                    <Input 
                      value={market} 
                      onChange={(e) => setMarket(e.target.value)}
                      placeholder="Ex: Marché Central de Bafoussam" 
                      className="h-12 pl-12 pr-4 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium" 
                    />
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t border-border">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Coins className="w-5 h-5 text-primary" />
                <h3 className="font-serif italic text-xl text-foreground">Prix estimatif</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Prix (FCFA / kg)</label>
                  <div className="relative group/input">
                    <Input 
                      type="number"
                      min="0"
                      step="5"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="500" 
                      className="h-12 pl-4 pr-16 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground bg-muted p-1 rounded">FCFA</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Quantité (kg)</label>
                  <div className="relative group/input">
                    <Input 
                      type="number"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      placeholder="1000" 
                      className="h-12 px-4 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 font-medium" 
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t border-border">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-serif italic text-xl text-foreground">Cycle de production</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Semis */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Période de semis
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date début</label>
                      <Input 
                        type="date" 
                        value={sowingStart}
                        onChange={(e) => setSowingStart(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date fin</label>
                      <Input 
                        type="date" 
                        value={sowingEnd}
                        onChange={(e) => setSowingEnd(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                  </div>
                </div>

                {/* Récolte */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Récolte Prévisionnelle
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date début</label>
                      <Input 
                        type="date" 
                        value={harvestStart}
                        onChange={(e) => setHarvestStart(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date fin</label>
                      <Input 
                        type="date" 
                        value={harvestEnd}
                        onChange={(e) => setHarvestEnd(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                  </div>
                </div>

                {/* Vente */}
                <div className="space-y-4 col-span-1 md:col-span-2">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Vente / Distribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date début</label>
                      <Input 
                        type="date" 
                        value={sellingStart}
                        onChange={(e) => setSellingStart(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Date fin</label>
                      <Input 
                        type="date" 
                        value={sellingEnd}
                        onChange={(e) => setSellingEnd(e.target.value)}
                        className="h-11 px-3 bg-muted/20 border-border rounded-xl text-foreground focus:ring-1 focus:ring-primary/20 transition-all font-mono text-xs dark:[color-scheme:dark]" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar: AI Configuration */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass border-primary/20 bg-primary/[0.03] rounded-2xl p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
               <Badge className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border-primary/20">Mode Conseiller</Badge>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-primary">Configuration de l'IA</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Directives Cognitives</label>
                <textarea 
                  rows={5}
                  placeholder="Définissez les directives spécifiques pour l'IA (ex: prioriser la réduction d'eau, alertes maladies...)"
                  className="w-full bg-muted/40 border border-border rounded-xl p-4 text-sm text-foreground focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 font-medium resize-none italic"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start gap-2 text-primary hover:bg-primary/10 h-10 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  Générer via historique
                </Button>
                <Button variant="ghost" className="justify-start gap-1.5 text-muted-foreground hover:bg-muted h-10 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-border">
                  <Copy className="w-3.5 h-3.5" />
                  Utiliser un modèle (Aether)
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 opacity-60">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20 group">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Validation temps réel</p>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20 group">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Node Sync Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button variant="ghost" onClick={onCancel} className="px-8 rounded-xl h-12 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all">
          Annuler
        </Button>
        <Button onClick={handleSubmitClick} className="px-10 rounded-xl h-12 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(var(--primary),0.2)] flex items-center gap-2 group font-bold">
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Enregistrer la culture
        </Button>
      </div>
    </div>
  );
};

export const CropsList = () => {
  const [isBlockDialogOpen, setIsBlockDialogOpen] = React.useState(false);
  const [formConfig, setFormConfig] = React.useState<{ show: boolean, mode: 'add' | 'edit', crop: CropRecord | null }>({ show: false, mode: 'add', crop: null });
  const [selectedCrop, setSelectedCrop] = React.useState<CropRecord | null>(null);
  const [toast, setToast] = React.useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  // Dynamic state for loaded crops from backend
  const [records, setRecords] = React.useState<CropRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchCrops = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/crops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped: CropRecord[] = data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: item.type || 'Céréales',
          sector: item.variety || 'Secteur Central',
          sowingStart: item.sowing_start ? item.sowing_start.split('T')[0] : (item.planting_date ? item.planting_date.split('T')[0] : '2026-05-01'),
          sowingEnd: item.sowing_end ? item.sowing_end.split('T')[0] : (item.planting_date ? item.planting_date.split('T')[0] : '2026-05-15'),
          harvestStart: item.harvest_start ? item.harvest_start.split('T')[0] : '2026-08-01',
          harvestEnd: item.harvest_end ? item.harvest_end.split('T')[0] : '2026-08-30',
          sellingStart: item.selling_start ? item.selling_start.split('T')[0] : '2026-09-01',
          sellingEnd: item.selling_end ? item.selling_end.split('T')[0] : '2026-10-31',
          price: item.price !== null && item.price !== undefined && Number(item.price) > 0 ? Number(item.price) : (item.area ? Number(item.area) * 100 : 1200),
          quantity: item.quantity !== null && item.quantity !== undefined && Number(item.quantity) > 0 ? Number(item.quantity) : (item.progress ? Number(item.progress) * 10 : 100),
          stage: 'Développement',
          health: 80,
          status: item.status === 'active' ? 'Normal' : (item.status === 'Critical' || item.status === 'Alert' || item.status === 'Great' ? item.status : 'Normal'),
          market: item.market || 'Marché Central'
        }));
        setRecords(mapped);
      }
    } catch (err) {
      console.error('Error fetching crops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedCrop) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/crops/${selectedCrop.id}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        showToast(`Culture ${selectedCrop.status === 'blocked' ? 'débloquée' : 'bloquée'} avec succès`);
        fetchCrops();
      } else {
        const data = await response.json();
        showToast(data.message || 'Erreur lors du changement de statut', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur de connexion', 'error');
    }
    setIsBlockDialogOpen(false);
  };

  React.useEffect(() => {
    fetchCrops();
  }, []);

  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      const isEdit = formConfig.mode === 'edit';
      
      const payload = {
        name: formData.name,
        type: formData.category,
        variety: formData.sector, // sector maps to variety
        planting_date: formData.sowingStart || new Date().toISOString().split('T')[0],
        sowing_start: formData.sowingStart,
        sowing_end: formData.sowingEnd,
        harvest_start: formData.harvestStart,
        harvest_end: formData.harvestEnd,
        selling_start: formData.sellingStart,
        selling_end: formData.sellingEnd,
        area: formData.price / 100 || 12,
        status: formData.status === 'Normal' ? 'active' : formData.status,
        progress: formData.quantity / 10 || 15,
        market: formData.market || 'Marché Central',
        quantity: formData.quantity || 0,
        price: formData.price || 0
      };

      const url = isEdit ? `/api/crops/${formData.id}` : '/api/crops';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(`Cycle ${isEdit ? 'actualisé' : 'initialisé'} avec succès !`, 'success');
        setFormConfig({ show: false, mode: 'add', crop: null });
        fetchCrops();
      } else {
        showToast('Erreur lors de l’enregistrement de la culture', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur de connexion au serveur', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <AnimatePresence>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
        )}
      </AnimatePresence>

      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="glass border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className={`font-serif italic text-2xl tracking-tight ${selectedCrop?.status === 'blocked' ? 'text-primary' : 'text-rose-500'}`}>{selectedCrop?.status === 'blocked' ? 'Débloquer' : 'Bloquer'} le Lot</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 font-medium">
              Voulez-vous vraiment {selectedCrop?.status === 'blocked' ? 'débloquer' : 'bloquer'} le lot <span className="text-foreground font-bold">{selectedCrop?.name}</span> ? 
              {selectedCrop?.status !== 'blocked' && " Les données historiques reliées seront conservées mais le lot ne sera plus actif."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)} className="border-border rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-[10px]">Annuler</Button>
            <Button onClick={handleBlock} className={`${selectedCrop?.status === 'blocked' ? 'bg-primary hover:bg-primary/90' : 'bg-rose-500 hover:bg-rose-600'} text-white rounded-xl h-11 px-8 font-bold uppercase tracking-widest text-[10px]`}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formConfig.show} onOpenChange={(open) => setFormConfig(prev => ({ ...prev, show: open }))}>
        <DialogContent className="glass border-border rounded-3xl max-w-[95vw] lg:max-w-6xl shadow-2xl p-0 overflow-hidden">
          <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 lg:p-14">
              <DialogHeader className="mb-12">
                <div className="flex items-center gap-3 text-primary mb-3">
                  <div className="w-8 h-[1px] bg-primary/30" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Biosystem Activation</span>
                </div>
                <DialogTitle className="font-serif italic text-4xl lg:text-5xl text-foreground tracking-tighter">
                  {formConfig.mode === 'add' ? 'Gestion de Culture' : 'Optimisation de Lot'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground pt-6 font-medium text-lg max-w-3xl leading-relaxed">
                  Configurez les paramètres de production et laissez l'IA optimiser vos cycles de croissance pour un rendement maximal.
                </DialogDescription>
              </DialogHeader>
              <CropForm 
                mode={formConfig.mode} 
                initialData={formConfig.crop || {}} 
                onSubmit={handleFormSubmit}
                onCancel={() => setFormConfig({ show: false, mode: 'add', crop: null })}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight text-gradient">Gestion des Cultures</h2>
          <p className="text-muted-foreground">Archives et suivis actifs des plantations saisonnières.</p>
        </div>
        <Button 
          onClick={() => setFormConfig({ show: true, mode: 'add', crop: null })}
          className="bg-primary text-primary-foreground hover:bg-emerald-600 shadow-lg shadow-primary/20 h-11 px-6 font-bold rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouveau Lot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass emerald-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Batches Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">{records.length}</div>
            <p className="text-[10px] text-secondary font-bold uppercase mt-2 flex items-center tracking-widest">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Total Enregistrés
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Indice de Santé Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">
              {records.length > 0 ? (records.reduce((acc, curr) => acc + curr.health, 0) / records.length).toFixed(0) : 0}%
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden ring-1 ring-border">
              <div 
                className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(var(--primary),0.6)]" 
                style={{ width: `${records.length > 0 ? (records.reduce((acc, curr) => acc + curr.health, 0) / records.length) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Alertes Sanitaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">
              {records.filter(r => r.status === 'Alert' || r.status === 'Critical').length}
            </div>
            <p className="text-[10px] text-amber-400 font-bold uppercase mt-2 flex items-center tracking-widest">
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Suivi Temps Réel IA
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass overflow-hidden border border-border/50">
        <div className="p-4 bg-muted/20 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Rechercher par ID, lot ou secteur..." 
              className="pl-10 bg-background/50 border-border h-11 ring-offset-background placeholder:text-muted-foreground/50 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-muted/50 border-border h-11 px-4 rounded-xl hover:bg-muted font-bold text-[10px] uppercase tracking-widest">
              <Filter className="mr-2 h-4 w-4" /> Filtres
            </Button>
            <Button variant="outline" size="sm" className="bg-muted/50 border-border h-11 px-4 rounded-xl hover:bg-muted font-bold text-[10px] uppercase tracking-widest">Exporter</Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chargement des données...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Leaf className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif italic text-xl">Aucune culture enregistrée</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Créez votre tout premier lot en cliquant sur le bouton ci-dessus pour entamer le suivi.</p>
            </div>
            <Button 
              onClick={() => setFormConfig({ show: true, mode: 'add', crop: null })}
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/5 uppercase tracking-wider font-bold text-[10px] h-10 px-5 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Créer mon premier lot
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 px-6 text-muted-foreground">Détails du Lot</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Catégorie</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Période Semis</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Période Récolte</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground mr-4">Période Vente</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Secteur</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Marché</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Économie (Prix/KG)</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest h-14 text-muted-foreground">Statut</TableHead>
                <TableHead className="w-[80px] px-6 h-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => (
                <TableRow key={record.id} className="border-border hover:bg-muted/30 group transition-colors">
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{record.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-60">LOT-{record.id}</span>
                      <div className="mt-1 flex gap-2">
                        {record.status === 'blocked' && (
                          <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-none py-0 h-4">Bloqué</Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-800 border-none px-2 rounded-md">#{record.id}</Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest border-border px-2 py-0.5 rounded-md">
                      {record.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                      <div className="text-[10px] font-mono text-muted-foreground/60">DU {record.sowingStart}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/60">AU {record.sowingEnd}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                      <div className="text-[10px] font-mono text-muted-foreground/60">DU {record.harvestStart}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/60">AU {record.harvestEnd}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                      <div className="text-[10px] font-mono text-muted-foreground/60">DU {record.sellingStart}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/60">AU {record.sellingEnd}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {record.sector}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      {record.market || 'Marché Central'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-primary">
                        <Coins className="w-3 h-3" />
                        <span className="text-[11px] font-black">{record.price.toLocaleString()} <span className="text-[9px]">FCFA</span></span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter italic">Total: {record.quantity} kg</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        record.status === 'Great' ? 'bg-secondary' :
                        record.status === 'Normal' ? 'bg-blue-500' :
                        record.status === 'Alert' ? 'bg-amber-500' : 
                        record.status === 'blocked' ? 'bg-destructive' : 'bg-rose-500'
                      }`} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{record.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-10 w-10 p-0 rounded-xl hover:bg-muted font-bold flex items-center justify-center transition-colors cursor-pointer outline-none">
                        <MoreHorizontal className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass w-56 p-2 rounded-2xl shadow-2xl">
                        <DropdownMenuItem 
                          onClick={() => setFormConfig({ show: true, mode: 'edit', crop: record })}
                          className="p-3 rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <Plus className="w-4 h-4 rotate-45" /> 
                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Modifier Fiche</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-3 rounded-xl cursor-pointer hover:bg-primary/10 hover:text-primary transition-all">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4" /> 
                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Optimiser IA</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCrop(record);
                            setIsBlockDialogOpen(true);
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${record.status === 'blocked' ? 'text-primary hover:bg-primary/10' : 'text-rose-500 hover:bg-rose-500/10'}`}
                        >
                          <div className="flex items-center gap-3">
                            {record.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            <span className="font-bold text-xs uppercase tracking-widest">{record.status === 'blocked' ? 'Débloquer' : 'Bloquer'}</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border bg-muted/20">
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-50">
            Saison Active • Page {String(currentPage).padStart(2, '0')}-{String(totalPages).padStart(2, '0')}
          </span>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="px-5 border-border hover:bg-muted h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-20" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" /> Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-5 border-border hover:bg-muted h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-20" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next Stage <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
