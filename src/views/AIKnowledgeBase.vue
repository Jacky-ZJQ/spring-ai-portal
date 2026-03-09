<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useDark } from '@vueuse/core'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?worker&inline'
import { knowledgeAPI } from '../services/api.js'

type ArticleType = 'PROMPT' | 'WORKFLOW' | 'CASE' | 'NOTE'
type ArticleStatus = 'DRAFT' | 'PUBLISHED'
type VisibilityType = 'PUBLIC' | 'PRIVATE'

interface KnowledgeTagItem {
  id: number
  name: string
}

interface KnowledgeCategoryItem {
  id: number
  name: string
  code: string
  sortOrder: number
}

interface KnowledgeArticleListItem {
  id: number
  title: string
  summary: string | null
  type: ArticleType
  status: ArticleStatus
  visibility: VisibilityType
  categoryId: number | null
  categoryName: string | null
  coverUrl: string | null
  viewCount: number
  likeCount: number
  favoriteCount: number
  publishedAt: string | null
  updatedAt: string | null
  tags: KnowledgeTagItem[]
}

interface KnowledgeArticleDetail extends KnowledgeArticleListItem {
  contentMd: string
  extraJson: string | null
  createdBy: string | null
  updatedBy: string | null
  createdAt: string | null
}

interface KnowledgePageResult<T> {
  items: T[]
  total: number
  pageNo: number
  pageSize: number
}

interface KnowledgeShareResult {
  articleId: number
  shareToken: string
  sharePath: string
  expireAt: string | null
}

interface ArticleFormState {
  title: string
  summary: string
  type: ArticleType
  categoryId: number | null
  tagIds: number[]
  contentMd: string
  extraJson: string
  coverUrl: string
  visibility: VisibilityType
  status: ArticleStatus
}

interface MarkdownImportResult {
  content: string
  linkedImageCount: number
  missingImageCount: number
}

interface PdfImportResult {
  content: string
  textContent: string
  previewCount: number
}

const parseEnvBoolean = (value: string | undefined) => {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

const isDark = useDark()
const route = useRoute()
const router = useRouter()
const knowledgeDeleteEnabledOverride = parseEnvBoolean(import.meta.env.VITE_KNOWLEDGE_DELETE_ENABLED)

marked.setOptions({
  gfm: true,
  breaks: true,
})

const typeLabels: Record<ArticleType, string> = {
  PROMPT: '提示词',
  WORKFLOW: '工作流',
  CASE: '实战案例',
  NOTE: '经验笔记',
}

const visibilityLabels: Record<VisibilityType, string> = {
  PUBLIC: '公开',
  PRIVATE: '仅内部',
}

const statusLabels: Record<ArticleStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
}

const createEmptyForm = (): ArticleFormState => ({
  title: '',
  summary: '',
  type: 'PROMPT',
  categoryId: null,
  tagIds: [],
  contentMd: '',
  extraJson: '',
  coverUrl: '',
  visibility: 'PUBLIC',
  status: 'DRAFT',
})

const metaLoading = ref(false)
const listLoading = ref(false)
const dashboardLoading = ref(false)
const detailLoading = ref(false)
const editorLoading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const deleting = ref(false)
const shareLoading = ref(false)
const shareCooldown = ref(false)
const liking = ref(false)
const importLoading = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const selectedArticleId = ref<number | null>(null)
const selectedArticle = ref<KnowledgeArticleDetail | null>(null)
const pageError = ref('')
const shareUrl = ref('')
const feedbackType = ref<'success' | 'error' | ''>('')
const feedbackText = ref('')
const shareNeedsManualCopy = ref(false)
const categories = ref<KnowledgeCategoryItem[]>([])
const tags = ref<KnowledgeTagItem[]>([])
const importInputRef = ref<HTMLInputElement | null>(null)
const importTooltipVisible = ref(false)
const dashboardArticles = ref<KnowledgeArticleListItem[]>([])
const listState = reactive<KnowledgePageResult<KnowledgeArticleListItem>>({
  items: [],
  total: 0,
  pageNo: 1,
  pageSize: 8,
})
const filters = reactive({
  q: '',
  type: '' as '' | ArticleType,
  categoryId: null as number | null,
  tagId: null as number | null,
  sort: 'updated',
  status: 'ALL' as 'ALL' | ArticleStatus,
})
const form = reactive<ArticleFormState>(createEmptyForm())

let feedbackTimer: ReturnType<typeof window.setTimeout> | null = null
let shareCooldownTimer: ReturnType<typeof window.setTimeout> | null = null
let pdfjsModulePromise: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null = null
let pdfWorkerInstance: Worker | null = null
const likedStorageKey = 'ai-knowledge-liked-articles'
const likedArticleIds = ref<number[]>([])
const formSnapshotBaseline = ref('')
const allowEditorRouteLeave = ref(false)
const supportedImportPattern = /\.(md|markdown|txt|pdf)$/i
const imageAssetPattern = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

const parseRouteNumber = (value: unknown) => {
  const normalized = Array.isArray(value) ? value[0] : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const shareToken = computed(() => {
  const raw = route.query.share
  return typeof raw === 'string' ? raw.trim() : ''
})

const requestedArticleId = computed(() => parseRouteNumber(route.query.article))
const editorRouteKind = computed<'create' | 'edit' | null>(() => {
  if (route.name === 'ai-knowledge-base-editor-create') {
    return 'create'
  }
  if (route.name === 'ai-knowledge-base-editor-edit') {
    return 'edit'
  }
  return null
})
const editorArticleId = computed(() => (
  editorRouteKind.value === 'edit' ? parseRouteNumber(route.params.id) : null
))

const isShareMode = computed(() => shareToken.value.length > 0)
const isStandaloneEditor = computed(() => editorRouteKind.value !== null)
const isEmpty = computed(() => !listLoading.value && listState.items.length === 0)
const allowDeleteAction = computed(() => {
  if (isShareMode.value) return false
  if (knowledgeDeleteEnabledOverride !== null) {
    return knowledgeDeleteEnabledOverride
  }
  return !import.meta.env.PROD
})
const editorTitle = computed(() => (editorMode.value === 'create' ? '新建知识卡片' : '编辑知识卡片'))
const editorSubtitle = computed(() => (
  editorMode.value === 'create'
    ? '独立编辑页会保留完整空间，离开前也会检查未保存改动。'
    : '你正在独立编辑这张知识卡片，返回前会检查未保存内容。'
))
const importSupportHint = '当前支持导入 PDF（.pdf）、Markdown（.md / .markdown）和 TXT（.txt）。如果 Markdown 含本地图片，请把图片文件一起选中。'
const canShareSelected = computed(() => selectedArticle.value?.status === 'PUBLISHED')
const shareButtonText = computed(() => {
  if (shareLoading.value) return '生成中...'
  if (shareCooldown.value) return '已复制'
  return '分享'
})
const importButtonText = computed(() => (importLoading.value ? '导入中...' : '导入文档'))
const hasLikedSelected = computed(() => {
  if (!selectedArticleId.value) return false
  return likedArticleIds.value.includes(selectedArticleId.value)
})
const publishedVisibleCount = computed(() => (
  listState.items.filter((item) => item.status === 'PUBLISHED').length
))
const panelCountText = computed(() => {
  if (listLoading.value) {
    return '加载中...'
  }
  if (filters.status === 'ALL') {
    return `${publishedVisibleCount.value} / ${listState.total}`
  }
  return `${listState.items.length} / ${listState.total}`
})
const detailHeroSymbol = computed(() => {
  const currentType = selectedArticle.value?.type
  if (currentType === 'PROMPT') return 'P'
  if (currentType === 'WORKFLOW') return 'W'
  if (currentType === 'CASE') return 'C'
  if (currentType === 'NOTE') return 'N'
  return 'K'
})
const detailHeroTypeClass = computed(() => {
  const currentType = selectedArticle.value?.type
  return currentType ? `type-${currentType.toLowerCase()}` : ''
})
const detailHeroStyle = computed(() => {
  const coverUrl = selectedArticle.value?.coverUrl?.trim()
  if (!coverUrl) {
    return {}
  }
  return {
    '--detail-cover-image': `url("${coverUrl.replace(/"/g, '\\"')}")`,
  }
})
const editorCoverPreview = computed(() => form.coverUrl.trim())
const selectedTagNames = computed(() => (
  tags.value.filter((tag) => form.tagIds.includes(tag.id)).map((tag) => tag.name)
))
const filterSummary = computed(() => {
  if (metaLoading.value) {
    return '正在加载分类与标签...'
  }
  if (filters.status === 'ALL') {
    return `当前共 ${listState.total} 条知识卡片，包含已发布与草稿内容`
  }
  return `当前筛选为${statusLabels[filters.status]}，共 ${listState.total} 条知识卡片`
})

const normalizePlainText = (value: string) => (
  value
    .replace(/\r\n/g, '\n')
    .replace(/^>\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const stripSharedLeadMarkdown = (markdown: string, title?: string | null, summary?: string | null) => {
  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')
  let index = 0

  while (index < lines.length && !lines[index].trim()) {
    index += 1
  }

  const normalizedTitle = normalizePlainText(title || '')
  if (normalizedTitle && index < lines.length) {
    const headingLine = lines[index].trim()
    if (headingLine.startsWith('#')) {
      const headingText = normalizePlainText(headingLine.replace(/^#+\s*/, ''))
      if (headingText === normalizedTitle) {
        index += 1
        while (index < lines.length && !lines[index].trim()) {
          index += 1
        }
      }
    }
  }

  const normalizedSummary = normalizePlainText(summary || '')
  if (normalizedSummary && index < lines.length) {
    let end = index
    const firstLine = lines[index].trim()
    const candidateLines: string[] = []

    if (firstLine.startsWith('>')) {
      while (end < lines.length && lines[end].trim().startsWith('>')) {
        candidateLines.push(lines[end])
        end += 1
      }
    } else {
      while (end < lines.length && lines[end].trim()) {
        candidateLines.push(lines[end])
        end += 1
      }
    }

    const candidateText = normalizePlainText(candidateLines.join(' '))
    if (
      candidateText
      && (candidateText === normalizedSummary
        || candidateText.includes(normalizedSummary)
        || normalizedSummary.includes(candidateText))
    ) {
      index = end
      while (index < lines.length && !lines[index].trim()) {
        index += 1
      }
    }
  }

  return lines.slice(index).join('\n').trimStart()
}

const renderedContent = computed(() => {
  const markdown = selectedArticle.value?.contentMd || ''
  const displayMarkdown = isShareMode.value
    ? stripSharedLeadMarkdown(markdown, selectedArticle.value?.title, selectedArticle.value?.summary)
    : markdown
  const sanitizedHtml = DOMPurify.sanitize(marked.parse(displayMarkdown) as string)

  if (typeof window === 'undefined') {
    return sanitizedHtml
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${sanitizedHtml}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  if (!root) {
    return sanitizedHtml
  }

  root.querySelectorAll('p').forEach((paragraph) => {
    const contentNodes = Array.from(paragraph.childNodes).filter((node) => (
      node.nodeType !== window.Node.TEXT_NODE || node.textContent?.trim()
    ))

    if (contentNodes.length !== 1) {
      return
    }

    const onlyNode = contentNodes[0]
    if (onlyNode.nodeType !== window.Node.ELEMENT_NODE) {
      return
    }

    const onlyElement = onlyNode as Element
    const isStandaloneImage = onlyElement.tagName.toLowerCase() === 'img'
    const isLinkedImage = onlyElement.tagName.toLowerCase() === 'a'
      && onlyElement.childElementCount === 1
      && onlyElement.firstElementChild?.tagName.toLowerCase() === 'img'

    if (!isStandaloneImage && !isLinkedImage) {
      return
    }

    const imageElement = isStandaloneImage
      ? onlyElement
      : onlyElement.firstElementChild

    const figure = doc.createElement('figure')
    figure.className = 'article-figure'

    const frame = doc.createElement('div')
    frame.className = 'article-figure-frame'
    frame.appendChild(onlyElement)
    figure.appendChild(frame)

    const captionText = imageElement?.getAttribute('alt')?.trim()
    if (captionText) {
      const caption = doc.createElement('figcaption')
      caption.className = 'article-figcaption'
      caption.textContent = captionText
      figure.appendChild(caption)
    }

    paragraph.replaceWith(figure)
  })

  return root.innerHTML
})

const dashboardTotalCount = computed(() => dashboardArticles.value.length)
const dashboardPublishedCount = computed(() => (
  dashboardArticles.value.filter((article) => article.status === 'PUBLISHED').length
))
const dashboardDraftCount = computed(() => (
  dashboardArticles.value.filter((article) => article.status === 'DRAFT').length
))
const categoryBreakdown = computed(() => {
  const counts = new Map<number, number>()
  let uncategorizedCount = 0

  dashboardArticles.value.forEach((article) => {
    if (article.categoryId === null || article.categoryId === undefined) {
      uncategorizedCount += 1
      return
    }
    counts.set(article.categoryId, (counts.get(article.categoryId) || 0) + 1)
  })

  const items = [...categories.value]
    .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0) || left.id - right.id)
    .map((category) => ({
      key: `category-${category.id}`,
      label: category.name,
      count: counts.get(category.id) || 0,
    }))

  if (uncategorizedCount > 0) {
    items.push({
      key: 'category-uncategorized',
      label: '未分类',
      count: uncategorizedCount,
    })
  }

  return items
})
const tagBreakdown = computed(() => {
  const counts = new Map<number, number>()
  const knownTagIds = new Set(tags.value.map((tag) => tag.id))
  const unknownTags = new Map<number, string>()

  dashboardArticles.value.forEach((article) => {
    article.tags?.forEach((tag) => {
      counts.set(tag.id, (counts.get(tag.id) || 0) + 1)
      if (!knownTagIds.has(tag.id)) {
        unknownTags.set(tag.id, tag.name || `标签 ${tag.id}`)
      }
    })
  })

  const items = tags.value.map((tag) => ({
    key: `tag-${tag.id}`,
    label: tag.name,
    count: counts.get(tag.id) || 0,
  }))

  unknownTags.forEach((name, id) => {
    items.push({
      key: `tag-${id}`,
      label: name,
      count: counts.get(id) || 0,
    })
  })

  return items
})

const serializeFormSnapshot = () => JSON.stringify({
  title: form.title,
  summary: form.summary,
  type: form.type,
  categoryId: form.categoryId ?? null,
  tagIds: [...form.tagIds].sort((left, right) => left - right),
  contentMd: form.contentMd,
  extraJson: form.extraJson,
  coverUrl: form.coverUrl,
  visibility: form.visibility,
  status: form.status,
})

const markFormPristine = () => {
  formSnapshotBaseline.value = serializeFormSnapshot()
}

const isEditorDirty = computed(() => (
  isStandaloneEditor.value && formSnapshotBaseline.value !== serializeFormSnapshot()
))

const showFeedback = (type: 'success' | 'error', text: string) => {
  feedbackType.value = type
  feedbackText.value = text
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer)
  }
  feedbackTimer = window.setTimeout(() => {
    feedbackType.value = ''
    feedbackText.value = ''
  }, 2600)
}

const startShareCooldown = () => {
  shareCooldown.value = true
  if (shareCooldownTimer) {
    window.clearTimeout(shareCooldownTimer)
  }
  shareCooldownTimer = window.setTimeout(() => {
    shareCooldown.value = false
  }, 1400)
}

const loadLikedArticleIds = () => {
  try {
    const raw = window.localStorage.getItem(likedStorageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((value) => Number(value)).filter((value) => Number.isFinite(value))
  } catch (_error) {
    return []
  }
}

const persistLikedArticle = (articleId: number) => {
  if (likedArticleIds.value.includes(articleId)) {
    return
  }
  likedArticleIds.value = [...likedArticleIds.value, articleId]
  window.localStorage.setItem(likedStorageKey, JSON.stringify(likedArticleIds.value))
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '未记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const copyText = async (text: string) => {
  if (!text) return false
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (_error) {
    // 降级到 execCommand
  }

  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.top = '0'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  input.focus()
  input.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch (_error) {
    copied = false
  }

  document.body.removeChild(input)
  return copied
}

const resetForm = () => {
  Object.assign(form, createEmptyForm())
}

const toggleTag = (tagId: number) => {
  if (form.tagIds.includes(tagId)) {
    form.tagIds = form.tagIds.filter((id) => id !== tagId)
    return
  }
  form.tagIds = [...form.tagIds, tagId]
}

const openImportDialog = () => {
  if (importLoading.value) return
  importInputRef.value?.click()
}

const normalizeImportedContent = (content: string) => content
  .replace(/^\uFEFF/, '')
  .replace(/\r\n/g, '\n')
  .replace(/\u00A0/g, ' ')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new Error(`读取图片资源失败：${file.name}`))
  reader.readAsDataURL(file)
})

