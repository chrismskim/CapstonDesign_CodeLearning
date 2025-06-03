#사용자 데이터 및 요청/응답에 사용할 Pydantic 모델 정의

from typing import List
from pydantic import BaseModel

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
    desire_index_list: List[int]
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
