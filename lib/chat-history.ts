import { create } from 'zustand'

interface ChatMessage {
  id: string
  question: string
  answer: string
  timestamp: Date
}

interface ChatHistoryState {
  messages: ChatMessage[]
  addMessage: (question: string, answer: string) => void
  clearHistory: () => void
}

export const useChatHistory = create<ChatHistoryState>((set) => ({
  messages: [],
  addMessage: (question: string, answer: string) => set((state) => ({
    messages: [
      {
        id: Math.random().toString(36).substring(7),
        question,
        answer,
        timestamp: new Date(),
      },
      ...state.messages,
    ],
  })),
  clearHistory: () => set({ messages: [] }),
})) 