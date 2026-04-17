import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Prospect } from '../types';
import { ProspectCard } from './ProspectCard';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Plus, Save, Loader2, Share2, Download, MoreHorizontal, Pencil, Brain, History, Filter, Sparkles, Search, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType, signInWithGoogle } from '../lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ShareModal } from './ShareModal';
import { AnalysisModal } from './AnalysisModal';
import { TimeMachineModal } from './TimeMachineModal';
import { SleeperModal } from './SleeperModal';
import { fetchNCAATeams, findTeamLogo } from '../services/collegeService';
import { generateSleeperPick, SleeperPick } from '../services/geminiService';

interface DraftBoardData {
  id: string;
  name: string;
  prospectOrder: string[];
  notes?: Record<string, string>;
}

interface BigBoardProps {
  initialProspects: Prospect[];
  viewingFriendBoard?: { userId: string, boardId: string } | null;
  onCloseFriendBoard?: () => void;
  activeBoardId?: string;
  onActiveBoardChange?: (boardId: string) => void;
}

export function BigBoard({ 
  initialProspects, 
  viewingFriendBoard, 
  onCloseFriendBoard,
  activeBoardId = 'default',
  onActiveBoardChange
}: BigBoardProps) {
  const { user, username } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(initialProspects[0]);
  const [boards, setBoards] = useState<DraftBoardData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [ncaaTeams, setNcaaTeams] = useState<any[]>([]);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [friendBoardData, setFriendBoardData] = useState<DraftBoardData | null>(null);
  const [friendUsername, setFriendUsername] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isTimeMachineModalOpen, setIsTimeMachineModalOpen] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<string[]>([]);
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});

  // Filter State
  const [posFilter, setPosFilter] = useState<string>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [statFilter, setStatFilter] = useState<string>('all');
  const [sleeperPick, setSleeperPick] = useState<SleeperPick | null>(null);
  const [isSleeperModalOpen, setIsSleeperModalOpen] = useState(false);
  const [isGeneratingSleeper, setIsGeneratingSleeper] = useState(false);

  // Fetch NCAA teams for logos
  useEffect(() => {
    async function loadTeams() {
      const teams = await fetchNCAATeams();
      setNcaaTeams(teams);
    }
    loadTeams();
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (activeBoardId === 'default' || viewingFriendBoard || !user) return;

    const currentOrder = prospects.map(p => p.id);
    const hasOrderChanged = JSON.stringify(currentOrder) !== JSON.stringify(lastSavedOrder);
    
    // Check if notes changed - simple check for now
    const board = boards.find(b => b.id === activeBoardId);
    const hasNotesChanged = JSON.stringify(activeNotes) !== JSON.stringify(board?.notes || {});

    if (!hasOrderChanged && !hasNotesChanged) return;

    const timer = setTimeout(() => {
      saveBoard(true);
      setLastSavedOrder(currentOrder);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [prospects, activeBoardId, user, viewingFriendBoard, activeNotes, boards, lastSavedOrder]);

  // Load boards from Firestore
  useEffect(() => {
    if (viewingFriendBoard) {
      const q = doc(db, 'users', viewingFriendBoard.userId, 'boards', viewingFriendBoard.boardId);
      const userRef = doc(db, 'users', viewingFriendBoard.userId);
      
      const unsubscribeBoard = onSnapshot(q, (snapshot) => {
        if (snapshot.exists()) {
          setFriendBoardData({ id: snapshot.id, ...snapshot.data() } as DraftBoardData);
        }
      });

      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setFriendUsername(snapshot.data().username || null);
        }
      });

      return () => {
        unsubscribeBoard();
        unsubscribeUser();
      };
    }

    if (!user) {
      setBoards([]);
      onActiveBoardChange?.('default');
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBoards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DraftBoardData[];
      setBoards(loadedBoards);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/boards`);
    });

    return unsubscribe;
  }, [user]);

  // Update prospects when active board changes
  useEffect(() => {
    let baseProspects = [...initialProspects];
    
    // Apply logos if we have them and they are valid
    if (ncaaTeams.length > 0) {
      baseProspects = baseProspects.map(p => {
        const espnLogo = findTeamLogo(ncaaTeams, p.school);
        // Only use ESPN logo if it's a real URL and not a placeholder
        const isPlaceholder = !espnLogo || espnLogo.includes('placeholder') || espnLogo.includes('via.placeholder');
        return {
          ...p,
          logo: isPlaceholder ? p.logo : espnLogo
        };
      });
    }

    if (viewingFriendBoard && friendBoardData) {
      const ordered = friendBoardData.prospectOrder
        .map(id => baseProspects.find(p => p.id === id))
        .filter((p): p is Prospect => !!p);
      const missing = baseProspects.filter(p => !friendBoardData.prospectOrder.includes(p.id));
      setProspects([...ordered, ...missing]);
      return;
    }

    if (activeBoardId === 'default' || activeBoardId === 'new') {
      setProspects(baseProspects.sort((a, b) => a.consensusRank - b.consensusRank));
      setActiveNotes({});
    } else {
      const activeBoard = boards.find(b => b.id === activeBoardId);
      if (activeBoard) {
        const ordered = activeBoard.prospectOrder
          .map(id => baseProspects.find(p => p.id === id))
          .filter((p): p is Prospect => !!p);
        
        // Add any missing prospects (new data) to the end
        const missing = baseProspects.filter(p => !activeBoard.prospectOrder.includes(p.id));
        setProspects([...ordered, ...missing]);
        setLastSavedOrder(activeBoard.prospectOrder);
        setActiveNotes(activeBoard.notes || {});
      }
    }
  }, [activeBoardId, boards, initialProspects, ncaaTeams, viewingFriendBoard, friendBoardData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProspects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleProspectClick = (prospect: Prospect) => {
    setSelectedProspect(prospect);
  };

  const resetBoard = () => {
    setProspects([...initialProspects].sort((a, b) => a.consensusRank - b.consensusRank));
  };

  const moveProspect = (index: number, direction: 'up' | 'down') => {
    if (activeBoardId === 'default') return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= prospects.length) return;
    
    setProspects((prev) => {
      const newProspects = [...prev];
      const [moved] = newProspects.splice(index, 1);
      newProspects.splice(newIndex, 0, moved);
      return newProspects;
    });
  };

  const handleNotesChange = (prospectId: string, value: string) => {
    setActiveNotes(prev => ({
      ...prev,
      [prospectId]: value
    }));
  };

  const renameBoard = async (boardId: string, newName: string) => {
    if (!user || !newName.trim()) {
      setIsRenaming(false);
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'boards', boardId), { name: newName.trim() }, { merge: true });
      setIsRenaming(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/boards`);
    }
  };

  const saveBoard = async (isAutoSave = false) => {
    if (!user) {
      if (!isAutoSave) alert('Please login to save your board.');
      return;
    }
    if (activeBoardId === 'default' && boards.length >= 5) {
      if (!isAutoSave) alert('Maximum of 5 custom boards reached.');
      return;
    }
    setIsSaving(true);
    try {
      const isNew = activeBoardId === 'default';
      const boardId = isNew ? `board_${Date.now()}` : activeBoardId;
      
      const boardData: any = {
        userId: user.uid,
        name: isNew ? `Custom Board ${boards.length + 1}` : boards.find(b => b.id === activeBoardId)?.name || 'My Board',
        prospectOrder: prospects.map(p => p.id),
        notes: activeNotes,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        boardData.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, 'users', user.uid, 'boards', boardId), boardData, { merge: true });
      if (isNew) onActiveBoardChange?.(boardId);
      if (!isAutoSave) alert('Board saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/boards`);
    } finally {
      setIsSaving(false);
    }
  };

  const createNewBoard = async () => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Login failed:', error);
      }
      return;
    }
    if (boards.length >= 5) {
      alert('Maximum of 5 custom boards reached.');
      return;
    }

    setIsSaving(true);
    try {
      const boardId = `board_${Date.now()}`;
      const boardData = {
        userId: user.uid,
        name: `Custom Board ${boards.length + 1}`,
        prospectOrder: prospects.map(p => p.id),
        notes: {},
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid, 'boards', boardId), boardData);
      onActiveBoardChange?.(boardId);
      alert('New board created successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/boards`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportBoard = () => {
    const doc = new jsPDF();
    const boardName = activeBoardId === 'default' ? 'Consensus Rankings' : boards.find(b => b.id === activeBoardId)?.name || 'My Board';
    
    doc.setFontSize(20);
    doc.text(`DraftPulse 2026: ${boardName}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30);
    
    prospects.forEach((p, i) => {
      const y = 45 + (i * 10);
      if (y > 280) {
        doc.addPage();
        doc.text(`${i + 1}. ${p.name} (${p.school}) - ${p.position}`, 20, 20);
      } else {
        doc.text(`${i + 1}. ${p.name} (${p.school}) - ${p.position}`, 20, y);
      }
    });
    
    doc.save(`${boardName.replace(/\s+/g, '_')}_BigBoard.pdf`);
  };

  const shareBoard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Board link copied to clipboard!');
  };

  // Filter Logic Helpers
  const parseHeight = (h: string) => {
    const match = h.match(/(\d+)'(\d+)/);
    return match ? parseInt(match[1]) * 12 + parseInt(match[2]) : 0;
  };
  const parsePercent = (p: string) => parseFloat(p.replace('%', ''));

  const isHighlighted = (p: Prospect) => {
    // Clyde's Sleeper logic override
    if (sleeperPick && p.id === sleeperPick.prospectId) return true;

    // Position Filter
    if (posFilter !== 'all') {
      const pos = p.position.toLowerCase();
      if (posFilter === 'guard' && !(pos.includes('guard'))) return false;
      if (posFilter === 'wing' && !pos.includes('wing')) return false;
      if (posFilter === 'forward' && !pos.includes('forward')) return false;
      if (posFilter === 'big' && !pos.includes('big') && !pos.includes('center')) return false;
    }

    // Archetype Filter
    if (archetypeFilter !== 'all') {
      switch (archetypeFilter) {
        case 'green_light':
          if (!(p.attributes.shooting >= 5 || (parsePercent(p.stats.threeP) >= 40 && p.stats.threePA >= 4))) return false;
          break;
        case '3andd':
          if (!((parsePercent(p.stats.threeP) >= 38 && p.stats.threePA >= 3) && p.attributes.onBallDefense >= 4)) return false;
          break;
        case 'unicorn':
          if (!(parseHeight(p.height) >= (6 * 12 + 10) && p.stats.threePA >= 2)) return false;
          break;
        case 'floor_general':
          if (!(p.stats.ast >= 6)) return false;
          break;
        case 'rim_protector':
          if (!(p.stats.blk >= 1.5)) return false;
          break;
        case 'seven_footer':
          if (!(parseHeight(p.height) >= (7 * 12))) return false;
          break;
        case 'lockdown':
          if (!(p.attributes.onBallDefense >= 5)) return false;
          break;
        case 'bucket':
          if (!(p.stats.pts >= 20)) return false;
          break;
        case 'pickpocket':
          if (!(p.stats.stl >= 1.4)) return false;
          break;
        case 'double_double':
          const cats = [p.stats.pts, p.stats.reb, p.stats.ast, p.stats.stl, p.stats.blk];
          if (cats.filter(v => v >= 10).length < 2) return false;
          break;
        case 'swiss_army':
          const attrs = [p.attributes.athleticism, p.attributes.shooting, p.attributes.creation, p.attributes.onBallDefense, p.attributes.offBallDefense];
          if (!attrs.every(v => v >= 3)) return false;
          break;
      }
    }

    // Stat/Skill Filter
    if (statFilter !== 'all') {
      const selectedVal = p.attributes[statFilter as keyof typeof p.attributes];
      const maxVal = Math.max(
        p.attributes.athleticism,
        p.attributes.shooting,
        p.attributes.creation,
        p.attributes.onBallDefense,
        p.attributes.offBallDefense
      );
      
      // Highlight if this specific skill is the max, and is at least 4.
      if (selectedVal < maxVal || selectedVal < 4) return false;
    }

    // If any filter is active and we haven't returned false, we are a match
    return posFilter !== 'all' || archetypeFilter !== 'all' || statFilter !== 'all';
  };

  const handleClydeSleeper = async () => {
    if (isGeneratingSleeper) return;
    setIsGeneratingSleeper(true);
    
    // Only choose from prospects ranked outside top 14
    const candidates = prospects.filter(p => {
      const cRank = initialProspects.find(ip => ip.id === p.id)?.consensusRank || 99;
      return cRank > 14;
    });

    if (candidates.length === 0) {
      alert("No sleepers found in high rank range.");
      setIsGeneratingSleeper(false);
      return;
    }

    const pick = await generateSleeperPick(candidates);
    setSleeperPick(pick);
    setIsSleeperModalOpen(true);
    setIsGeneratingSleeper(false);

    // Scroll to the prospect
    const element = document.getElementById(`prospect-${pick.prospectId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          boardName={activeBoardId === 'default' ? 'Consensus Rankings' : boards.find(b => b.id === activeBoardId)?.name || 'My Board'}
          boardId={activeBoardId}
          userId={user?.uid}
          isPublic={boards.find(b => b.id === activeBoardId)?.isPublic}
        />
        <AnalysisModal
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          prospects={prospects}
          boardName={activeBoardId === 'default' ? 'Consensus Rankings' : boards.find(b => b.id === activeBoardId)?.name || 'My Board'}
        />
        <TimeMachineModal
          isOpen={isTimeMachineModalOpen}
          onClose={() => setIsTimeMachineModalOpen(false)}
        />
        <SleeperModal
          isOpen={isSleeperModalOpen}
          onClose={() => setIsSleeperModalOpen(false)}
          pick={sleeperPick}
          prospect={prospects.find(p => p.id === sleeperPick?.prospectId) || null}
        />
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-accent-green" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-green">TOP 60 NBA DRAFT PROSPECTS // 2026</span>
          </div>
          
          <div className="flex items-center gap-6 mb-4 group">
            {viewingFriendBoard ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-green mb-1">
                    {friendUsername ? `@${friendUsername}'s Board` : "Friend's Board"}
                  </span>
                  <h1 className="text-5xl md:text-7xl font-display tracking-[-0.05em] uppercase leading-[0.85] text-accent-green">
                    {friendBoardData?.name || 'Custom Board'}
                  </h1>
                </div>
                <button 
                  onClick={onCloseFriendBoard}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-none transition-all self-end mb-1"
                >
                  Exit View
                </button>
              </div>
            ) : isRenaming ? (
              <input
                autoFocus
                type="text"
                maxLength={50}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => renameBoard(activeBoardId, renameValue)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameBoard(activeBoardId, renameValue);
                  if (e.key === 'Escape') setIsRenaming(false);
                }}
                className="text-5xl md:text-7xl font-display tracking-[-0.05em] uppercase leading-[0.85] bg-transparent border-b-2 border-accent-green outline-none text-accent-green w-full max-w-2xl"
              />
            ) : (
              <>
                <h1 
                  className={`text-3xl md:text-7xl font-display tracking-[-0.05em] uppercase leading-[0.85] ${activeBoardId !== 'default' ? 'cursor-pointer hover:text-accent-green' : ''} transition-colors`}
                  onClick={() => {
                    if (activeBoardId === 'default') return;
                    const board = boards.find(b => b.id === activeBoardId);
                    if (board) {
                      setRenameValue(board.name);
                      setIsRenaming(true);
                    }
                  }}
                >
                  {activeBoardId === 'default' ? 'Consensus Rankings' : 
                   boards.find(b => b.id === activeBoardId)?.name}
                </h1>
                {activeBoardId !== 'default' && (
                  <button 
                    onClick={() => {
                      const board = boards.find(b => b.id === activeBoardId);
                      if (board) {
                        setRenameValue(board.name);
                        setIsRenaming(true);
                      }
                    }}
                    className="p-2 hover:bg-white/5 text-muted-foreground hover:text-accent-green transition-colors"
                  >
                    <Pencil className="w-6 h-6" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Top Actions - Right below title */}
          <div className="flex items-center gap-8 mb-12 py-4 border-y border-border/50">
            {activeBoardId !== 'default' && !viewingFriendBoard && (
              <button 
                onClick={resetBoard}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
            <button 
              onClick={exportBoard}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            {activeBoardId !== 'default' && !viewingFriendBoard && (
              <>
                <button 
                  onClick={() => setIsAnalysisModalOpen(true)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-accent-green transition-colors"
                >
                  <Brain className="w-3.5 h-3.5 text-accent-green" /> Analyse
                </button>
                <button 
                  onClick={() => setIsTimeMachineModalOpen(true)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-accent-green transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-accent-green" /> Time Machine
                </button>
              </>
            )}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-mono text-accent-green/50 uppercase tracking-tighter">
              <span className="flex items-center gap-1"><div className="w-1 h-1 bg-accent-green rounded-full animate-pulse" /> Active</span>
              <span>•</span>
              <span>Boards: {boards.length + 1}/6</span>
            </div>
              {user && (
                <Button 
                  onClick={saveBoard} 
                  disabled={isSaving}
                  size="sm"
                  className="font-bold uppercase tracking-[0.2em] text-[10px] rounded-none bg-accent-green text-black hover:bg-accent-green/90 px-8 h-9"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {activeBoardId === 'default' ? 'Save As New' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Board Switcher (Tabs) */}
        {!viewingFriendBoard && (
          <div className="flex flex-wrap gap-1 mb-12 bg-card p-1 border border-border">
            <button 
              onClick={() => onActiveBoardChange?.('default')}
              className={`px-8 py-3 font-display text-[10px] uppercase tracking-[0.2em] transition-all flex-shrink-0 ${activeBoardId === 'default' ? 'bg-accent-green text-black' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              Consensus
            </button>
            {boards.map((board) => (
              <button 
                key={board.id}
                onClick={() => onActiveBoardChange?.(board.id)}
                className={`px-8 py-3 font-display text-[10px] uppercase tracking-[0.2em] transition-all flex-shrink-0 ${activeBoardId === board.id ? 'bg-accent-green text-black' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
              >
                {board.name}
              </button>
            ))}
            
            {boards.length < 5 && (
              <button 
                onClick={createNewBoard}
                disabled={isSaving}
                className="px-8 py-3 transition-all flex items-center gap-3 font-display text-[10px] uppercase tracking-[0.2em] flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} New
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-6 bg-card/20 border border-border rounded-xl">
          <div className="flex items-center gap-2 text-primary">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filters</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Position */}
            <div className="relative group">
              <select 
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 px-4 py-2 pr-10 text-[10px] font-bold uppercase tracking-widest text-foreground outline-none focus:border-primary transition-all rounded-lg cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Position: All</option>
                <option value="guard" className="bg-slate-900">Guard</option>
                <option value="wing" className="bg-slate-900">Wing</option>
                <option value="forward" className="bg-slate-900">Forward</option>
                <option value="big" className="bg-slate-900">Big</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Archetype */}
            <div className="relative group">
              <select 
                value={archetypeFilter}
                onChange={(e) => setArchetypeFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 px-4 py-2 pr-10 text-[10px] font-bold uppercase tracking-widest text-foreground outline-none focus:border-primary transition-all rounded-lg cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Archetype: All</option>
                <option value="3andd" className="bg-slate-900">3&D</option>
                <option value="bucket" className="bg-slate-900">Bucket</option>
                <option value="double_double" className="bg-slate-900">Double Double</option>
                <option value="floor_general" className="bg-slate-900">Floor General</option>
                <option value="green_light" className="bg-slate-900">Green Light</option>
                <option value="lockdown" className="bg-slate-900">Lockdown</option>
                <option value="pickpocket" className="bg-slate-900">Pickpocket</option>
                <option value="rim_protector" className="bg-slate-900">Rim Protector</option>
                <option value="seven_footer" className="bg-slate-900">Seven Footer</option>
                <option value="swiss_army" className="bg-slate-900">Swiss Army Knife</option>
                <option value="unicorn" className="bg-slate-900">Unicorn</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Top Skill */}
            <div className="relative group">
              <select 
                value={statFilter}
                onChange={(e) => setStatFilter(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 px-4 py-2 pr-10 text-[10px] font-bold uppercase tracking-widest text-foreground outline-none focus:border-primary transition-all rounded-lg cursor-pointer"
              >
                <option value="all" className="bg-slate-900">Top Skill: Any</option>
                <option value="athleticism" className="bg-slate-900">Athleticism</option>
                <option value="shooting" className="bg-slate-900">Shooting</option>
                <option value="creation" className="bg-slate-900">Creation</option>
                <option value="onBallDefense" className="bg-slate-900">On Ball Def.</option>
                <option value="offBallDefense" className="bg-slate-900">Off Ball Def.</option>
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <Separator orientation="vertical" className="h-4 bg-white/10 mx-2" />

            <button
              onClick={handleClydeSleeper}
              disabled={isGeneratingSleeper}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGeneratingSleeper ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Clyde's Sleeper
            </button>

            {(posFilter !== 'all' || archetypeFilter !== 'all' || statFilter !== 'all' || sleeperPick) && (
              <button
                onClick={() => {
                  setPosFilter('all');
                  setArchetypeFilter('all');
                  setStatFilter('all');
                  setSleeperPick(null);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Rankings List */}
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={prospects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {prospects.map((prospect, index) => (
                    <motion.div
                      key={prospect.id}
                      id={`prospect-${prospect.id}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <ProspectCard
                        prospect={prospect}
                        rank={index + 1}
                        onClick={handleProspectClick}
                        onSwitchToConsensus={() => onActiveBoardChange?.('default')}
                        onMoveUp={() => moveProspect(index, 'up')}
                        onMoveDown={() => moveProspect(index, 'down')}
                        isActive={selectedProspect?.id === prospect.id}
                        disabled={activeBoardId === 'default' || !!viewingFriendBoard}
                        showArrows={activeBoardId !== 'default' && !viewingFriendBoard}
                        notes={viewingFriendBoard ? (friendBoardData?.notes?.[prospect.id] || '') : (activeNotes[prospect.id] || '')}
                        onNotesChange={(val) => handleNotesChange(prospect.id, val)}
                        isCustomBoard={activeBoardId !== 'default' || !!viewingFriendBoard}
                        highlighted={isHighlighted(prospect)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="mt-20 p-12 bg-card/30 backdrop-blur-sm border-2 border-border relative overflow-hidden rounded-xl">
          <div className="absolute top-0 right-0 p-4 text-[8px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Terminal_v5.0.1</div>
          <div className="flex flex-col items-center text-center relative z-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-primary mb-6">Scouting Methodology</h3>
            <p className="text-muted font-bold uppercase tracking-widest text-[10px] max-w-4xl mx-auto leading-loose text-center">
              Our consensus rankings are aggregated from ESPN, The Athletic, Bleacher Report, Sports Illustrated, Yahoo, The Ringer, Tankathon, For the Win, CBS, No Ceilings, Swish Theory, Babcock Hoops, SBN, and dozens of other independent boards/mocks.
            </p>
            <div className="mt-8 flex gap-6">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
