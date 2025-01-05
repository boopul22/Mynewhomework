import { NextResponse } from 'next/server';
import { getUsageStats, getAggregatedStats } from '@/lib/firebase-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateRange = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const [stats, aggregated] = await Promise.all([
      getUsageStats(dateRange.startDate, dateRange.endDate),
      getAggregatedStats(dateRange.startDate, dateRange.endDate),
    ]);

    // Convert Firestore timestamps to ISO strings
    const formattedStats = stats.map(stat => ({
      ...stat,
      timestamp: stat.timestamp.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: formattedStats,
        aggregated,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch usage statistics',
      },
      { status: 500 }
    );
  }
} 