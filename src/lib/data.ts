
"use client";

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection, 
  runTransaction,
  increment,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import type { User, WithdrawalTier, WithdrawalRequest, SpinResult } from "@/lib/types";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export const withdrawalTiers: WithdrawalTier[] = [
  { id: 1, rs: 10, points: 1800 },
  { id: 2, rs: 25, points: 3600 },
  { id: 3, rs: 50, points: 5800 },
  { id: 4, rs: 100, points: 11500 },
];

const generateUniqueReferralCode = async (name: string): Promise<string> => {
    const db = getFirestore();
    const referralCodesCollection = collection(db, "referral_codes");
    const sanitizedName = name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase();
    let code = '';
    let isUnique = false;
    let attempts = 0;
  
    while (!isUnique && attempts < 10) {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `${sanitizedName}${randomPart}`;
      const codeRef = doc(referralCodesCollection, code);
      const docSnap = await getDoc(codeRef);
      if (!docSnap.exists()) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
        code = 'SPIN' + Date.now().toString(36).toUpperCase();
    }
  
    return code;
}

export const getUserById = async (userId: string): Promise<User | null> => {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);
  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      return null;
    }
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
    throw error;
  }
};

export const createNewUser = async (authUser: AuthUser): Promise<User> => {
  const db = getFirestore();
  const referralCode = await generateUniqueReferralCode(authUser.displayName || 'USER');
  const today = new Date().toISOString().split('T')[0];
  
  const newUser: User = {
    id: authUser.uid,
    name: authUser.displayName || "New User",
    email: authUser.email!,
    avatarUrl: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`,
    points: 100,
    referralCode,
    hasUsedReferral: false,
    referredBy: null,
    withdrawalInfo: { name: authUser.displayName || "", mobile: "" },
    dailySpins: 0,
    lastSpinDate: today,
  };
  
  const userRef = doc(db, "users", authUser.uid);
  await setDoc(userRef, newUser).catch(error => {
    errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: newUser,
        })
      )
    throw error;
  });

  const referralCodeRef = doc(db, "referral_codes", referralCode);
  await setDoc(referralCodeRef, { userId: authUser.uid }).catch(error => {
    errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: referralCodeRef.path,
          operation: 'create',
          requestResourceData: { userId: authUser.uid },
        })
      )
    throw error;
  });

  return newUser;
};

export const addPointsAndLogTransaction = async (userId: string, points: number): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);
  const spinsRef = collection(db, `users/${userId}/spin_results`);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
          throw new Error("User not found.");
      }
      const user = userDoc.data() as User;
      const today = new Date().toISOString().split('T')[0];
      
      const isNewDay = user.lastSpinDate !== today;
      const spinsToday = isNewDay ? 0 : user.dailySpins || 0;

      if (spinsToday >= 200) {
          throw new Error("Daily spin limit reached.");
      }

      const updateData: any = {
          dailySpins: isNewDay ? 1 : increment(1),
          lastSpinDate: today,
      };

      if(points > 0) {
          updateData.points = increment(points);
      }

      transaction.update(userRef, updateData);

      const newSpin: Omit<SpinResult, 'id' | 'spinTime'> = {
          userId,
          pointsEarned: points,
      };
      const spinDocRef = doc(spinsRef);
      transaction.set(spinDocRef, {...newSpin, spinTime: serverTimestamp()});
    });
  } catch (error) {
    if (error instanceof Error && (error as any).code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: { points }
        }));
    }
    throw error;
  }
};

export const applyReferralCode = async (userId: string, code: string): Promise<{ success: boolean; message: string; user: User | null }> => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    
    let currentUser = await getUserById(userId);
    if (currentUser?.hasUsedReferral) {
        return { success: false, message: "You have already used a referral code.", user: currentUser };
    }

    try {
        const referralCodeRef = doc(db, "referral_codes", code.toUpperCase());
        const codeSnap = await getDoc(referralCodeRef);

        if (!codeSnap.exists()) {
            return { success: false, message: "Invalid referral code.", user: currentUser };
        }
        
        const referrerId = codeSnap.data().userId;

        if (referrerId === userId) {
            return { success: false, message: "You cannot use your own referral code.", user: currentUser };
        }

        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User not found.");

            const referrerRef = doc(db, "users", referrerId);
            
            transaction.update(userRef, { 
                points: increment(200),
                hasUsedReferral: true,
                referredBy: referrerId
            });

            transaction.update(referrerRef, {
                points: increment(100)
            });
        });
        
        const updatedUser = await getUserById(userId);
        return { success: true, message: "Successfully applied referral code! You got 200 points.", user: updatedUser };

    } catch (e: any) {
        if (e.name === 'FirebaseError' && e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `referral_codes/${code.toUpperCase()}`,
                operation: 'get',
            }));
        }
        currentUser = await getUserById(userId);
        return { success: false, message: e.message, user: currentUser };
    }
};

export const createWithdrawalRequest = async (
    userId: string,
    tier: WithdrawalTier,
    method: "Google Play" | "UPI",
    withdrawalInfo: { name: string; email: string; mobile: string }
): Promise<{ success: boolean; message: string; user: User | null }> => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    const requestsRef = collection(db, `users/${userId}/withdrawal_requests`);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found.");
            }
            
            const user = userDoc.data() as User;
            if (user.points < tier.points) {
                throw new Error("Insufficient points for this withdrawal.");
            }

            transaction.update(userRef, { 
                points: increment(-tier.points),
                withdrawalInfo: {
                    name: withdrawalInfo.name,
                    mobile: withdrawalInfo.mobile
                }
            });

            const newRequest: Omit<WithdrawalRequest, 'id' | 'requestTime'> = {
                userId,
                amount: tier.rs,
                points: tier.points,
                method,
                status: "Pending",
                userName: withdrawalInfo.name,
                userEmail: withdrawalInfo.email,
                userMobile: withdrawalInfo.mobile,
            };
            const requestDocRef = doc(requestsRef);
            transaction.set(requestDocRef, {...newRequest, requestTime: serverTimestamp()});
        });
        
        const updatedUser = await getUserById(userId);
        return { success: true, message: "Withdrawal request submitted successfully!", user: updatedUser };

    } catch (e: any) {
        if (e.name === 'FirebaseError' && e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'write',
            }));
        }
        const currentUser = await getUserById(userId);
        return { success: false, message: e.message || "Withdrawal failed.", user: currentUser };
    }
}


export const getWithdrawalHistory = async (userId: string): Promise<WithdrawalRequest[]> => {
    const db = getFirestore();
    const requestsRef = collection(db, `users/${userId}/withdrawal_requests`);
    const q = query(requestsRef, orderBy('requestTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
}


export const updateUserProfile = async (
  userId: string,
  data: { name: string; mobile: string }
): Promise<User | null> => {
    const db = getFirestore();
    const userRef = doc(db, "users", userId);
    const updateData = {
        name: data.name,
        'withdrawalInfo.name': data.name,
        'withdrawalInfo.mobile': data.mobile,
    };
    
    await updateDoc(userRef, updateData).catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: userRef.path,
              operation: 'update',
              requestResourceData: updateData,
            })
          )
        throw error;
    });
    return getUserById(userId);
};
