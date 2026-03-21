'use client'

import { WifiOff, RefreshCcw } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
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
           <button onClick={() => window.location.reload()} className="w-full bg-[#0D7377] hover:bg-[#0B6165] text-white rounded-xl py-3.5 font-bold transition flex justify-center items-center shadow-md">
             <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
           </button>
           <Link href="/" className="w-full inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3.5 font-bold transition">
             Go Home (Cached)
           </Link>
         </div>
         
         <p className="text-xs font-bold text-gray-400 mt-6">
           Some cached data might still be available in the background.
         </p>
      </div>
    </div>
  )
}
