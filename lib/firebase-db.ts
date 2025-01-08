import { db } from '@/app/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface UsageStats {
  id: string;
  userId: string;
  tokens: number;
  timestamp: string;
}

export async function getUsageStats(startDate?: Date, endDate?: Date): Promise<UsageStats[]> {
  const usageRef = collection(db, 'usage');
  let q = query(usageRef);

  if (startDate) {
    q = query(q, where('timestamp', '>=', Timestamp.fromDate(startDate)));
  }
  if (endDate) {
    q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate().toISOString()
  })) as UsageStats[];
}

export async function getAggregatedStats(startDate?: Date, endDate?: Date) {
  const stats = await getUsageStats(startDate, endDate);
  
  return {
    totalQueries: stats.length,
    uniqueUsers: new Set(stats.map(stat => stat.userId)).size,
    averageTokensPerQuery: stats.reduce((acc, curr) => acc + curr.tokens, 0) / stats.length || 0,
  };
} 