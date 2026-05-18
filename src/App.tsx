import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

// ─── Config ────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'
const SERVICE_KEY = import.meta.env.VITE_SERVICE_KEY || ''

const authHeaders = () => ({
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
})

// ─── Types ─────────────────────────────────────────────────
type Article = {
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

// ─── API ───────────────────────────────────────────────────
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts?.headers ?? {}) },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

const api = {
  list: (): Promise<Article[]> => apiFetch('/api/admin/articles'),
  get: (id: string): Promise<Article> => apiFetch(`/api/admin/articles/${id}`),
  create: (d: Partial<Article>): Promise<Article> =>
    apiFetch('/api/admin/articles', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: string, d: Partial<Article>): Promise<Article> =>
    apiFetch(`/api/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  publish: (id: string): Promise<Article> =>
    apiFetch(`/api/admin/articles/${id}/publish`, { method: 'POST' }),
  remove: (id: string): Promise<void> =>
    apiFetch(`/api/admin/articles/${id}`, { method: 'DELETE' }),
  upload: async (file: File): Promise<{ url: string }> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}` },
      body: fd,
    })
    if (!res.ok) throw new Error('上传失败')
    return res.json()
  },
}

// ─── Toolbar Button ────────────────────────────────────────
function ToolBtn({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '4px 8px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontWeight: active ? 700 : 400,
        background: active ? '#e8e3ff' : 'transparent',
        color: active ? '#5b21b6' : '#374151',
        fontSize: 13,
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Rich Text Editor ──────────────────────────────────────
function RichEditor({
  content,
  onChange,
}: {
  content: string
  onChange: (html: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '开始撰写文章内容...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const insertImage = useCallback(
    async (file: File) => {
      if (!editor) return
      setUploading(true)
      try {
        const { url } = await api.upload(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch {
        alert('图片上传失败')
      } finally {
        setUploading(false)
      }
    },
    [editor]
  )

  if (!editor) return null

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          padding: '8px 12px',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
        }}
      >
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="粗体">
          <b>B</b>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体">
          <i>I</i>
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
          <s>S</s>
        </ToolBtn>
        <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />
        {([1, 2, 3] as const).map((l) => (
          <ToolBtn
            key={l}
            onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
            active={editor.isActive('heading', { level: l })}
            title={`标题 ${l}`}
          >
            H{l}
          </ToolBtn>
        ))}
        <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
          ≡
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
          1.
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
          "
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="代码块">
          {'</>'}
        </ToolBtn>
        <div style={{ width: 1, background: '#e5e7eb', margin: '0 4px' }} />
        <ToolBtn
          onClick={() => fileRef.current?.click()}
          title="插入图片"
        >
          {uploading ? '上传中...' : '🖼 图片'}
        </ToolBtn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) insertImage(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ padding: '16px 20px', minHeight: 320, fontSize: 15, lineHeight: 1.7 }}
      />
    </div>
  )
}

// ─── Article Form ──────────────────────────────────────────
function ArticleForm({
  article,
  onSaved,
  onCancel,
}: {
  article?: Article
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(article?.title ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [type, setType] = useState<'article' | 'video'>(article?.type ?? 'article')
  const [videoUrl, setVideoUrl] = useState(article?.video_url ?? '')
  const [coverUrl, setCoverUrl] = useState(article?.cover_url ?? '')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async (andPublish = false) => {
    if (!title.trim()) { setMsg('请填写标题'); return }
    setSaving(true)
    try {
      const payload = { title, content, type, video_url: videoUrl || null, cover_url: coverUrl || null }
      let saved: Article
      if (article?.id) {
        saved = await api.update(article.id, payload)
      } else {
        saved = await api.create(payload)
      }
      if (andPublish) {
        setPublishing(true)
        await api.publish(saved.id)
      }
      setMsg(andPublish ? '✅ 已发布' : '✅ 已保存草稿')
      setTimeout(onSaved, 800)
    } catch (e: any) {
      setMsg('❌ ' + e.message)
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← 返回列表
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('✅') ? '#059669' : '#dc2626', alignSelf: 'center' }}>{msg}</span>}
          <button
            onClick={() => save(false)}
            disabled={saving}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
          >
            {saving && !publishing ? '保存中...' : '保存草稿'}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            {publishing ? '发布中...' : article?.status === 'published' ? '更新并发布' : '发布'}
          </button>
        </div>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {(['article', 'video'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: type === t ? '#4f46e5' : '#e5e7eb',
              background: type === t ? '#eef2ff' : '#fff',
              color: type === t ? '#4f46e5' : '#6b7280',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: type === t ? 600 : 400,
            }}
          >
            {t === 'article' ? '📄 文章' : '🎬 视频'}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="文章标题..."
        style={{
          width: '100%',
          fontSize: 26,
          fontWeight: 700,
          border: 'none',
          borderBottom: '2px solid #f3f4f6',
          padding: '8px 0',
          marginBottom: 20,
          outline: 'none',
          color: '#111827',
          boxSizing: 'border-box',
        }}
      />

      {/* Cover URL */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}>封面图 URL（可选）</label>
        <input
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://..."
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
        />
      </div>

      {/* Video URL (only for video type) */}
      {type === 'video' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}>视频 URL</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* Rich editor */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 8 }}>内容</label>
        <RichEditor content={content} onChange={setContent} />
      </div>
    </div>
  )
}

