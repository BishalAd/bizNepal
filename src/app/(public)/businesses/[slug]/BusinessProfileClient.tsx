'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Building2, MapPin, Globe, Phone, MessageCircle, Share2, 
  MapIcon, Star, BadgeCheck, Clock, ExternalLink 
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { isBusinessOpen } from '@/lib/utils/hours'
import EventCard from '@/components/events/EventCard'
import ProductCard from '@/components/products/ProductCard'
import { formatDistanceToNow, format } from 'date-fns'

const Map = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl inset-0 absolute" /> }
)
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })

export default function BusinessProfileClient({ business, tabsData }: any) {
  const [activeTab, setActiveTab] = useState('products')
  
  const isOpen = isBusinessOpen(business.hours)
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: `Check out ${business.name} on BizNepal!`,
          url: window.location.href,
        })
      } catch (err) {
         console.log('Error sharing', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const TabButton = ({ id, label, count }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-6 py-4 font-bold text-sm tracking-wide transition border-b-2 whitespace-nowrap ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
          : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label} {count > 0 && <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{count}</span>}
    </button>
  )

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Cover Image */}
      <div className="w-full h-[30vh] md:h-[40vh] bg-blue-900 relative">
        {business.cover_url ? (
          <Image src={business.cover_url} alt={business.name} fill className="object-cover opacity-90" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-2xl font-bold bg-blue-900 border-b border-blue-800">
             <Building2 className="w-16 h-16 mb-4 opacity-50" />
             Store Cover
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 md:p-8 relative -mt-24 z-10 mb-8 flex flex-col lg:flex-row gap-8">
           
           <div className="flex-1 flex flex-col md:flex-row gap-6">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-3xl p-2 border-2 border-gray-100 shadow-sm flex items-center justify-center overflow-hidden -mt-16 md:-mt-20 relative z-20 flex-shrink-0">
                 {business.logo_url ? <img src={business.logo_url} className="w-full h-full object-contain" /> : <Building2 className="w-12 h-12 text-gray-300"/>}
              </div>
              
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{business.name}</h1>
                   {business.is_verified && <BadgeCheck className="w-8 h-8 text-blue-500 mt-1 flex-shrink-0" />}
                 </div>

                 <div className="flex flex-wrap items-center gap-3 mb-4">
                   <span className="bg-blue-50 text-blue-700 px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-100">{business.category?.name_en || 'Business'}</span>
                   <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                     <Star className="w-4 h-4 fill-yellow-400 text-yellow-500 mr-1.5" />
                     <span className="text-sm font-bold text-yellow-700 mr-1">{business.rating || '0.0'}</span>
                     <span className="text-xs font-semibold text-yellow-600/70">({business.review_count || 0})</span>
                   </div>
                 </div>

                 <div className="flex flex-col gap-2 text-gray-600 font-medium text-sm">
                   <span className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400"/> {business.address || business.city || business.district_info?.name_en}</span>
                   {business.website && <a href={business.website} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600 transition truncate"><Globe className="w-4 h-4 mr-2 text-gray-400"/> {business.website}</a>}
                 </div>
              </div>
           </div>

           {/* Action Buttons */}
           <div className="flex flex-col gap-3 min-w-[200px]">
             {business.whatsapp && (
               <a href={`https://wa.me/977${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1EBE55] text-white font-bold py-3.5 rounded-xl transition shadow-sm">
                 <MessageCircle className="w-5 h-5" /> WhatsApp
               </a>
             )}
             {business.phone && (
               <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition shadow-sm">
                 <Phone className="w-5 h-5" /> Call Business
               </a>
             )}
             <div className="grid grid-cols-2 gap-3">
               {business.latitude && business.longitude && (
                 <a href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                   <MapIcon className="w-4 h-4" /> Map
                 </a>
               )}
               <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">
                 <Share2 className="w-4 h-4" /> Share
               </button>
             </div>
           </div>

        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           
           <div className="lg:col-span-2 space-y-8">
              
              {/* Tab Navigation */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto custom-scrollbar flex">
                 <TabButton id="products" label="Products" count={tabsData.products.length} />
                 <TabButton id="services" label="Services" count={0} />
                 <TabButton id="offers" label="Offers" count={tabsData.offers.length} />
                 <TabButton id="events" label="Events" count={tabsData.events.length} />
                 <TabButton id="jobs" label="Jobs" count={tabsData.jobs.length} />
                 <TabButton id="reviews" label="Reviews" count={tabsData.reviews.length} />
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                 {activeTab === 'products' && (
                    tabsData.products.length > 0 ? (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {tabsData.products.map((p: any) => <ProductCard key={p.id} product={p} />)}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
                        No products available.
                      </div>
                    )
                 )}

                 {activeTab === 'offers' && (
                    tabsData.offers.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-6">
                        {tabsData.offers.map((sim: any) => (
                          <Link href={`/offers/${sim.id}`} key={sim.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                            <div className="h-40 bg-gray-100 relative">
                              {sim.banner_url && <Image src={sim.banner_url} alt={sim.title} fill className="object-cover group-hover:scale-105 transition duration-500" />}
                              {sim.discount_percent && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">{sim.discount_percent}% OFF</div>}
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600">{sim.title}</h3>
                              <div className="flex items-end gap-2">
                                <span className="font-extrabold text-red-600 text-lg">₨ {sim.offer_price.toLocaleString()}</span>
                                <span className="text-sm text-gray-400 line-through mb-0.5">₨ {sim.original_price.toLocaleString()}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
                        No active offers at the moment.
                      </div>
                    )
                 )}

                 {activeTab === 'events' && (
                    tabsData.events.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-6">
                        {tabsData.events.map((e: any) => (
                           <EventCard key={e.id} event={e} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
                        No upcoming events.
                      </div>
                    )
                 )}

                 {activeTab === 'jobs' && (
                    tabsData.jobs.length > 0 ? (
                      <div className="space-y-4">
                        {tabsData.jobs.map((jobData: any) => (
                          <Link key={jobData.id} href={`/jobs/${jobData.slug}`} className="block bg-white border border-gray-100 p-5 rounded-xl hover:shadow-md hover:border-blue-100 transition group flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 group-hover:text-blue-600">{jobData.title}</h4>
                              <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold">
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded tracking-wide uppercase">{jobData.job_type}</span>
                                <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded tracking-wide uppercase">{jobData.location_type}</span>
                                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded tracking-wide uppercase">{formatDistanceToNow(new Date(jobData.created_at))} ago</span>
                              </div>
                            </div>
                            <span className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold text-center">View Job</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
                        No active job openings.
                      </div>
                    )
                 )}

                 {activeTab === 'reviews' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                       <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
                         <button className="text-blue-600 font-bold hover:text-blue-800">Write a Review</button>
                       </div>
                       
                       {tabsData.reviews.length > 0 ? (
                         <div className="space-y-6">
                           {tabsData.reviews.map((rev: any) => (
                             <div key={rev.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                               <div className="flex gap-4">
                                 <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                   {rev.user?.avatar_url ? <img src={rev.user.avatar_url} className="w-full h-full object-cover"/> : null}
                                 </div>
                                 <div>
                                   <div className="flex items-center gap-2 mb-1">
                                     <h4 className="font-bold text-gray-900">{rev.user?.full_name || 'Anonymous User'}</h4>
                                     <span className="text-xs text-gray-400">&bull; {formatDistanceToNow(new Date(rev.created_at))} ago</span>
                                   </div>
                                   <div className="flex gap-0.5 mb-2">
                                     {[...Array(5)].map((_, i) => (
                                       <Star key={i} className={`w-4 h-4 ${Math.floor(rev.rating) > i ? 'fill-yellow-400 text-yellow-500' : 'fill-gray-100 text-gray-200'}`} />
                                     ))}
                                   </div>
                                   <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
                       )}
                    </div>
                 )}

              </div>
           </div>

           {/* Sidebar Info */}
           <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Business Hours</h3>
                
                <div className="flex items-center gap-2 mb-4">
                  {isOpen ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Open Now</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">Closed</span>
                  )}
                </div>

                {business.hours ? (
                  <ul className="space-y-3">
                    {daysOfWeek.map(day => {
                      const h = business.hours[day]
                      const isToday = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase() === day
                      return (
                        <li key={day} className={`flex justify-between text-sm ${isToday ? 'font-bold text-blue-600 bg-blue-50/50 p-2 -mx-2 rounded-md' : 'text-gray-600 font-medium'}`}>
                          <span className="capitalize">{day.substring(0,3)}</span>
                          <span>{h?.closed ? 'Closed' : `${h?.open || ''} - ${h?.close || ''}`}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 font-medium">Hours not available.</p>
                )}
              </div>

              {business.latitude && business.longitude && (
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative h-64">
                   <Map center={[business.latitude, business.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                     <Marker position={[business.latitude, business.longitude]} />
                   </Map>
                </div>
              )}

           </div>

        </div>

      </div>
    </div>
  )
}
