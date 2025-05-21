# takin code: services/pricing_service.py,后端扣费api
import logging
import os
import json
import requests
from decimal import Decimal
from typing import Optional, List, Dict, Any
from services.errors.base import BaseServiceError

logger = logging.getLogger(__name__)

PRICING_API_URL = os.getenv("TAKIN_API_URL", "http://127.0.0.1:3000")

def call_agent_pricing_api(email: Optional[str], total_price: str, tools_thoughts: List[str], mode: Any) -> None:
    """Call agent pricing API"""
    if not email:
        return
        
    try:
        response = requests.post(
            f"{PRICING_API_URL}/api/external/dify/pricing/agent",
            json={
                "email": email,
                "total_price": total_price,
                "tools_thoughts": tools_thoughts,
                "mode": mode
            }
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to call agent pricing API: {str(e)}")

def _serialize_node_execution(data: Dict) -> Dict:
    """Helper function to serialize node execution data"""
    result = {}
    for k, v in data.items():
        # Convert enum keys to strings
        if hasattr(k, 'value'):
            k = k.value
        # Convert Decimal to float
        if isinstance(v, Decimal):
            v = float(v)
        result[k] = v
    return result

def call_workflow_pricing_api(email: str, node_executions: List[Dict]) -> None:
    """Call workflow pricing API"""
    if not email:
        return
        
    try:
        # Convert node executions to serializable format
        serialized_executions = [_serialize_node_execution(node) for node in node_executions]
        response = requests.post(
            f"{PRICING_API_URL}/api/external/dify/pricing/workflow",
            json={
                "email": email,
                "node_executions": json.dumps(serialized_executions)
            }
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to call workflow pricing api: {str(e)}")
        
def call_knowledge_pricing_api(email: str, usage: float, dataset_id: str, batch_id: str, document_id: str) -> None:
    """Call knowledge pricing API"""
    if not email:
        return
        
    try:
        response = requests.post(
            f"{PRICING_API_URL}/api/external/dify/pricing/knowledge",
            json={
                "email": email,
                "usage": usage,
                "knowledgeInfo": {
                    "datasetId": dataset_id,
                    "batchId": batch_id,
                    "documentId": document_id,
                }
            }
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to call knowledge pricing API: {str(e)}")

def check_credit(email: str):
    try:
        # 调用API检查用户积分
        response = requests.get(
            f"{PRICING_API_URL}/api/external/get-credit",
            params={"email": email}
        )
        response.raise_for_status()
        data = response.json()
        # 检查响应中的用户积分
        credits = data['data'].get("totalAvailableCredits", 0)
        if credits <= 0:
            raise BaseServiceError("Insufficient credits: Buy more credits to proceed")
    except Exception as e:
        logger.error(f"Insufficient credits: Buy more credits to proceed: {str(e)}")
        raise BaseServiceError("Insufficient credits: Buy more credits to proceed")
