import { openDB } from "idb";

// constantes pour la bdd
const DB_NAME = "TournoiDB";
const DB_VERSION = 1;

// ------------------------------------------------------------------------------------
// gestion de la base de donnees
// ------------------------------------------------------------------------------------

//   fonction pour ouvrir ou creer la base de donnees indexeddb
const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      console.log("mise a jour indexeddb : creation des tables");

      // creation des tables si elles n'existent pas
      if (!db.objectStoreNames.contains("tournois")) {
        db.createObjectStore("tournois", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("participants")) {
        db.createObjectStore("participants", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("categorieParticipants")) {
        db.createObjectStore("categorieParticipants", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("tournoiParticipants")) {
        db.createObjectStore("tournoiParticipants", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("categoriesAge")) {
        db.createObjectStore("categoriesAge", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("grades")) {
        db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("genres")) {
        db.createObjectStore("genres", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("typesCategories")) {
        db.createObjectStore("typesCategories", { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

// ------------------------------------------------------------------------------------
// gestion des tournois
// ------------------------------------------------------------------------------------

//   fonction pour recuperer le dernier tournoi
export const getLastTournoi = async () => {
  const db = await getDB();
  const allTournois = await db.getAll("tournois");
  return allTournois.length > 0 ? allTournois[0] : null;
};

//   fonction pour sauvegarder un tournoi
export const saveTournoi = async (tournoi) => {
  const db = await getDB();
  await db.put("tournois", tournoi);
};

//   fonction pour supprimer un tournoii
export const deleteTournoi = async () => {
  const db = await getDB();
  await db.clear("tournois");
};

// ------------------------------------------------------------------------------------
// gestion des participants
// ------------------------------------------------------------------------------------

//   fonction pour supprimer un participant de la base de donnees
export const deleteParticipantFromDB = async (participantId) => {
  const db = await getDB();

  // supprime le participant de la table participants
  await db.delete("participants", participantId);

  // supprime toutes les associations du participant avec les categories
  const allRelations = await db.getAll("categorieParticipants");
  const newRelations = allRelations.filter(rel => rel.participantId !== participantId);

  await db.clear("categorieParticipants"); // vide la table des relations
  for (let rel of newRelations) {
    await db.put("categorieParticipants", rel); // reinsertion des relations valides
  }

  // supprime toutes les associations du participant avec les tournois
  const allTournoiRelations = await db.getAll("tournoiParticipants");
  const newTournoiRelations = allTournoiRelations.filter(rel => rel.participantId !== participantId);

  await db.clear("tournoiParticipants"); // vide la table des relations tournoi
  for (let rel of newTournoiRelations) {
    await db.put("tournoiParticipants", rel); // reinsertion des relations valides
  }
};

//   fonction pour recuperer les participants non assignes
export const getUnassignedParticipants = async () => {
  const db = await getDB();
  const allParticipants = await db.getAll("participants");
  const assignedParticipants = await db.getAll("categorieParticipants");

  const assignedIds = new Set(assignedParticipants.map(p => p.participantId));
  return allParticipants.filter(p => !assignedIds.has(p.id));
};

//   fonction pour ajouter un participant
export const addParticipant = async (participant) => {
  const db = await getDB();
  
  const newParticipant = {
    nom: participant.nom,
    prenom: participant.prenom,
    club: participant.club,
    sexe: participant.sexe,
    grade: participant.grade,
    poids: participant.poids,
    dateNaissance: participant.dateNaissance,
  };

  const id = await db.add("participants", newParticipant); // indexeddb genere l'id
  return { ...newParticipant, id };
};

//   fonction pour recuperer tous les participants
export const getAllParticipants = async () => {
  const db = await getDB();
  const participants = await db.getAll("participants");
  
  return participants.map(p => ({
    id: p.id, // s'assurer que l'id est bien recupere
    nom: p.nom,
    prenom: p.prenom,
    club: p.club,
    sexe: p.sexe,
    grade: p.grade,
    poids: p.poids,
    dateNaissance: p.dateNaissance,
  }));
};

//   fonction pour ajouter un participant a un tournoi
export const addParticipantToTournoi = async (tournoiId, participantId) => {
  const db = await getDB();
  const participant = await db.get("participants", participantId);
  
  if (!participant) {
    console.error(`participant id ${participantId} introuvable !`);
    return;
  }

  return await db.put("tournoiParticipants", {
    id: `${tournoiId}-${participantId}`, // cle unique pour eviter les doublons
    tournoiId,
    participantId,
    participant,
  });
};

// ------------------------------------------------------------------------------------
// gestion des categories
// ------------------------------------------------------------------------------------

//   fonction pour ajouter une categorie
export const addCategorie = async (categorie) => {
  const db = await getDB();

  const cleanCategorie = cleanObject({
    ...categorie,
    gradeMin: categorie.gradeMin ? { text: categorie.gradeMin.text, value: categorie.gradeMin.value } : null,
    gradeMax: categorie.gradeMax ? { text: categorie.gradeMax.text, value: categorie.gradeMax.value } : null,
  });

  return await db.put("categories", cleanCategorie);
};

//   fonction pour supprimer une categorie
export const deleteCategorie = async (categoryId) => {
  const db = await getDB();
  await db.delete("categories", categoryId);
};

//   fonction pour associer un participant a une categorie
export const addParticipantToCategorie = async (categorieId, participantId) => {
  const db = await getDB();

  // verification si deja assigne
  const existing = await db.getAll("categorieParticipants");
  if (existing.some(rel => rel.categorieId === categorieId && rel.participantId === participantId)) {
    console.warn(`le participant ${participantId} est deja assigne a la categorie ${categorieId}.`);
    return;
  }

  await db.add("categorieParticipants", { categorieId, participantId });
};

//   fonction pour recuperer tous les participants assignes
export const getAllAssignedParticipants = async () => {
  const db = await getDB();
  const relations = await db.getAll("categorieParticipants");
  return relations.map(rel => rel.participantId);
};

//   fonction pour supprimer les participants d'une categorie
export const removeParticipantsFromCategorie = async (categorieId) => {
  const db = await getDB();
  const allRelations = await db.getAll("categorieParticipants");

  // ne garder que les participants qui ne sont pas lies a cette categorie
  const newRelations = allRelations.filter(rel => rel.categorieId !== categorieId);

  await db.clear("categorieParticipants"); // supprime tout
  for (let rel of newRelations) {
    await db.put("categorieParticipants", rel); // reinsere les relations valides
  }
};

//   fonction pour recuperer toutes les categories
export const getAllCategories = async () => {
  const db = await getDB();
  return await db.getAll("categories");
};

//   fonction pour verifier si un participant peut rejoindre une categorie
export const canParticipantJoinCategory = async (participantId, categorieId) => {
  const db = await getDB();
  const participant = await db.get("participants", participantId);
  const categorie = await db.get("categories", categorieId);

  if (!participant || !categorie) return false;

  // verification du grade
  if (categorie.gradeMin && participant.grade.value < categorie.gradeMin.value) return false;
  if (categorie.gradeMax && participant.grade.value > categorie.gradeMax.value) return false;

  // verification de l'age (si age min/max existant dans la categorie)
  if (categorie.selectedAges && categorie.selectedAges.length > 0) {
    const participantAge = new Date().getFullYear() - new Date(participant.dateNaissance).getFullYear();
    const minAge = Math.min(...categorie.selectedAges.map(a => a.ageMin));
    const maxAge = Math.max(...categorie.selectedAges.map(a => a.ageMax));

    if (participantAge < minAge || participantAge > maxAge) return false;
  }

  return true;
};

//   fonction pour nettoyer un objet
const cleanObject = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

//   fonction pour recuperer les participants par categorie
export const getParticipantsByCategorie = async (categorieId) => {
  const db = await getDB();
  const relations = await db.getAll("categorieParticipants");
  const participantIds = relations
    .filter((rel) => rel.categorieId === categorieId)
    .map((rel) => rel.participantId);
  return await Promise.all(participantIds.map((id) => db.get("participants", id)));
};

// ------------------------------------------------------------------------------------
// gestion des donnees statiques
// ------------------------------------------------------------------------------------

//   fonction pour recuperer toutes les categories d'age
export const getAllCategoriesAge = async () => {
  const db = await getDB();
  return (await db.getAll("categoriesAge")).map((c) => ({ label: c.nom, value: c.id }));
};

//   fonction pour recuperer tous les grades
export const getAllGrades = async () => {
  const db = await getDB();
  return (await db.getAll("grades")).map((g) => ({ label: g.nom, value: g.id }));
};

//   fonction pour recuperer tous les genres
export const getAllGenres = async () => {
  const db = await getDB();
  return (await db.getAll("genres")).map((g) => ({ label: g.nom, value: g.id }));
};

//   fonction pour recuperer tous les types de categories
export const getAllTypesCategories = async () => {
  const db = await getDB();
  return (await db.getAll("typesCategories")).map((t) => ({ label: t.nom, value: t.id }));
};

// ------------------------------------------------------------------------------------
// peuplement des donnees statiques
// ------------------------------------------------------------------------------------

//   fonction pour peupler la base de donnees avec des donnees statiques
const seedDatabase = async () => {
  const db = await getDB();

  console.log("insertion des donnees statiques...");

  const categoriesAge = [
    { nom: "Mini-Poussins", ageMin: 5, ageMax: 5 },
    { nom: "Poussins", ageMin: 6, ageMax: 7 },
    { nom: "Pupilles", ageMin: 8, ageMax: 9 },
    { nom: "Benjamins", ageMin: 10, ageMax: 11 },
    { nom: "Minimes", ageMin: 12, ageMax: 13 },
    { nom: "Cadets", ageMin: 14, ageMax: 15 },
    { nom: "Juniors", ageMin: 16, ageMax: 17 },
    { nom: "Seniors", ageMin: 18, ageMax: 40 },
    { nom: "Veterans", ageMin: 41, ageMax: 99 },
  ];

  const grades = [
    "Ceinture Blanche", "Ceinture Jaune", "Ceinture Orange", "Ceinture Verte",
    "Ceinture Bleue", "Ceinture Marron", "Ceinture Noire 1ere Dan",
    "Ceinture Noire 2eme Dan", "Ceinture Noire 3eme Dan", "Ceinture Noire 4eme Dan"
  ].map(nom => ({ nom }));

  const genres = [{ nom: "Homme" }, { nom: "Femme" }, { nom: "Mixte" }];
  const typesCategories = [{ nom: "Poule" }, { nom: "Tableau" }];

  const tx = db.transaction(["categoriesAge", "grades", "genres", "typesCategories"], "readwrite");

  await Promise.all([
    ...categoriesAge.map(cat => tx.objectStore("categoriesAge").add(cat)),
    ...grades.map(grade => tx.objectStore("grades").add(grade)),
    ...genres.map(genre => tx.objectStore("genres").add(genre)),
    ...typesCategories.map(type => tx.objectStore("typesCategories").add(type)),
  ]);

  await tx.done;
  console.log("donnees statiques inserees avec succes !");
};

// ------------------------------------------------------------------------------------
// init de la base de donnees
// ------------------------------------------------------------------------------------

//   fonction pour initialiser la base de donnees
const initDatabase = async () => {
  const db = await getDB();
  const count = await db.count("categoriesAge");
  if (count === 0) {
    await seedDatabase();
  }
};

// initialisation de la base de donnees au chargement
initDatabase();