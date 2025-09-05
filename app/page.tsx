"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, Mic, FileText, Calendar, Brain, UserIcon, LogOut } from "lucide-react"
import AudioRecorder from "@/components/audio-recorder"
import { NotesManager } from "@/components/notes-manager"
import AuthWrapper from "@/components/auth-wrapper"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useNotes } from "@/components/notes-provider"

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
  source: "transcription" | "manual"
  transcriptionId?: string
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
  const { notes, subjects } = useNotes()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Failed to logout:", error)
    }
  }

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
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Logout
              </Button>

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
              Transcribe
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
            <NotesManager notes={notes} subjects={subjects} onNotesChange={() => {}} />
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
