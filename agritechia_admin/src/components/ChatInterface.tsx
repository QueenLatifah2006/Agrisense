'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Paperclip, 
  Mic, 
  MoreHorizontal,
  ChevronDown,
  Sprout,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello Sarah! I detected a slight moisture drop in Section B2. Would you like me to adjust the irrigation schedule for today?',
      timestamp: '10:30 AM',
      suggestions: ['Adjust Schedule', 'View Telemetry', 'Remind Me Later']
    },
    {
      id: '2',
      role: 'user',
      content: 'Yes, please adjust it for 15% more yield output.',
      timestamp: '10:32 AM'
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Processing... Optimization complete. Irrigation increased by 15% in Sector B2. I calibrated for the expected heat spike at 2:00 PM.',
      timestamp: '10:32 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-[2.5rem] overflow-hidden emerald-glow animate-in zoom-in-95 duration-500 shadow-2xl">
      {/* Chat Header */}
      <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Sparkles className="w-6 h-6 text-primary shadow-lg shadow-primary/50" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-secondary border-2 border-background" />
          </div>
          <div>
            <h3 className="font-serif italic text-lg tracking-tight">Agricultural Oracle</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-secondary border-secondary/20 bg-secondary/5 h-5">
                Active Insight
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Ver. 4.2.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:bg-muted rounded-xl">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-8">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className={`w-9 h-9 border ${msg.role === 'assistant' ? 'border-primary/20 shadow-sm shadow-primary/20' : 'border-border'}`}>
                {msg.role === 'assistant' ? (
                  <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                ) : (
                  <AvatarImage src="https://i.pravatar.cc/150?u=sarah" />
                )}
              </Avatar>
              
              <div className={`flex flex-col max-w-[80%] gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                  msg.role === 'assistant' 
                    ? 'bg-muted border border-border rounded-tl-none shadow-xl' 
                    : 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20'
                }`}>
                  {msg.content}
                </div>
                
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.suggestions.map((s, idx) => (
                      <Button key={idx} variant="outline" size="sm" className="h-8 rounded-full border-border bg-muted/50 hover:bg-muted hover:border-primary/50 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-all">
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
                
                <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Ops */}
      <div className="px-6 py-2 flex gap-4 overflow-x-auto no-scrollbar">
        {[
          { label: 'Irrigation', icon: CloudRain },
          { label: 'Soil Health', icon: Sprout },
          { label: 'Microclimate', icon: Thermometer },
        ].map((op, i) => (
          <button key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all whitespace-nowrap">
            <op.icon className="w-3.5 h-3.5" />
            {op.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-background/40 to-transparent border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center gap-3 bg-muted/80 backdrop-blur-md border border-border rounded-[2rem] p-2 pl-4 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-500 shadow-xl">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ex: Analyse le rendement du Secteur B2..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 resize-none max-h-32 min-h-[44px] no-scrollbar placeholder:text-muted-foreground/60 text-foreground"
                rows={1}
              />
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-10 h-10 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Attacher un fichier"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-10 h-10 rounded-full text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                title="Commande vocale"
              >
                <Mic className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button 
                size="icon" 
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all emerald-glow"
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-3">
            <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-[0.25em]">
              Precision AI Agent v4.2
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
              <span className="text-[9px] text-secondary/40 uppercase font-black tracking-widest">Neural Link Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
