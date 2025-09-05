import { auth } from './firebase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Enhanced interfaces to match our frontend needs
export interface TranscriptionSegment {
  id: string
  timestamp: number
  text: string
  confidence?: number
}

export interface Transcription {
  id: string
  title: string
  text: string
  duration: number
  segments: TranscriptionSegment[]
  summary?: string
  tags: string[]
  status: "processing" | "completed" | "error"
  created: string
  uid: string
  date: string // Formatted date for display
  audioUrl?: string
  updatedAt?: string
}

// Backend API response format
interface BackendTranscription {
  id: string
  text: string
  duration: number
  created: string
  uid: string
}

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }
  return await user.getIdToken()
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(errorData.detail || `HTTP ${response.status}`)
  }

  return response
}

// Convert backend transcription to frontend format
function transformTranscription(backendData: BackendTranscription): Transcription {
  // Parse segments from text (assuming they're stored as JSON or create mock segments)
  const segments: TranscriptionSegment[] = []
  const words = backendData.text.split(' ')
  let currentSegment = ''
  let segmentId = 1
  
  // Create segments of approximately 20 words each
  for (let i = 0; i < words.length; i += 20) {
    const segmentWords = words.slice(i, i + 20)
    segments.push({
      id: segmentId.toString(),
      timestamp: Math.floor((i / words.length) * backendData.duration),
      text: segmentWords.join(' '),
      confidence: 0.9 + Math.random() * 0.1 // Mock confidence
    })
    segmentId++
  }

  // Generate title from first few words
  const title = backendData.text.split(' ').slice(0, 6).join(' ') + '...'
  
  return {
    id: backendData.id,
    title,
    text: backendData.text,
    duration: backendData.duration,
    segments,
    summary: '', // Will be generated/added later
    tags: [], // Will be added later
    status: 'completed',
    created: backendData.created,
    uid: backendData.uid,
    date: new Date(backendData.created).toLocaleDateString(),
    updatedAt: backendData.created
  }
}

// API functions
export const transcriptionAPI = {
  // Get all transcriptions for the current user
  async getTranscriptions(): Promise<Transcription[]> {
    const response = await apiCall('/transcriptions')
    const backendData: BackendTranscription[] = await response.json()
    return backendData.map(transformTranscription)
  },

  // Get a specific transcription by ID
  async getTranscription(id: string): Promise<Transcription> {
    const response = await apiCall(`/transcriptions/${id}`)
    const backendData: BackendTranscription = await response.json()
    return transformTranscription(backendData)
  },

  // Create a new transcription
  async createTranscription(text: string, duration: number): Promise<Transcription> {
    const response = await apiCall('/transcriptions', {
      method: 'POST',
      body: JSON.stringify({ text, duration })
    })
    const backendData: BackendTranscription = await response.json()
    return transformTranscription(backendData)
  },

  // Update a transcription
  async updateTranscription(id: string, updates: { text?: string; duration?: number }): Promise<Transcription> {
    const response = await apiCall(`/transcriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
    const backendData: BackendTranscription = await response.json()
    return transformTranscription(backendData)
  },

  // Delete a transcription
  async deleteTranscription(id: string): Promise<void> {
    await apiCall(`/transcriptions/${id}`, {
      method: 'DELETE'
    })
  }
}

// Extended API for frontend-specific operations (stored locally or in separate endpoints)
export const transcriptionExtendedAPI = {
  // Update transcription metadata (title, summary, tags)
  async updateMetadata(id: string, metadata: { title?: string; summary?: string; tags?: string[] }): Promise<void> {
    // For now, store in localStorage - you can later move this to a separate API endpoint
    const key = `transcription_metadata_${id}`
    const existing = JSON.parse(localStorage.getItem(key) || '{}')
    const updated = { ...existing, ...metadata }
    localStorage.setItem(key, JSON.stringify(updated))
  },

  // Get transcription metadata
  async getMetadata(id: string): Promise<{ title?: string; summary?: string; tags?: string[] }> {
    const key = `transcription_metadata_${id}`
    return JSON.parse(localStorage.getItem(key) || '{}')
  }
}
