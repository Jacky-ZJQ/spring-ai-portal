<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'

interface FeatureConfig {
  title: string
  subtitle: string
  eta: string
  tips: string[]
}

interface SkillCategory {
  id: string
  label: string
  emoji: string
}

interface SkillItem {
  id: string
  name: string
  title: string
  summary: string
  description: string
  categories: string[]
  trendDelta: string
  weeklyInstalls: number
  updatedAt: string
  installCommand: string
  repoUrl: string
  scenarios: string[]
}

interface FaqItem {
  id: number
  title: string
  answer: string
}

const route = useRoute()

const currentKey = computed(() => String(route.params.module || '').toLowerCase())
const isSkillsPage = computed(() => currentKey.value === 'skills')

const featureMap: Record<string, FeatureConfig> = {
  'mcp-gateway': {
    title: 'MCP网关',
    subtitle: '统一接入 HTTP/RPC 能力，自动转成 MCP 协议工具。',
    eta: '当前状态：建设中',
    tips: [
      '支持把已有业务 API 快速映射为 MCP Tools',
      '支持统一鉴权、参数校验和调用日志',
      '支持工具注册与在线调试',
    ],
  },
  mcp: {
    title: 'MCP网关',
    subtitle: '统一接入 HTTP/RPC 能力，自动转成 MCP 协议工具。',
    eta: '当前状态：建设中',
    tips: [
      '支持把已有业务 API 快速映射为 MCP Tools',
      '支持统一鉴权、参数校验和调用日志',
      '支持工具注册与在线调试',
    ],
  },
  skills: {
    title: 'Skills 趋势榜',
    subtitle: '实时聚合全球 Agent Skills 热门趋势，支持分类发现、详情查看与快捷安装。',
    eta: '当前状态：建设中',
    tips: [
      '支持多分类榜单（开发、效率、数据、运营）与趋势排序',
      '点击单个 Skill 查看详情页、场景说明与更新记录',
      '提供快捷安装命令复制，降低技能接入门槛',
    ],
  },
  'comfort-simulator': {
    title: '舒适区突破器',
    subtitle: '把目标拆解成可执行的小步实验，并持续跟踪反馈。',
    eta: '当前状态：建设中',
    tips: [
      '支持目标拆解、行动卡片和周期复盘',
      '支持行为打卡与进度可视化',
      '支持关键阻塞点识别与提醒策略',
    ],
  },
}

const feature = computed<FeatureConfig>(() => {
  return (
    featureMap[currentKey.value] || {
      title: '功能页面',
      subtitle: '该模块正在建设中，敬请期待。',
      eta: '当前状态：建设中',
      tips: ['功能定义中', '交互设计中', '开发排期中'],
    }
  )
})

const featureIcon = computed(() => {
  if (currentKey.value.includes('mcp')) return CubeTransparentIcon
  if (currentKey.value.includes('comfort')) return SparklesIcon
  if (currentKey.value.includes('skills')) return WrenchScrewdriverIcon
  return WrenchScrewdriverIcon
})

const skillCategories: SkillCategory[] = [
  { id: 'all', label: '全部', emoji: '🌐' },
  { id: 'claude', label: 'Claude官方', emoji: '✨' },
  { id: 'efficiency', label: '效率工具', emoji: '⚡' },
  { id: 'dev', label: '软件开发', emoji: '💻' },
  { id: 'data', label: '数据与分析', emoji: '📊' },
  { id: 'ops', label: '开发运维', emoji: '🚀' },
  { id: 'docs', label: '文档处理', emoji: '📄' },
  { id: 'content', label: '内容与媒体', emoji: '🎨' },
  { id: 'security', label: '测试与安全', emoji: '🔒' },
]

const skillCategoryNameMap: Record<string, string> = Object.fromEntries(
  skillCategories.map((category) => [category.id, category.label])
)

