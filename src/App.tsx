import { BigBoard } from './components/BigBoard';
import { FriendsTab } from './components/FriendsTab';
import { MyBoardsTab } from './components/MyBoardsTab';
import { LandingPage } from './components/LandingPage';
import { Search, Menu, User, Activity, Users, Trophy, Layout, UserCircle, Briefcase, Loader2, Home } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { signInWithGoogle, logout } from './lib/firebase';
import { UsernameModal } from './components/UsernameModal';
import { useState, useEffect } from 'react';
import { Prospect } from './types';
import { fetchProspectData } from './services/dataService';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, username, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'landing' | 'rankings' | 'friends' | 'profile' | 'my-boards'>('landing');
  const [viewingFriendBoard, setViewingFriendBoard] = useState<{ userId: string, boardId: string } | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string>('default');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      const data = await fetchProspectData();
      if (data.length > 0) {
        setProspects(data);
      }
      setIsLoadingData(false);

      // Handle deep links for shared boards
      const params = new URLSearchParams(window.location.search);
      const sharedUserId = params.get('user');
      const sharedBoardId = params.get('board');
      if (sharedUserId && sharedBoardId) {
        setViewingFriendBoard({ userId: sharedUserId, boardId: sharedBoardId });
        setActiveTab('rankings');
      }
    }
    loadData();
  }, []);

  const handleViewFriendBoard = (userId: string, boardId: string) => {
    setViewingFriendBoard({ userId, boardId });
    setActiveTab('rankings');
  };

  const handleOpenBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setViewingFriendBoard(null);
    setActiveTab('rankings');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-black">
      <UsernameModal />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <button 
              onClick={() => {
                setActiveTab('landing');
                setViewingFriendBoard(null);
              }}
              className="flex items-center group"
            >
              <div className="h-6 w-auto flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                <img 
                  src="https://i.imgur.com/omyuAlQ.png" 
                  alt="DraftSlide" 
                  className="h-full w-auto object-contain" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const fallback = 'https://via.placeholder.com/120x40?text=DRAFTSLIDE';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }} 
                />
              </div>
            </button>
            <div className="hidden lg:flex items-center gap-8 self-stretch">
              <button 
                onClick={() => {
                  setActiveTab('rankings');
                  setViewingFriendBoard(null);
                }}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors h-full flex items-center px-2 ${activeTab === 'rankings' ? 'text-accent-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                NBA
              </button>
              <div className="relative group h-full flex items-center">
                <button 
                  disabled
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 cursor-not-allowed h-full flex items-center px-2"
                >
                  NFL
                </button>
                <span className="absolute -top-1 left-2 text-[7px] font-black uppercase tracking-widest text-accent-red opacity-0 group-hover:opacity-100 transition-opacity">Coming Soon</span>
              </div>
              <button 
                onClick={() => setActiveTab('friends')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors h-full flex items-center px-2 ${activeTab === 'friends' ? 'text-accent-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Friends
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors h-full flex items-center px-2 ${activeTab === 'profile' ? 'text-accent-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Profile
              </button>
              <button 
                onClick={() => setActiveTab('my-boards')}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors h-full flex items-center px-2 ${activeTab === 'my-boards' ? 'text-accent-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                My Boards
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {loading ? (
              <div className="w-24 h-10 bg-card animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
                    {username ? `@${username}` : user.displayName}
                  </span>
                  <button onClick={logout} className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted hover:text-destructive transition-colors">Logout</button>
                </div>
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 border-2 border-border" referrerPolicy="no-referrer" />
                )}
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-accent-green text-black font-bold uppercase text-[10px] tracking-widest hover:bg-accent-green/90 transition-colors"
              >
                <User className="w-4 h-4" /> Login
              </button>
            )}
            <button className="md:hidden p-2 hover:bg-card rounded-none transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="bg-background min-h-screen">
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 text-accent-green animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Synchronizing Scout Reports</span>
          </div>
        ) : activeTab === 'landing' ? (
          <LandingPage onNavigate={setActiveTab} />
        ) : activeTab === 'rankings' ? (
          <BigBoard 
            initialProspects={prospects} 
            viewingFriendBoard={viewingFriendBoard}
            onCloseFriendBoard={() => setViewingFriendBoard(null)}
            activeBoardId={activeBoardId}
            onActiveBoardChange={setActiveBoardId}
          />
        ) : activeTab === 'friends' ? (
          <FriendsTab onViewBoard={handleViewFriendBoard} />
        ) : activeTab === 'profile' ? (
          <div className="max-w-7xl mx-auto px-6 py-20 text-center">
            <UserCircle className="w-20 h-20 text-accent-green mx-auto mb-6" />
            <h2 className="text-4xl font-display uppercase mb-4">User Profile</h2>
            <p className="text-muted-foreground font-bold uppercase tracking-widest">Profile settings and stats coming soon.</p>
          </div>
        ) : (
          <MyBoardsTab onOpenBoard={handleOpenBoard} />
        )}
      </main>

      <footer className="bg-background border-t-2 border-border py-16">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-display text-xl tracking-tighter uppercase text-muted skew-x-[-15deg] origin-left">
            DRAFT SLIDE '26
          </div>
          <div className="flex gap-10">
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            © 2026 DraftSlide Media Group
          </p>
        </div>
      </footer>
    </div>
  );
}
