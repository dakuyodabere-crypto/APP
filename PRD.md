# CampusConnect — PRD

## Problem Statement

Application unique permettant : consulter les notes, emploi du temps, paiement des frais, bibliothèque, communication avec les enseignants, notifications.

## User Choices

- Utilisateurs : Étudiants + Enseignants + Administration
- Authentification : Email/mot de passe (JWT)
- Paiement : Stripe
- Communication : Messagerie interne
- Design : Sobre et professionnel (Swiss / high-contrast, bleu #002FA7, polices Outfit + IBM Plex Sans)

## Architecture

- Backend: FastAPI + MongoDB (motor). JWT auth (Bearer token in localStorage). Stripe via emergentintegrations.
- Frontend: React + react-router + Tailwind + shadcn/ui + recharts. Sidebar layout.
- All routes prefixed `/api`. Collections: users, grades, timetable, fees, payment_transactions, books, loans, messages, notifications.

## Personas

- Étudiant (Sophie Dubois): consulte notes, emploi du temps, paie frais, emprunte livres, échange avec profs, reçoit notifications.
- Enseignant (Prof. Martin Leroy): saisit des notes, communique avec étudiants.
- Administration: vue d'ensemble des statistiques.

## Implemented (2026-06)

- Auth JWT multi-rôles (register/login/logout/me) + seed admin/prof/étudiant.
- Tableau de bord avec stats par rôle.
- Notes: tableau + graphique d'évolution (recharts); ajout de note par enseignant (génère notification).
- Emploi du temps: grille hebdomadaire Lundi–Vendredi.
- Paiements: liste des frais + statuts, checkout Stripe (montant côté serveur) + polling de statut + webhook.
- Bibliothèque: catalogue, emprunt/retour avec décompte d'exemplaires.
- Messagerie interne: contacts + fil de discussion.
- Notifications: liste, marquer lu / tout lu.
- Tested: 22/22 backend tests pass, frontend e2e all flows pass.

## Backlog

- P1: Enseignant/Admin — création de créneaux d'emploi du temps, gestion des frais, gestion du catalogue.
- P1: Indicateur temps réel de messages non lus dans la sidebar.
- P2: Brute-force lockout sur login, reset mot de passe.
- P2: Notifications push/temps réel, recherche dans la bibliothèque.

## Next Tasks

- Awaiting user feedback after first review.
