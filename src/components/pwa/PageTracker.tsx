'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const KEY = 'biznity_recent_pages'
      const existing = localStorage.getItem(KEY)
      let pages = existing ? JSON.parse(existing) : []
      
      const newPage = {
        title: document.title || 'Biznity Page',
        url: window.location.pathname + window.location.search,
        timestamp: Date.now()
      }

      pages = pages.filter((p: any) => p.url !== newPage.url)
      pages.unshift(newPage)
      if (pages.length > 5) pages = pages.slice(0, 5)

      localStorage.setItem(KEY, JSON.stringify(pages))
    } catch (e) {
      console.error('Failed to save recent page', e)
    }
  }, [pathname])

  return null
}
