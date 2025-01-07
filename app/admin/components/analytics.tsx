'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { db } from '@/app/firebase/config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  averageSessionTime: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    averageSessionTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch users count
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const totalUsers = usersSnapshot.size;

      // Fetch active users (users who logged in within the selected time range)
      const now = new Date();
      const rangeDate = new Date();
      switch (timeRange) {
        case '7d':
          rangeDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          rangeDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          rangeDate.setDate(now.getDate() - 90);
          break;
      }

      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLogin', '>=', rangeDate)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      
      // For demo purposes, setting some mock data
      // In a real application, you would calculate these from actual user session data
      setAnalytics({
        totalUsers,
        activeUsers: activeUsersSnapshot.size,
        totalSessions: Math.floor(Math.random() * 1000),
        averageSessionTime: Math.floor(Math.random() * 60),
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Users</div>
          <div className="text-2xl font-bold">{analytics.totalUsers}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Active Users</div>
          <div className="text-2xl font-bold">{analytics.activeUsers}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Sessions</div>
          <div className="text-2xl font-bold">{analytics.totalSessions}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Avg. Session Time</div>
          <div className="text-2xl font-bold">{analytics.averageSessionTime} min</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Chart will be implemented here
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Features</h3>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Feature usage chart will be implemented here
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">User Activity</h3>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Activity heatmap will be implemented here
          </div>
        </Card>
      </div>
    </div>
  );
} 