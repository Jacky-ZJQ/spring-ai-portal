<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'
import { computed, onBeforeUnmount, ref } from 'vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const router = useRouter()
const isRouteLoading = ref(false)

// 添加全局状态来跟踪当前路由
const currentRoute = ref(router.currentRoute.value.path)
const isHomeRoute = computed(() => currentRoute.value === '/')

// 添加全局路由守卫
const removeBeforeEachGuard = router.beforeEach((to, from, next) => {
  isRouteLoading.value = true
  // 如果是从 ChatPDF 页面离开
  if (from.path === '/chat-pdf') {
    // 触发一个自定义事件，让 ChatPDF 组件知道要清理资源
    window.dispatchEvent(new CustomEvent('cleanupChatPDF'))
  }
  currentRoute.value = to.path
  next()
})

const removeAfterEachGuard = router.afterEach(() => {
  isRouteLoading.value = false
})

const removeRouteErrorGuard = router.onError(() => {
  isRouteLoading.value = false
})

onBeforeUnmount(() => {
  removeBeforeEachGuard()
  removeAfterEachGuard()
  removeRouteErrorGuard()
})
</script>

<template>
  <div class="app" :class="{ 'dark': isDark, 'has-footer': isHomeRoute }">
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
    <div v-show="isRouteLoading" class="route-loading-bar" aria-hidden="true"></div>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <footer v-if="isHomeRoute" class="site-footer">
      <div class="footer-inner">
        <p class="footer-copy">© 2026 jackylab.online 版权所有</p>

        <div class="footer-records">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">粤ICP备2026021503号</a>
          <a
            href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=2026021503"
            target="_blank"
            rel="noreferrer"
            class="police-record"
          >
            <img src="/icons/police-badge.svg" alt="" aria-hidden="true" />
            <span>粤公网安备xxxxxx号</span>
          </a>
        </div>

        <div class="footer-links">
          <a href="mailto:zhangjianqi45@gmail.com">zhangjianqi45@gmail.com</a>
          <a href="https://github.com/Jacky-ZJQ" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://juejin.cn/user/3468295137136237" target="_blank" rel="noreferrer">掘金</a>
<!--          <span>微信可联系</span>-->
        </div>

      </div>
    </footer>
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

.app.has-footer {
  padding-bottom: 0;
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

.route-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 220;
  pointer-events: none;
  background: linear-gradient(90deg, #00a9b8 0%, #4ed6a5 30%, #2f88ff 65%, #ff8f4a 100%);
  background-size: 220% 100%;
  animation: routeLoadingFlow 1s linear infinite;
}

.site-footer {
  margin-top: auto;
  padding: 0.35rem clamp(1rem, 4vw, 3.5rem) 0.8rem;
  border-top: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2));
  position: relative;
}

.footer-inner {
  width: 100%;
  padding: 0.85rem 1.6rem 0.95rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  color: #516173;
  font-size: 0.92rem;
  position: relative;
  border-radius: 18px;
  border: 1px solid rgba(22, 36, 53, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.48));
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 40px rgba(20, 43, 70, 0.16);
  overflow: hidden;
}

.footer-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 0%, rgba(255, 180, 120, 0.16), transparent 55%),
    radial-gradient(circle at 85% 10%, rgba(88, 196, 255, 0.18), transparent 52%);
  opacity: 0.85;
  pointer-events: none;
  z-index: 0;
}

.footer-inner > * {
  position: relative;
  z-index: 1;
}

.footer-copy {
  margin: 0;
  font-weight: 600;
  color: #2b3745;
}

.footer-links,
.footer-records {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.footer-links a,
.footer-records a,
.footer-links span {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-links a:hover,
.footer-records a:hover {
  color: #0b8f5d;
}

.police-record {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
}

.police-record img {
  width: 18px;
  height: 18px;
}

.dark .footer-inner {
  color: #b6c7db;
  border-color: rgba(220, 236, 255, 0.12);
  background: linear-gradient(135deg, rgba(9, 17, 29, 0.62), rgba(7, 14, 26, 0.45));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.dark .site-footer {
  background: linear-gradient(180deg, rgba(7, 14, 26, 0), rgba(7, 14, 26, 0.38));
}

.dark .footer-inner::before {
  opacity: 0.55;
}

.dark .footer-copy {
  color: #e7f0fb;
}

.record-dock {
  position: fixed;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.34rem 0.72rem;
  border-radius: 999px;
  border: 1px solid rgba(12, 40, 65, 0.14);
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 8px 18px rgba(12, 34, 56, 0.12);
  backdrop-filter: blur(10px);
  z-index: 96;
}

.record-dock a {
  color: #37485a;
  text-decoration: none;
  font-size: 0.78rem;
  line-height: 1;
  white-space: nowrap;
}

.record-dock a:hover {
  color: #0b8f5d;
}

.dark .record-dock {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(7, 16, 28, 0.92);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
}

.dark .record-dock a {
  color: #c9d9ec;
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

@keyframes routeLoadingFlow {
  0% {
    background-position: 220% 0;
  }
  100% {
    background-position: -220% 0;
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

  .footer-inner {
    width: 100%;
    padding: 0.75rem 1rem 0.8rem;
    align-items: flex-start;
    border-radius: 14px;
    box-shadow: 0 12px 28px rgba(20, 43, 70, 0.14);
  }

  .footer-links,
  .footer-records {
    gap: 0.55rem 0.85rem;
  }

  .site-footer {
    padding: 0.3rem 1rem 0.6rem;
  }

  .record-dock {
    bottom: 8px;
    width: min(96vw, 620px);
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem 0.7rem;
    border-radius: 14px;
    padding: 0.4rem 0.58rem;
  }
}
</style>
