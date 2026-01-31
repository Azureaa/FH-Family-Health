
import React from 'react';
import { OrganKey, OrganConfig, FamilyMember } from './types';

export const ORGAN_MAP: Record<OrganKey, OrganConfig> = {
  brain: { label: '脑部神经', color: '#fca5a5', text: 'text-rose-500', bg: 'bg-rose-500', border: 'border-rose-200' },
  lungs: { label: '呼吸系统', color: '#86efac', text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-200' },
  heart: { label: '心血管', color: '#ef4444', text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-200' },
  liver: { label: '肝胆胰脾', color: '#d97706', text: 'text-amber-700', bg: 'bg-amber-600', border: 'border-amber-200' },
  digestive: { label: '胃肠消化', color: '#eab308', text: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-200' },
  limbs: { label: '骨骼/四肢', color: '#94a3b8', text: 'text-slate-500', bg: 'bg-slate-500', border: 'border-slate-200' },
  general: { label: '全身/血液', color: '#3b82f6', text: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200' }
};

export const DEFAULT_FAMILY: FamilyMember[] = [
  { id: 'member_self', name: '我自己', role: 'self', avatar: '🧑🏻', status: '健康', birthDate: '1990-01-01' },
  { id: 'member_dad', name: '爸爸', role: 'dad', avatar: '👨🏻', status: '注意血压', birthDate: '1960-05-12' },
  { id: 'member_mom', name: '妈妈', role: 'mom', avatar: '👩🏻', status: '良好', birthDate: '1962-08-20' }
];