const skillsTrendList: SkillItem[] = [
  {
    id: 'frontend-design',
    name: 'frontend-design',
    title: 'Frontend Design Studio',
    summary: '打造高辨识度的生产级前端界面，强化组件、动效与视觉叙事一致性。',
    description:
      '面向官网、落地页、Dashboard 等场景，提供布局策略、视觉语言约束与高质感实现建议，避免同质化页面风格。',
    categories: ['efficiency', 'dev', 'content', 'claude'],
    trendDelta: '+38%',
    weeklyInstalls: 3240,
    updatedAt: '2026-02-28',
    installCommand: 'npx add-skill anthropics/frontend-design',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/frontend-design',
    scenarios: ['官网改版与首屏转化提升', '多模块视觉统一', '组件级 UI 细节提升'],
  },
  {
    id: 'pdf',
    name: 'pdf',
    title: 'PDF Workflow',
    summary: '聚焦 PDF 解析、抽取、拆分与生成，快速搭建文档自动化流程。',
    description:
      '适合合同、报告、票据等结构化和半结构化文档处理，支持文本/表格提取、分页拆分和结果回写。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+26%',
    weeklyInstalls: 2890,
    updatedAt: '2026-02-26',
    installCommand: 'npx add-skill anthropics/pdf',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/pdf',
    scenarios: ['批量 PDF 问答', '合同条款提取', '知识库前置清洗'],
  },
  {
    id: 'docx',
    name: 'docx',
    title: 'DOCX Composer',
    summary: '处理 Word 文档结构、段落与样式，面向报告和制度文档自动化编排。',
    description:
      '覆盖模板填充、样式统一、章节拆分和内容重组，适合复用已有 Word 资产并形成稳定输出格式。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+23%',
    weeklyInstalls: 2140,
    updatedAt: '2026-02-25',
    installCommand: 'npx add-skill anthropics/docx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/docx',
    scenarios: ['制度文档批量更新', '投标书自动生成', '多模板文档合并输出'],
  },
  {
    id: 'skill-creator',
    name: 'skill-creator',
    title: 'Skill Creator Pro',
    summary: '把提示词、工具链与场景流程沉淀为可复用的标准技能模板。',
    description:
      '帮助团队定义技能输入输出、边界条件、验证步骤和发布规范，降低多人协作下的能力漂移风险。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+21%',
    weeklyInstalls: 1960,
    updatedAt: '2026-02-24',
    installCommand: 'npx add-skill anthropics/skill-creator',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/skill-creator',
    scenarios: ['团队技能模板建设', '标准化交付资产沉淀', '技能版本治理'],
  },
  {
    id: 'pptx',
    name: 'pptx',
    title: 'PPTX Builder',
    summary: '自动化生成和编辑演示文稿，支持模板复用与内容按页编排。',
    description:
      '可把结构化文本转成演示页面，覆盖封面、目录、图文页与结论页，适合周报和方案汇报场景。',
    categories: ['docs', 'content'],
    trendDelta: '+18%',
    weeklyInstalls: 1570,
    updatedAt: '2026-02-22',
    installCommand: 'npx add-skill anthropics/pptx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/pptx',
    scenarios: ['周报自动出稿', '方案提案快速成稿', '培训课件批量生成'],
  },
  {
    id: 'xlsx',
    name: 'xlsx',
    title: 'XLSX Analyst',
    summary: '面向表格读写与公式处理，快速落地数据清洗与报表自动化。',
    description:
      '支持多表合并、字段映射、统计计算和样式设置，适合经营分析、数据运营和对账场景。',
    categories: ['efficiency', 'docs', 'data'],
    trendDelta: '+15%',
    weeklyInstalls: 1490,
    updatedAt: '2026-02-21',
    installCommand: 'npx add-skill anthropics/xlsx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/xlsx',
    scenarios: ['运营报表自动化', '多源数据合并', '财务对账辅助'],
  },
  {
    id: 'java-dev',
    name: 'java-dev',
    title: 'Java Dev Kit',
    summary: '覆盖 Java 项目开发流程，从工程结构到代码规范给出一致实践。',
    description:
      '提供分层设计、异常处理、接口建模与单元测试建议，适用于 Spring/Spring Boot 项目快速落地。',
    categories: ['dev'],
    trendDelta: '+14%',
    weeklyInstalls: 1320,
    updatedAt: '2026-02-20',
    installCommand: 'npx add-skill community/java-dev',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/java-dev',
    scenarios: ['新项目脚手架落地', '历史项目重构', '接口质量治理'],
  },
  {
    id: 'brand-guidelines',
    name: 'brand-guidelines',
    title: 'Brand Guidelines',
    summary: '将品牌规范自动应用到文案和视觉输出，减少多渠道内容偏差。',
    description:
      '适配品牌语言、术语与风格约束，帮助内容团队在多平台输出时保持一致调性与识别度。',
    categories: ['data', 'dev', 'content'],
    trendDelta: '+12%',
    weeklyInstalls: 1180,
    updatedAt: '2026-02-20',
    installCommand: 'npx add-skill community/brand-guidelines',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/brand-guidelines',
    scenarios: ['品牌文案统一', '多渠道营销素材治理', '视觉与语言规范校验'],
  },
  {
    id: 'skill-lookup',
    name: 'skill-lookup',
    title: 'Skill Lookup',
    summary: '支持在技能生态中按关键词与分类检索，快速定位可复用能力。',
    description:
      '提供技能发现、评分参考和安装建议，帮助研发与运营团队降低“从零搭建”的时间成本。',
    categories: ['efficiency', 'data'],
    trendDelta: '+11%',
    weeklyInstalls: 1040,
    updatedAt: '2026-02-18',
    installCommand: 'npx add-skill community/skill-lookup',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/skill-lookup',
    scenarios: ['技能选型评估', '团队能力补齐', '场景化方案拼装'],
  },
  {
    id: 'mcp-builder',
    name: 'mcp-builder',
    title: 'MCP Builder',
    summary: '通过统一规范把现有服务封装为 MCP 工具，降低多系统接入复杂度。',
    description:
      '支持工具定义、参数校验与注册发布，适合把 HTTP/RPC 业务能力快速接入 Agent 工作流。',
    categories: ['data', 'claude', 'ops'],
    trendDelta: '+10%',
    weeklyInstalls: 980,
    updatedAt: '2026-02-17',
    installCommand: 'npx add-skill community/mcp-builder',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/mcp-builder',
    scenarios: ['遗留系统能力接入', '工具统一发布', 'MCP 工作流编排'],
  },
  {
    id: 'doc-coauthoring',
    name: 'doc-coauthoring',
    title: 'Doc Coauthoring',
    summary: '支持多人协作文档的结构化写作与版本协同，提高复杂文档交付速度。',
    description:
      '适用于 PRD、技术方案、项目复盘等文档，提供章节骨架、差异提示和改写建议。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+9%',
    weeklyInstalls: 860,
    updatedAt: '2026-02-16',
    installCommand: 'npx add-skill community/doc-coauthoring',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/doc-coauthoring',
    scenarios: ['PRD 协作撰写', '技术方案联编', '复盘文档沉淀'],
  },
  {
    id: 'web-design-guidelines',
    name: 'web-design-guidelines',
    title: 'Web Design Guidelines',
    summary: '提供网页规范与可用性建议，减少界面一致性和可访问性问题。',
    description:
      '覆盖信息层级、组件规范、交互反馈和可访问性检查，帮助前端在开发阶段前置质量门槛。',
    categories: ['security', 'efficiency'],
    trendDelta: '+8%',
    weeklyInstalls: 740,
    updatedAt: '2026-02-15',
    installCommand: 'npx add-skill community/web-design-guidelines',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/web-design-guidelines',
    scenarios: ['UI 评审前置', '可访问性检查', '设计规范落地'],
  },
]

