import { useCallback } from 'react'
import produce from 'immer'
import type { WorkflowFinishedResponse } from '@/types/workflow'
import { useWorkflowStore } from '@/app/components/workflow/store'
import { getFilesInLogs } from '@/app/components/base/file-uploader/utils'

// takin command:扣费
import { updateCreditsByWorkflow } from '@/app/api/pricing'
import { useAppContext } from '@/context/app-context'

export const useWorkflowFinished = () => {
  const workflowStore = useWorkflowStore()
  const { userProfile, updateCreditsWithoutRerender } = useAppContext()
  const handleWorkflowFinished = useCallback(async (params: WorkflowFinishedResponse) => {
    const { data } = params
    const {
      workflowRunningData,
      setWorkflowRunningData,
    } = workflowStore.getState()

    const isStringOutput = data.outputs && Object.keys(data.outputs).length === 1 && typeof data.outputs[Object.keys(data.outputs)[0]] === 'string'

    const newWorkflowRunningData = produce(workflowRunningData!, (draft) => {
      draft.result = {
        ...draft.result,
        ...data,
        files: getFilesInLogs(data.outputs),
      } as any
      if (isStringOutput) {
        draft.resultTabActive = true
        draft.resultText = data.outputs[Object.keys(data.outputs)[0]]
      }
    })

    setWorkflowRunningData(newWorkflowRunningData)
    // takin command:需要将newWorkflowRunningData赋值，方便传输到扣费函数中
    // console.log('newWorkflowRunningData', newWorkflowRunningData)
    // await updateUserCreditsWithTotalToken(userProfile.takin_id!, newWorkflowRunningData.result.total_tokens || 0, 'Dify Workflow', newWorkflowRunningData)
    const cost = await updateCreditsByWorkflow({
      tracing: newWorkflowRunningData.tracing!,
    })
    const newCredits = parseFloat(((userProfile?.credits || 0) - cost).toFixed(2))
    updateCreditsWithoutRerender(newCredits)
  }, [workflowStore])

  return {
    handleWorkflowFinished,
  }
}
