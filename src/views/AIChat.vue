<template>
  <div class="ai-chat" :class="{ 'dark': isDark }">
    <div class="chat-container">
      <div class="sidebar">
        <div class="history-header">
          <h2>聊天记录</h2>
          <button class="new-chat" @click="startNewChat">
            <PlusIcon class="icon" />
            新对话
          </button>
        </div>
        <div class="history-list">
          <div 
            v-for="chat in chatHistory" 
            :key="chat.id"
            class="history-item"
            :class="{ 'active': currentChatId === chat.id }"
            @click="loadChat(chat.id)"
          >
            <ChatBubbleLeftRightIcon class="icon" />
            <span class="title">{{ chat.title || '新对话' }}</span>
          </div>
        </div>
      </div>
      
      <div class="chat-main">
        <div class="chat-main-header">
          <div class="header-meta">
            <h3>AI聊天实验台</h3>
            <p>图片问答已开启，音频/视频暂不开放，模型余额不足...</p>
          </div>
          <div class="header-badges">
            <span class="badge chat-no">{{ currentChatLabel }}</span>
            <span class="badge msg-count">{{ messageCount }} 条消息</span>
          </div>
        </div>

        <div class="messages" ref="messagesRef">
          <ChatMessage
            v-for="(message, index) in currentMessages"
            :key="index"
            :message="message"
            :is-stream="isStreaming && index === currentMessages.length - 1"
          />
        </div>
        
        <div class="input-area">
          <div v-if="selectedFiles.length > 0" class="selected-files">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <div class="file-info">
                <DocumentIcon class="icon" />
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
              </div>
              <button class="remove-btn" @click="removeFile(index)">
                <XMarkIcon class="icon" />
              </button>
            </div>
          </div>

          <div class="input-row">
            <div class="file-upload">
              <input 
                type="file" 
                ref="fileInput"
                @change="handleFileUpload"
                accept="image/*,audio/*,video/*"
                multiple
                class="hidden"
              >
              <button 
                class="upload-btn"
                @click="triggerFileInput"
                :disabled="isStreaming"
              >
                <PaperClipIcon class="icon" />
              </button>
            </div>

            <textarea
              v-model="userInput"
              @keydown="handleInputKeydown"
              @input="adjustTextareaHeight"
              :placeholder="getPlaceholder()"
              rows="1"
              ref="inputRef"
            ></textarea>
            <button 
              class="send-button" 
              @click="sendMessage"
              :disabled="isStreaming || (!userInput.trim() && !selectedFiles.length)"
            >
              <PaperAirplaneIcon class="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { useDark } from '@vueuse/core'
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon,
  PlusIcon,
  PaperClipIcon,
  DocumentIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import ChatMessage from '../components/ChatMessage.vue'
import { chatAPI } from '../services/api'

const isDark = useDark()
const messagesRef = ref(null)
const inputRef = ref(null)
const userInput = ref('')
const isStreaming = ref(false)
const currentChatId = ref(null)
const currentMessages = ref([])
const chatHistory = ref([])
const fileInput = ref(null)
const selectedFiles = ref([])
const currentChatLabel = computed(() => {
  if (!currentChatId.value) return '新对话'
  return `对话 ${String(currentChatId.value).slice(-6)}`
})
const messageCount = computed(() => currentMessages.value.length)

const IMAGE_PLACEHOLDER_TEXT = '[图片]'

// 自动调整输入框高度
const adjustTextareaHeight = () => {
  const textarea = inputRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 仅释放前端本地预览生成的 blob URL，避免聊天页长时间使用导致内存泄漏。
const releaseMessageFileUrls = (messages) => {
  messages.forEach((message) => {
    if (!Array.isArray(message?.files)) return
    message.files.forEach((file) => {
      if (typeof file?.url === 'string' && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
    })
  })
}

// 统一把 File 转成消息展示对象，便于即时渲染和后续提交。
const createMessageFilePreview = (file) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  url: URL.createObjectURL(file)
})

