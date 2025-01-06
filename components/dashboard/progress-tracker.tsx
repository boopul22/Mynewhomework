"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Clock, Calendar } from "lucide-react"

interface StudySession {
  date: string
  duration: number
  tasksCompleted: number
}

export default function ProgressTracker({ fullView = false }: { fullView?: boolean }) {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [weeklyGoal, setWeeklyGoal] = useState(10) // hours
  const [streakDays, setStreakDays] = useState(0)

  // Calculate statistics
  const totalHours = sessions.reduce((acc, session) => acc + session.duration, 0)
  const weeklyProgress = Math.min(100, (totalHours / weeklyGoal) * 100)
  const tasksCompleted = sessions.reduce((acc, session) => acc + session.tasksCompleted, 0)

  const stats = [
    {
      icon: Clock,
      label: "Study Hours",
      value: `${totalHours.toFixed(1)}h`,
    },
    {
      icon: Target,
      label: "Weekly Goal",
      value: `${weeklyProgress.toFixed(0)}%`,
    },
    {
      icon: Trophy,
      label: "Tasks Done",
      value: tasksCompleted,
    },
    {
      icon: Calendar,
      label: "Streak",
      value: `${streakDays} days`,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-2">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stat.value}</div>
          </Card>
        ))}
      </div>

      {fullView && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Progress</span>
              <span>{weeklyProgress.toFixed(0)}%</span>
            </div>
            <Progress value={weeklyProgress} />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Recent Activity</h4>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span>{session.date}</span>
                  <span>{session.duration.toFixed(1)}h</span>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 