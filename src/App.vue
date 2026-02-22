<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ref } from 'vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const router = useRouter()

// 添加全局状态来跟踪当前路由
const currentRoute = ref(router.currentRoute.value.path)

// 添加全局路由守卫
router.beforeEach((to, from, next) => {
  // 如果是从 ChatPDF 页面离开
  if (from.path === '/chat-pdf') {
    // 触发一个自定义事件，让 ChatPDF 组件知道要清理资源
    window.dispatchEvent(new CustomEvent('cleanupChatPDF'))
  }
  currentRoute.value = to.path
  next()
})
</script>

<template>
  <div class="app" :class="{ 'dark': isDark }">
    <nav class="navbar">
      <router-link to="/" class="logo">
        <span class="portal-badge">Spring AI Portal</span>
        <span class="logo-text">Jacky's AI DevSpace</span>
      </router-link>
      <div class="notice-float">
        <span class="notice-pill notice-full">公告：模型余额告急，小星提醒你省着点聊～</span>
        <span class="notice-pill notice-compact">余额告急，省着聊～</span>
      </div>
      <button @click="toggleDark()" class="theme-toggle">
        <SunIcon v-if="isDark" class="icon" />
        <MoonIcon v-else class="icon" />
      </button>
    </nav>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss">
:root {
  --bg-color: #f5f5f5;
  --text-color: #333;
}

.dark {
  --bg-color: #1a1a1a;
  --text-color: #fff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 1.38rem;
    font-weight: 700;
    text-decoration: none;
    color: unset;
  }

  .portal-badge {
    padding: 0.3rem 0.66rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: linear-gradient(135deg, rgba(0, 169, 184, 0.16), rgba(59, 178, 115, 0.18));
    border: 1px solid rgba(10, 130, 145, 0.26);
    color: #0f6f7d;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 4px 10px rgba(18, 84, 97, 0.14);
  }

  .logo-text {
    background: linear-gradient(92deg, #11c97d, #1ba080);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
  }

  .notice-pill {
    display: inline-flex;
    align-items: center;
    max-width: 34rem;
    padding: 0.27rem 0.62rem;
    border-radius: 999px;
    font-size: 0.73rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #9f4b13;
    background: linear-gradient(135deg, rgba(255, 172, 88, 0.2), rgba(255, 123, 102, 0.22));
    border: 1px solid rgba(216, 121, 54, 0.32);
    white-space: nowrap;
    box-shadow: 0 8px 20px rgba(186, 86, 32, 0.22);
    backdrop-filter: blur(8px);
    animation: noticeFloat 3.8s ease-in-out infinite;
  }

  .notice-compact {
    display: none;
  }

  .notice-float {
    position: absolute;
    right: 4.2rem;
    top: 0.2rem;
    z-index: 3;
    pointer-events: none;
  }

  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.3s;
    z-index: 4;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .icon {
      width: 24px;
      height: 24px;
      color: var(--text-color);
    }
  }

  .dark & {
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .portal-badge {
      background: linear-gradient(135deg, rgba(0, 177, 196, 0.24), rgba(66, 206, 149, 0.22));
      border-color: rgba(110, 214, 225, 0.45);
      color: #cbf7ff;
      box-shadow: inset 0 0 0 1px rgba(193, 241, 255, 0.22), 0 6px 12px rgba(0, 0, 0, 0.18);
    }

    .notice-pill {
      color: #ffd5bd;
      background: linear-gradient(135deg, rgba(255, 146, 96, 0.22), rgba(255, 90, 132, 0.22));
      border-color: rgba(255, 167, 140, 0.38);
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.28);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes noticeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;

    .logo {
      gap: 0.45rem;
      font-size: 1.02rem;
      align-items: center;
    }

    .portal-badge {
      font-size: 0.62rem;
      padding: 0.25rem 0.54rem;
    }

    .notice-full {
      display: none;
    }

    .notice-compact {
      display: inline-flex;
      max-width: 9.4rem;
      font-size: 0.66rem;
      padding: 0.22rem 0.52rem;
    }

    .notice-float {
      right: 3.2rem;
      top: 0.22rem;
    }
  }
}
</style>
