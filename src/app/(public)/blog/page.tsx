import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Blog | Biznity',
  description: 'Latest news, insights, and stories from the Biznity community in Nepal.',
}

export default async function BlogPage() {
  const supabase = await createClient()
  
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('*, profiles(full_name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blogs:', error)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-600/20 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Inside Biznity</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
              Stories, Insights & <br />
              <span className="text-red-500">Business Growth.</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl">
              Discover the latest trends, success stories, and expert advice to help you navigate Nepal's dynamic business landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!blogs || blogs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <BookOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No stories yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto">We're currently preparing some amazing content for you. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/blog/${blog.slug}`}
                className="group flex flex-col bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image Placeholder/Thumbnail */}
                <div className="relative h-64 w-full bg-gray-100 overflow-hidden">
                  {blog.image_url ? (
                    <img 
                      src={blog.image_url} 
                      alt={blog.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                       <span className="text-4xl font-black text-white opacity-50 uppercase tracking-tighter">{blog.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm border border-white/50">
                      Insights
                    </span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {blog.profiles?.full_name || 'Admin'}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight leading-tight group-hover:text-red-600 transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3">
                    {blog.excerpt || blog.content.substring(0, 150) + '...'}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                      Read Story <ArrowRight className="w-4 h-4 text-red-600 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="text-[10px] font-bold text-gray-300">5 min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter / CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-6">Stay Ahead of the Curve</h2>
          <p className="text-gray-500 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
            Join 5,000+ businesses in Nepal who receive our weekly insights on growth, technology, and local market trends.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com" 
              className="flex-1 px-6 py-4 rounded-2xl bg-white border border-gray-200 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition shadow-sm text-sm font-bold"
            />
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-gray-200">
              Subscribe Free
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
