'use client'

import { lowerCase } from 'lodash-es'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import useSWRInfinite from 'swr/infinite'
import { useDebounceFn } from 'ahooks'
import Toast from '../../base/toast'
import s from './style.module.css'
import cn from '@/utils/classnames'
import ExploreContext from '@/context/explore-context'
import Category from '@/app/components/explore/category'
import AppCard from '@/app/components/explore/app-card'
import { fetchAppDetail, fetchExploreAppList } from '@/service/explore'
import { fetchAppList as appList, importDSL } from '@/service/apps'
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import CreateAppModal from '@/app/components/explore/create-app-modal'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import Loading from '@/app/components/base/loading'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { useAppContext } from '@/context/app-context'
import { getRedirection } from '@/utils/app-redirection'
import Input from '@/app/components/base/input'
import { DSLImportMode } from '@/models/app'
import { usePluginDependencies } from '@/app/components/workflow/plugin-dependency/hooks'
import type { AppListResponse } from '@/models/app'
import type { AppBasicInfo } from '@/models/explore'
import StudioAppCard from '@/app/(commonLayout)/apps/AppCard'
// takin command:增加share 卡片
import { RiCloseLine } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import ShareAppCard from '@/app/components/explore/share-app-card'
type AppsProps = {
  onSuccess?: () => void
}

export enum PageType {
  EXPLORE = 'explore',
  CREATE = 'create',
}

const getKey = (
  pageIndex: number,
  previousPageData: AppListResponse,
  tags: string[],
  keywords: string,
) => {
  if (!pageIndex || previousPageData.has_more) {
    const params: any = {
      url: 'apps',
      params: { page: pageIndex + 1, limit: 10, name: keywords },
    }

    params.params.tag_ids = tags
    return params
  }
  return null
}

const getExploreKey = (
  pageIndex: number,
  previousPageData: AppListResponse,
  mode: string,
  keywords: string,
) => {
  if (previousPageData && previousPageData.total <= (pageIndex) * previousPageData.limit)
    return null

  const params: any = {
    url: 'explore/apps',
    params: {
      page: pageIndex + 1,
      limit: 10,
      mode: lowerCase(mode),
      name: keywords,
    },
  }
  return params
}

