'use client'

import React, { useState, useEffect } from 'react'
import { useJobs, JobFilters } from '@/hooks/useJobs'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Briefcase, Search, Filter, X, MapPin, Clock, DollarSign, Building2, Heart, PlusCircle, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, formatDistance, isBefore, addDays } from 'date-fns'

export default function JobsClientListing({ categories, districts }: any) {
  const { user } = useAuth()
  
  const [filters, setFilters] = useState<JobFilters>({
    sort: 'newest',
    jobType: [],
    locationType: '',
    experience: [],
    districts: []
  })
  
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const { jobs, loading, hasMore, loadMore, fetchJobs } = useJobs({ ...filters, search: activeSearch })

  useEffect(() => {
    fetchJobs({ reset: true, activeFilters: { ...filters, search: activeSearch } })
  }, [filters, activeSearch, fetchJobs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(searchInput)
  }

  const handleArrayFilter = (key: keyof JobFilters, value: string) => {
    setFilters(prev => {
      const arr = (prev[key] as string[]) || []
      const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      return { ...prev, [key]: newArr }
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-8">
         <div>
           <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
             <span className="p-3 bg-blue-100 rounded-2xl shadow-sm border border-blue-200 block">
               <Briefcase className="w-8 h-8 text-blue-600" />
             </span>
             Job Board
           </h1>
           <p className="text-gray-500 mt-3 text-lg">Find your next career opportunity in Nepal.</p>
         </div>

         <div className="flex flex-col sm:flex-row gap-3">
           <Link href={user ? "/dashboard/jobs/new" : "/login"} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2">
             <PlusCircle className="w-5 h-5" /> Post a Job
           </Link>
         </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 mb-8 flex items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center pl-4 pr-2 py-2">
          <Search className="w-6 h-6 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search by job title or company name..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-gray-900 text-lg"
          />
          <button type="submit" className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition ml-2">Search</button>
        </form>
        <button onClick={() => setIsMobileFiltersOpen(true)} className="lg:hidden p-3 bg-gray-100 rounded-xl text-gray-600 ml-2">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS */}
        <aside className={`lg:w-72 flex-shrink-0 ${isMobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
           <div className="flex justify-between items-center lg:hidden mb-6">
             <h2 className="text-xl font-bold">Filters</h2>
             <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X className="w-5 h-5" /></button>
           </div>

           <div className="space-y-8">
             
             {/* Sort */}
             <div className="lg:hidden">
               <h3 className="font-semibold text-gray-900 mb-3 block">Sort By</h3>
               <select value={filters.sort} onChange={e=>setFilters({...filters, sort: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700">
                 <option value="newest">Newest First</option>
                 <option value="salary_desc">Highest Salary</option>
                 <option value="deadline_asc">Closing Soon</option>
               </select>
             </div>

             {/* Job Type */}
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Job Type</h3>
               <div className="space-y-2">
                 {['FULL-TIME', 'PART-TIME', 'FREELANCE', 'CONTRACT', 'INTERNSHIP'].map(type => (
                   <label key={type} className="flex items-center gap-3 cursor-pointer">
                     <input type="checkbox" checked={filters.jobType?.includes(type)} onChange={() => handleArrayFilter('jobType', type)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300" />
                     <span className="text-sm text-gray-700 capitalize">{type.toLowerCase()}</span>
                   </label>
                 ))}
               </div>
             </div>

             {/* Location Type */}
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Work Model</h3>
               <div className="flex flex-col gap-2">
                 {[{id:'', label:'Any'}, {id:'ON-SITE', label:'On-site'}, {id:'REMOTE', label:'Remote'}, {id:'HYBRID', label:'Hybrid'}].map(type => (
                   <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                     <input type="radio" checked={filters.locationType === type.id} onChange={() => setFilters({...filters, locationType: type.id})} className="text-blue-600 focus:ring-blue-500" />
                     <span className="text-sm text-gray-700">{type.label}</span>
                   </label>
                 ))}
               </div>
             </div>

             {/* Experience */}
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Experience Level</h3>
               <div className="flex flex-wrap gap-2">
                 {['Entry', 'Mid', 'Senior', 'Executive'].map(level => {
                    const isSelected = filters.experience?.includes(level.toUpperCase())
                    return (
                      <button 
                        key={level} 
                        onClick={() => handleArrayFilter('experience', level.toUpperCase())}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {level}
                      </button>
                    )
                 })}
               </div>
             </div>

             {/* Category */}
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
               <select value={filters.category || ''} onChange={e=>setFilters({...filters, category: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-700">
                 <option value="">All Categories</option>
                 {categories.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
             </div>

             {/* District */}
             <div>
               <h3 className="font-semibold text-gray-900 mb-3">District (Location)</h3>
               <select 
                 className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
                 onChange={(e) => {
                   const val = e.target.value
                   if (!val) setFilters({...filters, districts: []})
                   else handleArrayFilter('districts', val)
                 }}
               >
                 <option value="">All Districts</option>
                 {districts.map((d:any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
               </select>
               
               {/* Selected Badges */}
               {filters.districts?.length ? (
                 <div className="flex flex-wrap gap-2 mt-3">
                   {filters.districts.map(dId => {
                     const dName = districts.find((x:any)=>x.id.toString()===dId)?.name_en
                     return (
                       <span key={dId} className="bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2 py-1 rounded flex items-center gap-1">
                         {dName} <button onClick={() => handleArrayFilter('districts', dId)}><X className="w-3 h-3 hover:text-red-500"/></button>
                       </span>
                     )
                   })}
                 </div>
               ) : null}
             </div>

           </div>
           
           <div className="lg:hidden mt-8">
             <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl">View Results</button>
           </div>
        </aside>

        {/* MAIN JOBS LIST */}
        <div className="flex-1 min-w-0">
           
           <div className="hidden lg:flex justify-between items-center mb-6">
             <p className="text-gray-500 font-medium">{loading ? 'Searching...' : `Showing results`}</p>
             <div className="flex items-center gap-3">
               <span className="text-sm text-gray-500 font-medium">Sort by:</span>
               <select value={filters.sort} onChange={e=>setFilters({...filters, sort: e.target.value as any})} className="border-none bg-transparent font-bold text-gray-900 focus:outline-none focus:ring-0 cursor-pointer">
                 <option value="newest">Newest First</option>
                 <option value="salary_desc">Highest Salary</option>
                 <option value="deadline_asc">Closing Soon</option>
               </select>
             </div>
           </div>

           <div className="space-y-4">
              {loading && jobs.length === 0 ? (
                 <div className="py-20 text-center text-gray-400">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                 <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                   <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <h3 className="text-lg font-bold text-gray-900">No jobs found</h3>
                   <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                   <button onClick={() => setFilters({sort:'newest'})} className="mt-4 text-blue-600 font-semibold">Clear all filters</button>
                 </div>
              ) : (
                 jobs.map(job => {
                   const postedAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
                   const isCloserDl = job.deadline && isBefore(new Date(job.deadline), addDays(new Date(), 3))
                   const deadlineStr = job.deadline ? `Closes in ${formatDistance(new Date(job.deadline), new Date())}` : 'No deadline'
                   
                   return (
                     <div key={job.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 hover:shadow-md transition group flex flex-col md:flex-row gap-5">
                        
                        <div className="w-16 h-16 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           {job.business?.logo_url ? <img src={job.business.logo_url} className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-gray-300" />}
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-1">
                             <Link href={`/jobs/${job.slug}`} className="block">
                               <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition truncate">{job.title}</h3>
                             </Link>
                             <button className="hidden md:block text-gray-400 hover:text-red-500 transition tooltip-trigger" title="Save Job">
                               <Heart className="w-5 h-5" />
                             </button>
                           </div>

                           <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                             <span className="font-semibold text-gray-900 flex items-center"><Building2 className="w-4 h-4 mr-1.5 text-gray-400"/> {job.business?.name}</span>
                             <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-gray-400"/> {(job.business?.city || 'Nepal')} ({job.location_type})</span>
                             <span className="flex items-center"><DollarSign className="w-4 h-4 text-gray-400"/> {job.show_salary && job.salary_min ? `₨ ${job.salary_min.toLocaleString()} - ₨ ${job.salary_max?.toLocaleString()}` : 'Negotiable'}</span>
                           </div>

                           <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-0">
                              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">{job.job_type || 'FULL-TIME'}</span>
                              <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">{job.experience_level || 'ANY LEVEL'}</span>
                           </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
                           <div className="text-right flex flex-col items-start md:items-end w-full md:w-auto">
                              <span className="text-xs text-gray-500 font-medium mb-1">Posted {postedAgo}</span>
                              {job.deadline && (
                                <span className={`text-xs font-bold flex items-center gap-1 ${isCloserDl ? 'text-red-600' : 'text-orange-500'}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  {deadlineStr}
                                </span>
                              )}
                           </div>
                           <Link href={`/jobs/${job.slug}`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-sm whitespace-nowrap mt-auto">
                             View Details
                           </Link>
                        </div>

                     </div>
                   )
                 })
              )}
           </div>

           {hasMore && !loading && (
             <div className="mt-8 text-center">
               <button onClick={loadMore} className="bg-white border border-gray-200 text-gray-700 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm">
                 Load More Jobs
               </button>
             </div>
           )}

        </div>
      </div>
    </div>
  )
}
