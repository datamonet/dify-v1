import {
  memo,
  useCallback,
  useState,
  useMemo
} from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { RiArrowDownSLine, RiPlanetLine } from '@remixicon/react'
import Toast from '../../base/toast'
import type { ModelAndParameter } from '../configuration/debug/types'
import PermissionsRadio from './permissions-radio'
import PublishWithMultipleModel from './publish-with-multiple-model'
import Button from '@/app/components/base/button'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import { fetchInstalledAppList } from '@/service/explore'
import EmbeddedModal from '@/app/components/app/overview/embedded'
import { useStore as useAppStore } from '@/app/components/app/store'
import { useGetLanguage } from '@/context/i18n'
import { PlayCircle } from '@/app/components/base/icons/src/vender/line/mediaAndDevices'
import { CodeBrowser } from '@/app/components/base/icons/src/vender/line/development'
import { LeftIndent02 } from '@/app/components/base/icons/src/vender/line/editor'
import { FileText } from '@/app/components/base/icons/src/vender/line/files'
import WorkflowToolConfigureButton from '@/app/components/tools/workflow-tool/configure-button'
import type { InputVar } from '@/app/components/workflow/types'
import { appDefaultIconBackground } from '@/config'
import useSWR from 'swr'
import { createRecommendedApp, deleteRecommendedApp, fetchAppDetail, fetchAppList } from '@/service/explore'

export type AppPublisherProps = {
  disabled?: boolean
  publishDisabled?: boolean
  publishedAt?: number
  /** only needed in workflow / chatflow mode */
  draftUpdatedAt?: number
  debugWithMultipleModel?: boolean
  multipleModelConfigs?: ModelAndParameter[]
  /** modelAndParameter is passed when debugWithMultipleModel is true */
  onPublish?: (modelAndParameter?: ModelAndParameter) => Promise<any> | any
  onRestore?: () => Promise<any> | any
  onToggle?: (state: boolean) => void
  crossAxisOffset?: number
  toolPublished?: boolean
  inputs?: InputVar[]
  onRefreshData?: () => void
}

