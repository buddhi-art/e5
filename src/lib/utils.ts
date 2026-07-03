import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Ensures a URL has a protocol prefix so <a href> works correctly.
 * If the string is empty or falsy, returns it as-is.
 */
export function normalizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  // If it looks like it starts with a protocol-less domain or path
  if (/^[a-zA-Z0-9]/.test(trimmed)) return `https://${trimmed}`
  return trimmed
}
