/**
 * Returns today's date as YYYY-MM-DD using the device's local timezone.
 * Do NOT use new Date().toISOString().split('T')[0] — that returns UTC date,
 * which differs from local date for users east of UTC after 00:00 local time.
 */
export function getLocalDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
