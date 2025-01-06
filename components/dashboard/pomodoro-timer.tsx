"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function PomodoroTimer({ fullView = false }: { fullView?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      if (isBreak) {
        setTimeLeft(workDuration * 60)
        setIsBreak(false)
      } else {
        setTimeLeft(breakDuration * 60)
        setIsBreak(true)
      }
      // Play notification sound
      new Audio("/notification.mp3").play().catch(() => {})
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft, isBreak, workDuration, breakDuration])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setIsBreak(false)
    setTimeLeft(workDuration * 60)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold">
          {isBreak ? "Break Time!" : "Focus Time"}
        </h3>
        <div className="text-4xl font-mono mt-2">{formatTime(timeLeft)}</div>
      </div>

      <div className="flex justify-center space-x-2">
        <Button onClick={toggleTimer}>
          {isActive ? "Pause" : "Start"}
        </Button>
        <Button variant="outline" onClick={resetTimer}>
          Reset
        </Button>
      </div>

      {fullView && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Work Duration (minutes)</Label>
            <Slider
              value={[workDuration]}
              onValueChange={(value) => {
                setWorkDuration(value[0])
                if (!isActive && !isBreak) {
                  setTimeLeft(value[0] * 60)
                }
              }}
              min={1}
              max={60}
              step={1}
            />
            <div className="text-sm text-gray-500 text-center">{workDuration} minutes</div>
          </div>

          <div className="space-y-2">
            <Label>Break Duration (minutes)</Label>
            <Slider
              value={[breakDuration]}
              onValueChange={(value) => {
                setBreakDuration(value[0])
                if (!isActive && isBreak) {
                  setTimeLeft(value[0] * 60)
                }
              }}
              min={1}
              max={15}
              step={1}
            />
            <div className="text-sm text-gray-500 text-center">{breakDuration} minutes</div>
          </div>
        </div>
      )}
    </div>
  )
} 