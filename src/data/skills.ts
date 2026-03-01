export interface SkillCategory {
  id: string
  label: string
  emoji: string
}

export interface SkillItem {
  id: string
  name: string
  title: string
  summary: string
  description: string
  categories: string[]
  trendDelta: string
  weeklyInstalls: number
  updatedAt: string
  installCommand: string
  repoUrl: string
  scenarios: string[]
}

export interface FaqItem {
  id: number
  title: string
  answer: string
}


export const skillCategories: SkillCategory[] = [
  { id: 'all', label: '全部', emoji: '🌐' },
  { id: 'claude', label: 'Claude官方', emoji: '✨' },
  { id: 'efficiency', label: '效率工具', emoji: '⚡' },
  { id: 'dev', label: '软件开发', emoji: '💻' },
  { id: 'data', label: '数据与分析', emoji: '📊' },
  { id: 'ops', label: '开发运维', emoji: '🚀' },
  { id: 'docs', label: '文档处理', emoji: '📄' },
  { id: 'content', label: '内容与媒体', emoji: '🎨' },
  { id: 'security', label: '测试与安全', emoji: '🔒' },
]

export const skillCategoryNameMap: Record<string, string> = Object.fromEntries(
  skillCategories.map((category) => [category.id, category.label])
)

export const skillsTrendList: SkillItem[] = [
  {
    id: 'frontend-design',
    name: 'frontend-design',
    title: 'Frontend Design Studio',
    summary: '打造高辨识度的生产级前端界面，强化组件、动效与视觉叙事一致性。',
    description:
      '面向官网、落地页、Dashboard 等场景，提供布局策略、视觉语言约束与高质感实现建议，避免同质化页面风格。',
    categories: ['efficiency', 'dev', 'content', 'claude'],
    trendDelta: '+38%',
    weeklyInstalls: 3240,
    updatedAt: '2026-02-28',
    installCommand: 'npx add-skill anthropics/frontend-design',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/frontend-design',
    scenarios: ['官网改版与首屏转化提升', '多模块视觉统一', '组件级 UI 细节提升'],
  },
  {
    id: 'pdf',
    name: 'pdf',
    title: 'PDF Workflow',
    summary: '聚焦 PDF 解析、抽取、拆分与生成，快速搭建文档自动化流程。',
    description:
      '适合合同、报告、票据等结构化和半结构化文档处理，支持文本/表格提取、分页拆分和结果回写。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+26%',
    weeklyInstalls: 2890,
    updatedAt: '2026-02-26',
    installCommand: 'npx add-skill anthropics/pdf',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/pdf',
    scenarios: ['批量 PDF 问答', '合同条款提取', '知识库前置清洗'],
  },
  {
    id: 'docx',
    name: 'docx',
    title: 'DOCX Composer',
    summary: '处理 Word 文档结构、段落与样式，面向报告和制度文档自动化编排。',
    description:
      '覆盖模板填充、样式统一、章节拆分和内容重组，适合复用已有 Word 资产并形成稳定输出格式。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+23%',
    weeklyInstalls: 2140,
    updatedAt: '2026-02-25',
    installCommand: 'npx add-skill anthropics/docx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/docx',
    scenarios: ['制度文档批量更新', '投标书自动生成', '多模板文档合并输出'],
  },
  {
    id: 'skill-creator',
    name: 'skill-creator',
    title: 'Skill Creator Pro',
    summary: '把提示词、工具链与场景流程沉淀为可复用的标准技能模板。',
    description:
      '帮助团队定义技能输入输出、边界条件、验证步骤和发布规范，降低多人协作下的能力漂移风险。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+21%',
    weeklyInstalls: 1960,
    updatedAt: '2026-02-24',
    installCommand: 'npx add-skill anthropics/skill-creator',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/skill-creator',
    scenarios: ['团队技能模板建设', '标准化交付资产沉淀', '技能版本治理'],
  },
  {
    id: 'pptx',
    name: 'pptx',
    title: 'PPTX Builder',
    summary: '自动化生成和编辑演示文稿，支持模板复用与内容按页编排。',
    description:
      '可把结构化文本转成演示页面，覆盖封面、目录、图文页与结论页，适合周报和方案汇报场景。',
    categories: ['docs', 'content'],
    trendDelta: '+18%',
    weeklyInstalls: 1570,
    updatedAt: '2026-02-22',
    installCommand: 'npx add-skill anthropics/pptx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/pptx',
    scenarios: ['周报自动出稿', '方案提案快速成稿', '培训课件批量生成'],
  },
  {
    id: 'xlsx',
    name: 'xlsx',
    title: 'XLSX Analyst',
    summary: '面向表格读写与公式处理，快速落地数据清洗与报表自动化。',
    description:
      '支持多表合并、字段映射、统计计算和样式设置，适合经营分析、数据运营和对账场景。',
    categories: ['efficiency', 'docs', 'data'],
    trendDelta: '+15%',
    weeklyInstalls: 1490,
    updatedAt: '2026-02-21',
    installCommand: 'npx add-skill anthropics/xlsx',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/xlsx',
    scenarios: ['运营报表自动化', '多源数据合并', '财务对账辅助'],
  },
  {
    id: 'java-dev',
    name: 'java-dev',
    title: 'Java Dev Kit',
    summary: '覆盖 Java 项目开发流程，从工程结构到代码规范给出一致实践。',
    description:
      '提供分层设计、异常处理、接口建模与单元测试建议，适用于 Spring/Spring Boot 项目快速落地。',
    categories: ['dev'],
    trendDelta: '+14%',
    weeklyInstalls: 1320,
    updatedAt: '2026-02-20',
    installCommand: 'npx add-skill community/java-dev',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/java-dev',
    scenarios: ['新项目脚手架落地', '历史项目重构', '接口质量治理'],
  },
  {
    id: 'brand-guidelines',
    name: 'brand-guidelines',
    title: 'Brand Guidelines',
    summary: '将品牌规范自动应用到文案和视觉输出，减少多渠道内容偏差。',
    description:
      '适配品牌语言、术语与风格约束，帮助内容团队在多平台输出时保持一致调性与识别度。',
    categories: ['data', 'dev', 'content'],
    trendDelta: '+12%',
    weeklyInstalls: 1180,
    updatedAt: '2026-02-20',
    installCommand: 'npx add-skill community/brand-guidelines',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/brand-guidelines',
    scenarios: ['品牌文案统一', '多渠道营销素材治理', '视觉与语言规范校验'],
  },
  {
    id: 'skill-lookup',
    name: 'skill-lookup',
    title: 'Skill Lookup',
    summary: '支持在技能生态中按关键词与分类检索，快速定位可复用能力。',
    description:
      '提供技能发现、评分参考和安装建议，帮助研发与运营团队降低“从零搭建”的时间成本。',
    categories: ['efficiency', 'data'],
    trendDelta: '+11%',
    weeklyInstalls: 1040,
    updatedAt: '2026-02-18',
    installCommand: 'npx add-skill community/skill-lookup',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/skill-lookup',
    scenarios: ['技能选型评估', '团队能力补齐', '场景化方案拼装'],
  },
  {
    id: 'mcp-builder',
    name: 'mcp-builder',
    title: 'MCP Builder',
    summary: '通过统一规范把现有服务封装为 MCP 工具，降低多系统接入复杂度。',
    description:
      '支持工具定义、参数校验与注册发布，适合把 HTTP/RPC 业务能力快速接入 Agent 工作流。',
    categories: ['data', 'claude', 'ops'],
    trendDelta: '+10%',
    weeklyInstalls: 980,
    updatedAt: '2026-02-17',
    installCommand: 'npx add-skill community/mcp-builder',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/mcp-builder',
    scenarios: ['遗留系统能力接入', '工具统一发布', 'MCP 工作流编排'],
  },
  {
    id: 'doc-coauthoring',
    name: 'doc-coauthoring',
    title: 'Doc Coauthoring',
    summary: '支持多人协作文档的结构化写作与版本协同，提高复杂文档交付速度。',
    description:
      '适用于 PRD、技术方案、项目复盘等文档，提供章节骨架、差异提示和改写建议。',
    categories: ['efficiency', 'docs'],
    trendDelta: '+9%',
    weeklyInstalls: 860,
    updatedAt: '2026-02-16',
    installCommand: 'npx add-skill community/doc-coauthoring',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/doc-coauthoring',
    scenarios: ['PRD 协作撰写', '技术方案联编', '复盘文档沉淀'],
  },
  {
    id: 'web-design-guidelines',
    name: 'web-design-guidelines',
    title: 'Web Design Guidelines',
    summary: '提供网页规范与可用性建议，减少界面一致性和可访问性问题。',
    description:
      '覆盖信息层级、组件规范、交互反馈和可访问性检查，帮助前端在开发阶段前置质量门槛。',
    categories: ['security', 'efficiency'],
    trendDelta: '+8%',
    weeklyInstalls: 740,
    updatedAt: '2026-02-15',
    installCommand: 'npx add-skill community/web-design-guidelines',
    repoUrl: 'https://github.com/anthropics/skills/tree/main/web-design-guidelines',
    scenarios: ['UI 评审前置', '可访问性检查', '设计规范落地'],
  },
]