const normalizeImportAssetKey = (value: string) => {
  let normalized = value.trim().replace(/^<|>$/g, '')
  try {
    normalized = decodeURIComponent(normalized)
  } catch (_error) {
    normalized = value.trim().replace(/^<|>$/g, '')
  }

  return normalized
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .toLowerCase()
}

const isImageAssetFile = (file: File) => (
  file.type.startsWith('image/')
  || imageAssetPattern.test(file.name)
)

const isLocalImportAsset = (value: string) => {
  const normalized = value.trim()
  return Boolean(normalized)
    && !/^(data:|https?:|blob:|mailto:|tel:|#)/i.test(normalized)
    && !normalized.startsWith('/')
}

const buildImportImageMap = async (files: File[]) => {
  const imageMap = new Map<string, string>()

  for (const file of files) {
    if (!isImageAssetFile(file)) continue

    const dataUrl = await readFileAsDataUrl(file)
    const keys = new Set<string>()
    const primaryKey = normalizeImportAssetKey(file.name)
    if (primaryKey) {
      keys.add(primaryKey)
      const primaryBaseName = primaryKey.split('/').pop()
      if (primaryBaseName) keys.add(primaryBaseName)
    }

    const relativePath = normalizeImportAssetKey(file.webkitRelativePath || '')
    if (relativePath) {
      keys.add(relativePath)
      const relativeBaseName = relativePath.split('/').pop()
      if (relativeBaseName) keys.add(relativeBaseName)
    }

    keys.forEach((key) => {
      if (!imageMap.has(key)) {
        imageMap.set(key, dataUrl)
      }
    })
  }

  return imageMap
}

const resolveImportAssetSource = (source: string, imageMap: Map<string, string>) => {
  if (!isLocalImportAsset(source)) return null

  const normalized = normalizeImportAssetKey(source.split(/[?#]/)[0] || source)
  const candidates = [
    normalized,
    normalized.split('/').pop() || '',
  ].filter(Boolean)

  for (const candidate of candidates) {
    const matched = imageMap.get(candidate)
    if (matched) {
      return matched
    }
  }

  return null
}

const splitMarkdownImageTarget = (rawTarget: string) => {
  const target = rawTarget.trim()
  const titleMatch = target.match(/^(\S+)(\s+["'][^"']*["'])$/)
  if (titleMatch) {
    return {
      source: titleMatch[1],
      suffix: titleMatch[2],
    }
  }

  return {
    source: target,
    suffix: '',
  }
}

const inlineMarkdownLocalImages = async (content: string, files: File[]): Promise<MarkdownImportResult> => {
  const imageMap = await buildImportImageMap(files)
  const missingRefs = new Set<string>()
  let linkedImageCount = 0

  let rewrittenContent = content.replace(/!\[([^\]]*)\]\(([^)\r\n]+)\)/g, (match, alt, rawTarget) => {
    const { source, suffix } = splitMarkdownImageTarget(rawTarget)
    if (!isLocalImportAsset(source)) return match

    const resolved = resolveImportAssetSource(source, imageMap)
    if (!resolved) {
      missingRefs.add(source)
      return match
    }

    linkedImageCount += 1
    return `![${alt}](${resolved}${suffix})`
  })

  rewrittenContent = rewrittenContent.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, (match, prefix, source, suffix) => {
    if (!isLocalImportAsset(source)) return match

    const resolved = resolveImportAssetSource(source, imageMap)
    if (!resolved) {
      missingRefs.add(source)
      return match
    }

    linkedImageCount += 1
    return `${prefix}${resolved}${suffix}`
  })

  return {
    content: normalizeImportedContent(rewrittenContent),
    linkedImageCount,
    missingImageCount: missingRefs.size,
  }
}

const loadPdfjs = async () => {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  }

  const pdfjsLib = await pdfjsModulePromise
  if (pdfjsLib.GlobalWorkerOptions.workerPort !== pdfWorkerInstance) {
    pdfWorkerInstance = new PdfjsWorker()
    pdfjsLib.GlobalWorkerOptions.workerPort = pdfWorkerInstance
  }
  return pdfjsLib
}

const extractMarkdownTitle = (content: string, fileName: string) => {
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch?.[1]) {
    return headingMatch[1].trim()
  }

  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (firstLine) {
    return firstLine.replace(/^#+\s*/, '').trim()
  }

  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
}

const extractMarkdownSummary = (content: string) => {
  const summaryLine = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => (
      line
      && !line.startsWith('#')
      && !line.startsWith('```')
      && !line.startsWith('- ')
      && !line.startsWith('* ')
      && !/^\d+\./.test(line)
    ))

  if (!summaryLine) return ''
  return summaryLine.length > 120 ? `${summaryLine.slice(0, 117)}...` : summaryLine
}

const extractPdfLines = (items: Array<{ str?: string, transform?: number[] }>) => {
  const lines: string[] = []
  let activeLine = ''
  let activeY: number | null = null

  for (const item of items) {
    const segment = item.str?.trim()
    if (!segment) continue

    const y: number | null = Array.isArray(item.transform)
      ? Math.round((item.transform[5] ?? 0) as number)
      : activeY

    if (activeY === null || y === null || Math.abs(y - activeY) <= 2) {
      activeLine = activeLine ? `${activeLine} ${segment}` : segment
      if (activeY === null && y !== null) {
        activeY = y
      }
      continue
    }

    if (activeLine) {
      lines.push(activeLine.replace(/\s+/g, ' ').trim())
    }
    activeLine = segment
    activeY = y
  }

  if (activeLine) {
    lines.push(activeLine.replace(/\s+/g, ' ').trim())
  }

  return lines
}

