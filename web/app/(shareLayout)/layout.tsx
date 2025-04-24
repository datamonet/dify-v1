import React from 'react'
import type { FC } from 'react'
import type { Metadata } from 'next'
import AuthCheck from './auth-check'

export const metadata: Metadata = {
  icons: 'data:,', // prevent browser from using default favicon
}

const Layout: FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <div className="h-full min-w-[300px] pb-[env(safe-area-inset-bottom)]">
      {/* takin code: share layout need wrap with auth check */}
      <AuthCheck>
        {children}
      </AuthCheck>
    </div>
  )
}

export default Layout
