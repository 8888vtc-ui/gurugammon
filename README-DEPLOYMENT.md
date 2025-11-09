# 🚀 DÉPLOIEMENT PRIORITAIRE - DEMAIN MATIN

## ✅ FRONTEND NETLIFY (PRÊT)

### Déploiement automatique
1. **GitHub → Netlify**: déjà configuré
2. **URL**: https://gnubg-backend.netlify.app
3. **Build**: `npm run build:netlify`
4. **Game**: `/game` - Jeu complet disponible

### Vérification
```bash
# Test build local
npm run build:netlify

# Vérifier fichiers
ls frontend/dist/
# → index.html, assets/, test-deployment.html
```

## ✅ BACKEND RAILWAY (PRÊT)

### Déploiement manuel (5 minutes)
1. **Connecter Railway** à GitHub
2. **Nouveau service** depuis `backend/`
3. **Variables d'environnement**:
   ```
   NODE_ENV=production
   PORT=3000
   ```
4. **Déployer** - Auto-détecte Dockerfile

### URLs production
- **API**: https://gammon-guru-backend.railway.app
- **Health**: https://gammon-guru-backend.railway.app/health
- **Game API**: https://gammon-guru-backend.railway.app/api/game/*

## ✅ BASE DE DONNÉES SUPABASE (5 minutes)

### Setup rapide
1. **Créer projet Supabase**
2. **Exécuter `supabase/setup.sql`** dans SQL Editor
3. **Copier clés** dans frontend.env.production
4. **Tester connexion**

### Tables créées
- `users` - Joueurs et auth
- `games` - Parties en cours
- Index et RLS configurés

## 🎯 TESTS INTÉGRATION PRIORITAIRES

### 1. Health check API
```bash
curl https://gammon-guru-backend.railway.app/health
# → {"status":"ok","service":"GammonGuru Backend"}
```

### 2. Créer une partie
```bash
curl -X POST https://gammon-guru-backend.railway.app/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"mode":"AI_VS_PLAYER","difficulty":"MEDIUM"}'
```

### 3. Frontend connecté
Visiter: https://gnubg-backend.netlify.app/game
- ✅ Plateau backgammon affiché
- ✅ Bouton "Lancer les dés" fonctionnel
- ✅ Videau (doubling cube) cliquable

## 📋 CHECKLIST PRODUCTION DEMAIN

### Frontend ✅
- [x] Build Vue.js optimisé
- [x] Configuration API Railway
- [x] Variables environnement
- [x] Netlify auto-déploiement

### Backend ✅
- [x] Server Express simple
- [x] Tous endpoints API
- [x] Configuration Railway
- [x] Health checks

### Database ✅
- [x] Schema SQL prêt
- [x] Setup Supabase script
- [x] RLS et sécurité
- [x] Données démo

### Integration ✅
- [x] API client config
- [x] Service game-api.js
- [x] Error handling
- [x] Fallback URLs

## 🚀 DÉMARRAGE RAPIDE

1. **Backend Railway**: 5 minutes
2. **Database Supabase**: 5 minutes  
3. **Frontend Netlify**: Automatique
4. **Tests**: 10 minutes

**TOTAL: 20 minutes pour production complète !**

## 🎮 UTILISATION DEMAIN MATIN

1. **Visiter**: https://gnubg-backend.netlify.app
2. **S'inscrire**: Compte démo disponible
3. **Jouer**: /game - Partie vs IA
4. **Analyser**: GNUBG intégré

**Le jeu de backgammon cloud est 100% prêt !** 🎲☁️🏆
