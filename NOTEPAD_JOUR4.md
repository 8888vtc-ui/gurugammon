# 📝 MON CODE - JOUR 4 SERVEUR EXPRESS

> **Mon espace de travail pour créer mon premier serveur API**

---

## ✏️ **ÉTAPE 1 - SERVER.TS**

**Structure à copier-coller et modifier :**

```typescript
// src/server.ts
import express, { Request, Response } from 'express';
import { config } from './config';
import { logger } from './utils/logger';

const app = express();

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route de santé
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route racine
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'GammonGuru API',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/players',
      'POST /api/players'
    ]
  });
});

// Démarrage du serveur
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
```

**Instructions :**
1. Copie ce code
2. Crée le fichier `src/server.ts` dans Windsurf
3. Colle le code
4. Dis-moi quand c'est fait !

---

## ✏️ **ÉTAPE 2 - LANCER LE SERVEUR**

**Commandes à exécuter :**

```bash
# Pour lancer le serveur
npm run dev

# Dans un autre terminal, pour tester
curl http://localhost:3000/
curl http://localhost:3000/health
```

---

## 🎯 **MON PROGRÈS**

- [ ] Configuration créée ✅
- [ ] Server.ts créé et testé
- [ ] Serveur démarre sans erreur
- [ ] Routes répondent correctement

**Points en jeu :** 30 points + Badge "🚀 API Starter"

---

*Mode "Zéro Erreur" - Je suis là si tu as besoin d'aide !*
