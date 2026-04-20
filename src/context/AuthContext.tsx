import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, loginWithEmail, registerWithEmail, logout, signInWithGoogle } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  refreshUsername: () => Promise<void>;
  loginWithEmail: typeof loginWithEmail;
  registerWithEmail: typeof registerWithEmail;
  logout: typeof logout;
  signInWithGoogle: typeof signInWithGoogle;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  username: null, 
  loading: true,
  refreshUsername: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: () => {},
  signInWithGoogle: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUsername = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUsername(userDoc.data().username || null);
      }
    } else {
      setUsername(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || null);
        }
      } else {
        setUsername(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, username, loading, refreshUsername, loginWithEmail, registerWithEmail, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
