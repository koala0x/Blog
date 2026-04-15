<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router'

import { getPostBySlug, listPostIndex, type BlogCategory, type BlogPostIndex } from './lib/blog'

const posts: BlogPostIndex[] = listPostIndex()
const selectedCategory = ref<'all' | BlogCategory>('all')
const theme = ref<'light' | 'dark'>('light')
const searchQuery = ref('')

const route = useRoute()
const router = useRouter()

const slug = computed(() => String(route.params.slug ?? ''))
const currentPost = computed(() => (slug.value ? getPostBySlug(slug.value) : undefined))

function applyTheme(next: 'light' | 'dark') {
  theme.value = next
  document.documentElement.dataset.theme = next
  localStorage.setItem('theme', next)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

function openPost(nextSlug: string) {
  router.push({ name: 'post', params: { slug: nextSlug }, query: route.query })
}

function goHome() {
  const query: LocationQueryRaw = { ...route.query }
  if (selectedCategory.value === 'all') {
    delete query.cat
  } else {
    query.cat = selectedCategory.value
  }
  router.push({ name: 'home', query })
}

function normalizeQuery(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

const filteredPosts = computed(() => {
  const categoryFiltered =
    selectedCategory.value === 'all'
      ? posts
      : posts.filter((p) => p.category === selectedCategory.value)

  const tokens = normalizeQuery(searchQuery.value)
  if (tokens.length === 0) return categoryFiltered

  return categoryFiltered.filter((p) => tokens.every((t) => p.searchText.includes(t)))
})

function setCategory(category: 'all' | BlogCategory) {
  selectedCategory.value = category
  const query: LocationQueryRaw = { ...route.query }
  if (category === 'all') {
    delete query.cat
  } else {
    query.cat = category
  }
  router.replace({ query })
}

function categoryLabel(category: BlogCategory): string {
  if (category === 'trade') return '交易日志'
  if (category === 'tech') return '技术日志'
  return '其他'
}

watch(
  () => currentPost.value?.slug,
  async () => {
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'auto' })
  },
)

watch(
  () => route.query.cat,
  (cat) => {
    const v = typeof cat === 'string' ? cat : ''
    if (v === 'trade' || v === 'tech' || v === 'other') {
      selectedCategory.value = v
      return
    }
    selectedCategory.value = 'all'
  },
  { immediate: true },
)

watch(
  () => route.query.q,
  (q) => {
    searchQuery.value = typeof q === 'string' ? q : ''
  },
  { immediate: true },
)

let searchTimer: number | undefined
watch(
  () => searchQuery.value,
  (q) => {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
      const query: LocationQueryRaw = { ...route.query }
      const next = q.trim()
      if (!next) {
        delete query.q
      } else {
        query.q = next
      }
      router.replace({ query })
    }, 150)
  },
)

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved)
  } else {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }

  if (!slug.value) return
  const meta = posts.find((p) => p.slug === slug.value)
  if (meta && selectedCategory.value === 'all') selectedCategory.value = meta.category
})
</script>

<template>
  <main class="container">
    <div v-if="currentPost" class="detail-layout">
      <section class="detail-content">
        <section class="post">
          <div class="post-top">
            <button class="back-top" type="button" @click="goHome">← 返回列表</button>
          </div>
          <p class="post-date">{{ currentPost.date }} · {{ categoryLabel(currentPost.category) }}</p>
          <h2 class="post-h1">{{ currentPost.title }}</h2>
          <ul class="tags">
            <li v-for="tag in currentPost.tags" :key="tag" class="tag">#{{ tag }}</li>
          </ul>
          <article class="markdown" v-html="currentPost.html"></article>
        </section>
      </section>
    </div>

    <div v-else class="layout">
      <aside class="sidebar">
        <section class="sidebar-section">
          <div class="section-head">
            <div class="section-title">分类</div>
            <button
              class="theme-toggle"
              type="button"
              :aria-label="theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'"
              @click="toggleTheme"
            >
              <svg
                v-if="theme === 'dark'"
                class="theme-icon"
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M12 18.5a6.5 6.5 0 1 1 0-13a6.5 6.5 0 0 1 0 13Zm0-15.5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-9a1 1 0 0 1 1 1a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1ZM4 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm14.78-6.78a1 1 0 0 1 1.41 0a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71Zm-12.02 12.02a1 1 0 0 1 1.41 0a1 1 0 0 1 0 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71Zm12.02 1.41a1 1 0 0 1 0-1.41a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71ZM6.05 6.05a1 1 0 0 1 0-1.41a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71Z"
                />
              </svg>
              <svg
                v-else
                class="theme-icon"
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"
                />
              </svg>
              <span class="sr-only">切换主题</span>
            </button>
          </div>
          <div class="category-tabs">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: selectedCategory === 'all' }"
              @click="setCategory('all')"
            >
              全部
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: selectedCategory === 'trade' }"
              @click="setCategory('trade')"
            >
              交易日志
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: selectedCategory === 'tech' }"
              @click="setCategory('tech')"
            >
              技术日志
            </button>
          </div>
        </section>

        <section class="sidebar-section">
          <div class="section-title">搜索</div>
          <div class="search-row">
            <input
              v-model="searchQuery"
              class="search-input"
              type="search"
              placeholder="搜索标题 / 标签 / 内容"
            />
            <button
              v-if="searchQuery.trim()"
              class="search-clear"
              type="button"
              @click="searchQuery = ''"
            >
              清除
            </button>
          </div>
        </section>

        <section class="sidebar-section post-list-section">
          <div class="section-title">日志目录（{{ filteredPosts.length }}）</div>
          <ul class="nav-list">
            <li v-for="post in filteredPosts" :key="post.slug">
              <RouterLink
                class="nav-link"
                :class="{ active: post.slug === slug }"
                :to="{ name: 'post', params: { slug: post.slug }, query: route.query }"
              >
                <span class="nav-date">{{ post.date }}</span>
                <span class="nav-title">{{ post.title }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>

      </aside>

      <section class="content">
        <section class="timeline">
          <article
            v-for="post in filteredPosts"
            :key="post.slug"
            class="post-card clickable"
            @click="openPost(post.slug)"
          >
            <p class="post-date">{{ post.date }} · {{ categoryLabel(post.category) }}</p>
            <h2 class="post-title">
              <RouterLink
                class="post-link"
                :to="{ name: 'post', params: { slug: post.slug }, query: route.query }"
                >{{ post.title }}</RouterLink
              >
            </h2>
            <p class="post-summary">{{ post.summary }}</p>
            <ul class="tags">
              <li v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</li>
            </ul>
          </article>
        </section>
      </section>
    </div>
  </main>
</template>
