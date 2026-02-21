<template>
  <div class="skills-page" :class="{ dark: isDark }">
    <div class="container">
      <aside class="skills-panel">
        <div class="panel-header">
          <SparklesIcon class="icon" />
          <h2>Skills</h2>
        </div>

        <div class="skills-list">
          <button
            v-for="skill in skills"
            :key="skill.code"
            class="skill-item"
            :class="{ active: selectedSkillCode === skill.code }"
            @click="switchSkill(skill)"
          >
            <div class="name">{{ skill.name }}</div>
            <div class="desc">{{ skill.description }}</div>
            <div class="meta">模式：{{ skill.mode }}</div>
          </button>
        </div>
      </aside>

      <section class="chat-panel">
        <div class="chat-header">
          <h3>{{ selectedSkill?.name || '未选择技能' }}</h3>
          <p>{{ selectedSkill?.description || '请选择一个技能开始对话' }}</p>
          <p v-if="chatId" class="chat-id">会话ID：{{ chatId }}</p>
        </div>

        <div class="messages" ref="messagesRef">
          <ChatMessage
            v-for="(message, index) in messages"
            :key="index"
            :message="message"
            :is-stream="isStreaming && index === messages.length - 1"
          />
        </div>

        <div class="input-area">
          <textarea
            ref="inputRef"
            v-model="userInput"
            rows="1"
            :disabled="!selectedSkill || isStreaming"
            placeholder="输入你的问题..."
            @input="adjustTextareaHeight"
            @keydown.enter.prevent="sendMessage"
          ></textarea>
          <button
            class="send-btn"
            :disabled="!selectedSkill || isStreaming || !userInput.trim()"
            @click="sendMessage"
          >
            <PaperAirplaneIcon class="icon" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useDark } from '@vueuse/core'
import { SparklesIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import ChatMessage from '../components/ChatMessage.vue'
import { chatAPI } from '../services/api'

const isDark = useDark()
const skills = ref([])
const selectedSkill = ref(null)
const selectedSkillCode = ref('')
const userInput = ref('')
const isStreaming = ref(false)
const messages = ref([])
const chatId = ref('')
const messagesRef = ref(null)
const inputRef = ref(null)
const skillSessions = ref({})

const buildWelcomeMessage = (skill) => ({
  role: 'assistant',
  content: skill?.welcomeMessage || `已切换技能：${skill?.name || ''}，你可以开始提问了。`,
  timestamp: new Date()
})

const cloneMessages = (list = []) =>
  list.map(item => ({
    role: item.role,
    content: item.content,
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
  }))

const historyPrefix = (skill) => {
  const prefix = skill?.conversationPrefix || 'skill'
  return `${prefix}_${skill?.code || ''}_`
}

const extractTimestamp = (id = '') => {
  const idx = id.lastIndexOf('_')
  if (idx < 0) {
    return 0
  }
  const value = Number(id.slice(idx + 1))
  return Number.isFinite(value) ? value : 0
}

const adjustTextareaHeight = () => {
  const textarea = inputRef.value
  if (!textarea) {
    return
  }
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const persistCurrentSession = () => {
  if (!selectedSkillCode.value) {
    return
  }
  skillSessions.value[selectedSkillCode.value] = {
    chatId: chatId.value,
    messages: cloneMessages(messages.value)
  }
}

const restoreSessionFromServer = async (skill) => {
  const historyList = await chatAPI.getChatHistory('skill')
  const prefix = historyPrefix(skill)
  const matched = historyList
    .map(item => item.id)
    .filter(id => typeof id === 'string' && id.startsWith(prefix))
    .sort((a, b) => extractTimestamp(b) - extractTimestamp(a))

  if (!matched.length) {
    return null
  }

  const latestChatId = matched[0]
  const historyMessages = await chatAPI.getChatMessages(latestChatId, 'skill')
  const restoredMessages = historyMessages
    .filter(item => item && item.content)
    .map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content,
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
    }))

  if (!restoredMessages.length) {
    return null
  }

  return {
    chatId: latestChatId,
    messages: restoredMessages
  }
}

