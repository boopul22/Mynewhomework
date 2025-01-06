"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  deadline: string
  priority: "high" | "medium" | "low"
  completed: boolean
}

export default function TaskTracker({ view = "all" }: { view?: "all" | "today" }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [deadline, setDeadline] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")

  const addTask = () => {
    if (!newTask.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      deadline,
      priority,
      completed: false,
    }
    setTasks([...tasks, task])
    setNewTask("")
    setDeadline("")
    setPriority("medium")
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const filteredTasks = view === "today" 
    ? tasks.filter(task => task.deadline === format(new Date(), "yyyy-MM-dd"))
    : tasks

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="task">New Task</Label>
          <Input
            id="task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter task..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value: "high" | "medium" | "low") => setPriority(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={addTask} className="mt-8">Add</Button>
      </div>

      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between p-2 rounded border ${
              task.completed ? "bg-gray-100" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4"
              />
              <span className={task.completed ? "line-through" : ""}>
                {task.title}
              </span>
              <span className="text-sm text-gray-500">
                Due: {task.deadline}
              </span>
              <span
                className={`text-sm px-2 py-1 rounded ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {task.priority}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 