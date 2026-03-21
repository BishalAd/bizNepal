'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import RichTextEditor from '@/components/dashboard/RichTextEditor'
import { ArrowLeft, Save, Briefcase, Globe, MapPin, EyeOff } from 'lucide-react'

export default function JobFormClient({ categories, districts, businessId }: any) {
  const supabase = createClient()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    job_type: 'full_time',
    location_type: 'on_site',
    district: '',
    salary_min: '',
    salary_max: '',
    show_salary: true,
    experience_level: 'entry',
    deadline: '',
    description: '',
    requirements: '',
    responsibilities: '',
    status: 'open'
  })

  const handleSubmit = async (e: React.FormEvent, status: string = 'open') => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!formData.title || !formData.category_id || !formData.deadline) {
        throw new Error("Title, category, and deadline are required")
      }

      const payload = {
        business_id: businessId,
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4),
        category_id: formData.category_id,
        job_type: formData.job_type,
        location_type: formData.location_type,
        district: formData.location_type === 'remote' ? null : formData.district,
        salary_range: formData.show_salary && formData.salary_min ? `${formData.salary_min} - ${formData.salary_max}` : null,
        show_salary: formData.show_salary,
        experience_level: formData.experience_level,
        deadline: new Date(formData.deadline).toISOString(),
        description: formData.description,
        requirements: formData.requirements,
        responsibilities: formData.responsibilities,
        status: status
      }

      const { error } = await supabase.from('jobs').insert(payload)
      if (error) throw error
      
      toast.success("Job posted successfully!")
      router.push('/dashboard/jobs')

    } catch (err: any) {
      toast.error(err.message || "Failed to post job")
    } finally {
      setIsSaving(false)
    }
  }

  const InputGroup = ({ label, children, description }: any) => (
    <div className="mb-5">
      <label className="block text-sm font-bold text-gray-900 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      {children}
    </div>
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"><ArrowLeft className="w-5 h-5"/></button>
             <div>
               <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Post a Job</h1>
               <div className="flex gap-2 text-sm text-gray-500 font-medium">Dashboard / Jobs / New</div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={e => handleSubmit(e, 'draft')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
               Save Draft
             </button>
             <button onClick={e => handleSubmit(e, 'open')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition flex items-center justify-center min-w-[140px] shadow-sm">
               {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Briefcase className="w-4 h-4 mr-2"/> Post Job</>}
             </button>
          </div>
        </div>

        <form className="space-y-6">
           
           <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
             <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Job Details</h2>
             
             <InputGroup label="Job Title *">
               <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Senior Frontend Engineer" />
             </InputGroup>

             <div className="grid sm:grid-cols-2 gap-6">
               <InputGroup label="Category *">
                 <select required value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none">
                   <option value="" disabled>Select Category</option>
                   {categories.map((c:any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                 </select>
               </InputGroup>
               
               <InputGroup label="Experience Level *">
                 <select value={formData.experience_level} onChange={e=>setFormData({...formData, experience_level: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none">
                   <option value="entry">Entry Level / Junior</option>
                   <option value="mid">Mid Level</option>
                   <option value="senior">Senior Level</option>
                   <option value="executive">Executive / Director</option>
                 </select>
               </InputGroup>
             </div>

             <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
               <InputGroup label="Employment Type *">
                 <select value={formData.job_type} onChange={e=>setFormData({...formData, job_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none">
                   <option value="full_time">Full-time</option>
                   <option value="part_time">Part-time</option>
                   <option value="contract">Contract</option>
                   <option value="freelance">Freelance</option>
                   <option value="internship">Internship</option>
                 </select>
               </InputGroup>

               <InputGroup label="Application Deadline *">
                 <input required type="datetime-local" value={formData.deadline} onChange={e=>setFormData({...formData, deadline: e.target.value})} className="w-full bg-red-50/50 border border-red-200 rounded-xl px-4 py-3 font-bold text-red-800 focus:ring-2 focus:ring-red-500 outline-none" />
               </InputGroup>
             </div>
             
             <div className="pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Work Location</h3>
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-max border border-gray-200">
                  <button type="button" onClick={()=>setFormData({...formData, location_type: 'on_site'})} className={`px-5 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${formData.location_type === 'on_site' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    <MapPin className="w-4 h-4"/> On-site
                  </button>
                  <button type="button" onClick={()=>setFormData({...formData, location_type: 'hybrid'})} className={`px-5 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${formData.location_type === 'hybrid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Globe className="w-4 h-4"/> Hybrid
                  </button>
                  <button type="button" onClick={()=>setFormData({...formData, location_type: 'remote'})} className={`px-5 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${formData.location_type === 'remote' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Globe className="w-4 h-4"/> Remote
                  </button>
                </div>

                {formData.location_type !== 'remote' && (
                  <InputGroup label="District (Office Location) *">
                     <select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none max-w-sm">
                       <option value="">Select District</option>
                       {districts.map((d:any) => <option key={d.id} value={d.name_en}>{d.name_en}</option>)}
                     </select>
                  </InputGroup>
                )}
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
               <h2 className="text-lg font-bold text-gray-900">Compensation</h2>
               <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                 <input type="checkbox" checked={!formData.show_salary} onChange={e=>setFormData({...formData, show_salary: !e.target.checked})} className="w-4 h-4 text-purple-600 rounded" />
                 <span className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><EyeOff className="w-4 h-4"/> Keep Salary Private</span>
               </label>
             </div>
             
             <div className={`grid sm:grid-cols-2 gap-6 transition-opacity duration-300 ${!formData.show_salary ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
               <InputGroup label="Minimum Salary (NPR / month)">
                 <div className="relative">
                   <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₨</span>
                   <input type="number" value={formData.salary_min} onChange={e=>setFormData({...formData, salary_min: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none" />
                 </div>
               </InputGroup>
               <InputGroup label="Maximum Salary (NPR / month)">
                 <div className="relative">
                   <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₨</span>
                   <input type="number" value={formData.salary_max} onChange={e=>setFormData({...formData, salary_max: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none" />
                 </div>
               </InputGroup>
             </div>
           </div>

           <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8">
             <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-100 pb-4">Content</h2>
             
             <div>
               <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Description</label>
               <RichTextEditor value={formData.description} onChange={val => setFormData({...formData, description: val})} placeholder="Provide a brief overview of the role and your company..." />
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-900 mb-1.5">Key Responsibilities</label>
               <RichTextEditor value={formData.responsibilities} onChange={val => setFormData({...formData, responsibilities: val})} placeholder="Use bullet points to list daily tasks..." />
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-900 mb-1.5">Requirements & Qualifications</label>
               <RichTextEditor value={formData.requirements} onChange={val => setFormData({...formData, requirements: val})} placeholder="Education, skills, and past experience required..." />
             </div>
           </div>

        </form>
      </div>
    </>
  )
}
