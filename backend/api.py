"""
API 路由层
定义所有 RESTful API 端点
"""

from fastapi import APIRouter, HTTPException

from models import (
    FamilyMember, FamilyMemberCreate,
    MedicalRecord, MedicalRecordCreate,
    AIAnalysisRequest, AIAnalysisResponse
)
import service

router = APIRouter()


# ==================== 家庭成员接口 ====================

@router.get("/family", response_model=list[FamilyMember], tags=["Family"])
def list_family_members():
    """获取所有家庭成员"""
    return service.get_all_family_members()


@router.post("/family", response_model=FamilyMember, tags=["Family"])
def create_family_member(member: FamilyMemberCreate):
    """创建新的家庭成员"""
    return service.create_family_member(member)


# ==================== 医疗记录接口 ====================

@router.get("/records/{member_id}", response_model=list[MedicalRecord], tags=["Records"])
def get_member_records(member_id: str):
    """获取指定成员的所有医疗记录"""
    records = service.get_records_by_member(member_id)
    return records


@router.post("/records", response_model=MedicalRecord, tags=["Records"])
def create_record(record: MedicalRecordCreate):
    """
    创建新的医疗记录
    图片以 Base64 格式传入，后端会上传到 Supabase Storage
    """
    try:
        return service.create_medical_record(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建记录失败: {str(e)}")


# ==================== AI 分析接口 ====================

@router.post("/analyze", response_model=AIAnalysisResponse, tags=["AI"])
def analyze_images(request: AIAnalysisRequest):
    """
    使用 AI 分析医疗报告图片
    返回结构化的报告数据
    """
    try:
        return service.analyze_medical_images(request.images)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 分析失败: {str(e)}")
