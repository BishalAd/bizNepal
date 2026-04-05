'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import CropModal from './CropModal'

interface ImageUploadProps {
  bucket: string
  folder?: string
  currentImageUrl?: string
  onUploadSuccess: (url: string) => void
  disabled?: boolean
  label?: string
  aspectRatio?: 'square' | 'wide'
}

export default function ImageUpload({ 
  bucket, 
  folder = '', 
  currentImageUrl, 
  onUploadSuccess, 
  disabled = false,
  label = "Upload Image",
  aspectRatio = 'square'
}: ImageUploadProps) {
  
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [progress, setProgress] = useState(0)
  
  // Cropping State
  const [showCrop, setShowCrop] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const uploadFile = async (file: File | Blob) => {
    if (disabled) return
    
    try {
      setIsUploading(true)
      setProgress(10)

      // 1. Delete old image if exists
      if (currentImageUrl && currentImageUrl.includes(bucket)) {
        try {
          const urlParts = currentImageUrl.split(`${bucket}/`)
          if (urlParts.length === 2) {
            const oldPath = urlParts[1]
            await supabase.storage.from(bucket).remove([oldPath])
          }
        } catch (e) {
          console.warn('Could not delete old image', e)
        }
      }

      setProgress(40)

      // 2. Upload new image
      const fileExt = (file as File).name?.split('.').pop() || 'jpg'
      const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        if (uploadError.message.includes("not found")) {
          toast.error(`Storage bucket "${bucket}" not found. Please create it in your Supabase Dashboard.`)
          console.error(`ERROR: Supabase Storage Bucket "${bucket}" is missing. Go to Supabase Dashboard > Storage and create a NEW PUBLIC BUCKET named "${bucket}".`)
          throw new Error(`Bucket "${bucket}" not found`)
        } else {
          throw uploadError
        }
      }

      setProgress(80)

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      
      setPreview(publicUrl)
      onUploadSuccess(publicUrl)
      setProgress(100)
      toast.success('Image uploaded successfully')

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setProgress(0)
        setShowCrop(false)
        setSelectedImage(null)
      }, 500)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return
    const file = acceptedFiles[0]

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit')
      return
    }

    // Instead of uploading, show the crop modal
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setShowCrop(true)
    }
    reader.readAsDataURL(file)
  }, [disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    disabled: isUploading || disabled
  })

  // Clear preview
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onUploadSuccess('') // clear form field
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      
      <div 
        {...getRootProps()} 
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition overflow-hidden group
          ${aspectRatio === 'square' ? 'aspect-square max-w-[240px]' : 'aspect-[2.5/1] w-full max-h-[240px]'}
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}
          ${(isUploading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center z-10 w-full px-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-2">Uploading...</p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        ) : preview ? (
          <>
            <img src={preview} alt="Upload preview" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col items-center justify-center text-white">
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="text-sm font-bold">Change Image</span>
            </div>
            {!disabled && (
              <button 
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 z-20 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4 z-10 text-gray-500">
             <ImageIcon className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
             <p className="font-semibold text-sm mb-1 group-hover:text-gray-700">Drag & drop or click</p>
             <p className="text-xs">JPG, PNG, WEBP (Max 5MB)</p>
          </div>
        )}
      </div>

      {showCrop && selectedImage && (
        <CropModal 
          image={selectedImage}
          aspect={aspectRatio === 'square' ? 1/1 : 2.5/1}
          onClose={() => {setShowCrop(false); setSelectedImage(null)}}
          onCropComplete={(blob) => {
            uploadFile(blob)
          }}
        />
      )}
    </div>
  )
}
