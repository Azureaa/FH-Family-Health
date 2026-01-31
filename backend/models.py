"""
Pydantic 数据模型定义
与前端 types.ts 保持一致
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from datetime import date


class OrganKey(str, Enum):
    """器官类型枚举"""
    BRAIN = "brain"
    LUNGS = "lungs"
    HEART = "heart"
    LIVER = "liver"
    DIGESTIVE = "digestive"
    LIMBS = "limbs"
    GENERAL = "general"


class FamilyMemberBase(BaseModel):
    """家庭成员基础模型"""
    name: str
    role: str
    avatar: str
    status: str
    birth_date: Optional[date] = None


class FamilyMemberCreate(FamilyMemberBase):
    """创建家庭成员请求模型"""
    pass


class FamilyMember(FamilyMemberBase):
    """家庭成员响应模型"""
    id: str

    class Config:
        from_attributes = True


class MedicalRecordBase(BaseModel):
    """医疗记录基础模型"""
    category_name: str = Field(..., description="报告类别名称")
    target_organ: OrganKey = Field(..., description="目标器官")
    report_date: date = Field(..., description="报告日期")
    findings: Optional[str] = Field(None, description="检查发现")
    diagnosis: Optional[str] = Field(None, description="诊断结论")
    doctor_summary: Optional[str] = Field(None, description="AI 医生总结")
    health_score: Optional[int] = Field(None, ge=0, le=100, description="健康评分")
    abnormal_items: Optional[list[str]] = Field(default_factory=list, description="异常项目")


class MedicalRecordCreate(MedicalRecordBase):
    """创建医疗记录请求模型"""
    member_id: str = Field(..., description="所属家庭成员 ID")
    images: Optional[list[str]] = Field(default_factory=list, description="Base64 图片数据")


class MedicalRecord(MedicalRecordBase):
    """医疗记录响应模型"""
    id: str
    member_id: str
    images: list[str] = Field(default_factory=list, description="图片 URL 列表")

    class Config:
        from_attributes = True


class AIAnalysisRequest(BaseModel):
    """AI 分析请求模型"""
    images: list[str] = Field(..., description="Base64 编码的图片列表")


class AIAnalysisReport(BaseModel):
    """AI 分析单个报告结果"""
    category_name: str
    target_organ: str
    report_date: str
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    doctor_summary: Optional[str] = None
    health_score: Optional[int] = None
    abnormal_items: Optional[list[str]] = None


class AIAnalysisResponse(BaseModel):
    """AI 分析响应模型"""
    reports: list[AIAnalysisReport]
