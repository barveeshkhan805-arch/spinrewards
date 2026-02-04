
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut, type AuthUser, type AuthError } from "firebase/auth";
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
  const [isAppUserLoading, setAppUserLoading] = useState(true);
  const [isRedirectProcessing, setRedirectProcessing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect only runs once on initial load to handle the redirect result.
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // A successful sign-in just happened.
          // The onAuthStateChanged listener will handle fetching/creating the user.
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
        // Whether it succeeded, failed, or was not a redirect,
        // we are done processing it.
        setRedirectProcessing(false);
      }
    };
    
    if (auth) {
      processRedirect();
    }
  }, [auth, toast]);

  const fetchOrCreateUser = useCallback(async (currentAuthUser: AuthUser) => {
    setAppUserLoading(true);
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
        console.error("Error fetching/creating user profile:", error);
        toast({
            title: "Authentication Error",
            description: "Could not load your user profile. Please try logging in again.",
            variant: "destructive",
        });
        signOut(auth); // Sign out the user as they can't proceed
        setAppUser(null);
    } finally {
        setAppUserLoading(false);
    }
  }, [auth, toast]);

  useEffect(() => {
    // This effect responds to changes in Firebase auth state, but waits for
    // the redirect processing to finish.
    if (isRedirectProcessing || isAuthLoading) {
      return;
    }

    if (firebaseUser) {
      if (!appUser || appUser.id !== firebaseUser.uid) {
         fetchOrCreateUser(firebaseUser);
      }
    } else {
      setAppUser(null);
      setAppUserLoading(false);
    }
  }, [firebaseUser, isAuthLoading, isRedirectProcessing, fetchOrCreateUser, appUser]);

  const login = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    // Don't set loading here, the redirect will reload the app anyway
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
      loading: isAuthLoading || isAppUserLoading || isRedirectProcessing, 
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
