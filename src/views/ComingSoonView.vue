<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  CubeTransparentIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'

interface FeatureConfig {
  title: string
  subtitle: string
  eta: string
  tips: string[]
}

const route = useRoute()

const featureMap: Record<string, FeatureConfig> = {
  'mcp-gateway': {
    title: 'MCP网关',
    subtitle: '统一接入 HTTP/RPC 能力，自动转成 MCP 协议工具。',
    eta: '当前状态：建设中',
    tips: [
      '支持把已有业务 API 快速映射为 MCP Tools',
      '支持统一鉴权、参数校验和调用日志',
      '支持工具注册与在线调试'
    ]
  },
  mcp: {
    title: 'MCP网关',
    subtitle: '统一接入 HTTP/RPC 能力，自动转成 MCP 协议工具。',
    eta: '当前状态：建设中',
    tips: [
      '支持把已有业务 API 快速映射为 MCP Tools',
      '支持统一鉴权、参数校验和调用日志',
      '支持工具注册与在线调试'
    ]
  },
  skills: {
    title: 'SKILLS',
    subtitle: '把提示词、工具链和业务流程沉淀为可复用技能单元。',
    eta: '当前状态：建设中',
    tips: [
      '支持技能模板化与版本管理',
      '支持多技能编排与条件执行',
      '支持技能级别的效果评估与回放'
    ]
  },
  'comfort-simulator': {
    title: '舒适区突破器',
    subtitle: '把目标拆解成可执行的小步实验，并持续跟踪反馈。',
    eta: '当前状态：建设中',
    tips: [
      '支持目标拆解、行动卡片和周期复盘',
      '支持行为打卡与进度可视化',
      '支持关键阻塞点识别与提醒策略'
    ]
  }
}

const currentKey = computed(() => String(route.params.module || '').toLowerCase())

const feature = computed<FeatureConfig>(() => {
  return (
    featureMap[currentKey.value] || {
      title: '功能页面',
      subtitle: '该模块正在建设中，敬请期待。',
      eta: '当前状态：建设中',
      tips: ['功能定义中', '交互设计中', '开发排期中']
    }
  )
})

const featureIcon = computed(() => {
  if (currentKey.value.includes('mcp')) return CubeTransparentIcon
  if (currentKey.value.includes('comfort')) return SparklesIcon
  if (currentKey.value.includes('skills')) return SparklesIcon
  return WrenchScrewdriverIcon
})
</script>

<template>
  <main class="coming-soon-page">
    <section class="panel">
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
    radial-gradient(circle at 15% 15%, rgba(0, 169, 184, 0.15), transparent 35%),
    radial-gradient(circle at 85% 20%, rgba(255, 167, 74, 0.2), transparent 40%),
    linear-gradient(145deg, #eef7ff, #fff7ec);
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

:global(.dark) .coming-soon-page {
  background:
    radial-gradient(circle at 10% 15%, rgba(25, 170, 210, 0.16), transparent 35%),
    radial-gradient(circle at 85% 20%, rgba(255, 153, 88, 0.2), transparent 40%),
    linear-gradient(145deg, #111c28, #172536);
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
