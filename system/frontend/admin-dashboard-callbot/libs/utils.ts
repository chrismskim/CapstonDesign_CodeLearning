// Keep existing cn function
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDateString: string): number | null {
  if (!birthDateString) return null
  try {
    const birthDate = new Date(birthDateString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  } catch (error) {
    console.error("Error calculating age:", error)
    return null
  }
}
