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

  /**
   * takin code:获取takin cookie token;验证登录一般不会多过更改，直接copy一份，减少合并的冲突
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
      const token = await getCookie()

      if (!token) {
        router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin`)
        return
      }

      if (token === consoleTokenFromLocalStorage) {
        setInit(true)
        return
      }

      localStorage?.setItem('console_token', token)
      setInit(true)

      if (pathname !== '/apps')
        router.replace('/apps')
    }

    checkAuth()
  }, [router, pathname, searchParams, consoleTokenFromLocalStorage])

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
