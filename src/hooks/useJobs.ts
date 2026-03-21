import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface JobFilters {
  category?: string
  jobType?: string[]
  locationType?: string
  districts?: string[]
  experience?: string[]
  minSalary?: number
  maxSalary?: number
  search?: string
  sort?: 'newest' | 'salary_desc' | 'deadline_asc'
}

export function useJobs(initialFilters?: JobFilters) {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const fetchJobs = useCallback(async ({ reset = false, activeFilters = initialFilters }: { reset?: boolean, activeFilters?: JobFilters } = {}) => {
    try {
      setLoading(true)
      const currentPage = reset ? 0 : page
      const from = currentPage * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('jobs')
        .select(`
          *,
          business:businesses(id, name, slug, logo_url, city, district_id)
        `, { count: 'exact' })
        .eq('status', 'active')

      if (activeFilters?.search) {
        query = query.or(`title.ilike.%${activeFilters.search}%,description.ilike.%${activeFilters.search}%`)
      }
      if (activeFilters?.category) {
        query = query.eq('category_id', activeFilters.category)
      }
      if (activeFilters?.jobType?.length) {
        query = query.in('job_type', activeFilters.jobType)
      }
      if (activeFilters?.locationType) {
        query = query.eq('location_type', activeFilters.locationType)
      }
      if (activeFilters?.districts?.length) {
        query = query.in('district_id', activeFilters.districts)
      }
      if (activeFilters?.experience?.length) {
        query = query.in('experience_level', activeFilters.experience)
      }
      if (activeFilters?.minSalary) {
        query = query.gte('salary_max', activeFilters.minSalary) // If job's max is at least min requested
      }
      if (activeFilters?.maxSalary) {
        query = query.lte('salary_min', activeFilters.maxSalary) // If job's min is at most max requested
      }

      // Sorting
      if (activeFilters?.sort === 'salary_desc') {
        query = query.order('salary_max', { ascending: false, nullsFirst: false })
      } else if (activeFilters?.sort === 'deadline_asc') {
        query = query.order('deadline', { ascending: true, nullsFirst: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      if (reset) {
        setJobs(data || [])
      } else {
        setJobs(prev => [...prev, ...(data || [])])
      }

      setHasMore(count !== null && count > to + 1)
      if (reset) setPage(1)
      else setPage(currentPage + 1)

    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, initialFilters, supabase])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchJobs({ reset: false })
    }
  }

  return { jobs, loading, hasMore, loadMore, fetchJobs }
}