const Apps = ({
  onSuccess,
}: AppsProps) => {
  const { t } = useTranslation()
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { push } = useRouter()
  const [showShare, setShowShare] = useState('')
  const [detailApp, setDetailApp] = useState<AppBasicInfo | undefined>()
  const searchParams = useSearchParams()
  const searchParamsAppId = searchParams.get('id')
  const searchParamsCategory = searchParams.get('category')
  const { hasEditPermission } = useContext(ExploreContext)

  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')

  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })

  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  const [currCategory, setCurrCategory] = useTabSearchParams({
    defaultTab: 'recommended',
    disableSearchParams: false,
  })
  const anchorRef = useRef<HTMLDivElement>(null)

  const {
    data: exploreAppList,
    isLoading,
    mutate: exploreAppMutate,
    setSize: exploreAppSetSize,
  } = useSWRInfinite(
    (pageIndex: number, previousPageData: AppListResponse) => {
      if (currCategory === 'favourite')
        return null
      return getExploreKey(
        pageIndex,
        previousPageData,
        currCategory,
        searchKeywords,
      )
    },
    fetchExploreAppList,
    { revalidateFirstPage: true },
  )

  const { data, mutate, setSize } = useSWRInfinite(
    (pageIndex: number, previousPageData: AppListResponse) =>
      getKey(
        pageIndex,
        previousPageData,
        ['b0524f83-eb2d-4ede-b654-b1a2b9d5fb00'],
        searchKeywords,
      ),
    appList,
    { revalidateFirstPage: true },
  )

  useEffect(() => {
    let observer: IntersectionObserver | undefined
    if (anchorRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            currCategory === 'favourite'
              ? setSize((size: number) => size + 1)
              : exploreAppSetSize((size: number) => size + 1)
          }
        },
        { rootMargin: '100px' },
      )
      observer.observe(anchorRef.current)
    }
    return () => observer?.disconnect()
  }, [anchorRef, mutate, exploreAppMutate, currCategory, setSize, exploreAppSetSize])

  const [currApp, setCurrApp] = React.useState<AppBasicInfo | null>(null)
  const [isShowCreateModal, setIsShowCreateModal] = React.useState(false)
  const { handleCheckPluginDependencies } = usePluginDependencies()

  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data, mode } = await fetchAppDetail(
      currApp?.id as string,
    )
    try {
      const app = await importDSL({
        mode: DSLImportMode.YAML_CONTENT,
        yaml_content: export_data,
        name,
        icon_type,
        icon,
        icon_background,
        description,
      })
      setIsShowCreateModal(false)
      Toast.notify({
        type: 'success',
        message: t('app.newApp.appCreated'),
      })
      if (onSuccess)
        onSuccess()
      if (app.app_id)
        await handleCheckPluginDependencies(app.app_id)
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      getRedirection(isCurrentWorkspaceEditor, { id: app.app_id, mode }, push)
    }
    catch (e) {
      Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }

  const getDetail = async (id: string) => {
    await fetchAppDetail(id).then((res) => {
      setDetailApp(res)
      setShowShare(id)
    })
  }

  useEffect(() => {
    if (searchParamsCategory) {
      setCurrCategory(searchParamsCategory)
      exploreAppMutate()
    }
  }, [searchParamsCategory])

  useEffect(() => {
    if (searchParamsAppId)
      getDetail(searchParamsAppId)
  }, [searchParamsAppId])

  if (isLoading && data?.length === 0) {
    return (
      <div className="flex h-full items-center">
        <Loading type="area" />
      </div>
    )
  }

  // 提取数据处理逻辑
  const getFlattenedData = (sourceData: any) => {
    return sourceData?.flatMap((item: any) => item?.data || []) || []
  }

  // 获取当前展示的应用列表
  const apps = currCategory === 'favourite'
    ? getFlattenedData(data)
    : getFlattenedData(exploreAppList)

  // 渲染应用列表内容
  const renderAppList = () => {
    if (apps.length === 0) {
      return (
        <div className="text-sm text-zinc-400 px-4">
          {currCategory === 'favourite'
            ? 'No favourite apps have been added yet'
            : 'No apps yet'
          }
        </div>
      )
    }

    return apps.map((app: any) => (
      currCategory === 'favourite'
        ? <StudioAppCard
          key={app.id}
          app={app}
          onRefresh={mutate}
        />
        : <AppCard
          key={app.app_id}
          isExplore
          app={app}
          canCreate={hasEditPermission}
          onCreate={() => {
            setCurrApp(app.app)
            setIsShowCreateModal(true)
          }}
        />
    ))
  }

  return (
    <div className={cn(
      'flex flex-col h-full border-l-[0.5px] border-divider-regular',
    )}>
      <div className='shrink-0 pt-6 px-12'>
        <div className={`mb-1 ${s.textGradient} text-xl font-semibold`}>{t('explore.apps.title')}</div>
        <div className='text-text-tertiary text-sm'>{t('explore.apps.description')}</div>
      </div>

      <div className={cn(
        'flex items-center justify-between mt-6 px-12',
      )}>
        <Category
          value={currCategory}
          onChange={setCurrCategory}
        />
        <Input
          showLeftIcon
          showClearIcon
          wrapperClassName='w-[200px]'
          value={keywords}
          onChange={e => handleKeywordsChange(e.target.value)}
          onClear={() => handleKeywordsChange('')}
        />
      </div>

      <div className={cn(
        'relative flex flex-1 pb-6 flex-col overflow-auto shrink-0 grow mt-4',
      )}>
        <nav className={cn(
          s.appList,
          'grid content-start shrink-0 gap-4 px-6 sm:px-12',
        )}>
          {renderAppList()}
        </nav>
        <div ref={anchorRef} className="h-0" />
      </div>

      {isShowCreateModal && (
        <CreateAppModal
          appIconType={currApp?.icon_type || 'emoji'}
          appIcon={currApp?.icon || ''}
          appIconBackground={currApp?.icon_background || ''}
          appIconUrl={currApp?.icon_url}
          appName={currApp?.name || ''}
          appDescription={currApp?.description || ''}
          show={isShowCreateModal}
          onConfirm={onCreate}
          onHide={() => setIsShowCreateModal(false)}
        />
      )}

      <Modal
        isShow={!!showShare}
        className="!bg-transparent !shadow-none relative"
        onClose={() => setShowShare('')}
        wrapperClassName="pt-[60px]"
      >
        <div
          className="absolute right-4 top-4 p-4 cursor-pointer"
          onClick={() => setShowShare('')}
        >
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
        {detailApp && (
          <ShareAppCard
            key={detailApp.id}
            isExplore
            app={detailApp}
            canCreate={hasEditPermission}
            onCreate={() => {
              setCurrApp(detailApp)
              setIsShowCreateModal(true)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

export default React.memo(Apps)
