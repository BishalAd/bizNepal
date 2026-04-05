import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Calendar, Tag, ShieldCheck, Search } from 'lucide-react'
import { format } from 'date-fns'
import CouponValidator from '@/components/dashboard/offers/CouponValidator'

export default async function OfferClaimantsPage({ params }: { params: Promise<any> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Get Offer Details
  const { data: offer } = await supabase.from('offers').select('*, business:businesses(*)').eq('id', id).single()
  if (!offer) redirect('/dashboard/offers')

  // 2. Fetch "Grabs" from Orders table
  // We look for orders where the items array contains this offer_id
  const { data: grabs } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', offer.business_id)
    .contains('items', [{ offer_id: id }])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/offers" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Offer Claimants</h1>
          <p className="text-gray-500 font-medium">Tracking everyone who grabbed "<span className="text-red-600 underline font-bold">{offer.title}</span>"</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Validator */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                 <Tag className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Grabs</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{grabs?.length || 0}</p>
               </div>
             </div>
             
             <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Original Price</p>
                 <p className="text-lg font-black text-gray-400 line-through">₨ {offer.original_price?.toLocaleString()}</p>
               </div>
               <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                 <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Offer Price</p>
                 <p className="text-2xl font-black text-red-700">₨ {offer.offer_price?.toLocaleString()}</p>
               </div>
             </div>
           </div>

           {/* Coupon Checker Section */}
           <CouponValidator businessId={offer.business_id} />
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-100">
               <h3 className="text-xl font-black text-gray-900">Registered Claimants</h3>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Contact</th>
                      <th className="px-8 py-4">Date Grabbed</th>
                      <th className="px-8 py-4">Payment</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {grabs?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                           <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                           <p className="font-bold">No one has grabbed this offer yet.</p>
                        </td>
                      </tr>
                    ) : (
                      grabs?.map((grab: any) => (
                        <tr key={grab.id} className="hover:bg-gray-50 transition group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                {grab.customer_name?.[0]}
                              </div>
                              <span className="font-bold text-gray-900">{grab.customer_name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 text-gray-900 font-bold mb-0.5">
                                <Phone className="w-3.5 h-3.5 text-gray-400" /> {grab.customer_phone}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-1.5 font-bold text-gray-500">
                               <Calendar className="w-3.5 h-3.5" /> {format(new Date(grab.created_at), 'MMM d, h:mm a')}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-2.5 py-1 bg-gray-100 rounded-lg font-black text-[10px] uppercase tracking-wider text-gray-600">
                              {grab.payment_method}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                               grab.order_status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                               grab.order_status === 'completed' ? 'bg-green-50 text-green-700' :
                               'bg-blue-50 text-blue-700'
                             }`}>
                               {grab.order_status}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}
