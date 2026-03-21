import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Flame, Briefcase, Calendar, ChevronRight, Store } from 'lucide-react'
import HeroSearch from '@/components/public/HeroSearch'

// Next.js config to revalidate this page every 1 hour (3600 seconds)
export const revalidate = 3600 

export default async function HomePage() {
  const supabase = await createClient()

  // Parallel data fetching for performance
  const [
    { data: categories },
    { data: featuredBusinesses },
    { data: flashDeals },
    { data: latestJobs },
    { data: upcomingEvents }
  ] = await Promise.all([
    supabase.from('categories').select('*').limit(12),
    supabase.from('businesses').select('*').eq('is_active', true).order('rating', { ascending: false }).limit(12),
    supabase.from('offers')
      .select('*, business:businesses(*)')
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .order('ends_at', { ascending: true })
      .limit(4),
    supabase.from('jobs').select('*, business:businesses(name, logo_url)').order('created_at', { ascending: false }).limit(3),
    supabase.from('events').select('*').order('starts_at', { ascending: true }).limit(3)
  ])

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-red-900 via-red-800 to-red-950 text-white overflow-hidden pb-20 pt-20">
        {/* Decorative blobs */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-red-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-red-900/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent z-10" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-8 backdrop-blur-md animate-in fade-in duration-500">
            <MapPin className="w-4 h-4 text-red-300" />
            <span>Nepal's #1 Business Platform</span>
            <span className="ml-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Discover Nepal&apos;s <span className="text-red-300">Best Businesses</span>
          </h1>
          <p className="text-lg md:text-xl text-red-100/90 max-w-2xl mx-auto mb-4 font-medium">
            नेपालको उत्कृष्ट व्यापारहरू खोज्नुहोस् — Products, Services, Jobs & Events
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm font-bold text-red-100/80">
            <span>🏢 10,000+ Businesses</span>
            <span>📦 50,000+ Products</span>
            <span>💼 5,000+ Jobs</span>
            <span>🏧 All 77 Districts</span>
          </div>

          {/* Functional Search */}
          <HeroSearch />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-16 pb-20">
        
        {/* CATEGORY GRID */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Explore Categories</h2>
              <p className="text-gray-500 mt-1">Browse through our extensive catalog</p>
            </div>
            <Link href="/categories" className="text-red-600 font-medium hover:text-red-700 hidden sm:block">View all categories &rarr;</Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {categories?.map((cat) => (
              <Link href={`/products?category=${cat.id}`} key={cat.id} className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 hover:bg-red-50/10 transition group text-center aspect-square">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <span className="text-xl">{cat.icon || '📦'}</span>
                </div>
                <span className="font-semibold text-gray-800 text-sm">{cat.name_en}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED BUSINESSES */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Businesses</h2>
              <p className="text-gray-500 mt-1">Top rated verified businesses in Nepal</p>
            </div>
          </div>
          
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredBusinesses?.map((biz) => (
              <div key={biz.id} className="min-w-[280px] sm:min-w-[320px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden snap-start group hover:shadow-md transition">
                <div className="h-24 bg-red-800 relative">
                  {biz.cover_url && <Image src={biz.cover_url} alt="Cover" fill className="object-cover opacity-80" />}
                </div>
                <div className="p-5 pt-0 relative">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-100 -mt-8 mb-3 overflow-hidden p-1 relative z-10">
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {biz.logo_url ? <Image src={biz.logo_url} alt={biz.name} width={64} height={64} className="object-cover" /> : <Store className="w-6 h-6 text-gray-400" />}
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate pr-2">{biz.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        <span className="truncate">{biz.city || 'Nepal'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded text-xs font-medium text-yellow-800 border border-yellow-100">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {biz.rating.toFixed(1)} ({biz.review_count})
                    </div>
                    <Link href={`/b/${biz.slug}`} className="text-sm font-semibold text-red-600 hover:text-red-700">
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FLASH DEALS & LATEST JOBS SPLIT */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* FLASH DEALS */}
          <section className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-6 h-6 text-red-500 fill-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Flash Deals</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {flashDeals?.map((offer) => (
                <Link href={`/offers/${offer.id}`} key={offer.id} className="flex bg-white rounded-xl border border-red-100 shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="w-32 bg-gray-100 flex-shrink-0 relative">
                    {offer.banner_url ? (
                      <Image src={offer.banner_url} alt={offer.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
                      -{offer.discount_percent}%
                    </div>
                  </div>
                  <div className="p-4 flex flex-col justify-center flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-1">{offer.title}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">{(offer as any).business?.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-red-600">₨ {offer.offer_price.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 line-through">₨ {offer.original_price.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* LATEST JOBS */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-500" />
                Latest Jobs
              </h2>
              <Link href="/jobs" className="text-sm font-medium text-blue-600">All</Link>
            </div>
            
            <div className="space-y-4">
              {latestJobs?.map((job) => (
                <Link href={`/jobs/${job.slug}`} key={job.id} className="block group border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">{(job as any).business?.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-medium">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">{job.job_type}</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{job.location_type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* UPCOMING EVENTS */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-500" />
              Upcoming Events
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents?.map((ev) => (
              <Link href={`/events/${ev.slug}`} key={ev.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition">
                <div className="h-40 bg-gray-100 relative">
                  {ev.banner_url ? (
                    <Image src={ev.banner_url} alt={ev.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Event Banner</div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-900">
                    {new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition">{ev.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    <span className="truncate">{ev.venue_name || 'Online'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`px-2.5 py-1 rounded-md text-sm font-semibold ${ev.is_free ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>
                      {ev.is_free ? 'FREE' : `₨ ${ev.price?.toLocaleString()}`}
                    </span>
                    <span className="text-sm font-medium text-gray-400 flex items-center gap-1 group-hover:text-purple-600 transition">
                      Details <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
