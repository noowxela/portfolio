import { NavPill } from '@/components/gallery/NavPill'
import { RouteCurtain } from '@/components/transition/RouteCurtain'
import { Outlet, ScrollRestoration } from 'react-router'
import { ThemeProvider } from './theme'

export function RootLayout() {
  return (
    <ThemeProvider>
      <NavPill />
      <Outlet />
      <RouteCurtain />
      <ScrollRestoration getKey={(location) => location.pathname} />
    </ThemeProvider>
  )
}
