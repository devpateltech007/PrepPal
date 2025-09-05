"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Play, Pause, Square, Copy, Download } from "lucide-react"

interface TranscriptionSegment {
  id: string
  text: string
  timestamp: number
  isFinal: boolean
}

interface AudioRecorderProps {
  onTranscriptionComplete?: (segments: TranscriptionSegment[]) => void
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording, isPaused])

  const setupSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        setIsTranscribing(true)
      }

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          const newSegment: TranscriptionSegment = {
            id: Date.now().toString(),
            text: finalTranscript.trim(),
            timestamp: recordingTime,
            isFinal: true,
          }
          setTranscriptionSegments((prev) => [...prev, newSegment])
          setCurrentTranscript("")
        } else {
          setCurrentTranscript(interimTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
      }

      recognitionRef.current.onend = () => {
        setIsTranscribing(false)
        if (isRecording && !isPaused) {
          recognitionRef.current?.start()
        }
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      source.connect(analyserRef.current)

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          requestAnimationFrame(updateAudioLevel)
        }
      }

      setIsRecording(true)
      setRecordingTime(0)
      setupSpeechRecognition()
      recognitionRef.current?.start()
      updateAudioLevel()
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      recognitionRef.current?.start()
    } else {
      recognitionRef.current?.stop()
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsPaused(false)
    recognitionRef.current?.stop()

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    onTranscriptionComplete?.(transcriptionSegments)
  }

  const copyTranscription = () => {
    const fullText = transcriptionSegments.map((segment) => segment.text).join(" ")
    navigator.clipboard.writeText(fullText)
  }

  const downloadTranscription = () => {
    const fullText = transcriptionSegments
      .map((segment) => `[${formatTime(segment.timestamp)}] ${segment.text}`)
      .join("\n")

    const blob = new Blob([fullText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lecture-transcript-${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lecture Recording</CardTitle>
          <CardDescription>Record your lecture and PrepPal will transcribe it automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-150"
                  style={{
                    transform: `scale(${1 + (audioLevel / 255) * 0.3})`,
                    backgroundColor: isRecording
                      ? `oklch(0.45 0.15 160 / ${0.1 + (audioLevel / 255) * 0.3})`
                      : undefined,
                  }}
                >
                  {isRecording ? (
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-primary-foreground" />
                    </div>
                  ) : (
                    <Mic className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              </div>
              {isRecording && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {isRecording && (
            <div className="text-center space-y-2">
              <div className="text-2xl font-mono font-bold text-primary">{formatTime(recordingTime)}</div>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {isPaused ? "Recording paused" : "Recording in progress..."}
                </p>
                {isTranscribing && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    Transcribing
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} size="lg" className="bg-primary hover:bg-primary/90">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button onClick={togglePause} variant="outline" size="lg">
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg">
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(isRecording || transcriptionSegments.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Transcription</CardTitle>
                <CardDescription>Real-time speech-to-text conversion</CardDescription>
              </div>
              {transcriptionSegments.length > 0 && (
                <div className="flex gap-2">
                  <Button onClick={copyTranscription} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={downloadTranscription} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full border rounded-lg p-4">
              <div className="space-y-3">
                {transcriptionSegments.map((segment) => (
                  <div key={segment.id} className="flex gap-3">
                    <Badge variant="outline" className="text-xs shrink-0 mt-1">
                      {formatTime(segment.timestamp)}
                    </Badge>
                    <p className="text-sm leading-relaxed text-foreground">{segment.text}</p>
                  </div>
                ))}
                {currentTranscript && (
                  <div className="flex gap-3">
                    <Badge variant="outline" className="text-xs shrink-0 mt-1 bg-accent/10">
                      {formatTime(recordingTime)}
                    </Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground italic">{currentTranscript}</p>
                  </div>
                )}
                {transcriptionSegments.length === 0 && !currentTranscript && (
                  <p className="text-muted-foreground text-center py-8">Start speaking to see live transcription...</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Recordings</CardTitle>
          <CardDescription>Your latest lecture recordings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: "Computer Science 101 - Algorithms", date: "Today, 2:30 PM", duration: "45:23" },
              { title: "Mathematics - Linear Algebra", date: "Yesterday, 10:00 AM", duration: "52:15" },
              { title: "Physics - Quantum Mechanics", date: "Dec 3, 3:15 PM", duration: "38:42" },
            ].map((recording, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground">{recording.title}</h4>
                  <p className="text-sm text-muted-foreground">{recording.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-foreground">{recording.duration}</p>
                  <Badge variant="secondary" className="text-xs">
                    Transcribed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
