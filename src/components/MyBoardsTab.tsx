import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Briefcase, Share2, Trash2, ExternalLink, Pencil, Loader2, Plus, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ShareModal } from './ShareModal';

interface DraftBoardData {
  id: string;
  name: string;
  prospectOrder: string[];
  updatedAt?: any;
}

interface MyBoardsTabProps {
  onOpenBoard: (boardId: string) => void;
}

export function MyBoardsTab({ onOpenBoard }: MyBoardsTabProps) {
  const { user } = useAuth();
  const [boards, setBoards] = useState<DraftBoardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sharingBoard, setSharingBoard] = useState<DraftBoardData | null>(null);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedBoards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DraftBoardData[];
      
      // Sort by updatedAt if available, otherwise just keep as is
      setBoards(loadedBoards.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || 0;
        return timeB - timeA;
      }));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/boards`);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (!user || !confirm('Are you sure you want to delete this board?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'boards', boardId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/boards/${boardId}`);
    }
  };

  const handleRename = async (e: React.MouseEvent, board: DraftBoardData) => {
    e.stopPropagation();
    if (editingBoardId === board.id) {
      if (editValue.trim() && editValue !== board.name) {
        try {
          await updateDoc(doc(db, 'users', user!.uid, 'boards', board.id), {
            name: editValue.trim()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user!.uid}/boards/${board.id}`);
        }
      }
      setEditingBoardId(null);
    } else {
      setEditingBoardId(board.id);
      setEditValue(board.name);
    }
  };

  const handleShare = (e: React.MouseEvent, board: DraftBoardData) => {
    e.stopPropagation();
    setSharingBoard(board);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-accent-green animate-spin mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Loading your boards...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <Briefcase className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
        <h2 className="text-4xl font-display uppercase mb-4">My Boards</h2>
        <p className="text-muted-foreground font-bold uppercase tracking-widest">Login to manage your custom draft boards.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-accent-green/10 flex items-center justify-center rounded-none border border-accent-green/20">
            <Briefcase className="w-8 h-8 text-accent-green" />
          </div>
          <div>
            <h2 className="text-5xl font-display uppercase tracking-tight leading-none mb-2">My Boards</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">
              You have {boards.length} saved board{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => onOpenBoard('new')}
          className="bg-accent-green text-black hover:bg-accent-green/90 font-black uppercase tracking-widest px-8 h-14"
        >
          <Plus className="w-5 h-5 mr-3" /> Create New Board
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Card 
            key={board.id} 
            className="group relative bg-card/40 border-border hover:border-accent-green/50 transition-all duration-300 p-8 flex flex-col justify-between min-h-[220px] overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-green/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-accent-green/10 transition-colors" />
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-green mb-2 block italic">Saved Draft</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleShare(e, board)}
                    className="p-2 hover:bg-white/10 rounded-none transition-colors text-muted-foreground hover:text-foreground"
                    title="Share Board"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, board.id)}
                    className="p-2 hover:bg-white/10 rounded-none transition-colors text-muted-foreground hover:text-destructive"
                    title="Delete Board"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingBoardId === board.id ? (
                <div className="flex items-center gap-2 mb-4" onClick={e => e.stopPropagation()}>
                  <Input 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-background border-accent-green/50 font-display text-xl uppercase h-10 py-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(e as any, board);
                      if (e.key === 'Escape') setEditingBoardId(null);
                    }}
                  />
                  <button onClick={(e) => handleRename(e, board)} className="text-accent-green"><Check className="w-5 h-5" /></button>
                  <button onClick={() => setEditingBoardId(null)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-display uppercase tracking-tight group-hover:text-accent-green transition-colors truncate">
                    {board.name}
                  </h3>
                  <button 
                    onClick={(e) => handleRename(e, board)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent-green transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                {board.prospectOrder.length} Prospects Ranked
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {board.updatedAt ? `Updated ${new Date(board.updatedAt.seconds * 1000).toLocaleDateString()}` : 'Date Unknown'}
              </span>
              <Button 
                onClick={() => onOpenBoard(board.id)}
                variant="outline"
                className="border-accent-green/50 text-accent-green hover:bg-accent-green hover:text-black font-black uppercase tracking-widest text-[10px] h-9"
              >
                Open <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </Card>
        ))}

        {/* Empty State / Create New Card */}
        <button 
          onClick={() => onOpenBoard('new')}
          className="group relative border-2 border-dashed border-border hover:border-accent-green/50 hover:bg-accent-green/5 transition-all duration-300 p-8 flex flex-col items-center justify-center min-h-[220px] rounded-none"
        >
          <div className="w-12 h-12 mb-4 bg-muted/20 flex items-center justify-center group-hover:bg-accent-green group-hover:text-black transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground">Create New Board</span>
        </button>
      </div>

      {sharingBoard && (
        <ShareModal 
          isOpen={!!sharingBoard}
          onClose={() => setSharingBoard(null)}
          boardName={sharingBoard.name}
          boardId={sharingBoard.id}
        />
      )}
    </div>
  );
}
