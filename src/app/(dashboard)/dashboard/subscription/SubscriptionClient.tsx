'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { Check, ShieldCheck, Zap, Star, Flame, Crown, X } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

export default function SubscriptionClient({ business, usage }: any) {
  const supabase = createClient()
  const { width, height } = useWindowSize()
  const [currentPlan, setCurrentPlan] = useState(business.subscription_plan || 'free')
  
  // Payment gateway modals
  const [selectedUpgrade, setSelectedUpgrade] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleUpgradePayment = async (method: string) => {
    setIsProcessing(true)
    const toastId = toast.loading(`Connecting to ${method}...`)
    
    try {
      // Mock payment gateway delay
      await new Promise(r => setTimeout(r, 2000))
      
      const newExpiry = addMonths(new Date(), 1).toISOString()
      
      const { error } = await supabase.from('businesses').update({ 
         subscription_plan: selectedUpgrade.id,
         subscription_expires_at: newExpiry
      }).eq('id', business.id)
      
      if (error) throw error
      
      setCurrentPlan(selectedUpgrade.id)
      setSelectedUpgrade(null)
      setShowConfetti(true)
      toast.success('Payment Successful! Plan Upgraded ✨', { id: toastId })
      
      setTimeout(() => setShowConfetti(false), 8000)
    } catch {
      toast.error('Payment failed', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: 0,
      period: 'Forever',
      icon: <ShieldCheck className="w-8 h-8 text-blue-500"/>,
      desc: 'Perfect for small local shops starting out.',
      limit: { products: 5, label: '5 Product Listings' },
      features: [
        '1 Active Offer or Deal',
        '1 Job Posting',
        'Basic Analytics (Last 7 Days)'
      ],
      notIncluded: [
        'Featured Homepage Placement',
        'Verified Business Badge',
        'AI Description Generator',
        'WhatsApp Automated Alerts'
      ]
    },
    {
      id: 'basic',
      name: 'Business Basic',
      price: 999,
      period: 'per month',
      icon: <Zap className="w-8 h-8 text-[#0EA5E9]"/>,
      desc: 'Grow your visibility across the district.',
      limit: { products: 50, label: '50 Product Listings' },
      features: [
        '5 Active Offers & Deals',
        '3 Job Postings',
        'Event Promotion (Max 3)',
        'Detailed 30-Day Analytics',
        'Priority Listing in Search Results'
      ],
      notIncluded: [
        'Verified Business Badge',
        'AI Description Generator',
        'WhatsApp Automated Alerts'
      ]
    },
    {
      id: 'pro',
      name: 'BizNepal Pro',
      price: 2499,
      period: 'per month',
      popular: true,
      icon: <Crown className="w-8 h-8 text-yellow-400 drop-shadow-sm"/>,
      desc: 'Supercharges your brand across Nepal.',
      limit: { products: 'Unlimited', label: 'Unlimited Products' },
      features: [
        'Unlimited Offers & Deals',
        'Unlimited Job Postings',
        'Unlimited Event Promotions',
        'Full Analytics & CSV Exports',
        'Featured Hero on Homepage',
        'Verified Checkmark Badge',
        'AI Description Generator',
        'WhatsApp Automated Alerts'
      ],
      notIncluded: []
    }
  ]

  const activePlanData = plans.find(p => p.id === currentPlan)

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <Toaster position="top-right" />
      <div className="space-y-12 pb-20 max-w-6xl mx-auto">
        
        {/* Header Summary Panel */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
             <div>
               <p className="text-blue-300 font-extrabold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                 <Star className="w-4 h-4" /> Current Subscription
               </p>
               <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                 {activePlanData?.name || 'Free Starter'}
               </h1>
               
               {currentPlan !== 'free' && business.subscription_expires_at ? (
                 <p className="text-gray-400 font-bold mt-2 text-sm bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
                   Renews on <span className="text-white">{format(new Date(business.subscription_expires_at), 'PPP')}</span>
                 </p>
               ) : (
                 <p className="text-gray-400 font-bold mt-2 text-sm">Free forever. Upgrade anytime to unlock superpower limits.</p>
               )}
             </div>

             <div className="lg:pl-10 space-y-5">
               <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Usage Meter</h4>
               
               <div className="space-y-4">
                  {/* Products Meter */}
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-gray-300">Product Listings</span>
                      <span className="text-white">{usage.products} / {activePlanData?.limit.products || '∞'}</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: currentPlan==='pro' ? '15%' : `${Math.min(100, (usage.products / Number(activePlanData?.limit.products))*100)}%` }}></div>
                    </div>
                  </div>

                  {/* Offers Meter */}
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-gray-300">Active Offers</span>
                      <span className="text-white">{usage.offers} / {currentPlan==='free'?1 : currentPlan==='basic'?5 : '∞'}</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-orange-500 to-red-400 rounded-full" style={{ width: currentPlan==='pro' ? '5%' : `${Math.min(100, (usage.offers / (currentPlan==='free'?1:5))*100)}%` }}></div>
                    </div>
                  </div>

                  {/* Jobs Meter */}
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-gray-300">Job Postings</span>
                      <span className="text-white">{usage.jobs} / {currentPlan==='free'?1 : currentPlan==='basic'?3 : '∞'}</span>
                    </div>
                    <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" style={{ width: currentPlan==='pro' ? '2%' : `${Math.min(100, (usage.jobs / (currentPlan==='free'?1:3))*100)}%` }}></div>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="text-center mb-8">
           <h2 className="text-3xl font-black text-gray-900">Upgrade your Business</h2>
           <p className="text-gray-500 font-bold mt-2">Get verified. Reach more customers. Sell securely.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
           {plans.map(plan => {
             const isCurrent = currentPlan === plan.id
             return (
               <div key={plan.id} className={`relative bg-white rounded-3xl border transition-all duration-300 ${plan.popular ? 'border-purple-500 shadow-xl shadow-purple-900/10 scale-100 md:scale-105 z-10' : 'border-gray-200 hover:border-blue-200 hover:shadow-lg'}`}>
                  {plan.popular && (
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-lg">
                       <Flame className="w-3.5 h-3.5" /> Most Popular
                     </div>
                  )}

                  <div className="p-8 pb-6 border-b border-gray-100">
                     <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100">
                        {plan.icon}
                     </div>
                     <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                     <p className="text-sm font-bold text-gray-500 h-10 mt-2">{plan.desc}</p>
                     
                     <div className="flex items-end gap-2 mt-6">
                       <span className="text-4xl font-black text-gray-900 tracking-tight">₨ {plan.price.toLocaleString()}</span>
                       <span className="text-gray-400 font-bold mb-1">/ {plan.period}</span>
                     </div>
                     
                     <button 
                       disabled={isCurrent}
                       onClick={() => setSelectedUpgrade(plan)}
                       className={`w-full mt-6 py-3.5 rounded-xl font-bold transition flex justify-center items-center shadow-sm disabled:opacity-100
                         ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 
                           plan.popular ? 'bg-purple-600 hover:bg-purple-700 text-white drop-shadow-md' : 
                           'bg-[#0EA5E9] hover:bg-blue-600 text-white'}`}
                     >
                       {isCurrent ? 'Active Plan' : 'Upgrade Plan'}
                     </button>
                  </div>

                  <div className="p-8 pt-6 space-y-4">
                     <div className="flex items-start gap-3">
                       <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" strokeWidth={3} />
                       <span className="font-extrabold text-gray-900">{plan.limit.label}</span>
                     </div>
                     
                     {plan.features.map((f, i) => (
                       <div key={i} className="flex items-start gap-3">
                         <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" strokeWidth={3} />
                         <span className="font-bold text-gray-600">{f}</span>
                       </div>
                     ))}

                     {plan.notIncluded.map((f, i) => (
                       <div key={`not-${i}`} className="flex items-start gap-3 opacity-50">
                         <X className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" strokeWidth={3} />
                         <span className="font-bold text-gray-500 line-through">{f}</span>
                       </div>
                     ))}
                  </div>
               </div>
             )
           })}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {selectedUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             
             <div className="relative h-24 bg-gradient-to-tr from-[#0F172A] to-[#1E293B] p-6 text-white text-center flex flex-col items-center justify-center">
                <button onClick={() => !isProcessing && setSelectedUpgrade(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
                  <X className="w-4 h-4 text-white"/>
                </button>
                <h3 className="font-black text-xl flex items-center gap-2">{selectedUpgrade.icon} Upgrade to {selectedUpgrade.name}</h3>
             </div>

             <div className="p-8 text-center space-y-6 bg-gray-50">
                <div>
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Total Bill</p>
                   <h2 className="text-5xl font-black text-gray-900 tracking-tight text-[#0EA5E9]">₨ {selectedUpgrade.price.toLocaleString()}</h2>
                   <p className="text-gray-400 font-bold text-sm mt-2">includes all taxes + 30 days validity</p>
                </div>

                <div className="pt-6 border-t border-gray-200 text-left">
                  <p className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest border-l-4 border-[#0EA5E9] pl-3">Pay using Digital Wallet</p>
                  
                  <div className="grid gap-3">
                     <button 
                       disabled={isProcessing}
                       onClick={() => handleUpgradePayment('eSewa')}
                       className="w-full bg-[#60A130] hover:bg-[#528A27] disabled:opacity-70 text-white rounded-2xl p-4 flex items-center justify-between font-bold transition group shadow-md"
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-[#60A130]">eS</div>
                           <span className="text-lg">Pay with eSewa</span>
                        </div>
                        {isProcessing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full leading-none"/> : <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm">Proceed →</span>}
                     </button>

                     <button 
                       disabled={isProcessing}
                       onClick={() => handleUpgradePayment('Khalti')}
                       className="w-full bg-[#5C2D91] hover:bg-[#4E267A] disabled:opacity-70 text-white rounded-2xl p-4 flex items-center justify-between font-bold transition group shadow-md"
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-[#5C2D91]">K</div>
                           <span className="text-lg">Pay with Khalti</span>
                        </div>
                        {isProcessing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full leading-none"/> : <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm">Proceed →</span>}
                     </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-4">
                  By upgrading to {selectedUpgrade.name}, you agree to our Terms of Service. Changes will apply immediately.
                </p>
             </div>
          </div>
        </div>
      )}
    </>
  )
}
