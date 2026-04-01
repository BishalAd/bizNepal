'use client'

import React, { useState, useEffect } from 'react'

export default function CountdownTimer({ endsAt }: { endsAt: string | Date }) {
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
      <div className="bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg text-center">
        EXPIRED
      </div>
    )
  }

  if (!timeLeft) {
    return <div className="animate-pulse bg-gray-100 h-10 rounded-lg"></div>
  }

  const isUnderOneHour = timeLeft.days === 0 && timeLeft.hours === 0

  const Box = ({ label, value }: { label: string, value: number }) => (
    <div className={`flex flex-col items-center justify-center bg-white border rounded-lg p-2 min-w-[3.5rem] sm:min-w-[4rem] shadow-sm ${isUnderOneHour ? 'border-red-300 text-red-600' : 'border-gray-200 text-gray-900'}`}>
      <span className="text-xl sm:text-2xl font-bold font-mono leading-none tracking-tighter">{value.toString().padStart(2, '0')}</span>
      <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">{label}</span>
    </div>
  )

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Box label="Days" value={timeLeft.days} />
      <span className={`text-xl font-bold ${isUnderOneHour ? 'text-red-400' : 'text-gray-400'}`}>:</span>
      <Box label="Hrs" value={timeLeft.hours} />
      <span className={`text-xl font-bold ${isUnderOneHour ? 'text-red-400' : 'text-gray-400'}`}>:</span>
      <Box label="Mins" value={timeLeft.minutes} />
      <span className={`text-xl font-bold ${isUnderOneHour ? 'text-red-400' : 'text-gray-400'}`}>:</span>
      <Box label="Secs" value={timeLeft.seconds} />
    </div>
  )
}