const renderPdfPagePreview = async (page: any) => {
  const baseViewport = page.getViewport({ scale: 1 })
  const targetWidth = Math.min(1200, Math.max(920, Math.round(baseViewport.width)))
  const scale = Math.min(2, targetWidth / Math.max(baseViewport.width, 1))
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw new Error('无法初始化 PDF 预览画布')
  }

  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  await page.render({ canvasContext: context, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.82)
}

const extractPdfContent = async (file: File): Promise<PdfImportResult> => {
  const pdfjsLib = await loadPdfjs()
  const bytes = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({ data: bytes })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  const previews: string[] = []
  let previewBudget = 8_000_000

  try {
    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex)
      const textContent = await page.getTextContent()
      const pageLines = extractPdfLines(textContent.items as Array<{ str?: string, transform?: number[] }>)
      if (pageLines.length > 0) {
        pages.push(pageLines.join('\n'))
      }

      if (previewBudget > 0) {
        const previewDataUrl = await renderPdfPagePreview(page)
        if (previewDataUrl.length <= previewBudget) {
          previews.push(`![${file.name.replace(/\.[^.]+$/, '')} 第 ${pageIndex} 页](${previewDataUrl})`)
          previewBudget -= previewDataUrl.length
        }
      }

      if (typeof page.cleanup === 'function') {
        page.cleanup()
      }
    }
  } finally {
    pdf.cleanup()
    await pdf.destroy()
  }

  const textContent = normalizeImportedContent(pages.join('\n\n'))
  const previewContent = previews.length > 0
    ? `## 原文页面预览\n\n${previews.join('\n\n')}`
    : ''

  return {
    content: normalizeImportedContent([textContent, previewContent].filter(Boolean).join('\n\n---\n\n')),
    textContent,
    previewCount: previews.length,
  }
}

const handleImportDocument = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const selectedFiles = Array.from(input.files || [])
  const documentFiles = selectedFiles.filter((file) => supportedImportPattern.test(file.name))
  const file = documentFiles[0]

  if (!file) {
    showFeedback('error', '请选择一个 PDF / Markdown / TXT 文档')
    input.value = ''
    return
  }

  if (documentFiles.length > 1) {
    showFeedback('error', '一次只能导入一个主文档，如需关联图片可同时选择图片文件')
    input.value = ''
    return
  }

  const hasExistingDraft = Boolean(form.title.trim() || form.summary.trim() || form.contentMd.trim())
  if (hasExistingDraft && !window.confirm('导入会覆盖当前的标题、摘要和正文内容，是否继续？')) {
    input.value = ''
    return
  }

  importLoading.value = true
  try {
    const isPdf = /\.pdf$/i.test(file.name)
    const assetFiles = selectedFiles.filter((candidate) => candidate !== file)
    const markdownResult = !isPdf
      ? await inlineMarkdownLocalImages(await file.text(), assetFiles)
      : null
    const pdfResult = isPdf
      ? await extractPdfContent(file)
      : null

    const content = isPdf
      ? (pdfResult?.content || '')
      : (markdownResult?.content || '')

    if (!content) {
      showFeedback('error', isPdf ? 'PDF 未提取到可用内容，导入失败' : '文档内容为空，无法导入')
      return
    }

    const titleSeed = isPdf ? (pdfResult?.textContent || '') : content
    const summarySeed = isPdf ? (pdfResult?.textContent || '') : content

    form.title = extractMarkdownTitle(titleSeed, file.name)
    form.summary = summarySeed
      ? extractMarkdownSummary(summarySeed)
      : `已导入 ${pdfResult?.previewCount || 0} 页 PDF 预览`
    form.contentMd = content

    const successParts = [`已导入 ${file.name}`]
    if (isPdf && pdfResult?.previewCount) {
      successParts.push(`生成 ${pdfResult.previewCount} 页预览`)
    }
    if (!isPdf && markdownResult?.linkedImageCount) {
      successParts.push(`关联 ${markdownResult.linkedImageCount} 张图片`)
    }
    if (!isPdf && markdownResult?.missingImageCount) {
      successParts.push(`仍有 ${markdownResult.missingImageCount} 张本地图片未找到`)
    }

    showFeedback('success', successParts.join('，'))
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '文档导入失败')
  } finally {
    importLoading.value = false
    input.value = ''
  }
}

const syncArticleIntoList = (detail: KnowledgeArticleDetail) => {
  listState.items = listState.items.map((item) => {
    if (item.id !== detail.id) {
      return item
    }
    return {
      ...item,
      title: detail.title,
      summary: detail.summary,
      type: detail.type,
      status: detail.status,
      visibility: detail.visibility,
      categoryId: detail.categoryId,
      categoryName: detail.categoryName,
      coverUrl: detail.coverUrl,
      viewCount: detail.viewCount,
      likeCount: detail.likeCount,
      favoriteCount: detail.favoriteCount,
      publishedAt: detail.publishedAt,
      updatedAt: detail.updatedAt,
      tags: detail.tags,
    }
  })
}

const hydrateForm = (article: KnowledgeArticleDetail) => {
  Object.assign(form, {
    title: article.title || '',
    summary: article.summary || '',
    type: article.type || 'PROMPT',
    categoryId: article.categoryId ?? null,
    tagIds: Array.isArray(article.tags) ? article.tags.map((tag) => tag.id) : [],
    contentMd: article.contentMd || '',
    extraJson: article.extraJson || '',
    coverUrl: article.coverUrl || '',
    visibility: article.visibility || 'PUBLIC',
    status: article.status || 'DRAFT',
  })
}

const buildPayload = (status: ArticleStatus) => ({
  title: form.title.trim(),
  summary: form.summary.trim(),
  type: form.type,
  categoryId: form.categoryId,
  tagIds: form.tagIds,
  contentMd: form.contentMd.trim(),
  extraJson: form.extraJson.trim(),
  coverUrl: form.coverUrl.trim(),
  visibility: form.visibility,
  status,
  createdBy: 'portal',
  updatedBy: 'portal',
})

const buildKnowledgeBaseLocation = (articleId?: number | null) => (
  articleId
    ? { name: 'ai-knowledge-base', query: { article: String(articleId) } }
    : { name: 'ai-knowledge-base' }
)

const openCreateEditor = async () => {
  await router.push({ name: 'ai-knowledge-base-editor-create' })
}

const openEditEditor = async () => {
  if (!selectedArticle.value) return
  await router.push({
    name: 'ai-knowledge-base-editor-edit',
    params: { id: String(selectedArticle.value.id) },
  })
}

const closeEditor = async (skipPrompt = false, articleId?: number | null) => {
  if (!skipPrompt && isEditorDirty.value && !window.confirm('当前编辑内容尚未保存，确定离开编辑页吗？')) {
    return
  }

  allowEditorRouteLeave.value = true
  try {
    await router.push(buildKnowledgeBaseLocation(articleId ?? selectedArticleId.value ?? editorArticleId.value))
  } finally {
    allowEditorRouteLeave.value = false
  }
}

const prepareCreateEditor = async () => {
  editorMode.value = 'create'
  pageError.value = ''
  resetForm()
  markFormPristine()
}

const prepareEditEditor = async (id: number) => {
  editorMode.value = 'edit'
  pageError.value = ''
  editorLoading.value = true
  try {
    const detail = selectedArticle.value?.id === id
      ? selectedArticle.value
      : await knowledgeAPI.getArticleDetail(id)
    selectedArticle.value = detail
    selectedArticleId.value = detail.id
    hydrateForm(detail)
    markFormPristine()
  } catch (error) {
    const message = error instanceof Error ? error.message : '编辑内容加载失败'
    const normalizedMessage = /failed to fetch|networkerror|network error/i.test(message)
      ? '编辑内容加载失败，请确认后端服务已启动'
      : message
    pageError.value = normalizedMessage
    showFeedback('error', normalizedMessage)
  } finally {
    editorLoading.value = false
  }
}

const keepArticleVisible = (articleStatus: ArticleStatus) => {
  if (filters.status !== 'ALL' && filters.status !== articleStatus) {
    filters.status = 'ALL'
    return true
  }
  return false
}

const orderArticlesForSidebar = (items: KnowledgeArticleListItem[]) => {
  if (filters.status !== 'ALL') {
    return items
  }
  return [...items].sort((left, right) => {
    if (left.status === right.status) {
      return 0
    }
    if (left.status === 'PUBLISHED') {
      return -1
    }
    return 1
  })
}

const loadMeta = async () => {
  metaLoading.value = true
  try {
    const [categoryData, tagData] = await Promise.all([
      knowledgeAPI.listCategories(),
      knowledgeAPI.listTags(),
    ])
    categories.value = Array.isArray(categoryData) ? categoryData : []
    tags.value = Array.isArray(tagData) ? tagData : []
  } finally {
    metaLoading.value = false
  }
}

const loadDashboard = async () => {
  dashboardLoading.value = true
  try {
    const pageSize = 200
    let pageNo = 1
    let total = 0
    const collected: KnowledgeArticleListItem[] = []

    while (pageNo === 1 || collected.length < total) {
      const data = await knowledgeAPI.listArticles({
        pageNo,
        pageSize,
        sort: 'updated',
        status: 'ALL',
      })
      const items = Array.isArray(data?.items) ? data.items : []
      total = typeof data?.total === 'number' ? data.total : items.length
      collected.push(...items)

      if (items.length === 0 || collected.length >= total) {
        break
      }
      pageNo += 1
    }

    dashboardArticles.value = collected
  } catch (error) {
    console.error('Dashboard Error:', error)
  } finally {
    dashboardLoading.value = false
  }
}

const openArticle = async (id: number, syncRoute = true) => {
  detailLoading.value = true
  pageError.value = ''
  selectedArticleId.value = id
  try {
    const detail = await knowledgeAPI.getArticleDetail(id)
    selectedArticle.value = detail
    if (syncRoute && !isShareMode.value && !isStandaloneEditor.value && requestedArticleId.value !== id) {
      await router.replace(buildKnowledgeBaseLocation(id))
    }
  } catch (error) {
    selectedArticle.value = null
    pageError.value = error instanceof Error ? error.message : '文章详情加载失败'
  } finally {
    detailLoading.value = false
  }
}

const syncSelectionAfterListLoad = async () => {
  if (listState.items.length === 0) {
    selectedArticleId.value = null
    selectedArticle.value = null
    return
  }

  if (requestedArticleId.value && listState.items.some((item) => item.id === requestedArticleId.value)) {
    if (selectedArticleId.value !== requestedArticleId.value || !selectedArticle.value) {
      await openArticle(requestedArticleId.value, false)
    }
    return
  }

  if (
    selectedArticle.value &&
    selectedArticleId.value &&
    listState.items.some((item) => item.id === selectedArticleId.value)
  ) {
    return
  }

  await openArticle(listState.items[0].id)
}

