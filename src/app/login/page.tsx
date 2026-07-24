/* eslint-disable @typescript-eslint/no-unused-vars */
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
    <div className="min-h-screen w-full flex bg-surface-container-lowest overflow-hidden text-foreground font-sans">
      {/* Left side - Cinematic Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-primary/10 to-surface-container-lowest z-0" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />

        {/* Dynamic M3 Orange Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-plus-lighter pointer-events-none transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] mix-blend-plus-lighter pointer-events-none transition-all duration-1000" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center rounded-xl elevation-2">
            <Film className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-outline">E5 CHRONICLES</span>
        </div>

        <div className="relative z-10 max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-black tracking-tight leading-[1.1] mb-6">
                Your Creative Agency Workspace.
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Access your dashboard to manage videography shoots, editing projects, client packages, and team tasks — all in one place.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10 bg-surface-container-low border-l border-outline-variant/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:hidden">
            <div className="w-12 h-12 bg-primary text-primary-foreground mx-auto mb-4 flex items-center justify-center rounded-xl elevation-1">
              <Film className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">E5 CHRONICLES</h2>
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Welcome back</h2>
            <p className="text-on-surface-variant">Sign in to access your dashboard</p>
          </div>

          <form action={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-error-container text-on-error-container rounded-xl text-sm elevation-1"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-on-surface-variant font-medium uppercase tracking-wider text-xs">Login ID / Email Address</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="ram123 or name@e5chronicles.com"
                required
                className="h-14 bg-surface-container-lowest border-outline-variant text-foreground placeholder:text-outline focus-visible:ring-primary/50 focus-visible:border-primary/50 text-base rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-on-surface-variant font-medium uppercase tracking-wider text-xs">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-14 bg-surface-container-lowest border-outline-variant text-foreground placeholder:text-outline focus-visible:ring-primary/50 focus-visible:border-primary/50 text-base rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold rounded-xl elevation-3 hover:elevation-4 transition-all group border-none btn-morph"
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
