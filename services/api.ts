/**
 * 前端 API 服务
 * 封装与后端 API 的所有通信
 */

import { FamilyMember, MedicalRecord, AIAnalysisResult } from '../types';

// 后端 API 基础 URL，可通过环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * 通用请求封装
 * 自动处理 JSON 响应和错误
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '请求失败' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

// ==================== 家庭成员 API ====================

/**
 * 获取所有家庭成员
 */
export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
    return request<FamilyMember[]>('/family');
}

/**
 * 创建新的家庭成员
 */
export async function createFamilyMember(
    member: Omit<FamilyMember, 'id'>
): Promise<FamilyMember> {
    return request<FamilyMember>('/family', {
        method: 'POST',
        body: JSON.stringify(member),
    });
}

// ==================== 医疗记录 API ====================

/**
 * 获取指定成员的所有医疗记录
 */
export async function fetchRecords(memberId: string): Promise<MedicalRecord[]> {
    return request<MedicalRecord[]>(`/records/${memberId}`);
}

/**
 * 创建新的医疗记录
 * @param record 记录数据，包含 Base64 格式的图片
 */
export async function createRecord(
    record: Omit<MedicalRecord, 'id'> & { member_id: string; images?: string[] }
): Promise<MedicalRecord> {
    return request<MedicalRecord>('/records', {
        method: 'POST',
        body: JSON.stringify(record),
    });
}

// ==================== AI 分析 API ====================

/**
 * 使用 AI 分析医疗报告图片
 * @param images Base64 编码的图片数组
 */
export async function analyzeImages(images: string[]): Promise<AIAnalysisResult> {
    return request<AIAnalysisResult>('/analyze', {
        method: 'POST',
        body: JSON.stringify({ images }),
    });
}
