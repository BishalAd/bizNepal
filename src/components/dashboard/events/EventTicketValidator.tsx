'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QrCode, Search, Loader2, CheckCircle2, User, Phone, XCircle, Ticket } from 'lucide-react'

interface EventTicketValidatorProps {
  eventId: string
}

export default function EventTicketValidator({ eventId }: EventTicketValidatorProps) {
  const [ticketId, setTicketId] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  const handleVerify = async () => {
    if (!ticketId.trim()) return
    
    setIsVerifying(true)
    setResult(null)

    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('*')
        .eq('event_id', eventId)
        .eq('id', ticketId.trim()) // Assuming ticket ID is the booking ID
        .maybeSingle()

      if (error) throw error

      if (data) {
        setResult({ valid: true, booking: data })
      } else {
        setResult({ valid: false })
      }
    } catch (err) {
      console.error(err)
      setResult({ valid: false, error: 'Verification failed' })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-xl text-white">
      <h3 className="text-xl font-black mb-2 flex items-center gap-2">
        <QrCode className="w-6 h-6 text-orange-400" /> Ticket Scanner
      </h3>
      <p className="text-gray-400 text-sm mb-6 font-medium">Scan QR or enter the Ticket ID to verify attendance.</p>
      
      <div className="relative group">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-hover:text-blue-400 transition" />
        <input 
          type="text" 
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value.trim())}
          placeholder="Enter Ticket ID" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 font-black tracking-widest focus:ring-2 focus:ring-orange-500 outline-none transition text-white placeholder-gray-500" 
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
      </div>
      
      <button 
        onClick={handleVerify}
        disabled={isVerifying || !ticketId.trim()}
        className="w-full mt-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition active:scale-95 shadow-lg shadow-orange-600/20 flex items-center justify-center"
      >
        {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Check Ticket'}
      </button>

      {/* Result Display */}
      {result && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {result.valid ? (
            <div className="bg-green-500/10 border border-green-500/30 p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <div>
                  <h4 className="font-black text-green-400 text-lg leading-tight">Valid Ticket</h4>
                  <p className="text-xs font-bold text-green-500/70 uppercase tracking-widest">Payment: {result.booking.payment_status}</p>
                </div>
              </div>
              <div className="space-y-3 bg-black/20 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-200">{result.booking.attendee_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-200">{result.booking.attendee_phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-orange-300 text-lg">{result.booking.ticket_count} Admission(s)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h4 className="font-black text-red-400 text-lg">Invalid Ticket</h4>
              <p className="text-sm font-medium text-red-300 mt-1">This ticket ID does not exist for this event.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
