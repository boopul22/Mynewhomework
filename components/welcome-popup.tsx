import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Sparkles, BookOpen, Calculator, History, Brain } from "lucide-react"

export function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(true)

  const features = [
    { icon: BookOpen, text: "Ask questions about your homework", delay: 0.1 },
    { icon: Brain, text: "Get step-by-step explanations", delay: 0.2 },
    { icon: Calculator, text: "Use the calculator for quick math", delay: 0.3 },
    { icon: History, text: "Review your chat history", delay: 0.4 },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-2 border-primary/20">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

          {/* Content */}
          <div className="relative p-6">
            <div className="flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-3xl font-bold text-primary text-center">
              Welcome to HomeworkHelper!
            </DialogTitle>
            <DialogDescription className="text-center pt-4 text-lg text-muted-foreground">
              Your AI-powered study companion
            </DialogDescription>

            {/* Features */}
            <div className="grid gap-4 mt-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-lg bg-muted hover:bg-muted/80 border border-border hover:border-primary/20 transition-all duration-200"
                >
                  <feature.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Reminder */}
            <div
              className="mt-6 p-4 rounded-lg bg-gradient-to-r from-muted to-background border border-border"
            >
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-primary">Remember:</span>{" "}
                Your AI tutor is here to help you learn, not just give you answers.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 