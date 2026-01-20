import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number consistently for SSR/CSR hydration
 * Uses 'en-US' locale to ensure consistent formatting
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}