const faqList: FaqItem[] = [
  {
    id: 1,
    title: '什么是 Agent Skills？',
    answer:
      'Agent Skills 是可复用的能力包，通过 SKILL.md 描述规则与步骤，并可附带脚本、模板和参考资料，帮助模型在特定任务上稳定发挥。',
  },
  {
    id: 2,
    title: '如何安装 Skills？',
    answer:
      '常见方式是通过技能市场或仓库下载后放到本地 skills 目录。也可在页面里复制安装命令，直接在终端执行完成安装。',
  },
  {
    id: 3,
    title: 'Skills 如何工作？',
    answer:
      '系统先读取每个 Skill 的名称和描述，当用户任务匹配时再按需加载完整说明与资源，实现低开销的动态启用。',
  },
  {
    id: 4,
    title: '可以同时使用多个 Skills 吗？',
    answer:
      '可以。一个任务通常会组合多个 Skill 协同执行，比如文档处理 + 数据分析 + 开发工具，按上下文自动调度。',
  },
  {
    id: 5,
    title: '如何获取最新 Skills？',
    answer:
      '可通过趋势榜查看最近活跃与安装变化，也可以订阅官方仓库更新。我们建议按分类筛选后再看近 7 天趋势。',
  },
  {
    id: 6,
    title: '可以创建自己的 Skills 吗？',
    answer:
      '可以。你可以基于规范创建自定义 Skill，将团队流程、领域知识和工具脚本沉淀为可复用能力，并持续版本化维护。',
  },
]

const keywordInput = ref('')
const keyword = ref('')
const activeCategory = ref('all')
const selectedSkillId = ref(skillsTrendList[0]?.id || '')
const copiedSkillId = ref('')
const copyError = ref('')
const faqSectionRef = ref<HTMLElement | null>(null)
const shouldCollapseDetail = ref(false)

let faqObserver: IntersectionObserver | null = null

const refreshTimeLabel = computed(() => {
  const now = new Date()
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
})

const formatCategory = (categoryId: string) => {
  return skillCategoryNameMap[categoryId] || categoryId
}

const formatInstalls = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

const applySearch = () => {
  keyword.value = keywordInput.value.trim()
}

const resetFilters = () => {
  keywordInput.value = ''
  keyword.value = ''
  activeCategory.value = 'all'
}

const filteredSkills = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return skillsTrendList.filter((skill) => {
    const matchesCategory =
      activeCategory.value === 'all' || skill.categories.includes(activeCategory.value)

    if (!matchesCategory) {
      return false
    }

    if (!normalizedKeyword) {
      return true
    }

    const searchableText = [
      skill.title,
      skill.name,
      skill.summary,
      skill.description,
      ...skill.categories.map((categoryId) => formatCategory(categoryId)),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedKeyword)
  })
})

watch(
  filteredSkills,
  (list) => {
    if (!list.length) {
      selectedSkillId.value = ''
      return
    }
    if (!list.some((skill) => skill.id === selectedSkillId.value)) {
      selectedSkillId.value = list[0].id
    }
  },
  { immediate: true }
)

const selectedSkill = computed(() => {
  if (!filteredSkills.value.length) return null
  const selectedFromFiltered = filteredSkills.value.find((skill) => skill.id === selectedSkillId.value)
  if (selectedFromFiltered) return selectedFromFiltered
  return filteredSkills.value[0]
})

const recommendedSkills = computed(() => {
  if (!selectedSkill.value) return []
  return skillsTrendList.filter((skill) => skill.id !== selectedSkill.value?.id).slice(0, 5)
})

const selectSkill = (skillId: string, opts?: { forceVisible?: boolean }) => {
  if (opts?.forceVisible && !filteredSkills.value.some((skill) => skill.id === skillId)) {
    resetFilters()
  }
  selectedSkillId.value = skillId
}

const fallbackCopyText = (text: string) => {
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

const copyInstallCommand = async (skill: SkillItem) => {
  copyError.value = ''
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(skill.installCommand)
    } else {
      const copied = fallbackCopyText(skill.installCommand)
      if (!copied) {
        throw new Error('fallback-copy-failed')
      }
    }
    copiedSkillId.value = skill.id
    window.setTimeout(() => {
      if (copiedSkillId.value === skill.id) {
        copiedSkillId.value = ''
      }
    }, 1800)
  } catch (_error) {
    copiedSkillId.value = ''
    copyError.value = '复制失败，请手动复制命令。'
    window.setTimeout(() => {
      copyError.value = ''
    }, 2500)
  }
}

const bindFaqObserver = () => {
  if (typeof window === 'undefined') return
  const isDesktopViewport = window.innerWidth > 1180
  if (!isDesktopViewport) {
    shouldCollapseDetail.value = false
    faqObserver?.disconnect()
    faqObserver = null
    return
  }

  if (!faqSectionRef.value || typeof IntersectionObserver === 'undefined') return

  faqObserver?.disconnect()
  faqObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      const triggerLine = window.innerHeight * 0.82
      const shouldCollapse = entry.isIntersecting || entry.boundingClientRect.top <= triggerLine
      shouldCollapseDetail.value = shouldCollapse
    },
    {
      root: null,
      threshold: [0, 0.08, 0.2],
      rootMargin: '0px 0px -8% 0px',
    }
  )
  faqObserver.observe(faqSectionRef.value)
}

onMounted(() => {
  bindFaqObserver()
  window.addEventListener('resize', bindFaqObserver)
})

