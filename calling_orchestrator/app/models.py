from typing import Any, List, Optional  # [수정] Optional 추가
from pydantic import BaseModel, Extra

class ResponseType(BaseModel):
    response_type: int
    response_index: int

class ExpectedAnswer(BaseModel):
    text: str
    response_type_list: List[ResponseType]

class Question(BaseModel):
    text: str
    expected_answer: List[ExpectedAnswer]

class Address(BaseModel):
    state: str
    city: str
    address1: str
    address2: str

class RiskItem(BaseModel):
    risk_index_list: List[int]
    content: str

class DesireItem(BaseModel):
    desire_type: List[int]
    content: str

class Vulnerabilities(BaseModel):
    risk_list: List[RiskItem]
    desire_list: List[DesireItem]

class UserData(BaseModel):
    vulnerable_id: Optional[str] = None  # [추가] Spring Boot에서 보낸 ID 받기
    name: str
    phone: str
    gender: str
    birth_date: str
    address: Address
    question_list: List[Question]
    vulnerabilities: Vulnerabilities

    # [추가] 정의되지 않은 필드가 와도 에러 내지 않도록 설정
    class Config:
        extra = "ignore"