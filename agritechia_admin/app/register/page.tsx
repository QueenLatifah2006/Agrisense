'use client';

import React from 'react';
import { 
  Sprout, 
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    name: '',
    organization_id: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async () => {
    const validatePassword = (pass: string) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      return regex.test(pass);
    };

    const validateEmail = (email: string) => {
      const isLower = email === email.toLowerCase();
      const hasAt = email.includes('@');
      const hasDot = email.includes('.');
      return isLower && hasAt && hasDot;
    };

    if (!validateEmail(formData.email)) {
      alert("L'email doit être en minuscule et contenir un @ et un point.");
      return;
    }

    if (!validatePassword(formData.password)) {
      alert("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization_id: formData.organization_id,
          role: 'admin'
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        alert(data.message || "Erreur lors de l'inscription");
      }
    } catch (error) {
      alert("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif italic bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 mb-2">Inscription Administrateur</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">New Node Initialization</p>
        </div>

        <Card className="glass p-8 rounded-[2.5rem] shadow-[0_0_25px_-5px_var(--primary)] shadow-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nom complet</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Sarah Connor" 
                className="h-12 bg-muted border-border rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Identifiant Organisation</label>
              <Input 
                value={formData.organization_id}
                onChange={(e) => setFormData({...formData, organization_id: e.target.value})}
                placeholder="ORG-772" 
                className="h-12 bg-muted border-border rounded-xl" 
              />
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Professionnel</label>
              <Input 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="admin@agrisense.ai" 
                className="h-12 bg-muted border-border rounded-xl" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Clé d'Accès</label>
              <Input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••••••" 
                className="h-12 bg-muted border-border rounded-xl font-mono" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirmer Clé</label>
              <Input 
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••••••" 
                className="h-12 bg-muted border-border rounded-xl font-mono" 
              />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-2xl border border-border">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                En tant qu'administrateur, vous aurez un contrôle total sur les noeuds de capteurs, les cycles de culture et la gestion du personnel.
              </p>
            </div>
            <Button 
              onClick={handleSignup} 
              disabled={loading}
              className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/30"
            >
              {loading ? 'Initialisation...' : 'Initialiser Node Admin'}
            </Button>
            <Button onClick={() => router.push('/login')} variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary">Retour à la connexion</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
