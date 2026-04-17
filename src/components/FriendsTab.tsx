import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { Search, UserPlus, Users, ExternalLink, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface Friend {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
}

interface FriendsTabProps {
  onViewBoard: (userId: string, boardId: string) => void;
}

export function FriendsTab({ onViewBoard }: FriendsTabProps) {
  const { user, username } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
      const userData = snapshot.data();
      if (userData?.friends && userData.friends.length > 0) {
        const friendsData: Friend[] = [];
        // Fetch friend details
        for (const friendUid of userData.friends) {
          const friendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendUid)));
          if (!friendDoc.empty) {
            const data = friendDoc.docs[0].data();
            friendsData.push({
              uid: data.uid,
              username: data.username,
              displayName: data.displayName,
              photoURL: data.photoURL
            });
          }
        }
        setFriends(friendsData);
      } else {
        setFriends([]);
      }
    });

    return unsubscribe;
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    try {
      const q = query(
        collection(db, 'users'), 
        where('username', '==', searchQuery.trim().toLowerCase())
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => doc.data() as Friend)
        .filter(f => f.uid !== user.uid);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addFriend = async (friendUid: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        friends: arrayUnion(friendUid)
      });
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Users className="w-8 h-8 text-accent-green" />
        <h2 className="text-3xl font-display uppercase tracking-tight">Friends & Community</h2>
      </div>

      {/* Search Section */}
      <Card className="p-6 bg-card/40 border-border backdrop-blur-xl">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-background border-border py-6 text-lg"
            />
          </div>
          <Button 
            type="submit" 
            className="bg-accent-green text-black font-black uppercase tracking-widest px-8"
            disabled={searching}
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3">
            {searchResults.map(result => (
              <div key={result.uid} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                  {result.photoURL ? (
                    <img src={result.photoURL} alt="" className="w-10 h-10 rounded-full border border-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green font-bold">
                      {result.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-foreground">@{result.username}</div>
                  </div>
                </div>
                {friends.some(f => f.uid === result.uid) ? (
                  <Badge variant="secondary" className="bg-accent-green/20 text-accent-green border-accent-green/30">
                    <Check className="w-3 h-3 mr-1" /> Friend
                  </Badge>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-accent-green text-accent-green hover:bg-accent-green hover:text-black"
                    onClick={() => addFriend(result.uid)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Friends List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {friends.length > 0 ? (
          friends.map(friend => (
            <Card key={friend.uid} className="p-6 bg-card/40 border-border hover:border-accent-green/50 transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-border group-hover:border-accent-green transition-colors" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-accent-green/20 flex items-center justify-center text-accent-green font-bold text-xl">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-display text-lg uppercase tracking-tight">@{friend.username}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Active Boards</h4>
                <FriendBoardsList friendUid={friend.uid} onViewBoard={onViewBoard} />
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">No friends added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendBoardsList({ friendUid, onViewBoard }: { friendUid: string, onViewBoard: (userId: string, boardId: string) => void }) {
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users', friendUid, 'boards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [friendUid]);

  if (loading) return <div className="h-20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2">
      {boards.length > 0 ? (
        boards.map(board => (
          <button
            key={board.id}
            onClick={() => onViewBoard(friendUid, board.id)}
            className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-accent-green/30 hover:bg-accent-green/5 transition-all group/item"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/80 group-hover/item:text-accent-green">{board.name}</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/item:text-accent-green" />
          </button>
        ))
      ) : (
        <p className="text-[10px] text-muted-foreground italic">No public boards found</p>
      )}
    </div>
  );
}
