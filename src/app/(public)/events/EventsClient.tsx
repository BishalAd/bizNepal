'use client'

import React, { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, Filter, X, Grid, LayoutList } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from 'date-fns'

export default function EventsClient({ initialEvents, districts, searchParams }: any) {
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
  const [activeType, setActiveType] = useState('all')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [isFreeOnly, setIsFreeOnly] = useState(false)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const eventTypes = ['Workshop', 'Concert', 'Festival', 'Sports', 'Community']

  const filteredEvents = useMemo(() => {
    let result = [...initialEvents]
    
    if (activeType !== 'all') {
      result = result.filter(e => e.event_type === activeType)
    }
    if (selectedDistrict) {
      result = result.filter(e => e.district_id?.toString() === selectedDistrict)
    }
    if (isFreeOnly) {
      result = result.filter(e => e.is_free === true)
    }

    return result
  }, [initialEvents, activeType, selectedDistrict, isFreeOnly])

  // Calendar rendering logic
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const startingDayIndex = getDay(startOfMonth(currentMonth))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-3 bg-purple-100 rounded-2xl shadow-sm border border-purple-200 block">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </span>
            Upcoming Events
          </h1>
          <p className="text-gray-500 mt-3 text-lg">Discover workshops, concerts, and gatherings in Nepal.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
             <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition ${viewMode === 'grid' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}>
               <Grid className="w-4 h-4" /> Cards
             </button>
             <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition ${viewMode === 'calendar' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:text-gray-900'}`}>
               <CalendarIcon className="w-4 h-4" /> Calendar
             </button>
           </div>
           
           <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-medium shadow-sm">
             <Filter className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className={`md:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
           <div className="flex justify-between items-center md:hidden mb-6">
             <h2 className="text-xl font-bold">Filter Events</h2>
             <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
           </div>

           <div className="space-y-8">
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Event Type</h3>
               <div className="flex flex-col gap-2">
                 <button onClick={() => { setActiveType('all'); setIsMobileFilterOpen(false); }} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeType === 'all' ? 'bg-purple-50 flex-1 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}>All Events</button>
                 {eventTypes.map(type => (
                   <button key={type} onClick={() => { setActiveType(type); setIsMobileFilterOpen(false); }} className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeType === type ? 'bg-purple-50 flex-1 text-purple-700 border border-purple-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}>{type}</button>
                 ))}
               </div>
             </div>

             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
               <label className="flex items-center gap-3 cursor-pointer">
                 <input type="checkbox" checked={isFreeOnly} onChange={(e) => setIsFreeOnly(e.target.checked)} className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded border-gray-300" />
                 <span className="font-medium text-gray-900">Free Events Only</span>
               </label>
             </div>

             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
               <select value={selectedDistrict} onChange={(e) => {setSelectedDistrict(e.target.value); setIsMobileFilterOpen(false)}} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 font-medium">
                 <option value="">All Locations & Online</option>
                 {districts.map((d: any) => (
                   <option key={d.id} value={d.id}>{d.name_en}</option>
                 ))}
               </select>
             </div>
           </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          
          {viewMode === 'grid' && (
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No events found</h3>
                    <p className="text-gray-500">Try adjusting your filters.</p>
                  </div>
                ) : (
                  filteredEvents.map((evt: any) => (
                    <EventCard key={evt.id} event={{...evt, district: evt.district_info?.name_en}} />
                  ))
                )}
             </div>
          )}

          {viewMode === 'calendar' && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between p-6 border-b border-gray-100">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-5 py-2 hover:bg-gray-100 rounded-lg font-semibold text-gray-600">&larr; Prev</button>
                <h2 className="text-2xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-5 py-2 hover:bg-gray-100 rounded-lg font-semibold text-gray-600">Next &rarr;</button>
              </div>

              <div className="w-full grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="w-full grid grid-cols-7 gap-px bg-gray-200">
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50/50 min-h-[120px] p-2"></div>
                ))}
                
                {daysInMonth.map((day, i) => {
                  const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.starts_at), day))
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div key={day.toISOString()} className={`min-h-[120px] p-2 bg-white transition hover:bg-purple-50/30 ${!isSameMonth(day, currentMonth) ? 'opacity-50' : ''}`}>
                      <div className={`font-semibold text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-purple-600 text-white' : 'text-gray-700'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((evt: any) => (
                          <div key={evt.id} className="text-xs p-1.5 rounded bg-purple-100 text-purple-800 border border-purple-200 truncate font-medium shadow-sm" title={evt.title}>
                            {format(new Date(evt.starts_at), 'h:mm a')} - {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
