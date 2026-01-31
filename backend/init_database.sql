-- =============================================
-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- =============================================

-- 1. 创建家庭成员表
create table if not exists family_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  avatar text not null,
  status text not null default 'active',
  birth_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. 创建医疗记录表
create table if not exists medical_records (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references family_members(id) on delete cascade,
  category_name text not null,
  target_organ text not null,
  report_date date not null,
  findings text,
  diagnosis text,
  doctor_summary text,
  health_score int check (health_score >= 0 and health_score <= 100),
  abnormal_items text[] default '{}',
  images text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. 创建索引以优化查询性能
create index if not exists idx_records_member_id on medical_records(member_id);
create index if not exists idx_records_report_date on medical_records(report_date desc);

-- 4. 插入默认家庭成员数据
insert into family_members (name, role, avatar, status) values
  ('爸爸', 'Parent', '👨', 'active'),
  ('妈妈', 'Parent', '👩', 'active'),
  ('小明', 'Child', '👦', 'active')
on conflict do nothing;

-- 5. 创建 Storage Bucket (需要在 Supabase Dashboard 手动创建)
-- Bucket 名称: medical-reports
-- 权限: Public (或根据需求设置为 Authenticated)

-- =============================================
-- 注意事项:
-- 1. 请在 Supabase Dashboard > Storage 中创建名为 'medical-reports' 的 Bucket
-- 2. 如需公开访问图片，请将 Bucket 设置为 Public
-- 3. 如需更严格的权限控制，可添加 RLS 策略
-- =============================================
