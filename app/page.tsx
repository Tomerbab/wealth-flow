'use client'

import { TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthPage from '@/components/AuthPage'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
            <TrendingUp size={20} className="text-white" />
          </div>
          <p className="text-slate-500 text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  if (!session) return <AuthPage />

  return (
    <Dashboard
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
    />
  )
}