const AppPublisher = ({
  disabled = false,
  publishDisabled = false,
  publishedAt,
  draftUpdatedAt,
  debugWithMultipleModel = false,
  multipleModelConfigs = [],
  onPublish,
  onRestore,
  onToggle,
  crossAxisOffset = 0,
  toolPublished,
  inputs,
  onRefreshData,
}: AppPublisherProps) => {
  const { t } = useTranslation()
  const [postStatus, setPostStatus] = useState(false)
  const [posted, setPosted] = useState(false)
  const [published, setPublished] = useState(false)
  const [open, setOpen] = useState(false)
  const appDetail = useAppStore(state => state.appDetail)
  const { app_base_url: appBaseURL = '', access_token: accessToken = '' } = appDetail?.site ?? {}
  const appMode = (appDetail?.mode !== 'completion' && appDetail?.mode !== 'workflow') ? 'chat' : appDetail.mode
  const appURL = `${appBaseURL}/${appMode}/${accessToken}`

  const language = useGetLanguage()
  const formatTimeFromNow = useCallback((time: number) => {
    return dayjs(time).locale(language === 'zh_Hans' ? 'zh-cn' : language.replace('_', '-')).fromNow()
  }, [language])
  
  const { mutate } = useSWR(
    ['/explore/apps'],
    () =>
      fetchAppList().then(({ categories, community, recommended_apps }) => ({
        categories,
        community,
        recommended_apps,
        allList: [...community, ...recommended_apps].sort((a, b) => a.position - b.position),
      })),
    {
      fallbackData: {
        categories: [],
        community: [],
        recommended_apps: [],
        allList: [],
      },
    },
  )

  const handleRestore = useCallback(async () => {
    try {
      await onRestore?.()
      setOpen(false)
    }
    catch (e) { }
  }, [onRestore])

  const handleTrigger = useCallback(() => {
    const state = !open

    if (disabled) {
      setOpen(false)
      return
    }

    onToggle?.(state)
    setOpen(state)

    if (state)
      setPublished(false)
  }, [disabled, onToggle, open])

  const handleOpenInExplore = useCallback(async () => {
    try {
      const { installed_apps }: any = await fetchInstalledAppList(appDetail?.id) || {}
      if (installed_apps?.length > 0)
        window.open(`/explore/installed/${installed_apps[0].id}`, '_blank')
      else
        throw new Error('No app found in Explore')
    }
    catch (e: any) {
      Toast.notify({ type: 'error', message: `${e.message || e}` })
    }
  }, [appDetail?.id])

  const [embeddingModalOpen, setEmbeddingModalOpen] = useState(false)

  const handlePosted = async () => {
    if (postStatus === posted)
      return

    if (posted) {
      await createRecommendedApp(
        appDetail?.id || '',
        appDetail?.description,
        appMode,
      )
    }
    else {
      await deleteRecommendedApp(appDetail?.id || '')
    }
    mutate()
  }

  const handlePublish = async (modelAndParameter?: ModelAndParameter) => {
    try {
      // takin command:设置app的公开状态
      await handlePosted()
      await onPublish?.(modelAndParameter)

      setPublished(true)
    }
    catch (e) {
      setPublished(false)
    }
  }

  useMemo(() => {
    const handlePostStatus = async () => {
      try {
        const response = await fetchAppDetail(appDetail?.id || '')
        setPosted(!!response)
        setPostStatus(!!response)
      }
      catch (e) {
        setPosted(false)
      }
    }

    if (appDetail)
      handlePostStatus()
  }, [appDetail])

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='bottom-end'
      offset={{
        mainAxis: 4,
        crossAxis: crossAxisOffset,
      }}
    >
      <PortalToFollowElemTrigger onClick={handleTrigger}>
        <Button
          variant='primary'
          className='pl-3 pr-2'
          disabled={disabled}
        >
          {t('workflow.common.publish')}
          <RiArrowDownSLine className='w-4 h-4 ml-0.5' />
        </Button>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-[11]'>
        <div className='w-[336px] bg-components-panel-bg rounded-2xl border-[0.5px] border-components-panel-border shadow-xl'>
          <div className='p-4 pt-3'>
            <div className='flex items-center h-6 system-xs-medium-uppercase text-text-tertiary'>
              {publishedAt ? t('workflow.common.latestPublished') : t('workflow.common.currentDraftUnpublished')}
            </div>
            {publishedAt
              ? (
                <div className='flex justify-between items-center h-[18px]'>
                  <div className='flex items-center mt-[3px] mb-[3px] leading-[18px] text-[13px] font-medium text-text-secondary'>
                    {t('workflow.common.publishedAt')} {formatTimeFromNow(publishedAt)}
                  </div>
                  <Button
                    variant='secondary-accent'
                    size='small'
                    onClick={handleRestore}
                    disabled={published}
                  >
                    {t('workflow.common.restore')}
                  </Button>
                </div>
              )
              : (
                <div className='flex items-center h-[18px] leading-[18px] text-[13px] font-medium text-text-secondary'>
                  {t('workflow.common.autoSaved')} · {Boolean(draftUpdatedAt) && formatTimeFromNow(draftUpdatedAt!)}
                </div>
              )}
            {debugWithMultipleModel
              ? (
                <PublishWithMultipleModel
                  multipleModelConfigs={multipleModelConfigs}
                  onSelect={item => handlePublish(item)}
                // textGenerationModelList={textGenerationModelList}
                />
              )
              : (
                <Button
                  variant='primary'
                  className='w-full mt-3'
                  onClick={() => handlePublish()}
                  disabled={publishDisabled || published}
                >
                  {
                    published
                      ? t('workflow.common.published')
                      : publishedAt ? t('workflow.common.update') : t('workflow.common.publish')
                  }
                </Button>
              )
            }
          </div>
          {/* <div className='p-4 pt-3 border-t-[0.5px] border-divider-regular'>
            <SuggestedAction disabled={!publishedAt} link={appURL} icon={<PlayCircle />}>{t('workflow.common.runApp')}</SuggestedAction>
            {appDetail?.mode === 'workflow'
              ? (
                <SuggestedAction
                  disabled={!publishedAt}
                  link={`${appURL}${appURL.includes('?') ? '&' : '?'}mode=batch`}
                  icon={<LeftIndent02 className='w-4 h-4' />}
                >
                  {t('workflow.common.batchRunApp')}
                </SuggestedAction>
              )
              : (
                <SuggestedAction
                  onClick={() => {
                    setEmbeddingModalOpen(true)
                    handleTrigger()
                  }}
                  disabled={!publishedAt}
                  icon={<CodeBrowser className='w-4 h-4' />}
                >
                  {t('workflow.common.embedIntoSite')}
                </SuggestedAction>
              )}
            <SuggestedAction
              onClick={() => {
                publishedAt && handleOpenInExplore()
              }}
              disabled={!publishedAt}
              icon={<RiPlanetLine className='w-4 h-4' />}
            >
              {t('workflow.common.openInExplore')}
            </SuggestedAction>
            <SuggestedAction disabled={!publishedAt} link='./develop' icon={<FileText className='w-4 h-4' />}>{t('workflow.common.accessAPIReference')}</SuggestedAction>
            {appDetail?.mode === 'workflow' && (
              <WorkflowToolConfigureButton
                disabled={!publishedAt}
                published={!!toolPublished}
                detailNeedUpdate={!!toolPublished && published}
                workflowAppId={appDetail?.id}
                icon={{
                  content: (appDetail.icon_type === 'image' ? '🤖' : appDetail?.icon) || '🤖',
                  background: (appDetail.icon_type === 'image' ? appDefaultIconBackground : appDetail?.icon_background) || appDefaultIconBackground,
                }}
                name={appDetail?.name}
                description={appDetail?.description}
                inputs={inputs}
                handlePublish={handlePublish}
                onRefreshData={onRefreshData}
              />
            )}
          </div>*/}
             {/*takin command:add PermissionsRadio */}
           <div className="px-4 py-2 flex flex-col">
              <div className="flex items-center text-sm h-6 text-text-tertiary">
                {t('datasetSettings.form.permissions')}
              </div>
                <PermissionsRadio
                itemClassName="sm:w-36 text-sm mt-2"
                      value={posted ? 'all_team_members' : 'only_me'}
                      onChange={(v) => {
                        setPosted(v === 'all_team_members')
                        setPublished(false)
                      }
                      }/>        
           </div> 
        </div> 
      </PortalToFollowElemContent>
      <EmbeddedModal
        siteInfo={appDetail?.site}
        isShow={embeddingModalOpen}
        onClose={() => setEmbeddingModalOpen(false)}
        appBaseUrl={appBaseURL}
        accessToken={accessToken}
      />
    </PortalToFollowElem >
  )
}

export default memo(AppPublisher)
