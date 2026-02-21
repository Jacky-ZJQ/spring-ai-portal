import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: () => import('../views/AIChat.vue')
  },
  {
    path: '/comfort-simulator',
    name: 'ComfortSimulator',
    component: () => import('../views/ComfortSimulator.vue')
  },
  {
    path: '/customer-service',
    name: 'CustomerService',
    component: () => import('../views/CustomerService.vue')
  },
  {
    path: '/chat-pdf',
    name: 'ChatPDF',
    component: () => import('../views/ChatPDF.vue')
  },
  {
    path: '/game',
    name: 'game',
    component: () => import('../views/GameChat.vue')
  },
  {
    path: '/mcp-gateway',
    name: 'McpGateway',
    component: () => import('../views/McpGateway.vue')
  },
  {
    path: '/skills',
    name: 'SkillsCenter',
    component: () => import('../views/SkillsCenter.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
