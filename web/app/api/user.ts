'use server'
import { cookies } from 'next/headers'
import axios from 'axios'

type User = {
  id: string
  name: string
  email: string
  image: string
  role: string
  level: string
  credits: number
} | null

/**
 * Get user information
 */
export async function getUserInfo() {
  try {
    const token = await getCookie()
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_TAKIN_API_URL}/api/external/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    const userData = response.data.data

    if (!userData)
      return null

    return {
      ...userData,
      credits:
        userData.subscriptionCredits
        + userData.extraCredits
        + userData.subscriptionPurchasedCredits,
    } as User
  }
  catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

const isDevelopment = process.env.NEXT_PUBLIC_DEPLOY_ENV === 'DEVELOPMENT'

const tokenName = isDevelopment
  ? 'authjs.session-token'
  : '__Secure-authjs.session-token'

export async function deleteCookie() {
  const cookieOptions = {
    // In development, omitting the domain allows the cookie to work on any local domain (localhost, 127.0.0.1, etc.)
    // In production, set the domain to .takin.ai for cross-subdomain support
    domain: isDevelopment ? undefined : '.takin.ai',
    path: '/',
    expires: new Date(0),
    secure: !isDevelopment,
    httpOnly: true,
  }
  cookies().set(tokenName, '', cookieOptions)
}

export async function getCookie() {
  return cookies().get(tokenName)?.value
}
