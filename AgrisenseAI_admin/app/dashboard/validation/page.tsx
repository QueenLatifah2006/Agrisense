'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckSquare, 
  Layers, 
  Brain, 
  MapPin, 
  Coins, 
  Calendar, 
  User, 
  Check, 
  X, 
  Loader2, 
  Eye, 
  Search,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Database,
  Sparkles,
  Plus,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FarmerNote {
  id: number;
  farmerName: string;
  cropName: string;
  price: number;
  zone: string;
  recordedAt: string;
  content: string;
  pdfName: string;
  status: 'pending' | 'validated';
  knowledgeBaseStored: boolean;
  cloudinaryUrl?: string;
}

interface ChatReport {
  id: number;
  userId: number;
  userName: string;
  title: string;
  lastMessage: string;
  status: 'active' | 'pending' | 'validated';
  cloudinaryUrl?: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

export default function ValidationPage() {
  const [activeTab, setActiveTab] = useState<'notes' | 'chats'>('notes');
  
  // Note states
  const [notes, setNotes] = useState<FarmerNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<FarmerNote | null>(null);
  
  // Chat states
  const [chats, setChats] = useState<ChatReport[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatReport | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Note submission modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newNoteForm, setNewNoteForm] = useState({
    farmerName: '',
    cropName: 'Maïs Jaune',
    price: '',
    zone: 'Yaoundé, Zone Centre',
    content: ''
  });

  // Load farmer notes pending validation
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/crops/notes/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
        // Default select first pending note
        const firstPending = data.find((n: FarmerNote) => n.status === 'pending');
        setSelectedNote(firstPending || data[0] || null);
      }
    } catch (e) {
      console.error('Error fetching farmer notes:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load inactive chats pending validation
  const fetchChats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/chats/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
        // Default select first pending chat
        const firstPending = data.find((c: ChatReport) => c.status === 'pending');
        const defaultChat = firstPending || data[0] || null;
        setSelectedChat(defaultChat);
        if (defaultChat) {
          fetchChatMessages(defaultChat.id);
        }
      }
    } catch (e) {
      console.error('Error fetching chats:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: number) => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (e) {
      console.error('Error fetching chat messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNotes();
    } else {
      fetchChats();
    }
  }, [activeTab]);

  // Handle new note submission
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteForm.farmerName || !newNoteForm.cropName || !newNoteForm.price || !newNoteForm.zone) {
      setSubmitError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/crops/notes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerName: newNoteForm.farmerName.trim(),
          cropName: newNoteForm.cropName.trim(),
          price: Number(newNoteForm.price),
          zone: newNoteForm.zone,
          content: newNoteForm.content.trim()
        })
      });
      if (response.ok) {
        const created = await response.json();
        setNewNoteForm({
          farmerName: '',
          cropName: 'Maïs Jaune',
          price: '',
          zone: 'Yaoundé, Zone Centre',
          content: ''
        });
        setIsModalOpen(false);
        setFeedbackMsg(`Note de terrain de l'agriculteur ${created.farmerName} soumise avec succès au format PDF !`);
        await fetchNotes();
        // Select the newly submitted note in the queue
        const match = notes.find(n => n.id === created.id) || created;
        setSelectedNote(match);
        setTimeout(() => {
          setFeedbackMsg(null);
        }, 5000);
      } else {
        const errInfo = await response.json();
        setSubmitError(errInfo.message || "Impossible d'enregistrer la note agricole.");
      }
    } catch (err) {
      console.error("Error submitting note:", err);
      setSubmitError("Une erreur réseau s'est produite lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle superadmin PDF validation and knowledge base ingestion
  const handleValidateNote = async (id: number) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/crops/notes/${id}/validate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setFeedbackMsg(`Note ${selectedNote?.pdfName} validée avec succès et stockée dans la base de connaissance IA !`);
        
        // Refresh notes state from backend
        await fetchNotes();
        
        // Find next pending or retain selection
        setTimeout(() => {
          setFeedbackMsg(null);
        }, 5000);
      }
    } catch (e) {
      console.error('Error validating note:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleValidateChat = async (id: number) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/chats/${id}/validate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setFeedbackMsg(`Conversation validée avec succès et stockée dans l'archive finale Cloudinary !`);
        await fetchChats();
        setTimeout(() => {
          setFeedbackMsg(null);
        }, 5000);
      }
    } catch (e) {
      console.error('Error validating chat:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectNote = async (id: number) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/crops/notes/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setFeedbackMsg(`Note rejetée avec succès.`);
        await fetchNotes();
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch (e) {
      console.error('Error rejecting note:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectChat = async (id: number) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/chats/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setFeedbackMsg(`Conversation rejetée avec succès.`);
        await fetchChats();
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch (e) {
      console.error('Error rejecting chat:', e);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter notes by query search
  const filteredNotes = notes.filter(n => 
    n.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.pdfName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter chats by query search
  const filteredChats = chats.filter(c => 
    c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 text-foreground min-h-screen">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px]">Superadmin review pipeline</Badge>
            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest text-[10px]">Mémoire externe LLM</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground uppercase">
            {activeTab === 'notes' ? "VALIDATION DES NOTES DE TERRAIN" : "VALIDATION DES CONVERSATIONS IA"}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {activeTab === 'notes' 
              ? "Révision, validation des rapports PDF d'agriculteurs et indexation automatique dans la base de connaissances IA." 
              : "Validation des historiques de discussion clos pour inactivité et archivage sémantique final sur Cloudinary."}
          </p>
        </div>
        
        {/* Total counts badges & Sim submission button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {activeTab === 'notes' && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-primary/15"
            >
              <Plus className="w-4 h-4" />
              Nouveau PDF de terrain
            </Button>
          )}

          <Badge variant="outline" className="border-border text-foreground px-4 h-10 flex items-center py-2 text-xs font-mono bg-muted/20">
            En attente : <span className="text-amber-500 font-bold ml-1">
              {activeTab === 'notes' ? notes.filter(n => n.status === 'pending').length : chats.filter(c => c.status === 'pending').length}
            </span>
          </Badge>
          <Badge variant="outline" className="border-border text-foreground px-4 h-10 flex items-center py-2 text-xs font-mono bg-muted/20">
            Validé : <span className="text-emerald-500 font-bold ml-1">
              {activeTab === 'notes' ? notes.filter(n => n.status === 'validated').length : chats.filter(c => c.status === 'validated').length}
            </span>
          </Badge>
        </div>
      </div>

      {/* 1.5. Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-border pb-1">
        <button
          onClick={() => { setActiveTab('notes'); setSearchQuery(''); }}
          className={cn(
            "pb-3 pt-1 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === 'notes'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Notes Agricoles
        </button>
        <button
          onClick={() => { setActiveTab('chats'); setSearchQuery(''); }}
          className={cn(
            "pb-3 pt-1 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2",
            activeTab === 'chats'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Conversations Inactives
        </button>
      </div>

      {feedbackMsg && (
        <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-4 rounded-lg flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-inner">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. Left and Right Panel Split-screen workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Notes list queue (5 Cols) */}
        <Card className="lg:col-span-5 bg-card border-border shadow-2xl flex flex-col max-h-[750px] overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-lg font-bold uppercase tracking-tight">
              {activeTab === 'notes' ? "File d'attente des PDF d'agriculteurs" : "Historique des conversations closes"}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {activeTab === 'notes' 
                ? "Sélectionnez une note pour lister ses données extraites par l'IA ou à valider." 
                : "Sélectionnez un chat clos pour afficher son historique et valider son rapport final."}
            </CardDescription>
            
            {/* Search filter input */}
            <div className="relative mt-3 group">
              <Input
                placeholder={activeTab === 'notes' ? "Rechercher par paysan, culture..." : "Rechercher par utilisateur, sujet..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-muted/20 border-border rounded-lg text-xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
          </CardHeader>

          <div className="flex-1 p-4 divide-y divide-border overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Calcul du pipeline...</p>
              </div>
            ) : activeTab === 'notes' ? (
              filteredNotes.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Aucune note trouvée</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {filteredNotes.map((note) => {
                    const isActive = selectedNote?.id === note.id;
                    const isPending = note.status === 'pending';
                    return (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className={cn(
                          "p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2.5",
                          isActive
                            ? "bg-primary/5 border-primary shadow-lg shadow-primary/5 translate-x-1"
                            : "bg-muted/10 border-border hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border",
                              isPending 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-foreground truncate max-w-[180px]">{note.farmerName}</h4>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase">{note.cropName}</p>
                            </div>
                          </div>
                          
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            isPending 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          )}>
                            {isPending ? "Attente Révision" : "Validé & Stocké"}
                          </Badge>
                        </div>

                        {/* Code formatting preview filename criteria */}
                        <div className="text-[10px] font-mono text-muted-foreground tracking-tight bg-muted/40 p-2 rounded truncate">
                          {note.pdfName}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 border-t border-border/10 pt-2 font-mono">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> {note.zone.split(',')[0]}</span>
                          <span>{note.recordedAt.replace('_', ' • ')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              filteredChats.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Aucune conversation trouvée</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {filteredChats.map((chat) => {
                    const isActive = selectedChat?.id === chat.id;
                    const isPending = chat.status === 'pending';
                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setSelectedChat(chat);
                          fetchChatMessages(chat.id);
                        }}
                        className={cn(
                          "p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2.5",
                          isActive
                            ? "bg-primary/5 border-primary shadow-lg shadow-primary/5 translate-x-1"
                            : "bg-muted/10 border-border hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border",
                              isPending 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}>
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-foreground truncate max-w-[180px]">{chat.userName}</h4>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase truncate max-w-[180px]">{chat.title}</p>
                            </div>
                          </div>
                          
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            isPending 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          )}>
                            {isPending ? "Attente Révision" : "Validé & Certifié"}
                          </Badge>
                        </div>

                        <div className="text-[10px] text-muted-foreground tracking-tight line-clamp-2 bg-muted/40 p-2 rounded italic">
                          "{chat.lastMessage}"
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 border-t border-border/10 pt-2 font-mono">
                          <span>Chat ID: #{chat.id}</span>
                          <span>{new Date(chat.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </Card>

        {/* Right Side: PDF detailed document viewer & validation action controls (7 Cols) */}
        <Card className="lg:col-span-7 bg-card border-border shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
          {activeTab === 'notes' ? (
            selectedNote ? (
              <>
                {/* Document Reader Header */}
                <div className="bg-muted/15 border-b border-border py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Aperçu du Rapport PDF / Note Agricole</h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-[9px] px-2 py-1 uppercase bg-muted/30">
                    Mode révision superadmin
                  </Badge>
                </div>

                {/* Internal simulated PDF workspace */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  
                  {/* Simulated clean white paper sheet */}
                  <div className="border border-border/80  p-6 md:p-8 rounded-lg bg-white/5 font-serif shadow-inner space-y-6 flex-1 text-foreground">
                    
                    {/* PDF top details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-4 gap-4 font-sans justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-emerald-500 font-bold block mb-1">AGRISENSE BACKOFFICE • PDF TRANSMISSION QUEUE</span>
                        <h4 className="text-sm font-black text-foreground font-sans tracking-wide">{selectedNote.pdfName}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Généré via l'application Mobile AgriSense (Mes Cultures)</p>
                      </div>
                      <div className="text-right font-sans text-[10px] text-muted-foreground shrink-0 leading-relaxed">
                        <div>ID Transmission: #FNOTE-{selectedNote.id.toString().padStart(4, '0')}</div>
                        <div>Statut : {selectedNote.status === 'pending' ? <span className="text-amber-500 font-bold">À VALIDER</span> : <span className="text-emerald-500 font-bold">ARCHIVÉ</span>}</div>
                        <div>Date : {selectedNote.recordedAt.split('_')[0]}</div>
                      </div>
                    </div>

                    {/* Automatic AI Information Extraction block */}
                    <div className="space-y-3 font-sans">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <Database className="w-4 h-4" />
                        Données extraites automatiquement par l'IA (Calibration requise)
                      </span>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded border border-border/40 text-[11px]">
                        <div>
                          <span className="text-muted-foreground uppercase tracking-widest text-[8px] font-black block mb-0.5">Culture Détectée</span>
                          <div className="font-bold flex items-center gap-1 text-foreground"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {selectedNote.cropName}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground uppercase tracking-widest text-[8px] font-black block mb-0.5">Prix Relevé (FCFA)</span>
                          <div className="font-bold flex items-center gap-1 text-foreground"><Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {selectedNote.price} FCFA / kg</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground uppercase tracking-widest text-[8px] font-black block mb-0.5">Zone & GPS</span>
                          <div className="font-bold flex items-center gap-1 text-foreground truncate"><MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {selectedNote.zone.split(',')[0]}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground uppercase tracking-widest text-[8px] font-black block mb-0.5">Date d'Envoi</span>
                          <div className="font-bold flex items-center gap-1 text-foreground"><Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {selectedNote.recordedAt.replace('_', ' • ')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Letter content of the farmer */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground font-sans block border-b border-border/20 pb-1">Texte intégral de la note de terrain</span>
                      <p className="leading-relaxed text-muted-foreground text-sm font-serif italic whitespace-pre-line bg-muted/10 p-4 rounded border border-border/10 quote">
                        "{selectedNote.content}"
                      </p>
                    </div>

                    {/* AI feedback recommendation */}
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2 font-sans text-xs">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                        <span className="font-bold text-foreground">Évaluation d'ingestion IA (LLM RAG Pipeline)</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Ce rapport fournit des informations directes issues de transactions bord champ. Une fois validé par le superadmin, le système convertit ce document en mémoire RAG vectorisée, calibrant instantanément l'équation de régression linéaire de notre météo des prix de <b>{selectedNote.price} FCFA</b> pour la culture de <b>{selectedNote.cropName}</b> dans la région de <b>{selectedNote.zone.split(',')[0]}</b>.
                      </p>
                      {selectedNote.status === 'validated' && selectedNote.cloudinaryUrl && (
                        <div className="mt-3 bg-emerald-500/10 p-3 rounded border border-emerald-500/20 flex items-center justify-between gap-3 text-[11px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-500 block uppercase tracking-wider text-[9px]">Lien Cloudinary public</span>
                            <p className="text-muted-foreground text-[10px]">Copie certifiée archivée sur le serveur Cloud.</p>
                          </div>
                          <a
                            href={selectedNote.cloudinaryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-500 hover:text-emerald-400 font-bold underline shrink-0 flex items-center gap-1 text-[11px]"
                          >
                            Voir le PDF <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Validation command actions bar */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-5">
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {selectedNote.status === 'pending' ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>En attente de validation pour inscription dans la KB</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-500 font-bold">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Ce document est archivé et indexé de manière permanente.</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {selectedNote.status === 'pending' ? (
                        <>
                          <Button
                            disabled={processingId === selectedNote.id}
                            onClick={() => handleRejectNote(selectedNote.id)}
                            className="bg-destructive hover:bg-destructive/90 text-white font-black text-xs uppercase tracking-wider h-11 px-4 rounded-lg flex items-center gap-2 shadow-lg shadow-destructive/10 transition-all active:scale-95"
                          >
                            <X className="w-4 h-4" />
                            Rejeter
                          </Button>
                          <Button
                            disabled={processingId === selectedNote.id}
                            onClick={() => handleValidateNote(selectedNote.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider h-11 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
                          >
                            {processingId === selectedNote.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Ingestion...
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-4 h-4" />
                                Valider & Intégrer à la KB
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        selectedNote.cloudinaryUrl && (
                          <a
                            href={selectedNote.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95 text-center leading-[44px]"
                          >
                            <FileText className="w-4 h-4" />
                            Télécharger le PDF
                          </a>
                        )
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
                <FileText className="w-12 h-12 text-muted-foreground/20 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest">Sélectionnez un document d'agriculteur pour l'examiner.</p>
              </div>
            )
          ) : (
            selectedChat ? (
              <>
                {/* Document Reader Header */}
                <div className="bg-muted/15 border-b border-border py-4 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Aperçu de la Conversation Close</h3>
                  </div>
                  <Badge variant="outline" className="font-mono text-[9px] px-2 py-1 uppercase bg-muted/30">
                    Mode révision superadmin
                  </Badge>
                </div>

                {/* Internal simulated PDF workspace */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  
                  {/* Simulated clean white paper sheet */}
                  <div className="border border-border/80  p-6 md:p-8 rounded-lg bg-white/5 shadow-inner space-y-6 flex-1 text-foreground overflow-y-auto max-h-[480px]">
                    
                    {/* PDF top details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-border pb-4 gap-4 font-sans justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-emerald-500 font-bold block mb-1">AGRISENSE BACKOFFICE • CHAT ARCHIVE QUEUE</span>
                        <h4 className="text-sm font-black text-foreground font-sans tracking-wide">{selectedChat.title}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Dialogue clos pour inactivité de 30 min</p>
                      </div>
                      <div className="text-right font-sans text-[10px] text-muted-foreground shrink-0 leading-relaxed">
                        <div>ID Conversation: #CHAT-{selectedChat.id.toString().padStart(4, '0')}</div>
                        <div>Statut : {selectedChat.status === 'pending' ? <span className="text-amber-500 font-bold">À VALIDER</span> : <span className="text-emerald-500 font-bold">ARCHIVÉ</span>}</div>
                        <div>Date de clôture : {new Date(selectedChat.createdAt).toLocaleString('fr-FR')}</div>
                      </div>
                    </div>

                    {/* Chat Messages Display */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary block border-b border-border/20 pb-1">
                        Échanges de discussion
                      </span>

                      {loadingMessages ? (
                        <div className="py-12 text-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                          <p className="text-[9px] text-muted-foreground uppercase mt-2">Chargement des messages...</p>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Aucun message dans cette conversation.</p>
                      ) : (
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={cn(
                                "p-3 rounded-lg border text-xs max-w-[85%] leading-relaxed",
                                msg.sender === 'user'
                                  ? "bg-muted/20 border-border/40 ml-auto"
                                  : "bg-primary/5 border-primary/20 mr-auto"
                              )}
                            >
                              <div className="font-bold text-[9px] uppercase tracking-wider mb-1 text-muted-foreground">
                                {msg.sender === 'user' ? selectedChat.userName : "Assistant IA AgriSense"}
                              </div>
                              <p className="leading-relaxed whitespace-pre-line text-foreground">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI analysis feedback */}
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 space-y-2 font-sans text-xs">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                        <span className="font-bold text-foreground">Évaluation d'ingestion IA (Archivage sémantique)</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Cette conversation a été close après 30 minutes d'inactivité. Valider cette conversation générera un PDF certifié sur Cloudinary dans le dossier <b>`conversation/`</b>, et l'ajoutera à l'index sémantique de l'agriculteur <b>{selectedChat.userName}</b>.
                      </p>
                      {selectedChat.status === 'validated' && selectedChat.cloudinaryUrl && (
                        <div className="mt-3 bg-emerald-500/10 p-3 rounded border border-emerald-500/20 flex items-center justify-between gap-3 text-[11px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-500 block uppercase tracking-wider text-[9px]">Copie PDF Cloudinary</span>
                            <p className="text-muted-foreground text-[10px]">Certificat officiel de dialogue archivé.</p>
                          </div>
                          <a
                            href={selectedChat.cloudinaryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-500 hover:text-emerald-400 font-bold underline shrink-0 flex items-center gap-1 text-[11px]"
                          >
                            Voir le PDF <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Validation command actions bar */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-5">
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {selectedChat.status === 'pending' ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>En attente de validation par le SuperAdmin</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-500 font-bold">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Rapport de conversation officiellement certifié et validé.</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {selectedChat.status === 'pending' ? (
                        <>
                          <Button
                            disabled={processingId === selectedChat.id}
                            onClick={() => handleRejectChat(selectedChat.id)}
                            className="bg-destructive hover:bg-destructive/90 text-white font-black text-xs uppercase tracking-wider h-11 px-4 rounded-lg flex items-center gap-2 shadow-lg shadow-destructive/10 transition-all active:scale-95"
                          >
                            <X className="w-4 h-4" />
                            Rejeter
                          </Button>
                          <Button
                            disabled={processingId === selectedChat.id}
                            onClick={() => handleValidateChat(selectedChat.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider h-11 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
                          >
                            {processingId === selectedChat.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Certification...
                              </>
                            ) : (
                              <>
                                <CheckSquare className="w-4 h-4" />
                                Valider & Archiver PDF
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        selectedChat.cloudinaryUrl && (
                          <a
                            href={selectedChat.cloudinaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95 text-center leading-[44px]"
                          >
                            <FileText className="w-4 h-4" />
                            Télécharger le PDF
                          </a>
                        )
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest">Sélectionnez une conversation close pour l'examiner.</p>
              </div>
            )
          )}
        </Card>
        
      </div>

      {/* 3. Sliding / Floating Modal overlay for custom PDF report submission */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <h2 className="text-md font-bold text-foreground uppercase tracking-tight text-xs">Générer une Note de Terrain (PDF)</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitNote} className="p-5 space-y-4">
              {submitError && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-md text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Nom de l'Agriculteur / Observateur</label>
                <Input 
                  value={newNoteForm.farmerName}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, farmerName: e.target.value })}
                  placeholder="Ex: Paul Biya, Jeanne d'Arc..." 
                  className="bg-muted/10 border-border shadow-inner"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Culture / Produit</label>
                  <select 
                    value={newNoteForm.cropName}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, cropName: e.target.value })}
                    className="w-full h-10 px-3 bg-muted/20 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                  >
                    <option value="Maïs Jaune">Maïs Jaune</option>
                    <option value="Manioc Doux">Manioc Doux</option>
                    <option value="Café Arabica">Café Arabica</option>
                    <option value="Sorgho Rouge">Sorgho Rouge</option>
                    <option value="Igname Bêtê-Bêtê">Igname Bêtê-Bêtê</option>
                    <option value="Bananier-Plantain">Bananier-Plantain</option>
                    <option value="Cacao Brut">Cacao Brut</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Prix (FCFA / kg)</label>
                  <Input 
                    type="number"
                    value={newNoteForm.price}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, price: e.target.value })}
                    placeholder="Ex: 500" 
                    className="bg-muted/10 border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Zone Agro-Écologique / Marché</label>
                <select 
                  value={newNoteForm.zone}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, zone: e.target.value })}
                  className="w-full h-10 px-3 bg-muted/20 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  <option value="Yaoundé, Zone Centre">Yaoundé, Zone Centre</option>
                  <option value="Douala, Littoral">Douala, Littoral</option>
                  <option value="Bafoussam, Ouest">Bafoussam, Ouest</option>
                  <option value="Garoua, Nord">Garoua, Nord</option>
                  <option value="Maroua, Extrême-Nord">Maroua, Extrême-Nord</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Observations de terrain</label>
                <textarea 
                  value={newNoteForm.content}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, content: e.target.value })}
                  rows={3}
                  placeholder="Inscrivez les observations de récolte, de climat ou de logistique ici..."
                  className="w-full p-3 bg-muted/10 border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm tracking-tight"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs font-bold uppercase tracking-wider h-10 px-4">
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider h-10 px-5 flex items-center gap-1.5 shadow-lg shadow-primary/20">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Générer le PDF
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
