import type {
  ApiEnvelope,
  McpGatewayDebugResult,
  McpGatewayServerCreateRequest,
  McpGatewayServerDetail,
  McpGatewayServerListItem,
  McpGatewayServerUpdateRequest,
  McpGatewayToolBatchRequest,
  McpGatewayToolDebugRequest,
  McpGatewayToolItem,
  McpGatewayToolPatchRequest,
} from '../types/mcp-gateway'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

const buildApiPath = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

// 统一请求封装：
// 1) 兼容项目约定的 { ok, msg, data } 响应包
// 2) 后端/网关返回 HTML 或纯文本时，给出可定位的方法与 URL
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = buildApiPath(path)
  const method = (options.method || 'GET').toUpperCase()

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const rawText = await response.text()
  let envelope: ApiEnvelope<T> | null = null

  if (rawText) {
    try {
      envelope = JSON.parse(rawText) as ApiEnvelope<T>
    } catch (_err) {
      // 非 JSON 响应通常是代理未生效或服务端错误页，带上请求上下文便于排查。
      const shortText = rawText.slice(0, 180)
      if (!response.ok) {
        throw new Error(`请求失败(${response.status})：${shortText} [${method} ${url}]`)
      }
      if (rawText.trimStart().startsWith('<!DOCTYPE') || rawText.trimStart().startsWith('<html')) {
        throw new Error(`接口返回了 HTML 页面，请检查代理/网关配置。 [${method} ${url}]`)
      }
      throw new Error(`接口返回非 JSON 内容：${shortText} [${method} ${url}]`)
    }
  }

  if (!response.ok) {
    throw new Error(envelope?.msg || `请求失败(${response.status}) [${method} ${url}]`)
  }

  if (!envelope || envelope.ok !== 1) {
    throw new Error(envelope?.msg || '操作失败')
  }
  return envelope.data
}

export const listMcpGatewayServers = () =>
  request<McpGatewayServerListItem[]>('/ai/mcp-gateway/servers', { method: 'GET' })

export const createMcpGatewayServer = (payload: McpGatewayServerCreateRequest) =>
  request<McpGatewayServerDetail>('/ai/mcp-gateway/servers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getMcpGatewayServerDetail = (id: number) =>
  request<McpGatewayServerDetail>(`/ai/mcp-gateway/servers/${id}`, { method: 'GET' })

export const updateMcpGatewayServer = (id: number, payload: McpGatewayServerUpdateRequest) =>
  request<McpGatewayServerDetail>(`/ai/mcp-gateway/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteMcpGatewayServer = (id: number) =>
  request<null>(`/ai/mcp-gateway/servers/${id}`, { method: 'DELETE' })

export const connectMcpGatewayServer = (id: number) =>
  request<McpGatewayServerDetail>(`/ai/mcp-gateway/servers/${id}/connect`, { method: 'POST' })

export const disconnectMcpGatewayServer = (id: number) =>
  request<McpGatewayServerDetail>(`/ai/mcp-gateway/servers/${id}/disconnect`, { method: 'POST' })

export const pingMcpGatewayServer = (id: number) =>
  request<McpGatewayServerDetail>(`/ai/mcp-gateway/servers/${id}/ping`, { method: 'POST' })

export const syncMcpGatewayTools = (id: number) =>
  request<McpGatewayToolItem[]>(`/ai/mcp-gateway/servers/${id}/tools/sync`, { method: 'POST' })

export const patchMcpGatewayTool = (id: number, toolName: string, payload: McpGatewayToolPatchRequest) =>
  request<McpGatewayToolItem>(`/ai/mcp-gateway/servers/${id}/tools/${encodeURIComponent(toolName)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const batchMcpGatewayTools = (id: number, payload: McpGatewayToolBatchRequest) =>
  request<McpGatewayToolItem[]>(`/ai/mcp-gateway/servers/${id}/tools/batch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const debugMcpGatewayTool = (id: number, toolName: string, payload: McpGatewayToolDebugRequest) =>
  request<McpGatewayDebugResult>(`/ai/mcp-gateway/servers/${id}/tools/${encodeURIComponent(toolName)}/debug`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  })
