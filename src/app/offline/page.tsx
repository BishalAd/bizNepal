'use client'

import { WifiOff, RefreshCcw, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [recentPages, setRecentPages] = useState<any[]>([])

  useEffect(() => {
    try {
      const KEY = 'biznepal_recent_pages'
      const existing = localStorage.getItem(KEY)
      if (existing) {
        setRecentPages(JSON.parse(existing))
      }
    } catch {}
  }, [])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center animate-in zoom-in duration-500">
         <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-12 h-12 text-gray-400" />
         </div>
         
         <h1 className="text-2xl font-black text-gray-900 mb-2">You're Offline</h1>
         <h2 className="text-xl font-bold text-gray-600 mb-4 opacity-80" style={{ fontFamily: 'var(--font-noto-nepali), sans-serif' }}>
           तपाईं अफलाइन हुनुहुन्छ
         </h2>
         
         <p className="font-medium text-gray-500 mb-8 leading-relaxed text-sm">
           Please check your internet connection to access the latest products, events, and jobs on BizNepal.
         </p>

         <div className="space-y-3">
           <button onClick={() => window.location.reload()} className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl py-3.5 font-bold transition flex justify-center items-center shadow-md">
             <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
           </button>
           <Link href="/" className="w-full inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3.5 font-bold transition">
             Go Home (Cached)
           </Link>
         </div>
         
         {recentPages.length > 0 && (
           <div className="mt-8 text-left border-t border-gray-100 pt-6">
             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
               <Clock className="w-4 h-4 text-gray-400" /> Recently Viewed
             </h3>
             <div className="space-y-2">
               {recentPages.slice(0, 3).map((page, idx) => (
                 <Link key={idx} href={page.url} className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition flex items-center justify-between group">
                   <span className="text-sm font-semibold text-gray-700 truncate mr-2">{page.title.replace(' | BizNepal', '')}</span>
                   <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 flex-shrink-0" />
                 </Link>
               ))}
             </div>
           </div>
         )}
         
         <p className="text-xs font-bold text-gray-400 mt-6">
           Some cached data might still be available in the background.
         </p>
      </div>
    </div>
  )
}
