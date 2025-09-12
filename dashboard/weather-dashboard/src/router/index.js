import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

import { auth } from '@/firebase.js'

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        name: 'login',
        component: LoginView
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: HomeView,
        meta: { requiresAuth: true }
      }
    ]
  })

  router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isAuthenticated = auth.currentUser

    if (requiresAuth && !isAuthenticated) {
      next({ name: 'login' })
    } else if (!requiresAuth && isAuthenticated && to.name === 'login') {
      next({ name: 'dashboard' })
    }
    else {
      next()
    }
  })

  export default router
