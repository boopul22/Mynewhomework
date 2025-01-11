import { db } from '@/app/firebase/config'
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'

export interface Feedback {
  id: string
  userId: string
  userEmail: string
  rating: 'helpful' | 'not-helpful'
  comment: string
  createdAt: Timestamp
  questionId?: string
  question?: string
  answer?: string
}

export async function submitFeedback(data: Omit<Feedback, 'id' | 'createdAt'>) {
  try {
    console.log('Submitting feedback to Firestore:', data)
    const feedbackRef = collection(db, 'feedback')
    
    // Add timestamp
    const feedbackData = {
      ...data,
      createdAt: Timestamp.now()
    }

    const docRef = await addDoc(feedbackRef, feedbackData)
    console.log('Feedback submitted successfully with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error in submitFeedback:', error)
    throw error
  }
}

export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    console.log('Fetching all feedback')
    const feedbackRef = collection(db, 'feedback')
    const q = query(feedbackRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    const feedbackData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Feedback[]
    
    console.log(`Retrieved ${feedbackData.length} feedback items`)
    return feedbackData
  } catch (error) {
    console.error('Error in getAllFeedback:', error)
    throw error
  }
} 