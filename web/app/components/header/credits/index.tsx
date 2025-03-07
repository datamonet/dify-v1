'use client'
import { WalletIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAppContext } from '@/context/app-context'

const Credits = () => {
  const { userProfile } = useAppContext()

  return (
    <Link href={`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/user/billing`} className={'relative flex cursor-pointer items-center text-zinc-600 mr-2'}>
      <WalletIcon className="h-5 mr-2"/>
      <span data-credits-display>
        {(userProfile.credits || 0).toFixed(2)}
      </span>
    </Link>
  )
}

export default Credits
