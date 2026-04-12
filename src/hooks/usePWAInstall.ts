'use client'

import { useState, useEffect } from 'react'

export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true
    setIsInstalled(isStandalone)

    const ua = window.navigator.userAgent
    const isIosDevice = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
    setIsIOS(isIosDevice && isSafari)

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  return { installApp, isInstalled, isIOS, canInstall }
}
