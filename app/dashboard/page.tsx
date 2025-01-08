'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  Search, 
  BarChart2,
  Calendar as CalendarIcon,
  AlertCircle,
  Plus,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Assignment } from '@/types';
import { getUserAssignments } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [completedTasks, setCompletedTasks] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchAssignments = async () => {
      const assignments = await getUserAssignments(user.uid);
      setAssignments(assignments);
      
      // Calculate statistics
      const completed = assignments.filter(a => a.status === 'completed').length;
      setCompletedTasks(Math.round((completed / assignments.length) * 100));

      const today = new Date();
      const dueToday = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate.toDateString() === today.toDateString();
      }).length;
      setDueTodayCount(dueToday);

      const upcoming = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate > today;
      }).length;
      setUpcomingCount(upcoming);
    };

    fetchAssignments();
  }, [user, router]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    const threeDaysFromNow = new Date(today.setDate(today.getDate() + 3));
    return assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate <= threeDaysFromNow;
    });
  };

  // Rest of the component remains the same...
} 