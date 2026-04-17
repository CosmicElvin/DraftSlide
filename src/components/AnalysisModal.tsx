import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Prospect } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, Brain, TrendingUp, TrendingDown, Award, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospects: Prospect[];
  boardName: string;
}

export function AnalysisModal({ isOpen, onClose, prospects, boardName }: AnalysisModalProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare data for prompt
      const boardData = prospects.map((p, i) => ({
        name: p.name,
        userRank: i + 1,
        consensusRank: p.consensusRank,
        diff: p.consensusRank - (i + 1)
      }));

      const prompt = `
        You are Clyde, a high-energy, slightly eccentric sports analysis algorithm working for a top-tier NBA General Manager.
        Your task is to analyze the following draft board created by the "GM" (the user).
        
        Board Name: "${boardName}"
        Rankings Data: ${JSON.stringify(boardData)}
        
        Rules for your response:
        1. Refer to the user as "GM", "Boss", "Chief", or "Big Kahuna".
        2. Use funny, dynamic, and professional-yet-edgy scouting language.
        3. Assign the GM a title based on their ranking style (e.g., "The Maverick", "The Wiley Vet", "The Consensus Crusher", "The High-Floor Specialist").
        4. Identify the "Biggest Riser" (the player they ranked much higher than consensus).
        5. Identify the "Biggest Slider" (the player they ranked much lower than consensus).
        6. Highlight "Bold Choices" where they buck the trend.
        7. Analyze what traits they seem to value (e.g., "You clearly have a thing for wingspan, Boss" or "Shooting is your religion, isn't it?").
        8. Clyde's Personality: Inject subtle but clear pop culture references. 
           - NBA references (e.g., "Board Man Gets Paid", "Trust the Process", "Mamba Mentality").
           - Classic Movies (e.g., Star Wars: "The Force is strong with this pick", "I find your lack of wingspan disturbing").
           - 90s Classics (e.g., Dumb & Dumber: "So you're telling me there's a chance?").
           - TV Shows (e.g., The Office: "I'm not superstitious, but I am a little stitious about this ranking", Seinfeld: "No soup for you!", Parks & Rec: "Treat yo self to this lottery pick").
        9. Keep it concise but packed with personality.
        
        Return the response in JSON format with these keys:
        - title: string (the GM's title)
        - summary: string (the main analysis text)
        - biggestRiser: { name: string, diff: number, comment: string }
        - biggestSlider: { name: string, diff: number, comment: string }
        - boldChoices: string[]
        - valuedTraits: string[]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !analysis) {
      generateAnalysis();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card/98 backdrop-blur-2xl border-border text-foreground overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-accent-green" />
            <DialogTitle className="text-2xl font-display uppercase tracking-tight">Clyde's War Room Analysis</DialogTitle>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-2 relative scrollbar-thin scrollbar-thumb-accent-green/20 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-[400px] flex flex-col items-center justify-center space-y-4"
              >
                <Loader2 className="w-12 h-12 text-accent-green animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Running Algorithms...</p>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 py-4"
              >
                <div className="bg-accent-green/20 border border-accent-green/30 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent-green mb-1 block">GM Designation</span>
                  <h3 className="text-3xl font-display uppercase text-accent-green">{analysis.title}</h3>
                </div>

                <div className="prose prose-invert max-w-none bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-sm leading-relaxed text-muted-foreground font-medium italic">
                    "{analysis.summary}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-accent-green" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Biggest Riser</span>
                    </div>
                    <div className="font-display text-xl uppercase">{analysis.biggestRiser?.name}</div>
                    <div className="text-[10px] text-accent-green font-bold">+{analysis.biggestRiser?.diff} vs Consensus</div>
                    <p className="text-[10px] text-muted-foreground mt-2">{analysis.biggestRiser?.comment}</p>
                  </div>

                  <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-accent-red" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Biggest Slider</span>
                    </div>
                    <div className="font-display text-xl uppercase">{analysis.biggestSlider?.name}</div>
                    <div className="text-[10px] text-accent-red font-bold">{analysis.biggestSlider?.diff} vs Consensus</div>
                    <p className="text-[10px] text-muted-foreground mt-2">{analysis.biggestSlider?.comment}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Bold Choices</span>
                    <div className="flex flex-wrap gap-2">
                      {analysis.boldChoices?.map((choice: string, i: number) => (
                        <span key={i} className="text-[9px] font-bold uppercase bg-white/10 px-2 py-1 rounded border border-white/10">
                          {choice}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Valued Traits</span>
                    <div className="flex flex-wrap gap-2">
                      {analysis.valuedTraits?.map((trait: string, i: number) => (
                        <span key={i} className="text-[9px] font-bold uppercase bg-accent-green/30 text-accent-green px-2 py-1 rounded border border-accent-green/40">
                          <Zap className="w-3 h-3 inline mr-1" /> {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={generateAnalysis}
                  variant="outline"
                  className="w-full border-border hover:bg-white/10 text-[10px] font-black uppercase tracking-widest"
                >
                  Rerun Algorithm
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
