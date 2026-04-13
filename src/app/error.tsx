'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RotateCcw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or console
    console.error('Biznity Application Error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white border border-red-100 shadow-xl rounded-3xl p-8 text-center space-y-6">
        
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center border border-red-100">
           <AlertOctagon className="w-8 h-8" strokeWidth={2} />
        </div>

        <div>
           <h1 className="text-2xl font-black text-gray-900 tracking-tight">Something went wrong</h1>
           <p className="text-gray-500 mt-2 text-sm leading-relaxed">
             An unexpected error occurred in the application. Our technical team has been notified.
           </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left overflow-x-auto">
          <p className="text-xs font-mono text-gray-400">
            {error.message || "Unknown Runtime Error"}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
           <button 
             onClick={reset}
             className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-sm drop-shadow-md"
           >
             <RotateCcw className="w-4 h-4" /> Try Again
           </button>
           <Link 
             href="/"
             className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition shadow-sm"
           >
             <Home className="w-4 h-4" /> Go via Homepage
           </Link>
        </div>

      </div>
    </div>
  )
}
