import { API_BASE, SERVICE_KEY } from './config'

const headers = () => ({
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
})

export type Article = {
  id: string
  title: string
  content: string
  cover_url: string | null
  type: 'article' | 'video'
  video_url: string | null
  status: 'draft' | 'published'
  created_at: string
  published_at: string | null
}

// 获取所有文章（管理端需要看草稿，直连 Supabase 或扩展 Worker 接口）
export async function getArticles(): Promise<Article[]> {
  const res = await fetch(`${API_BASE}/api/admin/articles`, {
    headers: headers(),
  })
  return res.json()
}

export async function getArticle(id: string): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/admin/articles/${id}`, {
    headers: headers(),
  })
  return res.json()
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/admin/articles`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/admin/articles/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function publishArticle(id: string): Promise<Article> {
  const res = await fetch(`${API_BASE}/api/admin/articles/${id}/publish`, {
    method: 'POST',
    headers: headers(),
  })
  return res.json()
}

export async function deleteArticle(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/admin/articles/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
}

// 上传图片
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SERVICE_KEY}` }, // 不加 Content-Type，让浏览器自动设置 boundary
    body: formData,
  })
  return res.json()
}


