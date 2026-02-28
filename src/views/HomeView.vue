<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDark } from '@vueuse/core'
import { preloadCoreRoutes } from '../router'
import {
  ChatBubbleLeftRightIcon,
  HeartIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
  BeakerIcon,
} from '@heroicons/vue/24/outline'

interface AppCard {
  id: number
  title: string
  tag: string
  description: string
  route: string
  badge: string
  icon: Component
  accent: string
}

const isDark = useDark()
const sloganText = '练出AGI就下班'

const aiApps: AppCard[] = [
  {
    id: 1,
    title: 'AI 聊天',
    tag: '多模态对话',
    description: '文字、图片、语音统一入口，快速验证你的想法。',
    route: '/ai-chat',
    badge: 'Hot',
    icon: ChatBubbleLeftRightIcon,
    accent: '#00a9b8',
  },
  {
    id: 2,
    title: '哄哄模拟器',
    tag: '提示工程',
    description: '情绪互动轻松练习沟通表达，在游戏里测试你的临场反应。',
    route: '/game',
    badge: 'Game',
    icon: HeartIcon,
    accent: '#ff6b4a',
  },
  {
    id: 3,
    title: '智能客服',
    tag: 'Function Calling',
    description: '星巴克咖啡课程咨询与预约，快速接入业务函数能力。',
    route: '/customer-service',
    badge: 'Live',
    icon: UserGroupIcon,
    accent: '#3bb273',
  },
  {
    id: 4,
    title: 'ChatPDF',
    tag: 'RAG 知识库',
    description: '上传文档即对话，打造可检索、可追问的私人知识库。',
    route: '/chat-pdf',
    badge: 'RAG',
    icon: DocumentTextIcon,
    accent: '#2f88ff',
  },
  {
    id: 5,
    title: 'MCP网关',
    tag: 'MCP',
    description: '解决各类业务接口(http/rpc)便捷转换为MCP协议接口而设计实现。',
    route: '/coming-soon/mcp-gateway',
    badge: '建设中',
    icon: CommandLineIcon,
    accent: '#0ea5e9',
  },
  {
    id: 6,
    title: 'Skills',
    tag: '趋势榜 · 一键安装',
    description: '实时追踪全球 Agent Skills 热门趋势，按分类发现能力并快速复制安装命令。',
    route: '/coming-soon/skills',
    badge: '建设中',
    icon: WrenchScrewdriverIcon,
    accent: '#f59e0b',
  },
  {
    id: 7,
    title: '舒适区突破器',
    tag: '行为实验',
    description: '把目标拆成小步行动，让想法从“会”变成“做”。',
    route: '/coming-soon/comfort-simulator',
    badge: '建设中',
    icon: SparklesIcon,
    accent: '#efb91f',
  },
  {
    id: 8,
    title: '关于实验室',
    tag: '路线图',
    description: '查看项目背景和玩法说明，快速理解整个 AI 站点结构。',
    route: '/about',
    badge: 'Info',
    icon: BeakerIcon,
    accent: '#7c6cff',
  },
]

const carouselTexts = [
  '距离AGI结丹还有█░░░░░░░99%',
  '今天也是面向GPT编程的一天',
  'Bug转化率100% ✓',
  'Ctrl+C, Ctrl+V 工程师',
  '需求又变了 -_-|||',
  '代码能跑就不要动',
  '编译不过，一定是电脑的问题',
  '这Bug是feature，不改',
  'GPT写的，不关我事',
  '等AGI养我',
  '老板在后面，假装很忙',
  '写注释？下辈子吧',
]

const carouselGradients = [
  'linear-gradient(90deg, #ff6b4a 0%, #f2b701 100%)',
  'linear-gradient(90deg, #00a9b8 0%, #55e6a5 100%)',
  'linear-gradient(90deg, #6f70ff 0%, #64d8ff 100%)',
  'linear-gradient(90deg, #f24e86 0%, #ffa352 100%)',
  'linear-gradient(90deg, #19b47b 0%, #8ee34e 100%)',
  'linear-gradient(90deg, #3088ff 0%, #7f6dff 100%)',
  'linear-gradient(90deg, #ff8a3d 0%, #ffd43b 100%)',
  'linear-gradient(90deg, #00b1c4 0%, #4dd9ff 100%)',
  'linear-gradient(90deg, #ff5f6d 0%, #ffc371 100%)',
  'linear-gradient(90deg, #5f72ff 0%, #6ed0ff 100%)',
  'linear-gradient(90deg, #2dcf86 0%, #00a9b8 100%)',
  'linear-gradient(90deg, #fd6b56 0%, #f7b733 100%)',
]

