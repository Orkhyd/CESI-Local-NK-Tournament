import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import HomePage from '../views/HomePage.vue'
import TournamentPage from '../views/TournamentManagePage.vue'
import BracketPage from '../views/BracketPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: LoginPage },
    { path: "/home-page", component: HomePage },
    { path: "/bracket-page", component: BracketPage },
    { path: "/tournament/:id", component: TournamentPage }, // route avec l id du tournoi
  ],
})

export default router
