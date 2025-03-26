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
  // Add more doctypes here as needed
]

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: "/account/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true }
  },
]

// Dynamically add routes for each doctype
universalDoctypes.forEach((doctype) => {
  // List view
  routes.push({
    path: `/${doctype.path}`,
    name: `${doctype.name}List`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })

  // New form
  routes.push({
    path: `/${doctype.path}/new`,
    name: `New${doctype.name}`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })

  // Detail view (combined view/edit)
  routes.push({
    path: `/${doctype.path}/:id`,
    name: `${doctype.name}Detail`,
    component: () => import(`@/pages/${doctype.name}.vue`),
  })

  // Remove the separate edit route since we now handle editing in the detail view
})

const router = createRouter({
  history: createWebHistory("/oms"),
  routes,
})

// router.beforeEach(async (to, from, next) => {
//   if (to.meta.requiresAuth) {
//     try {
//       const response = await fetch("/api/method/frappe.auth.get_logged_user")
//       const data = await response.json()

//       if (!data.message) {
//         return next({ path: "/account/login", query: { redirect: to.fullPath } })
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error)
//       return next({ path: "/account/login", query: { redirect: to.fullPath } })
//     }
//   }
//   next()
// })

router.beforeEach(async (to, from, next) => {
  const isAuthenticated = await checkAuthStatus()
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/account/login')
  } else if (to.path === '/account/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
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

