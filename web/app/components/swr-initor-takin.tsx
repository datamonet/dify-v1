'use client'

import { SWRConfig } from 'swr'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getCookie } from '@/app/api/user'

type SwrInitorProps = {
  children: ReactNode
}

const SwrInitor = ({
  children,
}: SwrInitorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const pathname = usePathname()
  const [init, setInit] = useState(false)

  console.log('[SwrInitor] Initial render:', {
    pathname,
    consoleTokenFromLocalStorage: consoleTokenFromLocalStorage ? '存在' : '不存在',
    init,
  })

  /**
   * takin command:获取takin cookie token;验证登录一般不会多过更改，直接copy一份，减少合并的冲突
   * ↓
   * 有 token?
   * ├── 是 → 检查是否与 localStorage 中的 token 匹配
   * │         ├── 匹配 → 设置 init 为 true
   * │         └── 不匹配 → 更新 localStorage token 并重定向到 /apps
   * │
   * └── 否 → 重定向到登录页面
   */

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[SwrInitor] 开始检查认证...')
      const token = await getCookie()
      console.log('[SwrInitor] Cookie token:', token ? '存在' : '不存在')

      if (!token) {
        console.log('[SwrInitor] 无 token，重定向到登录页面')
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
        return
      }

      if (token === consoleTokenFromLocalStorage) {
        console.log('[SwrInitor] token 匹配，设置 init = true')
        setInit(true)
        return
      }

      console.log('[SwrInitor] token 不匹配，更新 localStorage 并重定向到 /apps')
      localStorage?.setItem('console_token', token)
      setInit(true)

      if (pathname !== '/apps')
        router.replace('/apps')
    }

    checkAuth()
  }, [router, pathname, searchParams, consoleTokenFromLocalStorage])

  console.log('[SwrInitor] Render result:', init ? '显示内容' : '不显示内容')

  return init
    ? (
      <SWRConfig value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}>
        {children}
      </SWRConfig>
    )
    : null
}

export default SwrInitor
