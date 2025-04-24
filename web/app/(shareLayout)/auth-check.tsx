'use client'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/app/api/user'
import { useContext } from 'use-context-selector'
import AppContext from '@/context/app-context'
import Loading from '@/app/components/base/loading'
// takin code: share layout need wrap with auth check
import { AppContextProvider } from '@/context/app-context'
import { ModalContextProvider } from '@/context/modal-context'

type AuthCheckProps = {
  children: React.ReactNode
}

// TODO: 扣费，api扣费；useEffect(() => {
//   const checkAuth = async () => {
//     const token = await getCookie()
//     if (!token) {
//       router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
//       return
//     }

//     // After token check, fetch user profile
//     try {
//       if (!userProfile?.id) {
//         mutateUserProfile()
//         return
//       }
//       // Add user_id to URL if in share layout and not already present
//       if (!window.location.search.includes('sys.user_id')) {
//         const url = new URL(window.location.href)
//         const encodedId = await compressAndEncodeBase64(userProfile.id)
//         if (encodedId) {
//           url.searchParams.set('sys.user_id', encodedId)
//           router.replace(url.toString())
//         }
//         return // 等待 URL 更新后再渲染
//       }
//     } catch (error) {
//       console.error('Failed to fetch user profile:', error)
//       router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
//     }
//   }

//   checkAuth()
// }, [router, mutateUserProfile, userProfile])

// // 只有当 URL 中有 user_id 时才渲染子组件
// if (!window.location.search.includes('sys.user_id')) {
//   return null
// }


const AuthCheckInner: FC<AuthCheckProps> = ({ children }) => {
  const router = useRouter()
  const [init, setInit] = useState(false)
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  useEffect(() => {
    const checkAuth = async () => {
      const token = await getCookie()
      if (!token) {
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
        return
      }

      if (token === consoleTokenFromLocalStorage) {
        setInit(true)
        return
      }

      // After token check, fetch user profile
      try {
        localStorage?.setItem('console_token', token)
        setInit(true)
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      }
    }
    checkAuth()
  }, [router])

  
  return <>
  {init ? children : <div className="flex h-full items-center justify-center">
    <div className={'flex w-full grow flex-col items-center justify-center px-6 md:px-[108px]'}>
      <Loading type='area' />
    </div>
  </div>}</>
}

const AuthCheck: FC<AuthCheckProps> = ({ children }) => {
  return (
    <AuthCheckInner>
    <AppContextProvider>
      <ModalContextProvider>
     {children}
      </ModalContextProvider>
    </AppContextProvider>
    </AuthCheckInner>
  )
}

export default AuthCheck
