import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine des classes Tailwind avec resolution des conflits.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
