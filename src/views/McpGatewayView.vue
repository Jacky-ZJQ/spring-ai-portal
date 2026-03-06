<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  batchMcpGatewayTools,
  connectMcpGatewayServer,
  createMcpGatewayServer,
  deleteMcpGatewayServer,
  disconnectMcpGatewayServer,
  getMcpGatewayServerDetail,
  listMcpGatewayServers,
  patchMcpGatewayTool,
  pingMcpGatewayServer,
  syncMcpGatewayTools,
  updateMcpGatewayServer,
} from '../services/mcpGateway'
import type {
  McpConnectionType,
  McpGatewayServerCreateRequest,
  McpGatewayServerDetail,
  McpGatewayServerListItem,
  McpGatewayToolItem,
} from '../types/mcp-gateway'

interface CreateFormState {
  serverName: string
  connectionType: McpConnectionType
  connectionUrl: string
  sseEndpoint: string
  stdioCommand: string
  stdioArgsText: string
  stdioEnvText: string
  isCodeClient: boolean
  isPingAvailable: boolean
  authType: string
  enabled: boolean
  toolSyncIntervalMinutes: number
}

// 新建/编辑弹窗共享的一份默认表单结构。
const createDefaultForm = (): CreateFormState => ({
  serverName: '',
  connectionType: 'HTTP',
  connectionUrl: '/api/mcp',
  sseEndpoint: '',
  stdioCommand: '',
  stdioArgsText: '[]',
  stdioEnvText: '{}',
  isCodeClient: false,
  isPingAvailable: true,
  authType: 'none',
  enabled: true,
  toolSyncIntervalMinutes: 10,
})

// 页面级状态：列表操作、创建弹窗、详情弹窗、编辑弹窗分别独立 loading，避免互相影响。
const listLoading = ref(false)
const actionLoading = ref(false)
const createSaving = ref(false)
const message = ref('')
const error = ref('')
const createMessage = ref('')
const createError = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const detailLoading = ref(false)
const detailActionLoading = ref(false)
const editLoading = ref(false)
const editSaving = ref(false)
const detailError = ref('')
const editError = ref('')
const editServerId = ref<number | null>(null)
const detailServer = ref<McpGatewayServerDetail | null>(null)
const toolCostInputMap = reactive<Record<string, string>>({})
const servers = ref<McpGatewayServerListItem[]>([])
const createForm = reactive<CreateFormState>(createDefaultForm())
const editForm = reactive<CreateFormState>(createDefaultForm())
const detailTools = computed(() => detailServer.value?.tools || [])
// 顶部批量开关状态来源于当前详情工具列表。
const allToolsEnabled = computed(
  () => detailTools.value.length > 0 && detailTools.value.every((tool) => tool.enabled)
)
const allToolsAutoExecute = computed(
  () => detailTools.value.length > 0 && detailTools.value.every((tool) => tool.autoExecute)
)

const resetNotice = () => {
  message.value = ''
  error.value = ''
}

const setMessage = (text: string) => {
  error.value = ''
  message.value = text
}

const setError = (text: string) => {
  message.value = ''
  error.value = text
}

const resetCreateNotice = () => {
  createMessage.value = ''
  createError.value = ''
}

const setCreateMessage = (text: string) => {
  createError.value = ''
  createMessage.value = text
}

const setCreateError = (text: string) => {
  createMessage.value = ''
  createError.value = text
}

const statusLabel = (status: string) => {
  if (status === 'CONNECTED') return '已连接'
  if (status === 'ERROR') return '连接失败'
  return '已断开连接'
}

const statusClass = (status: string) => {
  if (status === 'CONNECTED') return 'status-connected'
  if (status === 'ERROR') return 'status-error'
  return 'status-disconnected'
}

const connectionTypeLabel = (type: McpConnectionType) => {
  if (type === 'HTTP') return 'HTTP'
  if (type === 'SSE') return 'SSE'
  return 'STDIO'
}

const formatJson = (value: any) => {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch (_err) {
    return '{}'
  }
}

const parseJsonText = <T>(text: string, fallback: T, label: string): T => {
  const trimmed = text.trim()
  if (!trimmed) return fallback
  try {
    return JSON.parse(trimmed) as T
  } catch (_err) {
    throw new Error(`${label} JSON 格式不正确`)
  }
}

const refreshServerList = async () => {
  listLoading.value = true
  error.value = ''
  try {
    const list = await listMcpGatewayServers()
    servers.value = Array.isArray(list) ? list : []
  } catch (err: any) {
    // 列表接口异常时降级为空数组，避免把后端 500 直接暴露给用户。
    console.warn('加载 MCP 服务器列表失败，已回退为空列表。', err)
    servers.value = []
  } finally {
    listLoading.value = false
  }
}

// 打开创建弹窗时重置为干净表单，避免带入上次输入残留。
const openCreateModal = () => {
  resetNotice()
  resetCreateNotice()
  Object.assign(createForm, createDefaultForm())
  showCreateModal.value = true
}

