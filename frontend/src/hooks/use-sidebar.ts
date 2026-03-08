import { useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'

const SIDEBAR_COLLAPSED_KEY = 'atspaces.sidebar.collapsed'

export interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  isDesktop: boolean
  toggleCollapse: () => void
  openMobile: () => void
  closeMobile: () => void
}

export function useSidebar(): SidebarState {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    if (typeof window.localStorage?.getItem !== 'function') {
      return false
    }

    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.localStorage?.setItem !== 'function') {
      return
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleDesktopMode = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleDesktopMode)
    return () => {
      mediaQuery.removeEventListener('change', handleDesktopMode)
    }
  }, [])

  return useMemo(
    () => ({
      collapsed,
      mobileOpen,
      isDesktop,
      toggleCollapse: () => setCollapsed((value) => !value),
      openMobile: () => {
        if (!isDesktop) {
          setMobileOpen(true)
        }
      },
      closeMobile: () => setMobileOpen(false),
    }),
    [collapsed, mobileOpen, isDesktop],
  )
}