const loadArticles = async () => {
  listLoading.value = true
  pageError.value = ''
  try {
    const data = await knowledgeAPI.listArticles({
      pageNo: listState.pageNo,
      pageSize: listState.pageSize,
      q: filters.q.trim() || undefined,
      type: filters.type || undefined,
      categoryId: filters.categoryId ?? undefined,
      tagId: filters.tagId ?? undefined,
      sort: filters.sort,
      status: filters.status,
    })

    listState.items = orderArticlesForSidebar(Array.isArray(data?.items) ? data.items : [])
    listState.total = typeof data?.total === 'number' ? data.total : listState.items.length
    listState.pageNo = typeof data?.pageNo === 'number' ? data.pageNo : listState.pageNo
    listState.pageSize = typeof data?.pageSize === 'number' ? data.pageSize : listState.pageSize

    await syncSelectionAfterListLoad()
  } catch (error) {
    listState.items = []
    listState.total = 0
    selectedArticle.value = null
    selectedArticleId.value = null
    pageError.value = error instanceof Error ? error.message : '知识库列表加载失败'
  } finally {
    listLoading.value = false
  }
}

const loadSharedArticle = async (token: string) => {
  detailLoading.value = true
  pageError.value = ''
  try {
    const detail = await knowledgeAPI.getSharedArticle(token)
    selectedArticle.value = detail
    selectedArticleId.value = detail?.id ?? null
  } catch (error) {
    selectedArticle.value = null
    selectedArticleId.value = null
    pageError.value = error instanceof Error ? error.message : '分享内容加载失败'
  } finally {
    detailLoading.value = false
  }
}

const submitArticle = async (status: ArticleStatus) => {
  if (saving.value) return
  if (!form.title.trim()) {
    showFeedback('error', '标题不能为空')
    return
  }
  if (!form.contentMd.trim()) {
    showFeedback('error', '正文不能为空')
    return
  }

  saving.value = true
  pageError.value = ''

  try {
    const payload = buildPayload(status)
    const result = editorMode.value === 'create'
      ? await knowledgeAPI.createArticle(payload)
      : await knowledgeAPI.updateArticle(selectedArticleId.value, payload)

    selectedArticle.value = result
    selectedArticleId.value = result.id
    hydrateForm(result)
    markFormPristine()
    const filterReset = keepArticleVisible(result.status)
    await closeEditor(true, result.id)
    if (status === 'PUBLISHED') {
      showFeedback('success', filterReset ? '已发布，并已切换到全部视图' : '已保存并发布')
    } else {
      showFeedback('success', filterReset ? '已保存为草稿，并已切换到全部视图' : '草稿已保存')
    }
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}

const togglePublish = async () => {
  if (!selectedArticleId.value || publishing.value || isShareMode.value) return
  publishing.value = true
  try {
    const result = selectedArticle.value?.status === 'PUBLISHED'
      ? await knowledgeAPI.unpublishArticle(selectedArticleId.value)
      : await knowledgeAPI.publishArticle(selectedArticleId.value)
    selectedArticle.value = result
    const filterReset = keepArticleVisible(result.status)
    await Promise.all([loadArticles(), loadDashboard()])
    if (result.status === 'PUBLISHED') {
      showFeedback('success', filterReset ? '已发布，并已切换到全部视图' : '已发布')
    } else {
      showFeedback('success', filterReset ? '已转为草稿，并已切换到全部视图' : '已转为草稿')
    }
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '发布状态更新失败')
  } finally {
    publishing.value = false
  }
}

const removeArticle = async () => {
  if (!selectedArticleId.value || deleting.value || isShareMode.value) return
  if (!allowDeleteAction.value) {
    showFeedback('error', '当前环境已禁用删除操作')
    return
  }
  if (!window.confirm('确定删除当前知识卡片吗？')) {
    return
  }

  deleting.value = true
  try {
    await knowledgeAPI.deleteArticle(selectedArticleId.value)
    selectedArticle.value = null
    selectedArticleId.value = null
    await Promise.all([loadArticles(), loadDashboard()])
    showFeedback('success', '已删除')
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '删除失败')
  } finally {
    deleting.value = false
  }
}

const createShareLink = async () => {
  if (!selectedArticleId.value || shareLoading.value || shareCooldown.value || isShareMode.value) return
  if (!canShareSelected.value) {
    showFeedback('error', '仅已发布文章支持分享，请先发布当前内容')
    return
  }
  shareLoading.value = true
  shareNeedsManualCopy.value = false
  try {
    const result = await knowledgeAPI.createShareLink(selectedArticleId.value, 168) as KnowledgeShareResult
    const url = `${window.location.origin}/knowledge-base?share=${encodeURIComponent(result.shareToken)}`
    shareUrl.value = url
    const copied = await copyText(url)
    startShareCooldown()
    if (copied) {
      showFeedback('success', '分享链接已复制')
    } else {
      shareNeedsManualCopy.value = true
      showFeedback('error', '链接已生成，但浏览器未能自动复制')
    }
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '分享链接生成失败')
  } finally {
    shareLoading.value = false
  }
}

const likeSelectedArticle = async () => {
  if (!selectedArticleId.value || liking.value) return
  if (hasLikedSelected.value) {
    showFeedback('error', '你已经点过赞了')
    return
  }

  liking.value = true
  try {
    const result = await knowledgeAPI.likeArticle(selectedArticleId.value)
    selectedArticle.value = result
    syncArticleIntoList(result)
    persistLikedArticle(selectedArticleId.value)
    showFeedback('success', '点赞成功')
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : '点赞失败')
  } finally {
    liking.value = false
  }
}

const copyShareUrl = async () => {
  if (!shareUrl.value) return
  const copied = await copyText(shareUrl.value)
  if (copied) {
    shareNeedsManualCopy.value = false
    startShareCooldown()
  }
  showFeedback(copied ? 'success' : 'error', copied ? '链接已复制' : '复制失败')
}

const runSearch = async () => {
  listState.pageNo = 1
  await loadArticles()
}

const resetFilters = async () => {
  filters.q = ''
  filters.type = ''
  filters.categoryId = null
  filters.tagId = null
  filters.sort = 'updated'
  filters.status = 'ALL'
  listState.pageNo = 1
  await loadArticles()
}

watch(
  [shareToken, isStandaloneEditor, editorArticleId],
  async ([token, editorPage, editId]) => {
    shareUrl.value = ''
    shareNeedsManualCopy.value = false
    if (token) {
      await loadSharedArticle(token)
      return
    }

    if (editorPage) {
      await loadMeta()
      if (editorRouteKind.value === 'create') {
        await prepareCreateEditor()
        return
      }
      if (editId) {
        await prepareEditEditor(editId)
        return
      }
      await router.replace({ name: 'ai-knowledge-base' })
      return
    }

    await Promise.all([loadMeta(), loadArticles(), loadDashboard()])
  },
  { immediate: true },
)

likedArticleIds.value = loadLikedArticleIds()

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!isEditorDirty.value || saving.value) {
    return
  }
  event.preventDefault()
  event.returnValue = ''
}

