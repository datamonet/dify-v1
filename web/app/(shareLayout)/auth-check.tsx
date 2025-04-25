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
    // console.log('[AuthCheck] Adding userId to URL:', userId)
    // 只在 URL 中没有 user_id 时添加
    if (!globalThis.location.href.includes('sys.user_id')) {
      const url = new URL(globalThis.location.href)
      // 压缩并编码用户 ID
      const encodedId = await compressAndEncodeBase64(userId)
      // console.log('[AuthCheck] Encoded userId:', encodedId)
      if (encodedId) {
        url.searchParams.set('sys.user_id', encodedId)
        setInit(true)
        // 更新 URL（会触发页面重新加载）
        router.push(url.toString())
        router.refresh()
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
    // console.log('[AuthCheck] Validating URL userId for:', currentUserId)
    const url = new URL(globalThis.location.href)
    const urlUserId = url.searchParams.get('sys.user_id')
    if (!urlUserId) return false

    try {
      // 解码 URL 中的用户 ID
      const decodedUrlUserId = await decodeBase64AndDecompress(urlUserId)
      // console.log('[AuthCheck] Decoded URL userId:', decodedUrlUserId)
      // 比较解码后的 ID 与当前用户 ID
      return decodedUrlUserId === currentUserId
    }
 catch (error) {
      // console.error('[AuthCheck] Error decoding URL userId:', error)
      return false
    }
  }

  /**
   * 获取用户信息并处理 URL 中的用户 ID
   * @param token - 可选的新 token，如果提供则更新到 localStorage
   */
  const handleProfileFetch = async (token?: string) => {
    try {
      // console.log('[AuthCheck] Fetching user profile...')
      // 获取用户信息
      const response = await get('/account/profile')
      // console.log('[AuthCheck] Profile response:', response)
      // 如果提供了新 token，更新到 localStorage
      if (token) {
        // console.log('[AuthCheck] Updating token in localStorage')
        localStorage?.setItem('console_token', token)
      }

      // 如果 URL 中有 user_id，验证是否匹配当前用户
      if (globalThis.location.href.includes('sys.user_id')) {
        // console.log('[AuthCheck] URL contains user_id, validating...')
        const isValidUser = await validateUrlUserId(response.id)
        // console.log('[AuthCheck] User validation result:', isValidUser)
        if (isValidUser) {
          // 如果用户 ID 匹配，设置 init 为 true
          setInit(true)
          return
        }
        // 如果用户 ID 不匹配，更新为正确的用户 ID
        await addUserIdToUrl(response.id)
        // console.log('------', added)
        return
      }

      // console.log('[AuthCheck] URL does not contain user_id, adding...')
      // 如果 URL 中没有 user_id，添加它
      const redirected = await addUserIdToUrl(response?.id)
      if (!redirected) {
        // 如果没有进行重定向，设置 init 为 true
        // console.log('[AuthCheck] No redirection needed, initializing...')
        setInit(true)
      }
    }
 catch (error) {
      // console.error('[AuthCheck] Failed to fetch user profile:', error)
      redirectToLogin()
    }
  }

  /**
   * 在组件挂载时进行认证检查
   * 依赖项：router 和 consoleTokenFromLocalStorage
   */
  useEffect(() => {
    const checkAuth = async () => {
      // console.log('[AuthCheck] Starting auth check...')
      // 从 cookie 获取 token
      const token = await getCookie()
      // console.log('[AuthCheck] Token from cookie:', token ? 'exists' : 'not found')
      if (!token) {
        redirectToLogin()
        return
      }

      // 比较 cookie 中的 token 和 localStorage 中的 token
      if (token === consoleTokenFromLocalStorage) {
        handleProfileFetch()
      }
 else {
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
  return (
    <>
      {children}
    </>
  )
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
