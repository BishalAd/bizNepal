'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, MapIcon, List, Verified, Star, X, Store } from 'lucide-react'
import BusinessCard from '@/components/businesses/BusinessCard'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

// Dynamically import map
const BusinessMap = dynamic(() => import('@/components/businesses/BusinessMap'), { ssr: false })

export default function BusinessDirectoryClient({ categories, districts, initialBusinesses }: any) {
  const supabase = createClient()
  
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [businesses, setBusinesses] = useState(initialBusinesses)
  const [loading, setLoading] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    district: '',
    rating: 0,
    verifiedOnly: false
  })

  // Leaflet map bounds
  const [mapBounds, setMapBounds] = useState<any>(null)

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      let query = supabase.from('businesses').select(`
        id, name, slug, logo_url, cover_url, rating, review_count, city, address, 
        latitude, longitude, is_verified, hours, whatsapp,
        category:categories(name_en),
        district_info:districts(name_en)
      `).eq('status', 'active')

      if (filters.search) query = query.ilike('name', `%${filters.search}%`)
      if (filters.category) query = query.eq('category_id', filters.category)
      if (filters.district) query = query.eq('district_id', filters.district)
      if (filters.verifiedOnly) query = query.eq('is_verified', true)
      if (filters.rating > 0) query = query.gte('rating', filters.rating)

      const { data, error } = await query.limit(100)
      if (error) throw error
      setBusinesses(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if filters changed from initial load
    const isFiltered = filters.search || filters.category || filters.district || filters.verifiedOnly || filters.rating > 0
    if (isFiltered) {
      const delay = setTimeout(fetchBusinesses, 500)
      return () => clearTimeout(delay)
    } else {
      setBusinesses(initialBusinesses)
    }
  }, [filters])

  // Map view logic: filter sidebar list based on map bounds
  const visibleMapBusinesses = useMemo(() => {
    if (viewMode !== 'map' || !mapBounds) return businesses
    return businesses.filter((b: any) => {
      if (!b.latitude || !b.longitude) return false
      return mapBounds.contains([b.latitude, b.longitude])
    })
  }, [businesses, viewMode, mapBounds])

  return (
    <div className={`relative ${viewMode === 'map' ? 'h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden' : 'min-h-screen py-8 md:py-12'}`}>
      
      {/* Fixed UI Header Layer for Map View */}
      <div className={`mx-auto ${viewMode === 'grid' ? 'max-w-7xl px-4 sm:px-6 lg:px-8 mb-8' : 'absolute top-6 left-0 right-0 z-[1000] px-4 md:px-6 pointer-events-none'}`}>
        
        <div className={`flex flex-col md:flex-row gap-4 justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-gray-200/50 pointer-events-auto w-full md:w-3/4 mx-auto transition-all`}>
          
          <div className="flex-1 flex w-full">
            <Search className="w-5 h-5 text-gray-400 mt-2.5 ml-2 mr-3 opacity-70" />
            <input 
              type="text" 
              placeholder="Search companies, services, or places..." 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="w-full bg-transparent border-none outline-none font-medium text-gray-900 placeholder:text-gray-500 py-2"
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block mx-2"></div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="bg-gray-100 p-1 rounded-xl flex">
              <button onClick={()=>setViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <List className="w-4 h-4"/> Grid
              </button>
              <button onClick={()=>setViewMode('map')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <MapIcon className="w-4 h-4"/> Map
              </button>
            </div>
            <button onClick={()=>setIsMobileFiltersOpen(true)} className="md:hidden flex items-center justify-center p-3 bg-gray-100 rounded-xl">
               <Filter className="w-5 h-5 text-gray-600"/>
            </button>
          </div>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 ${viewMode === 'grid' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'w-full h-full relative z-10'}`}>
        
        {/* Sidebar Filters */}
        <aside className={`flex-shrink-0 ${viewMode === 'map' ? 'hidden' : 'lg:w-64'} ${isMobileFiltersOpen ? 'fixed inset-0 z-[2000] bg-white p-6 overflow-y-auto w-full' : 'hidden lg:block'}`}>
           <div className="flex justify-between items-center lg:hidden mb-6">
             <h2 className="text-xl font-bold">Filter Directory</h2>
             <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
           </div>

           <div className="space-y-8">
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
               <select value={filters.category} onChange={e=>setFilters({...filters, category: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="">All Categories</option>
                 {categories.map((c:any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
               </select>
             </div>

             <div>
               <h3 className="font-semibold text-gray-900 mb-3">District</h3>
               <select value={filters.district} onChange={e=>setFilters({...filters, district: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="">All Regions</option>
                 {districts.map((d:any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
               </select>
             </div>

             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Minimum Rating</h3>
               <div className="flex bg-gray-50 rounded-xl border border-gray-200 p-1">
                 {[0,3,4,4.5].map(rating => (
                   <button key={rating} onClick={()=>setFilters({...filters, rating})} className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-1 transition ${filters.rating === rating ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
                     {rating === 0 ? 'Any' : <><Star className={`w-3 h-3 ${filters.rating===rating ? 'fill-yellow-400 text-yellow-500' : ''}`}/> {rating}+</>}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                 <input type="checkbox" checked={filters.verifiedOnly} onChange={e=>setFilters({...filters, verifiedOnly: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                 <span className="font-bold text-gray-900 flex items-center gap-1.5"><Verified className="w-5 h-5 text-blue-500"/> Verified Only</span>
               </label>
             </div>
           </div>

           <div className="lg:hidden mt-8">
             <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl">Apply Filters</button>
           </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 min-w-0 flex flex-col ${viewMode === 'map' ? 'pointer-events-none' : ''}`}>
          
          {viewMode === 'grid' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <p className="text-gray-500 font-medium">{loading ? 'Searching...' : `Found ${businesses.length} businesses`}</p>
               </div>
               
               {businesses.length === 0 && !loading ? (
                 <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">No businesses found</h3>
                    <p className="text-gray-500">Try adjusting your directory filters.</p>
                 </div>
               ) : (
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                   {businesses.map((business: any) => (
                     <BusinessCard key={business.id} business={business} />
                   ))}
                 </div>
               )}
             </div>
          )}

          {viewMode === 'map' && (
             <>
               <BusinessMap businesses={businesses} onBoundsChange={setMapBounds} />
               
               {/* Fixed bottom scrolling list overlay */}
               <div className="absolute bottom-6 left-6 w-80 max-h-[60vh] overflow-y-auto pointer-events-auto custom-scrollbar hidden md:block">
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{visibleMapBusinesses.length} places in view</h3>
                    </div>
                    {visibleMapBusinesses.length === 0 ? (
                      <p className="text-sm text-gray-500">Pan map to load businesses</p>
                    ) : (
                      visibleMapBusinesses.map((b:any) => (
                        <div key={b.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 hover:border-blue-200 transition group cursor-pointer">
                           <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                              {b.logo_url ? <img src={b.logo_url} className="w-full h-full object-cover"/> : <Store className="w-5 h-5 text-gray-400"/>}
                           </div>
                           <div className="flex-1 min-w-0 overflow-hidden">
                             <a href={`/businesses/${b.slug}`} target="_blank" rel="noreferrer" className="font-bold text-gray-900 text-sm group-hover:text-blue-600 truncate block">{b.name}</a>
                             <div className="flex items-center text-xs text-gray-500 mt-1">
                               <Star className="w-3 h-3 fill-yellow-400 text-yellow-500 mr-1"/> {b.rating || '0.0'} ({b.review_count || 0})
                             </div>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </>
          )}

        </div>
      </div>
    </div>
  )
}