const closeCreateModal = () => {
  if (createSaving.value) return
  showCreateModal.value = false
}

const closeEditModal = () => {
  if (editLoading.value || editSaving.value) return
  showEditModal.value = false
}

const closeDetailModal = () => {
  if (detailLoading.value || detailActionLoading.value) return
  showDetailModal.value = false
}

const hydrateToolCostInputs = (detail: McpGatewayServerDetail) => {
  // 维护一个独立输入缓存，支持成本输入框的“输入中”状态。
  const keep = new Set(detail.tools.map((tool) => tool.toolName))
  Object.keys(toolCostInputMap).forEach((name) => {
    if (!keep.has(name)) {
      delete toolCostInputMap[name]
    }
  })
  detail.tools.forEach((tool) => {
    toolCostInputMap[tool.toolName] = Number(tool.costUsd || 0).toFixed(2)
  })
}

const loadServerDetail = async (id: number) => {
  detailError.value = ''
  detailLoading.value = true
  try {
    const detail = await getMcpGatewayServerDetail(id)
    detailServer.value = detail
    hydrateToolCostInputs(detail)
  } catch (err: any) {
    detailError.value = err.message || '加载详情失败'
  } finally {
    detailLoading.value = false
  }
}

const updateListToolCounts = (serverId: number, tools: McpGatewayToolItem[]) => {
  const row = servers.value.find((item) => item.id === serverId)
  if (!row) return
  row.totalToolCount = tools.length
  row.enabledToolCount = tools.filter((tool) => tool.enabled).length
  row.autoExecuteToolCount = tools.filter((tool) => tool.autoExecute).length
}

const applyDetailTools = (tools: McpGatewayToolItem[]) => {
  if (!detailServer.value) return
  // 只替换工具片段，不重新拉整页详情，避免开关点击时界面闪烁。
  detailServer.value = {
    ...detailServer.value,
    tools: tools.map((tool) => ({ ...tool })),
  }
  hydrateToolCostInputs(detailServer.value)
  updateListToolCounts(detailServer.value.id, detailServer.value.tools)
}

const buildCreatePayload = (): McpGatewayServerCreateRequest => {
  if (!createForm.serverName.trim()) {
    throw new Error('请填写服务器名称')
  }

  if (createForm.connectionType !== 'STDIO' && !createForm.connectionUrl.trim()) {
    throw new Error('请填写连接 URL')
  }

  if (createForm.connectionType === 'STDIO' && !createForm.stdioCommand.trim()) {
    throw new Error('STDIO 模式需填写命令')
  }

  const stdioArgs =
    createForm.connectionType === 'STDIO'
      ? parseJsonText<string[]>(createForm.stdioArgsText, [], 'STDIO 参数')
      : []
  const stdioEnv =
    createForm.connectionType === 'STDIO'
      ? parseJsonText<Record<string, string>>(createForm.stdioEnvText, {}, 'STDIO 环境变量')
      : {}

  return {
    serverName: createForm.serverName.trim(),
    connectionType: createForm.connectionType,
    connectionUrl: createForm.connectionType === 'STDIO' ? undefined : createForm.connectionUrl.trim(),
    sseEndpoint: createForm.connectionType === 'SSE' ? createForm.sseEndpoint.trim() || undefined : undefined,
    stdioCommand: createForm.connectionType === 'STDIO' ? createForm.stdioCommand.trim() : undefined,
    stdioArgs,
    stdioEnv,
    isCodeClient: createForm.isCodeClient,
    isPingAvailable: createForm.isPingAvailable,
    authType: createForm.authType,
    enabled: createForm.enabled,
    toolSyncIntervalMinutes: createForm.toolSyncIntervalMinutes,
  }
}

const buildPayloadFromForm = (form: CreateFormState): McpGatewayServerCreateRequest => {
  // 编辑保存走同一套入参构建逻辑，保证校验一致。
  if (!form.serverName.trim()) {
    throw new Error('请填写服务器名称')
  }
  if (form.connectionType !== 'STDIO' && !form.connectionUrl.trim()) {
    throw new Error('请填写连接 URL')
  }
  if (form.connectionType === 'STDIO' && !form.stdioCommand.trim()) {
    throw new Error('STDIO 模式需填写命令')
  }

  const stdioArgs =
    form.connectionType === 'STDIO'
      ? parseJsonText<string[]>(form.stdioArgsText, [], 'STDIO 参数')
      : []
  const stdioEnv =
    form.connectionType === 'STDIO'
      ? parseJsonText<Record<string, string>>(form.stdioEnvText, {}, 'STDIO 环境变量')
      : {}

  return {
    serverName: form.serverName.trim(),
    connectionType: form.connectionType,
    connectionUrl: form.connectionType === 'STDIO' ? undefined : form.connectionUrl.trim(),
    sseEndpoint: form.connectionType === 'SSE' ? form.sseEndpoint.trim() || undefined : undefined,
    stdioCommand: form.connectionType === 'STDIO' ? form.stdioCommand.trim() : undefined,
    stdioArgs,
    stdioEnv,
    isCodeClient: form.isCodeClient,
    isPingAvailable: form.isPingAvailable,
    authType: form.authType,
    enabled: form.enabled,
    toolSyncIntervalMinutes: form.toolSyncIntervalMinutes,
  }
}