const currentCarouselIndex = ref(0)
const isCarouselPaused = ref(false)

const currentCarouselText = computed(() => carouselTexts[currentCarouselIndex.value])
const currentCarouselGradient = computed(() => carouselGradients[currentCarouselIndex.value])
const currentCarouselOrder = computed(() => currentCarouselIndex.value + 1)

let typewriterTimer: ReturnType<typeof setInterval> | undefined
let carouselTimer: ReturnType<typeof setInterval> | undefined

const nextCarouselText = () => {
  currentCarouselIndex.value = (currentCarouselIndex.value + 1) % carouselTexts.length
}

const clickCarouselToNext = () => {
  nextCarouselText()
}

const pauseCarousel = () => {
  isCarouselPaused.value = true
}

const resumeCarousel = () => {
  isCarouselPaused.value = false
}

const startCarousel = () => {
  clearInterval(carouselTimer)
  carouselTimer = setInterval(() => {
    if (!isCarouselPaused.value) {
      nextCarouselText()
    }
  }, 4000)
}

// 利用浏览器空闲时间预加载核心聊天页面，降低用户首次进入时的感知延迟。
const scheduleCoreRoutePreload = () => {
  const preload = () => {
    void preloadCoreRoutes()
  }

  const requestIdle = (window as any).requestIdleCallback
  if (typeof requestIdle === 'function') {
    requestIdle(preload, { timeout: 1500 })
    return
  }

  window.setTimeout(preload, 500)
}

onMounted(() => {
  startCarousel()
  scheduleCoreRoutePreload()
})

onBeforeUnmount(() => {
  clearInterval(carouselTimer)
})
</script>

<template>
  <main class="home-page" :class="{ dark: isDark }">
    <div class="ambient" aria-hidden="true">
      <span class="orb orb-left"></span>
      <span class="orb orb-right"></span>
      <span class="orb orb-bottom"></span>
    </div>

    <section class="hero">
      <div class="hero-title-wrap">
        <h2 class="hero-title">
          <span class="title-main">Jacky的AI炼丹炉</span>
          <span class="title-slogan-inline">
            {{ sloganText }}
            <span class="typing-cursor" aria-hidden="true">▊</span>
          </span>
        </h2>
      </div>
      <div class="hero-actions">
        <router-link to="/ai-chat" class="btn btn-primary">开始体验</router-link>
        <router-link to="/chat-pdf" class="btn btn-secondary">打开知识库</router-link>
      </div>
    </section>

    <section
      class="quote-carousel"
      role="button"
      tabindex="0"
      title="点击切换轮播文案"
      @click="clickCarouselToNext"
      @keydown.enter.prevent="clickCarouselToNext"
      @keydown.space.prevent="clickCarouselToNext"
      @mouseenter="pauseCarousel"
      @mouseleave="resumeCarousel"
    >
      <transition name="quote-fade" mode="out-in">
        <p :key="currentCarouselIndex" class="quote-text" :style="{ '--quote-gradient': currentCarouselGradient }">
          {{ currentCarouselText }}
        </p>
      </transition>
      <p class="quote-counter">第{{ currentCarouselOrder }}条 / 共{{ carouselTexts.length }}条</p>
    </section>

    <section class="apps-grid">
      <router-link
        v-for="(app, index) in aiApps"
        :key="app.id"
        :to="app.route"
        class="app-card"
        :style="{
          '--accent': app.accent,
          '--card-delay': `${index * 0.08}s`,
        }"
      >
        <div class="card-top">
          <span class="badge">{{ app.badge }}</span>
          <component :is="app.icon" class="icon" />
        </div>
        <h2>{{ app.title }}</h2>
        <p class="tag">{{ app.tag }}</p>
        <p class="desc">{{ app.description }}</p>
        <span class="cta">进入炼丹</span>
      </router-link>
    </section>
  </main>
</template>

