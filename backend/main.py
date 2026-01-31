"""
FastAPI 应用入口
配置 CORS、路由和启动逻辑
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import router

app = FastAPI(
    title="Family Health Cloud API",
    description="家庭健康云后端 API - 管理家庭成员和医疗记录",
    version="1.0.0"
)

# 配置 CORS，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite 开发服务器
        "http://localhost:3000",  # 其他常见端口
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router, prefix="/api")


@app.get("/health", tags=["Health"])
def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "Family Health Cloud API"}


@app.get("/", tags=["Root"])
def root():
    """根路径重定向"""
    return {
        "message": "Family Health Cloud Backend is Running!",
        "docs_url": "http://localhost:8000/docs",
        "redoc_url": "http://localhost:8000/redoc"
    }
