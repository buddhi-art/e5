'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { Film, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white font-sans">
      {/* Left side - Cinematic Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-sky-950/20 to-black z-0"></div>
        {/* Cinematic Grid/Grain */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
        
        {/* Dynamic Glows - Skyblue (Hero) & Orange (Accent) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none transition-all duration-1000"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-orange-400 text-zinc-900 dark:text-white flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">E5 CHRONICLES</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
                Your Unified Production Workspace.
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                Access your dashboard to orchestrate production workflows, manage clients, or view your assigned tasks seamlessly.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-3xl border-l border-zinc-200 dark:border-zinc-800/50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:hidden">
            <div className="w-12 h-12 bg-white text-black mx-auto mb-4 flex items-center justify-center rounded-lg">
              <Film className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold">E5 CHRONICLES</h2>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">Welcome back</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Sign in to access your dashboard</p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-wider text-xs">Login ID / Email Address</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="ram123 or name@e5chronicles.com"
                required
                className="h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 text-base rounded-lg transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-400 font-medium uppercase tracking-wider text-xs">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-14 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-600 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50 text-base rounded-lg transition-all"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-zinc-900 dark:text-white text-base font-semibold rounded-lg shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all group border-none" 
              disabled={loading}
            >
              {loading ? 'Authenticating...' : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
