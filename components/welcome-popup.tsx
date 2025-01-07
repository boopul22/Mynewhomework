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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border-2 border-pink-200 dark:border-pink-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100/50 via-white to-white dark:from-pink-950/30 dark:via-zinc-950 dark:to-zinc-950" />
          
          <DialogHeader className="relative p-6 pb-2">
            <div className="flex items-center justify-center space-x-3">
              <Sparkles className="w-7 h-7 text-pink-500 dark:text-pink-400 animate-pulse" />
              <DialogTitle className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                Welcome to Homework Helper
              </DialogTitle>
            </div>
            <DialogDescription className="text-center pt-4 text-lg text-zinc-600 dark:text-zinc-300">
              Your smart study companion for better learning
            </DialogDescription>
          </DialogHeader>

          <div className="relative p-6 pt-2">
            <div className="space-y-6">
              <div className="grid gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: feature.delay, duration: 0.3 }}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-950/50 border border-pink-200 dark:border-pink-900/50 hover:border-pink-300 dark:hover:border-pink-700 transition-all duration-200"
                  >
                    <feature.icon className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-lg bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/20 dark:to-zinc-950 border border-pink-200 dark:border-pink-900/50"
              >
                <p className="text-sm text-center text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold text-pink-600 dark:text-pink-400">Remember:</span>{" "}
                  This tool is designed to help you learn, not just provide answers.
                  Use it responsibly to enhance your understanding! 🎓
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
} 