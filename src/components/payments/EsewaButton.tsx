'use client'

import React, { useMemo } from 'react'
import { generateEsewaSignature, ESEWA_TEST_URL, ESEWA_PRODUCT_CODE } from '@/lib/payments/esewa'

interface EsewaButtonProps {
  amount: number
  orderId: string
  productName: string
  customerName?: string
}

export default function EsewaButton({ amount, orderId, productName, customerName }: EsewaButtonProps) {
  // eSewa test key is a publicly known test credential from eSewa's docs.
  // For production, set NEXT_PUBLIC_ESEWA_SECRET in environment variables.
  const secretKey = process.env.NEXT_PUBLIC_ESEWA_SECRET || '8gBm/:&EnhH.1/q' // eSewa public test key
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '') // Remove trailing slash

  const signature = useMemo(() => {
    return generateEsewaSignature(secretKey, amount, orderId, ESEWA_PRODUCT_CODE)
  }, [secretKey, amount, orderId])

  return (
    <form action={ESEWA_TEST_URL} method="POST">
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="tax_amount" value={0} />
      <input type="hidden" name="total_amount" value={amount} />
      <input type="hidden" name="transaction_uuid" value={orderId} />
      <input type="hidden" name="product_code" value={ESEWA_PRODUCT_CODE} />
      <input type="hidden" name="product_service_charge" value={0} />
      <input type="hidden" name="product_delivery_charge" value={0} />
      
      <input type="hidden" name="success_url" value={`${appUrl}/payment/esewa/success`} />
      <input type="hidden" name="failure_url" value={`${appUrl}/payment/esewa/failure`} />
      <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
      <input type="hidden" name="signature" value={signature} />
      
      <button 
        type="submit" 
        className="w-full bg-[#60A130] hover:bg-[#528A27] text-white rounded-2xl p-4 flex items-center justify-between font-bold transition group shadow-md"
      >
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-[#60A130]">eS</div>
           <span className="text-lg">Pay secure with eSewa</span>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm">Proceed →</span>
      </button>
    </form>
  )
}