watch(isEditorDirty, (dirty) => {
  if (dirty) {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave((_to, _from, next) => {
  if (allowEditorRouteLeave.value || !isEditorDirty.value || saving.value) {
    next()
    return
  }
  if (window.confirm('当前编辑内容尚未保存，确定离开编辑页吗？')) {
    next()
    return
  }
  next(false)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer)
  }
  if (shareCooldownTimer) {
    window.clearTimeout(shareCooldownTimer)
  }
  if (pdfWorkerInstance) {
    pdfWorkerInstance.terminate()
    pdfWorkerInstance = null
  }
})
</script>

<template>
  <main class="knowledge-page" :class="{ dark: isDark }">
    <div class="knowledge-shell">
      <section v-if="!isShareMode && !isStandaloneEditor" class="hero-card">
        <div class="hero-copy-block">
          <p class="eyebrow">AI Knowledge Base</p>
          <h1>AI 知识库</h1>
          <p class="hero-copy">沉淀和分享 AI 提示词、工作流与实战经验，打造可复用的知识资产。</p>
          <section class="hero-inline-dashboard" :aria-busy="dashboardLoading ? 'true' : 'false'">
            <div class="hero-inline-group hero-inline-total">
              <span class="hero-inline-label">总览</span>
              <div class="hero-inline-items">
                <span class="hero-inline-chip strong">总数 {{ dashboardLoading ? '--' : dashboardTotalCount }}</span>
                <span class="hero-inline-chip">已发布 {{ dashboardLoading ? '--' : dashboardPublishedCount }}</span>
                <span class="hero-inline-chip">草稿 {{ dashboardLoading ? '--' : dashboardDraftCount }}</span>
              </div>
            </div>
            <div class="hero-inline-group">
              <span class="hero-inline-label">分类</span>
              <div class="hero-inline-items">
                <span v-for="item in categoryBreakdown" :key="item.key" class="hero-inline-chip">
                  {{ item.label }} {{ dashboardLoading ? '--' : item.count }}
                </span>
              </div>
            </div>
            <div class="hero-inline-group">
              <span class="hero-inline-label">标签</span>
              <div class="hero-inline-items">
                <span v-for="item in tagBreakdown" :key="item.key" class="hero-inline-chip">
                  {{ item.label }} {{ dashboardLoading ? '--' : item.count }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section v-if="isShareMode" class="share-banner">
        <div class="share-banner-copy">
          <p class="eyebrow">Shared Knowledge</p>
          <h1>{{ selectedArticle?.title || '正在打开知识分享' }}</h1>
          <p>
            {{ selectedArticle?.summary || '这是一张来自 AI 知识库的只读卡片，你可以直接阅读，但不能编辑或发布。' }}
          </p>
          <div v-if="selectedArticle" class="share-banner-meta">
            <span class="pill">{{ typeLabels[selectedArticle.type] }}</span>
            <span class="pill">{{ visibilityLabels[selectedArticle.visibility] }}</span>
            <span class="pill">更新 {{ formatDate(selectedArticle.updatedAt) }}</span>
          </div>
        </div>
        <div class="share-banner-side">
          <span class="share-banner-badge">只读访问</span>
          <p>来自 Jacky's AI DevSpace 的分享链接</p>
          <a class="share-banner-link" href="/knowledge-base">进入知识库</a>
        </div>
      </section>

      <div v-if="feedbackText" class="feedback-toast-wrap" aria-live="polite" aria-atomic="true">
        <section class="feedback-toast" :class="feedbackType" role="status">
          <span class="feedback-toast-icon">{{ feedbackType === 'error' ? '!' : '✓' }}</span>
          <div class="feedback-toast-copy">
            <strong>{{ feedbackType === 'error' ? '操作提醒' : '操作成功' }}</strong>
            <p>{{ feedbackText }}</p>
          </div>
        </section>
      </div>

      <section v-if="pageError" class="error-box">
        {{ pageError }}
      </section>

      <section v-if="!isShareMode && !isStandaloneEditor" class="toolbar-card">
        <div class="toolbar-topline">
          <div class="search-cluster">
            <label class="search-field">
              <span class="search-field-label">搜索</span>
              <input
                v-model="filters.q"
                type="text"
                class="search-input"
                placeholder="搜索标题、摘要或正文"
                @keydown.enter.prevent="runSearch"
              >
            </label>
            <button class="primary-btn toolbar-btn" type="button" @click="runSearch">搜索</button>
            <button class="ghost-btn toolbar-btn" type="button" @click="resetFilters">重置</button>
          </div>
          <button class="dark-btn toolbar-btn add-note-btn" type="button" @click="openCreateEditor">+ 新增笔记</button>
        </div>
        <div class="filter-grid">
          <label>
            <span>类型</span>
            <select v-model="filters.type">
              <option value="">全部</option>
              <option value="PROMPT">提示词</option>
              <option value="WORKFLOW">工作流</option>
              <option value="CASE">实战案例</option>
              <option value="NOTE">经验笔记</option>
            </select>
          </label>
          <label>
            <span>状态</span>
            <select v-model="filters.status">
              <option value="ALL">全部</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
          </select>
        </label>
          <label>
            <span>标签</span>
            <select v-model="filters.tagId">
              <option :value="null">全部</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </label>
          <label>
            <span>排序</span>
            <select v-model="filters.sort">
              <option value="updated">最近更新</option>
              <option value="popular">热度优先</option>
              <option value="oldest">最早创建</option>
            </select>
          </label>
        </div>
        <p class="toolbar-tip">
          {{ filterSummary }}
        </p>
      </section>

      <section v-if="isStandaloneEditor" class="editor-page-shell">
        <header class="editor-page-header">
          <div class="editor-page-heading">
            <button class="ghost-btn editor-back-btn" type="button" @click="closeEditor()">
              返回知识库
            </button>
            <p class="eyebrow">Knowledge Editor</p>
            <h1>{{ editorTitle }}</h1>
            <p class="editor-page-subtitle">{{ editorSubtitle }}</p>
          </div>
          <div class="editor-page-actions">
            <button class="ghost-btn" type="button" :disabled="saving" @click="submitArticle('DRAFT')">
              保存草稿
            </button>
            <button class="dark-btn" type="button" :disabled="saving" @click="submitArticle('PUBLISHED')">
              保存并发布
            </button>
          </div>
        </header>

        <div v-if="editorLoading" class="empty-box editor-loading-box">
          正在加载编辑内容...
        </div>

        <div v-else class="editor-page-layout">
          <section class="editor-main-card">
            <section class="editor-import-panel">
              <div class="editor-import-copy">
                <p class="editor-import-eyebrow">Document Intake</p>
                <h2>导入现有文档，直接生成知识卡正文</h2>
                <p class="editor-import-text">
                  支持 PDF、Markdown、TXT。Markdown 若含本地图片，请把主文档和图片文件一起选中；导入会覆盖当前标题、摘要和正文。
                </p>
                <div class="editor-import-chip-row" aria-hidden="true">
                  <span class="editor-import-chip">PDF</span>
                  <span class="editor-import-chip">Markdown</span>
                  <span class="editor-import-chip">TXT</span>
                  <span class="editor-import-chip">本地图片</span>
                </div>
              </div>
              <div class="editor-import-actions">
                <div
                  class="editor-tooltip-anchor"
                  @mouseenter="importTooltipVisible = true"
                  @mouseleave="importTooltipVisible = false"
                >
                  <button
                    class="ghost-btn editor-import-btn"
                    type="button"
                    :disabled="importLoading"
                    :aria-label="`${importButtonText}，${importSupportHint}`"
                    @focus="importTooltipVisible = true"
                    @blur="importTooltipVisible = false"
                    @click="openImportDialog"
                  >
                    {{ importButtonText }}
                  </button>
                  <div
                    v-show="importTooltipVisible && !importLoading"
                    class="editor-tooltip"
                    role="tooltip"
                  >
                    {{ importSupportHint }}
                  </div>
                </div>
                <p class="editor-import-meta">1 个主文档 + 多个图片资源</p>
              </div>
            </section>

            <input
              ref="importInputRef"
              class="editor-import-input"
              type="file"
              multiple
              accept=".pdf,.md,.markdown,.txt,image/*,application/pdf,text/markdown,text/plain"
              @change="handleImportDocument"
            >

            <label class="editor-field">
              <span>标题</span>
              <input v-model="form.title" type="text" placeholder="例如：RAG 排障 checklist">
            </label>

            <label class="editor-field">
              <span>摘要</span>
              <textarea v-model="form.summary" rows="4" placeholder="一句话说明这条知识卡片的价值"></textarea>
            </label>

            <label class="editor-field">
              <span>正文 Markdown</span>
              <textarea
                v-model="form.contentMd"
                rows="20"
                placeholder="# 标题&#10;&#10;1. 背景&#10;2. 做法&#10;3. 注意事项"
              ></textarea>
            </label>

            <label class="editor-field">
              <span>扩展 JSON</span>
              <textarea
                v-model="form.extraJson"
                rows="8"
                placeholder='{"scene":"内部复用","source":"anthropic"}'
              ></textarea>
            </label>
          </section>

          <aside class="editor-side-card">
            <section class="editor-side-section">
              <div class="editor-side-head">
                <p class="editor-side-title">发布设置</p>
                <span class="editor-side-note">{{ editorMode === 'create' ? '新内容' : '正在编辑' }}</span>
              </div>

              <label class="editor-field">
                <span>类型</span>
                <select v-model="form.type">
                  <option value="PROMPT">提示词</option>
                  <option value="WORKFLOW">工作流</option>
                  <option value="CASE">实战案例</option>
                  <option value="NOTE">经验笔记</option>
                </select>
              </label>

              <label class="editor-field">
                <span>可见范围</span>
                <select v-model="form.visibility">
                  <option value="PUBLIC">公开</option>
                  <option value="PRIVATE">仅内部</option>
                </select>
              </label>

              <label class="editor-field">
                <span>分类</span>
                <select v-model="form.categoryId">
                  <option :value="null">未分类</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </label>
            </section>

            <section class="editor-side-section">
              <div class="editor-side-head">
                <p class="editor-side-title">封面图</p>
                <span class="editor-side-note">详情页顶部展示图</span>
              </div>

              <label class="editor-field">
                <span>封面 URL</span>
                <input v-model="form.coverUrl" type="text" placeholder="/knowledge-covers/spring-ai-notes.svg">
              </label>
              <p class="editor-help-text">
                封面 URL 就是知识卡片详情页顶部那张大图的地址，支持站内路径和 `https://...jpg/png/webp`。
              </p>

              <div v-if="editorCoverPreview" class="editor-cover-preview">
                <img :src="editorCoverPreview" alt="封面预览">
              </div>
            </section>

            <section class="editor-side-section">
              <div class="editor-side-head">
                <p class="editor-side-title">标签</p>
                <span class="editor-side-note">
                  {{ selectedTagNames.length ? `已选 ${selectedTagNames.length} 个` : '可多选' }}
                </span>
              </div>

              <div class="editor-tag-grid">
                <button
                  v-for="tag in tags"
                  :key="tag.id"
                  type="button"
                  class="editor-tag-chip"
                  :class="{ selected: form.tagIds.includes(tag.id) }"
                  @click="toggleTag(tag.id)"
                >
                  <span>{{ tag.name }}</span>
                  <small>{{ form.tagIds.includes(tag.id) ? '已选' : '点击选择' }}</small>
                </button>
              </div>
            </section>

            <section class="editor-side-section editor-tips-card">
              <p class="editor-side-title">编辑说明</p>
              <ul class="editor-tips-list">
                <li>独立编辑页不会因为误点遮罩而关闭。</li>
                <li>未保存离开页面时会弹出确认。</li>
                <li>支持 PDF / Markdown / TXT 导入。</li>
                <li>Markdown 本地图片可与主文档一起导入。</li>
                <li>封面图会显示在知识卡片详情头部背景区域。</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>

      <section v-else class="content-grid" :class="{ single: isShareMode }">
        <aside v-if="!isShareMode" class="list-panel">
          <div class="panel-head">
            <div>
              <h2>知识卡片</h2>
              <p class="panel-subtitle">点左侧卡片切换详情，草稿和已发布会一起出现。</p>
            </div>
            <span class="panel-count">{{ panelCountText }}</span>
          </div>
          <div v-if="isEmpty" class="empty-box">
            还没有知识卡片，点击“新增笔记”开始录入。
          </div>
          <button
            v-for="article in listState.items"
            :key="article.id"
            type="button"
            class="list-item"
            :class="{ active: article.id === selectedArticleId }"
            @click="openArticle(article.id)"
          >
            <div class="list-top">
              <strong>{{ article.title }}</strong>
              <span class="mini-badge" :class="article.status.toLowerCase()">
                {{ statusLabels[article.status] }}
              </span>
            </div>
            <p>{{ article.summary || '暂无摘要' }}</p>
            <div class="list-meta">
              <span>{{ typeLabels[article.type] }}</span>
              <span v-if="article.categoryName && article.categoryName !== typeLabels[article.type]">
                {{ article.categoryName }}
              </span>
              <span>{{ formatDate(article.updatedAt) }}</span>
            </div>
          </button>
        </aside>

        <section class="detail-panel">
          <div v-if="detailLoading" class="empty-box">
            正在加载内容...
          </div>
          <div v-else-if="!selectedArticle" class="empty-box">
            选择左侧卡片查看详情，或直接创建新内容。
          </div>
          <template v-else>
            <div class="detail-canvas">
              <div
                v-if="!isShareMode"
                class="detail-hero-card"
                :class="[detailHeroTypeClass, { 'has-cover': Boolean(selectedArticle.coverUrl) }]"
                :style="detailHeroStyle"
              >
                <div class="detail-hero-topline">
                  <div class="detail-page-identity">
                    <div class="detail-page-icon" aria-hidden="true">
                      <span>{{ detailHeroSymbol }}</span>
                    </div>
                    <div class="detail-page-copy">
                      <div class="detail-meta-line">
                        <p class="eyebrow">{{ typeLabels[selectedArticle.type] }}</p>
                        <span class="detail-meta-dot"></span>
                        <p class="detail-kicker">
                        {{ selectedArticle.visibility === 'PUBLIC' ? '可分享知识卡片' : '内部知识卡片' }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="detail-actions">
                    <button
                      v-if="!isShareMode"
                      class="ghost-btn"
                      type="button"
                      @click="openEditEditor"
                    >
                      编辑
                    </button>
                    <button
                      v-if="!isShareMode"
                      class="ghost-btn"
                      type="button"
                      :disabled="publishing"
                      @click="togglePublish"
                    >
                      {{ selectedArticle.status === 'PUBLISHED' ? '转草稿' : '发布' }}
                    </button>
                    <button
                      v-if="!isShareMode"
                      class="ghost-btn"
                      type="button"
                      :disabled="liking || hasLikedSelected"
                      :title="hasLikedSelected ? '当前浏览器已点过赞' : '为这条知识卡片点赞'"
                      @click="likeSelectedArticle"
                    >
                      {{ hasLikedSelected ? `已赞 ${selectedArticle.likeCount || 0}` : `点赞 ${selectedArticle.likeCount || 0}` }}
                    </button>
                    <button
                      v-if="!isShareMode"
                      class="ghost-btn"
                      type="button"
                      :disabled="shareLoading || shareCooldown || !canShareSelected"
                      :title="canShareSelected ? '生成并复制分享链接' : '仅已发布文章支持分享'"
                      :aria-busy="shareLoading ? 'true' : 'false'"
                      @click="createShareLink"
                    >
                      {{ shareButtonText }}
                    </button>
                    <button
                      v-if="allowDeleteAction"
                      class="danger-btn"
                      type="button"
                      :disabled="deleting"
                      @click="removeArticle"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div class="detail-title-stack">
                  <h2>{{ selectedArticle.title }}</h2>
                  <p class="detail-summary">
                    {{ selectedArticle.summary || '这条知识卡片还没有摘要描述。' }}
                  </p>
                </div>

                <div class="detail-properties-grid">
                  <article>
                    <span>状态</span>
                    <strong>{{ statusLabels[selectedArticle.status] }}</strong>
                  </article>
                  <article>
                    <span>可见范围</span>
                    <strong>{{ visibilityLabels[selectedArticle.visibility] }}</strong>
                  </article>
                  <article>
                    <span>类型</span>
                    <strong>{{ typeLabels[selectedArticle.type] }}</strong>
                  </article>
                  <article v-if="selectedArticle.categoryName && selectedArticle.categoryName !== typeLabels[selectedArticle.type]">
                    <span>分类</span>
                    <strong>{{ selectedArticle.categoryName }}</strong>
                  </article>
                  <article>
                    <span>浏览</span>
                    <strong>{{ selectedArticle.viewCount || 0 }}</strong>
                  </article>
                  <article>
                    <span>点赞</span>
                    <strong>{{ selectedArticle.likeCount || 0 }}</strong>
                  </article>
                  <article>
                    <span>更新时间</span>
                    <strong>{{ formatDate(selectedArticle.updatedAt) }}</strong>
                  </article>
                </div>

                <div v-if="selectedArticle.tags?.length" class="tag-row detail-tag-row">
                  <span v-for="tag in selectedArticle.tags" :key="tag.id" class="tag-chip">
                    {{ tag.name }}
                  </span>
                </div>
              </div>

              <div v-else class="share-reading-head">
                <div class="share-reading-topline">
                  <span class="share-reading-pill strong">只读分享</span>
                  <span class="share-reading-pill">{{ typeLabels[selectedArticle.type] }}</span>
                  <span class="share-reading-pill">{{ visibilityLabels[selectedArticle.visibility] }}</span>
                  <span class="share-reading-pill">更新 {{ formatDate(selectedArticle.updatedAt) }}</span>
                </div>
                <div v-if="selectedArticle.tags?.length" class="tag-row share-reading-tags">
                  <span v-for="tag in selectedArticle.tags" :key="tag.id" class="tag-chip">
                    {{ tag.name }}
                  </span>
                </div>
              </div>

              <section class="markdown-card" :class="{ 'share-reading-card': isShareMode }">
                <article class="markdown-body" v-html="renderedContent"></article>
              </section>

              <div v-if="selectedArticle.extraJson" class="extra-box">
                <h3>扩展字段</h3>
                <pre>{{ selectedArticle.extraJson }}</pre>
              </div>

              <div v-if="shareUrl && shareNeedsManualCopy && !isShareMode" class="share-box">
                <div>
                  <p>浏览器未能自动复制，请手动复制下面的分享链接：</p>
                  <code>{{ shareUrl }}</code>
                </div>
                <button class="ghost-btn" type="button" @click="copyShareUrl">复制链接</button>
              </div>
            </div>
          </template>
        </section>
      </section>
    </div>

  </main>
</template>

<style scoped lang="scss">
.knowledge-page {
  --page-bg: radial-gradient(circle at top left, rgba(62, 178, 151, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 179, 71, 0.15), transparent 24%),
    linear-gradient(180deg, #f5fbff 0%, #fcfbf6 48%, #f8f4ed 100%);
  --panel-bg: rgba(255, 255, 255, 0.86);
  --panel-muted: rgba(247, 250, 252, 0.84);
  --panel-border: rgba(21, 39, 58, 0.11);
  --text-main: #152234;
  --text-sub: #5f6f82;
  --shadow: 0 22px 64px rgba(18, 30, 44, 0.08);
  --shadow-soft: 0 12px 30px rgba(18, 30, 44, 0.06);
  --accent: #0f9f83;
  --accent-strong: #11233d;
  --chip-bg: rgba(15, 159, 131, 0.12);
  min-height: calc(100vh - 78px);
  padding: 1.35rem clamp(1rem, 3vw, 2.4rem) 2.5rem;
  background: var(--page-bg);
  color: var(--text-main);
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.knowledge-page.dark {
  --page-bg: radial-gradient(circle at top left, rgba(78, 227, 191, 0.08), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 176, 56, 0.09), transparent 24%),
    linear-gradient(180deg, #0d1723 0%, #131f30 45%, #121622 100%);
  --panel-bg: rgba(12, 20, 32, 0.88);
  --panel-muted: rgba(17, 28, 42, 0.88);
  --panel-border: rgba(227, 238, 255, 0.12);
  --text-main: #f3f7ff;
  --text-sub: #a9b7c9;
  --shadow: 0 24px 68px rgba(0, 0, 0, 0.36);
  --shadow-soft: 0 12px 28px rgba(0, 0, 0, 0.22);
  --accent: #5cd5be;
  --accent-strong: #eff5ff;
  --chip-bg: rgba(92, 213, 190, 0.14);
}

.knowledge-shell {
  max-width: 1600px;
  margin: 0 auto;
}

.hero-card,
.toolbar-card,
.list-panel,
.detail-panel,
.editor-panel,
.share-banner,
.error-box {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.hero-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.95rem;
  border-radius: 30px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: auto -18% -28% auto;
  width: 320px;
  height: 320px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(15, 159, 131, 0.16), rgba(15, 159, 131, 0));
  pointer-events: none;
}

.hero-copy-block {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.9rem;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-card h1 {
  margin: 0;
  font-size: clamp(2.5rem, 5vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.detail-title-stack h2 {
  margin: 0;
  font-size: clamp(2rem, 3.3vw, 3.15rem);
  line-height: 1.06;
  letter-spacing: -0.04em;
}

.hero-copy,
.detail-summary,
.toolbar-tip,
.list-item p,
.empty-box,
.share-banner p {
  color: var(--text-sub);
}

.hero-copy {
  max-width: 48rem;
  margin: 0;
  line-height: 1.75;
  font-size: 1.02rem;
}

.hero-notes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
}

.hero-notes span {
  border: 1px solid rgba(15, 159, 131, 0.14);
  background: rgba(255, 255, 255, 0.56);
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.knowledge-page.dark .hero-notes span {
  background: rgba(255, 255, 255, 0.04);
}

.hero-inline-dashboard {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  overflow-x: auto;
  padding: 0.15rem 0 0.1rem;
  scrollbar-width: thin;
}

.hero-inline-group {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  flex: 0 0 auto;
  min-width: 0;
}

.hero-inline-total {
  padding-right: 0.15rem;
}

.hero-inline-label {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-sub);
}

.hero-inline-items {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: nowrap;
}

.hero-inline-chip,
.mini-stat {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.38rem 0.64rem;
  background: rgba(15, 159, 131, 0.08);
  border: 1px solid rgba(15, 159, 131, 0.12);
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.hero-inline-chip.strong {
  color: var(--accent-strong);
  background: rgba(15, 159, 131, 0.13);
}

.knowledge-page.dark .hero-inline-chip,
.knowledge-page.dark .mini-stat {
  background: rgba(255, 255, 255, 0.06);
}

.share-banner,
.error-box,
.toolbar-card {
  margin-top: 1rem;
  border-radius: 26px;
  padding: 1.1rem 1.25rem;
}

.share-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(250px, 0.62fr);
  gap: 1.25rem;
  align-items: stretch;
  max-width: 980px;
  margin-left: auto;
  margin-right: auto;
  padding: 1.25rem 1.35rem;
}

.share-banner-copy h1 {
  margin: 0;
  max-width: 18ch;
  font-size: clamp(1.9rem, 3.4vw, 2.9rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.share-banner-copy p {
  max-width: 50rem;
  margin: 0.85rem 0 0;
  line-height: 1.72;
}

.share-banner-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.share-banner-side {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 0.85rem;
  min-height: 100%;
  padding: 1rem 1.05rem;
  border-radius: 22px;
  border: 1px solid rgba(15, 159, 131, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(244, 249, 255, 0.66));
}

.knowledge-page.dark .share-banner-side {
  background: rgba(255, 255, 255, 0.04);
}

.share-banner-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.45rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f9f83;
  background: rgba(15, 159, 131, 0.12);
}

.share-banner-side p {
  margin: 0;
  color: var(--text-sub);
  line-height: 1.65;
}

.share-banner-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0.72rem 0.95rem;
  border-radius: 15px;
  border: 1px solid rgba(21, 39, 58, 0.12);
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-main);
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.share-banner-link:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.knowledge-page.dark .share-banner-link {
  background: rgba(255, 255, 255, 0.05);
}

.feedback-toast-wrap {
  position: fixed;
  top: calc(5.15rem + env(safe-area-inset-top));
  right: 1rem;
  z-index: 260;
  pointer-events: none;
}

.feedback-toast {
  min-width: min(420px, calc(100vw - 2rem));
  max-width: min(420px, calc(100vw - 2rem));
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(21, 39, 58, 0.1);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 48px rgba(16, 28, 41, 0.16);
  backdrop-filter: blur(18px);
}

.knowledge-page.dark .feedback-toast {
  background: rgba(15, 23, 35, 0.88);
}

.feedback-toast.success {
  border-color: rgba(31, 143, 119, 0.28);
}

.feedback-toast.error {
  border-color: rgba(225, 83, 83, 0.24);
}

.feedback-toast-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  flex: 0 0 auto;
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f9f83;
  background: rgba(15, 159, 131, 0.12);
}

.feedback-toast.error .feedback-toast-icon {
  color: #be2f1d;
  background: rgba(190, 47, 29, 0.12);
}

.feedback-toast-copy {
  min-width: 0;
}

.feedback-toast-copy strong {
  display: block;
  font-size: 0.9rem;
}

.feedback-toast-copy p {
  margin: 0.2rem 0 0;
  color: var(--text-sub);
  line-height: 1.55;
}

.toolbar-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.search-cluster {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  flex: 1 1 680px;
}

.search-field {
  display: grid;
  gap: 0.35rem;
  flex: 1 1 440px;
  min-width: 0;
}

.search-field-label {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-sub);
  padding-left: 0.2rem;
}

.search-input,
select,
input,
textarea {
  width: 100%;
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-main);
  font: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.knowledge-page.dark .search-input,
.knowledge-page.dark select,
.knowledge-page.dark input,
.knowledge-page.dark textarea {
  background: rgba(255, 255, 255, 0.04);
}

select:focus,
input:focus,
textarea:focus {
  outline: none;
  border-color: rgba(15, 159, 131, 0.45);
  box-shadow: 0 0 0 4px rgba(15, 159, 131, 0.1);
}

.search-input {
  min-height: 48px;
  border-radius: 16px;
  padding: 0.8rem 0.95rem;
  font-size: 0.95rem;
}

.toolbar-btn {
  min-height: 48px;
  border-radius: 15px;
  padding: 0.75rem 0.95rem;
  font-size: 0.92rem;
}

.add-note-btn {
  white-space: nowrap;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 1rem;
}

.filter-grid label,
.editor-grid label {
  display: grid;
  gap: 0.45rem;
}

.filter-grid span,
.editor-grid span,
.label-text {
  font-size: 0.84rem;
  color: var(--text-sub);
}

.toolbar-tip {
  margin: 1rem 0 0;
  font-size: 0.9rem;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 1.15rem;
  margin-top: 1rem;
  align-items: start;
}

.content-grid.single {
  grid-template-columns: minmax(0, 1fr);
}

.content-grid.single .detail-panel {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.content-grid.single .detail-canvas {
  max-width: 980px;
}

.list-panel,
.detail-panel {
  border-radius: 30px;
  padding: 1.15rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.panel-head h2 {
  margin: 0;
  font-size: 1.12rem;
}

.panel-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.84rem;
  color: var(--text-sub);
}

.panel-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: var(--chip-bg);
}

.list-item {
  width: 100%;
  margin-top: 0.75rem;
  border: 1px solid var(--panel-border);
  border-radius: 24px;
  padding: 1rem 1rem 1.05rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 248, 252, 0.68));
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
}

.knowledge-page.dark .list-item {
  background: rgba(255, 255, 255, 0.03);
}

.list-item:hover,
.list-item.active {
  transform: translateY(-2px);
  border-color: rgba(15, 159, 131, 0.28);
  background: linear-gradient(180deg, rgba(225, 248, 243, 0.9), rgba(245, 252, 250, 0.86));
  box-shadow: var(--shadow-soft);
}

.knowledge-page.dark .list-item:hover,
.knowledge-page.dark .list-item.active {
  background: rgba(15, 159, 131, 0.1);
}

.list-top,
.detail-head,
.detail-actions,
.meta-strip,
.tag-row,
.editor-actions,
.share-box {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.list-top {
  align-items: center;
  justify-content: space-between;
}

.list-top strong {
  font-size: 1rem;
}

.list-item p {
  margin: 0.6rem 0 0.7rem;
  line-height: 1.6;
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  font-size: 0.82rem;
  color: var(--text-sub);
}

.mini-badge,
.pill,
.tag-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.38rem 0.78rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.mini-badge,
.pill {
  background: var(--chip-bg);
  color: var(--text-main);
}

.mini-badge.draft {
  background: rgba(245, 158, 11, 0.18);
}

.mini-badge.published {
  background: rgba(15, 159, 131, 0.16);
}

.detail-panel {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(248, 252, 255, 0.84));
}

.knowledge-page.dark .detail-panel {
  background: linear-gradient(180deg, rgba(12, 20, 32, 0.9), rgba(14, 22, 34, 0.9));
}

.detail-canvas {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0.2rem 0.2rem 1.2rem;
}

.detail-hero-card,
.markdown-card,
.extra-box,
.share-box {
  border: 1px solid var(--panel-border);
  background: var(--panel-muted);
  border-radius: 28px;
  box-shadow: var(--shadow-soft);
}

.share-reading-head {
  max-width: 100%;
  margin: 0 auto 0.55rem;
  display: grid;
  gap: 0.75rem;
  padding: 0 0.05rem;
}

.share-reading-topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.share-reading-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.46rem 0.72rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(21, 39, 58, 0.08);
  color: var(--text-sub);
  font-size: 0.82rem;
  font-weight: 600;
}

.share-reading-pill.strong {
  color: var(--accent);
  background: rgba(15, 159, 131, 0.1);
  border-color: rgba(15, 159, 131, 0.14);
}

.knowledge-page.dark .share-reading-pill {
  background: rgba(255, 255, 255, 0.06);
}

.share-reading-tags {
  margin-top: 0;
}

.detail-hero-card {
  position: relative;
  isolation: isolate;
  padding: 1.45rem 1.6rem 1.35rem;
  overflow: hidden;
}

.detail-hero-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 64px;
  background: linear-gradient(180deg, rgba(15, 159, 131, 0.08), rgba(15, 159, 131, 0));
  pointer-events: none;
}

