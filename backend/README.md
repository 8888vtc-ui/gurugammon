# GammonGuru Backend

Backend API robuste et sécurisé pour le jeu de backgammon avec intégration IA GNUBG.

## 🎯 Features

- **🎮 Jeu de Backgammon complet** : Logique de jeu, dés, mouvements, victoire
- **🤖 IA GNUBG intégrée** : Analyse de positions, suggestions de mouvements
- **🔐 Authentification sécurisée** : JWT, hashage de mots de passe, ELO
- **📊 Système de classement ELO** : Calcul automatique après chaque partie
- **🛡️ Sécurité avancée** : Rate limiting, CORS, helmet, validation Zod
- **📝 Logging structuré** : Winston avec rotation des logs
- **🚀 Performance** : Compression, cache, TypeScript optimisé
- **🐳 Docker ready** : Conteneurisation production-ready

## 📋 Prérequis

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL (Supabase recommandé)
- GNUBG API Key

## 🚀 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/gammon-guru/backend.git
cd backend
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

### 4. Builder l'application
```bash
npm run build
```

### 5. Démarrer le serveur
```bash
# Développement
npm run dev

# Production
npm start
```

## 🐳 Docker

### Build et run
```bash
# Build l'image
npm run docker:build

# Run le conteneur
npm run docker:run

# Ou manuellement
docker build -t gammon-guru-backend .
docker run -p 3000:3000 --env-file .env gammon-guru-backend
```

## 📚 Documentation API

### Base URL
- Développement : `http://localhost:3000`
- Production : `https://api.gammon-guru.com`

### Endpoints

#### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/register` | Inscription | ❌ |
| POST | `/login` | Connexion | ❌ |
| POST | `/refresh` | Rafraîchir tokens | ❌ |
| GET | `/profile` | Obtenir profil | ✅ |
| PUT | `/profile` | Mettre à jour profil | ✅ |
| POST | `/logout` | Déconnexion | ✅ |
| DELETE | `/account` | Désactiver compte | ✅ |
| GET | `/check-email` | Vérifier email | ❌ |
| GET | `/check-username` | Vérifier username | ❌ |

#### Jeux (`/api/games`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/` | Créer une partie | ✅ |
| GET | `/:gameId` | Obtenir état partie | ✅ |
| POST | `/:gameId/roll` | Lancer les dés | ✅ |
| POST | `/:gameId/move` | Effectuer mouvement | ✅ |
| GET | `/:gameId/suggestions` | Suggestions IA | ✅ |
| GET | `/:gameId/evaluate` | Évaluer position | ✅ |
| GET | `/` | Liste parties utilisateur | ✅ |

#### Santé (`/health`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Vérifier santé serveur |

## 🔧 Configuration

### Variables d'environnement

```bash
# Environnement
NODE_ENV=development
PORT=3000

# Base de données
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# GNUBG IA
GNUBG_SERVICE_URL=https://api.gnubg.ai/v1
GNUBG_API_KEY=your-api-key

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🧪 Tests

### Lancer les tests
```bash
# Tous les tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Structure des tests
```
src/
├── __tests__/
│   ├── auth/
│   ├── games/
│   └── utils/
├── controllers/
├── services/
└── utils/
```

## 📝 Logging

### Niveaux de log
- `error` : Erreurs critiques
- `warn` : Avertissements
- `info` : Informations générales
- `debug` : Debug (développement uniquement)

### Fichiers de log
```
logs/
├── error-2023-12-09.log
├── combined-2023-12-09.log
└── debug-2023-12-09.log
```

## 🛡️ Sécurité

### Features de sécurité
- **Helmet** : Headers HTTP sécurisés
- **CORS** : Cross-Origin Resource Sharing
- **Rate Limiting** : Limitation des requêtes
- **Validation Zod** : Validation stricte des entrées
- **JWT** : Tokens JWT sécurisés
- **Bcrypt** : Hashage de mots de passe
- **Input Sanitization** : Nettoyage des entrées

### Rate Limits
- Auth : 10 requêtes/15min
- Games : 30 requêtes/minute
- Suggestions IA : 20 requêtes/minute

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Métriques disponibles
- Uptime du serveur
- Nombre de requêtes
- Temps de réponse
- Taux d'erreurs

## 🚀 Déploiement

### Production
```bash
# Build
npm run build

# Start
npm start
```

### Docker Production
```bash
docker build -t gammon-guru-backend:latest .
docker run -d \
  --name gammon-guru-backend \
  -p 3000:3000 \
  --env-file .env.production \
  gammon-guru-backend:latest
```

## 🤝 Contribuer

1. Fork le repository
2. Créer une feature branch (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branch (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous license MIT - voir le fichier [LICENSE](LICENSE) pour détails.

## 🆘 Support

Pour toute question ou problème :
- Issues GitHub : https://github.com/gammon-guru/backend/issues
- Email : support@gammon-guru.com
- Documentation : https://docs.gammon-guru.com

## 🎮 GammonGuru

**Le backgammon moderne avec IA intégrée**

Built with ❤️ by the GammonGuru Team
