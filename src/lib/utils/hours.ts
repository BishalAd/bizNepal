/**
 * Utility to determine if a business is currently open
 * based on the Nepal timezone (Asia/Kathmandu).
 * 
 * Hours format expected in DB:
 * {
 *   "monday": { "open": "09:00", "close": "18:00", "closed": false },
 *   "tuesday": { "open": "09:00", "close": "18:00", "closed": false },
 *   // ...
 * }
 */

export function isBusinessOpen(hoursObj: any): boolean {
  if (!hoursObj) return false

  try {
    // Get current time in Nepal
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
    const now = new Date(nowStr)
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDayStr = days[now.getDay()]
    
    const todayHours = hoursObj[currentDayStr]
    if (!todayHours || todayHours.closed) return false

    if (!todayHours.open || !todayHours.close) return false

    // Parse open and close times (Expected format: "HH:mm")
    const [openH, openM] = todayHours.open.split(':').map(Number)
    const [closeH, closeM] = todayHours.close.split(':').map(Number)

    const currentH = now.getHours()
    const currentM = now.getMinutes()

    const currentMinutes = currentH * 60 + currentM
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    // If close time is past midnight (e.g. open 20:00, close 02:00)
    if (closeMinutes < openMinutes) {
      if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) {
        return true
      }
      return false
    }

    // Normal daytime hours
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes

  } catch (err) {
    console.error('Error calculating business hours:', err)
    return false
  }
}
