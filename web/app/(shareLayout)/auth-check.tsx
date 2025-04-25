'use client'
import type { FC, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/app/api/user'
import Loading from '@/app/components/base/loading'
import { AppContextProvider } from '@/context/app-context'
import { ModalContextProvider } from '@/context/modal-context'
import { compressAndEncodeBase64, decodeBase64AndDecompress } from '@/app/components/base/chat/utils'
import { get } from '@/service/base'

type AuthCheckProps = {
  children: React.ReactNode
}

/**
 * 认证检查组件
 * 主要功能：
 * 1. 验证用户是否已登录
 * 2. 确保 URL 中包含正确的用户 ID
 * 3. 管理页面初始化状态
 */
const AuthCheckInner: FC<AuthCheckProps> = ({ children }): ReactElement => {
  const router = useRouter()
  // init 状态用于控制是否显示子组件
  const [init, setInit] = useState(false)
  // 从 localStorage 获取已存储的 token
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')

  /**
   * 重定向到登录页面
   * 会将当前 URL 作为回调地址传递
   */
  const redirectToLogin = () => {
    const callbackUrl = encodeURIComponent(globalThis.location.href)
    router.replace(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin?callbackUrl=${callbackUrl}`)
  }

  /**
   * 将用户 ID 添加到 URL 中
   * @param userId - 要添加到 URL 的用户 ID
   * @returns {Promise<boolean>} - 如果 URL 被更新返回 true，否则返回 false
   */
  const addUserIdToUrl = async (userId: string) => {
    // 只在 URL 中没有 user_id 时添加
    if (!globalThis.location.href.includes('sys.user_id')) {
      const url = new URL(globalThis.location.href)
      // 压缩并编码用户 ID
      const encodedId = await compressAndEncodeBase64(userId)
      if (encodedId) {
        url.searchParams.set('sys.user_id', encodedId)
        // 更新 URL（会触发页面重新加载）
        router.replace(url.toString())
        return true
      }
    }
    return false
  }

  /**
   * 验证 URL 中的用户 ID 是否与当前用户匹配
   * @param currentUserId - 当前登录用户的 ID
   * @returns {Promise<boolean>} - 如果匹配返回 true，否则返回 false
   */
  const validateUrlUserId = async (currentUserId: string) => {
    const url = new URL(globalThis.location.href)
    const urlUserId = url.searchParams.get('sys.user_id')
    if (!urlUserId) return false

    try {
      // 解码 URL 中的用户 ID
      const decodedUrlUserId = await decodeBase64AndDecompress(urlUserId)
      // 比较解码后的 ID 与当前用户 ID
      return decodedUrlUserId === currentUserId
    } catch {
      return false
    }
  }

  /**
   * 获取用户信息并处理 URL 中的用户 ID
   * @param token - 可选的新 token，如果提供则更新到 localStorage
   */
  const handleProfileFetch = async (token?: string) => {
    try {
      // 获取用户信息
      const response = await get('/account/profile')
      // 如果提供了新 token，更新到 localStorage
      if (token) {
        localStorage?.setItem('console_token', token)
      }

      // 如果 URL 中有 user_id，验证是否匹配当前用户
      if (globalThis.location.href.includes('sys.user_id')) {
        const isValidUser = await validateUrlUserId(response.id)
        if (isValidUser) {
          // 如果用户 ID 匹配，设置 init 为 true
          setInit(true)
          return
        }
        // 如果用户 ID 不匹配，更新为正确的用户 ID
        await addUserIdToUrl(response.id)
        return
      }
      
      // 如果 URL 中没有 user_id，添加它
      const redirected = await addUserIdToUrl(response?.id)
      if (!redirected) {
        // 如果没有进行重定向，设置 init 为 true
        setInit(true)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      redirectToLogin()
    }
  }

  /**
   * 在组件挂载时进行认证检查
   * 依赖项：router 和 consoleTokenFromLocalStorage
   */
  useEffect(() => {
    const checkAuth = async () => {
      // 从 cookie 获取 token
      const token = await getCookie()
      if (!token) {
        redirectToLogin()
        return
      }

      // 比较 cookie 中的 token 和 localStorage 中的 token
      if (token === consoleTokenFromLocalStorage) {
        handleProfileFetch()
      } else {
        // 如果 token 不同，使用新 token 获取用户信息
        handleProfileFetch(token)
      }
    }

    checkAuth()
  }, [router, consoleTokenFromLocalStorage])

  // 在初始化完成前显示加载状态
  if (!init) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex w-full grow flex-col items-center justify-center px-6 md:px-[108px]">
          <Loading type='area' />
        </div>
      </div>
    )
  }

  // 初始化完成后显示子组件
  return <>{children}</>
}

/**
 * 认证检查包装组件
 * 包含必要的上下文提供者
 */
const AuthCheck: FC<AuthCheckProps> = ({ children }): ReactElement => (
  <AuthCheckInner>
    <AppContextProvider>
      <ModalContextProvider>
        {children}
      </ModalContextProvider>
    </AppContextProvider>
  </AuthCheckInner>
)

export default AuthCheck
