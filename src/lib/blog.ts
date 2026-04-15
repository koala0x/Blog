import DOMPurify from 'dompurify'
import { marked, type Tokens } from 'marked'
import { parse as parseYaml } from 'yaml'

export type BlogCategory = 'trade' | 'tech' | 'other'

export interface TocItem {
  id: string
  text: string
  level: number
}

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  category: BlogCategory
  tags: string[]
  summary: string
}

export interface BlogPostIndex extends BlogPostMeta {
  searchText: string
}

export interface BlogPost extends BlogPostMeta {
  markdown: string
  html: string
  toc: TocItem[]
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((t) => t.trim()).filter(Boolean)
  return []
}

function toCategory(value: unknown): BlogCategory {
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (!v) return 'tech'
    if (v === 'trade' || v === 'trading' || v.includes('交易')) return 'trade'
    if (v === 'tech' || v === 'technical' || v.includes('技术')) return 'tech'
    if (v === 'other' || v === 'misc' || v.includes('其他')) return 'other'
    return 'other'
  }
  return 'tech'
}

function toSummary(body: string): string {
  const singleLine = body.replace(/\s+/g, ' ').trim()
  if (!singleLine) return ''
  return singleLine.length > 120 ? `${singleLine.slice(0, 120)}...` : singleLine
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const normalized = raw.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return { data: {}, content: raw }

  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return { data: {}, content: raw }

  const frontmatter = normalized.slice(4, end)
  const content = normalized.slice(end + '\n---\n'.length)

  const data = (parseYaml(frontmatter) ?? {}) as Record<string, unknown>
  return { data, content }
}

function slugify(text: string): string {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return normalized || 'section'
}

function renderMarkdown(markdown: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = []
  const used = new Map<string, number>()

  const renderer = new marked.Renderer()
  renderer.heading = function ({ depth, text, tokens }: Tokens.Heading): string {
    const base = slugify(text)
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count + 1}`

    if (depth >= 2 && depth <= 4) {
      toc.push({ id, text, level: depth })
    }

    const inner = this.parser.parseInline(tokens)
    return `<h${depth} id="${id}">${inner}</h${depth}>`
  }

  const rawHtml = marked.parse(markdown, { gfm: true, renderer }) as string
  const html = DOMPurify.sanitize(rawHtml)
  return { html, toc }
}

const markdownModules = import.meta.glob<string>('../posts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const allPosts: BlogPost[] = Object.entries(markdownModules)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()?.replace(/\.md$/, '') ?? ''
    const parsed = parseFrontmatter(raw)

    const title = typeof parsed.data.title === 'string' ? parsed.data.title : slug
    const date = typeof parsed.data.date === 'string' ? parsed.data.date : ''
    const category = toCategory(parsed.data.category)
    const tags = toStringArray(parsed.data.tags)
    const summary =
      typeof parsed.data.summary === 'string' ? parsed.data.summary : toSummary(parsed.content)

    const markdown = parsed.content.trim()
    const rendered = renderMarkdown(markdown)

    return {
      slug,
      title,
      date,
      category,
      tags,
      summary,
      markdown,
      html: rendered.html,
      toc: rendered.toc,
    }
  })
  .filter((p) => Boolean(p.slug && p.date))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export function listPosts(): BlogPostMeta[] {
  return allPosts.map(({ html, markdown, toc, ...meta }) => meta)
}

export function listPostIndex(): BlogPostIndex[] {
  return allPosts.map(({ html, toc, ...post }) => {
    const searchText = `${post.title}\n${post.summary}\n${post.tags.join(' ')}\n${post.markdown}`
      .toLowerCase()
      .trim()
    return { ...post, searchText }
  })
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug)
}