onBeforeUnmount(() => {
  faqObserver?.disconnect()
  faqObserver = null
  window.removeEventListener('resize', bindFaqObserver)
})

watch(faqSectionRef, () => {
  bindFaqObserver()
})
</script>

<template>
  <main class="coming-soon-page" :class="{ 'skills-mode': isSkillsPage }">
    <section v-if="isSkillsPage" class="skills-panel">
      <header class="skills-hero">
        <div class="skills-hero-top">
          <span class="badge badge-beta">BETA</span>
          <p class="refresh">最近刷新：{{ refreshTimeLabel }}</p>
        </div>
        <h1>发现让 AI 更好用的 Skills</h1>
        <p class="skills-subtitle">记录全球 Agent Skills 趋势，按分类发现能力并一键复制安装命令。</p>

        <div class="search-wrap">
          <MagnifyingGlassIcon class="search-icon" />
          <input
            v-model="keywordInput"
            type="text"
            placeholder="搜索 Skills（例如：frontend、mcp、文档处理）"
            aria-label="搜索 Skills"
            @keydown.enter.prevent="applySearch"
          />
          <button type="button" class="search-btn" @click="applySearch">搜索</button>
          <button
            v-if="keyword || activeCategory !== 'all'"
            type="button"
            class="reset-btn"
            @click="resetFilters"
          >
            重置
          </button>
        </div>

        <div class="category-list">
          <button
            v-for="category in skillCategories"
            :key="category.id"
            type="button"
            class="category-pill"
            :class="{ active: activeCategory === category.id }"
            @click="activeCategory = category.id"
          >
            <span class="category-emoji" aria-hidden="true">{{ category.emoji }}</span>
            {{ category.label }}
          </button>
        </div>

        <p class="skills-summary">已收录 {{ skillsTrendList.length }} 个 Skills，当前匹配 {{ filteredSkills.length }} 个</p>
      </header>

      <div class="skills-content">
        <section class="skills-list">
          <article
            v-for="(skill, index) in filteredSkills"
            :key="skill.id"
            class="skill-card"
            :class="{ active: selectedSkill?.id === skill.id }"
            @click="selectSkill(skill.id)"
          >
            <div class="skill-card-head">
              <div class="skill-title-wrap">
                <h2>{{ skill.title }}</h2>
                <p class="skill-slug">{{ skill.name }}</p>
              </div>
              <span class="rank">#{{ String(index + 1).padStart(2, '0') }}</span>
            </div>

            <div class="skill-tags">
              <span v-for="tag in skill.categories.slice(0, 3)" :key="`${skill.id}-${tag}`">
                {{ formatCategory(tag) }}
              </span>
            </div>

            <p class="skill-summary">{{ skill.summary }}</p>

            <div class="skill-card-foot">
              <span class="trend">周趋势 {{ skill.trendDelta }}</span>
              <span>周安装 {{ formatInstalls(skill.weeklyInstalls) }}</span>
            </div>

            <button type="button" class="view-btn" @click.stop="selectSkill(skill.id)">查看详情</button>
            <button type="button" class="mini-copy-btn" @click.stop="copyInstallCommand(skill)">
              <ClipboardDocumentIcon class="mini-copy-icon" />
              {{ copiedSkillId === skill.id ? '安装命令已复制' : '复制安装命令' }}
            </button>
          </article>

          <div v-if="!filteredSkills.length" class="empty-state">
            <h3>暂无匹配结果</h3>
            <p>可以尝试切换分类，或输入更通用的关键词。</p>
          </div>
        </section>

        <aside v-if="selectedSkill" class="skill-detail" :class="{ collapsed: shouldCollapseDetail }">
          <div class="detail-head">
            <div class="detail-head-main">
              <h2>{{ selectedSkill.title }}</h2>
              <p class="detail-slug">{{ selectedSkill.name }}</p>
              <p class="detail-summary">{{ selectedSkill.summary }}</p>
            </div>
            <a :href="selectedSkill.repoUrl" target="_blank" rel="noopener noreferrer" class="repo-btn">
              <ArrowTopRightOnSquareIcon class="repo-icon" />
              访问 GitHub
            </a>
          </div>

          <p class="detail-desc">{{ selectedSkill.description }}</p>

          <div class="detail-meta">
            <span>最近更新：{{ selectedSkill.updatedAt }}</span>
            <span>周安装：{{ formatInstalls(selectedSkill.weeklyInstalls) }}</span>
            <span>趋势：{{ selectedSkill.trendDelta }}</span>
          </div>

          <div class="detail-tags">
            <span v-for="tag in selectedSkill.categories" :key="`detail-${selectedSkill.id}-${tag}`">
              {{ formatCategory(tag) }}
            </span>
          </div>

          <section class="install-box">
            <h3>快捷安装</h3>
            <p>复制到终端即可安装 Skill</p>
            <div class="command-row">
              <code>{{ selectedSkill.installCommand }}</code>
              <button type="button" class="copy-btn" @click="copyInstallCommand(selectedSkill)">
                <CheckCircleIcon v-if="copiedSkillId === selectedSkill.id" class="copy-icon" />
                <ClipboardDocumentIcon v-else class="copy-icon" />
                {{ copiedSkillId === selectedSkill.id ? '已复制' : '复制' }}
              </button>
            </div>
            <p v-if="copyError" class="copy-error">{{ copyError }}</p>
          </section>

          <section class="scenario-box">
            <h3>适用场景</h3>
            <ul>
              <li v-for="scene in selectedSkill.scenarios" :key="scene">{{ scene }}</li>
            </ul>
          </section>

          <section class="recommend-box">
            <h3>Skills 推荐</h3>
            <ul>
              <li v-for="skill in recommendedSkills" :key="`recommend-${skill.id}`">
                <button type="button" class="recommend-btn" @click="selectSkill(skill.id, { forceVisible: true })">
                  {{ skill.title }}
                </button>
                <p>{{ skill.summary }}</p>
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <section ref="faqSectionRef" class="faq-section">
        <div class="faq-head">
          <h2 class="faq-title">
            <QuestionMarkCircleIcon class="faq-title-icon" />
            常见问题
          </h2>
          <p class="faq-subtitle">关于安装、调用、更新与自定义 Skills 的常用说明</p>
        </div>
        <div class="faq-grid">
          <article v-for="item in faqList" :key="item.id" class="faq-card">
            <div class="faq-card-top">
              <span class="faq-index">Q{{ item.id }}</span>
              <h3>{{ item.title }}</h3>
            </div>
            <p>{{ item.answer }}</p>
          </article>
        </div>
      </section>
    </section>

    <section v-else class="panel">
      <div class="badge-row">
        <span class="badge">建设中</span>
      </div>

      <div class="head">
        <component :is="featureIcon" class="feature-icon" />
        <div>
          <h1>{{ feature.title }}</h1>
          <p>{{ feature.subtitle }}</p>
        </div>
      </div>

      <div class="status">{{ feature.eta }}</div>

      <ul class="tips">
        <li v-for="tip in feature.tips" :key="tip">{{ tip }}</li>
      </ul>

      <div class="actions">
        <RouterLink to="/" class="btn btn-primary">
          <ArrowLeftIcon class="btn-icon" />
          返回首页
        </RouterLink>
        <RouterLink to="/customer-service" class="btn btn-secondary">去智能客服</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.coming-soon-page {
  min-height: calc(100vh - 76px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background:
    radial-gradient(circle at 8% 12%, rgba(0, 169, 184, 0.22), transparent 35%),
    radial-gradient(circle at 90% 14%, rgba(255, 167, 74, 0.24), transparent 38%),
    linear-gradient(145deg, #eff8ff, #fff6ea 52%, #f6fff9);
}

.coming-soon-page.skills-mode {
  display: block;
  padding: 1.1rem clamp(0.85rem, 2.4vw, 2.2rem) 1.6rem;
}

.skills-panel {
  width: min(1340px, 100%);
  margin: 0 auto;
  border-radius: 1.4rem;
  padding: clamp(0.9rem, 1.8vw, 1.25rem);
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(17, 57, 91, 0.12);
  box-shadow: 0 24px 50px rgba(17, 43, 61, 0.14);
  backdrop-filter: blur(10px);
}

.skills-hero {
  border-radius: 1.05rem;
  padding: clamp(1rem, 2.2vw, 1.35rem);
  background:
    radial-gradient(circle at 92% 10%, rgba(255, 188, 120, 0.23), transparent 36%),
    linear-gradient(128deg, rgba(255, 255, 255, 0.95), rgba(243, 251, 255, 0.92));
  border: 1px solid rgba(23, 76, 114, 0.12);

  h1 {
    margin: 0.42rem 0 0;
    font-size: clamp(1.6rem, 2.9vw, 2.45rem);
    color: #11293e;
    letter-spacing: 0.01em;
  }
}

.skills-hero-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.26rem 0.72rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #0f7080;
  background: rgba(0, 169, 184, 0.14);
}

.badge-beta {
  color: #095f8e;
  background: linear-gradient(90deg, rgba(0, 169, 184, 0.2), rgba(66, 133, 244, 0.2));
}

.refresh {
  margin: 0;
  font-size: 0.85rem;
  color: #58718a;
}

.skills-subtitle {
  margin: 0.4rem 0 0;
  color: #385874;
  line-height: 1.6;
}

.search-wrap {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.92rem;
  border: 1px solid rgba(21, 70, 109, 0.17);
  background: rgba(247, 252, 255, 0.95);
  padding: 0.5rem 0.56rem;

  input {
    width: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: #183a55;
    font-size: 0.95rem;
    padding: 0.2rem 0.16rem;
  }
}

.search-icon {
  width: 1.15rem;
  height: 1.15rem;
  color: #4a6b8a;
  flex-shrink: 0;
}

.search-btn,
.reset-btn {
  border: 0;
  border-radius: 0.72rem;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.48rem 0.78rem;
  min-width: 66px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.search-btn {
  color: #fff;
  background: linear-gradient(120deg, #2f88ff 0%, #1467c7 100%);
}

.reset-btn {
  color: #2f4f69;
  background: rgba(33, 85, 124, 0.12);
}

.search-btn:hover,
.reset-btn:hover {
  transform: translateY(-1px);
}

.category-list {
  margin-top: 0.86rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.48rem;
}

.category-pill {
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #2d4f6a;
  font-weight: 600;
  font-size: 0.84rem;
  padding: 0.38rem 0.72rem;
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  cursor: pointer;
  transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease;
}

.category-pill:hover {
  transform: translateY(-1px);
  border-color: rgba(18, 179, 122, 0.38);
}

.category-pill.active {
  background: linear-gradient(120deg, rgba(18, 179, 122, 0.22), rgba(0, 169, 184, 0.2));
  border-color: rgba(18, 179, 122, 0.45);
  color: #1b5f48;
}

.category-emoji {
  font-size: 0.82rem;
}

.skills-summary {
  margin: 0.84rem 0 0;
  color: #55718d;
  font-size: 0.86rem;
}

.skills-content {
  margin-top: 1.08rem;
  display: grid;
  grid-template-columns: 1.18fr 1fr;
  gap: 1rem;
  align-items: start;
}

.skills-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.skill-card {
  position: relative;
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 1rem;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(243, 251, 255, 0.9));
  padding: 0.9rem 0.9rem 0.86rem;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.skill-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 1rem 0 0 1rem;
  background: linear-gradient(180deg, rgba(47, 136, 255, 0.7), rgba(18, 179, 122, 0.7));
  opacity: 0.35;
}

.skill-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 169, 184, 0.34);
  box-shadow: 0 12px 20px rgba(24, 57, 81, 0.08);
}

