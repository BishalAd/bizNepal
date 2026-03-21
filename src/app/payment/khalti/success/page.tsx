'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

function KhaltiSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  const pidx = searchParams.get('pidx')
  const purchaseOrderId = searchParams.get('purchase_order_id')
  const txnId = searchParams.get('transaction_id')
  const amountStr = searchParams.get('amount')

  useEffect(() => {
    if (!pidx) {
      setStatus('failed')
      setErrorMessage('Missing Khalti tracking ID (pidx).')
      return
    }

    const verify = async () => {
       try {
         const res = await fetch(`/api/payments/khalti/verify?pidx=${pidx}&orderId=${purchaseOrderId || ''}`)
         const data = await res.json()
         
         if (data.success) {
           setStatus('success')
           toast.success('Khalti payment completely verified!')
         } else {
           setStatus('failed')
           setErrorMessage(data.error || data.status || 'Verification did not return Completed status')
         }
       } catch (err) {
         setStatus('failed')
         setErrorMessage('Server could not connect to Khalti verification network.')
       }
    }

    verify()
  }, [pidx, purchaseOrderId])

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center duration-500 animate-in zoom-in-95">
      
      {status === 'verifying' && (
         <div className="p-12">
            <Loader2 className="w-16 h-16 animate-spin text-[#5C2D91] mx-auto mb-6" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Verifying with Khalti...</h1>
            <p className="font-medium text-gray-500">Please wait while we confirm your transaction securely.</p>
         </div>
      )}

      {status === 'success' && (
         <>
            <div className="bg-[#5C2D91] p-8 text-white text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
              <h1 className="text-3xl font-black">Khalti Payment Successful</h1>
            </div>
            
            <div className="p-8 space-y-6">
               <div>
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Amount Paid</p>
                 {/* Khalti amount is in paisa, convert to Rs */}
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">₨ {amountStr ? (Number(amountStr)/100).toLocaleString() : '---'}</h2>
               </div>
               
               <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 border border-gray-100">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="text-gray-900">{txnId || pidx?.slice(0, 10)}</span>
                  </div>
                  {purchaseOrderId && (
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Order ID</span>
                      <span className="text-gray-900 truncate pl-4">BN-{purchaseOrderId.slice(0,8).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-500">Method</span>
                    <span className="text-[#5C2D91]">Khalti Digital Wallet</span>
                  </div>
               </div>

               <p className="text-sm font-medium text-gray-600 leading-relaxed">
                 Thank you for choosing BizNepal! The business owner has received your order instantly.
               </p>

               <div className="pt-4">
                 <Link href="/dashboard" className="w-full bg-[#5C2D91] hover:bg-[#4E267A] text-white rounded-xl py-3.5 font-bold transition flex justify-center items-center shadow-md">
                   Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2"/>
                 </Link>
               </div>
            </div>
         </>
      )}

      {status === 'failed' && (
         <div className="p-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">Verification Failed</h1>
            <p className="font-medium text-gray-600 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <Link href="/checkout" className="w-full inline-block bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3.5 font-bold transition">Return to Checkout</Link>
         </div>
      )}

    </div>
  )
}

export default function KhaltiSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right"/>
      <Suspense fallback={
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#5C2D91] mx-auto mb-6" />
          <h2 className="text-xl font-bold">Loading...</h2>
        </div>
      }>
        <KhaltiSuccessContent />
      </Suspense>
    </div>
  )
}
