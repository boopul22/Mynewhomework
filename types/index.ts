export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: 'user' | 'admin';
  subscription: {
    plan: 'free' | 'homework-helper' | 'homework-helper-essay';
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    questionsUsed: number;
    questionsLimit: number;
  };
  credits?: {
    remaining: number;
    total: number;
    lastRefillDate: string;
  };
  progress: {
    weeklyGoal: number;
    weeklyProgress: number;
  };
  stats: {
    attendance: {
      present: number;
      total: number;
    };
    homework: {
      completed: number;
      total: number;
    };
    rating: number;
  };
}

export interface Class {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'in_progress' | 'completed';
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  subject: string;
  priority?: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  imageUrl: string;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  questionsPerDay: number;
  subjects: 'limited' | 'unlimited';
  aiModel: 'standard' | 'advanced';
}

export interface SubscriptionSettings {
  plans: SubscriptionPlan[];
  defaultPlan: 'free';
  trialDays: number;
} 