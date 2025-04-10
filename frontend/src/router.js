// import { createRouter, createWebHistory } from 'vue-router'
// import { session } from './data/session'
// import { userResource } from '@/data/user'

// import Home from "@/pages/Home.vue";
// import Login from "@/pages/Login.vue";
// import Profile from "@/pages/Profile.vue";


// const universalDoctypes = [
//   { name: 'Issue', path: 'issue' },

// ];

// const routes = [
//   {
//     path: "/",
//     name: "Home",
//     component: Home,
//   },
//   {
//     path: "/account/login",
//     name: "Login",
//     component: Login,
//   },
//   {
//     path: "/profile",
//     name: "Profile",
//     component: Profile,
//   },
// ];

// // Dynamically add routes for each doctype

// universalDoctypes.forEach(doctype => {
//   routes.push({
//     path: `/${doctype.path}`,
//     name: `${doctype.name}List`,
//     component: () => import(`@/pages/${doctype.name}.vue`),
//   });
  
//   routes.push({
//     path: `/${doctype.path}/new`,
//     name: `New${doctype.name}`,
//     component: () => import(`@/pages/${doctype.name}.vue`),
//   });
  

//   routes.push({
//     path: `/${doctype.path}/:id`,
//     name: `${doctype.name}Detail`,
//     component: () => import(`@/pages/${doctype.name}.vue`),
//   });
  
//   routes.push({
//     path: `/${doctype.path}/:id/edit`,
//     name: `Edit${doctype.name}`,
//     component: () => import(`@/pages/${doctype.name}.vue`),
//   });
// });

// const router = createRouter({
//   history: createWebHistory("/oms"),
//   routes,
// });


// router.beforeEach(async (to, from, next) => {
//   if (to.meta.requiresAuth) {
//     try {
//       const response = await fetch("/api/method/frappe.auth.get_logged_user");
//       const data = await response.json();

//       if (!data.message) {
//         return next({ path: "/account/login", query: { redirect: to.fullPath } });
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error);
//       return next({ path: "/account/login", query: { redirect: to.fullPath } });
//     }
//   }
//   next();
// });

// export default router;



import { createRouter, createWebHistory } from "vue-router"

import Home from "@/pages/Home.vue"
import Login from "@/pages/Login.vue"
import Profile from "@/pages/Profile.vue"

const universalDoctypes = [
  { name: "Issue", path: "issue" },
  { name: "Task", path: "task" }, 
  { name: "Project", path: "project" }, 
  { name: "Timesheet", path: "timesheet"}
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

  next()
})

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/method/frappe.auth.get_logged_user')
    const data = await response.json()
    return data.message && data.message !== 'Guest'
  } catch (error) {
    return false
  }
}

export default router
