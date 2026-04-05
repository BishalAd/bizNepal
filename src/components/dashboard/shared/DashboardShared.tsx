import React from 'react'
import { Star } from 'lucide-react'

// --- RATING STARS ---
export const RatingStars = ({ rating, size = 'w-4 h-4' }: { rating: number, size?: string }) => (
  <div className="flex gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(star => (
      <Star 
        key={star} 
        className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'} transition-colors`} 
      />
    ))}
  </div>
)

// --- STATUS BADGE (Unified for Products, Jobs, Orders, Offers) ---
export const StatusBadge = ({ status, type = 'default' }: { 
  status: string, 
  type?: 'product' | 'job' | 'order' | 'offer' | 'default' 
}) => {
  const s = status.toLowerCase()
  
  // Color Mapping
  const colors: Record<string, string> = {
    // Shared / Common
    active: 'bg-green-50 text-green-700 border-green-100',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    closed: 'bg-red-50 text-red-700 border-red-100',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    
    // Order Specific
    confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
    dispatched: 'bg-purple-50 text-purple-700 border-purple-100',
    delivered: 'bg-green-50 text-green-700 border-green-100',
    cancelled: 'bg-red-50 text-red-700 border-red-100',
    
    // Job/App Specific
    new: 'bg-blue-50 text-blue-700 border-blue-100',
    reviewed: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    shortlisted: 'bg-purple-50 text-purple-700 border-purple-100',
    hired: 'bg-green-50 text-green-700 border-green-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
    
    // Stock specific
    out_of_stock: 'bg-red-50 text-red-700 border-red-200'
  }

  const baseClass = "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all"
  return (
    <span className={`${baseClass} ${colors[s] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

// --- PAYMENT METHOD BADGE ---
export const PaymentBadge = ({ method }: { method: string }) => {
  const m = method.toLowerCase()
  const colors: Record<string, string> = {
    esewa: 'bg-green-50 text-green-700 border-green-100',
    khalti: 'bg-purple-50 text-purple-700 border-purple-100',
    cod: 'bg-orange-50 text-orange-700 border-orange-100',
    reserve: 'bg-blue-50 text-blue-700 border-blue-100',
    store_pickup: 'bg-red-50 text-red-700 border-red-100',
    online: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }

  return (
    <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-tighter ${colors[m] || 'bg-gray-50 text-gray-500'}`}>
      {method.replace('_', ' ')}
    </span>
  )
}