<style scoped lang="scss">
.home-page {
  --page-bg: linear-gradient(135deg, #fff8e8 0%, #e9f7ff 46%, #fff4ee 100%);
  --text-main: #162435;
  --text-sub: #4e5c6f;
  --panel-bg: rgba(255, 255, 255, 0.72);
  --panel-border: rgba(22, 36, 53, 0.12);
  --shadow-color: rgba(20, 43, 70, 0.14);

  position: relative;
  min-height: calc(100vh - 78px);
  overflow: hidden;
  padding: clamp(0.7rem, 2vw, 1.35rem) clamp(1rem, 4vw, 3.5rem) 2.8rem;
  background: var(--page-bg);
  color: var(--text-main);
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.home-page.dark {
  --page-bg: linear-gradient(145deg, #101a23 0%, #1a2b38 45%, #1d1f31 100%);
  --text-main: #ecf4ff;
  --text-sub: #b2c4d8;
  --panel-bg: rgba(8, 16, 28, 0.58);
  --panel-border: rgba(220, 236, 255, 0.14);
  --shadow-color: rgba(0, 0, 0, 0.35);
}

.ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(5px);
  opacity: 0.8;
  animation: floatOrb 10s ease-in-out infinite alternate;
}

.orb-left {
  width: clamp(180px, 24vw, 340px);
  height: clamp(180px, 24vw, 340px);
  left: -80px;
  top: 100px;
  background: radial-gradient(circle at 40% 30%, rgba(255, 120, 76, 0.45), rgba(255, 120, 76, 0));
}

.orb-right {
  width: clamp(220px, 28vw, 400px);
  height: clamp(220px, 28vw, 400px);
  right: -90px;
  top: 40px;
  background: radial-gradient(circle at 50% 40%, rgba(0, 169, 184, 0.38), rgba(0, 169, 184, 0));
  animation-delay: 1.2s;
}

.orb-bottom {
  width: clamp(220px, 30vw, 420px);
  height: clamp(220px, 30vw, 420px);
  left: 35%;
  bottom: -180px;
  background: radial-gradient(circle at 50% 45%, rgba(115, 198, 91, 0.33), rgba(115, 198, 91, 0));
  animation-delay: 0.6s;
}

.hero {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
  animation: riseUp 0.7s ease-out both;
}

.hero-title-wrap {
  display: inline-block;
  position: relative;
}

.eyebrow {
  display: inline-block;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.5);
  color: #22587b;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-page.dark .eyebrow {
  background: rgba(20, 35, 52, 0.66);
  border-color: rgba(132, 176, 212, 0.4);
  color: #93d8ff;
}

.hero-title {
  margin-top: 0.55rem;
  margin-bottom: 0.2rem;
  font-size: clamp(2rem, 5vw, 3.7rem);
  line-height: 1.1;
  font-family: 'Avenir Next Condensed', 'Trebuchet MS', 'PingFang SC', sans-serif;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: baseline;
  gap: 0.36rem;
  flex-wrap: nowrap;
  white-space: nowrap;
  z-index: 1;
}

.title-main {
  line-height: 1.08;
  display: inline-block;
}

.title-slogan-inline {
  display: inline-flex;
  align-items: center;
  font-size: clamp(0.72rem, 1.18vw, 0.93rem);
  color: color-mix(in srgb, #0b8f5d 72%, var(--text-main) 28%);
  font-family: 'Fira Code', 'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  letter-spacing: 0.03em;
  font-weight: 700;
  opacity: 0.92;
  text-shadow: 0 4px 12px rgba(16, 124, 85, 0.2);
  z-index: 2;
  margin-bottom: 0;
  transform: translateY(-0.05em);
}

.typing-cursor {
  display: inline-block;
  margin-left: 0.12rem;
  color: #27c47a;
  animation: cursorBlink 1s steps(1, end) infinite;
}

.hero-copy {
  max-width: 700px;
  margin: 1.1rem auto 0;
  color: var(--text-sub);
  font-size: clamp(0.96rem, 1.8vw, 1.12rem);
}

.hero-actions {
  margin-top: 0.85rem;
  display: flex;
  justify-content: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.btn {
  border-radius: 999px;
  padding: 0.72rem 1.3rem;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(120deg, #ff6b4a 0%, #ff9958 100%);
  box-shadow: 0 10px 20px rgba(255, 107, 74, 0.28);
}

.btn-secondary {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid var(--panel-border);
}

.home-page.dark .btn-secondary {
  background: rgba(7, 17, 28, 0.8);
}

.apps-grid {
  position: relative;
  z-index: 1;
  margin-top: 1.05rem;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.app-card {
  --accent: #00a9b8;

  grid-column: span 12;
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 1.1rem 1.1rem 1rem;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--panel-border);
  background: var(--panel-bg);
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 28px var(--shadow-color);
  opacity: 0;
  transform: translateY(18px);
  animation: cardIn 0.55s ease-out forwards;
  animation-delay: var(--card-delay);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.app-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(128deg, color-mix(in srgb, var(--accent) 30%, transparent), transparent 58%);
  pointer-events: none;
}

.app-card:hover {
  transform: translateY(-6px) rotate(-0.4deg);
  border-color: color-mix(in srgb, var(--accent) 55%, #ffffff 45%);
  box-shadow: 0 16px 30px color-mix(in srgb, var(--accent) 26%, var(--shadow-color));
}

.card-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge {
  padding: 0.22rem 0.56rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.72);
  color: color-mix(in srgb, var(--accent) 66%, #16334a 34%);
}

.home-page.dark .badge {
  background: rgba(8, 17, 29, 0.82);
}

.icon {
  width: 1.65rem;
  height: 1.65rem;
  color: var(--accent);
}

h2 {
  position: relative;
  z-index: 1;
  margin-top: 1rem;
  font-size: 1.24rem;
}

.tag {
  position: relative;
  z-index: 1;
  margin-top: 0.2rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.9rem;
}

.desc {
  position: relative;
  z-index: 1;
  margin-top: 0.65rem;
  color: var(--text-sub);
  font-size: 0.93rem;
  line-height: 1.45;
  min-height: 2.7em;
}

.cta {
  position: relative;
  z-index: 1;
  margin-top: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--accent) 70%, var(--text-main) 30%);
}

.cta::after {
  content: '→';
  transition: transform 0.2s ease;
}

.app-card:hover .cta::after {
  transform: translateX(2px);
}

.quote-carousel {
  position: relative;
  z-index: 1;
  margin-top: 0.55rem;
  min-height: 70px;
  border-radius: 20px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.56);
  padding: 0.75rem 1rem 1.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.quote-carousel:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, #00a9b8 35%, var(--panel-border));
  box-shadow: 0 10px 22px color-mix(in srgb, #00a9b8 16%, transparent);
}

.quote-carousel:focus-visible {
  outline: 2px solid color-mix(in srgb, #00a9b8 70%, #ffffff 30%);
  outline-offset: 2px;
}

.home-page.dark .quote-carousel {
  background: rgba(8, 17, 29, 0.76);
}

.quote-text {
  margin: 0;
  text-align: center;
  font-size: clamp(0.96rem, 2.05vw, 1.26rem);
  font-weight: 700;
  text-wrap: balance;
  background-image: var(--quote-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.quote-counter {
  position: absolute;
  right: 0.75rem;
  bottom: 0.38rem;
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-sub);
}

.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: opacity 0.55s ease, transform 0.55s ease;
}

.quote-fade-enter-from,
.quote-fade-leave-to {
  opacity: 0;
  transform: translateY(7px);
}

@keyframes riseUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cursorBlink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@keyframes floatOrb {
  from {
    transform: translateY(-6px) scale(1);
  }
  to {
    transform: translateY(14px) scale(1.06);
  }
}

@media (min-width: 640px) {
  .app-card {
    grid-column: span 6;
  }
}

@media (min-width: 1120px) {
  .app-card {
    grid-column: span 4;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 1rem 0.9rem 2.3rem;
    min-height: calc(100vh - 68px);
  }

  .hero-title {
    margin-top: 0.35rem;
    font-size: clamp(1.38rem, 7vw, 1.92rem);
    gap: 0.2rem;
  }

  .title-slogan-inline {
    font-size: clamp(0.5rem, 2.3vw, 0.7rem);
    margin-bottom: 0;
  }

  .hero-copy {
    font-size: 0.95rem;
  }

  .btn {
    width: 100%;
    text-align: center;
  }

  .quote-carousel {
    min-height: 86px;
    padding: 0.7rem 0.85rem 1.4rem;
  }

  .quote-counter {
    right: 0.68rem;
    bottom: 0.38rem;
    font-size: 0.7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero,
  .app-card,
  .orb {
    animation: none;
  }
}
</style>
