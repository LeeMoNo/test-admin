# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler
The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration
If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
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



后台管理系统：https://test-admin-e77.pages.dev
测试：npm run dev
部署：npm run build
wrangler pages deploy dist --project-name test-admin
今后：npm run deploy



支持发布GIF图片
