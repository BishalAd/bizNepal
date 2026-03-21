'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Calendar, MapPin, Download, Share2 } from 'lucide-react'
import { format } from 'date-fns'

export default function BookingConfirmation({ booking, event }: any) {
  const handleDownload = () => {
    // In a real app we'd use html2canvas or similar to save the ticket
    alert("In a real app, this would download a PDF or screenshot of the ticket!")
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-200">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600 text-lg">Thank you, {booking.attendee_name}. We've sent the details to your WhatsApp.</p>
      </div>

      {/* Ticket Wrapper */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
        {/* Ticket Header */}
        <div className="bg-purple-900 px-8 py-6 text-white relative flex justify-between items-center">
          <div>
            <div className="text-purple-300 text-sm font-bold tracking-widest uppercase mb-1">Official E-Ticket</div>
            <h3 className="text-2xl font-bold truncate pr-4">{event.title}</h3>
          </div>
          <div className="text-right">
             <div className="text-purple-300 text-sm font-medium">Seats</div>
             <div className="text-4xl font-black">{booking.seats}</div>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-8 border-b-2 border-dashed border-gray-200 relative">
          
          {/* Cutouts for ticket effect */}
          <div className="absolute left-[-16px] bottom-[-16px] w-8 h-8 rounded-full bg-gray-50 border-t border-r border-gray-200 shadow-inner"></div>
          <div className="absolute right-[-16px] bottom-[-16px] w-8 h-8 rounded-full bg-gray-50 border-t border-l border-gray-200 shadow-inner"></div>

          <div className="flex-1 space-y-6 w-full">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Date & Time</p>
                <div className="flex items-center gap-2 mt-1 font-semibold text-gray-900">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  {format(new Date(event.starts_at), 'MMM d, h:mm a')}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Venue</p>
                <div className="flex items-center gap-2 mt-1 font-semibold text-gray-900 text-sm">
                  <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="truncate">{event.venue_name || 'Online'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Attendee</p>
                 <p className="font-semibold text-gray-900 mt-1">{booking.attendee_name}</p>
                 <p className="text-sm text-gray-600 truncate">{booking.attendee_phone}</p>
              </div>
              <div>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Payment</p>
                 <p className="font-semibold text-gray-900 mt-1 uppercase">{booking.payment_method}</p>
                 <p className={`text-sm font-bold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-gray-600'} uppercase`}>{booking.payment_status}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <QRCodeSVG value={booking.ticket_code} size={120} level="M" includeMargin={true} />
            <p className="mt-2 text-center text-xs font-mono font-bold tracking-[0.2em] text-gray-900">{booking.ticket_code}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-6 bg-gray-50 flex gap-4">
           <button onClick={handleDownload} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
             <Download className="w-5 h-5" /> Download Ticket
           </button>
           <button className="px-6 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
             <Share2 className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  )
}
