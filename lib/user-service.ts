import { db } from '@/app/firebase/config';
import type { UserProfile, Class, Assignment, Event } from '@/types/index';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getSubscriptionSettings } from './subscription-service';

const DEFAULT_USER_PROFILE: Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'> = {
  subscription: {
    plan: 'free',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
    questionsUsed: 0,
    questionsLimit: 3 // Will be updated from subscription settings
  },
  progress: {
    weeklyGoal: 100,
    weeklyProgress: 0,
  },
  stats: {
    attendance: {
      present: 19,
      total: 20,
    },
    homework: {
      completed: 53,
      total: 56,
    },
    rating: 89,
  },
};

export async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  
  // Get subscription settings for default plan
  const subscriptionSettings = await getSubscriptionSettings();
  const defaultPlan = subscriptionSettings.plans.find(p => p.id === subscriptionSettings.defaultPlan);
  
  if (!defaultPlan) {
    throw new Error('Default subscription plan not found');
  }
  
  // Create the user profile with complete data
  const defaultData: UserProfile = {
    uid,
    email: data.email || '',
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    subscription: {
      ...DEFAULT_USER_PROFILE.subscription,
      questionsLimit: defaultPlan.questionsPerDay
    },
    progress: DEFAULT_USER_PROFILE.progress,
    stats: DEFAULT_USER_PROFILE.stats
  };

  // Check if user already exists
  const userSnap = await getDoc(userRef);
  const existingData = userSnap.exists() ? userSnap.data() : null;

  // Merge with existing data if it exists
  const finalData = existingData ? {
    ...existingData,
    ...defaultData,
    email: data.email || existingData.email || '', // Preserve existing data if no new data
    displayName: data.displayName || existingData.displayName || '',
    photoURL: data.photoURL || existingData.photoURL || '',
    lastUpdated: serverTimestamp(),
  } : {
    ...defaultData,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  };

  // Save the data
  await setDoc(userRef, finalData);

  // Only create subscription history for new users
  if (!existingData) {
    const subscriptionHistoryRef = collection(db, 'users', uid, 'subscriptionHistory');
    await addDoc(subscriptionHistoryRef, {
      type: 'trial_start',
      plan: subscriptionSettings.defaultPlan,
      timestamp: new Date().toISOString(),
      endDate: defaultData.subscription.endDate
    });
  }

  return finalData;
}

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    // Ensure all required fields exist with default values
    return {
      uid,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',
      subscription: data.subscription || {
        plan: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
        questionsUsed: 0,
        questionsLimit: 3 // Will be updated from subscription settings
      },
      progress: {
        weeklyGoal: data.progress?.weeklyGoal ?? DEFAULT_USER_PROFILE.progress.weeklyGoal,
        weeklyProgress: data.progress?.weeklyProgress ?? DEFAULT_USER_PROFILE.progress.weeklyProgress,
      },
      stats: {
        attendance: {
          present: data.stats?.attendance?.present ?? DEFAULT_USER_PROFILE.stats.attendance.present,
          total: data.stats?.attendance?.total ?? DEFAULT_USER_PROFILE.stats.attendance.total,
        },
        homework: {
          completed: data.stats?.homework?.completed ?? DEFAULT_USER_PROFILE.stats.homework.completed,
          total: data.stats?.homework?.total ?? DEFAULT_USER_PROFILE.stats.homework.total,
        },
        rating: data.stats?.rating ?? DEFAULT_USER_PROFILE.stats.rating,
      },
    };
  }
  
  // Return a new profile with default values if none exists
  return createUserProfile(uid, {
    email: '',
    displayName: '',
    photoURL: '',
  });
}

export async function updateUserProgress(
  uid: string,
  progress: number
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    'progress.weeklyProgress': progress,
  });
}

export async function getUserClasses(uid: string): Promise<Class[]> {
  const classesRef = collection(db, 'users', uid, 'classes');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    classesRef,
    where('date', '>=', Timestamp.fromDate(today))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Class));
}

export async function getUserAssignments(uid: string): Promise<Assignment[]> {
  const assignmentsRef = collection(db, 'users', uid, 'assignments');
  const querySnapshot = await getDocs(assignmentsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Assignment));
}

export async function getUserEvents(uid: string): Promise<Event[]> {
  const eventsRef = collection(db, 'users', uid, 'events');
  const querySnapshot = await getDocs(eventsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Event));
}

export async function updateAssignmentProgress(
  uid: string,
  assignmentId: string,
  progress: number
): Promise<void> {
  const assignmentRef = doc(db, 'users', uid, 'assignments', assignmentId);
  await updateDoc(assignmentRef, {
    progress,
  });
} 