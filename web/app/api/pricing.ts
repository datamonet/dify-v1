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
  source,
}: any) {
  const token = await getCookie()
  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_TAKIN_API_URL}/api/external/dify/pricing/knowledge`,
    {
      usage,
      reason,
      source,
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
