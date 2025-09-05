"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Play, Pause, Download, Copy, Save, Edit3, Clock, Calendar, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { transcriptionAPI, transcriptionExtendedAPI, Transcription, TranscriptionSegment } from "@/lib/api"

export default function TranscriptionDetailPage() {
  return (
    <div className="min-h-screen bg-background">
      <TranscriptionDetailContent />
    </div>
  )
}

function TranscriptionDetailContent() {
  const router = useRouter()
  const params = useParams()
  const transcriptionId = params.id as string

  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedSummary, setEditedSummary] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Load transcription data from API
  useEffect(() => {
    const loadTranscription = async () => {
      try {
        setLoading(true)
        
        // Fetch transcription from API
        const transcriptionData = await transcriptionAPI.getTranscription(transcriptionId)
        
        // Fetch metadata (title, summary, tags) from extended API
        const metadata = await transcriptionExtendedAPI.getMetadata(transcriptionId)
        
        // Merge API data with metadata
        const fullTranscription: Transcription = {
          ...transcriptionData,
          title: metadata.title || transcriptionData.title,
          summary: metadata.summary || transcriptionData.summary || "",
          tags: metadata.tags || transcriptionData.tags || []
        }
        
        setTranscription(fullTranscription)
        setEditedTitle(fullTranscription.title)
        setEditedSummary(fullTranscription.summary || "")
        
      } catch (error) {
        console.error('Failed to load transcription:', error)
        toast({
          title: "Error loading transcription",
          description: error instanceof Error ? error.message : "Failed to load transcription data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadTranscription()
  }, [transcriptionId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleSave = async () => {
    if (!transcription) return
    
    try {
      // Save metadata (title, summary, tags) to extended API
      await transcriptionExtendedAPI.updateMetadata(transcription.id, {
        title: editedTitle,
        summary: editedSummary,
        tags: transcription.tags
      })
      
      // Update local state
      const updatedTranscription = {
        ...transcription,
        title: editedTitle,
        summary: editedSummary,
        updatedAt: new Date().toISOString()
      }
      
      setTranscription(updatedTranscription)
      setIsEditing(false)
      toast({
        title: "Transcription updated",
        description: "Your changes have been saved successfully."
      })
    } catch (error) {
      console.error('Failed to save transcription:', error)
      toast({
        title: "Error saving changes",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive"
      })
    }
  }

  const handleCancel = () => {
    if (!transcription) return
    setEditedTitle(transcription.title)
    setEditedSummary(transcription.summary || "")
    setIsEditing(false)
  }

  const addTag = async () => {
    if (!newTag.trim() || !transcription) return
    
    const updatedTags = [...transcription.tags, newTag.trim()]
    
    try {
      // Save tags to extended API
      await transcriptionExtendedAPI.updateMetadata(transcription.id, {
        tags: updatedTags
      })
      
      const updatedTranscription = {
        ...transcription,
        tags: updatedTags
      }
      
      setTranscription(updatedTranscription)
      setNewTag("")
    } catch (error) {
      console.error('Failed to add tag:', error)
      toast({
        title: "Error adding tag",
        description: "Failed to save tag",
        variant: "destructive"
      })
    }
  }

  const removeTag = async (tagToRemove: string) => {
    if (!transcription) return
    
    const updatedTags = transcription.tags.filter(tag => tag !== tagToRemove)
    
    try {
      // Save tags to extended API
      await transcriptionExtendedAPI.updateMetadata(transcription.id, {
        tags: updatedTags
      })
      
      const updatedTranscription = {
        ...transcription,
        tags: updatedTags
      }
      
      setTranscription(updatedTranscription)
    } catch (error) {
      console.error('Failed to remove tag:', error)
      toast({
        title: "Error removing tag",
        description: "Failed to remove tag",
        variant: "destructive"
      })
    }
  }

  const copyTranscription = () => {
    if (!transcription) return
    
    const fullText = transcription.segments.map(segment => segment.text).join(' ')
    navigator.clipboard.writeText(fullText)
    toast({
      title: "Copied to clipboard",
      description: "Full transcription text has been copied."
    })
  }

  const downloadTranscription = () => {
    if (!transcription) return
    
    const content = `Title: ${transcription.title}\nDate: ${transcription.date}\nDuration: ${formatDuration(transcription.duration)}\n\nTranscription:\n\n${transcription.segments.map(segment => `[${formatTime(segment.timestamp)}] ${segment.text}`).join('\n\n')}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcription.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Download started",
      description: "Transcription file is being downloaded."
    })
  }

  const jumpToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp)
    // Here you would implement actual audio seeking if audio player is integrated
    toast({
      title: "Jumped to timestamp",
      description: `Moved to ${formatTime(timestamp)}`
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading transcription...</div>
      </div>
    )
  }

  if (!transcription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Transcription not found</h2>
          <p className="text-muted-foreground mb-4">The requested transcription could not be found.</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transcription Details</h1>
            <p className="text-muted-foreground">View and manage your transcription</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyTranscription}>
            <Copy className="w-4 h-4 mr-2" />
            Copy All
          </Button>
          <Button variant="outline" onClick={downloadTranscription}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcription Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full border rounded-lg p-4">
                <div className="space-y-4">
                  {transcription.segments.map((segment) => (
                    <div key={segment.id} className="group">
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-auto p-1 opacity-60 group-hover:opacity-100"
                          onClick={() => jumpToTimestamp(segment.timestamp)}
                        >
                          <Badge variant="outline" className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground">
                            {formatTime(segment.timestamp)}
                          </Badge>
                        </Button>
                        <p className="text-sm leading-relaxed text-foreground flex-1">{segment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                {isEditing ? (
                  <Input
                    id="title"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter transcription title"
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{transcription.title}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(transcription.date).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatDuration(transcription.duration)}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={transcription.status === 'completed' ? 'default' : transcription.status === 'processing' ? 'secondary' : 'destructive'}>
                  {transcription.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  placeholder="Enter a summary of this transcription"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {transcription.summary || "No summary available"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {transcription.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
