import {
  memo,
  useCallback,
  useState,
  useMemo
} from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  RiArrowDownSLine,
  RiPlanetLine,
  RiPlayCircleLine,
  RiPlayList2Line,
  RiTerminalBoxLine,
} from '@remixicon/react'
import { useKeyPress } from 'ahooks'
import Toast from '../../base/toast'
import type { ModelAndParameter } from '../configuration/debug/types'
import { getKeyboardKeyCodeBySystem } from '../../workflow/utils'
import SuggestedAction from './suggested-action'
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
import { CodeBrowser } from '@/app/components/base/icons/src/vender/line/development'
import WorkflowToolConfigureButton from '@/app/components/tools/workflow-tool/configure-button'
import type { InputVar } from '@/app/components/workflow/types'
import { appDefaultIconBackground } from '@/config'
import type { PublishWorkflowParams } from '@/types/workflow'
// takin code:import
import PermissionsRadio from './permissions-radio'
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
  onPublish?: (params?: any) => Promise<any> | any
  onRestore?: () => Promise<any> | any
  onToggle?: (state: boolean) => void
  crossAxisOffset?: number
  toolPublished?: boolean
  inputs?: InputVar[]
  onRefreshData?: () => void
}

const PUBLISH_SHORTCUT = ['⌘', '⇧', 'P']

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
  const isChatApp = ['chat', 'agent-chat', 'completion'].includes(appDetail?.mode || '')

  const language = useGetLanguage()
  const formatTimeFromNow = useCallback((time: number) => {
    return dayjs(time).locale(language === 'zh_Hans' ? 'zh-cn' : language.replace('_', '-')).fromNow()
  }, [language])

  // takin code:设置app的公开状态
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

  const handlePublish = useCallback(async (params?: ModelAndParameter | PublishWorkflowParams) => {
    try {
      // takin code:设置app的公开状态
      await handlePosted()
      await onPublish?.(params)
      setPublished(true)
    }
    catch {
      setPublished(false)
    }
  }, [onPublish, published, posted, handlePosted]) // takin code: include all dependencies

  const handleRestore = useCallback(async () => {
    try {
      await onRestore?.()
      setOpen(false)
    }
    catch {}
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

  useKeyPress(`${getKeyboardKeyCodeBySystem('ctrl')}.shift.p`, (e) => {
    e.preventDefault()
    if (publishDisabled || published)
      return
    handlePublish()
  },
  { exactMatch: true, useCapture: true })


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
    <>
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
            className='p-2'
            disabled={disabled}
          >
            {t('workflow.common.publish')}
            <RiArrowDownSLine className='h-4 w-4 text-components-button-primary-text' />
          </Button>
        </PortalToFollowElemTrigger>
        <PortalToFollowElemContent className='z-[11]'>
          <div className='w-[320px] rounded-2xl border-[0.5px] border-components-panel-border bg-components-panel-bg shadow-xl shadow-shadow-shadow-5'>
            <div className='p-4 pt-3'>
              <div className='system-xs-medium-uppercase flex h-6 items-center text-text-tertiary'>
                {publishedAt ? t('workflow.common.latestPublished') : t('workflow.common.currentDraftUnpublished')}
              </div>
              {publishedAt
                ? (
                  <div className='flex items-center justify-between'>
                    <div className='system-sm-medium flex items-center text-text-secondary'>
                      {t('workflow.common.publishedAt')} {formatTimeFromNow(publishedAt)}
                    </div>
                    {isChatApp && <Button
                      variant='secondary-accent'
                      size='small'
                      onClick={handleRestore}
                      disabled={published}
                    >
                      {t('workflow.common.restore')}
                    </Button>}
                  </div>
                )
                : (
                  <div className='system-sm-medium flex items-center text-text-secondary'>
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
                    className='mt-3 w-full'
                    onClick={() => handlePublish()}
                    disabled={publishDisabled || published}
                  >
                    {
                      published
                        ? t('workflow.common.published')
                        : (
                          <div className='flex gap-1'>
                            <span>{t('workflow.common.publish')}</span>
                            {/* takin code:隐藏快捷键显示 */}
                            {/* <span>{t('workflow.common.publishUpdate')}</span> */}
                            {/* <div className='flex gap-0.5'>
                              {PUBLISH_SHORTCUT.map(key => (
                                <span key={key} className='system-kbd h-4 w-4 rounded-[4px] bg-components-kbd-bg-white text-text-primary-on-surface'>
                                  {key}
                                </span>
                              ))}
                            </div> */}
                          </div>
                        )
                    }
                  </Button>
                )
              }
            </div>
            {/*takin code:add PermissionsRadio */}
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
    </>
  )
}

export default memo(AppPublisher)