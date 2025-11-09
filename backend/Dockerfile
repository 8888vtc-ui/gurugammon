# Dockerfile pour GammonGuru Backend

# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de package
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances (inclut dev pour le build TypeScript)
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Builder l'application
RUN npm run build

# Étape 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copier les fichiers de package
COPY package*.json ./

# Installer uniquement les dépendances de production pour l'exécution
RUN npm ci --omit=dev && npm cache clean --force

# Copier le code compilé depuis l'étape de build
COPY --from=builder /app/dist ./dist

# Changer le propriétaire des fichiers
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exposer le port
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["node", "dist/server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
