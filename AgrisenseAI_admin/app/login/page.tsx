'use client';

import React, { useState } from 'react';
import { 
  Sprout, 
  Users, 
  Lock, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const [mode, setMode] = useState<'login' | 'forgot-email' | 'forgot-code' | 'forgot-new-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '']);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setErrorMsg(null), 60000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSuccessMsg(null), 60000);
  };

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email || !password) {
      showError("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.user.role === 'farmer') {
          showError("Accès refusé : Les comptes Agriculteurs sont réservés à l'application mobile.");
          return;
        }
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        showError(data.message || "Identifiants invalides");
      }
    } catch (error) {
      showError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    setErrorMsg(null);
    if (!email) return;

    const validateEmail = (em: string) => {
      const isLower = em === em.toLowerCase();
      const hasAt = em.includes('@');
      const hasDot = em.includes('.');
      return isLower && hasAt && hasDot;
    };

    if (!validateEmail(email)) {
      showError("L'email doit être en minuscule et contenir un @ et un point.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setMode('forgot-code');
        showSuccess("Code de vérification envoyé sur votre email !");
      } else {
        showError(data.message || "Erreur lors de l'envoi");
      }
    } catch (error) {
      showError("Erreur de connexion");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrorMsg(null);
    const verificationCode = code.join('');
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await response.json();
      if (response.ok) {
        setMode('forgot-new-password');
      } else {
        showError(data.message || "Code invalide");
      }
    } catch (error) {
      showError("Erreur de connexion");
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    if (!newPassword) {
      showError("Veuillez entrer un nouveau mot de passe");
      return;
    }

    const validatePassword = (pass: string) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
      return regex.test(pass);
    };

    if (!validatePassword(newPassword)) {
      showError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code: code.join(''), 
          newPassword 
        })
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess("Mot de passe réinitialisé !");
        setMode('login');
        setPassword('');
      } else {
        showError(data.message || "Erreur lors de la réinitialisation");
      }
    } catch (error) {
      showError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 4) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] animate-pulse opacity-50" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-secondary/10 backdrop-blur-md border border-secondary/20 text-secondary mb-6 shadow-2xl shadow-primary/20">
            <Sprout className="w-10 h-10" />
          </div>
          <motion.h1 key={mode} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-serif italic bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 mb-2">
            {mode === 'login' ? 'AgriSense AI' : mode === 'forgot-email' ? 'Récupération' : mode === 'forgot-code' ? 'Vérification' : 'Nouveau Clé'}
          </motion.h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
            {mode === 'login' ? 'Precision Agricultural Intelligence' : mode === 'forgot-email' ? 'Email administrateur obligatoire' : mode === 'forgot-code' ? 'Entrez le code à 5 chiffres' : 'Définissez votre nouvelle clé d\'accès'}
          </p>
          {error === 'restricted' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-[10px] font-bold uppercase tracking-wider">
              Accès refusé : Interface réservée aux administrateurs
            </motion.div>
          )}

          <AnimatePresence>
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium flex items-center justify-center gap-2">
                <span className="bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">!</span>
                {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="glass p-8 rounded-[2rem] shadow-[0_0_25px_-5px_var(--primary)] shadow-primary/20">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Operational ID <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah.connor@agrisense.ai" 
                        className="h-14 pl-12 bg-muted border-border rounded-2xl" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Access Key <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <button onClick={() => setMode('forgot-email')} className="text-[10px] uppercase font-bold text-primary tracking-wider hover:opacity-80">Key Lost?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="h-14 pl-12 bg-muted border-border rounded-2xl" 
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    disabled={isLoading}
                    className="w-full h-14 bg-primary text-primary-foreground text-md font-bold rounded-2xl hover:opacity-90 shadow-xl shadow-primary/20 group"
                  >
                    {isLoading ? 'Authentification...' : 'Authenticate Session'} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <div className="flex items-center gap-4 py-2"><div className="h-px flex-1 bg-border" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Secondary Auth</span><div className="h-px flex-1 bg-border" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-12 border-border glass rounded-xl text-xs gap-2"><img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Google</Button>
                    <Button variant="outline" className="h-12 border-border glass rounded-xl text-xs gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Bio-Login</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {mode === 'forgot-email' && (
            <motion.div key="forgot-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass p-8 rounded-[2rem]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Email Administrateur <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre.email@agrisense.ai" className="h-14 pl-12 bg-muted border-border rounded-2xl" />
                    </div>
                  </div>
                  <Button disabled={isSending || !email} onClick={handleSendCode} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl">{isSending ? 'Envoi...' : 'Envoyer le code'}</Button>
                  <button onClick={() => setMode('login')} className="w-full text-center text-[10px] font-bold uppercase text-muted-foreground hover:text-primary">Retour</button>
                </div>
              </Card>
            </motion.div>
          )}

          {mode === 'forgot-code' && (
            <motion.div key="forgot-code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass p-8 rounded-[2rem]">
                <div className="space-y-8">
                  <div className="flex justify-between gap-3">
                    {code.map((digit, idx) => (
                      <input key={idx} id={`code-${idx}`} type="text" maxLength={1} value={digit} onChange={(e) => handleCodeChange(idx, e.target.value)} className="w-full aspect-square border-2 border-border bg-muted rounded-2xl text-center text-2xl font-bold focus:border-primary outline-none" />
                    ))}
                  </div>
                  <Button disabled={code.some(d => !d)} onClick={handleVerifyCode} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl">Vérifier</Button>
                  <div className="text-center"><button onClick={() => setMode('forgot-email')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Renvoyer le code</button></div>
                </div>
              </Card>
            </motion.div>
          )}

          {mode === 'forgot-new-password' && (
            <motion.div key="forgot-new-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="glass p-8 rounded-[2rem]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Nouveau Mot de Passe <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••" 
                        className="h-14 pl-12 bg-muted border-border rounded-2xl" 
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading || !newPassword} onClick={handleResetPassword} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-2xl">
                    {isLoading ? 'Réinitialisation...' : 'Changer le mot de passe'}
                  </Button>
                  <button onClick={() => setMode('login')} className="w-full text-center text-[10px] font-bold uppercase text-muted-foreground hover:text-primary">Annuler</button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-center mt-12 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.3em] opacity-40">Authorized Access Only</p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Initialisation du Kernel...</div>}>
      <LoginContent />
    </Suspense>
  );
}
