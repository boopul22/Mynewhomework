import { create } from 'zustand'
import { db, auth } from '@/app/firebase/config'
import { collection, addDoc, query, orderBy, getDocs, where, serverTimestamp, onSnapshot, limit } from 'firebase/firestore'

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
}

export const useChatHistory = create<ChatHistoryState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  createNewChat: () => {
    const chatId = Math.random().toString(36).substring(7);
    return chatId;
  },

  addMessage: async (question: string, answer: string, chatId?: string) => {
    const user = auth.currentUser;
    console.log('Current user:', user?.uid);
    
    if (!user) {
      console.warn('User not authenticated, message will not be persisted');
      set((state) => ({
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
      console.log('Adding message to Firestore...');
      // Add to Firestore
      const messageData = {
        userId: user.uid,
        question,
        answer,
        timestamp: serverTimestamp(),
        chatId: chatId || Math.random().toString(36).substring(7)
      };
      
      const docRef = await addDoc(collection(db, 'chat_history'), messageData);
      console.log('Message added to Firestore with ID:', docRef.id);

      // Update local state
      set((state) => {
        console.log('Updating local state with new message');
        return {
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
        };
      });
    } catch (error: any) {
      console.error('Error adding message to Firestore:', error);
      set((state) => ({
        messages: [
          {
            id: Math.random().toString(36).substring(7),
            question,
            answer,
            timestamp: new Date(),
            userId: user.uid,
            chatId: chatId || Math.random().toString(36).substring(7)
          },
          ...state.messages,
        ],
        error: error.message
      }));
    }
  },

  loadMessages: async () => {
    const user = auth.currentUser;
    console.log('Loading messages for user:', user?.uid);
    
    if (!user) {
      console.warn('User not authenticated, cannot load messages');
      set({ messages: [], error: 'Please sign in to view chat history' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      console.log('Querying Firestore for messages...');
      const q = query(
        collection(db, 'chat_history'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      console.log('Received Firestore documents count:', snapshot.size);
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

      console.log('Processed messages:', messages.length);
      set({ messages, isLoading: false, error: null });
      
    } catch (error: any) {
      console.error('Error loading messages from Firestore:', error);
      set({ 
        error: `Error loading chat history: ${error.message}`,
        isLoading: false 
      });
    }
  },

  clearHistory: async () => {
    const user = auth.currentUser;
    console.log('Clearing history for user:', user?.uid);
    set({ messages: [], error: null });
  },
})) 