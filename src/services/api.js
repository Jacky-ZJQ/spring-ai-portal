const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

const buildApiPath = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}

const buildApiUrl = (path, query = {}) => {
  const url = new URL(buildApiPath(path), window.location.origin)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  return url.toString()
}

const unwrapApiResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const payload = await response.json()
  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'ok')) {
    if (payload.ok !== 1) {
      throw new Error(payload.msg || '请求失败')
    }
    return payload.data
  }

  return payload
}

export const chatAPI = {
  // 发送聊天消息
  async sendMessage(data, chatId) {
    try {
      const url = buildApiUrl('/ai/chat', { chatId })
      const response = await fetch(url, {
        method: 'POST',
        body: data instanceof FormData ? data : new URLSearchParams({ prompt: data })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 获取聊天历史列表
  async getChatHistory(type = 'chat') {
    try {
      const response = await fetch(buildApiPath(`/ai/history/${type}`))
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const chatIds = await response.json()
      return chatIds.map(id => ({
        id,
        title: type === 'pdf' ? `PDF对话 ${id.slice(-6)}` :
          type === 'service' ? `咨询 ${id.slice(-6)}` :
            `对话 ${id.slice(-6)}`
      }))
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 获取特定对话的消息历史
  async getChatMessages(chatId, type = 'chat') {
    try {
      const response = await fetch(buildApiPath(`/ai/history/${type}/${chatId}`))
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
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
    try {
      const response = await fetch(buildApiUrl('/ai/game', { prompt, chatId }), {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 发送客服消息
  async sendServiceMessage(prompt, chatId) {
    try {
      const response = await fetch(buildApiUrl('/ai/service', { prompt, chatId }), {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 获取客服预约单列表
  async getServiceReservations(limit = 10) {
    try {
      const response = await fetch(buildApiUrl('/ai/service/reservations', { limit }))
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      return []
    }
  },

  // 发送 PDF 问答消息
  async sendPdfMessage(prompt, chatId) {
    try {
      const response = await fetch(buildApiUrl('/ai/pdf/chat', { prompt, chatId }), {
        method: 'GET',
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return response.body.getReader()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 手动释放后端运行时内存（可选同时清理过期文件）
  async releaseRuntimeMemory(options = { forceGc: true, cleanupFiles: false }) {
    try {
      const { forceGc = true, cleanupFiles = false } = options || {}
      const response = await fetch(
        buildApiUrl('/ai/system/release-memory', {
          forceGc: String(forceGc),
          cleanupFiles: String(cleanupFiles)
        }),
        { method: 'POST' }
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },

  // 手动执行一次过期文件清理
  async cleanupExpiredFiles() {
    try {
      const response = await fetch(buildApiPath('/ai/system/cleanup-files'), {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }
}

export const knowledgeAPI = {
  async listArticles(query = {}) {
    return unwrapApiResponse(await fetch(buildApiUrl('/ai/knowledge/articles', query)))
  },

  async getArticleDetail(id) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}`)))
  },

  async createArticle(data) {
    return unwrapApiResponse(await fetch(buildApiPath('/ai/knowledge/articles'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }))
  },

  async updateArticle(id, data) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }))
  },

  async deleteArticle(id) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}`), {
      method: 'DELETE'
    }))
  },

  async publishArticle(id) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}/publish`), {
      method: 'POST'
    }))
  },

  async unpublishArticle(id) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}/unpublish`), {
      method: 'POST'
    }))
  },

  async likeArticle(id) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/articles/${id}/like`), {
      method: 'POST'
    }))
  },

  async listCategories() {
    return unwrapApiResponse(await fetch(buildApiPath('/ai/knowledge/categories')))
  },

  async listTags() {
    return unwrapApiResponse(await fetch(buildApiPath('/ai/knowledge/tags')))
  },

  async createShareLink(id, expireHours = 168) {
    return unwrapApiResponse(await fetch(buildApiUrl(`/ai/knowledge/articles/${id}/share`, { expireHours }), {
      method: 'POST'
    }))
  },

  async getSharedArticle(token) {
    return unwrapApiResponse(await fetch(buildApiPath(`/ai/knowledge/share/${token}`)))
  }
}
