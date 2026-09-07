import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import type { Portal, UserRole } from '../stores/auth'
import { defaultPathByPortal, rolePortalMap } from '../config/permissions'
import { installRouterGuards } from './guards'
import { adminRoutes, platformRoutes } from './routes/admin'
import { agentRoutes } from './routes/agent'
import { authRoutes } from './routes/auth'
import { merchantRoutes } from './routes/merchant'

NProgress.configure({ showSpinner: false })

const resolveStoredPortal = (): Portal | null => {
  const rawUser = localStorage.getItem('auth_user')
  const role = localStorage.getItem('auth_role') as UserRole | null

  if (rawUser) {
    try {
      const user = JSON.parse(rawUser)
      if (user.portal) return user.portal as Portal
    } catch {
      // Ignore malformed legacy auth payloads.
    }
  }

  return role ? rolePortalMap[role] : null
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: () => {
      const token = localStorage.getItem('auth_token')
      const portal = resolveStoredPortal()

      if (!token || !portal) return '/login'
      return defaultPathByPortal[portal]
    }
  },
  ...authRoutes,
  adminRoutes,
  platformRoutes,
  agentRoutes,
  merchantRoutes,
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/Error/403.vue'),
    meta: { title: '拒絕訪問', public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/Error/404.vue'),
    meta: { title: '找不到頁面', public: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

installRouterGuards(router)

export default router