const handleCreateSubmit = async () => {
  resetCreateNotice()
  createSaving.value = true
  try {
    const payload = buildCreatePayload()
    await createMcpGatewayServer(payload)
    showCreateModal.value = false
    setMessage('服务器创建成功')
    setCreateMessage('服务器创建成功')
    await refreshServerList()
  } catch (err: any) {
    setCreateError(err.message || '创建失败')
  } finally {
    createSaving.value = false
  }
}

const fillEditFormByDetail = (detail: McpGatewayServerDetail) => {
  editForm.serverName = detail.serverName || ''
  editForm.connectionType = detail.connectionType || 'HTTP'
  editForm.connectionUrl = detail.connectionUrl || ''
  editForm.sseEndpoint = detail.sseEndpoint || ''
  editForm.stdioCommand = detail.stdioCommand || ''
  editForm.stdioArgsText = JSON.stringify(detail.stdioArgs || [], null, 2)
  editForm.stdioEnvText = JSON.stringify(detail.stdioEnv || {}, null, 2)
  editForm.isCodeClient = Boolean(detail.isCodeClient)
  editForm.isPingAvailable = Boolean(detail.isPingAvailable)
  editForm.authType = detail.authType || 'none'
  editForm.enabled = Boolean(detail.enabled)
  editForm.toolSyncIntervalMinutes = detail.toolSyncIntervalMinutes || 10
}

const handleOpenEdit = async (server: McpGatewayServerListItem) => {
  editError.value = ''
  editServerId.value = server.id
  showEditModal.value = true
  editLoading.value = true
  try {
    const detail = await getMcpGatewayServerDetail(server.id)
    fillEditFormByDetail(detail)
  } catch (err: any) {
    editError.value = err.message || '加载编辑配置失败'
  } finally {
    editLoading.value = false
  }
}

const handleEditSubmit = async () => {
  if (editServerId.value == null) {
    editError.value = '缺少服务器ID'
    return
  }
  editError.value = ''
  editSaving.value = true
  try {
    const payload = buildPayloadFromForm(editForm)
    await updateMcpGatewayServer(editServerId.value, payload)
    showEditModal.value = false
    setMessage('服务器配置已更新')
    await refreshServerList()
    if (showDetailModal.value && detailServer.value?.id === editServerId.value) {
      await loadServerDetail(editServerId.value)
    }
  } catch (err: any) {
    editError.value = err.message || '保存编辑失败'
  } finally {
    editSaving.value = false
  }
}

const handleOpenDetail = async (server: McpGatewayServerListItem) => {
  detailError.value = ''
  detailServer.value = null
  showDetailModal.value = true
  await loadServerDetail(server.id)
}

const handleSyncTools = async (server: Pick<McpGatewayServerListItem, 'id' | 'serverName'>) => {
  resetNotice()
  actionLoading.value = true
  try {
    const syncedTools = await syncMcpGatewayTools(server.id)
    setMessage(`已刷新 ${server.serverName} 的工具列表`)
    // 弹窗打开时更新详情工具；否则只更新目录计数，减少不必要请求。
    if (showDetailModal.value && detailServer.value?.id === server.id) {
      applyDetailTools(syncedTools)
    } else {
      updateListToolCounts(server.id, syncedTools)
    }
  } catch (err: any) {
    setError(err.message || '刷新工具失败')
    if (showDetailModal.value && detailServer.value?.id === server.id) {
      detailError.value = err.message || '刷新工具失败'
    }
  } finally {
    actionLoading.value = false
    detailLoading.value = false
  }
}

const patchSingleTool = async (toolName: string, payload: Record<string, any>) => {
  if (!detailServer.value) return
  detailError.value = ''
  detailActionLoading.value = true
  try {
    const updatedTool = await patchMcpGatewayTool(detailServer.value.id, toolName, payload)
    // 单条 patch 成功后做本地合并，不做整页 reload，提升操作流畅度。
    const mergedTools = detailTools.value.map((tool) =>
      tool.toolName === updatedTool.toolName ? { ...tool, ...updatedTool } : tool
    )
    applyDetailTools(mergedTools)
  } catch (err: any) {
    detailError.value = err.message || '工具更新失败'
  } finally {
    detailActionLoading.value = false
  }
}

const toggleToolEnabled = async (tool: McpGatewayToolItem, checked: boolean) => {
  await patchSingleTool(tool.toolName, { enabled: checked })
}

const toggleToolAutoExecute = async (tool: McpGatewayToolItem, checked: boolean) => {
  await patchSingleTool(tool.toolName, { autoExecute: checked })
}

