import { db } from '@/app/firebase/config';
import { UserProfile, Class, Assignment, Event } from '@/types';
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
} from 'firebase/firestore';

const DEFAULT_USER_PROFILE: Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'> = {
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
  const defaultData: UserProfile = {
    uid,
    email: data.email || '',
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    ...DEFAULT_USER_PROFILE,
  };

  await setDoc(userRef, defaultData, { merge: true });
  return defaultData;
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