'use client'

import type { FC } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/app/api/user'
import { useContext } from 'use-context-selector'
import AppContext from '@/context/app-context'
import { AppContextProvider } from '@/context/app-context'
import { ModalContextProvider } from '@/context/modal-context'

type AuthCheckProps = {
  children: React.ReactNode
}

const AuthCheckInner: FC<AuthCheckProps> = ({ children }) => {
  const router = useRouter()
  const { mutateUserProfile } = useContext(AppContext)

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie()
      if (!token) {
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
        return
      }

      // After token check, fetch user profile
      try {
        mutateUserProfile()
      }
 catch (error) {
        console.error('Failed to fetch user profile:', error)
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
      }
    }
    checkAuth()
  }, [router, mutateUserProfile])

  return <>{children}</>
}

const AuthCheck: FC<AuthCheckProps> = ({ children }) => {
  return (
    <AppContextProvider>
      <ModalContextProvider>
        <AuthCheckInner>{children}</AuthCheckInner>
      </ModalContextProvider>
    </AppContextProvider>
  )
}

export default AuthCheck