// 文件类型限制
const FILE_LIMITS = {
  image: { 
    maxSize: 10 * 1024 * 1024,  // 单个文件 10MB
    maxFiles: 3,                 // 最多 3 个文件
    description: '图片文件'
  },
  audio: { 
    maxSize: 10 * 1024 * 1024,  // 单个文件 10MB
    maxDuration: 180,           // 3分钟
    maxFiles: 3,                // 最多 3 个文件
    description: '音频文件'
  },
  video: { 
    maxSize: 150 * 1024 * 1024, // 单个文件 150MB
    maxDuration: 40,            // 40秒
    maxFiles: 3,                // 最多 3 个文件
    description: '视频文件'
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 检查文件是否符合要求
const validateFile = async (file) => {
  const type = file.type.split('/')[0]
  const limit = FILE_LIMITS[type]
  
  if (!limit) {
    return { valid: false, error: '不支持的文件类型' }
  }
  
  if (file.size > limit.maxSize) {
    return { valid: false, error: `文件大小不能超过${limit.maxSize / 1024 / 1024}MB` }
  }
  
  if ((type === 'audio' || type === 'video') && limit.maxDuration) {
    try {
      const duration = await getMediaDuration(file)
      if (duration > limit.maxDuration) {
        return { 
          valid: false, 
          error: `${type === 'audio' ? '音频' : '视频'}时长不能超过${limit.maxDuration}秒`
        }
      }
    } catch (error) {
      return { valid: false, error: '无法读取媒体文件时长' }
    }
  }
  
  return { valid: true }
}

// 获取媒体文件时长
const getMediaDuration = (file) => {
  return new Promise((resolve, reject) => {
    const element = file.type.startsWith('audio/') ? new Audio() : document.createElement('video')
    element.preload = 'metadata'
    
    element.onloadedmetadata = () => {
      resolve(element.duration)
      URL.revokeObjectURL(element.src)
    }
    
    element.onerror = () => {
      reject(new Error('无法读取媒体文件'))
      URL.revokeObjectURL(element.src)
    }
    
    element.src = URL.createObjectURL(file)
  })
}

// 修改文件上传处理函数
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  const hasAudioOrVideo = files.some(file => {
    const type = file.type.split('/')[0]
    return type === 'audio' || type === 'video'
  })

  if (hasAudioOrVideo) {
    alert('音频/视频不开放，没钱了，省着点用！')
    event.target.value = ''
    selectedFiles.value = []
    return
  }
  
  // 检查所有文件类型是否一致
  const firstFileType = files[0].type.split('/')[0]
  const hasInconsistentType = files.some(file => file.type.split('/')[0] !== firstFileType)
  
  if (hasInconsistentType) {
    alert('请选择相同类型的文件（图片、音频或视频）')
    event.target.value = ''
    return
  }

  // 验证所有文件
  for (const file of files) {
    const { valid, error } = await validateFile(file)
    if (!valid) {
      alert(error)
      event.target.value = ''
      selectedFiles.value = []
      return
    }
  }

  // 检查文件总大小
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const limit = FILE_LIMITS[firstFileType]
  if (totalSize > limit.maxSize * 3) { // 允许最多3个文件的总大小
    alert(`${firstFileType === 'image' ? '图片' : firstFileType === 'audio' ? '音频' : '视频'}文件总大小不能超过${(limit.maxSize * 3) / 1024 / 1024}MB`)
    event.target.value = ''
    selectedFiles.value = []
    return
  }

  selectedFiles.value = files
}

// 修改文件输入提示
const getPlaceholder = () => {
  if (selectedFiles.value.length > 0) {
    const type = selectedFiles.value[0].type.split('/')[0]
    const desc = FILE_LIMITS[type].description
    return `已选择 ${selectedFiles.value.length} 个${desc}，可继续输入消息...`
  }
  return '输入消息，可上传图片、音频或视频...'
}

const handleInputKeydown = (event) => {
  if (event.key !== 'Enter') return
  // Shift + Enter 保留原生换行；Enter 直接发送消息
  if (event.shiftKey) return
  event.preventDefault()
  sendMessage()
}

// 修改发送消息函数
const sendMessage = async () => {
  if (isStreaming.value) return
  if (!userInput.value.trim() && !selectedFiles.value.length) return
  
  const messageContent = userInput.value.trim()
  const messageFiles = selectedFiles.value.map(createMessageFilePreview)
  
  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: messageContent || (messageFiles.length ? IMAGE_PLACEHOLDER_TEXT : ''),
    timestamp: new Date(),
    files: messageFiles
  }
  currentMessages.value.push(userMessage)
  
  // 清空输入
  userInput.value = ''
  adjustTextareaHeight()
  await scrollToBottom()
  
  // 准备发送数据
  const formData = new FormData()
  if (messageContent) {
    formData.append('prompt', messageContent)
  }
  selectedFiles.value.forEach(file => {
    formData.append('files', file)
  })
  
  // 添加助手消息占位
  const assistantMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date()
  }
  currentMessages.value.push(assistantMessage)
  isStreaming.value = true
  
  try {
    const reader = await chatAPI.sendMessage(formData, currentChatId.value)
    const decoder = new TextDecoder('utf-8')
    let accumulatedContent = ''  // 添加累积内容变量
    
    while (true) {
      try {
        const { value, done } = await reader.read()
        if (done) break
        
        // 累积新内容
        accumulatedContent += decoder.decode(value)  // 追加新内容
        
        await nextTick(() => {
          // 更新消息，使用累积的内容
          const updatedMessage = {
            ...assistantMessage,
            content: accumulatedContent  // 使用累积的内容
          }
          const lastIndex = currentMessages.value.length - 1
          currentMessages.value.splice(lastIndex, 1, updatedMessage)
        })
        await scrollToBottom()
      } catch (readError) {
        console.error('读取流错误:', readError)
        break
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    assistantMessage.content = '抱歉，发生了错误，请稍后重试。'
  } finally {
    isStreaming.value = false
    selectedFiles.value = [] // 清空已选文件
    if (fileInput.value) {
      fileInput.value.value = '' // 清空文件输入
    }
    await scrollToBottom()
  }
}

// 加载特定对话
const loadChat = async (chatId) => {
  currentChatId.value = chatId
  try {
    const messages = await chatAPI.getChatMessages(chatId, 'chat')
    // 切换会话前先清理旧会话本地 blob 预览。
    releaseMessageFileUrls(currentMessages.value)
    currentMessages.value = messages
  } catch (error) {
    console.error('加载对话消息失败:', error)
    releaseMessageFileUrls(currentMessages.value)
    currentMessages.value = []
  }
}

// 加载聊天历史
const loadChatHistory = async () => {
  try {
    const history = await chatAPI.getChatHistory('chat')
    chatHistory.value = history || []
    if (history && history.length > 0) {
      await loadChat(history[0].id)
    } else {
      startNewChat()
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    chatHistory.value = []
    startNewChat()
  }
}

// 开始新对话
const startNewChat = () => {
  const newChatId = Date.now().toString()
  // 新建会话时，旧会话内可能还有未上传完成的本地预览图 URL。
  releaseMessageFileUrls(currentMessages.value)
  currentChatId.value = newChatId
  currentMessages.value = []
  
  // 添加新对话到聊天历史列表
  const newChat = {
    id: newChatId,
    title: `对话 ${newChatId.slice(-6)}`
  }
  chatHistory.value = [newChat, ...chatHistory.value] // 将新对话添加到列表开头
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 移除文件
const removeFile = (index) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
  if (selectedFiles.value.length === 0 && fileInput.value) {
    fileInput.value.value = ''  // 清空文件输入
  }
}

onMounted(() => {
  loadChatHistory()
  adjustTextareaHeight()
})

onBeforeUnmount(() => {
  // 页面卸载时兜底清理，防止切页后残留 blob URL。
  releaseMessageFileUrls(currentMessages.value)
})
</script>

<style scoped lang="scss">
.ai-chat {
  position: fixed;  // 修改为固定定位
  top: 64px;       // 导航栏高度
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: var(--bg-color);
  overflow: hidden; // 防止页面滚动

  .chat-container {
    flex: 1;
    display: flex;
    max-width: 1800px;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    gap: 1.5rem;
    height: 100%;    // 确保容器占满高度
    overflow: hidden; // 防止容器滚动
  }

  .sidebar {
    width: 300px;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    
    .history-header {
      flex-shrink: 0;  // 防止头部压缩
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h2 {
        font-size: 1.25rem;
      }
      
      .new-chat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        background: #00C853;
        color: #fff;
        border: none;
        cursor: pointer;
        transition: background 0.3s;
        font-weight: 500;
        font-size: 1rem;
        
        &:hover {
          background: #388E3C;
        }
        .icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #fff;
        }
      }
    }
    
    .history-list {
      flex: 1;
      overflow-y: auto;  // 允许历史记录滚动
      padding: 0 1rem 1rem;
      
      .history-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.3s;
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        &.active {
          background: rgba(0, 124, 240, 0.1);
        }
        
        .icon {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        .title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;  // 防止内容溢出

    .chat-main-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 1.4rem 0.8rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      background: linear-gradient(110deg, rgba(0, 169, 184, 0.08), rgba(59, 178, 115, 0.04) 52%, rgba(255, 255, 255, 0.7));

      .header-meta {
        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #1f3348;
        }

        p {
          margin: 0.2rem 0 0;
          font-size: 0.82rem;
          color: #5c6e84;
        }
      }

      .header-badges {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        height: 1.75rem;
        padding: 0 0.65rem;
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .chat-no {
        color: #0a7896;
        background: rgba(0, 169, 184, 0.14);
      }

      .msg-count {
        color: #1a7a51;
        background: rgba(59, 178, 115, 0.14);
      }
    }
    
    .messages {
      flex: 1;
      overflow-y: auto;  // 只允许消息区域滚动
      padding: 1.1rem 1.6rem 1.3rem;
    }
    
    .input-area {
      flex-shrink: 0;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.98);
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .selected-files {
        background: rgba(0, 0, 0, 0.02);
        border-radius: 0.75rem;
        padding: 0.75rem;
        border: 1px solid rgba(0, 0, 0, 0.05);
        
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: #fff;
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          &:hover {
            background: rgba(0, 124, 240, 0.02);
            border-color: rgba(0, 124, 240, 0.2);
          }
          
          .file-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            
            .icon {
              width: 1.5rem;
              height: 1.5rem;
              color: #007CF0;
            }
            
            .file-name {
              font-size: 0.875rem;
              color: #333;
              font-weight: 500;
            }
            
            .file-size {
              font-size: 0.75rem;
              color: #666;
              background: rgba(0, 0, 0, 0.05);
              padding: 0.25rem 0.5rem;
              border-radius: 1rem;
            }
          }
          
          .remove-btn {
            padding: 0.375rem;
            border: none;
            background: rgba(0, 0, 0, 0.05);
            color: #666;
            cursor: pointer;
            border-radius: 0.375rem;
            transition: all 0.2s ease;
            
            &:hover {
              background: #ff4d4f;
              color: #fff;
            }
            
            .icon {
              width: 1.25rem;
              height: 1.25rem;
            }
          }
        }
      }

      .input-row {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
        background: #fff;
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        .file-upload {
          .hidden {
            display: none;
          }
          
          .upload-btn {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 0.75rem;
            background: #00C853;
            color: #fff;
            cursor: pointer;
            transition: background 0.3s;
            
            &:hover:not(:disabled) {
              background: #388E3C;
            }
            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            .icon {
              width: 1.25rem;
              height: 1.25rem;
              color: #fff;
            }
          }
        }

        textarea {
          flex: 1;
          resize: none;
          border: none;
          background: transparent;
          padding: 0.75rem;
          color: inherit;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          max-height: 150px;
          
          &:focus {
            outline: none;
          }
          
          &::placeholder {
            color: #999;
          }
        }
        
        .send-button {
          background: #00C853;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s;
          
          &:hover:not(:disabled) {
            background: #388E3C;
          }
          &:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .icon {
            width: 1.25rem;
            height: 1.25rem;
            color: #fff;
          }
        }
      }
    }
  }
}

