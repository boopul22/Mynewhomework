export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  credits: {
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

export interface CreditSettings {
  guestCredits: number;
  defaultUserCredits: number;
  refillAmount: number;
  refillPeriod: number; // in days
  maxCredits: number;
  purchaseOptions: CreditPurchaseOption[];
}

export interface CreditPurchaseOption {
  id: string;
  credits: number;
  price: number;
  currency: string;
  description: string;
} 