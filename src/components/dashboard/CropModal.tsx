'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import getCroppedImg from '@/lib/utils/cropImage'

interface CropModalProps {
  image: string
  aspect: number
  onClose: () => void
  onCropComplete: (croppedImage: Blob) => void
}

export default function CropModal({ image, aspect, onClose, onCropComplete }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      if (croppedImage) {
        onCropComplete(croppedImage)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900">Crop Your Image</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Adjust to fit perfectly</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CROPPER AREA */}
        <div className="relative flex-1 bg-gray-900 min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
          />
        </div>

        {/* CONTROLS */}
        <div className="p-8 bg-white border-t border-gray-100 space-y-6">
          <div className="flex items-center gap-6">
             <ZoomOut className="w-5 h-5 text-gray-400" />
             <input
               type="range"
               value={zoom}
               min={1}
               max={3}
               step={0.1}
               aria-labelledby="Zoom"
               onChange={(e) => setZoom(Number(e.target.value))}
               className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
             <ZoomIn className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex justify-between items-center gap-4">
             <button 
               onClick={() => {setZoom(1); setCrop({x:0, y:0})}}
               className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-sm transition"
             >
               <RotateCcw className="w-4 h-4" /> Reset
             </button>
             
             <div className="flex gap-3">
               <button 
                 onClick={onClose}
                 className="px-8 py-4 rounded-[1.5rem] border border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 transition"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSave}
                 className="px-10 py-4 rounded-[1.5rem] bg-gray-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-gray-900/20 transition flex items-center gap-2 active:scale-95"
               >
                 <Check className="w-5 h-5" /> Done
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
