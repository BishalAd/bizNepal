'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProductWithBusiness } from '@/types'

export interface ProductFilters {
  category?: string
  district?: string | string[]
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  paymentMethod?: string[]
  search?: string
  sort?: string
}

export function useProducts({ initialData = [], filters = {}, pageSize = 12 }: { initialData?: ProductWithBusiness[], filters?: ProductFilters, pageSize?: number } = {}) {
  const [products, setProducts] = useState<ProductWithBusiness[]>(initialData)
  const [loading, setLoading] = useState<boolean>(!initialData.length)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [page, setPage] = useState<number>(0)
  
  const supabase = createClient()

  const fetchProducts = useCallback(async (options: { reset?: boolean, activeFilters?: ProductFilters } = {}) => {
    const isReset = options.reset || false
    const currentFilters = options.activeFilters || filters
    const currentPage = isReset ? 0 : page
    
    setLoading(true)
    setError(null)

    try {
      // Try round-robin view first, fallback to products table if missing
      let tableToQuery = 'products_round_robin'
      
      let query = supabase
        .from(tableToQuery)
        .select(`
          *,
          business:businesses(*)
        `)
        .eq('status', 'active')

      // Apply Filters
      if (currentFilters.category) {
        query = query.eq('category_id', currentFilters.category)
      }
      if (currentFilters.minPrice) {
        query = query.gte('price', currentFilters.minPrice)
      }
      if (currentFilters.maxPrice) {
        query = query.lte('price', currentFilters.maxPrice)
      }
      if (currentFilters.inStock) {
        query = query.gt('stock_quantity', 0)
      }
      if (currentFilters.search) {
        query = query.ilike('name', `%${currentFilters.search}%`)
      }
      
      // Payment method filters
      if (currentFilters.paymentMethod && currentFilters.paymentMethod.length > 0) {
        if (currentFilters.paymentMethod.includes('esewa')) query = query.eq('allows_esewa', true)
        if (currentFilters.paymentMethod.includes('khalti')) query = query.eq('allows_khalti', true)
        if (currentFilters.paymentMethod.includes('cod')) query = query.eq('allows_cod', true)
      }
      
      // Sort
      const sortBy = currentFilters.sort || 'newest'
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'popular':
          query = query.order('view_count', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Pagination
      const from = currentPage * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Process and set
      let formattedData = (data as unknown) as ProductWithBusiness[]
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user && formattedData.length > 0) {
        const { data: savedItems } = await supabase
          .from('saved_items')
          .select('product_id')
          .eq('user_id', user.id)
          .in('product_id', formattedData.map(p => p.id))
          
        const savedIds = new Set(savedItems?.map((s: any) => s.product_id))
        formattedData = formattedData.map(p => ({
          ...p,
          isSaved: savedIds.has(p.id)
        }))
      }

      if (isReset) {
        setProducts(formattedData)
        setPage(1)
      } else {
        setProducts(prev => [...prev, ...formattedData])
        setPage(p => p + 1)
      }

      setHasMore(formattedData.length === pageSize)

    } catch (err: any) {
      // Fallback if view is missing
      if (err.code === 'PGRST116' || (err.message && err.message.includes('products_round_robin'))) {
        console.warn('View products_round_robin missing, falling back to products table')
        try {
          let fbQuery = supabase
            .from('products')
            .select('*, business:businesses(*)')
            .eq('status', 'active')

          if (currentFilters.category) fbQuery = fbQuery.eq('category_id', currentFilters.category)
          if (currentFilters.minPrice) fbQuery = fbQuery.gte('price', currentFilters.minPrice)
          if (currentFilters.maxPrice) fbQuery = fbQuery.lte('price', currentFilters.maxPrice)
          
          if (currentFilters.paymentMethod && currentFilters.paymentMethod.length > 0) {
            if (currentFilters.paymentMethod.includes('esewa')) fbQuery = fbQuery.eq('allows_esewa', true)
            if (currentFilters.paymentMethod.includes('khalti')) fbQuery = fbQuery.eq('allows_khalti', true)
            if (currentFilters.paymentMethod.includes('cod')) fbQuery = fbQuery.eq('allows_cod', true)
          }

          const sortBy = currentFilters.sort || 'newest'
          if (sortBy === 'price_asc') fbQuery = fbQuery.order('price', { ascending: true })
          else if (sortBy === 'price_desc') fbQuery = fbQuery.order('price', { ascending: false })
          else fbQuery = fbQuery.order('created_at', { ascending: false })

          const { data, error: fbError } = await fbQuery
            .range(currentPage * pageSize, (currentPage * pageSize) + pageSize - 1)
          
          if (fbError) throw fbError
          
          let formattedData = (data as unknown) as ProductWithBusiness[]
          if (isReset) {
            setProducts(formattedData)
            setPage(1)
          } else {
            setProducts(prev => [...prev, ...formattedData])
            setPage(p => p + 1)
          }
          setHasMore(formattedData.length === pageSize)
          return
        } catch (fbErr: any) {
          setError(fbErr.message || 'Error fetching products after fallback.')
        }
      }

      console.error('Error fetching products:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
      setError(err.message || 'An unexpected error occurred while fetching products.')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, supabase])

  // Load initial if empty
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts({ reset: true })
    }
  }, [])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts({ reset: false })
    }
  }

  const toggleSave = async (id: string, currentlySaved: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isSaved: !currentlySaved } : p))
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      if (currentlySaved) {
        await supabase.from('saved_items').delete().eq('user_id', user.id).eq('product_id', id)
      } else {
        await supabase.from('saved_items').insert({ user_id: user.id, product_id: id })
      }
    } catch (err: any) {
      console.error('Error toggling save status:', err)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isSaved: currentlySaved } : p))
    }
  }

  return { products, loading, error, hasMore, loadMore, toggleSave, fetchProducts }
}
