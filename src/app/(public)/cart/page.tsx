'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// /cart redirects to /checkout where the cart UI lives
export default function CartPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/checkout') }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
