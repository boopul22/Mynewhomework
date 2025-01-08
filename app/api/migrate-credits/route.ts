import { NextResponse } from 'next/server';
import { db } from '@/app/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { migrateFromCreditsToSubscription } from '@/lib/subscription-service';
import type { UserProfile } from '@/types/index';

export async function POST(request: Request) {
  try {
    // Get all users with credits
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(
      query(usersRef, where('credits', '!=', null))
    );

    const migrationResults = [];
    
    // Migrate each user
    for (const doc of querySnapshot.docs) {
      const userData = doc.data() as UserProfile;
      try {
        await migrateFromCreditsToSubscription(doc.id);
        migrationResults.push({
          uid: doc.id,
          status: 'success',
          previousCredits: userData.credits?.total || 0
        });
      } catch (error) {
        migrationResults.push({
          uid: doc.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          previousCredits: userData.credits?.total || 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: migrationResults,
      totalUsers: querySnapshot.size,
      successfulMigrations: migrationResults.filter(r => r.status === 'success').length
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 