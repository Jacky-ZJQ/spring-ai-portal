import { createRouter, createWebHistory } from 'vue-router'

const loadHomeView = () => import('../views/HomeView.vue')
const loadAIChatView = () => import('../views/AIChat.vue')
const loadGameChatView = () => import('../views/GameChat.vue')
const loadCustomerServiceView = () => import('../views/CustomerService.vue')
const loadChatPdfView = () => import('../views/ChatPDF.vue')
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
    path: '/coming-soon/:module',
    name: 'coming-soon',
    component: loadComingSoonView,
  },
  {
    path: '/comfort-simulator',
    name: 'comfort-simulator',
    redirect: '/coming-soon/comfort-simulator',
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
