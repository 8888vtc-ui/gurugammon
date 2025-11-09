# 🎲 GammonGuru - Backend Complet

> Plateforme complète de backgammon avec architecture hybride Express + Netlify Functions, frontend Vue.js, et analyse GNUBG

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey.svg)](https://expressjs.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-green.svg)](https://vuejs.org/)
[![Netlify](https://img.shields.io/badge/Netlify-Functions-orange.svg)](https://netlify.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Railway](https://img.shields.io/badge/Railway-Docker-blue.svg)](https://railway.app/)

---

## 🏗️ Architecture Hybride Complète

**GammonGuru** utilise une double architecture backend pour optimiser les performances et la scalabilité :

### 🔧 **Backend Express.js** (Railway)
- **WebSocket temps réel** : Multijoueur synchronisé
- **Traitements lourds** : Analyse GNUBG avancée
- **API REST complète** : 15+ endpoints
- **Container Docker** : Déploiement production

### ⚡ **Netlify Functions** (Serverless)
- **Authentification** : JWT sécurisé
- **API légère** : 6 endpoints critiques
- **Auto-scaling** : Mondial CDN
- **Zero downtime** : Serverless natif

### 🎨 **Frontend Vue.js** (Netlify)
- **SPA moderne** : Vue 3 + Composition API
- **State management** : Pinia stores
- **Routing** : Vue Router
- **Build tool** : Vite + TypeScript

### 🗄️ **Base de Données** (Supabase)
- **PostgreSQL managé** : Haute disponibilité
- **Schema complet** : 10+ tables relationnelles
- **Row Level Security** : Sécurité native
- **Realtime subscriptions** : WebSocket natif

---

## 🚀 Setup Rapide (10 minutes)

### 1. Cloner le projet complet
```bash
git clone https://github.com/8888vtc-ui/gnubg-backend.git
cd gnubg-backend
npm install
```

### 2. Configuration multi-environnement
```bash
# Backend Express (Railway)
cp backend/.env.example backend/.env

# Frontend Vue.js (Netlify)
cp frontend/.env.example frontend/.env.local

# Netlify Functions (local)
cp .env.example .env.local
```

### 3. Base de données Supabase
```bash
# Schéma SQL complet
npx prisma db push
# OU importer database/schema.sql dans Supabase
```

### 4. Démarrer tous les services
```bash
# Backend Express (port 3000)
cd backend && npm run dev

# Frontend Vue.js (port 5173) 
cd ../frontend && npm run dev

# Netlify Functions (port 9999)
cd .. && netlify dev --port 9999
```

---

## 📁 Structure Complète du Projet

```
gnubg-backend/
├── 📂 backend/                    # Express.js Server (Railway)
│   ├── 📂 src/
│   │   ├── 📂 controllers/        # Auth + Games logic
│   │   ├── 📂 services/          # GNUBG + Database
│   │   ├── 📂 routes/            # API endpoints
│   │   ├── 📂 middleware/        # Security + validation
│   │   └── 📂 utils/             # Helpers + types
│   ├── 📄 Dockerfile             # Container production
│   ├── 📄 package.json           # Dependencies backend
│   └── 📄 README.md              # Documentation backend
├── 📂 frontend/                   # Vue.js SPA (Netlify)
│   ├── 📂 src/
│   │   ├── 📂 components/        # Vue components
│   │   ├── 📂 views/             # Page components
│   │   ├── 📂 stores/            # Pinia state
│   │   ├── 📂 router/            # Vue Router
│   │   └── 📂 services/          # API clients
│   ├── 📄 vite.config.ts         # Build configuration
│   └── 📄 package.json           # Dependencies frontend
├── 📂 functions/                  # Netlify Functions (Serverless)
│   ├── 📄 login.js               # Authentification
│   ├── 📄 register.js            # Inscription
│   ├── 📄 profile.js             # Gestion profil
│   ├── 📄 create.js              # Création parties
│   ├── 📄 analyze.js             # Analyse GNUBG
│   └── 📄 status.js              # État parties
├── 📂 database/                   # Schéma SQL
│   └── 📄 schema.sql              # Tables complètes
├── 📂 prisma/                     # ORM Database
│   └── 📄 schema.prisma           # Schema Prisma
├── 📄 netlify.toml               # Configuration Netlify
├── 📄 railway.toml               # Configuration Railway
└── 📄 package.json               # Dependencies racine
```

---

## 📡 API Complète

### 🔐 **Authentification** (15 endpoints)

#### Backend Express (Railway)
```
POST   /api/auth/register          # Inscription complète
POST   /api/auth/login             # Connexion JWT
POST   /api/auth/refresh           # Refresh token rotation
GET    /api/auth/profile           # Profil utilisateur
PUT    /api/auth/profile           # Mise à jour profil
POST   /api/auth/logout            # Déconnexion sécurisée
DELETE /api/auth/account           # Désactivation compte
GET    /api/auth/check-email       # Vérification email
GET    /api/auth/check-username    # Vérification username
POST   /api/auth/forgot-password   # Mot de passe oublié
POST   /api/auth/reset-password    # Reset mot de passe
POST   /api/auth/verify-email      # Vérification email
GET    /api/auth/sessions          # Sessions actives
DELETE /api/auth/sessions/:id      # Révoquer session
POST   /api/auth/change-password   # Changement mot de passe
```

#### Netlify Functions (Serverless)
```
POST   /api/auth/login             # Login rapide
POST   /api/auth/register          # Register rapide
GET    /api/user/profile           # Profil GET
```

### 🎮 **Jeux** (12 endpoints)

#### Backend Express (Railway)
```
POST   /api/games                  # Créer partie
GET    /api/games/:id              # État partie complet
POST   /api/games/:id/roll         # Lancer dés
POST   /api/games/:id/move         # Jouer mouvement
GET    /api/games/:id/suggestions  # Suggestions IA
GET    /api/games/:id/evaluate     # Évaluer position
POST   /api/games/:id/join         # Rejoindre partie
POST   /api/games/:id/leave        # Quitter partie
POST   /api/games/:id/rollback     # Annuler mouvement
GET    /api/games                  # Liste parties utilisateur
POST   /api/games/:id/resign       # Abandonner partie
POST   /api/games/:id/draw         # Proposer nulle
```

#### Netlify Functions (Serverless)
```
POST   /api/game/create            # Création rapide
GET    /api/game/status            # État simplifié
```

### 🧠 **Analyse GNUBG** (8 endpoints)

#### Backend Express (Railway)
```
POST   /api/gnubg/analyze          # Analyse complète
POST   /api/gnubg/hint             # Suggestion coup
POST   /api/gnubg/evaluate         # Évaluation equity
POST   /api/gnubg/session          # Session analyse
GET    /api/gnubg/quotas           # Quotas utilisateur
POST   /api/gnubg/batch            # Analyse multiple
GET    /api/gnubg/history          # Historique analyses
POST   /api/gnubg/export           # Exporter analyses
```

#### Netlify Functions (Serverless)
```
POST   /api/gnubg/analyze          # Analyse rapide
```

### 🌐 **WebSocket** (Backend Express)
```
WS     /ws/game/:id                # Temps réel partie
WS     /ws/chat/:id                # Chat partie
WS     /ws/tournament/:id          # Tournoi live
WS     /ws/notifications           # Notifications user
```

---

## 🎯 Fonctionnalités Complètes

### 🎮 **Jeu Backgammon**
- **Plateau interactif** : 24 points + drag & drop
- **Règles complètes** : Bearing off, hits, bar, doubling cube
- **Multijoueur** : Human vs Human + IA (3 niveaux)
- **Animations** : Mouvements fluides + dés 3D
- **WebSocket temps réel** : Synchronisation instantanée

### 🧠 **IA GNUBG Avancée**
- **Analyse positions** : Equity + PR + win probability
- **Suggestions optimales** : Top 5 meilleurs coups
- **Explications pédagogiques** : Pourquoi ce coup ?
- **Quotas intelligents** : 5 gratuites/jour, 1000 premium
- **Historique complet** : Toutes les analyses sauvegardées

### 👥 **Gestion Utilisateurs**
- **Authentification JWT** : Refresh token rotation
- **Profils complets** : Username + ELO + avatar + stats
- **Système ELO** : Calcul automatique après chaque partie
- **Abonnements** : Free/Premium/VIP avec Stripe
- **Sessions multiples** : Gestion appareils

### 🏆 **Compétitions**
- **Tournois** : Entry fees $1-10, prize pools
- **Classements** : Global + par pays + ELO
- **Saisons** : Compétitions mensuelles
- **Récompenses** : Badges + trophées + premium

### 💰 **Monétisation**
- **Abonnements Stripe** : Free/Premium/VIP
- **Tournois payants** : 10% commission
- **Boutique virtuelle** : Skins plateau $2-5
- **Analytics tracking** : Conversion ELO

---

## 🛠️ Stack Technique Complète

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Frontend** | Vue 3 + TypeScript | Application SPA |
| **Backend Principal** | Express.js + TypeScript | API complète + WebSocket |
| **Backend Serverless** | Netlify Functions | Auth + API légère |
| **Database** | Supabase PostgreSQL | Données persistantes |
| **ORM** | Prisma | Type-safe database |
| **Authentification** | JWT + bcryptjs | Sécurité tokens |
| **WebSocket** | ws + Socket.io | Temps réel |
| **IA Engine** | GNUBG API | Analyse backgammon |
| **Containerisation** | Docker | Déploiement Railway |
| **CDN** | Netlify Edge | Mondial |
| **Monitoring** | Sentry + Winston | Erreurs + logs |
| **Paiements** | Stripe | Abonnements |

---

## 🚀 Déploiement Production

### 1. **Netlify** (Frontend + Functions)
```bash
# Connecter GitHub à Netlify
# Build automatique sur chaque push
# URL : https://gammon-guru.netlify.app
```

Configuration `netlify.toml` :
```toml
[build]
  publish = "public"
  functions = "functions"
  command = "cd frontend && npm run build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 2. **Railway** (Backend Express)
```bash
# Connecter repo GitHub
# Docker build automatique
# URL : https://gammon-guru-api.railway.app
```

Configuration `railway.toml` :
```toml
[build]
  builder = "NIXPACKS"

[deploy]
  healthcheckPath = "/health"
  restartPolicyType = "ON_FAILURE"
```

### 3. **Supabase** (Database)
```bash
# Interface web SQL
# Importer database/schema.sql
# Configurer Row Level Security
```

---

## 🧪 Tests Complet

### Tests Fonctionnels
```bash
# Tests authentification complète
node test-auth-flow.js

# Tests avec utilisateur connu
node test-known-user.js

# Tests nettoyage final
node test-final-clean.js

# Tests API backend
cd backend && npm test
```

### Tests de Charge
```bash
# Tests API Netlify Functions
npm run test:load

# Tests WebSocket
npm run test:websocket

# Tests GNUBG performance
npm run test:gnubg
```

---

## 📊 Base de Données Complète

### Schema Principal
```sql
-- Utilisateurs et authentification
users (id, email, password, username, elo, subscription_type, created_at)

-- Parties et mouvements  
games (id, white_player, black_player, board_state, status, game_mode, created_at)
game_moves (id, game_id, player, dice, move, equity, pr, created_at)

-- Analyses GNUBG
analyses (id, user_id, board_state, dice, move, best_move, equity, explanation, created_at)

-- Abonnements Stripe
subscriptions (id, user_id, stripe_subscription_id, plan, status, created_at)

-- Tournois et participants
tournaments (id, name, entry_fee, prize_pool, status, created_at)
tournament_participants (id, tournament_id, user_id, position, created_at)

-- WebSocket et temps réel
websocket_connections (id, connection_id, user_id, game_id, created_at)

-- Chat et messages
chat_messages (id, game_id, user_id, message, message_type, created_at)

-- Analytics et statistiques
user_analytics (id, user_id, date, games_played, analyses_completed, created_at)
```

---

## 🔒 Sécurité Complète

### **Authentification**
- **JWT Tokens** : Access 15min + Refresh 7 jours
- **Rotation automatique** : Refresh tokens sécurisés
- **Password hashing** : bcryptjs avec salt
- **Sessions multiples** : Gestion appareils

### **API Security**
- **Rate limiting** : 5/login/min, 10/analyze/min
- **CORS dynamique** : Origines configurées
- **Input validation** : Zod + Joi
- **SQL injection** : Prisma ORM protection
- **XSS protection** : Helmet + CSP

### **Database Security**
- **Row Level Security** : Supabase RLS
- **Encrypted connections** : SSL/TLS
- **Backup automatique** : Quotidien
- **Access control** : Rôles définis

---

## 📈 Performance & Monitoring

### **Métriques**
- **API Response** : < 300ms average
- **Database queries** : < 100ms average  
- **WebSocket latency** : < 50ms
- **Frontend load** : < 3s
- **Uptime** : 99.9%+

### **Monitoring**
- **Sentry** : Erreurs temps réel
- **Winston** : Logs structurés
- **Google Analytics** : User tracking
- **Custom dashboard** : Metrics internes

---

## 💰 Coûts Prévisibles

### **Monthly Estimate**
- **Netlify** : $0-19/mois (trafic functions)
- **Railway** : $5-20/mois (backend Express)
- **Supabase** : $0-25/mois (database)
- **Stripe** : 2.9% + $0.30/transaction
- **GNUBG API** : $10-50/mois (analyses)
- **Total** : **$15-114/mois maximum**

### **Scaling**
- **Auto-scaling** : Fonctions + backend
- **Pay-per-use** : Coût proportionnel
- **Zero downtime** : Maintenance transparente

---

## 🌍 URLs Production

| Service | URL | Rôle |
|---------|-----|------|
| **Application** | https://gammon-guru.netlify.app | Frontend Vue.js |
| **API Serverless** | https://gammon-guru.netlify.app/api | Netlify Functions |
| **API Express** | https://gammon-guru-api.railway.app | Backend complet |
| **WebSocket** | wss://gammon-guru-api.railway.app/ws | Temps réel |
| **GNUBG Service** | https://gammon-guru-gnu.railway.app | Analyse IA |

---

## 🤝 Contribution

### **Workflow**
1. Fork du repository
2. Créer branche `feature/description`
3. Développer avec tests
4. Linter et formatter
5. Pull Request avec template
6. Review automatique + manuel

### **Guidelines**
- **TypeScript strict** : Types obligatoires
- **Tests requis** : 90%+ coverage
- **Conventional commits** : `feat(scope): description`
- **Documentation** : JSDoc + README updates

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour détails complets.

---

## 📞 Support & Communauté

- **Discord** : https://discord.gg/gammon-guru
- **GitHub Issues** : https://github.com/8888vtc-ui/gnubg-backend/issues
- **Documentation** : https://docs.gammon-guru.com
- **Email** : dev@gammon-guru.com

---

## 📄 License

Ce projet est sous licence **MIT**. Voir [LICENSE](LICENSE) pour détails.

---

<div align="center">

## 🎲 **GammonGuru - Le Backgammon Moderne dans le Cloud**

**Architecture Hybride • IA GNUBG • Multijoueur Temps Réel**

[▶️ Jouer maintenant](https://gammon-guru.netlify.app) • [📚 Documentation](https://docs.gammon-guru.com) • [🚀 Déployer](#déploiement-production)

Built with ❤️ by the GammonGuru Team

</div>