const updateToolCost = async (tool: McpGatewayToolItem, value: string) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    detailError.value = '成本必须是大于等于 0 的数字'
    toolCostInputMap[tool.toolName] = Number(tool.costUsd || 0).toFixed(2)
    return
  }
  const normalized = Number(parsed.toFixed(2))
  const current = Number(Number(tool.costUsd || 0).toFixed(2))
  if (normalized === current) {
    // 值未变化时不发请求，避免无效网络开销。
    toolCostInputMap[tool.toolName] = normalized.toFixed(2)
    return
  }
  await patchSingleTool(tool.toolName, { costUsd: normalized })
}

const toggleAllEnabled = async (checked: boolean) => {
  if (!detailServer.value) return
  detailError.value = ''
  detailActionLoading.value = true
  try {
    if (checked) {
      const updated = await batchMcpGatewayTools(detailServer.value.id, { action: 'enableAll' })
      applyDetailTools(updated)
    } else {
      const targets = detailTools.value.filter((tool) => tool.enabled)
      const updatedItems = await Promise.all(
        targets.map((tool) => patchMcpGatewayTool(detailServer.value!.id, tool.toolName, { enabled: false }))
      )
      const updatedMap = new Map(updatedItems.map((tool) => [tool.toolName, tool]))
      const mergedTools = detailTools.value.map((tool) => updatedMap.get(tool.toolName) || tool)
      applyDetailTools(mergedTools)
    }
  } catch (err: any) {
    detailError.value = err.message || '批量启用更新失败'
  } finally {
    detailActionLoading.value = false
  }
}

const toggleAllAutoExecute = async (checked: boolean) => {
  if (!detailServer.value) return
  detailError.value = ''
  detailActionLoading.value = true
  try {
    if (checked) {
      const targets = detailTools.value.filter((tool) => !tool.autoExecute)
      const updatedItems = await Promise.all(
        targets.map((tool) => patchMcpGatewayTool(detailServer.value!.id, tool.toolName, { autoExecute: true }))
      )
      const updatedMap = new Map(updatedItems.map((tool) => [tool.toolName, tool]))
      const mergedTools = detailTools.value.map((tool) => updatedMap.get(tool.toolName) || tool)
      applyDetailTools(mergedTools)
    } else {
      const updated = await batchMcpGatewayTools(detailServer.value.id, { action: 'disableAutoExecute' })
      applyDetailTools(updated)
    }
  } catch (err: any) {
    detailError.value = err.message || '批量自动执行更新失败'
  } finally {
    detailActionLoading.value = false
  }
}

const handleConnect = async (server: McpGatewayServerListItem) => {
  resetNotice()
  actionLoading.value = true
  try {
    await connectMcpGatewayServer(server.id)
    setMessage(`已连接 ${server.serverName}`)
    await refreshServerList()
  } catch (err: any) {
    setError(err.message || '连接失败')
  } finally {
    actionLoading.value = false
  }
}

const handleDisconnect = async (server: McpGatewayServerListItem) => {
  resetNotice()
  actionLoading.value = true
  try {
    await disconnectMcpGatewayServer(server.id)
    setMessage(`已断开 ${server.serverName}`)
    await refreshServerList()
  } catch (err: any) {
    setError(err.message || '断开失败')
  } finally {
    actionLoading.value = false
  }
}

