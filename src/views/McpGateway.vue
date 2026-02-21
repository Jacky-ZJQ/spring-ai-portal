<template>
  <div class="mcp-page" :class="{ dark: isDark }">
    <div class="container">
      <section class="panel controls">
        <h2>MCP 网关</h2>
        <p class="hint">通过 JSON-RPC 测试后端 MCP 协议能力。</p>

        <label class="field">
          <span>Client Name</span>
          <input v-model="clientName" type="text" />
        </label>

        <label class="field">
          <span>Client Version</span>
          <input v-model="clientVersion" type="text" />
        </label>

        <label class="field">
          <span>Protocol Version</span>
          <input v-model="requestProtocolVersion" type="text" />
        </label>

        <div class="session-state">
          <div><strong>Session:</strong> {{ sessionId || '未建立' }}</div>
          <div><strong>Protocol:</strong> {{ protocolVersion || '未协商' }}</div>
          <div><strong>Ready:</strong> {{ initialized ? 'yes' : 'no' }}</div>
        </div>

        <div class="actions">
          <button :disabled="loading" @click="initialize">初始化</button>
          <button :disabled="!initialized || loading" @click="ping">Ping</button>
          <button :disabled="!initialized || loading" @click="loadTools">加载工具</button>
          <button :disabled="loading" @click="resetSession">重置会话</button>
        </div>

        <label class="field">
          <span>工具</span>
          <select v-model="selectedTool">
            <option value="" disabled>请选择工具</option>
            <option v-for="tool in tools" :key="tool.name" :value="tool.name">
              {{ tool.name }} ({{ tool.source || 'UNKNOWN' }})
            </option>
          </select>
        </label>
        <div v-if="selectedToolMeta" class="tool-meta">
          来源：<code>{{ selectedToolMeta.source || 'UNKNOWN' }}</code>
        </div>

        <label class="field">
          <span>参数(JSON)</span>
          <textarea v-model="toolArgsText" rows="9"></textarea>
        </label>

        <button class="primary" :disabled="loading || !selectedTool || !initialized" @click="callTool">
          {{ loading ? '调用中...' : '调用工具' }}
        </button>
      </section>

      <section class="panel outputs">
        <h3>工具列表</h3>
        <pre>{{ prettyTools }}</pre>

        <h3>最近响应</h3>
        <pre>{{ output }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useDark } from '@vueuse/core'
import { chatAPI } from '../services/api'

const SESSION_STORAGE_KEY = 'mcp_gateway_session_v1'
const defaultProtocolVersion = import.meta.env.VITE_MCP_PROTOCOL_VERSION || '2025-11-05'

const isDark = useDark()
const tools = ref([])
const selectedTool = ref('')
const toolArgsText = ref('{}')
const output = ref('等待调用...')
const loading = ref(false)
const sessionId = ref('')
const protocolVersion = ref('')
const initialized = ref(false)

const clientName = ref('spring-ai-protal')
const clientVersion = ref('0.1.0')
const requestProtocolVersion = ref(defaultProtocolVersion)

const prettyTools = computed(() => JSON.stringify(tools.value, null, 2))
const selectedToolMeta = computed(() => tools.value.find(item => item.name === selectedTool.value) || null)
const prettyPrint = (value) => JSON.stringify(value, null, 2)

