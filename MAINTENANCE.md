# 项目维护与更新指南 (Maintenance Guide)

恭喜你！你的全栈项目标准开发流程如下：
**AI Studio / Antigravity (本地开发)** -> **GitHub (代码仓库)** -> **Vercel (云端部署)**

当你发现 Bug 或需要加新功能时，请严格按照以下 **4 步闭环** 进行：

## 第一步：本地修改 (Local Development)
在你的电脑上进行修改。不管是前端样式还是后端逻辑，都先在本地跑通。

1.  **提出需求**：告诉 Antigravity "把标题颜色改成红色" 或 "添加一个删除接口"。
2.  **代码修改**：Antigravity 会自动帮你修改本地文件（`App.tsx`, `backend/main.py` 等）。
3.  **本地验证**：
    *   在终端运行前端：`npm run dev`
    *   在终端运行后端：`uvicorn backend.main:app --reload`
    *   打开浏览器 `http://localhost:5173` 测试，确认修改生效且没有报错。

## 第二步：提交代码 (Git Commit)
确认本地运行没问题后，将改动保存到 Git。

```bash
git add .
git commit -m "描述你做了什么修改，例如：修复了图片上传失败的bug"
```

## 第三步：推送到云端 (Push to GitHub)
这一步是触发更新的关键。不要手动去 Vercel 点部署，直接推送代码即可。

```bash
git push
```

## 第四步：自动部署 (Auto Deploy)
你什么都不用做！
1.  GitHub 收到你的 `push` 后，Vercel 会自动检测到代码更新。
2.  Vercel 会自动重新构建前端和后端。
3.  等待 1-2 分钟，访问你的线上域名，更新就自动生效了。

---

## 常见问题处理

### Q: Vercel 部署失败了怎么办？
A: 登录 Vercel 控制台，点击 Deployment 查看 "Logs"（日志）。通常是因为：
*   新增了环境变量（Environment Variables）但在 Vercel 上没配。
*   安装了新依赖包（npm install something），Vercel 构建时会自动安装，但如果包名写错会失败。
*   TypeScript 类型报错：本地 `npm run build` 试试，如果有红字报错，必须先修好再推送到 GitHub。

### Q: 数据库 (Supabase) 怎么更新？
A: 如果你修改了代码里的数据结构（比如多存了一个字段），记得去 Supabase 的 Table Editor 手动添加对应的 Column（列），否则后端写入会报错。
