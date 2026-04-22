# 🏆 Gestion de Tournoi NIPPON KEMPO

![thumbnail (2)](https://github.com/user-attachments/assets/58606828-3fb5-4226-bdd2-50f43dc26615)


Cette **application de bureau** est spécialement conçue pour gérer intégralement des tournois de **Nippon Kempo** en mode **hors-ligne**. Le Nippon Kempo est un **art martial japonais** mélangeant frappes, projections et immobilisations, pratiqué sous forme de combats réglementés avec des protections spécifiques.

## 👥 Équipe du projet

Ce projet a été réalisé par une équipe de 4 personnes :

- GUERRIN Florian
- ROELLY Marius
- SPREDER Pierre
- BURST Christophe


## 🚀 Installation et lancement - Application de Bureau

Si tu récupères le projet depuis **Git**, voici comment le lancer correctement :

### Aller dans le bon dossier
On commence par aller dans le dossier `/node`:
```sh
cd node
```

### Installer les dépendances
On installe tout ce qu'il faut avec **npm**:
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


## 🗄️ Stockage des données
L'application utilise **IndexedDB** avec **Replicache** pour stocker les données en local, ce qui permet de fonctionner **sans connexion internet**.


## 📦 Technologies utilisées
- **Vue 3** (Composition API)
- **Electron** (pour le packaging en app de bureau)
- **Vuestic UI** (framework UI moderne)
- **Material Icons** (pour les icônes)
- **IndexedDB** (stockage local)
- **Replicache** (stockage local)
- **Material Icons** (icônes visuelles)
- **ApexChart** ( graphics, charts..)
- **Github**

## ⚡ Fonctionnalités de l'application
- Authentification sécurisée pour accéder à l'application.
- Création et gestion de tournois : possibilité de créer et éditer plusieurs tournois.
- Gestion avancée des catégories : création de catégories (en poules ou tableaux).
- Gestion des participants : création/edition manuel, importation et exportation facile via des fichiers CSV, gestion détaillée et liaison des participants aux catégories.
- Organisation automatique des matchs avec gestion des scores, fautes, chronomètres, temps reglementaire/additionnel.
- Affichage clair des scoreboards en temps réel pour chaque match ( pour projeter le match sur un autre ecran ).
- Statistiques détaillées et graphiques sur les performances des participants et statistiques des catégories
- Génération automatique de la structure du tournoi selon les types de catégories choisies.
- Exportation en PDF des résultats, classements et structures du tournoi.