.skill-card.active {
  border-color: rgba(18, 179, 122, 0.45);
  box-shadow: 0 14px 24px rgba(18, 179, 122, 0.16);
}

.skill-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
}

.skill-title-wrap {
  min-width: 0;
}

.skill-card-head h2 {
  margin: 0;
  font-size: 1.02rem;
  color: #143149;
  font-weight: 620;
  letter-spacing: 0.004em;
  line-height: 1.25;
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-slug {
  margin: 0.24rem 0 0;
  font-size: 0.72rem;
  color: #637e96;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0.015em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.22rem 0.52rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #157569;
  background: linear-gradient(120deg, rgba(22, 181, 140, 0.2), rgba(0, 169, 184, 0.18));
  border: 1px solid rgba(21, 117, 105, 0.15);
  flex-shrink: 0;
}

.skill-tags {
  margin-top: 0.48rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.34rem;

  span {
    border-radius: 8px;
    padding: 0.15rem 0.46rem;
    font-size: 0.76rem;
    font-weight: 600;
    color: #3d62a0;
    background: rgba(47, 136, 255, 0.14);
  }
}

.skill-summary {
  margin: 0.62rem 0 0;
  color: #3f5c75;
  line-height: 1.52;
  font-size: 0.88rem;
}

.skill-card-foot {
  margin-top: 0.62rem;
  display: flex;
  justify-content: space-between;
  gap: 0.45rem;
  color: #5c748d;
  font-size: 0.8rem;
}

.trend {
  color: #0a8a67;
  font-weight: 700;
}

.view-btn {
  margin-top: 0.56rem;
  width: 100%;
  border: 1px solid rgba(47, 136, 255, 0.3);
  border-radius: 0.66rem;
  background: rgba(47, 136, 255, 0.12);
  color: #1b5788;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.39rem 0.6rem;
  cursor: pointer;
}

.view-btn:hover {
  background: rgba(47, 136, 255, 0.2);
}

.mini-copy-btn {
  margin-top: 0.42rem;
  width: 100%;
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 0.66rem;
  background: rgba(255, 255, 255, 0.9);
  color: #294d68;
  font-size: 0.79rem;
  font-weight: 600;
  padding: 0.38rem 0.58rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 0.34rem;
  cursor: pointer;
}

.mini-copy-btn:hover {
  border-color: rgba(18, 179, 122, 0.38);
  background: rgba(18, 179, 122, 0.12);
}

.mini-copy-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.empty-state {
  grid-column: 1 / -1;
  border: 1px dashed rgba(26, 78, 112, 0.3);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.7);
  padding: 1.2rem 1rem;
  text-align: center;

  h3 {
    margin: 0;
    color: #1a3a52;
  }

  p {
    margin: 0.36rem 0 0;
    color: #5f7590;
  }
}

