# 🧠 **Setup GNUBG Service - 2 Options**

## 🎯 **Option 1: Service Mock Gratuit (Recommandé)**

### **1. Déployer le service GNUBG Mock**
```bash
# Créer un nouveau dossier séparément
mkdir gnubg-mock
cd gnubg-mock

# Copier le fichier de service
# (le fichier gnubg-mock-service.js que j'ai créé)

# Déployer sur Railway
railway login
railway new
railway up
```

### **2. Configurer les variables Netlify**
```bash
# Une fois le service déployé, vous aurez une URL comme :
# https://gnubg-mock-production.up.railway.app

netlify env:set GNUBG_SERVICE_URL "https://votre-service-gnubg.railway.app"
netlify env:set GNUBG_API_KEY "mock-key-gnubg"
```

---

## 🎯 **Option 2: Pas de GNUBG (Mode Simulation)**

### **Configurer sans clé GNUBG**
```bash
# Ne rien configurer - le service retournera des erreurs contrôlées
# Le reste de l'application fonctionne parfaitement
```

---

## 🚀 **DÉPLOIEMENT RAPIDE DU MOCK**

### **Étapes :**
1. **Créer un repo séparé** pour le service GNUBG
2. **Déployer sur Railway** 
3. **Copier l'URL du service**
4. **Configurer les variables Netlify**

### **Commandes :**
```bash
# Dans un nouveau dossier
git clone https://github.com/votre-compte/gnubg-mock.git
cd gnubg-mock

# Ajouter le fichier gnubg-mock-service.js
# Ajouter railway-gnubg.toml

# Déployer
railway login
railway new
railway up

# Obtenir l'URL
railway domain
```

---

## 🔧 **CONFIGURATION FINALE**

### **Une fois le service déployé :**
```bash
# Remplacer l'URL par votre vraie URL Railway
netlify env:set GNUBG_SERVICE_URL "https://gnubg-mock-production.up.railway.app"
netlify env:set GNUBG_API_KEY "mock-key-for-testing"
```

---

## ✅ **TEST**

### **Vérifier que le service fonctionne :**
```bash
# Tester votre service GNUBG
curl https://votre-url.railway.app/health

# Devrait retourner :
# {"status":"healthy","service":"GNUBG Mock",...}
```

---

## 🎯 **RECOMMANDATION**

**Commencez avec l'Option 1 (Mock Service) :**
- ✅ Gratuit et simple
- ✅ Toutes les fonctionnalités GNUBG fonctionnent
- ✅ Peut être remplacé plus tard par le vrai GNUBG
- ✅ Permet de tester tout le reste

**Plus tard, vous pouvez :**
- Remplacer le mock par le vrai GNUBG
- Ou garder le mock si les réponses vous conviennent