.detail-hero-card.has-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.95) 42%, rgba(255, 255, 255, 0.88) 68%, rgba(255, 255, 255, 0.72) 100%),
    var(--detail-cover-image);
  background-position: center, right -22px bottom -18px;
  background-repeat: no-repeat;
  background-size: auto, clamp(240px, 38%, 430px) auto;
  opacity: 1;
}

.knowledge-page.dark .detail-hero-card.has-cover::after {
  background-image:
    linear-gradient(90deg, rgba(9, 18, 30, 0.96) 0%, rgba(9, 18, 30, 0.93) 42%, rgba(9, 18, 30, 0.82) 68%, rgba(9, 18, 30, 0.62) 100%),
    var(--detail-cover-image);
}

.detail-hero-card.type-prompt::before {
  background: linear-gradient(180deg, rgba(47, 136, 255, 0.1), rgba(47, 136, 255, 0));
}

.detail-hero-card.type-workflow::before {
  background: linear-gradient(180deg, rgba(15, 159, 131, 0.1), rgba(15, 159, 131, 0));
}

.detail-hero-card.type-case::before {
  background: linear-gradient(180deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0));
}

.detail-hero-card.type-note::before {
  background: linear-gradient(180deg, rgba(116, 95, 255, 0.09), rgba(116, 95, 255, 0));
}

