import { createRouter, createWebHistory } from 'vue-router'
import { session } from './data/session'
import { userResource } from '@/data/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    name: 'Login',
    path: '/account/login',
    component: () => import('@/pages/Login.vue'),
  },
  {
    name: 'Issue',
    path:'/issue',
    component: () => import('@/pages/Issue.vue'),
  },
  {
    name: 'NewIssue',
    path: '/issue/new',
    component: () => import('@/pages/NewIssue.vue')
  },
  {
    name: 'Profile',
    path: '/profile',
    component: () => import('@/pages/Profile.vue')
    
  },
  {
    name: 'IssueDetails',
    path: '/issue/:id',
    component: () => import('@/pages/IssueDetails.vue')
    
  },
]

let router = createRouter({
  history: createWebHistory('/oms'),
  routes,
})


// Navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const response = await fetch("/api/method/frappe.auth.get_logged_user")
      const data = await response.json()

      if (!data.message) {
        return next({ path: "/account/login", query: { redirect: to.fullPath } })
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      return next({ path: "/account/login", query: { redirect: to.fullPath } })
    }
  }
  next()
})

export default router
