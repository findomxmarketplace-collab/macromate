/**
 * Check if the paywall should be shown.
 * Reads ?paywall=true from the URL query string.
 */
export function isPaywallEnabled() {
  if (typeof window === 'undefined') return false
  return window.location.href.includes('paywall=true') || 
         window.location.search.includes('paywall=true')
}