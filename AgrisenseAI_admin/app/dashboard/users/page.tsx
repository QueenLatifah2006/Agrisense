'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus,
  Trash2,
  CheckCircle2,
  X,
  User,
  Mail,
  Shield,
  Lock,
  Camera,
  Globe,
  Info,
  Save,
  Check,
  Search,
  ChevronDown,
  ArrowRight,
  Ban
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'farmer';
  organization_id?: string;
  domain?: string;
  profile_picture?: string;
  created_at: string;
  status?: string;
}

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

const UserForm = ({ initialData, mode, onSubmit, onCancel, currentUserRole }: { initialData?: Partial<UserData>, mode: 'add' | 'edit', onSubmit: (data: any) => void, onCancel: () => void, currentUserRole: string }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'farmer',
    organization_id: initialData?.organization_id || '',
    domain: initialData?.domain || '',
    profile_picture: initialData?.profile_picture || ''
  });

  const [domains] = useState(['Apiculteur', 'Céréalier', 'Viticuteur', 'Maraîcher', 'Éleveur']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Le nom complet est obligatoire.");
      return;
    }
    if (!formData.email.trim()) {
      alert("L'adresse email est obligatoire.");
      return;
    }
    if (mode === 'add' && !formData.password.trim()) {
      alert("Le mot de passe partagé est obligatoire.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="glass border-border rounded-2xl p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                  Nom Complet <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <div className="relative group/input">
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nom complet" 
                    className="h-12 pl-4 pr-12 bg-muted/40 border-border rounded-xl" 
                  />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                  Adresse Email <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <div className="relative group/input">
                  <Input 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                    placeholder="email@agrisense.ai" 
                    className="h-12 pl-4 pr-12 bg-muted/40 border-border rounded-xl" 
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="col-span-2 sm:col-span-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Rôle Système</label>
                <div className="relative">
                  <select 
                    value={formData.role}
                    disabled={mode === 'edit' && initialData?.role === 'superadmin'}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full h-12 px-4 bg-muted/40 border border-border rounded-xl text-sm appearance-none outline-none"
                  >
                    <option value="farmer">Agriculteur (Farmer)</option>
                    {currentUserRole === 'superadmin' && <option value="admin">Administrateur (Admin)</option>}
                    {currentUserRole === 'superadmin' && initialData?.role === 'superadmin' && <option value="superadmin">Super Administrateur</option>}
                  </select>
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {mode === 'add' && (
                <div className="col-span-2 sm:col-span-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center">
                    Mot de Passe Partagé <span className="text-rose-500 font-bold ml-1">*</span>
                  </label>
                  <div className="relative group/input">
                    <Input 
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••••••" 
                      className="h-12 pl-4 pr-12 bg-muted/40 border-border rounded-xl font-mono" 
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}

              {formData.role === 'farmer' && (
                <div className="col-span-2 space-y-6 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Domaine Agricole</label>
                      <select 
                        value={formData.domain}
                        onChange={(e) => setFormData({...formData, domain: e.target.value})}
                        className="w-full h-12 px-4 bg-primary/5 border border-primary/20 rounded-xl text-sm outline-none"
                      >
                        <option value="">Sélectionner un domaine...</option>
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">ID Organisation</label>
                      <Input 
                        value={formData.organization_id}
                        onChange={(e) => setFormData({...formData, organization_id: e.target.value})}
                        placeholder="ORG-001" 
                        className="h-12 bg-primary/5 border-primary/20 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass border-border rounded-2xl p-6 space-y-4">
             <div className="bg-muted/20 rounded-2xl p-6 text-center border border-border">
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary/20 ring-4 ring-primary/5">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{formData.name[0] || '?'}</AvatarFallback>
                </Avatar>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profil Identité</p>
             </div>
             <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-1">Résumé Sécurité</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase">
                  {formData.role === 'superadmin' ? 'Accès Niveau 0 : Contrôle total du Kernel.' : 
                   formData.role === 'admin' ? 'Accès Niveau 1 : Gestion des utilisateurs agricoles.' :
                   'Accès Niveau 2 : Interface de production uniquement.'}
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4">
        <Button variant="ghost" type="button" onClick={onCancel} className="px-8 rounded-xl h-12 text-[11px] font-black uppercase tracking-[0.2em]">
          Annuler
        </Button>
        <Button type="submit" className="px-10 rounded-xl h-12 text-[11px] font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockConfirm, setBlockConfirm] = useState<{ show: boolean, user: UserData | null }>({ show: false, user: null });
  const [formConfig, setFormConfig] = useState<{ show: boolean, mode: 'add' | 'edit', user: UserData | null }>({ show: false, mode: 'add', user: null });
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Fetch me error:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchMe()]).finally(() => setLoading(false));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSubmitUser = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const isEdit = formConfig.mode === 'edit';
      const endpoint = isEdit ? `/api/auth/users/${formConfig.user?.id}` : '/api/auth/users';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (response.ok) {
        showToast(isEdit ? "Utilisateur mis à jour" : "Utilisateur créé avec succès");
        setFormConfig({ show: false, mode: 'add', user: null });
        fetchUsers();
      } else {
        showToast(result.message || "Erreur lors de l'opération", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion", "error");
    }
  };

  const handleBlock = async () => {
    if (!blockConfirm.user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/users/${blockConfirm.user.id}/block`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        showToast(`Utilisateur ${blockConfirm.user.status === 'blocked' ? 'débloqué' : 'bloqué'} avec succès`);
        setBlockConfirm({ show: false, user: null });
        fetchUsers();
      } else {
        const data = await response.json();
        showToast(data.message || "Erreur de suppression", "error");
      }
    } catch (error) {
      showToast("Erreur de connexion", "error");
    }
  };

  if (loading) return <div className="flex items-center justify-center p-20 text-muted-foreground">Authentification du Kernel...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
      <AnimatePresence>
        {toast.show && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
        )}
      </AnimatePresence>

      <Dialog open={blockConfirm.show} onOpenChange={(open) => setBlockConfirm(prev => ({ ...prev, show: open }))}>
        <DialogContent className="glass border-border rounded-3xl max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="font-serif italic text-2xl">{blockConfirm.user?.status === 'blocked' ? 'Débloquer' : 'Bloquer'} Profil</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment {blockConfirm.user?.status === 'blocked' ? 'débloquer' : 'bloquer'} l'accès de <span className="text-primary font-bold">{blockConfirm.user?.name}</span> ?
              {blockConfirm.user?.status !== 'blocked' && " Son compte existera toujours mais il ne pourra plus se connecter."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 flex gap-3">
            <Button variant="ghost" onClick={() => setBlockConfirm({ show: false, user: null })} className="flex-1 rounded-xl">Annuler</Button>
            <Button onClick={handleBlock} className={`flex-1 ${blockConfirm.user?.status === 'blocked' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'} rounded-xl`}>Confirmer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={formConfig.show} onOpenChange={(open) => setFormConfig(prev => ({ ...prev, show: open }))}>
        <DialogContent className="glass border-border rounded-3xl max-w-[95vw] lg:max-w-6xl p-0 overflow-hidden">
          <div className="max-h-[85vh] overflow-y-auto p-8 lg:p-12">
            <DialogHeader className="mb-8">
              <DialogTitle className="font-serif italic text-4xl">
                {formConfig.mode === 'add' ? 'Extension du Personnel' : 'Profil Utilisateur'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-4 text-lg">
                Gérez les privilèges et les accès opérationnels pour le réseau AgriSense.
              </DialogDescription>
            </DialogHeader>
            <UserForm 
              mode={formConfig.mode} 
              initialData={formConfig.user || {}} 
              onSubmit={handleSubmitUser}
              onCancel={() => setFormConfig({ show: false, mode: 'add', user: null })}
              currentUserRole={currentUser?.role || 'admin'}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic tracking-tighter text-foreground">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em]">Maillage opérationnel : {users.length} Nodes Actifs</p>
        </div>
        <Button 
          onClick={() => setFormConfig({ show: true, mode: 'add', user: null })}
          className="bg-primary text-primary-foreground hover:opacity-90 h-14 px-10 font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau Collaborateur
        </Button>
      </div>

      <Card className="glass overflow-hidden border-border/50 shadow-2xl">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border">
              <TableHead className="font-mono text-[10px] uppercase tracking-wider px-6 h-12">Identité</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider h-12">Type d'Accès</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider h-12">Spécialisation</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-wider h-12">Date de Création</TableHead>
              <TableHead className="w-[80px] px-6 h-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-muted/20 transition-colors group">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-border">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm tracking-tight text-foreground transition-colors group-hover:text-primary flex items-center">
                        {user.name}
                        {user.status === 'blocked' && (
                          <Badge variant="outline" className="ml-2 text-[10px] bg-destructive/10 text-destructive border-none py-0 h-4">Bloqué</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-md",
                    user.role === 'superadmin' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                    user.role === 'admin' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  )}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">{user.domain || 'Global Nucleus'}</span>
                </TableCell>
                <TableCell className="text-muted-foreground text-[10px] font-mono opacity-60">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 rounded-lg hover:bg-muted"
                      onClick={() => setFormConfig({ show: true, mode: 'edit', user })}
                    >
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    {user.role !== 'superadmin' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`w-8 h-8 rounded-lg ${user.status === 'blocked' ? 'hover:bg-primary/10 text-primary' : 'hover:bg-destructive/10 text-destructive'}`}
                        onClick={() => setBlockConfirm({ show: false, user: null })} // Placeholder: implementation below
                        onMouseUp={() => setBlockConfirm({ show: true, user })}
                        title={user.status === 'blocked' ? 'Débloquer' : 'Bloquer'}
                      >
                        {user.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
