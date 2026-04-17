import React from 'react';
import { Trophy, Users, Briefcase, ChevronRight } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export function LandingPage({ onNavigate }: { onNavigate: (tab: 'rankings' | 'friends' | 'profile' | 'my-boards') => void }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <img 
          src="https://i.imgur.com/omyuAlQ.png" 
          alt="DraftSlide" 
          className="h-8 w-auto object-contain mb-12 mx-auto" 
          referrerPolicy="no-referrer"
        />
        <h1 className="text-4xl md:text-5xl font-display uppercase tracking-tighter mb-6">Master the Draft</h1>
        <p className="text-base text-muted-foreground font-medium mb-8 leading-relaxed">
          The ultimate platform for creating custom draft boards, sharing insights with friends, analyzing prospect data, and comparing your draft takes against real-world outcomes.
        </p>
        
        <button 
          onClick={signInWithGoogle}
          className="px-8 py-3 bg-accent-green text-black font-black uppercase text-xs tracking-widest hover:bg-accent-green/90 transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          Get Started <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 mb-12">
        <button 
          onClick={() => onNavigate('rankings')}
          className="px-6 py-2 bg-card border border-border hover:border-accent-green transition-all text-xs font-bold uppercase tracking-widest"
        >
          NBA
        </button>
        <button 
          disabled
          className="px-6 py-2 bg-card border border-border opacity-50 cursor-not-allowed text-xs font-bold uppercase tracking-widest"
        >
          NFL (Coming Soon)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <button 
          onClick={() => onNavigate('rankings')}
          className="group p-6 bg-card border border-border hover:border-accent-green transition-all text-center flex flex-col items-center justify-center"
        >
          <Trophy className="w-6 h-6 text-accent-green mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-display uppercase mb-1">Analyze</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">Prospect data & AI insights.</p>
        </button>

        <button 
          onClick={() => onNavigate('my-boards')}
          className="group p-6 bg-card border border-border hover:border-accent-green transition-all text-center flex flex-col items-center justify-center"
        >
          <Briefcase className="w-6 h-6 text-accent-green mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-display uppercase mb-1">Manage</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">Custom draft boards & notes.</p>
        </button>

        <button 
          onClick={() => onNavigate('friends')}
          className="group p-6 bg-card border border-border hover:border-accent-green transition-all text-center flex flex-col items-center justify-center"
        >
          <Users className="w-6 h-6 text-accent-green mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-xs font-display uppercase mb-1">Share</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">Collaborate with friends.</p>
        </button>
      </div>
    </div>
  );
}
