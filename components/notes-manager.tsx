"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotes } from "@/components/notes-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Plus, Edit3, Copy, Tag, Star, Clock, FileText } from "lucide-react"

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

interface NotesManagerProps {
  notes: Note[]
  subjects: Subject[]
  onNotesChange: (notes: Note[]) => void
}

export function NotesManager({ notes, subjects, onNotesChange }: NotesManagerProps) {
  const router = useRouter()
  const { toggleStarNote, addNote } = useNotes()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    subject: "",
    tags: "",
  })

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSubject = selectedSubject === "all" || note.subject === selectedSubject
    const matchesStarred = !showStarredOnly || note.isStarred

    return matchesSearch && matchesSubject && matchesStarred
  })


  const addNewNote = () => {
    if (newNote.title && newNote.content) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        subject: newNote.subject || "General",
        tags: newNote.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        date: new Date().toISOString().split("T")[0],
        isStarred: false,
        keyPoints: [],
        summary: newNote.content.substring(0, 100) + "...",
        source: "manual",
      }

      addNote(note)
      setNewNote({ title: "", content: "", subject: "", tags: "" })
      setIsAddingNote(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notes, tags, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showStarredOnly ? "default" : "outline"}
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className="w-full sm:w-auto"
            >
              <Star className="w-4 h-4 mr-2" />
              Starred
            </Button>
            <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                  <DialogDescription>Create a new note manually</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title"
                    value={newNote.title}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <Select
                    value={newNote.subject}
                    onValueChange={(value) => setNewNote((prev) => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Note content"
                    value={newNote.content}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                    rows={6}
                  />
                  <Input
                    placeholder="Tags (comma-separated)"
                    value={newNote.tags}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addNewNote}>Add Note</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Subject Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                <div>
                  <p className="font-medium text-sm">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">{subject.noteCount} notes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedSubject !== "all" || showStarredOnly
                    ? "No notes match your current filters"
                    : "No notes yet. Start transcribing lectures or add notes manually."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => toggleStarNote(note.id)} className="p-1 h-auto">
                        <Star
                          className={`w-4 h-4 ${note.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${subjects.find((s) => s.name === note.subject)?.color || "bg-gray-400"}`}
                        />
                        {note.subject}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {note.date}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {note.source === "transcription" ? "From Transcription" : "Manual"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{note.summary}</p>

                {note.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Points:</h4>
                    <ul className="space-y-1">
                      {note.keyPoints.map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1 h-1 bg-primary rounded-full mt-2 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/edit-note/${note.id}`)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
