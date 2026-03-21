/**
 * Nepal Public Holidays Calendar (2024/2081 BS Estimate Mappings)
 * Helps determine if a business might be closed or running holiday specials.
 */

export interface Holiday {
  date: string // YYYY-MM-DD
  nameEn: string
  nameNp: string
  isNationalHoliday: boolean
}

export const NEPAL_HOLIDAYS_2024: Holiday[] = [
  { date: '2024-01-11', nameEn: 'Prithvi Jayanti', nameNp: 'पृथ्वी जयन्ती', isNationalHoliday: true },
  { date: '2024-01-15', nameEn: 'Maghe Sankranti', nameNp: 'माघे संक्रान्ति', isNationalHoliday: true },
  { date: '2024-02-14', nameEn: 'Saraswati Puja', nameNp: 'सरस्वती पूजा', isNationalHoliday: false },
  { date: '2024-03-08', nameEn: 'Maha Shivaratri', nameNp: 'महाशिवरात्री', isNationalHoliday: true },
  { date: '2024-03-24', nameEn: 'Fagu Purnima (Holi)', nameNp: 'फागु पूर्णिमा (होली)', isNationalHoliday: true },
  { date: '2024-04-13', nameEn: 'Nepali New Year (Baisakh 1)', nameNp: 'नयाँ वर्ष (२०८१)', isNationalHoliday: true },
  { date: '2024-05-23', nameEn: 'Buddha Jayanti', nameNp: 'बुद्ध जयन्ती', isNationalHoliday: true },
  { date: '2024-08-19', nameEn: 'Janai Purnima / Raksha Bandhan', nameNp: 'जनै पूर्णिमा', isNationalHoliday: true },
  { date: '2024-08-26', nameEn: 'Gaura Parva', nameNp: 'गौरा पर्व', isNationalHoliday: false },
  { date: '2024-09-06', nameEn: 'Teej', nameNp: 'तीज (महिलाहरुको लागि मात्र)', isNationalHoliday: true },
  { date: '2024-10-03', nameEn: 'Ghatasthapana (Dashain Starts)', nameNp: 'घटस्थापना', isNationalHoliday: true },
  { date: '2024-10-10', nameEn: 'Phulpati', nameNp: 'फूलपाती', isNationalHoliday: true },
  { date: '2024-10-11', nameEn: 'Maha Ashtami', nameNp: 'महा अष्टमी', isNationalHoliday: true },
  { date: '2024-10-12', nameEn: 'Maha Navami / Vijaya Dashami', nameNp: 'विजया दशमी', isNationalHoliday: true },
  { date: '2024-10-31', nameEn: 'Laxmi Puja (Tihar)', nameNp: 'लक्ष्मी पूजा (तिहार)', isNationalHoliday: true },
  { date: '2024-11-02', nameEn: 'Bhai Tika', nameNp: 'भाइटीका', isNationalHoliday: true },
  { date: '2024-11-07', nameEn: 'Chhath Parva', nameNp: 'छठ पर्व', isNationalHoliday: true },
  { date: '2024-12-25', nameEn: 'Christmas Day', nameNp: 'क्रिसमस', isNationalHoliday: true }
]

export function getTodayHoliday(): Holiday | null {
  const today = new Date().toISOString().split('T')[0]
  return NEPAL_HOLIDAYS_2024.find(h => h.date === today) || null
}

export function isHoliday(dateString: string): boolean {
  return NEPAL_HOLIDAYS_2024.some(h => h.date === dateString && h.isNationalHoliday)
}
