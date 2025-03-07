'use client'
import { useState } from 'react'
import cn from '@/utils/classnames'

export type AvatarProps = {
  name: string
  avatar: string | null
  size?: number
  className?: string
  textClassName?: string
}
const Avatar = ({
  name,
  avatar,
  size = 30,
  className,
  textClassName,
}: AvatarProps) => {
  //takin command:有头像背景就不要变蓝色
  const avatarClassName = 'shrink-0 flex items-center rounded-full border'
  const style = { width: `${size}px`, height: `${size}px`, fontSize: `${size}px`, lineHeight: `${size}px` }
  const [imgError, setImgError] = useState(false)

  const handleError = () => {
    setImgError(true)
  }

  if (avatar && !imgError) {
    return (
      <img
        className={cn(avatarClassName, className)}
        style={style}
        alt={name}
        src={avatar}
        onError={handleError}
      />
    )
  }

  return (
    <div
      className={cn(avatarClassName, className, 'bg-primary-600')}
      style={style}
    >
      <div
        className={cn(textClassName, 'text-center text-white scale-[0.4]')}
        style={style}
      >
        {name[0].toLocaleUpperCase()}
      </div>
    </div>
  )
}

export default Avatar
