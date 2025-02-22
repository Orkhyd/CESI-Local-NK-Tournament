<template>
    <div class="tournament-brackets">
      <div class="bracket">
        <!-- boucle sur chaque round (phase du tournoi) -->
        <template v-for="(round, roundIndex) in rounds" :key="roundIndex">
          <div class="round-container">
            <!-- affichage du nom du round (finale, demi-finale, etc.) -->
            <div class="round-label">
              {{ getRoundLabel(round.matches.length, roundIndex) }}
            </div>
            <div class="round">
              <!-- boucle sur les matchs du round en cours -->
              <template v-for="(match, matchIndex) in round.matches" :key="match.id">
                <MatchCard
                  :match="match" 
                  :disabled="match.winner !== null" 
                /> <!-- desactive le match s'il a deja un gagnant -->
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from "vue";
  import MatchCard from "./MatchCard.vue";
  import { replicache } from "@/replicache.js";
  
  const props = defineProps({
    bracket: {
      type: Object,
      required: true,
    },
  });

  // stocke la structure des rounds du tournoi
  const rounds = ref(props.bracket.structure);
  
  // fonction qui retourne le nom du round en fonction du nombre de matchs dans ce round
  const getRoundLabel = (matchCount, roundIndex) => {
    const labels = {
      1: "Finale",
      2: "Demi-finale",
      4: "Quart de finale",
      8: "8ème de finale",
      16: "16ème de finale",
    };
    return labels[matchCount] || `Tour ${roundIndex + 1}`;
  };
  
  // met a jour les rounds en recuperant les donnees de replicache
  const syncWithReplicache = async () => {
    const bracketData = await replicache.query(tx => tx.get("bracket/current"));
    if (bracketData && bracketData.structure) {
      rounds.value = bracketData.structure;
    }
  };
  
  // abonnement aux changements en direct de la base de donnees locale replicache
  onMounted(() => {
    replicache.subscribe(async tx => {
      return tx.get("bracket/current"); // on recupere l'etat actuel du bracket
    }, {
      onData: (bracketData) => {
        // si on recoit des donnees valides, on met a jour l'affichage
        if (bracketData && bracketData.structure) {
          rounds.value = bracketData.structure;
        }
      },
    });
  });
  </script>
  
  <style scoped>
  /* style pour les titres des rounds (ex : "Demi-finale") */
  .round-label {
      text-align: center;
      font-weight: bold;
      font-size: 1.2rem;
      margin-bottom: 10px;
      color: #333;
  }
  
  /* conteneur principal du bracket (arbre du tournoi) */
  .bracket {
      display: flex; /* affiche les rounds en ligne */
  }
  
  /* chaque round (ensemble de matchs d'une phase) est affiche en colonne */
  .round {
      display: flex;
      flex-grow: 1; /* chaque round prend une part egale de l'espace disponible */
      flex-direction: column;
      justify-content: space-around; /* repartition egale des matchs */
  }
  
  /* conteneur d'un round avec son titre et ses matchs */
  .round-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
  }
  
  /* retire la bordure du dernier match du dernier round */
  .round-container:last-child .round .match:last-child::after {
      display: none !important;
  }
  
  /* creation de la barre verticale reliant les matchs entre eux */
  .match::before {
      content: "";
      display: block;
      min-height: 30px;
      border-left: 2px solid #333; /* ligne verticale */
      position: absolute;
      margin-left: -22px;
      transform: rotate(90deg);
  }
  
  /* ligne de liaison pour les matchs impairs (haut) */
  .match:nth-child(odd)::after {
      content: "";
      display: block;
      border: 2px solid transparent;
      border-top-color: #333;
      border-right-color: #333;
      height: calc(50% + 10px);  /* ajuste la taille pour relier les matchs */
      position: absolute;
      right: 0px;
      width: 10px;
      top: calc(50% + 1px); /* aligne correctement la liaison */
  }
  
  /* ligne de liaison pour les matchs pairs (bas) */
  .match:nth-child(even)::after {
      content: "";
      display: block;
      border: 2px solid transparent;
      border-bottom-color: #333;
      border-right-color: #333;
      height: calc(50% + 10px);
      position: absolute;
      right: 0px;
      width: 10px;
      bottom: calc(50% + 1px); /* ajuste l'alignement */
  }
  </style>
