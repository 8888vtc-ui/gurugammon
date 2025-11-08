🎯 Objectif

Développer un backend minimaliste pour l’application GammonGuru, basé exclusivement sur GNU Backgammon (GNUBG) en ligne de commande. Le backend agit comme un proxy neutre : il interroge GNUBG, renvoie les résultats, et délègue l’analyse pédagogique à une API IA (Claude ou autre).



🧱 Étapes de développement

1\. Initialisation du projet

Node.js + TypeScript



Express.js pour les endpoints REST



Structure de projet modulaire (src/cli, src/routes, tests, docs)



2\. Intégration GNUBG

Appels GNUBG via CLI (child\_process)



Fonction validateMoveViaCLI(boardState, move) dans gnubgRunner.ts



GNUBG est la source unique de vérité pour :



Validation des coups



Calculs d’équity



PR (Performance Rating)



ELO



3\. Endpoints REST

/api/validate-move : valide un coup via GNUBG



/api/analyze-error : envoie les données à Claude API ou autre IA



/api/quiz : renvoie des quiz pédagogiques (optionnel)



4\. Analyse pédagogique

Après chaque erreur, le backend appelle une API IA pour générer une explication



Si l’erreur est connue, utiliser la base statique (ERROR\_DATABASE.md)



Sinon, envoyer à Claude API



Sauvegarder toutes les explications pour éviter les appels répétés



5\. Système freemium

5 explications IA gratuites par utilisateur



Premium : explications illimitées



Tracking IP + device fingerprint (anti-fraude)



6\. Tests unitaires

Tester chaque fonction GNUBG



Simuler des erreurs et analyser les réponses



Tester les quotas API



🧠 Philosophie du projet

Pas d’aide pendant le jeu



Explications uniquement après coup



Apprentissage par l’erreur



Interface sobre pendant le jeu, pédagogique après



🧩 Modules à créer

Fichier	Rôle

src/cli/gnubgRunner.ts	Exécution des commandes GNUBG

src/routes/gnubg.ts	Endpoints Express

src/server.ts	Serveur principal

tests/gnubg.test.ts	Tests unitaires

docs/ERROR\_DATABASE.md	Base d’erreurs statiques

