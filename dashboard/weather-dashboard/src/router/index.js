import { createRouter, createWebHistory } from 'vue-router';
  import { auth } from '@/firebase.js';
  import { onAuthStateChanged } from 'firebase/auth';

  // Layout
  import MainLayout from '@/layout/MainLayout.vue';

  // Views
  import LoginView from '@/views/LoginView.vue';
  import HomeView from '@/views/HomeView.vue'; // Corrected from DashboardView
  import ChartsView from '@/views/ChartsView.vue';
  import ReportsView from '@/views/ReportsView.vue';
  import AlertsView from '@/views/AlertsView.vue';
  import RecommendationsView from '@/views/RecommendationsView.vue';
  import ProfileView from '@/views/ProfileView.vue';

  /**
   * A helper function to wait for Firebase auth to initialize.
   * @returns {Promise<import('firebase/auth').User | null>}
   */
  const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject
      );
    });
  };

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/login',
        name: 'login', // Use lowercase for consistency
        component: LoginView,
      },
      {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'dashboard', // Use lowercase for consistency
            component: HomeView, // Corrected component
          },
          {
            path: 'charts',
            name: 'charts',
            component: ChartsView,
          },
          {
            path: 'reports',
            name: 'reports',
            component: ReportsView,
          },
          {
            path: 'alerts',
            name: 'alerts',
            component: AlertsView,
          },
          {
            path: 'recommendations',
            name: 'recommendations',
            component: RecommendationsView,
          },
          {
            path: 'profile',
            name: 'profile',
            component: ProfileView,
          },
        ],
      },
    ],
  });

  // The correct async navigation guard
  router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

    // Wait for Firebase to confirm auth state
    const isAuthenticated = await getCurrentUser();

    if (requiresAuth && !isAuthenticated) {
      // If route requires auth and user is not logged in, redirect to login.
      next({ name: 'login' });
    } else if (isAuthenticated && to.name === 'login') {
      // If user is logged in and tries to go to login page, redirect to dashboard.
      next({ name: 'dashboard' });
    } else {
      // Otherwise, proceed as normal.
      next();
    }
  });

  export default router;
