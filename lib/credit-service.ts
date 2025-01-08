import { db } from '@/app/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import type { CreditSettings, UserProfile } from '@/types/index';

const DEFAULT_CREDIT_SETTINGS: CreditSettings = {
  guestCredits: 5,
  defaultUserCredits: 20,
  refillAmount: 5,
  refillPeriod: 7, // 7 days
  maxCredits: 100,
  purchaseOptions: [
    {
      id: 'basic',
      credits: 50,
      price: 4.99,
      currency: 'USD',
      description: 'Basic Package - 50 Credits'
    },
    {
      id: 'premium',
      credits: 150,
      price: 9.99,
      currency: 'USD',
      description: 'Premium Package - 150 Credits'
    },
    {
      id: 'unlimited',
      credits: 500,
      price: 19.99,
      currency: 'USD',
      description: 'Professional Package - 500 Credits'
    }
  ]
};

const DEFAULT_USER_CREDITS = {
  remaining: 0,
  total: 0,
  lastRefillDate: new Date().toISOString()
};

export async function getCreditSettings(): Promise<CreditSettings> {
  const settingsRef = doc(db, 'settings', 'credits');
  const settingsSnap = await getDoc(settingsRef);
  
  if (!settingsSnap.exists()) {
    // Initialize default settings if they don't exist
    await setDoc(settingsRef, DEFAULT_CREDIT_SETTINGS);
    return DEFAULT_CREDIT_SETTINGS;
  }
  
  return settingsSnap.data() as CreditSettings;
}

export async function updateCreditSettings(settings: Partial<CreditSettings>): Promise<void> {
  const settingsRef = doc(db, 'settings', 'credits');
  await updateDoc(settingsRef, settings);
}

export async function initializeUserCredits(uid: string): Promise<void> {
  const settings = await getCreditSettings();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  if (userData.credits?.remaining) return; // Don't initialize if credits already exist
  
  await updateDoc(userRef, {
    credits: {
      remaining: settings.defaultUserCredits,
      total: settings.defaultUserCredits,
      lastRefillDate: new Date().toISOString()
    }
  });
  
  // Record the initialization transaction
  const transactionRef = collection(db, 'users', uid, 'creditTransactions');
  await addDoc(transactionRef, {
    amount: settings.defaultUserCredits,
    type: 'add',
    timestamp: new Date().toISOString(),
    previousBalance: 0,
    newBalance: settings.defaultUserCredits,
    description: 'Initial credit allocation'
  });
}

export async function getGuestCredits(): Promise<number> {
  const settings = await getCreditSettings();
  const guestCreditsStr = localStorage.getItem('guestCredits');
  
  // If no credits in localStorage, initialize them
  if (!guestCreditsStr) {
    localStorage.setItem('guestCredits', settings.guestCredits.toString());
    return settings.guestCredits;
  }
  
  return parseInt(guestCreditsStr);
}

export async function useCredits(uid: string | null, amount: number = 1): Promise<boolean> {
  if (!uid) {
    // Handle guest credits (stored in localStorage)
    const settings = await getCreditSettings();
    const guestCreditsStr = localStorage.getItem('guestCredits');
    
    // Initialize guest credits if they don't exist
    if (!guestCreditsStr) {
      localStorage.setItem('guestCredits', settings.guestCredits.toString());
    }
    
    const guestCredits = guestCreditsStr ? parseInt(guestCreditsStr) : settings.guestCredits;
    
    if (guestCredits < amount) return false;
    
    localStorage.setItem('guestCredits', (guestCredits - amount).toString());
    return true;
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return false;
  
  const userData = userSnap.data() as UserProfile;
  if (!userData.credits) {
    // Initialize credits if they don't exist
    await initializeUserCredits(uid);
    return false; // Return false for this attempt, let them try again after initialization
  }
  
  if (userData.credits.remaining < amount) return false;
  
  const previousBalance = userData.credits.remaining;
  const newBalance = previousBalance - amount;
  
  await updateDoc(userRef, {
    'credits.remaining': newBalance
  });

  // Record the transaction
  const transactionRef = collection(db, 'users', uid, 'creditTransactions');
  await addDoc(transactionRef, {
    amount: -amount,
    type: 'use',
    timestamp: new Date().toISOString(),
    previousBalance,
    newBalance,
    description: 'Credit usage'
  });
  
  return true;
}

export async function addCredits(uid: string, amount: number, isAdmin: boolean = false): Promise<void> {
  const settings = await getCreditSettings();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  if (!userData.credits) {
    await initializeUserCredits(uid);
    return;
  }
  
  // Calculate new remaining credits (can't go below 0)
  const newRemaining = Math.max(0, userData.credits.remaining + amount);
  // For negative amounts, don't add to total
  const newTotal = amount > 0 ? userData.credits.total + amount : userData.credits.total;
  
  // Only enforce maximum credits limit for non-admin operations
  const finalRemaining = isAdmin ? newRemaining : Math.min(newRemaining, settings.maxCredits);
  
  await updateDoc(userRef, {
    'credits.remaining': finalRemaining,
    'credits.total': newTotal
  });
  
  // Record the transaction
  const transactionRef = collection(db, 'users', uid, 'creditTransactions');
  await addDoc(transactionRef, {
    amount,
    type: amount > 0 ? 'add' : 'remove',
    timestamp: new Date().toISOString(),
    previousBalance: userData.credits.remaining,
    newBalance: finalRemaining,
    description: amount > 0 ? 'Credits added by admin' : 'Credits removed by admin'
  });
}

export async function checkAndRefillCredits(uid: string): Promise<void> {
  const settings = await getCreditSettings();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  if (!userData.credits) {
    await initializeUserCredits(uid);
    return;
  }
  
  const lastRefill = new Date(userData.credits.lastRefillDate);
  const now = new Date();
  const daysSinceRefill = Math.floor((now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceRefill >= settings.refillPeriod) {
    const previousBalance = userData.credits.remaining;
    const newTotal = Math.min(userData.credits.remaining + settings.refillAmount, settings.maxCredits);
    
    await updateDoc(userRef, {
      'credits.remaining': newTotal,
      'credits.lastRefillDate': now.toISOString()
    });

    // Record the refill transaction
    const transactionRef = collection(db, 'users', uid, 'creditTransactions');
    await addDoc(transactionRef, {
      amount: settings.refillAmount,
      type: 'refill',
      timestamp: now.toISOString(),
      previousBalance,
      newBalance: newTotal,
      description: 'Periodic credit refill'
    });
  }
} 