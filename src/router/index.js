import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import HomePage from '../views/HomePage.vue'
import TournamentPage from '../views/TournamentManage.vue' // 👈 Ajouter l'import

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: LoginPage },
    { path: "/home-page", component: HomePage },
    { path: "/tournament/:id", component: TournamentPage }, // 👈 Ajouter la route avec ID du tournoi
  ],
})

export default router
