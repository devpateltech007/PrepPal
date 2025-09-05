import { useState, useEffect, createContext, useContext } from 'react'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthService } from '@/lib/auth'
import { User, AuthContextType, mapFirebaseUser } from '@/lib/types'

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export the context and a function to create the provider
export { AuthContext }

// Auth hook for managing authentication state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signIn(email, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signUp(email, password, displayName)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    setLoading(true)
    try {
      await AuthService.signOut()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    await AuthService.resetPassword(email)
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
