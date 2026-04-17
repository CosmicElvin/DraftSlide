import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { History, Sparkles, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TimeMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimeMachineModal({ isOpen, onClose }: TimeMachineModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <History className="w-6 h-6 text-accent-green" />
            <DialogTitle className="text-2xl font-display uppercase tracking-tight">The Time Machine</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center text-center space-y-6">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="absolute inset-0 bg-accent-green/20 blur-3xl rounded-full" />
            <Clock className="w-24 h-24 text-accent-green relative z-10" />
          </motion.div>

          <div className="space-y-4">
            <h3 className="text-xl font-display uppercase text-accent-green flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" /> Flux Capacitor Charging...
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Whoa there, GM! You're trying to grade the future before it even happens. 
              The Time Machine is currently recalibrating its chronal sensors.
            </p>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-green block mb-1">Estimated Arrival</span>
              <div className="text-2xl font-display uppercase">Post All-Star Break</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">2027 Season</div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              "Patience is a virtue, but a lottery pick is a necessity." — Clyde
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
