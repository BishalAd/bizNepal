'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Loader2, Hammer } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminLoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLocal, setIsLocal] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if running on localhost for the self-promotion feature
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsLocal(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // After login, check if they are actually an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        toast.success('Access Granted. Welcome, Admin.')
        router.push('/admin')
        router.refresh()
      } else {
        toast.error('Unauthorized. This portal is for Administrators only.')
        // Note: We don't sign them out, just block them from /admin
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Developer Feature: Self-Promote to Admin on Localhost
  const handleSelfPromote = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please login with your account first, then click "Promote to Admin".')
      return
    }

    setIsPromoting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
      
      if (error) throw error
      
      toast.success('System Override! You are now an Admin.')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error('Promotion failed. Ensure RLS is configured or use SQL Editor.')
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-12">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-red-500/10">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Admin Portal</h1>
            <p className="text-slate-400 text-sm">Secure access for platform administrators only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@biznepal.com"
                  className="w-full bg-slate-800/50 border border-slate-700 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secret Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Authenticate <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {isLocal && (
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <div className="flex items-center gap-2 text-yellow-500/80 mb-4 justify-center">
                <Hammer className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Developer Environment</span>
              </div>
              <button 
                onClick={handleSelfPromote}
                disabled={isPromoting}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3 rounded-xl border border-slate-700/50 text-sm transition-all shadow-sm"
              >
                {isPromoting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Promote to Admin (Self)
                  </>
                )}
              </button>
              <p className="text-[9px] text-slate-600 text-center mt-3 leading-relaxed">
                One-click admin promotion available only on localhost. <br/> 
                Use this if your role is currently "user" or "business".
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <a href="/" className="text-slate-500 hover:text-white text-xs transition-colors">Return to Public Portal</a>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 opacity-50">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-[10px] text-white font-bold tracking-widest uppercase">BizNepal Enterprise</span>
        </div>
      </div>
    </div>
  )
}
