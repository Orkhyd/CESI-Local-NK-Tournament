<template>
  <div class="login-wrapper">
    <!-- logo centre en haut -->
    <img src="../assets/logo.png" alt="logo" class="logo" />

    <!-- carte de connexion centree -->
    <VaCard class="login-card">
      <!-- titre -->
      <h1 class="title">NIPPON KEMPO NANCY</h1>

      <!-- formulaire de connexion -->
      <VaForm @submit.prevent="handleLogin">
        <!-- champ mot de passe -->
        <VaInput
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Mot de passe"
          placeholder="Entrez votre mot de passe"
          class="password-input"
        >
          <!-- icone de cle a gauche -->
          <template #prependInner>
            <VaIcon name="lock" color="primary" size="22px" />
          </template>

          <!-- icone oeil pour afficher ou cacher le mot de passe -->
          <template #appendInner>
            <VaButton icon size="small" class="eye-button" @click="togglePassword">
              <VaIcon :name="showPassword ? 'visibility_off' : 'visibility'" />
            </VaButton>
          </template>
        </VaInput>

        <!-- bouton de connexion -->
        <VaButton block color="primary" class="mt-4" :disabled="!password" type="submit">
          Se connecter
        </VaButton>
      </VaForm>
    </VaCard>
  </div>
</template>

<script setup>
// -----------------------------------------------------------------
// imports
// -----------------------------------------------------------------

import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vuestic-ui";

// -----------------------------------------------------------------
// initialisation des variables
// -----------------------------------------------------------------

// initialisation du router pour la redirection
const router = useRouter();

// initialisation des notifications
const toast = useToast();

// var pour stocker le mot de passe saisi
const password = ref("");

// var reactive pour afficher ou masquer le mot de passe
const showPassword = ref(false);

// recuperation du mot de passe correct depuis le fichier d environnement (.env)
const correctPassword = import.meta.env.VITE_APP_MDP;

// -----------------------------------------------------------------
// fonctions
// -----------------------------------------------------------------

// fonction pour basculer entre affichage et masquage du mot de passe
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// fonction de connexion
const handleLogin = () => {
  // verif si le mot de passe saisi correspond a celui stocke
  if (password.value === correctPassword) {
    // affichage d un message de succes
    toast.init({ message: "Connexion reussie", color: "success" });

    // redirection vers la page home
      router.push("/home-page");
  } else {
    // affichage d une notification d erreur si le mot de passe est incorrect
    toast.init({ message: "Erreur mot de passe incorrect", color: "danger" });
  }
};
</script>

<style scoped>
/* ----------------------------------------------------------------- */
/* styles globaux */
/* ----------------------------------------------------------------- */

/* container principal centre */
.login-wrapper {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: url("../assets/img/background.svg") no-repeat center center;
  background-size: cover;
  padding: 20px;
  flex-direction: column;
}

/* logo centre en haut */
.logo {
  width: 250px;
  height: 250px;
  margin-bottom: 20px;
}

/* ----------------------------------------------------------------- */
/* styles de la carte de connexion */
/* ----------------------------------------------------------------- */

/* carte de connexion */
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* titre */
.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: var(--primary-blue);
}

/* ----------------------------------------------------------------- */
/* styles des champs et boutons */
/* ----------------------------------------------------------------- */

/* champ mot de passe */
.password-input {
  width: 100%;
  text-align: left;
}

/* icone oeil et cle */
.eye-button {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}
</style>