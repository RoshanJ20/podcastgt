/**
 * @module utils
 *
 * General-purpose utility functions shared across the application.
 *
 * Key responsibilities:
 * - Merge Tailwind CSS class names with conflict resolution.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge CSS class names with Tailwind conflict resolution.
 *
 * Combines `clsx` (conditional class joining) with `twMerge` (Tailwind class
 * deduplication) so that later classes override conflicting earlier ones.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, conditionals).
 * @returns A single merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
