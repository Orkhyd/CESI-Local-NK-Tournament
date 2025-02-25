# 🏆 Gestion de Tournoi - Vue 3 + Electron + Vuestic UI

Ce projet est une **application Electron** développée avec **Vue 3** et **Vuestic UI**. Elle permet de **gérer des tournois**, organiser les catégories et les participants, tout en offrant une **interface fluide et moderne**. L'application utilise aussi **IndexedDB** pour stocker les données localement et **Material Icons** pour un rendu plus esthétique.

## 🚀 Installation et lancement

Si tu récupères le projet depuis **Git**, voici comment le lancer correctement :

### Installer les dépendances
On installe tout ce qu'il faut avec **npm** :
```sh
npm install
```

### Configurer le fichier **.env**
Il faut créer un fichier `.env` à la racine pour stocker les variables d'environnement, et que tu mettes ton mot de passe de l'appli:
```
VITE_APP_MDP= met_ici_ton_motdepasse
```

### Lancer l'application
Mode développement avec **Electron** :
```sh
npm run dev
```

## 🎨 UI et composants
L'interface repose sur **Vuestic UI** (https://vuestic.dev/) et utilise **Material Icons** pour les icônes :
🔗 **Icônes Google** : [https://fonts.google.com/icons](https://fonts.google.com/icons)

## 🗄️ Stockage des données
L'application utilise **IndexedDB** pour stocker les participants, catégories et tournois en local, ce qui permet de fonctionner **sans connexion internet**. Les données sont récupérées et synchronisées de manière asynchrone pour optimiser les performances.

## 📦 Technologies utilisées
- **Vue 3** (Composition API)
- **Electron** (pour le packaging en app de bureau)
- **Vuestic UI** (framework UI moderne)
- **IndexedDB** (stockage local)
- **Material Icons** (icônes visuelles)

## ⚡ Fonctionnalités principales
✅ Gestion des participants avec filtres et recherche avancée  
✅ Création et édition des catégories  
✅ Sélection et attribution des participants aux catégories  
✅ Stockage des données en local avec IndexedDB  
✅ Interface dynamique et réactive  
 
 
