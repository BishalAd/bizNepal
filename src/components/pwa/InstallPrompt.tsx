'use client'

import React, { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallPrompt() {
  const { isInstalled, isIOS, canInstall, installApp } = usePWAInstall()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isInstalled) return

    try {
      const dismissedStr = localStorage.getItem('biznity_install_dismissed')
      if (dismissedStr) {
        const timestamp = parseInt(dismissedStr, 10)
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - timestamp < sevenDays) {
          return
        }
      }
    } catch {}

    if (canInstall || isIOS) {
      setIsVisible(true)
    }
  }, [isInstalled, canInstall, isIOS])

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      localStorage.setItem('biznity_install_dismissed', Date.now().toString())
    } catch {}
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] animate-in slide-in-from-bottom-5 duration-300" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      <div className="mx-4 mb-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 flex items-center gap-4 relative">
        <button onClick={handleDismiss} className="absolute -top-3 -right-3 bg-white text-gray-500 hover:text-gray-900 border border-gray-100 shadow-sm p-1.5 rounded-full transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100 overflow-hidden">
           <span className="font-extrabold tracking-tighter text-sm"><span className="text-red-600">Biz</span><span className="text-gray-900">Nepal</span></span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{isIOS ? 'Install Biznity' : 'Install Biznity App'}</h4>
          <p className="text-xs text-gray-500 line-clamp-2 pr-2">
            {isIOS ? 'Tap Share then "Add to Home Screen"' : 'Add to your home screen — works offline too!'}
          </p>
        </div>

        {!isIOS && canInstall && (
          <button 
            onClick={installApp}
            className="flex-shrink-0 bg-[#DC2626] hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Install
          </button>
        )}
      </div>
    </div>
  )
}
