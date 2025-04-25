# takin code: services/pricing_service.py,后端扣费api
import os
import json
import logging
import requests
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

def call_agent_pricing_api(email: Optional[str], total_price: str, tools_thoughts: List[str], mode: Any) -> None:
    """Call agent pricing API"""
    if not email:
        return
        
    try:
        response = requests.post(
            f"{os.getenv('TAKIN_API_URL')}/api/external/dify/pricing/agent",
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

def call_workflow_pricing_api(email: str, node_executions: List[Dict]) -> None:
    """Call workflow pricing API"""
    if not email:
        return
        
    try:
        response = requests.post(
            f"{os.getenv('TAKIN_API_URL')}/api/external/dify/pricing/workflow",
            json={
                "email": email,
                "node_executions": json.dumps(node_executions)
            }
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to call workflow pricing API: {str(e)}")

def call_knowledge_pricing_api(email: str, usage: float, dataset_id: str, batch_id: str, document_id: str) -> None:
    """Call knowledge pricing API"""
    if not email:
        return
        
    try:
        response = requests.post(
            f"{os.getenv('TAKIN_API_URL')}/api/external/dify/pricing/knowledge",
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
