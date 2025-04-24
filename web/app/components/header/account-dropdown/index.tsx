'use client'
import { useTranslation } from 'react-i18next'
import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useContext, useContextSelector } from 'use-context-selector'
import { RiAccountCircleLine, RiGraduationCapFill, RiArrowRightUpLine, RiLogoutBoxRLine, RiSettings3Line } from '@remixicon/react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import Indicator from '../indicator'
import AccountAbout from '../account-about'
import classNames from '@/utils/classnames'
import I18n from '@/context/i18n'
import Avatar from '@/app/components/base/avatar'
import { logout } from '@/service/common'
import AppContext, { useAppContext } from '@/context/app-context'
import { useProviderContext } from '@/context/provider-context'
import { useModalContext } from '@/context/modal-context'
import { deleteCookie } from '@/app/api/user'
import PremiumBadge from '@/app/components/base/premium-badge'
import cn from '@/utils/classnames'

export default function AppSelector() {
  const itemClassName = `
    flex items-center w-full h-9 pl-3 pr-2 text-text-secondary system-md-regular
    rounded-lg hover:bg-state-base-hover cursor-pointer gap-1
  `
  const router = useRouter()
  const [aboutVisible, setAboutVisible] = useState(false)
  // takin command：在外部增加切换语言的弹窗
  const [showModal, setShowModal] = useState(false)
  const systemFeatures = useContextSelector(AppContext, v => v.systemFeatures)

  const { locale } = useContext(I18n)
  const { t } = useTranslation()
  const { userProfile, langeniusVersionInfo, isCurrentWorkspaceOwner } = useAppContext()
  const { isEducationAccount } = useProviderContext()
  const { setShowAccountSettingModal } = useModalContext()

  // takin code: 退出登录
  const handleLogout = async () => {
    await deleteCookie()

    await logout({
      url: '/logout',
      params: {},
    })

    localStorage.removeItem('setup_status')
    localStorage.removeItem('console_token')
    localStorage.removeItem('refresh_token')

    router.push(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/signin?callbackUrl=${encodeURIComponent(process.env.NEXT_PUBLIC_CALLBACK_URL || '')}`)
  }

  return (
    <div className="">
      <Menu as="div" className="relative inline-block text-left">
        {
          ({ open }) => (
            <>
              <MenuButton className={cn('inline-flex items-center rounded-[20px] p-0.5 hover:bg-background-default-dodge', open && 'bg-background-default-dodge')}>
                <Avatar avatar={userProfile.avatar_url} name={userProfile.name} size={36} />
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems
                  className="
                    absolute right-0 mt-1.5 w-60 max-w-80
                    origin-top-right divide-y divide-divider-subtle rounded-xl bg-components-panel-bg-blur
                    shadow-lg focus:outline-none
                  "
                >
                  <MenuItem disabled>
                    <div className='flex flex-nowrap items-center py-[13px] pl-3 pr-2'>
                      <div className='grow'>
                        <div className='system-md-medium break-all text-text-primary'>
                          {userProfile.name}
                          {isEducationAccount && (
                            <PremiumBadge size='s' color='blue' className='ml-1 !px-2'>
                              <RiGraduationCapFill className='mr-1 h-3 w-3' />
                              <span className='system-2xs-medium'>EDU</span>
                            </PremiumBadge>
                          )}
                        </div>
                        <div className='system-xs-regular break-all text-text-tertiary'>{userProfile.email}</div>
                      </div>
                      <Avatar avatar={userProfile.avatar_url} name={userProfile.name} size={36} className='mr-3' />
                    </div>
                  </MenuItem>
                  <div className="px-1 py-1">
                    {/* takin code：隐藏工作空间 */}
                    <MenuItem>
                    <Link
                        className={classNames(itemClassName, 'group',
                          'data-[active]:bg-state-base-hover',
                        )}
                        href={`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/settings`}
                        target='_self' rel='noopener noreferrer'>
                        <RiAccountCircleLine className='size-4 shrink-0 text-text-tertiary' />
                        <div className='system-md-regular grow px-1 text-text-secondary'>{t('common.account.account')}</div>
                        <RiArrowRightUpLine className='size-[14px] shrink-0 text-text-tertiary' />
                      </Link>
                    </MenuItem>
                    <MenuItem>
                    <div className={classNames(itemClassName,
                        'data-[active]:bg-state-base-hover',
                      )} onClick={() => setShowAccountSettingModal({ payload: 'members' })}>
                        <RiSettings3Line className='size-4 shrink-0 text-text-tertiary' />
                        <div className='system-md-regular grow px-1 text-text-secondary'>{t('common.userProfile.settings')}</div>
                      </div>
                    </MenuItem>
                  </div>
                  <MenuItem>
                    <div className='p-1' onClick={() => handleLogout()}>
                      <div
                        className={cn(itemClassName, 'group justify-between',
                          'data-[active]:bg-state-base-hover',
                        )}
                      >
                        <RiLogoutBoxRLine className='size-4 shrink-0 text-text-tertiary' />
                        <div className='system-md-regular grow px-1 text-text-secondary'>{t('common.userProfile.logout')}</div>
                      </div>
                    </div>
                  </MenuItem>
                </MenuItems>
              </Transition>
            </>
          )
        }
      </Menu>
      {
        aboutVisible && <AccountAbout onCancel={() => setAboutVisible(false)} langeniusVersionInfo={langeniusVersionInfo} />
      }
    </div >
  )
}
