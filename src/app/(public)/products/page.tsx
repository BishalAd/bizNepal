import { createClient } from '@/lib/supabase/server'
import ProductsClientListing from './ProductsClientListing'
import { Metadata } from 'next'

export async function generateMetadata({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const categoryId = typeof searchParams.category === 'string' ? searchParams.category : undefined
  
  let title = "Products | BizNepal"
  
  if (categoryId) {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('name_en').eq('id', categoryId).single()
    if (data) {
      title = `${data.name_en} Products | BizNepal`
    }
  }

  return {
    title,
    description: "Browse the best products from verified businesses across Nepal.",
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient()
  
  // Parallel fetch for filters
  const [
    { data: categories },
    { data: districts }
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('districts').select('*').order('name_en')
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* We pass searchParams directly as initialFilters */}
      <ProductsClientListing 
        initialFilters={searchParams} 
        categories={categories} 
        districts={districts} 
      />
    </div>
  )
}
