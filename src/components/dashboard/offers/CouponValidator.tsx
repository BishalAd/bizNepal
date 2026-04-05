'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Search, Loader2, CheckCircle2, User, Phone, XCircle } from 'lucide-react'

interface CouponValidatorProps {
  businessId: string
}

export default function CouponValidator({ businessId }: CouponValidatorProps) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const handleVerify = async () => {
    if (!code.trim()) return
    
    setIsVerifying(true)
    setResult(null)

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId)
        .ilike('notes', `%STORE REDEMPTION CODE: ${code.trim()}%`)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setResult({ valid: true, order: data })
      } else {
        setResult({ valid: false })
      }
    } catch (err) {
      console.error(err)
      setResult({ valid: false, error: 'Verification failed' })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white">
      <h3 className="text-xl font-black mb-2 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-green-400" /> Verify Coupon
      </h3>
      <p className="text-gray-400 text-sm mb-6 font-medium">Enter the customer's redemption code below to verify their identity.</p>
      
      <div className="relative group">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-hover:text-blue-400 transition" />
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter Code (e.g. AB12CD34)" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500 outline-none transition text-white placeholder-gray-500" 
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
      </div>
      
      <button 
        onClick={handleVerify}
        disabled={isVerifying || !code.trim()}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center"
      >
        {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Check Validity'}
      </button>

      {/* Result Display */}
      {result && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {result.valid ? (
            <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <h4 className="font-black text-green-400 text-lg leading-tight">Valid Coupon</h4>
                  <p className="text-xs font-bold text-green-500/70 uppercase tracking-widest">Matched with Order #{result.order.id.slice(0,6)}</p>
                </div>
              </div>
              <div className="space-y-3 bg-black/20 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-200">{result.order.customer_name || 'Walk-in Customer'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-200">{result.order.customer_phone || 'No phone provided'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h4 className="font-black text-red-400 text-lg">Invalid or Expired</h4>
              <p className="text-sm font-medium text-red-300 mt-1">This code does not match any orders for this offer.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
