# React + TypeScript + Vite


```js
// --后台运营系统
```

技术栈：
管理后台 (Cloudflare Pages)
    │ 编写富文本 + 上传图片
    ▼
Cloudflare Workers (API 层)
    ├── 图片 → 存 R2
    ├── 文章元数据 → 存 Supabase
    └── 富文本内容 → 存 Supabase
    
Flutter App
    └── GET /articles → Workers → Supabase 返回数据

R2：流量免费，每月10GB免费存储
Supabase：数据500 MB，文件存储1GB
支持发布GIF图片


后台管理系统：https://test-admin-e77.pages.dev
测试：npm run dev
部署：npm run build
wrangler pages deploy dist --project-name test-admin
今后：npm run deploy



手机上浏览器操作：
admin.html是RedSun项目手机版运营编辑校正词条使用
# test访问 http://localhost:5173/admin.html
正式访问：https://test-admin-e77.pages.dev/admin.html


