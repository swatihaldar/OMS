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
  {
    name: 'EditIssue',
    path: '/issues/edit/:id',
    component: () => import('@/pages/EditIssue.vue')
    
  }
]

let router = createRouter({
  history: createWebHistory('/oms'),
  routes,
})

// router.beforeEach(async (to, from, next) => {
//   let isLoggedIn = session.isLoggedIn
//   try {
//     await userResource.promise
//   } catch (error) {
//     isLoggedIn = false
//   }

//   if (to.name === 'Login' && isLoggedIn) {
//     next({ name: 'Home' })
//   } else if (to.name !== 'Login' && !isLoggedIn) {
//     next({ name: 'Login' })
//   } else {
//     next()
//   }
// })

// Navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      // Check if user is logged in
      const response = await fetch("/api/method/frappe.auth.get_logged_user")
      const data = await response.json()

      if (!data.message) {
        // Redirect to login if not logged in
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