const handlePing = async (server: McpGatewayServerListItem) => {
  resetNotice()
  actionLoading.value = true
  try {
    await pingMcpGatewayServer(server.id)
    setMessage(`Ping 成功：${server.serverName}`)
    await refreshServerList()
  } catch (err: any) {
    setError(err.message || 'Ping 失败')
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async (server: McpGatewayServerListItem) => {
  if (!window.confirm(`确认删除 ${server.serverName} 吗？`)) return
  resetNotice()
  actionLoading.value = true
  try {
    await deleteMcpGatewayServer(server.id)
    setMessage('删除成功')
    await refreshServerList()
  } catch (err: any) {
    setError(err.message || '删除失败')
  } finally {
    actionLoading.value = false
  }
}

watch(
  () => createForm.connectionType,
  (next) => {
    if (next !== 'STDIO' && !createForm.connectionUrl.trim()) {
      createForm.connectionUrl = '/api/mcp'
    }
    if (next !== 'SSE') {
      createForm.sseEndpoint = ''
    }
  }
)

// 编辑弹窗连接类型切换逻辑与新建保持一致。
watch(
  () => editForm.connectionType,
  (next) => {
    if (next !== 'STDIO' && !editForm.connectionUrl.trim()) {
      editForm.connectionUrl = '/api/mcp'
    }
    if (next !== 'SSE') {
      editForm.sseEndpoint = ''
    }
  }
)

onMounted(async () => {
  await refreshServerList()
})
</script>

<template>
  <main class="mcp-gateway-page">
    <section class="panel panel-list">
      <div class="panel-head">
        <h2>MCP 服务器目录</h2>
        <div class="head-actions">
          <button type="button" class="btn ghost" :disabled="listLoading" @click="refreshServerList">刷新</button>
          <button type="button" class="btn primary" @click="openCreateModal">新增 MCP 服务器</button>
        </div>
      </div>

      <p v-if="message" class="notice success">{{ message }}</p>
      <p v-if="error" class="notice error">{{ error }}</p>

      <div class="table-wrap" v-if="servers.length">
        <table class="server-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>连接类型</th>
              <th>代码模式</th>
              <th>连接信息</th>
              <th>启用工具</th>
              <th>自动执行工具</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in servers" :key="server.id" class="server-row">
              <td>{{ server.serverName }}</td>
              <td>{{ connectionTypeLabel(server.connectionType) }}</td>
              <td>{{ server.isCodeClient ? '是' : '否' }}</td>
              <td class="mono">{{ server.connectionInfo || '-' }}</td>
              <td>{{ server.enabledToolCount }}/{{ server.totalToolCount }}</td>
              <td>{{ server.autoExecuteToolCount }}/{{ server.totalToolCount }}</td>
              <td>
                <span class="status-pill" :class="statusClass(server.status)">{{ statusLabel(server.status) }}</span>
              </td>
              <td class="op-cell">
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handleOpenEdit(server)">编辑</button>
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handleOpenDetail(server)">详情</button>
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handleSyncTools(server)">刷新工具</button>
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handleConnect(server)">连接</button>
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handleDisconnect(server)">断开</button>
                <button type="button" class="text-btn" :disabled="actionLoading" @click="handlePing(server)">Ping</button>
                <button type="button" class="text-btn danger" :disabled="actionLoading" @click="handleDelete(server)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty">暂无服务器配置，请先新增 MCP 服务器。</div>
    </section>

    <div v-if="showCreateModal" class="modal-mask" @click.self="closeCreateModal">
      <section class="create-modal">
        <button type="button" class="close-btn" :disabled="createSaving" @click="closeCreateModal">×</button>
        <h3>新的 MCP 服务器</h3>
        <p class="modal-subtitle">配置并连接到新的模型上下文协议服务器。</p>
        <p v-if="createMessage" class="notice success modal-notice">{{ createMessage }}</p>
        <p v-if="createError" class="notice error modal-notice">{{ createError }}</p>

        <div class="modal-form">
          <label>
            <span>名称</span>
            <input v-model="createForm.serverName" type="text" placeholder="Server name" />
          </label>

          <label>
            <span>连接类型</span>
            <select v-model="createForm.connectionType">
              <option value="HTTP">HTTP（可流式传输）</option>
              <option value="SSE">SSE</option>
              <option value="STDIO">STDIO</option>
            </select>
          </label>

          <label class="switch-row">
            <span>代码模式服务器</span>
            <span class="switch">
              <input v-model="createForm.isCodeClient" type="checkbox" />
              <span class="slider" />
            </span>
          </label>

          <label class="switch-row">
            <span>可用性检查的 Ping</span>
            <span class="switch">
              <input v-model="createForm.isPingAvailable" type="checkbox" />
              <span class="slider" />
            </span>
          </label>

          <label v-if="createForm.connectionType !== 'STDIO'">
            <span>连接 URL</span>
            <input v-model="createForm.connectionUrl" type="text" placeholder="http://your-mcp-server:3000 or env.MCP_SERVER_URL" />
          </label>

          <label v-if="createForm.connectionType === 'SSE'">
            <span>SSE Endpoint（可选）</span>
            <input v-model="createForm.sseEndpoint" type="text" placeholder="/sse" />
          </label>

          <label v-if="createForm.connectionType === 'STDIO'">
            <span>STDIO 命令</span>
            <input v-model="createForm.stdioCommand" type="text" placeholder="node / uvx / java" />
          </label>

          <label v-if="createForm.connectionType === 'STDIO'">
            <span>STDIO 参数 JSON</span>
            <textarea v-model="createForm.stdioArgsText" rows="3"></textarea>
          </label>

          <label v-if="createForm.connectionType === 'STDIO'">
            <span>STDIO 环境变量 JSON</span>
            <textarea v-model="createForm.stdioEnvText" rows="3"></textarea>
          </label>

          <label>
            <span>认证类型</span>
            <select v-model="createForm.authType">
              <option value="none">无</option>
              <option value="oauth2">OAuth 2.0</option>
            </select>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn ghost" :disabled="createSaving" @click="closeCreateModal">取消</button>
          <button type="button" class="btn primary" :disabled="createSaving" @click="handleCreateSubmit">
            {{ createSaving ? '创建中...' : '创建' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showEditModal" class="modal-mask" @click.self="closeEditModal">
      <section class="create-modal">
        <button type="button" class="close-btn" :disabled="editLoading || editSaving" @click="closeEditModal">×</button>
        <h3>编辑 MCP 服务器</h3>
        <p class="modal-subtitle">更新服务器连接配置。</p>
        <p v-if="editError" class="notice error modal-notice">{{ editError }}</p>
        <p v-else-if="editLoading" class="detail-loading">加载中...</p>

        <div v-else class="modal-form">
          <label>
            <span>名称</span>
            <input v-model="editForm.serverName" type="text" placeholder="Server name" />
          </label>

          <label>
            <span>连接类型</span>
            <select v-model="editForm.connectionType">
              <option value="HTTP">HTTP（可流式传输）</option>
              <option value="SSE">SSE</option>
              <option value="STDIO">STDIO</option>
            </select>
          </label>

          <label class="switch-row">
            <span>代码模式服务器</span>
            <span class="switch">
              <input v-model="editForm.isCodeClient" type="checkbox" />
              <span class="slider" />
            </span>
          </label>

          <label class="switch-row">
            <span>可用性检查的 Ping</span>
            <span class="switch">
              <input v-model="editForm.isPingAvailable" type="checkbox" />
              <span class="slider" />
            </span>
          </label>

          <label class="switch-row">
            <span>启用服务器</span>
            <span class="switch">
              <input v-model="editForm.enabled" type="checkbox" />
              <span class="slider" />
            </span>
          </label>

          <label v-if="editForm.connectionType !== 'STDIO'">
            <span>连接 URL</span>
            <input v-model="editForm.connectionUrl" type="text" placeholder="http://your-mcp-server:3000 or env.MCP_SERVER_URL" />
          </label>

          <label v-if="editForm.connectionType === 'SSE'">
            <span>SSE Endpoint（可选）</span>
            <input v-model="editForm.sseEndpoint" type="text" placeholder="/sse" />
          </label>

          <label v-if="editForm.connectionType === 'STDIO'">
            <span>STDIO 命令</span>
            <input v-model="editForm.stdioCommand" type="text" placeholder="node / uvx / java" />
          </label>

          <label v-if="editForm.connectionType === 'STDIO'">
            <span>STDIO 参数 JSON</span>
            <textarea v-model="editForm.stdioArgsText" rows="3"></textarea>
          </label>

          <label v-if="editForm.connectionType === 'STDIO'">
            <span>STDIO 环境变量 JSON</span>
            <textarea v-model="editForm.stdioEnvText" rows="3"></textarea>
          </label>

          <label>
            <span>认证类型</span>
            <select v-model="editForm.authType">
              <option value="none">无</option>
              <option value="oauth2">OAuth 2.0</option>
            </select>
          </label>

          <label>
            <span>同步间隔(分钟)</span>
            <input v-model.number="editForm.toolSyncIntervalMinutes" type="number" min="1" />
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn ghost" :disabled="editLoading || editSaving" @click="closeEditModal">取消</button>
          <button type="button" class="btn primary" :disabled="editLoading || editSaving" @click="handleEditSubmit">
            {{ editSaving ? '保存中...' : '保存' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showDetailModal" class="modal-mask" @click.self="closeDetailModal">
      <section class="create-modal detail-modal">
        <button type="button" class="close-btn" :disabled="detailLoading || detailActionLoading" @click="closeDetailModal">×</button>
        <h3>服务器详情</h3>
        <p class="modal-subtitle">查看当前 MCP 服务器配置与工具策略。</p>

        <p v-if="detailError" class="notice error modal-notice">{{ detailError }}</p>
        <p v-else-if="detailLoading" class="detail-loading">加载中...</p>

        <template v-else-if="detailServer">
          <div class="detail-grid">
            <div>
              <span class="label">名称</span>
              <p>{{ detailServer.serverName }}</p>
            </div>
            <div>
              <span class="label">状态</span>
              <p>
                <span class="status-pill" :class="statusClass(detailServer.status)">{{ statusLabel(detailServer.status) }}</span>
              </p>
            </div>
            <div>
              <span class="label">连接类型</span>
              <p>{{ connectionTypeLabel(detailServer.connectionType) }}</p>
            </div>
            <div>
              <span class="label">连接 URL</span>
              <p class="mono">{{ detailServer.connectionUrl || '-' }}</p>
            </div>
            <div>
              <span class="label">SSE Endpoint</span>
              <p class="mono">{{ detailServer.sseEndpoint || '-' }}</p>
            </div>
            <div>
              <span class="label">STDIO 命令</span>
              <p class="mono">{{ detailServer.stdioCommand || '-' }}</p>
            </div>
            <div>
              <span class="label">代码模式</span>
              <p>{{ detailServer.isCodeClient ? '是' : '否' }}</p>
            </div>
            <div>
              <span class="label">Ping 可用</span>
              <p>{{ detailServer.isPingAvailable ? '是' : '否' }}</p>
            </div>
            <div>
              <span class="label">认证类型</span>
              <p>{{ detailServer.authType || 'none' }}</p>
            </div>
            <div>
              <span class="label">同步间隔</span>
              <p>{{ detailServer.toolSyncIntervalMinutes }} 分钟</p>
            </div>
            <div>
              <span class="label">启用工具</span>
              <p>{{ detailServer.tools.filter((t) => t.enabled).length }}/{{ detailServer.tools.length }}</p>
            </div>
            <div>
              <span class="label">自动执行工具</span>
              <p>{{ detailServer.tools.filter((t) => t.autoExecute).length }}/{{ detailServer.tools.length }}</p>
            </div>
          </div>

          <div class="detail-section">
            <h4>Headers</h4>
            <pre>{{ formatJson(detailServer.headers || {}) }}</pre>
          </div>

          <div class="detail-section">
            <h4>配置快照</h4>
            <pre>{{ formatJson(detailServer.configSnapshot || {}) }}</pre>
          </div>

          <div class="detail-section">
            <div class="detail-section-head">
              <h4>工具列表 ({{ detailServer.tools.length }})</h4>
              <div class="tool-top-actions">
                <label class="inline-switch">
                  <span>全部启用</span>
                  <span class="switch small-switch">
                    <input
                      type="checkbox"
                      :checked="allToolsEnabled"
                      :disabled="detailActionLoading"
                      @change="toggleAllEnabled(($event.target as HTMLInputElement).checked)"
                    />
                    <span class="slider" />
                  </span>
                </label>
                <label class="inline-switch">
                  <span>所有自动执行</span>
                  <span class="switch small-switch">
                    <input
                      type="checkbox"
                      :checked="allToolsAutoExecute"
                      :disabled="detailActionLoading"
                      @change="toggleAllAutoExecute(($event.target as HTMLInputElement).checked)"
                    />
                    <span class="slider" />
                  </span>
                </label>
                <button
                  type="button"
                  class="btn ghost mini-btn"
                  :disabled="actionLoading || detailActionLoading"
                  @click="handleSyncTools(detailServer)"
                >
                  刷新工具
                </button>
              </div>
            </div>
            <div v-if="detailTools.length" class="tool-table-wrap">
              <table class="tool-table">
                <thead>
                  <tr>
                    <th>工具名称</th>
                    <th>已启用</th>
                    <th>自动执行</th>
                    <th>成本(美元)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tool in detailTools" :key="tool.toolName">
                    <td>
                      <div class="tool-name-cell">
                        <span class="tool-chevron">›</span>
                        <div>
                          <p class="tool-title">{{ tool.toolName }}</p>
                          <p class="tool-desc">{{ tool.toolDescription || '-' }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="switch small-switch">
                        <input
                          type="checkbox"
                          :checked="tool.enabled"
                          :disabled="detailActionLoading"
                          @change="toggleToolEnabled(tool, ($event.target as HTMLInputElement).checked)"
                        />
                        <span class="slider" />
                      </span>
                    </td>
                    <td>
                      <span class="switch small-switch">
                        <input
                          type="checkbox"
                          :checked="tool.autoExecute"
                          :disabled="detailActionLoading"
                          @change="toggleToolAutoExecute(tool, ($event.target as HTMLInputElement).checked)"
                        />
                        <span class="slider" />
                      </span>
                    </td>
                    <td>
                      <input
                        class="tool-cost-input"
                        type="number"
                        min="0"
                        step="0.01"
                        :value="toolCostInputMap[tool.toolName]"
                        :disabled="detailActionLoading"
                        @input="toolCostInputMap[tool.toolName] = ($event.target as HTMLInputElement).value"
                        @blur="updateToolCost(tool, ($event.target as HTMLInputElement).value)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="empty">暂无工具策略。请点击“刷新工具”执行 tools/list 同步。</p>
          </div>
        </template>

        <div class="modal-actions">
          <button type="button" class="btn ghost" :disabled="detailLoading || detailActionLoading" @click="closeDetailModal">关闭</button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped lang="scss">
.mcp-gateway-page {
  min-height: calc(100vh - 76px);
  padding: 1rem;
  background:
    radial-gradient(circle at 10% 10%, rgba(14, 165, 233, 0.14), transparent 35%),
    radial-gradient(circle at 88% 14%, rgba(16, 185, 129, 0.12), transparent 30%),
    linear-gradient(145deg, #eef8ff, #fff8ec 52%, #f8fffb);
}

.panel {
  width: min(1700px, 100%);
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(16, 55, 86, 0.12);
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 14px 28px rgba(10, 41, 67, 0.1);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.8rem;

  h2 {
    margin: 0;
    font-size: 1.08rem;
    color: #17324a;
  }
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 0.42rem 0.72rem;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: linear-gradient(90deg, #0ea5e9, #10b981);
  color: #fff;
}

.btn.ghost {
  background: rgba(14, 116, 144, 0.1);
  color: #115a72;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notice {
  margin: 0 0 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  font-size: 0.88rem;
}

.notice.success {
  background: rgba(16, 185, 129, 0.14);
  color: #0f6f51;
}

.notice.error {
  background: rgba(239, 68, 68, 0.14);
  color: #a43a3a;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th,
td {
  padding: 0.56rem 0.5rem;
  border-bottom: 1px solid rgba(20, 58, 90, 0.08);
  text-align: left;
  vertical-align: top;
}

th {
  color: #1f405a;
  font-size: 0.81rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.52rem;
  font-size: 0.74rem;
  font-weight: 700;
}

.status-connected {
  color: #0e7a5a;
  background: rgba(16, 185, 129, 0.18);
}

.status-disconnected {
  color: #374151;
  background: rgba(107, 114, 128, 0.16);
}

.status-error {
  color: #9b1c1c;
  background: rgba(248, 113, 113, 0.2);
}

.op-cell {
  white-space: nowrap;
}

.text-btn {
  border: none;
  background: none;
  color: #0f6f8e;
  padding: 0;
  cursor: pointer;
  font-weight: 600;
  margin-right: 0.6rem;
}

.text-btn.danger {
  color: #b23b3b;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  word-break: break-all;
}

.empty {
  color: #587086;
  font-size: 0.9rem;
  padding: 0.6rem 0;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(21, 29, 38, 0.28);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 3000;
  padding: 5rem 1rem 1rem;
  overflow: auto;
}

.create-modal {
  width: min(680px, 100%);
  max-height: calc(100vh - 6rem);
  overflow: auto;
  background: #f5f6f7;
  border: 1px solid #d9dde2;
  border-radius: 10px;
  padding: 1.15rem;
  position: relative;

  h3 {
    margin: 0;
    font-size: 1.82rem;
    color: #1e2b37;
  }
}

.detail-modal {
  width: min(900px, 100%);
}

.modal-subtitle {
  margin: 0.2rem 0 1rem;
  color: #616f7f;
  font-size: 0.95rem;
}

.modal-notice {
  margin-top: 0;
}

.close-btn {
  position: absolute;
  right: 0.8rem;
  top: 0.65rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.35rem;
  color: #546173;
}

.modal-form {
  display: grid;
  gap: 0.7rem;
}

.detail-loading {
  color: #4a6073;
  margin: 0 0 0.8rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem 1rem;
  margin-bottom: 0.8rem;

  .label {
    display: block;
    color: #537087;
    font-size: 0.78rem;
    margin-bottom: 0.2rem;
  }

  p {
    margin: 0;
    color: #1f364a;
    font-size: 0.92rem;
  }
}

.detail-section {
  margin-top: 0.8rem;

  h4 {
    margin: 0 0 0.35rem;
    font-size: 0.86rem;
    color: #1f3f58;
  }

  pre {
    margin: 0;
    padding: 0.7rem;
    border-radius: 8px;
    background: rgba(15, 36, 54, 0.1);
    color: #17354d;
    font-size: 0.8rem;
    overflow: auto;
    max-height: 220px;
  }
}

.detail-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.mini-btn {
  padding: 0.24rem 0.52rem;
  font-size: 0.76rem;
}

.tool-top-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.inline-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #2f4a60;
}

.tool-table-wrap {
  overflow: auto;
  border: 1px solid rgba(20, 58, 90, 0.1);
  border-radius: 8px;
}

.tool-table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.45rem 0.5rem;
    border-bottom: 1px solid rgba(20, 58, 90, 0.08);
    vertical-align: middle;
  }

  th {
    font-size: 0.8rem;
    color: #2b475c;
    background: rgba(15, 52, 78, 0.04);
  }
}

.tool-name-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
}

.tool-chevron {
  color: #547188;
  font-size: 1.05rem;
  line-height: 1;
  margin-top: 0.1rem;
}

.tool-title {
  margin: 0;
  font-size: 0.92rem;
  color: #1f364a;
  font-weight: 600;
}

.tool-desc {
  margin: 0.08rem 0 0;
  font-size: 0.78rem;
  color: #607c90;
}

.tool-cost-input {
  max-width: 95px;
  padding: 0.28rem 0.45rem;
  font-size: 0.82rem;
}

.modal-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  span {
    font-size: 0.78rem;
    color: #40596f;
    font-weight: 700;
  }
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid rgba(22, 68, 98, 0.18);
  border-radius: 9px;
  padding: 0.46rem 0.56rem;
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.92);
}

.switch-row {
  background: #f1f3f5;
  border: 1px solid #d4d9df;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  flex-direction: row !important;
}

.switch {
  position: relative;
  width: 40px;
  height: 22px;
  display: inline-block;

  input {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    margin: 0;
    z-index: 2;
    cursor: pointer;
  }

  .slider {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: #d1d5db;
    transition: background 0.2s;
    pointer-events: none;
  }

  .slider::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    left: 3px;
    top: 3px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  input:checked + .slider {
    background: #0f8f67;
  }

  input:checked + .slider::before {
    transform: translateX(18px);
  }
}

.small-switch {
  width: 38px;
  height: 20px;

  .slider::before {
    width: 14px;
    height: 14px;
    left: 3px;
    top: 3px;
  }

  input:checked + .slider::before {
    transform: translateX(18px);
  }
}

.modal-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
