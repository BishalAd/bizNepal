import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray'
}

export default function StatsCard({ title, value, icon, trend, trendValue, color = 'blue' }: StatsCardProps) {
  
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-500',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
       <div className="flex justify-between items-start mb-4">
         <div className={`p-3 rounded-xl ${colorMap[color]}`}>
           {icon}
         </div>
         {trend && trendValue && (
           <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
             trend === 'up' ? 'text-green-700 bg-green-50' : 
             trend === 'down' ? 'text-red-700 bg-red-50' : 
             'text-gray-600 bg-gray-100'
           }`}>
             {trend === 'up' && <TrendingUp className="w-3 h-3" />}
             {trend === 'down' && <TrendingDown className="w-3 h-3" />}
             {trend === 'neutral' && <Minus className="w-3 h-3" />}
             {trendValue}
           </div>
         )}
       </div>
       
       <div>
         <h4 className="text-gray-500 text-sm font-semibold mb-1">{title}</h4>
         <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h2>
       </div>
    </div>
  )
}