.skill-detail {
  border: 1px solid rgba(26, 78, 112, 0.16);
  border-radius: 1rem;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.97), rgba(245, 252, 255, 0.94));
  box-shadow: 0 12px 28px rgba(20, 56, 82, 0.08);
  padding: 1.05rem;
  position: sticky;
  top: calc(76px + 0.72rem);
  transform-origin: top center;
  transition: transform 0.32s ease, opacity 0.32s ease, filter 0.32s ease, box-shadow 0.32s ease;
  will-change: transform, opacity, filter;
}

.skill-detail.collapsed {
  opacity: 0;
  transform: translateY(-14px) scale(0.985);
  filter: blur(2px);
  pointer-events: none;
  box-shadow: none;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.9rem;
  padding-bottom: 0.72rem;
  border-bottom: 1px solid rgba(38, 94, 130, 0.16);
}

.detail-head-main {
  min-width: 0;

  h2 {
    margin: 0;
    color: #132d43;
    font-size: 1.35rem;
    line-height: 1.2;
    font-weight: 610;
    letter-spacing: 0.005em;
    font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  }
}

.detail-summary {
  margin: 0.26rem 0 0;
  color: #355c79;
  line-height: 1.56;
}

.detail-slug {
  margin: 0.24rem 0 0;
  color: #597793;
  font-size: 0.78rem;
  line-height: 1.25;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}

.repo-btn {
  flex-shrink: 0;
  text-decoration: none;
  padding: 0.46rem 0.72rem;
  border-radius: 0.68rem;
  font-weight: 700;
  font-size: 0.86rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #fff;
  background: linear-gradient(120deg, #2f88ff 0%, #1d67c8 100%);
}

.repo-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.detail-desc {
  margin: 0.72rem 0 0;
  color: #3c5e7a;
  line-height: 1.68;
  font-size: 0.94rem;
}

.detail-meta {
  margin-top: 0.72rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.48rem;

  span {
    border-radius: 10px;
    padding: 0.24rem 0.56rem;
    font-size: 0.78rem;
    color: #2f5673;
    border: 1px solid rgba(47, 136, 255, 0.16);
    background: rgba(47, 136, 255, 0.1);
  }
}

.detail-tags {
  margin-top: 0.66rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;

  span {
    border-radius: 999px;
    padding: 0.2rem 0.58rem;
    font-size: 0.78rem;
    color: #1f666a;
    border: 1px solid rgba(0, 169, 184, 0.16);
    background: rgba(0, 169, 184, 0.1);
    font-weight: 550;
  }
}

.install-box,
.scenario-box,
.recommend-box {
  margin-top: 0.84rem;
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 0.82rem;
  padding: 0.76rem;
  background: rgba(248, 253, 255, 0.92);

  h3 {
    margin: 0;
    color: #1d4058;
    font-size: 1rem;
  }

  p {
    margin: 0.34rem 0 0;
    color: #48657f;
  }
}

.command-row {
  margin-top: 0.56rem;
  border: 1px solid rgba(26, 78, 112, 0.16);
  border-radius: 0.64rem;
  background: #fff;
  padding: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    flex: 1;
    min-width: 0;
    font-size: 0.86rem;
    font-family: 'Fira Code', 'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
    color: #254862;
    white-space: nowrap;
    overflow-x: auto;
  }
}

