'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, MapPin, Clock, DollarSign, Globe, Briefcase, X, UploadCloud, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

export default function JobDetailClient({ job, companyJobs, relatedJobs }: any) {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    confirmAccurate: false
  })
  const [cvFile, setCvFile] = useState<File | null>(null)

  // Sync user/profile data once loaded
  useEffect(() => {
    if (!formData.name && (profile?.full_name || user?.user_metadata?.full_name)) {
      setFormData(prev => ({ ...prev, name: profile?.full_name || user?.user_metadata?.full_name }))
    }
    if (!formData.email && user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
    if (!formData.phone && profile?.phone) {
      setFormData(prev => ({ ...prev, phone: profile.phone }))
    }
  }, [user, profile])

  const postedAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true })

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cvFile) {
      toast.error("Please upload your CV (PDF format).")
      return
    }
    if (!formData.confirmAccurate) {
      toast.error("You must confirm the information is accurate.")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Upload CV to Supabase Storage
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `cvs/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('biznepal-cvs')
        .upload(filePath, cvFile, { cacheControl: '3600', upsert: false })

      if (uploadError) {
         // Create bucket if it doesn't exist just in case (Normally done via migrations)
         if (uploadError.message.includes("Bucket not found")) {
            await supabase.storage.createBucket('biznepal-cvs', { public: false })
            const { error: retryError } = await supabase.storage.from('biznepal-cvs').upload(filePath, cvFile)
            if (retryError) throw retryError
         } else {
            throw uploadError
         }
      }

      // Get public URL or just store the path (since it might be private)
      // Actually let's assume it's private and we use signed URLs later, but for this demo:
      const cvUrl = supabase.storage.from('biznepal-cvs').getPublicUrl(filePath).data.publicUrl

      // 2. Insert Application
      const applicationPayload = {
        job_id: job.id,
        business_id: job.business_id,
        applicant_id: user?.id || null,
        applicant_name: formData.name,
        applicant_email: formData.email,
        applicant_phone: formData.phone,
        cv_url: cvUrl,
        cover_letter: formData.coverLetter,
        status: 'new'
      }

      const { error: insertError } = await supabase.from('job_applications').insert(applicationPayload)
      if (insertError) throw insertError

      // 3. Trigger Webhook through secure Server Action
      const { triggerInteractionWebhook } = await import('@/app/_actions/postWebhooks')
      const whResult = await triggerInteractionWebhook('job-application', { 
        jobId: job.id, 
        jobTitle: job.title,
        businessId: job.business_id,
        businessName: job.business?.name,
        businessEmail: job.business?.email,
        applicantName: formData.name,
        applicantPhone: formData.phone,
        applicantEmail: formData.email,
        applicantUserId: user?.id,
        cvUrl: cvUrl
      })

      if (!whResult.success) {
        console.error('Job webhook failed:', whResult.error)
      }

      setIsSuccess(true)
      toast.success("Application Submitted Successfully!")

    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const JobCardCompact = ({ jobData }: { jobData: any }) => (
    <Link href={`/jobs/${jobData.slug}`} className="block bg-white border border-gray-100 p-4 rounded-xl hover:shadow-md hover:border-blue-100 transition group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
          {jobData.business?.logo_url ? <img src={jobData.business.logo_url} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-gray-400"/>}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 truncate">{jobData.title}</h4>
          <p className="text-xs text-gray-500">{jobData.business?.name}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{jobData.job_type}</span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{jobData.location_type}</span>
      </div>
    </Link>
  )

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-24 bg-blue-900/5"></div>
           
           <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6 z-10 pt-4">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                   {job.business?.logo_url ? <img src={job.business.logo_url} className="w-full h-full object-contain p-2" /> : <Building2 className="w-10 h-10 text-gray-300"/>}
                </div>
                <div>
                   <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
                   <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 font-medium mb-4">
                     <Link href={`/businesses/${job.business?.slug}`} className="flex items-center text-blue-600 hover:text-blue-800"><Building2 className="w-4 h-4 mr-1.5"/> {job.business?.name}</Link>
                     <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-gray-400"/> {job.business?.city || 'Nepal'}</span>
                     {job.business?.website && <a href={job.business.website} target="_blank" rel="noreferrer" className="flex items-center hover:text-gray-900"><Globe className="w-4 h-4 mr-1.5 text-gray-400"/> Website</a>}
                   </div>

                   <div className="flex flex-wrap items-center gap-3">
                     <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold uppercase tracking-wider">{job.job_type || 'FULL-TIME'}</span>
                     <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-bold uppercase tracking-wider">{job.location_type || 'ON-SITE'}</span>
                     <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold uppercase tracking-wider">{job.experience_level || 'ANY LEVEL'}</span>
                     <span className="text-sm text-gray-500 font-medium ml-2">Posted {postedAgo}</span>
                   </div>
                </div>
             </div>

             {/* Desktop Apply Button */}
             <div className="hidden lg:flex flex-col items-end min-w-[200px]">
               <button onClick={() => setShowApplyModal(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-md whitespace-nowrap">
                 Apply for this Job
               </button>
               {job.deadline && <p className="text-xs text-red-500 font-bold mt-2">Deadline: {format(new Date(job.deadline), 'MMM d, yyyy')}</p>}
             </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
               
               <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Description</h2>
               <div className="prose max-w-none text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                 {job.description}
               </div>

               {job.responsibilities && (
                 <>
                   <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Responsibilities</h3>
                   <div className="prose max-w-none text-gray-600 leading-relaxed mb-8 whitespace-pre-line">
                     {job.responsibilities}
                   </div>
                 </>
               )}

               {job.requirements && (
                 <>
                   <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Requirements & Qualifications</h3>
                   <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                     {job.requirements}
                   </div>
                 </>
               )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Job Overview</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><DollarSign className="w-5 h-5"/></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Salary</p>
                    <p className="font-bold text-gray-900">{job.show_salary && job.salary_min ? `₨ ${job.salary_min.toLocaleString()} ${job.salary_max ? `- ₨ ${job.salary_max.toLocaleString()}` : '+'}` : 'Negotiable'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5"/></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Location</p>
                    <p className="font-bold text-gray-900">{job.business?.address || job.business?.city || 'Nepal'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Briefcase className="w-5 h-5"/></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Category</p>
                    <p className="font-bold text-gray-900">
                      {Array.isArray(job.category) ? job.category[0]?.name_en : (job.category as any)?.name_en || 'Other'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {companyJobs?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Other jobs at {job.business?.name}</h3>
                <div className="space-y-3">
                  {companyJobs.map((cj: any) => <JobCardCompact key={cj.id} jobData={cj} />)}
                </div>
              </div>
            )}

            {relatedJobs?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Similar Jobs</h3>
                <div className="space-y-3">
                  {relatedJobs.map((rj: any) => <JobCardCompact key={rj.id} jobData={rj} />)}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Sticky Apply Button */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pb-safe">
        <button onClick={() => setShowApplyModal(true)} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm text-center">
          Apply for this Job
        </button>
      </div>

      {/* APPLICATION MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-xl animate-in fade-in zoom-in duration-200 custom-scrollbar">
            
            {isSuccess ? (
              <div className="p-8 md:p-12 text-center text-gray-900">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle2 className="w-10 h-10 text-green-600" />
                 </div>
                 <h3 className="text-3xl font-extrabold mb-4">Application Submitted!</h3>
                 <p className="text-gray-600 text-lg mb-8">Thank you for applying to <strong>{job.business?.name}</strong>. The employer will review your profile and contact you within 5-7 business days if your profile matches their requirements.</p>
                 <button type="button" onClick={() => {setShowApplyModal(false); setIsSuccess(false)}} className="w-full sm:w-auto px-8 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition">
                   Close & Returning to Job
                 </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Submit an Application</h3>
                    <p className="text-gray-500 mt-1">Applying for: <strong className="text-gray-900">{job.title}</strong></p>
                  </div>
                  <button type="button" onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-2"><X className="w-6 h-6"/></button>
                </div>

                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                      <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                      <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                    <input required type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="98XXXXXXXX" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Upload CV/Resume (PDF only, Max 5MB) *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50 transition relative">
                      <input 
                        required 
                        type="file" 
                        accept=".pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("File size must be less than 5MB")
                              return
                            }
                            if (file.type !== 'application/pdf') {
                              toast.error("Only PDF files are allowed")
                              return
                            }
                            setCvFile(file)
                          }
                        }}
                      />
                      <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                      {cvFile ? (
                        <p className="font-bold text-gray-900">{cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-700">Click to upload or drag & drop</p>
                          <p className="text-sm text-gray-500 mt-1">PDF file max 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Letter / Note (Optional)</label>
                    <textarea rows={4} value={formData.coverLetter} onChange={e=>setFormData({...formData, coverLetter: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Tell the employer why you're a great fit..."></textarea>
                  </div>

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer mt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <input required type="checkbox" checked={formData.confirmAccurate} onChange={e=>setFormData({...formData, confirmAccurate: e.target.checked})} className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-900 leading-tight">By completing this application, I confirm this information is accurate and I agree to BizNepal's Terms of Service and Privacy Policy.</span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="w-full sm:w-auto flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting || !formData.confirmAccurate || !cvFile} className="w-full sm:w-auto flex-1 bg-blue-600 disabled:opacity-50 disabled:bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center">
                    {isSubmitting ? <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</span> : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
