import { create } from 'zustand'
import { db, auth } from '@/app/firebase/config'
import { 
  collection, addDoc, query, orderBy, getDocs, 
  where, serverTimestamp, onSnapshot, limit, 
  Unsubscribe, enableNetwork, disableNetwork 
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface ChatMessage {
  id: string
  question: string
  answer: string
  timestamp: Date
  userId: string
  chatId: string
}

interface ChatHistoryState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  addMessage: (question: string, answer: string, chatId?: string) => Promise<void>
  loadMessages: () => Promise<void>
  clearHistory: () => Promise<void>
  createNewChat: () => string
  unsubscribe: (() => void) | null
  isOnline: boolean
  setOnline: (online: boolean) => Promise<void>
}

export const useChatHistory = create<ChatHistoryState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  unsubscribe: null,
  isOnline: navigator.onLine,
  
  setOnline: async (online: boolean) => {
    try {
      if (online) {
        await enableNetwork(db);
      } else {
        await disableNetwork(db);
      }
      set({ isOnline: online });
    } catch (error) {
      console.error('Error setting online status:', error);
    }
  },

  createNewChat: () => {
    const chatId = Math.random().toString(36).substring(7);
    return chatId;
  },

  addMessage: async (question: string, answer: string, chatId?: string) => {
    const user = auth.currentUser;
    
    if (!user) {
      set((state) => ({
        error: 'Please sign in to save messages',
        messages: [
          {
            id: Math.random().toString(36).substring(7),
            question,
            answer,
            timestamp: new Date(),
            userId: 'anonymous',
            chatId: chatId || Math.random().toString(36).substring(7)
          },
          ...state.messages,
        ],
      }));
      return;
    }

    try {
      const messageData = {
        userId: user.uid,
        question,
        answer,
        timestamp: serverTimestamp(),
        chatId: chatId || Math.random().toString(36).substring(7)
      };
      
      const docRef = await addDoc(collection(db, 'chat_history'), messageData);
      
      // Update local state immediately for better UX
      set((state) => ({
        messages: [
          {
            id: docRef.id,
            question,
            answer,
            timestamp: new Date(),
            userId: user.uid,
            chatId: messageData.chatId
          },
          ...state.messages,
        ],
        error: null
      }));
    } catch (error: any) {
      console.error('Error adding message:', error);
      set({ error: `Failed to save message: ${error.message}` });
    }
  },

  loadMessages: async () => {
    const user = auth.currentUser;
    
    if (!user) {
      set({ messages: [], error: 'Please sign in to view chat history' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Clean up existing subscription if any
      const currentUnsubscribe = get().unsubscribe;
      if (currentUnsubscribe && typeof currentUnsubscribe === 'function') {
        currentUnsubscribe();
      }

      const q = query(
        collection(db, 'chat_history'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        {
          next: (snapshot) => {
            const messages = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                question: data.question,
                answer: data.answer,
                timestamp: data.timestamp?.toDate() || new Date(),
                userId: data.userId,
                chatId: data.chatId
              };
            });
            set({ messages, isLoading: false, error: null });
          },
          error: (error) => {
            console.error('Real-time sync error:', error);
            set({ 
              error: `Failed to sync messages: ${error.message}`,
              isLoading: false 
            });
          }
        }
      );

      set({ unsubscribe });
      
    } catch (error: any) {
      console.error('Error in loadMessages:', error);
      set({ 
        error: `Failed to load chat history: ${error.message}`,
        isLoading: false 
      });
    }
  },

  clearHistory: async () => {
    const user = auth.currentUser;
    if (!user) {
      set({ error: 'Please sign in to clear history' });
      return;
    }
    set({ messages: [], error: null });
  },
}));

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useChatHistory.getState().setOnline(true);
  });
  
  window.addEventListener('offline', () => {
    useChatHistory.getState().setOnline(false);
  });
  
  // Set up auth state listener to reload messages when auth state changes
  onAuthStateChanged(auth, (user) => {
    if (user) {
      useChatHistory.getState().loadMessages();
    } else {
      const currentUnsubscribe = useChatHistory.getState().unsubscribe;
      if (currentUnsubscribe && typeof currentUnsubscribe === 'function') {
        currentUnsubscribe();
      }
      useChatHistory.setState({ messages: [], error: null, unsubscribe: null });
    }
  });
} 