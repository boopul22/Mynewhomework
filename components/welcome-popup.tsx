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
    { icon: BookOpen, text: "Ask questions about your homework", delay: 0.1, showOnMobile: true },
    { icon: Brain, text: "Get step-by-step explanations", delay: 0.2, showOnMobile: true },
    { icon: Calculator, text: "Use the calculator for quick math", delay: 0.3, showOnMobile: false },
    { icon: History, text: "Review your chat history", delay: 0.4, showOnMobile: true },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-2 border-primary/20 w-[95%] max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

          {/* Content */}
          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-primary text-center mt-2">
              Welcome to HomeworkHelper!
            </DialogTitle>
            <DialogDescription className="text-center pt-2 sm:pt-4 text-base sm:text-lg text-muted-foreground">
              Your AI-powered study companion
            </DialogDescription>

            {/* Features */}
            <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: feature.delay, duration: 0.3 }}
                  className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg bg-muted hover:bg-muted/80 border border-border hover:border-primary/20 transition-all duration-200 ${!feature.showOnMobile ? 'hidden sm:flex' : ''}`}
                >
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span className="text-sm sm:text-base font-medium text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Reminder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-muted to-background border border-border"
            >
              <p className="text-xs sm:text-sm text-center text-muted-foreground">
                <span className="font-semibold text-primary">Remember:</span>{" "}
                Your AI tutor is here to help you learn, not just give you answers.
              </p>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 