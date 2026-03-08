const VENDOR_SESSION_KEY = 'atspaces.vendor.phase1.session'

export function hasVendorSession() {
  if (typeof window === 'undefined' || typeof window.sessionStorage?.getItem !== 'function') {
    return false
  }

  return window.sessionStorage.getItem(VENDOR_SESSION_KEY) === 'active'
}

export function startVendorSession() {
  if (typeof window === 'undefined' || typeof window.sessionStorage?.setItem !== 'function') {
    return
  }

  window.sessionStorage.setItem(VENDOR_SESSION_KEY, 'active')
}

export function clearVendorSession() {
  if (typeof window === 'undefined' || typeof window.sessionStorage?.removeItem !== 'function') {
    return
  }

  window.sessionStorage.removeItem(VENDOR_SESSION_KEY)
}
