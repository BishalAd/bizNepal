/**
 * Nepal-specific utility functions for Biznity
 */
import { formatDistanceToNow, differenceInDays, isSameDay } from 'date-fns'

export function formatNPR(amount: number): string {
  // Uses the Indian/Nepali numbering system (XX,XX,XXX)
  return '₨ ' + amount.toLocaleString('en-IN')
}

export function getNepalTime(): Date {
  const d = new Date()
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000)
  // Nepal is UTC +5:45
  return new Date(utc + (3600000 * 5.75))
}

export interface BusinessHours {
  mon: { open: string, close: string, isClosed: boolean }
  tue: { open: string, close: string, isClosed: boolean }
  wed: { open: string, close: string, isClosed: boolean }
  thu: { open: string, close: string, isClosed: boolean }
  fri: { open: string, close: string, isClosed: boolean }
  sat: { open: string, close: string, isClosed: boolean }
  sun: { open: string, close: string, isClosed: boolean }
}

export function isBusinessOpen(hours?: BusinessHours): boolean {
  if (!hours) return true // assume open if no hours provided
  const now = getNepalTime()
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const today = days[now.getDay()] as keyof BusinessHours
  
  const todayHours = hours[today]
  if (!todayHours || todayHours.isClosed) return false

  const currentT = now.getHours() * 60 + now.getMinutes()
  
  const [oH, oM] = todayHours.open.split(':').map(Number)
  const openT = oH * 60 + oM
  
  const [cH, cM] = todayHours.close.split(':').map(Number)
  const closeT = cH * 60 + cM

  return currentT >= openT && currentT <= closeT
}

export function getDaysUntilDeadline(deadline: Date | string): string {
  const dateStr = typeof deadline === 'string' ? deadline : deadline.toISOString()
  const d = new Date(dateStr)
  const now = getNepalTime()
  
  if (isSameDay(d, now)) {
    return 'Today is deadline'
  }
  
  if (d.getTime() < now.getTime()) {
    return 'Expired'
  }
  
  const diff = differenceInDays(d, now)
  if (diff === 0) return 'Closes Tomorrow'
  return `${diff} days left`
}

export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // removed ambiguous chars like I, O, 0, 1
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  return text.slice(0, maxLength).trim() + '...'
}

export function timeAgo(date: Date | string, language: 'en' | 'np' = 'en'): string {
  const d = new Date(date)
  const englishAgo = formatDistanceToNow(d, { addSuffix: true })
  
  if (language === 'en') return englishAgo

  // Basic Nepali time ago mapping (simplified substitution for frontend)
  let npAgo = englishAgo
    .replace('less than a minute ago', 'भर्खरै')
    .replace('a minute ago', '१ मिनेट अघि')
    .replace(' minutes ago', ' मिनेट अघि')
    .replace('about an hour ago', '१ घण्टा अघि')
    .replace(' hours ago', ' घण्टा अघि')
    .replace('a day ago', '१ दिन अघि')
    .replace(' days ago', ' दिन अघि')
    .replace('about a month ago', '१ महिना अघि')
    .replace(' months ago', ' महिना अघि')
    .replace('about a year ago', '१ वर्ष अघि')
    .replace(' years ago', ' वर्ष अघि')
    .replace(/(\d+)/g, (match) => {
      // Convert standard numerals to Devanagari numerals
      const npDigits = ['०','१','२','३','४','५','६','७','८','९']
      return match.split('').map(n => npDigits[Number(n)] || n).join('')
    })

  return npAgo
}
