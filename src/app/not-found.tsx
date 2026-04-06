import Link from 'next/link'
import { MapPin, SearchX, Home, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Page Not Found | BizNepal'
}

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 sm:px-6">
      <div className="max-w-md w-full text-center space-y-8">
        
        <div className="relative mx-auto w-32 h-32">
          {/* Decorative background circles */}
          <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse opacity-50" />
          <div className="absolute inset-4 bg-red-50 rounded-full flex items-center justify-center border border-red-200">
            <SearchX className="w-12 h-12 text-red-500" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight">404</h1>
           <h2 className="text-xl font-bold text-gray-700 mt-2">Looks like you're lost.</h2>
           <p className="text-gray-500 mt-3 text-sm">
             We couldn't find the page you were looking for. The business or product might have been removed, or the link may be broken.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
           <button 
             onClick={() => window.history.back()}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
           >
             <ArrowLeft className="w-4 h-4" /> Go Back
           </button>
           <Link 
             href="/"
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 border border-transparent text-white font-bold rounded-xl hover:bg-red-700 transition shadow-sm drop-shadow-md"
           >
             <Home className="w-4 h-4" /> Homepage
           </Link>
        </div>

      </div>
    </div>
  )
}
