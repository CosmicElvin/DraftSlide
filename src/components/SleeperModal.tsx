import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bot, TrendingUp, Shield, Zap, Target } from 'lucide-react';
import { Prospect } from '../types';
import { SleeperPick } from '../services/geminiService';

interface SleeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  pick: SleeperPick | null;
  prospect: Prospect | null;
}

export function SleeperModal({ isOpen, onClose, pick, prospect }: SleeperModalProps) {
  if (!isOpen || !pick || !prospect) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-card/98 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-green/10 rounded-xl">
                <Bot className="w-6 h-6 text-accent-green" />
              </div>
              <div>
                <h2 className="text-2xl font-display uppercase tracking-tight text-white line-height-1">Clyde's Sleeper</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-green/60">High-Value Target Locked</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8">
            {/* Prospect Preview */}
            <div className="flex items-center gap-6 mb-10 bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="w-20 h-20 rounded-xl bg-white p-3 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                <img src={prospect.logo} alt={prospect.school} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-3xl font-display uppercase leading-none mb-2 text-white">{prospect.name}</h3>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{prospect.position}</span>
                  <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  <span>{prospect.school}</span>
                  <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  <span className="text-accent-green">Consensus #{prospect.consensusRank}</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-4">Scouting Report</h4>
                <p className="text-white/80 text-lg leading-relaxed font-medium italic">
                  "{pick.report}"
                </p>
              </div>

              <div className="bg-accent-green/10 p-6 rounded-2xl border border-accent-green/20">
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Why He's A Sleeper
                </h4>
                <p className="text-accent-green/90 text-sm leading-relaxed font-bold">
                  {pick.defense}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-accent-green text-black font-black uppercase text-[11px] tracking-widest hover:bg-accent-green/90 transition-all active:scale-95"
            >
              Close War Room
            </button>
          </div>

          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/10 blur-[60px] pointer-events-none -z-10" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
