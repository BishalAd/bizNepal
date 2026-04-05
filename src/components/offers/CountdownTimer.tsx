'use client'

import React, { useState, useEffect } from 'react'

export default function CountdownTimer({ endsAt, size = 'lg' }: { endsAt: string | Date, size?: 'sm' | 'lg' }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const end = new Date(endsAt).getTime()

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = end - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft(null)
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const calc = calculateTimeLeft()
      if (!calc) {
        clearInterval(timer)
      } else {
        setTimeLeft(calc)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endsAt])

  if (isExpired) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg text-center ${size === 'sm' ? 'text-xs px-2 py-1' : ''}`}>
        EXPIRED
      </div>
    )
  }

  if (!timeLeft) {
    return <div className={`animate-pulse bg-gray-100 rounded-lg ${size === 'sm' ? 'h-8' : 'h-10'}`}></div>
  }

  const isUnderOneHour = timeLeft.days === 0 && timeLeft.hours === 0

  const Box = ({ label, value }: { label: string, value: number }) => (
    <div className={`flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm border rounded-xl shadow-sm transition-colors 
      ${size === 'sm' ? 'p-1 min-w-[2.75rem]' : 'p-1.5 min-w-[3.25rem] sm:min-w-[4rem]'}
      ${isUnderOneHour ? 'border-red-200 text-red-600 bg-red-50/30' : 'border-gray-100 text-gray-900 font-medium'}`}>
      <span className={`font-black font-mono leading-none tracking-tighter ${size === 'sm' ? 'text-sm' : 'text-lg sm:text-2xl'}`}>{value.toString().padStart(2, '0')}</span>
      <span className={`uppercase font-extrabold text-gray-400 mt-0.5 tracking-widest ${size === 'sm' ? 'text-[7px]' : 'text-[8px] sm:text-[9px]'}`}>{label}</span>
    </div>
  )

  return (
    <div className={`flex items-center ${size === 'sm' ? 'gap-1' : 'gap-1.5 sm:gap-3'}`}>
      <Box label="Days" value={timeLeft.days} />
      <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-lg'} ${isUnderOneHour ? 'text-red-400' : 'text-gray-300'}`}>:</span>
      <Box label="Hrs" value={timeLeft.hours} />
      <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-lg'} ${isUnderOneHour ? 'text-red-400' : 'text-gray-300'}`}>:</span>
      <Box label="Mins" value={timeLeft.minutes} />
      <span className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-lg'} ${isUnderOneHour ? 'text-red-400' : 'text-gray-300'}`}>:</span>
      <Box label="Secs" value={timeLeft.seconds} />
    </div>
  )
}
