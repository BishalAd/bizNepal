'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Star, MessageCircle, Store, BadgeCheck } from 'lucide-react'
import { isBusinessOpen } from '@/lib/utils/hours'

export default function BusinessCard({ business }: { business: any }) {
  const isOpen = isBusinessOpen(business.hours)
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition group overflow-hidden flex flex-col h-full">
      {/* Cover Image */}
      <div className="h-32 bg-gray-100 relative w-full overflow-hidden">
        {business.cover_url ? (
          <img src={business.cover_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-900/5">
            <Store className="w-8 h-8 text-blue-900/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
        
        {/* Open Badge */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
          {isOpen ? (
            <span className="bg-green-500/90 backdrop-blur text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shadow-sm">Open Now</span>
          ) : (
             <span className="bg-red-500/90 backdrop-blur text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded shadow-sm">Closed</span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-20">
        
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-white flex items-center justify-center overflow-hidden -mt-10 mb-3 ml-1 relative z-20">
          {business.logo_url ? <img src={business.logo_url} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-gray-400" />}
        </div>

        <div className="flex-1">
           <div className="flex items-start justify-between gap-2 mb-1">
             <Link href={`/businesses/${business.slug}`} className="block">
               <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition truncate-multiline">{business.name}</h3>
             </Link>
             {business.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />}
           </div>

           <div className="flex items-center gap-1.5 mb-3">
             <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100">
               <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500 mr-1" />
               <span className="text-sm font-bold text-yellow-700">{business.rating || '0.0'}</span>
             </div>
             <span className="text-xs font-semibold text-gray-500">({business.review_count || 0} reviews)</span>
           </div>

           <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-gray-600">
             <span className="bg-gray-100 px-2 py-1 rounded uppercase tracking-wider text-[10px] font-bold">
               {Array.isArray(business.category) ? business.category[0]?.name_en : (business.category as any)?.name_en || 'Business'}
             </span>
             <span className="flex items-center">
               <MapPin className="w-3 h-3 justify-center mr-1 text-gray-400"/> 
               {Array.isArray(business.district_info) ? business.district_info[0]?.name_en : (business.district_info as any)?.name_en || business.city || 'Nepal'}
             </span>
           </div>
        </div>

        <div className="pt-4 mt-4 border-t border-gray-100 flex gap-2">
           <Link href={`/businesses/${business.slug}`} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-bold py-2 rounded-xl text-center text-sm transition transition">
             View Profile
           </Link>
           {business.whatsapp && (
             <a href={`https://wa.me/977${business.whatsapp}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl transition tooltip-trigger" title="WhatsApp">
               <MessageCircle className="w-5 h-5" />
             </a>
           )}
        </div>

      </div>
    </div>
  )
}
