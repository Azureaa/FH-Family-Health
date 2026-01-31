"""
Supabase 数据库连接配置
提供数据库客户端初始化和基础操作
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# 从环境变量读取 Supabase 配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("请在 .env 文件中配置 SUPABASE_URL 和 SUPABASE_KEY")


def get_supabase_client() -> Client:
    """
    获取 Supabase 客户端实例
    使用单例模式避免重复创建连接
    """
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# 全局客户端实例
supabase: Client = get_supabase_client()
