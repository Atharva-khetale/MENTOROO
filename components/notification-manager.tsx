"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Bell, Trash2, Clock, Smartphone, Volume2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudyReminder {
  id: string
  title: string
  message: string
  time: string
  type: "study" | "break" | "revision" | "exam"
  enabled: boolean
  recurring: boolean
  days: string[]
  soundEnabled: boolean
  phoneAlarm: boolean
}

interface NotificationManagerProps {
  onClose: () => void
  onScheduleAlarm?: (time: string, title: string) => void
  themeStyle?: "default" | "space"
}

export function NotificationManager({ onClose, onScheduleAlarm, themeStyle = "default" }: NotificationManagerProps) {
  const [reminders, setReminders] = useState<StudyReminder[]>([])
  const [newReminder, setNewReminder] = useState({
    title: "",
    message: "",
    time: "",
    type: "study" as const,
    enabled: true,
    recurring: false,
    days: [] as string[],
    soundEnabled: true,
    phoneAlarm: false,
  })

  const reminderTypes = [
    { id: "study", name: "Study Session", color: "bg-blue-500", emoji: "📚" },
    { id: "break", name: "Break Time", color: "bg-green-500", emoji: "☕" },
    { id: "revision", name: "Revision", color: "bg-purple-500", emoji: "📝" },
    { id: "exam", name: "Exam Alert", color: "bg-red-500", emoji: "🎯" },
  ]

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    const saved = localStorage.getItem("neet-reminders")
    if (saved) {
      setReminders(JSON.parse(saved))
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("neet-reminders", JSON.stringify(reminders))
    setupReminders()
  }, [reminders])

  const playNotificationSound = (type = "default") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      const createSound = (frequency: number, duration: number, delay = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)

          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
        }, delay)
      }

      // Different sounds for different reminder types
      switch (type) {
        case "study":
          createSound(800, 0.3)
          createSound(600, 0.3, 100)
          createSound(800, 0.3, 200)
          break
        case "break":
          createSound(400, 0.5)
          createSound(500, 0.5, 200)
          break
        case "revision":
          createSound(1000, 0.2)
          createSound(800, 0.2, 100)
          createSound(1000, 0.2, 200)
          createSound(800, 0.2, 300)
          break
        case "exam":
          // More urgent sound for exams
          for (let i = 0; i < 3; i++) {
            createSound(1200, 0.3, i * 400)
            createSound(900, 0.3, i * 400 + 150)
          }
          break
        default:
          createSound(600, 0.4)
      }
    } catch (error) {
      console.log("Could not play notification sound:", error)
    }
  }

  const setupReminders = () => {
    // Clear existing reminders
    const existingReminders = JSON.parse(localStorage.getItem("study-reminders") || "[]")
    existingReminders.forEach((reminderId: number) => clearTimeout(reminderId))

    const newReminderIds: number[] = []

    reminders.forEach((reminder) => {
      if (!reminder.enabled) return

      const [hours, minutes] = reminder.time.split(":").map(Number)
      const now = new Date()

      if (reminder.recurring && reminder.days.length > 0) {
        // Set up recurring reminders
        reminder.days.forEach((day) => {
          const dayIndex = weekDays.indexOf(day)
          const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1

          let daysUntilReminder = dayIndex - currentDay
          if (
            daysUntilReminder < 0 ||
            (daysUntilReminder === 0 &&
              (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())))
          ) {
            daysUntilReminder += 7
          }

          const reminderTime = new Date()
          reminderTime.setDate(now.getDate() + daysUntilReminder)
          reminderTime.setHours(hours, minutes, 0, 0)

          const timeUntilReminder = reminderTime.getTime() - now.getTime()

          if (timeUntilReminder > 0) {
            const reminderId = window.setTimeout(() => {
              showNotification(reminder)
            }, timeUntilReminder)

            newReminderIds.push(reminderId)
          }
        })
      } else {
        // Set up one-time reminder for today
        const reminderTime = new Date()
        reminderTime.setHours(hours, minutes, 0, 0)

        if (reminderTime > now) {
          const timeUntilReminder = reminderTime.getTime() - now.getTime()
          const reminderId = window.setTimeout(() => {
            showNotification(reminder)
          }, timeUntilReminder)

          newReminderIds.push(reminderId)
        }
      }
    })

    localStorage.setItem("study-reminders", JSON.stringify(newReminderIds))
  }

  const showNotification = (reminder: StudyReminder) => {
    const reminderType = reminderTypes.find((t) => t.id === reminder.type)

    // Play sound if enabled
    if (reminder.soundEnabled) {
      playNotificationSound(reminder.type)
    }

    // Vibrate if supported
    if ("vibrate" in navigator) {
      const vibrationPattern = reminder.type === "exam" ? [200, 100, 200, 100, 200] : [200, 100, 200]
      navigator.vibrate(vibrationPattern)
    }

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${reminderType?.emoji} ${reminder.title}`, {
        body: reminder.message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `reminder-${reminder.id}`,
        requireInteraction: reminder.type === "exam",
        silent: !reminder.soundEnabled,
      })
    }

    // Schedule phone alarm if enabled
    if (reminder.phoneAlarm && onScheduleAlarm) {
      onScheduleAlarm(reminder.time, reminder.title)
    }

    // In-app notification
    const notification = document.createElement("div")
    const notificationClass = themeStyle === "space" ? "space-notification" : "clay-card"
    notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm ${notificationClass} border backdrop-blur-sm transition-all duration-300 animate-slide-in`

    notification.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${reminderType?.emoji}</span>
        <div class="font-semibold text-foreground">${reminder.title}</div>
        ${reminder.soundEnabled ? '<span class="text-xs">🔊</span>' : ""}
        ${reminder.phoneAlarm ? '<span class="text-xs">📱</span>' : ""}
      </div>
      <div class="text-sm text-muted-foreground">${reminder.message}</div>
      <div class="text-xs text-muted-foreground mt-1">${reminder.time}</div>
    `
    document.body.appendChild(notification)

    // Auto-remove notification
    setTimeout(
      () => {
        notification.style.opacity = "0"
        notification.style.transform = "translateX(100%)"
        setTimeout(() => notification.remove(), 300)
      },
      reminder.type === "exam" ? 10000 : 6000,
    ) // Exam notifications stay longer
  }

  const addReminder = () => {
    if (!newReminder.title || !newReminder.time) {
      alert("Please fill in title and time")
      return
    }

    if (newReminder.recurring && newReminder.days.length === 0) {
      alert("Please select days for recurring reminder")
      return
    }

    const reminder: StudyReminder = {
      id: Date.now().toString(),
      ...newReminder,
    }

    setReminders([...reminders, reminder])
    setNewReminder({
      title: "",
      message: "",
      time: "",
      type: "study",
      enabled: true,
      recurring: false,
      days: [],
      soundEnabled: true,
      phoneAlarm: false,
    })

    // Show confirmation
    playNotificationSound("default")
  }

  const removeReminder = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id))
  }

  const toggleReminder = (id: string) => {
    setReminders(
      reminders.map((reminder) => (reminder.id === id ? { ...reminder, enabled: !reminder.enabled } : reminder)),
    )
  }

  const toggleDay = (day: string) => {
    setNewReminder({
      ...newReminder,
      days: newReminder.days.includes(day) ? newReminder.days.filter((d) => d !== day) : [...newReminder.days, day],
    })
  }

  const getUpcomingReminders = () => {
    const now = new Date()
    const today = weekDays[now.getDay() === 0 ? 6 : now.getDay() - 1]

    return reminders
      .filter((reminder) => {
        if (!reminder.enabled) return false
        if (reminder.recurring) {
          return reminder.days.includes(today)
        }
        const [hours, minutes] = reminder.time.split(":").map(Number)
        const reminderTime = new Date()
        reminderTime.setHours(hours, minutes, 0, 0)
        return reminderTime > now
      })
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const containerClass = themeStyle === "space" ? "space-card" : "clay-card"
  const buttonClass = themeStyle === "space" ? "space-button" : "clay-button"
  const inputClass = themeStyle === "space" ? "space-input" : "clay-input"
  const insetClass = themeStyle === "space" ? "space-inset" : "clay-inset"
  const badgeClass = themeStyle === "space" ? "space-badge" : "clay-badge"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`${containerClass} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              {themeStyle === "space" ? "🔔 Cosmic Alerts & Notifications 🚀" : "Study Notifications & Alerts"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className={buttonClass}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Upcoming Reminders */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {themeStyle === "space" ? "🌟 Today's Mission Schedule" : "Today's Upcoming Reminders"}
            </h3>
            {getUpcomingReminders().length > 0 ? (
              <div className="space-y-3">
                {getUpcomingReminders().map((reminder) => {
                  const reminderType = reminderTypes.find((t) => t.id === reminder.type)
                  return (
                    <div key={reminder.id} className={`flex items-center justify-between p-4 ${insetClass} rounded-xl`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{reminderType?.emoji}</span>
                        <div className={`w-3 h-3 rounded-full ${reminderType?.color}`}></div>
                        <div>
                          <span className="font-medium">{reminder.title}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{reminder.time}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {reminder.soundEnabled && <Volume2 className="h-3 w-3 text-blue-500" />}
                            {reminder.phoneAlarm && <Smartphone className="h-3 w-3 text-green-500" />}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={`capitalize ${badgeClass}`}>
                        {reminder.type}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                {themeStyle === "space"
                  ? "🌌 No cosmic missions scheduled for today"
                  : "No upcoming reminders for today"}
              </p>
            )}
          </div>

          {/* Add New Reminder */}
          <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {themeStyle === "space" ? "🚀 Schedule New Mission" : "Add New Reminder"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder={themeStyle === "space" ? "e.g., Physics Space Mission" : "e.g., Physics Study Time"}
                  className={inputClass}
                />
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newReminder.type}
                  onValueChange={(value: any) => setNewReminder({ ...newReminder, type: value })}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.emoji} {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={newReminder.message}
                  onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                  placeholder={themeStyle === "space" ? "Mission briefing..." : "Reminder message"}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newReminder.recurring}
                    onChange={(e) => setNewReminder({ ...newReminder, recurring: e.target.checked })}
                  />
                  <Label htmlFor="recurring">
                    {themeStyle === "space" ? "🔄 Recurring Mission" : "Recurring reminder"}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="soundEnabled"
                    checked={newReminder.soundEnabled}
                    onChange={(e) => setNewReminder({ ...newReminder, soundEnabled: e.target.checked })}
                  />
                  <Label htmlFor="soundEnabled">🔊 Sound Alert</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="phoneAlarm"
                    checked={newReminder.phoneAlarm}
                    onChange={(e) => setNewReminder({ ...newReminder, phoneAlarm: e.target.checked })}
                  />
                  <Label htmlFor="phoneAlarm">📱 Phone Alarm</Label>
                </div>
              </div>

              {newReminder.recurring && (
                <div>
                  <Label>{themeStyle === "space" ? "🗓️ Mission Days" : "Days"}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {weekDays.map((day) => (
                      <Button
                        key={day}
                        variant={newReminder.days.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleDay(day)}
                        className={buttonClass}
                      >
                        {day.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={addReminder}
              className={`mt-4 ${themeStyle === "space" ? "space-button-primary" : "clay-button-primary"}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              {themeStyle === "space" ? "🚀 Launch Mission" : "Add Reminder"}
            </Button>
          </div>

          {/* All Reminders */}
          {reminders.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {themeStyle === "space" ? "🌌 All Scheduled Missions" : "All Reminders"}
              </h3>
              <div className="space-y-3">
                {reminders.map((reminder) => {
                  const reminderType = reminderTypes.find((t) => t.id === reminder.type)
                  return (
                    <div key={reminder.id} className={`flex items-center justify-between p-4 ${insetClass} rounded-xl`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{reminderType?.emoji}</span>
                        <div className={`w-3 h-3 rounded-full ${reminderType?.color}`}></div>
                        <div>
                          <div className="font-medium">{reminder.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {reminder.time} • {reminder.message}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {reminder.recurring && (
                              <div className="flex gap-1">
                                {reminder.days.map((day) => (
                                  <Badge key={day} variant="outline" className={`text-xs ${badgeClass}`}>
                                    {day.slice(0, 3)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {reminder.soundEnabled && (
                                <Volume2 className="h-3 w-3 text-blue-500" title="Sound enabled" />
                              )}
                              {reminder.phoneAlarm && (
                                <Smartphone className="h-3 w-3 text-green-500" title="Phone alarm enabled" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReminder(reminder.id)}
                          className={reminder.enabled ? "text-green-600" : "text-gray-400"}
                          title={reminder.enabled ? "Disable reminder" : "Enable reminder"}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReminder(reminder.id)}
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notification Permissions Info */}
          <div className="border-t pt-6 mt-6">
            <h4 className="font-semibold mb-2">
              {themeStyle === "space" ? "🛸 Mission Control Settings" : "Notification Settings"}
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                •{" "}
                {themeStyle === "space"
                  ? "🔔 Enable browser notifications for cosmic alerts"
                  : "🔔 Enable browser notifications for reminders"}
              </p>
              <p>
                •{" "}
                {themeStyle === "space"
                  ? "🔊 Sound alerts use advanced space communication frequencies"
                  : "🔊 Sound alerts use different tones for each reminder type"}
              </p>
              <p>
                •{" "}
                {themeStyle === "space"
                  ? "📱 Phone alarms integrate with your device's mission control system"
                  : "📱 Phone alarms attempt to integrate with your device's alarm system"}
              </p>
              <p>
                •{" "}
                {themeStyle === "space"
                  ? "📳 Vibration patterns vary based on mission urgency"
                  : "📳 Vibration patterns vary based on reminder importance"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