.dark {
  .sidebar {
    background: rgba(40, 40, 40, 0.95);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    .new-chat {
      background: #00C853;
      color: #fff;
      &:hover {
        background: #388E3C;
      }
      .icon {
        color: #fff;
      }
    }
  }
  
  .chat-main {
    background: rgba(40, 40, 40, 0.95);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

    .chat-main-header {
      border-bottom-color: rgba(255, 255, 255, 0.08);
      background: linear-gradient(110deg, rgba(0, 169, 184, 0.18), rgba(59, 178, 115, 0.1) 55%, rgba(26, 26, 26, 0.35));

      .header-meta {
        h3 {
          color: #e6f4ff;
        }

        p {
          color: #a8bfd8;
        }
      }

      .chat-no {
        color: #8ee6f2;
        background: rgba(0, 169, 184, 0.2);
      }

      .msg-count {
        color: #8ce8b8;
        background: rgba(59, 178, 115, 0.2);
      }
    }
    
    .input-area {
      background: rgba(30, 30, 30, 0.98);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      
      .selected-files {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.05);
        
        .file-item {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
          
          &:hover {
            background: rgba(0, 124, 240, 0.1);
            border-color: rgba(0, 124, 240, 0.3);
          }
          
          .file-info {
            .icon {
              color: #00C853;
            }
            
            .file-name {
              color: #fff;
            }
            
            .file-size {
              color: #999;
              background: rgba(255, 255, 255, 0.1);
            }
          }
          
          .remove-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #999;
            
            &:hover {
              background: #ff4d4f;
              color: #fff;
            }
          }
        }
      }

      .input-row {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.05);
        box-shadow: none;

        textarea {
          color: #fff;
          
          &::placeholder {
            color: #666;
          }
        }

        .file-upload .upload-btn {
          background: #00C853;
          color: #fff;
          &:hover:not(:disabled) {
            background: #388E3C;
          }
          .icon {
            color: #fff;
          }
        }
      }
    }
  }
  
  .history-item {
    &:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    
    &.active {
      background: rgba(0, 124, 240, 0.2) !important;
    }
  }
  
  textarea {
    background: rgba(255, 255, 255, 0.05) !important;
    
    &:focus {
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  .input-area {
    .file-upload {
      .upload-btn {
        background: #00C853;
        color: #fff;
        &:hover:not(:disabled) {
          background: #388E3C;
        }
        .icon {
          color: #fff;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .ai-chat {
    .chat-container {
      padding: 0;
    }
    
    .sidebar {
      display: none; // 在移动端隐藏侧边栏
    }
    
    .chat-main {
      border-radius: 0;

      .chat-main-header {
        padding: 0.78rem 0.9rem 0.68rem;
        align-items: flex-start;
        flex-direction: column;

        .header-badges {
          width: 100%;
          justify-content: flex-start;
          flex-wrap: wrap;
        }
      }

      .messages {
        padding: 0.9rem 0.9rem 1rem;
      }
    }
  }
}
</style>