const switchSkill = async (skill) => {
  if (isStreaming.value) {
    return
  }

  persistCurrentSession()
  selectedSkill.value = skill
  selectedSkillCode.value = skill.code

  const cached = skillSessions.value[skill.code]
  if (cached?.messages?.length) {
    chatId.value = cached.chatId || ''
    messages.value = cloneMessages(cached.messages)
    await scrollToBottom()
    return
  }

  const restored = await restoreSessionFromServer(skill)
  if (restored) {
    chatId.value = restored.chatId
    messages.value = cloneMessages(restored.messages)
    skillSessions.value[skill.code] = {
      chatId: restored.chatId,
      messages: cloneMessages(restored.messages)
    }
  } else {
    chatId.value = ''
    messages.value = [buildWelcomeMessage(skill)]
    skillSessions.value[skill.code] = {
      chatId: '',
      messages: cloneMessages(messages.value)
    }
  }
  await scrollToBottom()
}

const loadSkills = async () => {
  const list = await chatAPI.getSkills()
  skills.value = Array.isArray(list) ? list : []
  if (skills.value.length > 0) {
    await switchSkill(skills.value[0])
  }
}

const sendMessage = async () => {
  if (!selectedSkill.value || isStreaming.value || !userInput.value.trim()) {
    return
  }

  const prompt = userInput.value.trim()
  userInput.value = ''
  adjustTextareaHeight()

  messages.value.push({
    role: 'user',
    content: prompt,
    timestamp: new Date()
  })

  messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: new Date()
  })

  await scrollToBottom()
  isStreaming.value = true

  try {
    const streamResult = await chatAPI.sendSkillMessage(prompt, chatId.value, selectedSkillCode.value)
    if (streamResult.chatId) {
      chatId.value = streamResult.chatId
    }

    const decoder = new TextDecoder('utf-8')
    let accumulated = ''

    while (true) {
      const { done, value } = await streamResult.reader.read()
      if (done) {
        break
      }
      accumulated += decoder.decode(value)
      messages.value[messages.value.length - 1] = {
        role: 'assistant',
        content: accumulated,
        timestamp: new Date()
      }
      await scrollToBottom()
    }
  } catch (error) {
    messages.value[messages.value.length - 1] = {
      role: 'assistant',
      content: `技能调用失败：${error.message || '请稍后重试'}`,
      timestamp: new Date()
    }
  } finally {
    persistCurrentSession()
    isStreaming.value = false
    await scrollToBottom()
  }
}

onMounted(async () => {
  await loadSkills()
  adjustTextareaHeight()
})
</script>

<style scoped lang="scss">
.skills-page {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.25rem;
  background: var(--bg-color);
  overflow: hidden;

  .container {
    height: 100%;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1rem;
    min-height: 0;
  }

  .skills-panel {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .panel-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);

      .icon {
        width: 20px;
        height: 20px;
        color: #f59e0b;
      }
    }

    .skills-list {
      overflow: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .skill-item {
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 10px;
        background: #fff;
        text-align: left;
        padding: 0.75rem;
        cursor: pointer;

        .name {
          font-weight: 600;
          margin-bottom: 0.2rem;
        }

        .desc {
          font-size: 0.85rem;
          color: #666;
        }

        .meta {
          margin-top: 0.4rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        &.active {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
        }
      }
    }
  }

  .chat-panel {
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);

      p {
        margin-top: 0.25rem;
        color: #666;
      }

      .chat-id {
        font-size: 0.75rem;
        color: #94a3b8;
        word-break: break-all;
      }
    }

    .messages {
      flex: 1;
      overflow: auto;
      padding: 1rem;
      min-height: 0;
    }

    .input-area {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      position: sticky;
      bottom: 0;
      background: inherit;
      z-index: 2;

      textarea {
        flex: 1;
        min-height: 44px;
        max-height: 180px;
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        padding: 0.75rem;
        resize: none;
        font: inherit;
      }

      .send-btn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 10px;
        background: #f59e0b;
        color: #fff;
        cursor: pointer;
        display: grid;
        place-items: center;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon {
          width: 20px;
          height: 20px;
        }
      }
    }
  }

  &.dark {
    .skills-panel,
    .chat-panel {
      background: rgba(20, 20, 20, 0.8);
    }

    .skills-panel {
      .panel-header {
        border-bottom-color: rgba(255, 255, 255, 0.12);
      }

      .skills-list .skill-item {
        background: #1f1f1f;
        border-color: rgba(255, 255, 255, 0.18);

        .desc {
          color: #b0b0b0;
        }
      }
    }

    .chat-panel {
      .chat-header,
      .input-area {
        border-color: rgba(255, 255, 255, 0.12);
      }

      .chat-header p {
        color: #b0b0b0;
      }

      .input-area textarea {
        background: #1f1f1f;
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }
  }

  @media (max-width: 960px) {
    .container {
      grid-template-columns: 1fr;
      grid-template-rows: 240px 1fr;
    }
  }
}
</style>
