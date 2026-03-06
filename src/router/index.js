import { createRouter, createWebHistory } from 'vue-router'

const loadHomeView = () => import('../views/HomeView.vue')
const loadAIChatView = () => import('../views/AIChat.vue')
const loadGameChatView = () => import('../views/GameChat.vue')
const loadCustomerServiceView = () => import('../views/CustomerService.vue')
const loadChatPdfView = () => import('../views/ChatPDF.vue')
const loadMcpGatewayView = () => import('../views/McpGatewayView.vue')
const loadComingSoonView = () => import('../views/ComingSoonView.vue')
const loadSkillsDetailView = () => import('../views/SkillsDetailView.vue')
const loadAboutView = () => import('../views/AboutView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: loadHomeView,
  },
  {
    path: '/ai-chat',
    name: 'ai-chat',
    component: loadAIChatView,
  },
  {
    path: '/game',
    name: 'game',
    component: loadGameChatView,
  },
  {
    path: '/customer-service',
    name: 'customer-service',
    component: loadCustomerServiceView,
  },
  {
    path: '/chat-pdf',
    name: 'chat-pdf',
    component: loadChatPdfView,
  },
  {
    path: '/coming-soon/skills/:skillId',
    name: 'skills-detail',
    component: loadSkillsDetailView,
  },
  {
    // 需要放在 /coming-soon/:module 前面，否则会被通配路由匹配掉。
    path: '/coming-soon/mcp-gateway',
    name: 'mcp-gateway',
    component: loadMcpGatewayView,
  },
  {
    path: '/coming-soon/comfort-simulator',
    redirect: '/coming-soon/ai-knowledge-base',
  },
  {
    path: '/coming-soon/:module',
    name: 'coming-soon',
    component: loadComingSoonView,
  },
  {
    path: '/comfort-simulator',
    name: 'comfort-simulator',
    redirect: '/coming-soon/ai-knowledge-base',
  },
  {
    path: '/about',
    name: 'about',
    component: loadAboutView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

let hasPreloadedCoreRoutes = false

// 在首页空闲时预热高频页面，减少首次点击路由时的空白等待。
export const preloadCoreRoutes = async () => {
  if (hasPreloadedCoreRoutes) return
  hasPreloadedCoreRoutes = true
  await Promise.allSettled([
    loadAIChatView(),
    loadCustomerServiceView(),
    loadChatPdfView(),
  ])
}

export default router
