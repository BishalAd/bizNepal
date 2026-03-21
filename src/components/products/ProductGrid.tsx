'use client'

import React from 'react'
import ProductCard from './ProductCard'
import { ProductWithBusiness } from '@/types'

export default function ProductGrid({ 
  products, 
  isLoading, 
  skeletonCount = 8,
  onToggleSave
}: { 
  products: ProductWithBusiness[], 
  isLoading: boolean,
  skeletonCount?: number,
  onToggleSave?: (id: string, currentlySaved: boolean) => void
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
              </div>
              <div className="mt-4">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="flex gap-2">
                  <div className="h-9 bg-gray-200 rounded flex-1"></div>
                  <div className="h-9 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  )
}
