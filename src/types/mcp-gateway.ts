export type McpConnectionType = 'HTTP' | 'SSE' | 'STDIO'

export interface ApiEnvelope<T> {
  ok: number
  msg: string
  data: T
}

export interface McpGatewayToolItem {
  toolName: string
  toolDescription?: string
  inputSchema?: Record<string, any>
  enabled: boolean
  autoExecute: boolean
  costUsd: number
  sortOrder?: number
  lastSyncAt?: string
}

export interface McpGatewayServerListItem {
  id: number
  serverName: string
  connectionType: McpConnectionType
  isCodeClient: boolean
  connectionInfo: string
  enabled: boolean
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | string
  statusMessage?: string
  totalToolCount: number
  enabledToolCount: number
  autoExecuteToolCount: number
}

export interface McpGatewayServerDetail {
  id: number
  serverName: string
  connectionType: McpConnectionType
  connectionUrl?: string
  sseEndpoint?: string
  stdioCommand?: string
  stdioArgs?: string[]
  stdioEnv?: Record<string, string>
  isCodeClient: boolean
  isPingAvailable: boolean
  toolSyncIntervalMinutes: number
  headers?: Record<string, string>
  authType?: string
  enabled: boolean
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | string
  statusMessage?: string
  createdAt?: string
  updatedAt?: string
  tools: McpGatewayToolItem[]
  configSnapshot?: Record<string, any>
}

export interface McpGatewayServerCreateRequest {
  serverName: string
  connectionType: McpConnectionType
  connectionUrl?: string
  sseEndpoint?: string
  stdioCommand?: string
  stdioArgs?: string[]
  stdioEnv?: Record<string, string>
  isCodeClient?: boolean
  isPingAvailable?: boolean
  toolSyncIntervalMinutes?: number
  headers?: Record<string, string>
  authType?: string
  enabled?: boolean
}

export interface McpGatewayServerUpdateRequest extends McpGatewayServerCreateRequest {}

export interface McpGatewayToolPatchRequest {
  enabled?: boolean
  autoExecute?: boolean
  costUsd?: number
}

export interface McpGatewayToolBatchRequest {
  action: 'enableAll' | 'disableAutoExecute'
}

export interface McpGatewayToolDebugRequest {
  arguments?: Record<string, any>
}

export interface McpGatewayDebugResult {
  toolName: string
  isError: boolean
  result: any
  rawJson?: string
  time?: string
}
