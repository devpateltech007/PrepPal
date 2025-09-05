"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface Note {
  id: string
  title: string
  content: string
  subject: string
  tags: string[]
  date: string
  isStarred: boolean
  keyPoints: string[]
  summary: string
  source: "recording" | "manual"
  recordingId?: string
}

interface Subject {
  id: string
  name: string
  color: string
  noteCount: number
}

interface NotesContextType {
  notes: Note[]
  subjects: Subject[]
  updateNote: (noteId: string, updatedNote: Partial<Note>) => void
  addNote: (note: Note) => void
  deleteNote: (noteId: string) => void
  toggleStarNote: (noteId: string) => void
  getNoteById: (noteId: string) => Note | undefined
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

const initialNotes: Note[] = [
  {
    id: "1",
    title: "Algorithms - Big O Notation",
    content: "Big O notation describes the performance or complexity of an algorithm. It specifically describes the worst-case scenario, and can be used to describe the execution time required or the space used by an algorithm. Common complexities include O(1), O(log n), O(n), O(n log n), O(n²), and O(2^n).",
    subject: "Computer Science",
    tags: ["algorithms", "complexity", "big-o"],
    date: "2024-12-05",
    isStarred: true,
    keyPoints: [
      "Big O describes worst-case performance",
      "Common complexities: O(1), O(log n), O(n), O(n²)",
      "Used for both time and space complexity",
    ],
    summary: "Introduction to Big O notation and algorithm complexity analysis",
    source: "recording",
    recordingId: "rec-1",
  },
  {
    id: "2",
    title: "Linear Algebra - Matrix Operations",
    content: "Matrix multiplication is not commutative (AB ≠ BA in general). The identity matrix I has the property that AI = IA = A for any compatible matrix A. Matrix inverse A⁻¹ exists only for square matrices with non-zero determinant.",
    subject: "Mathematics",
    tags: ["matrices", "linear-algebra", "operations"],
    date: "2024-12-04",
    isStarred: false,
    keyPoints: [
      "Matrix multiplication is not commutative",
      "Identity matrix: AI = IA = A",
      "Inverse exists for non-singular square matrices",
    ],
    summary: "Fundamental properties of matrix operations and inverses",
    source: "recording",
    recordingId: "rec-2",
  },
  {
    id: "3",
    title: "Quantum Mechanics - Wave-Particle Duality",
    content: "Light exhibits both wave and particle properties depending on the experimental setup. The double-slit experiment demonstrates this duality clearly. When observed, photons behave as particles; when unobserved, they behave as waves creating interference patterns.",
    subject: "Physics",
    tags: ["quantum", "wave-particle", "duality"],
    date: "2024-12-03",
    isStarred: true,
    keyPoints: [
      "Light has both wave and particle properties",
      "Double-slit experiment demonstrates duality",
      "Observation affects behavior",
    ],
    summary: "Understanding wave-particle duality in quantum mechanics",
    source: "recording",
    recordingId: "rec-3",
  },
]

const initialSubjects: Subject[] = [
  { id: "cs", name: "Computer Science", color: "bg-blue-500", noteCount: 5 },
  { id: "math", name: "Mathematics", color: "bg-green-500", noteCount: 3 },
  { id: "physics", name: "Physics", color: "bg-purple-500", noteCount: 4 },
  { id: "chemistry", name: "Chemistry", color: "bg-orange-500", noteCount: 2 },
]

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [subjects] = useState<Subject[]>(initialSubjects)

  const updateNote = (noteId: string, updatedNote: Partial<Note>) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, ...updatedNote } : note
      )
    )
  }

  const addNote = (note: Note) => {
    setNotes(prevNotes => [note, ...prevNotes])
  }

  const deleteNote = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
  }

  const toggleStarNote = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, isStarred: !note.isStarred } : note
      )
    )
  }

  const getNoteById = (noteId: string) => {
    return notes.find(note => note.id === noteId)
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        subjects,
        updateNote,
        addNote,
        deleteNote,
        toggleStarNote,
        getNoteById,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}
