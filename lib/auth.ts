import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from './firebase'
import { User, mapFirebaseUser } from './types'

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Update display name if provided
      if (displayName) {
        await updateProfile(firebaseUser, { displayName })
      }

      return mapFirebaseUser(firebaseUser)
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return mapFirebaseUser(userCredential.user)
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error('Failed to sign out')
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser
    return firebaseUser ? mapFirebaseUser(firebaseUser) : null
  }

  // Convert Firebase error codes to user-friendly messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection'
      default:
        return 'An error occurred. Please try again'
    }
  }
}
