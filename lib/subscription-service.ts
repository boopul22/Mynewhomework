import { db } from '@/app/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import type { SubscriptionSettings, SubscriptionPlan, UserProfile } from '@/types/index';

const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
  plans: [
    {
      id: 'free',
      name: 'Basic Plan',
      price: 0,
      interval: 'month',
      features: [
        '3 questions daily',
        '5 subjects',
        'Standard AI model',
        'Standard support',
        'Upgrade to StudyMonkey Premium when you are ready'
      ],
      questionsPerDay: 3,
      subjects: 'limited',
      aiModel: 'standard'
    },
    {
      id: 'homework-helper',
      name: 'Homework Helper',
      price: 8,
      interval: 'month',
      features: [
        '50 questions daily',
        'Unlimited subjects',
        'Standard AI model',
        'Premium support',
        'Cancel anytime, no questions asked'
      ],
      questionsPerDay: 50,
      subjects: 'unlimited',
      aiModel: 'standard'
    },
    {
      id: 'homework-helper-essay',
      name: 'Homework Helper + Essay',
      price: 10,
      interval: 'month',
      features: [
        'Unlimited questions daily',
        'Unlimited subjects',
        'Advanced AI model',
        'Premium support',
        'Cancel anytime, no questions asked'
      ],
      questionsPerDay: Infinity,
      subjects: 'unlimited',
      aiModel: 'advanced'
    }
  ],
  defaultPlan: 'free',
  trialDays: 14
};

export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  const settingsRef = doc(db, 'settings', 'subscription');
  const settingsSnap = await getDoc(settingsRef);
  
  if (!settingsSnap.exists()) {
    // Initialize default settings if they don't exist
    await setDoc(settingsRef, DEFAULT_SUBSCRIPTION_SETTINGS);
    return DEFAULT_SUBSCRIPTION_SETTINGS;
  }
  
  return settingsSnap.data() as SubscriptionSettings;
}

export async function updateSubscriptionSettings(settings: Partial<SubscriptionSettings>): Promise<void> {
  try {
    const settingsRef = doc(db, 'settings', 'subscription');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      // If settings don't exist, create them with defaults first
      await setDoc(settingsRef, DEFAULT_SUBSCRIPTION_SETTINGS);
    }
    
    // Update only the fields that are provided
    await updateDoc(settingsRef, {
      ...(settings.plans && { plans: settings.plans }),
      ...(settings.defaultPlan && { defaultPlan: settings.defaultPlan }),
      ...(settings.trialDays && { trialDays: settings.trialDays })
    });
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    throw error;
  }
}

export async function initializeUserSubscription(uid: string): Promise<void> {
  const settings = await getSubscriptionSettings();
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  if (userData.subscription?.plan) return; // Don't initialize if subscription already exists
  
  const now = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + settings.trialDays);
  
  await updateDoc(userRef, {
    subscription: {
      plan: settings.defaultPlan,
      status: 'active',
      startDate: now.toISOString(),
      endDate: trialEnd.toISOString(),
      questionsUsed: 0,
      questionsLimit: DEFAULT_SUBSCRIPTION_SETTINGS.plans[0].questionsPerDay
    }
  });
  
  // Record the subscription initialization
  const subscriptionHistoryRef = collection(db, 'users', uid, 'subscriptionHistory');
  await addDoc(subscriptionHistoryRef, {
    type: 'trial_start',
    plan: settings.defaultPlan,
    timestamp: now.toISOString(),
    endDate: trialEnd.toISOString()
  });
}

export async function updateUserSubscription(
  uid: string,
  plan: SubscriptionPlan['id'],
  status: UserProfile['subscription']['status'] = 'active'
): Promise<void> {
  const settings = await getSubscriptionSettings();
  const planDetails = settings.plans.find(p => p.id === plan);
  
  if (!planDetails) {
    throw new Error('Invalid subscription plan');
  }
  
  const userRef = doc(db, 'users', uid);
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Set to 1 month from now
  
  await updateDoc(userRef, {
    subscription: {
      plan,
      status,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      questionsUsed: 0,
      questionsLimit: planDetails.questionsPerDay
    }
  });
  
  // Record the subscription change
  const subscriptionHistoryRef = collection(db, 'users', uid, 'subscriptionHistory');
  await addDoc(subscriptionHistoryRef, {
    type: 'plan_change',
    plan,
    timestamp: now.toISOString(),
    endDate: endDate.toISOString()
  });
}

export async function useQuestion(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return false;
  
  const userData = userSnap.data() as UserProfile;
  const { subscription } = userData;
  
  // Check if subscription is active and not expired
  if (subscription.status !== 'active' || new Date(subscription.endDate) < new Date()) {
    return false;
  }
  
  // Check if user has reached their daily limit
  if (subscription.questionsUsed >= subscription.questionsLimit) {
    return false;
  }
  
  // Increment questions used
  await updateDoc(userRef, {
    'subscription.questionsUsed': subscription.questionsUsed + 1
  });
  
  return true;
}

export async function migrateFromCreditsToSubscription(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  
  // If user already has a subscription, skip migration
  if (userData.subscription?.plan) return;
  
  // Determine plan based on credits
  let plan: SubscriptionPlan['id'] = 'free';
  const totalCredits = userData.credits?.total || 0;
  
  if (totalCredits >= 500) {
    plan = 'homework-helper-essay';
  } else if (totalCredits >= 150) {
    plan = 'homework-helper';
  }
  
  const now = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  
  const planDetails = DEFAULT_SUBSCRIPTION_SETTINGS.plans.find(p => p.id === plan);
  
  // Set up new subscription
  await updateDoc(userRef, {
    subscription: {
      plan,
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      questionsUsed: 0,
      questionsLimit: planDetails?.questionsPerDay || DEFAULT_SUBSCRIPTION_SETTINGS.plans[0].questionsPerDay
    },
    // Remove credits field
    credits: null
  });
  
  // Record the migration
  const subscriptionHistoryRef = collection(db, 'users', uid, 'subscriptionHistory');
  await addDoc(subscriptionHistoryRef, {
    type: 'credit_migration',
    previousCredits: userData.credits,
    newPlan: plan,
    timestamp: now.toISOString(),
    endDate: endDate.toISOString()
  });
}

export async function resetDailyQuestions(): Promise<void> {
  const usersRef = collection(db, 'users');
  const batch = writeBatch(db);
  
  // Get all users with active subscriptions
  const querySnapshot = await getDocs(query(usersRef, where('subscription.status', '==', 'active')));
  
  querySnapshot.forEach((docSnap) => {
    const userData = docSnap.data() as UserProfile;
    if (userData.subscription) {
      batch.update(docSnap.ref, {
        'subscription.questionsUsed': 0
      });
    }
  });
  
  await batch.commit();
} 