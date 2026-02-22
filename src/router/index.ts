import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/ai-chat',
    name: 'ai-chat',
    component: () => import('../views/AIChat.vue'),
  },
  {
    path: '/game',
    name: 'game',
    component: () => import('../views/GameChat.vue'),
  },
  {
    path: '/customer-service',
    name: 'customer-service',
    component: () => import('../views/CustomerService.vue'),
  },
  {
    path: '/chat-pdf',
    name: 'chat-pdf',
    component: () => import('../views/ChatPDF.vue'),
  },
  {
    path: '/comfort-simulator',
    name: 'comfort-simulator',
    component: () => import('../views/ComfortSimulator.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
