import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Payment Failed | Biznity' }

export default function EsewaFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 text-center p-8">
         <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
         </div>
         
         <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h1>
         <p className="font-medium text-gray-600 mb-8 leading-relaxed">
           Your eSewa transaction could not be completed at this time. No money was deducted from your account.
         </p>

         <div className="space-y-3">
           <Link href="/checkout" className="w-full bg-[#0EA5E9] hover:bg-blue-600 text-white rounded-xl py-3.5 font-bold transition flex justify-center items-center shadow-md">
             Try Again
           </Link>
           <Link href="/checkout" className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl py-3.5 font-bold transition flex justify-center items-center">
             <ArrowLeft className="w-4 h-4 mr-2"/> Use a Different Method
           </Link>
         </div>
         
         <p className="text-xs font-bold text-gray-400 mt-6">
           If you believe this is an error, try selecting "Cash on Delivery" or contact support.
         </p>
      </div>
    </div>
  )
}
