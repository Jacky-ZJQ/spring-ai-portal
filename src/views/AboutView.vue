<script setup>
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { chatAPI } from '../services/api.js'

const isDark = useDark()
const releasingMemory = ref(false)
const cleaningFiles = ref(false)
const maintenanceError = ref('')
const maintenanceResult = ref(null)

const labModules = [
  {
    title: 'AI 聊天',
    subtitle: '多模态对话入口，快速验证创意和问题。',
    status: '已上线',
    route: '/ai-chat',
    accent: '#00a9b8',
  },
  {
    title: '智能客服',
    subtitle: '星巴克课程咨询与预约，覆盖业务函数调用。',
    status: '已上线',
    route: '/customer-service',
    accent: '#3bb273',
  },
  {
    title: 'ChatPDF',
    subtitle: '文档上传、向量检索、问答追问的一体化入口。',
    status: '已上线',
    route: '/chat-pdf',
    accent: '#2f88ff',
  },
  {
    title: 'MCP 网关',
    subtitle: '把 HTTP/RPC 接口统一暴露为 MCP 能力层。',
    status: '建设中',
    route: '/coming-soon/mcp-gateway',
    accent: '#0ea5e9',
  },
  {
    title: 'Skills',
    subtitle: '沉淀可复用技能，降低复杂任务交付成本。',
    status: '建设中',
    route: '/coming-soon/skills',
    accent: '#f59e0b',
  },
  {
    title: '舒适区突破器',
    subtitle: '把目标拆解为行动任务，帮助稳定执行。',
    status: '建设中',
    route: '/coming-soon/comfort-simulator',
    accent: '#efb91f',
  },
]

const roadmap = [
  {
    phase: 'Phase 01',
    title: '基础设施稳定',
    detail: '统一 Docker 部署、环境配置模板、上线与回滚 SOP。',
  },
  {
    phase: 'Phase 02',
    title: '业务能力打通',
    detail: '完成聊天、知识库、预约流程的闭环，并沉淀可复用接口。',
  },
  {
    phase: 'Phase 03',
    title: '工程效率提升',
    detail: '补齐日志追踪、异常告警、可观测看板和安全策略。',
  },
  {
    phase: 'Phase 04',
    title: '产品化与增长',
    detail: '打磨体验与性能，扩展更多可落地的行业场景模块。',
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
        这是 Jacky 的 AI 实验主站，目标不是“做一个演示”，而是把每个想法快速变成可运行、可验证、可上线的产品能力。
      </p>
      <div class="hero-actions">
        <router-link to="/" class="btn btn-primary">返回首页</router-link>
        <router-link to="/ai-chat" class="btn btn-secondary">直接开始实验</router-link>
      </div>
    </section>

    <section class="panel ops-panel">
      <div class="panel-head">
        <h2>运行维护</h2>
        <span class="chip">Operations</span>
      </div>
      <p class="ops-tip">
        可在页面内手动释放后端内存，或立即触发一次过期 PDF/图片清理，无需 SSH 登录服务器。
      </p>
      <div class="ops-actions">
        <button class="btn btn-primary" :disabled="releasingMemory" @click="runReleaseMemory">
          {{ releasingMemory ? '释放中...' : '手动释放内存' }}
        </button>
        <button class="btn btn-secondary" :disabled="cleaningFiles" @click="runCleanupFiles">
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
          <p class="module-status">{{ module.status }}</p>
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
      <div class="roadmap">
        <article v-for="item in roadmap" :key="item.phase" class="roadmap-item">
          <p class="phase">{{ item.phase }}</p>
          <h3>{{ item.title }}</h3>
          <p>{{ item.detail }}</p>
        </article>
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
  color: color-mix(in srgb, var(--accent) 70%, #2f3b4f 30%);
  font-weight: 700;
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

.roadmap {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.roadmap-item {
  border: 1px solid var(--panel-border);
  border-radius: 14px;
  padding: 0.78rem 0.82rem;
  background: rgba(255, 255, 255, 0.5);
}

.phase {
  font-size: 0.72rem;
  color: #3789b2;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.roadmap-item h3 {
  margin-top: 0.36rem;
  font-size: 0.98rem;
}

.roadmap-item p {
  margin-top: 0.35rem;
  color: var(--text-sub);
  line-height: 1.45;
}

@media (max-width: 1024px) {
  .mission-grid {
    grid-template-columns: 1fr;
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
}
</style>
