import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import HomePage from '../views/HomePage.vue'
import TournamentEditPage from '../views/TournamentEditPage.vue'
import TournamentManagePage from '../views/TournamentManagePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: LoginPage },
    { path: "/home-page", component: HomePage },
    { path: "/tournament/non-started/:id", component: TournamentEditPage }, // route avec l id du tournoi
    { path: "/tournament/started/:id", component: TournamentManagePage }, // route avec l id du tournoi
  ],
})

export default router
