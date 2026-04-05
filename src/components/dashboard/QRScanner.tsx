'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    )

    scanner.render((decodedText) => {
      setScanResult(decodedText)
      onScanSuccess(decodedText)
      // Stop scanner after success to avoid multiple scans
      scanner.clear().catch(e => console.error("Failed to clear scanner", e))
    }, (error) => {
      // Ignore failures
      // console.warn("QR Scan error", error)
    })

    scannerRef.current = scanner

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner on unmount", e))
      }
    }
  }, [onScanSuccess])

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Camera className="w-6 h-6 text-orange-600" />
              Ticket Scanner
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Scan event QR code to validate</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
            <div id="reader" className="w-full max-w-sm rounded-[2rem] overflow-hidden border-4 border-gray-100 shadow-inner"></div>
            
            {scanResult ? (
              <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3 border border-green-100">
                   <CheckCircle2 className="w-6 h-6" />
                   <div className="text-left">
                     <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Scanned Code</p>
                     <p className="text-lg font-black">{scanResult}</p>
                   </div>
                 </div>
                 <button onClick={() => window.location.reload()} className="mt-6 text-sm font-bold text-gray-500 hover:text-gray-900 underline">Scan Another?</button>
              </div>
            ) : (
                <div className="mt-8 text-center text-gray-500">
                   <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">Waiting for QR Code...</p>
                   <p className="text-xs mt-2 font-medium">Position the ticket QR code within the frame above</p>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
           <button 
             onClick={onClose}
             className="w-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-900 font-black py-4 rounded-2xl transition shadow-sm"
           >
             Close Scanner
           </button>
        </div>

      </div>
    </div>
  )
}