// ─── Article List ──────────────────────────────────────────
function ArticleList({
  onEdit,
  onCreate,
}: {
  onEdit: (a: Article) => void
  onCreate: () => void
}) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.list()
      setArticles(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除？')) return
    await api.remove(id)
    load()
  }

  const handlePublish = async (id: string) => {
    await api.publish(id)
    load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>内容管理</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>管理所有文章和视频</p>
        </div>
        <button
          onClick={onCreate}
          style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          + 新建内容
        </button>
      </div>

      {loading && <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>加载中...</p>}
      {error && <p style={{ color: '#dc2626', textAlign: 'center', padding: 20 }}>{error}</p>}

      {!loading && articles.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <p style={{ margin: 0, fontSize: 15 }}>还没有内容，点击「新建内容」开始创作</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {articles.map((a) => (
          <div
            key={a.id}
            style={{
              background: '#fff',
              border: '1px solid #f3f4f6',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'border-color 0.15s',
            }}
          >
            {/* Type icon */}
            <div style={{ fontSize: 22, flexShrink: 0 }}>{a.type === 'video' ? '🎬' : '📄'}</div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {a.title || '（无标题）'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                创建于 {new Date(a.created_at).toLocaleDateString('zh-CN')}
                {a.published_at && ` · 发布于 ${new Date(a.published_at).toLocaleDateString('zh-CN')}`}
              </div>
            </div>

            {/* Status badge */}
            <div
              style={{
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: a.status === 'published' ? '#d1fae5' : '#fef3c7',
                color: a.status === 'published' ? '#065f46' : '#92400e',
                flexShrink: 0,
              }}
            >
              {a.status === 'published' ? '已发布' : '草稿'}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => onEdit(a)}
                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}
              >
                编辑
              </button>
              {a.status === 'draft' && (
                <button
                  onClick={() => handlePublish(a.id)}
                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  发布
                </button>
              )}
              <button
                onClick={() => handleDelete(a.id)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#dc2626' }}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── App Root ──────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editing, setEditing] = useState<Article | undefined>()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: '#fff', borderRight: '1px solid #f3f4f6', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5', marginBottom: 28, paddingLeft: 10 }}>CMS Admin</div>
        {[
          { label: '📄 内容管理', v: 'list' as const },
        ].map(({ label, v }) => (
          <button
            key={v}
            onClick={() => { setView(v); setEditing(undefined) }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '9px 14px',
              borderRadius: 8,
              border: 'none',
              background: view === v || (v === 'list' && (view === 'create' || view === 'edit')) ? '#eef2ff' : 'transparent',
              color: view === v || (v === 'list' && (view === 'create' || view === 'edit')) ? '#4f46e5' : '#6b7280',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: view === v ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, padding: '36px 40px', maxWidth: 1000 }}>
        {view === 'list' && (
          <ArticleList
            onEdit={(a) => { setEditing(a); setView('edit') }}
            onCreate={() => { setEditing(undefined); setView('create') }}
          />
        )}
        {(view === 'create' || view === 'edit') && (
          <ArticleForm
            article={editing}
            onSaved={() => { setView('list'); setEditing(undefined) }}
            onCancel={() => { setView('list'); setEditing(undefined) }}
          />
        )}
      </div>
    </div>
  )
}