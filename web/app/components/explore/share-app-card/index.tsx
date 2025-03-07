'use client'
import { useTranslation } from 'react-i18next'
import { PlusIcon } from '@heroicons/react/20/solid'
import Button from '../../base/button'
import cn from '@/utils/classnames'
import type { AppBasicInfo } from '@/models/explore'
import AppIcon from '@/app/components/base/app-icon'
import { AppTypeIcon } from '../../app/type-selector'

export type ShareAppCardProps = {
  app: AppBasicInfo
  canCreate: boolean
  onCreate: () => void
  isExplore: boolean
}

const ShareAppCard = ({
  app,
  canCreate,
  onCreate,
  isExplore,
}: ShareAppCardProps) => {
  const { t } = useTranslation()
  return (
    <div className={cn('relative overflow-hidden pb-2 group col-span-1 bg-components-panel-on-panel-item-bg border-[0.5px] border-components-panel-border rounded-lg shadow-sm flex flex-col transition-all duration-200 ease-in-out cursor-pointer hover:shadow-lg')}>
      <div className='flex pt-[14px] px-[14px] pb-3 h-[66px] items-center gap-3 grow-0 shrink-0'>
        <div className='relative shrink-0'>
       
          <AppIcon
            size='large'
            iconType={app.icon_type}
            icon={app.icon}
            background={app.icon_background}
            imageUrl={app.icon_url}
          />
          <AppTypeIcon wrapperClassName='absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-[4px] border border-divider-regular outline outline-components-panel-on-panel-item-bg'
            className='w-3 h-3' type={app.mode} />
        
        </div>
        <div className='grow w-0 py-[1px]'>
          <div className='flex items-center text-sm leading-5 font-semibold text-gray-800'>
            <div className='truncate' title={app.name}>{app.name}</div>
          </div>
          <div className='flex items-center text-[10px] leading-[18px] text-gray-500 font-medium'>
          {app.mode === 'advanced-chat' && <div className='truncate'>{t('app.types.advanced').toUpperCase()}</div>}
            {app.mode === 'chat' && <div className='truncate'>{t('app.types.chatbot').toUpperCase()}</div>}
            {app.mode === 'agent-chat' && <div className='truncate'>{t('app.types.agent').toUpperCase()}</div>}
            {app.mode === 'workflow' && <div className='truncate'>{t('app.types.workflow').toUpperCase()}</div>}
            {app.mode === 'completion' && <div className='truncate'>{t('app.types.completion').toUpperCase()}</div>}
            {/* takin command: 增加卡片的作者 */}
            {app.username && <span className="px-2">By {app.username}</span>}
         
          </div>
        </div>
      </div>
      <div className='mb-1 px-[14px] text-xs leading-normal text-gray-500 line-clamp-2 h-9'>{app.description}</div>
      {isExplore && canCreate && (
        <div className={cn('items-center flex-wrap min-h-[42px] px-[14px] pt-2 pb-[10px] flex')}>
          <div className={cn('flex items-center w-full space-x-2')}>
            <Button variant='primary' className='grow h-7' onClick={() => onCreate()}>
              <PlusIcon className='w-4 h-4 mr-1'/>
              <span className='text-xs'>{t('explore.appCard.addToWorkspace')}</span>
            </Button>
          </div>

        </div>
      )}
      {!isExplore && (
        <div className={cn('items-center flex-wrap min-h-[42px] px-[14px] pt-2 pb-[10px] flex')}>
          <div className={cn('flex items-center w-full space-x-2')}>
            <Button variant='primary' className='grow h-7' onClick={() => onCreate()}>
              <PlusIcon className='w-4 h-4 mr-1' />
              <span className='text-xs'>{t('app.newApp.useTemplate')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShareAppCard
