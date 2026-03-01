<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/vue/24/outline'
import {
  faqList,
  formatSkillCategory,
  formatSkillInstalls,
  getRecommendedSkills,
  getSkillById,
} from '../data/skills'

const route = useRoute()
const router = useRouter()

const skillId = computed(() => String(route.params.skillId || '').toLowerCase())
const skill = computed(() => getSkillById(skillId.value))
const recommendedSkills = computed(() => {
  if (!skill.value) return []
  return getRecommendedSkills(skill.value.id, 6)
})

const detailRows = computed(() => {
  if (!skill.value) return []
  return [
    { key: 'name', value: skill.value.name },
    { key: 'description', value: skill.value.description },
    { key: 'categories', value: skill.value.categories.map((tag) => formatSkillCategory(tag)).join(' / ') },
    { key: 'trend', value: `周趋势 ${skill.value.trendDelta}` },
    { key: 'weekly_installs', value: formatSkillInstalls(skill.value.weeklyInstalls) },
    { key: 'updated_at', value: skill.value.updatedAt },
  ]
})

const copied = ref(false)
const copyError = ref('')

const fallbackCopyText = (text: string) => {
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.top = '0'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  input.focus()
  input.select()
  let didCopy = false
  try {
    didCopy = document.execCommand('copy')
  } catch (_error) {
    didCopy = false
  }
  document.body.removeChild(input)
  return didCopy
}

const copyInstallCommand = async () => {
  if (!skill.value) return
  copyError.value = ''
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(skill.value.installCommand)
    } else {
      const didCopy = fallbackCopyText(skill.value.installCommand)
      if (!didCopy) {
        throw new Error('copy-failed')
      }
    }
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1700)
  } catch (_error) {
    copied.value = false
    copyError.value = '复制失败，请手动复制命令。'
    window.setTimeout(() => {
      copyError.value = ''
    }, 2400)
  }
}

const openSkillDetail = (nextSkillId: string) => {
  router.push({ name: 'skills-detail', params: { skillId: nextSkillId } })
}
</script>

<template>
  <main class="skills-detail-page">
    <section v-if="skill" class="detail-shell">
      <div class="breadcrumbs">
        <RouterLink to="/coming-soon/skills" class="back-link">
          <ArrowLeftIcon class="back-icon" />
          返回 Skills 趋势榜
        </RouterLink>
        <span class="divider">/</span>
        <span class="current">{{ skill.name }}</span>
      </div>

      <header class="hero-card">
        <div class="hero-main">
          <div class="hero-badges">
            <span class="hero-badge">TRENDING</span>
            <span class="hero-badge hero-badge-soft">演示数据</span>
          </div>
          <h1>{{ skill.title }}</h1>
          <p class="hero-slug">{{ skill.name }}</p>
          <p class="hero-summary">{{ skill.summary }}</p>
          <div class="hero-tags">
            <span v-for="tag in skill.categories" :key="`hero-${skill.id}-${tag}`">{{ formatSkillCategory(tag) }}</span>
          </div>
        </div>

        <a :href="skill.repoUrl" target="_blank" rel="noopener noreferrer" class="github-btn">
          <ArrowTopRightOnSquareIcon class="github-icon" />
          访问 GitHub
        </a>
      </header>

      <div class="detail-grid">
        <article class="content-column">
          <section class="panel markdown-panel">
            <div class="panel-head">
              <h2>
                <DocumentTextIcon class="panel-title-icon" />
                Skills.MD
              </h2>
              <span class="panel-note">结构化说明</span>
            </div>

            <div class="kv-table">
              <div v-for="row in detailRows" :key="row.key" class="kv-row">
                <span class="kv-key">{{ row.key }}</span>
                <span class="kv-value">{{ row.value }}</span>
              </div>
            </div>

            <p class="description">
              {{ skill.description }}
            </p>
          </section>

          <section class="panel scenario-panel">
            <div class="panel-head">
              <h2>适用场景</h2>
              <span class="panel-note">Quick Use Cases</span>
            </div>
            <ul class="scene-list">
              <li v-for="scene in skill.scenarios" :key="scene">{{ scene }}</li>
            </ul>
          </section>

          <section class="panel faq-panel">
            <div class="faq-head">
              <h2>
                <QuestionMarkCircleIcon class="panel-title-icon" />
                常见问题
              </h2>
              <p>关于安装、调用与维护的高频问题</p>
            </div>
            <div class="faq-grid">
              <article v-for="item in faqList" :key="item.id" class="faq-card">
                <h3>
                  <span>Q{{ item.id }}</span>
                  {{ item.title }}
                </h3>
                <p>{{ item.answer }}</p>
              </article>
            </div>
          </section>
        </article>

        <aside class="side-column">
          <section class="side-card install-card">
            <h3>快捷安装</h3>
            <p>复制命令到终端后即可安装</p>
            <div class="command-row">
              <code>{{ skill.installCommand }}</code>
              <button type="button" class="copy-btn" @click="copyInstallCommand">
                <CheckCircleIcon v-if="copied" class="copy-icon" />
                <ClipboardDocumentIcon v-else class="copy-icon" />
                {{ copied ? '已复制' : '复制' }}
              </button>
            </div>
            <p v-if="copyError" class="copy-error">{{ copyError }}</p>
          </section>

          <section class="side-card stats-card">
            <h3>趋势状态</h3>
            <ul>
              <li>
                <span>周趋势</span>
                <strong>{{ skill.trendDelta }}</strong>
              </li>
              <li>
                <span>周安装</span>
                <strong>{{ formatSkillInstalls(skill.weeklyInstalls) }}</strong>
              </li>
              <li>
                <span>最近更新</span>
                <strong>{{ skill.updatedAt }}</strong>
              </li>
            </ul>
          </section>

          <section class="side-card recommendation-card">
            <h3>Skills 推荐</h3>
            <ul>
              <li v-for="item in recommendedSkills" :key="`recommend-${item.id}`">
                <button type="button" class="recommend-link" @click="openSkillDetail(item.id)">
                  <span>{{ item.title }}</span>
                  <em>{{ item.trendDelta }}</em>
                </button>
                <p>{{ item.summary }}</p>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </section>

    <section v-else class="not-found">
      <h1>没有找到这个 Skill</h1>
      <p>请返回趋势榜重新选择。</p>
      <RouterLink to="/coming-soon/skills" class="not-found-link">返回 Skills 趋势榜</RouterLink>
    </section>
  </main>
</template>

<style scoped lang="scss">
.skills-detail-page {
  min-height: calc(100vh - 76px);
  padding: 1.2rem clamp(0.85rem, 2.3vw, 2.2rem) 2rem;
  background:
    radial-gradient(circle at 8% 14%, rgba(0, 169, 184, 0.16), transparent 34%),
    radial-gradient(circle at 92% 10%, rgba(255, 176, 92, 0.18), transparent 36%),
    linear-gradient(145deg, #f4f7fb, #f6f9ff 52%, #f7f5f1);
}

.detail-shell {
  width: min(1320px, 100%);
  margin: 0 auto;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.82rem;
  color: #4f6a86;
  font-size: 0.86rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #145e86;
  text-decoration: none;
  font-weight: 610;
}

.back-icon {
  width: 0.92rem;
  height: 0.92rem;
}

.divider {
  color: #90a5bb;
}

.current {
  color: #2e4f67;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}

.hero-card {
  border-radius: 1.14rem;
  border: 1px solid rgba(26, 78, 112, 0.14);
  background:
    radial-gradient(circle at 92% 18%, rgba(255, 193, 135, 0.2), transparent 35%),
    linear-gradient(132deg, rgba(255, 255, 255, 0.97), rgba(243, 251, 255, 0.95));
  box-shadow: 0 16px 34px rgba(19, 51, 74, 0.1);
  padding: clamp(0.9rem, 2vw, 1.2rem);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.hero-main {
  min-width: 0;
}

.hero-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hero-badge {
  border-radius: 999px;
  padding: 0.18rem 0.56rem;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  font-weight: 700;
  color: #176879;
  border: 1px solid rgba(23, 104, 121, 0.2);
  background: rgba(0, 169, 184, 0.12);
}

.hero-badge-soft {
  color: #2c6188;
  border-color: rgba(47, 136, 255, 0.2);
  background: rgba(47, 136, 255, 0.1);
}

.hero-card h1 {
  margin: 0.5rem 0 0;
  font-size: clamp(1.48rem, 2.6vw, 2.04rem);
  line-height: 1.16;
  color: #122c43;
  font-weight: 560;
  letter-spacing: 0.005em;
  font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}

.hero-slug {
  margin: 0.26rem 0 0;
  color: #62819b;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}

.hero-summary {
  margin: 0.46rem 0 0;
  color: #375a76;
  font-size: 0.96rem;
  line-height: 1.66;
  max-width: 76ch;
}

.hero-tags {
  margin-top: 0.58rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.38rem;

  span {
    border-radius: 999px;
    padding: 0.18rem 0.56rem;
    font-size: 0.76rem;
    color: #275f8f;
    border: 1px solid rgba(47, 136, 255, 0.2);
    background: rgba(47, 136, 255, 0.1);
  }
}

.github-btn {
  flex-shrink: 0;
  border-radius: 0.74rem;
  padding: 0.48rem 0.78rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 650;
  color: #fff;
  background: linear-gradient(120deg, #2f88ff 0%, #1a66c1 100%);
}

.github-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.detail-grid {
  margin-top: 0.96rem;
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(292px, 1fr);
  gap: 0.9rem;
  align-items: start;
}

.content-column {
  display: grid;
  gap: 0.85rem;
}

.panel {
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 9px 22px rgba(16, 50, 76, 0.06);
  padding: 0.86rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  h2 {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #122a40;
    font-size: 1.2rem;
    line-height: 1.2;
    font-weight: 560;
    font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  }
}

.panel-title-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: #2f88ff;
}

.panel-note {
  border-radius: 999px;
  padding: 0.16rem 0.5rem;
  font-size: 0.72rem;
  color: #3a688a;
  background: rgba(47, 136, 255, 0.11);
  border: 1px solid rgba(47, 136, 255, 0.17);
}

.kv-table {
  margin-top: 0.58rem;
  border: 1px solid rgba(26, 78, 112, 0.12);
  border-radius: 0.82rem;
  overflow: hidden;
}

.kv-row {
  display: grid;
  grid-template-columns: minmax(96px, 0.26fr) minmax(0, 1fr);
}

.kv-row + .kv-row {
  border-top: 1px solid rgba(26, 78, 112, 0.08);
}

.kv-key,
.kv-value {
  padding: 0.56rem 0.62rem;
}

.kv-key {
  background: rgba(245, 250, 255, 0.95);
  color: #274a63;
  font-size: 0.82rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
}

.kv-value {
  color: #355873;
  line-height: 1.6;
  font-size: 0.9rem;
  word-break: break-word;
}

.description {
  margin: 0.72rem 0 0;
  color: #49677f;
  font-size: 0.94rem;
  line-height: 1.68;
}

.scene-list {
  margin: 0.58rem 0 0;
  padding-left: 1.04rem;
  color: #375972;
  line-height: 1.7;

  li + li {
    margin-top: 0.3rem;
  }
}

.faq-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.72rem;

  h2 {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #122a40;
    font-size: 1.2rem;
    line-height: 1.2;
    font-weight: 560;
    font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  }

  p {
    margin: 0;
    color: #67839a;
    font-size: 0.86rem;
  }
}

.faq-grid {
  margin-top: 0.72rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.64rem;
}

.faq-card {
  border-radius: 0.78rem;
  border: 1px solid rgba(26, 78, 112, 0.11);
  background: rgba(255, 255, 255, 0.95);
  padding: 0.7rem 0.72rem;

  h3 {
    margin: 0;
    color: #132e45;
    font-size: 1rem;
    line-height: 1.45;
    font-weight: 560;

    span {
      margin-right: 0.36rem;
      color: #2a72af;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
    }
  }

  p {
    margin: 0.42rem 0 0;
    color: #4d6c86;
    line-height: 1.66;
    font-size: 0.9rem;
  }
}

.side-column {
  display: grid;
  gap: 0.72rem;
  position: sticky;
  top: calc(76px + 0.76rem);
}

.side-card {
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 0.94rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(16, 50, 76, 0.06);
  padding: 0.74rem;

  h3 {
    margin: 0;
    color: #133047;
    font-size: 1.02rem;
    line-height: 1.3;
    font-weight: 560;
    font-family: 'Avenir Next', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  }

  p {
    margin: 0.32rem 0 0;
    color: #587490;
    font-size: 0.89rem;
    line-height: 1.6;
  }
}

.command-row {
  margin-top: 0.58rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(26, 78, 112, 0.16);
  background: #fff;
  padding: 0.46rem;
  display: flex;
  align-items: center;
  gap: 0.46rem;

  code {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    color: #244a67;
    font-size: 0.84rem;
    font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  }
}

.copy-btn {
  border: 1px solid rgba(47, 136, 255, 0.22);
  border-radius: 0.62rem;
  background: rgba(47, 136, 255, 0.11);
  color: #205684;
  padding: 0.34rem 0.56rem;
  font-size: 0.8rem;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  cursor: pointer;
}

.copy-btn:hover {
  background: rgba(47, 136, 255, 0.19);
}

.copy-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.copy-error {
  margin: 0.42rem 0 0;
  color: #cb4838;
  font-size: 0.82rem;
}

.stats-card ul {
  margin: 0.52rem 0 0;
  padding: 0;
  list-style: none;
}

.stats-card li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.42rem 0;
  border-bottom: 1px dashed rgba(26, 78, 112, 0.12);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  span {
    color: #5c7590;
    font-size: 0.84rem;
  }

  strong {
    color: #163e5e;
    font-size: 0.9rem;
    font-weight: 620;
    font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  }
}

.recommendation-card ul {
  margin: 0.54rem 0 0;
  padding: 0;
  list-style: none;
}

.recommendation-card li + li {
  margin-top: 0.46rem;
}

.recommend-link {
  width: 100%;
  border: 1px solid rgba(26, 78, 112, 0.14);
  border-radius: 0.66rem;
  background: rgba(247, 252, 255, 0.95);
  padding: 0.42rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  color: #183f5e;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 0.9rem;
    font-weight: 560;
    line-height: 1.35;
  }

  em {
    font-style: normal;
    color: #11825f;
    font-size: 0.8rem;
    font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, Monaco, Consolas, monospace;
  }
}

.recommend-link:hover {
  border-color: rgba(18, 179, 122, 0.42);
  background: rgba(18, 179, 122, 0.1);
}

.recommendation-card p {
  margin: 0.28rem 0 0;
  color: #607a93;
  font-size: 0.83rem;
  line-height: 1.55;
}

.not-found {
  width: min(680px, 100%);
  margin: 2rem auto;
  border-radius: 1rem;
  border: 1px solid rgba(26, 78, 112, 0.14);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(20, 56, 82, 0.08);
  padding: 1.3rem;
  text-align: center;

  h1 {
    margin: 0;
    color: #133049;
    font-weight: 560;
  }

  p {
    margin: 0.52rem 0 0;
    color: #5e7890;
  }
}

.not-found-link {
  margin-top: 0.8rem;
  display: inline-flex;
  text-decoration: none;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  color: #135f79;
  border: 1px solid rgba(19, 95, 121, 0.26);
  background: rgba(0, 169, 184, 0.1);
  font-weight: 620;
}

@media (max-width: 1120px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}

@media (max-width: 860px) {
  .hero-card {
    flex-direction: column;
  }

  .github-btn {
    width: fit-content;
  }

  .faq-grid {
    grid-template-columns: 1fr;
  }

  .faq-head {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 680px) {
  .command-row {
    flex-direction: column;
    align-items: stretch;
  }

  .copy-btn {
    width: 100%;
    justify-content: center;
  }

  .kv-row {
    grid-template-columns: 1fr;
  }

  .kv-key {
    border-bottom: 1px solid rgba(26, 78, 112, 0.08);
  }
}

:global(.dark) .skills-detail-page {
  background:
    radial-gradient(circle at 8% 14%, rgba(34, 170, 210, 0.14), transparent 34%),
    radial-gradient(circle at 92% 10%, rgba(255, 158, 95, 0.18), transparent 36%),
    linear-gradient(145deg, #121d2a, #162434 52%, #181f2a);
}

:global(.dark) .hero-card,
:global(.dark) .panel,
:global(.dark) .side-card,
:global(.dark) .faq-card,
:global(.dark) .not-found {
  background: rgba(14, 26, 40, 0.9);
  border-color: rgba(177, 220, 255, 0.2);
}

:global(.dark) .hero-card h1,
:global(.dark) .panel-head h2,
:global(.dark) .faq-head h2,
:global(.dark) .side-card h3,
:global(.dark) .not-found h1 {
  color: #e5f3ff;
}

:global(.dark) .hero-slug,
:global(.dark) .current,
:global(.dark) .description,
:global(.dark) .scene-list,
:global(.dark) .faq-card p,
:global(.dark) .side-card p,
:global(.dark) .recommendation-card p,
:global(.dark) .not-found p,
:global(.dark) .stats-card li span {
  color: #a8bfd6;
}

:global(.dark) .hero-summary,
:global(.dark) .kv-value,
:global(.dark) .faq-card h3,
:global(.dark) .stats-card li strong,
:global(.dark) .recommend-link span {
  color: #d7e9fb;
}

:global(.dark) .kv-key,
:global(.dark) .recommend-link,
:global(.dark) .command-row {
  background: rgba(9, 20, 33, 0.86);
  border-color: rgba(177, 220, 255, 0.2);
}

:global(.dark) .copy-btn {
  color: #c9e5ff;
  border-color: rgba(177, 220, 255, 0.2);
  background: rgba(89, 166, 255, 0.16);
}

:global(.dark) .panel-note,
:global(.dark) .hero-badge-soft,
:global(.dark) .hero-tags span {
  color: #cfe5ff;
  border-color: rgba(140, 193, 255, 0.25);
  background: rgba(89, 166, 255, 0.17);
}

:global(.dark) .hero-badge {
  color: #cbffff;
  border-color: rgba(113, 232, 240, 0.28);
  background: rgba(0, 169, 184, 0.2);
}

:global(.dark) .back-link,
:global(.dark) .not-found-link {
  color: #bfe9ff;
}

:global(.dark) .not-found-link {
  border-color: rgba(113, 232, 240, 0.32);
  background: rgba(0, 169, 184, 0.18);
}

:global(.dark) .copy-error {
  color: #ff9d90;
}
</style>
