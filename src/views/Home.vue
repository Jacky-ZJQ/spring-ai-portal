<template>
  <div class="home" :class="{ 'dark': isDark }">
    <div class="container">
      <h1 class="title">Starbucks AI 应用中心</h1>
      <div class="cards-grid">
        <router-link 
          v-for="app in aiApps" 
          :key="app.id"
          :to="app.route"
          class="card"
        >
          <div class="card-content">
            <component :is="app.icon" :class="['icon', app.iconClass]" />
            <h2>{{ app.title }}</h2>
            <p>{{ app.description }}</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { 
  ChatBubbleLeftRightIcon,
  HeartIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CommandLineIcon,
  WrenchScrewdriverIcon
} from '@heroicons/vue/24/outline'

const isDark = useDark()

const aiApps = ref([
  {
    id: 1,
    title: 'AI 聊天',
    description: '【多模态】对话机器人，支持图片、音频等',
    route: '/ai-chat',
    icon: ChatBubbleLeftRightIcon
  },
  {
    id: 2,
    title: '哄哄模拟器',
    description: '【Prompt】一个帮助你练习哄老婆开心的小游戏',
    route: '/game',
    icon: HeartIcon,
    iconClass: 'heart-icon'
  },
  {
    id: 3,
    title: 'Starbucks智能客服',
    description: '【Function Calling】24小时在线的智能课程咨询师',
    route: '/customer-service',
    icon: UserGroupIcon
  },
  {
    id: 4,
    title: 'ChatPDF',
    description: '【RAG】打造你的个人知识库，与知识库自由对话',
    route: '/chat-pdf',
    icon: DocumentTextIcon
  },
  {
    id: 5,
    title: 'MCP网关',
    description: '【MCP】解决各类业务接口(http/rpc)便捷转换为MCP协议接口',
    route: '/mcp-gateway',
    icon: CommandLineIcon,
    iconClass: 'mcp-icon'
  },
  {
    id: 6,
      title: 'Skills中心',
      description: '【SKILLS】按技能配置切换不同 AI 助手能力',
      route: '/skills',
      icon: WrenchScrewdriverIcon,
      iconClass: 'skills-icon'
  }
])
</script>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-color);
  transition: background-color 0.3s;

  .container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    background: linear-gradient(90deg, #1c5e1f, #B2FF59);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: fadeIn 1s ease-out;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 2rem;
    justify-items: center;
    padding: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: 1200px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .card {
    position: relative;
    width: 100%;
    max-width: 320px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 2rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
      
      .dark & {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      color: #00C853;

      &.heart-icon {
        color: #ff4d4f;
        animation: pulse 1.5s ease-in-out infinite;
      }

      &.mcp-icon {
        color: #0ea5e9;
      }

      &.skills-icon {
        color: #f59e0b;
      }
    }

    h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    p {
      color: #666;
      font-size: 1rem;

      .dark & {
        color: #999;
      }
    }
  }

  &.dark {
    background: #1a1a1a;
    
    .card {
      background: rgba(255, 255, 255, 0.05);
      
      p {
        color: #999;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
    
    .container {
      padding: 0 1rem;
    }
    
    .title {
      font-size: 2rem;
    }

    .card {
      max-width: 100%;
    }
  }
}
</style>
