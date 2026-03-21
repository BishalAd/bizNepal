'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Flame, Filter, Store, X } from 'lucide-react'
import CountdownTimer from '@/components/offers/CountdownTimer'

export default function OffersClient({ initialOffers, categories, searchParams }: any) {
  const [activeTab, setActiveTab] = useState('all') // all, ending-soon, new
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Filtering logic
  const filteredOffers = useMemo(() => {
    let result = [...initialOffers]

    if (activeTab === 'ending-soon') {
      // Offers ending within 48 hours
      const fortyEightHoursFromNow = new Date().getTime() + (48 * 60 * 60 * 1000)
      result = result.filter(o => new Date(o.ends_at).getTime() <= fortyEightHoursFromNow)
    } else if (activeTab === 'new') {
      // Created within last 7 days
      const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
      result = result.filter(o => new Date(o.created_at).getTime() >= sevenDaysAgo)
    }

    if (selectedCategory) {
      result = result.filter(o => o.business?.category_id === selectedCategory)
    }

    return result
  }, [initialOffers, activeTab, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 flex items-center gap-3">
            <Flame className="w-10 h-10 text-red-500 fill-red-500" />
            Deals & Offers
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Hurry up! These exclusive deals won't last long.</p>
        </div>

        <button 
          onClick={() => setIsMobileFilterOpen(true)}
          className="md:hidden flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm"
        >
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`md:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
          <div className="flex justify-between items-center md:hidden mb-6">
            <h2 className="text-xl font-bold">Filter Offers</h2>
            <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-8">
            {/* Filter Tabs / Quick Filters */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Filters</h3>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'all', label: 'All Offers' },
                  { id: 'ending-soon', label: 'Ending Soon' },
                  { id: 'new', label: 'Newly Added' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsMobileFilterOpen(false); }}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.id ? 'bg-red-50 text-red-700 border border-red-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">By Category</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" checked={!selectedCategory} onChange={() => {setSelectedCategory(''); setIsMobileFilterOpen(false)}} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                  <span className="text-sm text-gray-700">All Categories</span>
                </label>
                {categories.map((cat: any) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={selectedCategory === cat.id} onChange={() => {setSelectedCategory(cat.id); setIsMobileFilterOpen(false)}} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                    <span className="text-sm text-gray-700">{cat.name_en}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Offers Grid */}
        <div className="flex-1">
          {filteredOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 border-dashed p-12 text-center">
              <Flame className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900">No active offers found</h3>
              <p className="text-gray-500 mt-2">Try changing your filters or check back later!</p>
              <button onClick={() => {setActiveTab('all'); setSelectedCategory('')}} className="mt-6 text-red-600 font-semibold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer: any) => {
                const stockLeft = offer.max_quantity ? offer.max_quantity - (offer.grabbed_count || 0) : null
                const stockPercent = offer.max_quantity ? Math.round(((offer.grabbed_count || 0) / offer.max_quantity) * 100) : null
                const isUnder5 = stockLeft !== null && stockLeft <= 5

                return (
                  <div key={offer.id} className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {offer.banner_url ? (
                        <Image src={offer.banner_url} alt={offer.title} fill className="object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Offer Banner</div>
                      )}
                      {offer.discount_percent && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white font-extrabold px-3 py-1.5 rounded-lg shadow-lg rotate-[-2deg] text-lg">
                          {offer.discount_percent}% OFF
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 truncate">
                        <Store className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate font-medium">{offer.business?.name}</span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 mb-4 group-hover:text-red-700 transition">
                        {offer.title}
                      </h3>

                      <div className="mt-auto">
                        <div className="flex items-end gap-3 mb-6 bg-red-50/50 p-3 rounded-xl">
                          <span className="text-2xl font-extrabold text-red-600 leading-none">₨ {offer.offer_price.toLocaleString()}</span>
                          <span className="text-sm text-gray-400 line-through mb-0.5 font-medium">₨ {offer.original_price.toLocaleString()}</span>
                        </div>

                        {/* Stock Bar */}
                        {stockPercent !== null && typeof stockPercent === 'number' && (
                          <div className="mb-6">
                            <div className="flex justify-between text-xs font-semibold mb-1.5 text-gray-600">
                              <span>{offer.grabbed_count || 0} grabbed</span>
                              {isUnder5 ? <span className="text-red-600 animate-pulse">Only {stockLeft} left!</span> : <span>{stockLeft} left</span>}
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${isUnder5 ? 'bg-red-500' : 'bg-red-400'}`} style={{ width: `${Math.min(stockPercent, 100)}%` }}></div>
                            </div>
                          </div>
                        )}

                        <div className="mb-6 flex justify-center">
                          <CountdownTimer endsAt={offer.ends_at} />
                        </div>

                        <Link href={`/offers/${offer.id}`} className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition">
                          Grab This Deal
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
