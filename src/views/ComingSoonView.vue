<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'
import {
  faqList,
  formatSkillCategory,
  formatSkillInstalls,
  skillCategories,
  skillsTrendList,
  type SkillItem,
} from '../data/skills'

interface FeatureConfig {
  title: string
  subtitle: string
  eta: string
  tips: string[]
}

const route = useRoute()
const router = useRouter()

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

const keywordInput = ref('')
const keyword = ref('')
const activeCategory = ref('all')
const copiedSkillId = ref('')
const copyError = ref('')

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

const formatCategory = (categoryId: string) => formatSkillCategory(categoryId)
const formatInstalls = (count: number) => formatSkillInstalls(count)

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

const openSkillDetail = (skillId: string) => {
  router.push({ name: 'skills-detail', params: { skillId } })
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

        <p class="skills-summary">
          已收录 {{ skillsTrendList.length }} 个 Skills，当前匹配 {{ filteredSkills.length }} 个（当前为演示数据）
        </p>
      </header>

      <div class="skills-content">
        <section class="skills-list">
          <article
            v-for="(skill, index) in filteredSkills"
            :key="skill.id"
            class="skill-card"
            @click="openSkillDetail(skill.id)"
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

            <button type="button" class="view-btn" @click.stop="openSkillDetail(skill.id)">查看详情</button>
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
      </div>

      <p v-if="copyError" class="copy-error copy-error-inline">{{ copyError }}</p>

      <section class="faq-section">
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
  display: block;
}

.skills-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  font-size: 0.98rem;
  color: #143149;
  font-weight: 560;
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

.copy-error-inline {
  margin-top: 0.82rem;
  padding: 0.5rem 0.66rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(208, 78, 62, 0.24);
  background: rgba(248, 91, 69, 0.08);
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

@media (max-width: 1240px) {
  .skills-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
