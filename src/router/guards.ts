import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import type { Portal, UserRole } from '../stores/auth'
import { defaultPathByPortal, loginPathByPortal, useAuthStore } from '../stores/auth'

const resolveAppPath = (path: string) => {
    const base = import.meta.env.BASE_URL || '/'
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}#${normalizedPath}`
}

export const installRouterGuards = (router: Router) => {
    router.beforeEach((to, _from, next) => {
        NProgress.start()

        const authStore = useAuthStore()
        const isPublic = Boolean(to.meta.public)

        if (isPublic) {
            const loginPortal = to.meta.portal as Portal | undefined

            if ((to.name === 'login' || String(to.name || '').endsWith('-login')) && authStore.isAuthenticated && authStore.portal) {
                if (loginPortal && authStore.portal !== loginPortal) {
                    authStore.logout()
                    return next()
                }
                return next(defaultPathByPortal[authStore.portal])
            }
            return next()
        }

        if (!authStore.isAuthenticated) {
            const requiredPortal = to.matched.find(record => record.meta.portal)?.meta.portal as Portal | undefined
            const loginPath = requiredPortal ? loginPathByPortal[requiredPortal] : '/login'
            return next({ path: loginPath, query: { redirect: to.fullPath } })
        }

        const requiredPortal = to.matched.find(record => record.meta.portal)?.meta.portal as Portal | undefined
        const allowedRoles = to.matched.find(record => record.meta.allowedRoles)?.meta.allowedRoles as UserRole[] | undefined

        if (!authStore.canAccessPortal(requiredPortal) || !authStore.canAccessRole(allowedRoles)) {
            return next('/403')
        }

        return next()
    })

    router.afterEach((to) => {
        NProgress.done()
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`ggap:route-reload:${to.fullPath}`)
        }
        document.title = to.meta.title ? `${String(to.meta.title)} - GGAP` : 'GGAP'
    })

    router.onError((error, to) => {
        NProgress.done()

        const message = String(error?.message || error)
        const isDynamicImportError = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|dynamically imported module/i.test(message)

        if (!isDynamicImportError || typeof window === 'undefined') {
            console.error('[router] navigation error', error)
            return
        }

        const reloadKey = `ggap:route-reload:${to.fullPath}`

        if (sessionStorage.getItem(reloadKey)) {
            console.error('[router] dynamic import failed after reload', error)
            return
        }

        sessionStorage.setItem(reloadKey, '1')
        window.location.assign(resolveAppPath(to.fullPath))
    })
}
