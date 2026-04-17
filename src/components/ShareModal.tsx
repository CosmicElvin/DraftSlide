import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link2, Mail, User, Copy, Check, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardName: string;
  boardId: string;
  userId?: string;
  isPublic?: boolean;
}

export function ShareModal({ isOpen, onClose, boardName, boardId, userId, isPublic }: ShareModalProps) {
  const { user, username } = useAuth();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [shareUsername, setShareUsername] = useState('');
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [publicBoard, setPublicBoard] = useState(isPublic || false);

  useEffect(() => {
    setPublicBoard(isPublic || false);
  }, [isPublic]);

  const shareUrl = publicBoard && userId ? `${window.location.origin}?user=${userId}&board=${boardId}` : '';

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async () => {
    if (!userId || !boardId) return;
    setIsPublicLoading(true);
    try {
      const boardRef = doc(db, 'users', userId, 'boards', boardId);
      await updateDoc(boardRef, { isPublic: !publicBoard });
      setPublicBoard(!publicBoard);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/boards/${boardId}`);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const handleEmailShare = () => {
    if (!shareUrl) return;
    const subject = encodeURIComponent(`Check out my NBA Draft Board: ${boardName}`);
    const body = encodeURIComponent(`Hey, take a look at my 2026 NBA Draft rankings on DraftSlide: ${shareUrl}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase tracking-tight">Share Board</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share "{boardName}" with others via link, email, or username.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-white">Make Board Public</p>
                <p className="text-[10px] text-muted-foreground">Allows anyone with the link to view your board.</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant={publicBoard ? "default" : "outline"}
              onClick={togglePublic}
              disabled={isPublicLoading}
            >
              {isPublicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (publicBoard ? "Public" : "Private")}
            </Button>
          </div>

          {/* Link Share */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Share Link</label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={publicBoard ? shareUrl : "Board must be public to share via link"} 
                className={`bg-background border-border text-xs font-mono ${!publicBoard ? 'text-muted-foreground' : ''}`}
              />
              <Button size="icon" variant="outline" onClick={copyToClipboard} className="border-border hover:bg-white/5" disabled={!publicBoard}>
                {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
...

          <div className="grid grid-cols-2 gap-4">
            {/* Email Share */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Share</label>
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="email@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border text-xs"
                />
                <Button size="sm" className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10" onClick={handleEmailShare}>
                  <Mail className="w-4 h-4 mr-2" /> Send Email
                </Button>
              </div>
            </div>

            {/* Username Share */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username Share</label>
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="username" 
                  value={shareUsername}
                  onChange={(e) => setShareUsername(e.target.value)}
                  className="bg-background border-border text-xs"
                />
                <Button size="sm" className="bg-accent-green text-black hover:bg-accent-green/90 font-bold uppercase tracking-widest text-[10px]">
                  <User className="w-4 h-4 mr-2" /> Share to User
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