const saveSession = () => {
  const payload = {
    sessionId: sessionId.value,
    protocolVersion: protocolVersion.value,
    initialized: initialized.value
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
}

const restoreSession = () => {
  const text = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!text) {
    return
  }
  try {
    const payload = JSON.parse(text)
    sessionId.value = payload.sessionId || ''
    protocolVersion.value = payload.protocolVersion || ''
    initialized.value = Boolean(payload.initialized && payload.sessionId && payload.protocolVersion)
  } catch (_) {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

const resetSession = () => {
  sessionId.value = ''
  protocolVersion.value = ''
  initialized.value = false
  tools.value = []
  selectedTool.value = ''
  toolArgsText.value = '{}'
  localStorage.removeItem(SESSION_STORAGE_KEY)
  output.value = '会话已重置。'
}

const buildToolArgsTemplate = (tool) => {
  const schema = tool?.inputSchema || {}
  const properties = schema.properties || {}
  const requiredSet = new Set(Array.isArray(schema.required) ? schema.required : [])

  const template = {}
  Object.entries(properties).forEach(([key, definition]) => {
    const type = definition?.type
    if (requiredSet.has(key)) {
      template[key] = type === 'integer' || type === 'number' ? 0 : ''
      return
    }
    if (type === 'integer' || type === 'number') {
      template[key] = 0
      return
    }
    template[key] = ''
  })
  return template
}

watch(selectedTool, (name) => {
  const tool = tools.value.find(item => item.name === name)
  if (!tool) {
    return
  }
  // 每次切换工具都重置参数模板，避免沿用上一个工具的参数结构。
  toolArgsText.value = prettyPrint(buildToolArgsTemplate(tool))
})

const initialize = async () => {
  loading.value = true
  try {
    const initRes = await chatAPI.mcpInitialize(
      { name: clientName.value.trim() || 'spring-ai-protal', version: clientVersion.value.trim() || '0.1.0' },
      requestProtocolVersion.value.trim() || defaultProtocolVersion
    )

    sessionId.value = initRes.sessionId || ''
    protocolVersion.value = initRes.result?.protocolVersion || initRes.protocolVersion || ''
    if (!sessionId.value || !protocolVersion.value) {
      throw new Error('初始化未返回会话信息')
    }

    await chatAPI.mcpInitialized(sessionId.value, protocolVersion.value)
    initialized.value = true
    saveSession()
    output.value = prettyPrint({
      initialize: initRes,
      notification: 'notifications/initialized sent'
    })
  } catch (error) {
    initialized.value = false
    output.value = `初始化失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

const ping = async () => {
  if (!initialized.value) {
    return
  }
  loading.value = true
  try {
    const res = await chatAPI.mcpPing(sessionId.value, protocolVersion.value)
    output.value = prettyPrint(res)
  } catch (error) {
    output.value = `Ping失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

const loadTools = async () => {
  if (!initialized.value) {
    output.value = '请先初始化 MCP 会话'
    return
  }
  loading.value = true
  try {
    const res = await chatAPI.mcpListTools(sessionId.value, protocolVersion.value)
    const list = res?.result?.tools || []
    tools.value = Array.isArray(list) ? list : []
    if (!selectedTool.value && tools.value.length > 0) {
      selectedTool.value = tools.value[0].name
      toolArgsText.value = prettyPrint(buildToolArgsTemplate(tools.value[0]))
    }
    output.value = prettyPrint(res)
  } catch (error) {
    output.value = `加载工具失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

const callTool = async () => {
  if (!selectedTool.value || !initialized.value) {
    return
  }

  let args = {}
  try {
    args = toolArgsText.value ? JSON.parse(toolArgsText.value) : {}
  } catch (error) {
    output.value = `参数 JSON 解析失败: ${error.message}`
    return
  }

  loading.value = true
  try {
    const res = await chatAPI.mcpCallTool(
      selectedTool.value,
      args,
      sessionId.value,
      protocolVersion.value
    )
    output.value = prettyPrint(res)
  } catch (error) {
    output.value = `调用失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  restoreSession()
  if (initialized.value) {
    output.value = '已恢复上次 MCP 会话，可直接加载工具或调用。'
  }
})
</script>

<style scoped lang="scss">
.mcp-page {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.25rem;
  background: var(--bg-color);

  .container {
    height: 100%;
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 1rem;
  }

  .panel {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 1rem;
    overflow: auto;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .hint {
      color: #666;
      font-size: 0.9rem;
    }

    .session-state {
      font-size: 0.85rem;
      line-height: 1.6;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      padding: 0.6rem;
      background: rgba(0, 0, 0, 0.02);
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;

      input,
      select,
      textarea {
        border: 1px solid rgba(0, 0, 0, 0.18);
        border-radius: 8px;
        padding: 0.6rem;
        font: inherit;
      }
    }

    .tool-meta {
      font-size: 0.8rem;
      color: #64748b;

      code {
        font-size: 0.78rem;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        background: rgba(15, 23, 42, 0.08);
      }
    }

    button {
      border: none;
      border-radius: 8px;
      padding: 0.65rem 0.8rem;
      cursor: pointer;
      background: #e5e7eb;
    }

    .primary {
      background: #0ea5e9;
      color: #fff;
    }
  }

  .outputs {
    h3 {
      margin-bottom: 0.5rem;
      margin-top: 1rem;
    }

    h3:first-child {
      margin-top: 0;
    }

    pre {
      background: rgba(15, 23, 42, 0.06);
      border-radius: 8px;
      padding: 0.8rem;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  &.dark {
    .panel {
      background: rgba(20, 20, 20, 0.8);
    }

    .controls {
      .hint {
        color: #b0b0b0;
      }

      .field {
        input,
        select,
        textarea {
          background: #1f1f1f;
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }
      }

      .tool-meta {
        color: #94a3b8;

        code {
          background: rgba(255, 255, 255, 0.12);
        }
      }

      button {
        background: #2a2a2a;
        color: #fff;
      }

      .session-state {
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.06);
      }
    }

    .outputs pre {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

@media (max-width: 960px) {
  .mcp-page {
    .container {
      grid-template-columns: 1fr;
      grid-template-rows: 520px 1fr;
    }
  }
}
</style>
