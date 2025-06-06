import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance, isAfter, isBefore, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

/**
 * Combines multiple class names using clsx and applies Tailwind's merge strategy
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or Date object to a specified format
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "PPP",
  locale: string = "en"
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatStr, {
    locale: locale === "ar" ? ar : enUS,
  });
}

/**
 * Formats a date relative to current time (e.g., "2 days ago")
 */
export function formatRelativeDate(
  date: string | Date | null | undefined,
  locale: string = "en"
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: locale === "ar" ? ar : enUS,
  });
}

/**
 * Formats a price with currency symbol
 */
export function formatPrice(
  price: number,
  currency: string = "USD",
  locale: string = "en"
): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Truncates text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Detects if the current language direction is RTL
 */
export function isRTL(locale: string): boolean {
  return locale === "ar";
}

/**
 * Gets the text direction based on locale
 */
export function getDirection(locale: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Checks if a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Generates a random avatar URL
 */
export function getRandomAvatarUrl(seed?: string): string {
  const id = seed || Math.random().toString(36).substring(2, 10);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
}

/**
 * Creates a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Debounce function for limiting how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generates time slots for a booking system
 */
export function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 20,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  let currentHour = startHour;
  let currentMinute = 0;
  
  while (currentHour < endHour) {
    const hourFormatted = currentHour.toString().padStart(2, '0');
    const minuteFormatted = currentMinute.toString().padStart(2, '0');
    slots.push(`${hourFormatted}:${minuteFormatted}`);
    
    currentMinute += intervalMinutes;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = 0;
    }
  }
  
  return slots;
}
