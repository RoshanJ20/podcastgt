/**
 * @module use-mobile
 *
 * React hook for detecting whether the viewport is at mobile width.
 *
 * Key responsibilities:
 * - Subscribe to viewport width changes via `matchMedia`.
 * - Return a boolean indicating whether the current viewport is mobile-sized.
 */

import * as React from "react"

/** Breakpoint (in pixels) below which the viewport is considered mobile. */
const MOBILE_BREAKPOINT = 768

/**
 * Detect whether the current viewport width is below the mobile breakpoint.
 *
 * Subscribes to `matchMedia` changes so the value updates on window resize.
 *
 * @returns `true` if the viewport width is less than 768px, `false` otherwise.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handleChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mediaQuery.addEventListener("change", handleChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return !!isMobile
}