.detail-hero-topline {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.detail-page-identity {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.detail-page-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  margin-top: 0.1rem;
  border-radius: 9px;
  border: 1px solid rgba(21, 39, 58, 0.06);
  background: rgba(255, 255, 255, 0.42);
  color: var(--text-sub);
  box-shadow: none;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  opacity: 0.78;
}

.detail-hero-card.type-prompt .detail-page-icon {
  color: #2f88ff;
}

.detail-hero-card.type-workflow .detail-page-icon {
  color: #0f9f83;
}

.detail-hero-card.type-case .detail-page-icon {
  color: #f97316;
}

.detail-hero-card.type-note .detail-page-icon {
  color: #745fff;
}

.knowledge-page.dark .detail-page-icon {
  background: rgba(255, 255, 255, 0.02);
}

.detail-page-copy {
  display: grid;
  gap: 0.12rem;
}

.detail-meta-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.detail-meta-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(21, 39, 58, 0.18);
}

.knowledge-page.dark .detail-meta-dot {
  background: rgba(255, 255, 255, 0.18);
}

.detail-kicker {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: var(--text-sub);
}

.detail-title-stack {
  position: relative;
  z-index: 1;
  margin-top: 0.75rem;
  max-width: min(60rem, 68%);
}

.detail-summary {
  max-width: 60rem;
  margin: 0.7rem 0 0;
  line-height: 1.8;
  font-size: 1rem;
  color: var(--text-sub);
}

.detail-properties-grid {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.detail-properties-grid article {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  border: 1px solid rgba(21, 39, 58, 0.07);
  border-radius: 999px;
  padding: 0.46rem 0.72rem;
  background: rgba(255, 255, 255, 0.52);
  box-shadow: none;
}

.knowledge-page.dark .detail-properties-grid article {
  background: rgba(255, 255, 255, 0.04);
}

.detail-properties-grid span {
  display: inline-block;
  margin-bottom: 0;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-sub);
  white-space: nowrap;
}

.detail-properties-grid strong {
  display: inline-block;
  line-height: 1.2;
  font-size: 0.89rem;
  font-weight: 700;
  white-space: nowrap;
}

.detail-actions .ghost-btn,
.detail-actions .danger-btn {
  border-radius: 15px;
  padding: 0.66rem 0.9rem;
  font-size: 0.92rem;
}

.tag-row {
  margin-top: 1rem;
}

.detail-tag-row {
  position: relative;
  z-index: 1;
  margin-top: 1.15rem;
}

.tag-chip {
  background: rgba(47, 136, 255, 0.12);
  padding-inline: 0.9rem;
}

.markdown-body {
  max-width: 840px;
  margin: 0 auto;
  line-height: 1.92;
  font-size: 1.04rem;
  letter-spacing: 0.01em;
}

.markdown-card {
  margin-top: 1rem;
  padding: clamp(1.7rem, 2.4vw, 2.8rem);
  background:
    radial-gradient(circle at top right, rgba(15, 159, 131, 0.05), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(249, 251, 255, 0.92));
}

.knowledge-page.dark .markdown-card {
  background:
    radial-gradient(circle at top right, rgba(92, 213, 190, 0.06), transparent 22%),
    linear-gradient(180deg, rgba(16, 24, 37, 0.96), rgba(14, 21, 34, 0.94));
}

.share-reading-card {
  margin-top: 0.35rem;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 0.72rem;
  color: var(--accent-strong);
  line-height: 1.28;
  letter-spacing: -0.02em;
}

.markdown-body :deep(h1) {
  font-size: clamp(1.95rem, 3vw, 2.5rem);
}

.markdown-body :deep(h2) {
  font-size: clamp(1.5rem, 2.1vw, 1.95rem);
}

.markdown-body :deep(h3) {
  font-size: clamp(1.16rem, 1.55vw, 1.4rem);
}

.markdown-body :deep(h1:first-child),
.markdown-body :deep(h2:first-child),
.markdown-body :deep(h3:first-child) {
  margin-top: 0;
}

.markdown-body :deep(p) {
  margin: 0.95rem 0 0;
  color: var(--text-main);
}

.markdown-body :deep(h1 + p),
.markdown-body :deep(h2 + p),
.markdown-body :deep(h3 + p) {
  color: var(--text-sub);
  font-size: 1rem;
}

.markdown-body :deep(hr) {
  margin: 1.9rem 0 1.6rem;
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(15, 159, 131, 0.26), rgba(21, 39, 58, 0.08), transparent 88%);
}

.markdown-body :deep(pre) {
  overflow: auto;
  border-radius: 18px;
  margin: 1.15rem 0;
  padding: 1rem 1.05rem;
  background: rgba(14, 26, 39, 0.92);
  color: #f5f8ff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.markdown-body :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.92em;
}

.markdown-body :deep(:not(pre) > code) {
  padding: 0.15rem 0.42rem;
  border-radius: 8px;
  background: rgba(21, 39, 58, 0.08);
}

.knowledge-page.dark .markdown-body :deep(:not(pre) > code) {
  background: rgba(255, 255, 255, 0.08);
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  max-width: 100%;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.95rem 0 0;
  padding-left: 1.35rem;
}

.markdown-body :deep(li) {
  margin: 0.38rem 0;
  color: var(--text-main);
}

.markdown-body :deep(blockquote) {
  margin: 1.25rem 0;
  padding: 0.95rem 1.1rem;
  border-left: 4px solid rgba(31, 143, 119, 0.36);
  border-radius: 0 18px 18px 0;
  background: rgba(15, 159, 131, 0.06);
  color: var(--text-sub);
}

.knowledge-page.dark .markdown-body :deep(blockquote) {
  background: rgba(92, 213, 190, 0.06);
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid rgba(15, 159, 131, 0.26);
}

.markdown-body :deep(figure.article-figure) {
  width: min(calc(100% + 4rem), 940px);
  margin: 1.7rem 50% 1.9rem;
  transform: translateX(-50%);
}

