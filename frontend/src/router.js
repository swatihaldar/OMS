import { createRouter, createWebHistory } from "vue-router"

import Home from "@/pages/Home.vue"
import Login from "@/pages/Login.vue"
import Profile from "@/pages/Profile.vue"
import LocationManager from "@/pages/LocationManager.vue"

const universalDoctypes = [
  { name: "Issue", path: "issue" },
  { name: "Task", path: "task" },
  { name: "Project", path: "project" },
  { name: "Timesheet", path: "timesheet" },
  { name: "Employee", path: "employee" },
  // Add more doctypes here as needed
]

const routes = [
  {
    path: "/account/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false }, // Login page does NOT require auth
  },
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/location-manager",
    name: "LocationManager",
    component: LocationManager,
    meta: {
      requiresAuth: true,
      requiredRoles: ["System Manager", "Location Manager", "Manager"],
    },
  },
]

// Dynamically add routes for each doctype
universalDoctypes.forEach((doctype) => {
  routes.push({
    path: `/${doctype.path}`,
    name: `${doctype.name}List`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })

  routes.push({
    path: `/${doctype.path}/new`,
    name: `New${doctype.name}`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })

  routes.push({
    path: `/${doctype.path}/:id`,
    name: `${doctype.name}Detail`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })
})

const router = createRouter({
  history: createWebHistory("/oms"),
  routes,
})

// Global authentication check
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = await checkAuthStatus()

  // Allow access to public pages (like login)
  if (to.meta.requiresAuth === false) {
    return next()
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return next({ path: "/account/login", query: { redirect: to.fullPath } })
  }

  // Redirect authenticated users away from login page
  if (to.path === "/account/login" && isAuthenticated) {
    return next("/")
  }

  // Check role-based access
  if (to.meta.requiredRoles) {
    const userRoles = await getUserRoles()
    const hasRequiredRole = to.meta.requiredRoles.some((role) => userRoles.includes(role))

    if (!hasRequiredRole) {
      // Redirect to home if user doesn't have required role
      return next({ path: "/", query: { error: "insufficient_permissions" } })
    }
  }

  next()
})

async function checkAuthStatus() {
  try {
    const response = await fetch("/api/method/frappe.auth.get_logged_user")
    const data = await response.json()
    return data.message && data.message !== "Guest"
  } catch (error) {
    return false
  }
}

async function getUserRoles() {
  try {
    const response = await fetch("/api/method/oms.api.get_current_user_info")
    const data = await response.json()
    return data.message?.roles || []
  } catch (error) {
    return []
  }
}

export default router
