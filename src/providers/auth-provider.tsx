
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, type AuthError } from "firebase/auth";
import { useUser, useAuth as useFirebaseAuth } from '@/firebase';
import type { User } from '@/lib/types';
import { getUserById, createNewUser, addPointsAndLogTransaction, updateUserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  addPoints: (points: number) => Promise<void>;
  updateProfile: (data: { name: string; mobile: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, isUserLoading: isAuthLoading } = useUser();
  const auth = useFirebaseAuth();
  const [appUser, setAppUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          toast({
            title: "Signed In Successfully",
            description: `Welcome back, ${result.user.displayName}!`,
          });
        }
      } catch (error) {
        const authError = error as AuthError;
        console.error("Sign-in error after redirect:", authError);
        toast({
          title: "Login Failed",
          description: authError.message || "An unknown error occurred during sign-in.",
          variant: "destructive",
        });
      } finally {
        // The main user loading logic will take over from here.
      }
    };
    
    if (auth) {
      checkRedirectResult();
    }
  }, [auth, toast]);

  const fetchOrCreateUser = useCallback(async (currentAuthUser: import("firebase/auth").User) => {
    setLoading(true);
    try {
        let userProfile = await getUserById(currentAuthUser.uid);
        if (!userProfile) {
          userProfile = await createNewUser(currentAuthUser);
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (userProfile.lastSpinDate !== today) {
              userProfile.dailySpins = 0;
          }
        }
        setAppUser(userProfile);
    } catch(error) {
        toast({
            title: "Authentication Error",
            description: "Could not load your user profile. Please try logging in again.",
            variant: "destructive",
        });
        signOut(auth); // Sign out the user as they can't proceed
        setAppUser(null);
    } finally {
        setLoading(false);
    }
  }, [auth, toast]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (firebaseUser) {
        fetchOrCreateUser(firebaseUser);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    }
  }, [firebaseUser, isAuthLoading, fetchOrCreateUser]);

  const login = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    await signInWithRedirect(auth, provider);
  };

  const logout = () => {
    signOut(auth);
    setAppUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setAppUser(updatedUser);
  };
  
  const addPoints = async (points: number) => {
    if (appUser) {
      const originalUser = appUser;
      
      // Optimistically update state
      setAppUser(currentUser => {
        if (!currentUser) return null;
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = currentUser.lastSpinDate !== today;
        return { 
            ...currentUser, 
            points: currentUser.points + points,
            dailySpins: isNewDay ? 1 : (currentUser.dailySpins || 0) + 1,
            lastSpinDate: today,
        };
      });
  
      try {
        await addPointsAndLogTransaction(appUser.id, points);
      } catch (error: any) {
        setAppUser(originalUser); // Rollback
        if (error.message !== "Daily spin limit reached.") {
            toast({
              title: "Spin Failed",
              description: error.message,
              variant: "destructive",
            });
        }
      }
    }
  };

  const updateProfile = async (data: { name: string; mobile: string }) => {
    if (appUser) {
        const updatedUser = await updateUserProfile(appUser.id, data);
        if (updatedUser) {
            setAppUser(updatedUser);
        }
    }
  };
  
  const value = { 
      user: appUser, 
      loading: loading || isAuthLoading, 
      login, 
      logout, 
      updateUser, 
      addPoints, 
      updateProfile 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
