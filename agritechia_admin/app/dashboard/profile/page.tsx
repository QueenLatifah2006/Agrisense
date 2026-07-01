'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Camera,
  CheckCircle2,
  Edit,
  Palette,
  Briefcase,
  Lock,
  Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme-context';

export default function ProfilePage() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80');

  const [user, setUser] = useState<any>(null);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchMe = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setFullname(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '+237 600 000 000');
        if (data.avatar) {
          setAvatar(data.avatar);
        }
      }
    } catch (error) {
      console.error('Fetch me error:', error);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpdate = async () => {
    if (!fullname.trim()) {
      alert("Le nom complet est obligatoire.");
      return;
    }
    if (!email.trim()) {
      alert("L'email professionnel est obligatoire.");
      return;
    }
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!user) return;
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: fullname,
          email,
          phone,
          role: user.role,
          domain: user.domain,
          organization_id: user.organization_id,
          profile_picture: avatar
        })
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Mettre à jour les infos locales pour le header (optionnel)
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (e) {
      console.error('Error updating profile:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-bold text-sm uppercase tracking-widest">Profil mis à jour avec succès</p>
          </motion.div>
        )}
      </AnimatePresence>      <div className="mb-10">
        <h2 className="text-4xl font-serif italic tracking-tight text-foreground">Profil Administrateur</h2>
        <p className="text-muted-foreground mt-2 font-medium">Gerez vos informations personnelles et configurez vos preferences de securite.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Identity & Preferences */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="glass border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <div className="relative group/avatar">
              <Avatar className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-transform duration-500 group-hover:scale-105">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">JD</AvatarFallback>
              </Avatar>
              <button 
                onClick={triggerFileInput}
                className="absolute bottom-1 right-1 w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/avatar:opacity-100"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>

            <button 
              onClick={triggerFileInput}
              className="mt-4 text-primary text-[10px] font-bold uppercase hover:underline underline-offset-4"
            >
              Modifier la photo
            </button>

            <h3 className="text-xl font-serif italic text-foreground tracking-tight">{user?.name || 'Chargement...'}</h3>
            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{user?.role || 'Rôle'}</p>

            <div className="mt-8 w-full space-y-4 pt-8 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Statut</span>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] tracking-widest uppercase">Actif</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Organisation</span>
                <span className="text-foreground font-mono text-[11px]">{user?.organization_id || 'N/A'}</span>
              </div>
            </div>
          </Card>

          <Card className="glass border-border rounded-2xl p-6 shadow-2xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center">
              <Palette className="w-3.5 h-3.5 mr-2 text-primary" /> Préférences d'affichage
            </h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Thème Sombre</span>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Notifications Push</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">Alertes de capteurs</span>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings Form */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* General Info */}
          <Card className="glass border-border rounded-2xl p-8 shadow-2xl overflow-hidden relative">
            <h4 className="text-lg font-serif italic mb-8 flex items-center text-foreground">
              <User className="w-5 h-5 mr-3 text-primary" /> Informations Personnelles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center">
                  Nom Complet <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <div className="relative">
                  <Input 
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center">
                  Email Professionnel <span className="text-rose-500 font-bold ml-1">*</span>
                </label>
                <div className="relative">
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Domaine / Organisation</label>
                <div className="h-12 bg-muted/40 border border-border rounded-xl px-4 text-foreground text-sm flex items-center justify-between">
                  <span className="font-mono text-xs">{user?.domain || 'Non spécifié'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Téléphone</label>
                <Input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none" 
                />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="glass border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <h4 className="text-lg font-serif italic mb-8 flex items-center text-foreground">
              <Shield className="w-5 h-5 mr-3 text-primary" /> Sécurité du Compte
            </h4>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ancien mot de passe</label>
                <Input 
                  type="password"
                  placeholder="••••••••••••"
                  className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none shadow-inner" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nouveau mot de passe</label>
                  <Input 
                    type="password"
                    className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none shadow-inner" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Confirmer le mot de passe</label>
                  <Input 
                    type="password"
                    className="h-12 bg-muted/40 border-border rounded-xl px-4 text-foreground hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none shadow-inner" 
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button 
              variant="outline" 
              className="px-10 rounded-xl h-12 text-[11px] font-bold uppercase tracking-widest border-border text-muted-foreground hover:bg-muted transition-all"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-10 rounded-xl h-12 text-[11px] font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-emerald-600 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] min-w-[240px]"
            >
              {isUpdating ? 'Synchronisation...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
