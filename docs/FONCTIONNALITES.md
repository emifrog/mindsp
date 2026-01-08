# 🚒 MindSP - Documentation Complète des Fonctionnalités

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Statut** : Production Ready

---

## 📚 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Module FMPA](#2-module-fmpa)
3. [Module Messagerie & Chat](#3-module-messagerie--chat)
4. [Module Mailbox](#4-module-mailbox)
5. [Module Agenda & Calendrier](#5-module-agenda--calendrier)
6. [Module Personnel](#6-module-personnel)
7. [Module Formations](#7-module-formations)
8. [Module TTA](#8-module-tta)
9. [Module Portails & CMS](#9-module-portails--cms)
10. [Module Notifications](#10-module-notifications)
11. [Module Documents](#11-module-documents)
12. [Recherche Globale](#12-recherche-globale)
13. [Authentification & Sécurité](#13-authentification--sécurité)
14. [Multi-Tenancy](#14-multi-tenancy)
15. [Caractéristiques Techniques](#15-caractéristiques-techniques)

---

## 1. Vue d'ensemble

MindSP est une **solution SaaS complète** pour la gestion des Services Départementaux d'Incendie et de Secours (SDIS). L'application offre une plateforme unifiée pour gérer l'ensemble des activités opérationnelles, administratives et de communication d'un SDIS.

### 🎯 Objectifs Principaux

- **Centraliser** la gestion des activités FMPA (Formation, Manœuvre, Présence Active)
- **Faciliter** la communication interne via chat temps réel et messagerie
- **Optimiser** le suivi du personnel et des qualifications
- **Automatiser** la gestion du temps de travail additionnel (TTA)
- **Simplifier** l'organisation via un agenda partagé

### 📊 Statistiques du Projet

| Métrique         | Valeur  |
| ---------------- | ------- |
| Fichiers créés   | 82+     |
| Lignes de code   | ~23,200 |
| Migrations DB    | 6       |
| Modules métier   | 8       |
| API Routes       | 35+     |
| Composants React | 45+     |
| Pages Next.js    | 30+     |

---

## 2. Module FMPA

### 📋 Description

Le module FMPA (Formation, Manœuvre, Présence Active) est le cœur de l'application. Il permet de gérer l'ensemble des activités opérationnelles des sapeurs-pompiers.

### ✨ Fonctionnalités

#### Gestion des Activités

- **Création d'activités** avec formulaire complet
  - 7 types d'activités : Formation, Manœuvre, Exercice, Présence Active, Cérémonie, Réunion, Autre
  - Titre, description, dates de début/fin
  - Lieu et localisation
  - Nombre maximum de participants
  - Objectifs pédagogiques
  - Matériel nécessaire

- **Cycle de vie des activités**
  - Statuts : Brouillon → Publié → En cours → Terminé/Annulé
  - Validation par les responsables
  - Modification et annulation avec notifications

#### Inscriptions

- **Inscription en ligne** des participants
  - Vérification automatique des quotas
  - Option de validation hiérarchique requise
  - Confirmation par email automatique
  - Possibilité de désinscription (si > 24h avant)

- **Gestion des participants**
  - Liste des inscrits avec statuts
  - Statuts : Inscrit, Confirmé, Présent, Absent, Excusé, Annulé
  - Notes et commentaires par participant
  - Raison d'absence pour les excusés

#### Gestion des Repas

- **Option repas** pour les activités
  - Activation/désactivation par activité
  - Choix de menu si plusieurs options
  - Gestion des régimes spéciaux (allergies, végétarien, etc.)
  - Confirmation des inscriptions repas

#### Émargement & QR Codes

- **QR Codes uniques** par activité
  - Génération automatique à la création
  - Scan via application PWA
  - Pointage automatique des présences

- **Validation des présences**
  - Pointage entrée/sortie horodaté
  - Validation par le chef de centre
  - Historique complet des pointages

#### Rappels Automatiques

- **Notifications programmées**
  - J-7 : Rappel une semaine avant
  - J-3 : Rappel trois jours avant
  - J-1 : Rappel la veille
  - Personnalisables par type d'activité

#### Exports

- **Export PDF**
  - Feuilles d'émargement avec logo SDIS
  - Liste des participants avec signatures
  - Rapports d'activité détaillés

- **Export Excel/CSV**
  - Données brutes pour analyse
  - Statistiques par période
  - Export personnalisable

#### Statistiques

- **Tableaux de bord**
  - Taux de participation
  - Heures de formation par agent
  - Évolution mensuelle/annuelle
  - Comparaison entre centres

### 🔗 API Endpoints

| Méthode | Endpoint                                    | Description                 |
| ------- | ------------------------------------------- | --------------------------- |
| GET     | `/api/fmpa`                                 | Liste des FMPA avec filtres |
| POST    | `/api/fmpa`                                 | Créer une FMPA              |
| GET     | `/api/fmpa/[id]`                            | Détails d'une FMPA          |
| PUT     | `/api/fmpa/[id]`                            | Modifier une FMPA           |
| DELETE  | `/api/fmpa/[id]`                            | Supprimer une FMPA          |
| POST    | `/api/fmpa/[id]/participants`               | S'inscrire                  |
| DELETE  | `/api/fmpa/[id]/participants/[userId]`      | Se désinscrire              |
| PUT     | `/api/fmpa/[id]/participants/[id]/check-in` | Pointer                     |
| GET     | `/api/fmpa/[id]/export`                     | Export PDF                  |
| GET     | `/api/fmpa/stats`                           | Statistiques                |

---

## 3. Module Messagerie & Chat

### 📋 Description

Système de communication temps réel permettant aux agents de communiquer instantanément via des canaux de discussion.

### ✨ Fonctionnalités

#### Canaux de Discussion

- **Types de canaux**
  - **Public** : Visible par tous les membres du tenant
  - **Privé** : Sur invitation uniquement
  - **Direct** : Conversation 1-to-1

- **Gestion des canaux**
  - Création avec nom, description, icône et couleur
  - Archivage des canaux inactifs
  - Rôles : Propriétaire, Admin, Membre

#### Messages

- **Envoi de messages**
  - Texte avec formatage
  - Support des emojis
  - Pièces jointes (images, fichiers)
  - Messages système automatiques

- **Fonctionnalités avancées**
  - **Threads** : Réponses en fil de discussion
  - **Réactions emoji** : Réagir aux messages
  - **Mentions** : @utilisateur pour notifier
  - **Édition** : Modifier ses messages
  - **Suppression** : Supprimer ses messages

#### Temps Réel (Socket.IO)

- **Indicateurs de présence**
  - Statuts : En ligne, Absent, Occupé, Hors ligne
  - Statut personnalisé
  - Dernière connexion visible

- **Typing indicators**
  - Affichage "X est en train d'écrire..."
  - Mise à jour en temps réel

- **Notifications instantanées**
  - Nouveau message
  - Mention
  - Réaction à un message

#### Pièces Jointes

- **Upload de fichiers** (via UploadThing)
  - Drag & drop
  - Prévisualisation des images
  - Téléchargement des fichiers
  - Limite de taille configurable

### 🔗 API Endpoints

| Méthode | Endpoint                            | Description          |
| ------- | ----------------------------------- | -------------------- |
| GET     | `/api/chat/channels`                | Liste des canaux     |
| POST    | `/api/chat/channels`                | Créer un canal       |
| GET     | `/api/chat/channels/[id]`           | Détails d'un canal   |
| GET     | `/api/chat/channels/[id]/messages`  | Messages du canal    |
| POST    | `/api/chat/channels/[id]/messages`  | Envoyer un message   |
| POST    | `/api/chat/messages/[id]/reactions` | Ajouter une réaction |

---

## 4. Module Mailbox

### 📋 Description

Système de messagerie email interne complet, similaire à une boîte mail classique mais sécurisé au sein de l'organisation.

### ✨ Fonctionnalités

#### Gestion des Emails

- **Composition**
  - Destinataires multiples (À, CC, CCI)
  - Sujet et corps du message
  - Formatage du texte
  - Pièces jointes

- **Brouillons**
  - Sauvegarde automatique
  - Reprise de la rédaction
  - Suppression des brouillons

#### Organisation

- **5 Dossiers standards**
  - **Boîte de réception** (Inbox)
  - **Envoyés** (Sent)
  - **Brouillons** (Drafts)
  - **Archives** (Archive)
  - **Corbeille** (Trash)

- **Labels personnalisés**
  - Création de labels avec couleurs
  - Attribution multiple par email
  - Filtrage par label

- **Actions sur les emails**
  - Marquer comme lu/non lu
  - Marquer comme important
  - Archiver
  - Supprimer
  - Étoiler (favoris)

#### Listes de Diffusion

- **Listes statiques**
  - Ajout manuel de membres
  - Gestion des membres

- **Listes dynamiques**
  - Basées sur des critères (rôle, centre, etc.)
  - Mise à jour automatique

#### Fonctionnalités Avancées

- **Invitations événements**
  - Intégration avec l'agenda
  - Réponses : Accepté, Refusé, Peut-être
  - Suivi des réponses

- **Propositions de formation**
  - Inscription directe depuis l'email
  - Gestion des places disponibles
  - Liste d'attente automatique

- **Sondages intégrés**
  - Questions à choix multiples
  - Réponses anonymes optionnelles
  - Date de clôture
  - Résultats en temps réel

### 🔗 API Endpoints

| Méthode | Endpoint              | Description           |
| ------- | --------------------- | --------------------- |
| GET     | `/api/mail`           | Liste des emails      |
| POST    | `/api/mail`           | Envoyer un email      |
| GET     | `/api/mail/[id]`      | Détails d'un email    |
| PUT     | `/api/mail/[id]`      | Modifier (brouillon)  |
| DELETE  | `/api/mail/[id]`      | Supprimer             |
| PUT     | `/api/mail/[id]/read` | Marquer comme lu      |
| GET     | `/api/mail/folders`   | Dossiers et compteurs |

---

## 5. Module Agenda & Calendrier

### 📋 Description

Calendrier partagé permettant de visualiser et gérer les disponibilités, événements et activités de l'ensemble du personnel.

### ✨ Fonctionnalités

#### Vues du Calendrier

- **Vue mensuelle**
  - Aperçu global du mois
  - Indicateurs visuels par type d'événement
  - Navigation rapide entre les mois

- **Vue hebdomadaire**
  - Détail de la semaine
  - Créneaux horaires visibles
  - Glisser-déposer pour déplacer

- **Vue journalière**
  - Planning détaillé de la journée
  - Heures de début/fin précises

#### Types d'Événements

- **8 types disponibles**
  - Garde
  - FMPA
  - Formation
  - Protocole
  - Entretien
  - Personnel
  - Réunion
  - Autre

- **Personnalisation**
  - Couleur par type
  - Icônes personnalisées
  - Événements toute la journée

#### Gestion des Disponibilités

- **3 statuts de disponibilité**
  - **Disponible** : Peut être sollicité
  - **Indisponible** : Absence totale
  - **Partiel** : Disponibilité limitée

- **Récurrence**
  - Événements récurrents (quotidien, hebdomadaire, mensuel)
  - Règles RRULE (RFC 5545)
  - Exceptions possibles

#### Participants & Invitations

- **Gestion des participants**
  - Invitation par email
  - Statuts : En attente, Accepté, Refusé, Peut-être
  - Rôles : Chef, Équipier, Observateur

- **Rappels automatiques**
  - Par email
  - Par notification push
  - Timing personnalisable (15min, 1h, 1j avant)

#### Intégrations

- **Export iCal**
  - Synchronisation avec calendriers externes
  - Google Calendar, Outlook, Apple Calendar
  - URL de flux personnalisée

- **Intégration FMPA**
  - Affichage automatique des activités FMPA
  - Lien direct vers les détails

- **Intégration Formations**
  - Affichage des formations planifiées
  - Inscription depuis le calendrier

### 🔗 API Endpoints

| Méthode | Endpoint                       | Description           |
| ------- | ------------------------------ | --------------------- |
| GET     | `/api/agenda/events`           | Liste des événements  |
| POST    | `/api/agenda/events`           | Créer un événement    |
| PUT     | `/api/agenda/events/[id]`      | Modifier              |
| DELETE  | `/api/agenda/events/[id]`      | Supprimer             |
| GET     | `/api/calendar/availabilities` | Disponibilités        |
| POST    | `/api/calendar/availabilities` | Définir disponibilité |
| GET     | `/api/calendar/export`         | Export iCal           |

---

## 6. Module Personnel

### 📋 Description

Module complet de gestion des ressources humaines permettant le suivi des dossiers individuels, aptitudes médicales, qualifications et équipements.

### ✨ Fonctionnalités

#### Fiches Personnel

- **Informations de base**
  - Données personnelles (nom, prénom, contact)
  - Matricule et badge
  - Photo/Avatar

- **Engagement**
  - Date d'engagement initial
  - Date de réengagement
  - Ancienneté calculée automatiquement

- **Grade actuel**
  - Grade en cours
  - Date d'effet
  - Historique des grades

#### Aptitudes Médicales

- **Suivi médical complet**
  - Statut d'aptitude : Apte, Inapte temporaire, Inapte définitif, Restrictions
  - Période de validité
  - Restrictions éventuelles

- **Visites médicales**
  - Date dernière visite
  - Date prochaine visite
  - Médecin référent

- **Alertes automatiques**
  - Expiration proche (30j, 15j, 7j)
  - Notification au responsable
  - Email de rappel

#### Qualifications & Compétences

- **Types de qualifications**
  - Formation
  - Spécialité
  - Permis
  - Habilitation
  - Autre

- **Gestion des validités**
  - Date d'obtention
  - Date d'expiration
  - Renouvellement automatique ou manuel

- **Statuts**
  - Valide
  - Expire bientôt
  - Expiré
  - Suspendu

- **Documents associés**
  - Certificats
  - Attestations
  - Numéro de certificat

#### Équipements Individuels (EPI)

- **Types d'équipements**
  - EPI (Équipement de Protection Individuelle)
  - Vêtements
  - Matériel
  - Autre

- **Suivi des attributions**
  - Date d'attribution
  - Date de retour
  - Numéro de série

- **Contrôles périodiques**
  - Date dernier contrôle
  - Date prochain contrôle
  - Fréquence de contrôle

- **État de l'équipement**
  - Neuf, Bon, Moyen, Mauvais, Réformé
  - Statut : Attribué, Rendu, Perdu, Endommagé

#### Historique de Carrière

- **Timeline interactive**
  - Engagement
  - Promotions de grade
  - Médailles et décorations
  - Réengagements

- **Historique des grades**
  - Type de promotion : Ancienneté, Choix, Examen
  - Numéro et date d'arrêté
  - Notes

#### Médailles & Décorations

- **Types de médailles**
  - Honneur
  - Mérite
  - Ancienneté
  - Courage
  - Autre

- **Informations**
  - Échelon (Bronze, Argent, Or)
  - Date d'attribution
  - Numéro d'arrêté
  - Date et lieu de cérémonie

#### Documents Personnel

- **Types de documents**
  - Contrat
  - Arrêté
  - Attestation
  - Diplôme
  - Certificat
  - Autre

- **Gestion**
  - Upload de fichiers
  - Catégorisation
  - Tags
  - Date de validité

#### Dashboard Alertes

- **Vue d'ensemble**
  - Alertes à 30 jours
  - Alertes à 15 jours
  - Alertes à 7 jours
  - Alertes urgentes

- **Types d'alertes**
  - Aptitude médicale expirante
  - Qualification expirante
  - Contrôle EPI à effectuer
  - Visite médicale à planifier

### 🔗 API Endpoints

| Méthode | Endpoint                        | Description        |
| ------- | ------------------------------- | ------------------ |
| GET     | `/api/personnel/files`          | Liste des fiches   |
| POST    | `/api/personnel/files`          | Créer une fiche    |
| GET     | `/api/personnel/files/[id]`     | Détails            |
| PUT     | `/api/personnel/files/[id]`     | Modifier           |
| GET     | `/api/personnel/qualifications` | Qualifications     |
| GET     | `/api/personnel/alerts`         | Alertes expiration |

---

## 7. Module Formations

### 📋 Description

Gestion complète du catalogue de formations, des inscriptions et du suivi des participants.

### ✨ Fonctionnalités

#### Catalogue de Formations

- **6 Catégories**
  - Incendie
  - Secours
  - Technique
  - Management
  - Réglementaire
  - Autre

- **4 Niveaux**
  - Initiale
  - Continue
  - Perfectionnement
  - Spécialisation

- **Informations formation**
  - Code unique (ex: FOR-2025-001)
  - Titre et description
  - Durée en heures
  - Prérequis
  - Durée de validité

#### Planification

- **Sessions de formation**
  - Dates de début et fin
  - Lieu
  - Formateur assigné
  - Places min/max

- **Calendrier mensuel**
  - Vue par catégorie avec couleurs
  - Filtres avancés
  - Navigation rapide

#### Inscriptions

- **Workflow complet**
  - Demande d'inscription
  - Validation hiérarchique
  - Confirmation ou refus avec motif
  - Notification automatique

- **Statuts d'inscription**
  - En attente
  - Approuvé
  - Refusé
  - Annulé
  - Terminé

#### Suivi des Présences

- **Gestion des présences**
  - Pointage par session
  - Taux de présence calculé
  - Absences justifiées/injustifiées

#### Résultats & Certificats

- **Évaluation**
  - Réussite/Échec
  - Score obtenu
  - Commentaires formateur

- **Génération de certificats**
  - Attestation PDF automatique
  - URL de téléchargement
  - Archivage dans le dossier personnel

### 🔗 API Endpoints

| Méthode | Endpoint                                           | Description          |
| ------- | -------------------------------------------------- | -------------------- |
| GET     | `/api/formations`                                  | Liste des formations |
| POST    | `/api/formations`                                  | Créer une formation  |
| GET     | `/api/formations/[id]`                             | Détails              |
| PUT     | `/api/formations/[id]`                             | Modifier             |
| POST    | `/api/formations/[id]/registrations`               | S'inscrire           |
| PUT     | `/api/formations/[id]/registrations/[id]/validate` | Valider              |
| GET     | `/api/formations/calendar`                         | Calendrier           |

---

## 8. Module TTA

### 📋 Description

Module de gestion du Temps de Travail Additionnel permettant la saisie, validation et export des heures supplémentaires.

### ✨ Fonctionnalités

#### Saisie des Heures

- **Types d'activités**
  - FMPA
  - Intervention
  - Formation
  - Garde
  - Astreinte
  - Autre

- **Détail des heures**
  - Heures normales
  - Heures de nuit
  - Heures dimanche
  - Heures jours fériés

- **Lien avec FMPA**
  - Association automatique si applicable
  - Description libre sinon

#### Calcul Automatique

- **Indemnités calculées**
  - Montant de base
  - Majoration nuit
  - Majoration dimanche
  - Majoration férié
  - Total automatique

- **Taux configurables**
  - Par type d'heure
  - Par grade
  - Par ancienneté

#### Validation

- **Workflow de validation**
  - Saisie par l'agent
  - Validation par le chef de centre
  - Motif de refus si rejeté

- **Statuts**
  - En attente
  - Validé
  - Rejeté
  - Exporté

#### Calendrier TTA

- **Vue mensuelle**
  - Heures par jour
  - Totaux hebdomadaires
  - Indicateurs visuels par type

- **Statistiques**
  - Total heures du mois
  - Total montant
  - Répartition par type

#### Exports

- **Format SEPA XML**
  - Standard pain.001.001.03
  - Pour virement bancaire automatique
  - Conforme aux normes bancaires

- **Format CSV/Excel**
  - Pour logiciels métiers
  - Données détaillées
  - Personnalisable

- **Historique des exports**
  - Date d'export
  - Nombre d'entrées
  - Montant total
  - Fichier téléchargeable

### 🔗 API Endpoints

| Méthode | Endpoint                 | Description           |
| ------- | ------------------------ | --------------------- |
| GET     | `/api/tta`               | Liste des entrées TTA |
| POST    | `/api/tta`               | Créer une entrée      |
| PUT     | `/api/tta/[id]`          | Modifier              |
| PUT     | `/api/tta/[id]/validate` | Valider               |
| GET     | `/api/tta/stats`         | Statistiques          |
| POST    | `/api/tta/export`        | Générer export        |
| GET     | `/api/tta/exports`       | Historique exports    |

---

## 9. Module Portails & CMS

### 📋 Description

Système de gestion de contenu permettant de créer des portails d'information pour différentes spécialités ou services.

### ✨ Fonctionnalités

#### Portails

- **Création de portails**
  - Nom et description
  - Slug URL personnalisé
  - Icône et couleur
  - Ordre d'affichage

- **Visibilité**
  - Public ou privé
  - Authentification requise ou non
  - Statuts : Brouillon, Publié, Archivé

#### Pages

- **Gestion des pages**
  - Titre et contenu riche
  - Slug URL
  - Extrait pour aperçu

- **SEO**
  - Meta title
  - Meta description

- **Templates de mise en page**
  - Standard
  - Pleine largeur
  - Sidebar gauche
  - Sidebar droite
  - Landing page

#### Actualités

- **7 Catégories**
  - Général
  - Formation
  - Intervention
  - Prévention
  - Matériel
  - Événement
  - Administratif

- **Gestion des articles**
  - Titre, contenu, extrait
  - Image de couverture
  - Galerie d'images
  - Tags

- **Publication**
  - Brouillon/Publié
  - Date de publication
  - Article épinglé
  - Compteur de vues

#### Documents Partagés

- **Catégories de documents**
  - Procédure
  - Formation
  - Technique
  - Administratif
  - Sécurité
  - Matériel
  - Autre

- **Gestion des accès**
  - Public ou privé
  - Rôles autorisés
  - Compteur de téléchargements

- **Métadonnées**
  - Description
  - Tags
  - Taille du fichier
  - Type MIME

### 🔗 API Endpoints

| Méthode | Endpoint                | Description          |
| ------- | ----------------------- | -------------------- |
| GET     | `/api/portals`          | Liste des portails   |
| POST    | `/api/portals`          | Créer un portail     |
| GET     | `/api/news`             | Liste des actualités |
| POST    | `/api/news`             | Créer une actualité  |
| GET     | `/api/portal-documents` | Documents            |

---

## 10. Module Notifications

### 📋 Description

Système de notifications push temps réel informant les utilisateurs des événements importants.

### ✨ Fonctionnalités

#### Types de Notifications

- **FMPA**
  - Création d'une nouvelle activité
  - Modification d'une activité
  - Annulation
  - Rappel avant l'événement

- **Chat**
  - Nouveau message
  - Mention (@utilisateur)
  - Réaction à un message
  - Invitation à un canal

- **Mailbox**
  - Email reçu
  - Email important

- **Formation**
  - Inscription approuvée
  - Inscription refusée
  - Rappel de formation

- **Événements**
  - Invitation à un événement
  - Rappel d'événement
  - Modification d'événement

- **Messagerie**
  - Réponse à une invitation (accepté, refusé, peut-être)
  - Invitation à une formation
  - Inscription à une formation
  - Nouveau sondage
  - Réponse à un sondage
  - Clôture de sondage

- **Système**
  - Annonces générales
  - Maintenance planifiée

#### Niveaux de Priorité

- **LOW** : Information non urgente
- **NORMAL** : Notification standard
- **HIGH** : Notification importante
- **URGENT** : Action requise immédiatement

#### Fonctionnalités

- **Temps réel**
  - Push via WebSocket
  - Badge de compteur
  - Son de notification (optionnel)

- **Actions personnalisées**
  - Bouton d'action avec label
  - URL de redirection
  - Lien vers l'élément concerné

- **Gestion**
  - Marquer comme lu
  - Marquer tout comme lu
  - Groupement temporel intelligent
  - Expiration automatique

- **Métadonnées**
  - Icône personnalisée
  - Données supplémentaires en JSON
  - Date d'expiration

### 🔗 API Endpoints

| Méthode | Endpoint                           | Description             |
| ------- | ---------------------------------- | ----------------------- |
| GET     | `/api/notifications`               | Liste des notifications |
| PUT     | `/api/notifications/[id]/read`     | Marquer comme lu        |
| PUT     | `/api/notifications/mark-all-read` | Tout marquer lu         |
| GET     | `/api/notifications/unread-count`  | Compteur non lues       |
| DELETE  | `/api/notifications/[id]`          | Supprimer               |

---

## 11. Module Documents

### 📋 Description

Gestion centralisée des documents de l'organisation avec système de catégorisation et de recherche.

### ✨ Fonctionnalités

#### Upload de Fichiers

- **Méthodes d'upload**
  - Sélection de fichier classique
  - Drag & drop
  - Upload multiple

- **Types supportés**
  - Documents (PDF, Word, Excel, etc.)
  - Images (JPG, PNG, GIF, etc.)
  - Autres formats

#### Organisation

- **Catégorisation**
  - Catégories personnalisables
  - Tags multiples
  - Description

- **Métadonnées**
  - Nom du fichier
  - Taille
  - Type MIME
  - Date d'upload
  - Uploadeur

#### Accès

- **Visibilité**
  - Document public
  - Document privé
  - Restriction par rôle

#### Recherche

- **Recherche avancée**
  - Par nom
  - Par catégorie
  - Par tags
  - Par date

### 🔗 API Endpoints

| Méthode | Endpoint              | Description         |
| ------- | --------------------- | ------------------- |
| GET     | `/api/documents`      | Liste des documents |
| POST    | `/api/uploadthing`    | Upload de fichier   |
| GET     | `/api/documents/[id]` | Détails             |
| DELETE  | `/api/documents/[id]` | Supprimer           |

---

## 12. Recherche Globale

### 📋 Description

Moteur de recherche unifié permettant de trouver rapidement des informations dans l'ensemble de l'application.

### ✨ Fonctionnalités

#### Sources de Recherche

- **6 sources indexées**
  - Utilisateurs (nom, email, matricule)
  - FMPA (titre, description, lieu)
  - Formations (titre, code, description)
  - Messages (contenu)
  - Documents (nom, description, tags)
  - Actualités (titre, contenu)

#### Interface

- **Recherche rapide**
  - Raccourci clavier (Ctrl+K / Cmd+K)
  - Suggestions en temps réel
  - Résultats groupés par type

- **Filtres**
  - Par type de contenu
  - Par date
  - Par statut

#### Résultats

- **Affichage**
  - Aperçu du contenu
  - Mise en surbrillance des termes
  - Lien direct vers l'élément

### 🔗 API Endpoints

| Méthode | Endpoint      | Description       |
| ------- | ------------- | ----------------- |
| GET     | `/api/search` | Recherche globale |

---

## 13. Authentification & Sécurité

### 📋 Description

Système d'authentification robuste basé sur NextAuth.js avec gestion des sessions JWT.

### ✨ Fonctionnalités

#### Authentification

- **Connexion**
  - Email et mot de passe
  - Sélection du tenant (SDIS)
  - Remember me

- **Inscription**
  - Formulaire complet
  - Validation email
  - Mot de passe sécurisé (min 8 chars, majuscule, minuscule, chiffre)

- **Récupération mot de passe**
  - Email de réinitialisation
  - Lien temporaire sécurisé

#### Sessions

- **JWT (JSON Web Tokens)**
  - Access token court (15min)
  - Refresh token long (7 jours)
  - Renouvellement automatique

#### Rôles & Permissions

- **4 rôles hiérarchiques**
  - **SUPER_ADMIN** : Accès total multi-tenant
  - **ADMIN** : Administration du tenant
  - **MANAGER** : Gestion des équipes
  - **USER** : Utilisateur standard

- **Permissions granulaires**
  - Codes de permission par fonctionnalité
  - Vérification côté serveur

#### Sécurité

- **Protection des routes**
  - Middleware Next.js
  - Vérification token à chaque requête
  - Redirection si non authentifié

- **Validation des entrées**
  - Schémas Zod sur toutes les API
  - Sanitization des données

- **Chiffrement**
  - Mots de passe hashés (bcrypt)
  - Communications HTTPS

- **Rate Limiting**
  - Protection contre les attaques brute force
  - Limite par IP et par utilisateur

- **Content Security Policy (CSP)**
  - Protection XSS
  - Restriction des sources

- **Audit Logs**
  - Traçabilité des actions
  - IP et user-agent enregistrés

### 🔗 API Endpoints

| Méthode | Endpoint                    | Description         |
| ------- | --------------------------- | ------------------- |
| POST    | `/api/auth/register`        | Inscription         |
| POST    | `/api/auth/login`           | Connexion           |
| POST    | `/api/auth/logout`          | Déconnexion         |
| POST    | `/api/auth/refresh`         | Renouveler token    |
| POST    | `/api/auth/forgot-password` | Mot de passe oublié |

---

## 14. Multi-Tenancy

### 📋 Description

Architecture multi-tenant permettant à plusieurs SDIS d'utiliser la même instance de l'application avec une isolation complète des données.

### ✨ Fonctionnalités

#### Isolation des Données

- **Row-Level Security**
  - Chaque enregistrement lié à un `tenantId`
  - Filtrage automatique par tenant
  - Impossible d'accéder aux données d'un autre tenant

- **Prisma Middleware**
  - Injection automatique du `tenantId`
  - Vérification à chaque requête

#### Subdomain Routing

- **URLs personnalisées**
  - Format : `{tenant}.mindsp.fr`
  - Exemple : `sdis13.mindsp.fr`, `sdis06.mindsp.fr`

- **Détection automatique**
  - Extraction du subdomain
  - Vérification de l'existence du tenant
  - Redirection si tenant invalide

#### Configuration par Tenant

- **Personnalisation**
  - Logo personnalisé
  - Couleur primaire
  - Configuration JSON flexible

- **Statuts du tenant**
  - Actif
  - Suspendu
  - Période d'essai
  - Annulé

- **Fonctionnalités activables**
  - Modules activés/désactivés par tenant
  - Configuration des limites

---

## 15. Caractéristiques Techniques

### 🚀 Performance

#### Optimisations Implémentées

- **Cache Redis**
  - Cache-aside pattern
  - Invalidation automatique
  - 10 helpers spécialisés
  - **-96% temps de réponse**

- **Pagination Universelle**
  - Helper réutilisable
  - Métadonnées standardisées
  - **-80% données transférées**

- **Résolution N+1 Queries**
  - Utilisation de `groupBy()`
  - Batch queries
  - Maps pour lookups
  - **159 → 6 queries (-96%)**

- **Indexes Composés**
  - 12 indexes optimisés
  - 6 modèles concernés
  - **-85% temps query**

- **Lazy Loading**
  - Next.js dynamic imports
  - Skeleton loading states
  - **-18% bundle initial**

#### Métriques de Performance

| Métrique     | Avant  | Après  | Gain     |
| ------------ | ------ | ------ | -------- |
| API Response | ~2.5s  | ~100ms | **-96%** |
| DB Queries   | 159    | 6      | **-96%** |
| Bundle Size  | 340KB  | 280KB  | **-18%** |
| Page Load    | ~850ms | ~350ms | **-59%** |

### 🛠️ Stack Technique

#### Frontend

| Technologie      | Version | Usage                        |
| ---------------- | ------- | ---------------------------- |
| Next.js          | 14      | Framework React (App Router) |
| React            | 18      | Bibliothèque UI              |
| TypeScript       | 5.3+    | Typage statique              |
| TailwindCSS      | 3.4+    | Styling                      |
| Radix UI         | -       | Composants accessibles       |
| shadcn/ui        | -       | Design system                |
| Zustand          | 4.5+    | State management             |
| React Hook Form  | 7.50+   | Gestion formulaires          |
| Zod              | 3.22+   | Validation                   |
| Socket.IO Client | 4.7+    | Temps réel                   |
| Lucide React     | -       | Icônes                       |
| date-fns         | -       | Manipulation dates           |
| jsPDF            | -       | Génération PDF               |

#### Backend

| Technologie        | Version | Usage                  |
| ------------------ | ------- | ---------------------- |
| Node.js            | 20+     | Runtime                |
| Next.js API Routes | 14      | API REST               |
| Prisma             | 5       | ORM                    |
| PostgreSQL         | 16+     | Base de données        |
| Redis              | 7+      | Cache & Pub/Sub        |
| NextAuth.js        | 5+      | Authentification       |
| Socket.IO          | 4.7+    | WebSocket              |
| BullMQ             | 5+      | File d'attente         |
| Resend             | -       | Emails transactionnels |
| UploadThing        | -       | Upload fichiers        |

#### Infrastructure

| Service                    | Usage              |
| -------------------------- | ------------------ |
| Vercel                     | Hosting & CDN      |
| PostgreSQL (Supabase/Neon) | Base de données    |
| Upstash Redis              | Cache              |
| UploadThing                | Stockage fichiers  |
| Sentry                     | Monitoring (ready) |

### 📱 PWA & Responsive

- **Progressive Web App**
  - Installation sur mobile/desktop
  - Fonctionnement hors ligne (partiel)
  - Notifications push

- **Design Responsive**
  - Desktop (1920px+)
  - Tablet (768px - 1024px)
  - Mobile (< 768px)

- **Dark Mode**
  - Thème sombre complet
  - Détection préférence système
  - Toggle manuel

### 🔒 Sécurité

| Mesure           | Implémentation             |
| ---------------- | -------------------------- |
| Authentification | NextAuth.js + JWT          |
| Chiffrement MDP  | bcrypt                     |
| Validation       | Zod sur toutes les entrées |
| HTTPS            | Obligatoire en production  |
| CSP              | Headers configurés         |
| Rate Limiting    | Upstash Ratelimit          |
| Audit Logs       | Traçabilité complète       |
| Multi-tenancy    | Isolation RLS              |

---

## 📝 Conclusion

MindSP offre une solution complète et moderne pour la gestion des SDIS, couvrant l'ensemble des besoins opérationnels et administratifs :

- ✅ **8 modules métier** entièrement fonctionnels
- ✅ **Communication temps réel** via chat et notifications
- ✅ **Gestion RH complète** avec suivi des qualifications
- ✅ **Performance optimisée** (~90% plus rapide)
- ✅ **Sécurité renforcée** avec multi-tenancy
- ✅ **Interface moderne** responsive et accessible

---

_Documentation générée pour MindSP v1.0.0_
