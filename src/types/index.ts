export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Category {
  id: string
  name_en: string
  name_np?: string
  name?: string // keeping for compatibility
  icon?: string
  type: 'product' | 'service' | 'job' | 'event'
  parent_id?: string
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  tagline?: string
  description?: string
  logo_url?: string
  cover_url?: string
  category_id?: string
  phone?: string
  whatsapp?: string
  email?: string
  website?: string
  district_id?: number
  city?: string
  address?: string
  is_verified: boolean
  is_active: boolean
  rating: number
  review_count: number
  created_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  slug: string
  description?: string
  price: number
  discount_price?: number
  image_keys?: string[]
  images?: string[] // keeping for legacy
  category_id?: string
  stock_quantity: number
  allows_cod: boolean
  allows_esewa: boolean
  allows_khalti: boolean
  allows_pickup: boolean
  cod_available?: boolean // keeping for compatibility
  esewa_available?: boolean // keeping for compatibility
  khalti_available?: boolean // keeping for compatibility
  status: 'active' | 'draft' | 'out_of_stock'
  view_count: number
  created_at: string
}

export interface Offer {
  id: string
  business_id: string
  product_id?: string
  title: string
  description?: string
  banner_url?: string
  original_price: number
  offer_price: number
  discount_percent?: number
  ends_at: string
  status: string
}

export interface Job {
  id: string
  business_id: string
  title: string
  slug: string
  location_type: string
  job_type: string
  salary_min?: number
  salary_max?: number
  status: string
  created_at: string
}

export interface Event {
  id: string
  business_id?: string
  title: string
  slug: string
  banner_url?: string
  starts_at: string
  venue_name?: string
  price?: number
  is_free: boolean
}

// Joined Types for UI
export interface ProductWithBusiness extends Product {
  business: Business
  isSaved?: boolean
}

export interface JobWithBusiness extends Job {
  business: Business
}

export interface OfferWithBusiness extends Offer {
  business: Business
}
