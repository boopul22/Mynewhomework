'use client';

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { createUserProfile } from '@/lib/user-service';

export const signUp = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a complete user profile with all required data
    await createUserProfile(user.uid, {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName || user.displayName || email.split('@')[0], // Use provided name, then fallback to email prefix
      photoURL: user.photoURL || '',
    });
    
    return { user, error: null };
  } catch (error) {
    console.error('Error during signup:', error);
    return { user: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error during sign in:', error);
    return { user: null, error };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    // If user document doesn't exist, create a complete profile
    if (!userDoc.exists()) {
      await createUserProfile(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '', // Use Google display name or email prefix
        photoURL: user.photoURL || '',
      });
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error during Google sign in:', error);
    return { user: null, error };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Error during logout:', error);
    return { error };
  }
}; 