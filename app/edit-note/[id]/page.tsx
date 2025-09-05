"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useNotes } from "@/components/notes-provider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, X, Plus } from "lucide-react"
import AuthWrapper from "@/components/auth-wrapper"

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

function EditNoteContent() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string
  const { getNoteById, updateNote, subjects } = useNotes()

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  // const [newTag, setNewTag] = useState("")
  // const [newKeyPoint, setNewKeyPoint] = useState("")
  const [customSubject, setCustomSubject] = useState("")

  useEffect(() => {
    const foundNote = getNoteById(noteId)
    if (foundNote) {
      setNote({ ...foundNote })
    }
    setLoading(false)
  }, [noteId, getNoteById])

  const handleSave = () => {
    if (!note) return
    
    updateNote(noteId, note)
    router.push("/")
  }

  const handleCancel = () => {
    router.push("/")
  }

  // const addTag = () => {
  //   if (newTag.trim() && note && !note.tags.includes(newTag.trim())) {
  //     setNote({
  //       ...note,
  //       tags: [...note.tags, newTag.trim()]
  //     })
  //     setNewTag("")
  //   }
  // }

  // const removeTag = (tagToRemove: string) => {
  //   if (!note) return
  //   setNote({
  //     ...note,
  //     tags: note.tags.filter(tag => tag !== tagToRemove)
  //   })
  // }

  // const addKeyPoint = () => {
  //   if (newKeyPoint.trim() && note) {
  //     setNote({
  //       ...note,
  //       keyPoints: [...note.keyPoints, newKeyPoint.trim()]
  //     })
  //     setNewKeyPoint("")
  //   }
  // }

  // const removeKeyPoint = (index: number) => {
  //   if (!note) return
  //   setNote({
  //     ...note,
  //     keyPoints: note.keyPoints.filter((_, i) => i !== index)
  //   })
  // }

  // const updateKeyPoint = (index: number, value: string) => {
  //   if (!note) return
  //   const updatedKeyPoints = [...note.keyPoints]
  //   updatedKeyPoints[index] = value
  //   setNote({
  //     ...note,
  //     keyPoints: updatedKeyPoints
  //   })
  // }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Note not found</h1>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Note</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={note.title}
                  onChange={(e) => setNote({ ...note, title: e.target.value })}
                  placeholder="Enter note title"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <div className="flex gap-2">
                  <Select
                    value={note.subject}
                    onValueChange={(value) => {
                      setNote({ ...note, subject: value })
                      setCustomSubject("")
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or enter custom subject"
                    value={customSubject}
                    onChange={(e) => {
                      setCustomSubject(e.target.value)
                      if (e.target.value) {
                        setNote({ ...note, subject: e.target.value })
                      }
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  value={note.summary}
                  onChange={(e) => setNote({ ...note, summary: e.target.value })}
                  placeholder="Brief summary of the note"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={note.content}
                onChange={(e) => setNote({ ...note, content: e.target.value })}
                placeholder="Enter note content"
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a new tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {/* Key Points */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Key Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {note.keyPoints.map((point, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      placeholder="Key point"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeKeyPoint(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  placeholder="Add a new key point"
                  onKeyPress={(e) => e.key === 'Enter' && addKeyPoint()}
                />
                <Button onClick={addKeyPoint} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )
}

export default function EditNotePage() {
  return (
    <AuthWrapper>
      <EditNoteContent />
    </AuthWrapper>
  )
}
