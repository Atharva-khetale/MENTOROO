"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useChat } from "@ai-sdk/react"
import { useTheme } from "next-themes"
import {
  BookOpen,
  Clock,
  MessageSquare,
  TrendingUp,
  Play,
  Square,
  RotateCcw,
  Download,
  Sun,
  Moon,
  Camera,
  Calendar,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bell,
  ImageIcon,
  X,
  Rocket,
  Palette,
} from "lucide-react"
import { generatePDF } from "@/lib/pdf-generator"
import { TimetableManager } from "@/components/timetable-manager"
import { NotificationManager } from "@/components/notification-manager"

interface StudySession {
  date: string
  duration: number
  timestamp: string
}

interface Analytics {
  totalSessions: number
  totalTime: number
  questionsAsked: number
  subjectsStudied: Record<string, number>
  recentSessions: StudySession[]
  averageSessionTime: number
}

const MOTIVATIONAL_QUOTES = [
  "🚀 Like a rocket breaking through Earth's atmosphere, break through your limits in NEET preparation!",
  "⭐ Every star in the universe started as cosmic dust. Every NEET topper started where you are now.",
  "🌌 The universe is vast and full of possibilities, just like your potential in medicine!",
  "🔬 Science is not just a subject, it's the key to unlocking the mysteries of life itself.",
  "🧬 DNA carries the blueprint of life. Let knowledge carry the blueprint of your success!",
  "⚛️ Like atoms forming molecules, let your efforts combine to create something extraordinary.",
  "🌟 You are made of star stuff. Channel that cosmic energy into your studies!",
  "🔭 Galileo looked through a telescope and changed the world. Look through your textbooks and change your future!",
  "🌍 From the smallest cell to the largest galaxy, everything follows scientific principles. Master them!",
  "🧪 Every great discovery started with curiosity. Stay curious, stay motivated!",
]

const SPACE_SCIENCE_QUOTES = [
  "🚀 Houston, we have a problem... and we're going to solve it with science!",
  "⭐ In the cosmic scale of things, your NEET preparation is a supernova waiting to happen!",
  "🌌 The Milky Way has billions of stars, but you only need one dream to guide you to success!",
  "🔬 Marie Curie discovered radium in a shed. You can discover your potential anywhere!",
  "🧬 Watson and Crick unlocked the secret of DNA. Unlock your potential with dedication!",
]

