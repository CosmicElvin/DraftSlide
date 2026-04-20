import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Prospect } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GripVertical, Target, Zap, Shield, Sword, Wand2, Hand, 
  ArrowUp, Scale, Activity, Clock, Wind, AlertTriangle, 
  ChevronDown, ChevronUp, Star, TrendingDown, Info, Lock, X,
  Globe, ExternalLink, Loader2, Bot
} from 'lucide-react';
import { generateScoutingReport, ScoutingData } from '../services/geminiService';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

interface ProspectCardProps {
  prospect: Prospect;
  rank: number;
  onClick: (prospect: Prospect) => void;
  onSwitchToConsensus?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  showArrows?: boolean;
  notes?: string;
  onNotesChange?: (val: string) => void;
  isCustomBoard?: boolean;
  highlighted?: boolean;
}

export function ProspectCard({ 
  prospect, 
  rank, 
  onClick, 
  onSwitchToConsensus, 
  onMoveUp,
  onMoveDown,
  isActive, 
  disabled,
  showArrows = false,
  notes = '',
  onNotesChange,
  isCustomBoard = false,
  highlighted = false
}: ProspectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: prospect.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1
  };

  const radarData = [
    { subject: 'Athleticism', A: prospect.attributes.athleticism, fullMark: 5 },
    { subject: 'Shooting', A: prospect.attributes.shooting, fullMark: 5 },
    { subject: 'Creation', A: prospect.attributes.creation, fullMark: 5 },
    { subject: 'On-Ball', A: prospect.attributes.onBallDefense, fullMark: 5 },
    { subject: 'Off-Ball', A: prospect.attributes.offBallDefense, fullMark: 5 },
  ];

  const getTopAndBottomAttributes = () => {
    const attrs = [
      { name: 'Athleticism', value: prospect.attributes.athleticism, icon: <Zap className="w-4 h-4" />, color: 'text-accent-yellow' },
      { name: 'Shooting', value: prospect.attributes.shooting, icon: <Target className="w-4 h-4" />, color: 'text-accent-green' },
      { name: 'Creation', value: prospect.attributes.creation, icon: <Wand2 className="w-4 h-4" />, color: 'text-accent-pink' },
      { name: 'On-Ball Def', value: prospect.attributes.onBallDefense, icon: <Hand className="w-4 h-4" />, color: 'text-accent-orange' },
      { name: 'Off-Ball Def', value: prospect.attributes.offBallDefense, icon: <Shield className="w-4 h-4" />, color: 'text-accent-blue' },
    ];
    
    const sorted = [...attrs].sort((a, b) => b.value - a.value);
    return {
      top: sorted[0],
      bottom: sorted[sorted.length - 1]
    };
  };

  const { top, bottom } = getTopAndBottomAttributes();

  const getRadarColor = () => {
    switch (top.name) {
      case 'Athleticism': return '#ffed29';
      case 'Shooting': return '#26ff8c';
      case 'Creation': return '#fc56fa';
      case 'On-Ball Def': return '#ff9625';
      case 'Off-Ball Def': return '#39c5ff';
      default: return '#39c5ff';
    }
  };
  const radarColor = getRadarColor();

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card 
        className={`group relative overflow-hidden border-2 rounded-xl transition-all cursor-pointer bg-card/40 backdrop-blur-xl select-none ${isDragging ? 'opacity-50' : 'opacity-100'} ${highlighted ? 'border-accent-green ring-1 ring-accent-green/30 bg-accent-green/5' : isActive ? 'border-primary ring-1 ring-primary/20' : 'border-border'} hover:border-primary/50 transition-all duration-300 shadow-2xl`}
        onClick={() => {
          setIsExpanded(!isExpanded);
          onClick(prospect);
        }}
      >
        {/* Row View */}
        <div className="flex items-center p-2 gap-2 md:gap-4 flex-nowrap">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div 
              {...attributes} 
              {...listeners}
              className={`p-1 rounded transition-colors ${disabled ? 'cursor-default opacity-50' : 'cursor-grab active:cursor-grabbing hover:bg-white/5'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {disabled ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            {showArrows && !disabled && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp?.();
                  }}
                  className="p-0.5 hover:bg-white/10 rounded text-muted-foreground hover:text-accent-green transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown?.();
                  }}
                  className="p-0.5 hover:bg-white/10 rounded text-muted-foreground hover:text-accent-green transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-display text-xl text-muted-foreground/50 group-hover:text-primary transition-colors">
            {rank}
          </div>

          {/* Desktop Logo (Next to Name) */}
          <div className="hidden md:flex flex-shrink-0 w-10 h-10 rounded-xl bg-white p-1 border border-border shadow-inner items-center justify-center overflow-hidden">
            {prospect.logo === 'WORLD_ICON' ? (
              <Globe className="w-6 h-6 text-[#333333]" />
            ) : (
              <img 
                src={prospect.logo} 
                alt={prospect.school} 
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          {/* Mobile Consensus Rank (Top Right) */}
          <div className="absolute top-1 right-2 md:hidden">
            <span className="text-[8px] font-black text-muted-foreground mr-0.5">CON</span>
            <span className="text-[10px] font-display text-primary">#{prospect.consensusRank}</span>
          </div>

          <div className="flex-grow min-w-0 pr-10">
             <div className="flex flex-col items-start gap-1">
               {/* Mobile Only: Single School Logo Above Name */}
               <div className="md:hidden w-8 h-8 rounded-xl bg-white p-1 border border-border shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                 {prospect.logo === 'WORLD_ICON' ? (
                   <Globe className="w-5 h-5 text-[#333333]" />
                 ) : (
                   <img 
                     src={prospect.logo} 
                     alt={prospect.school} 
                     className="max-w-full max-h-full object-contain"
                     referrerPolicy="no-referrer"
                   />
                 )}
               </div>
               
               <h3 className="font-display text-sm md:text-2xl uppercase leading-none mt-1 truncate">{prospect.name}</h3>
               <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-[8px] md:text-[8px] text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                 <span>{prospect.position}</span>
                 <span className="w-0.5 h-0.5 bg-border rounded-full" />
                 <span>{prospect.height}</span>
                 <span className="w-0.5 h-0.5 bg-border rounded-full" />
                 <span>{prospect.weight}</span>
                 <span className="w-0.5 h-0.5 bg-border rounded-full" />
                 <span>Age {prospect.age.toFixed(1)}</span>
               </div>
             </div>
          </div>

          {/* Top Strength & Weakness Icons */}
          <div className="hidden md:flex items-center gap-4 px-6 border-x border-border">
            <div className="flex flex-col items-center gap-1" title={`Top Strength: ${top.name}`}>
              <div className={`p-2 bg-white/5 rounded-lg border border-white/10 ${top.color}`}>
                {top.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Pro</span>
            </div>
            <div className="flex flex-col items-center gap-1" title={`Major Weakness: ${bottom.name}`}>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-muted-foreground/50">
                {bottom.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Con</span>
            </div>
          </div>

          {/* Desktop Consensus Rank */}
          <div 
            className="hidden md:flex flex-col items-center justify-center min-w-[100px] hover:bg-primary/10 rounded-lg transition-colors p-2"
            onClick={(e) => {
              e.stopPropagation();
              onSwitchToConsensus?.();
            }}
            title="Switch to Consensus Board"
          >
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">Consensus</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display text-foreground">#{prospect.consensusRank}</span>
              {rank !== prospect.consensusRank && (
                <span className={`text-[10px] font-black font-mono ${rank < prospect.consensusRank ? 'text-accent-green' : 'text-accent-red'}`}>
                  {rank < prospect.consensusRank ? `+${prospect.consensusRank - rank}` : `-${rank - prospect.consensusRank}`}
                </span>
              )}
            </div>
          </div>

          <div className="p-2 text-muted-foreground group-hover:text-primary transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-t border-border bg-background/20"
            >
              <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Radar Chart */}
                <div className="lg:col-span-4 flex flex-col items-center">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-6 self-start">Attribute Web</h4>
                  <div className="w-full h-[220px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "70%" : "80%"} data={radarData}>
                        <PolarGrid 
                          stroke="rgba(255,255,255,0.15)" 
                          gridType="polygon" 
                          radialLines={true}
                        />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 7 : 9, fontWeight: 900, letterSpacing: '0.05em' }} 
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 5]} 
                          tickCount={6}
                          tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: isMobile ? 6 : 8 }}
                          axisLine={false} 
                        />
                        <Radar
                          name={prospect.name}
                          dataKey="A"
                          stroke={radarColor}
                          fill={radarColor}
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Middle: Stats & Bio */}
                <div className="lg:col-span-5 space-y-8">
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-4">College Production</h4>
                    <div className="grid grid-cols-4 gap-3">
                       {[
                        { label: 'PPG', val: prospect.stats.pts },
                        { label: 'APG', val: prospect.stats.ast },
                        { label: 'REB', val: prospect.stats.reb },
                        { label: 'FG%', val: prospect.stats.fg },
                        { label: 'FGA', val: prospect.stats.fga },
                        { label: '3P%', val: prospect.stats.threeP },
                        { label: '3PA', val: prospect.stats.threePA },
                        { label: 'SPG', val: prospect.stats.stl },
                        { label: 'BPG', val: prospect.stats.blk },
                        { label: 'GP', val: prospect.stats.gp },
                        { label: 'MPG', val: prospect.stats.min },
                        { label: 'TOV', val: prospect.stats.tov },
                        { label: 'FT%', val: prospect.stats.ft },
                      ].map(s => (
                        <div key={s.label} className="bg-white/5 p-1.5 md:p-2 border border-white/5 rounded-lg text-center">
                          <div className="text-[6px] md:text-[8px] font-bold text-muted-foreground uppercase mb-0.5">{s.label}</div>
                          <div className="text-xs md:text-sm font-display">{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-2">
                      The X-Factor
                    </h4>
                    <p className="text-sm font-bold leading-relaxed text-foreground italic border-l-2 border-primary pl-4">
                        "{prospect.xFactor}"
                      </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4 group/clyde relative">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">
                        <span className="cursor-help border-b border-dotted border-primary/40 pb-0.5">Clyde's Snapshot</span>
                      </h4>
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-border rounded-lg shadow-xl opacity-0 invisible group-hover/clyde:opacity-100 group-hover/clyde:visible transition-all z-50 pointer-events-none">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-primary/10 rounded-md">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-foreground mb-1 uppercase tracking-wider">Meet Clyde</p>
                            <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                              Your trusty AI assistant GM here to help with all things ranking and player evaluation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {prospect.description}
                      </p>
                  </div>
                </div>

                {/* Right: Notes & Extra Info */}
                <div className="lg:col-span-3">
                  <div className="flex flex-col h-full">
                    {isCustomBoard ? (
                      <>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-4">My Notes</h4>
                        <textarea
                          value={notes}
                          onChange={(e) => onNotesChange?.(e.target.value)}
                          placeholder="Type player notes here..."
                          onClick={(e) => e.stopPropagation()}
                          readOnly={disabled}
                          className={`flex-grow bg-white/5 border border-white/10 rounded-xl p-5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent-green transition-all resize-none min-h-[180px] ${disabled ? 'cursor-default' : ''}`}
                        />
                      </>
                    ) : (
                      <>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-4">Draft Board Status</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-primary/20 p-5 px-6 rounded-xl border border-primary/30">
                            <span className="text-primary">Consensus Rank</span>
                            <span className="text-primary text-3xl font-display">#{prospect.consensusRank}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
