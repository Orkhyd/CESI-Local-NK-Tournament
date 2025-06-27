import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import LoginPage from '../views/LoginPage.vue';
import HomePage from '../views/HomePage.vue';
import TournamentEditPage from '../views/TournamentEditPage.vue';
import TournamentManagePage from '../views/TournamentManagePage.vue';
import MatchScoreboardPage from '../views/MatchScoreboardPage.vue';
import MatchScoreboardFictifPage from '@/views/MatchScoreboardFictifPage.vue';
import MatchScoreboardFictifAdminPage from '@/views/MatchScoreboardFictifAdminPage.vue';

// Detect if we're in Electron environment
const isElectron = process.env.ELECTRON === 'true' ||
  window.location.protocol === 'file:' ||
  navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;

const router = createRouter({
  // Use hash history for Electron, web history for browser
  history: isElectron
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: LoginPage },
    { path: "/home-page", component: HomePage },
    { path: "/tournament/non-started/:id", component: TournamentEditPage },
    { path: "/tournament/started/:id", component: TournamentManagePage },
    { path: "/match/:id", component: MatchScoreboardPage },
    {
      path: '/fictive-control',
      component: MatchScoreboardFictifAdminPage
    },
    {
      path: '/fictive-display',
      component: MatchScoreboardFictifPage
    }
  ],
});

export default router;
