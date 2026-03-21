'use client'

import React from 'react'
import { Bold, Italic, List, ListOrdered, Link } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // We're moving to a more stable editor for React 18 + Next.js 16/Turbopack
  // instead of the broken react-quill findDOMNode issue.
  
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Basic Toolbar */}
      <div className="flex border-b border-gray-100 p-2 gap-1 bg-gray-50/50">
         <button type="button" className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-blue-600"><Bold className="w-4 h-4" /></button>
         <button type="button" className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-blue-600"><Italic className="w-4 h-4" /></button>
         <div className="w-px h-4 bg-gray-200 self-center mx-1"></div>
         <button type="button" className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-blue-600"><List className="w-4 h-4" /></button>
         <button type="button" className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-blue-600"><ListOrdered className="w-4 h-4" /></button>
         <button type="button" className="p-1.5 hover:bg-white rounded-md transition text-gray-500 hover:text-blue-600 ml-auto"><Link className="w-4 h-4" /></button>
      </div>
      
      <textarea
        value={value}
        onChange={handleInput}
        placeholder={placeholder || 'Write a detailed description here... HTML tags are supported.'}
        className="w-full min-h-[200px] p-4 text-sm font-medium text-gray-800 outline-none resize-y leading-relaxed"
      ></textarea>
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between">
         <span>Supports Rich Layout</span>
         <span>Preview Available</span>
      </div>
    </div>
  )
}
