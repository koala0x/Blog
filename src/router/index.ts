import { defineComponent, h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

const EmptyView = defineComponent({
  name: 'EmptyView',
  setup: () => () => h('div'),
})

export const router = createRouter({
  history: createWebHistory(((import.meta as any).env?.BASE_URL as string | undefined) ?? '/'),
  routes: [
    { path: '/', name: 'home', component: EmptyView },
    { path: '/post/:slug', name: 'post', component: EmptyView },
    { path: '/:pathMatch(.*)*', name: 'notfound', component: EmptyView },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
