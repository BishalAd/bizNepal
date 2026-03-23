'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MapPin, Store, Star } from 'lucide-react'
import { ProductWithBusiness } from '@/types'
import { useAuth } from '@/hooks/useAuth'

export default function ProductCard({ 
  product, 
  onToggleSave 
}: { 
  product: ProductWithBusiness,
  onToggleSave?: (id: string, currentlySaved: boolean) => void 
}) {
  const { user } = useAuth()
  
  const discountPercent = product.discount_price && product.discount_price > product.price
    ? Math.round(((product.discount_price - product.price) / product.discount_price) * 100)
    : null

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to save items')
      return
    }
    if (onToggleSave) {
      onToggleSave(product.id, !!product.isSaved)
    }
  }

  const mainImage = product.image_keys?.[0] || product.images?.[0] || 'https://placehold.co/600x400?text=BizNepal'

  return (
    <Link href={`/products/${product.slug}`} className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
      {/* Upper: Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-50 flex-shrink-0">
        <Image 
          src={mainImage} 
          alt={product.name} 
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        
        {/* Badges */}
        {discountPercent && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            {discountPercent}% OFF
          </div>
        )}
        
        {product.stock_quantity <= 0 && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}

        {/* Wishlist Button */}
        <button 
          onClick={handleSaveClick}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition-colors z-10 shadow-sm"
        >
          <Heart className={`w-5 h-5 ${product.isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Lower: Details */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          {/* Business Info */}
          <div className="flex items-center text-xs text-gray-500 mb-2 truncate">
            <Store className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{product.business?.name}</span>
            {product.business?.is_verified && (
              <svg className="w-3 h-3 ml-1 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-8.1 7.9z"/></svg>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm md:text-base leading-tight">
            {product.name}
          </h3>

          {/* Ratings */}
          {product.business?.rating > 0 && (
            <div className="flex items-center mt-1.5 text-xs text-gray-500">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium text-gray-700">{product.business.rating.toFixed(1)}</span>
              <span className="ml-1">({product.business.review_count})</span>
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">₨ {product.price.toLocaleString()}</span>
            {product.discount_price && (
              <span className="text-sm text-gray-400 line-through">₨ {product.discount_price.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs font-medium text-gray-500">
            {product.cod_available && <span className="px-1.5 py-0.5 bg-gray-100 rounded">COD</span>}
            {product.esewa_available && <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">eSewa</span>}
            {product.khalti_available && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">Khalti</span>}
          </div>

          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-semibold transition-colors">
              Add to Cart
            </button>
            <button className="flex-1 bg-red-600 text-white hover:bg-red-700 py-2 rounded-lg text-sm font-semibold transition-colors">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
