'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, BookOpen, Users, Calendar, FileText, CheckCircle, PenTool, List, Clock, Plus, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import SubscriptionStatus from './subscription-status'
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { createUserProfile } from '@/lib/user-service'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

interface HistoryItem {
  id: string
  title: string
  timestamp: Date
  question: string
  answer: string
  chatId: string
  category?: 'today' | 'yesterday' | 'previous7Days' | 'previous30Days'
}

interface HistorySliderProps {
  onSelectChat: (question: string, answer: string, chatId: string) => void
  startNewChat: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function HistorySlider({ onSelectChat, startNewChat, isOpen, setIsOpen }: HistorySliderProps) {
  const { messages, isLoading, error } = useChatHistory()
  const { user } = useAuth()
  const router = useRouter()

  const navigationItems = [
    { icon: <MessageSquare className="h-4 w-4" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <BookOpen className="h-4 w-4" />, label: 'Lesson', href: '/lesson' },
    { icon: <Users className="h-4 w-4" />, label: 'Teachers', href: '/teachers' },
    { icon: <Calendar className="h-4 w-4" />, label: 'Timetable', href: '/timetable' },
    { icon: <FileText className="h-4 w-4" />, label: 'Lecture Notes', href: '/notes' },
  ]

  const careerItems = [
    { icon: <CheckCircle className="h-4 w-4" />, label: 'Succeeded' },
    { icon: <PenTool className="h-4 w-4" />, label: 'Working on' },
    { icon: <List className="h-4 w-4" />, label: 'Destination list' },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const { uid, email, displayName, photoURL } = result.user;
        
        if (!email) {
          throw new Error('No email provided from Google Auth');
        }
        
        try {
          // Create user profile
          await createUserProfile(uid, {
            uid,
            email,
            displayName: displayName || email.split('@')[0],
            photoURL: photoURL || '',
          });
          
          router.push('/');
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          alert('Failed to create user profile. Please try again.');
          // Sign out the user if profile creation fails
          await auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Please enable popups for this site to sign in with Google.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      alert(errorMessage);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let category: string
    if (date >= today) {
      category = 'Today'
    } else if (date >= yesterday) {
      category = 'Yesterday'
    } else if (date >= new Date(today.setDate(today.getDate() - 7))) {
      category = 'Previous 7 Days'
    } else {
      category = 'Previous 30 Days'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(msg)
    return acc
  }, {} as Record<string, typeof messages>)

  return (
    <>
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-[300px] sm:w-[350px] bg-background/95 backdrop-blur-sm border-r border-border z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 bg-background border border-border shadow-sm rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="sr-only">{isOpen ? 'Close' : 'Open'} sidebar</span>
        </Button>

        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <div className="flex items-center gap-3 mt-3 text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm overflow-hidden">
                {user?.photoURL ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.photoURL} 
                      alt={user.displayName || 'Profile'} 
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-user.jpg';
                      }}
                    />
                    <AvatarFallback>
                      {user.displayName ? user.displayName[0].toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <span className="font-medium">{user?.displayName || 'Student'}</span>
            </div>
            {user && (
              <Button
                onClick={startNewChat}
                className="flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full mt-3 shadow-sm hover:shadow backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                Ask one more
              </Button>
            )}
          </div>

          {/* Main Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Navigation Items */}
            <div className="py-5">
              <div className="space-y-1.5 px-4">
                {navigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.href)}
                    className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium"
                  >
                    <span className="text-primary/90">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Career Goals Section */}
            <div className="py-5 border-t border-border">
              <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Career goals</h2>
              <div className="space-y-1.5 px-4">
                {careerItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium"
                  >
                    <span className="text-primary/90">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription Status */}
            <div className="py-5 border-t border-border">
              <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Subscription</h2>
              <div className="px-4">
                <SubscriptionStatus />
              </div>
            </div>

            {/* Chat History Section */}
            {Object.entries(groupedMessages).map(([category, msgs]) => (
              <div key={category} className="py-5 border-t border-border">
                <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">{category}</h2>
                <div className="space-y-1.5 px-4">
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => onSelectChat(msg.question, msg.answer, msg.chatId)}
                      className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium text-left"
                    >
                      <span className="text-primary/90">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="truncate">{msg.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
} 