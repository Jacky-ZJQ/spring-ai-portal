<script setup>
import { computed, ref } from 'vue'
import { useDark } from '@vueuse/core'
import { chatAPI } from '../services/api.js'

const isDark = useDark()
const releasingMemory = ref(false)
const cleaningFiles = ref(false)
const maintenanceError = ref('')
const maintenanceResult = ref(null)
const opsTipMode = ref('default')

// 根据当前悬停按钮切换维护说明，帮助用户快速理解每个动作的影响范围。
const opsTipText = computed(() => {
  if (opsTipMode.value === 'memory') {
    return '手动释放内存会执行三项操作：清理 ChatMemory、清理会话历史索引、清理配额计数。'
  }
  if (opsTipMode.value === 'cleanup') {
    return '手动清理过期文件会删除超出 7 天保留期的 PDF 与聊天图片文件。'
  }
  return '将鼠标悬停到按钮上可查看动作说明：释放内存会清理运行态缓存，文件清理会删除 7 天前的过期文件。'
})

const labModules = [
  {
    title: '智能客服',
    subtitle: '星巴克课程咨询与预约，覆盖业务函数调用。',
    status: '已上线',
    route: '/customer-service',
    accent: '#3bb273',
  },
  {
    title: 'SKILLS安装榜',
    subtitle: '构建全球 Agent Skills 热门榜单，支持分类发现、详情查看与快捷安装。',
    status: '建设中',
    route: '/coming-soon/skills',
    accent: '#f59e0b',
  },
  {
    title: 'MCP网关',
    subtitle: '把 HTTP/RPC 接口统一暴露为 MCP 能力层。',
    status: '建设中',
    route: '/coming-soon/mcp-gateway',
    accent: '#0ea5e9',
  },
  {
    title: 'ChatPDF',
    subtitle: '文档上传、向量检索、问答追问的一体化入口。',
    status: '已上线',
    route: '/chat-pdf',
    accent: '#2f88ff',
  },
  {
    title: 'AI 聊天',
    subtitle: '多模态对话入口，快速验证创意和问题。',
    status: '已上线',
    route: '/ai-chat',
    accent: '#00a9b8',
  },
  {
    title: '哄哄模拟器',
    subtitle: '情绪互动练习沟通表达，在游戏化场景里打磨临场反应。',
    status: '已上线',
    route: '/game',
    accent: '#ff6b4a',
  },
  {
    title: 'AI知识库',
    subtitle: '沉淀并分享 AI 提示词、工作流和实战案例，让经验可检索、可复用。',
    status: '建设中',
    route: '/coming-soon/ai-knowledge-base',
    accent: '#efb91f',
  },
]

const roadmap = [
  {
    phase: 'Phase 01',
    title: '基础设施稳定',
    detail: '统一 Docker 部署、环境配置模板、上线与回滚 SOP。',
    milestone: '完成单机发布基线',
    window: '第 1-2 周',
    icon: '🧱',
    color: '#2f88ff'
  },
  {
    phase: 'Phase 02',
    title: '业务能力打通',
    detail: '完成聊天、知识库、预约流程的闭环，并沉淀可复用接口。',
    milestone: '端到端业务闭环跑通',
    window: '第 3-4 周',
    icon: '🔗',
    color: '#2ec6b6'
  },
  {
    phase: 'Phase 03',
    title: '工程效率提升',
    detail: '补齐日志追踪、异常告警、可观测看板和安全策略。',
    milestone: '形成可观测运维体系',
    window: '第 5-6 周',
    icon: '📡',
    color: '#7d6dff'
  },
  {
    phase: 'Phase 04',
    title: '产品化与增长',
    detail: '打磨体验与性能，扩展更多可落地的行业场景模块。',
    milestone: '实现可持续迭代增长',
    window: '第 7-8 周',
    icon: '🚀',
    color: '#ff8f4a'
  },
]

const runReleaseMemory = async () => {
  if (releasingMemory.value) return
  maintenanceError.value = ''
  try {
    releasingMemory.value = true
    const result = await chatAPI.releaseRuntimeMemory({
      forceGc: true,
      cleanupFiles: false
    })
    maintenanceResult.value = result
  } catch (error) {
    maintenanceError.value = '释放内存失败，请检查后端服务是否可用。'
  } finally {
    releasingMemory.value = false
  }
}

