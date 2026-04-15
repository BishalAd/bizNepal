import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Link as LinkIcon } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: blog } = await supabase
    .from('blogs')
    .select('title, excerpt, image_url')
    .eq('slug', slug)
    .single()

  if (!blog) return {}

  return {
    title: `${blog.title} | Biznity Blog`,
    description: blog.excerpt || blog.title,
    openGraph: {
      images: blog.image_url ? [blog.image_url] : [],
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: blog, error } = await supabase
    .from('blogs')
    .select('*, profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .single()

  if (error || !blog) {
    notFound()
  }

  // Calculate reading time roughly
  const wordsPerMinute = 200
  const noOfWords = blog.content.split(/\s/g).length
  const minutes = Math.ceil(noOfWords / wordsPerMinute)

  return (
    <article className="min-h-screen bg-white pb-24">
      {/* Header / Hero */}
      <header className="relative h-[70vh] min-h-[500px] w-full bg-gray-900 overflow-hidden">
        {blog.image_url ? (
          <img 
            src={blog.image_url} 
            alt={blog.title} 
            className="w-full h-full object-cover opacity-60" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-red-900/30"></div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/80 to-transparent h-64"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white hover:text-red-500 transition-colors mb-8 sm:mb-12"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stories</span>
            </Link>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-red-900/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{minutes} Min Read</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-[1.05] mb-8">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center font-black text-gray-400">
                  {blog.profiles?.avatar_url ? (
                    <img src={blog.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    blog.profiles?.full_name?.charAt(0) || 'A'
                  )}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 tracking-tight">{blog.profiles?.full_name || 'Admin'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Story Author</p>
                </div>
              </div>
              
              <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>
              
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <Calendar className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-sm font-black text-gray-900 tracking-tight">
                      {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published On</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Text */}
        <div className="lg:col-span-8">
          <div className="prose prose-lg prose-red max-w-none">
            {/* Split content by newlines to render as paragraphs for simple rich text support */}
            {blog.content.split('\n').map((paragraph: string, idx: number) => {
              if (!paragraph.trim()) return null;
              return <p key={idx} className="text-gray-700 text-lg leading-relaxed mb-6 font-medium">{paragraph}</p>
            })}
          </div>
          
          <div className="mt-16 pt-10 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <span className="text-xs font-black uppercase tracking-widest text-gray-400">Tags:</span>
               <div className="flex gap-2">
                 {['Business', 'Insights', 'Growth'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-lg border border-gray-100">
                     #{tag}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar Actions */}
        <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
          <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
            <h4 className="text-lg font-black text-gray-900 tracking-tight mb-6">Share this story</h4>
            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-600/20 hover:bg-red-50 hover:text-red-600 transition-all group">
                <Facebook className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Share</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-600/20 hover:bg-red-50 hover:text-red-600 transition-all">
                <Twitter className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Tweet</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-600/20 hover:bg-red-100 hover:text-red-700 transition-all">
                <LinkIcon className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase">Copy Link</span>
              </button>
            </div>
            
            <div className="mt-10 pt-10 border-t border-gray-200">
               <h4 className="text-lg font-black text-gray-900 tracking-tight mb-2">Want more like this?</h4>
               <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">Join our weekly newsletter for more insights delivered straight to your inbox.</p>
               <input 
                 type="email" 
                 placeholder="your@email.com" 
                 className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-sm font-bold mb-4 outline-none focus:border-red-600 transition"
               />
               <button className="w-full py-4 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Join Pulse</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
