import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';

export function UsernameModal() {
  const { user, username, refreshUsername } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOpen = !!user && !username;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if username is taken
      const q = query(collection(db, 'users'), where('username', '==', trimmed));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      // Set username and required fields for security rules
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        username: trimmed,
        displayName: user.displayName || trimmed,
        photoURL: user.photoURL || '',
        updatedAt: new Date()
      }, { merge: true });

      await refreshUsername();
    } catch (err) {
      console.error(err);
      setError('Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display uppercase tracking-tight">Create Username</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a unique username to share your boards and add friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Input
              placeholder="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-background border-border focus:ring-accent-green text-lg py-6"
              disabled={loading}
            />
            {error && <p className="text-destructive text-xs font-bold uppercase tracking-widest">{error}</p>}
          </div>
          <Button 
            type="submit" 
            className="w-full bg-accent-green text-black font-black uppercase tracking-[0.2em] py-6 hover:bg-accent-green/90 transition-colors"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Username'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
