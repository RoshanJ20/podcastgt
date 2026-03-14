/**
 * @module progress-utils
 *
 * Utility functions for calculating progress statistics used in the
 * dashboard. Includes streak calculation (consecutive days of activity),
 * weekly completion counts, and human-readable relative date formatting.
 */

interface ProgressTimestamp {
  completed_at: string
}

/**
 * Calculates the current streak of consecutive days with completions.
 * Returns 0 if the most recent completion is older than yesterday.
 */
export function getStreak(progress: ProgressTimestamp[]): number {
  if (progress.length === 0) return 0

  const uniqueDates = [
    ...new Set(
      progress.map((entry) => new Date(entry.completed_at).toDateString()),
    ),
  ].sort(
    (dateA, dateB) =>
      new Date(dateB).getTime() - new Date(dateA).getTime(),
  )

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0

  let streak = 1
  for (let index = 1; index < uniqueDates.length; index++) {
    const currentDate = new Date(uniqueDates[index - 1])
    const previousDate = new Date(uniqueDates[index])
    const daysDifference = Math.round(
      (currentDate.getTime() - previousDate.getTime()) / 86400000,
    )
    if (daysDifference === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Counts the number of completions since the start of the current week (Sunday).
 */
export function getThisWeekCount(progress: ProgressTimestamp[]): number {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return progress.filter(
    (entry) => new Date(entry.completed_at) >= startOfWeek,
  ).length
}

/**
 * Formats a date string as a human-readable relative time
 * (e.g., "just now", "5m ago", "2d ago", or "14 Mar").
 */
export function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
