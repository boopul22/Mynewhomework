import { NextResponse } from 'next/server';
import { resetDailyQuestions } from '@/lib/subscription-service';

export async function POST(request: Request) {
  try {
    await resetDailyQuestions();
    
    return NextResponse.json({
      success: true,
      message: 'Daily questions reset successfully'
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 