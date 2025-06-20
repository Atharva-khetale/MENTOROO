"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Bell, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudySlot {
  id: string
  subject: string
  time: string
  duration: number
  days: string[]
  alarm: boolean
}

interface TimetableManagerProps {
  onClose: () => void
}

export function TimetableManager({ onClose }: TimetableManagerProps) {
  const [studySlots, setStudySlots] = useState<StudySlot[]>([])
  const [newSlot, setNewSlot] = useState({
    subject: "",
    time: "",
    duration: 60,
    days: [] as string[],
    alarm: true,
  })

  const subjects = ["Physics", "Chemistry", "Biology", "Mathematics", "General Study"]
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    const saved = localStorage.getItem("neet-timetable")
    if (saved) {
      setStudySlots(JSON.parse(saved))
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("neet-timetable", JSON.stringify(studySlots))
    setupAlarms()
  }, [studySlots])

  const setupAlarms = () => {
    // Clear existing alarms
    const existingAlarms = JSON.parse(localStorage.getItem("study-alarms") || "[]")
    existingAlarms.forEach((alarmId: number) => clearTimeout(alarmId))

    const newAlarms: number[] = []

    studySlots.forEach((slot) => {
      if (!slot.alarm) return

      slot.days.forEach((day) => {
        const [hours, minutes] = slot.time.split(":").map(Number)
        const now = new Date()
        const alarmTime = new Date()

        // Set alarm for today or next occurrence
        const dayIndex = weekDays.indexOf(day)
        const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1 // Convert Sunday=0 to Sunday=6

        let daysUntilAlarm = dayIndex - currentDay
        if (
          daysUntilAlarm < 0 ||
          (daysUntilAlarm === 0 &&
            (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())))
        ) {
          daysUntilAlarm += 7
        }

        alarmTime.setDate(now.getDate() + daysUntilAlarm)
        alarmTime.setHours(hours, minutes, 0, 0)

        const timeUntilAlarm = alarmTime.getTime() - now.getTime()

        if (timeUntilAlarm > 0) {
          const alarmId = window.setTimeout(() => {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`NEET Study Time!`, {
                body: `Time for ${slot.subject} study session (${slot.duration} minutes)`,
                icon: "/favicon.ico",
              })
            }
          }, timeUntilAlarm)

          newAlarms.push(alarmId)
        }
      })
    })

    localStorage.setItem("study-alarms", JSON.stringify(newAlarms))
  }

  const addStudySlot = () => {
    if (!newSlot.subject || !newSlot.time || newSlot.days.length === 0) {
      alert("Please fill in all fields")
      return
    }

    const slot: StudySlot = {
      id: Date.now().toString(),
      ...newSlot,
    }

    setStudySlots([...studySlots, slot])
    setNewSlot({
      subject: "",
      time: "",
      duration: 60,
      days: [],
      alarm: true,
    })
  }

  const removeStudySlot = (id: string) => {
    setStudySlots(studySlots.filter((slot) => slot.id !== id))
  }

  const toggleDay = (day: string) => {
    setNewSlot({
      ...newSlot,
      days: newSlot.days.includes(day) ? newSlot.days.filter((d) => d !== day) : [...newSlot.days, day],
    })
  }

  const getTodaySlots = () => {
    const today = weekDays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
    return studySlots.filter((slot) => slot.days.includes(today)).sort((a, b) => a.time.localeCompare(b.time))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Study Timetable & Alarms
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Today's Schedule */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Today's Schedule</h3>
            {getTodaySlots().length > 0 ? (
              <div className="space-y-2">
                {getTodaySlots().map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{slot.subject}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {slot.time} ({slot.duration} min)
                      </span>
                    </div>
                    {slot.alarm && <Bell className="h-4 w-4 text-blue-600" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No study sessions scheduled for today</p>
            )}
          </div>

          {/* Add New Study Slot */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Add New Study Session</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={newSlot.subject} onValueChange={(value) => setNewSlot({ ...newSlot, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="180"
                  step="15"
                  value={newSlot.duration}
                  onChange={(e) => setNewSlot({ ...newSlot, duration: Number.parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label>Alarm</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="alarm"
                    checked={newSlot.alarm}
                    onChange={(e) => setNewSlot({ ...newSlot, alarm: e.target.checked })}
                  />
                  <Label htmlFor="alarm">Enable alarm notification</Label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {weekDays.map((day) => (
                  <Button
                    key={day}
                    variant={newSlot.days.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={addStudySlot} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Study Session
            </Button>
          </div>

          {/* All Study Slots */}
          {studySlots.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">All Study Sessions</h3>
              <div className="space-y-3">
                {studySlots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{slot.subject}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {slot.time} • {slot.duration} minutes
                      </div>
                      <div className="flex gap-1 mt-1">
                        {slot.days.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.alarm && <Bell className="h-4 w-4 text-blue-600" />}
                      <Button variant="ghost" size="sm" onClick={() => removeStudySlot(slot.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
