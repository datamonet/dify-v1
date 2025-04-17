from typing import Optional

from pydantic import BaseModel


class PreviewDetail(BaseModel):
    content: str
    child_chunks: Optional[list[str]] = None


class QAPreviewDetail(BaseModel):
    question: str
    answer: str


class IndexingEstimate(BaseModel):
    total_segments: int
    preview: list[PreviewDetail]
    qa_preview: Optional[list[QAPreviewDetail]] = None
    total_price: Optional[float] = None # takin code:增加token扣费返回
    currency: Optional[str] = None # takin code:增加token扣费返回