.copy-error {
  margin: 0.42rem 0 0;
  font-size: 0.82rem;
  color: #d04e3e;
}

.copy-btn {
  border: 1px solid rgba(26, 78, 112, 0.16);
  border-radius: 0.58rem;
  background: rgba(47, 136, 255, 0.1);
  color: #1f527e;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.36rem 0.56rem;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  cursor: pointer;
}

.copy-btn:hover {
  background: rgba(47, 136, 255, 0.18);
}

.copy-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.scenario-box ul,
.recommend-box ul {
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  color: #36556f;
  line-height: 1.62;
}

.recommend-box ul {
  padding-left: 0;
  list-style: none;
}

.recommend-box li {
  padding: 0.48rem 0.5rem;
  border-radius: 0.64rem;
  border: 1px dashed rgba(26, 78, 112, 0.16);
  background: rgba(255, 255, 255, 0.7);
}

.recommend-box li + li {
  margin-top: 0.42rem;
}

.recommend-btn {
  border: 1px solid rgba(47, 136, 255, 0.24);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(47, 136, 255, 0.12);
  color: #184d77;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
}

.recommend-btn:hover {
  background: rgba(47, 136, 255, 0.2);
}

.recommend-box p {
  margin: 0.24rem 0 0;
  color: #5e7690;
  font-size: 0.84rem;
}

.faq-section {
  margin-top: 1.22rem;
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 1.08rem;
  background:
    radial-gradient(circle at 90% 8%, rgba(255, 189, 128, 0.14), transparent 32%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.74), rgba(245, 252, 255, 0.8));
  padding: 1.05rem;
}

.faq-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.faq-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  color: #10273b;
  font-size: 1.56rem;
  font-weight: 630;
}

.faq-subtitle {
  margin: 0.42rem 0 0;
  color: #567490;
  font-size: 0.92rem;
}

.faq-title-icon {
  width: 1.6rem;
  height: 1.6rem;
  color: #2f88ff;
}

.faq-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.78rem;
}

