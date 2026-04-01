'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Briefcase, MapPin, Globe, CheckCircle2, Monitor, AlertCircle, Edit, Trash2, XCircle } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function JobsClient({ initialJobs }: any) {
  const supabase = createClient()
  const [jobs, setJobs] = useState(initialJobs)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active')

  const stats = useMemo(() => {
    let unreadApps = 0
    let totalApps = 0
    
    jobs.forEach((j:any) => {
      totalApps += (j.job_applications?.length || 0)
      j.job_applications?.forEach((app:any) => {
        if (app.status === 'new') unreadApps++
      })
    })

    const active = jobs.filter((j:any) => j.status === 'active' && !isPast(new Date(j.deadline)))
    const closed = jobs.filter((j:any) => j.status !== 'active' || isPast(new Date(j.deadline)))

    return { totalApps, unreadApps, open: active, closed }
  }, [jobs])

  const displayJobs = activeTab === 'active' ? stats.open : stats.closed

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job circular permanently? Candidate data will be retained in your inbox but unlinked from the posting.")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
      setJobs(jobs.filter((j:any) => j.id !== id))
      toast.success("Job posting deleted")
    } catch {
      toast.error("Failed to delete job posting")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleCloseJob = async (id: string) => {
    if (!confirm("Stop accepting new applications?")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('jobs').update({ status: 'closed' }).eq('id', id)
      if (error) throw error
      setJobs(jobs.map((j:any) => j.id === id ? { ...j, status: 'closed' } : j))
      toast.success("Job posting closed")
    } catch {
      toast.error("Failed to close job posting")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Careers & Hiring</h1>
            <p className="text-gray-500 mt-1">Manage job openings and track applicant pipeline.</p>
          </div>
          <Link href="/dashboard/jobs/new" className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm whitespace-nowrap">
             <Plus className="w-5 h-5 mr-2" /> Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Open Positions" value={stats.open.length} icon={<Briefcase className="w-6 h-6" />} color="purple" />
          <StatsCard title="Total Applications" value={stats.totalApps} icon={<Monitor className="w-6 h-6" />} color="blue" />
          <StatsCard title="Unread Applications" value={stats.unreadApps} icon={<AlertCircle className="w-6 h-6" />} color="red" />
          <StatsCard title="Closed Postings" value={stats.closed.length} icon={<CheckCircle2 className="w-6 h-6" />} color="gray" />
        </div>

        {/* Main List Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
          
          <div className="px-6 pt-6 border-b border-gray-100 flex gap-6">
             <button onClick={()=>setActiveTab('active')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'active' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
                Active Openings <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>{stats.open.length}</span>
             </button>
             <button onClick={()=>setActiveTab('closed')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'closed' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
               Closed / Expired <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'closed' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>{stats.closed.length}</span>
             </button>
          </div>

          <div className="p-0 sm:p-6">
            {displayJobs.length === 0 ? (
               <div className="py-16 text-center border-0 sm:border-2 border-dashed border-gray-100 sm:rounded-3xl m-6 sm:m-0">
                 <div className="w-16 h-16 bg-purple-50 text-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Briefcase className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">No {activeTab} job postings</h3>
                 <p className="text-gray-500 mb-6">Attract top talent in Nepal by posting an opening.</p>
                 <Link href="/dashboard/jobs/new" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-lg font-bold transition inline-flex items-center">
                   <Plus className="w-4 h-4 mr-2" /> Post a Job
                 </Link>
               </div>
            ) : (
               <div className="divide-y divide-gray-100 sm:divide-none sm:grid lg:grid-cols-2 sm:gap-6">
                 {displayJobs.map((j:any) => {
                   const totalApps = j.job_applications?.length || 0
                   const newApps = j.job_applications?.filter((a:any) => a.status === 'new').length || 0
                   
                   return (
                     <div key={j.id} className={`bg-white p-5 sm:p-6 sm:border sm:rounded-2xl transition group ${activeTab === 'closed' ? 'sm:border-gray-200 opacity-80' : 'sm:border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200'}`}>
                        
                        <div className="flex justify-between items-start mb-3">
                           <div>
                             <h3 className="font-extrabold text-gray-900 text-lg leading-tight mb-1">{j.title}</h3>
                             <p className="text-xs font-bold text-gray-400 capitalize">{j.job_type.replace('_', ' ')} • Opened {format(new Date(j.created_at), 'MMM d, yyyy')}</p>
                           </div>
                           {newApps > 0 && (
                             <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-2 py-1 rounded shadow-sm whitespace-nowrap animate-pulse">
                               {newApps} NEW APPS
                             </span>
                           )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm font-bold text-gray-500 mb-6">
                           <span className="flex items-center gap-1.5 text-blue-600">
                             {j.location_type === 'remote' ? <Globe className="w-4 h-4"/> : <MapPin className="w-4 h-4"/>} 
                             {j.location_type === 'remote' ? 'Remote' : j.district || 'On-site'}
                           </span>
                           <span className="flex items-center gap-1.5 text-orange-600">
                             <AlertCircle className="w-4 h-4"/> Closes {format(new Date(j.deadline), 'MMM d')}
                           </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100">
                           <div className="flex gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                <p className="font-extrabold text-gray-900 text-xl">{totalApps}</p>
                              </div>
                              <div className="w-px h-10 bg-gray-200"></div>
                              <div>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Unread</p>
                                <p className="font-extrabold text-red-600 text-xl">{newApps}</p>
                              </div>
                           </div>
                           
                           {/* Quick Actions */}
                           <div className="flex items-center gap-1.5">
                              {activeTab === 'active' && (
                                <button onClick={() => handleCloseJob(j.id)} disabled={loadingAction===j.id} className="p-2 text-gray-500 hover:text-orange-600 bg-white border border-gray-200 hover:bg-orange-50 rounded-lg transition" title="Close Applications"><XCircle className="w-4 h-4"/></button>
                              )}
                              <Link href={`/dashboard/jobs/${j.id}/edit`} className="p-2 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:bg-blue-50 rounded-lg transition" title="Edit Job"><Edit className="w-4 h-4"/></Link>
                              <button onClick={() => handleDelete(j.id)} disabled={loadingAction===j.id} className="p-2 text-gray-500 hover:text-red-600 bg-white border border-gray-200 hover:bg-red-50 rounded-lg transition" title="Delete Permanently"><Trash2 className="w-4 h-4"/></button>
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
    </>
  )
}
