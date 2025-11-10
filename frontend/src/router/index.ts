import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import AnalyzeView from '../views/AnalyzeView.vue'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/analyze',
      name: 'analyze',
      component: AnalyzeView,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
    },
    {
      path: '/gnubg',
      name: 'gnubg',
      component: () => import('../views/GnubgView.vue'),
    },
    {
      path: '/gurubot',
      name: 'gurubot',
      component: () => import('../views/GurubotView.vue'),
    },
    {
      path: '/gurubot-chat',
      name: 'gurubot-chat',
      component: () => import('../views/GurubotChatView.vue'),
    },
    {
      path: '/easybot',
      name: 'easybot',
      component: () => import('../views/EasyBotView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/multiplayer',
      name: 'multiplayer',
      component: () => import('../views/MultiplayerGameView.vue'),
    },
    {
      path: '/claude-assistant',
      name: 'claude-assistant',
      component: () => import('../views/ClaudeAssistantView.vue'),
    },
  ],
})

// Route guards for authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');

  // Public routes that don't require authentication
  const publicRoutes = ['home', 'login', 'register'];

  // If trying to access protected route without authentication
  if (!publicRoutes.includes(to.name as string) && !isAuthenticated) {
    next({ name: 'login' });
    return;
  }

  // If authenticated user tries to access login/register, redirect to dashboard
  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  next();
});

export default router
