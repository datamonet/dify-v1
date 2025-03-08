'use client'
import { useTranslation } from 'react-i18next'
import classNames from '@/utils/classnames'
import Radio from '@/app/components/base/radio/ui'
import { Users01 } from '@/app/components/base/icons/src/vender/solid/users'

const itemClass = `
  flex items-center w-full sm:w-[234px] h-12 px-3 rounded-xl bg-gray-25 border border-gray-100 cursor-pointer
`

type IPermissionsRadioProps = {
  value: 'all_team_members' | 'only_me'
  onChange: (v?: 'all_team_members' | 'only_me') => void
  itemClassName?: string
  disable?: boolean
}

const PermissionsRadio = ({
  value,
  onChange,
  itemClassName,
  disable,
}: IPermissionsRadioProps) => {
  const { t } = useTranslation()
  const options = [
    {
      key: 'only_me',
      text: t('datasetSettings.form.permissionsOnlyMe'),
    },
    {
      key: 'all_team_members',
      text: t('datasetSettings.form.permissionsAllMember'),
    },
  ]

  return (
    <div className={classNames('flex justify-between w-full flex-wrap gap-y-2')}>
      {
        options.map(option => (
          <div
            key={option.key}
            className={classNames(
              itemClass,
              itemClassName,
              option.key === value && 'item-active',
              disable && 'disable',
              'px-2',
            )}
            onClick={() => {
              if (!disable)
                onChange(option.key as 'all_team_members' | 'only_me')
            }}
          >
            <div className='mr-2 flex items-center justify-center w-6 h-6 rounded-lg bg-[#EEF4FF]'>
                    <Users01 className='w-3.5 h-3.5 text-[#444CE7]' />
                  </div>
            <div className='grow text-sm text-gray-900'>{option.text}</div>
            <Radio isChecked={option.key === value} />
          </div>
        ))
      }
    </div>
  )
}

export default PermissionsRadio
