#사용자 데이터 및 요청/응답에 사용할 Pydantic 모델 정의

from typing import Any, List
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
    desire_type: List[int]  # 필드명 desire_index_list → desire_type으로 변경
    content: str

class Vulnerabilities(BaseModel):
    risk_list: List[RiskItem]
    desire_list: List[DesireItem]

class UserData(BaseModel):
    name: str
    phone: str
    gender: str
    birth_date: str
    address: Address
    question_list: List[Question]
    vulnerabilities: Vulnerabilities
    # system 데이터에 맞게 필드 추가/수정 완료