.markdown-body :deep(.article-figure-frame) {
  position: relative;
  overflow: hidden;
  padding: clamp(0.55rem, 1.4vw, 0.9rem);
  border-radius: 28px;
  border: 1px solid rgba(21, 39, 58, 0.08);
  background:
    radial-gradient(circle at top right, rgba(15, 159, 131, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 255, 0.96));
  box-shadow:
    0 18px 36px rgba(18, 27, 44, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.66);
}

.knowledge-page.dark .markdown-body :deep(.article-figure-frame) {
  border-color: rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(92, 213, 190, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(18, 28, 42, 0.96), rgba(12, 22, 36, 0.96));
  box-shadow:
    0 18px 36px rgba(2, 6, 15, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.markdown-body :deep(figure.article-figure img) {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  margin: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
}

.markdown-body :deep(.article-figure-frame > a) {
  display: block;
  border-bottom: 0;
}

.knowledge-page.dark .markdown-body :deep(figure.article-figure img) {
  background: rgba(255, 255, 255, 0.04);
}

.markdown-body :deep(figcaption.article-figcaption) {
  margin-top: 0.8rem;
  padding-inline: 0.18rem;
  text-align: center;
  font-size: 0.83rem;
  line-height: 1.55;
  color: var(--text-sub);
}

.markdown-body :deep(p > img:only-child) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1.35rem auto;
  border-radius: 20px;
}

.markdown-body :deep(table) {
  width: 100%;
  margin: 1.2rem 0;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(21, 39, 58, 0.08);
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 0.72rem 0.85rem;
  border-bottom: 1px solid rgba(21, 39, 58, 0.08);
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(15, 159, 131, 0.08);
  font-weight: 700;
}

.extra-box,
.share-box {
  max-width: 1140px;
  margin: 1rem auto 0;
  padding: 1.1rem 1.2rem;
}

.extra-box h3 {
  margin: 0 0 0.7rem;
}

.extra-box pre,
.share-box code {
  display: block;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.share-box {
  align-items: center;
  justify-content: space-between;
}

.empty-box {
  display: grid;
  place-items: center;
  min-height: 180px;
  border: 1px dashed var(--panel-border);
  border-radius: 22px;
  text-align: center;
}

.editor-page-shell {
  margin-top: 1rem;
}

.editor-page-header {
  position: sticky;
  top: calc(0.9rem + env(safe-area-inset-top));
  z-index: 12;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--panel-border);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.knowledge-page.dark .editor-page-header {
  background: rgba(13, 20, 32, 0.9);
}

.editor-page-heading h1 {
  margin: 0.2rem 0 0;
  font-size: clamp(2rem, 3.3vw, 3rem);
  line-height: 1;
  letter-spacing: -0.045em;
}

.editor-page-subtitle {
  max-width: 52rem;
  margin: 0.6rem 0 0;
  color: var(--text-sub);
  line-height: 1.7;
}

.editor-back-btn {
  margin-bottom: 0.9rem;
}

.editor-page-actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.editor-tooltip-anchor {
  position: relative;
  display: inline-flex;
}

.editor-tooltip-anchor > button {
  width: 100%;
}

.editor-tooltip {
  position: absolute;
  left: 50%;
  top: calc(100% + 0.65rem);
  z-index: 30;
  width: max-content;
  max-width: min(320px, calc(100vw - 2rem));
  padding: 0.62rem 0.82rem;
  border-radius: 14px;
  background: rgba(18, 27, 44, 0.96);
  color: rgba(244, 248, 255, 0.96);
  box-shadow: 0 16px 32px rgba(18, 27, 44, 0.2);
  font-size: 0.82rem;
  line-height: 1.45;
  white-space: normal;
  transform: translateX(-50%);
  pointer-events: none;
}

.editor-tooltip::after {
  content: '';
  position: absolute;
  bottom: calc(100% - 1px);
  left: 50%;
  width: 10px;
  height: 10px;
  background: rgba(18, 27, 44, 0.96);
  transform: translateX(-50%) rotate(45deg);
}

.knowledge-page.dark .editor-tooltip {
  background: rgba(239, 244, 255, 0.96);
  color: rgba(18, 27, 44, 0.94);
  box-shadow: 0 16px 32px rgba(3, 8, 20, 0.34);
}

.knowledge-page.dark .editor-tooltip::after {
  background: rgba(239, 244, 255, 0.96);
}

.editor-import-input {
  display: none;
}

.editor-page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.78fr);
  gap: 1rem;
  margin-top: 1rem;
  align-items: start;
}

.editor-main-card,
.editor-side-card {
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  border-radius: 28px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.editor-main-card {
  padding: 1.3rem;
  display: grid;
  gap: 1rem;
}

.editor-import-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.05rem;
  border: 1px solid rgba(15, 159, 131, 0.12);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(47, 136, 255, 0.1), transparent 28%),
    linear-gradient(135deg, rgba(248, 253, 251, 0.98), rgba(238, 247, 255, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.knowledge-page.dark .editor-import-panel {
  background:
    radial-gradient(circle at top right, rgba(47, 136, 255, 0.14), transparent 28%),
    linear-gradient(135deg, rgba(18, 29, 44, 0.92), rgba(12, 22, 36, 0.96));
  border-color: rgba(92, 213, 190, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.editor-import-copy {
  display: grid;
  gap: 0.55rem;
}

.editor-import-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}

.editor-import-copy h2 {
  margin: 0;
  font-size: clamp(1.05rem, 1.5vw, 1.3rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: var(--accent-strong);
}

.editor-import-text {
  margin: 0;
  max-width: 52rem;
  font-size: 0.92rem;
  line-height: 1.68;
  color: var(--text-sub);
}

.editor-import-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.editor-import-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.36rem 0.72rem;
  border-radius: 999px;
  border: 1px solid rgba(21, 39, 58, 0.08);
  background: rgba(255, 255, 255, 0.68);
  font-size: 0.77rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--accent-strong);
}

.knowledge-page.dark .editor-import-chip {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

.editor-import-actions {
  display: grid;
  justify-items: end;
  gap: 0.5rem;
}

.editor-import-btn {
  min-width: 132px;
}

.editor-import-meta {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-sub);
}

.editor-side-card {
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.editor-side-section {
  border: 1px solid rgba(21, 39, 58, 0.08);
  border-radius: 22px;
  padding: 0.95rem;
  background: rgba(255, 255, 255, 0.46);
}

.knowledge-page.dark .editor-side-section {
  background: rgba(255, 255, 255, 0.04);
}

.editor-side-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
}

.editor-side-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
}

.editor-side-note {
  font-size: 0.78rem;
  color: var(--text-sub);
}

.editor-field {
  display: grid;
  gap: 0.45rem;
}

.editor-field + .editor-field {
  margin-top: 0.8rem;
}

.editor-field > span {
  font-size: 0.84rem;
  color: var(--text-sub);
}

.editor-help-text {
  margin: 0.65rem 0 0;
  color: var(--text-sub);
  font-size: 0.84rem;
  line-height: 1.65;
}

.editor-cover-preview {
  margin-top: 0.9rem;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(21, 39, 58, 0.08);
  background: rgba(255, 255, 255, 0.48);
}

.editor-cover-preview img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.editor-tag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.editor-tag-chip {
  width: 100%;
  display: grid;
  gap: 0.2rem;
  justify-items: start;
  padding: 0.78rem 0.85rem;
  border: 1px solid rgba(21, 39, 58, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
  color: var(--text-main);
  text-align: left;
}

.knowledge-page.dark .editor-tag-chip {
  background: rgba(255, 255, 255, 0.04);
}

.editor-tag-chip small {
  font-size: 0.76rem;
  color: var(--text-sub);
}

.editor-tag-chip.selected {
  border-color: rgba(15, 159, 131, 0.32);
  background: linear-gradient(180deg, rgba(221, 247, 241, 0.92), rgba(240, 252, 247, 0.84));
  box-shadow: var(--shadow-soft);
}

.knowledge-page.dark .editor-tag-chip.selected {
  background: rgba(15, 159, 131, 0.14);
}

.editor-tips-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(244, 249, 255, 0.66));
}

.knowledge-page.dark .editor-tips-card {
  background: rgba(255, 255, 255, 0.05);
}

.editor-tips-list {
  margin: 0.65rem 0 0;
  padding-left: 1rem;
  color: var(--text-sub);
  line-height: 1.7;
}

.editor-loading-box {
  margin-top: 1rem;
}

.primary-btn,
.ghost-btn,
.dark-btn,
.danger-btn {
  border: 1px solid transparent;
  border-radius: 18px;
  padding: 0.82rem 1.05rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.primary-btn:hover,
.ghost-btn:hover,
.dark-btn:hover,
.danger-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.primary-btn,
.dark-btn {
  background: linear-gradient(135deg, #13253f 0%, #0f3857 100%);
  color: #fff;
}

.ghost-btn {
  border-color: rgba(21, 39, 58, 0.12);
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-main);
}

.knowledge-page.dark .ghost-btn {
  background: rgba(255, 255, 255, 0.04);
}

.danger-btn {
  background: linear-gradient(135deg, #be2f1d 0%, #a51f22 100%);
  color: #fff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

@media (max-width: 1100px) {
  .hero-card,
  .content-grid,
  .editor-page-layout {
    grid-template-columns: 1fr;
  }

  .editor-import-panel {
    grid-template-columns: 1fr;
  }

  .editor-import-actions {
    justify-items: start;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-inline-dashboard {
    gap: 0.85rem;
  }

  .detail-canvas {
    max-width: 100%;
  }

  .markdown-body :deep(figure.article-figure) {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    transform: none;
  }

  .editor-tag-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .knowledge-page {
    padding: 1rem 0.85rem 1.5rem;
  }

  .filter-grid,
  .editor-tag-grid {
    grid-template-columns: 1fr;
  }

  .hero-inline-dashboard {
    display: grid;
    gap: 0.65rem;
    overflow: visible;
  }

  .hero-inline-group {
    flex-wrap: wrap;
  }

  .hero-inline-items {
    flex-wrap: wrap;
  }

  .detail-head,
  .detail-hero-topline,
  .detail-page-identity,
  .panel-head,
  .share-banner,
  .editor-page-header,
  .share-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-hero-card.has-cover::after {
    background-position: center, right -32px bottom -18px;
    background-size: auto, min(58%, 280px) auto;
  }

  .detail-title-stack {
    max-width: 100%;
  }

  .detail-actions,
  .editor-page-actions {
    width: 100%;
  }

  .editor-import-actions,
  .editor-import-copy {
    width: 100%;
  }

  .editor-import-btn {
    width: 100%;
  }

  .detail-actions > button,
  .editor-page-actions > .editor-tooltip-anchor,
  .editor-page-actions > button,
  .search-cluster > button,
  .toolbar-topline > button {
    flex: 1 1 calc(50% - 0.5rem);
  }

  .hero-card,
  .toolbar-card,
  .list-panel,
  .detail-panel,
  .editor-main-card,
  .editor-side-card {
    padding: 1rem;
  }

  .feedback-toast-wrap {
    top: calc(4.9rem + env(safe-area-inset-top));
    left: 0.85rem;
    right: 0.85rem;
  }

  .feedback-toast {
    min-width: 0;
    max-width: 100%;
  }

  .editor-side-section {
    padding: 0.85rem;
  }
}
</style>
