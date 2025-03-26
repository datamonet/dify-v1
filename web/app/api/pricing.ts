'use server'
import axios from 'axios'
import { getCookie } from './user'

export async function updateCreditsByAgent({
  responseItem,
  agentTools,
  agentUsage,
  agentMod,
}: any) {
  const token = await getCookie()
  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_TAKIN_API_URL}/api/external/dify/pricing/agent`,
    {
      responseItem,
      agentTools,
      agentUsage,
      agentMod,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  console.log(data)
  return data.totalCreditCost
}

export async function updateCreditsByWorkflow({ tracing }: any) {
  const token = await getCookie()
  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_TAKIN_API_URL}/api/external/dify/pricing/workflow`,
    {
      tracing,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  console.log(data)
  return data.totalCreditCost
}

export async function updateCreditsByKnowledge({
  usage,
  reason,
  knowledgeInfo,
}: any) {
  const token = await getCookie()
  // takin code:处理完成文档的价格扣费，传递knowledgeInfo，避免重复扣费
  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_TAKIN_API_URL}/api/external/dify/pricing/knowledge`,
    {
      usage,
      reason,
      knowledgeInfo,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  // console.log(data)
  return data.totalCreditCost
}
