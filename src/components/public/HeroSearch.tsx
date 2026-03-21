'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const CATEGORIES = [
  { label: '📦 Products', path: '/products' },
  { label: '🏢 Services', path: '/businesses' },
  { label: '💼 Jobs', path: '/jobs' },
  { label: '📅 Events', path: '/events' },
  { label: '🔥 Offers', path: '/offers' },
  { label: '📍 Businesses', path: '/businesses' },
]

export default function HeroSearch() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'businesses' | 'jobs' | 'events'>('all')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const pathMap: Record<string, string> = {
      all: '/products',
      products: '/products',
      businesses: '/businesses',
      jobs: '/jobs',
      events: '/events',
    }

    const basePath = pathMap[activeTab]
    router.push(`${basePath}?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/10 backdrop-blur rounded-xl p-1 mb-3 border border-white/15 overflow-x-auto hide-scrollbar">
        {(['all', 'products', 'businesses', 'jobs', 'events'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize flex-shrink-0 transition-all ${
              activeTab === tab
                ? 'bg-white text-red-700 shadow'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl shadow-red-900/50">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 sm:py-0 border border-transparent focus-within:border-red-300 focus-within:bg-white transition-colors">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'all' ? 'products, businesses, jobs...' : activeTab}...`}
            className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-base"
            autoFocus={false}
          />
        </div>
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-colors whitespace-nowrap shadow-md"
        >
          Search
        </button>
      </form>

      {/* Quick Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => router.push(cat.path)}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition text-sm font-medium text-white/90 hover:text-white"
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
