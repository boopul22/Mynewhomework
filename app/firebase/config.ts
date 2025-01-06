'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDeDdTWHaKf5uymuX13FTxpE_uytfZ8tRc",
  authDomain: "myhomeworkhelper-fae21.firebaseapp.com",
  projectId: "myhomeworkhelper-fae21",
  storageBucket: "myhomeworkhelper-fae21.firebasestorage.app",
  messagingSenderId: "315683203206",
  appId: "1:315683203206:web:5d457842387a7722fac907",
  measurementId: "G-KC338HR91Z"
};

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 