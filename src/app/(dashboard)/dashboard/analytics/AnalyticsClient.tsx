'use client'

import React, { useState, useMemo } from 'react'
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, FileText, TrendingUp, ShoppingBag, Users, CalendarDays, Eye, CreditCard, Package } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import toast, { Toaster } from 'react-hot-toast'

export default function AnalyticsClient({ orders, products, jobs, events, businessName }: any) {
  const [dateRange, setDateRange] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Date Filtering Logic
  const getFilteredData = (dataArray: any[], dateField: string = 'created_at') => {
    return dataArray.filter(item => {
      const date = new Date(item[dateField])
      const today = endOfDay(new Date())
      if (dateRange === '1') return isAfter(date, startOfDay(new Date()))
      if (dateRange === '7') return isAfter(date, subDays(today, 7))
      if (dateRange === '30') return isAfter(date, subDays(today, 30))
      
      if (dateRange === 'custom' && customStart && customEnd) {
        return isAfter(date, startOfDay(new Date(customStart))) && isBefore(date, endOfDay(new Date(customEnd)))
      }
      return true
    })
  }

  const fOrders = getFilteredData(orders)
  const fJobs = getFilteredData(jobs)
  const fEvents = getFilteredData(events)

  // STATS
  const stats = useMemo(() => {
    const totalRev = fOrders.reduce((sum, o) => sum + Number(o.total||0), 0)
    const avgOrder = fOrders.length ? (totalRev / fOrders.length) : 0
    let totalApps = 0
    fJobs.forEach((j:any) => totalApps += (j.job_applications?.length || 0))
    let totalBookings = 0
    fEvents.forEach((e:any) => totalBookings += (e.event_bookings?.length || 0))
    
    // Calculate total product views
    const totalViews = products.reduce((sum:number, p:any) => sum + Number(p.view_count||0), 0)
    
    // Conversion Rate: Orders / Views
    const conversionRate = totalViews > 0 ? ((fOrders.length / totalViews) * 100).toFixed(2) : '0.00'

    return { totalRev, totalOrders: fOrders.length, avgOrder, totalApps, totalBookings, totalViews, conversionRate }
  }, [fOrders, fJobs, fEvents, products])

  // CHART 1: Revenue Over Time
  const revenueChartData = useMemo(() => {
    const dailyMap: Record<string, number> = {}
    fOrders.forEach(o => {
      const d = format(new Date(o.created_at), 'MMM dd')
      dailyMap[d] = (dailyMap[d] || 0) + Number(o.total||0)
    })
    return Object.keys(dailyMap).map(k => ({ date: k, revenue: dailyMap[k] })).reverse()
  }, [fOrders])

  // CHART 2: Orders Status Donut
  const orderStatusData = useMemo(() => {
    const counts = { pending: 0, processing: 0, dispatched: 0, delivered: 0, cancelled: 0 }
    fOrders.forEach(o => {
      if(counts[o.order_status as keyof typeof counts] !== undefined) counts[o.order_status as keyof typeof counts]++
    })
    return [
      { name: 'Delivered', value: counts.delivered, fill: '#10B981' },
      { name: 'Pending', value: counts.pending, fill: '#F59E0B' },
      { name: 'Processing/Disp', value: counts.processing + counts.dispatched, fill: '#3B82F6' },
      { name: 'Cancelled', value: counts.cancelled, fill: '#EF4444' }
    ].filter(i => i.value > 0)
  }, [fOrders])

  // CHART 3: Jobs Bar Chart
  const jobsData = useMemo(() => {
    return fJobs.map((j:any) => ({
      name: j.title.substring(0, 15) + '...',
      applications: j.job_applications?.length || 0
    }))
  }, [fJobs])

  // CHART 5: Category Distribution
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {}
    products.forEach((p:any) => {
      const cat = Array.isArray(p.category) ? p.category[0]?.name_en : (p.category as any)?.name_en || 'Other'
      catMap[cat] = (catMap[cat] || 0) + 1
    })
    return Object.keys(catMap).map((k, i) => ({ 
      name: k, 
      value: catMap[k],
      fill: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5]
    }))
  }, [products])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-none text-white px-4 py-2 rounded-xl shadow-xl text-sm font-bold">
          <p className="mb-1 text-gray-400 text-xs">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: payload[0].color || payload[0].fill}} />
            <span>{typeof payload[0].value === 'number' && payload[0].name === 'revenue' ? `₨ ${payload[0].value.toLocaleString()}` : payload[0].value}</span>
          </div>
        </div>
      )
    }
    return null
  }

  const handleExportPDF = async () => {
     const dashboard = document.getElementById('analytics-dashboard')
     if (!dashboard) return
     const toastId = toast.loading('Generating PDF Report...')
     try {
       const canvas = await html2canvas(dashboard, { scale: 1.5, backgroundColor: '#ffffff' })
       const imgData = canvas.toDataURL('image/png')
       const pdf = new jsPDF('p', 'mm', 'a4')
       const pdfW = pdf.internal.pageSize.getWidth()
       const pdfH = (canvas.height * pdfW) / canvas.width
       pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
       pdf.save(`${businessName}_Analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
       toast.success('PDF Downloaded!', { id: toastId })
     } catch (err) {
       toast.error('Failed to generate PDF', { id: toastId })
     }
  }

  const exportCSV = () => {
    let csv = "Metrics,Value\n"
    csv += `Total Revenue,${stats.totalRev}\n`
    csv += `Total Orders,${stats.totalOrders}\n`
    csv += `Average Order Value,${stats.avgOrder}\n`
    csv += `Job Applications,${stats.totalApps}\n`
    csv += `Event Bookings,${stats.totalBookings}\n`
    csv += `Product Views,${stats.totalViews}\n\n`
    csv += "Top Products,Sales Count\n"
    products.forEach((p:any) => {
       csv += `"${p.name}",${p.sales_count || 0}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${businessName}_Analytics.csv`)
    toast.success('Exported to CSV')
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20 max-w-7xl mx-auto">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Overview</h1>
            <p className="text-gray-500 mt-1">Track your performance and conversion metrics.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
               {[
                 {l:'Today', v:'1'}, {l:'7 Days', v:'7'}, {l:'30 Days', v:'30'}, {l:'Custom', v:'custom'}
               ].map(t => (
                 <button 
                   key={t.v} onClick={() => setDateRange(t.v)} 
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition ${dateRange === t.v ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                 >{t.l}</button>
               ))}
             </div>
             
             {dateRange === 'custom' && (
               <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-sm">
                  <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="border-none text-sm font-bold bg-transparent outline-none p-2 text-gray-700" />
                  <span className="text-gray-300">-</span>
                  <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="border-none text-sm font-bold bg-transparent outline-none p-2 text-gray-700" />
               </div>
             )}

             <button onClick={exportCSV} className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-gray-600 transition" title="Export CSV"><FileText className="w-5 h-5"/></button>
             <button onClick={handleExportPDF} className="p-2 border border-gray-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-xl text-gray-600 transition" title="Export PDF"><Download className="w-5 h-5"/></button>
          </div>
        </div>

        <div id="analytics-dashboard" className="space-y-8 !bg-transparent p-1">
           {/* STATS ROW */}
           <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <StatsCard title="Total Revenue" value={`₨ ${stats.totalRev.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5"/>} color="green" />
              <StatsCard title="Conversion" value={`${stats.conversionRate}%`} icon={<TrendingUp className="w-5 h-5"/>} color="green" />
              <StatsCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingBag className="w-5 h-5"/>} color="blue" />
              <StatsCard title="Avg Order" value={`₨ ${Math.round(stats.avgOrder).toLocaleString()}`} icon={<CreditCard className="w-5 h-5"/>} color="purple" />
              <StatsCard title="Applications" value={stats.totalApps} icon={<Users className="w-5 h-5"/>} color="orange" />
              <StatsCard title="Event Bookings" value={stats.totalBookings} icon={<CalendarDays className="w-5 h-5"/>} color="red" />
              <StatsCard title="Profile Views" value={stats.totalViews} icon={<Eye className="w-5 h-5"/>} color="gray" />
           </div>

           {/* MAJOR CHARTS */}
           <div className="grid lg:grid-cols-4 gap-6">
               
               {/* Line Chart */}
               <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-500"/> Revenue Over Time</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 'bold'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₨${v>=1000 ? v/1000+'k' : v}`} tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 'bold'}} dx={-10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               {/* Category Dist Donut */}
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                 <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2"><Package className="w-5 h-5 text-orange-500"/> Categories</h3>
                 <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(v) => <span className="text-[10px] font-bold text-gray-700 ml-1">{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
               </div>

           </div>

               {/* Donut Chart */}
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                 <h3 className="font-extrabold text-gray-900 mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-blue-500"/> Order Status</h3>
                 <div className="h-[250px] w-full relative group">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={orderStatusData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {orderStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(v) => <span className="text-xs font-bold text-gray-700 ml-1">{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center -mt-8 pointer-events-none">
                       <span className="text-3xl font-black text-gray-900">{stats.totalOrders}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders</span>
                    </div>
                 </div>
               </div>

           <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Product Horizontal Bar */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-extrabold text-gray-900 mb-6">Top Products by Sales</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={products} layout="vertical" margin={{top: 0, right: 20, left: 40, bottom: 0}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280', fontWeight: 'bold'}} width={120} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="sales_count" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Job Applications Bar Chart */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                 <h3 className="font-extrabold text-gray-900 mb-6">Job Post Applications</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} dy={10} interval={0} angle={-15} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 'bold'}} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f9fafb'}} />
                        <Bar dataKey="applications" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </>
  )
}
