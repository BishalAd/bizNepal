'use client'

import { useState, useEffect } from 'react'
import { useProducts, ProductFilters } from '@/hooks/useProducts'
import ProductGrid from '@/components/products/ProductGrid'
import { Filter, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProductsClientListing({ initialFilters, categories, districts }: any) {
  const router = useRouter()
  // searchParams can be read here directly via passing from props, or hook
  
  const [filters, setFilters] = useState<ProductFilters>({
    category: initialFilters?.category || '',
    minPrice: initialFilters?.minPrice ? Number(initialFilters.minPrice) : undefined,
    maxPrice: initialFilters?.maxPrice ? Number(initialFilters.maxPrice) : undefined,
    inStock: initialFilters?.inStock === 'true',
    paymentMethod: initialFilters?.paymentMethod ? (Array.isArray(initialFilters.paymentMethod) ? initialFilters.paymentMethod : [initialFilters.paymentMethod]) : [],
    sort: initialFilters?.sort || 'newest',
  })

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const { products, loading, hasMore, loadMore, fetchProducts } = useProducts({
    filters,
    pageSize: 12
  })

  // Update URL manually when filters change
  useEffect(() => {
    fetchProducts({ reset: true, activeFilters: filters })
    
    // Update URL params
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.inStock) params.set('inStock', 'true')
    if (filters.sort) params.set('sort', filters.sort)
    if (filters.paymentMethod?.length) {
      filters.paymentMethod.forEach(m => params.append('paymentMethod', m))
    }
    
    router.replace(`/products?${params.toString()}`, { scroll: false })
  }, [filters, fetchProducts, router])

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePaymentToggle = (method: string) => {
    setFilters(prev => {
      const current = prev.paymentMethod || []
      const updated = current.includes(method) 
        ? current.filter(m => m !== method)
        : [...current, method]
      return { ...prev, paymentMethod: updated }
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => setIsMobileFiltersOpen(true)} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg font-medium">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`md:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden md:block'}`}>
        <div className="flex justify-between items-center md:hidden mb-6">
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-8">
          {/* Category */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={!filters.category} onChange={() => handleFilterChange('category', '')} className="text-red-600 focus:ring-red-500 rounded-full" />
                <span className="text-sm text-gray-700">All Categories</span>
              </label>
              {categories?.filter((c:any)=>c.type==='product').map((cat: any) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" 
                    checked={filters.category === cat.id} 
                    onChange={() => handleFilterChange('category', cat.id)} 
                    className="text-red-600 focus:ring-red-500 rounded-full" 
                  />
                  <span className="text-sm text-gray-700">{cat.name_en}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
              <span className="text-gray-400">-</span>
              <input type="number" placeholder="Max" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* In Stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" 
                checked={filters.inStock || false} 
                onChange={(e) => handleFilterChange('inStock', e.target.checked)} 
                className="w-4 h-4 text-red-600 focus:ring-red-500 rounded" 
              />
              <span className="text-sm font-semibold text-gray-900">In Stock Only</span>
            </label>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
            <div className="space-y-2">
              {['cod', 'esewa', 'khalti'].map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" 
                    checked={(filters.paymentMethod || []).includes(method)} 
                    onChange={() => handlePaymentToggle(method)} 
                    className="w-4 h-4 text-red-600 focus:ring-red-500 rounded" 
                  />
                  <span className="text-sm text-gray-700 uppercase">{method}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="mt-8 md:hidden">
          <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl">
            Apply Filters
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select 
              value={filters.sort || 'newest'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <ProductGrid products={products} isLoading={loading} skeletonCount={12} />

        {hasMore && !loading && (
          <div className="mt-10 text-center">
            <button 
              onClick={loadMore}
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
