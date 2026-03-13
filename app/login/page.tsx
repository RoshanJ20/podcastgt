'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Headphones } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else window.location.href = redirectTo
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#60A5FA_0%,transparent_50%)] opacity-[0.07]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,#38BDF8_0%,transparent_50%)] opacity-[0.05]" />

      <Card className="w-full max-w-md glass-card shadow-2xl shadow-[#60A5FA]/10 relative overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#60A5FA] via-[#818CF8] to-[#38BDF8]" />

        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-3">
            <div className="bg-gradient-to-br from-[#60A5FA] to-[#38BDF8] p-3 rounded-2xl shadow-lg glow-primary">
              <Headphones className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text font-[family-name:var(--font-heading)]">Podcast Hub</CardTitle>
          <CardDescription>National Audit Office — Audio Learning Platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="flex rounded-lg overflow-hidden text-sm border border-border">
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-all ${mode === 'magic' ? 'btn-gradient' : 'hover:bg-white/5 text-muted-foreground'}`}
              onClick={() => setMode('magic')}
            >
              Magic link
            </button>
            <button
              type="button"
              className={`flex-1 py-2 font-medium transition-all ${mode === 'password' ? 'btn-gradient' : 'hover:bg-white/5 text-muted-foreground'}`}
              onClick={() => setMode('password')}
            >
              Password
            </button>
          </div>

          {mode === 'magic' ? (
            sent ? (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Magic link sent to <span className="font-medium text-foreground">{email}</span>.
                </p>
                <p className="text-sm text-muted-foreground">Check your inbox to sign in.</p>
                <Button variant="outline" className="mt-4 w-full" onClick={() => setSent(false)}>
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" className="btn-gradient w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" disabled={loading}>
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-pw">Email address</Label>
                <Input id="email-pw" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-gradient w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