const runCleanupFiles = async () => {
  if (cleaningFiles.value) return
  maintenanceError.value = ''
  try {
    cleaningFiles.value = true
    const result = await chatAPI.cleanupExpiredFiles()
    maintenanceResult.value = result
  } catch (error) {
    maintenanceError.value = '清理过期文件失败，请稍后重试。'
  } finally {
    cleaningFiles.value = false
  }
}

const formatActionTime = (isoTime) => {
  if (!isoTime) return '刚刚'
  const date = new Date(isoTime)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return date.toLocaleString()
}
</script>

<template>
  <main class="about-lab" :class="{ dark: isDark }">
    <section class="hero">
      <p class="eyebrow">About Lab</p>
      <h1>关于实验室</h1>
      <p class="intro">
        这是 Jacky 的 AI 实验主站，目标是把每个想法快速变成可运行、可验证、可上线的产品能力。
      </p>
      <div class="hero-actions">
        <router-link to="/" class="btn btn-primary">返回首页</router-link>
        <router-link to="/ai-chat" class="btn btn-secondary">直接开始实验</router-link>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>实验室定位</h2>
        <span class="chip">Build Fast, Ship Faster</span>
      </div>
      <div class="mission-grid">
        <article>
          <h3>快速试错</h3>
          <p>优先跑通链路，先拿到真实反馈，再进行优化迭代。</p>
        </article>
        <article>
          <h3>工程可控</h3>
          <p>坚持可观测、可回滚、可重复发布，避免“跑一次就丢”的脚本化开发。</p>
        </article>
        <article>
          <h3>业务导向</h3>
          <p>每个模块都围绕明确场景设计，不堆功能，关注真实转化价值。</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>功能地图</h2>
        <span class="chip muted">当前模块状态</span>
      </div>
      <div class="module-grid">
        <router-link
          v-for="module in labModules"
          :key="module.title"
          :to="module.route"
          class="module-card"
          :style="{ '--accent': module.accent }"
        >
          <p
            class="module-status"
            :class="{
              'status-live': module.status === '已上线',
              'status-building': module.status === '建设中'
            }"
          >
            {{ module.status }}
          </p>
          <h3>{{ module.title }}</h3>
          <p>{{ module.subtitle }}</p>
          <span class="module-link">查看模块 →</span>
        </router-link>
      </div>
    </section>

    <section class="panel split">
      <article>
        <div class="panel-head">
          <h2>技术栈</h2>
          <span class="chip muted">Tech Stack</span>
        </div>
        <div class="stack-lines">
          <p><span>前端：</span>Vue 3 + TypeScript + Vite + Element Plus</p>
          <p><span>后端：</span>Spring Boot + Spring AI + MyBatis</p>
          <p><span>数据：</span>MySQL + 向量检索（RAG）</p>
          <p><span>部署：</span>Docker / Docker Compose 单机发布</p>
          <p><span>模型：</span>兼容 OpenAI / DashScope 等接口</p>
        </div>
      </article>

      <article>
        <div class="panel-head">
          <h2>使用建议</h2>
          <span class="chip muted">How to Use</span>
        </div>
        <ul class="tips">
          <li>先从 AI 聊天或智能客服开始，快速熟悉交互体验。</li>
          <li>如需知识增强，直接进入 ChatPDF 上传文档并测试检索质量。</li>
          <li>需要沉淀可复用经验时，可在 AI知识库里分享提示词、工作流和案例。</li>
          <li>新功能优先走 `master-deploy` 分支，便于线上快速发布与回滚。</li>
          <li>线上每次发布后，至少执行健康检查、日志检查和核心流程自检。</li>
        </ul>
      </article>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>路线图</h2>
        <span class="chip">Roadmap</span>
      </div>
      <p class="roadmap-intro">
        以“可上线、可回滚、可增长”为主线推进，每个阶段都有明确里程碑与时间窗口。
      </p>
      <div class="roadmap">
        <div class="roadmap-line" aria-hidden="true"></div>
        <article
          v-for="item in roadmap"
          :key="item.phase"
          class="roadmap-item"
          :style="{ '--roadmap-accent': item.color }"
        >
          <div class="roadmap-dot" aria-hidden="true">
            <span>{{ item.icon }}</span>
          </div>
          <div class="roadmap-card">
            <p class="phase">{{ item.phase }}</p>
            <h3>{{ item.title }}</h3>
            <p>{{ item.detail }}</p>
            <div class="roadmap-meta">
              <span>{{ item.milestone }}</span>
              <span>{{ item.window }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="panel ops-panel">
      <div class="panel-head">
        <h2>运行维护</h2>
        <span class="chip">Operations</span>
      </div>
      <p class="ops-tip">{{ opsTipText }}</p>
      <div class="ops-actions">
        <button
          class="btn btn-primary"
          :disabled="releasingMemory"
          @mouseenter="opsTipMode = 'memory'"
          @mouseleave="opsTipMode = 'default'"
          @focus="opsTipMode = 'memory'"
          @blur="opsTipMode = 'default'"
          @click="runReleaseMemory"
        >
          {{ releasingMemory ? '释放中...' : '手动释放内存' }}
        </button>
        <button
          class="btn btn-cleanup"
          :disabled="cleaningFiles"
          @mouseenter="opsTipMode = 'cleanup'"
          @mouseleave="opsTipMode = 'default'"
          @focus="opsTipMode = 'cleanup'"
          @blur="opsTipMode = 'default'"
          @click="runCleanupFiles"
        >
          {{ cleaningFiles ? '清理中...' : '手动清理过期文件' }}
        </button>
      </div>
      <p v-if="maintenanceError" class="ops-error">{{ maintenanceError }}</p>

      <div v-if="maintenanceResult" class="ops-result">
        <p class="ops-time">最近执行：{{ formatActionTime(maintenanceResult.time) }}</p>
        <p v-if="maintenanceResult.beforeUsedMb !== undefined">
          内存占用：{{ maintenanceResult.beforeUsedMb }}MB -> {{ maintenanceResult.afterUsedMb }}MB
        </p>
        <p v-if="maintenanceResult.clearedChatSessions !== undefined">
          已清理会话内存：{{ maintenanceResult.clearedChatSessions }} 条
        </p>
        <p v-if="maintenanceResult.clearedHistorySessions !== undefined">
          已清理会话历史索引：{{ maintenanceResult.clearedHistorySessions }} 条
        </p>
        <p v-if="maintenanceResult.clearedQuotaUsers !== undefined">
          已清理配额计数用户：{{ maintenanceResult.clearedQuotaUsers }} 个
        </p>
        <p v-if="maintenanceResult.deletedPdfFiles !== undefined">
          已删除过期 PDF：{{ maintenanceResult.deletedPdfFiles }} 个
        </p>
        <p v-if="maintenanceResult.deletedImageFiles !== undefined">
          已删除过期聊天图片：{{ maintenanceResult.deletedImageFiles }} 个
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.about-lab {
  --page-bg: linear-gradient(138deg, #fff8e7 0%, #e8f8ff 48%, #fef3f4 100%);
  --text-main: #1a2a3b;
  --text-sub: #536175;
  --panel-bg: rgba(255, 255, 255, 0.78);
  --panel-border: rgba(22, 36, 53, 0.12);
  --shadow: rgba(17, 42, 72, 0.14);

  min-height: calc(100vh - 78px);
  padding: clamp(1rem, 2.8vw, 2rem) clamp(1rem, 4vw, 3.2rem) 2.2rem;
  background: var(--page-bg);
  color: var(--text-main);
}

.about-lab.dark {
  --page-bg: linear-gradient(145deg, #0e1823 0%, #172536 44%, #202033 100%);
  --text-main: #edf5ff;
  --text-sub: #afc3d9;
  --panel-bg: rgba(7, 16, 28, 0.7);
  --panel-border: rgba(212, 232, 255, 0.16);
  --shadow: rgba(0, 0, 0, 0.36);
}

.about-lab.dark .ops-error {
  color: #ff9a9a;
}

.about-lab.dark .ops-result {
  background: rgba(8, 20, 35, 0.72);
}

.about-lab.dark .ops-time {
  color: #8ed8ff;
}

.about-lab.dark .ops-actions .btn-cleanup {
  color: #fff2de;
  background: linear-gradient(118deg, #b9672f 0%, #d4853e 100%);
  box-shadow: 0 10px 20px rgba(195, 117, 57, 0.3);
}

.about-lab.dark .roadmap-line {
  opacity: 0.9;
}

.about-lab.dark .roadmap-dot {
  border-color: color-mix(in srgb, var(--roadmap-accent) 58%, rgba(219, 234, 254, 0.42));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--roadmap-accent) 26%, rgba(12, 22, 37, 0.84)),
    rgba(10, 20, 34, 0.9)
  );
}

.about-lab.dark .roadmap-card {
  background: linear-gradient(
    152deg,
    color-mix(in srgb, var(--roadmap-accent) 20%, rgba(8, 18, 33, 0.92)),
    rgba(10, 21, 36, 0.88)
  );
}

.about-lab.dark .roadmap-meta span {
  color: color-mix(in srgb, var(--roadmap-accent) 62%, #e8f3ff 38%);
  background: color-mix(in srgb, var(--roadmap-accent) 22%, rgba(15, 31, 50, 0.84));
}

.hero {
  max-width: 920px;
  margin: 0 auto 1rem;
  text-align: center;
}

.eyebrow {
  display: inline-flex;
  padding: 0.34rem 0.74rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(22, 36, 53, 0.14);
  color: #2f6d89;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0.65rem 0 0.4rem;
  font-size: clamp(2rem, 5vw, 3.3rem);
  line-height: 1.1;
  letter-spacing: 0.01em;
}

.intro {
  max-width: 760px;
  margin: 0 auto;
  color: var(--text-sub);
  font-size: clamp(0.96rem, 1.7vw, 1.08rem);
  line-height: 1.65;
}

.hero-actions {
  margin-top: 0.95rem;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.66rem 1.2rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(120deg, #ff6b4a 0%, #ff9758 100%);
  box-shadow: 0 10px 22px rgba(255, 115, 84, 0.34);
}

.btn-secondary {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid var(--panel-border);
}

.panel {
  max-width: 1160px;
  margin: 0.9rem auto 0;
  border: 1px solid var(--panel-border);
  border-radius: 20px;
  background: var(--panel-bg);
  box-shadow: 0 16px 28px var(--shadow);
  padding: clamp(0.95rem, 2vw, 1.2rem);
  backdrop-filter: blur(9px);
}

.ops-tip {
  color: var(--text-sub);
  line-height: 1.55;
  min-height: 3.1em;
}

.ops-actions {
  margin-top: 0.7rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.ops-actions .btn {
  border: none;
  cursor: pointer;
}

.ops-actions .btn-cleanup {
  color: #fff;
  background: linear-gradient(118deg, #ff9246 0%, #ffb45f 100%);
  box-shadow: 0 10px 22px rgba(255, 150, 81, 0.32);
}

.ops-actions .btn-cleanup:hover:not(:disabled) {
  box-shadow: 0 14px 28px rgba(255, 150, 81, 0.4);
}

.ops-actions .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.ops-error {
  margin-top: 0.55rem;
  color: #d13f3f;
  font-weight: 600;
}

.ops-result {
  margin-top: 0.7rem;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 0.7rem 0.78rem;
  background: rgba(255, 255, 255, 0.44);
}

.ops-result p + p {
  margin-top: 0.35rem;
}

.ops-time {
  color: #2a7395;
  font-weight: 600;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.75rem;
}

.panel-head h2 {
  font-size: clamp(1.04rem, 2.2vw, 1.4rem);
}

.chip {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #0f7c91;
  background: rgba(0, 169, 184, 0.12);
}

.chip.muted {
  color: #4a5d72;
  background: rgba(128, 155, 184, 0.15);
}

.mission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.mission-grid article {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 0.85rem 0.9rem;
  background: rgba(255, 255, 255, 0.5);
}

.mission-grid h3 {
  font-size: 1rem;
}

.mission-grid p {
  margin-top: 0.45rem;
  color: var(--text-sub);
  line-height: 1.55;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.module-card {
  --accent: #00a9b8;

  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--panel-border));
  border-radius: 14px;
  padding: 0.85rem;
  text-decoration: none;
  color: inherit;
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 8%, rgba(255, 255, 255, 0.82)), rgba(255, 255, 255, 0.58));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px color-mix(in srgb, var(--accent) 26%, transparent);
}

.module-status {
  font-size: 0.76rem;
  font-weight: 700;
  display: inline-flex;
  width: fit-content;
  padding: 0.18rem 0.56rem;
  border-radius: 999px;
}

.module-status.status-live {
  color: #1f7a4d;
  background: rgba(46, 198, 136, 0.16);
}

.module-status.status-building {
  color: #c63f3f;
  background: rgba(236, 91, 91, 0.16);
}

.about-lab.dark .module-status.status-live {
  color: #8ef3bf;
  background: rgba(46, 198, 136, 0.2);
}

.about-lab.dark .module-status.status-building {
  color: #ffb2b2;
  background: rgba(236, 91, 91, 0.2);
}

.module-card h3 {
  margin-top: 0.3rem;
  font-size: 1.02rem;
}

.module-card p {
  margin-top: 0.3rem;
  color: var(--text-sub);
  line-height: 1.45;
}

.module-link {
  margin-top: 0.55rem;
  display: inline-flex;
  font-size: 0.86rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--accent) 75%, var(--text-main) 25%);
}

