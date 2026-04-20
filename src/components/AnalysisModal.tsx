import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Brain, Zap, Construction } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: any[];
  boardName: string;
}

export function AnalysisModal({ isOpen, onClose }: AnalysisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card/98 backdrop-blur-2xl border-border text-foreground overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-accent-green" />
            <DialogTitle className="text-2xl font-display uppercase tracking-tight">Clyde's War Room Analysis</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
            <Construction className="w-16 h-16 text-accent-green/50" />
            <h3 className="text-xl font-display uppercase tracking-widest text-foreground">AI Insight Coming Soon!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                Clyde is currently undergoing a major hardware upgrade to offer even sharper insights. Check back later!
            </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
