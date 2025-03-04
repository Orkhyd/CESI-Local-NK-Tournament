<template>
    <div class="tournament-layout">
      <!-- ✅ HEADER -->
      <header class="header">
        <!-- Bouton Accueil (icône seule) -->
        <VaButton @click="goToHomePage" class="home-button" color="primary" icon="home" />
  
        <!-- Checkbox pour afficher/cacher la sidebar -->
        <VaCheckbox v-model="showSidebar" class="toggle-sidebar" label="Afficher les catégories" />
  
        <!-- Nom du tournoi, bien centré -->
        <h1 class="page-title">
          <VaIcon name="trophy" class="title-icon" />
          Gestion du tournoi: {{ tournament ? tournament.name : "Chargement..." }}
        </h1>
      </header>
  
      <!-- ✅ Contenu principal -->
      <main class="content">
        <!-- ✅ Sidebar des catégories -->
        <aside v-if="showSidebar" class="category-sidebar">
          <h2 class="sidebar-title">
            <VaIcon name="category" />
            Catégories
          </h2>
  
          <div class="category-list">
            <div
              v-for="category in formattedCategories"
              :key="category.id"
              class="category-item"
              :class="{ active: category.id === activeCategory?.id }"
              @click="activeCategory = category"
            >
              <!-- ✅ Nom de la catégorie -->
              <h3 class="category-name">
                {{ category.name }}
              </h3>
  
              <!-- ✅ Genre + Type de tournoi -->
              <div class="category-meta">
                <span class="category-gender">
                  <VaIcon name="person" /> {{ category.genre }}
                </span>
                <VaChip class="category-type" color="primary" size="small">
                  <VaIcon name="sports" />
                  {{ category.type }}
                </VaChip>
              </div>
  
              <!-- ✅ Grade -->
              <p class="category-grade">
                <VaIcon name="school" />
                {{ category.gradeRange }}
              </p>
  
              <!-- ✅ Tranche d'âge -->
              <p class="category-age">
                <VaIcon name="calendar_today" />
                {{ category.ageCategories }}
              </p>
            </div>
          </div>
        </aside>
  
        <!-- ✅ Affichage de CategoryManage quand une catégorie est sélectionnée -->
        <section class="category-manage-container" v-if="activeCategory?.id">
          <CategoryManage :category="activeCategory" :tournament-id="tournamentId"/>
        </section>
      </main>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { getCategoriesByTournament } from "@/replicache/stores/categoryStore";
  import { rep } from "@/replicache/stores/tournamentStore";
  import CategoryManage from "@/components/CategoryManage.vue";
  import { categoriesAge, grades, genders, categoriesTypes } from "@/replicache/models/constants";
  
  // ✅ Récupération de l'ID du tournoi via la route
  const route = useRoute();
  const router = useRouter();
  const tournamentId = computed(() => route.params.id);
  
  // ✅ États
  const tournament = ref(null);
  const categories = ref([]);
  const activeCategory = ref(null);
  const showSidebar = ref(true); // Sidebar visible par défaut
  
  // ✅ Récupération du tournoi via Replicache
  const fetchTournament = async () => {
    if (!tournamentId.value) return;
    try {
      tournament.value = await rep.query(async (tx) => {
        return await tx.get(`tournament/${tournamentId.value}`);
      });
    } catch (error) {
      console.error("Erreur lors du chargement du tournoi :", error);
    }
  };
  
  // ✅ Récupération des catégories
  const refreshCategories = async () => {
    if (!tournamentId.value) return;
    try {
      categories.value = await getCategoriesByTournament(tournamentId.value);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
    }
  };
  
  // ✅ Formattage des catégories
  const formattedCategories = computed(() =>
    categories.value.map((category) => ({
      ...category,
      name: category.name,
      icon: category.typeId === 1 ? "grid_view" : "bar_chart",
      genre: getGenderLabel(category.genreId),
      type: getTypeLabel(category.typeId),
      ageCategories: getAgeCategories(category.ageCategoryIds),
      gradeRange: getGradeRange(category.minGradeId, category.maxGradeId),
    }))
  );
  
  // ✅ Libellé du genre
  const getGenderLabel = (genreId) => {
    const gender = genders.find((g) => g.id === String(genreId));
    return gender ? gender.nom : "Inconnu";
  };
  
  // ✅ Libellé du type de tournoi
  const getTypeLabel = (typeId) => {
    const type = categoriesTypes.find((t) => t.id === String(typeId));
    return type ? type.nom : "Inconnu";
  };
  
  // ✅ Tranche d'âge
  const getAgeCategories = (ageCategoryIds) => {
    if (!ageCategoryIds || ageCategoryIds.length === 0) return "Non défini";
    return ageCategoryIds.map((id) => {
      const ageCat = categoriesAge.find((a) => a.id === String(id));
      return ageCat ? `${ageCat.nom} (${ageCat.ageMin}-${ageCat.ageMax} ans)` : "Inconnu";
    }).join(", ");
  };
  
  // ✅ Grades min et max
  const getGradeRange = (minGradeId, maxGradeId) => {
    const minGrade = grades.find((g) => g.id === String(minGradeId));
    const maxGrade = grades.find((g) => g.id === String(maxGradeId));
    return minGrade && maxGrade ? `${minGrade.nom} → ${maxGrade.nom}` : "Non défini";
  };
  
  // ✅ Retour à l'accueil
  const goToHomePage = () => {
    router.push("/home-page");
  };
  
  // ✅ Chargement des données au montage
  onMounted(async () => {
    await fetchTournament();
    await refreshCategories();
  });
  </script>
  
  <style scoped>
  /* ✅ Mise en page */
  .tournament-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #f9f9f9;
  }
  
  /* ✅ HEADER */
  .header {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .category-name {
    font-size: 20px;
  }
  
  .home-button {
    margin-right: 30px;
  }
  
  .page-title {
    font-size: 1.8rem;
    font-weight: bold;
    color: #154EC1;
    flex: 1;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toggle-sidebar {
    margin-left: auto;
  }
  
  /* ✅ Contenu */
  .content {
    display: flex;
    flex: 1;
  }
  
  /* ✅ Sidebar */
  .category-sidebar {
    width: 280px;
    min-width: 280px;
    background: #ffffff;
    border-right: 1px solid #e0e0e0;
    padding: 16px;
  }
  
  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    color: #154EC1;
    margin-bottom: 16px;
  }
  
  /* ✅ Liste des catégories */
  .category-item {
    background: #ffffff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  
  .category-meta {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
  }
  
  .category-type {
    font-size: 0.85rem;
  }

  .category-grade {
    padding-bottom: 10px;
  }
  
  /* ✅ Section principale */
  .category-manage-container {
  flex-grow: 1; /* Laisse prendre de l'espace disponible mais pas plus */
  min-width: 0; /* 🔥 Empêche l'expansion incontrôlée */
  overflow: hidden; /* Évite le dépassement */
  display: flex; /* Assure une bonne gestion du contenu */
  flex-direction: column; /* Organise en colonne */
}

  .category-item {
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

.category-item:hover {
  background: #f0f0f0; /* Effet hover pour plus de feedback */
}

.category-item.active {
  background: #154EC1; /* Couleur de fond mise en évidence */
  color: white; /* Texte en blanc pour contraste */
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* Ombre plus visible */
}

.category-item.active .category-name,
.category-item.active .category-meta,
.category-item.active .category-grade,
.category-item.active .category-age {
  color: white; /* S'assurer que tout le texte est bien visible */
}

.category-item.active .category-type {
  background: white;
  color: #154EC1;
}
  </style>
  