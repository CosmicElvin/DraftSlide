import React from 'react';
import { Prospect } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Target, Zap, Shield, Sword, Brain, Users, ArrowUp, Scale, Activity, Clock, Wind, AlertTriangle, Info } from 'lucide-react';

interface ProspectModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
}

const strengthIcons: Record<string, React.ReactNode> = {
  'Elite Scoring': <Sword className="w-4 h-4" />,
  'Shot Creation': <Target className="w-4 h-4" />,
  'Athleticism': <Zap className="w-4 h-4" />,
  'Wing Span': <ArrowUp className="w-4 h-4" />,
  'Basketball IQ': <Brain className="w-4 h-4" />,
  'Rebounding': <Scale className="w-4 h-4" />,
  'Interior Scoring': <Sword className="w-4 h-4" />,
  'Passing': <Users className="w-4 h-4" />,
  'Shot Making': <Target className="w-4 h-4" />,
  'Size for Position': <Scale className="w-4 h-4" />,
  'Ball Handling': <Activity className="w-4 h-4" />,
  'Defense': <Shield className="w-4 h-4" />,
  'Versatility': <Brain className="w-4 h-4" />,
  'Shot Blocking': <Shield className="w-4 h-4" />,
  'Transition Running': <Zap className="w-4 h-4" />,
  'Upside': <ArrowUp className="w-4 h-4" />,
  'Pick & Roll Play': <Users className="w-4 h-4" />,
  'Scoring Instincts': <Sword className="w-4 h-4" />,
  'Shooting Range': <Target className="w-4 h-4" />,
  'Playmaking': <Users className="w-4 h-4" />,
  'Pace': <Clock className="w-4 h-4" />,
  'On-ball Defense': <Shield className="w-4 h-4" />,
  'Speed': <Zap className="w-4 h-4" />,
  'Toughness': <Activity className="w-4 h-4" />,
  'Shooting': <Target className="w-4 h-4" />,
  'Length': <ArrowUp className="w-4 h-4" />,
  'Off-ball Movement': <Wind className="w-4 h-4" />,
  'Scoring Versatility': <Sword className="w-4 h-4" />,
  'Confidence': <Brain className="w-4 h-4" />,
  'Clutch Play': <Target className="w-4 h-4" />,
  'Physicality': <Scale className="w-4 h-4" />,
  'Motor': <Zap className="w-4 h-4" />
};

export function ProspectModal({ prospect, isOpen, onClose }: ProspectModalProps) {
  if (!prospect) return null;

  const nameParts = prospect.name.split(' ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-background border-2 border-border rounded-none">
        <ScrollArea className="flex-grow">
          <div className="p-10">
            <div className="font-display text-[82px] leading-[0.9] tracking-[-0.04em] uppercase mb-10">
              {nameParts[0]}<br />
              <span className="text-primary">{nameParts.slice(1).join(' ')}</span>
            </div>

            <div className="flex gap-12 mb-10 py-6 border-y border-border">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted mb-1">Height</span>
                <span className="font-display text-2xl">{prospect.height}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted mb-1">Weight</span>
                <span className="font-display text-2xl">{prospect.weight}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted mb-1">Size Score</span>
                <span className="font-display text-2xl text-primary">{prospect.sizeScore / 10}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-8">
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-6 border-l-4 border-primary pl-3">Strengths</h3>
                  <div className="flex flex-col gap-3">
                    {prospect.strengths.map((s) => (
                      <div key={s} className="flex items-center gap-3 text-sm font-bold uppercase">
                        <div className="w-3 h-3 rounded-full bg-primary" /> {s}
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-destructive mb-6 border-l-4 border-destructive pl-3">Weaknesses</h3>
                  <div className="flex flex-col gap-3">
                    {prospect.weaknesses.map((w) => (
                      <div key={w} className="flex items-center gap-3 text-sm font-bold uppercase">
                        <div className="w-3 h-3 bg-destructive" /> {w}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-6">Expert Tiers</h3>
                  <div className="flex flex-col gap-2">
                    {prospect.rankings.map((r) => (
                      <div key={r.site} className="flex justify-between items-center p-4 bg-card border border-border">
                        <span className="text-xs font-bold uppercase tracking-widest">{r.site}</span>
                        <span className="font-display text-2xl text-primary">#{r.rank}</span>
                      </div>
                    ))}
                    <div className="mt-4 p-6 border-4 border-primary text-center">
                      <div className="text-[11px] font-bold uppercase tracking-widest mb-1">Consensus Rank</div>
                      <div className="font-display text-6xl leading-none">{prospect.consensusRank}</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div className="bg-primary p-8 text-black">
              <h6 className="text-[10px] font-black uppercase tracking-widest mb-2">X-Factor</h6>
              <p className="font-bold text-2xl leading-tight tracking-tight">
                {prospect.xFactor}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
