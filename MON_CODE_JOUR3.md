# 📝 MON CODE - JOUR 3 MODULES

> **Mon espace de travail pour écrire et tester mon code**

---

## ✏️ **ÉTAPE 1 - LOGGER.TS**

**Structure à copier-coller et modifier :**

```typescript
// src/utils/logger.ts
export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  info(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [${this.context}] INFO: ${message}`, data || '');
  }
  
  error(message: string, error?: Error) {
    console.error(`[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`, error || '');
  }
  
  warn(message: string, data?: any) {
    console.warn(`[${new Date().toISOString()}] [${this.context}] WARN: ${message}`, data || '');
  }
}

export const logger = new Logger('GammonGuru');
```

**Instructions :**
1. Copie ce code
2. Crée le fichier `src/utils/logger.ts` dans Windsurf
3. Colle le code
4. Dis-moi quand c'est fait !

---

## ✏️ **ÉTAPE 2 - VALIDATOR.TS**

**Structure à copier-coller et modifier :**

```typescript
// src/utils/validator.ts
export class Validator {
  // Valider un email
  static isValidEmail(email: string): boolean {
    // TODO : utilise regex pour valider email
    return emailRegex.test(email);
  }
  
  // Valider un nom de joueur
  static isValidPlayerName(name: string): boolean {
    // TODO : vérifie que le nom a entre 3 et 20 caractères
    return name.length >= 3 && name.length <= 20;
  }
  
  // Valider une mise
  static isValidStake(stake: number, playerPoints: number): boolean {
    // TODO : vérifie que la mise est valide
    return stake >= 200 && stake <= playerPoints;
  }
}
```

**Instructions :**
1. Copie ce code
2. Crée le fichier `src/utils/validator.ts` dans Windsurf
3. Complète les TODO
4. Dis-moi quand c'est fait !

---

## ✏️ **ÉTAPE 3 - HELPER.TS**

**Structure à copier-coller et modifier :**

```typescript
// src/utils/helper.ts
export class Helper {
  // Générer un ID unique
  static generateId(): string {
    // TODO : utilise crypto.randomUUID()
    return crypto.randomUUID();
  }
  
  // Formater une date
  static formatDate(date: Date): string {
    // TODO : formate la date en YYYY-MM-DD
    return date.toISOString().split('T')[0];
  }
  
  // Calculer le temps écoulé
  static timeAgo(date: Date): string {
    // TODO : calcule le temps depuis la date
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
  
  // Arrondir un nombre
  static round(num: number, decimals: number = 2): number {
    // TODO : arrondit le nombre avec décimales
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
```

**Instructions :**
1. Copie ce code
2. Crée le fichier `src/utils/helper.ts` dans Windsurf
3. Les TODO sont déjà complétés !
4. Dis-moi quand c'est fait !

---

## 🎯 **MON PROGRÈS**

- [x] Logger.ts créé et testé ✅
- [x] Validator.ts créé ✅  
- [ ] Helper.ts créé
- [ ] Tests unitaires passent

**Points en jeu :** 30 points + Badge "🔧 Module Master"

---

*Mode "Zéro Erreur" - Je suis là si tu as besoin d'aide !*
