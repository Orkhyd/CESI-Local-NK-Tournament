<template>
  <div class="bracket-page">
    <h1>Tableau du Tournoi</h1>

    <!-- affichage du message de chargement si les donnees ne sont pas encore disponibles -->
    <div v-if="isLoading">Chargement...</div>

    <!-- affichage du bracket une fois charge, avec une cle unique pour forcer le rafraichissement -->
    <div v-else>
      <Bracket 
        v-if="bracket" 
        :bracket="bracket" 
        :key="bracket.structure.map(r => r.label).join('-')" 
      />
    </div>
  </div>
</template>

<script setup> 
import { ref, onMounted } from "vue";
import { replicache } from "@/replicache.js";
import Bracket from '../components/Bracket/Bracket.vue';

// ref reactive pour stocker le bracket
const bracket = ref(null);

// etat de chargement, sert a afficher un message tant que les donnees ne sont pas chargees
const isLoading = ref(true);


/**
 * fonction pour charger le bracket depuis replicache
 * si aucun bracket n'est trouve, il est genere a partir des participants existants
 */
const loadBracket = async () => {
  try {
    // recuperation du bracket actuel depuis replicache
    const existingBracket = await replicache.query(tx => tx.get("bracket/current"));

    // si un bracket existe deja, on ne fait rien de plus
    if (!existingBracket) {

      // recuperation des participants enregistres dans replicache
      const participants = await replicache.query(async tx => {
        const values = await tx.scan({ prefix: "participant/" }).entries().toArray();
        return values.map(([key, value]) => value).filter(v => v !== undefined);
      });

      // si aucun participant n'est trouve, le bracket ne peut pas etre cree
      if (!participants.length) {
        return;
      }

      // appel de la fonction pour creer le bracket avec les participants trouves
      await replicache.mutate.createBracket({ participants });
    }
  } catch (error) {
    // gestion des erreurs si la requete echoue
    console.error("erreur lors du chargement du bracket :", error);
  }
};


/**
 * fonction permettant de s'abonner aux changements de replicache
 * des que le bracket est mis a jour, il est automatiquement rafraichi dans l'application et les new données transferees au tableau
 */
const subscribeToBracketChanges = () => {
  replicache.subscribe(
    async (tx) => {
      // recuperation du bracket actuel depuis replicache
      const currentBracket = await tx.get("bracket/current");

      // si aucun bracket n'est trouve, on retourne null pour eviter d'afficher des donnees inexistantes
      if (!currentBracket) {
        return null;
      }

      return currentBracket;
    },
    {
      // cette fonction est executee a chaque mise a jour des donnees dans replicache
      onData: (updatedBracket) => {
        bracket.value = updatedBracket; // mise a jour de la variable reactive
        isLoading.value = false; // desactivation du mode chargement
      },
    }
  );
};

// au montage du composant, on charge les donnees et on ecoute les mises a jour
onMounted(async () => {
  await loadBracket().catch(console.error);
  subscribeToBracketChanges();
});
</script>

<style scoped>
.bracket-page {
  text-align: center; 
  padding: 20px; 
}
</style>
