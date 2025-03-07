'use client'
import style from '../list.module.css'
import Apps from './Apps'
import classNames from '@/utils/classnames'
import LogoSite from '@/app/components/base/logo/logo-site'

const AppList = () => {
  return (
    <div className='relative flex flex-col overflow-y-auto bg-background-body shrink-0 h-0 grow'>
      <Apps />
      {/* takin command: 去掉加入社区，修改成Powered by */}
      {/* {systemFeatures.license.status === LicenseStatus.NONE && <footer className='px-12 py-6 grow-0 shrink-0'>
        <h3 className='text-xl font-semibold leading-tight text-gradient'>{t('app.join')}</h3>
        <p className='mt-1 system-sm-regular text-text-tertiary'>{t('app.communityIntro')}</p>
        <div className='flex items-center gap-2 mt-3'>
          <Link className={style.socialMediaLink} target='_blank' rel='noopener noreferrer' href='https://github.com/langgenius/dify'>
            <RiGithubFill className='w-5 h-5 text-text-tertiary' />
          </Link>
          <Link className={style.socialMediaLink} target='_blank' rel='noopener noreferrer' href='https://discord.gg/FngNHpbcY7'>
            <RiDiscordFill className='w-5 h-5 text-text-tertiary' />
          </Link>
        </div>
      </footer>} */}
      <footer className='px-12 py-6 grow-0 shrink-0'>
        <div className={'flex items-center full'}>
          <div className='flex items-center pr-3 space-x-3 h-8 text-xs text-gray-400'>
            <span className='uppercase'>Powered by</span>
            <LogoSite />
            <a className={style.socialMediaLink} target='_blank' rel='noopener noreferrer'
              href='https://github.com/langgenius/dify'><span
                className={classNames(style.socialMediaIcon, style.githubIcon)} /></a>
          </div>
        </div>
      </footer>
    </div >
  )
}

export default AppList
