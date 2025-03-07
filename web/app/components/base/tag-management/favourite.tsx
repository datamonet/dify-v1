import type { FC } from 'react'
import { RiAddLine, RiHeartLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import { fetchAppDetail } from '@/service/explore'
import { importDSL } from '@/service/apps'
import Toast from '@/app/components/base/toast'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { bindTag } from '@/service/tag'
import type { AppBasicInfo } from '@/models/explore'
import cn from '@/utils/classnames'
import { DSLImportMode } from '@/models/app'

// takin command: studio展示所有的喜欢app
export const FavouriteTag: FC<{
  value: string[]
  onChange: (v: string[]) => void
}> = ({ value, onChange }) => {
  const tagList = useTagStore(s => s.tagList)
  const tag = tagList.filter(tag => tag.name.includes('favourite'))[0]
  const selectTag = () => {
    if (value.includes(tag.id))
      onChange(value.filter(v => v !== tag.id))
    else onChange([...value, tag.id])
  }
  return (
    <div
      className={cn(
        'mr-1 px-3 py-[7px] h-[32px] flex items-center rounded-lg border-[0.5px] border-transparent text-gray-700 text-[13px] font-medium leading-[18px] cursor-pointer hover:bg-gray-200',
        value?.filter(v => v === tag.id).length > 0
        && 'bg-white border-gray-200 shadow-xs text-primary-600 hover:bg-white',
      )}
      onClick={selectTag}
    >
      <RiHeartLine className="w-[14px] h-[14px] mr-1" />
      Favourite
    </div>
  )
}

// takin command: explore将公开的设为喜欢
export const FavouriteBtn: FC<{
  app: AppBasicInfo
}> = ({ app }) => {
  const { t } = useTranslation()
  // 首先先创建一个新的app到喜欢里
  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data } = await fetchAppDetail(app.id)

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
      // b0524f83-eb2d-4ede-b654-b1a2b9d5fb00是喜欢的tag id
      if (!app.app_id)
        return Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
      await bindTag(['b0524f83-eb2d-4ede-b654-b1a2b9d5fb00'], app.app_id, 'app')
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      Toast.notify({
        type: 'success',
        message: 'Added to your favoriate successfully',
      })
    }
    catch (e) {
      Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onCreate({
          name: app.name,
          icon_type: app.icon_type || 'emoji',
          icon: app.icon,
          icon_background: app.icon_background,
          description: app.description,
          use_icon_as_answer_icon: app.use_icon_as_answer_icon,
        })
      }}
      className="flex justify-center items-center"
    >
      <RiAddLine className="w-[18px] h-[18px] hover:text-blue-600" />
    </div>
  )
}
