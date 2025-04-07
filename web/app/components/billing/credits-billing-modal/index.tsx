'use client'

import React from 'react'
import cn from 'classnames'
import Modal from '../../base/modal'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'

type Props = {
  show: boolean
  onHide: () => void
}

const CreditsBillingModal = ({
  show,
  onHide,
}: Props) => {
  const { t } = useTranslation()
  return (
    <Modal
      isShow={show}
      onClose={onHide}
      closable
    >
      <div className={cn('text-[18px] font-semibold leading-[27px]')}>
        Insufficient Credits
      </div>
      <div className='flex items-center justify-between py-4'>
        <div className={cn('text-base leading-[24px]')}>
          <div>You’ve used all your credits. Please upgrade your plan to continue using our services.</div>
        </div>
      </div>

      <div className='flex justify-end gap-2'>
        <Button onClick={onHide}>{t('common.operation.cancel')}</Button>
        <Button variant='primary' onClick={() => {
          onHide()
          window.open(`${process.env.NEXT_PUBLIC_TAKIN_API_URL}/pricing`, '_blank')
        }}>Upgrade Now</Button>
      </div>
    </Modal>
  )
}

export default CreditsBillingModal