export default function NEETStudyBot() {
  const [currentQuote, setCurrentQuote] = useState("")
  const [isStudySessionActive, setIsStudySessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [analytics, setAnalytics] = useState<Analytics>({
    totalSessions: 0,
    totalTime: 0,
    questionsAsked: 0,
    subjectsStudied: {},
    recentSessions: [],
    averageSessionTime: 0,
  })
  const [showTimetable, setShowTimetable] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [currentThemeStyle, setCurrentThemeStyle] = useState<"default" | "space">("default")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  const { theme, setTheme } = useTheme()

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
      showNotification("Chat Error", "Failed to get response. Please try again.", "error")
    },
    onFinish: (message) => {
      setAnalytics((prev) => ({
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
      }))

      // Auto-speak the response if voice is enabled
      if (localStorage.getItem("voice-enabled") === "true") {
        speakText(message.content)
      }
    },
  })

  // Initialize notification sound
  useEffect(() => {
    // Create notification sound using Web Audio API
    const createNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const playNotificationSound = () => {
        // Create a pleasant notification sound
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }

      return playNotificationSound
    }

    if (typeof window !== "undefined") {
      const playSound = createNotificationSound()
      ;(window as any).playNotificationSound = playSound
    }
  }, [])

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAnalytics = localStorage.getItem("neet-analytics")
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics))
    }

    const savedThemeStyle = localStorage.getItem("theme-style")
    if (savedThemeStyle) {
      setCurrentThemeStyle(savedThemeStyle as "default" | "space")
    }

    const savedQuote = localStorage.getItem("daily-quote")
    const today = new Date().toDateString()
    const quoteDate = localStorage.getItem("quote-date")

    if (quoteDate !== today) {
      const quotes = currentThemeStyle === "space" ? SPACE_SCIENCE_QUOTES : MOTIVATIONAL_QUOTES
      const newQuote = quotes[Math.floor(Math.random() * quotes.length)]
      setCurrentQuote(newQuote)
      localStorage.setItem("daily-quote", newQuote)
      localStorage.setItem("quote-date", today)
    } else if (savedQuote) {
      setCurrentQuote(savedQuote)
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    // Request wake lock permission for alarms
    if ("wakeLock" in navigator) {
      console.log("Wake Lock API supported")
    }
  }, [currentThemeStyle])

  // Save analytics to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("neet-analytics", JSON.stringify(analytics))
  }, [analytics])

  // Update session duration every second when active
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStudySessionActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(duration)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStudySessionActive, sessionStartTime])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const playNotificationSound = () => {
    try {
      if ((window as any).playNotificationSound) {
        ;(window as any).playNotificationSound()
      }
    } catch (error) {
      console.log("Could not play notification sound:", error)
    }
  }

  const showNotification = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    // Play notification sound
    playNotificationSound()

    // Vibrate if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200])
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "mentoro-notification",
        requireInteraction: type === "error",
      })
    }

    // Also show in-app notification
    const notification = document.createElement("div")
    const themeClass = currentThemeStyle === "space" ? "space-notification" : "clay-card"
    notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm ${themeClass} border backdrop-blur-sm transition-all duration-300 animate-slide-in`

    const iconMap = {
      success: "🚀",
      error: "⚠️",
      info: "🔬",
    }

    notification.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${iconMap[type]}</span>
        <div class="font-semibold text-foreground">${title}</div>
      </div>
      <div class="text-sm text-muted-foreground">${message}</div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.opacity = "0"
      notification.style.transform = "translateX(100%)"
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }

  const toggleThemeStyle = () => {
    const newStyle = currentThemeStyle === "default" ? "space" : "default"
    setCurrentThemeStyle(newStyle)
    localStorage.setItem("theme-style", newStyle)

    // Update quote based on theme
    const quotes = newStyle === "space" ? SPACE_SCIENCE_QUOTES : MOTIVATIONAL_QUOTES
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setCurrentQuote(newQuote)
    localStorage.setItem("daily-quote", newQuote)

    showNotification(
      "Theme Changed",
      `Switched to ${newStyle === "space" ? "Space & Science" : "Default"} theme!`,
      "success",
    )
  }

  const schedulePhoneAlarm = async (time: string, title: string) => {
    try {
      // Try to use the device's calendar/alarm APIs if available
      if ("calendar" in navigator) {
        // This is a hypothetical API - actual implementation would depend on device capabilities
        console.log("Calendar API available")
      }

      // For now, we'll use a combination of notifications, wake lock, and local scheduling
      const [hours, minutes] = time.split(":").map(Number)
      const now = new Date()
      const alarmTime = new Date()
      alarmTime.setHours(hours, minutes, 0, 0)

      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1)
      }

      const timeUntilAlarm = alarmTime.getTime() - now.getTime()

      // Request wake lock to keep the app active
      if ("wakeLock" in navigator) {
        try {
          const wakeLock = await (navigator as any).wakeLock.request("screen")
          console.log("Wake lock acquired")
        } catch (err) {
          console.log("Wake lock failed:", err)
        }
      }

      setTimeout(() => {
        // Play alarm sound
        playAlarmSound()

        // Show persistent notification
        showNotification(`🚨 ${title}`, "Time for your scheduled study session!", "info")

        // Vibrate pattern for alarm
        if ("vibrate" in navigator) {
          navigator.vibrate([1000, 500, 1000, 500, 1000])
        }
      }, timeUntilAlarm)

      showNotification("Alarm Set", `Alarm scheduled for ${time} - ${title}`, "success")
    } catch (error) {
      console.error("Error setting alarm:", error)
      showNotification("Alarm Error", "Could not set device alarm. Using app notifications instead.", "error")
    }
  }

  const playAlarmSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create a more prominent alarm sound
      const playAlarm = () => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)

            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.5)
          }, i * 600)
        }
      }

      playAlarm()
    } catch (error) {
      console.log("Could not play alarm sound:", error)
    }
  }

  const startStudySession = () => {
    const now = new Date()
    setSessionStartTime(now)
    setIsStudySessionActive(true)
    setSessionDuration(0)
    showNotification("Study Session Started", "Focus mode activated! Good luck with your studies.", "success")
  }

  const endStudySession = () => {
    if (sessionStartTime) {
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000)

      const newSession: StudySession = {
        date: endTime.toISOString().split("T")[0],
        duration,
        timestamp: endTime.toISOString(),
      }

      setAnalytics((prev) => ({
        ...prev,
        totalSessions: prev.totalSessions + 1,
        totalTime: prev.totalTime + duration,
        recentSessions: [...prev.recentSessions, newSession].slice(-10),
        averageSessionTime: Math.floor((prev.totalTime + duration) / (prev.totalSessions + 1)),
      }))

      showNotification("Study Session Completed", `Great job! You studied for ${formatTime(duration)}.`, "success")
    }

    setIsStudySessionActive(false)
    setSessionStartTime(null)
    setSessionDuration(0)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getNewQuote = () => {
    const quotes = currentThemeStyle === "space" ? SPACE_SCIENCE_QUOTES : MOTIVATIONAL_QUOTES
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setCurrentQuote(newQuote)
    localStorage.setItem("daily-quote", newQuote)
  }

  const detectSubject = (message: string) => {
    const subjects = {
      physics: ["physics", "force", "motion", "energy", "wave", "electricity", "magnetism", "thermodynamics", "optics"],
      chemistry: [
        "chemistry",
        "organic",
        "inorganic",
        "physical",
        "reaction",
        "molecule",
        "atom",
        "bond",
        "acid",
        "base",
      ],
      biology: [
        "biology",
        "cell",
        "genetics",
        "evolution",
        "anatomy",
        "physiology",
        "botany",
        "zoology",
        "dna",
        "protein",
      ],
    }

    const lowerMessage = message.toLowerCase()
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return subject
      }
    }
    return "general"
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await processVoiceInput(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      showNotification("Voice Recording", "Listening... Speak your question now.", "info")
    } catch (error) {
      console.error("Error starting voice recording:", error)
      showNotification("Voice Error", "Could not access microphone. Please check permissions.", "error")
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // For demo purposes, we'll use Web Speech API for speech-to-text
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        handleInputChange({ target: { value: transcript } } as any)
        showNotification("Voice Recognized", `Heard: "${transcript}"`, "success")
      }

      recognition.onerror = () => {
        showNotification("Voice Error", "Could not recognize speech. Please try again.", "error")
      }

      recognition.start()
    } catch (error) {
      console.error("Error processing voice input:", error)
      showNotification("Voice Error", "Speech recognition not supported in this browser.", "error")
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => {
        setIsSpeaking(false)
        showNotification("Voice Error", "Could not speak the response.", "error")
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (selectedImage && input.trim()) {
      // Handle image + text submission
      const formData = new FormData()
      formData.append("image", selectedImage)
      formData.append("question", input)

      try {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const analysis = await response.text()

          // Add user message with image to chat
          await append({
            role: "user",
            content: `[Image uploaded] ${input}`,
          })

          // Add AI response
          await append({
            role: "assistant",
            content: analysis,
          })

          // Update analytics
          const subject = detectSubject(input)
          setAnalytics((prev) => ({
            ...prev,
            questionsAsked: prev.questionsAsked + 1,
            subjectsStudied: {
              ...prev.subjectsStudied,
              [subject]: (prev.subjectsStudied[subject] || 0) + 1,
            },
          }))

          // Clear form
          handleInputChange({ target: { value: "" } } as any)
          removeImage()

          showNotification("Image Analyzed", "AI has analyzed your image and provided a response.", "success")
        } else {
          showNotification("Analysis Error", "Failed to analyze image. Please try again.", "error")
        }
      } catch (error) {
        console.error("Error analyzing image:", error)
        showNotification("Analysis Error", "Failed to analyze image. Please try again.", "error")
      }
    } else if (input.trim()) {
      // Handle regular text submission
      const subject = detectSubject(input)
      setAnalytics((prev) => ({
        ...prev,
        subjectsStudied: {
          ...prev.subjectsStudied,
          [subject]: (prev.subjectsStudied[subject] || 0) + 1,
        },
      }))
      handleSubmit(e)
    }
  }

  const downloadChatPDF = async () => {
    if (messages.length === 0) {
      showNotification("PDF Export", "No chat history to download!", "error")
      return
    }

    try {
      await generatePDF(messages, analytics)
      showNotification("PDF Export", "Chat history downloaded successfully!", "success")
    } catch (error) {
      console.error("Error generating PDF:", error)
      showNotification("PDF Export", "Error generating PDF. Please try again.", "error")
    }
  }

  const containerClass =
    currentThemeStyle === "space"
      ? "min-h-screen space-theme p-4 transition-all duration-500"
      : "min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 transition-all duration-300"

  const cardClass = currentThemeStyle === "space" ? "space-card" : "clay-card"

  return (
    <div className={containerClass}>
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleThemeStyle}
                className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
                title="Toggle theme style"
              >
                {currentThemeStyle === "space" ? (
                  <Palette className="h-4 w-4 mr-2" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                {currentThemeStyle === "space" ? "Default" : "Space"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-600" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTimetable(true)}
                className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Timetable
              </Button>
            </div>
          </div>
          <h1
            className={`text-5xl font-bold mb-2 ${
              currentThemeStyle === "space"
                ? "space-title"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            }`}
          >
            {currentThemeStyle === "space" ? "🚀 MENTORO 🔬" : "MENTORO"}
          </h1>
          <p
            className={`text-lg ${
              currentThemeStyle === "space" ? "space-subtitle" : "text-indigo-600 dark:text-indigo-300"
            }`}
          >
            {currentThemeStyle === "space"
              ? "🌌 Your Cosmic Study Companion - Exploring the Universe of Knowledge! 🧬"
              : "Your AI-powered study Mentor with voice & vision"}
          </p>
        </header>

        {currentQuote && (
          <div
            className={`mb-8 ${
              currentThemeStyle === "space"
                ? "space-quote-card"
                : "clay-card bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <p className="text-lg italic flex-1">{currentQuote}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getNewQuote}
                  className={`ml-4 ${
                    currentThemeStyle === "space" ? "text-white hover:bg-white/20" : "text-white hover:bg-white/20"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Study Session Control */}
          <div className={cardClass}>
            <div className="p-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5" />
                Study Session
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${
                      currentThemeStyle === "space" ? "space-timer" : "text-indigo-600 dark:text-indigo-400"
                    }`}
                  >
                    {formatTime(sessionDuration)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Session</p>
                </div>

                {!isStudySessionActive ? (
                  <Button
                    onClick={startStudySession}
                    className={`w-full ${
                      currentThemeStyle === "space" ? "space-button-primary" : "clay-button-primary"
                    }`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Study Session
                  </Button>
                ) : (
                  <Button
                    onClick={endStudySession}
                    className={`w-full ${currentThemeStyle === "space" ? "space-button-danger" : "clay-button-danger"}`}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className={`${cardClass} lg:col-span-2`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Tutor Chat
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadChatPDF}
                    disabled={messages.length === 0}
                    className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isSpeaking ? stopSpeaking : () => {}}
                    className={currentThemeStyle === "space" ? "space-button" : "clay-button"}
                  >
                    {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              <div
                className={`h-96 overflow-y-auto mb-4 p-4 rounded-xl ${
                  currentThemeStyle === "space" ? "space-inset" : "clay-inset"
                }`}
              >
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="text-red-800 dark:text-red-200 text-sm">
                      <strong>Error:</strong> {error.message}
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Start by asking a question!</p>
                    <p className="text-sm">Try voice input, upload images, or type your NEET questions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            message.role === "user"
                              ? currentThemeStyle === "space"
                                ? "space-user-message"
                                : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white clay-elevated"
                              : currentThemeStyle === "space"
                                ? "space-ai-message"
                                : "clay-card"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {message.role === "assistant" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speakText(message.content)}
                              className="mt-2 opacity-70 hover:opacity-100"
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div
                          className={`p-4 rounded-2xl ${
                            currentThemeStyle === "space" ? "space-ai-message" : "clay-card"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className={`mb-4 p-3 rounded-xl ${currentThemeStyle === "space" ? "space-card" : "clay-card"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Image attached
                    </span>
                    <Button variant="ghost" size="sm" onClick={removeImage}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-full max-h-32 rounded-lg object-cover"
                  />
                </div>
              )}

              <form onSubmit={onSubmit} className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about Physics, Chemistry, or Biology..."
                    disabled={isLoading}
                    className={`pr-12 ${currentThemeStyle === "space" ? "space-input" : "clay-input"}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedImage)}
                  className={currentThemeStyle === "space" ? "space-button-primary" : "clay-button-primary"}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className={`${cardClass} mt-8`}>
          <div className="p-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5" />
              Study Analytics
            </h3>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList
                className={`grid w-full grid-cols-2 ${currentThemeStyle === "space" ? "space-tabs" : "clay-tabs"}`}
              >
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className={`text-center p-6 ${
                      currentThemeStyle === "space" ? "space-stat-card" : "clay-stat-card"
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        currentThemeStyle === "space" ? "text-cyan-400" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {analytics.totalSessions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                  </div>
                  <div
                    className={`text-center p-6 ${
                      currentThemeStyle === "space" ? "space-stat-card" : "clay-stat-card"
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        currentThemeStyle === "space" ? "text-green-400" : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {formatTime(analytics.totalTime)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Study Time</div>
                  </div>
                  <div
                    className={`text-center p-6 ${
                      currentThemeStyle === "space" ? "space-stat-card" : "clay-stat-card"
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        currentThemeStyle === "space" ? "text-purple-400" : "text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      {analytics.questionsAsked}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Questions Asked</div>
                  </div>
                  <div
                    className={`text-center p-6 ${
                      currentThemeStyle === "space" ? "space-stat-card" : "clay-stat-card"
                    }`}
                  >
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        currentThemeStyle === "space" ? "text-orange-400" : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      {formatTime(analytics.averageSessionTime)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4 mt-6">
                <div className="space-y-4">
                  {Object.entries(analytics.subjectsStudied).map(([subject, count]) => {
                    const total = Object.values(analytics.subjectsStudied).reduce((a, b) => a + b, 0)
                    const percentage = total > 0 ? (count / total) * 100 : 0

                    return (
                      <div key={subject} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge
                            variant="outline"
                            className={`capitalize ${currentThemeStyle === "space" ? "space-badge" : "clay-badge"}`}
                          >
                            {subject}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{count} questions</span>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-3 ${currentThemeStyle === "space" ? "space-progress" : "clay-progress"}`}
                        />
                      </div>
                    )
                  })}

                  {Object.keys(analytics.subjectsStudied).length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Start asking questions to see subject breakdown!
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTimetable && <TimetableManager onClose={() => setShowTimetable(false)} />}
      {showNotifications && (
        <NotificationManager
          onClose={() => setShowNotifications(false)}
          onScheduleAlarm={schedulePhoneAlarm}
          themeStyle={currentThemeStyle}
        />
      )}
    </div>
  )
}
