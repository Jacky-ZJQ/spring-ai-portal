const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl
const DEFAULT_MCP_PROTOCOL_VERSION = import.meta.env.VITE_MCP_PROTOCOL_VERSION || '2025-11-05'
let mcpRequestIdSeed = Date.now()

const withBaseUrl = (path) => `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`

const buildUrl = (path, params = {}) => {
  const url = new URL(withBaseUrl(path))
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.length > 0) {
      url.searchParams.append(key, value)
    }
  })
  return url.toString()
}

const ensureOk = async (response) => {
  if (response.ok) {
    return
  }

  let errorMessage = `HTTP error! status: ${response.status}`
  try {
    const body = await response.json()
    if (body?.error?.message) {
      errorMessage = body.error.message
    } else if (body?.message) {
      errorMessage = body.message
    }
  } catch (_) {
    // ignore non-json error body
  }

  throw new Error(errorMessage)
}

const parseJsonSafely = async (response) => {
  const raw = await response.text()
  if (!raw) {
    return null
  }
  return JSON.parse(raw)
}

const nextMcpRequestId = () => {
  mcpRequestIdSeed += 1
  return mcpRequestIdSeed
}

export const chatAPI = {
  // 发送聊天消息
  async sendMessage(data, chatId) {
    const url = buildUrl('/ai/chat', { chatId })

    const response = await fetch(url, {
      method: 'POST',
      body: data instanceof FormData
        ? data
        : new URLSearchParams({ prompt: data })
    })

    await ensureOk(response)
    return response.body.getReader()
  },

  // 获取聊天历史列表
  async getChatHistory(type = 'chat') {
    try {
      const response = await fetch(withBaseUrl(`/ai/history/${type}`))
      await ensureOk(response)

      const chatIds = await response.json()
      return chatIds.map(id => ({
        id,
        title: type === 'pdf' ? `PDF对话 ${id.slice(-6)}`
          : type === 'service' ? `咨询 ${id.slice(-6)}`
            : `对话 ${id.slice(-6)}`
      }))
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 获取特定对话的消息历史
  async getChatMessages(chatId, type = 'chat') {
    try {
      const response = await fetch(withBaseUrl(`/ai/history/${type}/${chatId}`))
      await ensureOk(response)

      const messages = await response.json()
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date()
      }))
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 发送游戏消息
  async sendGameMessage(prompt, chatId) {
    const response = await fetch(buildUrl('/ai/game', { prompt, chatId }), {
      method: 'GET'
    })

    await ensureOk(response)
    return response.body.getReader()
  },

  // 发送客服消息
  async sendServiceMessage(prompt, chatId) {
    const response = await fetch(buildUrl('/ai/service', { prompt, chatId }), {
      method: 'GET'
    })

    await ensureOk(response)
    return response.body.getReader()
  },

  // 发送 PDF 问答消息
  async sendPdfMessage(prompt, chatId) {
    const response = await fetch(buildUrl('/ai/pdf/chat', { prompt, chatId }), {
      method: 'GET',
      signal: AbortSignal.timeout(30000)
    })

    await ensureOk(response)
    return response.body.getReader()
  },

  // 获取技能列表
  async getSkills() {
    try {
      const response = await fetch(withBaseUrl('/ai/skills'))
      await ensureOk(response)
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 技能对话（流式）
  async sendSkillMessage(prompt, chatId, skillCode) {
    const payload = { prompt }
    if (chatId && chatId.trim()) {
      payload.chatId = chatId.trim()
    }

    const response = await fetch(withBaseUrl(`/ai/skills/${encodeURIComponent(skillCode)}/chat/stream`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await ensureOk(response)

    if (!response.body) {
      throw new Error('Response body is empty')
    }

    return {
      reader: response.body.getReader(),
      chatId: response.headers.get('X-Chat-Id') || payload.chatId || ''
    }
  },

  // 技能对话（同步）
  async sendSkillMessageSync(prompt, chatId, skillCode) {
    const payload = { prompt }
    if (chatId && chatId.trim()) {
      payload.chatId = chatId.trim()
    }

    const response = await fetch(withBaseUrl(`/ai/skills/${encodeURIComponent(skillCode)}/chat`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    await ensureOk(response)
    return response.json()
  },

  // MCP JSON-RPC
  async mcpRequest(method, params = {}, options = {}) {
    const {
      id = nextMcpRequestId(),
      notification = false,
      sessionId,
      protocolVersion
    } = options

    const headers = { 'Content-Type': 'application/json' }
    if (sessionId) {
      headers['MCP-Session-Id'] = sessionId
    }
    if (protocolVersion) {
      headers['MCP-Protocol-Version'] = protocolVersion
    }

    const payload = {
      jsonrpc: '2.0',
      method
    }

    if (!notification) {
      payload.id = id
    }
    if (params && Object.keys(params).length > 0) {
      payload.params = params
    }

    const response = await fetch(withBaseUrl('/ai/mcp'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    const nextSessionId = response.headers.get('MCP-Session-Id') || sessionId || null
    const nextProtocolVersion = response.headers.get('MCP-Protocol-Version') || protocolVersion || null

    if (notification) {
      if (!response.ok && response.status !== 202) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return {
        sessionId: nextSessionId,
        protocolVersion: nextProtocolVersion
      }
    }

    const data = await parseJsonSafely(response)
    if (!response.ok || data?.error) {
      throw new Error(data?.error?.message || `HTTP error! status: ${response.status}`)
    }
    if (!data || data.jsonrpc !== '2.0') {
      throw new Error('Invalid MCP response payload')
    }

    return {
      ...data,
      sessionId: nextSessionId || data?.result?.sessionId || null,
      protocolVersion: nextProtocolVersion || data?.result?.protocolVersion || null
    }
  },

  async mcpInitialize(clientInfo = { name: 'spring-ai-protal', version: '0.1.0' }, protocolVersion = DEFAULT_MCP_PROTOCOL_VERSION) {
    return this.mcpRequest(
      'initialize',
      {
        protocolVersion,
        capabilities: {},
        clientInfo
      },
      { notification: false }
    )
  },

  async mcpInitialized(sessionId, protocolVersion) {
    return this.mcpRequest(
      'notifications/initialized',
      {},
      {
        notification: true,
        sessionId,
        protocolVersion
      }
    )
  },

  async mcpPing(sessionId, protocolVersion) {
    return this.mcpRequest(
      'ping',
      {},
      {
        sessionId,
        protocolVersion
      }
    )
  },

  async mcpListTools(sessionId, protocolVersion) {
    return this.mcpRequest(
      'tools/list',
      {},
      {
        sessionId,
        protocolVersion
      }
    )
  },

  async mcpCallTool(name, args = {}, sessionId, protocolVersion) {
    return this.mcpRequest(
      'tools/call',
      {
        name,
        arguments: args
      },
      {
        sessionId,
        protocolVersion
      }
    )
  }
}
