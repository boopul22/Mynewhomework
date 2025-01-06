'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  Search, 
  Book, 
  Calendar as CalendarIcon,
  CheckCircle2,
  BarChart2,
  Settings,
  Plus,
  Timer,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileButton from '../components/ProfileButton';
import { Class, Assignment, Event } from '@/types';
import { getUserClasses, getUserAssignments, getUserEvents } from '@/lib/user-service';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [studyTimer, setStudyTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudyTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          const [fetchedClasses, fetchedAssignments, fetchedEvents] = await Promise.all([
            getUserClasses(user.uid),
            getUserAssignments(user.uid),
            getUserEvents(user.uid),
          ]);

          setClasses(fetchedClasses);
          setAssignments(fetchedAssignments);
          setEvents(fetchedEvents);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    }

    fetchUserData();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 fixed w-full z-30 top-0">
        <div className="px-6 py-4 flex justify-between items-center max-w-[1400px] mx-auto">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-medium">StudySpace</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-9 pr-4 py-2 w-64 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            </Button>
            <ProfileButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 px-6 pb-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Timer and Quick Stats */}
          <Card className="col-span-8 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 flex flex-col justify-center items-center border-r border-gray-100 dark:border-gray-800 pr-6">
                <p className="text-4xl font-mono mb-2">{formatTime(studyTimer)}</p>
                <div className="flex space-x-2">
                  <Button 
                    variant={isTimerRunning ? "destructive" : "default"}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    size="sm"
                  >
                    {isTimerRunning ? 'Stop' : 'Start'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setStudyTimer(0)}
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 mb-1">Today's Tasks</span>
                      <span className="text-2xl font-semibold">8/12</span>
                      <Progress value={66} className="h-1 mt-2" />
                    </div>
                  </Card>
                  <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 mb-1">Study Time</span>
                      <span className="text-2xl font-semibold">2.5h</span>
                      <Progress value={75} className="h-1 mt-2" />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>

          {/* Calendar Card */}
          <Card className="col-span-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && setCurrentDate(date)}
              className="rounded-md"
            />
          </Card>

          {/* Tasks Overview */}
          <Card className="col-span-8 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Tasks Overview</h2>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 bg-gray-50 dark:bg-gray-800 p-1">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <div className="grid grid-cols-2 gap-4">
                  {assignments.map((assignment, index) => (
                    <Card key={index} className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{assignment.title}</h3>
                          <Badge variant="outline" className={getPriorityColor(assignment.priority || 'medium')}>
                            {assignment.priority || 'Medium'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{assignment.dueDate}</p>
                        <div className="mt-auto">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span>{assignment.progress}%</span>
                          </div>
                          <Progress value={assignment.progress || 0} className="h-1" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="col-span-4 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-medium mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3">
              {getUpcomingDeadlines().map((assignment, index) => (
                <Card key={index} className="p-3 bg-red-50 dark:bg-red-900/20 border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-red-600">Due: {assignment.dueDate}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Progress Overview */}
          <Card className="col-span-12 p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-medium mb-6">Progress Overview</h2>
            <div className="grid grid-cols-4 gap-6">
              <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Completed Tasks</span>
                  <span className="text-2xl font-semibold">24/30</span>
                  <Progress value={80} className="h-1 mt-2" />
                </div>
              </Card>
              <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">On-time Submissions</span>
                  <span className="text-2xl font-semibold">28/30</span>
                  <Progress value={93} className="h-1 mt-2" />
                </div>
              </Card>
              <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Study Goals</span>
                  <span className="text-2xl font-semibold">18/20</span>
                  <Progress value={90} className="h-1 mt-2" />
                </div>
              </Card>
              <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-0">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Weekly Hours</span>
                  <span className="text-2xl font-semibold">12.5/15</span>
                  <Progress value={83} className="h-1 mt-2" />
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 