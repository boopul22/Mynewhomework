import { db } from './firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface UsageStats {
  userId: string;
  timestamp: Timestamp;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export async function recordUsage(stats: Omit<UsageStats, 'timestamp'>) {
  try {
    await db.collection('usage_stats').add({
      ...stats,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error recording usage stats:', error);
    throw error;
  }
}

export async function getUsageStats(startDate?: Date, endDate?: Date) {
  try {
    let query = db.collection('usage_stats').orderBy('timestamp', 'desc');
    
    if (startDate) {
      query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', Timestamp.fromDate(endDate));
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as UsageStats)
    }));
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

export async function getAggregatedStats(startDate?: Date, endDate?: Date) {
  try {
    const stats = await getUsageStats(startDate, endDate);
    return stats.reduce((acc, curr) => ({
      totalPromptTokens: (acc.totalPromptTokens || 0) + curr.promptTokens,
      totalCompletionTokens: (acc.totalCompletionTokens || 0) + curr.completionTokens,
      totalTokens: (acc.totalTokens || 0) + curr.totalTokens,
      totalRequests: (acc.totalRequests || 0) + 1
    }), {} as {
      totalPromptTokens: number;
      totalCompletionTokens: number;
      totalTokens: number;
      totalRequests: number;
    });
  } catch (error) {
    console.error('Error getting aggregated stats:', error);
    throw error;
  }
} 