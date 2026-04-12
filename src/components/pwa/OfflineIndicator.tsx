'use client'

import React, { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [justCameOnline, setJustCameOnline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOffline = () => {
      setIsOffline(true)
      setJustCameOnline(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setJustCameOnline(true)
      setTimeout(() => setJustCameOnline(false), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    if (!navigator.onLine) setIsOffline(true)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline && !justCameOnline) return null

  if (isOffline) {
    return (
      <div className="sticky top-0 z-[100] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-md animate-in slide-in-from-top-2">
        <WifiOff className="w-4 h-4" />
        You're offline — showing cached content
      </div>
    )
  }

  if (justCameOnline) {
    return (
      <div className="sticky top-0 z-[100] bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-md animate-in slide-in-from-top-2">
        <Wifi className="w-4 h-4" />
        Back online!
      </div>
    )
  }

  return null
}