export const faqList: FaqItem[] = [
  {
    id: 1,
    title: '什么是 Agent Skills？',
    answer:
      'Agent Skills 是可复用的能力包，通过 SKILL.md 描述规则与步骤，并可附带脚本、模板和参考资料，帮助模型在特定任务上稳定发挥。',
  },
  {
    id: 2,
    title: '如何安装 Skills？',
    answer:
      '常见方式是通过技能市场或仓库下载后放到本地 skills 目录。也可在页面里复制安装命令，直接在终端执行完成安装。',
  },
  {
    id: 3,
    title: 'Skills 如何工作？',
    answer:
      '系统先读取每个 Skill 的名称和描述，当用户任务匹配时再按需加载完整说明与资源，实现低开销的动态启用。',
  },
  {
    id: 4,
    title: '可以同时使用多个 Skills 吗？',
    answer:
      '可以。一个任务通常会组合多个 Skill 协同执行，比如文档处理 + 数据分析 + 开发工具，按上下文自动调度。',
  },
  {
    id: 5,
    title: '如何获取最新 Skills？',
    answer:
      '可通过趋势榜查看最近活跃与安装变化，也可以订阅官方仓库更新。我们建议按分类筛选后再看近 7 天趋势。',
  },
  {
    id: 6,
    title: '可以创建自己的 Skills 吗？',
    answer:
      '可以。你可以基于规范创建自定义 Skill，将团队流程、领域知识和工具脚本沉淀为可复用能力，并持续版本化维护。',
  },
]


export const formatSkillCategory = (categoryId: string) => {
  return skillCategoryNameMap[categoryId] || categoryId
}

export const formatSkillInstalls = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

export const getSkillById = (skillId: string) => {
  return skillsTrendList.find((skill) => skill.id === skillId) || null
}

export const getRecommendedSkills = (skillId: string, limit = 5) => {
  return skillsTrendList.filter((skill) => skill.id !== skillId).slice(0, limit)
}