.split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.split article {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 0.82rem;
  background: rgba(255, 255, 255, 0.48);
}

.stack-lines p + p {
  margin-top: 0.48rem;
}

.stack-lines span {
  font-weight: 700;
  color: #1b6285;
}

.tips {
  padding-left: 1.1rem;
  color: var(--text-sub);
}

.tips li + li {
  margin-top: 0.45rem;
}

.roadmap-intro {
  color: var(--text-sub);
  line-height: 1.55;
}

.roadmap {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 0.82rem;
}

.roadmap-line {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 1.55rem;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2f88ff 0%, #2ec6b6 35%, #7d6dff 68%, #ff8f4a 100%);
  opacity: 0.7;
  pointer-events: none;
}

.roadmap-item {
  --roadmap-accent: #2f88ff;

  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.62rem;
}

.roadmap-dot {
  width: 3.1rem;
  height: 3.1rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid color-mix(in srgb, var(--roadmap-accent) 50%, #ffffff 50%);
  background: linear-gradient(145deg, color-mix(in srgb, var(--roadmap-accent) 20%, #ffffff 80%), #ffffff);
  box-shadow: 0 10px 18px color-mix(in srgb, var(--roadmap-accent) 28%, transparent);
}

.roadmap-dot span {
  font-size: 1.2rem;
}

.roadmap-card {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--roadmap-accent) 42%, var(--panel-border));
  border-radius: 14px;
  padding: 0.78rem 0.82rem;
  background: linear-gradient(
    152deg,
    color-mix(in srgb, var(--roadmap-accent) 12%, rgba(255, 255, 255, 0.9)),
    rgba(255, 255, 255, 0.62)
  );
  box-shadow: 0 10px 20px color-mix(in srgb, var(--roadmap-accent) 18%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.roadmap-item:hover .roadmap-card {
  transform: translateY(-2px);
  box-shadow: 0 14px 25px color-mix(in srgb, var(--roadmap-accent) 24%, transparent);
}

.phase {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--roadmap-accent) 76%, #3e5168 24%);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.roadmap-card h3 {
  margin-top: 0.36rem;
  font-size: 0.98rem;
}

.roadmap-card p {
  margin-top: 0.35rem;
  color: var(--text-sub);
  line-height: 1.45;
}

.roadmap-meta {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.34rem;
}

.roadmap-meta span {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  padding: 0.22rem 0.58rem;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 700;
  line-height: 1.35;
  color: color-mix(in srgb, var(--roadmap-accent) 75%, #243548 25%);
  background: color-mix(in srgb, var(--roadmap-accent) 16%, rgba(255, 255, 255, 0.86));
}

@media (max-width: 1024px) {
  .mission-grid {
    grid-template-columns: 1fr;
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .roadmap-line {
    display: none;
  }

  .roadmap {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .about-lab {
    min-height: calc(100vh - 68px);
    padding: 0.9rem 0.9rem 1.5rem;
  }

  .panel-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions .btn {
    width: 100%;
  }

  .module-grid,
  .split,
  .roadmap {
    grid-template-columns: 1fr;
  }

  .roadmap-item {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 0.62rem;
  }

  .roadmap-dot {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
