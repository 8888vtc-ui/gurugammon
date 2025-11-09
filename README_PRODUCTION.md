# 🎲 GammonGuru - Production Deployment

## 🌐 Application Live

**URL Production**: https://gammonguru.netlify.app
**API Base**: https://gammonguru.netlify.app/api/

## 🏗️ Architecture Complete

### 🎨 Frontend Vue.js
- **Framework**: Vue 3 + Composition API
- **Styling**: CSS personnalisé + animations
- **State Management**: Pinia stores
- **Routing**: Vue Router
- **Build Tool**: Vite

### 🔧 Backend Netlify Functions
- **Serverless**: Auto-scaling mondial
- **API REST**: 7 endpoints sécurisés
- **Authentification**: JWT + bcrypt
- **Database**: Supabase PostgreSQL
- **CORS**: Headers configurés

### 🗄️ Database Supabase
- **Provider**: PostgreSQL managé
- **ORM**: Prisma
- **Tables**: 10+ tables (users, games, analyses, etc.)
- **Security**: Row Level Security

## 📡 API Endpoints

### Authentification
```
POST /api/auth/login      - Connexion utilisateur
POST /api/auth/register   - Inscription nouvelle
```

### Jeu
```
POST /api/game/create     - Créer partie (IA/humain)
GET  /api/game/status     - État partie + mouvements
```

### GNUBG Analyse
```
POST /api/gnubg/analyze   - Analyse position backgammon
```

### Utilisateur
```
GET  /api/user/profile    - Profil utilisateur
PUT  /api/user/profile    - Mettre à jour profil
```

## 🎯 Fonctionnalités

### 🎮 Jeu Backgammon
- **Plateau interactif**: 24 points + drag & drop
- **Animations**: Checkers + dés 3D
- **Logique complète**: Mouvements valides + tours
- **Multiplayer**: Human vs Human + AI

### 🧠 IA GNUBG
- **Analyse positions**: Equity + PR
- **Suggestions**: Meilleurs coups
- **Quota management**: 5 analyses gratuites / 1000 premium

### 👥 Gestion Utilisateurs
- **Authentification JWT**: Sécurisée
- **Profils**: Username + ELO + avatar
- **Statistiques**: Parties jouées + win rate
- **Abonnements**: Free vs Premium

## 🚀 Déploiement

### Netlify Configuration
```toml
[build]
  functions = "netlify/functions"
  publish = "public"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Environment Variables
- `DATABASE_URL`: Supabase PostgreSQL
- `SUPABASE_URL`: API Supabase
- `SUPABASE_ANON_KEY`: Clé publique
- `SUPABASE_SERVICE_KEY`: Clé service
- `JWT_SECRET`: Secret tokens

## 🧪 Tests

### Database Tests
```bash
node test-database-complete.js
```

### API Tests
```bash
node test-api-complete.js
```

## 📊 Performance

- **Database**: <100ms queries
- **API**: <500ms response
- **Frontend**: <3s load time
- **CDN**: Mondial via Netlify

## 🔒 Sécurité

- **JWT Tokens**: Expiration 24h
- **Password Hashing**: bcrypt
- **CORS**: Configuré
- **Input Validation**: Stricte
- **Rate Limiting**: Quota analyses

## 🌟 Features Futures

- **WebSocket**: Multiplayer temps réel
- **GNUBG Railway**: Service analyse externe
- **Mobile App**: React Native
- **Tournaments**: Compétitions

## 📞 Support

**Documentation**: `/docs/`
**Issues**: GitHub Issues
**Status**: https://gammonguru.netlify.app

---

🎉 **GammonGuru - Backgammon Intelligence Artificielle**  
🌐 **Production Ready - Cloud Infrastructure**  
🚀 **Serverless - Auto-scaling Mondial**