.faq-card {
  position: relative;
  border-radius: 0.94rem;
  border: 1px solid rgba(26, 78, 112, 0.12);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.86rem 0.9rem;
  box-shadow: 0 8px 18px rgba(24, 58, 85, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.faq-card::before {
  content: '';
  position: absolute;
  left: 0.72rem;
  right: 0.72rem;
  top: 0.58rem;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(47, 136, 255, 0.42), rgba(0, 169, 184, 0.32), rgba(47, 136, 255, 0));
}

.faq-card:hover {
  transform: translateY(-2px);
  border-color: rgba(47, 136, 255, 0.24);
  box-shadow: 0 12px 24px rgba(24, 58, 85, 0.1);
}

.faq-card-top {
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.48rem;
}

.faq-index {
  border-radius: 999px;
  padding: 0.14rem 0.42rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #1d5f86;
  background: linear-gradient(120deg, rgba(47, 136, 255, 0.2), rgba(0, 169, 184, 0.16));
  border: 1px solid rgba(47, 136, 255, 0.2);
  flex-shrink: 0;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}

.faq-card h3 {
  margin: 0;
  color: #132b40;
  font-size: 1.04rem;
  line-height: 1.4;
  font-weight: 610;
}

.faq-card p {
  margin: 0.5rem 0 0;
  color: #48657f;
  line-height: 1.66;
  font-size: 0.95rem;
}

.panel {
  width: min(860px, 100%);
  padding: 2rem;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(26, 78, 112, 0.12);
  box-shadow: 0 16px 40px rgba(17, 43, 61, 0.12);
}

.badge-row {
  margin-bottom: 1rem;
}

.head {
  display: flex;
  gap: 0.9rem;
  align-items: center;

  h1 {
    font-size: clamp(1.5rem, 2.3vw, 2rem);
    margin: 0 0 0.25rem;
    color: #16364a;
  }

  p {
    margin: 0;
    color: #46607a;
    line-height: 1.55;
  }
}

.feature-icon {
  width: 2.6rem;
  height: 2.6rem;
  color: #1495a6;
  flex-shrink: 0;
}

.status {
  margin-top: 1.2rem;
  font-size: 0.94rem;
  color: #1d4b6a;
  font-weight: 600;
}

.tips {
  margin: 1rem 0 0;
  padding-left: 1.15rem;
  color: #304b64;
  line-height: 1.7;
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.58rem 1rem;
  font-weight: 600;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.btn-primary {
  background: #12b37a;
  color: #fff;
}

.btn-secondary {
  color: #244a62;
  background: rgba(36, 74, 98, 0.08);
}

@media (max-width: 1180px) {
  .skills-content {
    grid-template-columns: 1fr;
  }

  .skill-detail {
    position: static;
  }
}

@media (max-width: 900px) {
  .skills-list {
    grid-template-columns: 1fr;
  }

  .faq-grid {
    grid-template-columns: 1fr;
  }

  .faq-head {
    align-items: flex-start;
    text-align: left;
  }
}

@media (max-width: 760px) {
  .skills-panel {
    padding: 0.72rem;
  }

  .search-wrap {
    border-radius: 0.78rem;
    flex-wrap: wrap;
  }

  .search-wrap input {
    min-width: 100%;
    order: 1;
  }

  .search-btn,
  .reset-btn {
    flex: 1;
    justify-content: center;
  }

  .detail-head {
    flex-direction: column;
  }

  .repo-btn {
    width: fit-content;
  }

  .command-row {
    align-items: stretch;
    flex-direction: column;
  }

  .copy-btn {
    width: 100%;
    justify-content: center;
  }
}

:global(.dark) .coming-soon-page {
  background:
    radial-gradient(circle at 10% 15%, rgba(25, 170, 210, 0.16), transparent 35%),
    radial-gradient(circle at 85% 20%, rgba(255, 153, 88, 0.2), transparent 40%),
    linear-gradient(145deg, #111c28, #172536);
}

:global(.dark) .skills-panel {
  background: rgba(13, 22, 34, 0.72);
  border-color: rgba(180, 218, 255, 0.16);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
}

:global(.dark) .skills-hero,
:global(.dark) .skill-card,
:global(.dark) .skill-detail,
:global(.dark) .empty-state,
:global(.dark) .install-box,
:global(.dark) .scenario-box,
:global(.dark) .recommend-box,
:global(.dark) .faq-section,
:global(.dark) .faq-card {
  background: rgba(14, 26, 40, 0.84);
  border-color: rgba(177, 220, 255, 0.2);
}

:global(.dark) .skills-hero h1,
:global(.dark) .skill-card-head h2,
:global(.dark) .detail-head h2,
:global(.dark) .install-box h3,
:global(.dark) .scenario-box h3,
:global(.dark) .recommend-box h3,
:global(.dark) .empty-state h3,
:global(.dark) .faq-title,
:global(.dark) .faq-card h3 {
  color: #e5f3ff;
}

:global(.dark) .skill-slug,
:global(.dark) .detail-slug {
  color: #9fb9d4;
}

:global(.dark) .faq-subtitle {
  color: #9eb8d2;
}

:global(.dark) .refresh,
:global(.dark) .skills-subtitle,
:global(.dark) .skills-summary,
:global(.dark) .skill-summary,
:global(.dark) .detail-summary,
:global(.dark) .detail-desc,
:global(.dark) .install-box p,
:global(.dark) .scenario-box ul,
:global(.dark) .recommend-box p,
:global(.dark) .empty-state p,
:global(.dark) .skill-card-foot,
:global(.dark) .faq-card p {
  color: #a8bfd6;
}

:global(.dark) .search-wrap,
:global(.dark) .mini-copy-btn,
:global(.dark) .command-row,
:global(.dark) .recommend-box li {
  background: rgba(9, 20, 33, 0.86);
  border-color: rgba(177, 220, 255, 0.2);
}

:global(.dark) .search-wrap input,
:global(.dark) .command-row code,
:global(.dark) .category-pill,
:global(.dark) .mini-copy-btn,
:global(.dark) .view-btn,
:global(.dark) .recommend-btn {
  color: #e0efff;
}

:global(.dark) .search-btn {
  background: linear-gradient(120deg, #3f97ff 0%, #1f71d4 100%);
}

:global(.dark) .reset-btn {
  color: #d7e7f7;
  background: rgba(122, 167, 210, 0.18);
}

:global(.dark) .view-btn {
  border-color: rgba(89, 166, 255, 0.4);
  background: rgba(89, 166, 255, 0.16);
}

:global(.dark) .category-pill {
  background: rgba(14, 27, 42, 0.8);
  border-color: rgba(177, 220, 255, 0.2);
}

:global(.dark) .category-pill.active {
  color: #c9ffea;
  border-color: rgba(18, 179, 122, 0.45);
  background: linear-gradient(120deg, rgba(18, 179, 122, 0.22), rgba(0, 169, 184, 0.2));
}

:global(.dark) .rank,
:global(.dark) .detail-meta span {
  background: rgba(89, 166, 255, 0.2);
  color: #cde7ff;
}

:global(.dark) .detail-tags span {
  background: rgba(0, 169, 184, 0.24);
  color: #cbffff;
}

:global(.dark) .copy-btn {
  color: #c9e5ff;
  border-color: rgba(177, 220, 255, 0.2);
  background: rgba(89, 166, 255, 0.16);
}

:global(.dark) .faq-card {
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
}

:global(.dark) .faq-card::before {
  background: linear-gradient(90deg, rgba(138, 182, 255, 0.55), rgba(91, 206, 212, 0.5), rgba(138, 182, 255, 0));
}

:global(.dark) .faq-index {
  color: #d1e7ff;
  background: linear-gradient(120deg, rgba(100, 156, 241, 0.28), rgba(59, 191, 201, 0.24));
  border-color: rgba(127, 187, 255, 0.25);
}

:global(.dark) .copy-error {
  color: #ff9d90;
}

:global(.dark) .repo-btn {
  box-shadow: 0 8px 16px rgba(47, 136, 255, 0.3);
}

:global(.dark) .panel {
  background: rgba(13, 22, 34, 0.84);
  border-color: rgba(180, 218, 255, 0.16);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
}

:global(.dark) .badge {
  background: rgba(67, 194, 227, 0.22);
  color: #c4f2ff;
}

:global(.dark) .head h1 {
  color: #e5f3ff;
}

:global(.dark) .head p,
:global(.dark) .tips {
  color: #b2c8df;
}

:global(.dark) .status {
  color: #9dd8ff;
}

:global(.dark) .btn-secondary {
  color: #d8e8f7;
  background: rgba(216, 232, 247, 0.12);
}
</style>
