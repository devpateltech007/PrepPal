"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, Mic, FileText, Calendar, Brain, UserIcon, LogOut } from "lucide-react"
import { AudioRecorder } from "@/components/audio-recorder"
import { NotesManager } from "@/components/notes-manager"
import AuthWrapper from "@/components/auth-wrapper"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

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

function PrepPalContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Algorithms - Big O Notation",
      content:
        "Big O notation describes the performance or complexity of an algorithm. It specifically describes the worst-case scenario, and can be used to describe the execution time required or the space used by an algorithm. Common complexities include O(1), O(log n), O(n), O(n log n), O(n²), and O(2^n).",
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
      content:
        "Matrix multiplication is not commutative (AB ≠ BA in general). The identity matrix I has the property that AI = IA = A for any compatible matrix A. Matrix inverse A⁻¹ exists only for square matrices with non-zero determinant.",
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
      content:
        "Light exhibits both wave and particle properties depending on the experimental setup. The double-slit experiment demonstrates this duality clearly. When observed, photons behave as particles; when unobserved, they behave as waves creating interference patterns.",
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
  ])

  const [subjects] = useState<Subject[]>([
    { id: "cs", name: "Computer Science", color: "bg-blue-500", noteCount: 5 },
    { id: "math", name: "Mathematics", color: "bg-green-500", noteCount: 3 },
    { id: "physics", name: "Physics", color: "bg-purple-500", noteCount: 4 },
    { id: "chemistry", name: "Chemistry", color: "bg-orange-500", noteCount: 2 },
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PrepPal</h1>
                <p className="text-sm text-muted-foreground">Your personal classroom companion</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Beta
              </Badge>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{user.displayName || user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <UserIcon className="w-4 h-4 mr-2" />
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Record
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Study
            </TabsTrigger>
          </TabsList>

          <TabsContent value="record">
            <AudioRecorder />
          </TabsContent>

          <TabsContent value="notes">
            <NotesManager notes={notes} subjects={subjects} onNotesChange={setNotes} />
          </TabsContent>

          <TabsContent value="timeline">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Timeline component coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="study">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Study component coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function PrepPalApp() {
  return (
    <AuthWrapper>
      <PrepPalContent />
    </AuthWrapper>
  )
}
