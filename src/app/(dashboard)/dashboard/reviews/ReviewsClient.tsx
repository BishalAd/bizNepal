'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { 
  Star, MessageSquareQuote, Flag, Reply, Send, User, MessageCircle, X
} from 'lucide-react'
import { RatingStars } from '@/components/dashboard/shared/DashboardShared'


export default function ReviewsClient({ initialReviews, business }: any) {
  const supabase = createClient()
  const [reviews, setReviews] = useState(initialReviews)
  const [activeFilter, setActiveFilter] = useState('all')
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  
  // WhatsApp Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [whatsappNumbers, setWhatsappNumbers] = useState('')
  const [isSendingRequests, setIsSendingRequests] = useState(false)

  const stats = useMemo(() => {
    let sum = 0
    const counts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    
    reviews.forEach((r:any) => {
      sum += (r.rating || 0)
      if (r.rating) counts[r.rating.toString() as keyof typeof counts]++
    })

    const avg = reviews.length ? (sum / reviews.length).toFixed(1) : 0
    return { avg, counts, total: reviews.length }
  }, [reviews])

  const displayReviews = useMemo(() => {
    if (activeFilter === 'all') return reviews
    if (activeFilter === 'unreplied') return reviews.filter((r:any) => !r.owner_reply)
    if (activeFilter === 'flagged') return reviews.filter((r:any) => r.is_flagged)
    return reviews.filter((r:any) => r.rating.toString() === activeFilter)
  }, [reviews, activeFilter])

  const handlePostReply = async (id: string) => {
    const text = replyText[id]
    if (!text?.trim()) return toast.error("Please enter a reply")
    
    const toastId = toast.loading("Publishing reply...")
    try {
      const { error } = await supabase.from('reviews').update({ owner_reply: text }).eq('id', id)
      if (error) throw error
      setReviews((prev:any) => prev.map((r:any) => r.id === id ? { ...r, owner_reply: text } : r))
      setActiveReplyId(null)
      toast.success("Reply posted!", { id: toastId })
    } catch {
      toast.error('Failed to post reply', { id: toastId })
    }
  }

  const handleFlagReview = async (id: string, currentlyFlagged: boolean) => {
    const newFlag = !currentlyFlagged
    try {
      const { error } = await supabase.from('reviews').update({ is_flagged: newFlag }).eq('id', id)
      if (error) throw error
      setReviews((prev:any) => prev.map((r:any) => r.id === id ? { ...r, is_flagged: newFlag } : r))
      toast.success(newFlag ? "Review flagged for moderation" : "Flag removed")
    } catch {
      toast.error('Failed to flag review')
    }
  }

  const handleSendRequests = async () => {
     if (!whatsappNumbers.trim()) return toast.error("Enter at least one number")
     setIsSendingRequests(true)
     try {
       // Hit n8n webhook
       const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL + '/request-review'
       // If no n8n webhook url is available (e.g. env var empty), mock it:
       if (!webhookUrl || webhookUrl.includes('undefined')) {
         await new Promise(r => setTimeout(r, 1500))
       } else {
         await fetch(webhookUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             business_name: business.name,
             type: 'review_request',
             numbers: whatsappNumbers.split(',').map(n => n.trim())
           })
         })
       }
       toast.success("Review requests sent via WhatsApp!")
       setIsRequestModalOpen(false)
       setWhatsappNumbers('')
     } catch (err) {
       toast.error("Failed to send requests")
     } finally {
       setIsSendingRequests(false)
     }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reviews & Reputation</h1>
            <p className="text-gray-500 mt-1">Respond to customer feedback and build trust.</p>
          </div>
          <button onClick={() => setIsRequestModalOpen(true)} className="bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm">
            <MessageCircle className="w-5 h-5 mr-2" /> Request Reviews via WhatsApp
          </button>
        </div>

        {/* Top Summary Block */}
        <div className="grid md:grid-cols-3 gap-6">
           {/* Average Large */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
               <Star className="w-8 h-8 fill-yellow-500 text-yellow-500" />
             </div>
             <p className="font-bold text-gray-500 tracking-widest uppercase text-xs">Overall Rating</p>
             <div className="flex items-end gap-2 mt-2">
               <h1 className="text-5xl font-black text-gray-900 leading-none">{stats.avg}</h1>
               <span className="text-gray-400 font-bold mb-1">/ 5.0</span>
             </div>
             <div className="mt-4"><RatingStars rating={Math.round(Number(stats.avg))} size="w-6 h-6" /></div>
             <p className="text-sm font-bold text-gray-400 mt-3">Based on {stats.total} reviews</p>
           </div>

           {/* Breakdown Bars */}
           <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm md:col-span-2 space-y-3">
             <h3 className="font-bold text-gray-900 mb-4">Rating Breakdown</h3>
             {[5,4,3,2,1].map(star => {
                const count = stats.counts[star.toString() as keyof typeof stats.counts]
                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-gray-600 text-sm">
                      {star} <Star className="w-3 h-3 fill-gray-400 text-gray-400"/>
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{width: `${percent}%`}}></div>
                    </div>
                    <div className="w-8 text-right font-bold text-sm text-gray-400">{count}</div>
                  </div>
                )
             })}
           </div>
        </div>

        {/* Reviews List Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-wrap gap-2 items-center bg-gray-50/50">
             <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-widest hidden sm:block">Filter by:</span>
             <select value={activeFilter} onChange={e=>setActiveFilter(e.target.value)} className="bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer hover:bg-gray-50 transition w-full sm:w-auto">
               <option value="all">All Reviews</option>
               <option value="unreplied">Needs Reply</option>
               <option value="flagged">Flagged / Reported</option>
               <option disabled>──────</option>
               <option value="5">5 Star Reviews</option>
               <option value="4">4 Star Reviews</option>
               <option value="3">3 Star Reviews</option>
               <option value="2">2 Star Reviews</option>
               <option value="1">1 Star Reviews</option>
             </select>
          </div>

          <div className="divide-y divide-gray-50">
            {displayReviews.length === 0 ? (
               <div className="py-24 text-center">
                 <MessageSquareQuote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-lg font-bold text-gray-900">No reviews found</h3>
                 <p className="text-gray-500">There are no reviews matching your current filter.</p>
               </div>
            ) : (
               displayReviews.map((r:any) => (
                 <div key={r.id} className="p-6 transition hover:bg-gray-50/30">
                    <div className="flex flex-col lg:flex-row gap-6">
                       
                       {/* Reviewer Profile */}
                       <div className="lg:w-64 shrink-0 flex items-start gap-4">
                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                           {r.profiles?.avatar_url ? (
                             <img src={r.profiles.avatar_url} className="w-full h-full object-cover" />
                           ) : (
                             <User className="w-5 h-5 text-gray-400" />
                           )}
                         </div>
                         <div>
                           <h4 className="font-extrabold text-gray-900">{r.profiles?.full_name || 'Anonymous User'}</h4>
                           <p className="text-xs font-bold text-gray-500 mt-0.5">{formatDistanceToNow(new Date(r.created_at))} ago</p>
                           <div className="mt-2"><RatingStars rating={r.rating} /></div>
                         </div>
                       </div>

                       {/* Review Content */}
                       <div className="flex-1 space-y-4">
                         <p className="text-gray-800 font-medium leading-relaxed">"{r.comment}"</p>
                         
                         {/* Owner Reply */}
                         {r.owner_reply ? (
                           <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 ml-0 sm:ml-4 flex gap-4 animate-in fade-in">
                             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                               <Reply className="w-4 h-4 text-blue-600" />
                             </div>
                             <div>
                               <h5 className="font-bold text-blue-900 text-sm mb-1">Your Reply</h5>
                               <p className="text-gray-700 text-sm font-medium">{r.owner_reply}</p>
                             </div>
                           </div>
                         ) : activeReplyId === r.id ? (
                           <div className="ml-0 sm:ml-4 animate-in slide-in-from-top-2">
                              <textarea 
                                value={replyText[r.id] || ''} 
                                onChange={e => setReplyText({ ...replyText, [r.id]: e.target.value })}
                                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                                rows={3} 
                                placeholder="Write a polite response. This will be public..."
                              ></textarea>
                              <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setActiveReplyId(null)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition">Cancel</button>
                                <button onClick={() => handlePostReply(r.id)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition flex items-center">
                                  <Send className="w-3.5 h-3.5 mr-1.5"/> Post Public Reply
                                </button>
                              </div>
                           </div>
                         ) : null}

                         {/* Actions Loop */}
                         {!r.owner_reply && activeReplyId !== r.id && (
                           <div className="flex items-center gap-3 pt-2">
                             <button onClick={() => setActiveReplyId(r.id)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition">
                               <Reply className="w-4 h-4"/> Reply publicly
                             </button>
                             <button onClick={() => handleFlagReview(r.id, r.is_flagged)} className={`text-sm font-bold flex items-center gap-1.5 transition ml-auto ${r.is_flagged ? 'text-red-600 hover:text-red-800' : 'text-gray-400 hover:text-red-600'}`}>
                               <Flag className="w-4 h-4"/> {r.is_flagged ? 'Flagged for review' : 'Report Abuse'}
                             </button>
                           </div>
                         )}

                       </div>
                    </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#25D366]/5">
               <h3 className="font-extrabold text-[#128C7E] flex items-center gap-2"><MessageCircle className="w-5 h-5"/> Send WhatsApp Request</h3>
               <button onClick={()=>setIsRequestModalOpen(false)} className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition"><X className="w-4 h-4"/></button>
             </div>
             
             <div className="p-6 space-y-4">
               <p className="text-sm font-bold text-gray-600 font-medium leading-relaxed">
                 Enter customer numbers (comma separated, starting with 98...) to send them an automated WhatsApp message requesting a review with a direct link to your profile.
               </p>
               
               <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-2 mb-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Message Preview</p>
                 <p className="text-sm text-gray-700 italic">"Hi there! Thank you for choosing {business.name}. We'd love to hear your feedback on your recent experience. Click here to leave a rating: [Link]"</p>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-900 mb-1.5">Phone Numbers</label>
                 <textarea 
                   rows={3} 
                   value={whatsappNumbers}
                   onChange={e=>setWhatsappNumbers(e.target.value)}
                   className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#25D366] outline-none resize-none" 
                   placeholder="e.g. 9841000000, 9841000001"
                 ></textarea>
               </div>
             </div>
             
             <div className="p-6 pt-0">
               <button disabled={isSendingRequests} onClick={handleSendRequests} className="w-full bg-[#25D366] disabled:opacity-70 hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                 {isSendingRequests ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Send className="w-4 h-4 mr-2"/> Send WhatsApp Messages</>}
               </button>
             </div>
          </div>
        </div>
      )}
    </>
  )
}
