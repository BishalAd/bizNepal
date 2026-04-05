'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Users, Briefcase, ChevronRight, Download, FileText, CheckCircle2, 
  XCircle, Filter, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, FileDown, Search 
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { StatusBadge } from '@/components/dashboard/shared/DashboardShared'

export default function ApplicationsClient({ initialJobs }: any) {
  const supabase = createClient()
  const [jobs, setJobs] = useState(initialJobs)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialJobs?.[0]?.id || null)
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [expandedCoverLetterId, setExpandedCoverLetterId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedJob = useMemo(() => jobs.find((j:any) => j.id === selectedJobId), [jobs, selectedJobId])

  const applications = useMemo(() => {
    if (!selectedJob) return []
    let filtered = selectedJob.job_applications || []
    
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter((a:any) => a.status === activeStatusFilter)
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((a:any) => 
        a.applicant_name?.toLowerCase().includes(q) || 
        a.applicant_email?.toLowerCase().includes(q)
      )
    }
    
    return filtered
  }, [selectedJob, activeStatusFilter, searchQuery])

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setJobs((prev:any) => prev.map((j:any) => j.id === selectedJobId ? {
      ...j,
      job_applications: j.job_applications.map((a:any) => a.id === appId ? { ...a, status: newStatus } : a)
    } : j))

    try {
       const { error } = await supabase.from('job_applications').update({ status: newStatus }).eq('id', appId)
       if (error) throw error
       toast.success(`Application marked as ${newStatus}`)
    } catch {
       toast.error('Failed to update status')
    }
  }

  const handleNotesUpdate = async (appId: string, notes: string) => {
    try {
      const { error } = await supabase.from('job_applications').update({ notes }).eq('id', appId)
      if (error) throw error
      setJobs((prev:any) => prev.map((j:any) => j.id === selectedJobId ? {
        ...j, job_applications: j.job_applications.map((a:any) => a.id === appId ? { ...a, notes } : a)
      } : j))
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    }
  }

  const handleBulkAction = async (actionStatus: string) => {
    if (selectedApps.size === 0) return
    const idsToUpdate = Array.from(selectedApps)
    
    // Optimistic UI
    setJobs((prev:any) => prev.map((j:any) => j.id === selectedJobId ? {
      ...j,
      job_applications: j.job_applications.map((a:any) => idsToUpdate.includes(a.id) ? { ...a, status: actionStatus } : a)
    } : j))
    
    try {
      const { error } = await supabase.from('job_applications').update({ status: actionStatus }).in('id', idsToUpdate)
      if (error) throw error
      toast.success(`Bulk updated ${idsToUpdate.length} candidates to ${actionStatus}`)
      setSelectedApps(new Set())
    } catch {
      toast.error('Failed bulk update')
    }
  }

  const handleDownloadAllCVs = async () => {
     if (!selectedJob || applications.length === 0) return
     const toastId = toast.loading('Packaging CVs in a ZIP file...')
     
     try {
       const zip = new JSZip()
       const folder = zip.folder(`${selectedJob.title.replace(/[^a-z0-9]/gi, '_')}_CVs`)
       
       const downloadPromises = applications.filter((a:any) => a.resume_url).map(async (app:any) => {
          // Since URLs are public or signed, fetch them as blobs
          const res = await fetch(app.resume_url)
          if (!res.ok) return
          const blob = await res.blob()
          const ext = app.resume_url.split('.').pop()?.split('?')[0] || 'pdf'
          folder?.file(`${app.applicant_name.replace(/[^a-z0-9]/gi, '_')}_CV.${ext}`, blob)
       })
       
       await Promise.all(downloadPromises)
       const content = await zip.generateAsync({ type: 'blob' })
       saveAs(content, `BizNepal_CVs_${selectedJob.title}.zip`)
       toast.success('ZIP Downloaded!', { id: toastId })
     } catch (err) {
       toast.error('Failed to download CVs', { id: toastId })
     }
  }

  const exportCSV = () => {
    if (!applications.length) return
    let csv = "Name,Email,Phone,Applied Date,Status\n"
    applications.forEach((a:any) => {
       csv += `"${a.applicant_name}","${a.applicant_email}","${a.applicant_phone}","${format(new Date(a.created_at), 'yyyy-MM-dd')}","${a.status}"\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${selectedJob.title}_Applicants.csv`)
    toast.success('Exported to CSV')
  }


  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col h-[calc(100vh-80px)] pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Applications Inbox</h1>
            <p className="text-gray-500 mt-1">Review candidates, track hiring pipelines, and download CVs.</p>
          </div>
        </div>

        {/* Layout */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-[600px]">
           
           {/* Left Sidebar - Job List */}
           <div className="w-full md:w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                 <h2 className="font-bold text-gray-900 flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-400"/> Your Job Postings</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                 {jobs.map((j:any) => {
                    const totalCount = j.job_applications?.length || 0
                    const newCount = j.job_applications?.filter((a:any)=>a.status==='new').length || 0
                    const isSelected = selectedJobId === j.id
                    
                    return (
                      <div 
                        key={j.id} 
                        onClick={() => setSelectedJobId(j.id)}
                        className={`p-4 cursor-pointer transition-colors relative border-l-4 ${isSelected ? 'bg-purple-50/50 border-purple-600' : 'hover:bg-gray-50 border-transparent'} group`}
                      >
                         <div className="flex justify-between items-start mb-1">
                           <h3 className={`font-bold text-sm line-clamp-2 pr-4 ${isSelected ? 'text-purple-900' : 'text-gray-800 group-hover:text-purple-700'}`}>{j.title}</h3>
                           <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${isSelected ? 'text-purple-600 translate-x-1' : 'text-gray-300'}`}/>
                         </div>
                         <div className="flex items-center gap-3 mt-2">
                           <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Users className="w-3.5 h-3.5"/> {totalCount} Candidates</span>
                           {newCount > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">{newCount} New</span>}
                         </div>
                      </div>
                    )
                 })}
                 {jobs.length === 0 && (
                   <div className="p-8 text-center text-gray-400 font-bold text-sm">No job postings found.</div>
                 )}
              </div>
           </div>

           {/* Right Panel - Applications Grid */}
           <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              
              {/* Header Bar */}
              {selectedJob ? (
                 <div className="p-5 border-b border-gray-100 bg-white z-10">
                   <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                     <div>
                       <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{selectedJob.title}</h2>
                       <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">
                         Hiring Pipeline • <span className="text-purple-600">{selectedJob.job_applications?.length || 0} Total</span>
                       </p>
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative group w-full xl:w-64">
                           <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                           <input 
                             type="text" 
                             placeholder="Search candidate..." 
                             value={searchQuery}
                             onChange={e => setSearchQuery(e.target.value)}
                             className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:ring-4 focus:ring-purple-50 focus:border-purple-500 outline-none transition-all"
                           />
                        </div>

                        {/* Filter Dd */}
                        <div className="relative group">
                           <select value={activeStatusFilter} onChange={e=>setActiveStatusFilter(e.target.value)} className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl pl-4 pr-10 py-2.5 outline-none cursor-pointer hover:bg-gray-100 transition focus:border-purple-500">
                             <option value="all">📊 All</option>
                             <option value="new">🆕 New</option>
                             <option value="reviewed">👀 Reviewed</option>
                             <option value="shortlisted">⭐ Shortlisted</option>
                             <option value="rejected">❌ Rejected</option>
                             <option value="hired">🎉 Hired</option>
                           </select>
                           <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none"/>
                        </div>
                        
                        {/* Selected Bulk Actions */}
                        {selectedApps.size > 0 && (
                          <div className="flex animate-in fade-in slide-in-from-right-4 duration-300">
                             <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-4 py-2.5 rounded-l-xl flex items-center border border-r-0 border-purple-200 uppercase">
                               {selectedApps.size} Selected
                             </span>
                             <button onClick={()=>handleBulkAction('shortlisted')} className="bg-white border-y border-gray-200 px-4 py-2.5 text-xs font-black uppercase hover:bg-green-50 hover:text-green-700 transition">Shortlist</button>
                             <button onClick={()=>handleBulkAction('rejected')} className="bg-white border text-red-600 border-gray-200 px-4 py-2.5 text-xs font-black uppercase hover:bg-red-50 rounded-r-xl transition">Reject</button>
                          </div>
                        )}

                        <div className="flex rounded-xl overflow-hidden border border-gray-200 ml-auto">
                           <button onClick={exportCSV} className="bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-black uppercase text-gray-700 border-r border-gray-200 flex items-center gap-1.5 transition" title="Export CSV Data"><FileText className="w-4 h-4"/> CSV</button>
                           <button onClick={handleDownloadAllCVs} className="bg-white hover:bg-gray-50 px-4 py-2.5 text-xs font-black uppercase text-gray-700 flex items-center gap-1.5 transition" title="Download all PDFs as ZIP"><FileDown className="w-4 h-4"/> ZIP CVs</button>
                        </div>
                     </div>
                   </div>
                 </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                   <Users className="w-16 h-16 mb-4 text-gray-200" />
                   <p className="font-bold text-lg text-gray-500">No Job Selected</p>
                   <p className="text-sm">Select a job posting from the left panel.</p>
                </div>
              )}

              {/* Scrollable Applications List */}
              {selectedJob && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
                   {applications.length === 0 ? (
                      <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-white xl:mx-auto xl:max-w-2xl">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-600 text-lg uppercase tracking-widest">Inbox Empty</h3>
                        <p className="text-gray-400 text-sm font-bold mt-2">No applications match your current filters.</p>
                      </div>
                   ) : (
                      <div className="grid lg:grid-cols-2 gap-4">
                        {applications.map((app:any) => {
                           const isSelected = selectedApps.has(app.id)
                           const isExpandedCoverLetter = expandedCoverLetterId === app.id

                           return (
                             <div key={app.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-gray-200 hover:border-purple-200'}`}>
                                
                                {/* Top header with Checkbox & Status Dropdown */}
                                <div className="flex justify-between items-start mb-4">
                                   <div className="flex gap-4">
                                      <div className="pt-1">
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected} 
                                          onChange={(e) => {
                                             const newSet = new Set(selectedApps)
                                             if (e.target.checked) newSet.add(app.id)
                                             else newSet.delete(app.id)
                                             setSelectedApps(newSet)
                                          }}
                                          className="w-5 h-5 text-purple-600 rounded cursor-pointer" 
                                        />
                                      </div>
                                      
                                      <div className="flex gap-3">
                                         <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black text-lg flex items-center justify-center uppercase shrink-0">
                                            {app.applicant_name?.charAt(0) || '?'}
                                         </div>
                                         <div>
                                            <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{app.applicant_name}</h3>
                                            <p className="text-xs font-bold text-gray-400 mt-0.5">Applied {formatDistanceToNow(new Date(app.created_at))} ago</p>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2">
                                      <StatusBadge status={app.status} />
                                      <div className="relative group">
                                         <select 
                                           value={app.status} 
                                           onChange={e=>handleStatusChange(app.id, e.target.value)}
                                           onClick={e=>e.stopPropagation()}
                                           className="text-[10px] font-black appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-200 cursor-pointer outline-none transition bg-white hover:bg-gray-50 uppercase tracking-widest"
                                         >
                                           <option value="new">🆕 New</option>
                                           <option value="reviewed">👀 Reviewed</option>
                                           <option value="shortlisted">⭐ Shortlisted</option>
                                           <option value="hired">🎉 Hired</option>
                                           <option value="rejected">❌ Rejected</option>
                                         </select>
                                         <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2 pointer-events-none"/>
                                      </div>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-2.5 mb-5 pb-5 border-b border-gray-100">
                                  <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-2.5 text-sm font-bold text-gray-600 hover:text-purple-600 transition w-max">
                                     <Phone className="w-4 h-4 shrink-0 text-gray-400"/> {app.applicant_phone}
                                  </a>
                                  <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-2.5 text-sm font-bold text-gray-600 hover:text-purple-600 transition w-max">
                                     <Mail className="w-4 h-4 shrink-0 text-gray-400"/> <span className="truncate max-w-[200px]">{app.applicant_email}</span>
                                  </a>
                                </div>

                                {/* Actions & Cover Letter Toggle */}
                                <div className="space-y-4">
                                   <div className="flex gap-2">
                                     <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-center py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
                                        <Download className="w-4 h-4"/> Get CV
                                     </a>
                                     <a href={`https://wa.me/977${app.applicant_phone}?text=${encodeURIComponent(`Hi ${app.applicant_name}, regarding your BizNepal application for ${selectedJob.title}: `)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 text-center py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
                                        <MessageCircle className="w-4 h-4"/> WhatsApp
                                     </a>
                                   </div>

                                   {app.cover_letter && (
                                     <button 
                                       onClick={() => setExpandedCoverLetterId(isExpandedCoverLetter ? null : app.id)} 
                                       className="w-full bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg flex items-center justify-between px-4 transition"
                                     >
                                        <span className="flex items-center gap-1.5 text-blue-600"><FileText className="w-3.5 h-3.5"/> Read Cover Letter</span>
                                        {isExpandedCoverLetter ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                     </button>
                                   )}

                                   {isExpandedCoverLetter && (
                                     <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl text-sm text-gray-800 leading-relaxed font-medium animate-in slide-in-from-top-2 duration-200">
                                        "{app.cover_letter}"
                                     </div>
                                   )}

                                   <div>
                                      <textarea 
                                        placeholder="Private note (not visible to candidate)..." 
                                        className="w-full rounded-xl bg-gray-50 border border-transparent focus:border-purple-200 focus:bg-white focus:ring-4 focus:ring-purple-50 text-sm p-3 font-medium outline-none resize-none transition h-[60px]"
                                        defaultValue={app.notes || ''}
                                        onBlur={(e) => {
                                          if(e.target.value !== app.notes) handleNotesUpdate(app.id, e.target.value)
                                        }}
                                      ></textarea>
                                   </div>
                                </div>
                             </div>
                           )
                        })}
                      </div>
                   )}
                </div>
              )}
           </div>

        </div>
      </div>
    </>
  )
}
