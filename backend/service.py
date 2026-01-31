"""
业务逻辑层
处理 AI 分析、文件上传和数据库操作
"""

import os
import base64
import uuid
import json
from datetime import date
from typing import Optional
from dotenv import load_dotenv

# 延迟导入 AI 库，避免启动时 DLL 问题
# import google.generativeai as genai

from database import supabase
from models import (
    FamilyMember, FamilyMemberCreate,
    MedicalRecord, MedicalRecordCreate,
    AIAnalysisResponse, AIAnalysisReport
)

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
STORAGE_BUCKET = "medical-reports"


# ==================== 家庭成员服务 ====================

def get_all_family_members() -> list[FamilyMember]:
    """获取所有家庭成员"""
    response = supabase.table("family_members").select("*").execute()
    return [
        FamilyMember(
            id=row["id"],
            name=row["name"],
            role=row["role"],
            avatar=row["avatar"],
            status=row["status"],
            birth_date=row.get("birth_date")
        )
        for row in response.data
    ]


def create_family_member(member: FamilyMemberCreate) -> FamilyMember:
    """创建新的家庭成员"""
    data = {
        "name": member.name,
        "role": member.role,
        "avatar": member.avatar,
        "status": member.status,
        "birth_date": member.birth_date.isoformat() if member.birth_date else None
    }
    response = supabase.table("family_members").insert(data).execute()
    row = response.data[0]
    return FamilyMember(
        id=row["id"],
        name=row["name"],
        role=row["role"],
        avatar=row["avatar"],
        status=row["status"],
        birth_date=row.get("birth_date")
    )


# ==================== 医疗记录服务 ====================

def get_records_by_member(member_id: str) -> list[MedicalRecord]:
    """
    获取指定家庭成员的所有医疗记录
    按报告日期降序排列
    """
    response = (
        supabase.table("medical_records")
        .select("*")
        .eq("member_id", member_id)
        .order("report_date", desc=True)
        .execute()
    )
    return [
        MedicalRecord(
            id=row["id"],
            member_id=row["member_id"],
            category_name=row["category_name"],
            target_organ=row["target_organ"],
            report_date=row["report_date"],
            findings=row.get("findings"),
            diagnosis=row.get("diagnosis"),
            doctor_summary=row.get("doctor_summary"),
            health_score=row.get("health_score"),
            abnormal_items=row.get("abnormal_items") or [],
            images=row.get("images") or []
        )
        for row in response.data
    ]


def upload_image_to_storage(base64_image: str) -> str:
    """
    上传 Base64 图片到 Supabase Storage
    返回公开访问的 URL
    """
    # 移除 data:image/xxx;base64, 前缀
    if "," in base64_image:
        header, data = base64_image.split(",", 1)
        # 从 header 中提取 MIME 类型
        mime_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        data = base64_image
        mime_type = "image/jpeg"

    # 生成唯一文件名
    ext = mime_type.split("/")[-1]
    filename = f"{uuid.uuid4()}.{ext}"

    # 解码并上传
    file_bytes = base64.b64decode(data)
    supabase.storage.from_(STORAGE_BUCKET).upload(
        path=filename,
        file=file_bytes,
        file_options={"content-type": mime_type}
    )

    # 获取公开 URL
    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(filename)
    return public_url


def create_medical_record(record: MedicalRecordCreate) -> MedicalRecord:
    """
    创建医疗记录
    1. 上传所有图片到 Storage
    2. 将记录保存到数据库
    """
    # 上传图片并获取 URL
    image_urls = []
    for img in record.images or []:
        url = upload_image_to_storage(img)
        image_urls.append(url)

    # 插入数据库
    data = {
        "member_id": record.member_id,
        "category_name": record.category_name,
        "target_organ": record.target_organ.value,
        "report_date": record.report_date.isoformat(),
        "findings": record.findings,
        "diagnosis": record.diagnosis,
        "doctor_summary": record.doctor_summary,
        "health_score": record.health_score,
        "abnormal_items": record.abnormal_items or [],
        "images": image_urls
    }
    response = supabase.table("medical_records").insert(data).execute()
    row = response.data[0]

    return MedicalRecord(
        id=row["id"],
        member_id=row["member_id"],
        category_name=row["category_name"],
        target_organ=row["target_organ"],
        report_date=row["report_date"],
        findings=row.get("findings"),
        diagnosis=row.get("diagnosis"),
        doctor_summary=row.get("doctor_summary"),
        health_score=row.get("health_score"),
        abnormal_items=row.get("abnormal_items") or [],
        images=row.get("images") or []
    )


# ==================== AI 分析服务 ====================

def analyze_medical_images(base64_images: list[str]) -> AIAnalysisResponse:
    """
    使用 Google Gemini API 分析医疗报告图片
    返回结构化的分析结果
    """
    if not GOOGLE_API_KEY:
        raise ValueError("请在 .env 文件中配置 GOOGLE_API_KEY")

    # 延迟导入以避免启动时的 DLL 问题
    import google.generativeai as genai
    
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")

    # 准备图片数据
    image_parts = []
    for img in base64_images:
        # 移除 data:image/xxx;base64, 前缀
        if "," in img:
            header, data = img.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        else:
            data = img
            mime_type = "image/jpeg"
        
        image_parts.append({
            "mime_type": mime_type,
            "data": data
        })

    prompt = """你是一位专业的医疗助手。请分析上传的医疗报告图片。
    1. 判断这些是多份独立报告还是同一份报告的多页。
    2. 从每份报告中提取结构化数据。
    3. 仅以指定的 JSON 格式响应。
    
    请返回以下格式的 JSON:
    {
        "reports": [
            {
                "category_name": "报告正式名称",
                "target_organ": "brain|lungs|heart|liver|digestive|limbs|general 之一",
                "report_date": "YYYY-MM-DD 格式的日期",
                "findings": "临床发现",
                "diagnosis": "诊断结论",
                "doctor_summary": "给用户的关键总结建议",
                "health_score": 0-100 的健康评分,
                "abnormal_items": ["异常项1", "异常项2"]
            }
        ]
    }
    """

    # 构建消息内容
    contents = [prompt]
    for img_part in image_parts:
        contents.append(img_part)

    response = model.generate_content(
        contents,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
    )

    # 解析 JSON 响应
    result = json.loads(response.text)

    reports = [
        AIAnalysisReport(
            category_name=r.get("category_name", "未知报告"),
            target_organ=r.get("target_organ", "general"),
            report_date=r.get("report_date", date.today().isoformat()),
            findings=r.get("findings"),
            diagnosis=r.get("diagnosis"),
            doctor_summary=r.get("doctor_summary"),
            health_score=r.get("health_score"),
            abnormal_items=r.get("abnormal_items")
        )
        for r in result.get("reports", [])
    ]

    return AIAnalysisResponse(reports=reports)

